/**
 * PumpFun API Client v2.0 - Simplified API
 *
 * A TypeScript client library for accessing PumpFun's streaming data API.
 * This simplified version consolidates 28+ methods down to 8 core methods
 * focused on essential user needs.
 *
 * @version 2.0.0
 * @author PumpFun Team
 */

// ============================================================================
// Main Exports (15 items instead of 40+)
// ============================================================================

// Core client
export { PumpFunClient } from './client/PumpFunClient';

// Convenience factory
export { createClient } from './factory';

// Core types
export type {
  FilterCriteria,
  FilteredStreams,
  ContentFilters,
  StreamContent,
  StreamOptions,
  StreamConnection,
  VideoQuality,
  ConnectionState
} from './types';

// Domain types
export type {
  StreamClip,
  LiveStreamInfo
} from './types/api.types';

// LiveStream type alias
export type { LiveStream } from './types/stream.types';

// Error handling
export {
  StreamError,
  ConnectionError,
  ValidationError
} from './errors';

// Utilities
export {
  isValidMintId,
  parseStreamUrl,
  DEFAULT_STREAM_OPTIONS
} from './utils';

// Default export
import { PumpFunClient } from './client/PumpFunClient';
export default PumpFunClient;