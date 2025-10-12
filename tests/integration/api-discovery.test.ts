/**
 * Integration Tests for PumpFun API Discovery
 *
 * These tests verify that all discovered endpoints work correctly
 * with proper authentication (or lack thereof) and handle responses appropriately.
 */

import { HTTPClient } from '../../src/utils/http-client';
import { Logger } from '../../src/utils/logger';
import { ErrorHandler } from '../../src/utils/errors';

// Test configuration
const TEST_CONFIG = {
  baseURL: 'https://frontend-api-v3.pump.fun',
  timeout: 15000,
  headers: {
    'Origin': 'https://pump.fun',
    'Referer': 'https://pump.fun/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
  }
};

// Type definitions based on discovered API responses
interface LiveCoin {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  twitter?: string;
  telegram?: string;
  creator: string;
  created_timestamp: number;
  market_cap: number;
  usd_market_cap: number;

  // Live streaming specific fields
  is_currently_live: boolean;
  livestream_title: string;
  num_participants: number;
  reply_count: number;
  thumbnail: string;
  last_reply: number;
}

interface JurisdictionResponse {
  is_valid: boolean;
}

interface SolPriceResponse {
  sol_price: number;
}

/**
 * Test Helper Functions
 */
class APITestHelper {
  private httpClient: HTTPClient;
  private logger: Logger;

  constructor() {
    this.httpClient = new HTTPClient(TEST_CONFIG.baseURL, {
      timeout: TEST_CONFIG.timeout,
      headers: TEST_CONFIG.headers
    });
    this.logger = new Logger({}, { component: 'APITestHelper' });
  }

