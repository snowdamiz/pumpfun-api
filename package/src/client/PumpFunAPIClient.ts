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
  LiveStreamInfo,
  LiveKitConnectionInfo,
  ValidatedConfig,
  VideoStreamAnalysis,
  JoinLiveStreamResponse,
  SearchLiveStreamsParams,
  StreamSearchResult,
} from '../types';

interface JurisdictionResponse {
  valid: boolean;
}
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
  ErrorUtils,
} from '../infrastructure/error-handling/errors';
import { ConfigurationManager } from '../infrastructure/config/config-manager';
import { ErrorHandler } from '../infrastructure/error-handling/error-handler';
import { LiveStreamsService } from '../services/live/live-streams.service';

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
   * Get currently live streaming coins
   */
  public async getLiveCoins(params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    this.ensureInitialized();
    return this.liveStreamsService.getLiveCoins(params);
  }

  /**
   * Get active streams with minimum participants
   */
  public async getActiveStreams(
    minParticipants: number = 1,
    params?: GetLiveCoinsParams
  ): Promise<LiveCoin[]> {
    this.ensureInitialized();
    return this.liveStreamsService.getActiveStreams(minParticipants, params);
  }

  /**
   * Get top live streams by participant count
   */
  public async getTopLiveStreams(
    limit: number = 10,
    params?: GetLiveCoinsParams
  ): Promise<LiveCoin[]> {
    this.ensureInitialized();
    return this.liveStreamsService.getTopLiveStreams(limit, params);
  }

  /**
   * Get top active streams (combination of active and top)
   */
  public async getTopActiveStreams(
    limit: number = 10,
    minParticipants: number = 1
  ): Promise<LiveCoin[]> {
    this.ensureInitialized();
    return this.liveStreamsService.getTopActiveStreams(limit, minParticipants);
  }

  /**
   * Get streams with meaningful titles
   */
  public async getTitledStreams(
    limit: number = 10,
    params?: GetLiveCoinsParams
  ): Promise<LiveCoin[]> {
    this.ensureInitialized();
    return this.liveStreamsService.getTitledStreams(limit, params);
  }

  /**
   * Get titled active streams
   */
  public async getTitledActiveStreams(
    limit: number = 10,
    minParticipants: number = 1,
    params?: GetLiveCoinsParams
  ): Promise<LiveCoin[]> {
    this.ensureInitialized();
    return this.liveStreamsService.getTitledActiveStreams(limit, minParticipants, params);
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
}
