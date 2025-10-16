/**
 * Stream filtering and discovery types
 *
 * Simplified types for stream discovery and filtering functionality
 */

// ============================================================================
// Core Stream Filtering Types
// ============================================================================

/**
 * Simplified filter criteria for stream discovery
 */
export interface FilterCriteria {
  // Basic filters
  minParticipants?: number;
  maxParticipants?: number;
  limit?: number;
  offset?: number;

  // Advanced filters
  marketCapRange?: { min?: number; max?: number };
  createdTimeRange?: { start: string; end: string };
  hasSocialMedia?: { twitter?: boolean; telegram?: boolean };
  contentQuality?: {
    hasTitle?: boolean;
    hasDescription?: boolean;
    minTitleLength?: number;
    minDescriptionLength?: number;
  };

  // Search
  textPatterns?: {
    nameContains?: string[];
    symbolContains?: string[];
    excludePatterns?: string[];
  };

  // Sorting
  sortBy?: 'participants' | 'market_cap' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Result from stream filtering operation
 */
export interface FilteredStreams {
  streams: import('./api.types').LiveCoin[];
  totalCount: number;
  filteredOut: number;
  processingTimeMs: number;
  filtersApplied: string[];
}

// ============================================================================
// Content Types (reused from api.types for consistency)
// ============================================================================

export type { StreamClip } from './api.types';

// Type alias for LiveCoin for better naming consistency
export type LiveStream = import('./api.types').LiveCoin;

// ============================================================================
// Video Quality Types
// ============================================================================

/**
 * Video quality options for LiveKit streaming
 */
export type VideoQuality = 'auto' | 'high' | 'medium' | 'low';

/**
 * Stream connection options
 */
export interface StreamOptions {
  videoElement?: HTMLVideoElement | null;
  audioElement?: HTMLAudioElement | null;
  autoConnect?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  preferredQuality?: VideoQuality;
  maxReconnectAttempts?: number;
  reconnectDelayMs?: number;
  onConnected?: (connection: import('./connection.types').StreamConnection) => void;
  onDisconnected?: (connection: import('./connection.types').StreamConnection) => void;
  onError?: (error: Error, connection: import('./connection.types').StreamConnection) => void;
}