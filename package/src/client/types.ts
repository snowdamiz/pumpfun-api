/**
 * TypeScript interfaces and types for PumpFun API Client
 *
 * This file contains all the core TypeScript interfaces that define the API
 * contracts, configuration objects, error types, and response wrappers.
 *
 * @version 1.0.0
 * @author PumpFun Team
 */

// ============================================================================
// Core Data Models
// ============================================================================

/**
 * Represents a coin with current live streaming data
 */
export interface LiveCoin {
  /** Unique identifier for the token (Solana address) */
  mint: string;
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Token description */
  description: string;
  /** Token image URL */
  image_uri: string;
  /** Twitter handle (optional) */
  twitter?: string;
  /** Telegram link (optional) */
  telegram?: string;
  /** Creator address */
  creator: string;
  /** Creation timestamp */
  created_timestamp: number;
  /** Market cap value */
  market_cap: number;
  /** USD market cap */
  usd_market_cap: number;
  /** Live streaming status */
  is_currently_live: boolean;
  /** Stream title (optional) */
  livestream_title?: string;
  /** Current participant count */
  num_participants: number;
  /** Chat message count */
  reply_count: number;
  /** Stream thumbnail URL */
  thumbnail: string;
  /** Last activity timestamp */
  last_reply: number;
}

/**
 * Contains detailed video stream information
 */
export interface LiveStreamInfo {
  /** Stream unique identifier */
  id: number;
  /** Supabase database ID */
  supabaseId: number;
  /** Associated token mint */
  mintId: string;
  /** Stream creator address */
  creatorAddress: string;
  /** Stream start time */
  streamStartTimestamp: number;
  /** Current participants */
  numParticipants: number;
  /** Maximum participants */
  maxParticipants: number;
  /** Live status */
  isLive: boolean;
  /** Quality/relevance score */
  downrankScore: number;
  /** Stream title */
  title: string;
  /** Stream mode */
  mode: 'interactive' | 'broadcast';
}

/**
 * Provides WebRTC connection details for video streaming
 */
export interface LiveKitConnectionInfo {
  /** Available server regions */
  regions: LiveKitRegion[];
  /** Primary server URL */
  primaryServer: string;
  /** LiveKit room identifier */
  roomName: string;
  /** Associated token mint */
  mintId: string;
  /** Stream identifier */
  streamId: number;
  /** WebSocket connection URL */
  websocketUrl: string;
  /** Authentication requirement */
  requiresAuthentication: boolean;
}

/**
 * Represents a LiveKit server region
 */
export interface LiveKitRegion {
  /** Region identifier */
  region: string;
  /** Region server URL */
  url: string;
  /** Distance metric */
  distance: string;
}

/**
 * Represents recorded stream segments
 */
export interface StreamClip {
  /** Clip unique identifier */
  id: string;
  /** Associated token mint */
  mintId: string;
  /** Clip type */
  clipType: 'COMPLETE' | 'HIGHLIGHT';
  /** Clip duration in seconds (optional) */
  duration?: number;
  /** View count (optional) */
  view_count?: number;
  /** Creation timestamp (optional) */
  created_at?: string;
  /** Clip playback URL (optional) */
  clip_url?: string;
}

// ============================================================================
// Configuration Objects
// ============================================================================

/**
 * Configuration options for PumpFunAPIClient
 */
