/**
 * Rate Limiting Utility for PumpFun API Client
 *
 * Provides comprehensive rate limiting functionality to respect API limits,
 * prevent excessive requests, and handle rate limit responses gracefully.
 * Enhanced version with adaptive backoff and burst protection.
 */

import {
  RateLimitConfig,
  RateLimitInfo,
  RateLimiterState,
  DEFAULT_RATE_LIMIT_CONFIG,
  LIVE_STREAMING_RATE_LIMIT_CONFIG,
  NUMERIC_CONSTANTS,
} from '../../types';
import {
  ONE_SECOND_MS,
  BURST_WINDOW_MS,
  ADAPTIVE_ADJUSTMENT_INTERVAL_MS,
  RATE_LIMIT_WARNING_THRESHOLD,
  RATE_LIMIT_CRITICAL_THRESHOLD,
  DEFAULT_LIVE_STREAMING_RATE_LIMIT,
  MAX_LIVE_STREAMING_BURST,
  CONSERVATIVE_RATE_LIMIT,
  PAGINATION_RATE_LIMIT,
  RATE_LIMIT_RECOVERY_TIME_MS,
  REQUEST_SAFETY_BUFFER_MS,
  ERROR_RATE_WARNING_THRESHOLD,
  ERROR_RATE_CRITICAL_THRESHOLD,
} from '../../constants/api.constants';

// Re-export types for backward compatibility
export type { RateLimitConfig, RateLimitInfo };

