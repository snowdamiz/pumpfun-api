/**
 * Utilities exports for simplified API
 */

// Simplified API utilities
export * from './stream-helpers';
export { mapToStreamError, createContextualError, StreamError, ConnectionError } from './error-mapping';
export { isValidMintId, validateFilterCriteria, validateContentFilters } from './validation';

// Export DEFAULT_STREAM_OPTIONS from client
export { DEFAULT_STREAM_OPTIONS } from '../client/PumpFunClient';

/**
 * Parse stream URL to extract mint ID
 */
export function parseStreamUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1] || null;
  } catch {
    return null;
  }
}

// HTTP Client
export {
  HTTPClient,
  createHTTPClient,
  httpClient,
  APIError,
} from '../infrastructure/http/http-client';

// Logger
export { Logger, createLogger, logger } from '../infrastructure/logging/logger';

// Error Handler
export { ErrorHandler } from '../infrastructure/error-handling/error-handler';

// Configuration Manager
export { ConfigurationManager } from '../infrastructure/config/config-manager';

// Error Types
export * from '../infrastructure/error-handling/errors';

// ============================================================================
// Clip Utility Functions
// ============================================================================

import { StreamClip } from '../types';

/**
 * Clip processing utilities for duration calculation, metadata extraction, and analysis
 */

/**
 * Calculate total duration of multiple clips in seconds
 *
 * @param clips - Array of clips to calculate duration for
 * @returns Total duration in seconds
 */
export function calculateTotalClipDuration(clips: StreamClip[]): number {
  return clips.reduce((total, clip) => total + (clip.duration ?? 0), 0);
}

/**
 * Calculate average duration of clips in seconds
 *
 * @param clips - Array of clips to calculate average duration for
 * @returns Average duration in seconds, or 0 if no clips with duration
 */
export function calculateAverageClipDuration(clips: StreamClip[]): number {
  const clipsWithDuration = clips.filter(clip => clip.duration !== undefined);
  if (clipsWithDuration.length === 0) {
    return 0;
  }

  const totalDuration = calculateTotalClipDuration(clipsWithDuration);
  return totalDuration / clipsWithDuration.length;
}

/**
 * Format duration in seconds to human-readable string (MM:SS or HH:MM:SS)
 *
 * @param durationSeconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatClipDuration(durationSeconds: number): string {
  if (durationSeconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = Math.floor(durationSeconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Extract clip metadata and calculate derived metrics
 *
 * @param clip - Single clip to analyze
 * @returns Object with extracted metadata and calculated metrics
 */
export function extractClipMetadata(clip: StreamClip) {
  return {
    // Basic metadata
    id: clip.id,
    mintId: clip.mintId,
    clipType: clip.clipType,

    // Duration metrics
    hasDuration: clip.duration !== undefined,
    durationSeconds: clip.duration ?? 0,
    durationFormatted: clip.duration ? formatClipDuration(clip.duration) : 'Unknown',

    // Engagement metrics
    hasViewCount: clip.view_count !== undefined,
    viewCount: clip.view_count ?? 0,

    // Availability metrics
    hasUrl: !!(clip.clip_url && clip.clip_url.trim() !== ''),
    url: clip.clip_url ?? null,

    // Timestamp metadata
    hasCreatedAt: clip.created_at !== undefined,
    createdAt: clip.created_at ?? null,
    createdTimestamp: clip.created_at ? new Date(clip.created_at).getTime() : null,

    // Quality indicators
    isComplete: clip.clipType === 'COMPLETE',
    isHighlight: clip.clipType === 'HIGHLIGHT',
    hasAllMetadata: !!(clip.duration && clip.view_count && clip.created_at && clip.clip_url),
  };
}

/**
 * Calculate comprehensive clip statistics for an array of clips
 *
 * @param clips - Array of clips to analyze
 * @returns Object with calculated statistics
 */
