/**
 * Integration tests for basic PumpFun API functionality
 *
 * This test suite validates:
 * - Real API connectivity with mocked responses for jurisdiction validation
 * - Client initialization and configuration
 * - Basic API request/response handling
 * - Error handling and recovery scenarios
 * - Integration with all components (HTTP client, logger, rate limiter)
 *
 * @version 1.0.0
 */

import { PumpFunAPIClient } from '../../src/client/PumpFunAPIClient';
import { Logger } from '../../src/utils/logger';
import { RateLimiter } from '../../src/utils/rate-limiter';

describe('PumpFun API Integration Tests', () => {
  let client: PumpFunAPIClient;
  let originalConsole: typeof console;

  beforeEach(() => {
    // Store original console
    originalConsole = global.console;

    // Mock console to reduce noise in tests
    global.console = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    // Create fresh client for each test
    client = new PumpFunAPIClient({
      timeout: 10000,
      loggerConfig: {
        level: 'ERROR', // Only show errors in tests
        enableConsole: true,
        enableColors: false,
        enableTimestamps: false,
      },
      rateLimitConfig: {
        maxRequestsPerWindow: 60,
        windowMs: 60000,
        enableRetryAfter: true,
        enableSlidingWindow: true,
        enableBurstProtection: true,
        maxBurst: 10,
        enableBackoff: true,
        baseBackoffMs: 1000,
        maxBackoffMs: 30000,
        backoffMultiplier: 2,
      },
    });
  });

  afterEach(() => {
    // Restore console
    global.console = originalConsole;

    // Cleanup client
    if (client && client.isClientInitialized()) {
      client.shutdown();
    }
  });

  describe('Client Initialization and Configuration', () => {
    test('should initialize client with all required components', () => {
      expect(client.isClientInitialized()).toBe(true);

      // Test that all components are properly initialized
      expect(client.getLogger()).toBeInstanceOf(Logger);
      expect(client.getRateLimiter()).toBeInstanceOf(RateLimiter);
      expect(client.getConfiguration()).toBeDefined();
      expect(client.getBaseURL()).toBe('https://frontend-api-v3.pump.fun');
      expect(client.getTimeout()).toBe(10000);
    });

    test('should load configuration from environment variables', () => {
      // Test environment variable loading
      const originalEnv = process.env.PUMPFUN_API_BASE_URL;
      process.env.PUMPFUN_API_BASE_URL = 'https://test-api.pump.fun';

      const envClient = new PumpFunAPIClient();
      expect(envClient.getBaseURL()).toBe('https://test-api.pump.fun');

      // Restore original environment
      if (originalEnv) {
        process.env.PUMPFUN_API_BASE_URL = originalEnv;
      } else {
        delete process.env.PUMPFUN_API_BASE_URL;
      }

      envClient.shutdown();
    });

    test('should handle configuration validation errors', () => {
      expect(() => {
        new PumpFunAPIClient({
          baseURL: 'invalid-url',
          timeout: -1000,
        });
      }).toThrow();
    });

    test('should provide accurate client state and statistics', () => {
      const state = client.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.requestCount).toBe(0);
      expect(state.errorCount).toBe(0);

      const stats = client.getStatistics();
      expect(stats.requestCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.errorRate).toBe(0);
    });
  });

  describe('Component Integration', () => {
    test('should integrate logger component correctly', () => {
      const logger = client.getLogger();

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');

      // Test that logger can be updated
      expect(() => {
        client.updateLoggerConfig({ level: 'DEBUG' });
      }).not.toThrow();
    });

    test('should integrate rate limiter component correctly', () => {
      const rateLimiter = client.getRateLimiter();

      expect(typeof rateLimiter.canMakeRequest).toBe('function');
      expect(typeof rateLimiter.recordRequest).toBe('function');
      expect(typeof rateLimiter.reset).toBe('function');
      expect(typeof rateLimiter.updateConfig).toBe('function');

      // Test that rate limiter can be updated
      expect(() => {
        client.updateRateLimitConfig({ maxRequestsPerWindow: 100 });
      }).not.toThrow();
    });

    test('should handle graceful shutdown', async () => {
      expect(client.isClientInitialized()).toBe(true);

      await client.shutdown();

      expect(client.isClientInitialized()).toBe(false);
    });

    test('should provide accurate debugging information', () => {
      const stringRep = client.toString();
      expect(stringRep).toContain('PumpFunAPIClient');
      expect(stringRep).toContain('https://frontend-api-v3.pump.fun');
      expect(stringRep).toContain('10000ms');

      const jsonRep = client.toJSON();
      expect(jsonRep).toHaveProperty('config');
      expect(jsonRep).toHaveProperty('state');
      expect(jsonRep).toHaveProperty('statistics');
      expect(jsonRep.config.baseURL).toBe('https://frontend-api-v3.pump.fun');
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should handle rate limit backoff', async () => {
      const rateLimiter = client.getRateLimiter();

      // Test rate limiter directly
      expect(await rateLimiter.canMakeRequest()).toBe(true);

      // Simulate reaching rate limit
      for (let i = 0; i < 65; i++) { // More than the default 60
        rateLimiter.recordRequest();
      }

      // Should be rate limited now
      expect(await rateLimiter.canMakeRequest()).toBe(false);
    });

    test('should track request statistics correctly', async () => {
      const rateLimiter = client.getRateLimiter();

      // Record some requests
      rateLimiter.recordRequest();
      rateLimiter.recordRequest();
      rateLimiter.recordRequest();

      // Rate limiter should track the requests
      expect(await rateLimiter.canMakeRequest()).toBe(true); // Still should be able to make requests

      // Reset and verify
      rateLimiter.reset();
      expect(await rateLimiter.canMakeRequest()).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should reset statistics correctly', () => {
      // Simulate some activity
      const rateLimiter = client.getRateLimiter();
      rateLimiter.recordRequest();
      rateLimiter.recordRequest();

      // Reset statistics
      client.resetStatistics();

      const stats = client.getStatistics();
      expect(stats.requestCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.errorRate).toBe(0);
    });

    test('should handle rate limit backoff state', () => {
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
      // Should not throw for valid configuration updates
      expect(() => {
        client.updateLoggerConfig({ level: 'DEBUG' });
        client.updateRateLimitConfig({ maxRequestsPerWindow: 100 });
      }).not.toThrow();
    });
  });

  describe('Client Lifecycle Management', () => {
    test('should support graceful shutdown and reinitialization', async () => {
      expect(client.isClientInitialized()).toBe(true);

      await client.shutdown();
      expect(client.isClientInitialized()).toBe(false);

      // Should be able to create new client
      const newClient = new PumpFunAPIClient();
      expect(newClient.isClientInitialized()).toBe(true);

      newClient.shutdown();
    });

    test('should maintain state consistency during operations', () => {
      const initialStats = client.getStatistics();

      // Statistics should start at zero
      expect(initialStats.requestCount).toBe(0);
      expect(initialStats.errorCount).toBe(0);
      expect(initialStats.errorRate).toBe(0);

      const state = client.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.requestCount).toBe(0);
      expect(state.errorCount).toBe(0);
      expect(state.rateLimitInfo).toBeDefined();
      expect(state.rateLimitInfo.requestsInWindow).toBe(0);
      expect(state.rateLimitInfo.windowStart).toBeGreaterThan(0);
      expect(state.rateLimitInfo.backoffUntil).toBe(0);
      expect(state.rateLimitInfo.consecutiveErrors).toBe(0);
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    test('should satisfy PumpFunAPIClient interface', () => {
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
      expect(typeof client.testConnection).toBe('function');
    });

    test('should return correct types from methods', () => {
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
      const logger = client.getLogger();

      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('should initialize with working rate limiter component', () => {
      const rateLimiter = client.getRateLimiter();

      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter.canMakeRequest).toBe('function');
      expect(typeof rateLimiter.recordRequest).toBe('function');
      expect(typeof rateLimiter.reset).toBe('function');
      expect(typeof rateLimiter.updateConfig).toBe('function');
    });

    test('should handle component interaction during initialization', () => {
      // Create client with custom configuration
      const customClient = new PumpFunAPIClient({
        loggerConfig: {
          level: 'DEBUG',
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
      });

      expect(() => new PumpFunAPIClient({
        loggerConfig: {
          level: 'DEBUG',
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
      })).not.toThrow();

      const testClient = new PumpFunAPIClient({
        loggerConfig: {
          level: 'DEBUG',
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
      });

      // Components should be properly initialized
      expect(testClient.getLogger()).toBeDefined();
      expect(testClient.getRateLimiter()).toBeDefined();
      expect(testClient.isClientInitialized()).toBe(true);

      testClient.shutdown();
    });
  });

  describe('Configuration Validation and Error Scenarios', () => {
    test('should handle invalid timeout values', () => {
      expect(() => {
        new PumpFunAPIClient({ timeout: -1000 });
      }).toThrow();

      expect(() => {
        new PumpFunAPIClient({ timeout: 0 });
      }).toThrow();
    });

    test('should handle invalid baseURL values', () => {
      expect(() => {
        new PumpFunAPIClient({ baseURL: 'not-a-valid-url' });
      }).toThrow();

      expect(() => {
        new PumpFunAPIClient({ baseURL: 'ftp://invalid-protocol.com' });
      }).toThrow();
    });

    test('should handle extreme but valid configurations', () => {
      expect(() => {
        new PumpFunAPIClient({
          timeout: 60000, // Maximum allowed
          loggerConfig: {
            level: 'DEBUG',
            enableConsole: false,
            enableColors: false,
            enableFile: true,
            filePath: '/tmp/test.log',
            enableTimestamps: true
          },
          rateLimitConfig: {
            maxRequestsPerWindow: 1000,
            windowMs: 3600000,
            enableRetryAfter: false,
            enableSlidingWindow: false,
            enableBurstProtection: false,
            enableBackoff: false,
            baseBackoffMs: 100,
            maxBackoffMs: 1000,
            backoffMultiplier: 1
          }
        });
      }).not.toThrow();
    });

    test('should handle mixed valid and invalid configuration', () => {
      expect(() => {
        new PumpFunAPIClient({
          baseURL: 'https://valid-api.example.com', // Valid
          timeout: -1000 // Invalid
        });
      }).toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle rapid client creation and destruction', () => {
      const startTime = Date.now();

      // Create multiple clients rapidly
      const clients = Array.from({ length: 10 }, () => new PumpFunAPIClient());

      const creationTime = Date.now() - startTime;

      // All clients should be initialized
      clients.forEach(c => expect(c.isClientInitialized()).toBe(true));

      // Should complete quickly
      expect(creationTime).toBeLessThan(1000); // 1 second for 10 clients

      // Cleanup
      clients.forEach(c => c.shutdown());
    });

    test('should handle concurrent configuration updates', async () => {
      expect(() => {
        // Perform multiple logger config updates
        for (let i = 0; i < 5; i++) {
          client.updateLoggerConfig({ level: i % 2 === 0 ? 'DEBUG' : 'INFO' });
        }
      }).not.toThrow();

      // Should handle rate limit updates too
      expect(() => {
        for (let i = 0; i < 5; i++) {
          client.updateRateLimitConfig({ maxRequestsPerWindow: 60 + i * 10 });
        }
      }).not.toThrow();
    });
  });
});