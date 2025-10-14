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

// ============================================================================
// Enhanced Video Stream Types
// ============================================================================

/**
 * Enhanced stream participant information
 */
export interface StreamParticipant {
  /** Participant unique identifier */
  id: string;
  /** Participant display name */
  displayName?: string;
  /** Whether participant is audio muted */
  isAudioMuted: boolean;
  /** Whether participant is video muted */
  isVideoMuted: boolean;
  /** Whether participant is screen sharing */
  isScreenSharing: boolean;
  /** Participant join timestamp */
  joinedAt: string;
  /** Participant role in stream */
  role: 'host' | 'moderator' | 'speaker' | 'listener';
}

/**
 * Stream quality metrics
 */
export interface StreamQualityMetrics {
  /** Current video bitrate (kbps) */
  videoBitrate: number;
  /** Current audio bitrate (kbps) */
  audioBitrate: number;
  /** Video resolution */
  resolution: {
    width: number;
    height: number;
  };
  /** Frame rate (fps) */
  frameRate: number;
  /** Packet loss percentage */
  packetLoss: number;
  /** Round trip time (ms) */
  roundTripTime: number;
  /** Connection quality score */
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Live stream session information
 */
export interface LiveStreamSession {
  /** Session unique identifier */
  sessionId: string;
  /** Associated stream identifier */
  streamId: number;
  /** Session start timestamp */
  startedAt: string;
  /** Session end timestamp (if ended) */
  endedAt?: string;
  /** Session duration in seconds */
  duration: number;
  /** Peak participant count */
  peakParticipants: number;
  /** Total messages sent */
  totalMessages: number;
  /** Average quality metrics */
  averageQuality: StreamQualityMetrics;
  /** Session status */
  status: StreamStatus;
}

/**
 * Stream recording information
 */
export interface StreamRecording {
  /** Recording unique identifier */
  id: string;
  /** Associated stream identifier */
  streamId: number;
  /** Recording start timestamp */
  startedAt: string;
  /** Recording duration in seconds */
  duration: number;
  /** Recording file URL */
  recordingUrl: string;
  /** Recording file size in bytes */
  fileSize: number;
  /** Recording format */
  format: 'mp4' | 'webm' | 'mkv';
  /** Recording quality */
  quality: 'high' | 'medium' | 'low';
  /** Whether recording includes audio */
  hasAudio: boolean;
  /** Whether recording includes video */
  hasVideo: boolean;
  /** Recording thumbnail URL */
  thumbnailUrl?: string;
}
