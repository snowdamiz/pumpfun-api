/**
 * Live Streams Validator for PumpFun API Client
 *
 * This module contains all validation logic for live streams operations
 * including parameter validation and response validation.
 */

import {
  LiveCoin,
  GetLiveCoinsParams
} from './types';
import {
  ServerError,
  ConfigurationError,
} from '../utils/errors';
import { Logger } from '../utils/logger';

/**
 * Handles validation for live streams operations
 */
export class LiveStreamsValidator {
  constructor(private logger: Logger) {}

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
}