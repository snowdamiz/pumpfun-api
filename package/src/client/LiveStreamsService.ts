/**
 * Live Streams Service for PumpFun API Client
 *
 * This service handles all live stream related operations including fetching
 * live coins, filtering streams, and stream information retrieval.
 */

import axios from 'axios';
import {
  LiveCoin,
  GetLiveCoinsParams,
  LiveStreamInfo,
  LiveStreamsServiceConfig,
  ServiceState
} from './types';
import {
  NetworkError,
  ServerError,
  ConfigurationError,
  TimeoutError,
  PumpFunAPIError,
} from '../utils/errors';
import { Logger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import { HTTPClient } from '../utils/http-client';
import { ErrorHandler } from './ErrorHandler';

/**
 * Service for handling live streams operations
 */
export class LiveStreamsService {
  constructor(
    private config: LiveStreamsServiceConfig,
    private httpClient: HTTPClient,
    private logger: Logger,
    private rateLimiter: RateLimiter,
    private errorHandler: ErrorHandler,
    private state: ServiceState
  ) {}

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
    this.validateGetLiveCoinsParams(mergedParams);

    try {
      this.logger.info('Fetching live streaming coins...', {
        endpoint: '/coins/currently-live',
        params: mergedParams,
        baseURL: this.config.baseURL,
      });

      // Apply rate limiting before making the request
      await this.rateLimiter.waitForRequest();

      // Build query string
      const queryString = this.buildQueryString(mergedParams);
      const endpoint = `/coins/currently-live${queryString}`;

      // Enhanced request with specific error handling for API failures
      const response = await this.executeLiveCoinsRequest(endpoint, mergedParams);

      // Update statistics
      this.state.requestCount++;
      this.state.lastRequestTime = Date.now();

      // Record successful request in rate limiter
      this.rateLimiter.recordRequest();

      // Validate response data with enhanced error handling
      const liveCoins = this.validateLiveCoinsResponseWithFallback(response, mergedParams);

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
    // Validate minParticipants parameter
    if (typeof minParticipants !== 'number' || isNaN(minParticipants)) {
      throw new ConfigurationError({
        message: `Invalid minParticipants: ${minParticipants}. Must be a valid number.`,
      });
    }

    if (minParticipants < 0) {
      throw new ConfigurationError({
        message: `Invalid minParticipants: ${minParticipants}. Must be a non-negative number.`,
      });
    }

    this.logger.info('Fetching active streams', {
      minParticipants,
      params,
      endpoint: 'getLiveCoins -> filter',
    });

    try {
      const allLiveStreams = await this.getLiveCoins({
        limit: 100, // Fetch more items to account for filtering
        ...params,
      });

      // Filter streams with minimum participants
      const activeStreams = allLiveStreams.filter(stream => {
        const participants = stream.num_participants || 0;
        return participants >= minParticipants;
      });

      // Sort by participant count (highest first)
      activeStreams.sort((a, b) => {
        const aParticipants = a.num_participants || 0;
        const bParticipants = b.num_participants || 0;
        return bParticipants - aParticipants;
      });

      const stats = this.calculateParticipantStats(activeStreams);

      this.logger.info('Successfully filtered active streams', {
        minParticipants,
        totalStreams: allLiveStreams.length,
        activeStreams: activeStreams.length,
        filtered: allLiveStreams.length - activeStreams.length,
        participantStats: stats,
      });

      return activeStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getActiveStreams', {
        minParticipants,
        params,
        suggestions: this.getActiveStreamsErrorSuggestion(minParticipants, params),
      });

      this.logger.error('Failed to fetch active streams', {
        error: pumpFunError.toJSON(),
        minParticipants,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get top live streams by participant count
   */
  async getTopLiveStreams(limit: number = 10, params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    // Validate limit parameter
    if (typeof limit !== 'number' || isNaN(limit)) {
      throw new ConfigurationError({
        message: `Invalid limit: ${limit}. Must be a valid number.`,
      });
    }

    if (limit < 1) {
      throw new ConfigurationError({
        message: `Invalid limit: ${limit}. Must be at least 1.`,
      });
    }

    this.logger.info('Fetching top live streams', {
      limit,
      params,
    });

    try {
      const liveStreams = await this.getLiveCoins({
        limit: Math.max(limit, 20), // Fetch extra to account for filtering
        sort: 'participants', // Sort by participants
        order: 'DESC',
        ...params,
      });

      // Sort by participant count (highest first) and limit
      const topStreams = liveStreams
        .sort((a, b) => (b.num_participants || 0) - (a.num_participants || 0))
        .slice(0, limit);

      this.logger.info('Successfully fetched top live streams', {
        requested: limit,
        returned: topStreams.length,
        totalFetched: liveStreams.length,
        topParticipants: topStreams[0]?.num_participants || 0,
      });

      return topStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getTopLiveStreams', {
        limit,
        params,
        suggestions: [
          'Check if there are any currently live streams using getLiveCoins()',
          'Consider increasing the search parameters',
          'Verify the API server is accessible',
        ],
      });

      this.logger.error('Failed to fetch top live streams', {
        error: pumpFunError.toJSON(),
        limit,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get top active streams (combination of active and top)
   */
  async getTopActiveStreams(limit: number = 10, minParticipants: number = 1): Promise<LiveCoin[]> {
    this.logger.info('Fetching top active streams', {
      limit,
      minParticipants,
    });

    try {
      const activeStreams = await this.getActiveStreams(minParticipants, {
        limit: Math.max(limit, 20),
      });

      // Return top N streams
      const topActiveStreams = activeStreams.slice(0, limit);

      this.logger.info('Successfully fetched top active streams', {
        requested: limit,
        minParticipants,
        returned: topActiveStreams.length,
        totalActive: activeStreams.length,
      });

      return topActiveStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getTopActiveStreams', {
        limit,
        minParticipants,
      });

      this.logger.error('Failed to fetch top active streams', {
        error: pumpFunError.toJSON(),
        limit,
        minParticipants,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get streams with meaningful titles
   */
  async getTitledStreams(limit: number = 10, params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    // Validate limit parameter
    if (typeof limit !== 'number' || isNaN(limit)) {
      throw new ConfigurationError({
        message: `Invalid limit: ${limit}. Must be a valid number.`,
      });
    }

    if (limit < 1) {
      throw new ConfigurationError({
        message: `Invalid limit: ${limit}. Must be at least 1.`,
      });
    }

    this.logger.info('Fetching titled streams', {
      limit,
      params,
    });

    try {
      const liveStreams = await this.getLiveCoins({
        limit: Math.max(limit, 50), // Fetch extra to account for filtering
        ...params,
      });

      // Filter streams with meaningful titles
      const titledStreams = liveStreams.filter(stream => {
        const title = stream.livestream_title;
        return title && title.trim().length > 0 && !title.match(/^(Stream|Live|Broadcast)\s*\d*$/i);
      });

      // Sort by participant count (highest first) and limit
      const topTitledStreams = titledStreams
        .sort((a, b) => (b.num_participants || 0) - (a.num_participants || 0))
        .slice(0, limit);

      this.logger.info('Successfully fetched titled streams', {
        requested: limit,
        returned: topTitledStreams.length,
        totalFetched: liveStreams.length,
        totalTitled: titledStreams.length,
      });

      return topTitledStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getTitledStreams', {
        limit,
        params,
        suggestions: [
          'Check if there are any currently live streams using getLiveCoins()',
          'Consider using getActiveStreams() for streams with participants',
          'Verify the API server is accessible',
        ],
      });

      this.logger.error('Failed to fetch titled streams', {
        error: pumpFunError.toJSON(),
        limit,
        params,
      });

      throw pumpFunError;
    }
  }

  /**
   * Get titled active streams
   */
  async getTitledActiveStreams(
    limit: number = 10,
    minParticipants: number = 1,
    params?: GetLiveCoinsParams
  ): Promise<LiveCoin[]> {
    this.logger.info('Fetching titled active streams', {
      limit,
      minParticipants,
      params,
    });

    try {
      const activeStreams = await this.getActiveStreams(minParticipants, {
        limit: Math.max(limit, 50),
        ...params,
      });

      // Filter streams with meaningful titles
      const titledActiveStreams = activeStreams.filter(stream => {
        const title = stream.livestream_title;
        return title && title.trim().length > 0 && !title.match(/^(Stream|Live|Broadcast)\s*\d*$/i);
      });

      // Return top N streams
      const topTitledActiveStreams = titledActiveStreams.slice(0, limit);

      this.logger.info('Successfully fetched titled active streams', {
        requested: limit,
        minParticipants,
        returned: topTitledActiveStreams.length,
        totalActive: activeStreams.length,
        totalTitledActive: titledActiveStreams.length,
      });

      return topTitledActiveStreams;
    } catch (error) {
      const pumpFunError = this.errorHandler.handleError(error, 'getTitledActiveStreams', {
        limit,
        minParticipants,
        params,
      });

      this.logger.error('Failed to fetch titled active streams', {
        error: pumpFunError.toJSON(),
        limit,
        minParticipants,
        params,
      });

      throw pumpFunError;
    }
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
          throw new PumpFunAPIError({
            message: `Invalid request for live stream info: ${responseData?.message || error.message}`,
            code: 'INVALID_LIVESTREAM_REQUEST',
            statusCode,
            isRetryable: false,
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
          throw new PumpFunAPIError({
            message: `Unauthorized access to livestream API: ${responseData?.message || error.message}`,
            code: 'LIVESTREAM_UNAUTHORIZED',
            statusCode,
            isRetryable: false,
            details: {
              mintId,
              statusCode,
            },
          });
        }

        if (statusCode === 403) {
          throw new PumpFunAPIError({
            message: `Forbidden access to livestream API: ${responseData?.message || error.message}`,
            code: 'LIVESTREAM_FORBIDDEN',
            statusCode,
            isRetryable: false,
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

        throw new PumpFunAPIError({
          message: `HTTP ${statusCode} error from livestream API: ${responseData?.message || error.message}`,
          code: 'LIVESTREAM_API_HTTP_ERROR',
          statusCode,
          isRetryable: statusCode >= 500,
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

  /**
   * Private helper methods
   */
  private async executeLiveCoinsRequest(
    endpoint: string,
    _params: Required<GetLiveCoinsParams>
  ): Promise<any> {
    let lastError: any;

    // Implement retry logic specifically for API failures
    const maxRetries = this.config.retryConfig?.maxRetries ?? 3;
    const baseDelay = this.config.retryConfig?.baseDelay ?? 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient.get(endpoint);
        return response;
      } catch (error: unknown) {
        lastError = error;

        // Ensure error is properly typed for logging
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorConstructor = error instanceof Error ? error.constructor.name : 'Unknown';

        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          this.logger.warn('Non-retryable error encountered, not retrying', {
            attempt: attempt + 1,
            errorType: errorConstructor,
            message: errorMessage,
          });
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          this.logger.error('All retry attempts failed for live coins request', {
            totalAttempts: maxRetries + 1,
            lastError: errorMessage,
          });
          throw error;
        }

        // Calculate delay for this attempt
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);

        this.logger.warn(`Live coins request failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          error: errorMessage,
          nextRetryIn: delay,
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private shouldNotRetry(error: any): boolean {
    // Don't retry configuration errors
    if (
      error.message?.includes('Configuration') ||
      error.message?.includes('Invalid baseURL') ||
      error.message?.includes('validation failed')
    ) {
      return true;
    }

    // Don't retry authentication errors (401)
    if (error.response?.status === 401) {
      return true;
    }

    // Don't retry forbidden errors (403)
    if (error.response?.status === 403) {
      return true;
    }

    // Don't retry not found errors (404) for live coins endpoint
    if (error.response?.status === 404) {
      return true;
    }

    // Don't retry validation errors (400)
    if (error.response?.status === 400) {
      return true;
    }

    return false;
  }

  private validateLiveCoinsResponseWithFallback(
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

  private validateGetLiveCoinsParams(params: Required<GetLiveCoinsParams>): void {
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

  private buildQueryString(params: Required<GetLiveCoinsParams>): string {
    const queryParams = new URLSearchParams();

    // Only add parameters that differ from defaults or are explicitly provided
    if (params.offset !== 0) {
      queryParams.append('offset', params.offset.toString());
    }
    if (params.limit !== 10) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.sort !== 'currently_live') {
      queryParams.append('sort', params.sort);
    }
    if (params.order !== 'DESC') {
      queryParams.append('order', params.order);
    }
    if (params.includeNsfw !== false) {
      queryParams.append('includeNsfw', params.includeNsfw.toString());
    }

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  private validateLiveCoinsResponse(response: any): LiveCoin[] {
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

  private validateLiveCoin(coin: any, index: number): LiveCoin {
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

  private sanitizeCoinForLogging(coin: any): any {
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

  private calculateParticipantStats(streams: LiveCoin[]): {
    totalParticipants: number;
    averageParticipants: number;
    maxParticipants: number;
    minParticipants: number;
  } {
    const participantCounts = streams.map(stream => stream.num_participants || 0);

    return {
      totalParticipants: participantCounts.reduce((sum, count) => sum + count, 0),
      averageParticipants:
        participantCounts.length > 0
          ? participantCounts.reduce((sum, count) => sum + count, 0) / participantCounts.length
          : 0,
      maxParticipants: participantCounts.length > 0 ? Math.max(...participantCounts) : 0,
      minParticipants: participantCounts.length > 0 ? Math.min(...participantCounts) : 0,
    };
  }

  private getActiveStreamsErrorSuggestion(
    minParticipants: number,
    params?: GetLiveCoinsParams
  ): string[] {
    const suggestions: string[] = [
      `Consider lowering the minParticipants threshold (current: ${minParticipants})`,
      'Check if there are any live streams currently available',
      'Verify the API server is accessible',
    ];

    if (minParticipants > 1) {
      suggestions.push('Try with minParticipants=1 to see all available streams');
      suggestions.push(
        'Use getLiveCoins() directly if you need all live streams without filtering'
      );
    }

    if (params?.limit && params.limit < 50) {
      suggestions.push(
        'Consider using a larger limit parameter to fetch more streams for filtering'
      );
    }

    return suggestions;
  }
}