export interface ClientConfig {
  /** Custom API base URL */
  baseURL?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Logger configuration */
  loggerConfig?: Partial<LoggerConfig>;
  /** Rate limiting configuration */
  rateLimitConfig?: Partial<RateLimitConfig>;
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
// HTTP Client Types
// ============================================================================

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

// Note: Error classes (PumpFunError, NetworkError, etc.) are imported from '../utils/errors'
// to avoid duplication and maintain consistency across the codebase.

// ============================================================================
// Response Wrappers
// ============================================================================

/**
 * Standard wrapper for API responses
 */
export interface APIResponse<T> {
  /** Request success status */
  success: boolean;
  /** Response data (optional) */
  data?: T;
  /** Error information (optional) */
  error?: APIError;
  /** Response timestamp */
  timestamp: string;
  /** Response headers (optional) */
  headers?: Record<string, string>;
}

/**
 * Wrapper for array responses with pagination
 */
export interface ArrayResponse<T> extends APIResponse<T[]> {
  /** Pagination information (optional) */
  pagination?: Pagination;
}

/**
 * Pagination metadata
 */
export interface Pagination {
  /** Items per page */
  limit: number;
  /** Items skipped */
  offset: number;
  /** Total items */
  total: number;
  /** More items available */
  hasMore: boolean;
  /** Current page number (optional) */
  page?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from jurisdiction validation endpoint
 */
export interface JurisdictionResponse {
  /** Whether the jurisdiction is valid */
  is_valid: boolean;
}

/**
 * Response from SOL price endpoint
 */
export interface SolPriceResponse {
  /** Current SOL price in USD */
  sol_price: number;
}

// ============================================================================
// Request Parameters
// ============================================================================

/**
 * Parameters for getLiveCoins request
 */
export interface GetLiveCoinsParams {
  /** Number of items to skip */
  offset?: number;
  /** Maximum number of items to return */
  limit?: number;
  /** Sort field */
  sort?: 'currently_live' | 'market_cap' | 'participants';
  /** Sort order */
  order?: 'ASC' | 'DESC';
  /** Include NSFW content */
  includeNsfw?: boolean;
}

/**
 * Parameters for getStreamClips request
 */
export interface GetStreamClipsParams {
  /** Maximum number of clips to return */
  limit?: number;
  /** Type of clips to retrieve */
  clipType?: 'COMPLETE' | 'HIGHLIGHT';
}

// ============================================================================
// Video Stream Analysis Types
// ============================================================================

/**
 * Comprehensive video stream analysis result
 */
export interface VideoStreamAnalysis {
  /** Whether there is an active stream */
  hasActiveStream: boolean;
  /** Whether creator is approved for streaming */
  isApprovedCreator: boolean;
  /** Live stream information (optional) */
  streamInfo?: LiveStreamInfo;
  /** LiveKit connection information (optional) */
  liveKitConnection?: LiveKitConnectionInfo;
  /** Analysis timestamp */
  analyzedAt: string;
}

// ============================================================================
// Statistics and Analytics Types
// ============================================================================

/**
 * Stream statistics and analytics
 */
export interface StreamStatistics {
  /** Total number of live streams */
  totalLiveStreams: number;
  /** Total participants across all streams */
  totalParticipants: number;
  /** Average participants per stream */
  averageParticipants: number;
  /** Most active streams */
  topStreams: Array<{
    mintId: string;
    name: string;
    participants: number;
  }>;
  /** Stream distribution by mode */
  modeDistribution: {
    interactive: number;
    broadcast: number;
  };
  /** Statistics calculated at timestamp */
  calculatedAt: string;
}

// ============================================================================
// State Management Types
// ============================================================================

/**
 * Runtime state for API client
 */
export interface ClientState {
  /** Initialization status */
  isInitialized: boolean;
  /** Timestamp of last request */
  lastRequestTime: number;
  /** Total requests made */
  requestCount: number;
  /** Total errors encountered */
  errorCount: number;
  /** Current rate limit status */
  rateLimitInfo: RateLimitState;
}

/**
 * Rate limiting state
 */
export interface RateLimitState {
  /** Requests in current window */
  requestsInWindow: number;
  /** Window start timestamp */
  windowStart: number;
  /** Backoff end timestamp */
  backoffUntil: number;
  /** Consecutive error count */
  consecutiveErrors: number;
}

// ============================================================================
// Rate Limiter Types
// ============================================================================

/**
 * Rate limit information from API responses
 */
export interface RateLimitInfo {
  /** Rate limit from response headers */
  limit?: number;
  /** Remaining requests in current window */
  remaining?: number;
  /** Window reset time timestamp */
  resetTime?: number;
  /** Retry after delay in seconds */
  retryAfter?: number;
}

/**
 * Enhanced rate limiting state tracker for internal use
 */
export interface RateLimiterState {
  /** Requests in current window */
  requests: number;
  /** Window start timestamp */
  windowStart: number;
  /** Last request timestamp */
  lastRequestTime: number;
  /** Current burst count */
  burstCount: number;
  /** Burst window start timestamp */
  burstStartTime: number;
  /** Consecutive errors count */
  consecutiveErrors: number;
  /** Total requests made */
  totalRequests: number;
  /** Total errors encountered */
  totalErrors: number;
  /** Backoff end timestamp */
  backoffUntil?: number;
  /** Adaptive rate limit (adjusted based on performance) */
  adaptiveRateLimit?: number;
  /** Last adaptive adjustment timestamp */
  lastAdaptiveAdjustment?: number;
}

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

/**
 * Enumeration for HTTP methods
 */
export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

/**
 * Enumeration for stream states
 */
export enum StreamStatus {
  STARTING = 'STARTING',
  LIVE = 'LIVE',
  ENDING = 'ENDING',
  ENDED = 'ENDED',
  ERROR = 'ERROR',
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Omit certain properties from T
 */
export type OmitProperties<T, K extends keyof T> = Omit<T, K>;

/**
 * Pick certain properties from T
 */
export type PickProperties<T, K extends keyof T> = Pick<T, K>;

/**
 * Type for event handlers
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * Type for async event handlers
 */
export type AsyncEventHandler<T = any> = (data: T) => Promise<void>;

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
  timeout: 10000,
};
