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
  StreamClip,
  APIResponse,
  ArrayResponse,
  Pagination,
  GetLiveCoinsParams,
  GetStreamClipsParams,
  VideoStreamAnalysis,
  StreamStatistics,
  JurisdictionResponse,
  SolPriceResponse,
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
  HTTPMethod,
  StreamStatus,
  EventHandler,
  AsyncEventHandler,
  DeepPartial,
} from './common.types';

// Export enum as value, not type
export { LogLevel } from './common.types';

export type {
  ClientState,
  ServiceState,
  RateLimitState,
  RateLimitInfo,
  RateLimiterState,
  StreamFilters,
  StreamAnalytics,
  StreamQualityMetrics,
} from './domain.types';

export type { APIError } from './common.types';

export {
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  LIVE_STREAMING_RATE_LIMIT_CONFIG,
  DEFAULT_LOGGER_CONFIG,
} from './config.types';
