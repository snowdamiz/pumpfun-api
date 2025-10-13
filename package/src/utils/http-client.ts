/**
 * Enhanced HTTP Client Utility for PumpFun API npm Package
 *
 * Provides a robust HTTP client with retry logic, timeout handling,
 * rate limiting, and enhanced error handling for API operations.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import {
  RetryConfig,
  RateLimitConfig,
  PerformanceMetrics,
  HTTPClientConfig,
  APIError as APIErrorInterface,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
} from '../client/types';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// Type alias for backward compatibility
type ClientRateLimitConfig = RateLimitConfig;
type APIErrorData = Omit<APIErrorInterface, 'message'> & { message: string };

/**
 * Default configuration for HTTP requests
 */
const DEFAULT_CONFIG: Partial<AxiosRequestConfig> = {
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'pumpfun-api/1.0.0',
  },
};

/**
 * Enhanced HTTP Client class with retry logic, rate limiting, and performance monitoring
 */
export class HTTPClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;
  private rateLimitConfig: ClientRateLimitConfig;
  private enablePerformanceMonitoring: boolean;
  private enableLogging: boolean;
  private performanceMetrics: PerformanceMetrics;
  private requestTimestamps: number[] = [];

  constructor(config: HTTPClientConfig = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };
    this.rateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config.rateLimitConfig };
    this.enablePerformanceMonitoring = config.enablePerformanceMonitoring ?? true;
    this.enableLogging = config.enableLogging ?? true;

    // Initialize performance metrics
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: 0,
      errorRate: 0,
    };

    this.client = axios.create({
      baseURL: config.baseURL ?? process.env.PUMPFUN_API_BASE_URL,
      timeout: config.timeout ?? 10000,
      headers: {
        ...DEFAULT_CONFIG.headers,
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors with enhanced functionality
   */
  private setupInterceptors(): void {
    // Request interceptor for logging, rate limiting, and performance tracking
    this.client.interceptors.request.use(
      config => {
        const startTime = Date.now();
        config.metadata = { startTime };

        // Check rate limiting
        this.checkRateLimit();

        if (this.enableLogging) {
          console.debug(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            params: config.params,
          });
        }

        return config;
      },
      error => {
        if (this.enableLogging) {
          console.error('[HTTP] Request error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging, error handling, and performance tracking
    this.client.interceptors.response.use(
      response => {
        this.updatePerformanceMetrics(response.config, true);

        if (this.enableLogging) {
          console.debug(
            `[HTTP] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
            {
              status: response.status,
              headers: response.headers,
              dataSize: JSON.stringify(response.data).length,
            }
          );
        }
        return response;
      },
      async (error: AxiosError) => {
        this.updatePerformanceMetrics(error.config, false);

        const originalRequest = error.config as AxiosRequestConfig & { _retryCount?: number };

        if (this.enableLogging) {
          console.error(`[HTTP] Response error: ${error.message}`, {
            status: error.response?.status,
            url: originalRequest?.url,
            method: originalRequest?.method,
          });
        }

        // Check if we should retry
        if (this.shouldRetry(error, originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        // Convert to enhanced APIError and reject
        return Promise.reject(this.createAPIError(error));
      }
    );
  }

  /**
   * Enhanced rate limiting with sliding window and burst protection
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;

    // Remove old timestamps outside the current window
    this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > windowStart);

    // Check if we exceed the rate limit
    if (this.requestTimestamps.length >= this.rateLimitConfig.maxRequestsPerWindow) {
      const oldestRequest = this.requestTimestamps[0];
      if (!oldestRequest) {
        throw new APIError({
          code: 'RATE_LIMIT_ERROR',
          message: 'Rate limit calculation error',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          isRetryable: true,
        });
      }
      const waitTime = oldestRequest + this.rateLimitConfig.windowMs - now;

      if (waitTime > 0) {
        if (this.enableLogging) {
          console.warn(`[HTTP] Rate limit exceeded. Waiting ${waitTime}ms`);
        }
        throw new APIError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
          statusCode: 429,
          timestamp: new Date().toISOString(),
          isRetryable: true,
          details: { waitTime, retryAfter: Math.ceil(waitTime / 1000) },
        });
      }
    }

    // Add current request timestamp
    this.requestTimestamps.push(now);

    // Burst protection
    if (this.rateLimitConfig.enableBurstProtection && this.rateLimitConfig.maxBurst) {
      const recentRequests = this.requestTimestamps.filter(
        timestamp => now - timestamp < 1000 // Last second
      );

      if (recentRequests.length > this.rateLimitConfig.maxBurst) {
        throw new APIError({
          code: 'BURST_LIMIT_EXCEEDED',
          message: 'Too many requests in quick succession. Please slow down.',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          isRetryable: true,
          details: { burstSize: recentRequests.length },
        });
      }
    }
  }

  /**
   * Enhanced performance metrics tracking
   */
  private updatePerformanceMetrics(config: AxiosRequestConfig | undefined, success: boolean): void {
    if (!this.enablePerformanceMonitoring || !config?.metadata?.startTime) {
      return;
    }

    const responseTime = Date.now() - config.metadata.startTime;
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.lastRequestTime = Date.now();

    if (success) {
      this.performanceMetrics.successfulRequests++;
    } else {
      this.performanceMetrics.failedRequests++;
    }

    // Update average response time
    const totalResponseTime =
      this.performanceMetrics.averageResponseTime * (this.performanceMetrics.totalRequests - 1) +
      responseTime;
    this.performanceMetrics.averageResponseTime =
      totalResponseTime / this.performanceMetrics.totalRequests;

    // Update error rate
    this.performanceMetrics.errorRate =
      this.performanceMetrics.failedRequests / this.performanceMetrics.totalRequests;
  }

  /**
   * Enhanced retry logic with jitter and adaptive backoff
   */
  private shouldRetry(
    error: AxiosError,
    originalRequest: AxiosRequestConfig & { _retryCount?: number }
  ): boolean {
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Check retry count
    if (originalRequest._retryCount >= this.retryConfig.maxRetries) {
      return false;
    }

    // Check status code
    if (
      error.response?.status &&
      this.retryConfig.retryableStatusCodes.includes(error.response.status)
    ) {
      return true;
    }

    // Check error type
    if (error.code && this.retryConfig.retryableErrors.includes(error.code)) {
      return true;
    }

    return false;
  }

  /**
   * Enhanced retry with exponential backoff and jitter
   */
  private async retryRequest(
    originalRequest: AxiosRequestConfig & { _retryCount?: number }
  ): Promise<AxiosResponse> {
    originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;

    let delay = Math.min(
      this.retryConfig.baseDelay *
        Math.pow(this.retryConfig.backoffFactor, originalRequest._retryCount - 1),
      this.retryConfig.maxDelay
    );

    // Add jitter to prevent thundering herd
    if (this.retryConfig.enableJitter) {
      const jitter = delay * 0.1 * Math.random(); // Add up to 10% jitter
      delay += jitter;
    }

    if (this.enableLogging) {
      console.warn(
        `[HTTP] Retrying request (${originalRequest._retryCount}/${this.retryConfig.maxRetries}) after ${Math.round(delay)}ms`
      );
    }

    await this.sleep(delay);

    return this.client(originalRequest);
  }

  /**
   * Enhanced API error creation with better categorization
   */
  private createAPIError(error: AxiosError): APIError {
    const statusCode = error.response?.status ?? 0;
    const errorCode = error.code ?? 'UNKNOWN_ERROR';
    let message = 'Unknown error occurred';

    // Extract message from response data if available
    if (
      error.response?.data &&
      typeof error.response.data === 'object' &&
      'message' in error.response.data
    ) {
      message = String(error.response.data.message);
    } else if (error instanceof Error && error.message) {
      message = error.message;
    } else if ('message' in error && typeof error.message === 'string') {
      message = error.message;
    }

    const details = error.response?.data ?? {
      originalError: error instanceof Error ? error.message : String(error),
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    };

    return new APIError({
      code: errorCode,
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
      isRetryable: this.isRetryableError(error),
      originalError: error,
    });
  }

  /**
   * Enhanced retryable error detection
   */
  private isRetryableError(error: AxiosError): boolean {
    return !!(
      (error.response?.status &&
        this.retryConfig.retryableStatusCodes.includes(error.response.status)) ||
      (error.code && this.retryConfig.retryableErrors.includes(error.code))
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * HTTP GET request with enhanced features
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * HTTP POST request with enhanced features
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * HTTP PUT request with enhanced features
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * HTTP DELETE request with enhanced features
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * HTTP PATCH request with enhanced features
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Custom request method for more flexibility
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  /**
   * Set default headers for all requests
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers, headers);
  }

  /**
   * Set authorization header
   */
  setAuthorization(token: string, type: 'Bearer' | 'ApiKey' = 'Bearer'): void {
    this.client.defaults.headers.Authorization = `${type} ${token}`;
  }

  /**
   * Clear authorization header
   */
  clearAuthorization(): void {
    delete this.client.defaults.headers.Authorization;
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Update rate limit configuration
   */
  updateRateLimitConfig(config: Partial<ClientRateLimitConfig>): void {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...config };
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Get current rate limit configuration
   */
  getRateLimitConfig(): ClientRateLimitConfig {
    return { ...this.rateLimitConfig };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: 0,
      errorRate: 0,
    };
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    requestsInCurrentWindow: number;
    requestsRemaining: number;
    windowResetTime: number;
    isRateLimited: boolean;
  } {
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;
    const requestsInWindow = this.requestTimestamps.filter(
      timestamp => timestamp > windowStart
    ).length;
    const requestsRemaining = Math.max(
      0,
      this.rateLimitConfig.maxRequestsPerWindow - requestsInWindow
    );
    const windowResetTime =
      this.requestTimestamps.length > 0
        ? Math.min(...this.requestTimestamps) + this.rateLimitConfig.windowMs
        : now;

    return {
      requestsInCurrentWindow: requestsInWindow,
      requestsRemaining,
      windowResetTime,
      isRateLimited: requestsRemaining === 0,
    };
  }
}

/**
 * Enhanced API Error class that implements the APIErrorInterface
 */
export class APIError extends Error implements APIErrorInterface {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;
  public readonly isRetryable: boolean;
  public readonly originalError?: any;

  constructor(data: APIErrorData) {
    super(data.message);
    this.name = 'APIError';
    this.code = data.code;
    this.statusCode = data.statusCode;
    this.details = data.details;
    this.timestamp = data.timestamp;
    this.isRetryable = data.isRetryable;
    this.originalError = data.originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  /**
   * Convert error to JSON for serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      isRetryable: this.isRetryable,
      stack: this.stack,
    };
  }

  /**
   * Create a retryable API error
   */
  static retryable(data: Omit<APIErrorData, 'isRetryable'>): APIError {
    return new APIError({ ...data, isRetryable: true });
  }

  /**
   * Create a non-retryable API error
   */
  static nonRetryable(data: Omit<APIErrorData, 'isRetryable'>): APIError {
    return new APIError({ ...data, isRetryable: false });
  }
}

/**
 * Convenience function to create a new HTTP client
 */
export function createHTTPClient(config?: HTTPClientConfig): HTTPClient {
  return new HTTPClient(config);
}

/**
 * Default HTTP client instance
 */
export const httpClient = new HTTPClient();
