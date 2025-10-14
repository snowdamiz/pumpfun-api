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
  JoinLiveStreamResponse,
  SearchLiveStreamsParams,
  StreamSearchResult,
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
    private httpClient: HTTPClient,
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
   * Search live streams by keyword across multiple fields
   */
  async searchLiveStreams(params: SearchLiveStreamsParams): Promise<StreamSearchResult[]> {
    this.logger.info('Searching live streams via LiveStreamsService', {
      keyword: params.keyword,
      searchIn: params.searchIn,
      limit: params.limit,
      minParticipants: params.minParticipants,
      currentlyLiveOnly: params.currentlyLiveOnly,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    try {
      return await this.streamFilters.searchLiveStreams(params);
    } catch (error) {
      this.logger.error('Failed to search live streams via LiveStreamsService', {
        keyword: params.keyword,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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

  /**
   * Attempt to join an active live stream
   *
   * This method sends a join request to the livestream API for a specific mint.
   * If successful, it returns connection details for the LiveKit video stream.
   *
   * @param mintId - The mint identifier of the token to join the stream for
   * @returns Promise<JoinLiveStreamResponse> - Join attempt result with connection details if successful
   */
  async joinLiveStream(mintId: string): Promise<JoinLiveStreamResponse> {
    this.logger.info('Attempting to join live stream', {
      mintId,
      operation: 'joinLiveStream',
    });

    // Validate input
    if (!mintId || typeof mintId !== 'string' || mintId.trim().length === 0) {
      const errorResponse: JoinLiveStreamResponse = {
        success: false,
        message: 'Invalid mintId provided',
        error: {
          code: 'INVALID_PARAMETER',
          details: 'mintId must be a non-empty string',
        },
      };

      this.logger.warn('Invalid mintId provided for joinLiveStream', {
        mintId,
        error: errorResponse.error,
      });

      return errorResponse;
    }

    try {
      // Apply rate limiting before making the request
      await this.rateLimiter.waitForRequest();

      // Build the join request - use livestream URL for video operations
      const endpoint = '/livestream/join';
      const requestBody = { mintId: mintId.trim() };

      this.logger.debug('Sending join request to livestream API', {
        endpoint,
        mintId: requestBody.mintId,
        baseURL: this.config.livestreamURL,
      });

      // Make the POST request to join the stream using the livestream API URL
      // We need to make a direct request to get the full response with status code
      const response = await (this.httpClient as any).client.request({
        method: 'POST',
        url: `${this.config.livestreamURL}${endpoint}`,
        data: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: this.config.timeout ?? 10000, // 10 second default timeout
      });

      // Update statistics
      this.state.requestCount++;
      this.state.lastRequestTime = Date.now();

      // Record successful request in rate limiter
      this.rateLimiter.recordRequest();

      // Debug: Log the actual response structure (avoiding circular references)
      this.logger.debug('Join stream API response received', {
        responseType: typeof response,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : null,
        hasResponseStatus: !!response.status,
        responseStatus: response.status,
        responseStatusCode: response.status,
        isAxiosResponse: response.constructor.name === 'AxiosResponse',
      });

      // The API returns 201 status for successful join, even if response.data is undefined
      if (response.status === 201) {
        // For successful join (status 201), create a success response even without response data
        const joinResponse: JoinLiveStreamResponse = {
          success: true,
          message: `Successfully joined live stream for ${mintId}`,
          streamId: undefined, // API doesn't return these fields in current implementation
          roomName: `${mintId}:stream`, // Use fallback pattern
          websocketUrl: undefined,
          requiresAuthentication: true, // Default to true for video streams
        };

        this.logger.info('Successfully joined live stream (201 status)', {
          mintId,
          success: true,
          message: joinResponse.message,
        });

        return joinResponse;
      }

      // Validate response structure for other status codes
      if (!response.data) {
        throw new Error('No response data received from join stream API');
      }

      const responseData = response.data;

      // Create successful join response - API may return different formats
      const joinResponse: JoinLiveStreamResponse = {
        success: true,
        message: `Successfully joined live stream for ${mintId}`,
        streamId: responseData.streamId ?? responseData.id ?? undefined,
        roomName: responseData.roomName ?? `${mintId}:stream`, // fallback pattern
        websocketUrl: responseData.websocketUrl ?? responseData.url ?? undefined,
        requiresAuthentication: responseData.requiresAuthentication ?? false,
      };

      this.logger.info('Successfully joined live stream', {
        mintId,
        streamId: joinResponse.streamId,
        roomName: joinResponse.roomName,
        hasWebsocketUrl: !!joinResponse.websocketUrl,
        requiresAuthentication: joinResponse.requiresAuthentication,
        responseTime: Date.now() - this.state.lastRequestTime,
      });

      return joinResponse;
    } catch (error) {
      this.state.errorCount++;

      // Handle different types of errors appropriately
      let errorResponse: JoinLiveStreamResponse;

      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('404')) {
          errorResponse = {
            success: false,
            message: `No active stream found for mint: ${mintId}`,
            error: {
              code: 'STREAM_NOT_FOUND',
              details: 'There is no active live stream for this token',
            },
          };
        } else if (error.message.includes('403') || error.message.includes('401')) {
          errorResponse = {
            success: false,
            message: `Access denied for stream: ${mintId}`,
            error: {
              code: 'ACCESS_DENIED',
              details: 'You do not have permission to join this stream',
            },
          };
        } else if (error.message.includes('429')) {
          errorResponse = {
            success: false,
            message: `Rate limit exceeded while joining stream: ${mintId}`,
            error: {
              code: 'RATE_LIMITED',
              details: 'Too many join requests, please try again later',
            },
          };
        } else {
          // Generic error
          errorResponse = {
            success: false,
            message: `Failed to join stream for ${mintId}: ${error.message}`,
            error: {
              code: 'JOIN_FAILED',
              details: error.message,
            },
          };
        }
      } else {
        // Unknown error type
        errorResponse = {
          success: false,
          message: `Unknown error occurred while joining stream for ${mintId}`,
          error: {
            code: 'UNKNOWN_ERROR',
            details: String(error),
          },
        };
      }

      this.logger.error('Failed to join live stream', {
        mintId,
        error: errorResponse.error,
        success: errorResponse.success,
        resolution: this.getJoinErrorResolution(errorResponse.error?.code),
      });

      return errorResponse;
    }
  }

  /**
   * Get resolution guidance for join stream errors
   */
  private getJoinErrorResolution(errorCode?: string): string {
    switch (errorCode) {
      case 'STREAM_NOT_FOUND':
        return 'Verify the mintId is correct and the stream is currently active';
      case 'ACCESS_DENIED':
        return 'Check if you have the required permissions or if the stream is private';
      case 'RATE_LIMITED':
        return 'Wait before making another join request or check your rate limit status';
      case 'INVALID_PARAMETER':
        return 'Ensure the mintId is a valid Solana address format';
      default:
        return 'Check network connectivity and try again later';
    }
  }
}
