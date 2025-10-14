/**
 * Domain model TypeScript interfaces and types
 *
 * Contains all domain-specific types, business logic interfaces,
 * and domain model type definitions.
 */

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
 * Runtime state for services
 */
export interface ServiceState {
  /** Total request count */
  requestCount: number;
  /** Total error count */
  errorCount: number;
  /** Timestamp of last request */
  lastRequestTime: number;
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
// Event Handler Types
// ============================================================================

/**
 * Type for event handlers
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * Type for async event handlers
 */
export type AsyncEventHandler<T = any> = (data: T) => Promise<void>;

// ============================================================================
// Stream Domain Types
// ============================================================================

/**
 * Stream filtering criteria
 */
export interface StreamFilters {
  /** Minimum number of participants */
  minParticipants?: number;
  /** Maximum number of participants */
  maxParticipants?: number;
  /** Stream modes to include */
  modes?: ('interactive' | 'broadcast')[];
  /** Filter by creator address */
  creatorAddress?: string;
  /** Include NSFW content */
  includeNsfw?: boolean;
  /** Filter by creation time range */
  createdAfter?: number;
  createdBefore?: number;
}

/**
 * Stream analytics data
 */
export interface StreamAnalytics {
  /** Stream ID */
  streamId: number;
  /** Token mint */
  mintId: string;
  /** Participant count over time */
  participantHistory: Array<{
    timestamp: number;
    count: number;
  }>;
  /** Message frequency over time */
  messageHistory: Array<{
    timestamp: number;
    count: number;
  }>;
  /** Peak participant count */
  peakParticipants: number;
  /** Average session duration */
  averageSessionDuration: number;
  /** Total messages sent */
  totalMessages: number;
}

/**
 * Stream quality metrics
 */
export interface StreamQualityMetrics {
  /** Stream ID */
  streamId: number;
  /** Video quality score */
  videoQuality: number;
  /** Audio quality score */
  audioQuality: number;
  /** Latency in milliseconds */
  latency: number;
  /** Frame rate */
  frameRate: number;
  /** Bitrate */
  bitrate: number;
  /** Drop rate percentage */
  dropRate: number;
  /** Timestamp of measurement */
  measuredAt: number;
}
