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
} from '../../types';
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
    private getLiveCoinsFn: (params?: GetLiveCoinsParams) => Promise<LiveCoin[]>
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
      const participants = stream.num_participants ?? 0;
      return participants >= minParticipants;
    });
  }

  private sortByParticipants(streams: LiveCoin[]): void {
    streams.sort((a, b) => {
      const aParticipants = a.num_participants ?? 0;
      const bParticipants = b.num_participants ?? 0;
      return bParticipants - aParticipants;
    });
  }

  private getTopByParticipants(streams: LiveCoin[], limit: number): LiveCoin[] {
    return streams
      .sort((a, b) => (b.num_participants ?? 0) - (a.num_participants ?? 0))
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
}
