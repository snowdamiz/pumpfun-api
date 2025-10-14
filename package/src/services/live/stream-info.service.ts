/**
 * Live Stream Info Service for PumpFun API Client
 *
 * This service handles live stream information retrieval for specific mints
 * using the dedicated livestream API endpoint.
 */

import axios from 'axios';
import { LiveStreamInfo, LiveStreamsServiceConfig } from '../../types';
import {
  NetworkError,
  ServerError,
  TimeoutError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
} from '../../infrastructure/error-handling/errors';
import { Logger } from '../../infrastructure/logging/logger';

/**
 * Service for handling live stream information operations
 */
export class LiveStreamInfoService {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private config: LiveStreamsServiceConfig,
    private logger: Logger
  ) {
    // Required for parameter properties
  }

  /**
   * Get live stream information for a specific mint
   */
  async getLiveStreamInfo(mintId: string): Promise<LiveStreamInfo | null> {
    this.logger.info('Fetching live stream information', {
      mintId,
      operation: 'getLiveStreamInfo',
    });

    try {
      // Use the livestream API endpoint directly
      const response = await axios.get(
        `https://livestream-api.pump.fun/livestream?mintId=${mintId}`,
        {
          timeout: this.config.timeout,
          headers: {
            'User-Agent': 'PumpFun-API-Client/1.0.0',
            Accept: 'application/json',
          },
        }
      );

      const data = response.data;

      // Handle successful response
      if (data && typeof data === 'object') {
        const streamInfo: LiveStreamInfo = {
          id: data.id || 0,
          supabaseId: data.supabaseId || 0,
          mintId: data.mintId || mintId,
          creatorAddress: data.creatorAddress || '',
          streamStartTimestamp: data.streamStartTimestamp || 0,
          numParticipants: data.numParticipants || data.participants || 0,
          maxParticipants: data.maxParticipants || 0,
          isLive: data.isLive || false,
          downrankScore: data.downrankScore || 0,
          title: data.title || '',
          mode: data.mode || 'broadcast',
        };

        this.logger.info('Successfully fetched live stream information', {
          mintId,
          isLive: streamInfo.isLive,
          numParticipants: streamInfo.numParticipants,
          hasTitle: !!streamInfo.title,
        });

        return streamInfo;
      }

      // Handle empty or null response
      this.logger.warn('No live stream information found', {
        mintId,
        responseType: typeof data,
      });

      return null;
    } catch (error: any) {
      // Handle Axios errors specifically
      if (error.response) {
        const statusCode = error.response.status;
        const responseData = error.response.data;

        if (statusCode === 404) {
          this.logger.info('Live stream not found', { mintId });
          return null;
        }

        if (statusCode === 400) {
          throw new ValidationError({
            message: `Invalid request for live stream info: ${responseData?.message || error.message}`,
            details: {
              mintId,
              statusCode,
              endpoint: `/livestream?mintId=${mintId}`,
              responseStatus: statusCode,
              responseData: error.response.data,
            },
          });
        }

        if (statusCode === 401) {
          throw new AuthenticationError({
            message: `Unauthorized access to livestream API: ${responseData?.message || error.message}`,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        if (statusCode === 403) {
          throw new AuthorizationError({
            message: `Forbidden access to livestream API: ${responseData?.message || error.message}`,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        if (statusCode >= 500) {
          throw new ServerError({
            message: `Server error from livestream API: ${responseData?.message || error.message}`,
            statusCode,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        throw new NetworkError({
          message: `HTTP ${statusCode} error from livestream API: ${responseData?.message || error.message}`,
          code: 'LIVESTREAM_API_HTTP_ERROR',
          statusCode,
          details: {
            mintId,
            endpoint: `/livestream?mintId=${mintId}`,
            responseStatus: statusCode,
            responseData: error.response.data,
          },
        });
      }

      // Handle network errors
      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT'
      ) {
        throw new NetworkError({
          message: `Network error connecting to livestream API: ${error.message}`,
          code: error.code,
          details: {
            mintId,
            errorCode: error.code,
            baseURL: 'https://livestream-api.pump.fun',
          },
        });
      }

      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new TimeoutError({
          message: `Request timeout while fetching live stream information: ${error.message}`,
          timeout: this.config.timeout,
          details: {
            mintId,
            timeout: this.config.timeout,
          },
        });
      }

      // Re-throw unknown errors
      throw error;
    }
  }
}
