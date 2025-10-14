/**
 * Stream Filters for PumpFun API Client
 *
 * This module contains all stream filtering and ranking operations
 * including active streams, top streams, and titled streams.
 */

import {
  LiveCoin,
  GetLiveCoinsParams,
  SearchLiveStreamsParams,
  StreamSearchResult,
  StreamClip,
} from '../../types';

// ============================================================================
// Advanced Filtering Types
// ============================================================================

/**
 * Custom filter function type for advanced filtering
 */
export type StreamFilterFunction = (stream: LiveCoin) => boolean;

/**
 * Complex filter criteria for advanced queries
 */
export interface AdvancedFilterCriteria {
  /** Custom filter functions */
  customFilters?: StreamFilterFunction[];
  /** Market cap range filter */
  marketCapRange?: {
    min?: number;
    max?: number;
  };
  /** Participant count range filter */
  participantRange?: {
    min?: number;
    max?: number;
  };
  /** Creation time range filter */
  createdTimeRange?: {
    after?: number;
    before?: number;
  };
  /** Last activity time range filter */
  lastActivityRange?: {
    after?: number;
    before?: number;
  };
  /** Social media presence filters */
  hasSocialMedia?: {
    twitter?: boolean;
    telegram?: boolean;
  };
  /** Content quality filters */
  contentQuality?: {
    hasTitle?: boolean;
    hasDescription?: boolean;
    hasImage?: boolean;
    minTitleLength?: number;
    minDescriptionLength?: number;
  };
  /** Stream activity filters */
  activityLevel?: {
    minReplyCount?: number;
    hasRecentActivity?: boolean; // activity within last hour
    maxIdleTime?: number; // minutes
  };
  /** Text pattern matching filters */
  textPatterns?: {
    nameContains?: string[];
    symbolContains?: string[];
    descriptionContains?: string[];
    titleContains?: string[];
    excludePatterns?: string[];
  };
  /** Creator-specific filters */
  creatorFilters?: {
    excludeCreators?: string[];
    includeCreators?: string[];
  };
}

/**
 * Advanced filter result with metadata
 */
export interface AdvancedFilterResult {
  /** Filtered streams */
  streams: LiveCoin[];
  /** Total number of streams before filtering */
  totalBeforeFilter: number;
  /** Number of streams filtered out */
  filteredOut: number;
  /** Applied filter criteria summary */
  appliedCriteria: {
    [key: string]: any;
  };
  /** Performance metrics */
  metrics: {
    processingTimeMs: number;
    filtersApplied: number;
  };
}

/**
 * Compound filter query with logical operators
 */
export interface CompoundFilterQuery {
  /** Filter groups combined with logical operators */
  groups: FilterGroup[];
  /** Logical operator between groups (AND/OR) */
  groupOperator?: 'AND' | 'OR';
}

/**
 * Group of filters with internal logical operator
 */
export interface FilterGroup {
  /** List of filter criteria */
  criteria: AdvancedFilterCriteria[];
  /** Logical operator within group (AND/OR) */
  operator?: 'AND' | 'OR';
}

// ============================================================================
// Stream Clip Filtering Types
// ============================================================================

/**
 * Stream clip filtering criteria
 */
export interface ClipFilterCriteria {
  /** Filter by clip type */
  clipType?: 'COMPLETE' | 'HIGHLIGHT';
  /** Filter by minimum duration in seconds */
  minDuration?: number;
  /** Filter by maximum duration in seconds */
  maxDuration?: number;
  /** Filter by minimum view count */
  minViewCount?: number;
  /** Filter by maximum view count */
  maxViewCount?: number;
  /** Filter by creation date range */
  createdDateRange?: {
    after?: string; // ISO date string
    before?: string; // ISO date string
  };
  /** Filter by clip URL availability */
  hasUrl?: boolean;
  /** Custom filter functions */
  customFilters?: ((clip: StreamClip) => boolean)[];
}

/**
 * Clip sorting options
 */
export interface ClipSortOptions {
  /** Sort field */
  sortBy?: 'created_at' | 'duration' | 'view_count' | 'clip_type';
  /** Sort order */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Clip filtering and sorting parameters
 */
export interface ClipFilterParams extends ClipFilterCriteria, ClipSortOptions {
  /** Maximum number of clips to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Result of clip filtering operation
 */
export interface ClipFilterResult {
  /** Filtered clips */
  clips: StreamClip[];
  /** Total number of clips before filtering */
  totalBeforeFilter: number;
  /** Number of clips filtered out */
  filteredOut: number;
  /** Applied filter criteria summary */
  appliedCriteria: {
    [key: string]: any;
  };
  /** Performance metrics */
  metrics: {
    processingTimeMs: number;
    filtersApplied: number;
  };
}
import { ConfigurationError } from '../../infrastructure/error-handling/errors';
import { Logger } from '../../infrastructure/logging/logger';
import { ErrorHandler } from '../../infrastructure/error-handling/error-handler';

/**
 * Handles stream filtering and ranking operations
 */
export class StreamFilters {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private logger: Logger,
    private errorHandler: ErrorHandler,
    private getLiveCoinsFn: (params?: GetLiveCoinsParams) => Promise<LiveCoin[]>,
    private getStreamClipsFn?: (mintId: string, clipType?: 'COMPLETE' | 'HIGHLIGHT', limit?: number) => Promise<StreamClip[]>
  ) {
    // Required for parameter properties
  }

  /**
   * Get active streams with minimum participants
   */
  async getActiveStreams(
    minParticipants: number = 1,
    params?: GetLiveCoinsParams
  ): Promise<LiveCoin[]> {
    // Validate minParticipants parameter
    this.validateMinParticipants(minParticipants);

    this.logger.info('Fetching active streams', {
      minParticipants,
      params,
      endpoint: 'getLiveCoins -> filter',
    });

    try {
      const allLiveStreams = await this.getLiveCoinsFn({
        limit: 100, // Fetch more items to account for filtering
        ...params, // User params should be used as-is
      });

      // Filter streams with minimum participants and currently live
      const activeStreams = this.filterByParticipantsAndLive(allLiveStreams, minParticipants);

      // Sort by participant count (highest first)
      this.sortByParticipants(activeStreams);

      const stats = this.calculateParticipantStats(activeStreams);

      this.logger.info('Successfully filtered active streams', {
        minParticipants,
        totalStreams: allLiveStreams.length,
        activeStreams: activeStreams.length,
        filtered: allLiveStreams.length - activeStreams.length,
        participantStats: stats,
      });

      return activeStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getActiveStreams', {
        minParticipants,
        params,
        suggestions: this.getActiveStreamsErrorSuggestion(minParticipants, params),
      });

