// ============
// Main Exports
// ============

export { PumpFunClient } from './client/PumpFunClient';
export { createClient } from './factory';

// Utilities
export {
  isValidMintId,
  parseStreamUrl,
  DEFAULT_STREAM_OPTIONS
} from './utils';

// Type exports
export type {
  // API Response types
  LiveCoin,
  LiveStreamInfo,
  StreamClip,
  JoinLiveStreamResponse,
  FilteredStreams,
  StreamContent,

  // Configuration types
  ClientConfig,
  StreamOptions,
  GetLiveCoinsParams,
  FilterCriteria,
  ContentFilters,
  LiveKitConnectionOptions,
  LiveKitConnectionInfo,
  LiveKitRegion,

  // Connection and streaming types
  StreamConnection,
  LiveStreamConnection,

  // Error handling types
  APIError,
  LogContext,
  LogEntry,

// Error classes
  PumpFunError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ServerError,
  ConfigurationError,
  TimeoutError,
  LiveKitError,
  ErrorFactory,
  ErrorUtils,

  // Utility types
  HTTPClientConfig,
  PerformanceMetrics,
  RetryConfig,
  RateLimitConfig,
  LoggerConfig,
  ValidatedConfig
} from './types/types';

// Enum exports
export {
  LogLevel,
  ConnectionState
} from './types/types';

// Type utility exports
export type { VideoQuality } from './types/types';

// Constants exports
export {
  NUMERIC_CONSTANTS,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_LOGGER_CONFIG,
  DEFAULT_CLIENT_CONFIG
} from './types/types';

// Default export
import { PumpFunClient } from './client/PumpFunClient';
export default PumpFunClient;