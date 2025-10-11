/**
 * PumpFun Streaming API TypeScript Interfaces
 *
 * Complete TypeScript interface definitions for all PumpFun streaming API endpoints
 * based on the discovered API specification and OpenAPI schema.
 *
 * Created: 2025-10-11
 * Purpose: T023 - Create streaming API interfaces based on discovered responses
 */

import { StreamStatus, EventType, Pagination } from './common';

/**
 * Stream Summary Interface
 * Basic stream information returned by list endpoints
 */
export interface StreamSummary {
  /** Unique stream identifier */
  streamId: string;

  /** Associated token identifier */
  tokenId: string;

  /** Token name */
  tokenName: string;

  /** Token symbol */
  tokenSymbol: string;

  /** Streamer user identifier */
  userId: string;

  /** Streamer username */
  username: string;

  /** Current stream status */
  status: StreamStatus;

  /** Stream start time (ISO 8601) */
  startTime: string;

  /** Current number of viewers */
  currentViewerCount: number;

  /** Peak number of viewers */
  peakViewerCount: number;

  /** Stream thumbnail URL */
  thumbnailUrl?: string;

  /** Stream quality (e.g., "1080p") */
  quality?: string;
}

/**
 * Stream Details Interface
 * Complete stream information with extended metadata
 */
export interface StreamDetails extends StreamSummary {
  /** Stream end time (ISO 8601) */
  endTime?: string;

  /** Stream duration in seconds */
  duration?: number;

  /** Live stream video URL */
  videoUrl?: string;

  /** Stream metadata and technical details */
  metadata?: StreamMetadata;

  /** Historical stream events */
  historicalEvents?: StreamEvent[];
}

/**
 * Stream Metadata Interface
 * Technical details about the stream
 */
export interface StreamMetadata {
  /** Video bitrate in kbps */
  bitrate?: number;

  /** Video resolution (e.g., "1920x1080") */
  resolution?: string;

  /** Video frame rate */
  frameRate?: number;

  /** Video codec (e.g., "H.264") */
  videoCodec?: string;

  /** Audio codec (e.g., "AAC") */
  audioCodec?: string;

  /** Estimated file size in bytes */
  fileSize?: number;

  /** Viewer count timeline data */
  viewerTimeline?: ViewerTimelinePoint[];

  /** Platform-specific additional data */
  platformData?: Record<string, any>;
}

/**
 * Viewer Timeline Point Interface
 * Single data point in viewer count timeline
 */
export interface ViewerTimelinePoint {
  /** Timestamp of the data point (ISO 8601) */
  timestamp: string;

  /** Number of viewers at this timestamp */
  viewerCount: number;
}

/**
 * Stream Event Interface
 * Events that occur during stream lifecycle
 */
export interface StreamEvent {
  /** Unique event identifier */
  eventId: string;

  /** Associated stream identifier */
  streamId: string;

  /** Type of event */
  eventType: EventType;

  /** Previous stream status (for status changes) */
  previousStatus?: StreamStatus;

  /** New stream status (for status changes) */
  newStatus?: StreamStatus;

  /** Additional event data */
  eventData?: Record<string, any>;

  /** Event timestamp (ISO 8601) */
  timestamp: string;
}

/**
 * Stream Request Parameters Interface
 * Parameters for stream-related API requests
 */
export interface StreamsRequestParams {
  /** Filter by stream status */
  status?: 'active' | 'inactive' | 'all';

  /** Maximum number of streams to return (1-1000) */
  limit?: number;

  /** Number of streams to skip for pagination */
  offset?: number;

  /** Sort field for streams */
  sort?: 'viewer_count' | 'start_time' | 'duration';

  /** Sort direction */
  order?: 'asc' | 'desc';
}

/**
 * Stream Details Request Parameters Interface
 * Parameters for getting detailed stream information
 */
export interface StreamDetailsParams {
  /** Include historical stream data */
  include_history?: boolean;

  /** Maximum number of historical streams to return */
  history_limit?: number;
}

/**
 * Stream Events Request Parameters Interface
 * Parameters for getting stream events
 */
export interface StreamEventsParams {
  /** Filter by event type */
  event_type?: EventType;

  /** Maximum number of events to return */
  limit?: number;

  /** Return events since this timestamp (ISO 8601) */
  since?: string;
}

/**
 * Streams Response Interface
 * Response format for streams list endpoint
 */
export interface StreamsResponse {
  /** List of streams */
  streams: StreamSummary[];

  /** Pagination information */
  pagination: Pagination;
}

/**
 * Stream Details Response Interface
 * Response format for stream details endpoint
 */
export interface StreamDetailsResponse extends StreamDetails {
  /** Additional properties from StreamDetails */
  historicalEvents?: StreamEvent[];
}

/**
 * Stream Events Response Interface
 * Response format for stream events endpoint
 */
