/**
 * Live Stream Info Service for PumpFun API Client
 *
 * This service handles live stream information retrieval for specific mints
 * using the dedicated livestream API endpoint.
 */

import axios from 'axios';
import {
  LiveStreamInfo,
  LiveKitConnectionInfo,
  LiveKitRegion,
  LiveStreamsServiceConfig,
} from '../../types';
import {
  NetworkError,
  ServerError,
  TimeoutError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
} from '../../infrastructure/error-handling/errors';
import { Logger } from '../../infrastructure/logging/logger';
import {
  LIVEKIT_REGIONS,
  LIVEKIT_ROOM_PATTERN,
  MAX_LIVEKIT_REGIONS,
} from '../../constants/api.constants';

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
      // Use the livestream API endpoint from configuration
      const response = await axios.get(`${this.config.livestreamURL}/livestream?mintId=${mintId}`, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'PumpFun-API-Client/1.0.0',
          Accept: 'application/json',
        },
      });

      const data = response.data;

      // Handle successful response
      if (data && typeof data === 'object') {
        const streamInfo: LiveStreamInfo = {
          id: data.id ?? 0,
          supabaseId: data.supabaseId ?? 0,
          mintId: data.mintId ?? mintId,
          creatorAddress: data.creatorAddress ?? '',
          streamStartTimestamp: data.streamStartTimestamp ?? 0,
          numParticipants: data.numParticipants ?? data.participants ?? 0,
          maxParticipants: data.maxParticipants ?? 0,
          isLive: data.isLive ?? false,
          downrankScore: data.downrankScore ?? 0,
          title: data.title ?? '',
          mode: data.mode ?? 'broadcast',
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
            message: `Invalid request for live stream info: ${responseData?.message ?? error.message}`,
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
            message: `Unauthorized access to livestream API: ${responseData?.message ?? error.message}`,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        if (statusCode === 403) {
          throw new AuthorizationError({
            message: `Forbidden access to livestream API: ${responseData?.message ?? error.message}`,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        if (statusCode >= 500) {
          throw new ServerError({
            message: `Server error from livestream API: ${responseData?.message ?? error.message}`,
            statusCode,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        throw new NetworkError({
          message: `HTTP ${statusCode} error from livestream API: ${responseData?.message ?? error.message}`,
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
            baseURL: this.config.livestreamURL,
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

  /**
   * Check if a creator is approved for streaming
   */
  async isApprovedCreator(mintId: string): Promise<boolean> {
    this.logger.info('Checking creator approval status', {
      mintId,
      operation: 'isApprovedCreator',
    });

    try {
      // Use the livestream API endpoint from configuration for creator approval check
      const response = await axios.get(
        `${this.config.livestreamURL}/livestream/is-approved-creator?mintId=${mintId}`,
        {
          timeout: this.config.timeout,
          headers: {
            'User-Agent': 'PumpFun-API-Client/1.0.0',
            Accept: 'application/json',
          },
        }
      );

      // The API returns a boolean value directly
      const isApproved = Boolean(response.data);

      this.logger.info('Successfully checked creator approval status', {
        mintId,
        isApproved,
        responseType: typeof response.data,
      });

      return isApproved;
    } catch (error: any) {
      // Handle Axios errors specifically
      if (error.response) {
        const statusCode = error.response.status;
        const responseData = error.response.data;

        if (statusCode === 404) {
          // If creator is not found, they are not approved
          this.logger.info('Creator not found, treating as not approved', {
            mintId,
            statusCode,
          });
          return false;
        }

        if (statusCode === 400) {
          throw new ValidationError({
            message: `Invalid request for creator approval check: ${responseData?.message ?? error.message}`,
            details: {
              mintId,
              statusCode,
              endpoint: '/livestream/is-approved-creator',
              responseStatus: statusCode,
              responseData: error.response.data,
            },
          });
        }

        if (statusCode === 401) {
          throw new AuthenticationError({
            message: `Unauthorized access to creator approval API: ${responseData?.message ?? error.message}`,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        if (statusCode === 403) {
          throw new AuthorizationError({
            message: `Forbidden access to creator approval API: ${responseData?.message ?? error.message}`,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        if (statusCode >= 500) {
          throw new ServerError({
            message: `Server error from creator approval API: ${responseData?.message ?? error.message}`,
            statusCode,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        throw new NetworkError({
          message: `HTTP ${statusCode} error from creator approval API: ${responseData?.message ?? error.message}`,
          code: 'CREATOR_APPROVAL_API_HTTP_ERROR',
          statusCode,
          details: {
            mintId,
            endpoint: '/livestream/is-approved-creator',
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
          message: `Network error connecting to creator approval API: ${error.message}`,
          code: error.code,
          details: {
            mintId,
            errorCode: error.code,
            baseURL: this.config.livestreamURL,
          },
        });
      }

      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new TimeoutError({
          message: `Request timeout while checking creator approval: ${error.message}`,
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

  /**
   * Get LiveKit connection details for video streaming
   */
  async getLiveKitConnectionInfo(mintId: string): Promise<LiveKitConnectionInfo | null> {
    this.logger.info('Fetching LiveKit connection information', {
      mintId,
      operation: 'getLiveKitConnectionInfo',
    });

    try {
      // First, get the stream info to check if there's an active stream
      const streamInfo = await this.getLiveStreamInfo(mintId);

      if (!streamInfo || !streamInfo.isLive) {
        this.logger.info('No active stream found for LiveKit connection', {
          mintId,
          hasStreamInfo: !!streamInfo,
          isLive: streamInfo?.isLive ?? false,
        });
        return null;
      }

      // Generate LiveKit connection details
      const roomName = LIVEKIT_ROOM_PATTERN.replace('{mintId}', mintId).replace(
        '{streamId}',
        streamInfo.id.toString()
      );

      // Select optimal regions based on stream info and geography
      const availableRegions = this.selectOptimalRegions(streamInfo);

      // Choose primary server (first in the list as optimal)
      const primaryServer = availableRegions[0]?.url ?? LIVEKIT_REGIONS[0].url;

      const connectionInfo: LiveKitConnectionInfo = {
        regions: availableRegions,
        primaryServer,
        roomName,
        mintId,
        streamId: streamInfo.id,
        websocketUrl: primaryServer,
        requiresAuthentication: true, // LiveKit typically requires authentication
      };

      this.logger.info('Successfully generated LiveKit connection information', {
        mintId,
        streamId: streamInfo.id,
        roomName,
        primaryServer,
        regionCount: availableRegions.length,
        requiresAuthentication: connectionInfo.requiresAuthentication,
      });

      return connectionInfo;
    } catch (error: any) {
      // Handle errors from getLiveStreamInfo or other issues
      if (
        error instanceof ValidationError ||
        error instanceof NetworkError ||
        error instanceof TimeoutError ||
        error instanceof ServerError ||
        error instanceof AuthenticationError ||
        error instanceof AuthorizationError
      ) {
        this.logger.error('Failed to get LiveKit connection info due to stream info error', {
          mintId,
          error: error.message,
          errorCode: error.code,
        });
        throw error;
      }

      // Handle any other unexpected errors
      this.logger.error('Unexpected error generating LiveKit connection info', {
        mintId,
        error: error.message,
        errorType: error.constructor.name,
      });

      throw new NetworkError({
        message: `Failed to generate LiveKit connection information: ${error.message}`,
        code: 'LIVEKIT_CONNECTION_ERROR',
        details: {
          mintId,
          originalError: error.message,
        },
      });
    }
  }

  /**
   * Select optimal LiveKit regions based on stream information
   */
  private selectOptimalRegions(streamInfo: LiveStreamInfo): LiveKitRegion[] {
    const regions: LiveKitRegion[] = [];
    const DEFAULT_DISTANCE = 999;

    // Convert LIVEKIT_REGIONS to LiveKitRegion format
    for (const regionConfig of LIVEKIT_REGIONS.slice(0, MAX_LIVEKIT_REGIONS)) {
      regions.push({
        region: regionConfig.region,
        url: regionConfig.url,
        distance: this.calculateRegionDistance(regionConfig.region, streamInfo),
      });
    }

    // Sort by distance (lower distance = higher priority)
    regions.sort((a, b) => {
      const distanceA = parseFloat(a.distance) ?? DEFAULT_DISTANCE;
      const distanceB = parseFloat(b.distance) ?? DEFAULT_DISTANCE;
      return distanceA - distanceB;
    });

    this.logger.debug('Selected optimal LiveKit regions', {
      mintId: streamInfo.mintId,
      streamId: streamInfo.id,
      regions: regions.map(r => ({ region: r.region, distance: r.distance })),
    });

    return regions;
  }

  /**
   * Calculate distance metric for region selection
   * This is a simplified implementation - in production, you might use
   * actual geographic data or latency measurements
   */
  private calculateRegionDistance(region: string, streamInfo: LiveStreamInfo): string {
    // Constants for distance calculation
    const MAX_PARTICIPANTS_FOR_FACTOR = 100;
    const PARTICIPANT_FACTOR_MULTIPLIER = 0.5;

    // Simple distance calculation based on region and participant count
    // Higher participant count might indicate better region connectivity
    const baseDistance = this.getRegionBaseDistance(region);
    const participantFactor =
      Math.max(0, MAX_PARTICIPANTS_FOR_FACTOR - streamInfo.numParticipants) /
      MAX_PARTICIPANTS_FOR_FACTOR;
    const adjustedDistance = baseDistance * (1 + participantFactor * PARTICIPANT_FACTOR_MULTIPLIER);

    return adjustedDistance.toFixed(2);
  }

  /**
   * Get base distance for different regions
   */
  private getRegionBaseDistance(region: string): number {
    // Constants for region distances
    const PRIMARY_REGION_DISTANCE = 10;
    const SECONDARY_US_REGION_DISTANCE = 25;
    const EUROPE_REGION_DISTANCE = 50;
    const ASIA_PACIFIC_REGION_DISTANCE = 80;
    const DEFAULT_REGION_DISTANCE = 100;

    const regionDistances: Record<string, number> = {
      'us-east-1': PRIMARY_REGION_DISTANCE, // Primary region - lowest distance
      'us-west-2': SECONDARY_US_REGION_DISTANCE, // Secondary US region
      'eu-west-1': EUROPE_REGION_DISTANCE, // European region
      'ap-southeast-1': ASIA_PACIFIC_REGION_DISTANCE, // Asia Pacific region
    };

    return regionDistances[region] ?? DEFAULT_REGION_DISTANCE; // Default distance for unknown regions
  }
}
