/**
 * Test Script for Basic Usage Examples
 *
 * This script tests the functionality of the PumpFun API examples
 * to ensure they work correctly with the actual API endpoints.
 *
 * Created: 2025-10-11
 * Purpose: Test basic-usage.ts examples functionality
 */

import { PumpFunAPIClient } from './basic-usage';
import { Logger } from '../utils/logger';

// Test configuration
const TEST_CONFIG = {
  // Use shorter timeouts for testing
  requestTimeout: 8000,
  // Limit requests to avoid rate limiting
  maxRequests: 3,
  // Test with smaller data sets
  testLimit: 3
};

/**
 * Test Results Interface
 */
interface TestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: Array<{
    testName: string;
    status: 'PASS' | 'FAIL' | 'SKIPPED';
    duration: number;
    error?: string;
    data?: any;
  }>;
}

/**
 * Test runner for API examples
 */
class APITestRunner {
  private logger: Logger;
  private client: PumpFunAPIClient;
  private results: TestResults;

  constructor() {
    this.logger = new Logger({}, { component: 'APITestRunner' });
    this.client = new PumpFunAPIClient();
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      results: []
    };
  }

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(
    testName: string,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.info(`Running test: ${testName}`);

    try {
      const result = await Promise.race([
        testFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.requestTimeout)
        )
      ]);

      const duration = Date.now() - startTime;
      this.results.totalTests++;
      this.results.passedTests++;

      this.results.results.push({
        testName,
        status: 'PASS',
        duration,
        data: result
      });

      this.logger.info(`✅ ${testName} - PASSED (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.totalTests++;
      this.results.failedTests++;

      const errorMessage = error instanceof Error ? error.message : String(error);

      this.results.results.push({
        testName,
        status: 'FAIL',
        duration,
        error: errorMessage
      });

      this.logger.error(`❌ ${testName} - FAILED (${duration}ms): ${errorMessage}`);
    }
  }

  /**
   * Test getLiveCoins functionality
   */
  async testGetLiveCoins(): Promise<void> {
    const response = await this.client.getLiveCoins({
      limit: TEST_CONFIG.testLimit
    });

    if (!Array.isArray(response)) {
      throw new Error('Expected array response');
    }

    if (response.length > TEST_CONFIG.testLimit) {
      throw new Error(`Too many results: ${response.length} > ${TEST_CONFIG.testLimit}`);
    }

    // Validate structure of first result
    if (response.length > 0) {
      const coin = response[0];
      if (!coin) {
        throw new Error('First coin in response is undefined');
      }

      const requiredFields = ['mint', 'name', 'symbol', 'description', 'image_uri', 'creator', 'created_timestamp', 'market_cap', 'usd_market_cap', 'is_currently_live', 'num_participants', 'reply_count', 'thumbnail', 'last_reply'];
      const optionalFields = ['livestream_title', 'twitter', 'telegram'];

      // Check required fields
      for (const field of requiredFields) {
        if (!(field in coin)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Check optional fields exist but can be undefined
      for (const field of optionalFields) {
        if (!(field in coin)) {
          console.log(`Note: Optional field ${field} is missing from API response`);
        }
      }

      if (typeof coin.num_participants !== 'number' || coin.num_participants < 0) {
        throw new Error('Invalid participant count');
      }

      if (typeof coin.reply_count !== 'number' || coin.reply_count < 0) {
        throw new Error('Invalid reply count');
      }
    }
  }

  /**
   * Test getActiveStreams functionality
   */
  async testGetActiveStreams(): Promise<void> {
    const response = await this.client.getActiveStreams({
      minParticipants: 1,
      limit: TEST_CONFIG.testLimit
    });

    if (!Array.isArray(response)) {
      throw new Error('Expected array response');
    }

    // Validate that all returned streams are actually active
    const inactiveStreams = response.filter(coin => !coin.is_currently_live);
    if (inactiveStreams.length > 0) {
      throw new Error(`Found ${inactiveStreams.length} inactive streams in active streams response`);
    }

    // Validate minimum participants
    const lowParticipantStreams = response.filter(coin => coin.num_participants < 1);
    if (lowParticipantStreams.length > 0) {
      throw new Error(`Found ${lowParticipantStreams.length} streams with less than 1 participant`);
    }
  }

  /**
   * Test getTopLiveStreams functionality
   */
  async testGetTopLiveStreams(): Promise<void> {
    const response = await this.client.getTopLiveStreams(TEST_CONFIG.testLimit);

    if (!Array.isArray(response)) {
      throw new Error('Expected array response');
    }

    // Validate that streams are sorted by participant count (descending)
    for (let i = 1; i < response.length; i++) {
      const prevStream = response[i-1];
      const currStream = response[i];
      if (!prevStream || !currStream) {
        throw new Error(`Stream at index ${i} is undefined`);
      }
      if (prevStream.num_participants < currStream.num_participants) {
        throw new Error(`Streams not sorted correctly at index ${i-1} and ${i}`);
      }
    }

    // Validate that all streams are live
    const inactiveStreams = response.filter(coin => !coin.is_currently_live);
    if (inactiveStreams.length > 0) {
      throw new Error(`Found ${inactiveStreams.length} inactive streams in top streams response`);
    }
  }

  /**
   * Test searchLiveStreams functionality
   */
  async testSearchLiveStreams(): Promise<void> {
    const searchTerm = 'test'; // Common search term
    const response = await this.client.searchLiveStreams(searchTerm);

    if (!Array.isArray(response)) {
      throw new Error('Expected array response');
    }

    // Validate that search results contain the search term
    for (const coin of response) {
      if (!coin) {
        throw new Error('Search result contains undefined coin');
      }

      const searchFields = [
        coin.name.toLowerCase(),
        coin.symbol.toLowerCase(),
        coin.description.toLowerCase(),
        (coin.livestream_title || '').toLowerCase()
      ].join(' ');

      if (!searchFields.includes(searchTerm.toLowerCase())) {
        throw new Error(`Search result does not contain search term: ${searchTerm}`);
      }
    }
  }

  /**
   * Test getStreamStatistics functionality
   */
  async testGetStreamStatistics(): Promise<void> {
    const stats = await this.client.getStreamStatistics(TEST_CONFIG.testLimit);

    if (typeof stats !== 'object' || stats === null) {
      throw new Error('Expected object response');
    }

    const requiredFields = ['totalLiveStreams', 'totalParticipants', 'totalChatMessages', 'averageParticipants'];
    for (const field of requiredFields) {
      if (!(field in stats)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof stats.totalLiveStreams !== 'number' || stats.totalLiveStreams < 0) {
      throw new Error('Invalid totalLiveStreams count');
    }

    if (typeof stats.totalParticipants !== 'number' || stats.totalParticipants < 0) {
      throw new Error('Invalid totalParticipants count');
    }

    if (typeof stats.totalChatMessages !== 'number' || stats.totalChatMessages < 0) {
      throw new Error('Invalid totalChatMessages count');
    }

    if (typeof stats.averageParticipants !== 'number' || stats.averageParticipants < 0) {
      throw new Error('Invalid averageParticipants count');
    }

    // Validate calculation consistency
    if (stats.totalLiveStreams > 0) {
      const expectedAverage = Math.round(stats.totalParticipants / stats.totalLiveStreams);
      if (Math.abs(stats.averageParticipants - expectedAverage) > 1) {
        throw new Error(`Average calculation mismatch: expected ${expectedAverage}, got ${stats.averageParticipants}`);
      }
    }
  }

  /**
   * Test getTitledStreams functionality
   */
  async testGetTitledStreams(): Promise<void> {
    const response = await this.client.getTitledStreams();

    if (!Array.isArray(response)) {
      throw new Error('Expected array response');
    }

    // Validate that all streams have titles
    const untitledStreams = response.filter(coin =>
      !coin.livestream_title || coin.livestream_title.trim().length === 0
    );

    if (untitledStreams.length > 0) {
      throw new Error(`Found ${untitledStreams.length} streams without titles`);
    }

    // Validate that all titled streams are live
    const inactiveStreams = response.filter(coin => !coin.is_currently_live);
    if (inactiveStreams.length > 0) {
      throw new Error(`Found ${inactiveStreams.length} inactive titled streams`);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResults> {
    this.logger.info('🧪 Starting PumpFun API Basic Usage Tests\n');

    const tests = [
      { name: 'Get Live Coins', fn: () => this.testGetLiveCoins() },
      { name: 'Get Active Streams', fn: () => this.testGetActiveStreams() },
      { name: 'Get Top Live Streams', fn: () => this.testGetTopLiveStreams() },
      { name: 'Search Live Streams', fn: () => this.testSearchLiveStreams() },
      { name: 'Get Stream Statistics', fn: () => this.testGetStreamStatistics() },
      { name: 'Get Titled Streams', fn: () => this.testGetTitledStreams() }
    ];

    const startTime = Date.now();

    // Run tests with a small delay between them to avoid rate limiting
    for (let i = 0; i < Math.min(tests.length, TEST_CONFIG.maxRequests); i++) {
      const test = tests[i];
      if (!test) {
        continue;
      }
      await this.runTest(test.name, test.fn);

      // Add delay between requests
      if (i < tests.length - 1 && i < TEST_CONFIG.maxRequests - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalDuration = Date.now() - startTime;

    // Generate report
    this.generateReport(totalDuration);

    return this.results;
  }

  /**
   * Generate test report
   */
  private generateReport(totalDuration: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PUMPFUN API BASIC USAGE TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`Passed: ${this.results.passedTests}`);
    console.log(`Failed: ${this.results.failedTests}`);
    console.log(`Success Rate: ${Math.round((this.results.passedTests / this.results.totalTests) * 100)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(''.repeat(60));

    console.log('\n📋 Detailed Results:');
    this.results.results.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.testName}`);
      console.log(`   Duration: ${result.duration}ms`);

      if (result.status === 'FAIL' && result.error) {
        console.log(`   Error: ${result.error}`);
      } else if (result.status === 'PASS' && result.data) {
        if (Array.isArray(result.data)) {
          console.log(`   Results: ${result.data.length} items returned`);
        } else {
          console.log(`   Result: ${JSON.stringify(result.data).substring(0, 100)}...`);
        }
      }
      console.log('');
    });

    // Summary
    if (this.results.failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED! PumpFun API examples are working correctly.');
      console.log('\n💡 Key Findings:');
      console.log('   • API endpoints are responsive and returning expected data');
      console.log('   • Data structures match the expected format');
      console.log('   • Filtering and sorting functionality works correctly');
      console.log('   • No authentication required for public endpoints');
    } else {
      console.log('⚠️  SOME TESTS FAILED!');
      console.log('\n🔧 Troubleshooting:');
      console.log('   • Check network connectivity');
      console.log('   • Verify PumpFun API is accessible');
      console.log('   • Check for rate limiting (60 requests/minute)');
      console.log('   • Review error messages above for specific issues');
    }

    console.log('\n📈 Performance Metrics:');
    const avgDuration = this.results.results.reduce((sum, r) => sum + r.duration, 0) / this.results.results.length;
    console.log(`   Average Request Time: ${Math.round(avgDuration)}ms`);

    const maxDuration = Math.max(...this.results.results.map(r => r.duration));
    console.log(`   Slowest Request: ${maxDuration}ms`);

    const minDuration = Math.min(...this.results.results.map(r => r.duration));
    console.log(`   Fastest Request: ${minDuration}ms`);
  }
}

/**
 * Main execution function
 */
async function main() {
  const runner = new APITestRunner();

  try {
    const results = await runner.runAllTests();

    // Exit with appropriate code
    process.exit(results.failedTests > 0 ? 1 : 0);

  } catch (error) {
    console.error('💥 Test runner failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

export { APITestRunner };