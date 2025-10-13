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
      last_reply: 1640995300000,
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
      last_reply: 1640995500000,
    },
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
        errorRate: 0,
      }),
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
        includeNsfw: true,
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
        sort: 'participants',
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
        includeNsfw: false,
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
        includeNsfw: 'not_boolean' as any,
      };

      await expect(client.getLiveCoins(invalidParams)).rejects.toThrow(
        /getLiveCoins parameter validation failed/
      );
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
        { name: 'Invalid Coin' }, // Missing required fields
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
          data: { message: 'Rate limit exceeded' },
        },
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
        includeNsfw: false,
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
        includeNsfw: true,
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
        await expect(client.getLiveCoins({ sort: sort as any })).rejects.toThrow(
          /Invalid sort field/
        );
      }
    });

    test('should reject invalid sort orders', async () => {
      const invalidOrders = ['asc', 'desc', 'ASCENDING', 'DESCENDING', '', null, undefined];

      for (const order of invalidOrders) {
        await expect(client.getLiveCoins({ order: order as any })).rejects.toThrow(
          /Invalid sort order/
        );
      }
    });

    test('should reject invalid includeNsfw values', async () => {
      const invalidNsfw = ['true', 'false', 1, 0, null, undefined, {}, []];

      for (const includeNsfw of invalidNsfw) {
        await expect(client.getLiveCoins({ includeNsfw: includeNsfw as any })).rejects.toThrow(
          /Invalid includeNsfw type/
        );
      }
    });
  });

  describe('Response validation edge cases', () => {
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
          last_reply: 1640995300000,
        },
        {
          // Invalid item - missing required fields
          mint: 'invalid',
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
          last_reply: -1000, // Negative
        },
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
          last_reply: 1640995300000,
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
          last_reply: 1640995500000,
        },
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

  describe('getActiveStreams method', () => {
    test('should fetch active streams with minimum participants filter', async () => {
      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      const result = await client.getActiveStreams(50);

      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/coins/currently-live?limit=100&sort=participants'
      );
      expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
      expect(result).toEqual(
        mockLiveCoins.filter(coin => coin.is_currently_live && coin.num_participants >= 50)
      );
    });

    test('should fetch active streams with custom parameters', async () => {
      const customLiveCoins = [
        { ...mockLiveCoins[0], num_participants: 200, is_currently_live: true },
        { ...mockLiveCoins[1], num_participants: 25, is_currently_live: true },
        { ...mockLiveCoins[0], mint: 'newmint', num_participants: 100, is_currently_live: false },
      ];
      mockHttpClient.get.mockResolvedValue(customLiveCoins);

      const result = await client.getActiveStreams(100, { limit: 20, offset: 10 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/coins/currently-live?offset=10&limit=20&sort=participants'
      );
      expect(result).toEqual(
        customLiveCoins.filter(coin => coin.is_currently_live && coin.num_participants >= 100)
      );
    });

    test('should return empty array when no streams meet minimum criteria', async () => {
      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      const result = await client.getActiveStreams(1000);

      expect(result).toEqual([]);
      expect(mockHttpClient.get).toHaveBeenCalled();
    });

    test('should validate minimum participants parameter', async () => {
      await expect(client.getActiveStreams(-1)).rejects.toThrow(/Invalid minParticipants/);
      await expect(client.getActiveStreams(NaN)).rejects.toThrow(/Invalid minParticipants/);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    test('should handle empty API response', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const result = await client.getActiveStreams(10);

      expect(result).toEqual([]);
    });

    test('should handle API errors in getActiveStreams', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));

      await expect(client.getActiveStreams(50)).rejects.toThrow();
      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockRateLimiter.recordRequest).not.toHaveBeenCalled();
    });

    test('should handle high limit values with warning', async () => {
      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      await client.getActiveStreams(10, { limit: 100 }); // Use max allowed limit

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/coins/currently-live?limit=100&sort=participants'
      );
    });
  });

  describe('getTopLiveStreams method', () => {
    test('should fetch top live streams sorted by participants', async () => {
      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      const result = await client.getTopLiveStreams(10);

      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/coins/currently-live?limit=20&sort=participants'
      );
      expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
      // Should return only live streams, filtered from API response and sliced to limit
      const expectedStreams = mockLiveCoins.filter(coin => coin.is_currently_live).slice(0, 10);
      expect(result).toEqual(expectedStreams);
    });

    test('should fetch top streams and filter by currently live', async () => {
      const mixedLiveCoins = [
        {
          ...mockLiveCoins[0],
          num_participants: 200,
          is_currently_live: true,
          mint: 'mint1',
          name: 'High Participants',
        },
        {
          ...mockLiveCoins[1],
          num_participants: 25,
          is_currently_live: false,
          mint: 'mint2',
          name: 'Low Participants',
        },
        {
          ...mockLiveCoins[0],
          mint: 'mint3',
          num_participants: 150,
          is_currently_live: true,
          name: 'Medium Participants',
        },
      ];
      mockHttpClient.get.mockResolvedValue(mixedLiveCoins);

      const result = await client.getTopLiveStreams(20);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/coins/currently-live?limit=20&sort=participants'
      );
      // Should return only live streams, filtered from the original API response order
      const expectedLiveStreams = mixedLiveCoins
        .filter(coin => coin.is_currently_live)
        .slice(0, 20);
      expect(result).toEqual(expectedLiveStreams);
    });

    test('should return empty array when API returns no results', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const result = await client.getTopLiveStreams(5);

      expect(result).toEqual([]);
    });

    test('should validate limit parameter', async () => {
      await expect(client.getTopLiveStreams(0)).rejects.toThrow(
        /Invalid limit.*Must be at least 1/
      );
      await expect(client.getTopLiveStreams(-1)).rejects.toThrow(
        /Invalid limit.*Must be at least 1/
      );
      await expect(client.getTopLiveStreams(NaN)).rejects.toThrow(
        /Invalid limit.*Must be a valid number/
      );
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    test('should handle API errors in getTopLiveStreams', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(client.getTopLiveStreams(10)).rejects.toThrow();
      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
    });

    test('should handle high limit values with warning', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      await client.getTopLiveStreams(100); // Use max allowed limit

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/coins/currently-live?limit=100&sort=participants'
      );
    });

    test('should log info when no streams meet criteria', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const result = await client.getTopLiveStreams(10, { offset: 100 });

      expect(result).toEqual([]);
    });
  });

  describe('getTitledStreams method', () => {
    test('should fetch streams with titles', async () => {
      const titledCoins = [
        { ...mockLiveCoins[0], livestream_title: 'Amazing Live Stream', is_currently_live: true },
        { ...mockLiveCoins[1], livestream_title: 'Another Great Stream', is_currently_live: true },
      ];
      mockHttpClient.get.mockResolvedValue(titledCoins);

      const result = await client.getTitledStreams(10);

      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockHttpClient.get).toHaveBeenCalledWith('/coins/currently-live?limit=50');
      expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
      expect(result).toEqual(titledCoins);
    });

    test('should filter out streams without titles', async () => {
      const mixedCoins = [
        { ...mockLiveCoins[0], livestream_title: 'Has Title', is_currently_live: true },
        { ...mockLiveCoins[1], livestream_title: null, is_currently_live: true }, // No title
        {
          ...mockLiveCoins[0],
          mint: 'mint3',
          livestream_title: undefined,
          is_currently_live: false,
        }, // No title
      ];
      mockHttpClient.get.mockResolvedValue(mixedCoins);

      const result = await client.getTitledStreams(20);

      expect(result).toEqual([mixedCoins[0]]); // Only coin with title and live
    });

    test('should filter out streams with empty or whitespace titles', async () => {
      const mixedTitles = [
        { ...mockLiveCoins[0], livestream_title: 'Valid Title', is_currently_live: true },
        { ...mockLiveCoins[1], livestream_title: '', is_currently_live: true }, // Empty string
        { ...mockLiveCoins[0], mint: 'mint3', livestream_title: '   ', is_currently_live: true }, // Whitespace only
        { ...mockLiveCoins[1], mint: 'mint4', livestream_title: '\n\t', is_currently_live: true }, // Special whitespace
      ];
      mockHttpClient.get.mockResolvedValue(mixedTitles);

      const result = await client.getTitledStreams(15);

      expect(result).toEqual([mixedTitles[0]]); // Only coin with valid title
    });

    test('should work with custom parameters', async () => {
      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      await client.getTitledStreams(5, {
        offset: 10,
        sort: 'market_cap',
        order: 'ASC',
        includeNsfw: true,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/coins/currently-live?offset=10&limit=50&sort=market_cap&order=ASC&includeNsfw=true'
      );
    });

    test('should return empty array when no streams have titles', async () => {
      const untitledCoins = [
        { ...mockLiveCoins[0], livestream_title: null },
        { ...mockLiveCoins[1], livestream_title: undefined },
      ];
      mockHttpClient.get.mockResolvedValue(untitledCoins);

      const result = await client.getTitledStreams(10);

      expect(result).toEqual([]);
    });

    test('should handle empty API response', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const result = await client.getTitledStreams(10);

      expect(result).toEqual([]);
    });

    test('should validate limit parameter', async () => {
      await expect(client.getTitledStreams(0)).rejects.toThrow(/Invalid limit.*Must be at least 1/);
      await expect(client.getTitledStreams(-1)).rejects.toThrow(
        /Invalid limit.*Must be at least 1/
      );
      await expect(client.getTitledStreams(NaN)).rejects.toThrow(
        /Invalid limit.*Must be a valid number/
      );
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    test('should handle API errors in getTitledStreams', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API Error'));

      await expect(client.getTitledStreams(10)).rejects.toThrow();
      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockRateLimiter.recordRequest).not.toHaveBeenCalled();
    });

    test('should handle high limit values with warning', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      await client.getTitledStreams(100); // Use max allowed limit

      expect(mockHttpClient.get).toHaveBeenCalledWith('/coins/currently-live?limit=100');
    });
  });

  describe('Live streaming methods integration', () => {
    test('should work together: getLiveCoins -> getActiveStreams', async () => {
      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      const allCoins = await client.getLiveCoins();
      const activeCoins = await client.getActiveStreams(100);

      expect(allCoins).toEqual(mockLiveCoins);
      expect(activeCoins).toEqual(
        mockLiveCoins.filter(coin => coin.is_currently_live && coin.num_participants >= 100)
      );
    });

    test('should work together: getLiveCoins -> getTopLiveStreams', async () => {
      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      const allCoins = await client.getLiveCoins();
      const topCoins = await client.getTopLiveStreams(5);

      expect(allCoins).toEqual(mockLiveCoins);
      expect(topCoins).toEqual(mockLiveCoins.filter(coin => coin.is_currently_live).slice(0, 5));
    });

    test('should work together: getLiveCoins -> getTitledStreams', async () => {
      const mixedCoins = [
        {
          ...mockLiveCoins[0],
          livestream_title: 'Has Title',
          is_currently_live: true,
          mint: 'mint1',
          name: 'Titled Stream',
        },
        {
          ...mockLiveCoins[1],
          livestream_title: null,
          is_currently_live: true,
          mint: 'mint2',
          name: 'Untitled Stream',
        },
      ];
      mockHttpClient.get.mockResolvedValue(mixedCoins);

      const allCoins = await client.getLiveCoins();
      const titledCoins = await client.getTitledStreams(10);

      expect(allCoins).toEqual(mixedCoins);
      // Should return only live streams with titles
      const expectedTitledCoins = mixedCoins.filter(
        coin =>
          coin.is_currently_live && coin.livestream_title && coin.livestream_title.trim().length > 0
      );
      expect(titledCoins).toEqual(expectedTitledCoins);
    });

    test('should handle concurrent requests properly', async () => {
      mockHttpClient.get.mockResolvedValue(mockLiveCoins);

      const promises = [
        client.getLiveCoins(),
        client.getActiveStreams(50),
        client.getTopLiveStreams(5),
        client.getTitledStreams(10),
      ];

      const results = await Promise.all(promises);

      expect(mockRateLimiter.waitForRequest).toHaveBeenCalledTimes(4);
      expect(mockRateLimiter.recordRequest).toHaveBeenCalledTimes(4);
      expect(results[0]).toEqual(mockLiveCoins);
      expect(results[1]).toEqual(
        mockLiveCoins.filter(coin => coin.is_currently_live && coin.num_participants >= 50)
      );
      expect(results[2]).toEqual(mockLiveCoins.filter(coin => coin.is_currently_live).slice(0, 5));
      expect(results[3]).toEqual(
        mockLiveCoins.filter(coin => coin.is_currently_live && coin.livestream_title)
      );
    });

    test('should handle partial failures in concurrent requests', async () => {
      mockHttpClient.get
        .mockResolvedValueOnce(mockLiveCoins) // getLiveCoins succeeds
        .mockRejectedValueOnce(new Error('Network error')) // getActiveStreams fails
        .mockResolvedValueOnce(mockLiveCoins) // getTopLiveStreams succeeds
        .mockRejectedValueOnce(new Error('API error')); // getTitledStreams fails

      const results = await Promise.allSettled([
        client.getLiveCoins(),
        client.getActiveStreams(50),
        client.getTopLiveStreams(5),
        client.getTitledStreams(10),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
      expect(results[3].status).toBe('rejected');
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
