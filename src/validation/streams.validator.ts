/**
 * Live Streams Validator for PumpFun API Client
 *
 * This module contains all validation logic for live streams operations
 * including parameter validation and response validation.
 */

import { LiveCoin, GetLiveCoinsParams, StreamClip } from '../types';
import { ServerError } from '../infrastructure/error-handling/errors';
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

  /**
   * Validate individual stream clip object
   */
  validateStreamClip(clip: any, index: number): StreamClip {
    const errors: string[] = [];

    // Type checking
    if (!clip || typeof clip !== 'object') {
      errors.push(`Item ${index}: Expected object, got ${typeof clip}`);
      throw new ServerError({
        message: `Invalid stream clip data at index ${index}`,
        statusCode: 500,
        details: { errors, index, clipData: clip },
      });
    }

    // Required field validation
    const requiredFields: (keyof StreamClip)[] = ['id', 'mintId', 'clipType'];
    for (const field of requiredFields) {
      if (!(field in clip)) {
        errors.push(`Item ${index}: Missing required field '${field}'`);
      }
    }

    // Type validation for required fields
    if (clip.id && typeof clip.id !== 'string') {
      errors.push(`Item ${index}: Field 'id' must be string, got ${typeof clip.id}`);
    }

    if (clip.mintId && typeof clip.mintId !== 'string') {
      errors.push(`Item ${index}: Field 'mintId' must be string, got ${typeof clip.mintId}`);
    }

    if (clip.clipType && typeof clip.clipType !== 'string') {
      errors.push(`Item ${index}: Field 'clipType' must be string, got ${typeof clip.clipType}`);
    }

    // Format validation for specific fields
    if (clip.mintId && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clip.mintId)) {
      errors.push(
        `Item ${index}: Field 'mintId' has invalid Solana address format: ${clip.mintId}`
      );
    }

    // Validate clip type enum
    if (clip.clipType && !['COMPLETE', 'HIGHLIGHT'].includes(clip.clipType)) {
      errors.push(
        `Item ${index}: Field 'clipType' must be 'COMPLETE' or 'HIGHLIGHT', got '${clip.clipType}'`
      );
    }

    // Optional fields validation (if present)
    const optionalFields: (keyof StreamClip)[] = [
      'duration',
      'view_count',
      'created_at',
      'clip_url',
    ];
    for (const field of optionalFields) {
      if (clip[field] !== undefined && clip[field] !== null) {
        switch (field) {
          case 'duration':
            if (typeof clip[field] !== 'number' || clip[field] < 1) {
              errors.push(
                `Item ${index}: Field '${field}' must be a positive number, got ${clip[field]}`
              );
            }
            break;
          case 'view_count':
            if (typeof clip[field] !== 'number' || clip[field] < 0) {
              errors.push(
                `Item ${index}: Field '${field}' must be a non-negative number, got ${clip[field]}`
              );
            }
            break;
          case 'created_at':
            if (typeof clip[field] !== 'string') {
              errors.push(
                `Item ${index}: Field '${field}' must be string (ISO 8601), got ${typeof clip[field]}`
              );
            } else {
              // Validate ISO 8601 format
              const date = new Date(clip[field]);
              if (isNaN(date.getTime())) {
                errors.push(
                  `Item ${index}: Field '${field}' must be a valid ISO 8601 date, got '${clip[field]}'`
                );
              }
            }
            break;
          case 'clip_url':
            if (typeof clip[field] !== 'string') {
              errors.push(
                `Item ${index}: Field '${field}' must be string (URL), got ${typeof clip[field]}`
              );
            } else {
              // Basic URL validation
              try {
                new URL(clip[field]);
              } catch {
                errors.push(
                  `Item ${index}: Field '${field}' must be a valid URL, got '${clip[field]}'`
                );
              }
            }
            break;
        }
      }
    }

    // If we have validation errors, throw a detailed error
    if (errors.length > 0) {
      throw new ServerError({
        message: `Stream clip validation failed for item at index ${index}`,
        statusCode: 500,
        details: { errors, index, clipData: this.sanitizeClipForLogging(clip) },
      });
    }

    // Create a clean, validated StreamClip object with proper typing
    const validatedClip: StreamClip = {
      id: clip.id,
      mintId: clip.mintId,
      clipType: clip.clipType as 'COMPLETE' | 'HIGHLIGHT',
      duration: clip.duration || 0, // Required field with fallback
      created_at: clip.created_at || new Date().toISOString(), // Required field with fallback
      roomName: clip.roomName || `room-${clip.id}`, // Required field with fallback
      sessionId: clip.sessionId || `session-${clip.id}`, // Required field with fallback
      startTime: clip.startTime || clip.created_at || new Date().toISOString(), // Required field with fallback
      endTime: clip.endTime || new Date().toISOString(), // Required field with fallback
      thumbnailUrl: clip.thumbnailUrl || clip.clip_url || '', // Required field with fallback
      hidden: clip.hidden || false, // Required field with fallback
      // Optional fields (only include if present and valid)
      ...(clip.view_count !== undefined && { view_count: clip.view_count }),
      ...(clip.clip_url !== undefined && { clip_url: clip.clip_url }),
      ...(clip.thumbnailS3Key !== undefined && { thumbnailS3Key: clip.thumbnailS3Key }),
      ...(clip.playlistS3Key !== undefined && { playlistS3Key: clip.playlistS3Key }),
      ...(clip.playlistUrl !== undefined && { playlistUrl: clip.playlistUrl }),
      ...(clip.mp4Url !== undefined && { mp4Url: clip.mp4Url }),
      ...(clip.mp4S3Key !== undefined && { mp4S3Key: clip.mp4S3Key }),
      ...(clip.mp4SizeBytes !== undefined && { mp4SizeBytes: clip.mp4SizeBytes }),
      ...(clip.mp4CreatedAt !== undefined && { mp4CreatedAt: clip.mp4CreatedAt }),
      ...(clip.highlightCreatorAddress !== undefined && { highlightCreatorAddress: clip.highlightCreatorAddress }),
    };

    return validatedClip;
  }

  /**
   * Sanitize clip data for logging to remove sensitive or large fields
   */
  private sanitizeClipForLogging(clip: any): any {
    if (!clip || typeof clip !== 'object') {
      return clip;
    }

    const sanitized = { ...clip };
    // Truncate long URLs for logging
    if (sanitized.clip_url && typeof sanitized.clip_url === 'string') {
      if (sanitized.clip_url.length > 100) {
        sanitized.clip_url = `${sanitized.clip_url.substring(0, 97)}...`;
      }
    }
    return sanitized;
  }
}
