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
  LogLevel,
  LiveCoin,
  GetLiveCoinsParams,
} from './types';
import { HTTPClient } from '../utils/http-client';
import { Logger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import {
  PumpFunError,
  NetworkError,
  RateLimitError,
  ServerError,
  ConfigurationError,
  TimeoutError,
  ErrorFactory,
  ErrorUtils
} from '../utils/errors';

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
   * Initialize client configuration with defaults and environment variable support
   */
  private initializeConfig(config?: ClientConfig): void {
    // Load configuration from environment variables first
    const envConfig = this.loadEnvironmentConfig();

    // Filter out undefined values from config
    const filteredConfig = config ? Object.fromEntries(
      Object.entries(config).filter(([_, value]) => value !== undefined)
    ) : {};

    // Merge configuration: defaults < environment < explicit config
    const mergedConfig = {
      ...DEFAULT_CLIENT_CONFIG,
      ...envConfig,
      ...filteredConfig,
    };

    // Validate the merged configuration
    this.validateConfig(mergedConfig);

    this.config = {
      baseURL: mergedConfig.baseURL!,
      timeout: mergedConfig.timeout!,
    };

    // Store additional configuration options
    this.loggerConfig = {
      ...DEFAULT_LOGGER_CONFIG,
      ...envConfig.loggerConfig,
      ...config?.loggerConfig,
    };
    this.rateLimitConfig = {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...envConfig.rateLimitConfig,
      ...config?.rateLimitConfig,
    };
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...envConfig.retryConfig,
      ...config?.retryConfig,
    };

    // Create a temporary logger for this method if not yet initialized
    if (!this.logger) {
      this.logger = new Logger(this.loggerConfig);
    }

    this.logger.info('Client configuration initialized', {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      source: {
        defaults: !!config?.baseURL || !!config?.timeout,
        environment: !!envConfig.baseURL || !!envConfig.timeout,
        explicit: !!config?.baseURL || !!config?.timeout,
      },
    });
  }

  /**
   * Load configuration from environment variables
   */
  private loadEnvironmentConfig(): Partial<ClientConfig> {
    const envConfig: Partial<ClientConfig> = {};

    // Load base URL from environment
    if (process.env.PUMPFUN_API_BASE_URL) {
      const baseURL = process.env.PUMPFUN_API_BASE_URL.trim();
      if (baseURL) {
        envConfig.baseURL = baseURL;
      }
    }

    // Load WebSocket URL from environment (stored for future use)
    if (process.env.PUMPFUN_WS_URL) {
      const wsURL = process.env.PUMPFUN_WS_URL.trim();
      if (wsURL) {
        // Store in client config for future WebSocket support
        (envConfig as any).wsURL = wsURL;
      }
    }

    // Load authentication from environment (stored for future use)
    if (process.env.PUMPFUN_API_KEY) {
      const apiKey = process.env.PUMPFUN_API_KEY.trim();
      if (apiKey) {
        (envConfig as any).apiKey = apiKey;
      }
    }
    if (process.env.PUMPFUN_AUTH_TOKEN) {
      const authToken = process.env.PUMPFUN_AUTH_TOKEN.trim();
      if (authToken) {
        (envConfig as any).authToken = authToken;
      }
    }

    // Load timeout from environment
    if (process.env.PUMPFUN_API_TIMEOUT) {
      const timeout = parseInt(process.env.PUMPFUN_API_TIMEOUT, 10);
      if (!isNaN(timeout) && timeout > 0) {
        envConfig.timeout = timeout;
      }
    } else if (process.env.TIMEOUT_MS) {
      // Support legacy variable name
      const timeout = parseInt(process.env.TIMEOUT_MS, 10);
      if (!isNaN(timeout) && timeout > 0) {
        envConfig.timeout = timeout;
      }
    }

    // Load logger configuration from environment
    const loggerConfig: any = {};
    if (process.env.PUMPFUN_LOG_LEVEL) {
      const level = process.env.PUMPFUN_LOG_LEVEL.toUpperCase();
      if (Object.values(LogLevel).includes(level as any)) {
        loggerConfig.level = level as any;
      }
    } else if (process.env.LOG_LEVEL) {
      // Support legacy variable name
      const level = process.env.LOG_LEVEL.toUpperCase();
      if (Object.values(LogLevel).includes(level as any)) {
        loggerConfig.level = level as any;
      }
    }
    if (process.env.PUMPFUN_LOG_CONSOLE !== undefined) {
      loggerConfig.enableConsole = process.env.PUMPFUN_LOG_CONSOLE === 'true';
    }
    if (process.env.PUMPFUN_LOG_COLORS !== undefined) {
      loggerConfig.enableColors = process.env.PUMPFUN_LOG_COLORS === 'true';
    }
    if (process.env.PUMPFUN_LOG_FILE !== undefined) {
      loggerConfig.enableFile = process.env.PUMPFUN_LOG_FILE === 'true';
    } else if (process.env.ENABLE_RESPONSE_LOGGING !== undefined) {
      // Support legacy variable name
      loggerConfig.enableFile = process.env.ENABLE_RESPONSE_LOGGING === 'true';
    }
    if (process.env.PUMPFUN_LOG_FILE_PATH) {
      loggerConfig.filePath = process.env.PUMPFUN_LOG_FILE_PATH;
    } else if (process.env.LOG_FILE_PATH) {
      // Support legacy variable name
      loggerConfig.filePath = process.env.LOG_FILE_PATH;
    }
    if (Object.keys(loggerConfig).length > 0) {
      envConfig.loggerConfig = loggerConfig;
    }

    // Load rate limit configuration from environment
    const rateLimitConfig: any = {};
    if (process.env.PUMPFUN_RATE_LIMIT_REQUESTS) {
      const requests = parseInt(process.env.PUMPFUN_RATE_LIMIT_REQUESTS, 10);
      if (!isNaN(requests) && requests > 0) {
        rateLimitConfig.maxRequestsPerWindow = requests;
      }
    } else if (process.env.MAX_REQUESTS_PER_MINUTE) {
      // Support legacy variable name
      const requests = parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10);
      if (!isNaN(requests) && requests > 0) {
        rateLimitConfig.maxRequestsPerWindow = requests;
      }
    }
    if (process.env.PUMPFUN_RATE_LIMIT_WINDOW_MS) {
      const windowMs = parseInt(process.env.PUMPFUN_RATE_LIMIT_WINDOW_MS, 10);
      if (!isNaN(windowMs) && windowMs > 0) {
        rateLimitConfig.windowMs = windowMs;
      }
    }
    if (process.env.PUMPFUN_RATE_LIMIT_RETRY_AFTER !== undefined) {
      rateLimitConfig.enableRetryAfter = process.env.PUMPFUN_RATE_LIMIT_RETRY_AFTER === 'true';
    }
    if (process.env.PUMPFUN_RATE_LIMIT_SLIDING_WINDOW !== undefined) {
      rateLimitConfig.enableSlidingWindow = process.env.PUMPFUN_RATE_LIMIT_SLIDING_WINDOW === 'true';
    }
    if (process.env.PUMPFUN_RATE_LIMIT_BURST_PROTECTION !== undefined) {
      rateLimitConfig.enableBurstProtection = process.env.PUMPFUN_RATE_LIMIT_BURST_PROTECTION === 'true';
    }
    if (process.env.PUMPFUN_RATE_LIMIT_MAX_BURST) {
      const maxBurst = parseInt(process.env.PUMPFUN_RATE_LIMIT_MAX_BURST, 10);
      if (!isNaN(maxBurst) && maxBurst > 0) {
        rateLimitConfig.maxBurst = maxBurst;
      }
    }
    if (Object.keys(rateLimitConfig).length > 0) {
      envConfig.rateLimitConfig = rateLimitConfig;
    }

    // Load retry configuration from environment
    const retryConfig: any = {};
    if (process.env.PUMPFUN_RETRY_MAX_RETRIES) {
      const maxRetries = parseInt(process.env.PUMPFUN_RETRY_MAX_RETRIES, 10);
      if (!isNaN(maxRetries) && maxRetries >= 0) {
        retryConfig.maxRetries = maxRetries;
      }
    }
    if (process.env.PUMPFUN_RETRY_BASE_DELAY) {
      const baseDelay = parseInt(process.env.PUMPFUN_RETRY_BASE_DELAY, 10);
      if (!isNaN(baseDelay) && baseDelay > 0) {
        retryConfig.baseDelay = baseDelay;
      }
    } else if (process.env.RATE_LIMIT_DELAY_MS) {
      // Use rate limit delay as retry base delay if not specified
      const baseDelay = parseInt(process.env.RATE_LIMIT_DELAY_MS, 10);
      if (!isNaN(baseDelay) && baseDelay > 0) {
        retryConfig.baseDelay = baseDelay;
      }
    }
    if (process.env.PUMPFUN_RETRY_MAX_DELAY) {
      const maxDelay = parseInt(process.env.PUMPFUN_RETRY_MAX_DELAY, 10);
      if (!isNaN(maxDelay) && maxDelay > 0) {
        retryConfig.maxDelay = maxDelay;
      }
    }
    if (process.env.PUMPFUN_RETRY_BACKOFF_FACTOR) {
      const backoffFactor = parseFloat(process.env.PUMPFUN_RETRY_BACKOFF_FACTOR);
      if (!isNaN(backoffFactor) && backoffFactor > 0) {
        retryConfig.backoffFactor = backoffFactor;
      }
    }
    if (Object.keys(retryConfig).length > 0) {
      envConfig.retryConfig = retryConfig;
    }

    return envConfig;
  }

  /**
   * Validate configuration parameters with comprehensive error handling
   */
  private validateConfig(config: Partial<ClientConfig>): void {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate baseURL
    if (config.baseURL) {
      try {
        const url = new URL(config.baseURL);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push(`Invalid baseURL protocol: ${url.protocol}. Only http: and https: are allowed.`);
        }
        if (url.hostname.includes('localhost') || url.hostname.includes('127.0.0.1')) {
          warnings.push(`Using localhost address: ${url.hostname}. This may not work in production.`);
        }
      } catch (error) {
        errors.push(`Invalid baseURL format: "${config.baseURL}". Expected format: "https://api.example.com"`);
      }
    }

    // Validate timeout
    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number' || isNaN(config.timeout)) {
        errors.push(`Invalid timeout: ${config.timeout}. Must be a valid number.`);
      } else if (config.timeout <= 0) {
        errors.push(`Invalid timeout: ${config.timeout}ms. Must be a positive number greater than 0.`);
      } else if (config.timeout > 60000) {
        warnings.push(`Timeout very high: ${config.timeout}ms. Consider reducing to 30000ms (30 seconds) for better responsiveness.`);
      } else if (config.timeout < 1000) {
        warnings.push(`Timeout very low: ${config.timeout}ms. Consider increasing to at least 5000ms (5 seconds) to avoid timeouts.`);
      }
    }

    // Validate retry configuration
    if (config.retryConfig) {
      const retryConfig = config.retryConfig;

      if (retryConfig.maxRetries !== undefined) {
        if (typeof retryConfig.maxRetries !== 'number' || isNaN(retryConfig.maxRetries)) {
          errors.push(`Invalid maxRetries: ${retryConfig.maxRetries}. Must be a valid number.`);
        } else if (retryConfig.maxRetries < 0) {
          errors.push(`Invalid maxRetries: ${retryConfig.maxRetries}. Cannot be negative.`);
        } else if (retryConfig.maxRetries > 10) {
          errors.push(`Invalid maxRetries: ${retryConfig.maxRetries}. Maximum allowed is 10 to prevent excessive retries.`);
        }
      }

      if (retryConfig.baseDelay !== undefined) {
        if (typeof retryConfig.baseDelay !== 'number' || isNaN(retryConfig.baseDelay)) {
          errors.push(`Invalid baseDelay: ${retryConfig.baseDelay}. Must be a valid number.`);
        } else if (retryConfig.baseDelay < 100) {
          errors.push(`Invalid baseDelay: ${retryConfig.baseDelay}ms. Minimum is 100ms to prevent spam.`);
        } else if (retryConfig.baseDelay > 10000) {
          errors.push(`Invalid baseDelay: ${retryConfig.baseDelay}ms. Maximum is 10000ms (10 seconds).`);
        }
      }

      if (retryConfig.maxDelay !== undefined) {
        if (typeof retryConfig.maxDelay !== 'number' || isNaN(retryConfig.maxDelay)) {
          errors.push(`Invalid maxDelay: ${retryConfig.maxDelay}. Must be a valid number.`);
        } else if (retryConfig.maxDelay < 1000) {
          errors.push(`Invalid maxDelay: ${retryConfig.maxDelay}ms. Minimum is 1000ms (1 second).`);
        } else if (retryConfig.maxDelay > 300000) {
          errors.push(`Invalid maxDelay: ${retryConfig.maxDelay}ms. Maximum is 300000ms (5 minutes).`);
        }
      }

      if (retryConfig.backoffFactor !== undefined) {
        if (typeof retryConfig.backoffFactor !== 'number' || isNaN(retryConfig.backoffFactor)) {
          errors.push(`Invalid backoffFactor: ${retryConfig.backoffFactor}. Must be a valid number.`);
        } else if (retryConfig.backoffFactor < 1) {
          errors.push(`Invalid backoffFactor: ${retryConfig.backoffFactor}. Must be at least 1.0.`);
        } else if (retryConfig.backoffFactor > 5) {
          errors.push(`Invalid backoffFactor: ${retryConfig.backoffFactor}. Maximum is 5.0 to prevent excessive delays.`);
        }
      }

      // Check for logical consistency
      if (retryConfig.baseDelay && retryConfig.maxDelay && retryConfig.baseDelay >= retryConfig.maxDelay) {
        errors.push(`baseDelay (${retryConfig.baseDelay}ms) must be less than maxDelay (${retryConfig.maxDelay}ms).`);
      }
    }

    // Validate rate limit configuration
    if (config.rateLimitConfig) {
      const rateLimitConfig = config.rateLimitConfig;

      if (rateLimitConfig.maxRequestsPerWindow !== undefined) {
        if (typeof rateLimitConfig.maxRequestsPerWindow !== 'number' || isNaN(rateLimitConfig.maxRequestsPerWindow)) {
          errors.push(`Invalid maxRequestsPerWindow: ${rateLimitConfig.maxRequestsPerWindow}. Must be a valid number.`);
        } else if (rateLimitConfig.maxRequestsPerWindow < 1) {
          errors.push(`Invalid maxRequestsPerWindow: ${rateLimitConfig.maxRequestsPerWindow}. Must be at least 1.`);
        } else if (rateLimitConfig.maxRequestsPerWindow > 1000) {
          errors.push(`Invalid maxRequestsPerWindow: ${rateLimitConfig.maxRequestsPerWindow}. Maximum is 1000 to prevent server overload.`);
        }
      }

      if (rateLimitConfig.windowMs !== undefined) {
        if (typeof rateLimitConfig.windowMs !== 'number' || isNaN(rateLimitConfig.windowMs)) {
          errors.push(`Invalid windowMs: ${rateLimitConfig.windowMs}. Must be a valid number.`);
        } else if (rateLimitConfig.windowMs < 1000) {
          errors.push(`Invalid windowMs: ${rateLimitConfig.windowMs}ms. Minimum is 1000ms (1 second).`);
        } else if (rateLimitConfig.windowMs > 3600000) {
          errors.push(`Invalid windowMs: ${rateLimitConfig.windowMs}ms. Maximum is 3600000ms (1 hour).`);
        }
      }

      if (rateLimitConfig.maxBurst !== undefined) {
        if (typeof rateLimitConfig.maxBurst !== 'number' || isNaN(rateLimitConfig.maxBurst)) {
          errors.push(`Invalid maxBurst: ${rateLimitConfig.maxBurst}. Must be a valid number.`);
        } else if (rateLimitConfig.maxBurst < 1) {
          errors.push(`Invalid maxBurst: ${rateLimitConfig.maxBurst}. Must be at least 1.`);
        }
      }

      if (rateLimitConfig.baseBackoffMs !== undefined) {
        if (typeof rateLimitConfig.baseBackoffMs !== 'number' || isNaN(rateLimitConfig.baseBackoffMs)) {
          errors.push(`Invalid baseBackoffMs: ${rateLimitConfig.baseBackoffMs}. Must be a valid number.`);
        } else if (rateLimitConfig.baseBackoffMs < 100) {
          errors.push(`Invalid baseBackoffMs: ${rateLimitConfig.baseBackoffMs}ms. Minimum is 100ms.`);
        } else if (rateLimitConfig.baseBackoffMs > 10000) {
          errors.push(`Invalid baseBackoffMs: ${rateLimitConfig.baseBackoffMs}ms. Maximum is 10000ms (10 seconds).`);
        }
      }

      if (rateLimitConfig.maxBackoffMs !== undefined) {
        if (typeof rateLimitConfig.maxBackoffMs !== 'number' || isNaN(rateLimitConfig.maxBackoffMs)) {
          errors.push(`Invalid maxBackoffMs: ${rateLimitConfig.maxBackoffMs}. Must be a valid number.`);
        } else if (rateLimitConfig.maxBackoffMs < 1000) {
          errors.push(`Invalid maxBackoffMs: ${rateLimitConfig.maxBackoffMs}ms. Minimum is 1000ms (1 second).`);
        } else if (rateLimitConfig.maxBackoffMs > 300000) {
          errors.push(`Invalid maxBackoffMs: ${rateLimitConfig.maxBackoffMs}ms. Maximum is 300000ms (5 minutes).`);
        }
      }

      if (rateLimitConfig.backoffMultiplier !== undefined) {
        if (typeof rateLimitConfig.backoffMultiplier !== 'number' || isNaN(rateLimitConfig.backoffMultiplier)) {
          errors.push(`Invalid backoffMultiplier: ${rateLimitConfig.backoffMultiplier}. Must be a valid number.`);
        } else if (rateLimitConfig.backoffMultiplier < 1) {
          errors.push(`Invalid backoffMultiplier: ${rateLimitConfig.backoffMultiplier}. Must be at least 1.0.`);
        } else if (rateLimitConfig.backoffMultiplier > 5) {
          errors.push(`Invalid backoffMultiplier: ${rateLimitConfig.backoffMultiplier}. Maximum is 5.0.`);
        }
      }

      // Check for logical consistency
      if (rateLimitConfig.baseBackoffMs && rateLimitConfig.maxBackoffMs && rateLimitConfig.baseBackoffMs >= rateLimitConfig.maxBackoffMs) {
        errors.push(`baseBackoffMs (${rateLimitConfig.baseBackoffMs}ms) must be less than maxBackoffMs (${rateLimitConfig.maxBackoffMs}ms).`);
      }
    }

    // Validate logger configuration
    if (config.loggerConfig) {
      const loggerConfig = config.loggerConfig;

      if (loggerConfig.level && !Object.values(LogLevel).includes(loggerConfig.level)) {
        errors.push(`Invalid log level: "${loggerConfig.level}". Must be one of: ${Object.values(LogLevel).join(', ')}.`);
      }

      if (loggerConfig.filePath !== undefined) {
        if (typeof loggerConfig.filePath !== 'string') {
          errors.push(`Invalid log file path: must be a string, got ${typeof loggerConfig.filePath}.`);
        } else if (loggerConfig.filePath.trim() === '') {
          errors.push(`Invalid log file path: cannot be empty string.`);
        }
      }
    }

    // Log warnings if there are any
    if (warnings.length > 0 && this.logger) {
      warnings.forEach(warning => this.logger.warn(`Configuration warning: ${warning}`));
    }

    // If there are validation errors, throw a comprehensive error
    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:\n${errors.map((error, index) => `  ${index + 1}. ${error}`).join('\n')}\n\nPlease fix these errors and try again. Refer to the documentation for valid configuration options.`;
      throw new Error(errorMessage);
    }
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

  // ============================================================================
  // Enhanced Error Handling and Recovery Methods (T023)
  // ============================================================================

  /**
   * Validate jurisdiction with enhanced error handling and recovery guidance
   *
   * This method provides comprehensive error handling for the jurisdiction validation
   * endpoint with helpful error messages and recovery suggestions.
   *
   * @returns Promise that resolves to true if jurisdiction is valid, false otherwise
   * @throws {PumpFunError} Various error types with specific recovery guidance
   */
  public async validateJurisdiction(): Promise<boolean> {
    this.ensureInitialized();

    try {
      this.logger.info('Validating jurisdiction...', {
        endpoint: '/auth/is-valid-jurisdiction',
        baseURL: this.config.baseURL
      });

      const response = await this.httpClient.get('/auth/is-valid-jurisdiction');

      // Update statistics
      this.state.requestCount++;
      this.state.lastRequestTime = Date.now();

      this.logger.info('Jurisdiction validation successful', {
        isValid: response?.is_valid,
        response
      });

      return Boolean(response?.is_valid);

    } catch (error) {
      this.state.errorCount++;
      const pumpFunError = this.handleError(error, 'validateJurisdiction', {
        endpoint: '/auth/is-valid-jurisdiction',
        baseURL: this.config.baseURL
      });

      this.logger.error('Jurisdiction validation failed', {
        error: pumpFunError.toJSON(),
        resolution: pumpFunError.getResolution()
      });

      throw pumpFunError;
    }
  }

  /**
   * Get currently live streaming coins with pagination and filtering
   *
   * This method retrieves a list of coins that currently have active live streams,
   * with support for pagination, sorting, and filtering options. Enhanced error
   * handling provides specific recovery guidance for API failures.
   *
   * @param params - Optional parameters for pagination, sorting, and filtering
   * @returns Promise that resolves to an array of LiveCoin objects
   * @throws {PumpFunError} Various error types with specific recovery guidance
   */
  public async getLiveCoins(params?: GetLiveCoinsParams): Promise<LiveCoin[]> {
    this.ensureInitialized();

    // Set default parameter values
    const defaultParams: Required<GetLiveCoinsParams> = {
      offset: 0,
      limit: 10,
      sort: 'currently_live',
      order: 'DESC',
      includeNsfw: false
    };

    // Merge provided params with defaults
    const mergedParams = { ...defaultParams, ...params };

    // Validate parameters
    this.validateGetLiveCoinsParams(mergedParams);

    try {
      this.logger.info('Fetching live streaming coins...', {
        endpoint: '/coins/currently-live',
        params: mergedParams,
        baseURL: this.config.baseURL
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
        responseTime: Date.now() - this.state.lastRequestTime
      });

      return liveCoins;

    } catch (error) {
      this.state.errorCount++;
      const pumpFunError = this.handleError(error, 'getLiveCoins', {
        endpoint: '/coins/currently-live',
        params: mergedParams,
        baseURL: this.config.baseURL,
        requestTime: new Date().toISOString()
      });

      this.logger.error('Failed to fetch live streaming coins', {
        error: pumpFunError.toJSON(),
        params: mergedParams,
        resolution: pumpFunError.getResolution(),
        errorCategory: pumpFunError.details?.errorCategory
      });

      throw pumpFunError;
    }
  }

  /**
   * Execute live coins request with enhanced error handling and retry logic
   */
  private async executeLiveCoinsRequest(endpoint: string, _params: Required<GetLiveCoinsParams>): Promise<any> {
    let lastError: any;

    // Implement retry logic specifically for API failures
    const maxRetries = this.retryConfig?.maxRetries || 3;
    const baseDelay = this.retryConfig?.baseDelay || 1000;

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
            message: errorMessage
          });
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          this.logger.error('All retry attempts failed for live coins request', {
            totalAttempts: maxRetries + 1,
            lastError: errorMessage
          });
          throw error;
        }

        // Calculate delay for this attempt
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);

        this.logger.warn(`Live coins request failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          error: errorMessage,
          nextRetryIn: delay
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Determine if an error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    // Don't retry configuration errors
    if (this.isConfigurationError(error)) {
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

  /**
   * Validate live coins response with fallback handling for API failures
   */
  private validateLiveCoinsResponseWithFallback(response: any, params: Required<GetLiveCoinsParams>): LiveCoin[] {
    // Handle completely empty or null responses
    if (!response) {
      this.logger.warn('Received empty response from live coins API', {
        params,
        responseType: typeof response
      });
      return [];
    }

    // Handle non-array responses with fallback
    if (!Array.isArray(response)) {
      // If it's an object with a data property that's an array, use that
      if (response && typeof response === 'object' && Array.isArray(response.data)) {
        this.logger.info('Response wrapped in object, extracting data array', {
          responseKeys: Object.keys(response),
          dataArrayLength: response.data.length
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
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Proceed with normal validation
    return this.validateLiveCoinsResponse(response);
  }

  /**
   * Validate parameters for getLiveCoins request
   *
   * @param params The parameters to validate
   * @throws {ConfigurationError} If parameters are invalid
   */
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
      errors.push(`Invalid sort field: "${params.sort}". Must be one of: ${validSortFields.join(', ')}.`);
    }

    // Validate sort order
    const validSortOrders = ['ASC', 'DESC'];
    if (!validSortOrders.includes(params.order)) {
      errors.push(`Invalid sort order: "${params.order}". Must be one of: ${validSortOrders.join(', ')}.`);
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
          validationErrors: errors
        }
      });
    }
  }

  /**
   * Build query string from parameters
   *
   * @param params The parameters to convert to query string
   * @returns Query string (including leading ? if parameters exist)
   */
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

  /**
   * Validate and normalize live coins response data
   *
   * @param response The raw response from the API
   * @returns Validated array of LiveCoin objects
   * @throws {ServerError} If response data is invalid
   */
  private validateLiveCoinsResponse(response: any): LiveCoin[] {
    if (!Array.isArray(response)) {
      throw new ServerError({
        message: 'Invalid response format: expected array of live coins',
        statusCode: 500,
        details: {
          expectedType: 'array',
          receivedType: typeof response,
          response
        }
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
        validItems: liveCoins.length
      });
    }

    return liveCoins;
  }

  /**
   * Validate a single LiveCoin object against TypeScript interface specification
   *
   * This method performs comprehensive runtime validation to ensure the API response
   * matches the LiveCoin TypeScript interface exactly, including type checking,
   * value constraints, and format validation.
   *
   * @param coin The coin object to validate
   * @param index The index of the coin in the array (for error reporting)
   * @returns Validated LiveCoin object
   * @throws {ServerError} If coin data is invalid
   */
  private validateLiveCoin(coin: any, index: number): LiveCoin {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation (all required fields from LiveCoin interface)
    const requiredFields: (keyof LiveCoin)[] = [
      'mint', 'name', 'symbol', 'description', 'image_uri', 'creator',
      'created_timestamp', 'market_cap', 'usd_market_cap', 'is_currently_live',
      'num_participants', 'reply_count', 'thumbnail', 'last_reply'
    ];

    for (const field of requiredFields) {
      if (coin[field] === undefined || coin[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Optional field validation (should be undefined, null, or correct type)
    const optionalFields: (keyof LiveCoin)[] = ['twitter', 'telegram', 'livestream_title'];
    for (const field of optionalFields) {
      if (coin[field] !== undefined && coin[field] !== null && typeof coin[field] !== 'string') {
        errors.push(`Optional field ${field} must be string or undefined/null, got ${typeof coin[field]}`);
      }
    }

    // Strict type validation for all fields
    if (coin.mint !== undefined) {
      if (typeof coin.mint !== 'string') {
        errors.push(`mint must be string, got ${typeof coin.mint}`);
      } else {
        // Validate Solana address format (base58, 32-44 characters)
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(coin.mint)) {
          errors.push(`mint must be valid Solana address (base58, 32-44 chars), got: "${coin.mint}"`);
        }
      }
    }

    if (coin.name !== undefined) {
      if (typeof coin.name !== 'string') {
        errors.push(`name must be string, got ${typeof coin.name}`);
      } else {
        if (coin.name.length === 0) {
          errors.push(`name cannot be empty string`);
        } else if (coin.name.length > 100) {
          errors.push(`name exceeds maximum length of 100 characters (${coin.name.length})`);
        }
      }
    }

    if (coin.symbol !== undefined) {
      if (typeof coin.symbol !== 'string') {
        errors.push(`symbol must be string, got ${typeof coin.symbol}`);
      } else {
        if (coin.symbol.length === 0) {
          errors.push(`symbol cannot be empty string`);
        } else if (coin.symbol.length > 20) {
          errors.push(`symbol exceeds maximum length of 20 characters (${coin.symbol.length})`);
        }
      }
    }

    if (coin.description !== undefined) {
      if (typeof coin.description !== 'string') {
        errors.push(`description must be string, got ${typeof coin.description}`);
      } else {
        if (coin.description.length === 0) {
          errors.push(`description cannot be empty string`);
        } else if (coin.description.length > 1000) {
          errors.push(`description exceeds maximum length of 1000 characters (${coin.description.length})`);
        }
      }
    }

    if (coin.image_uri !== undefined) {
      if (typeof coin.image_uri !== 'string') {
        errors.push(`image_uri must be string, got ${typeof coin.image_uri}`);
      } else {
        try {
          const url = new URL(coin.image_uri);
          if (!['http:', 'https:'].includes(url.protocol)) {
            errors.push(`image_uri must use HTTP or HTTPS protocol, got: ${url.protocol}`);
          }
        } catch {
          errors.push(`image_uri must be valid URL, got: "${coin.image_uri}"`);
        }
      }
    }

    if (coin.thumbnail !== undefined) {
      if (typeof coin.thumbnail !== 'string') {
        errors.push(`thumbnail must be string, got ${typeof coin.thumbnail}`);
      } else {
        try {
          const url = new URL(coin.thumbnail);
          if (!['http:', 'https:'].includes(url.protocol)) {
            errors.push(`thumbnail must use HTTP or HTTPS protocol, got: ${url.protocol}`);
          }
        } catch {
          errors.push(`thumbnail must be valid URL, got: "${coin.thumbnail}"`);
        }
      }
    }

    if (coin.creator !== undefined) {
      if (typeof coin.creator !== 'string') {
        errors.push(`creator must be string, got ${typeof coin.creator}`);
      } else {
        // Validate Solana address format
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(coin.creator)) {
          errors.push(`creator must be valid Solana address (base58, 32-44 chars), got: "${coin.creator}"`);
        }
      }
    }

    // Optional social media validation
    if (coin.twitter !== undefined && coin.twitter !== null) {
      if (typeof coin.twitter === 'string') {
        // Twitter handle validation (1-15 chars, alphanumeric + underscore)
        if (!/^[a-zA-Z0-9_]{1,15}$/.test(coin.twitter)) {
          warnings.push(`twitter handle appears invalid: "${coin.twitter}" (should be 1-15 chars, alphanumeric + underscore)`);
        }
      }
    }

    if (coin.telegram !== undefined && coin.telegram !== null) {
      if (typeof coin.telegram === 'string') {
        try {
          const url = new URL(coin.telegram);
          if (!['http:', 'https:'].includes(url.protocol)) {
            errors.push(`telegram must use HTTP or HTTPS protocol, got: ${url.protocol}`);
          }
        } catch {
          errors.push(`telegram must be valid URL, got: "${coin.telegram}"`);
        }
      }
    }

    if (coin.livestream_title !== undefined && coin.livestream_title !== null) {
      if (typeof coin.livestream_title === 'string') {
        if (coin.livestream_title.length > 200) {
          errors.push(`livestream_title exceeds maximum length of 200 characters (${coin.livestream_title.length})`);
        }
      }
    }

    // Numeric field validation with constraints
    const numericFields = [
      { name: 'created_timestamp', min: 0, max: Date.now() + 86400000 }, // Allow some future time for server clock differences
      { name: 'market_cap', min: 0 },
      { name: 'usd_market_cap', min: 0 },
      { name: 'num_participants', min: 0, max: 10000 }, // Reasonable upper bound
      { name: 'reply_count', min: 0, max: 100000 }, // Reasonable upper bound
      { name: 'last_reply', min: 0, max: Date.now() + 86400000 }
    ];

    for (const field of numericFields) {
      const value = coin[field.name];
      if (value !== undefined) {
        if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
          errors.push(`${field.name} must be finite number, got: ${value}`);
        } else {
          if (field.min !== undefined && value < field.min) {
            errors.push(`${field.name} must be >= ${field.min}, got: ${value}`);
          }
          if (field.max !== undefined && value > field.max) {
            warnings.push(`${field.name} exceeds expected maximum (${field.max}): ${value}`);
          }
        }
      }
    }

    // Boolean field validation
    if (coin.is_currently_live !== undefined && typeof coin.is_currently_live !== 'boolean') {
      errors.push(`is_currently_live must be boolean, got ${typeof coin.is_currently_live}`);
    }

    // Business logic validation
    if (coin.created_timestamp !== undefined && coin.last_reply !== undefined) {
      if (coin.last_reply < coin.created_timestamp) {
        warnings.push(`last_reply (${coin.last_reply}) is before created_timestamp (${coin.created_timestamp})`);
      }
    }

    if (coin.is_currently_live === true && coin.num_participants === 0) {
      warnings.push(`Stream marked as live but has 0 participants`);
    }

    if (coin.is_currently_live === false && coin.num_participants > 0) {
      warnings.push(`Stream marked as not live but has ${coin.num_participants} participants`);
    }

    // Log warnings if any exist
    if (warnings.length > 0) {
      this.logger.warn('Live coin validation warnings', {
        coinIndex: index,
        mint: coin.mint,
        warnings,
        coinData: this.sanitizeCoinForLogging(coin)
      });
    }

    if (errors.length > 0) {
      throw new ServerError({
        message: `Invalid live coin data at index ${index}:\n${errors.map((error, idx) => `  ${idx + 1}. ${error}`).join('\n')}`,
        statusCode: 500,
        details: {
          coinIndex: index,
          validationErrors: errors,
          validationWarnings: warnings,
          coinData: this.sanitizeCoinForLogging(coin)
        }
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
      // Only include optional fields if they exist and are valid
      ...(coin.twitter && { twitter: coin.twitter }),
      ...(coin.telegram && { telegram: coin.telegram }),
      ...(coin.livestream_title && { livestream_title: coin.livestream_title })
    };

    return validatedCoin;
  }

  /**
   * Sanitize coin data for logging (remove potentially sensitive info)
   *
   * @param coin The coin object to sanitize
   * @returns Sanitized coin object safe for logging
   */
  private sanitizeCoinForLogging(coin: any): any {
    const sanitized = { ...coin };

    // Remove or truncate potentially sensitive fields
    if (sanitized.description && sanitized.description.length > 100) {
      sanitized.description = sanitized.description.substring(0, 100) + '...';
    }

    return sanitized;
  }

  /**
   * Handle errors with comprehensive categorization and recovery guidance
   *
   * This method provides enhanced error handling specifically for API failures,
   * with additional context for live streaming data operations and recovery guidance.
   *
   * @param error The original error from HTTP client or other sources
   * @param operation The operation that failed
   * @param context Additional context for error handling
   * @returns Enhanced PumpFunError with recovery guidance
   */
  private handleError(error: any, operation: string, context?: any): PumpFunError {
    // If it's already a PumpFunError, enhance it with operation context
    if (error instanceof PumpFunError) {
      // Create a new error with enhanced details since details is read-only
      const enhancedError = new (error.constructor as any)({
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        isRetryable: error.isRetryable,
        details: {
          ...error.details,
          operation,
          context,
          timestamp: new Date().toISOString(),
          errorCategory: this.categorizeError(error, operation)
        },
        originalError: error.originalError
      });
      return enhancedError;
    }

    // Handle network-related errors
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, operation, context);
    }

    // Handle HTTP response errors
    if (error.response) {
      return this.handleHTTPError(error, operation, context);
    }

    // Handle timeout errors
    if (this.isTimeoutError(error)) {
      return this.handleTimeoutError(error, operation, context);
    }

    // Handle configuration errors
    if (this.isConfigurationError(error)) {
      return this.handleConfigurationError(error, operation, context);
    }

    // Handle API-specific validation errors
    if (this.isAPIValidationError(error)) {
      return this.handleAPIValidationError(error, operation, context);
    }

    // Handle rate limit exceeded errors (specific to API failures)
    if (this.isRateLimitExceededError(error)) {
      return this.handleRateLimitExceededError(error, operation, context);
    }

    // Default to generic error
    return ErrorFactory.createFromNetworkError(error);
  }

  /**
   * Check if error is a network-related error
   */
  private isNetworkError(error: any): boolean {
    return !error.response && (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('fetch')
    );
  }

  /**
   * Check if error is a timeout error
   */
  private isTimeoutError(error: any): boolean {
    return error.code === 'ETIMEDOUT' ||
           error.code === 'ECONNABORTED' ||
           error.message?.includes('timeout') ||
           error.type === 'REQUEST_TIMEOUT';
  }

  /**
   * Check if error is a configuration error
   */
  private isConfigurationError(error: any): boolean {
    return error.message?.includes('Configuration') ||
           error.message?.includes('Invalid baseURL') ||
           error.message?.includes('validation failed') ||
           error.code === 'CONFIGURATION_ERROR';
  }

  /**
   * Check if error is an API validation error (invalid response format)
   */
  private isAPIValidationError(error: any): boolean {
    return error.message?.includes('Invalid response') ||
           error.message?.includes('validation failed') ||
           error.message?.includes('Expected array') ||
           error.message?.includes('Missing required field') ||
           error.code === 'API_VALIDATION_ERROR' ||
           error.name === 'ValidationError';
  }

  /**
   * Check if error is a rate limit exceeded error
   */
  private isRateLimitExceededError(error: any): boolean {
    return error.response?.status === 429 ||
           error.message?.includes('rate limit') ||
           error.message?.includes('too many requests') ||
           error.code === 'RATE_LIMIT_EXCEEDED' ||
           error.code === 'TOO_MANY_REQUESTS';
  }

  /**
   * Categorize errors for better handling and reporting
   */
  private categorizeError(error: any, operation: string): string {
    // Network connectivity issues
    if (this.isNetworkError(error)) {
      return 'NETWORK_CONNECTIVITY';
    }

    // Rate limiting
    if (this.isRateLimitExceededError(error)) {
      return 'RATE_LIMIT';
    }

    // Server-side issues
    if (error.response?.status >= 500) {
      return 'SERVER_ERROR';
    }

    // Client-side issues (4xx)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return 'CLIENT_ERROR';
    }

    // Timeout issues
    if (this.isTimeoutError(error)) {
      return 'TIMEOUT';
    }

    // Configuration issues
    if (this.isConfigurationError(error)) {
      return 'CONFIGURATION';
    }

    // API validation issues
    if (this.isAPIValidationError(error)) {
      return 'API_VALIDATION';
    }

    // Operation-specific categorization
    if (operation === 'getLiveCoins') {
      return 'LIVE_STREAMING_API';
    }

    return 'UNKNOWN';
  }

  /**
   * Handle network errors with specific recovery guidance
   */
  private handleNetworkError(error: any, operation: string, context?: any): NetworkError {
    const baseNetworkError = ErrorFactory.createFromNetworkError(error);

    // Create a new network error with enhanced details
    const networkError = new NetworkError({
      message: baseNetworkError.message,
      code: baseNetworkError.code,
      statusCode: baseNetworkError.statusCode,
      details: {
        ...baseNetworkError.details,
        operation,
        context,
        baseURL: this.config.baseURL,
        timeout: this.config.timeout,
        suggestions: this.getNetworkErrorRecovery(error, operation)
      },
      originalError: error
    });

    this.logger.warn('Network error detected', {
      operation,
      errorCode: error.code,
      message: error.message,
      isRetryable: networkError.canRetry(),
      retryDelay: networkError.getRetryDelay()
    });

    return networkError;
  }

  /**
   * Handle HTTP response errors with specific recovery guidance
   */
  private handleHTTPError(error: any, operation: string, context?: any): PumpFunError {
    const { response } = error;
    const baseError = ErrorFactory.createFromResponse(
      response.status,
      response.data,
      error
    );

    // Create a new error with enhanced details
    const pumpFunError = new (baseError.constructor as any)({
      message: baseError.message,
      code: baseError.code,
      statusCode: baseError.statusCode,
      isRetryable: baseError.isRetryable,
      details: {
        ...baseError.details,
        operation,
        context,
        url: response.config?.url,
        method: response.config?.method?.toUpperCase(),
        statusCode: response.status,
        suggestions: this.getHTTPErrorRecovery(response.status, operation, response.data)
      },
      originalError: error
    });

    this.logger.warn('HTTP error detected', {
      operation,
      statusCode: response.status,
      statusText: response.statusText,
      url: response.config?.url,
      method: response.config?.method?.toUpperCase(),
      isRetryable: pumpFunError.canRetry(),
      retryDelay: pumpFunError.getRetryDelay()
    });

    return pumpFunError;
  }

  /**
   * Handle timeout errors with specific recovery guidance
   */
  private handleTimeoutError(error: any, operation: string, context?: any): TimeoutError {
    const timeoutError = new TimeoutError({
      message: this.getTimeoutErrorMessage(operation, this.config.timeout),
      timeout: this.config.timeout,
      details: {
        operation,
        context,
        currentTimeout: this.config.timeout,
        suggestions: this.getTimeoutErrorRecovery(operation)
      },
      originalError: error
    });

    this.logger.warn('Timeout error detected', {
      operation,
      timeout: this.config.timeout,
      suggestions: timeoutError.getResolution()
    });

    return timeoutError;
  }

  /**
   * Handle configuration errors with specific recovery guidance
   */
  private handleConfigurationError(error: any, operation: string, context?: any): ConfigurationError {
    const configError = new ConfigurationError({
      message: this.getConfigurationErrorMessage(error, operation),
      details: {
        operation,
        context,
        currentConfig: this.sanitizeConfigForError(),
        suggestions: this.getConfigurationErrorRecovery(error, operation)
      },
      originalError: error
    });

    this.logger.error('Configuration error detected', {
      operation,
      error: error.message,
      suggestions: configError.getResolution()
    });

    return configError;
  }

  /**
   * Handle API validation errors with specific recovery guidance
   */
  private handleAPIValidationError(error: any, operation: string, context?: any): ServerError {
    const validationError = new ServerError({
      message: this.getAPIValidationErrorMessage(error, operation),
      statusCode: 500,
      details: {
        operation,
        context,
        errorType: 'API_VALIDATION',
        suggestions: this.getAPIValidationErrorRecovery(error, operation)
      },
      originalError: error
    });

    this.logger.error('API validation error detected', {
      operation,
      error: error.message,
      suggestions: validationError.getResolution()
    });

    return validationError;
  }

  /**
   * Handle rate limit exceeded errors with specific recovery guidance
   */
  private handleRateLimitExceededError(error: any, operation: string, context?: any): RateLimitError {
    const rateLimitError = new RateLimitError({
      message: this.getRateLimitExceededErrorMessage(error, operation),
      retryAfter: this.extractRetryAfter(error),
      details: {
        operation,
        context,
        errorType: 'RATE_LIMIT_EXCEEDED',
        suggestions: this.getRateLimitExceededErrorRecovery(error, operation)
      },
      originalError: error
    });

    this.logger.warn('Rate limit exceeded detected', {
      operation,
      retryAfter: rateLimitError.retryAfter,
      suggestions: rateLimitError.getResolution()
    });

    return rateLimitError;
  }

  /**
   * Get recovery suggestions for network errors
   */
  private getNetworkErrorRecovery(error: any, operation: string): string[] {
    const suggestions = [
      'Check your internet connection is stable',
      'Verify the PumpFun API is accessible from your network',
      'Check if firewall or proxy is blocking the request'
    ];

    // Add specific suggestions based on error code
    switch (error.code) {
      case 'ECONNREFUSED':
        suggestions.push('The server refused the connection - it may be down or overloaded');
        suggestions.push('Try again in a few minutes');
        break;
      case 'ENOTFOUND':
        suggestions.push('DNS resolution failed - check the API URL configuration');
        suggestions.push('Try using a different DNS server');
        break;
      case 'ECONNRESET':
        suggestions.push('Connection was reset - the server may be restarting');
        suggestions.push('Retry with exponential backoff');
        break;
      case 'ETIMEDOUT':
        suggestions.push('Connection timed out - increase timeout configuration');
        suggestions.push('Check network latency to the server');
        break;
    }

    // Add operation-specific suggestions
    if (operation === 'validateJurisdiction') {
      suggestions.push('Ensure you are using the correct API endpoint URL');
      suggestions.push('Check if the API service is operational via status page');
    }

    return suggestions;
  }

  /**
   * Get recovery suggestions for HTTP errors
   */
  private getHTTPErrorRecovery(statusCode: number, operation: string, _responseData?: any): string[] {
    const suggestions: string[] = [];

    switch (statusCode) {
      case 400:
        suggestions.push('Check your request parameters and format');
        suggestions.push('Verify required fields are included');
        if (operation === 'validateJurisdiction') {
          suggestions.push('Ensure the jurisdiction validation endpoint is correctly formatted');
        }
        break;
      case 401:
        suggestions.push('Check your API credentials or authentication token');
        suggestions.push('Verify your authentication method is supported');
        break;
      case 403:
        suggestions.push('Check if you have permission to access this resource');
        suggestions.push('Verify your account is in good standing');
        break;
      case 404:
        suggestions.push('Verify the endpoint URL is correct');
        suggestions.push('Check if the resource you are trying to access exists');
        if (operation === 'validateJurisdiction') {
          suggestions.push('The jurisdiction validation endpoint may have changed');
        }
        break;
      case 429:
        suggestions.push('You have hit the rate limit - wait before retrying');
        suggestions.push('Implement exponential backoff for retries');
        suggestions.push('Consider reducing request frequency');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        suggestions.push('The server is experiencing issues - try again later');
        suggestions.push('Check the service status page for ongoing issues');
        suggestions.push('Implement retry logic with exponential backoff');
        break;
      default:
        suggestions.push('An unexpected HTTP error occurred');
        suggestions.push('Check the error message and status code for details');
    }

    return suggestions;
  }

  /**
   * Get recovery suggestions for timeout errors
   */
  private getTimeoutErrorRecovery(operation: string): string[] {
    const suggestions = [
      `Increase timeout configuration (current: ${this.config.timeout}ms)`,
      'Check your network connection speed and stability',
      'Try again with a smaller request if applicable',
      'Check if the server is experiencing high load'
    ];

    if (operation === 'validateJurisdiction') {
      suggestions.push('The jurisdiction validation endpoint may be slow - consider a longer timeout');
      suggestions.push('Try connecting from a different network or region');
    }

    return suggestions;
  }

  /**
   * Get recovery suggestions for configuration errors
   */
  private getConfigurationErrorRecovery(error: any, _operation: string): string[] {
    const suggestions = [
      'Check your client configuration settings',
      'Verify all required configuration values are provided',
      'Refer to the documentation for proper configuration format',
      'Use environment variables for sensitive configuration'
    ];

    if (error.message?.includes('baseURL')) {
      suggestions.push('Ensure the baseURL is a valid HTTP/HTTPS URL');
      suggestions.push('Example: https://frontend-api-v3.pump.fun');
    }

    if (error.message?.includes('timeout')) {
      suggestions.push('Ensure timeout is a positive number in milliseconds');
      suggestions.push('Recommended range: 5000ms to 30000ms');
    }

    return suggestions;
  }

  /**
   * Get appropriate error message for API validation errors
   */
  private getAPIValidationErrorMessage(error: any, operation: string): string {
    if (error.message?.includes('Invalid response')) {
      return `API response validation failed during ${operation}. The server returned data in an unexpected format.`;
    }
    if (error.message?.includes('Expected array')) {
      return `API response format error during ${operation}. Expected an array of live coins but received different data type.`;
    }
    if (error.message?.includes('Missing required field')) {
      return `API response validation error during ${operation}. Required fields are missing from the response.`;
    }
    return `API validation failed during ${operation}: ${error.message}`;
  }

  /**
   * Get recovery suggestions for API validation errors
   */
  private getAPIValidationErrorRecovery(_error: any, operation: string): string[] {
    const suggestions = [
      'The API response format has changed or is invalid',
      'Try the request again to see if the issue is temporary',
      'Check if there are any API changes or maintenance notifications',
      'Report this issue if it persists'
    ];

    if (operation === 'getLiveCoins') {
      suggestions.push('The live streaming data format may have changed');
      suggestions.push('Try with different parameters to isolate the issue');
      suggestions.push('Check if the live coins endpoint is functioning correctly');
    }

    return suggestions;
  }

  /**
   * Get appropriate error message for rate limit exceeded errors
   */
  private getRateLimitExceededErrorMessage(error: any, operation: string): string {
    const retryAfter = this.extractRetryAfter(error);
    const retryText = retryAfter ? ` Wait ${retryAfter} seconds before retrying.` : ' Wait before retrying.';
    return `Rate limit exceeded during ${operation}.${retryText} You have made too many requests to the API.`;
  }

  /**
   * Extract retry-after value from error
   */
  private extractRetryAfter(error: any): number {
    // Check response headers for Retry-After
    if (error.response?.headers?.['retry-after']) {
      const retryAfter = parseInt(error.response.headers['retry-after'], 10);
      if (!isNaN(retryAfter) && retryAfter > 0) {
        return retryAfter;
      }
    }

    // Check for retryAfter in error details
    if (error.retryAfter && typeof error.retryAfter === 'number') {
      return error.retryAfter;
    }

    // Default retry time for rate limit errors (60 seconds)
    return 60;
  }

  /**
   * Get recovery suggestions for rate limit exceeded errors
   */
  private getRateLimitExceededErrorRecovery(error: any, operation: string): string[] {
    const retryAfter = this.extractRetryAfter(error);
    const suggestions = [
      `Wait ${retryAfter} seconds before making another request`,
      'Implement exponential backoff for retries',
      'Reduce the frequency of API requests',
      'Use request batching if applicable'
    ];

    if (operation === 'getLiveCoins') {
      suggestions.push('Cache live coins data to reduce API calls');
      suggestions.push('Use pagination to fetch smaller batches');
      suggestions.push('Consider using webhooks for real-time updates instead of polling');
    }

    return suggestions;
  }

  /**
   * Get appropriate timeout error message based on operation
   */
  private getTimeoutErrorMessage(operation: string, timeout: number): string {
    return `Request timeout during ${operation} operation. The server did not respond within ${timeout}ms. This could be due to network issues or high server load.`;
  }

  /**
   * Get appropriate configuration error message
   */
  private getConfigurationErrorMessage(error: any, operation: string): string {
    if (error.message?.includes('baseURL')) {
      return `Invalid API base URL configuration for ${operation}. Please ensure the baseURL is a valid HTTP/HTTPS URL.`;
    }
    if (error.message?.includes('timeout')) {
      return `Invalid timeout configuration for ${operation}. Timeout must be a positive number in milliseconds.`;
    }
    return `Configuration error occurred during ${operation}: ${error.message}`;
  }

  /**
   * Sanitize configuration for error reporting (remove sensitive data)
   */
  private sanitizeConfigForError(): any {
    return {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      hasLoggerConfig: !!this.loggerConfig,
      hasRateLimitConfig: !!this.rateLimitConfig,
      hasRetryConfig: !!this.retryConfig
    };
  }

  /**
   * Ensure client is properly initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new ConfigurationError({
        message: 'PumpFunAPIClient is not properly initialized. Check the client configuration and try again.',
        details: {
          isInitialized: this.isInitialized,
          hasHTTPClient: !!this.httpClient,
          hasLogger: !!this.logger,
          hasRateLimiter: !!this.rateLimiter
        }
      });
    }
  }

  /**
   * Get comprehensive error diagnostics for troubleshooting
   *
   * @returns Object containing diagnostic information for error troubleshooting
   */
  public getErrorDiagnostics(): {
    client: any;
    network: any;
    configuration: any;
    suggestions: string[];
  } {
    return {
      client: {
        isInitialized: this.isInitialized,
        baseURL: this.config.baseURL,
        timeout: this.config.timeout,
        requestCount: this.state.requestCount,
        errorCount: this.state.errorCount,
        errorRate: this.getStatistics().errorRate,
        isRateLimited: this.isRateLimited(),
        rateLimitBackoffRemaining: this.getRateLimitBackoffRemaining()
      },
      network: {
        canConnect: 'Unknown - run testConnection() to verify',
        lastRequestTime: this.state.lastRequestTime,
        timeSinceLastRequest: this.state.lastRequestTime ? Date.now() - this.state.lastRequestTime : null
      },
      configuration: {
        hasCustomConfig: !!this.config.baseURL || this.config.timeout !== DEFAULT_CLIENT_CONFIG.timeout,
        hasCustomLoggerConfig: Object.keys(this.loggerConfig || {}).length > 0,
        hasCustomRateLimitConfig: Object.keys(this.rateLimitConfig || {}).length > 0,
        hasCustomRetryConfig: Object.keys(this.retryConfig || {}).length > 0,
        configSource: this.detectConfigSource()
      },
      suggestions: this.getGeneralTroubleshootingSuggestions()
    };
  }

  /**
   * Detect where configuration is coming from
   */
  private detectConfigSource(): string {
    const hasEnvVars = Object.keys(process.env).some(key =>
      key.startsWith('PUMPFUN_') || key.startsWith('TIMEOUT_') || key.startsWith('RATE_')
    );

    if (hasEnvVars) {
      return 'Environment variables detected';
    }

    return 'Default configuration';
  }

  /**
   * Get general troubleshooting suggestions
   */
  private getGeneralTroubleshootingSuggestions(): string[] {
    const suggestions = [
      'Run client.testConnection() to verify API connectivity',
      'Check client.getErrorDiagnostics() for detailed information',
      'Verify your network connection and firewall settings',
      'Ensure you are using the correct API endpoint URL',
      'Check if the PumpFun service is operational'
    ];

    if (this.state.errorCount > 0) {
      suggestions.push(`High error rate detected (${this.state.errorCount}/${this.state.requestCount}) - consider checking configuration`);
    }

    if (this.isRateLimited()) {
      suggestions.push(`Currently rate limited - wait ${Math.ceil(this.getRateLimitBackoffRemaining() / 1000)}s before retrying`);
    }

    return suggestions;
  }

  /**
   * Attempt to recover from common error conditions automatically
   *
   * @param error The error to attempt recovery from
   * @returns Promise that resolves to true if recovery was successful
   */
  public async attemptErrorRecovery(error: PumpFunError): Promise<boolean> {
    this.logger.info('Attempting automatic error recovery', {
      errorCode: error.getErrorCode(),
      isRetryable: error.canRetry(),
      retryDelay: error.getRetryDelay()
    });

    try {
      // Recovery for rate limit errors
      if (error instanceof RateLimitError) {
        return await this.recoverFromRateLimit(error);
      }

      // Recovery for network errors
      if (error instanceof NetworkError) {
        return await this.recoverFromNetworkError(error);
      }

      // Recovery for timeout errors
      if (error instanceof TimeoutError) {
        return await this.recoverFromTimeoutError(error);
      }

      // Recovery for server errors
      if (error instanceof ServerError) {
        return await this.recoverFromServerError(error);
      }

      this.logger.warn('No automatic recovery available for error type', {
        errorType: error.constructor.name
      });

      return false;

    } catch (recoveryError) {
      this.logger.error('Automatic error recovery failed', {
        originalError: error.toJSON(),
        recoveryError: ErrorUtils.formatForLogging(recoveryError)
      });
      return false;
    }
  }

  /**
   * Attempt recovery from rate limit errors
   */
  private async recoverFromRateLimit(error: RateLimitError): Promise<boolean> {
    const retryDelay = error.getRetryDelay();

    this.logger.info(`Rate limited - waiting ${retryDelay}ms before retry`, {
      retryAfter: error.retryAfter,
      calculatedDelay: retryDelay
    });

    // Wait the recommended time
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Reset rate limit state
    this.state.rateLimitInfo.backoffUntil = 0;
    this.state.rateLimitInfo.consecutiveErrors = 0;

    // Test connection to verify recovery
    return await this.testConnection();
  }

  /**
   * Attempt recovery from network errors
   */
  private async recoverFromNetworkError(error: NetworkError): Promise<boolean> {
    this.logger.info('Attempting network error recovery', {
      errorCode: error.getErrorCode(),
      retryDelay: error.getRetryDelay()
    });

    // Wait before retrying
    const retryDelay = error.getRetryDelay();
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Test connection to verify recovery
    return await this.testConnection();
  }

  /**
   * Attempt recovery from timeout errors
   */
  private async recoverFromTimeoutError(_error: TimeoutError): Promise<boolean> {
    this.logger.info('Attempting timeout error recovery', {
      currentTimeout: this.config.timeout,
      suggestedTimeout: this.config.timeout * 1.5
    });

    // Temporarily increase timeout
    const originalTimeout = this.config.timeout;
    this.config.timeout = Math.min(originalTimeout * 1.5, 60000); // Cap at 60 seconds

    try {
      // Test with increased timeout
      const result = await this.testConnection();

      // Restore original timeout if successful
      this.config.timeout = originalTimeout;

      return result;
    } catch (testError) {
      // Restore original timeout even if test failed
      this.config.timeout = originalTimeout;
      return false;
    }
  }

  /**
   * Attempt recovery from server errors
   */
  private async recoverFromServerError(error: ServerError): Promise<boolean> {
    this.logger.info('Attempting server error recovery', {
      statusCode: error.statusCode,
      retryDelay: error.getRetryDelay()
    });

    // Wait before retrying (server errors need longer delays)
    const retryDelay = Math.max(error.getRetryDelay(), 5000);
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Test connection to verify recovery
    return await this.testConnection();
  }
}
