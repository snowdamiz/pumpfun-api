/**
 * Simplified PumpFun Client - Core API with 8 essential methods
 *
 * This is the new simplified client that consolidates the functionality
 * from 28+ methods down to 8 core methods focused on user needs.
 *
 * @version 2.0.0
 * @author PumpFun Team
 */

import {
  ClientConfig,
  FilterCriteria,
  FilteredStreams,
  ContentFilters,
  StreamContent,
  StreamOptions,
  StreamConnection,
  VideoQuality,
  StreamClip,
  LiveCoin,
  LiveStreamInfo,
  GetLiveCoinsParams
} from '../types';

import { HTTPClient } from '../infrastructure/http/http-client';
import { Logger } from '../infrastructure/logging/logger';
import { ConfigurationManager } from '../infrastructure/config/config-manager';
import {
  validateFilterCriteria,
  validateContentFilters,
  isValidMintId,
  ValidationError
} from '../utils/validation';
import {
  processStreamFilters,
  getAppliedFilterNames,
  summarizeFilterCriteria
} from '../utils/stream-helpers';
import {
  mapToStreamError,
  createContextualError,
  StreamError,
  ConnectionError
} from '../utils/error-mapping';

/**
 * Default stream options
 */
export const DEFAULT_STREAM_OPTIONS: Partial<StreamOptions> = {
  autoConnect: true,
  autoPlay: true,
  muted: true,
  videoEnabled: true,
  audioEnabled: true,
  preferredQuality: 'auto',
  maxReconnectAttempts: 3,
  reconnectDelayMs: 2000,
};

/**
 * Simplified PumpFun client with 8 core methods
 */
export class PumpFunClient {
  private httpClient!: HTTPClient;
  private logger!: Logger;
  private configManager!: ConfigurationManager;

  private isInitialized: boolean = false;
  private activeConnections: Map<string, StreamConnection> = new Map();

