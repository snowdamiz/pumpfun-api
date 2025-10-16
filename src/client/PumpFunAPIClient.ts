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
  LiveCoin,
  GetLiveCoinsParams,
  StreamOptions,
  LiveStreamInfo,
  LiveKitConnectionInfo,
  VideoStreamAnalysis,
  JoinLiveStreamResponse,
  SearchLiveStreamsParams,
  StreamSearchResult,
  StreamStatistics,
  StreamClip,
  LiveKitConnectionOptions,
  LiveStreamConnection,
  ConnectionState,
  UnifiedFilterCriteria,
  AdvancedFilterResult,
  StreamContentFilters,
  StreamContentResult
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
  ConfigurationError,
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
   * Unified stream content retrieval method that consolidates all content access
   *
   * This method replaces 13+ separate content retrieval methods with a single,
   * comprehensive interface that handles all content types (clips, previous streams,
   * highlights) with advanced filtering, sorting, and pagination capabilities.
   *
   * @param mintId - The mint identifier of the token to get content for
   * @param filters - Comprehensive filtering options for content retrieval
   * @returns Promise<StreamContentResult> - Consolidated content with metadata
   *
   * @example
   * ```typescript
   * // Basic usage - get all content types
   * const content = await client.getStreamContent('mintId');
   * console.log(`Found ${content.totalCount} total items`);
   *
   * // Get only highlights from last 7 days
   * const recentHighlights = await client.getStreamContent('mintId', {
   *   contentType: 'highlights',
   *   daysBack: 7,
   *   maxHighlights: 20
   * });
   *
   * // Get clips with specific duration and view count requirements
   * const qualityClips = await client.getStreamContent('mintId', {
   *   contentType: 'clips',
   *   clipType: 'HIGHLIGHT',
   *   minDuration: 30,
   *   maxDuration: 300,
   *   minViewCount: 100,
   *   sortBy: 'view_count',
   *   sortOrder: 'DESC',
   *   limit: 10
   * });
   *
   * // Get previous streams from specific date range
   * const archivalStreams = await client.getStreamContent('mintId', {
   *   contentType: 'previous_streams',
   *   dateRange: {
   *     start: '2024-01-01T00:00:00Z',
   *     end: '2024-01-31T23:59:59Z'
   *   },
   *   sortBy: 'created_at',
   *   sortOrder: 'ASC'
   * });
   *
   * // Get content that has URLs available
   * const availableContent = await client.getStreamContent('mintId', {
   *   hasUrl: true,
   *   includeHighlights: true,
   *   includePreviousStreams: true
   * });
   * ```
   */
  public async getStreamContent(
    mintId: string,
    filters: StreamContentFilters = {}
  ): Promise<StreamContentResult> {
    this.ensureInitialized();

    const startTime = Date.now();

    // Set default values
    const {
      contentType = 'all',
      clipType = 'all',
      includeHighlights = true,
      includePreviousStreams = true,
      includeClips = true,
      limit,
      maxHighlights = 50,
      maxPreviousStreams = 20,
      daysBack,
      minDuration,
      maxDuration,
      minViewCount,
      maxViewCount,
      dateRange,
      hasUrl,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    this.logger.info('Retrieving unified stream content', {
      mintId,
      contentType,
      clipType,
      filters: {
        includeHighlights,
        includePreviousStreams,
        includeClips,
        limit,
        maxHighlights,
        maxPreviousStreams,
        daysBack,
        minDuration,
        maxDuration,
        minViewCount,
        maxViewCount,
        hasUrl,
        sortBy,
        sortOrder
      }
    });

    try {
      const result: StreamContentResult = {
        totalCount: 0,
        contentSummary: {
          clipsCount: 0,
          previousStreamsCount: 0,
          highlightsCount: 0
        },
        metrics: {
          processingTimeMs: 0,
          filtersApplied: 0
        },
        appliedFilters: {
          contentType,
          clipType,
          includeHighlights,
          includePreviousStreams,
          includeClips,
          sortBy,
          sortOrder,
          daysBack,
          minDuration,
          maxDuration,
          minViewCount,
          maxViewCount,
          hasUrl
        }
      };

      let allContent: StreamClip[] = [];
      let filtersApplied = 0;

      // Helper function to apply filters to clips
      const applyFiltersToClips = (clips: StreamClip[]): StreamClip[] => {
        let filtered = [...clips];

        // Filter by clip type if specified
        if (clipType !== 'all') {
          filtered = filtered.filter(clip => clip.clipType === clipType);
          filtersApplied++;
        }

        // Filter by duration range
        if (minDuration !== undefined) {
          filtered = filtered.filter(clip => (clip.duration ?? 0) >= minDuration);
          filtersApplied++;
        }
        if (maxDuration !== undefined) {
          filtered = filtered.filter(clip => (clip.duration ?? 0) <= maxDuration);
          filtersApplied++;
        }

        // Filter by view count range
        if (minViewCount !== undefined) {
          filtered = filtered.filter(clip => (clip.view_count ?? 0) >= minViewCount);
          filtersApplied++;
        }
        if (maxViewCount !== undefined) {
          filtered = filtered.filter(clip => (clip.view_count ?? 0) <= maxViewCount);
          filtersApplied++;
        }

        // Filter by date range
        if (dateRange) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          filtered = filtered.filter(clip => {
            if (!clip.created_at) return false;
            const clipDate = new Date(clip.created_at);
            return clipDate >= startDate && clipDate <= endDate;
          });
          filtersApplied++;
        }

        // Filter by days back
        if (daysBack) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysBack);
          const cutoffTimestamp = cutoffDate.toISOString();
          filtered = filtered.filter(clip => clip.created_at >= cutoffTimestamp);
          filtersApplied++;
        }

        // Filter by URL availability
        if (hasUrl !== undefined) {
          filtered = filtered.filter(clip => {
            const hasClipUrl = !!(clip.clip_url && clip.clip_url.trim() !== '');
            const hasPlaylistUrl = !!(clip.playlistUrl && clip.playlistUrl.trim() !== '');
            const hasMp4Url = !!(clip.mp4Url && clip.mp4Url.trim() !== '');
            return hasUrl === (hasClipUrl || hasPlaylistUrl || hasMp4Url);
          });
          filtersApplied++;
        }

        // Sort the results
        filtered.sort((a, b) => {
          let aValue: any, bValue: any;

          switch (sortBy) {
            case 'duration':
              aValue = a.duration ?? 0;
              bValue = b.duration ?? 0;
              break;
            case 'view_count':
              aValue = a.view_count ?? 0;
              bValue = b.view_count ?? 0;
              break;
            case 'stream_start':
              aValue = new Date(a.startTime).getTime();
              bValue = new Date(b.startTime).getTime();
              break;
            case 'created_at':
            default:
              aValue = new Date(a.created_at).getTime();
              bValue = new Date(b.created_at).getTime();
              break;
          }

          return sortOrder === 'ASC' ? aValue - bValue : bValue - aValue;
        });
        if (sortBy) filtersApplied++;

        return filtered;
      };

      // Fetch content based on contentType and include flags
      if (contentType === 'all' || contentType === 'clips' || contentType === 'previous_streams') {
        if (includePreviousStreams || contentType === 'previous_streams') {
          try {
            const previousStreams = await this.liveStreamsService.getStreamClips(mintId, 'COMPLETE', maxPreviousStreams);
            const filteredPrevious = applyFiltersToClips(previousStreams);

            if (contentType === 'previous_streams') {
              result.previousStreams = filteredPrevious;
              result.contentSummary.previousStreamsCount = filteredPrevious.length;
              allContent.push(...filteredPrevious);
            } else if (includePreviousStreams) {
              result.previousStreams = filteredPrevious;
              result.contentSummary.previousStreamsCount = filteredPrevious.length;
              allContent.push(...filteredPrevious);
            }
          } catch (error) {
            this.logger.warn('Failed to fetch previous streams', {
              mintId,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }

      if (contentType === 'all' || contentType === 'clips' || contentType === 'highlights') {
        if (includeHighlights || contentType === 'highlights') {
          try {
            const highlights = await this.liveStreamsService.getStreamClips(mintId, 'HIGHLIGHT', maxHighlights);
            const filteredHighlights = applyFiltersToClips(highlights);

            if (contentType === 'highlights') {
              result.highlights = filteredHighlights;
              result.contentSummary.highlightsCount = filteredHighlights.length;
              allContent.push(...filteredHighlights);
            } else if (includeHighlights) {
              result.highlights = filteredHighlights;
              result.contentSummary.highlightsCount = filteredHighlights.length;
              allContent.push(...filteredHighlights);
            }
          } catch (error) {
            this.logger.warn('Failed to fetch highlights', {
              mintId,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }

      // Handle general clips case (both types combined)
      if (contentType === 'clips' && includeClips) {
        try {
          const completeClips = await this.liveStreamsService.getStreamClips(mintId, 'COMPLETE', maxPreviousStreams);
          const highlightClips = await this.liveStreamsService.getStreamClips(mintId, 'HIGHLIGHT', maxHighlights);

          const allClipTypes = [...completeClips, ...highlightClips];
          const filteredClips = applyFiltersToClips(allClipTypes);

          result.clips = filteredClips;
          result.contentSummary.clipsCount = filteredClips.length;
          allContent.push(...filteredClips);
        } catch (error) {
          this.logger.warn('Failed to fetch clips', {
            mintId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Apply final limit if specified
      if (limit !== undefined && limit > 0) {
        allContent = allContent.slice(0, limit);
      }

      // If contentType is 'all', provide combined results
      if (contentType === 'all') {
        // Remove duplicates by ID while preserving order
        const seen = new Set<string>();
        const uniqueContent = allContent.filter(clip => {
          if (seen.has(clip.id)) {
            return false;
          }
          seen.add(clip.id);
          return true;
        });

        // Populate clips array with all content for 'all' type
        result.clips = uniqueContent;
        result.contentSummary.clipsCount = uniqueContent.length;
      }

      // Set total count
      result.totalCount = result.contentSummary.clipsCount +
                        result.contentSummary.previousStreamsCount +
                        result.contentSummary.highlightsCount;

      // Set processing metrics
      result.metrics.processingTimeMs = Date.now() - startTime;
      result.metrics.filtersApplied = filtersApplied;

      this.logger.info('Unified stream content retrieval completed', {
        mintId,
        totalCount: result.totalCount,
        contentSummary: result.contentSummary,
        processingTimeMs: result.metrics.processingTimeMs,
        filtersApplied: result.metrics.filtersApplied
      });

      return result;

    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getStreamContent', {
        mintId,
        filters,
        suggestions: [
          'Check if the mintId is valid',
          'Verify the API server is accessible',
          'Consider checking if the mint has any available content',
          'Try with fewer filter restrictions'
        ],
      });

      this.logger.error('Failed to get stream content', {
        error: pumpFunError.toJSON(),
        mintId,
        filters,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get stream clips for a specific mint with type filtering and pagination
   *
   * @deprecated Use getStreamContent() instead for unified content access
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
   * @deprecated Use getStreamContent() instead for unified content access
   */
  public async filterStreamClips(
    mintId: string,
    params: ClipFilterParams
  ): Promise<ClipFilterResult> {
    this.ensureInitialized();
    return this.streamFilters.filterClipsByMint(mintId, params);
  }

  // All redundant clip filtering methods have been consolidated into getStreamContent()
// See getStreamContent() for unified content access with comprehensive filtering options

  // ============================================================================
  // Previous Streams and History Methods - Consolidated
  // ============================================================================
  // All previous stream and history methods have been consolidated into getStreamContent()
  // Use getStreamContent() with contentType='previous_streams', 'highlights', or 'all' for unified access

  /**
   * Check if currently rate limited
   */
  public isRateLimited(): boolean {
    return this.rateLimiter.isRateLimited();
  }

  /**
   * Get the logger instance
   */
  public getLogger(): Logger {
    return this.logger;
  }

  /**
   * Graceful shutdown
   */
  public shutdown(): void {
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
