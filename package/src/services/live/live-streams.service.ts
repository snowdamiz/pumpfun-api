/**
 * Live Streams Service for PumpFun API Client
 *
 * This service handles all live stream related operations including fetching
 * live coins, filtering streams, and stream information retrieval.
 */

import {
  LiveCoin,
  GetLiveCoinsParams,
  LiveStreamInfo,
  LiveKitConnectionInfo,
  LiveStreamsServiceConfig,
  ServiceState,
  VideoStreamAnalysis,
} from '../../types';
import { Logger } from '../../infrastructure/logging/logger';
import { RateLimiter } from '../../infrastructure/rate-limiting/rate-limiter';
import { HTTPClient } from '../../infrastructure/http/http-client';
import { ErrorHandler } from '../../infrastructure/error-handling/error-handler';
import { StreamFilters } from './stream-filters.service';
import { LiveStreamsValidator } from '../../validation/streams.validator';
import { LiveStreamsRequestHandler } from '../../infrastructure/http/request-handler';
import { LiveStreamInfoService } from './stream-info.service';

/**
 * Service for handling live streams operations
 */
export class LiveStreamsService {
  private streamFilters: StreamFilters;
  private validator: LiveStreamsValidator;
  private requestHandler: LiveStreamsRequestHandler;
  private streamInfoService: LiveStreamInfoService;

  constructor(
    private config: LiveStreamsServiceConfig,
    httpClient: HTTPClient,
    private logger: Logger,
    private rateLimiter: RateLimiter,
    private errorHandler: ErrorHandler,
    private state: ServiceState
  ) {
    // Initialize helper services
    this.validator = new LiveStreamsValidator(logger);
    this.requestHandler = new LiveStreamsRequestHandler(config, httpClient, logger);
    this.streamInfoService = new LiveStreamInfoService(config, logger);
    this.streamFilters = new StreamFilters(logger, errorHandler, (params?: GetLiveCoinsParams) =>
      this.getLiveCoins(params)
    );
  }

