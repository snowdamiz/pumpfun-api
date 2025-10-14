/**
 * Configuration Manager for PumpFun API Client
 *
 * This class handles all configuration loading, validation, and management
 * for the PumpFun API client, supporting environment variables and validation.
 */

import {
  ClientConfig,
  ValidatedConfig,
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_LOGGER_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_RETRY_CONFIG,
  LogLevel,
  NUMERIC_CONSTANTS,
} from '../../types';
import { ConfigurationError } from '../error-handling/errors';
import { Logger } from '../logging/logger';

/**
 * Configuration manager for PumpFun API client
 */
export class ConfigurationManager {
  private config!: ValidatedConfig;
  private logger?: Logger;

  private static readonly MAX_BACKOFF_MULTIPLIER = 5;
  private static readonly DEFAULT_MAX_RETRIES = 10;
  private static readonly MIN_BASE_DELAY = 100;
  private static readonly MIN_MAX_DELAY = 1000;
  private static readonly MIN_RATE_LIMIT_REQUESTS = 1;
  private static readonly MAX_RATE_LIMIT_REQUESTS = 1000;
  private static readonly MIN_RATE_LIMIT_WINDOW = 1000;
  private static readonly MIN_BURST = 1;

  /**
   * Initialize configuration with environment variable support
   */
  initializeConfig(inputConfig?: ClientConfig): ValidatedConfig {
    // Load configuration from environment variables first
    const envConfig = this.loadEnvironmentConfig();

    // Filter out undefined values from config
    const filteredConfig = inputConfig
      ? Object.fromEntries(Object.entries(inputConfig).filter(([_, value]) => value !== undefined))
      : {};

    // Merge configuration: defaults < explicit config < environment variables (for deployment overrides)
    const mergedConfig = {
      ...DEFAULT_CLIENT_CONFIG,
      ...filteredConfig,
      ...envConfig,
    };

    this.validateConfig(mergedConfig);

    this.config = {
      baseURL: mergedConfig.baseURL,
      livestreamURL: mergedConfig.livestreamURL,
      timeout: mergedConfig.timeout,
      wsURL: mergedConfig.wsURL,
      apiKey: mergedConfig.apiKey,
      authToken: mergedConfig.authToken,
      loggerConfig: {
        ...DEFAULT_LOGGER_CONFIG,
        ...inputConfig?.loggerConfig,
        ...envConfig.loggerConfig,
      },
      rateLimitConfig: {
        ...DEFAULT_RATE_LIMIT_CONFIG,
        ...inputConfig?.rateLimitConfig,
        ...envConfig.rateLimitConfig,
      },
      retryConfig: {
        ...DEFAULT_RETRY_CONFIG,
        ...inputConfig?.retryConfig,
        ...envConfig.retryConfig,
      },
    };

    // Create a temporary logger for this method if not yet initialized
    if (!this.logger) {
      this.logger = new Logger(this.config.loggerConfig);
    }

    this.logger.info('Client configuration initialized', {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      wsURL: this.config.wsURL,
      hasApiKey: !!this.config.apiKey,
      hasAuthToken: !!this.config.authToken,
      sources: {
        environment: !!envConfig.baseURL || !!envConfig.timeout,
        explicit: !!inputConfig?.baseURL || !!inputConfig?.timeout,
      },
    });

    return this.config;
  }

