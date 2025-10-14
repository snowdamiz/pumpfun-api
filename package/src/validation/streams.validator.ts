/**
 * Live Streams Validator for PumpFun API Client
 *
 * This module contains all validation logic for live streams operations
 * including parameter validation and response validation.
 */

import {
  LiveCoin,
  GetLiveCoinsParams,
  SearchLiveStreamsParams,
  StreamSearchResult,
} from '../types';
import { ServerError, ConfigurationError } from '../infrastructure/error-handling/errors';
import { Logger } from '../infrastructure/logging/logger';

/**
 * Handles validation for live streams operations
 */
export class LiveStreamsValidator {
  // eslint-disable-next-line no-useless-constructor
  constructor(private logger: Logger) {
    // Required for parameter properties
  }

  /**
   * Validate getLiveCoins parameters
   */
  validateGetLiveCoinsParams(params: Required<GetLiveCoinsParams>): void {
    const errors: string[] = [];

    // Validate offset
    if (params.offset < 0) {
      errors.push(`Invalid offset: ${params.offset}. Must be a non-negative integer.`);
    }

    // Validate limit
    if (params.limit < 1) {
      errors.push(`Invalid limit: ${params.limit}. Must be at least 1.`);
    } else if (params.limit > 100) {
      errors.push(`Invalid limit: ${params.limit}. Maximum allowed is 100.`);
    }

    // Validate sort field
    const validSortFields = ['currently_live', 'market_cap', 'participants'];
    if (!validSortFields.includes(params.sort)) {
      errors.push(
        `Invalid sort field: "${params.sort}". Must be one of: ${validSortFields.join(', ')}.`
      );
    }

    // Validate sort order
    const validSortOrders = ['ASC', 'DESC'];
    if (!validSortOrders.includes(params.order)) {
      errors.push(
        `Invalid sort order: "${params.order}". Must be one of: ${validSortOrders.join(', ')}.`
      );
    }

    // Validate includeNsfw type
    if (typeof params.includeNsfw !== 'boolean') {
      errors.push(`Invalid includeNsfw type: ${typeof params.includeNsfw}. Must be boolean.`);
    }

    if (errors.length > 0) {
      throw new ConfigurationError({
        message: `getLiveCoins parameter validation failed:\n${errors.map((error, index) => `  ${index + 1}. ${error}`).join('\n')}`,
        details: {
          operation: 'getLiveCoins',
          providedParams: params,
          validationErrors: errors,
        },
      });
    }
  }