export interface StreamEventsResponse {
  /** List of stream events */
  events: StreamEvent[];
}

/**
 * Token Information Interface
 * Basic token information associated with streams
 */
export interface TokenInfo {
  /** Unique token identifier */
  tokenId: string;

  /** Token name */
  name: string;

  /** Token symbol */
  symbol: string;

  /** Current stream status */
  currentStreamStatus?: StreamStatus;

  /** Number of streams in history */
  streamHistoryCount?: number;

  /** Last stream activity timestamp */
  lastStreamActivity?: string;

  /** Token creation timestamp */
  createdAt?: string;
}

/**
 * Token Details Interface
 * Extended token information
 */
export interface TokenDetails extends TokenInfo {
  /** Token contract address */
  address?: string;

  /** Token image URL */
  imageUrl?: string;

  /** Token market cap */
  marketCap?: number;

  /** Token price */
  price?: number;
}

/**
 * Token Request Parameters Interface
 * Parameters for token-related API requests
 */
export interface TokensRequestParams {
  /** Search tokens by name or symbol */
  search?: string;

  /** Filter tokens with active streams */
  has_active_stream?: boolean;

  /** Maximum number of tokens to return */
  limit?: number;

  /** Number of tokens to skip for pagination */
  offset?: number;
}

/**
 * Token Streaming History Request Parameters Interface
 */
export interface TokenStreamingHistoryParams {
  /** Start date for history query (ISO 8601) */
  start_date?: string;

  /** End date for history query (ISO 8601) */
  end_date?: string;

  /** Maximum number of streams to return */
  limit?: number;
}

/**
 * Tokens Response Interface
 * Response format for tokens list endpoint
 */
export interface TokensResponse {
  /** List of tokens */
  tokens: TokenInfo[];

  /** Pagination information */
  pagination: Pagination;
}

/**
 * Token Streaming History Response Interface
 * Response format for token streaming history endpoint
 */
export interface TokenStreamingHistoryResponse {
  /** Token information */
  token: TokenDetails;

  /** List of streams */
  streams: StreamSummary[];

  /** Streaming statistics */
  statistics: StreamingStatistics;
}

/**
 * User Information Interface
 * Basic user information
 */
export interface UserInfo {
  /** Unique user identifier */
  userId: string;

  /** Username */
  username: string;

  /** Avatar URL */
  avatarUrl?: string;

  /** Verification status */
  isVerified?: boolean;

  /** Number of followers */
  followerCount?: number;

  /** Total number of streams */
  totalStreamCount?: number;

  /** Number of active streams */
  activeStreamCount?: number;

  /** Last activity timestamp */
  lastActivity?: string;
}

/**
 * User Streaming History Request Parameters Interface
 */
export interface UserStreamingHistoryParams {
  /** Include currently active streams */
  include_active?: boolean;

  /** Maximum number of streams to return */
  limit?: number;
}

/**
 * User Streaming History Response Interface
 * Response format for user streaming history endpoint
 */
export interface UserStreamingHistoryResponse {
  /** User information */
  user: UserInfo;

  /** Currently active streams */
  active_streams: StreamSummary[];

  /** Historical streams */
  historical_streams: StreamSummary[];
}

/**
 * Streaming Statistics Interface
 * Statistics about streaming activity
 */
export interface StreamingStatistics {
  /** Total number of streams */
  totalStreams: number;

  /** Total streaming duration in seconds */
  totalDuration: number;

  /** Average number of viewers */
  averageViewers: number;

  /** Peak number of viewers */
  peakViewers: number;

  /** Current streaming streak */
  currentStreak?: number;
}

/**
 * Analytics Request Parameters Interface
 */
export interface TopStreamsParams {
  /** Metric to rank streams by */
  metric: 'viewer_count' | 'duration' | 'peak_viewers';

  /** Time range for analytics */
  time_range: '1h' | '24h' | '7d' | '30d';

  /** Maximum number of streams to return */
  limit?: number;
}

/**
 * Stream Analytics Interface
 * Analytics data for a specific stream
 */
export interface StreamAnalytics {
  /** Stream information */
  stream: StreamSummary;

  /** Metric value */
  value: number;

  /** Rank in the analytics */
  rank: number;
}

/**
 * Top Streams Response Interface
 * Response format for top streams analytics endpoint
 */
export interface TopStreamsResponse {
  /** Metric used for ranking */
  metric: string;

  /** Time range for analytics */
  time_range: string;

  /** List of top streams */
  streams: StreamAnalytics[];
}

/**
 * Dashboard Statistics Interface
 * Overall system statistics
 */
export interface DashboardStatistics {
  /** Number of currently active streams */
  activeStreams: number;

  /** Total number of current viewers */
  totalViewers: number;

  /** Number of streams started in last 24 hours */
  streamsStarted24h: number;