/**
 * Rate Limiter class for managing API request rates
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private state: RateLimiterState;
  private rateLimitInfo?: RateLimitInfo;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
    this.state = {
      requests: 0,
      windowStart: Date.now(),
      lastRequestTime: 0,
      burstCount: 0,
      burstStartTime: 0,
      consecutiveErrors: 0,
      totalRequests: 0,
      totalErrors: 0,
    };

    // Load configuration from environment variables
    this.loadFromEnvironment();
  }

  /**
   * Load rate limit configuration from environment variables
   */
  private loadFromEnvironment(): void {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.MAX_REQUESTS_PER_MINUTE) {
        this.config.maxRequestsPerWindow = parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10);
      }

      if (process.env.RATE_LIMIT_DELAY_MS) {
        this.config.baseBackoffMs = parseInt(process.env.RATE_LIMIT_DELAY_MS, 10);
      }

      if (process.env.RATE_LIMIT_WINDOW_MS) {
        this.config.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10);
      }

      if (process.env.ENABLE_RATE_LIMIT_BACKOFF) {
        this.config.enableBackoff = process.env.ENABLE_RATE_LIMIT_BACKOFF === 'true';
      }
    }
  }

  /**
   * Check if a request can be made immediately
   */
  canMakeRequest(): boolean {
    // Check if we're in backoff period
    if (this.state.backoffUntil && Date.now() < this.state.backoffUntil) {
      return false;
    }

    // Check rate limits
    if (this.isRateLimited()) {
      return false;
    }

    // Check burst protection
    if (this.isBurstLimited()) {
      return false;
    }

    return true;
  }

  /**
   * Wait until a request can be made
   */
  async waitForRequest(): Promise<void> {
    while (!this.canMakeRequest()) {
      const delay = this.calculateDelay();
      if (delay > 0) {
        await this.sleep(delay);
      }
    }
  }

  /**
   * Record a successful request
   */
  recordRequest(): void {
    const now = Date.now();

    // Reset window if needed
    if (now - this.state.windowStart >= this.config.windowMs) {
      this.resetWindow();
    }

    // Update request count
    this.state.requests++;
    this.state.lastRequestTime = now;
    this.state.totalRequests++;

    // Update burst tracking
    this.updateBurstTracking(now);

    // Reset error tracking on success
    this.state.consecutiveErrors = 0;
    this.state.backoffUntil = undefined;

    // Adaptive rate limit adjustment
    this.adjustAdaptiveRateLimit(now);
  }

  /**
   * Record a rate limit error from the API
   */
  recordRateLimitError(response?: {
    retryAfter?: number;
    limit?: number;
    remaining?: number;
    resetTime?: number;
  }): void {
    const now = Date.now();

    // Update rate limit info from response
    if (response) {
      this.rateLimitInfo = {
        limit: response.limit ?? this.rateLimitInfo?.limit,
        remaining: response.remaining ?? 0,
        resetTime: response.resetTime ?? now + this.config.windowMs,
        retryAfter: response.retryAfter ?? Math.ceil(this.config.windowMs / ONE_SECOND_MS),
      };
    }

    // Update consecutive error count
    this.state.consecutiveErrors++;
    this.state.totalErrors++;

    // Apply backoff if enabled
    if (this.config.enableBackoff) {
      this.applyBackoff();
    }

    // Adjust adaptive rate limit based on errors
    this.adjustAdaptiveRateLimitForErrors(now);
  }

  /**
   * Check if we're currently rate limited
   */
  isRateLimited(): boolean {
    const now = Date.now();
    const effectiveLimit = this.state.adaptiveRateLimit ?? this.config.maxRequestsPerWindow;

    // Check window-based rate limiting
    if (this.config.enableSlidingWindow) {
      return this.state.requests >= effectiveLimit;
    }
    // Simple window reset
    if (now - this.state.windowStart >= this.config.windowMs) {
      this.resetWindow();
    }
    return this.state.requests >= effectiveLimit;
  }

  /**
   * Check if burst protection is active
   */
  isBurstLimited(): boolean {
    if (!this.config.enableBurstProtection) {
      return false;
    }

    const now = Date.now();
    // Use BURST_WINDOW_MS constant

    // Reset burst window if needed
    if (now - this.state.burstStartTime >= BURST_WINDOW_MS) {
      this.state.burstCount = 0;
      this.state.burstStartTime = now;
    }

    return this.state.burstCount >= this.config.maxBurst!;
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.rateLimitInfo;
  }

  /**
   * Get current rate limiting statistics
   */
  getStats(): {
    requests: number;
    maxRequests: number;
    windowStart: number;
    windowEnd: number;
    burstCount: number;
    maxBurst: number;
    consecutiveErrors: number;
    isBackoffActive: boolean;
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    adaptiveRateLimit?: number;
  } {
    const errorRate =
      this.state.totalRequests > 0 ? (this.state.totalErrors / this.state.totalRequests) * 100 : 0;

    return {
      requests: this.state.requests,
      maxRequests: this.state.adaptiveRateLimit ?? this.config.maxRequestsPerWindow,
      windowStart: this.state.windowStart,
      windowEnd: this.state.windowStart + this.config.windowMs,
      burstCount: this.state.burstCount,
      maxBurst: this.config.maxBurst ?? 0,
      consecutiveErrors: this.state.consecutiveErrors,
      isBackoffActive: !!(this.state.backoffUntil && Date.now() < this.state.backoffUntil),
      totalRequests: this.state.totalRequests,
      totalErrors: this.state.totalErrors,
      errorRate,
      adaptiveRateLimit: this.state.adaptiveRateLimit,
    };
  }

  /**
   * Reset the rate limiting window
   */
  private resetWindow(): void {
    this.state.requests = 0;
    this.state.windowStart = Date.now();
  }

  /**
   * Update burst tracking
   */
  private updateBurstTracking(now: number): void {
    if (!this.config.enableBurstProtection) {
      return;
    }

    // Use BURST_WINDOW_MS constant

    // Reset burst window if needed
    if (now - this.state.burstStartTime >= BURST_WINDOW_MS) {
      this.state.burstCount = 0;
      this.state.burstStartTime = now;
    }

    this.state.burstCount++;
  }

  /**
   * Apply exponential backoff
   */
  private applyBackoff(): void {
    const now = Date.now();

    // Calculate backoff duration
    let backoffMs = this.config.baseBackoffMs;

    for (let i = 0; i < this.state.consecutiveErrors - 1; i++) {
      backoffMs *= this.config.backoffMultiplier;
      if (backoffMs > this.config.maxBackoffMs) {
        backoffMs = this.config.maxBackoffMs;
        break;
      }
    }

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * backoffMs * 0.1; // 10% jitter
    backoffMs += jitter;

    this.state.backoffUntil = now + backoffMs;
  }

  /**
   * Calculate delay until next request can be made
   */
  private calculateDelay(): number {
    const now = Date.now();

    // Check backoff period
    if (this.state.backoffUntil && now < this.state.backoffUntil) {
      return this.state.backoffUntil - now;
    }

    // Check rate limit reset time
    if (this.rateLimitInfo?.resetTime && now < this.rateLimitInfo.resetTime) {
      return this.rateLimitInfo.resetTime - now;
    }

    // Check window reset time
    if (this.isRateLimited()) {
      const windowEnd = this.state.windowStart + this.config.windowMs;
      if (now < windowEnd) {
        return windowEnd - now;
      }
    }

    // Check burst reset time
    if (this.isBurstLimited()) {
      const burstEnd = this.state.burstStartTime + BURST_WINDOW_MS;
      if (now < burstEnd) {
        return burstEnd - now;
      }
    }

    return 0;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Adjust adaptive rate limit based on success patterns
   */
  private adjustAdaptiveRateLimit(now: number): void {
    if (!this.state.lastAdaptiveAdjustment) {
      this.state.lastAdaptiveAdjustment = now;
      return;
    }

    const timeSinceLastAdjustment = now - this.state.lastAdaptiveAdjustment;

    // Only adjust every 30 seconds
    if (timeSinceLastAdjustment < ADAPTIVE_ADJUSTMENT_INTERVAL_MS) {
      return;
    }

    const stats = this.getStats();

    // If error rate is low and we're near the limit, try to increase
    if (
      stats.errorRate < ERROR_RATE_WARNING_THRESHOLD &&
      stats.requests >= stats.maxRequests * 0.9
    ) {
      this.state.adaptiveRateLimit = Math.min(
        Math.floor(stats.maxRequests * 1.1),
        this.config.maxRequestsPerWindow * 2 // Never exceed 2x original limit
      );
    }
    // If error rate is high, reduce the limit
    else if (stats.errorRate > ERROR_RATE_CRITICAL_THRESHOLD) {
      this.state.adaptiveRateLimit = Math.max(
        Math.floor(stats.maxRequests * 0.8),
        Math.floor(this.config.maxRequestsPerWindow * 0.5) // Never go below 50% of original
      );
    }

    this.state.lastAdaptiveAdjustment = now;
  }

  /**
   * Adjust adaptive rate limit based on errors
   */
  private adjustAdaptiveRateLimitForErrors(now: number): void {
    // Immediate reduction on rate limit errors
    this.state.adaptiveRateLimit = Math.max(
      Math.floor((this.state.adaptiveRateLimit ?? this.config.maxRequestsPerWindow) * 0.7),
      Math.floor(this.config.maxRequestsPerWindow * 0.3) // Minimum 30% of original
    );

    this.state.lastAdaptiveAdjustment = now;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset all rate limiting state
   */
  reset(): void {
    this.state = {
      requests: 0,
      windowStart: Date.now(),
      lastRequestTime: 0,
      burstCount: 0,
      burstStartTime: 0,
      consecutiveErrors: 0,
      totalRequests: 0,
      totalErrors: 0,
    };
    this.state.backoffUntil = undefined;
    this.rateLimitInfo = undefined;
    this.state.adaptiveRateLimit = undefined;
    this.state.lastAdaptiveAdjustment = undefined;
  }

  /**
   * Get estimated time until next request can be made
   */
  getTimeUntilNextRequest(): number {
    return this.calculateDelay();
  }

  /**
   * Check if the limiter is healthy (not in backoff and error rate is acceptable)
   */
  isHealthy(): boolean {
    const stats = this.getStats();
    return !stats.isBackoffActive && stats.errorRate < 50;
  }
}

/**
 * Default rate limiter instance
 */
export const rateLimiter = new RateLimiter();

/**
 * Middleware function for rate limiting HTTP requests
 */
export async function rateLimitMiddleware<T>(
  requestFn: () => Promise<T>,
  customLimiter?: RateLimiter
): Promise<T> {
  const limiter = customLimiter ?? rateLimiter;

  // Wait until we can make a request
  await limiter.waitForRequest();

  try {
    // Make the request
    const result = await requestFn();

    // Record successful request
    limiter.recordRequest();

    return result;
  } catch (error) {
    // Handle rate limit errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as any).statusCode;
      if (statusCode === 429) {
        limiter.recordRateLimitError({
          retryAfter: (error as any).retryAfter,
          limit: (error as any).limit,
          remaining: (error as any).remaining,
          resetTime: (error as any).resetTime
            ? new Date((error as any).resetTime).getTime()
            : undefined,
        });
      }
    }

    throw error;
  }
}