export function calculateClipStatistics(clips: StreamClip[]) {
  const totalClips = clips.length;
  const completeClips = clips.filter(clip => clip.clipType === 'COMPLETE');
  const highlightClips = clips.filter(clip => clip.clipType === 'HIGHLIGHT');

  const clipsWithDuration = clips.filter(clip => clip.duration !== undefined);
  const clipsWithViewCount = clips.filter(clip => clip.view_count !== undefined);
  const clipsWithUrls = clips.filter(clip => clip.clip_url && clip.clip_url.trim() !== '');
  const clipsWithCreatedAt = clips.filter(clip => clip.created_at !== undefined);

  const totalDuration = calculateTotalClipDuration(clips);
  const averageDuration = calculateAverageClipDuration(clips);

  const totalViews = clips.reduce((sum, clip) => sum + (clip.view_count ?? 0), 0);
  const averageViews = clipsWithViewCount.length > 0 ? totalViews / clipsWithViewCount.length : 0;

  // Find most popular clip
  const mostPopularClip =
    clips.length > 0
      ? clips.reduce((most, current) =>
          (current.view_count ?? 0) > (most.view_count ?? 0) ? current : most
        )
      : undefined;

  // Find longest clip
  const longestClip =
    clips.length > 0
      ? clips.reduce((longest, current) =>
          (current.duration ?? 0) > (longest.duration ?? 0) ? current : longest
        )
      : undefined;

  return {
    // Basic counts
    totalClips,
    completeClips: completeClips.length,
    highlightClips: highlightClips.length,

    // Data completeness
    clipsWithDuration: clipsWithDuration.length,
    clipsWithViewCount: clipsWithViewCount.length,
    clipsWithUrls: clipsWithUrls.length,
    clipsWithCreatedAt: clipsWithCreatedAt.length,

    // Duration statistics
    totalDurationSeconds: totalDuration,
    averageDurationSeconds: averageDuration,
    totalDurationFormatted: formatClipDuration(totalDuration),
    averageDurationFormatted: formatClipDuration(averageDuration),

    // View statistics
    totalViews,
    averageViews: Math.round(averageViews),
    mostPopularClip: mostPopularClip
      ? {
          id: mostPopularClip.id,
          views: mostPopularClip.view_count ?? 0,
          duration: mostPopularClip.duration ?? 0,
          durationFormatted: mostPopularClip.duration
            ? formatClipDuration(mostPopularClip.duration)
            : 'Unknown',
        }
      : null,

    // Longest clip
    longestClip: longestClip
      ? {
          id: longestClip.id,
          duration: longestClip.duration ?? 0,
          durationFormatted: longestClip.duration
            ? formatClipDuration(longestClip.duration)
            : 'Unknown',
          views: longestClip.view_count ?? 0,
        }
      : null,

    // Quality metrics
    dataCompletenessRatio: {
      duration: clipsWithDuration.length / totalClips,
      viewCount: clipsWithViewCount.length / totalClips,
      url: clipsWithUrls.length / totalClips,
      createdAt: clipsWithCreatedAt.length / totalClips,
    },
  };
}

/**
 * Filter clips by duration criteria
 *
 * @param clips - Array of clips to filter
 * @param minDuration - Minimum duration in seconds (optional)
 * @param maxDuration - Maximum duration in seconds (optional)
 * @returns Filtered array of clips
 */
export function filterClipsByDuration(
  clips: StreamClip[],
  minDuration?: number,
  maxDuration?: number
): StreamClip[] {
  return clips.filter(clip => {
    const duration = clip.duration;
    if (duration === undefined) {
      return false;
    }

    if (minDuration !== undefined && duration < minDuration) {
      return false;
    }
    if (maxDuration !== undefined && duration > maxDuration) {
      return false;
    }

    return true;
  });
}

/**
 * Sort clips by duration
 *
 * @param clips - Array of clips to sort
 * @param order - Sort order ('ASC' for shortest first, 'DESC' for longest first)
 * @returns Sorted array of clips
 */
