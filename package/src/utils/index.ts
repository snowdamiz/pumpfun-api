/**
 * Utilities exports for backward compatibility
 *
 * This file re-exports utilities from the new infrastructure structure
 * to maintain backward compatibility with existing imports.
 */

// HTTP Client
export {
  HTTPClient,
  createHTTPClient,
  httpClient,
  APIError,
} from '../infrastructure/http/http-client';

// Logger
export { Logger, createLogger, logger } from '../infrastructure/logging/logger';

// Rate Limiter
export {
  RateLimiter,
  createRateLimiter,
  createLiveStreamingRateLimiter,
  rateLimiter,
} from '../infrastructure/rate-limiting/rate-limiter';

// Error Handler
export { ErrorHandler } from '../infrastructure/error-handling/error-handler';

// Configuration Manager
export { ConfigurationManager } from '../infrastructure/config/config-manager';

// Error Types
export * from '../infrastructure/error-handling/errors';
