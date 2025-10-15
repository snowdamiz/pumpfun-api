/**
 * HTTP Request Handler Types
 *
 * Type definitions for HTTP request handling infrastructure.
 */

import { LoggerConfig, RateLimitConfig } from '../../types';

/**
 * Configuration for live streams service
 */
export interface LiveStreamsServiceConfig {
  /** Base URL for API requests */
  baseURL: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Logger configuration */
  loggerConfig?: LoggerConfig;
  /** Rate limit configuration */
  rateLimitConfig?: RateLimitConfig;
  /** Retry configuration */
  retryConfig?: {
    /** Maximum number of retry attempts */
    maxRetries?: number;
    /** Base delay between retries in milliseconds */
    baseDelay?: number;
  };
}
