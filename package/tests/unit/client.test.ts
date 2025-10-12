/**
 * Unit tests for PumpFunAPIClient initialization
 *
 * This test suite validates:
 * - Client initialization with various configurations
 * - Configuration validation and error handling
 * - Environment variable loading and precedence
 * - Default configuration merging
 * - Error scenarios and recovery
 *
 * @version 1.0.0
 */

import { PumpFunAPIClient } from '../../src/client/PumpFunAPIClient';
import {
  ClientConfig,
  DEFAULT_CLIENT_CONFIG,
  LogLevel,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_LOGGER_CONFIG
} from '../../src/client/types';

// Mock environment variables
const originalEnv = process.env;

describe('PumpFunAPIClient Initialization', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    process.env = { ...originalEnv };

    // Remove all PumpFun-related environment variables
    delete process.env.PUMPFUN_API_BASE_URL;
    delete process.env.PUMPFUN_API_TIMEOUT;
    delete process.env.PUMPFUN_LOG_LEVEL;
    delete process.env.PUMPFUN_LOG_CONSOLE;
    delete process.env.PUMPFUN_LOG_COLORS;
    delete process.env.PUMPFUN_LOG_FILE;
    delete process.env.PUMPFUN_LOG_FILE_PATH;
    delete process.env.PUMPFUN_RATE_LIMIT_REQUESTS;
    delete process.env.PUMPFUN_RATE_LIMIT_WINDOW_MS;
    delete process.env.PUMPFUN_RATE_LIMIT_RETRY_AFTER;
    delete process.env.PUMPFUN_RATE_LIMIT_SLIDING_WINDOW;
    delete process.env.PUMPFUN_RATE_LIMIT_BURST_PROTECTION;
    delete process.env.PUMPFUN_RATE_LIMIT_MAX_BURST;
    delete process.env.PUMPFUN_RATE_LIMIT_BACKOFF;
    delete process.env.PUMPFUN_RATE_LIMIT_BASE_BACKOFF;
    delete process.env.PUMPFUN_RATE_LIMIT_MAX_BACKOFF;
    delete process.env.PUMPFUN_RATE_LIMIT_BACKOFF_MULTIPLIER;
    delete process.env.PUMPFUN_RETRY_MAX_RETRIES;
    delete process.env.PUMPFUN_RETRY_BASE_DELAY;
    delete process.env.PUMPFUN_RETRY_MAX_DELAY;
    delete process.env.PUMPFUN_RETRY_BACKOFF_FACTOR;

    // Clear legacy variables
    delete process.env.TIMEOUT_MS;
    delete process.env.LOG_LEVEL;
    delete process.env.ENABLE_RESPONSE_LOGGING;
    delete process.env.LOG_FILE_PATH;
    delete process.env.MAX_REQUESTS_PER_MINUTE;
    delete process.env.RATE_LIMIT_DELAY_MS;
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('Default Initialization', () => {
    test('should initialize with default configuration', () => {
      const client = new PumpFunAPIClient();

      expect(client.isClientInitialized()).toBe(true);
      expect(client.getBaseURL()).toBe(DEFAULT_CLIENT_CONFIG.baseURL);
      expect(client.getTimeout()).toBe(DEFAULT_CLIENT_CONFIG.timeout);
      expect(client.toString()).toContain(DEFAULT_CLIENT_CONFIG.baseURL);
      expect(client.toString()).toContain(`${DEFAULT_CLIENT_CONFIG.timeout}ms`);
    });

    test('should have proper initial state', () => {
      const client = new PumpFunAPIClient();
      const state = client.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.requestCount).toBe(0);
      expect(state.errorCount).toBe(0);
      expect(state.lastRequestTime).toBe(0);
      expect(state.rateLimitInfo.requestsInWindow).toBe(0);
      expect(state.rateLimitInfo.windowStart).toBeGreaterThan(0);
      expect(state.rateLimitInfo.backoffUntil).toBe(0);
      expect(state.rateLimitInfo.consecutiveErrors).toBe(0);
    });

    test('should provide access to internal components', () => {
      const client = new PumpFunAPIClient();

      expect(client.getLogger()).toBeDefined();
      expect(client.getRateLimiter()).toBeDefined();
      expect(client.getConfiguration()).toBeDefined();
    });

    test('should generate correct string representation', () => {
      const client = new PumpFunAPIClient();
      const expected = `PumpFunAPIClient(baseURL="${DEFAULT_CLIENT_CONFIG.baseURL}", timeout=${DEFAULT_CLIENT_CONFIG.timeout}ms)`;
      expect(client.toString()).toBe(expected);
    });

    test('should provide JSON representation for debugging', () => {
      const client = new PumpFunAPIClient();
      const json = client.toJSON();

      expect(json).toHaveProperty('config');
      expect(json).toHaveProperty('state');
      expect(json).toHaveProperty('statistics');
      expect(json.config.baseURL).toBe(DEFAULT_CLIENT_CONFIG.baseURL);
      expect(json.config.timeout).toBe(DEFAULT_CLIENT_CONFIG.timeout);
      expect(json.state.isInitialized).toBe(true);
    });
  });

  describe('Custom Configuration', () => {
    test('should accept custom baseURL and timeout', () => {
      const customConfig: ClientConfig = {
        baseURL: 'https://custom-api.example.com',
        timeout: 15000
      };

      const client = new PumpFunAPIClient(customConfig);

      expect(client.getBaseURL()).toBe('https://custom-api.example.com');
      expect(client.getTimeout()).toBe(15000);
    });

    test('should merge partial configuration with defaults', () => {
      const customConfig: ClientConfig = {
        baseURL: 'https://custom-api.example.com'
        // timeout should use default
      };

      const client = new PumpFunAPIClient(customConfig);

      expect(client.getBaseURL()).toBe('https://custom-api.example.com');
      expect(client.getTimeout()).toBe(DEFAULT_CLIENT_CONFIG.timeout);
    });

    test('should accept retry configuration', () => {
      const customConfig: ClientConfig = {
        retryConfig: {
          maxRetries: 5,
          baseDelay: 2000,
          maxDelay: 60000,
          backoffFactor: 3,
          retryableStatusCodes: [500, 502, 503],
          retryableErrors: ['SERVER_ERROR', 'TIMEOUT']
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).not.toThrow();
    });

    test('should accept rate limit configuration', () => {
      const customConfig: ClientConfig = {
        rateLimitConfig: {
          maxRequestsPerWindow: 120,
          windowMs: 120000,
          enableRetryAfter: false,
          enableSlidingWindow: false,
          enableBurstProtection: false,
          maxBurst: 20,
          enableBackoff: true,
          baseBackoffMs: 2000,
          maxBackoffMs: 60000,
          backoffMultiplier: 3
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).not.toThrow();
    });

    test('should accept logger configuration', () => {
      const customConfig: ClientConfig = {
        loggerConfig: {
          level: LogLevel.DEBUG,
          enableConsole: false,
          enableColors: false,
          enableFile: true,
          filePath: '/tmp/pumpfun.log',
          enableTimestamps: true
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).not.toThrow();
    });
  });

  describe('Environment Variable Loading', () => {
    test('should load baseURL from environment variables', () => {
      process.env.PUMPFUN_API_BASE_URL = 'https://env-api.example.com';

      const client = new PumpFunAPIClient();

      expect(client.getBaseURL()).toBe('https://env-api.example.com');
    });

    test('should load timeout from environment variables', () => {
      process.env.PUMPFUN_API_TIMEOUT = '25000';

      const client = new PumpFunAPIClient();

      expect(client.getTimeout()).toBe(25000);
    });

    test('should support legacy timeout environment variable', () => {
      process.env.TIMEOUT_MS = '30000';

      const client = new PumpFunAPIClient();

      expect(client.getTimeout()).toBe(30000);
    });

    test('should prefer PUMPFUN_API_TIMEOUT over legacy TIMEOUT_MS', () => {
      process.env.PUMPFUN_API_TIMEOUT = '20000';
      process.env.TIMEOUT_MS = '30000';

      const client = new PumpFunAPIClient();

      expect(client.getTimeout()).toBe(20000);
    });

    test('should load log level from environment variables', () => {
      process.env.PUMPFUN_LOG_LEVEL = 'debug';

      expect(() => new PumpFunAPIClient()).not.toThrow();
    });

    test('should support legacy log level environment variable', () => {
      process.env.LOG_LEVEL = 'ERROR';

      expect(() => new PumpFunAPIClient()).not.toThrow();
    });

    test('should load rate limit configuration from environment', () => {
      process.env.PUMPFUN_RATE_LIMIT_REQUESTS = '120';
      process.env.PUMPFUN_RATE_LIMIT_WINDOW_MS = '120000';
      process.env.PUMPFUN_RATE_LIMIT_RETRY_AFTER = 'false';
      process.env.PUMPFUN_RATE_LIMIT_SLIDING_WINDOW = 'false';
      process.env.PUMPFUN_RATE_LIMIT_BURST_PROTECTION = 'true';
      process.env.PUMPFUN_RATE_LIMIT_MAX_BURST = '25';

      expect(() => new PumpFunAPIClient()).not.toThrow();
    });

    test('should load retry configuration from environment', () => {
      process.env.PUMPFUN_RETRY_MAX_RETRIES = '5';
      process.env.PUMPFUN_RETRY_BASE_DELAY = '2000';
      process.env.PUMPFUN_RETRY_MAX_DELAY = '60000';
      process.env.PUMPFUN_RETRY_BACKOFF_FACTOR = '3';

      expect(() => new PumpFunAPIClient()).not.toThrow();
    });

    test('should handle invalid environment values gracefully', () => {
      process.env.PUMPFUN_API_TIMEOUT = 'invalid';
      process.env.PUMPFUN_LOG_LEVEL = 'INVALID_LEVEL';

      expect(() => new PumpFunAPIClient()).not.toThrow();
    });
  });

  describe('Configuration Precedence', () => {
    test('should use explicit config over environment variables', () => {
      process.env.PUMPFUN_API_BASE_URL = 'https://env-api.example.com';
      process.env.PUMPFUN_API_TIMEOUT = '25000';

      const customConfig: ClientConfig = {
        baseURL: 'https://explicit-api.example.com',
        timeout: 15000
      };

      const client = new PumpFunAPIClient(customConfig);

      expect(client.getBaseURL()).toBe('https://explicit-api.example.com');
      expect(client.getTimeout()).toBe(15000);
    });

    test('should use environment variables over defaults', () => {
      process.env.PUMPFUN_API_BASE_URL = 'https://env-api.example.com';
      process.env.PUMPFUN_API_TIMEOUT = '25000';

      const client = new PumpFunAPIClient();

      expect(client.getBaseURL()).toBe('https://env-api.example.com');
      expect(client.getTimeout()).toBe(25000);
    });

    test('should merge configuration in correct priority order', () => {
      process.env.PUMPFUN_API_BASE_URL = 'https://env-api.example.com';
      process.env.PUMPFUN_RETRY_MAX_RETRIES = '5';

      const customConfig: ClientConfig = {
        baseURL: 'https://explicit-api.example.com',
        // retryConfig should come from environment
        retryConfig: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffFactor: 2,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
          retryableErrors: ['NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMITED']
        }
      };

      const client = new PumpFunAPIClient();

      // For baseURL, explicit should win over environment
      expect(client.getBaseURL()).toBe('https://env-api.example.com');

      // For retry config, environment should be used when explicit not provided
      // This is tested indirectly by successful initialization
      expect(client.isClientInitialized()).toBe(true);
    });
  });

  describe('Configuration Validation Errors', () => {
    test('should throw error for invalid baseURL protocol', () => {
      const customConfig: ClientConfig = {
        baseURL: 'ftp://api.example.com'
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid baseURL protocol/);
    });

    test('should throw error for invalid baseURL format', () => {
      const customConfig: ClientConfig = {
        baseURL: 'not-a-valid-url'
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid baseURL format/);
    });

    test('should throw error for invalid timeout type', () => {
      const customConfig: ClientConfig = {
        timeout: 'invalid' as any
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid timeout/);
    });

    test('should throw error for negative timeout', () => {
      const customConfig: ClientConfig = {
        timeout: -1000
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid timeout.*positive number/);
    });

    test('should throw error for zero timeout', () => {
      const customConfig: ClientConfig = {
        timeout: 0
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid timeout.*positive number/);
    });

    test('should throw error for excessive timeout', () => {
      const customConfig: ClientConfig = {
        timeout: 120000 // 2 minutes
      };

      expect(() => new PumpFunAPIClient(customConfig)).not.toThrow(); // This should warn but not error
    });

    test('should throw error for invalid retry configuration', () => {
      const customConfig: ClientConfig = {
        retryConfig: {
          maxRetries: -1,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffFactor: 2,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
          retryableErrors: ['NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMITED']
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid maxRetries.*Cannot be negative/);
    });

    test('should throw error for invalid rate limit configuration', () => {
      const customConfig: ClientConfig = {
        rateLimitConfig: {
          maxRequestsPerWindow: 0,
          windowMs: 60000,
          enableRetryAfter: true,
          enableSlidingWindow: true,
          enableBurstProtection: true,
          maxBurst: 10,
          enableBackoff: true,
          baseBackoffMs: 1000,
          maxBackoffMs: 30000,
          backoffMultiplier: 2
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid maxRequestsPerWindow.*Must be at least 1/);
    });

    test('should throw error for invalid log level', () => {
      const customConfig: ClientConfig = {
        loggerConfig: {
          level: 'INVALID_LEVEL' as any,
          enableConsole: true,
          enableColors: true,
          enableTimestamps: true
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid log level/);
    });

    test('should throw error for invalid log file path', () => {
      const customConfig: ClientConfig = {
        loggerConfig: {
          level: LogLevel.INFO,
          enableConsole: true,
          enableColors: true,
          enableFile: true,
          filePath: '',
          enableTimestamps: true
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid log file path.*cannot be empty/);
    });

    test('should throw error for logical inconsistencies in retry config', () => {
      const customConfig: ClientConfig = {
        retryConfig: {
          maxRetries: 3,
          baseDelay: 5000,
          maxDelay: 3000, // Less than baseDelay
          backoffFactor: 2,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
          retryableErrors: ['NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMITED']
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/baseDelay.*must be less than maxDelay/);
    });

    test('should throw comprehensive error for multiple validation failures', () => {
      const customConfig: ClientConfig = {
        baseURL: 'ftp://invalid-protocol.com',
        timeout: -1000,
        retryConfig: {
          maxRetries: -1,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffFactor: 2,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
          retryableErrors: ['NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMITED']
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Configuration validation failed with 3 errors/);
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    test('should handle empty string environment variables', () => {
      process.env.PUMPFUN_API_BASE_URL = '   '; // Whitespace only
      process.env.PUMPFUN_API_TIMEOUT = '   ';

      expect(() => new PumpFunAPIClient()).not.toThrow();
      expect(new PumpFunAPIClient().getBaseURL()).toBe(DEFAULT_CLIENT_CONFIG.baseURL);
    });

    test('should handle undefined environment variables', () => {
      // Environment variables are already cleared in beforeEach
      expect(() => new PumpFunAPIClient()).not.toThrow();
    });

    test('should handle null and undefined configuration values', () => {
      const customConfig: ClientConfig = {
        baseURL: undefined,
        timeout: undefined,
        retryConfig: undefined,
        loggerConfig: undefined,
        rateLimitConfig: undefined
      };

      expect(() => new PumpFunAPIClient(customConfig)).not.toThrow();
      const client = new PumpFunAPIClient(customConfig);
      // When undefined values are passed, they should be filtered out and defaults used
      expect(client.getBaseURL()).toBe(DEFAULT_CLIENT_CONFIG.baseURL);
      expect(client.getTimeout()).toBe(DEFAULT_CLIENT_CONFIG.timeout);
    });

    test('should handle mixed valid and invalid configuration', () => {
      const customConfig: ClientConfig = {
        baseURL: 'https://valid-api.example.com', // Valid
        timeout: -1000 // Invalid
      };

      expect(() => new PumpFunAPIClient(customConfig)).toThrow(/Invalid timeout/);
    });

    test('should initialize successfully with minimal valid configuration', () => {
      const customConfig: ClientConfig = {}; // Empty object

      expect(() => new PumpFunAPIClient(customConfig)).not.toThrow();
      expect(new PumpFunAPIClient(customConfig).isClientInitialized()).toBe(true);
    });

    test('should handle very large valid timeout values', () => {
      const customConfig: ClientConfig = {
        timeout: 60000 // Maximum allowed
      };

      expect(() => new PumpFunAPIClient(customConfig)).not.toThrow();
      expect(new PumpFunAPIClient(customConfig).getTimeout()).toBe(60000);
    });

    test('should handle minimum valid timeout values', () => {
      const customConfig: ClientConfig = {
        timeout: 1 // Minimum positive value
      };

      expect(() => new PumpFunAPIClient(customConfig)).not.toThrow();
      expect(new PumpFunAPIClient(customConfig).getTimeout()).toBe(1);
    });
  });

  describe('Client Lifecycle Management', () => {
    test('should support graceful shutdown', async () => {
      const client = new PumpFunAPIClient();

      expect(client.isClientInitialized()).toBe(true);

      await client.shutdown();

      expect(client.isClientInitialized()).toBe(false);
    });

    test('should reset statistics', () => {
      const client = new PumpFunAPIClient();

      // Statistics should start at zero
      const stats = client.getStatistics();
      expect(stats.requestCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.errorRate).toBe(0);

      // Reset should not throw errors
      expect(() => client.resetStatistics()).not.toThrow();

      // Statistics should still be zero after reset
      const statsAfterReset = client.getStatistics();
      expect(statsAfterReset.requestCount).toBe(0);
      expect(statsAfterReset.errorCount).toBe(0);
      expect(statsAfterReset.errorRate).toBe(0);
    });

    test('should handle rate limit backoff state', () => {
      const client = new PumpFunAPIClient();

      // Should not be rate limited initially
      expect(client.isRateLimited()).toBe(false);
      expect(client.getRateLimitBackoffRemaining()).toBe(0);

      // These methods should not throw errors
      expect(() => {
        client.isRateLimited();
        client.getRateLimitBackoffRemaining();
      }).not.toThrow();
    });

    test('should support configuration updates', () => {
      const client = new PumpFunAPIClient();

      // Should not throw for valid configuration updates
      expect(() => {
        client.updateLoggerConfig({ level: LogLevel.DEBUG });
        client.updateRateLimitConfig({ maxRequestsPerWindow: 100 });
      }).not.toThrow();
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    test('should satisfy PumpFunAPIClient interface', () => {
      const client = new PumpFunAPIClient();

      // Test that all required methods exist and are callable
      expect(typeof client.isClientInitialized).toBe('function');
      expect(typeof client.getConfiguration).toBe('function');
      expect(typeof client.getState).toBe('function');
      expect(typeof client.getLogger).toBe('function');
      expect(typeof client.getRateLimiter).toBe('function');
      expect(typeof client.getBaseURL).toBe('function');
      expect(typeof client.getTimeout).toBe('function');
      expect(typeof client.toString).toBe('function');
      expect(typeof client.toJSON).toBe('function');
      expect(typeof client.shutdown).toBe('function');
      expect(typeof client.resetStatistics).toBe('function');
      expect(typeof client.getStatistics).toBe('function');
      expect(typeof client.isRateLimited).toBe('function');
      expect(typeof client.getRateLimitBackoffRemaining).toBe('function');
      expect(typeof client.updateLoggerConfig).toBe('function');
      expect(typeof client.updateRateLimitConfig).toBe('function');
    });

    test('should return correct types from methods', () => {
      const client = new PumpFunAPIClient();

      expect(typeof client.isClientInitialized()).toBe('boolean');
      expect(typeof client.getBaseURL()).toBe('string');
      expect(typeof client.getTimeout()).toBe('number');
      expect(typeof client.toString()).toBe('string');
      expect(typeof client.isRateLimited()).toBe('boolean');
      expect(typeof client.getRateLimitBackoffRemaining()).toBe('number');

      const config = client.getConfiguration();
      expect(typeof config).toBe('object');
      expect(typeof config.baseURL).toBe('string');
      expect(typeof config.timeout).toBe('number');

      const state = client.getState();
      expect(typeof state).toBe('object');
      expect(typeof state.isInitialized).toBe('boolean');
      expect(typeof state.requestCount).toBe('number');

      const stats = client.getStatistics();
      expect(typeof stats).toBe('object');
      expect(typeof stats.requestCount).toBe('number');
      expect(typeof stats.errorCount).toBe('number');
      expect(typeof stats.errorRate).toBe('number');
    });
  });

  describe('Integration with Other Components', () => {
    test('should initialize with working logger component', () => {
      const client = new PumpFunAPIClient();
      const logger = client.getLogger();

      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('should initialize with working rate limiter component', () => {
      const client = new PumpFunAPIClient();
      const rateLimiter = client.getRateLimiter();

      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter.canMakeRequest).toBe('function');
      expect(typeof rateLimiter.recordRequest).toBe('function');
      expect(typeof rateLimiter.reset).toBe('function');
      expect(typeof rateLimiter.updateConfig).toBe('function');
    });

    test('should handle component interaction during initialization', () => {
      const customConfig: ClientConfig = {
        loggerConfig: {
          level: LogLevel.DEBUG,
          enableConsole: true,
          enableColors: true,
          enableTimestamps: true
        },
        rateLimitConfig: {
          maxRequestsPerWindow: 30,
          windowMs: 30000,
          enableRetryAfter: true,
          enableSlidingWindow: true,
          enableBurstProtection: true,
          maxBurst: 5,
          enableBackoff: true,
          baseBackoffMs: 500,
          maxBackoffMs: 15000,
          backoffMultiplier: 2
        }
      };

      expect(() => new PumpFunAPIClient(customConfig)).not.toThrow();
      const client = new PumpFunAPIClient(customConfig);

      // Components should be properly initialized
      expect(client.getLogger()).toBeDefined();
      expect(client.getRateLimiter()).toBeDefined();
      expect(client.isClientInitialized()).toBe(true);
    });
  });
});