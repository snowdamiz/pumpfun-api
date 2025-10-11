/**
 * Common TypeScript Interfaces for PumpFun API Discovery
 *
 * Contains base types, interfaces, and enums used throughout the API discovery system.
 */

/**
 * Log levels for logging system
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

/**
 * Error categories for classification
 */
export type ErrorCategory =
  | 'NETWORK'
  | 'AUTHENTICATION'
  | 'VALIDATION'
  | 'RATE_LIMIT'
  | 'SERVER'
  | 'NOT_FOUND'
  | 'CONFIGURATION'
  | 'DISCOVERY'
  | 'UNKNOWN';

/**
 * HTTP methods
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'WEBSOCKET';

/**
 * Authentication types
 */
export type AuthType = 'NONE' | 'BEARER_TOKEN' | 'API_KEY' | 'SESSION_COOKIE' | 'CUSTOM';

/**
 * Token location types
 */
export type TokenLocation = 'HEADER' | 'QUERY_PARAM' | 'COOKIE' | 'BODY';

/**
 * Stream status enum
 */
export enum StreamStatus {
  STARTING = 'STARTING',
  LIVE = 'LIVE',
  ENDING = 'ENDING',
  ENDED = 'ENDED',
  ERROR = 'ERROR',
}

/**
 * Event types for stream events
 */
export enum EventType {
  STREAM_STARTED = 'STREAM_STARTED',
  STREAM_ENDED = 'STREAM_ENDED',
  METADATA_UPDATED = 'METADATA_UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
}

/**
 * API response wrapper interface
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: string;
  headers?: Record<string, string>;
}

/**
 * Array response wrapper with pagination
 */
export interface ArrayResponse<T> extends APIResponse<T[]> {
  pagination?: Pagination;
}

/**
 * API error interface
 */
export interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: string;
  isRetryable: boolean;
}

/**
 * Pagination interface
 */
export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  page?: number;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit?: number;
  remaining?: number;
  resetTime?: number;
  retryAfter?: number;
}

/**
 * Rate limiting configuration
 */
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

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

/**
 * Log entry interface
 */
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

/**
 * Logging context
 */
export interface LogContext {
  component?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

/**
 * API endpoint information
 */
export interface APIEndpoint {
  endpointId: string;
  url: string;
  method: HTTPMethod;
  description?: string;
  discoveredAt: string;
  lastTested?: string;
  isActive: boolean;
  headers?: Record<string, string>;
  parameters?: EndpointParameters;
  responses?: EndpointResponses;
}

/**
 * Endpoint parameters
 */
export interface EndpointParameters {
  path?: Record<string, ParameterInfo>;
  query?: Record<string, ParameterInfo>;
  header?: Record<string, ParameterInfo>;
  body?: ParameterInfo;
}

/**
 * Parameter information
 */
export interface ParameterInfo {
  type: string;
  required: boolean;
  description: string;
  example?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

/**
 * Endpoint responses
 */
export interface EndpointResponses {
  [statusCode: number]: ResponseExample;
}

/**
 * Response example
 */
export interface ResponseExample {
  description: string;
  body: any;
  headers?: Record<string, string>;
}

/**
 * Request example
 */
export interface RequestExample {
  description: string;
  url: string;
  method: HTTPMethod;
  headers: Record<string, string>;
  body?: any;
}

/**
 * Stream information interface (to be updated based on discovery)
 */
export interface StreamInfo {
  streamId: string;
  token: TokenInfo;
  streamer: StreamerInfo;
  status: StreamStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  currentViewerCount: number;
  peakViewerCount: number;
  metadata?: StreamMetadata;
  thumbnailUrl?: string;
  quality?: string;
  videoUrl?: string;
}

/**
 * Stream summary (subset of StreamInfo)
 */
export interface StreamSummary {
  streamId: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  userId: string;
  username: string;
  status: StreamStatus;
  startTime: string;
  currentViewerCount: number;
  peakViewerCount: number;
  thumbnailUrl?: string;
  quality?: string;
}

/**
 * Token information
 */
export interface TokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  address?: string;
  imageUrl?: string;
  marketCap?: number;
  price?: number;
  currentStreamStatus?: StreamStatus;
  streamHistoryCount?: number;
  lastStreamActivity?: string;
  createdAt?: string;
}

/**
 * Streamer information
 */
export interface StreamerInfo {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  followerCount?: number;
  totalStreamCount?: number;
  activeStreamCount?: number;
  lastActivity?: string;
}

/**
 * Stream metadata
 */
export interface StreamMetadata {
  bitrate?: number;
  resolution?: string;
  frameRate?: number;
  videoCodec?: string;
  audioCodec?: string;
  fileSize?: number;
  viewerTimeline?: ViewerTimelinePoint[];
  platformData?: Record<string, any>;
}

/**
 * Viewer timeline point
 */
export interface ViewerTimelinePoint {
  timestamp: string;
  viewerCount: number;
}

/**
 * Stream event
 */
export interface StreamEvent {
  eventId: string;
  streamId: string;
  eventType: EventType;
  previousStatus?: StreamStatus;
  newStatus?: StreamStatus;
  eventData?: Record<string, any>;
  timestamp: string;
}

/**
 * User information
 */
export interface User {
  userId: string;
  username: string;
  avatarUrl?: string;
  isVerified?: boolean;
  followerCount?: number;
  totalStreamCount?: number;
  activeStreamCount?: number;
  lastActivity?: string;
}

/**
 * Streaming statistics
 */
export interface StreamingStatistics {
  totalStreams: number;
  totalDuration: number;
  averageViewers: number;
  peakViewers: number;
  currentStreak?: number;
}

/**
 * Stream analytics
 */
export interface StreamAnalytics {
  stream: StreamSummary;
  value: number;
  rank: number;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  activeStreams: number;
  totalViewers: number;
  streamsStarted24h: number;
  peakConcurrentViewers: number;
  topTokens: Array<{
    tokenId: string;
    tokenName: string;
    activeStreamCount: number;
  }>;
  topStreamers: Array<{
    userId: string;
    username: string;
    activeStreamCount: number;
    totalViewers: number;
  }>;
}

/**
 * Webhook information
 */
export interface Webhook {
  webhookId: string;
  url: string;
  events: EventType[];
  secret?: string;
  active: boolean;
  createdAt: string;
}

/**
 * Authentication request interface
 */
export interface AuthRequest {
  token: string;
  tokenType: 'bearer' | 'api_key';
}

/**
 * Authentication headers
 */
export interface AuthHeaders {
  Authorization?: string;
  'X-API-Key'?: string;
  Cookie?: string;
  [key: string]: string | undefined;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  type: AuthType;
  tokenHeader?: string;
  tokenPrefix?: string;
  additionalHeaders?: Record<string, string>;
}

/**
 * HTTP request configuration
 */
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  retryConfig?: Partial<RetryConfig>;
}