/**
 * Middleware function specifically optimized for live streaming endpoints
 *
 * This middleware uses a live streaming optimized rate limiter to ensure
 * reliable operation while respecting the 60 requests/minute API limit.
 * It includes enhanced error handling and logging for live streaming use cases.
 *
 * @param requestFn The request function to execute with rate limiting
 * @param options Optional configuration including custom limiter and request metadata
 * @returns Promise that resolves to the result of the request function
 */
export async function liveStreamingRateLimitMiddleware<T>(
  requestFn: () => Promise<T>,
  options?: {
    customLimiter?: RateLimiter;
    endpointName?: string;
    metadata?: Record<string, any>;
  }
): Promise<T> {
  const limiter = options?.customLimiter ?? createLiveStreamingRateLimiter();

  // Enhanced waiting with logging for live streaming
  const canMakeRequest = limiter.canMakeRequest();
  if (!canMakeRequest) {
    const stats = limiter.getStats();
    const waitTime = limiter.getTimeUntilNextRequest();

    // Log waiting for debugging (useful for live streaming applications)
    if (waitTime > 0) {
      console.debug(
        `[LiveStreamingRateLimit] Waiting ${waitTime}ms before request to ${options?.endpointName ?? 'live streaming endpoint'}`,
        {
          currentRequests: stats.requests,
          maxRequests: stats.maxRequests,
          windowStart: stats.windowStart,
          windowEnd: stats.windowEnd,
          isBackoffActive: stats.isBackoffActive,
          errorRate: stats.errorRate,
          metadata: options?.metadata,
        }
      );
    }
  }

  // Wait until we can make a request
  await limiter.waitForRequest();

  try {
    // Make the request
    const result = await requestFn();

    // Record successful request with live streaming context
    limiter.recordRequest();

    // Optional success logging for monitoring
    if (options?.endpointName) {
      const stats = limiter.getStats();
      console.debug(
        `[LiveStreamingRateLimit] Request to ${options.endpointName} completed successfully`,
        {
          requestsInWindow: stats.requests,
          maxRequests: stats.maxRequests,
          remainingRequests: stats.maxRequests - stats.requests,
          errorRate: stats.errorRate,
          metadata: options?.metadata,
        }
      );
    }

    return result;
  } catch (error) {
    // Enhanced error handling for live streaming
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as any).statusCode;
      if (statusCode === 429) {
        // Record rate limit error with live streaming context
        limiter.recordRateLimitError({
          retryAfter: (error as any).retryAfter,
          limit: (error as any).limit,
          remaining: (error as any).remaining,
          resetTime: (error as any).resetTime
            ? new Date((error as any).resetTime).getTime()
            : undefined,
        });

        // Enhanced logging for rate limit issues
        console.warn(
          `[LiveStreamingRateLimit] Rate limit exceeded for ${options?.endpointName ?? 'live streaming endpoint'}`,
          {
            statusCode,
            retryAfter: (error as any).retryAfter,
            limit: (error as any).limit,
            remaining: (error as any).remaining,
            endpointName: options?.endpointName,
            metadata: options?.metadata,
            rateLimitInfo: limiter.getRateLimitInfo(),
            stats: limiter.getStats(),
          }
        );
      }
    }

    throw error;
  }
}

