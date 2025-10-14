/**
 * Main types module exports
 *
 * Centralizes all type exports from the different type modules.
 */

// Export all API-related types
export * from './api.types';

// Export all configuration-related types
export * from './config.types';

// Export all domain model types
export * from './domain.types';

// Export all common utility types
export * from './common.types';

// Export NUMERIC_CONSTANTS as value to avoid type/value issues
export { NUMERIC_CONSTANTS } from './common.types';

// Re-export commonly used types for convenience
export type {
  LiveCoin,
  LiveStreamInfo,
  LiveKitConnectionInfo,
  LiveKitRegion,
  StreamClip,
  APIResponse,
  ArrayResponse,
  Pagination,
  GetLiveCoinsParams,
  GetStreamClipsParams,
  SearchLiveStreamsParams,
  StreamSearchResult,
  VideoStreamAnalysis,
  StreamStatistics,
  JurisdictionResponse,
  SolPriceResponse,
  JoinLiveStreamResponse,
  StreamParticipant,
  StreamQualityMetrics,
  LiveStreamSession,
  StreamRecording,
} from './api.types';

export type {
  ClientConfig,
  RetryConfig,
  RateLimitConfig,
  LoggerConfig,
  ValidatedConfig,
  ErrorHandlerConfig,
  LiveStreamsServiceConfig,
  PerformanceMetrics,
  HTTPClientConfig,
} from './config.types';

export type {
  LogContext,
  LogEntry,
  EventHandler,
  AsyncEventHandler,
  DeepPartial,
} from './common.types';

// Export enums as values, not types
export { LogLevel, StreamStatus, HTTPMethod } from './api.types';

export type {
  ClientState,
  ServiceState,
  RateLimitState,
  RateLimitInfo,
  RateLimiterState,
  StreamFilters,
  StreamAnalytics,
} from './domain.types';

export type { APIError } from './common.types';

export {
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  LIVE_STREAMING_RATE_LIMIT_CONFIG,
  DEFAULT_LOGGER_CONFIG,
} from './config.types';

// Export advanced filtering types from stream-filters.service
export type {
  StreamFilterFunction,
  AdvancedFilterCriteria,
  AdvancedFilterResult,
  CompoundFilterQuery,
  FilterGroup,
} from '../services/live/stream-filters.service';
