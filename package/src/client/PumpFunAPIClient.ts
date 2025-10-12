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
}