      this.logger.error('Failed to fetch active streams', {
        error: pumpFunError.toJSON(),
        minParticipants,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get top live streams by participant count
   */
  async getTopLiveStreams(limit: number = 10, params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    this.validateLimit(limit);

    this.logger.info('Fetching top live streams', {
      limit,
      params,
    });

    try {
      const liveStreams = await this.getLiveCoinsFn({
        limit: Math.max(limit, 20), // Fetch extra to account for filtering
        ...params, // User params should be used as-is
      });

      // Filter by currently live while preserving original API response order
      const topStreams = liveStreams.filter(stream => stream.is_currently_live).slice(0, limit);

      this.logger.info('Successfully fetched top live streams', {
        requested: limit,
        returned: topStreams.length,
        totalFetched: liveStreams.length,
        topParticipants: topStreams[0]?.num_participants ?? 0,
      });

      return topStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getTopLiveStreams', {
        limit,
        params,
        suggestions: [
          'Check if there are any currently live streams using getLiveCoins()',
          'Consider increasing the search parameters',
          'Verify the API server is accessible',
        ],
      });

      this.logger.error('Failed to fetch top live streams', {
        error: pumpFunError.toJSON(),
        limit,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get top active streams (combination of active and top)
   */
  async getTopActiveStreams(limit: number = 10, minParticipants: number = 1): Promise<LiveCoin[]> {
    this.logger.info('Fetching top active streams', {
      limit,
      minParticipants,
    });

    try {
      const activeStreams = await this.getActiveStreams(minParticipants, {
        limit: Math.max(limit, 20),
      });

      // Return top N streams
      const topActiveStreams = activeStreams.slice(0, limit);

      this.logger.info('Successfully fetched top active streams', {
        requested: limit,
        minParticipants,
        returned: topActiveStreams.length,
        totalActive: activeStreams.length,
      });

      return topActiveStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getTopActiveStreams', {
        limit,
        minParticipants,
      });

      this.logger.error('Failed to fetch top active streams', {
        error: pumpFunError.toJSON(),
        limit,
        minParticipants,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get streams with meaningful titles
   */
  async getTitledStreams(limit: number = 10, params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    this.validateLimit(limit);

    this.logger.info('Fetching titled streams', {
      limit,
      params,
    });

    try {
      const liveStreams = await this.getLiveCoinsFn({
        limit: Math.max(limit, 50), // Fetch extra to account for filtering
        ...params, // User params should be used as-is
      });

      // Filter streams with meaningful titles
      const titledStreams = this.filterByTitle(liveStreams);

      // Apply limit while preserving original API order
      const topTitledStreams = titledStreams.slice(0, limit);

      this.logger.info('Successfully fetched titled streams', {
        requested: limit,
        returned: topTitledStreams.length,
        totalFetched: liveStreams.length,
        totalTitled: titledStreams.length,
      });

      return topTitledStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getTitledStreams', {
        limit,
        params,
        suggestions: [
          'Check if there are any currently live streams using getLiveCoins()',
          'Consider using getActiveStreams() for streams with participants',
          'Verify the API server is accessible',
        ],
      });

      this.logger.error('Failed to fetch titled streams', {
        error: pumpFunError.toJSON(),
        limit,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get titled active streams
   */
  async getTitledActiveStreams(
    limit: number = 10,
    minParticipants: number = 1,
    params?: GetLiveCoinsParams
  ): Promise<LiveCoin[]> {
    this.logger.info('Fetching titled active streams', {
      limit,
      minParticipants,
      params,
    });

    try {
      const activeStreams = await this.getActiveStreams(minParticipants, {
        limit: Math.max(limit, 50),
        ...params,
      });

      // Filter streams with meaningful titles
      const titledActiveStreams = this.filterByTitle(activeStreams);

      // Return top N streams
      const topTitledActiveStreams = titledActiveStreams.slice(0, limit);

      this.logger.info('Successfully fetched titled active streams', {
        requested: limit,
        minParticipants,
        returned: topTitledActiveStreams.length,
        totalActive: activeStreams.length,
        totalTitledActive: titledActiveStreams.length,
      });

      return topTitledActiveStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getTitledActiveStreams', {
        limit,
        minParticipants,
        params,
      });

      this.logger.error('Failed to fetch titled active streams', {
        error: pumpFunError.toJSON(),
        limit,
        minParticipants,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Apply advanced filtering with custom criteria
   */
  async applyAdvancedFilters(
    criteria: AdvancedFilterCriteria,
    params?: GetLiveCoinsParams
  ): Promise<AdvancedFilterResult> {
    const startTime = Date.now();

    this.logger.info('Applying advanced filters', {
      criteriaSummary: this.summarizeCriteria(criteria),
      params,
    });

    try {
      // Fetch streams for filtering
      const liveStreams = await this.getLiveCoinsFn({
        limit: 100, // Fetch more for comprehensive filtering (API max limit)
        includeNsfw: false,
        ...params,
      });

      // Apply advanced filtering
      const filteredStreams = this.performAdvancedFiltering(liveStreams, criteria);

      const processingTime = Date.now() - startTime;
      const result: AdvancedFilterResult = {
        streams: filteredStreams,
        totalBeforeFilter: liveStreams.length,
        filteredOut: liveStreams.length - filteredStreams.length,
        appliedCriteria: this.summarizeCriteria(criteria),
        metrics: {
          processingTimeMs: processingTime,
          filtersApplied: this.countActiveFilters(criteria),
        },
      };

      this.logger.info('Advanced filtering completed', {
        totalBeforeFilter: result.totalBeforeFilter,
        filteredOut: result.filteredOut,
        finalCount: result.streams.length,
        processingTimeMs: result.metrics.processingTimeMs,
        filtersApplied: result.metrics.filtersApplied,
      });

      return result;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'applyAdvancedFilters', {
        criteria,
        params,
        suggestions: [
          'Check if the filter criteria are valid',
          'Verify the API server is accessible',
          'Consider reducing the complexity of filter criteria',
        ],
      });

      this.logger.error('Failed to apply advanced filters', {
        error: pumpFunError.toJSON(),
        criteria,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Apply compound filter queries with logical operators
   */
  async applyCompoundFilter(
    query: CompoundFilterQuery,
    params?: GetLiveCoinsParams
  ): Promise<AdvancedFilterResult> {
    const startTime = Date.now();

    this.logger.info('Applying compound filter query', {
      groupCount: query.groups.length,
      groupOperator: query.groupOperator || 'AND',
      params,
    });

    try {
      // Fetch streams for filtering
      const liveStreams = await this.getLiveCoinsFn({
        limit: 100, // API max limit
        includeNsfw: false,
        ...params,
      });

      // Apply compound filtering
      const filteredStreams = this.performCompoundFiltering(liveStreams, query);

      const processingTime = Date.now() - startTime;
      const result: AdvancedFilterResult = {
        streams: filteredStreams,
        totalBeforeFilter: liveStreams.length,
        filteredOut: liveStreams.length - filteredStreams.length,
        appliedCriteria: {
          query: this.summarizeCompoundQuery(query),
        },
        metrics: {
          processingTimeMs: processingTime,
          filtersApplied: this.countCompoundFilters(query),
        },
      };

      this.logger.info('Compound filtering completed', {
        totalBeforeFilter: result.totalBeforeFilter,
        filteredOut: result.filteredOut,
        finalCount: result.streams.length,
        processingTimeMs: result.metrics.processingTimeMs,
        groupCount: query.groups.length,
      });

      return result;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'applyCompoundFilter', {
        query,
        params,
        suggestions: [
          'Check if the compound query structure is valid',
          'Verify individual filter criteria are correct',
          'Consider simplifying the query structure',
        ],
      });

      this.logger.error('Failed to apply compound filter', {
        error: pumpFunError.toJSON(),
        query,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Create custom filter function builder
   */
  createCustomFilter(filterFn: StreamFilterFunction, name?: string): StreamFilterFunction {
    // Create a wrapper function to preserve the name for debugging
    const wrapper = (stream: LiveCoin) => filterFn(stream);
    if (name) {
      Object.defineProperty(wrapper, 'name', {
        value: name,
        writable: false,
        configurable: true,
      });
    }
    return wrapper;
  }

  /**
   * Predefined filter builders for common use cases
   */
  getFilterBuilders = {
    /**
     * Filter for high-quality streams with good engagement
     */
    highQualityStreams: (): StreamFilterFunction => {
      return (stream: LiveCoin): boolean => {
        const hasTitle = stream.livestream_title && stream.livestream_title.trim().length > 10;
        const hasDescription = stream.description && stream.description.trim().length > 50;
        const hasSocial = !!(stream.twitter || stream.telegram);
        const hasParticipants = (stream.num_participants ?? 0) >= 5;
        const hasActivity = (stream.reply_count ?? 0) >= 10;

        return Boolean(hasTitle && hasDescription && hasSocial && hasParticipants && hasActivity);
      };
    },

    /**
     * Filter for new and trending streams
     */
    newAndTrending: (maxAgeHours: number = 24): StreamFilterFunction => {
      return (stream: LiveCoin) => {
        const now = Date.now();
        const ageHours = (now - stream.created_timestamp * 1000) / (1000 * 60 * 60);
        const isRecent = ageHours <= maxAgeHours;
        const hasEngagement = (stream.num_participants ?? 0) >= 3;
        const isGrowing = (stream.reply_count ?? 0) >= 5;

        return isRecent && (hasEngagement || isGrowing);
      };
    },

    /**
     * Filter for established streams with stable metrics
     */
    establishedStreams: (minMarketCap: number = 10000): StreamFilterFunction => {
      return (stream: LiveCoin) => {
        const hasEstablishedCap = stream.usd_market_cap >= minMarketCap;
        const hasConsistentActivity = (stream.num_participants ?? 0) >= 10;
        const hasSustainedEngagement = (stream.reply_count ?? 0) >= 20;

        return hasEstablishedCap && hasConsistentActivity && hasSustainedEngagement;
      };
    },

    /**
     * Filter for active community streams
     */
    activeCommunity: (minRepliesPerHour: number = 5): StreamFilterFunction => {
      return (stream: LiveCoin) => {
        const now = Date.now();
        const ageHours = (now - stream.created_timestamp * 1000) / (1000 * 60 * 60);
        const repliesPerHour = ageHours > 0 ? (stream.reply_count ?? 0) / ageHours : 0;
        const isActiveNow = (stream.num_participants ?? 0) >= 5;
        const hasSocial = !!(stream.twitter || stream.telegram);

        return repliesPerHour >= minRepliesPerHour && isActiveNow && hasSocial;
      };
    },

    /**
     * Filter for professional/potentially valuable streams
     */
    professionalStreams: (): StreamFilterFunction => {
      return (stream: LiveCoin): boolean => {
        const hasLongTitle = stream.livestream_title && stream.livestream_title.length >= 20;
        const hasDetailedDescription = stream.description && stream.description.length >= 200;
        const hasBranding = !!(stream.image_uri && stream.image_uri !== '');
        const hasSocialPresence = !!(stream.twitter && stream.telegram);
        const hasSignificantCap = stream.usd_market_cap >= 5000;

        return Boolean(
          hasLongTitle &&
            hasDetailedDescription &&
            hasBranding &&
            hasSocialPresence &&
            hasSignificantCap
        );
      };
    },

    /**
     * Filter for streams with specific market cap range
     */
    marketCapRange: (min: number, max: number): StreamFilterFunction => {
      return (stream: LiveCoin) => {
        return stream.usd_market_cap >= min && stream.usd_market_cap <= max;
      };
    },

    /**
     * Filter for streams with specific participant range
     */
    participantRange: (min: number, max: number): StreamFilterFunction => {
      return (stream: LiveCoin) => {
        const participants = stream.num_participants ?? 0;
        return participants >= min && participants <= max;
      };
    },
  };

  /**
   * Search live streams by keyword across multiple fields
   */
  async searchLiveStreams(params: SearchLiveStreamsParams): Promise<StreamSearchResult[]> {
    // Validate search parameters
    this.validateSearchParams(params);

    this.logger.info('Searching live streams', {
      keyword: params.keyword,
      searchIn: params.searchIn,
      limit: params.limit,
      minParticipants: params.minParticipants,
      currentlyLiveOnly: params.currentlyLiveOnly,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    try {
      // Fetch streams for search
      const liveStreams = await this.getLiveCoinsFn({
        limit: Math.max(params.limit ?? 20, 100), // Fetch more for better search results
        includeNsfw: params.includeNsfw ?? false,
      });

      // Apply search and filtering
      let searchResults = this.performSearch(liveStreams, params);

      // Apply additional filters
      if (params.minParticipants !== undefined) {
        searchResults = searchResults.filter(
          result => result.num_participants >= params.minParticipants!
        );
      }

      if (params.currentlyLiveOnly) {
        searchResults = searchResults.filter(result => result.is_currently_live);
      }

      // Sort results
      searchResults = this.sortSearchResults(searchResults, params);

      // Apply limit
      const finalResults = searchResults.slice(0, params.limit ?? 20);

      // Log search statistics
      this.logSearchStats(params, liveStreams.length, finalResults.length);

      return finalResults;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'searchLiveStreams', {
        params,
        suggestions: this.getSearchErrorSuggestions(params),
      });

      this.logger.error('Failed to search live streams', {
        error: pumpFunError.toJSON(),
        params,
      });

      throw pumpFunError;
    }
  }

  // ============================================================================
  // Stream Clip Filtering Methods
  // ============================================================================

  /**
   * Filter stream clips by type and other criteria
   */
  async filterStreamClips(
    clips: StreamClip[],
    params: ClipFilterParams
  ): Promise<ClipFilterResult> {
    const startTime = Date.now();

    this.logger.info('Filtering stream clips', {
      totalClips: clips.length,
      params: this.summarizeClipParams(params),
    });

    try {
      // Apply filtering
      let filteredClips = this.performClipFiltering(clips, params);

      // Apply sorting
      if (params.sortBy) {
        filteredClips = this.sortClips(filteredClips, params.sortBy, params.sortOrder || 'DESC');
      }

      // Apply pagination
      const offset = params.offset || 0;
      const limit = params.limit;
      let finalClips = filteredClips;

      if (limit !== undefined) {
        finalClips = filteredClips.slice(offset, offset + limit);
      } else {
        finalClips = filteredClips.slice(offset);
      }

      const processingTime = Date.now() - startTime;
      const result: ClipFilterResult = {
        clips: finalClips,
        totalBeforeFilter: clips.length,
        filteredOut: clips.length - filteredClips.length,
        appliedCriteria: this.summarizeClipParams(params),
        metrics: {
          processingTimeMs: processingTime,
          filtersApplied: this.countActiveClipFilters(params),
        },
      };

      this.logger.info('Stream clip filtering completed', {
        totalBeforeFilter: result.totalBeforeFilter,
        filteredOut: result.filteredOut,
        finalCount: result.clips.length,
        processingTimeMs: result.metrics.processingTimeMs,
        filtersApplied: result.metrics.filtersApplied,
      });

      return result;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'filterStreamClips', {
        params,
        suggestions: [
          'Check if the filter parameters are valid',
          'Verify the clips array is properly formatted',
          'Consider reducing the complexity of filter criteria',
        ],
      });

      this.logger.error('Failed to filter stream clips', {
        error: pumpFunError.toJSON(),
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Filter and sort stream clips for a specific mint
   */
  async filterClipsByMint(
    mintId: string,
    params: ClipFilterParams
  ): Promise<ClipFilterResult> {
    if (!this.getStreamClipsFn) {
      throw new ConfigurationError({
        message: 'getStreamClips function not provided to StreamFilters constructor',
      });
    }

    this.logger.info('Filtering clips by mint', {
      mintId,
      params: this.summarizeClipParams(params),
    });

    try {
      // Fetch clips for the mint - get all types initially for comprehensive filtering
      const allClips: StreamClip[] = [];

      // Get COMPLETE clips
      try {
        const completeClips = await this.getStreamClipsFn(mintId, 'COMPLETE', 100);
        allClips.push(...completeClips);
      } catch (error) {
        this.logger.warn('Failed to fetch COMPLETE clips', {
          mintId,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Get HIGHLIGHT clips
      try {
        const highlightClips = await this.getStreamClipsFn(mintId, 'HIGHLIGHT', 100);
        allClips.push(...highlightClips);
      } catch (error) {
        this.logger.warn('Failed to fetch HIGHLIGHT clips', {
          mintId,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Remove duplicates (same ID) while preserving order
      const uniqueClips = this.removeDuplicateClips(allClips);

      // Apply filtering and sorting
      return this.filterStreamClips(uniqueClips, params);
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'filterClipsByMint', {
        mintId,
        params,
        suggestions: [
          'Check if the mintId is valid',
          'Verify the API server is accessible',
          'Consider checking if the mint has any available clips',
        ],
      });

      this.logger.error('Failed to filter clips by mint', {
        error: pumpFunError.toJSON(),
        mintId,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get complete clips only
   */
  async getCompleteClips(
    mintId: string,
    params?: Omit<ClipFilterParams, 'clipType'>
  ): Promise<ClipFilterResult> {
    return this.filterClipsByMint(mintId, { ...params, clipType: 'COMPLETE' });
  }

  /**
   * Get highlight clips only
   */
  async getHighlightClips(
    mintId: string,
    params?: Omit<ClipFilterParams, 'clipType'>
  ): Promise<ClipFilterResult> {
    return this.filterClipsByMint(mintId, { ...params, clipType: 'HIGHLIGHT' });
  }

  /**
   * Get clips sorted by duration
   */
  async getClipsByDuration(
    mintId: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    params?: Omit<ClipFilterParams, 'sortBy' | 'sortOrder'>
  ): Promise<ClipFilterResult> {
    return this.filterClipsByMint(mintId, {
      ...params,
      sortBy: 'duration',
      sortOrder
    });
  }

  /**
   * Get clips sorted by view count
   */
  async getClipsByViewCount(
    mintId: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    params?: Omit<ClipFilterParams, 'sortBy' | 'sortOrder'>
  ): Promise<ClipFilterResult> {
    return this.filterClipsByMint(mintId, {
      ...params,
      sortBy: 'view_count',
      sortOrder
    });
  }

  /**
   * Get clips sorted by creation date
   */
  async getClipsByCreationDate(
    mintId: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    params?: Omit<ClipFilterParams, 'sortBy' | 'sortOrder'>
  ): Promise<ClipFilterResult> {
    return this.filterClipsByMint(mintId, {
      ...params,
      sortBy: 'created_at',
      sortOrder
    });
  }

  /**
   * Get clips with duration within specified range
   */
  async getClipsByDurationRange(
    mintId: string,
    minDuration: number,
    maxDuration: number,
    params?: Omit<ClipFilterParams, 'minDuration' | 'maxDuration'>
  ): Promise<ClipFilterResult> {
    return this.filterClipsByMint(mintId, {
      ...params,
      minDuration,
      maxDuration
    });
  }

  /**
   * Get clips with view count within specified range
   */
  async getClipsByViewCountRange(
    mintId: string,
    minViewCount: number,
    maxViewCount: number,
    params?: Omit<ClipFilterParams, 'minViewCount' | 'maxViewCount'>
  ): Promise<ClipFilterResult> {
    return this.filterClipsByMint(mintId, {
      ...params,
      minViewCount,
      maxViewCount
    });
  }

  /**
   * Get clips created within date range
   */
  async getClipsByDateRange(
    mintId: string,
    startDate: string,
    endDate: string,
    params?: Omit<ClipFilterParams, 'createdDateRange'>
  ): Promise<ClipFilterResult> {
    return this.filterClipsByMint(mintId, {
      ...params,
      createdDateRange: {
        after: startDate,
        before: endDate
      }
    });
  }

  /**
   * Get clips that have URLs available
   */
  async getClipsWithUrls(
    mintId: string,
    params?: Omit<ClipFilterParams, 'hasUrl'>
  ): Promise<ClipFilterResult> {
    return this.filterClipsByMint(mintId, {
      ...params,
      hasUrl: true
    });
  }

  /**
   * Private helper methods
   */
  private validateMinParticipants(minParticipants: number): void {
    if (typeof minParticipants !== 'number' || isNaN(minParticipants)) {
      throw new ConfigurationError({
        message: `Invalid minParticipants: ${minParticipants}. Must be a valid number.`,
      });
    }

    if (minParticipants < 0) {
      throw new ConfigurationError({
        message: `Invalid minParticipants: ${minParticipants}. Must be a non-negative number.`,
      });
    }
  }

  private validateLimit(limit: number): void {
    if (typeof limit !== 'number' || isNaN(limit)) {
      throw new ConfigurationError({
        message: `Invalid limit: ${limit}. Must be a valid number.`,
      });
    }

    if (limit < 1) {
      throw new ConfigurationError({
        message: `Invalid limit: ${limit}. Must be at least 1.`,
      });
    }
  }

  private filterByParticipantsAndLive(streams: LiveCoin[], minParticipants: number): LiveCoin[] {
    return streams.filter(stream => {
      const participants = stream.num_participants ?? 0;
      return stream.is_currently_live && participants >= minParticipants;
    });
  }

  private sortByParticipants(streams: LiveCoin[]): void {
    streams.sort((a, b) => {
      const aParticipants = a.num_participants ?? 0;
      const bParticipants = b.num_participants ?? 0;
      return bParticipants - aParticipants;
    });
  }

  private filterByTitle(streams: LiveCoin[]): LiveCoin[] {
    return streams.filter(stream => {
      const title = stream.livestream_title;
      return title && title.trim().length > 0 && !title.match(/^(Stream|Live|Broadcast)\s*\d*$/i);
    });
  }

  private calculateParticipantStats(streams: LiveCoin[]): {
    totalParticipants: number;
    averageParticipants: number;
    maxParticipants: number;
    minParticipants: number;
  } {
    const participantCounts = streams.map(stream => stream.num_participants ?? 0);

    return {
      totalParticipants: participantCounts.reduce((sum, count) => sum + count, 0),
      averageParticipants:
        participantCounts.length > 0
          ? participantCounts.reduce((sum, count) => sum + count, 0) / participantCounts.length
          : 0,
      maxParticipants: participantCounts.length > 0 ? Math.max(...participantCounts) : 0,
      minParticipants: participantCounts.length > 0 ? Math.min(...participantCounts) : 0,
    };
  }

  private getActiveStreamsErrorSuggestion(
    minParticipants: number,
    params?: GetLiveCoinsParams
  ): string[] {
    const suggestions: string[] = [
      `Consider lowering the minParticipants threshold (current: ${minParticipants})`,
      'Check if there are any live streams currently available',
      'Verify the API server is accessible',
    ];

    if (minParticipants > 1) {
      suggestions.push('Try with minParticipants=1 to see all available streams');
      suggestions.push(
        'Use getLiveCoins() directly if you need all live streams without filtering'
      );
    }

    if (params?.limit && params.limit < 50) {
      suggestions.push(
        'Consider using a larger limit parameter to fetch more streams for filtering'
      );
    }

    return suggestions;
  }

  /**
   * Search-related private helper methods
   */
  private validateSearchParams(params: SearchLiveStreamsParams): void {
    if (!params.keyword || typeof params.keyword !== 'string') {
      throw new ConfigurationError({
        message: 'Search keyword is required and must be a non-empty string',
      });
    }

    if (params.keyword.trim().length === 0) {
      throw new ConfigurationError({
        message: 'Search keyword cannot be empty or only whitespace',
      });
    }

    if (params.limit !== undefined && (params.limit < 1 || params.limit > 100)) {
      throw new ConfigurationError({
        message: 'Search limit must be between 1 and 100',
      });
    }

    if (params.minParticipants !== undefined && params.minParticipants < 0) {
      throw new ConfigurationError({
        message: 'Minimum participants must be a non-negative number',
      });
    }

    if (params.searchIn) {
      const validFields = ['name', 'symbol', 'description', 'title'];
      const invalidFields = params.searchIn.filter(field => !validFields.includes(field));
      if (invalidFields.length > 0) {
        throw new ConfigurationError({
          message: `Invalid search fields: ${invalidFields.join(', ')}. Valid fields: ${validFields.join(', ')}`,
        });
      }
    }
  }

  private performSearch(
    streams: LiveCoin[],
    params: SearchLiveStreamsParams
  ): StreamSearchResult[] {
    const searchFields = params.searchIn ?? ['name', 'symbol', 'description', 'title'];
    const normalizedKeyword = params.keyword.toLowerCase().trim();
    const results: StreamSearchResult[] = [];

    for (const stream of streams) {
      const searchResult = this.searchSingleStream(stream, normalizedKeyword, searchFields);
      if (searchResult.relevanceScore > 0) {
        results.push(searchResult);
      }
    }

    return results;
  }

  private searchSingleStream(
    stream: LiveCoin,
    keyword: string,
    searchFields: ('name' | 'symbol' | 'description' | 'title')[]
  ): StreamSearchResult {
    const matchedFields: StreamSearchResult['matchedFields'] = {};
    const snippets: StreamSearchResult['snippets'] = {};
    let totalScore = 0;

    // Search in name field
    if (searchFields.includes('name') && stream.name) {
      const nameScore = this.calculateTextMatchScore(stream.name, keyword);
      if (nameScore > 0) {
        matchedFields.name = nameScore;
        snippets.name = this.createSnippet(stream.name, keyword);
        totalScore += nameScore * 1.5; // Higher weight for name matches
      }
    }

    // Search in symbol field
    if (searchFields.includes('symbol') && stream.symbol) {
      const symbolScore = this.calculateTextMatchScore(stream.symbol, keyword);
      if (symbolScore > 0) {
        matchedFields.symbol = symbolScore;
        snippets.symbol = this.createSnippet(stream.symbol, keyword);
        totalScore += symbolScore * 1.3; // High weight for symbol matches
      }
    }

    // Search in description field
    if (searchFields.includes('description') && stream.description) {
      const descriptionScore = this.calculateTextMatchScore(stream.description, keyword);
      if (descriptionScore > 0) {
        matchedFields.description = descriptionScore;
        snippets.description = this.createSnippet(stream.description, keyword);
        totalScore += descriptionScore * 1.0; // Normal weight for description
      }
    }

    // Search in title field
    if (searchFields.includes('title') && stream.livestream_title) {
      const titleScore = this.calculateTextMatchScore(stream.livestream_title, keyword);
      if (titleScore > 0) {
        matchedFields.title = titleScore;
        snippets.title = this.createSnippet(stream.livestream_title, keyword);
        totalScore += titleScore * 1.2; // Slightly higher weight for title matches
      }
    }

    // Normalize the total score to 0-1 range
    const maxPossibleScore = searchFields.length * 1.5; // Maximum weighted score
    const relevanceScore = Math.min(totalScore / maxPossibleScore, 1.0);

    return {
      ...stream,
      relevanceScore,
      matchedFields,
      snippets: Object.keys(snippets).length > 0 ? snippets : undefined,
    };
  }

  private calculateTextMatchScore(text: string, keyword: string): number {
    const normalizedText = text.toLowerCase();

    // Exact match gets highest score
    if (normalizedText === keyword) {
      return 1.0;
    }

    // Starts with keyword gets high score
    if (normalizedText.startsWith(keyword)) {
      return 0.8;
    }

    // Contains keyword gets medium score
    if (normalizedText.includes(keyword)) {
      return 0.6;
    }

    // Check for partial word matches
    const words = normalizedText.split(/\s+/);
    let bestWordScore = 0;

    for (const word of words) {
      if (word.startsWith(keyword)) {
        bestWordScore = Math.max(bestWordScore, 0.4);
      } else if (word.includes(keyword)) {
        bestWordScore = Math.max(bestWordScore, 0.3);
      } else if (keyword.includes(word) && word.length > 2) {
        bestWordScore = Math.max(bestWordScore, 0.2);
      }
    }

    return bestWordScore;
  }

  private createSnippet(text: string, keyword: string, maxLength: number = 100): string {
    const normalizedText = text.toLowerCase();
    const keywordIndex = normalizedText.indexOf(keyword.toLowerCase());

    if (keywordIndex === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    // Calculate snippet boundaries
    const start = Math.max(0, keywordIndex - 30);
    const end = Math.min(text.length, keywordIndex + keyword.length + 30);

    let snippet = text.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) {
      snippet = `...${snippet}`;
    }
    if (end < text.length) {
      snippet = `${snippet}...`;
    }

    return snippet;
  }

  private sortSearchResults(
    results: StreamSearchResult[],
    params: SearchLiveStreamsParams
  ): StreamSearchResult[] {
    const sortBy = params.sortBy ?? 'relevance';
    const sortOrder = params.sortOrder ?? 'DESC';

    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case 'participants':
          comparison = (a.num_participants ?? 0) - (b.num_participants ?? 0);
          break;
        case 'market_cap':
          comparison = a.usd_market_cap - b.usd_market_cap;
          break;
        case 'created_timestamp':
          comparison = a.created_timestamp - b.created_timestamp;
          break;
        default:
          comparison = a.relevanceScore - b.relevanceScore;
      }

      return sortOrder === 'ASC' ? comparison : -comparison;
    });
  }

  private logSearchStats(
    params: SearchLiveStreamsParams,
    totalSearched: number,
    resultsFound: number
  ): void {
    this.logger.info('Search completed', {
      keyword: params.keyword,
      totalSearched,
      resultsFound,
      searchFields: params.searchIn ?? ['name', 'symbol', 'description', 'title'],
      filters: {
        minParticipants: params.minParticipants,
        currentlyLiveOnly: params.currentlyLiveOnly,
      },
      sorting: {
        sortBy: params.sortBy ?? 'relevance',
        sortOrder: params.sortOrder ?? 'DESC',
      },
      limit: params.limit ?? 20,
    });

    // Log match distribution if we have results
    if (resultsFound > 0) {
      // Note: This would need the actual results array for proper calculation
      // For now, we'll provide estimated metrics
      this.logger.debug('Search quality metrics', {
        resultsFound,
        matchDistribution: this.calculateMatchDistribution(resultsFound),
      });
    }
  }

  private calculateMatchDistribution(resultsCount: number): Record<string, number> {
    // Simplified distribution calculation - in a real implementation,
    // you'd analyze the actual results
    return {
      exactMatches: Math.floor(resultsCount * 0.1),
      partialMatches: Math.floor(resultsCount * 0.6),
      weakMatches: Math.floor(resultsCount * 0.3),
    };
  }

  private getSearchErrorSuggestions(params: SearchLiveStreamsParams): string[] {
    const suggestions: string[] = [
      'Try using different keywords or search terms',
      'Check if there are any live streams currently available using getLiveCoins()',
      'Verify the API server is accessible',
      'Consider broadening your search criteria',
    ];

    if (params.minParticipants && params.minParticipants > 0) {
      suggestions.push(
        `Try lowering the minimum participants threshold (current: ${params.minParticipants})`
      );
    }

    if (params.currentlyLiveOnly) {
      suggestions.push('Try including streams that are not currently live');
    }

    if (params.searchIn && params.searchIn.length < 4) {
      suggestions.push('Try searching in all fields (name, symbol, description, title)');
    }

    if (params.keyword.length > 50) {
      suggestions.push('Try using shorter, more specific search terms');
    } else if (params.keyword.length < 3) {
      suggestions.push('Try using longer, more specific search terms (minimum 3 characters)');
    }

    return suggestions;
  }

  // ============================================================================
  // Advanced Filtering Private Helper Methods
  // ============================================================================

  /**
   * Perform advanced filtering on streams based on criteria
   */
  private performAdvancedFiltering(
    streams: LiveCoin[],
    criteria: AdvancedFilterCriteria
  ): LiveCoin[] {
    return streams.filter(stream => this.matchesAdvancedCriteria(stream, criteria));
  }

  /**
   * Perform compound filtering with logical operators
   */
  private performCompoundFiltering(streams: LiveCoin[], query: CompoundFilterQuery): LiveCoin[] {
    const groupOperator = query.groupOperator || 'AND';

    return streams.filter(stream => {
      const groupResults = query.groups.map(group => {
        const groupOperator = group.operator || 'AND';
        return this.matchesGroupCriteria(stream, group.criteria, groupOperator);
      });

      return groupOperator === 'AND'
        ? groupResults.every(result => result)
        : groupResults.some(result => result);
    });
  }

  /**
   * Check if stream matches advanced criteria
   */
  private matchesAdvancedCriteria(stream: LiveCoin, criteria: AdvancedFilterCriteria): boolean {
    // Custom filter functions
    if (criteria.customFilters && criteria.customFilters.length > 0) {
      for (const customFilter of criteria.customFilters) {
        if (!customFilter(stream)) {
          return false;
        }
      }
    }

    // Market cap range filter
    if (criteria.marketCapRange) {
      const { min, max } = criteria.marketCapRange;
      if (min !== undefined && stream.usd_market_cap < min) {
        return false;
      }
      if (max !== undefined && stream.usd_market_cap > max) {
        return false;
      }
    }

    // Participant range filter
    if (criteria.participantRange) {
      const { min, max } = criteria.participantRange;
      const participants = stream.num_participants ?? 0;
      if (min !== undefined && participants < min) {
        return false;
      }
      if (max !== undefined && participants > max) {
        return false;
      }
    }

    // Creation time range filter
    if (criteria.createdTimeRange) {
      const { after, before } = criteria.createdTimeRange;
      if (after !== undefined && stream.created_timestamp < after) {
        return false;
      }
      if (before !== undefined && stream.created_timestamp > before) {
        return false;
      }
    }

    // Last activity range filter
    if (criteria.lastActivityRange) {
      const { after, before } = criteria.lastActivityRange;
      if (after !== undefined && stream.last_reply < after) {
        return false;
      }
      if (before !== undefined && stream.last_reply > before) {
        return false;
      }
    }

    // Social media presence filters
    if (criteria.hasSocialMedia) {
      const { twitter, telegram } = criteria.hasSocialMedia;
      if (twitter !== undefined && (!stream.twitter || stream.twitter.trim() === '')) {
        return false;
      }
      if (telegram !== undefined && (!stream.telegram || stream.telegram.trim() === '')) {
        return false;
      }
    }

    // Content quality filters
    if (criteria.contentQuality) {
      const { hasTitle, hasDescription, hasImage, minTitleLength, minDescriptionLength } =
        criteria.contentQuality;

      if (hasTitle && (!stream.livestream_title || stream.livestream_title.trim() === '')) {
        return false;
      }
      if (hasDescription && (!stream.description || stream.description.trim() === '')) {
        return false;
      }
      if (hasImage && (!stream.image_uri || stream.image_uri.trim() === '')) {
        return false;
      }
      if (
        minTitleLength &&
        (!stream.livestream_title || stream.livestream_title.length < minTitleLength)
      ) {
        return false;
      }
      if (
        minDescriptionLength &&
        (!stream.description || stream.description.length < minDescriptionLength)
      ) {
        return false;
      }
    }

    // Activity level filters
    if (criteria.activityLevel) {
      const { minReplyCount, hasRecentActivity, maxIdleTime } = criteria.activityLevel;

      if (minReplyCount !== undefined && (stream.reply_count ?? 0) < minReplyCount) {
        return false;
      }

      if (hasRecentActivity) {
        const now = Date.now();
        const lastActivityMs = stream.last_reply * 1000;
        const oneHourAgo = now - 60 * 60 * 1000;
        if (lastActivityMs < oneHourAgo) {
          return false;
        }
      }

      if (maxIdleTime !== undefined) {
        const now = Date.now();
        const lastActivityMs = stream.last_reply * 1000;
        const idleMinutes = (now - lastActivityMs) / (60 * 1000);
        if (idleMinutes > maxIdleTime) {
          return false;
        }
      }
    }

    // Text pattern matching filters
    if (criteria.textPatterns) {
      const { nameContains, symbolContains, descriptionContains, titleContains, excludePatterns } =
        criteria.textPatterns;

      // Check positive patterns
      if (nameContains && nameContains.length > 0) {
        const matches = nameContains.some(pattern =>
          stream.name.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!matches) {
          return false;
        }
      }

      if (symbolContains && symbolContains.length > 0) {
        const matches = symbolContains.some(pattern =>
          stream.symbol.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!matches) {
          return false;
        }
      }

      if (descriptionContains && descriptionContains.length > 0) {
        const matches = descriptionContains.some(pattern =>
          stream.description.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!matches) {
          return false;
        }
      }

      if (titleContains && titleContains.length > 0) {
        if (!stream.livestream_title) {
          return false;
        }
        const matches = titleContains.some(pattern =>
          stream.livestream_title!.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!matches) {
          return false;
        }
      }

      // Check exclusion patterns
      if (excludePatterns && excludePatterns.length > 0) {
        const allText =
          `${stream.name} ${stream.symbol} ${stream.description} ${stream.livestream_title || ''}`.toLowerCase();
        const hasExcludedPattern = excludePatterns.some(pattern =>
          allText.includes(pattern.toLowerCase())
        );
        if (hasExcludedPattern) {
          return false;
        }
      }
    }

    // Creator-specific filters
    if (criteria.creatorFilters) {
      const { excludeCreators, includeCreators } = criteria.creatorFilters;

      if (excludeCreators && excludeCreators.length > 0) {
        if (excludeCreators.includes(stream.creator)) {
          return false;
        }
      }

      if (includeCreators && includeCreators.length > 0) {
        if (!includeCreators.includes(stream.creator)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if stream matches group criteria with logical operator
   */
  private matchesGroupCriteria(
    stream: LiveCoin,
    criteria: AdvancedFilterCriteria[],
    operator: 'AND' | 'OR'
  ): boolean {
    const results = criteria.map(criterion => this.matchesAdvancedCriteria(stream, criterion));

    return operator === 'AND' ? results.every(result => result) : results.some(result => result);
  }

  /**
   * Summarize filter criteria for logging
   */
  private summarizeCriteria(criteria: AdvancedFilterCriteria): Record<string, any> {
    const summary: Record<string, any> = {};

    if (criteria.customFilters && criteria.customFilters.length > 0) {
      summary.customFilters = criteria.customFilters.length;
    }

    if (criteria.marketCapRange) {
      summary.marketCapRange = criteria.marketCapRange;
    }

    if (criteria.participantRange) {
      summary.participantRange = criteria.participantRange;
    }

    if (criteria.hasSocialMedia) {
      summary.hasSocialMedia = criteria.hasSocialMedia;
    }

    if (criteria.contentQuality) {
      summary.contentQuality = criteria.contentQuality;
    }

    if (criteria.activityLevel) {
      summary.activityLevel = criteria.activityLevel;
    }

    if (criteria.textPatterns) {
      summary.textPatterns = {
        nameContains: criteria.textPatterns.nameContains?.length || 0,
        symbolContains: criteria.textPatterns.symbolContains?.length || 0,
        descriptionContains: criteria.textPatterns.descriptionContains?.length || 0,
        titleContains: criteria.textPatterns.titleContains?.length || 0,
        excludePatterns: criteria.textPatterns.excludePatterns?.length || 0,
      };
    }

    if (criteria.creatorFilters) {
      summary.creatorFilters = {
        excludeCreators: criteria.creatorFilters.excludeCreators?.length || 0,
        includeCreators: criteria.creatorFilters.includeCreators?.length || 0,
      };
    }

    return summary;
  }

  /**
   * Summarize compound query for logging
   */
  private summarizeCompoundQuery(query: CompoundFilterQuery): Record<string, any> {
    return {
      groupCount: query.groups.length,
      groupOperator: query.groupOperator || 'AND',
      totalCriteria: query.groups.reduce((sum, group) => sum + group.criteria.length, 0),
    };
  }

  /**
   * Count active filters in criteria
   */
  private countActiveFilters(criteria: AdvancedFilterCriteria): number {
    let count = 0;

    if (criteria.customFilters && criteria.customFilters.length > 0) {
      count++;
    }
    if (criteria.marketCapRange) {
      count++;
    }
    if (criteria.participantRange) {
      count++;
    }
    if (criteria.createdTimeRange) {
      count++;
    }
    if (criteria.lastActivityRange) {
      count++;
    }
    if (criteria.hasSocialMedia) {
      count++;
    }
    if (criteria.contentQuality) {
      count++;
    }
    if (criteria.activityLevel) {
      count++;
    }
    if (criteria.textPatterns) {
      count++;
    }
    if (criteria.creatorFilters) {
      count++;
    }

    return count;
  }

  /**
   * Count active filters in compound query
   */
  private countCompoundFilters(query: CompoundFilterQuery): number {
    return query.groups.reduce((total, group) => {
      return (
        total +
        group.criteria.reduce((groupTotal, criteria) => {
          return groupTotal + this.countActiveFilters(criteria);
        }, 0)
      );
    }, 0);
  }

  // ============================================================================
  // Stream Clip Private Helper Methods
  // ============================================================================

  /**
   * Perform filtering on stream clips
   */
  private performClipFiltering(clips: StreamClip[], params: ClipFilterParams): StreamClip[] {
    return clips.filter(clip => this.matchesClipCriteria(clip, params));
  }

  /**
   * Check if a clip matches the filter criteria
   */
  private matchesClipCriteria(clip: StreamClip, params: ClipFilterParams): boolean {
    // Filter by clip type
    if (params.clipType && clip.clipType !== params.clipType) {
      return false;
    }

    // Filter by duration range
    if (params.minDuration !== undefined) {
      const duration = clip.duration ?? 0;
      if (duration < params.minDuration) {
        return false;
      }
    }

    if (params.maxDuration !== undefined) {
      const duration = clip.duration ?? 0;
      if (duration > params.maxDuration) {
        return false;
      }
    }

    // Filter by view count range
    if (params.minViewCount !== undefined) {
      const viewCount = clip.view_count ?? 0;
      if (viewCount < params.minViewCount) {
        return false;
      }
    }

    if (params.maxViewCount !== undefined) {
      const viewCount = clip.view_count ?? 0;
      if (viewCount > params.maxViewCount) {
        return false;
      }
    }

    // Filter by creation date range
    if (params.createdDateRange) {
      if (!clip.created_at) {
        return false; // If no creation date, can't filter by date range
      }

      const clipDate = new Date(clip.created_at);

      if (params.createdDateRange.after) {
        const afterDate = new Date(params.createdDateRange.after);
        if (clipDate < afterDate) {
          return false;
        }
      }

      if (params.createdDateRange.before) {
        const beforeDate = new Date(params.createdDateRange.before);
        if (clipDate > beforeDate) {
          return false;
        }
      }
    }

    // Filter by URL availability
    if (params.hasUrl !== undefined) {
      const hasUrl = !!(clip.clip_url && clip.clip_url.trim() !== '');
      if (params.hasUrl !== hasUrl) {
        return false;
      }
    }

    // Apply custom filter functions
    if (params.customFilters && params.customFilters.length > 0) {
      for (const customFilter of params.customFilters) {
        if (!customFilter(clip)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Sort clips by specified field and order
   */
  private sortClips(
    clips: StreamClip[],
    sortBy: 'created_at' | 'duration' | 'view_count' | 'clip_type',
    sortOrder: 'ASC' | 'DESC'
  ): StreamClip[] {
    return clips.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'created_at':
          // Handle null/undefined dates
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
          comparison = aDate - bDate;
          break;

        case 'duration':
          const aDuration = a.duration ?? 0;
          const bDuration = b.duration ?? 0;
          comparison = aDuration - bDuration;
          break;

        case 'view_count':
          const aViewCount = a.view_count ?? 0;
          const bViewCount = b.view_count ?? 0;
          comparison = aViewCount - bViewCount;
          break;

        case 'clip_type':
          // Sort by clip type (COMPLETE before HIGHLIGHT)
          const aType = a.clipType === 'COMPLETE' ? 0 : 1;
          const bType = b.clipType === 'COMPLETE' ? 0 : 1;
          comparison = aType - bType;
          break;

        default:
          comparison = 0;
      }

      return sortOrder === 'ASC' ? comparison : -comparison;
    });
  }

  /**
   * Remove duplicate clips by ID while preserving order
   */
  private removeDuplicateClips(clips: StreamClip[]): StreamClip[] {
    const seen = new Set<string>();
    return clips.filter(clip => {
      if (seen.has(clip.id)) {
        return false;
      }
      seen.add(clip.id);
      return true;
    });
  }

  /**
   * Summarize clip filter parameters for logging
   */
  private summarizeClipParams(params: ClipFilterParams): Record<string, any> {
    const summary: Record<string, any> = {};

    if (params.clipType) {
      summary.clipType = params.clipType;
    }

    if (params.minDuration !== undefined || params.maxDuration !== undefined) {
      summary.durationRange = {
        min: params.minDuration,
        max: params.maxDuration,
      };
    }

    if (params.minViewCount !== undefined || params.maxViewCount !== undefined) {
      summary.viewCountRange = {
        min: params.minViewCount,
        max: params.maxViewCount,
      };
    }

    if (params.createdDateRange) {
      summary.createdDateRange = params.createdDateRange;
    }

    if (params.hasUrl !== undefined) {
      summary.hasUrl = params.hasUrl;
    }

    if (params.sortBy) {
      summary.sorting = {
        sortBy: params.sortBy,
        sortOrder: params.sortOrder || 'DESC',
      };
    }

    if (params.customFilters && params.customFilters.length > 0) {
      summary.customFilters = params.customFilters.length;
    }

    if (params.limit !== undefined) {
      summary.pagination = {
        limit: params.limit,
        offset: params.offset || 0,
      };
    }

    return summary;
  }

  /**
   * Count active clip filters
   */
  private countActiveClipFilters(params: ClipFilterParams): number {
    let count = 0;

    if (params.clipType) {
      count++;
    }

    if (params.minDuration !== undefined || params.maxDuration !== undefined) {
      count++;
    }

    if (params.minViewCount !== undefined || params.maxViewCount !== undefined) {
      count++;
    }

    if (params.createdDateRange) {
      count++;
    }

    if (params.hasUrl !== undefined) {
      count++;
    }

    if (params.customFilters && params.customFilters.length > 0) {
      count++;
    }

    if (params.sortBy) {
      count++;
    }

    return count;
  }
}
