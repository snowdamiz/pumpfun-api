/**
 * Rate Limiting Handlers for PumpFun API Discovery
 *
 * Provides comprehensive rate limiting functionality to respect API limits,
 * prevent excessive requests, and handle rate limit responses gracefully.
 */

import { RateLimitInfo, RateLimitConfig } from '../types/common';
import { RateLimitError } from './errors';

/**
 * Default rate limiting configuration
 */
const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequestsPerWindow: 60,
  windowMs: 60000, // 1 minute
  enableRetryAfter: true,
  enableSlidingWindow: true,
  enableBurstProtection: true,
  maxBurst: 10,
  enableBackoff: true,
  baseBackoffMs: 1000,
  maxBackoffMs: 60000,
  backoffMultiplier: 2,
};

/**
 * Rate limiting state tracker
 */
interface RateLimitState {
  requests: number;
  windowStart: number;
  lastRequestTime: number;
  burstCount: number;
  burstStartTime: number;
  consecutiveErrors: number;
  backoffUntil?: number;
}

/**
 * Rate Limiter class for managing API request rates
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private state: RateLimitState;
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
    };

    // Load configuration from environment variables
    this.loadFromEnvironment();
  }

  /**
   * Load rate limit configuration from environment variables
   */
  private loadFromEnvironment(): void {
    if (process.env.MAX_REQUESTS_PER_MINUTE) {
      this.config.maxRequestsPerWindow = parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10);
    }

    if (process.env.RATE_LIMIT_DELAY_MS) {
      this.config.baseBackoffMs = parseInt(process.env.RATE_LIMIT_DELAY_MS, 10);
    }
  }

  /**
   * Check if a request can be made immediately
   */
  async canMakeRequest(): Promise<boolean> {
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
    while (!(await this.canMakeRequest())) {
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

    // Update burst tracking
    this.updateBurstTracking(now);

    // Reset error tracking on success
    this.state.consecutiveErrors = 0;
    this.state.backoffUntil = undefined;

    console.debug(`[RateLimit] Request recorded. Count: ${this.state.requests}/${this.config.maxRequestsPerWindow}`);
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
        limit: response.limit || this.rateLimitInfo?.limit,
        remaining: response.remaining || 0,
        resetTime: response.resetTime || now + this.config.windowMs,
        retryAfter: response.retryAfter || Math.ceil(this.config.windowMs / 1000),
      };
    }

    // Update consecutive error count
    this.state.consecutiveErrors++;

    // Apply backoff if enabled
    if (this.config.enableBackoff) {
      this.applyBackoff();
    }

    console.warn(`[RateLimit] Rate limit error recorded. Consecutive errors: ${this.state.consecutiveErrors}`);
  }

  /**
   * Check if we're currently rate limited
   */
  isRateLimited(): boolean {
    const now = Date.now();

    // Check window-based rate limiting
    if (this.config.enableSlidingWindow) {
      return this.state.requests >= this.config.maxRequestsPerWindow;
    } else {
      // Simple window reset
      if (now - this.state.windowStart >= this.config.windowMs) {
        this.resetWindow();
      }
      return this.state.requests >= this.config.maxRequestsPerWindow;
    }
  }

  /**
   * Check if burst protection is active
   */
  isBurstLimited(): boolean {
    if (!this.config.enableBurstProtection) {
      return false;
    }

    const now = Date.now();
    const burstWindow = 1000; // 1 second burst window

    // Reset burst window if needed
    if (now - this.state.burstStartTime >= burstWindow) {
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
  } {
    return {
      requests: this.state.requests,
      maxRequests: this.config.maxRequestsPerWindow,
      windowStart: this.state.windowStart,
      windowEnd: this.state.windowStart + this.config.windowMs,
      burstCount: this.state.burstCount,
      maxBurst: this.config.maxBurst || 0,
      consecutiveErrors: this.state.consecutiveErrors,
      isBackoffActive: !!(this.state.backoffUntil && Date.now() < this.state.backoffUntil),
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

    const burstWindow = 1000; // 1 second burst window

    // Reset burst window if needed
    if (now - this.state.burstStartTime >= burstWindow) {
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

    console.warn(`[RateLimit] Applied backoff: ${Math.round(backoffMs)}ms`);
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
    if (this.state.requests >= this.config.maxRequestsPerWindow) {
      const windowEnd = this.state.windowStart + this.config.windowMs;
      if (now < windowEnd) {
        return windowEnd - now;
      }
    }

    // Check burst reset time
    if (this.isBurstLimited()) {
      const burstEnd = this.state.burstStartTime + 1000;
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
    };
    this.state.backoffUntil = undefined;
    this.rateLimitInfo = undefined;
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
  const limiter = customLimiter || rateLimiter;

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
    if (error instanceof RateLimitError) {
      limiter.recordRateLimitError({
        retryAfter: error.retryAfter,
        limit: error.limit,
        remaining: error.remaining,
        resetTime: error.resetTime ? new Date(error.resetTime).getTime() : undefined,
      });
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
 * Rate limiting utilities
 */
export const RateLimitUtils = {
  /**
   * Convert rate limit headers to RateLimitInfo
   */
  parseRateLimitHeaders(headers: Record<string, string>): RateLimitInfo {
    return {
      limit: headers['x-ratelimit-limit'] ? parseInt(headers['x-ratelimit-limit'], 10) : undefined,
      remaining: headers['x-ratelimit-remaining'] ? parseInt(headers['x-ratelimit-remaining'], 10) : undefined,
      resetTime: headers['x-ratelimit-reset'] ? parseInt(headers['x-ratelimit-reset'], 10) * 1000 : undefined,
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
};