export interface LiveCoin {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  twitter?: string;
  telegram?: string;
  creator: string;
  created_timestamp: number;
  market_cap: number;
  usd_market_cap: number;
  is_currently_live: boolean;
  livestream_title?: string;
  num_participants: number;
  reply_count: number;
  thumbnail: string;
  last_reply: number;
}

export interface LiveStreamInfo {
  id: number;
  supabaseId: number;
  mintId: string;
  creatorAddress: string;
  streamStartTimestamp: number;
  numParticipants: number;
  maxParticipants: number;
  isLive: boolean;
  downrankScore: number;
  title: string;
  mode: 'interactive' | 'broadcast';
}

export interface LiveKitConnectionInfo {
  regions: LiveKitRegion[];
  primaryServer: string;
  roomName: string;
  mintId: string;
  streamId: number;
  websocketUrl: string;
  requiresAuthentication: boolean;
}

export interface LiveKitRegion {
  region: string;
  url: string;
  distance: string;
}

export interface StreamClip {
  id: string;
  mintId: string;
  clipType: 'COMPLETE' | 'HIGHLIGHT';
  duration: number;
  view_count?: number;
  created_at: string;
  roomName: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  playlistUrl?: string;
  mp4Url?: string;
  mp4S3Key?: string;
  mp4SizeBytes?: number;
  mp4CreatedAt?: string;
  thumbnailUrl: string;
  thumbnailS3Key?: string;
  playlistS3Key?: string;
  hidden: boolean;
  highlightCreatorAddress?: string;
  clip_url?: string;
}

export interface GetLiveCoinsParams {
  offset?: number;
  limit?: number;
  sort?: 'currently_live' | 'market_cap' | 'participants';
  order?: 'ASC' | 'DESC';
  includeNsfw?: boolean;
}

export interface StreamOptions {
  minParticipants?: number;
  limit?: number;
  includeTitledOnly?: boolean;
  sortBy?: 'participants' | 'default';
  sortOrder?: 'asc' | 'desc';
  includeNsfw?: boolean;
  offset?: number;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface JoinLiveStreamResponse {
  success: boolean;
  message: string;
  streamId?: number;
  roomName?: string;
  websocketUrl?: string;
  requiresAuthentication?: boolean;
  error?: {
    code: string;
    details: string;
  };
}

export interface LogContext {
  component?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  mintId?: string;
  endpoint?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: LogContext;
  logger: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    activeTimers: number;
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
  };
}

export interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: string;
  isRetryable: boolean;
  originalError?: any;
}

export const NUMERIC_CONSTANTS = {
  RATE_LIMIT_TIMEOUT_MS: 60000,
  RATE_LIMIT_STATUS: 429,
  MAX_TIMEOUT: 300000,
  WS_CLOSE_NORMAL: 1000,
  WS_CLOSE_GOING_AWAY: 1001,
  WS_CLOSE_PROTOCOL_ERROR: 1002,
  WS_CLOSE_UNEXPECTED_DATA: 1003,
  WS_CLOSE_INCONSISTENT_DATA: 1007,
  WS_CLOSE_POLICY_VIOLATION: 1008,
  WS_CLOSE_MESSAGE_TOO_BIG: 1009,
  WS_CLOSE_MANDATORY_EXTENSION: 1010,
  WS_CLOSE_INTERNAL_ERROR: 1011,
  DEFAULT_BACKOFF_DELAY: 1000,
  MAX_BACKOFF_DELAY: 30000,
  STREAM_CHECK_INTERVAL: 30000,
  CONNECTION_TIMEOUT: 10000,
  BUFFER_SIZE: 8192,
  MAX_RETRY_ATTEMPTS: 3,
  RATE_LIMIT_WINDOW_SIZE: 60,
  RATE_LIMIT_WINDOW_MS: 60000,
  MIN_RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 30000,
  RECONNECT_DELAY_MULTIPLIER: 2,
  BURST_PROTECTION_THRESHOLD: 10,
  PERFORMANCE_METRICS_WINDOW: 100,
  LOG_ROTATION_THRESHOLD: 1000,
  MIN_RECOMMENDED_TIMEOUT: 5000,
  MAX_BASE_DELAY: 10000,
  MAX_MAX_DELAY: 300000,
  MAX_BACKOFF_FACTOR: 5,
  MAX_RATE_LIMIT_WINDOW_MS: 3600000,
} as const;

export interface ClientConfig {
  baseURL?: string;
  livestreamURL?: string;
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
  loggerConfig?: Partial<LoggerConfig>;
  rateLimitConfig?: Partial<RateLimitConfig>;
  wsURL?: string;
  apiKey?: string;
  authToken?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
  enableJitter?: boolean;
}

export interface RateLimitConfig {
  maxRequestsPerWindow: number;
  windowMs: number;
  enableRetryAfter: boolean;
  enableSlidingWindow: boolean;
  enableBurstProtection: boolean;
  maxBurst?: number;
  enableBackoff: boolean;
  baseBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableColors: boolean;
  enableTimestamps: boolean;
  enableStructuredLogs?: boolean;
  enablePerformanceLogging?: boolean;
  enableRequestLogging?: boolean;
  enableErrorTracking?: boolean;
  enableFileLogging?: boolean;
  enableFile?: boolean;
  logFilePath?: string;
  filePath?: string;
  customLogger?: (level: LogLevel, message: string, data?: any) => void;
}

