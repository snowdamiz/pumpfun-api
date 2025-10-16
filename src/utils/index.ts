export * from './stream-helpers';
export { mapToStreamError, createContextualError, StreamError, ConnectionError } from './error-mapping';
export { isValidMintId, validateFilterCriteria, validateContentFilters } from './validation';
export { Logger, createLogger, logger } from '../infrastructure/logging/logger';
export { ConfigurationManager } from '../infrastructure/config/config-manager';
export * from '../infrastructure/error-handling/errors';
export { DEFAULT_STREAM_OPTIONS } from '../client/PumpFunClient';

export {
  HTTPClient,
  createHTTPClient,
  httpClient,
} from '../infrastructure/http/http-client';

// Export APIError from consolidated types
export { APIError } from '../types';

export function parseStreamUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1] || null;
  } catch {
    return null;
  }
}