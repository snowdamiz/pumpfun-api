/**
 * Content retrieval and filtering types
 *
 * Simplified types for stream content access and filtering
 */

import { StreamClip } from './api.types';

// ============================================================================
// Content Filtering Types
// ============================================================================

/**
 * Filters for stream content retrieval
 */
export interface ContentFilters {
  contentType?: 'all' | 'clips' | 'highlights' | 'previous_streams';
  clipType?: 'COMPLETE' | 'HIGHLIGHT' | 'all';
  includeHighlights?: boolean;
  includePreviousStreams?: boolean;
  includeClips?: boolean;
  limit?: number;
  maxHighlights?: number;
  maxPreviousStreams?: number;
  daysBack?: number;
  minDuration?: number;
  maxDuration?: number;
  minViewCount?: number;
  maxViewCount?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  hasUrl?: boolean;
  sortBy?: 'created_at' | 'duration' | 'view_count' | 'stream_start';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Result from stream content retrieval
 */
export interface StreamContent {
  totalCount: number;
  clips?: StreamClip[];
  highlights?: StreamClip[];
  previousStreams?: StreamClip[];
  contentSummary: {
    clipsCount: number;
    highlightsCount: number;
    previousStreamsCount: number;
  };
  metrics: {
    processingTimeMs: number;
    filtersApplied: number;
  };
  appliedFilters: Record<string, any>;
}