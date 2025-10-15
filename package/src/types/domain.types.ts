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

// ============================================================================
// LiveKit Integration Types
// ============================================================================

/**
 * Enumeration for WebRTC connection states
 */
export enum ConnectionState {
  /** No active connection */
  DISCONNECTED = 'DISCONNECTED',
  /** Connection attempt in progress */
  CONNECTING = 'CONNECTING',
  /** Connection established and ready */
  CONNECTED = 'CONNECTED',
  /** Reconnection attempt in progress */
  RECONNECTING = 'RECONNECTING',
  /** Connection is being closed */
  DISCONNECTING = 'DISCONNECTING',
  /** Connection failed with error */
  FAILED = 'FAILED',
}

/**
 * TypeScript interface defining connection configuration including video/audio elements and event callbacks
 */
export interface LiveKitConnectionOptions {
  /** Target video element for playback */
  videoElement?: HTMLVideoElement | null;
  /** Target audio element for playback */
  audioElement?: HTMLAudioElement | null;
  /** Auto-connect on initialization */
  autoConnect?: boolean;
  /** Auto-play media */
  autoPlay?: boolean;
  /** Start muted */
  muted?: boolean;
  /** Enable video track */
  videoEnabled?: boolean;
  /** Enable audio track */
  audioEnabled?: boolean;
  /** Video quality preference */
  preferredQuality?: 'auto' | 'high' | 'medium' | 'low';
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Delay between reconnections */
  reconnectDelayMs?: number;
  /** Connection success callback */
  onConnected?: (connection: LiveStreamConnection) => void;
  /** Connection closed callback */
  onDisconnected?: (connection: LiveStreamConnection) => void;
  /** Error callback */
  onError?: (error: Error, connection: LiveStreamConnection) => void;
  /** Reconnection attempt callback */
  onReconnecting?: (connection: LiveStreamConnection) => void;
  /** State change callback */
  onStateChange?: (state: ConnectionState, connection: LiveStreamConnection) => void;
}

/**
 * Managed WebRTC connection object returned by connectToLiveStream() method
 */
export interface LiveStreamConnection {
  /** Unique connection identifier */
  id: string;
  /** Associated token mint */
  mintId: string;
  /** LiveKit room name */
  roomName: string;
  /** Current connection state */
  state: ConnectionState;
  /** Connection status */
  isConnected: boolean;
  /** Connection creation timestamp */
  createdAt: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Number of reconnections */
  reconnectionCount: number;
  /** Audio track */
  audioTrack?: MediaStreamTrack | null;
  /** Video track */
  videoTrack?: MediaStreamTrack | null;
  /** Combined media stream */
  mediaStream?: MediaStream | null;

  /**
   * Close connection and cleanup
   */
  disconnect(): Promise<void>;

  /**
   * Attempt reconnection
   */
  reconnect(): Promise<void>;

  /**
   * Get WebRTC statistics
   */
  getStats(): Promise<RTCStatsReport>;

  /**
   * Mute audio track
   */
  muteAudio(): void;

  /**
   * Unmute audio track
   */
  unmuteAudio(): void;

  /**
   * Mute video track
   */
  muteVideo(): void;

  /**
   * Unmute video track
   */
  unmuteVideo(): void;
}

/**
 * Default configuration for LiveKit connections
 */
export interface ConnectionConfig {
  /** Default maximum reconnection attempts */
  defaultMaxReconnectAttempts: number;
  /** Default reconnection delay */
  defaultReconnectDelayMs: number;
  /** Connection timeout */
  connectionTimeoutMs: number;
  /** Connection heartbeat interval */
  heartbeatIntervalMs: number;
  /** Enable WebRTC statistics collection */
  enableStatistics: boolean;
  /** Enable debug logging for connections */
  enableDebugLogging: boolean;
}