  /** Peak concurrent viewers */
  peakConcurrentViewers: number;

  /** Top tokens by activity */
  topTokens: Array<{
    tokenId: string;
    tokenName: string;
    activeStreamCount: number;
  }>;

  /** Top streamers by viewers */
  topStreamers: Array<{
    userId: string;
    username: string;
    activeStreamCount: number;
    totalViewers: number;
  }>;
}

/**
 * Webhook Event Types
 * Events that can trigger webhook notifications
 */
export type WebhookEventType =
  | 'STREAM_STARTED'
  | 'STREAM_ENDED'
  | 'METADATA_UPDATED';

/**
 * Webhook Registration Interface
 * Request body for webhook registration
 */
export interface WebhookRegistration {
  /** Webhook URL */
  url: string;

  /** Events to subscribe to */
  events: WebhookEventType[];

  /** Optional secret for webhook signature validation */
  secret?: string;

  /** Whether webhook is active */
  active?: boolean;
}

/**
 * Webhook Information Interface
 * Registered webhook information
 */
export interface WebhookInfo {
  /** Unique webhook identifier */
  webhookId: string;

  /** Webhook URL */
  url: string;

  /** Subscribed events */
  events: WebhookEventType[];

  /** Webhook secret */
  secret?: string;

  /** Active status */
  active: boolean;

  /** Creation timestamp */
  createdAt: string;
}

/**
 * Stream Quality Options
 * Available stream quality levels
 */
export type StreamQuality =
  | '240p'
  | '360p'
  | '480p'
  | '720p'
  | '1080p'
  | '4K';

/**
 * Stream Sort Options
 * Available sorting options for streams
 */
export type StreamSortOption =
  | 'viewer_count'
  | 'start_time'
  | 'duration'
  | 'peak_viewers';

/**
 * Sort Direction Options
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Time Range Options
 * Available time ranges for analytics
 */
export type TimeRangeOption =
  | '1h'
  | '24h'
  | '7d'
  | '30d';

/**
 * Analytics Metric Options
 * Available metrics for analytics
 */
export type AnalyticsMetric =
  | 'viewer_count'
  | 'duration'
  | 'peak_viewers';

/**
 * Stream Filter Options
 * Options for filtering streams
 */
export interface StreamFilters {
  /** Stream status filter */
  status?: StreamStatus | 'active' | 'inactive' | 'all';

  /** Minimum viewer count filter */
  minViewers?: number;

  /** Maximum viewer count filter */
  maxViewers?: number;

  /** Quality filter */
  quality?: StreamQuality;

  /** Token filter */
  tokenId?: string;

  /** User filter */
  userId?: string;

  /** Time range filter */
  startedAfter?: string;

  /** Time range filter */
  startedBefore?: string;
}

/**
 * Stream Search Options
 * Options for searching streams
 */
export interface StreamSearchOptions extends StreamFilters {
  /** Search query */
  query?: string;

  /** Search in fields */
  searchIn?: Array<'title' | 'description' | 'username' | 'tokenName' | 'tokenSymbol'>;

  /** Sort options */
  sortBy?: StreamSortOption;

  /** Sort direction */
  sortOrder?: SortDirection;
}

/**
 * Type guards for runtime validation
 */
export const isStreamSummary = (obj: any): obj is StreamSummary => {
  return obj &&
    typeof obj.streamId === 'string' &&
    typeof obj.tokenId === 'string' &&
    typeof obj.tokenName === 'string' &&
    typeof obj.tokenSymbol === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.username === 'string' &&
    Object.values(StreamStatus).includes(obj.status) &&
    typeof obj.startTime === 'string' &&
    typeof obj.currentViewerCount === 'number' &&
    typeof obj.peakViewerCount === 'number';
};

export const isStreamDetails = (obj: any): obj is StreamDetails => {
  return isStreamSummary(obj) &&
    ((obj as StreamDetails).endTime === undefined || typeof (obj as StreamDetails).endTime === 'string') &&
    ((obj as StreamDetails).duration === undefined || typeof (obj as StreamDetails).duration === 'number') &&
    ((obj as StreamDetails).videoUrl === undefined || typeof (obj as StreamDetails).videoUrl === 'string');
};

export const isStreamEvent = (obj: any): obj is StreamEvent => {
  return obj &&
    typeof obj.eventId === 'string' &&
    typeof obj.streamId === 'string' &&
    Object.values(EventType).includes(obj.eventType) &&
    typeof obj.timestamp === 'string';
};

export const isTokenInfo = (obj: any): obj is TokenInfo => {
  return obj &&
    typeof obj.tokenId === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.symbol === 'string';
};

export const isUserInfo = (obj: any): obj is UserInfo => {
  return obj &&
    typeof obj.userId === 'string' &&
    typeof obj.username === 'string';
};