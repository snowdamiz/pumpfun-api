import {
  ClientConfig,
  ValidatedConfig,
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_CLIENT_CONFIG_EXPOSED,
  DEFAULT_LOGGER_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_RETRY_CONFIG,
  LogLevel,
  NUMERIC_CONSTANTS,
} from '../../types';
import { ConfigurationError } from '../error-handling/errors';
import { Logger } from '../logging/logger';

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

  initializeConfig(inputConfig?: ClientConfig): ValidatedConfig {
    // Filter out undefined values from config
    const filteredConfig = inputConfig
      ? Object.fromEntries(Object.entries(inputConfig).filter(([_, value]) => value !== undefined))
      : {};

    // Merge configuration: defaults < explicit config
    const mergedConfig = {
      ...DEFAULT_CLIENT_CONFIG_EXPOSED,
      ...filteredConfig,
    };

    this.validateConfig(mergedConfig);

    this.config = {
      baseURL: DEFAULT_CLIENT_CONFIG.baseURL,
      livestreamURL: DEFAULT_CLIENT_CONFIG.livestreamURL,
      timeout: mergedConfig.timeout,
      wsURL: DEFAULT_CLIENT_CONFIG.wsURL,
      loggerConfig: {
        ...DEFAULT_LOGGER_CONFIG,
        ...inputConfig?.loggerConfig,
      },
      rateLimitConfig: {
        ...DEFAULT_RATE_LIMIT_CONFIG,
        ...inputConfig?.rateLimitConfig,
      },
      retryConfig: {
        ...DEFAULT_RETRY_CONFIG,
        ...inputConfig?.retryConfig,
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
      sources: {
        explicit: !!inputConfig?.timeout,
      },
    });

    return this.config;
  }

  private validateConfig(config: Partial<ClientConfig>): void {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic configuration validation - only timeout is configurable

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

  getConfig(): ValidatedConfig {
    if (!this.config) {
      throw new ConfigurationError({
        message: 'Configuration not initialized. Call initializeConfig() first.',
      });
    }
    return this.config;
  }

  detectConfigSource(): string {
    return 'Default configuration';
  }
}
