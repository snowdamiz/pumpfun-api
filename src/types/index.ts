/**
 * Main types module exports
 *
 * Simplified types exports for the new API structure.
 */

// Export simplified API types
export * from './stream.types';
export * from './content.types';
export * from './connection.types';

// Export core API types that are still needed
export type {
  LiveCoin,
  LiveStreamInfo,
  LiveKitConnectionInfo,
  LiveKitRegion,
  StreamClip,
  StreamHistoryResult,
  GetLiveCoinsParams,
  GetStreamClipsParams,
  SearchLiveStreamsParams,
  StreamSearchResult,
  VideoStreamAnalysis,
  StreamStatistics,
  JurisdictionResponse,
  JoinLiveStreamResponse,
  StreamContentFilters,
  StreamContentResult
} from './api.types';

// Export configuration-related types
export * from './config.types';

// Export domain model types
export * from './domain.types';

// Export common utility types
export * from './common.types';

// Export NUMERIC_CONSTANTS as value to avoid type/value issues
export { NUMERIC_CONSTANTS } from './common.types';

export type {
  ClientConfig,
  RetryConfig,
  RateLimitConfig,
  LoggerConfig,
  ValidatedConfig,
  ErrorHandlerConfig,
  PerformanceMetrics,
  HTTPClientConfig,
} from './config.types';

export type {
  LogContext,
  LogEntry,
} from './common.types';

// Export ConnectionState from domain.types
export { ConnectionState } from './domain.types';

export type {
  ClientState,
  ServiceState,
  RateLimitState,
  RateLimitInfo,
  RateLimiterState,
  ConnectionConfig,
} from './domain.types';

export type { APIError } from './common.types';

export {
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  LIVE_STREAMING_RATE_LIMIT_CONFIG,
  DEFAULT_LOGGER_CONFIG,
} from './config.types';