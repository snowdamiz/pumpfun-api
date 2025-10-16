/**
 * PumpFun API Client - Main client class for accessing PumpFun streaming data API
 *
 * This is the main entry point for interacting with the PumpFun API. It provides
 * methods for accessing live streaming data, video stream information, and more.
 *
 * @version 1.0.0
 * @author PumpFun Team
 */

import {
  ClientConfig,
  ClientState,
  RateLimitState,
  LiveCoin,
  GetLiveCoinsParams,
  StreamOptions,
  LiveStreamInfo,
  LiveKitConnectionInfo,
  ValidatedConfig,
  VideoStreamAnalysis,
  JoinLiveStreamResponse,
  SearchLiveStreamsParams,
  StreamSearchResult,
  StreamStatistics,
  StreamClip,
  StreamHistoryResult,
  LiveKitConnectionOptions,
  LiveStreamConnection,
  ConnectionState,
  JurisdictionResponse,
  UnifiedFilterCriteria,
  AdvancedFilterResult
} from '../types';
import {
  ClipFilterParams,
  ClipFilterResult,
  StreamFilters,
} from '../services/live/stream-filters.service';

import { HTTPClient } from '../infrastructure/http/http-client';
import { Logger } from '../infrastructure/logging/logger';
import { RateLimiter } from '../infrastructure/rate-limiting/rate-limiter';
import {
  PumpFunError,
  NetworkError,
  RateLimitError,
  ServerError,
  ConfigurationError,
  TimeoutError,
  LiveKitError,
  ErrorUtils,
} from '../infrastructure/error-handling/errors';
import { ConfigurationManager } from '../infrastructure/config/config-manager';
import { ErrorHandler } from '../infrastructure/error-handling/error-handler';
import { LiveStreamsService } from '../services/live/live-streams.service';
import { LiveKitStreamManager } from '../services/live/LiveKitStreamManager';

/**
 * Main API client class for PumpFun streaming data
 */
export class PumpFunAPIClient {
  /** Core components */
  private httpClient!: HTTPClient;
  private logger!: Logger;
  private rateLimiter!: RateLimiter;
  private configManager!: ConfigurationManager;
  private errorHandler!: ErrorHandler;
  private liveStreamsService!: LiveStreamsService;
  private streamFilters!: StreamFilters;
  private liveKitStreamManager!: LiveKitStreamManager;

  /** Runtime state tracking */
  private state!: ClientState;

  /** Whether the client is initialized */
  private isInitialized: boolean = false;

  /**
   * Create a new PumpFunAPIClient instance
   *
   * @param config - Optional configuration options
   */
  constructor(config?: ClientConfig) {
    this.initializeComponents(config);
    this.isInitialized = true;
    this.logger.info('PumpFunAPIClient initialized successfully', {
      baseURL: this.configManager.getConfig().baseURL,
      timeout: this.configManager.getConfig().timeout,
    });
  }

  /**
   * Initialize all components in the correct order
   */
  private initializeComponents(config?: ClientConfig): void {
    // Initialize configuration first
    this.configManager = new ConfigurationManager();
    const validatedConfig = this.configManager.initializeConfig(config);

    // Initialize logger
    this.logger = new Logger(validatedConfig.loggerConfig);

    // Initialize error handler
    this.errorHandler = new ErrorHandler(
      {
        baseURL: validatedConfig.baseURL,
        timeout: validatedConfig.timeout,
        loggerConfig: validatedConfig.loggerConfig,
        rateLimitConfig: validatedConfig.rateLimitConfig,
        retryConfig: validatedConfig.retryConfig,
      },
      this.logger
    );

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(validatedConfig.rateLimitConfig);

    // Initialize HTTP client
    this.httpClient = new HTTPClient({
      baseURL: validatedConfig.baseURL,
      timeout: validatedConfig.timeout,
      headers: {
        'User-Agent': 'PumpFun-API-Client/1.0.0',
        Accept: 'application/json',
        ...(validatedConfig.apiKey && { Authorization: `Bearer ${validatedConfig.apiKey}` }),
        ...(validatedConfig.authToken && { 'X-Auth-Token': validatedConfig.authToken }),
      },
      retryConfig: validatedConfig.retryConfig,
    });

    // Initialize state
    this.state = {
      isInitialized: true,
      lastRequestTime: 0,
      requestCount: 0,
      errorCount: 0,
      rateLimitInfo: {
        requestsInWindow: 0,
        windowStart: 0,
        backoffUntil: 0,
        consecutiveErrors: 0,
      },
    };

    // Initialize live streams service
    this.liveStreamsService = new LiveStreamsService(
      {
        baseURL: validatedConfig.baseURL,
        livestreamURL: validatedConfig.livestreamURL,
        timeout: validatedConfig.timeout,
        retryConfig: validatedConfig.retryConfig,
      },
      this.httpClient,
      this.logger,
      this.rateLimiter,
      this.errorHandler,
      this.state
    );

    // Initialize stream filters service
    this.streamFilters = new StreamFilters(
      this.logger,
      this.errorHandler,
      (options?: StreamOptions) => this.liveStreamsService.fetchBaseLiveStreams(options),
      (mintId: string, clipType?: 'COMPLETE' | 'HIGHLIGHT', limit?: number) =>
        this.liveStreamsService.getStreamClips(mintId, clipType, limit)
    );

    // Initialize LiveKit stream manager
    this.liveKitStreamManager = new LiveKitStreamManager(
      this,
      this.logger
    );

    this.logger.debug('All components initialized successfully');
  }