  /**
   * Create a new PumpFunClient instance
   *
   * @param config - Optional configuration options
   */
  constructor(config?: ClientConfig) {
    this.initializeComponents(config);
    this.isInitialized = true;
    this.logger.info('PumpFunClient initialized successfully', {
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

  
    // Initialize HTTP client
    this.httpClient = new HTTPClient({
      baseURL: validatedConfig.baseURL,
      timeout: validatedConfig.timeout,
      headers: {
        'User-Agent': 'PumpFun-API-Client/2.0.0',
        Accept: 'application/json',
        ...(validatedConfig.apiKey && { Authorization: `Bearer ${validatedConfig.apiKey}` }),
        ...(validatedConfig.authToken && { 'X-Auth-Token': validatedConfig.authToken }),
      },
      retryConfig: validatedConfig.retryConfig,
    });

    this.logger.debug('All components initialized successfully');
  }

  /**
   * Ensure client is properly initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new StreamError(
        'PumpFunClient is not properly initialized. Check the client configuration and try again.',
        'NOT_INITIALIZED',
        { isInitialized: this.isInitialized },
        ['Check the client configuration', 'Ensure all required configuration values are provided']
      );
    }
  }

  /**
   * Find connection by ID or mint ID
   */
  private findConnection(connectionIdOrMintId: string): StreamConnection | null {
    // First try to find by connection ID
    const connection = this.activeConnections.get(connectionIdOrMintId);
    if (connection) {
      return connection;
    }

    // If not found, search by mint ID
    for (const conn of this.activeConnections.values()) {
      if (conn.mintId === connectionIdOrMintId) {
        return conn;
      }
    }

    return null;
  }

  /**
   * Generate a unique connection ID
   */
  private generateConnectionId(mintId: string): string {
    return `${mintId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Fetch live streams from API
   */
  private async fetchLiveStreams(params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    this.logger.debug('Fetching live streams', { params });

    try {
      const response = await this.httpClient.get('/coins/featured', {
        params: {
          limit: params?.limit || 100,
          offset: params?.offset || 0,
          includeNsfw: params?.includeNsfw || false,
        },
      });

      const streams = response.data?.data || [];

      this.logger.debug('Live streams fetched', {
        count: streams.length,
        hasData: streams.length > 0,
      });

      return streams;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to fetch live streams', {
        error: errorMessage,
        params,
      });
      throw error;
    }
  }

  /**
   * Get stream clips from API
   */
  private async getStreamClips(
    mintId: string,
    clipType?: 'COMPLETE' | 'HIGHLIGHT',
    limit: number = 10
  ): Promise<StreamClip[]> {
    this.logger.debug('Getting stream clips', { mintId, clipType, limit });

    try {
      const response = await this.httpClient.get(`/streams/${mintId}/clips`, {
        params: {
          clip_type: clipType,
          limit,
        },
      });

      const clips = response.data?.data || [];

      this.logger.debug('Stream clips retrieved', {
        mintId,
        clipType,
        count: clips.length,
      });

      return clips;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get stream clips', {
        error: errorMessage,
        mintId,
        clipType,
        limit,
      });
      throw error;
    }
  }

  /**
   * Get live stream information
   */
  private async getLiveStreamInfo(mintId: string): Promise<LiveStreamInfo | null> {
    this.logger.debug('Getting live stream info', { mintId });

    try {
      const response = await this.httpClient.get(`/streams/${mintId}/info`);

      const streamInfo = response.data?.data;

      this.logger.debug('Live stream info retrieved', {
        mintId,
        hasInfo: !!streamInfo,
        isLive: streamInfo?.is_live || false,
      });

      return streamInfo || null;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get live stream info', {
        error: errorMessage,
        mintId,
      });

      // Return null if stream not found (404) rather than throwing
      const err = error as any;
      if (err.response?.status === 404) {
        return null;
      }

      throw error;
    }
  }

  // ============================================================================
  // Core API Methods - 8 Essential Methods
  // ============================================================================

  /**
   * 1. Stream Discovery: Filter and search live streams
   *
   * @param criteria - Filtering criteria for streams
   * @returns Promise<FilteredStreams> - Filtered streams with metadata
   */
  public async filterStreams(criteria: FilterCriteria): Promise<FilteredStreams> {
    this.ensureInitialized();
    validateFilterCriteria(criteria);

    const startTime = Date.now();

    this.logger.info('Filtering streams', summarizeFilterCriteria(criteria));

    try {
      // Get base streams from API
      const baseStreams = await this.fetchLiveStreams({
        limit: criteria.limit || 100,
        offset: criteria.offset || 0,
        includeNsfw: false, // Default for simplified API
      });

      // Apply filters
      const filteredStreams = processStreamFilters(baseStreams, criteria);

      // Apply pagination if needed
      const offset = criteria.offset || 0;
      const limit = criteria.limit;
      let finalStreams = filteredStreams;

      if (limit !== undefined) {
        finalStreams = filteredStreams.slice(offset, offset + limit);
      } else {
        finalStreams = filteredStreams.slice(offset);
      }

      const processingTime = Date.now() - startTime;
      const result: FilteredStreams = {
        streams: finalStreams,
        totalCount: baseStreams.length,
        filteredOut: baseStreams.length - finalStreams.length,
        processingTimeMs: processingTime,
        filtersApplied: getAppliedFilterNames(criteria),
      };

      this.logger.info('Stream filtering completed', {
        totalBeforeFilter: result.totalCount,
        filteredOut: result.filteredOut,
        finalCount: result.streams.length,
        processingTimeMs: result.processingTimeMs,
        filtersApplied: result.filtersApplied.length,
      });

      return result;

    } catch (error) {
      const pumpFunError = mapToStreamError(error, 'filterStreams');
      this.logger.error('Failed to filter streams', {
        error: pumpFunError.toJSON(),
        criteria,
      });
      throw pumpFunError;
    }
  }

  /**
   * 2. Content Retrieval: Get stream content and clips
   *
   * @param mintId - The mint identifier of the token
   * @param filters - Optional content filters
   * @returns Promise<StreamContent> - Stream content with metadata
   */
  public async getStreamContent(mintId: string, filters?: ContentFilters): Promise<StreamContent> {
    this.ensureInitialized();

    if (!isValidMintId(mintId)) {
      throw new ValidationError('Invalid mint ID provided');
    }

    const effectiveFilters = filters || {};
    validateContentFilters(effectiveFilters);

    const startTime = Date.now();

    this.logger.info('Getting stream content', { mintId, filters: effectiveFilters });

    try {
      const result: StreamContent = {
        totalCount: 0,
        contentSummary: {
          clipsCount: 0,
          highlightsCount: 0,
          previousStreamsCount: 0,
        },
        metrics: {
          processingTimeMs: 0,
          filtersApplied: 0,
        },
        appliedFilters: effectiveFilters,
      };

      let allContent: StreamClip[] = [];
      let filtersApplied = 0;

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
      } = effectiveFilters;

      // Helper function to apply filters to clips
      const applyContentFilters = (clips: StreamClip[]): StreamClip[] => {
        let filtered = [...clips];

        // Apply filters (implementation would go here)
        if (clipType !== 'all') {
          filtered = filtered.filter(clip => clip.clipType === clipType);
          filtersApplied++;
        }

        if (minDuration !== undefined) {
          filtered = filtered.filter(clip => (clip.duration ?? 0) >= minDuration);
          filtersApplied++;
        }

        if (maxDuration !== undefined) {
          filtered = filtered.filter(clip => (clip.duration ?? 0) <= maxDuration);
          filtersApplied++;
        }

        if (minViewCount !== undefined) {
          filtered = filtered.filter(clip => (clip.view_count ?? 0) >= minViewCount);
          filtersApplied++;
        }

        if (maxViewCount !== undefined) {
          filtered = filtered.filter(clip => (clip.view_count ?? 0) <= maxViewCount);
          filtersApplied++;
        }

        if (daysBack) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysBack);
          const cutoffTimestamp = cutoffDate.toISOString();
          filtered = filtered.filter(clip => clip.created_at >= cutoffTimestamp);
          filtersApplied++;
        }

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

        if (hasUrl !== undefined) {
          filtered = filtered.filter(clip => {
            const hasClipUrl = !!(clip.clip_url && clip.clip_url.trim() !== '');
            return hasUrl === hasClipUrl;
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

      // Fetch content based on type
      if (contentType === 'all' || contentType === 'highlights') {
        if (includeHighlights) {
          try {
            const highlights = await this.getStreamClips(mintId, 'HIGHLIGHT', maxHighlights);
            const filteredHighlights = applyContentFilters(highlights);

            result.highlights = filteredHighlights;
            result.contentSummary.highlightsCount = filteredHighlights.length;
            allContent.push(...filteredHighlights);
          } catch (error) {
            this.logger.warn('Failed to fetch highlights', { mintId, error });
          }
        }
      }

      if (contentType === 'all' || contentType === 'previous_streams') {
        if (includePreviousStreams) {
          try {
            const previousStreams = await this.getStreamClips(mintId, 'COMPLETE', maxPreviousStreams);
            const filteredPrevious = applyContentFilters(previousStreams);

            result.previousStreams = filteredPrevious;
            result.contentSummary.previousStreamsCount = filteredPrevious.length;
            allContent.push(...filteredPrevious);
          } catch (error) {
            this.logger.warn('Failed to fetch previous streams', { mintId, error });
          }
        }
      }

      if (contentType === 'clips' && includeClips) {
        try {
          const completeClips = await this.getStreamClips(mintId, 'COMPLETE', maxPreviousStreams);
          const highlightClips = await this.getStreamClips(mintId, 'HIGHLIGHT', maxHighlights);

          const allClipTypes = [...completeClips, ...highlightClips];
          const filteredClips = applyContentFilters(allClipTypes);

          result.clips = filteredClips;
          result.contentSummary.clipsCount = filteredClips.length;
          allContent.push(...filteredClips);
        } catch (error) {
          this.logger.warn('Failed to fetch clips', { mintId, error });
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

      this.logger.info('Stream content retrieval completed', {
        mintId,
        totalCount: result.totalCount,
        processingTimeMs: result.metrics.processingTimeMs,
        filtersApplied: result.metrics.filtersApplied,
      });

      return result;

    } catch (error) {
      const pumpFunError = mapToStreamError(error, 'getStreamContent');
      this.logger.error('Failed to get stream content', {
        error: pumpFunError.toJSON(),
        mintId,
        filters,
      });
      throw pumpFunError;
    }
  }

  /**
   * 3. LiveKit Connection: Connect to a live stream
   *
   * @param mintId - The mint identifier of the token to connect to
   * @param options - Optional connection options
   * @returns Promise<StreamConnection> - LiveKit connection object
   */
  public async connectToStream(
    mintId: string,
    options?: StreamOptions
  ): Promise<StreamConnection> {
    this.ensureInitialized();

    if (!isValidMintId(mintId)) {
      throw new ValidationError('Invalid mint ID provided');
    }

    const effectiveOptions = { ...DEFAULT_STREAM_OPTIONS, ...options };

    // Check if already connected
    const existingConnection = this.findConnection(mintId);
    if (existingConnection?.isConnected) {
      return existingConnection;
    }

    const startTime = Date.now();

    this.logger.info('Connecting to stream', {
      mintId,
      options: {
        hasVideoElement: !!effectiveOptions.videoElement,
        hasAudioElement: !!effectiveOptions.audioElement,
        autoConnect: effectiveOptions.autoConnect,
        autoPlay: effectiveOptions.autoPlay,
        preferredQuality: effectiveOptions.preferredQuality,
      },
    });

    try {
      // Validate stream is live
      const streamInfo = await this.getLiveStreamInfo(mintId);
      if (!streamInfo) {
        throw new StreamError(
          `Stream for mint ${mintId} is not currently live`,
          'STREAM_NOT_LIVE',
          { mintId },
          ['Check if the stream is still active', 'Verify the mint ID is correct']
        );
      }

      // Create mock connection object (simplified implementation)
      const connectionId = this.generateConnectionId(mintId);
      const connection: StreamConnection = {
        id: connectionId,
        mintId,
        isConnected: true,
        state: 'connected' as any,

        // Connection management methods
        disconnect: async () => {
          await this.disconnectFromStream(connectionId);
        },
        reconnect: async () => {
          // Mock reconnection
          connection.isConnected = true;
          connection.state = 'connected' as any;
        },
        getStats: async () => {
          return new RTCStatsReport();
        },

        // Media control methods
        toggleAudio: async () => {
          // Mock audio toggle
          this.logger.info('Audio toggled', { connectionId });
        },
        toggleVideo: async () => {
          // Mock video toggle
          this.logger.info('Video toggled', { connectionId });
        },
        muteAudio: async () => {
          // Mock audio mute
          this.logger.info('Audio muted', { connectionId });
        },
        unmuteAudio: async () => {
          // Mock audio unmute
          this.logger.info('Audio unmuted', { connectionId });
        },
        muteVideo: async () => {
          // Mock video mute
          this.logger.info('Video muted', { connectionId });
        },
        unmuteVideo: async () => {
          // Mock video unmute
          this.logger.info('Video unmuted', { connectionId });
        },
        setQuality: async (quality: VideoQuality) => {
          // Mock quality set
          this.logger.info('Quality set', { connectionId, quality });
        },
      };

      // Store connection
      this.activeConnections.set(connectionId, connection);

      const connectionTime = Date.now() - startTime;
      this.logger.info('Stream connection established', {
        mintId,
        connectionId,
        connectionTime,
        state: connection.state,
      });

      return connection;

    } catch (error) {
      const connectionTime = Date.now() - startTime;
      this.logger.error('Stream connection failed', {
        mintId,
        connectionTime,
        error: error instanceof Error ? error.message : String(error),
      });

      const pumpFunError = mapToStreamError(error, 'connectToStream');
      throw pumpFunError;
    }
  }

  /**
   * 4. LiveKit Disconnection: Disconnect from a live stream
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   */
  public async disconnectFromStream(connectionIdOrMintId: string): Promise<void> {
    this.ensureInitialized();

    if (!connectionIdOrMintId || connectionIdOrMintId.trim() === '') {
      throw new ValidationError('Connection ID or mint ID is required');
    }

    this.logger.info('Disconnecting from stream', { connectionIdOrMintId });

    try {
      const connection = this.findConnection(connectionIdOrMintId);
      if (connection) {
        connection.isConnected = false;
        connection.state = 'disconnected' as any;
        this.activeConnections.delete(connection.id);
      }

      this.logger.info('Stream disconnected successfully', { connectionIdOrMintId });
    } catch (error) {
      const pumpFunError = mapToStreamError(error, 'disconnectFromStream');
      this.logger.error('Failed to disconnect from stream', {
        error: pumpFunError.toJSON(),
        connectionIdOrMintId,
      });
      throw pumpFunError;
    }
  }

  /**
   * 5. Active Connections: Get all active stream connections
   *
   * @returns Promise<StreamConnection[]> - Array of active connections
   */
  public async getActiveStreams(): Promise<StreamConnection[]> {
    this.ensureInitialized();

    try {
      const connections = Array.from(this.activeConnections.values()).filter(
        connection => connection.isConnected
      );
      this.logger.debug('Retrieved active connections', { count: connections.length });
      return connections;
    } catch (error) {
      const pumpFunError = mapToStreamError(error, 'getActiveStreams');
      this.logger.error('Failed to get active streams', {
        error: pumpFunError.toJSON(),
      });
      throw pumpFunError;
    }
  }

  /**
   * 6. Audio Control: Toggle audio for a stream connection
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   */
  public async toggleAudio(connectionIdOrMintId: string): Promise<void> {
    this.ensureInitialized();

    const connection = this.findConnection(connectionIdOrMintId);
    if (!connection) {
      throw new ConnectionError('Connection not found');
    }

    if (!connection.isConnected) {
      throw new ConnectionError('Connection is not active');
    }

    this.logger.info('Toggling audio', { connectionId: connection.id, mintId: connection.mintId });

    try {
      await connection.toggleAudio();
      this.logger.info('Audio toggled successfully', { connectionId: connection.id });
    } catch (error) {
      const pumpFunError = createContextualError(
        'Failed to toggle audio',
        'AUDIO_TOGGLE_ERROR',
        'toggleAudio',
        ['Check if the connection is still active', 'Verify the audio track exists']
      );
      this.logger.error('Failed to toggle audio', {
        error: pumpFunError.toJSON(),
        connectionId: connection.id,
      });
      throw pumpFunError;
    }
  }

  /**
   * 7. Video Control: Toggle video for a stream connection
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   */
  public async toggleVideo(connectionIdOrMintId: string): Promise<void> {
    this.ensureInitialized();

    const connection = this.findConnection(connectionIdOrMintId);
    if (!connection) {
      throw new ConnectionError('Connection not found');
    }

    if (!connection.isConnected) {
      throw new ConnectionError('Connection is not active');
    }

    this.logger.info('Toggling video', { connectionId: connection.id, mintId: connection.mintId });

    try {
      await connection.toggleVideo();
      this.logger.info('Video toggled successfully', { connectionId: connection.id });
    } catch (error) {
      const pumpFunError = createContextualError(
        'Failed to toggle video',
        'VIDEO_TOGGLE_ERROR',
        'toggleVideo',
        ['Check if the connection is still active', 'Verify the video track exists']
      );
      this.logger.error('Failed to toggle video', {
        error: pumpFunError.toJSON(),
        connectionId: connection.id,
      });
      throw pumpFunError;
    }
  }

  /**
   * 8. Quality Control: Set video quality for a stream connection
   *
   * @param connectionIdOrMintId - Connection ID or mint ID
   * @param quality - Video quality setting
   */
  public async setStreamQuality(
    connectionIdOrMintId: string,
    quality: VideoQuality
  ): Promise<void> {
    this.ensureInitialized();

    const connection = this.findConnection(connectionIdOrMintId);
    if (!connection) {
      throw new ConnectionError('Connection not found');
    }

    if (!connection.isConnected) {
      throw new ConnectionError('Connection is not active');
    }

    this.logger.info('Setting stream quality', {
      connectionId: connection.id,
      mintId: connection.mintId,
      quality,
    });

    try {
      await connection.setQuality(quality);
      this.logger.info('Stream quality set successfully', {
        connectionId: connection.id,
        quality,
      });
    } catch (error) {
      const pumpFunError = createContextualError(
        `Failed to set stream quality to ${quality}`,
        'QUALITY_SET_ERROR',
        'setStreamQuality',
        ['Check if the connection is still active', 'Verify the quality is supported']
      );
      this.logger.error('Failed to set stream quality', {
        error: pumpFunError.toJSON(),
        connectionId: connection.id,
        quality,
      });
      throw pumpFunError;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Graceful shutdown of the client
   */
  public async shutdown(): Promise<void> {
    try {
      this.logger.info('Starting client shutdown');

      // Cleanup all connections
      for (const connection of this.activeConnections.values()) {
        try {
          connection.isConnected = false;
          connection.state = 'disconnected' as any;
        } catch (error) {
          this.logger.warn('Failed to cleanup connection during shutdown', {
            connectionId: connection.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      this.activeConnections.clear();

      // Mark as uninitialized
      this.isInitialized = false;

      this.logger.info('Client shutdown completed');
    } catch (error) {
      this.logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * String representation for debugging
   */
  public toString(): string {
    const config = this.configManager.getConfig();
    return `PumpFunClient(baseURL="${config.baseURL}", timeout=${config.timeout}ms)`;
  }

  /**
   * JSON representation for debugging
   */
  public toJSON(): Record<string, any> {
    const config = this.configManager.getConfig();
    return {
      config: {
        baseURL: config.baseURL,
        timeout: config.timeout,
      },
      isInitialized: this.isInitialized,
      activeConnections: this.activeConnections.size,
    };
  }
}