export function sortClipsByDuration(
  clips: StreamClip[],
  order: 'ASC' | 'DESC' = 'DESC'
): StreamClip[] {
  return [...clips].sort((a, b) => {
    const aDuration = a.duration ?? 0;
    const bDuration = b.duration ?? 0;
    return order === 'ASC' ? aDuration - bDuration : bDuration - aDuration;
  });
}

/**
 * Sort clips by view count
 *
 * @param clips - Array of clips to sort
 * @param order - Sort order ('ASC' for fewest views first, 'DESC' for most views first)
 * @returns Sorted array of clips
 */
export function sortClipsByViewCount(
  clips: StreamClip[],
  order: 'ASC' | 'DESC' = 'DESC'
): StreamClip[] {
  return [...clips].sort((a, b) => {
    const aViews = a.view_count ?? 0;
    const bViews = b.view_count ?? 0;
    return order === 'ASC' ? aViews - bViews : bViews - aViews;
  });
}

/**
 * Sort clips by creation date
 *
 * @param clips - Array of clips to sort
 * @param order - Sort order ('ASC' for oldest first, 'DESC' for newest first)
 * @returns Sorted array of clips
 */
export function sortClipsByCreationDate(
  clips: StreamClip[],
  order: 'ASC' | 'DESC' = 'DESC'
): StreamClip[] {
  return [...clips].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return order === 'ASC' ? aTime - bTime : bTime - aTime;
  });
}

/**
 * Group clips by type
 *
 * @param clips - Array of clips to group
 * @returns Object with clips grouped by type
 */
export function groupClipsByType(clips: StreamClip[]) {
  const complete = clips.filter(clip => clip.clipType === 'COMPLETE');
  const highlights = clips.filter(clip => clip.clipType === 'HIGHLIGHT');

  return {
    complete,
    highlights,
    counts: {
      complete: complete.length,
      highlights: highlights.length,
      total: clips.length,
    },
    statistics: {
      complete: calculateClipStatistics(complete),
      highlights: calculateClipStatistics(highlights),
    },
  };
}

/**
 * Find clips with missing metadata
 *
 * @param clips - Array of clips to analyze
 * @returns Object with clips categorized by missing metadata
 */
export function findClipsWithMissingMetadata(clips: StreamClip[]) {
  const missingDuration = clips.filter(clip => clip.duration === undefined);
  const missingViewCount = clips.filter(clip => clip.view_count === undefined);
  const missingUrl = clips.filter(clip => !clip.clip_url || clip.clip_url.trim() === '');
  const missingCreatedAt = clips.filter(clip => clip.created_at === undefined);

  // Find clips missing multiple metadata fields
  const incompleteClips = clips.filter(clip => {
    const missingFields = [];
    if (clip.duration === undefined) {
      missingFields.push('duration');
    }
    if (clip.view_count === undefined) {
      missingFields.push('view_count');
    }
    if (!clip.clip_url || clip.clip_url.trim() === '') {
      missingFields.push('clip_url');
    }
    if (clip.created_at === undefined) {
      missingFields.push('created_at');
    }

    return missingFields.length > 0;
  });

  return {
    missingDuration,
    missingViewCount,
    missingUrl,
    missingCreatedAt,
    incompleteClips,
    counts: {
      missingDuration: missingDuration.length,
      missingViewCount: missingViewCount.length,
      missingUrl: missingUrl.length,
      missingCreatedAt: missingCreatedAt.length,
      incompleteClips: incompleteClips.length,
      total: clips.length,
    },
    completenessRatio: 1 - incompleteClips.length / clips.length,
  };
}

/**
 * Validate clip data integrity
 *
 * @param clip - Single clip to validate
 * @returns Object with validation results
 */