  /**
   * Ensure client is properly initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.state.isInitialized) {
      throw new ConfigurationError({
        message:
          'PumpFunAPIClient is not properly initialized. Check the client configuration and try again.',
        details: {
          isInitialized: this.isInitialized,
          stateIsInitialized: this.state.isInitialized,
          suggestions: [
            'Check the client configuration',
            'Ensure all required configuration values are provided',
            'Verify environment variables are set correctly',
          ],
        },
      });
    }
  }

  /**
   * Public API methods - delegate to services
   */

  
  /**
   * Unified stream filtering method that consolidates all filtering functionality
   *
   * This method replaces 11+ separate filtering methods with a single, comprehensive
   * interface that handles basic to advanced filtering scenarios. It supports all
   * previously available filtering options while providing better performance
   * through a unified data fetching pipeline.
   *
   * @param criteria - Unified filter criteria supporting basic and advanced filtering
   * @param baseParams - Optional base parameters for stream fetching
   * @returns Promise<AdvancedFilterResult> - Filtered streams with metadata and performance metrics
   *
   * @example
   * ```typescript
   * // Basic usage (backwards compatible with previous filtering methods)
   * const streams = await client.filterStreams({
   *   minParticipants: 5,
   *   limit: 20
   * });
   *
   * // Advanced filtering with market cap range
   * const establishedStreams = await client.filterStreams({
   *   marketCapRange: { min: 10000, max: 500000 },
   *   participantRange: { min: 10, max: 100 },
   *   sortBy: 'market_cap',
   *   sortOrder: 'desc'
   * });
   *
   * // Content quality filtering
   * const qualityStreams = await client.filterStreams({
   *   contentQuality: {
   *     hasTitle: true,
   *     hasDescription: true,
   *     minTitleLength: 20,
   *     minDescriptionLength: 100
   *   },
   *   hasSocialMedia: { twitter: true, telegram: true }
   * });
   *
   * // Text pattern matching
   * const cryptoStreams = await client.filterStreams({
   *   textPatterns: {
   *     nameContains: ['crypto', 'defi', 'token'],
   *     symbolContains: ['USD'],
   *     excludePatterns: ['scam', 'fake']
   *   }
   * });
   *
   * // Compound queries with logical operators
   * const complexFilter = await client.filterStreams({
   *   compoundQuery: {
   *     operator: 'OR',
   *     groups: [
   *       {
   *         operator: 'AND',
   *         filters: {
   *           minParticipants: 10,
   *           marketCapRange: { min: 5000 }
   *         }
   *       },
   *       {
   *         operator: 'AND',
   *         filters: {
   *           contentQuality: { hasTitle: true },
   *           hasSocialMedia: { twitter: true }
   *         }
   *       }
   *     ]
   *   }
   * });
   *
   * // Custom filters
   * const customFiltered = await client.filterStreams({
   *   customFilters: [
   *     { name: 'high-engagement', filter: (stream) => stream.reply_count > 50 },
   *     { name: 'recent-activity', filter: (stream) => Date.now() - stream.last_reply * 1000 < 3600000 }
   *   ]
   * });
   * ```
   */
  public async filterStreams(
    criteria: UnifiedFilterCriteria,
    baseParams?: GetLiveCoinsParams
  ): Promise<AdvancedFilterResult> {
    this.ensureInitialized();

    const startTime = Date.now();

    this.logger.info('Applying unified stream filtering', {
      criteriaSummary: this.summarizeUnifiedCriteria(criteria),
      baseParams,
    });

    try {
      // Convert unified criteria to internal format for filtering
      const internalCriteria = this.convertToInternalCriteria(criteria);

      // Convert baseParams to StreamOptions if provided
      let streamOptions: StreamOptions | undefined;
      if (baseParams) {
        streamOptions = {
          limit: baseParams.limit,
          offset: baseParams.offset,
          includeNsfw: baseParams.includeNsfw,
          // Map legacy sort options to new format
          sortBy: baseParams.sort === 'participants' ? 'participants' : 'default',
          sortOrder: baseParams.order?.toLowerCase() as 'asc' | 'desc',
        };
      }

      // Use stream filters service directly for core filtering
      const result = await this.streamFilters.applyAdvancedFilters(internalCriteria, streamOptions);

      // Apply additional sorting for unified criteria that's not handled by core method
      let filteredStreams = result.streams;

      // Apply unified-specific sorting if specified
      if (criteria.sortBy && criteria.sortBy !== 'default') {
        filteredStreams = this.applyUnifiedSorting(filteredStreams, criteria);
      }

      // Apply compound query if specified
      if (criteria.compoundQuery) {
        filteredStreams = this.applyCompoundQuery(filteredStreams, criteria.compoundQuery);
      }

      // Apply custom filters if specified
      if (criteria.customFilters && criteria.customFilters.length > 0) {
        filteredStreams = this.applyCustomFilters(filteredStreams, criteria.customFilters);
      }

      // Apply pagination from unified criteria
      const offset = criteria.offset || 0;
      const limit = criteria.limit;
      let finalStreams = filteredStreams;

      if (limit !== undefined) {
        finalStreams = filteredStreams.slice(offset, offset + limit);
      } else {
        finalStreams = filteredStreams.slice(offset);
      }

      const processingTime = Date.now() - startTime;
      const unifiedResult: AdvancedFilterResult = {
        streams: finalStreams,
        totalBeforeFilter: result.totalBeforeFilter,
        filteredOut: result.totalBeforeFilter - finalStreams.length,
        appliedCriteria: {
          ...result.appliedCriteria,
          unifiedCriteria: this.summarizeUnifiedCriteria(criteria),
        },
        metrics: {
          processingTimeMs: processingTime,
          filtersApplied: result.metrics.filtersApplied + this.countUnifiedFilters(criteria),
        },
      };

      this.logger.info('Unified stream filtering completed', {
        totalBeforeFilter: unifiedResult.totalBeforeFilter,
        filteredOut: unifiedResult.filteredOut,
        finalCount: unifiedResult.streams.length,
        processingTimeMs: unifiedResult.metrics.processingTimeMs,
        filtersApplied: unifiedResult.metrics.filtersApplied,
      });

      return unifiedResult;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'filterStreams', {
        criteria,
        baseParams,
        suggestions: [
          'Check if the filter criteria are valid',
          'Verify the API server is accessible',
          'Consider reducing the complexity of filter criteria',
          'Try using basic filtering options first',
        ],
      });

      this.logger.error('Failed to apply unified stream filtering', {
        error: pumpFunError.toJSON(),
        criteria,
        baseParams,
      });

      throw pumpFunError;
    }
  }

  
  
  /**
   * Search live streams by keyword across multiple fields
   *
   * This method allows searching for live streams using keywords that match
   * against stream names, symbols, descriptions, and titles. Results are
   * ranked by relevance and can be further filtered and sorted.
   *
   * @param params - Search parameters including keyword, filters, and sorting options
   * @returns Promise<StreamSearchResult[]> - Array of search results with relevance scoring
   */
  public async searchLiveStreams(params: SearchLiveStreamsParams): Promise<StreamSearchResult[]> {
    this.ensureInitialized();
    return this.liveStreamsService.searchLiveStreams(params);
  }

  /**
   * Get comprehensive statistics for live streaming data
   *
   * This method calculates and returns aggregate statistics for live streaming data,
   * including total streams, participants, averages, top streams, and mode distribution.
   *
   * @returns Promise<StreamStatistics> - Comprehensive stream statistics
   */
  public async getStreamStatistics(): Promise<StreamStatistics> {
    this.ensureInitialized();
    return this.liveStreamsService.getStreamStatistics();
  }

  
  /**
   * Get live stream information for a specific mint
   */
  public async getLiveStreamInfo(mintId: string): Promise<LiveStreamInfo | null> {
    this.ensureInitialized();
    return this.liveStreamsService.getLiveStreamInfo(mintId);
  }

  /**
   * Check if a creator is approved for streaming
   */
  public async isApprovedCreator(mintId: string): Promise<boolean> {
    this.ensureInitialized();
    return this.liveStreamsService.isApprovedCreator(mintId);
  }

  /**
   * Get LiveKit connection details for video streaming
   */
  public async getLiveKitConnectionInfo(mintId: string): Promise<LiveKitConnectionInfo | null> {
    this.ensureInitialized();
    return this.liveStreamsService.getLiveKitConnectionInfo(mintId);
  }

  /**
   * Get comprehensive video stream analysis for a specific mint
   *
   * This method combines all video stream related information into a single
   * comprehensive analysis, including stream status, creator approval, and
   * LiveKit connection details.
   */
  public async getVideoStreamAnalysis(mintId: string): Promise<VideoStreamAnalysis> {
    this.ensureInitialized();
    return this.liveStreamsService.getVideoStreamAnalysis(mintId);
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
  public async joinLiveStream(mintId: string): Promise<JoinLiveStreamResponse> {
    this.ensureInitialized();
    return this.liveStreamsService.joinLiveStream(mintId);
  }

  /**
   * Connect to a live stream using LiveKit integration
   *
   * This method provides seamless WebRTC connection to live streams by delegating
   * to the LiveKitStreamManager for advanced connection lifecycle management.
   *
   * @param mintId - The mint identifier of the token to connect to
   * @param options - Optional connection configuration including video/audio elements and callbacks
   * @returns Promise<LiveStreamConnection> - Managed WebRTC connection object with lifecycle methods
   * @throws {PumpFunError} When LiveKit is not available, stream is not live, or connection fails
   *
   * @example
   * ```typescript
   * // Basic usage - auto-connect and play
   * const connection = await client.connectToLiveStream('mintId');
   *
   * // With video element and callbacks
   * const videoElement = document.getElementById('video') as HTMLVideoElement;
   * const connection = await client.connectToLiveStream('mintId', {
   *   videoElement,
   *   autoPlay: true,
   *   onConnected: (conn) => console.log('Connected:', conn.id),
   *   onError: (error, conn) => console.error('Connection error:', error)
   * });
   *
   * // Clean up when done
   * await connection.disconnect();
   * ```
   */
  public async connectToLiveStream(
    mintId: string,
    options: LiveKitConnectionOptions = {}
  ): Promise<LiveStreamConnection> {
    this.ensureInitialized();

    const startTime = Date.now();

    this.logger.info('Starting LiveKit connection process', {
      mintId,
      options: {
        hasVideoElement: !!options.videoElement,
        hasAudioElement: !!options.audioElement,
        autoConnect: options.autoConnect,
        autoPlay: options.autoPlay,
        videoEnabled: options.videoEnabled,
        audioEnabled: options.audioEnabled,
        preferredQuality: options.preferredQuality,
      },
    });

    try {
      // Step 1: Get video stream analysis to validate stream availability
      this.logger.debug('Validating stream availability', { mintId });
      const streamAnalysis = await this.getVideoStreamAnalysis(mintId);

      if (!streamAnalysis.hasActiveStream || !streamAnalysis.streamInfo) {
        throw new LiveKitError({
          code: 'STREAM_NOT_LIVE',
          message: `Stream for mint ${mintId} is not currently live`,
          details: { mintId, streamAnalysis },
        });
      }

      if (!streamAnalysis.isApprovedCreator) {
        throw new LiveKitError({
          code: 'CREATOR_NOT_APPROVED',
          message: `Creator for mint ${mintId} is not approved for streaming`,
          details: { mintId, streamAnalysis },
        });
      }

      if (!streamAnalysis.liveKitConnection) {
        throw new LiveKitError({
          code: 'NO_LIVEKIT_CONNECTION',
          message: `No LiveKit connection information available for mint ${mintId}`,
          details: { mintId, streamAnalysis },
        });
      }

      // Step 2: Delegate to LiveKitStreamManager for connection establishment
      this.logger.debug('Delegating to LiveKitStreamManager', {
        mintId,
        roomName: streamAnalysis.liveKitConnection.roomName,
      });

      const connection = await this.liveKitStreamManager.connect(mintId, options);

      const connectionTime = Date.now() - startTime;
      this.logger.info('LiveKit connection established successfully', {
        mintId,
        connectionId: connection.id,
        connectionTime,
        state: connection.state,
        isConnected: connection.isConnected,
      });

      // Validate connection time requirement
      if (connectionTime > 5000) {
        this.logger.warn('Connection exceeded 5-second target', {
          mintId,
          connectionId: connection.id,
          connectionTime,
          target: 5000,
        });
      }

      return connection;

    } catch (error) {
      const connectionTime = Date.now() - startTime;
      this.logger.error('LiveKit connection failed', {
        mintId,
        connectionTime,
        error: ErrorUtils.formatForLogging(error),
      });

      const pumpFunError = this.errorHandler.handleError(error, 'connectToLiveStream', {
        mintId,
        connectionTime,
        options,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get stream clips for a specific mint with type filtering and pagination
   *
   * This method fetches recorded stream clips for a specific token mint,
   * supporting filtering by clip type (COMPLETE/HIGHLIGHT) and pagination.
   *
   * @param mintId - The mint identifier of the token to get clips for
   * @param clipType - Optional clip type filter ('COMPLETE' | 'HIGHLIGHT')
   * @param limit - Optional maximum number of clips to return (default: 10)
   * @returns Promise<StreamClip[]> - Array of stream clips
   */
  public async getStreamClips(
    mintId: string,
    clipType?: 'COMPLETE' | 'HIGHLIGHT',
    limit: number = 10
  ): Promise<StreamClip[]> {
    this.ensureInitialized();
    return this.liveStreamsService.getStreamClips(mintId, clipType, limit);
  }

  /**
   * Filter stream clips by type and other criteria
   *
   * This method provides advanced filtering capabilities for stream clips,
   * allowing filtering by clip type, duration, view count, date range, and custom criteria.
   *
   * @param mintId - The mint identifier of the token to filter clips for
   * @param params - Filtering and sorting parameters
   * @returns Promise<ClipFilterResult> - Filtered clips with metadata
   */
  public async filterStreamClips(
    mintId: string,
    params: ClipFilterParams
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.filterClipsByMint(mintId, params);
  }

  /**
   * Get complete clips only
   *
   * @param mintId - The mint identifier of the token to get complete clips for
   * @param params - Optional additional filtering parameters
   * @returns Promise<ClipFilterResult> - Complete clips with metadata
   */
  public async getCompleteClips(
    mintId: string,
    params?: Omit<ClipFilterParams, 'clipType'>
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.getCompleteClips(mintId, params);
  }

  /**
   * Get highlight clips only
   *
   * @param mintId - The mint identifier of the token to get highlight clips for
   * @param params - Optional additional filtering parameters
   * @returns Promise<ClipFilterResult> - Highlight clips with metadata
   */
  public async getHighlightClips(
    mintId: string,
    params?: Omit<ClipFilterParams, 'clipType'>
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.getHighlightClips(mintId, params);
  }

  /**
   * Get clips sorted by duration
   *
   * @param mintId - The mint identifier of the token to get clips for
   * @param sortOrder - Sort order ('ASC' for shortest first, 'DESC' for longest first)
   * @param params - Optional additional filtering parameters
   * @returns Promise<ClipFilterResult> - Clips sorted by duration with metadata
   */
  public async getClipsByDuration(
    mintId: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    params?: Omit<ClipFilterParams, 'sortBy' | 'sortOrder'>
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.getClipsByDuration(mintId, sortOrder, params);
  }

  /**
   * Get clips sorted by view count
   *
   * @param mintId - The mint identifier of the token to get clips for
   * @param sortOrder - Sort order ('ASC' for lowest first, 'DESC' for highest first)
   * @param params - Optional additional filtering parameters
   * @returns Promise<ClipFilterResult> - Clips sorted by view count with metadata
   */
  public async getClipsByViewCount(
    mintId: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    params?: Omit<ClipFilterParams, 'sortBy' | 'sortOrder'>
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.getClipsByViewCount(mintId, sortOrder, params);
  }

  /**
   * Get clips sorted by creation date
   *
   * @param mintId - The mint identifier of the token to get clips for
   * @param sortOrder - Sort order ('ASC' for oldest first, 'DESC' for newest first)
   * @param params - Optional additional filtering parameters
   * @returns Promise<ClipFilterResult> - Clips sorted by creation date with metadata
   */
  public async getClipsByCreationDate(
    mintId: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    params?: Omit<ClipFilterParams, 'sortBy' | 'sortOrder'>
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.getClipsByCreationDate(mintId, sortOrder, params);
  }

  /**
   * Get clips with duration within specified range
   *
   * @param mintId - The mint identifier of the token to get clips for
   * @param minDuration - Minimum duration in seconds
   * @param maxDuration - Maximum duration in seconds
   * @param params - Optional additional filtering parameters
   * @returns Promise<ClipFilterResult> - Clips within duration range with metadata
   */
  public async getClipsByDurationRange(
    mintId: string,
    minDuration: number,
    maxDuration: number,
    params?: Omit<ClipFilterParams, 'minDuration' | 'maxDuration'>
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.getClipsByDurationRange(mintId, minDuration, maxDuration, params);
  }

  /**
   * Get clips with view count within specified range
   *
   * @param mintId - The mint identifier of the token to get clips for
   * @param minViewCount - Minimum view count
   * @param maxViewCount - Maximum view count
   * @param params - Optional additional filtering parameters
   * @returns Promise<ClipFilterResult> - Clips within view count range with metadata
   */
  public async getClipsByViewCountRange(
    mintId: string,
    minViewCount: number,
    maxViewCount: number,
    params?: Omit<ClipFilterParams, 'minViewCount' | 'maxViewCount'>
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.getClipsByViewCountRange(mintId, minViewCount, maxViewCount, params);
  }

  /**
   * Get clips created within date range
   *
   * @param mintId - The mint identifier of the token to get clips for
   * @param startDate - Start date in ISO format
   * @param endDate - End date in ISO format
   * @param params - Optional additional filtering parameters
   * @returns Promise<ClipFilterResult> - Clips within date range with metadata
   */
  public async getClipsByDateRange(
    mintId: string,
    startDate: string,
    endDate: string,
    params?: Omit<ClipFilterParams, 'createdDateRange'>
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.getClipsByDateRange(mintId, startDate, endDate, params);
  }

  /**
   * Get clips that have URLs available
   *
   * @param mintId - The mint identifier of the token to get clips for
   * @param params - Optional additional filtering parameters
   * @returns Promise<ClipFilterResult> - Clips with available URLs with metadata
   */
  public async getClipsWithUrls(
    mintId: string,
    params?: Omit<ClipFilterParams, 'hasUrl'>
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.getClipsWithUrls(mintId, params);
  }

  // ============================================================================
  // Previous Streams Video Fetching Methods
  // ============================================================================

  /**
   * Get previous stream videos (full completed streams)
   *
   * This method retrieves complete previous stream recordings that represent
   * the full duration of past livestreams. These are essentially the VOD
   * (Video on Demand) versions of completed streams.
   *
   * @param mintId - The mint identifier of the token to get previous streams for
   * @param limit - Optional maximum number of previous streams to return (default: 10)
   * @returns Promise<StreamClip[]> - Array of previous stream videos
   * @throws {PumpFunError} When the request fails or parameters are invalid
   *
   * @example
   * ```typescript
   * // Get all previous streams for a token
   * const previousStreams = await client.getPreviousStreams('mintId');
   *
   * // Get the 5 most recent previous streams
   * const recentStreams = await client.getPreviousStreams('mintId', 5);
   *
   * // Each result contains:
   * // - playlistUrl: HLS streaming URL for full video playback
   * // - duration: Full stream duration in seconds (e.g., 1800 = 30 minutes)
   * // - thumbnailUrl: Thumbnail image URL
   * // - startTime: When the stream started
   * // - endTime: When the stream ended
   * ```
   */
  public async getPreviousStreams(
    mintId: string,
    limit: number = 10
  ): Promise<StreamClip[]> {
    this.ensureInitialized();

    try {
      const previousStreams = await this.liveStreamsService.getStreamClips(mintId, 'COMPLETE', limit);

      this.logger.info('Retrieved previous streams', {
        mintId,
        count: previousStreams.length,
        limit,
        clipType: 'COMPLETE'
      });

      return previousStreams;
    } catch (error) {
      this.logger.error('Failed to get previous streams', {
        mintId,
        limit,
        error: ErrorUtils.formatForLogging(error),
      });

      const pumpFunError = this.errorHandler.handleError(error, 'getPreviousStreams', {
        mintId,
        limit,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get stream highlights (short highlight segments)
   *
   * This method retrieves short highlight segments that are automatically
   * generated from stream content. These are typically 15-60 seconds long
   * and represent the most engaging moments from streams.
   *
   * @param mintId - The mint identifier of the token to get highlights for
   * @param limit - Optional maximum number of highlights to return (default: 20)
   * @returns Promise<StreamClip[]> - Array of highlight clips
   * @throws {PumpFunError} When the request fails or parameters are invalid
   *
   * @example
   * ```typescript
   * // Get all highlights for a token
   * const highlights = await client.getStreamHighlights('mintId');
   *
   * // Get the 10 most recent highlights
   * const recentHighlights = await client.getStreamHighlights('mintId', 10);
   *
   * // Each result contains:
   * // - mp4Url: Direct MP4 download URL
   * // - duration: Short clip duration in seconds (typically 15-60)
   * // - view_count: Number of views for the highlight
   * // - highlightCreatorAddress: User who created the highlight
   * ```
   */
  public async getStreamHighlights(
    mintId: string,
    limit: number = 20
  ): Promise<StreamClip[]> {
    this.ensureInitialized();

    try {
      const highlights = await this.liveStreamsService.getStreamClips(mintId, 'HIGHLIGHT', limit);

      this.logger.info('Retrieved stream highlights', {
        mintId,
        count: highlights.length,
        limit,
        clipType: 'HIGHLIGHT'
      });

      return highlights;
    } catch (error) {
      this.logger.error('Failed to get stream highlights', {
        mintId,
        limit,
        error: ErrorUtils.formatForLogging(error),
      });

      const pumpFunError = this.errorHandler.handleError(error, 'getStreamHighlights', {
        mintId,
        limit,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get comprehensive stream history including both previous streams and highlights
   *
   * This method provides a complete view of all available video content for a token,
   * including full previous streams and highlight segments, sorted by creation date.
   *
   * @param mintId - The mint identifier of the token to get stream history for
   * @param options - Optional configuration for history retrieval
   * @returns Promise<StreamHistoryResult> - Complete stream history with metadata
   * @throws {PumpFunError} When the request fails or parameters are invalid
   *
   * @example
   * ```typescript
   * // Get complete stream history
   * const history = await client.getStreamHistory('mintId');
   *
   * console.log(`Found ${history.totalPreviousStreams} previous streams`);
   * console.log(`Found ${history.totalHighlights} highlights`);
   * console.log(`Total watch time: ${history.totalDuration} seconds`);
   *
   * // Get only recent content (last 7 days)
   * const recentHistory = await client.getStreamHistory('mintId', {
   *   daysBack: 7,
   *   maxPreviousStreams: 5,
   *   maxHighlights: 20
   * });
   * ```
   */
  public async getStreamHistory(
    mintId: string,
    options: {
      maxPreviousStreams?: number;
      maxHighlights?: number;
      daysBack?: number;
      sortBy?: 'created_at' | 'duration' | 'view_count';
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<StreamHistoryResult> {
    this.ensureInitialized();

    const {
      maxPreviousStreams = 20,
      maxHighlights = 50,
      daysBack,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    try {
      // Fetch both types of clips in parallel
      const [previousStreams, highlights] = await Promise.all([
        this.getPreviousStreams(mintId, maxPreviousStreams),
        this.getStreamHighlights(mintId, maxHighlights)
      ]);

      // Combine and filter by date if specified
      let allClips = [...previousStreams, ...highlights];

      if (daysBack) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        const cutoffTimestamp = cutoffDate.toISOString();

        allClips = allClips.filter(clip => clip.created_at >= cutoffTimestamp);
      }

      // Sort combined results
      allClips.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case 'duration':
            aValue = a.duration;
            bValue = b.duration;
            break;
          case 'view_count':
            aValue = a.view_count || 0;
            bValue = b.view_count || 0;
            break;
          case 'created_at':
          default:
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
        }

        if (sortOrder === 'ASC') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });

      // Calculate statistics
      const totalDuration = allClips.reduce((sum, clip) => sum + clip.duration, 0);
      const totalViews = allClips.reduce((sum, clip) => sum + (clip.view_count || 0), 0);
      const averageDuration = allClips.length > 0 ? totalDuration / allClips.length : 0;

      const result: StreamHistoryResult = {
        mintId,
        previousStreams,
        highlights,
        allClips,
        totalPreviousStreams: previousStreams.length,
        totalHighlights: highlights.length,
        totalClips: allClips.length,
        totalDuration,
        totalViews,
        averageDuration,
        retrievedAt: new Date().toISOString(),
        filters: options
      };

      this.logger.info('Retrieved comprehensive stream history', {
        mintId,
        totalPreviousStreams: result.totalPreviousStreams,
        totalHighlights: result.totalHighlights,
        totalDuration: result.totalDuration,
        filters: options
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get stream history', {
        mintId,
        options,
        error: ErrorUtils.formatForLogging(error),
      });

      const pumpFunError = this.errorHandler.handleError(error, 'getStreamHistory', {
        mintId,
        options,
      });

      throw pumpFunError;
    }
  }

  /**
   * Validate jurisdiction for API access
   */
  public async validateJurisdiction(): Promise<boolean> {
    this.ensureInitialized();

    try {
      this.logger.info('Validating jurisdiction', {
        endpoint: '/auth/is-valid-jurisdiction',
      });

      // Apply rate limiting before making the request
      await this.rateLimiter.waitForRequest();

      const response = await this.httpClient.get<JurisdictionResponse>(
        '/auth/is-valid-jurisdiction'
      );

      // Update statistics
      this.state.requestCount++;
      this.state.lastRequestTime = Date.now();

      // Record successful request in rate limiter
      this.rateLimiter.recordRequest();

      const isValid = response?.valid === true;

      this.logger.info('Jurisdiction validation completed', {
        isValid,
        response,
        timestamp: new Date().toISOString(),
      });

      return isValid;
    } catch (error) {
      this.state.errorCount++;
      const pumpFunError = this.errorHandler.handleError(error, 'validateJurisdiction', {
        endpoint: '/auth/is-valid-jurisdiction',
        requestTime: new Date().toISOString(),
      });

      this.logger.error('Jurisdiction validation failed', {
        error: pumpFunError.toJSON(),
        resolution: pumpFunError.getResolution(),
        errorCategory: pumpFunError.details?.errorCategory,
      });

      throw pumpFunError;
    }
  }

  /**
   * Test connection to the API
   */
  public async testConnection(): Promise<boolean> {
    this.ensureInitialized();

    try {
      this.logger.info('Testing API connection', {
        baseURL: this.configManager.getConfig().baseURL,
        timeout: this.configManager.getConfig().timeout,
      });

      // Try to validate jurisdiction as a simple connection test
      const isValid = await this.validateJurisdiction();

      this.logger.info('Connection test successful', {
        isValid,
        baseURL: this.configManager.getConfig().baseURL,
      });

      return true;
    } catch (error) {
      this.logger.error('Connection test failed', {
        error: ErrorUtils.formatForLogging(error),
        baseURL: this.configManager.getConfig().baseURL,
      });

      return false;
    }
  }

  /**
   * Configuration and state management methods
   */

  /**
   * Get current client configuration
   */
  public getConfiguration(): Readonly<ReturnType<typeof this.configManager.getConfig>> {
    return this.configManager.getConfig();
  }

  /**
   * Get current client state
   */
  public getState(): Readonly<ClientState> {
    const rateLimiterStats = this.rateLimiter.getStats();

    return {
      ...this.state,
      rateLimitInfo: {
        requestsInWindow: rateLimiterStats.requests,
        windowStart: rateLimiterStats.windowStart,
        backoffUntil: rateLimiterStats.isBackoffActive
          ? Date.now() + this.rateLimiter.getTimeUntilNextRequest()
          : 0,
        consecutiveErrors: rateLimiterStats.consecutiveErrors,
      },
    };
  }

  /**
   * Check if client is properly initialized
   */
  public isClientInitialized(): boolean {
    return this.isInitialized && this.state.isInitialized;
  }

  /**
   * Get the base URL
   */
  public getBaseURL(): string {
    return this.configManager.getConfig().baseURL;
  }

  /**
   * Get the timeout configuration
   */
  public getTimeout(): number {
    return this.configManager.getConfig().timeout;
  }

  /**
   * Check if currently rate limited
   */
  public isRateLimited(): boolean {
    return this.rateLimiter.isRateLimited();
  }

  /**
   * Get remaining backoff time in milliseconds
   */
  public getRateLimitBackoffRemaining(): number {
    return this.rateLimiter.getTimeUntilNextRequest();
  }

  /**
   * Update logger configuration
   */
  public updateLoggerConfig(
    config: Partial<typeof import('../types').DEFAULT_LOGGER_CONFIG>
  ): void {
    this.configManager.updateLoggerConfig(config, this.logger);
  }

  /**
   * Update rate limit configuration
   */
  public updateRateLimitConfig(
    config: Partial<typeof import('../types').DEFAULT_RATE_LIMIT_CONFIG>
  ): void {
    this.configManager.updateRateLimitConfig(config, this.logger);
  }

  /**
   * Reset statistics
   */
  public resetStatistics(): void {
    this.state.requestCount = 0;
    this.state.errorCount = 0;
    this.state.lastRequestTime = 0;
    this.rateLimiter.reset();

    this.logger.info('Client statistics reset');
  }

  /**
   * Get statistics about client usage
   */
  public getStatistics(): {
    requestCount: number;
    errorCount: number;
    errorRate: number;
    successRate: number;
    lastRequestTime: number | null;
    uptime: number;
    startTime: string;
    rateLimitState: RateLimitState;
  } {
    const errorRate =
      this.state.requestCount > 0 ? (this.state.errorCount / this.state.requestCount) * 100 : 0;
    const successRate =
      this.state.requestCount > 0
        ? ((this.state.requestCount - this.state.errorCount) / this.state.requestCount) * 100
        : 100;

    const rateLimiterStats = this.rateLimiter.getStats();

    return {
      requestCount: this.state.requestCount,
      errorCount: this.state.errorCount,
      errorRate,
      successRate,
      lastRequestTime: this.state.lastRequestTime || null,
      uptime: Date.now() - this.state.lastRequestTime,
      startTime: new Date().toISOString(),
      rateLimitState: {
        requestsInWindow: rateLimiterStats.requests,
        windowStart: rateLimiterStats.windowStart,
        backoffUntil: rateLimiterStats.isBackoffActive
          ? Date.now() + this.rateLimiter.getTimeUntilNextRequest()
          : 0,
        consecutiveErrors: rateLimiterStats.consecutiveErrors,
      },
    };
  }

  /**
   * Attempt automatic error recovery
   */
  public attemptErrorRecovery(error: PumpFunError): boolean {
    this.ensureInitialized();

    try {
      this.logger.info('Attempting automatic error recovery', {
        errorType: error.constructor.name,
        errorCode: error.code,
        isRetryable: error.isRetryable,
      });

      // Reset rate limiting state for rate limit errors
      if (error instanceof RateLimitError) {
        this.rateLimiter.reset();
        this.logger.info('Rate limiter reset for recovery');
        return true;
      }

      // Reset HTTP client connection for network errors
      if (error instanceof NetworkError) {
        this.logger.info('Network error detected, connection will be reset on next request');
        return true;
      }

      // For timeout errors, just log and retry
      if (error instanceof TimeoutError) {
        this.logger.info('Timeout error detected, retry should work with fresh request');
        return true;
      }

      // For server errors, suggest retry after delay
      if (error instanceof ServerError) {
        const SERVER_RETRY_DELAY = 5000; // 5 seconds
        this.logger.info(`Server error detected,建议 retry after ${SERVER_RETRY_DELAY}ms`);
        return true;
      }

      // Configuration errors cannot be automatically recovered
      if (error instanceof ConfigurationError) {
        this.logger.warn('Configuration error cannot be automatically recovered');
        return false;
      }

      this.logger.warn('Unknown error type, cannot determine recovery strategy');
      return false;
    } catch (recoveryError) {
      this.logger.error('Automatic error recovery failed', {
        originalError: ErrorUtils.formatForLogging(error),
        recoveryError: ErrorUtils.formatForLogging(recoveryError),
      });
      return false;
    }
  }

  /**
   * Get error diagnostics information
   */
  public getErrorDiagnostics(): {
    clientState: ClientState;
    configuration: ValidatedConfig;
    environment: {
      nodeVersion: string;
      platform: string;
      arch: string;
    };
    configSource: string;
    troubleshootingSuggestions: string[];
  } {
    return {
      clientState: this.getState(),
      configuration: this.configManager.getConfig(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      configSource: 'environment', // Simplified for refactoring
      troubleshootingSuggestions: this.getGeneralTroubleshootingSuggestions(),
    };
  }

  /**
   * Get general troubleshooting suggestions
   */
  private getGeneralTroubleshootingSuggestions(): string[] {
    const HIGH_ERROR_RATE_THRESHOLD = 50;
    const FIVE_MINUTES_MS = 5 * 60 * 1000; // 300000ms

    const suggestions = [
      'Check network connectivity to the API server',
      'Verify API credentials are valid and active',
      'Review rate limit configuration and usage',
      'Check for recent API changes or maintenance',
    ];

    if (this.state.errorCount > 0) {
      const errorRate = (this.state.errorCount / Math.max(this.state.requestCount, 1)) * 100;
      if (errorRate > HIGH_ERROR_RATE_THRESHOLD) {
        suggestions.push('High error rate detected - review configuration and API access');
      }
    }

    if (this.rateLimiter.isRateLimited()) {
      suggestions.push('Currently rate limited - wait before making more requests');
    }

    if (Date.now() - this.state.lastRequestTime > FIVE_MINUTES_MS) {
      // 5 minutes
      suggestions.push('No recent requests - check if client is being used correctly');
    }

    return suggestions;
  }

  /**
   * Component access methods for testing/advanced usage
   */

  /**
   * Get the logger instance
   */
  public getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get the rate limiter instance
   */
  public getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /**
   * Graceful shutdown
   */
  public shutdown(): void {
    this.logger.info('Shutting down PumpFunAPIClient', {
      finalStats: this.getStatistics(),
    });

    try {
      // Cleanup LiveKit connections first
      this.shutdownLiveKitComponents();

      // Mark as uninitialized
      this.isInitialized = false;
      this.state.isInitialized = false;

      this.logger.info('PumpFunAPIClient shutdown completed');
    } catch (error) {
      this.logger.error('Error during shutdown', {
        error: ErrorUtils.formatForLogging(error),
      });
    }
  }

  /**
   * String representation for debugging
   */
  public toString(): string {
    const config = this.configManager.getConfig();
    return `PumpFunAPIClient(baseURL="${config.baseURL}", timeout=${config.timeout}ms)`;
  }

  /**
   * JSON representation for debugging
   */
  public toJSON() {
    const config = this.configManager.getConfig();
    return {
      config: {
        baseURL: config.baseURL,
        timeout: config.timeout,
      },
      isInitialized: this.isInitialized,
      state: this.getState(),
      statistics: this.getStatistics(),
    };
  }

  // ============================================================================
  // Unified Stream Filtering Helper Methods
  // ============================================================================

  /**
   * Convert unified filter criteria to internal criteria for filtering
   */
  private convertToInternalCriteria(criteria: UnifiedFilterCriteria): any {
    const internalCriteria: any = {};

    // Map basic options
    if (criteria.minParticipants !== undefined || criteria.maxParticipants !== undefined) {
      internalCriteria.participantRange = {
        min: criteria.minParticipants,
        max: criteria.maxParticipants,
      };
    }

    if (criteria.marketCapRange) {
      internalCriteria.marketCapRange = criteria.marketCapRange;
    }

    if (criteria.createdTimeRange) {
      internalCriteria.createdTimeRange = criteria.createdTimeRange;
    }

    if (criteria.lastActivityRange) {
      internalCriteria.lastActivityRange = criteria.lastActivityRange;
    }

    // Map social media filters
    if (criteria.hasSocialMedia) {
      internalCriteria.hasSocialMedia = criteria.hasSocialMedia;
    }

    // Map content quality filters
    if (criteria.contentQuality) {
      internalCriteria.contentQuality = criteria.contentQuality;
    }

    // Map activity level filters
    if (criteria.activityLevel) {
      internalCriteria.activityLevel = criteria.activityLevel;
    }

    // Map text pattern filters
    if (criteria.textPatterns) {
      internalCriteria.textPatterns = criteria.textPatterns;
    }

    // Convert custom filters
    if (criteria.customFilters && criteria.customFilters.length > 0) {
      internalCriteria.customFilters = criteria.customFilters.map(cf => cf.filter);
    }

    return internalCriteria;
  }

  /**
   * Summarize unified filter criteria for logging
   */
  private summarizeUnifiedCriteria(criteria: UnifiedFilterCriteria): Record<string, any> {
    const summary: Record<string, any> = {};

    // Basic options
    if (criteria.minParticipants !== undefined || criteria.maxParticipants !== undefined) {
      summary.participantRange = {
        min: criteria.minParticipants,
        max: criteria.maxParticipants,
      };
    }

    if (criteria.limit !== undefined) {
      summary.limit = criteria.limit;
    }

    if (criteria.includeTitledOnly !== undefined) {
      summary.includeTitledOnly = criteria.includeTitledOnly;
    }

    if (criteria.sortBy !== undefined) {
      summary.sortBy = criteria.sortBy;
    }

    if (criteria.sortOrder !== undefined) {
      summary.sortOrder = criteria.sortOrder;
    }

    // Advanced options
    if (criteria.marketCapRange) {
      summary.marketCapRange = criteria.marketCapRange;
    }

    if (criteria.createdTimeRange) {
      summary.createdTimeRange = criteria.createdTimeRange;
    }

    if (criteria.lastActivityRange) {
      summary.lastActivityRange = criteria.lastActivityRange;
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

    if (criteria.customFilters && criteria.customFilters.length > 0) {
      summary.customFilters = criteria.customFilters.length;
    }

    if (criteria.compoundQuery) {
      summary.compoundQuery = {
        operator: criteria.compoundQuery.operator,
        groupCount: criteria.compoundQuery.groups.length,
      };
    }

    return summary;
  }

  /**
   * Apply unified-specific sorting
   */
  private applyUnifiedSorting(streams: LiveCoin[], criteria: UnifiedFilterCriteria): LiveCoin[] {
    const sortBy = criteria.sortBy;
    const sortOrder = criteria.sortOrder || 'desc';

    if (!sortBy || sortBy === 'default') {
      return streams;
    }

    return [...streams].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'participants':
          comparison = (a.num_participants ?? 0) - (b.num_participants ?? 0);
          break;
        case 'market_cap':
          comparison = a.usd_market_cap - b.usd_market_cap;
          break;
        case 'created_at':
          comparison = a.created_timestamp - b.created_timestamp;
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Apply compound query with logical operators
   */
  private applyCompoundQuery(
    streams: LiveCoin[],
    compoundQuery: UnifiedFilterCriteria['compoundQuery']
  ): LiveCoin[] {
    if (!compoundQuery) {
      return streams;
    }

    const { operator = 'AND', groups } = compoundQuery;

    return streams.filter(stream => {
      const groupResults = groups.map(group => {
        const groupOperator = group.operator || 'AND';
        return this.matchesGroupCriteria(stream, group.filters, groupOperator);
      });

      return operator === 'AND'
        ? groupResults.every(result => result)
        : groupResults.some(result => result);
    });
  }

  /**
   * Check if stream matches group criteria with logical operator
   */
  private matchesGroupCriteria(
    stream: LiveCoin,
    filters: Partial<UnifiedFilterCriteria>,
    _operator: 'AND' | 'OR'
  ): boolean {
    // Convert partial filters to full criteria for evaluation
    const criteria = filters as UnifiedFilterCriteria;
    const internalCriteria = this.convertToInternalCriteria(criteria);

    // Use existing stream filtering logic
    return this.matchesStreamCriteria(stream, internalCriteria);
  }

  /**
   * Check if stream matches criteria (simplified version)
   */
  private matchesStreamCriteria(stream: LiveCoin, criteria: any): boolean {
    // Market cap range
    if (criteria.marketCapRange) {
      const { min, max } = criteria.marketCapRange;
      if (min !== undefined && stream.usd_market_cap < min) return false;
      if (max !== undefined && stream.usd_market_cap > max) return false;
    }

    // Participant range
    if (criteria.participantRange) {
      const { min, max } = criteria.participantRange;
      const participants = stream.num_participants ?? 0;
      if (min !== undefined && participants < min) return false;
      if (max !== undefined && participants > max) return false;
    }

    // Social media
    if (criteria.hasSocialMedia) {
      const { twitter, telegram } = criteria.hasSocialMedia;
      if (twitter !== undefined && (!stream.twitter || stream.twitter.trim() === '')) return false;
      if (telegram !== undefined && (!stream.telegram || stream.telegram.trim() === '')) return false;
    }

    // Content quality
    if (criteria.contentQuality) {
      const { hasTitle, hasDescription, hasImage, minTitleLength, minDescriptionLength } = criteria.contentQuality;
      if (hasTitle && (!stream.livestream_title || stream.livestream_title.trim() === '')) return false;
      if (hasDescription && (!stream.description || stream.description.trim() === '')) return false;
      if (hasImage && (!stream.image_uri || stream.image_uri.trim() === '')) return false;
      if (minTitleLength && (!stream.livestream_title || stream.livestream_title.length < minTitleLength)) return false;
      if (minDescriptionLength && (!stream.description || stream.description.length < minDescriptionLength)) return false;
    }

    // Activity level
    if (criteria.activityLevel) {
      const { minReplyCount, hasRecentActivity, maxIdleTime } = criteria.activityLevel;
      if (minReplyCount !== undefined && (stream.reply_count ?? 0) < minReplyCount) return false;
      if (hasRecentActivity) {
        const now = Date.now();
        const lastActivityMs = stream.last_reply * 1000;
        const oneHourAgo = now - 60 * 60 * 1000;
        if (lastActivityMs < oneHourAgo) return false;
      }
      if (maxIdleTime !== undefined) {
        const now = Date.now();
        const lastActivityMs = stream.last_reply * 1000;
        const idleMinutes = (now - lastActivityMs) / (60 * 1000);
        if (idleMinutes > maxIdleTime) return false;
      }
    }

    // Text patterns
    if (criteria.textPatterns) {
      const { nameContains, symbolContains, descriptionContains, titleContains, excludePatterns } = criteria.textPatterns;

      if (nameContains && nameContains.length > 0) {
        const matches = nameContains.some((pattern: string) =>
          stream.name.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!matches) return false;
      }

      if (symbolContains && symbolContains.length > 0) {
        const matches = symbolContains.some((pattern: string) =>
          stream.symbol.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!matches) return false;
      }

      if (descriptionContains && descriptionContains.length > 0) {
        const matches = descriptionContains.some((pattern: string) =>
          stream.description.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!matches) return false;
      }

      if (titleContains && titleContains.length > 0) {
        if (!stream.livestream_title) return false;
        const matches = titleContains.some((pattern: string) =>
          stream.livestream_title!.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!matches) return false;
      }

      if (excludePatterns && excludePatterns.length > 0) {
        const allText = `${stream.name} ${stream.symbol} ${stream.description} ${stream.livestream_title || ''}`.toLowerCase();
        const hasExcludedPattern = excludePatterns.some((pattern: string) =>
          allText.includes(pattern.toLowerCase())
        );
        if (hasExcludedPattern) return false;
      }
    }

    // Custom filters
    if (criteria.customFilters && criteria.customFilters.length > 0) {
      for (const customFilter of criteria.customFilters) {
        if (!customFilter(stream)) return false;
      }
    }

    return true;
  }

  /**
   * Apply custom filters to streams
   */
  private applyCustomFilters(
    streams: LiveCoin[],
    customFilters: Array<{ name: string; filter: (stream: LiveCoin) => boolean }>
  ): LiveCoin[] {
    return streams.filter(stream => {
      return customFilters.every(customFilter => customFilter.filter(stream));
    });
  }

  /**
   * Count active filters in unified criteria
   */
  private countUnifiedFilters(criteria: UnifiedFilterCriteria): number {
    let count = 0;

    if (criteria.minParticipants !== undefined || criteria.maxParticipants !== undefined) count++;
    if (criteria.marketCapRange) count++;
    if (criteria.createdTimeRange) count++;
    if (criteria.lastActivityRange) count++;
    if (criteria.hasSocialMedia) count++;
    if (criteria.contentQuality) count++;
    if (criteria.activityLevel) count++;
    if (criteria.textPatterns) count++;
    if (criteria.customFilters && criteria.customFilters.length > 0) count++;
    if (criteria.compoundQuery) count++;

    return count;
  }

  // ============================================================================
  // Connection Management Methods - Delegate to LiveKitStreamManager
  // ============================================================================

  /**
   * Get connection state for a live stream
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   * @returns ConnectionState - Current connection state
   */
  public getLiveStreamConnectionState(connectionIdOrMintId: string): ConnectionState {
    this.ensureInitialized();
    return this.liveKitStreamManager.getConnectionState(connectionIdOrMintId);
  }

  /**
   * Get all active LiveKit connections
   *
   * @returns LiveStreamConnection[] - Array of active connections
   */
  public getActiveLiveConnections(): LiveStreamConnection[] {
    this.ensureInitialized();
    return this.liveKitStreamManager.getActiveConnections();
  }

  /**
   * Disconnect from a live stream
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   */
  public async disconnectLiveStream(connectionIdOrMintId: string): Promise<void> {
    this.ensureInitialized();
    return this.liveKitStreamManager.disconnect(connectionIdOrMintId);
  }

  /**
   * Reconnect to a live stream
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   */
  public async reconnectLiveStream(connectionIdOrMintId: string): Promise<void> {
    this.ensureInitialized();
    return this.liveKitStreamManager.reconnect(connectionIdOrMintId);
  }

  /**
   * Mute audio track for a connection
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   */
  public async muteLiveStreamAudio(connectionIdOrMintId: string): Promise<void> {
    this.ensureInitialized();
    return this.liveKitStreamManager.muteAudio(connectionIdOrMintId);
  }

  /**
   * Unmute audio track for a connection
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   */
  public async unmuteLiveStreamAudio(connectionIdOrMintId: string): Promise<void> {
    this.ensureInitialized();
    return this.liveKitStreamManager.unmuteAudio(connectionIdOrMintId);
  }

  /**
   * Mute video track for a connection
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   */
  public async muteLiveStreamVideo(connectionIdOrMintId: string): Promise<void> {
    this.ensureInitialized();
    return this.liveKitStreamManager.muteVideo(connectionIdOrMintId);
  }

  /**
   * Unmute video track for a connection
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   */
  public async unmuteLiveStreamVideo(connectionIdOrMintId: string): Promise<void> {
    this.ensureInitialized();
    return this.liveKitStreamManager.unmuteVideo(connectionIdOrMintId);
  }

  /**
   * Cleanup all LiveKit connections
   */
  public async cleanupLiveKitConnections(): Promise<void> {
    this.ensureInitialized();
    return this.liveKitStreamManager.cleanup();
  }

  /**
   * Add shutdown cleanup for LiveKit connections
   */
  protected shutdownLiveKitComponents(): void {
    if (this.liveKitStreamManager) {
      this.liveKitStreamManager.cleanup().catch(error => {
        this.logger.warn('Error during LiveKit manager cleanup during shutdown', {
          error: ErrorUtils.formatForLogging(error),
        });
      });
    }
  }
}
