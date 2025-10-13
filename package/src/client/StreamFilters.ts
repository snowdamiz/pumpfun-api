/**
 * Stream Filters for PumpFun API Client
 *
 * This module contains all stream filtering and ranking operations
 * including active streams, top streams, and titled streams.
 */

import {
  LiveCoin,
  GetLiveCoinsParams
} from './types';
import {
  ConfigurationError,
} from '../utils/errors';
import { Logger } from '../utils/logger';
import { ErrorHandler } from './ErrorHandler';

/**
 * Handles stream filtering and ranking operations
 */
export class StreamFilters {
  constructor(
    private logger: Logger,
    private errorHandler: ErrorHandler,
    private getLiveCoinsFn: (params?: GetLiveCoinsParams) => Promise<LiveCoin[]>
  ) {}

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
        ...params,
      });

      // Filter streams with minimum participants
      const activeStreams = this.filterByParticipants(allLiveStreams, minParticipants);

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
        sort: 'participants', // Sort by participants
        order: 'DESC',
        ...params,
      });

      // Sort by participant count (highest first) and limit
      const topStreams = this.getTopByParticipants(liveStreams, limit);

      this.logger.info('Successfully fetched top live streams', {
        requested: limit,
        returned: topStreams.length,
        totalFetched: liveStreams.length,
        topParticipants: topStreams[0]?.num_participants || 0,
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
        ...params,
      });

      // Filter streams with meaningful titles
      const titledStreams = this.filterByTitle(liveStreams);

      // Sort by participant count (highest first) and limit
      const topTitledStreams = this.getTopByParticipants(titledStreams, limit);

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

  private filterByParticipants(streams: LiveCoin[], minParticipants: number): LiveCoin[] {
    return streams.filter(stream => {
      const participants = stream.num_participants || 0;
      return participants >= minParticipants;
    });
  }

  private sortByParticipants(streams: LiveCoin[]): void {
    streams.sort((a, b) => {
      const aParticipants = a.num_participants || 0;
      const bParticipants = b.num_participants || 0;
      return bParticipants - aParticipants;
    });
  }

  private getTopByParticipants(streams: LiveCoin[], limit: number): LiveCoin[] {
    return streams
      .sort((a, b) => (b.num_participants || 0) - (a.num_participants || 0))
      .slice(0, limit);
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
    const participantCounts = streams.map(stream => stream.num_participants || 0);

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
}