  /**
   * Get currently live streaming coins
   */
  async getLiveCoins(params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    // Set default parameter values
    const defaultParams: Required<GetLiveCoinsParams> = {
      offset: 0,
      limit: 10,
      sort: 'currently_live',
      order: 'DESC',
      includeNsfw: false,
    };

    // Merge provided params with defaults
    const mergedParams = { ...defaultParams, ...params };

    // Validate parameters
    this.validator.validateGetLiveCoinsParams(mergedParams);

    try {
      this.logger.info('Fetching live streaming coins...', {
        endpoint: '/coins/currently-live',
        params: mergedParams,
        baseURL: this.config.baseURL,
      });

      // Apply rate limiting before making the request
      await this.rateLimiter.waitForRequest();

      // Build query string
      const queryString = this.requestHandler.buildQueryString(mergedParams);
      const endpoint = `/coins/currently-live${queryString}`;

      // Enhanced request with specific error handling for API failures
      const response = await this.requestHandler.executeLiveCoinsRequest(endpoint, mergedParams);

      // Update statistics
      this.state.requestCount++;
      this.state.lastRequestTime = Date.now();

      // Record successful request in rate limiter
      this.rateLimiter.recordRequest();

      // Validate response data with enhanced error handling
      const liveCoins = this.validator.validateLiveCoinsResponseWithFallback(
        response,
        mergedParams
      );

      this.logger.info('Successfully fetched live streaming coins', {
        count: liveCoins.length,
        params: mergedParams,
        hasMore: liveCoins.length === mergedParams.limit,
        responseTime: Date.now() - this.state.lastRequestTime,
      });

      return liveCoins;
    } catch (error) {
      this.state.errorCount++;
      const pumpFunError = this.errorHandler.handleError(error, 'getLiveCoins', {
        endpoint: '/coins/currently-live',
        params: mergedParams,
        baseURL: this.config.baseURL,
        requestTime: new Date().toISOString(),
      });

      this.logger.error('Failed to fetch live streaming coins', {
        error: pumpFunError.toJSON(),
        params: mergedParams,
        resolution: pumpFunError.getResolution(),
        errorCategory: pumpFunError.details?.errorCategory,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get active streams with minimum participants
   */
  async getActiveStreams(
    minParticipants: number = 1,
    params?: GetLiveCoinsParams
  ): Promise<LiveCoin[]> {
    return this.streamFilters.getActiveStreams(minParticipants, params);
  }

  /**
   * Get top live streams by participant count
   */
  async getTopLiveStreams(limit: number = 10, params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    return this.streamFilters.getTopLiveStreams(limit, params);
  }

  /**
   * Get top active streams (combination of active and top)
   */
  async getTopActiveStreams(limit: number = 10, minParticipants: number = 1): Promise<LiveCoin[]> {
    return this.streamFilters.getTopActiveStreams(limit, minParticipants);
  }

  /**
   * Get streams with meaningful titles
   */
  async getTitledStreams(limit: number = 10, params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    return this.streamFilters.getTitledStreams(limit, params);
  }

  /**
   * Get titled active streams
   */
  async getTitledActiveStreams(
    limit: number = 10,
    minParticipants: number = 1,
    params?: GetLiveCoinsParams
  ): Promise<LiveCoin[]> {
    return this.streamFilters.getTitledActiveStreams(limit, minParticipants, params);
  }

  /**
   * Get live stream information for a specific mint
   */
  async getLiveStreamInfo(mintId: string): Promise<LiveStreamInfo | null> {
    return this.streamInfoService.getLiveStreamInfo(mintId);
  }

  /**
   * Check if a creator is approved for streaming
   */
  async isApprovedCreator(mintId: string): Promise<boolean> {
    return this.streamInfoService.isApprovedCreator(mintId);
  }

  /**
   * Get LiveKit connection details for video streaming
   */
  async getLiveKitConnectionInfo(mintId: string): Promise<LiveKitConnectionInfo | null> {
    this.logger.info('Getting LiveKit connection information via LiveStreamsService', {
      mintId,
      operation: 'getLiveKitConnectionInfo',
    });

    try {
      return await this.streamInfoService.getLiveKitConnectionInfo(mintId);
    } catch (error) {
      this.logger.error('Failed to get LiveKit connection info via LiveStreamsService', {
        mintId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get comprehensive video stream analysis for a specific mint
   *
   * This method combines all video stream related information into a single
   * comprehensive analysis, including stream status, creator approval, and
   * LiveKit connection details.
   */
  async getVideoStreamAnalysis(mintId: string): Promise<VideoStreamAnalysis> {
    this.logger.info('Starting comprehensive video stream analysis', {
      mintId,
      operation: 'getVideoStreamAnalysis',
    });

    try {
      // Execute all three analysis components in parallel for efficiency
      const [streamInfo, isApprovedCreator, liveKitConnection] = await Promise.allSettled([
        this.streamInfoService.getLiveStreamInfo(mintId),
        this.streamInfoService.isApprovedCreator(mintId),
        this.streamInfoService.getLiveKitConnectionInfo(mintId),
      ]);

      // Extract results from Promise.allSettled
      const streamInfoResult = streamInfo.status === 'fulfilled' ? streamInfo.value : null;
      const isApprovedCreatorResult =
        isApprovedCreator.status === 'fulfilled' ? isApprovedCreator.value : false;
      const liveKitConnectionResult =
        liveKitConnection.status === 'fulfilled' ? liveKitConnection.value : null;

      // Log any errors that occurred during parallel execution
      if (streamInfo.status === 'rejected') {
        const streamError = streamInfo.reason;
        this.logger.warn('Failed to get stream info during analysis', {
          mintId,
          error: streamError instanceof Error ? streamError.message : String(streamError),
        });
      }

      if (isApprovedCreator.status === 'rejected') {
        const approvalError = isApprovedCreator.reason;
        this.logger.warn('Failed to check creator approval during analysis', {
          mintId,
          error: approvalError instanceof Error ? approvalError.message : String(approvalError),
        });
      }

      if (liveKitConnection.status === 'rejected') {
        const connectionError = liveKitConnection.reason;
        this.logger.warn('Failed to get LiveKit connection info during analysis', {
          mintId,
          error:
            connectionError instanceof Error ? connectionError.message : String(connectionError),
        });
      }

      // Determine if there's an active stream
      const hasActiveStream = !!(streamInfoResult && streamInfoResult.isLive);

      // Create the comprehensive analysis result
      const analysis: VideoStreamAnalysis = {
        hasActiveStream,
        isApprovedCreator: isApprovedCreatorResult,
        streamInfo: streamInfoResult ?? undefined,
        liveKitConnection: liveKitConnectionResult ?? undefined,
        analyzedAt: new Date().toISOString(),
      };

      this.logger.info('Successfully completed video stream analysis', {
        mintId,
        hasActiveStream: analysis.hasActiveStream,
        isApprovedCreator: analysis.isApprovedCreator,
        hasStreamInfo: !!analysis.streamInfo,
        hasLiveKitConnection: !!analysis.liveKitConnection,
        streamId: analysis.streamInfo?.id,
        participantCount: analysis.streamInfo?.numParticipants,
        analyzedAt: analysis.analyzedAt,
      });

      return analysis;
    } catch (unknownError) {
      const errorMessage =
        unknownError instanceof Error ? unknownError.message : String(unknownError);
      const errorType = unknownError instanceof Error ? unknownError.constructor.name : 'Unknown';

      this.logger.error('Unexpected error during video stream analysis', {
        mintId,
        error: errorMessage,
        errorType,
      });

      // Re-throw as a more specific error if possible
      if (unknownError instanceof Error) {
        throw unknownError;
      }

      // Wrap unknown errors
      throw new Error(`Video stream analysis failed for mintId ${mintId}: ${errorMessage}`);
    }
  }
}