  /**
   * Validate live coins response with fallback handling
   */
  validateLiveCoinsResponseWithFallback(
    response: any,
    params: Required<GetLiveCoinsParams>
  ): LiveCoin[] {
    // Handle completely empty or null responses
    if (!response) {
      this.logger.warn('Received empty response from live coins API', {
        params,
        responseType: typeof response,
      });
      return [];
    }

    // Handle non-array responses with fallback
    if (!Array.isArray(response)) {
      // If it's an object with a data property that's an array, use that
      if (response && typeof response === 'object' && Array.isArray(response.data)) {
        this.logger.info('Response wrapped in object, extracting data array', {
          responseKeys: Object.keys(response),
          dataArrayLength: response.data.length,
        });
        response = response.data;
      } else {
        // For other unexpected formats, create a detailed error
        throw new ServerError({
          message: 'Invalid response format: expected array of live coins',
          statusCode: 500,
          details: {
            expectedType: 'array',
            receivedType: typeof response,
            responseType: response?.constructor?.name,
            responseKeys: response ? Object.keys(response) : null,
            params,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Proceed with normal validation
    return this.validateLiveCoinsResponse(response);
  }

  /**
   * Validate live coins response array
   */
  validateLiveCoinsResponse(response: any): LiveCoin[] {
    if (!Array.isArray(response)) {
      throw new ServerError({
        message: 'Invalid response format: expected array of live coins',
        statusCode: 500,
        details: {
          expectedType: 'array',
          receivedType: typeof response,
          response,
        },
      });
    }

    const liveCoins: LiveCoin[] = [];
    const validationErrors: string[] = [];

    for (let i = 0; i < response.length; i++) {
      const coin = response[i];

      try {
        const validatedCoin = this.validateLiveCoin(coin, i);
        liveCoins.push(validatedCoin);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        validationErrors.push(`Item ${i}: ${errorMessage}`);
      }
    }

    if (validationErrors.length > 0) {
      this.logger.warn('Some live coins failed validation', {
        validationErrors,
        totalItems: response.length,
        validItems: liveCoins.length,
      });
    }

    return liveCoins;
  }

  /**
   * Validate individual live coin object
   */
  validateLiveCoin(coin: any, index: number): LiveCoin {
    const errors: string[] = [];

    // Type checking
    if (!coin || typeof coin !== 'object') {
      errors.push(`Item ${index}: Expected object, got ${typeof coin}`);
      throw new ServerError({
        message: `Invalid live coin data at index ${index}`,
        statusCode: 500,
        details: { errors, index, coinData: coin },
      });
    }

    // Required field validation (all required fields from LiveCoin interface)
    const requiredFields: (keyof LiveCoin)[] = [
      'mint',
      'name',
      'symbol',
      'description',
      'image_uri',
      'creator',
      'created_timestamp',
      'market_cap',
      'usd_market_cap',
      'is_currently_live',
      'num_participants',
      'reply_count',
      'thumbnail',
      'last_reply',
    ];
    for (const field of requiredFields) {
      if (!(field in coin)) {
        errors.push(`Item ${index}: Missing required field '${field}'`);
      }
    }

    // Type validation for critical fields
    if (coin.mint && typeof coin.mint !== 'string') {
      errors.push(`Item ${index}: Field 'mint' must be string, got ${typeof coin.mint}`);
    }

    if (coin.created_timestamp && typeof coin.created_timestamp !== 'number') {
      errors.push(
        `Item ${index}: Field 'created_timestamp' must be number, got ${typeof coin.created_timestamp}`
      );
    }

    if (coin.is_currently_live && typeof coin.is_currently_live !== 'boolean') {
      errors.push(
        `Item ${index}: Field 'is_currently_live' must be boolean, got ${typeof coin.is_currently_live}`
      );
    }

    // Format validation for specific fields
    if (coin.mint && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(coin.mint)) {
      errors.push(`Item ${index}: Field 'mint' has invalid format: ${coin.mint}`);
    }

    // Optional fields validation (if present)
    const optionalFields: (keyof LiveCoin)[] = ['twitter', 'telegram', 'livestream_title'];
    for (const field of optionalFields) {
      if (coin[field] !== undefined && coin[field] !== null && typeof coin[field] !== 'string') {
        errors.push(
          `Item ${index}: Field '${field}' must be string or null, got ${typeof coin[field]}`
        );
      }
    }

    // Numerical fields validation
    const numericFields = [
      'created_timestamp',
      'market_cap',
      'usd_market_cap',
      'num_participants',
      'reply_count',
      'last_reply',
    ];
    for (const field of numericFields) {
      if (coin[field] !== undefined && coin[field] !== null) {
        if (typeof coin[field] !== 'number' || isNaN(coin[field]) || !isFinite(coin[field])) {
          errors.push(`Item ${index}: Field '${field}' must be a valid number, got ${coin[field]}`);
        } else if (coin[field] < 0) {
          errors.push(`Item ${index}: Field '${field}' must be non-negative, got ${coin[field]}`);
        }
      }
    }

    // If we have validation errors, throw a detailed error
    if (errors.length > 0) {
      throw new ServerError({
        message: `Live coin validation failed for item at index ${index}`,
        statusCode: 500,
        details: { errors, index, coinData: this.sanitizeCoinForLogging(coin) },
      });
    }

    // Create a clean, validated LiveCoin object with proper typing
    const validatedCoin: LiveCoin = {
      mint: coin.mint,
      name: coin.name,
      symbol: coin.symbol,
      description: coin.description,
      image_uri: coin.image_uri,
      creator: coin.creator,
      created_timestamp: coin.created_timestamp,
      market_cap: coin.market_cap,
      usd_market_cap: coin.usd_market_cap,
      is_currently_live: coin.is_currently_live,
      num_participants: coin.num_participants,
      reply_count: coin.reply_count,
      thumbnail: coin.thumbnail,
      last_reply: coin.last_reply,
      // Optional fields (only include if present and valid)
      ...(coin.twitter && { twitter: coin.twitter }),
      ...(coin.telegram && { telegram: coin.telegram }),
      ...(coin.livestream_title && { livestream_title: coin.livestream_title }),
    };

    return validatedCoin;
  }

  /**
   * Sanitize coin data for logging to remove sensitive or large fields
   */
  sanitizeCoinForLogging(coin: any): any {
    if (!coin || typeof coin !== 'object') {
      return coin;
    }

    const sanitized = { ...coin };
    // Remove potentially sensitive or large fields for logging
    if (sanitized.embeddings) {
      sanitized.embeddings = `[Array: ${Array.isArray(sanitized.embeddings) ? sanitized.embeddings.length : 'unknown'} items]`;
    }
    return sanitized;
  }

  // ============================================================================
  // Search and Filter Utility Functions (T044)
  // ============================================================================

  /**
   * Create a text pattern matching utility function
   * Supports exact matches, partial matches, and regex patterns
   */
  createTextPatternMatcher(
    pattern: string,
    options: {
      caseSensitive?: boolean;
      wholeWord?: boolean;
      regex?: boolean;
    } = {}
  ): (text: string) => boolean {
    const { caseSensitive = false, wholeWord = false, regex = false } = options;

    if (regex) {
      try {
        const regexFlags = caseSensitive ? 'g' : 'gi';
        const regexPattern = new RegExp(pattern, regexFlags);
        return (text: string) => regexPattern.test(text);
      } catch (error) {
        this.logger.warn('Invalid regex pattern, falling back to text matching', {
          pattern,
          error: error instanceof Error ? error.message : String(error),
        });
        // Fall back to text matching
      }
    }

    const normalizedPattern = caseSensitive ? pattern : pattern.toLowerCase();

    return (text: string) => {
      const normalizedText = caseSensitive ? text : text.toLowerCase();

      if (wholeWord) {
        const words = normalizedText.split(/\s+/);
        return words.includes(normalizedPattern);
      }

      return normalizedText.includes(normalizedPattern);
    };
  }

  /**
   * Create a compound search filter that combines multiple search criteria
   */
  createCompoundSearchFilter(
    criteria: Array<{
      field: keyof LiveCoin;
      pattern: string;
      operator?: 'contains' | 'startsWith' | 'endsWith' | 'exact' | 'regex';
      caseSensitive?: boolean;
    }>,
    logicalOperator: 'AND' | 'OR' = 'AND'
  ): (stream: LiveCoin) => boolean {
    const matchers = criteria.map(criterion => {
      const { field, pattern, operator = 'contains', caseSensitive = false } = criterion;

      return (stream: LiveCoin) => {
        const value = stream[field];
        if (value === null || value === undefined) {
          return false;
        }

        const textValue = String(value);
        const normalizedText = caseSensitive ? textValue : textValue.toLowerCase();
        const normalizedPattern = caseSensitive ? pattern : pattern.toLowerCase();

        switch (operator) {
          case 'exact':
            return normalizedText === normalizedPattern;
          case 'startsWith':
            return normalizedText.startsWith(normalizedPattern);
          case 'endsWith':
            return normalizedText.endsWith(normalizedPattern);
          case 'regex':
            try {
              const regexFlags = caseSensitive ? 'g' : 'gi';
              const regex = new RegExp(pattern, regexFlags);
              return regex.test(textValue);
            } catch {
              return false;
            }
          case 'contains':
          default:
            return normalizedText.includes(normalizedPattern);
        }
      };
    });

    return (stream: LiveCoin) => {
      const results = matchers.map(matcher => matcher(stream));
      return logicalOperator === 'AND'
        ? results.every(result => result)
        : results.some(result => result);
    };
  }

  /**
   * Create a numeric range filter for continuous fields
   */
  createNumericRangeFilter(
    field: keyof LiveCoin,
    range: { min?: number; max?: number; inclusive?: boolean }
  ): (stream: LiveCoin) => boolean {
    const { min, max, inclusive = true } = range;

    return (stream: LiveCoin) => {
      const value = stream[field];

      if (typeof value !== 'number' || isNaN(value)) {
        return false;
      }

      if (min !== undefined) {
        if (inclusive) {
          if (value < min) {
            return false;
          }
        } else {
          if (value <= min) {
            return false;
          }
        }
      }

      if (max !== undefined) {
        if (inclusive) {
          if (value > max) {
            return false;
          }
        } else {
          if (value >= max) {
            return false;
          }
        }
      }

      return true;
    };
  }

  /**
   * Create a time-based filter for timestamp fields
   */
  createTimeRangeFilter(
    field: keyof LiveCoin,
    timeRange: {
      after?: Date | number;
      before?: Date | number;
      relativeToNow?: {
        olderThan?: number; // minutes
        newerThan?: number; // minutes
      };
    }
  ): (stream: LiveCoin) => boolean {
    return (stream: LiveCoin) => {
      const value = stream[field];

      if (typeof value !== 'number' || isNaN(value)) {
        return false;
      }

      const timestampMs = value * 1000; // Convert Unix timestamp to milliseconds
      const now = Date.now();

      // Handle absolute time ranges
      if (timeRange.after !== undefined) {
        const afterMs =
          timeRange.after instanceof Date ? timeRange.after.getTime() : timeRange.after * 1000;
        if (timestampMs < afterMs) {
          return false;
        }
      }

      if (timeRange.before !== undefined) {
        const beforeMs =
          timeRange.before instanceof Date ? timeRange.before.getTime() : timeRange.before * 1000;
        if (timestampMs > beforeMs) {
          return false;
        }
      }

      // Handle relative time ranges
      if (timeRange.relativeToNow) {
        const { olderThan, newerThan } = timeRange.relativeToNow;

        if (olderThan !== undefined) {
          const olderThanMs = now - olderThan * 60 * 1000;
          if (timestampMs > olderThanMs) {
            return false;
          }
        }

        if (newerThan !== undefined) {
          const newerThanMs = now - newerThan * 60 * 1000;
          if (timestampMs < newerThanMs) {
            return false;
          }
        }
      }

      return true;
    };
  }

  /**
   * Create a fuzzy search filter for text fields
   * Uses Levenshtein distance for approximate matching
   */
  createFuzzySearchFilter(
    field: keyof LiveCoin,
    query: string,
    options: {
      caseSensitive?: boolean;
      threshold?: number; // minimum similarity score (0-1)
    } = {}
  ): (stream: LiveCoin) => boolean {
    const { caseSensitive = false, threshold = 0.7 } = options;

    return (stream: LiveCoin) => {
      const value = stream[field];
      if (value === null || value === undefined) {
        return false;
      }

      const text = String(value);
      const normalizedText = caseSensitive ? text : text.toLowerCase();
      const normalizedQuery = caseSensitive ? query : query.toLowerCase();

      // Direct match gets highest priority
      if (normalizedText.includes(normalizedQuery)) {
        return true;
      }

      // Calculate similarity using Levenshtein distance
      const similarity = this.calculateSimilarity(normalizedText, normalizedQuery);
      return similarity >= threshold;
    };
  }

  /**
   * Create a multi-field search filter with weighted scoring
   */
  createWeightedSearchFilter(
    query: string,
    fieldWeights: Partial<Record<keyof LiveCoin, number>>,
    options: {
      minScore?: number;
      caseSensitive?: boolean;
      exactMatchBonus?: number;
    } = {}
  ): (stream: LiveCoin) => { matches: boolean; score: number } {
    const { minScore = 0.3, caseSensitive = false, exactMatchBonus = 1.5 } = options;
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();

    return (stream: LiveCoin) => {
      let totalScore = 0;
      let maxWeight = 0;

      // Calculate score for each field
      for (const [field, weight] of Object.entries(fieldWeights)) {
        if (weight === undefined || weight === 0) {
          continue;
        }

        maxWeight = Math.max(maxWeight, weight);
        const value = stream[field as keyof LiveCoin];

        if (value === null || value === undefined) {
          continue;
        }

        const text = String(value);
        const normalizedText = caseSensitive ? text : text.toLowerCase();

        let fieldScore = 0;

        // Exact match
        if (normalizedText === normalizedQuery) {
          fieldScore = 1.0 * exactMatchBonus;
        }
        // Starts with query
        else if (normalizedText.startsWith(normalizedQuery)) {
          fieldScore = 0.8;
        }
        // Contains query
        else if (normalizedText.includes(normalizedQuery)) {
          fieldScore = 0.6;
        }
        // Partial word match
        else {
          const words = normalizedText.split(/\s+/);
          let bestWordScore = 0;
          for (const word of words) {
            if (word.startsWith(normalizedQuery)) {
              bestWordScore = Math.max(bestWordScore, 0.4);
            } else if (word.includes(normalizedQuery)) {
              bestWordScore = Math.max(bestWordScore, 0.3);
            } else if (normalizedQuery.includes(word) && word.length > 2) {
              bestWordScore = Math.max(bestWordScore, 0.2);
            }
          }
          fieldScore = bestWordScore;
        }

        totalScore += fieldScore * weight;
      }

      // Normalize score by maximum possible weight
      const normalizedScore = maxWeight > 0 ? totalScore / maxWeight : 0;

      return {
        matches: normalizedScore >= minScore,
        score: normalizedScore,
      };
    };
  }

  /**
   * Validate search parameters for advanced search operations
   */
  validateAdvancedSearchParams(params: {
    query?: string;
    filters?: Array<{
      field: keyof LiveCoin;
      operation:
        | 'equals'
        | 'contains'
        | 'startsWith'
        | 'endsWith'
        | 'greaterThan'
        | 'lessThan'
        | 'between';
      value: any;
      secondValue?: any; // for 'between' operations
    }>;
    sortBy?: keyof LiveCoin;
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): void {
    const errors: string[] = [];

    // Validate query
    if (params.query !== undefined) {
      if (typeof params.query !== 'string') {
        errors.push('Query must be a string');
      } else if (params.query.trim().length === 0) {
        errors.push('Query cannot be empty');
      } else if (params.query.length > 500) {
        errors.push('Query is too long (maximum 500 characters)');
      }
    }

    // Validate filters
    if (params.filters) {
      if (!Array.isArray(params.filters)) {
        errors.push('Filters must be an array');
      } else {
        for (let i = 0; i < params.filters.length; i++) {
          const filter = params.filters[i];
          const filterErrors = this.validateFilter(filter, i);
          errors.push(...filterErrors);
        }
      }
    }

    // Validate sort parameters
    if (params.sortBy !== undefined) {
      const validSortFields: (keyof LiveCoin)[] = [
        'name',
        'symbol',
        'description',
        'created_timestamp',
        'market_cap',
        'usd_market_cap',
        'num_participants',
        'reply_count',
        'last_reply',
      ];
      if (!validSortFields.includes(params.sortBy)) {
        errors.push(
          `Invalid sort field: ${params.sortBy}. Valid fields: ${validSortFields.join(', ')}`
        );
      }
    }

    if (params.sortOrder !== undefined) {
      if (!['ASC', 'DESC'].includes(params.sortOrder)) {
        errors.push(`Invalid sort order: ${params.sortOrder}. Must be ASC or DESC`);
      }
    }

    // Validate pagination
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 1000) {
        errors.push('Limit must be a number between 1 and 1000');
      }
    }

    if (params.offset !== undefined) {
      if (typeof params.offset !== 'number' || params.offset < 0) {
        errors.push('Offset must be a non-negative number');
      }
    }

    if (errors.length > 0) {
      throw new ConfigurationError({
        message: `Advanced search parameter validation failed:\n${errors.map((error, index) => `  ${index + 1}. ${error}`).join('\n')}`,
        details: {
          operation: 'advancedSearch',
          providedParams: params,
          validationErrors: errors,
        },
      });
    }
  }

  /**
   * Validate individual filter objects
   */
  private validateFilter(filter: any, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Filter ${index}`;

    // Check required fields
    if (!filter.field || typeof filter.field !== 'string') {
      errors.push(`${prefix}: field is required and must be a string`);
    }

    if (!filter.operation || typeof filter.operation !== 'string') {
      errors.push(`${prefix}: operation is required and must be a string`);
    }

    if (filter.value === undefined) {
      errors.push(`${prefix}: value is required`);
    }

    // Validate operation
    const validOperations = [
      'equals',
      'contains',
      'startsWith',
      'endsWith',
      'greaterThan',
      'lessThan',
      'between',
    ];
    if (filter.operation && !validOperations.includes(filter.operation)) {
      errors.push(
        `${prefix}: invalid operation "${filter.operation}". Valid operations: ${validOperations.join(', ')}`
      );
    }

    // Validate between operation requires two values
    if (filter.operation === 'between' && filter.secondValue === undefined) {
      errors.push(`${prefix}: between operation requires secondValue`);
    }

    // Validate field name
    const validFields: (keyof LiveCoin)[] = [
      'mint',
      'name',
      'symbol',
      'description',
      'image_uri',
      'twitter',
      'telegram',
      'creator',
      'created_timestamp',
      'market_cap',
      'usd_market_cap',
      'is_currently_live',
      'livestream_title',
      'num_participants',
      'reply_count',
      'thumbnail',
      'last_reply',
    ];
    if (filter.field && !validFields.includes(filter.field)) {
      errors.push(
        `${prefix}: invalid field "${filter.field}". Valid fields: ${validFields.join(', ')}`
      );
    }

    return errors;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate similarity score between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) {
      return 1.0;
    }
    if (str1.length === 0 || str2.length === 0) {
      return 0.0;
    }

    const distance = this.calculateLevenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    return 1 - distance / maxLength;
  }

  /**
   * Create a result sorter based on multiple criteria
   */
  createResultSorter(
    sortCriteria: Array<{
      field: keyof LiveCoin | 'relevanceScore';
      order: 'ASC' | 'DESC';
      weight?: number; // for custom scoring algorithms
    }>
  ) {
    return (a: any, b: any): number => {
      for (const criterion of sortCriteria) {
        const { field, order, weight = 1 } = criterion;

        let aValue = a[field];
        let bValue = b[field];

        // Handle undefined/null values
        if (aValue === undefined || aValue === null) {
          aValue = order === 'ASC' ? Infinity : -Infinity;
        }
        if (bValue === undefined || bValue === null) {
          bValue = order === 'ASC' ? Infinity : -Infinity;
        }

        // Ensure numeric comparison for numeric fields
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        let comparison = 0;
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }

        // Apply order and weight
        if (comparison !== 0) {
          return order === 'ASC' ? comparison * weight : -comparison * weight;
        }
      }

      return 0;
    };
  }

  /**
   * Create a relevance scoring function for search results
   */
  createRelevanceScorer(
    query: string,
    options: {
      fieldWeights?: Partial<Record<keyof LiveCoin, number>>;
      exactMatchBonus?: number;
      positionWeight?: number; // weight for early matches in text
      lengthPenalty?: boolean; // penalize very long texts
    } = {}
  ) {
    const {
      fieldWeights = { name: 2.0, symbol: 1.8, title: 1.5, description: 1.0 },
      exactMatchBonus = 2.0,
      positionWeight = 0.1,
      lengthPenalty = true,
    } = options;

    const normalizedQuery = query.toLowerCase();

    return (stream: LiveCoin): number => {
      let totalScore = 0;
      let totalWeight = 0;

      for (const [field, weight] of Object.entries(fieldWeights)) {
        if (weight === 0) {
          continue;
        }

        const value = stream[field as keyof LiveCoin];
        if (value === null || value === undefined) {
          continue;
        }

        const text = String(value).toLowerCase();
        let fieldScore = 0;

        // Exact match gets highest bonus
        if (text === normalizedQuery) {
          fieldScore = 1.0 * exactMatchBonus;
        }
        // Starts with query
        else if (text.startsWith(normalizedQuery)) {
          fieldScore = 0.8;
          // Add position-based bonus
          if (positionWeight > 0) {
            fieldScore += positionWeight;
          }
        }
        // Contains query
        else if (text.includes(normalizedQuery)) {
          fieldScore = 0.6;

          // Find position of match for position-based scoring
          const position = text.indexOf(normalizedQuery);
          if (position >= 0 && positionWeight > 0) {
            const positionBonus = Math.max(0, 1 - position / text.length) * positionWeight;
            fieldScore += positionBonus;
          }
        }
        // Word-level partial matching
        else {
          const words = text.split(/\s+/);
          let bestWordScore = 0;
          for (const word of words) {
            if (word.startsWith(normalizedQuery)) {
              bestWordScore = Math.max(bestWordScore, 0.4);
            } else if (word.includes(normalizedQuery)) {
              bestWordScore = Math.max(bestWordScore, 0.3);
            } else if (normalizedQuery.includes(word) && word.length > 2) {
              bestWordScore = Math.max(bestWordScore, 0.2);
            }
          }
          fieldScore = bestWordScore;
        }

        // Apply length penalty if enabled
        if (lengthPenalty && text.length > 200) {
          const lengthPenaltyFactor = Math.max(0.7, 1 - (text.length - 200) / 1000);
          fieldScore *= lengthPenaltyFactor;
        }

        totalScore += fieldScore * weight;
        totalWeight += weight;
      }

      return totalWeight > 0 ? totalScore / totalWeight : 0;
    };
  }
}
