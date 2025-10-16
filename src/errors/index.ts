/**
 * Simplified error handling system
 *
 * Consolidated error classes and utilities for the simplified API
 */

export { ValidationError } from '../utils/validation';
export { StreamError, ConnectionError, mapToStreamError, createContextualError } from '../utils/error-mapping';

// Re-export for convenience
export type {
  FilterCriteria,
  FilteredStreams,
  ContentFilters,
  StreamContent,
  StreamOptions,
  StreamConnection,
  VideoQuality,
  ConnectionState
} from '../types';