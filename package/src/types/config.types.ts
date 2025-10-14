/**
 * Configuration-related TypeScript interfaces and types
 *
 * Contains all configuration objects, default settings,
 * and configuration-related type definitions.
 */

// Import LogLevel from common.types
import { LogLevel } from './common.types';

// ============================================================================
// Configuration Objects
// ============================================================================

/**
 * Configuration options for PumpFunAPIClient
 */
export interface ClientConfig {
  /** Custom API base URL for token operations */
  baseURL?: string;
  /** Custom live streaming API base URL for video operations */
  livestreamURL?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Logger configuration */
  loggerConfig?: Partial<LoggerConfig>;
  /** Rate limiting configuration */
  rateLimitConfig?: Partial<RateLimitConfig>;
  /** WebSocket URL (optional, for future WebSocket support) */
  wsURL?: string;
  /** API key for authentication (optional) */
  apiKey?: string;
  /** Auth token for authentication (optional) */
  authToken?: string;
}

/**
 * Configuration for request retry logic
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds */
  baseDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Multiplier for exponential backoff */
  backoffFactor: number;
  /** HTTP status codes to retry */
  retryableStatusCodes: number[];
  /** Error codes to retry */
  retryableErrors: string[];
  /** Enable jitter for retry delays */
  enableJitter?: boolean;
}

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  /** Max requests per time window */
  maxRequestsPerWindow: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Enable retry-after header handling */
  enableRetryAfter: boolean;
  /** Use sliding window algorithm */
  enableSlidingWindow: boolean;
  /** Enable burst protection */
  enableBurstProtection: boolean;
  /** Maximum burst size (optional) */
  maxBurst?: number;
  /** Enable adaptive backoff */
  enableBackoff: boolean;
  /** Base backoff delay in milliseconds */
  baseBackoffMs: number;
  /** Maximum backoff delay in milliseconds */
  maxBackoffMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
}

/**
 * Configuration for logging
 */
export interface LoggerConfig {
  /** Logging level */
  level: LogLevel;
  /** Enable console output */
  enableConsole: boolean;
  /** Enable colored output */
  enableColors: boolean;
  /** Enable timestamps */
  enableTimestamps: boolean;
  /** Enable structured JSON logs */
  enableStructuredLogs?: boolean;
  /** Enable performance logging */
  enablePerformanceLogging?: boolean;
  /** Enable HTTP request logging */
  enableRequestLogging?: boolean;
  /** Enable error tracking */
  enableErrorTracking?: boolean;
  /** Enable file output (optional, Node.js only) */
  enableFileLogging?: boolean;
  /** Enable file output (alias for enableFileLogging, optional) */
  enableFile?: boolean;
  /** Log file path (optional) */
  logFilePath?: string;
  /** Log file path (alias for logFilePath, optional) */
  filePath?: string;
  /** Custom logger function (optional) */
  customLogger?: (level: LogLevel, message: string, data?: any) => void;
}

/**
 * Validated configuration object for ConfigurationManager
 */
export interface ValidatedConfig {
  /** API base URL for token operations */
  baseURL: string;
  /** Live streaming API base URL for video operations */
  livestreamURL: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** WebSocket URL */
  wsURL: string;
  /** API key for authentication (optional) */
  apiKey?: string;
  /** Auth token for authentication (optional) */
  authToken?: string;
  /** Logger configuration */
  loggerConfig?: Partial<typeof DEFAULT_LOGGER_CONFIG>;
  /** Rate limiting configuration */
  rateLimitConfig?: Partial<typeof DEFAULT_RATE_LIMIT_CONFIG>;
  /** Retry configuration */
  retryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>;
}

/**
 * Configuration for ErrorHandler
 */
export interface ErrorHandlerConfig {
  /** API base URL */
  baseURL: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Logger configuration (optional) */
  loggerConfig?: any;
  /** Rate limiting configuration (optional) */
  rateLimitConfig?: any;
  /** Retry configuration (optional) */
  retryConfig?: any;
}

/**
 * Configuration for LiveStreamsService
 */
export interface LiveStreamsServiceConfig {
  /** API base URL for token operations */
  baseURL: string;
  /** Live streaming API base URL for video operations */
  livestreamURL: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Retry configuration (optional) */
  retryConfig?: any;
}

/**
 * Performance metrics for HTTP client monitoring
 */
export interface PerformanceMetrics {
  /** Total number of requests */
  totalRequests: number;
  /** Number of successful requests */
  successfulRequests: number;
  /** Number of failed requests */
  failedRequests: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Timestamp of last request */
  lastRequestTime: number;
  /** Error rate (0-1) */
  errorRate: number;
}

/**
 * Configuration options for HTTP client
 */
export interface HTTPClientConfig {
  /** Custom API base URL */
  baseURL?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Default headers */
  headers?: Record<string, string>;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Rate limiting configuration */
  rateLimitConfig?: Partial<RateLimitConfig>;
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Enable logging */
  enableLogging?: boolean;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENOTFOUND'],
  enableJitter: true,
};

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequestsPerWindow: 60,
  windowMs: 60000,
  enableRetryAfter: true,
  enableSlidingWindow: true,
  enableBurstProtection: true,
  maxBurst: 10,
  enableBackoff: true,
  baseBackoffMs: 1000,
  maxBackoffMs: 10000,
  backoffMultiplier: 1.5,
};

/**
 * Live streaming optimized rate limiting configuration
 * Specifically tuned for live streaming data endpoints with conservative limits
 */
export const LIVE_STREAMING_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequestsPerWindow: 55, // Slightly under the 60/minute limit to provide buffer
  windowMs: 60000, // 1 minute
  enableRetryAfter: true,
  enableSlidingWindow: true,
  enableBurstProtection: true,
  maxBurst: 8, // More conservative burst protection for live streaming
  enableBackoff: true,
  baseBackoffMs: 1500, // More conservative base delay for live streaming
  maxBackoffMs: 90000, // Longer max backoff for live streaming endpoints
  backoffMultiplier: 2.5, // More aggressive backoff for live streaming
};

/**
 * Default logger configuration
 */
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableTimestamps: true,
  enableColors: true,
  enableStructuredLogs: false,
  enablePerformanceLogging: true,
  enableRequestLogging: true,
  enableErrorTracking: true,
  enableFileLogging: false,
  logFilePath: undefined,
};

/**
 * Default client configuration
 */
export const DEFAULT_CLIENT_CONFIG: Required<
  Omit<ClientConfig, 'retryConfig' | 'loggerConfig' | 'rateLimitConfig'>
> = {
  baseURL: 'https://frontend-api-v3.pump.fun',
  livestreamURL: 'https://livestream-api.pump.fun',
  timeout: 10000,
  wsURL: 'wss://stream.pump.fun',
  apiKey: '',
  authToken: '',
};
