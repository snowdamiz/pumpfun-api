/**
 * PumpFun API Client
 *
 * A TypeScript client library for accessing PumpFun's streaming data API,
 * including live stream discovery, video stream analysis with LiveKit integration,
 * and comprehensive error handling.
 *
 * @version 1.0.0
 * @author PumpFun Team
 */

// Export all types
export * from './types';

// Export main client
export * from './client/PumpFunAPIClient';

// Export services explicitly to avoid conflicts
export { LiveStreamsService } from './services/live/live-streams.service';
export { LiveStreamInfoService } from './services/live/stream-info.service';
export { StreamFilters } from './services/live/stream-filters.service';
export { BaseService } from './services/base/base.service';

// Export infrastructure components explicitly to avoid conflicts
export { HTTPClient, createHTTPClient, httpClient } from './infrastructure/http/http-client';
export { Logger, createLogger, logger } from './infrastructure/logging/logger';
export {
  RateLimiter,
  createRateLimiter,
  createLiveStreamingRateLimiter,
  rateLimiter,
} from './infrastructure/rate-limiting/rate-limiter';
export { ErrorHandler } from './infrastructure/error-handling/error-handler';
export { ConfigurationManager } from './infrastructure/config/config-manager';
export * from './infrastructure/error-handling/errors';

// Export validation utilities
export * from './validation';

// Export constants
export * from './constants';

// Default export
import { PumpFunAPIClient } from './client/PumpFunAPIClient';
export default PumpFunAPIClient;
