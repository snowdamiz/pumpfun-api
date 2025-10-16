/**
 * Common TypeScript interfaces and types
 *
 * Contains all utility types, enums, and common type definitions
 * used throughout the application.
 */

// ============================================================================
// Logger Types
// ============================================================================

/**
 * Context information for log entries
 */
export interface LogContext {
  /** Component name */
  component?: string;
  /** Request identifier */
  requestId?: string;
  /** User identifier */
  userId?: string;
  /** Session identifier */
  sessionId?: string;
  /** Token mint identifier */
  mintId?: string;
  /** API endpoint */
  endpoint?: string;
  /** Additional context data */
  [key: string]: any;
}

/**
 * Individual log entry structure
 */
export interface LogEntry {
  /** Log timestamp */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Additional data */
  data?: any;
  /** Log context */
  context?: LogContext;
  /** Logger name */
  logger: string;
  /** Error information */
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  /** Performance metrics */
  performance?: {
    activeTimers: number;
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Standardized error format for API responses
 */
export interface APIError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  statusCode: number;
  /** Additional error details (optional) */
  details?: Record<string, any>;
  /** Error timestamp */
  timestamp: string;
  /** Whether error can be retried */
  isRetryable: boolean;
  /** Original error object (optional) */
  originalError?: any;
}

// Note: Error classes (PumpFunError, NetworkError, etc.) are imported from '../infrastructure/error-handling/errors'
// to avoid duplication and maintain consistency across the codebase.

// ============================================================================
// Enumerations
// ============================================================================

/**
 * Enumeration for logging levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Common numeric constants to avoid magic numbers
 */
export const NUMERIC_CONSTANTS = {
  /** Default timeout in milliseconds for rate limit headers */
  RATE_LIMIT_TIMEOUT_MS: 60000,
  /** HTTP status code for rate limit exceeded */
  RATE_LIMIT_STATUS: 429,
  /** Maximum timeout in milliseconds */
  MAX_TIMEOUT: 300000,
  /** WebSocket close code for normal closure */
  WS_CLOSE_NORMAL: 1000,
  /** WebSocket close code for going away */
  WS_CLOSE_GOING_AWAY: 1001,
  /** WebSocket close code for protocol error */
  WS_CLOSE_PROTOCOL_ERROR: 1002,
  /** WebSocket close code for unexpected data */
  WS_CLOSE_UNEXPECTED_DATA: 1003,
  /** WebSocket close code for inconsistent data */
  WS_CLOSE_INCONSISTENT_DATA: 1007,
  /** WebSocket close code for policy violation */
  WS_CLOSE_POLICY_VIOLATION: 1008,
  /** WebSocket close code for message too big */
  WS_CLOSE_MESSAGE_TOO_BIG: 1009,
  /** WebSocket close code for mandatory extension */
  WS_CLOSE_MANDATORY_EXTENSION: 1010,
  /** WebSocket close code for internal server error */
  WS_CLOSE_INTERNAL_ERROR: 1011,
  /** Default backoff delay in milliseconds */
  DEFAULT_BACKOFF_DELAY: 1000,
  /** Maximum backoff delay in milliseconds */
  MAX_BACKOFF_DELAY: 30000,
  /** Stream check interval in milliseconds */
  STREAM_CHECK_INTERVAL: 30000,
  /** Connection timeout in milliseconds */
  CONNECTION_TIMEOUT: 10000,
  /** Buffer size for WebSocket operations */
  BUFFER_SIZE: 8192,
  /** Maximum retry attempts */
  MAX_RETRY_ATTEMPTS: 3,
  /** Rate limit window size in requests */
  RATE_LIMIT_WINDOW_SIZE: 60,
  /** Rate limit window duration in milliseconds */
  RATE_LIMIT_WINDOW_MS: 60000,
  /** Minimum delay between retries */
  MIN_RETRY_DELAY: 1000,
  /** Maximum delay between retries */
  MAX_RETRY_DELAY: 30000,
  /** Reconnect delay multiplier */
  RECONNECT_DELAY_MULTIPLIER: 2,
  /** Burst protection threshold */
  BURST_PROTECTION_THRESHOLD: 10,
  /** Performance metrics window size */
  PERFORMANCE_METRICS_WINDOW: 100,
  /** Log rotation threshold */
  LOG_ROTATION_THRESHOLD: 1000,
  /** Minimum recommended timeout in milliseconds */
  MIN_RECOMMENDED_TIMEOUT: 5000,
  /** Maximum base delay in milliseconds */
  MAX_BASE_DELAY: 10000,
  /** Maximum max delay in milliseconds */
  MAX_MAX_DELAY: 300000,
  /** Maximum backoff factor */
  MAX_BACKOFF_FACTOR: 5,
  /** Maximum rate limit window in milliseconds */
  MAX_RATE_LIMIT_WINDOW_MS: 3600000,
} as const;