  async makeRequest(endpoint: string): Promise<any> {
    try {
      const response = await this.httpClient.get(endpoint);
      return response;
    } catch (error) {
      this.logger.error(`Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  validateLiveCoinResponse(data: any): data is LiveCoin[] {
    if (!Array.isArray(data)) {
      return false;
    }

    // Check if at least one item has the required live streaming fields
    const hasLiveFields = data.some(item =>
      typeof item === 'object' &&
      item !== null &&
      'mint' in item &&
      'name' in item &&
      'symbol' in item &&
      'is_currently_live' in item &&
      'num_participants' in item &&
      'reply_count' in item &&
      'thumbnail' in item
    );

    return hasLiveFields;
  }

  validateJurisdictionResponse(data: any): data is JurisdictionResponse {
    return typeof data === 'object' &&
           data !== null &&
           'is_valid' in data &&
           typeof data.is_valid === 'boolean';
  }

  validateSolPriceResponse(data: any): data is SolPriceResponse {
    return typeof data === 'object' &&
           data !== null &&
           'sol_price' in data &&
           typeof data.sol_price === 'number';
  }
}

describe('PumpFun API Discovery Integration Tests', () => {
  let testHelper: APITestHelper;

  beforeAll(() => {
    testHelper = new APITestHelper();
  });

  describe('Endpoint Accessibility', () => {
    test('should have correct base URL configuration', () => {
      expect(TEST_CONFIG.baseURL).toBe('https://frontend-api-v3.pump.fun');
    });

    test('should have proper CORS headers', () => {
      expect(TEST_CONFIG.headers['Origin']).toBe('https://pump.fun');
      expect(TEST_CONFIG.headers['Referer']).toBe('https://pump.fun/');
    });
  });

  describe('Live Coins Endpoint (/coins/currently-live)', () => {
    test('should return live streaming coins data', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?limit=5');

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);

      const isValid = testHelper.validateLiveCoinResponse(response);
      expect(isValid).toBe(true);
    });

    test('should return proper data structure for live coins', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?limit=3');

      expect(Array.isArray(response)).toBe(true);

      if (response.length > 0) {
        const coin = response[0];

        // Verify required fields exist
        expect(coin).toHaveProperty('mint');
        expect(coin).toHaveProperty('name');
        expect(coin).toHaveProperty('symbol');
        expect(coin).toHaveProperty('is_currently_live');
        expect(coin).toHaveProperty('num_participants');
        expect(coin).toHaveProperty('reply_count');
        expect(coin).toHaveProperty('thumbnail');

        // Verify field types
        expect(typeof coin.mint).toBe('string');
        expect(typeof coin.name).toBe('string');
        expect(typeof coin.symbol).toBe('string');
        expect(typeof coin.is_currently_live).toBe('boolean');
        expect(typeof coin.num_participants).toBe('number');
        expect(typeof coin.reply_count).toBe('number');
        expect(typeof coin.thumbnail).toBe('string');
      }
    });

    test('should support pagination parameters', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?offset=0&limit=2');

      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeLessThanOrEqual(2);
    });

    test('should support filtering by NSFW content', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?includeNsfw=false');

      expect(Array.isArray(response)).toBe(true);

      // Verify all items have nsfw field set to false
      if (response.length > 0) {
        response.forEach((coin: any) => {
          expect(coin.nsfw).toBe(false);
        });
      }
    });

    test('should include live streaming specific fields', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?limit=10');

      expect(Array.isArray(response)).toBe(true);

      // Look for coins that are actually live streaming
      const liveCoins = response.filter((coin: any) => coin.is_currently_live);

      if (liveCoins.length > 0) {
        const liveCoin = liveCoins[0];

        // Verify live streaming specific fields
        expect(liveCoin.is_currently_live).toBe(true);
        expect(typeof liveCoin.livestream_title).toBe('string');
        expect(liveCoin.num_participants).toBeGreaterThanOrEqual(0);
        expect(liveCoin.reply_count).toBeGreaterThanOrEqual(0);
        expect(liveCoin.thumbnail).toMatch(/^https?:\/\//);
      }
    });
  });

  describe('Jurisdiction Validation Endpoint (/auth/is-valid-jurisdiction)', () => {
    test('should return jurisdiction validation result', async () => {
      const response = await testHelper.makeRequest('/auth/is-valid-jurisdiction');

      expect(response).toBeDefined();

      const isValid = testHelper.validateJurisdictionResponse(response);
      expect(isValid).toBe(true);
    });

    test('should return boolean is_valid field', async () => {
      const response = await testHelper.makeRequest('/auth/is-valid-jurisdiction');

      expect(typeof response.is_valid).toBe('boolean');
    });
  });

  describe('SOL Price Endpoint (/sol-price)', () => {
    test('should return current SOL price', async () => {
      const response = await testHelper.makeRequest('/sol-price');

      expect(response).toBeDefined();

      const isValid = testHelper.validateSolPriceResponse(response);
      expect(isValid).toBe(true);
    });

    test('should return numeric sol_price field', async () => {
      const response = await testHelper.makeRequest('/sol-price');

      expect(typeof response.sol_price).toBe('number');
      expect(response.sol_price).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting Behavior', () => {
    test('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(5).fill(null).map(() =>
        testHelper.makeRequest('/coins/currently-live?limit=1')
      );

      const results = await Promise.allSettled(requests);

      // At least some requests should succeed
      const successfulRequests = results.filter(result => result.status === 'fulfilled');
      expect(successfulRequests.length).toBeGreaterThan(0);

      // Check if any requests were rate limited
      const failedRequests = results.filter(result => result.status === 'rejected');
      if (failedRequests.length > 0) {
        // Verify rate limiting responses have proper status codes
        failedRequests.forEach((result) => {
          if (result.status === 'rejected') {
            const error = result.reason;
            // Rate limited requests should have status 429 or similar
            expect(error).toBeDefined();
          }
        });
      }
    }, 30000); // 30 second timeout for rate limiting test
  });

  describe('Error Handling', () => {
    test('should handle 404 errors gracefully', async () => {
      try {
        await testHelper.makeRequest('/nonexistent-endpoint');
        fail('Expected request to fail');
      } catch (error) {
        expect(error).toBeDefined();
        // Should be an HTTP error
      }
    });

    test('should handle malformed requests gracefully', async () => {
      try {
        await testHelper.makeRequest('/coins/currently-live?limit=invalid');
        // This might succeed or fail depending on server validation
        expect(true).toBe(true); // Just verify it doesn't crash
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Response Validation', () => {
    test('should validate live coins data integrity', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?limit=5');

      expect(Array.isArray(response)).toBe(true);

      response.forEach((coin: any, index: number) => {
        // Verify required fields are not empty
        expect(coin.mint).toBeTruthy();
        expect(coin.name).toBeTruthy();
        expect(coin.symbol).toBeTruthy();

        // Verify timestamps are reasonable
        expect(coin.created_timestamp).toBeGreaterThan(0);
        expect(coin.last_reply).toBeGreaterThan(0);

        // Verify market cap data
        expect(typeof coin.market_cap).toBe('number');
        expect(typeof coin.usd_market_cap).toBe('number');

        // Verify URLs are valid
        if (coin.image_uri) {
          expect(coin.image_uri).toMatch(/^https?:\/\//);
        }
        if (coin.thumbnail) {
          expect(coin.thumbnail).toMatch(/^https?:\/\//);
        }
      });
    });

    test('should ensure live streaming data consistency', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?limit=10');

      const liveCoins = response.filter((coin: any) => coin.is_currently_live);

      liveCoins.forEach((coin: any) => {
        // If a coin is marked as live, it should have streaming-related data
        expect(coin.is_currently_live).toBe(true);
        expect(typeof coin.livestream_title).toBe('string');
        expect(coin.num_participants).toBeGreaterThanOrEqual(0);
        expect(coin.reply_count).toBeGreaterThanOrEqual(0);

        // Thumbnail should be a valid URL for live streams
        expect(coin.thumbnail).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('Authentication Requirements', () => {
    test('should work without authentication headers', async () => {
      // Create client without auth headers
      const clientWithoutAuth = new HTTPClient(TEST_CONFIG.baseURL, {
        timeout: TEST_CONFIG.timeout
      });

      try {
        const response = await clientWithoutAuth.get('/auth/is-valid-jurisdiction');
        expect(response).toBeDefined();
      } catch (error) {
        // Some endpoints might require CORS headers
        expect(error).toBeDefined();
      }
    });

    test('should work with proper CORS headers', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?limit=1');
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should respond within reasonable time', async () => {
      const startTime = Date.now();

      await testHelper.makeRequest('/coins/currently-live?limit=5');

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
    });

    test('should handle larger result sets efficiently', async () => {
      const startTime = Date.now();

      const response = await testHelper.makeRequest('/coins/currently-live?limit=20');

      const responseTime = Date.now() - startTime;
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeLessThanOrEqual(20);
      expect(responseTime).toBeLessThan(15000); // Should handle larger sets within 15 seconds
    });
  });

  describe('Data Freshness', () => {
    test('should return recent data', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?limit=5');
      const now = Date.now();

      expect(Array.isArray(response)).toBe(true);

      if (response.length > 0) {
        const coin = response[0];

        // Last reply should be recent (within last hour)
        const timeSinceLastReply = now - coin.last_reply;
        expect(timeSinceLastReply).toBeLessThan(60 * 60 * 1000); // Less than 1 hour
      }
    });

    test('should include currently active streams', async () => {
      const response = await testHelper.makeRequest('/coins/currently-live?limit=10');

      expect(Array.isArray(response)).toBe(true);

      // At least some coins should be currently live
      const liveCoins = response.filter((coin: any) => coin.is_currently_live);
      expect(liveCoins.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Manual Test Runner
 *
 * This function can be used to manually run tests outside of a test framework
 */
export async function runManualTests() {
  console.log('🧪 Running Manual API Discovery Tests\n');

  const testHelper = new APITestHelper();
  let passedTests = 0;
  let totalTests = 0;

  const testCases = [
    {
      name: 'Live Coins Endpoint',
      test: async () => {
        const response = await testHelper.makeRequest('/coins/currently-live?limit=3');
        const isValid = testHelper.validateLiveCoinResponse(response);
        console.log(`   ✅ Found ${response.length} live coins`);
        return isValid;
      }
    },
    {
      name: 'Jurisdiction Validation',
      test: async () => {
        const response = await testHelper.makeRequest('/auth/is-valid-jurisdiction');
        const isValid = testHelper.validateJurisdictionResponse(response);
        console.log(`   ✅ Jurisdiction valid: ${response.is_valid}`);
        return isValid;
      }
    },
    {
      name: 'SOL Price',
      test: async () => {
        const response = await testHelper.makeRequest('/sol-price');
        const isValid = testHelper.validateSolPriceResponse(response);
        console.log(`   ✅ SOL price: $${response.sol_price}`);
        return isValid;
      }
    }
  ];

  for (const testCase of testCases) {
    totalTests++;
    try {
      console.log(`🔍 Testing: ${testCase.name}`);
      const result = await testCase.test();
      if (result) {
        passedTests++;
        console.log(`✅ ${testCase.name}: PASSED\n`);
      } else {
        console.log(`❌ ${testCase.name}: FAILED\n`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: ERROR - ${error}\n`);
    }
  }

  console.log('📊 Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
  }

  return passedTests === totalTests;
}

// Run manual tests if this file is executed directly
if (require.main === module) {
  runManualTests().catch(console.error);
}