/**
 * API client interface
 */
export interface PumpFunStreamAPI {
  // Get active streams (endpoint to be discovered)
  getActiveStreams(params?: {
    status?: 'active' | 'inactive' | 'all';
    limit?: number;
    offset?: number;
    sort?: 'viewer_count' | 'start_time' | 'duration';
    order?: 'asc' | 'desc';
  }): Promise<APIResponse<StreamSummary[]>>;

  // Get stream details (endpoint to be discovered)
  getStreamDetails(streamId: string, params?: {
    include_history?: boolean;
    history_limit?: number;
  }): Promise<APIResponse<StreamDetails>>;

  // Get streams by token (endpoint to be discovered)
  getStreamsByToken(tokenId: string, params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<APIResponse<{
    token: TokenInfo;
    streams: StreamSummary[];
    statistics: StreamingStatistics;
  }>>;

  // WebSocket connection for real-time updates (to be discovered)
  connectToWebSocket?(params?: any): any;
}

/**
 * Stream details (extends StreamSummary with additional information)
 */
export interface StreamDetails extends StreamSummary {
  endTime?: string;
  duration?: number;
  videoUrl?: string;
  metadata?: StreamMetadata;
  historicalEvents?: StreamEvent[];
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  PUMPFUN_API_BASE_URL?: string;
  PUMPFUN_WS_URL?: string;
  PUMPFUN_API_KEY?: string;
  PUMPFUN_AUTH_TOKEN?: string;
  MAX_REQUESTS_PER_MINUTE?: string;
  RATE_LIMIT_DELAY_MS?: string;
  ENABLE_NETWORK_ANALYSIS?: string;
  ENABLE_RESPONSE_LOGGING?: string;
  TIMEOUT_MS?: string;
  LOG_LEVEL?: string;
  LOG_FILE_PATH?: string;
  NODE_ENV?: string;
  DEBUG?: string;
}

/**
 * Discovery progress
 */
export interface DiscoveryProgress {
  stage: string;
  progress: number;
  total: number;
  percentage: number;
  details?: any;
}

/**
 * Network request information
 */
export interface NetworkRequest {
  id: string;
  url: string;
  method: HTTPMethod;
  headers: Record<string, string>;
  body?: any;
  timestamp: string;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: any;
    duration: number;
  };
}

/**
 * API discovery result
 */
export interface DiscoveryResult {
  endpoints: APIEndpoint[];
  authenticationMethods: AuthType[];
  rateLimits?: RateLimitInfo;
  patterns: string[];
  metadata: Record<string, any>;
  discoveredAt: string;
}

/**
 * Generic function to validate API response
 */
export interface ResponseValidator<T> {
  (response: any): response is T;
}

/**
 * Type guard utility
 */
export function isValidAPIResponse<T>(response: any, validator: ResponseValidator<T>): response is APIResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.success === 'boolean' &&
    typeof response.timestamp === 'string' &&
    (response.data === undefined || validator(response.data))
  );
}

/**
 * Utility to create a type guard
 */
export function createTypeGuard<T>(predicate: (obj: any) => obj is T): ResponseValidator<T> {
  return predicate;
}