/**
 * API-related TypeScript interfaces and types
 *
 * Contains all API request/response types, parameter interfaces,
 * configuration types, and API-specific type definitions.
 */

import { APIError } from './common.types';

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
  /** Clip type - COMPLETE = full previous stream, HIGHLIGHT = short segment */
  clipType: 'COMPLETE' | 'HIGHLIGHT';
  /** Clip duration in seconds */
  duration: number;
  /** View count (for HIGHLIGHT clips) */
  view_count?: number;
  /** Creation timestamp */
  created_at: string;
  /** Room name from LiveKit */
  roomName: string;
  /** Session identifier */
  sessionId: string;
  /** Stream start time */
  startTime: string;
  /** Stream end time */
  endTime: string;
  /** HLS playlist URL (for COMPLETE clips) */
  playlistUrl?: string;
  /** Direct MP4 URL (for HIGHLIGHT clips) */
  mp4Url?: string;
  /** S3 key for MP4 file */
  mp4S3Key?: string;
  /** MP4 file size in bytes */
  mp4SizeBytes?: number;
  /** MP4 creation timestamp */
  mp4CreatedAt?: string;
  /** Thumbnail URL */
  thumbnailUrl: string;
  /** S3 key for thumbnail */
  thumbnailS3Key?: string;
  /** S3 key for playlist */
  playlistS3Key?: string;
  /** Whether clip is hidden */
  hidden: boolean;
  /** Address of user who created highlight (for HIGHLIGHT clips) */
  highlightCreatorAddress?: string;
  /** Legacy clip URL field (deprecated) */
  clip_url?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from jurisdiction validation endpoint
 */
export interface JurisdictionResponse {
  /** Whether the jurisdiction is valid */
  valid: boolean;
}

// ============================================================================
// Request Parameters
// ============================================================================

/**
 * Parameters for legacy getLiveCoins request (deprecated - use StreamOptions)
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
 * Options for consolidated getLiveStreams request
 */
export interface StreamOptions {
  /** Minimum number of participants required */
  minParticipants?: number;
  /** Maximum number of streams to return */
  limit?: number;
  /** Include only streams with meaningful titles */
  includeTitledOnly?: boolean;
  /** Sort streams by specific criteria */
  sortBy?: 'participants' | 'default';
  /** Sort order for results */
  sortOrder?: 'asc' | 'desc';
  /** Include NSFW content */
  includeNsfw?: boolean;
  /** Number of items to skip (for pagination) */
  offset?: number;
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

/**
 * Comprehensive stream history result with statistics
 */
export interface StreamHistoryResult {
  /** Associated token mint */
  mintId: string;
  /** Previous complete streams */
  previousStreams: StreamClip[];
  /** Highlight segments */
  highlights: StreamClip[];
  /** All clips combined and sorted */
  allClips: StreamClip[];
  /** Number of previous streams */
  totalPreviousStreams: number;
  /** Number of highlights */
  totalHighlights: number;
  /** Total number of clips */
  totalClips: number;
  /** Total duration of all clips in seconds */
  totalDuration: number;
  /** Total views across all clips */
  totalViews: number;
  /** Average clip duration in seconds */
  averageDuration: number;
  /** When the history was retrieved */
  retrievedAt: string;
  /** Filters applied to the results */
  filters: {
    maxPreviousStreams?: number;
    maxHighlights?: number;
    daysBack?: number;
    sortBy?: string;
    sortOrder?: string;
  };
}

/**
 * Parameters for searchLiveStreams request
 */
export interface SearchLiveStreamsParams {
  /** Search keyword or phrase */
  keyword: string;
  /** Maximum number of results to return */
  limit?: number;
  /** Fields to search in (default: all fields) */
  searchIn?: ('name' | 'symbol' | 'description' | 'title')[];
  /** Minimum number of participants (optional filter) */
  minParticipants?: number;
  /** Whether to require currently live streams only */
  currentlyLiveOnly?: boolean;
  /** Sort order for results */
  sortBy?: 'relevance' | 'participants' | 'market_cap' | 'created_timestamp';
  /** Sort direction */
  sortOrder?: 'ASC' | 'DESC';
  /** Include NSFW content */
  includeNsfw?: boolean;
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

/**
 * Search result with relevance scoring
 */
export interface StreamSearchResult extends LiveCoin {
  /** Relevance score (0-1, higher is more relevant) */
  relevanceScore: number;
  /** Matched fields and their scores */
  matchedFields: {
    name?: number;
    symbol?: number;
    description?: number;
    title?: number;
  };
  /** Highlight snippets for matches */
  snippets?: {
    name?: string;
    symbol?: string;
    description?: string;
    title?: string;
  };
}

// ============================================================================
// Stream Status and State Types
// ============================================================================

/**
 * Enumeration for stream states
 */
export enum StreamStatus {
  /** Stream is initializing */
  STARTING = 'STARTING',
  /** Stream is actively running */
  LIVE = 'LIVE',
  /** Stream is shutting down */
  ENDING = 'ENDING',
  /** Stream has completed */
  ENDED = 'ENDED',
  /** Stream encountered error */
  ERROR = 'ERROR',
}

/**
 * Enumeration for logging levels
 */
export enum LogLevel {
  /** Detailed debugging information */
  DEBUG = 'DEBUG',
  /** General information messages */
  INFO = 'INFO',
  /** Warning messages */
  WARN = 'WARN',
  /** Error messages */
  ERROR = 'ERROR',
  /** Critical error messages */
  CRITICAL = 'CRITICAL',
}

/**
 * Enumeration for HTTP methods
 */
export enum HTTPMethod {
  /** Retrieve data */
  GET = 'GET',
  /** Create data */
  POST = 'POST',
  /** Update data */
  PUT = 'PUT',
  /** Remove data */
  DELETE = 'DELETE',
  /** Partial update */
  PATCH = 'PATCH',
  /** Retrieve headers */
  HEAD = 'HEAD',
  /** Retrieve options */
  OPTIONS = 'OPTIONS',
}

// ============================================================================
// Live Stream Join Types
// ============================================================================

/**
 * Response from joining a live stream
 */
export interface JoinLiveStreamResponse {
  /** Whether the join request was successful */
  success: boolean;
  /** Response message */
  message: string;
  /** Stream identifier (if successful) */
  streamId?: number;
  /** Room name for LiveKit (if successful) */
  roomName?: string;
  /** WebSocket connection URL (if successful) */
  websocketUrl?: string;
  /** Whether authentication is required */
  requiresAuthentication?: boolean;
  /** Error details (if failed) */
  error?: {
    code: string;
    details: string;
  };
}