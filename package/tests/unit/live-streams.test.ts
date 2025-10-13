/**
 * Unit tests for Live Streaming functionality
 *
 * This test suite validates:
 * - getLiveCoins method with various parameters
 * - Parameter validation and error handling
 * - Response validation and data transformation
 * - Rate limiting integration
 * - Error scenarios and recovery
 *
 * @version 1.0.0
 */

import { PumpFunAPIClient } from '../../src/client/PumpFunAPIClient';
import { GetLiveCoinsParams, LiveCoin } from '../../src/client/types';
import { HTTPClient } from '../../src/utils/http-client';
import { RateLimiter } from '../../src/utils/rate-limiter';

// Mock the HTTP client
jest.mock('../../src/utils/http-client');
const MockedHTTPClient = HTTPClient as jest.MockedClass<typeof HTTPClient>;

// Mock the Rate Limiter
jest.mock('../../src/utils/rate-limiter');
const MockedRateLimiter = RateLimiter as jest.MockedClass<typeof RateLimiter>;

describe('Live Streaming Functionality', () => {
  let client: PumpFunAPIClient;
  let mockHttpClient: jest.Mocked<HTTPClient>;
  let mockRateLimiter: jest.Mocked<RateLimiter>;

  // Mock live coin data
  const mockLiveCoins: LiveCoin[] = [
    {
      mint: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      name: 'Test Coin 1',
      symbol: 'TEST1',
      description: 'A test coin for unit testing',
      image_uri: 'https://example.com/image1.png',
      twitter: '@testcoin1',
      telegram: 'https://t.me/testcoin1',
      creator: '11111111111111111111111111111111',
      created_timestamp: 1640995200000,
      market_cap: 1000000,
      usd_market_cap: 500000,
      is_currently_live: true,
      livestream_title: 'Live Stream Test 1',
      num_participants: 150,
      reply_count: 500,
      thumbnail: 'https://example.com/thumb1.jpg',
      last_reply: 1640995300000
    },
    {
      mint: '8WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      name: 'Test Coin 2',
      symbol: 'TEST2',
      description: 'Another test coin',
      image_uri: 'https://example.com/image2.png',
      creator: '22222222222222222222222222222222',
      created_timestamp: 1640995400000,
      market_cap: 2000000,
      usd_market_cap: 1000000,
      is_currently_live: true,
      livestream_title: 'Live Stream Test 2',
      num_participants: 75,
      reply_count: 200,
      thumbnail: 'https://example.com/thumb2.jpg',
      last_reply: 1640995500000
    }
  ];

  beforeEach(() => {
    // Reset mocks
    MockedHTTPClient.mockClear();
    MockedRateLimiter.mockClear();

    // Create mock instances
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockRateLimiter = {
      waitForRequest: jest.fn().mockResolvedValue(undefined),
      recordRequest: jest.fn(),
      canMakeRequest: jest.fn().mockResolvedValue(true),
      isRateLimited: jest.fn().mockReturnValue(false),
      reset: jest.fn(),
      updateConfig: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        requests: 0,
        maxRequests: 60,
        windowStart: Date.now(),
        windowEnd: Date.now() + 60000,
        burstCount: 0,
        maxBurst: 10,
        consecutiveErrors: 0,
        isBackoffActive: false,
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0
      })
    } as any;

    // Mock constructors
    MockedHTTPClient.mockImplementation(() => mockHttpClient);
    MockedRateLimiter.mockImplementation(() => mockRateLimiter);

    // Create client instance
    client = new PumpFunAPIClient();
  });

  describe('getLiveCoins method', () => {
    test('should fetch live coins with default parameters', async () => {
      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      const result = await client.getLiveCoins();

      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockHttpClient.get).toHaveBeenCalledWith('/coins/currently-live');
      expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
      expect(result).toEqual(mockLiveCoins);
      expect(result).toHaveLength(2);
    });

    test('should fetch live coins with custom parameters', async () => {
      const params: GetLiveCoinsParams = {
        offset: 10,
        limit: 20,
        sort: 'market_cap',
        order: 'ASC',
        includeNsfw: true
      };

      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      await client.getLiveCoins(params);

      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/coins/currently-live?offset=10&limit=20&sort=market_cap&order=ASC&includeNsfw=true'
      );
      expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
    });

    test('should build query string correctly with partial parameters', async () => {
      const params: GetLiveCoinsParams = {
        limit: 5,
        sort: 'participants'
      };

      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      await client.getLiveCoins(params);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/coins/currently-live?limit=5&sort=participants'
      );
    });

    test('should not add query string for default parameters', async () => {
      const params: GetLiveCoinsParams = {
        offset: 0,
        limit: 10,
        sort: 'currently_live',
        order: 'DESC',
        includeNsfw: false
      };

      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      await client.getLiveCoins(params);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/coins/currently-live');
    });

    test('should validate parameters correctly', async () => {
      const invalidParams = {
        offset: -1,
        limit: 0,
        sort: 'invalid_sort' as any,
        order: 'INVALID' as any,
        includeNsfw: 'not_boolean' as any
      };

      await expect(client.getLiveCoins(invalidParams)).rejects.toThrow(/getLiveCoins parameter validation failed/);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    test('should handle empty response array', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const result = await client.getLiveCoins();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('should validate response data structure', async () => {
      const invalidResponse = [
        { mint: '123' }, // Missing required fields
        { name: 'Invalid Coin' } // Missing required fields
      ];

      mockHttpClient.get.mockResolvedValue(invalidResponse);

      const result = await client.getLiveCoins();

      // Should return empty array for invalid data
      expect(result).toEqual([]);
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockHttpClient.get.mockRejectedValue(networkError);

      await expect(client.getLiveCoins()).rejects.toThrow();
      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockRateLimiter.recordRequest).not.toHaveBeenCalled();
    });

    test('should handle API errors properly', async () => {
      const apiError = {
        response: {
          status: 429,
          statusText: 'Too Many Requests',
          data: { message: 'Rate limit exceeded' }
        }
      };
      mockHttpClient.get.mockRejectedValue(apiError);

      await expect(client.getLiveCoins()).rejects.toThrow();
    });

    test('should update client statistics on successful request', async () => {
      const initialStats = client.getStatistics();
      expect(initialStats.requestCount).toBe(0);

      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      await client.getLiveCoins();

      const updatedStats = client.getStatistics();
      expect(updatedStats.requestCount).toBe(1);
      // The statistics object doesn't include lastRequestTime, but we can check the state
      const state = client.getState();
      expect(typeof state.lastRequestTime).toBe('number');
      expect(state.lastRequestTime).toBeGreaterThan(0);
    });

    test('should update error statistics on failed request', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Test error'));

      try {
        await client.getLiveCoins();
      } catch (error) {
        // Expected to throw
      }

      const stats = client.getStatistics();
      expect(stats.requestCount).toBe(0); // Should not increment on error
      expect(stats.errorCount).toBe(1);
      // Error rate should be calculated based on the error count
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Parameter validation edge cases', () => {
    test('should handle minimum valid values', async () => {
      const params: GetLiveCoinsParams = {
        offset: 0,
        limit: 1,
        sort: 'currently_live',
        order: 'ASC',
        includeNsfw: false
      };

      mockHttpClient.get.mockResolvedValue([]);

      await expect(client.getLiveCoins(params)).resolves.toEqual([]);
    });

    test('should handle maximum valid values', async () => {
      const params: GetLiveCoinsParams = {
        offset: 1000,
        limit: 100,
        sort: 'participants',
        order: 'DESC',
        includeNsfw: true
      };

      mockHttpClient.get.mockResolvedValue([]);

      await expect(client.getLiveCoins(params)).resolves.toEqual([]);
    });

    test('should reject invalid offset values', async () => {
      const invalidOffsets = [-1, -100, -Infinity];

      for (const offset of invalidOffsets) {
        await expect(client.getLiveCoins({ offset })).rejects.toThrow(/Invalid offset/);
      }
    });

    test('should reject invalid limit values', async () => {
      const invalidLimits = [0, -1, 101, 1000];

      for (const limit of invalidLimits) {
        await expect(client.getLiveCoins({ limit })).rejects.toThrow(/Invalid limit/);
      }
    });

    test('should reject invalid sort fields', async () => {
      const invalidSorts = ['invalid', 'market_cap_desc', 'participants_asc', '', null, undefined];

      for (const sort of invalidSorts) {
        await expect(client.getLiveCoins({ sort: sort as any })).rejects.toThrow(/Invalid sort field/);
      }
    });

    test('should reject invalid sort orders', async () => {
      const invalidOrders = ['asc', 'desc', 'ASCENDING', 'DESCENDING', '', null, undefined];

      for (const order of invalidOrders) {
        await expect(client.getLiveCoins({ order: order as any })).rejects.toThrow(/Invalid sort order/);
      }
    });

    test('should reject invalid includeNsfw values', async () => {
      const invalidNsfw = ['true', 'false', 1, 0, null, undefined, {}, []];

      for (const includeNsfw of invalidNsfw) {
        await expect(client.getLiveCoins({ includeNsfw: includeNsfw as any })).rejects.toThrow(/Invalid includeNsfw type/);
      }
    });
  });

  describe('Response validation edge cases', () => {
    test('should handle non-array response', async () => {
      const invalidResponses = [
        null,
        undefined,
        {},
        { data: 'not array' },
        'string',
        123,
        true
      ];

      for (const response of invalidResponses) {
        mockHttpClient.get.mockResolvedValue(response);
        await expect(client.getLiveCoins()).rejects.toThrow(/Invalid response format/);
      }
    });

    test('should handle partially valid data', async () => {
      const mixedData = [
        {
          // Valid item
          mint: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          name: 'Valid Coin',
          symbol: 'VALID',
          description: 'Valid description',
          image_uri: 'https://example.com/image.png',
          creator: '11111111111111111111111111111111',
          created_timestamp: 1640995200000,
          market_cap: 1000000,
          usd_market_cap: 500000,
          is_currently_live: true,
          num_participants: 100,
          reply_count: 200,
          thumbnail: 'https://example.com/thumb.jpg',
          last_reply: 1640995300000
        },
        {
          // Invalid item - missing required fields
          mint: 'invalid'
        },
        {
          // Invalid item - wrong types
          mint: '8WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          name: 'Type Error Coin',
          symbol: 'TYPE',
          description: 'Wrong types',
          image_uri: 'https://example.com/image.png',
          creator: '22222222222222222222222222222222',
          created_timestamp: 'not a number',
          market_cap: 'not a number',
          usd_market_cap: -1000, // Negative
          is_currently_live: 'not boolean',
          num_participants: -50, // Negative
          reply_count: 'not number',
          thumbnail: 'https://example.com/thumb.jpg',
          last_reply: -1000 // Negative
        }
      ];

      mockHttpClient.get.mockResolvedValue(mixedData);

      const result = await client.getLiveCoins();

      // Should return only the valid item
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Valid Coin');
    });

    test('should handle items with optional fields missing', async () => {
      const dataWithOptionalFields = [
        {
          // Item with all optional fields
          mint: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          name: 'Full Coin',
          symbol: 'FULL',
          description: 'All fields present',
          image_uri: 'https://example.com/image.png',
          twitter: '@fullcoin',
          telegram: 'https://t.me/fullcoin',
          creator: '11111111111111111111111111111111',
          created_timestamp: 1640995200000,
          market_cap: 1000000,
          usd_market_cap: 500000,
          is_currently_live: true,
          livestream_title: 'Full Stream',
          num_participants: 100,
          reply_count: 200,
          thumbnail: 'https://example.com/thumb.jpg',
          last_reply: 1640995300000
        },
        {
          // Item with optional fields missing
          mint: '8WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          name: 'Minimal Coin',
          symbol: 'MIN',
          description: 'Minimal fields',
          image_uri: 'https://example.com/image.png',
          creator: '22222222222222222222222222222222',
          created_timestamp: 1640995400000,
          market_cap: 500000,
          usd_market_cap: 250000,
          is_currently_live: true,
          num_participants: 50,
          reply_count: 100,
          thumbnail: 'https://example.com/thumb.jpg',
          last_reply: 1640995500000
        }
      ];

      mockHttpClient.get.mockResolvedValue(dataWithOptionalFields);

      const result = await client.getLiveCoins();

      expect(result).toHaveLength(2);
      expect(result[0].twitter).toBe('@fullcoin');
      expect(result[0].telegram).toBe('https://t.me/fullcoin');
      expect(result[0].livestream_title).toBe('Full Stream');
      expect(result[1].twitter).toBeUndefined();
      expect(result[1].telegram).toBeUndefined();
      expect(result[1].livestream_title).toBeUndefined();
    });
  });

  describe('Rate limiting integration', () => {
    test('should wait for rate limiter before making request', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      await client.getLiveCoins();

      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockHttpClient.get).toHaveBeenCalled();
    });

    test('should record request after successful response', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      await client.getLiveCoins();

      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
    });

    test('should not record request after error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Test error'));

      try {
        await client.getLiveCoins();
      } catch (error) {
        // Expected to throw
      }

      expect(mockRateLimiter.recordRequest).not.toHaveBeenCalled();
    });
  });
});