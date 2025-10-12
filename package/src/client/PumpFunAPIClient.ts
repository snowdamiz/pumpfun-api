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
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_LOGGER_CONFIG,
  DEFAULT_RETRY_CONFIG,
  ClientState,
  RateLimitState,
} from './types';
import { HTTPClient } from '../utils/http-client';
import { Logger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';

/**
 * Main API client class for PumpFun streaming data
 */
export class PumpFunAPIClient {
  /** HTTP client instance for API requests */
  private httpClient!: HTTPClient;

  /** Logger instance for debugging and monitoring */
  private logger!: Logger;

  /** Client configuration */
  private config!: Required<Omit<ClientConfig, 'retryConfig' | 'loggerConfig' | 'rateLimitConfig'>>;

  /** Additional configuration options */
  private loggerConfig?: Partial<typeof DEFAULT_LOGGER_CONFIG>;
  private rateLimitConfig?: Partial<typeof DEFAULT_RATE_LIMIT_CONFIG>;
  private retryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>;

  /** Rate limiter instance */
  private rateLimiter!: RateLimiter;

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
    this.initializeConfig(config);
    this.initializeLogger();
    this.initializeRateLimiter();
    this.initializeHTTPClient();
    this.initializeState();

    this.isInitialized = true;
    this.logger.info('PumpFunAPIClient initialized successfully', {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });
  }

  /**
   * Initialize client configuration with defaults
   */
  private initializeConfig(config?: ClientConfig): void {
    this.config = {
      baseURL: config?.baseURL ?? DEFAULT_CLIENT_CONFIG.baseURL,
      timeout: config?.timeout ?? DEFAULT_CLIENT_CONFIG.timeout,
    };

    // Store additional configuration options
    this.loggerConfig = config?.loggerConfig;
    this.rateLimitConfig = config?.rateLimitConfig;
    this.retryConfig = config?.retryConfig;

    // Create a temporary logger for this method if not yet initialized
    if (!this.logger) {
      this.logger = new Logger(DEFAULT_LOGGER_CONFIG);
    }

    this.logger.info('Client configuration initialized', {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });
  }

  /**
   * Initialize logger instance
   */
  private initializeLogger(): void {
    const loggerConfig = {
      ...DEFAULT_LOGGER_CONFIG,
      ...this.loggerConfig,
    };

    this.logger = new Logger(loggerConfig);
    this.logger.debug('Logger initialized', loggerConfig);
  }

  /**
   * Initialize rate limiter
   */
  private initializeRateLimiter(): void {
    const rateLimitConfig = {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...this.rateLimitConfig,
    };

    this.rateLimiter = new RateLimiter(rateLimitConfig);
    this.logger.debug('Rate limiter initialized', rateLimitConfig);
  }

  /**
   * Initialize HTTP client
   */
  private initializeHTTPClient(): void {
    const retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...this.retryConfig,
    };

    this.httpClient = new HTTPClient({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      retryConfig,
    });

    this.logger.debug('HTTP client initialized', {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });
  }

  /**
   * Initialize client state tracking
   */
  private initializeState(): void {
    this.state = {
      isInitialized: true,
      lastRequestTime: 0,
      requestCount: 0,
      errorCount: 0,
      rateLimitInfo: {
        requestsInWindow: 0,
        windowStart: Date.now(),
        backoffUntil: 0,
        consecutiveErrors: 0,
      },
    };

    this.logger.debug('Client state initialized');
  }

  /**
   * Get current client configuration (read-only)
   */
  public getConfiguration(): Readonly<typeof this.config> {
    return this.config;
  }

  /**
   * Get current client state
   */
  public getState(): Readonly<ClientState> {
    return { ...this.state };
  }

  /**
   * Get logger instance (for debugging)
   */
  public getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get rate limiter instance
   */
  public getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /**
   * Check if client is properly initialized
   */
  public isClientInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Update logger configuration
   */
  public updateLoggerConfig(config: Partial<typeof DEFAULT_LOGGER_CONFIG>): void {
    this.logger.updateConfig(config);
    this.logger.info('Logger configuration updated', config);
  }

  /**
   * Update rate limit configuration
   */
  public updateRateLimitConfig(config: Partial<typeof DEFAULT_RATE_LIMIT_CONFIG>): void {
    this.rateLimiter.updateConfig(config);
    this.logger.info('Rate limit configuration updated', config);
  }

  /**
   * Reset client statistics
   */
  public resetStatistics(): void {
    this.state.requestCount = 0;
    this.state.errorCount = 0;
    this.state.rateLimitInfo = {
      requestsInWindow: 0,
      windowStart: Date.now(),
      backoffUntil: 0,
      consecutiveErrors: 0,
    };

    this.logger.info('Client statistics reset');
  }

  /**
   * Get performance statistics
   */
  public getStatistics(): {
    requestCount: number;
    errorCount: number;
    errorRate: number;
    rateLimitInfo: RateLimitState;
  } {
    const errorRate = this.state.requestCount > 0
      ? (this.state.errorCount / this.state.requestCount) * 100
      : 0;

    return {
      requestCount: this.state.requestCount,
      errorCount: this.state.errorCount,
      errorRate: Math.round(errorRate * 100) / 100,
      rateLimitInfo: { ...this.state.rateLimitInfo },
    };
  }

  /**
   * Perform basic connectivity test
   */
  public async testConnection(): Promise<boolean> {
    try {
      this.logger.info('Testing API connectivity...');

      // Make a simple request to test connectivity
      await this.httpClient.get('/auth/is-valid-jurisdiction');

      this.logger.info('API connectivity test passed');
      return true;
    } catch (error) {
      this.logger.error('API connectivity test failed', { error });
      return false;
    }
  }

  /**
   * Gracefully shutdown the client
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down PumpFunAPIClient...');

    // Clear any pending requests
    this.rateLimiter.reset();

    // Mark as uninitialized
    this.isInitialized = false;

    this.logger.info('PumpFunAPIClient shutdown complete');
  }

  /**
   * Get the base API URL
   */
  public getBaseURL(): string {
    return this.config.baseURL;
  }

  /**
   * Get the configured timeout
   */
  public getTimeout(): number {
    return this.config.timeout;
  }

  /**
   * Check if client is in rate limit backoff
   */
  public isRateLimited(): boolean {
    return this.state.rateLimitInfo.backoffUntil > Date.now();
  }

  /**
   * Get remaining time until rate limit backoff ends (in milliseconds)
   */
  public getRateLimitBackoffRemaining(): number {
    const backoffUntil = this.state.rateLimitInfo.backoffUntil;
    const now = Date.now();
    return Math.max(0, backoffUntil - now);
  }

  /**
   * String representation of the client
   */
  public toString(): string {
    return `PumpFunAPIClient(baseURL="${this.config.baseURL}", timeout=${this.config.timeout}ms)`;
  }

  /**
   * JSON representation of the client (for debugging)
   */
  public toJSON() {
    return {
      config: this.config,
      state: {
        isInitialized: this.state.isInitialized,
        lastRequestTime: this.state.lastRequestTime,
        requestCount: this.state.requestCount,
        errorCount: this.state.errorCount,
        rateLimitInfo: this.state.rateLimitInfo,
      },
      statistics: this.getStatistics(),
    };
  }
}
