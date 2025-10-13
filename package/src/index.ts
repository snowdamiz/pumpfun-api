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

// Main exports will be added here as we implement the client
export * from './client/PumpFunAPIClient';
export * from './client/types';
export * from './utils/errors';

// Re-export commonly used utilities
export { HTTPClient, createHTTPClient, httpClient } from './utils/http-client';
export { Logger } from './utils/logger';
export {
  RateLimiter,
  createRateLimiter,
  createLiveStreamingRateLimiter,
  rateLimitMiddleware,
  liveStreamingRateLimitMiddleware,
  rateLimiter,
  RateLimitUtils
} from './utils/rate-limiter';

// Default export
import { PumpFunAPIClient } from './client/PumpFunAPIClient';
export default PumpFunAPIClient;
