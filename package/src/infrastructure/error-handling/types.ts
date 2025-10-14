/**
 * Error Handler Types
 *
 * Type definitions for the error handling infrastructure.
 */

import { LoggerConfig, RetryConfig, RateLimitConfig } from '../../types';

/**
 * Configuration for error handler
 */
export interface ErrorHandlerConfig {
  /** Base URL for error reporting */
  baseURL: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Logger configuration */
  loggerConfig?: Partial<LoggerConfig>;
  /** Rate limit configuration */
  rateLimitConfig?: Partial<RateLimitConfig>;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
}