export function validateClipData(clip: StreamClip) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!clip.id || clip.id.trim() === '') {
    errors.push('Clip ID is required');
  }

  if (!clip.mintId || clip.mintId.trim() === '') {
    errors.push('Mint ID is required');
  }

  if (!['COMPLETE', 'HIGHLIGHT'].includes(clip.clipType)) {
    errors.push('Clip type must be either COMPLETE or HIGHLIGHT');
  }

  // Optional field validation
  if (clip.duration !== undefined) {
    if (typeof clip.duration !== 'number' || clip.duration < 0) {
      errors.push('Duration must be a non-negative number');
    } else if (clip.duration > 7200) {
      // 2 hours
      warnings.push('Duration exceeds 2 hours - possible data error');
    }
  }

  if (clip.view_count !== undefined) {
    if (typeof clip.view_count !== 'number' || clip.view_count < 0) {
      errors.push('View count must be a non-negative number');
    }
  }

  if (clip.created_at) {
    const createdDate = new Date(clip.created_at);
    if (isNaN(createdDate.getTime())) {
      errors.push('Created at timestamp is invalid');
    } else if (createdDate > new Date()) {
      warnings.push('Created at timestamp is in the future');
    } else if (createdDate < new Date('2020-01-01')) {
      warnings.push('Created at timestamp is very old - possible data error');
    }
  }

  if (clip.clip_url && clip.clip_url.trim() !== '') {
    try {
      new URL(clip.clip_url);
    } catch {
      errors.push('Clip URL is not a valid URL');
    }
  }

  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    completeness: {
      hasDuration: clip.duration !== undefined,
      hasViewCount: clip.view_count !== undefined,
      hasUrl: !!(clip.clip_url && clip.clip_url.trim() !== ''),
      hasCreatedAt: clip.created_at !== undefined,
    },
  };
}

/**
 * Create a clip analysis report for display or logging
 *
 * @param clips - Array of clips to analyze
 * @returns Formatted report object
 */
export function createClipAnalysisReport(clips: StreamClip[]) {
  const stats = calculateClipStatistics(clips);
  const grouped = groupClipsByType(clips);
  const missingMetadata = findClipsWithMissingMetadata(clips);

  // Validate all clips
  const validationResults = clips.map(clip => ({
    id: clip.id,
    ...validateClipData(clip),
  }));

  const validClips = validationResults.filter(result => result.isValid);
  const invalidClips = validationResults.filter(result => !result.isValid);
  const clipsWithWarnings = validationResults.filter(result => result.hasWarnings);

  return {
    summary: {
      totalClips: stats.totalClips,
      validClips: validClips.length,
      invalidClips: invalidClips.length,
      clipsWithWarnings: clipsWithWarnings.length,
      completenessRatio: missingMetadata.completenessRatio,
    },
    statistics: stats,
    groupBreakdown: grouped,
    metadataIssues: missingMetadata,
    qualityMetrics: {
      validClipRatio: validClips.length / clips.length,
      averageDataCompleteness:
        (stats.dataCompletenessRatio.duration +
          stats.dataCompletenessRatio.viewCount +
          stats.dataCompletenessRatio.url +
          stats.dataCompletenessRatio.createdAt) /
        4,
    },
    recommendations: generateClipRecommendations(stats, missingMetadata),
  };
}

/**
 * Generate recommendations based on clip analysis
 *
 * @param stats - Calculated clip statistics
 * @param missingMetadata - Missing metadata analysis
 * @returns Array of recommendation strings
 */
function generateClipRecommendations(stats: any, missingMetadata: any): string[] {
  const recommendations: string[] = [];

  if (missingMetadata.completenessRatio < 0.8) {
    recommendations.push('Consider enriching clip metadata to improve data completeness');
  }

  if (stats.clipsWithUrls / stats.totalClips < 0.5) {
    recommendations.push('Many clips lack playback URLs - check clip generation process');
  }

  if (stats.averageDurationSeconds < 30) {
    recommendations.push('Average clip duration is quite short - consider longer highlights');
  }

  if (stats.averageViews < 100) {
    recommendations.push('Low average view count - consider improving clip promotion');
  }

  if (stats.completeClips > stats.highlightClips * 3) {
    recommendations.push('Consider generating more highlight clips for better engagement');
  }

  if (recommendations.length === 0) {
    recommendations.push('Clip data quality looks good - no specific recommendations');
  }

  return recommendations;
}