  /**
   * Load configuration from environment variables
   */
  private loadEnvironmentConfig(): Partial<ClientConfig> {
    const envConfig: Partial<ClientConfig> = {};

    // Basic configuration
    if (process.env.PUMPFUN_API_BASE_URL) {
      const baseURL = process.env.PUMPFUN_API_BASE_URL.trim();
      if (baseURL) {
        envConfig.baseURL = baseURL;
      }
    }

    if (process.env.PUMPFUN_LIVESTREAM_API_URL) {
      const livestreamURL = process.env.PUMPFUN_LIVESTREAM_API_URL.trim();
      if (livestreamURL) {
        envConfig.livestreamURL = livestreamURL;
      }
    }

    if (process.env.PUMPFUN_API_WS_URL) {
      const wsURL = process.env.PUMPFUN_API_WS_URL.trim();
      if (wsURL) {
        envConfig.wsURL = wsURL;
      }
    }

    // API credentials
    if (process.env.PUMPFUN_API_KEY) {
      const apiKey = process.env.PUMPFUN_API_KEY.trim();
      if (apiKey) {
        envConfig.apiKey = apiKey;
      }
    }

    if (process.env.PUMPFUN_API_AUTH_TOKEN) {
      const authToken = process.env.PUMPFUN_API_AUTH_TOKEN.trim();
      if (authToken) {
        envConfig.authToken = authToken;
      }
    }

    // Timeout configuration (with legacy support)
    if (process.env.PUMPFUN_API_TIMEOUT) {
      const timeout = parseInt(process.env.PUMPFUN_API_TIMEOUT, 10);
      if (!isNaN(timeout) && timeout > 0) {
        envConfig.timeout = timeout;
      }
    } else if (process.env.TIMEOUT_MS) {
      // Legacy support
      const timeout = parseInt(process.env.TIMEOUT_MS, 10);
      if (!isNaN(timeout) && timeout > 0) {
        envConfig.timeout = timeout;
      }
    }

    // Logger configuration
    const loggerConfig: Partial<import('../../types').LoggerConfig> = {};
    if (process.env.PUMPFUN_LOG_LEVEL) {
      const level = process.env.PUMPFUN_LOG_LEVEL.trim().toUpperCase() as LogLevel;
      if (Object.values(LogLevel).includes(level)) {
        loggerConfig.level = level;
      }
    } else if (process.env.LOG_LEVEL) {
      // Legacy support
      const level = process.env.LOG_LEVEL.trim().toUpperCase() as LogLevel;
      if (Object.values(LogLevel).includes(level)) {
        loggerConfig.level = level;
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
      // Legacy support
      loggerConfig.enableFile = process.env.ENABLE_RESPONSE_LOGGING === 'true';
    }
    if (process.env.PUMPFUN_LOG_FILE_PATH) {
      loggerConfig.filePath = process.env.PUMPFUN_LOG_FILE_PATH;
    } else if (process.env.LOG_FILE_PATH) {
      // Legacy support
      loggerConfig.filePath = process.env.LOG_FILE_PATH;
    }
    if (Object.keys(loggerConfig).length > 0) {
      envConfig.loggerConfig = loggerConfig;
    }

    // Rate limit configuration
    const rateLimitConfig: Partial<import('../../types').RateLimitConfig> = {};
    if (process.env.PUMPFUN_RATE_LIMIT_REQUESTS) {
      const requests = parseInt(process.env.PUMPFUN_RATE_LIMIT_REQUESTS, 10);
      if (!isNaN(requests) && requests > 0) {
        rateLimitConfig.maxRequestsPerWindow = requests;
      }
    } else if (process.env.PUMPFUN_RATE_LIMIT) {
      // Legacy support
      const requests = parseInt(process.env.PUMPFUN_RATE_LIMIT, 10);
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
      rateLimitConfig.enableSlidingWindow =
        process.env.PUMPFUN_RATE_LIMIT_SLIDING_WINDOW === 'true';
    }
    if (process.env.PUMPFUN_RATE_LIMIT_BURST_PROTECTION !== undefined) {
      rateLimitConfig.enableBurstProtection =
        process.env.PUMPFUN_RATE_LIMIT_BURST_PROTECTION === 'true';
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

    // Retry configuration
    const retryConfig: Partial<import('../../types').RetryConfig> = {};
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
    } else if (process.env.RETRY_BASE_DELAY) {
      // Legacy support
      const baseDelay = parseInt(process.env.RETRY_BASE_DELAY, 10);
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
   * Validate configuration parameters
   */
  private validateConfig(config: Partial<ClientConfig>): void {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic configuration validation
    if (config.baseURL !== undefined) {
      try {
        new URL(config.baseURL);
        if (!config.baseURL.startsWith('http://') && !config.baseURL.startsWith('https://')) {
          errors.push('Invalid baseURL protocol: must start with http:// or https://');
        }
      } catch {
        errors.push(`Invalid baseURL format: ${config.baseURL}`);
      }
    }

    if (config.livestreamURL !== undefined) {
      try {
        new URL(config.livestreamURL);
        if (!config.livestreamURL.startsWith('http://') && !config.livestreamURL.startsWith('https://')) {
          errors.push('Invalid livestreamURL protocol: must start with http:// or https://');
        }
      } catch {
        errors.push(`Invalid livestreamURL format: ${config.livestreamURL}`);
      }
    }

    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number' || isNaN(config.timeout)) {
        errors.push(`Invalid timeout: ${config.timeout}. Must be a valid number.`);
      } else if (config.timeout <= 0) {
        errors.push(`Invalid timeout: ${config.timeout}. Must be a positive number.`);
      } else if (config.timeout > NUMERIC_CONSTANTS.MAX_TIMEOUT) {
        warnings.push(
          `Timeout ${config.timeout}ms is very high. Consider using a lower value for better responsiveness.`
        );
      }
    }

    if (config.wsURL !== undefined) {
      try {
        new URL(config.wsURL);
        if (!config.wsURL.startsWith('ws://') && !config.wsURL.startsWith('wss://')) {
          errors.push('wsURL must start with ws:// or wss://');
        }
      } catch {
        errors.push(`Invalid wsURL format: ${config.wsURL}`);
      }
    }

    // Retry configuration validation
    if (config.retryConfig) {
      const retryConfig = config.retryConfig;

      if (retryConfig.maxRetries !== undefined) {
        if (typeof retryConfig.maxRetries !== 'number' || isNaN(retryConfig.maxRetries)) {
          errors.push(`Invalid maxRetries: ${retryConfig.maxRetries}. Must be a valid number.`);
        } else if (retryConfig.maxRetries < 0) {
          errors.push(`Invalid maxRetries: ${retryConfig.maxRetries}. Cannot be negative.`);
        } else if (retryConfig.maxRetries > ConfigurationManager.DEFAULT_MAX_RETRIES) {
          errors.push(
            `Invalid maxRetries: ${retryConfig.maxRetries}. Maximum allowed is ${ConfigurationManager.DEFAULT_MAX_RETRIES} to prevent excessive retries.`
          );
        }
      }

      if (retryConfig.baseDelay !== undefined) {
        if (typeof retryConfig.baseDelay !== 'number' || isNaN(retryConfig.baseDelay)) {
          errors.push(`Invalid baseDelay: ${retryConfig.baseDelay}. Must be a valid number.`);
        } else if (retryConfig.baseDelay < ConfigurationManager.MIN_BASE_DELAY) {
          errors.push(
            `Invalid baseDelay: ${retryConfig.baseDelay}ms. Minimum is ${ConfigurationManager.MIN_BASE_DELAY}ms to prevent spam.`
          );
        } else if (retryConfig.baseDelay > NUMERIC_CONSTANTS.MAX_BASE_DELAY) {
          errors.push(
            `Invalid baseDelay: ${retryConfig.baseDelay}ms. Maximum is 10000ms (10 seconds).`
          );
        }
      }

      if (retryConfig.maxDelay !== undefined) {
        if (typeof retryConfig.maxDelay !== 'number' || isNaN(retryConfig.maxDelay)) {
          errors.push(`Invalid maxDelay: ${retryConfig.maxDelay}. Must be a valid number.`);
        } else if (retryConfig.maxDelay < ConfigurationManager.MIN_MAX_DELAY) {
          errors.push(
            `Invalid maxDelay: ${retryConfig.maxDelay}ms. Minimum is ${ConfigurationManager.MIN_MAX_DELAY}ms (1 second).`
          );
        } else if (retryConfig.maxDelay > NUMERIC_CONSTANTS.MAX_MAX_DELAY) {
          errors.push(
            `Invalid maxDelay: ${retryConfig.maxDelay}ms. Maximum is ${NUMERIC_CONSTANTS.MAX_MAX_DELAY}ms (5 minutes).`
          );
        }
      }

      if (retryConfig.backoffFactor !== undefined) {
        if (typeof retryConfig.backoffFactor !== 'number' || isNaN(retryConfig.backoffFactor)) {
          errors.push(
            `Invalid backoffFactor: ${retryConfig.backoffFactor}. Must be a valid number.`
          );
        } else if (retryConfig.backoffFactor < 1) {
          errors.push(`Invalid backoffFactor: ${retryConfig.backoffFactor}. Must be at least 1.0.`);
        } else if (retryConfig.backoffFactor > NUMERIC_CONSTANTS.MAX_BACKOFF_FACTOR) {
          errors.push(
            `Invalid backoffFactor: ${retryConfig.backoffFactor}. Maximum is ${NUMERIC_CONSTANTS.MAX_BACKOFF_FACTOR}.0 to prevent excessive delays.`
          );
        }
      }

      // Logical consistency checks for retry config
      if (
        retryConfig.baseDelay &&
        retryConfig.maxDelay &&
        retryConfig.baseDelay >= retryConfig.maxDelay
      ) {
        errors.push(
          `baseDelay (${retryConfig.baseDelay}ms) must be less than maxDelay (${retryConfig.maxDelay}ms).`
        );
      }
    }

    // Rate limit configuration validation
    if (config.rateLimitConfig) {
      const rateLimitConfig = config.rateLimitConfig;

      if (rateLimitConfig.maxRequestsPerWindow !== undefined) {
        if (
          typeof rateLimitConfig.maxRequestsPerWindow !== 'number' ||
          isNaN(rateLimitConfig.maxRequestsPerWindow)
        ) {
          errors.push(
            `Invalid maxRequestsPerWindow: ${rateLimitConfig.maxRequestsPerWindow}. Must be a valid number.`
          );
        } else if (
          rateLimitConfig.maxRequestsPerWindow < ConfigurationManager.MIN_RATE_LIMIT_REQUESTS
        ) {
          errors.push(
            `Invalid maxRequestsPerWindow: ${rateLimitConfig.maxRequestsPerWindow}. Must be at least ${ConfigurationManager.MIN_RATE_LIMIT_REQUESTS}.`
          );
        } else if (
          rateLimitConfig.maxRequestsPerWindow > ConfigurationManager.MAX_RATE_LIMIT_REQUESTS
        ) {
          errors.push(
            `Invalid maxRequestsPerWindow: ${rateLimitConfig.maxRequestsPerWindow}. Maximum is ${ConfigurationManager.MAX_RATE_LIMIT_REQUESTS} to prevent server overload.`
          );
        }
      }

      if (rateLimitConfig.windowMs !== undefined) {
        if (typeof rateLimitConfig.windowMs !== 'number' || isNaN(rateLimitConfig.windowMs)) {
          errors.push(`Invalid windowMs: ${rateLimitConfig.windowMs}. Must be a valid number.`);
        } else if (rateLimitConfig.windowMs < ConfigurationManager.MIN_RATE_LIMIT_WINDOW) {
          errors.push(
            `Invalid windowMs: ${rateLimitConfig.windowMs}ms. Minimum is ${ConfigurationManager.MIN_RATE_LIMIT_WINDOW}ms (1 second).`
          );
        } else if (rateLimitConfig.windowMs > NUMERIC_CONSTANTS.MAX_RATE_LIMIT_WINDOW_MS) {
          errors.push(
            `Invalid windowMs: ${rateLimitConfig.windowMs}ms. Maximum is ${NUMERIC_CONSTANTS.MAX_RATE_LIMIT_WINDOW_MS}ms (1 hour).`
          );
        }
      }

      if (rateLimitConfig.maxBurst !== undefined) {
        if (typeof rateLimitConfig.maxBurst !== 'number' || isNaN(rateLimitConfig.maxBurst)) {
          errors.push(`Invalid maxBurst: ${rateLimitConfig.maxBurst}. Must be a valid number.`);
        } else if (rateLimitConfig.maxBurst < ConfigurationManager.MIN_BURST) {
          errors.push(
            `Invalid maxBurst: ${rateLimitConfig.maxBurst}. Must be at least ${ConfigurationManager.MIN_BURST}.`
          );
        }
      }

      if (rateLimitConfig.baseBackoffMs !== undefined) {
        if (
          typeof rateLimitConfig.baseBackoffMs !== 'number' ||
          isNaN(rateLimitConfig.baseBackoffMs)
        ) {
          errors.push(
            `Invalid baseBackoffMs: ${rateLimitConfig.baseBackoffMs}. Must be a valid number.`
          );
        } else if (rateLimitConfig.baseBackoffMs < 100) {
          errors.push(
            `Invalid baseBackoffMs: ${rateLimitConfig.baseBackoffMs}ms. Minimum is 100ms.`
          );
        } else if (rateLimitConfig.baseBackoffMs > NUMERIC_CONSTANTS.MAX_BASE_DELAY) {
          errors.push(
            `Invalid baseBackoffMs: ${rateLimitConfig.baseBackoffMs}ms. Maximum is 10000ms (10 seconds).`
          );
        }
      }

      if (rateLimitConfig.maxBackoffMs !== undefined) {
        if (
          typeof rateLimitConfig.maxBackoffMs !== 'number' ||
          isNaN(rateLimitConfig.maxBackoffMs)
        ) {
          errors.push(
            `Invalid maxBackoffMs: ${rateLimitConfig.maxBackoffMs}. Must be a valid number.`
          );
        } else if (rateLimitConfig.maxBackoffMs < 1000) {
          errors.push(
            `Invalid maxBackoffMs: ${rateLimitConfig.maxBackoffMs}ms. Minimum is 1000ms (1 second).`
          );
        } else if (rateLimitConfig.maxBackoffMs > NUMERIC_CONSTANTS.MAX_MAX_DELAY) {
          errors.push(
            `Invalid maxBackoffMs: ${rateLimitConfig.maxBackoffMs}ms. Maximum is ${NUMERIC_CONSTANTS.MAX_MAX_DELAY}ms (5 minutes).`
          );
        }
      }

      if (rateLimitConfig.backoffMultiplier !== undefined) {
        if (
          typeof rateLimitConfig.backoffMultiplier !== 'number' ||
          isNaN(rateLimitConfig.backoffMultiplier)
        ) {
          errors.push(
            `Invalid backoffMultiplier: ${rateLimitConfig.backoffMultiplier}. Must be a valid number.`
          );
        } else if (rateLimitConfig.backoffMultiplier < 1) {
          errors.push(
            `Invalid backoffMultiplier: ${rateLimitConfig.backoffMultiplier}. Must be at least 1.0.`
          );
        } else if (
          rateLimitConfig.backoffMultiplier > ConfigurationManager.MAX_BACKOFF_MULTIPLIER
        ) {
          errors.push(
            `Invalid backoffMultiplier: ${rateLimitConfig.backoffMultiplier}. Maximum is ${ConfigurationManager.MAX_BACKOFF_MULTIPLIER}.0.`
          );
        }
      }

      // Logical consistency checks for rate limit config
      if (
        rateLimitConfig.baseBackoffMs &&
        rateLimitConfig.maxBackoffMs &&
        rateLimitConfig.baseBackoffMs >= rateLimitConfig.maxBackoffMs
      ) {
        errors.push(
          `baseBackoffMs (${rateLimitConfig.baseBackoffMs}ms) must be less than maxBackoffMs (${rateLimitConfig.maxBackoffMs}ms).`
        );
      }
    }

    // Logger configuration validation
    if (config.loggerConfig) {
      const loggerConfig = config.loggerConfig;

      if (loggerConfig.level && !Object.values(LogLevel).includes(loggerConfig.level)) {
        errors.push(
          `Invalid log level: "${loggerConfig.level}". Must be one of: ${Object.values(LogLevel).join(', ')}.`
        );
      }

      if (loggerConfig.filePath !== undefined) {
        if (typeof loggerConfig.filePath !== 'string') {
          errors.push(
            `Invalid log file path: must be a string, got ${typeof loggerConfig.filePath}.`
          );
        } else if (loggerConfig.filePath.trim() === '') {
          errors.push(`Invalid log file path: cannot be empty string.`);
        }
      }
    }

    // Log warnings if we have a logger
    if (this.logger && warnings.length > 0) {
      const logger = this.logger;
      warnings.forEach(warning => logger.warn(`Configuration warning: ${warning}`));
    }

    // Throw errors if any
    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:\n${errors.map((error, index) => `  ${index + 1}. ${error}`).join('\n')}\n\nPlease fix these errors and try again. Refer to the documentation for valid configuration options.`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): ValidatedConfig {
    if (!this.config) {
      throw new ConfigurationError({
        message: 'Configuration not initialized. Call initializeConfig() first.',
      });
    }
    return this.config;
  }

  /**
   * Update logger configuration
   */
  updateLoggerConfig(config: Partial<typeof DEFAULT_LOGGER_CONFIG>, logger: Logger): void {
    this.config.loggerConfig = {
      ...this.config.loggerConfig,
      ...config,
    };
    logger.updateConfig(config);
    logger.info('Logger configuration updated', config);
  }

  /**
   * Update rate limit configuration
   */
  updateRateLimitConfig(config: Partial<typeof DEFAULT_RATE_LIMIT_CONFIG>, logger: Logger): void {
    this.config.rateLimitConfig = {
      ...this.config.rateLimitConfig,
      ...config,
    };
    logger.info('Rate limit configuration updated', config);
  }

  /**
   * Detect configuration source for debugging
   */
  detectConfigSource(): string {
    const hasEnvVars = Object.keys(process.env).some(
      key =>
        key.startsWith('PUMPFUN_') ||
        key === 'TIMEOUT_MS' ||
        key === 'LOG_LEVEL' ||
        key === 'ENABLE_RESPONSE_LOGGING' ||
        key === 'LOG_FILE_PATH' ||
        key === 'RETRY_BASE_DELAY' ||
        key === 'PUMPFUN_RATE_LIMIT'
    );

    if (hasEnvVars) {
      return 'Environment variables detected';
    }
    return 'Default configuration';
  }
}