export interface ValidatedConfig {
  baseURL: string;
  livestreamURL: string;
  timeout: number;
  wsURL: string;
  apiKey?: string;
  authToken?: string;
  loggerConfig?: Partial<typeof DEFAULT_LOGGER_CONFIG>;
  rateLimitConfig?: Partial<typeof DEFAULT_RATE_LIMIT_CONFIG>;
  retryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>;
}

export interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: number;
  errorRate: number;
}

export interface HTTPClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryConfig?: Partial<RetryConfig>;
  rateLimitConfig?: Partial<RateLimitConfig>;
  enablePerformanceMonitoring?: boolean;
  enableLogging?: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENOTFOUND'],
  enableJitter: true,
};

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

export interface StreamConnection {
  id: string;
  mintId: string;
  isConnected: boolean;
  state: ConnectionState;
  mediaStream?: MediaStream;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;

  // Connection management
  disconnect(): Promise<void>;
  reconnect(): Promise<void>;
  getStats(): Promise<RTCStatsReport>;

  // Media controls (convenience methods)
  toggleAudio(): Promise<void>;
  toggleVideo(): Promise<void>;
  muteAudio(): Promise<void>;
  unmuteAudio(): Promise<void>;
  muteVideo(): Promise<void>;
  unmuteVideo(): Promise<void>;
  setQuality(quality: VideoQuality): Promise<void>;

  // Event handlers
  onConnected?: (connection: StreamConnection) => void;
  onDisconnected?: (connection: StreamConnection) => void;
  onError?: (error: Error, connection: StreamConnection) => void;
  onQualityChanged?: (quality: VideoQuality) => void;
}

export interface ContentFilters {
  contentType?: 'all' | 'clips' | 'highlights' | 'previous_streams';
  clipType?: 'COMPLETE' | 'HIGHLIGHT' | 'all';
  includeHighlights?: boolean;
  includePreviousStreams?: boolean;
  includeClips?: boolean;
  limit?: number;
  maxHighlights?: number;
  maxPreviousStreams?: number;
  daysBack?: number;
  minDuration?: number;
  maxDuration?: number;
  minViewCount?: number;
  maxViewCount?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  hasUrl?: boolean;
  sortBy?: 'created_at' | 'duration' | 'view_count' | 'stream_start';
  sortOrder?: 'ASC' | 'DESC';
}

export interface StreamContent {
  totalCount: number;
  clips?: StreamClip[];
  highlights?: StreamClip[];
  previousStreams?: StreamClip[];
  contentSummary: {
    clipsCount: number;
    highlightsCount: number;
    previousStreamsCount: number;
  };
  metrics: {
    processingTimeMs: number;
    filtersApplied: number;
  };
  appliedFilters: Record<string, any>;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  DISCONNECTING = 'DISCONNECTING',
  FAILED = 'FAILED',
}

export interface LiveKitConnectionOptions {
  videoElement?: HTMLVideoElement | null;
  audioElement?: HTMLAudioElement | null;
  autoConnect?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  preferredQuality?: 'auto' | 'high' | 'medium' | 'low';
  maxReconnectAttempts?: number;
  reconnectDelayMs?: number;
  onConnected?: (connection: LiveStreamConnection) => void;
  onDisconnected?: (connection: LiveStreamConnection) => void;
  onError?: (error: Error, connection: LiveStreamConnection) => void;
  onReconnecting?: (connection: LiveStreamConnection) => void;
  onStateChange?: (state: ConnectionState, connection: LiveStreamConnection) => void;
}

export interface LiveStreamConnection {
  id: string;
  mintId: string;
  roomName: string;
  state: ConnectionState;
  isConnected: boolean;
  createdAt: number;
  lastActivity: number;
  reconnectionCount: number;
  audioTrack?: MediaStreamTrack | null;
  videoTrack?: MediaStreamTrack | null;
  mediaStream?: MediaStream | null;
  disconnect(): Promise<void>;
  reconnect(): Promise<void>;
  getStats(): Promise<RTCStatsReport>;
  muteAudio(): void;
  unmuteAudio(): void;
  muteVideo(): void;
  unmuteVideo(): void;
}

export interface FilterCriteria {
  minParticipants?: number;
  maxParticipants?: number;
  limit?: number;
  offset?: number;
  marketCapRange?: { min?: number; max?: number };
  createdTimeRange?: { start: string; end: string };
  hasSocialMedia?: { twitter?: boolean; telegram?: boolean };
  contentQuality?: {
    hasTitle?: boolean;
    hasDescription?: boolean;
    minTitleLength?: number;
    minDescriptionLength?: number;
  };
  textPatterns?: {
    nameContains?: string[];
    symbolContains?: string[];
    excludePatterns?: string[];
  };
  sortBy?: 'participants' | 'market_cap' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface FilteredStreams {
  streams: LiveCoin[];
  totalCount: number;
  filteredOut: number;
  processingTimeMs: number;
  filtersApplied: string[];
}

export type VideoQuality = 'auto' | 'high' | 'medium' | 'low';

export interface StreamOptions {
  videoElement?: HTMLVideoElement | null;
  audioElement?: HTMLAudioElement | null;
  autoConnect?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  preferredQuality?: VideoQuality;
  maxReconnectAttempts?: number;
  reconnectDelayMs?: number;
  onConnected?: (connection: StreamConnection) => void;
  onDisconnected?: (connection: StreamConnection) => void;
  onError?: (error: Error, connection: StreamConnection) => void;
}