/**
 * Create a rate limiter with custom configuration
 */
export function createRateLimiter(config: Partial<RateLimitConfig>): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Create a rate limiter optimized for live streaming endpoints
 *
 * This factory function creates a rate limiter specifically tuned for
 * live streaming data endpoints with conservative limits to ensure
 * reliable operation while respecting the 60 requests/minute API limit.
 *
 * @param config Optional custom configuration to override live streaming defaults
 * @returns RateLimiter instance optimized for live streaming
 */
export function createLiveStreamingRateLimiter(config: Partial<RateLimitConfig> = {}): RateLimiter {
  const liveStreamingConfig = { ...LIVE_STREAMING_RATE_LIMIT_CONFIG, ...config };
  return new RateLimiter(liveStreamingConfig);
}

/**
 * Rate limiting utilities
 */
export const RateLimitUtils = {
  /**
   * Convert rate limit headers to RateLimitInfo
   */
  parseRateLimitHeaders(headers: Record<string, string>): RateLimitInfo {
    return {
      limit: headers['x-ratelimit-limit'] ? parseInt(headers['x-ratelimit-limit'], 10) : undefined,
      remaining: headers['x-ratelimit-remaining']
        ? parseInt(headers['x-ratelimit-remaining'], 10)
        : undefined,
      resetTime: headers['x-ratelimit-reset']
        ? parseInt(headers['x-ratelimit-reset'], 10) * 1000
        : undefined,
      retryAfter: headers['retry-after'] ? parseInt(headers['retry-after'], 10) : undefined,
    };
  },

  /**
   * Calculate optimal delay between requests
   */
  calculateOptimalDelay(requestsPerSecond: number): number {
    return Math.max(1000 / requestsPerSecond, 100); // Minimum 100ms
  },

  /**
   * Estimate requests remaining in current window
   */
  estimateRequestsRemaining(limiter: RateLimiter): number {
    const stats = limiter.getStats();
    return Math.max(0, stats.maxRequests - stats.requests);
  },

  /**
   * Create a rate limiter optimized for high-frequency requests
   */
  createHighFrequencyLimiter(requestsPerSecond: number): RateLimiter {
    return new RateLimiter({
      maxRequestsPerWindow: Math.floor(
        requestsPerSecond * NUMERIC_CONSTANTS.RATE_LIMIT_WINDOW_SIZE
      ), // Convert to per-minute
      windowMs: NUMERIC_CONSTANTS.RATE_LIMIT_WINDOW_MS,
      enableBurstProtection: true,
      maxBurst: Math.ceil(requestsPerSecond * 2), // Allow 2-second bursts
      enableBackoff: true,
      baseBackoffMs: 500,
      maxBackoffMs: 30000,
    });
  },

  /**
   * Create a rate limiter optimized for low-frequency requests
   */
  createLowFrequencyLimiter(requestsPerMinute: number): RateLimiter {
    return new RateLimiter({
      maxRequestsPerWindow: requestsPerMinute,
      windowMs: NUMERIC_CONSTANTS.RATE_LIMIT_WINDOW_MS,
      enableBurstProtection: false,
      enableBackoff: true,
      baseBackoffMs: 2000,
      maxBackoffMs: 120000,
    });
  },

  /**
   * Create a rate limiter specifically optimized for PumpFun live streaming endpoints
   *
   * This creates a conservative rate limiter that stays well under the 60 requests/minute
   * API limit to ensure reliable operation for live streaming applications.
   *
   * @param customConfig Optional configuration to override live streaming defaults
   * @returns RateLimiter optimized for PumpFun live streaming
   */
  createPumpFunLiveStreamingLimiter(customConfig?: Partial<RateLimitConfig>): RateLimiter {
    return createLiveStreamingRateLimiter(customConfig);
  },

  /**
   * Calculate safe request intervals for live streaming to avoid rate limits
   *
   * @param requestsPerMinute Desired requests per minute (max 60)
   * @returns Object with timing recommendations
   */
  calculateLiveStreamingIntervals(requestsPerMinute: number): {
    requestIntervalMs: number;
    burstSize: number;
    recommendedMaxPerMinute: number;
    safetyBufferMs: number;
  } {
    // Clamp to safe limits
    const safeRequestsPerMinute = Math.min(requestsPerMinute, DEFAULT_LIVE_STREAMING_RATE_LIMIT); // Stay under the limit
    const requestIntervalMs = Math.ceil(
      NUMERIC_CONSTANTS.RATE_LIMIT_WINDOW_MS / safeRequestsPerMinute
    );

    return {
      requestIntervalMs,
      burstSize: Math.min(MAX_LIVE_STREAMING_BURST, Math.floor(safeRequestsPerMinute / 10)), // Conservative burst
      recommendedMaxPerMinute: safeRequestsPerMinute,
      safetyBufferMs: REQUEST_SAFETY_BUFFER_MS, // 1 second buffer between requests
    };
  },

  /**
   * Get recommended configuration for different live streaming use cases
   */
  getLiveStreamingRecommendations(): {
    polling: { interval: number; maxRequestsPerMinute: number };
    pagination: { delayBetweenPages: number; maxRequestsPerMinute: number };
    burst: { maxBurstSize: number; recoveryTime: number };
  } {
    return {
      polling: {
        interval: 2000, // Poll every 2 seconds
        maxRequestsPerMinute: CONSERVATIVE_RATE_LIMIT, // Conservative limit for continuous polling
      },
      pagination: {
        delayBetweenPages: 1500, // Wait between paginated requests
        maxRequestsPerMinute: PAGINATION_RATE_LIMIT, // Slightly higher for pagination
      },
      burst: {
        maxBurstSize: 5, // Conservative burst size
        recoveryTime: RATE_LIMIT_RECOVERY_TIME_MS, // 30 seconds recovery between bursts
      },
    };
  },

  /**
   * Analyze current rate limiting status and provide recommendations
   */
  analyzeLiveStreamingRateLimit(limiter: RateLimiter): {
    status: 'healthy' | 'warning' | 'critical';
    currentUsage: number;
    recommendedAction: string;
    nextSafeRequestTime: number;
    utilizationRate: number;
  } {
    const stats = limiter.getStats();
    const utilizationRate = (stats.requests / stats.maxRequests) * 100;

    let status: 'healthy' | 'warning' | 'critical';
    let recommendedAction: string;

    if (utilizationRate < RATE_LIMIT_WARNING_THRESHOLD) {
      status = 'healthy';
      recommendedAction = 'Continue with current request pattern';
    } else if (utilizationRate < RATE_LIMIT_CRITICAL_THRESHOLD) {
      status = 'warning';
      recommendedAction = 'Consider reducing request frequency or adding delays';
    } else {
      status = 'critical';
      recommendedAction = 'Immediately reduce request frequency to avoid rate limits';
    }

    return {
      status,
      currentUsage: stats.requests,
      recommendedAction,
      nextSafeRequestTime: limiter.getTimeUntilNextRequest(),
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    };
  },
};
