/**
 * Basic Usage Examples for PumpFun API Discovery
 *
 * This file demonstrates how to use the discovered PumpFun API endpoints
 * for accessing live streaming data and related information.
 */

import { HTTPClient } from '../utils/http-client';
import { Logger } from '../utils/logger';

// Basic types based on discovered API responses
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
  livestream_title?: string;
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
 * Basic PumpFun API Client
 * Demonstrates usage of discovered endpoints
 */
class PumpFunAPIClient {
  private httpClient: HTTPClient;
  private logger: Logger;
  private baseURL = 'https://frontend-api-v3.pump.fun';

  constructor() {
    this.httpClient = new HTTPClient(this.baseURL, {
      timeout: 10000,
      headers: {
        'Origin': 'https://pump.fun',
        'Referer': 'https://pump.fun/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
      }
    });

    this.logger = new Logger({}, { component: 'PumpFunAPIClient' });
  }

  /**
   * Get currently live streaming coins
   */
  async getLiveCoins(options: {
    offset?: number;
    limit?: number;
    includeNsfw?: boolean;
  } = {}): Promise<LiveCoin[]> {
    this.logger.info('Fetching live coins...');

    const params = new URLSearchParams({
      offset: String(options.offset || 0),
      limit: String(options.limit || 10),
      sort: 'currently_live',
      order: 'DESC',
      includeNsfw: String(options.includeNsfw || false)
    });

    try {
      const response = await this.httpClient.get(`/coins/currently-live?${params}`);

      if (response && Array.isArray(response)) {
        this.logger.info(`Successfully fetched ${response.length} live coins`);
        return response as LiveCoin[];
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      this.logger.error('Failed to fetch live coins:', error);
      throw error;
    }
  }

  /**
   * Get currently active streams with participants
   */
  async getActiveStreams(options: {
    minParticipants?: number;
    limit?: number;
  } = {}): Promise<LiveCoin[]> {
    this.logger.info('Fetching active streams...');

    const liveCoins = await this.getLiveCoins(options);

    const activeStreams = liveCoins.filter(coin =>
      coin.is_currently_live &&
      coin.num_participants >= (options.minParticipants || 1)
    );

    this.logger.info(`Found ${activeStreams.length} active streams`);
    return activeStreams;
  }

  /**
   * Get top live streams by participant count
   */
  async getTopLiveStreams(limit: number = 10): Promise<LiveCoin[]> {
    this.logger.info(`Fetching top ${limit} live streams...`);

    const liveCoins = await this.getLiveCoins({ limit });

    const topStreams = liveCoins
      .filter(coin => coin.is_currently_live)
      .sort((a, b) => b.num_participants - a.num_participants)
      .slice(0, limit);

    this.logger.info(`Retrieved top ${topStreams.length} live streams`);
    return topStreams;
  }

  /**
   * Get streams with titles (likely more active)
   */
  async getTitledStreams(): Promise<LiveCoin[]> {
    this.logger.info('Fetching titled streams...');

    const liveCoins = await this.getLiveCoins({ limit: 50 });

    const titledStreams = liveCoins.filter(coin =>
      coin.is_currently_live &&
      coin.livestream_title &&
      coin.livestream_title.trim().length > 0
    );

    this.logger.info(`Found ${titledStreams.length} titled streams`);
    return titledStreams;
  }

  /**
   * Validate user jurisdiction
   */
  async validateJurisdiction(): Promise<boolean> {
    this.logger.info('Validating jurisdiction...');

    try {
      const response = await this.httpClient.get('/auth/is-valid-jurisdiction');

      if (response && typeof response === 'object' && 'is_valid' in response) {
        const isValid = (response as JurisdictionResponse).is_valid;
        this.logger.info(`Jurisdiction validation result: ${isValid}`);
        return isValid;
      } else {
        throw new Error('Invalid jurisdiction response format');
      }
    } catch (error) {
      this.logger.error('Failed to validate jurisdiction:', error);
      throw error;
    }
  }

  /**
   * Get current SOL price
   */
  async getSolPrice(): Promise<number> {
    this.logger.info('Fetching SOL price...');

    try {
      const response = await this.httpClient.get('/sol-price');

      if (response && typeof response === 'object' && 'sol_price' in response) {
        const price = (response as SolPriceResponse).sol_price;
        this.logger.info(`Current SOL price: $${price}`);
        return price;
      } else {
        throw new Error('Invalid SOL price response format');
      }
    } catch (error) {
      this.logger.error('Failed to fetch SOL price:', error);
      throw error;
    }
  }

  /**
   * Search live streams by keyword
   */
  async searchLiveStreams(keyword: string): Promise<LiveCoin[]> {
    this.logger.info(`Searching live streams for keyword: "${keyword}"`);

    const liveCoins = await this.getLiveCoins({ limit: 100 });

    const searchResults = liveCoins.filter(coin =>
      coin.is_currently_live && (
        coin.name.toLowerCase().includes(keyword.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(keyword.toLowerCase()) ||
        coin.description.toLowerCase().includes(keyword.toLowerCase()) ||
        (coin.livestream_title && coin.livestream_title.toLowerCase().includes(keyword.toLowerCase()))
      )
    );

    this.logger.info(`Found ${searchResults.length} streams matching "${keyword}"`);
    return searchResults;
  }

  /**
   * Get stream statistics
   */
  async getStreamStatistics(limit: number = 50): Promise<{
    totalLiveStreams: number;
    totalParticipants: number;
    totalChatMessages: number;
    averageParticipants: number;
    topStream: LiveCoin | null;
  }> {
    this.logger.info('Calculating stream statistics...');

    const liveCoins = await this.getLiveCoins({ limit });
    const activeStreams = liveCoins.filter(coin => coin.is_currently_live);

    const stats = {
      totalLiveStreams: activeStreams.length,
      totalParticipants: activeStreams.reduce((sum, coin) => sum + coin.num_participants, 0),
      totalChatMessages: activeStreams.reduce((sum, coin) => sum + coin.reply_count, 0),
      averageParticipants: 0,
      topStream: null as LiveCoin | null
    };

    if (activeStreams.length > 0) {
      stats.averageParticipants = Math.round(stats.totalParticipants / activeStreams.length);
      stats.topStream = activeStreams.reduce((top, current) =>
        current.num_participants > top.num_participants ? current : top
      );
    }

    this.logger.info(`Stream statistics calculated: ${stats.totalLiveStreams} live streams, ${stats.totalParticipants} total participants`);
    return stats;
  }
}

/**
 * Example usage functions
 */

/**
 * Example 1: Get currently live streaming coins
 */
async function example1_GetLiveCoins() {
  console.log('\n🔴 Example 1: Get Currently Live Streaming Coins');
  console.log('=' .repeat(50));

  const client = new PumpFunAPIClient();

  try {
    const liveCoins = await client.getLiveCoins({ limit: 5 });

    console.log(`Found ${liveCoins.length} live streaming coins:\n`);

    liveCoins.forEach((coin, index) => {
      console.log(`${index + 1}. ${coin.name} (${coin.symbol})`);
      console.log(`   📺 Stream: ${coin.livestream_title || 'No Title'}`);
      console.log(`   👥 Participants: ${coin.num_participants}`);
      console.log(`   💬 Chat Messages: ${coin.reply_count}`);
      console.log(`   💰 Market Cap: $${coin.usd_market_cap.toFixed(2)}`);
      console.log(`   🖼️  Thumbnail: ${coin.thumbnail}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 2: Get top live streams by participant count
 */
async function example2_GetTopStreams() {
  console.log('\n🏆 Example 2: Get Top Live Streams by Participants');
  console.log('=' .repeat(50));

  const client = new PumpFunAPIClient();

  try {
    const topStreams = await client.getTopLiveStreams(5);

    console.log('Top 5 Live Streams by Participant Count:\n');

    topStreams.forEach((stream, index) => {
      console.log(`${index + 1}. ${stream.name} (${stream.symbol})`);
      console.log(`   👥 Participants: ${stream.num_participants}`);
      console.log(`   💬 Chat Activity: ${stream.reply_count} messages`);
      console.log(`   📺 Title: "${stream.livestream_title || 'No Title'}"`);
      console.log(`   💎 Market Cap: $${stream.usd_market_cap.toFixed(2)}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 3: Search for specific tokens
 */
async function example3_SearchStreams() {
  console.log('\n🔍 Example 3: Search Live Streams by Keyword');
  console.log('=' .repeat(50));

  const client = new PumpFunAPIClient();

  try {
    const searchTerm = 'pump'; // You can change this to any keyword
    const results = await client.searchLiveStreams(searchTerm);

    console.log(`Search Results for "${searchTerm}":\n`);

    if (results.length === 0) {
      console.log('No live streams found matching your search term.');
    } else {
      results.forEach((stream, index) => {
        console.log(`${index + 1}. ${stream.name} (${stream.symbol})`);
        console.log(`   📺 "${stream.livestream_title || 'No Title'}"`);
        console.log(`   👥 ${stream.num_participants} participants`);
        console.log(`   📝 ${stream.description.substring(0, 100)}...`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 4: Get overall statistics
 */
async function example4_GetStatistics() {
  console.log('\n📊 Example 4: Live Stream Statistics');
  console.log('=' .repeat(50));

  const client = new PumpFunAPIClient();

  try {
    const stats = await client.getStreamStatistics();

    console.log('Current Live Stream Statistics:');
    console.log(`   🔴 Total Live Streams: ${stats.totalLiveStreams}`);
    console.log(`   👥 Total Participants: ${stats.totalParticipants}`);
    console.log(`   💬 Total Chat Messages: ${stats.totalChatMessages}`);
    console.log(`   📊 Average Participants per Stream: ${stats.averageParticipants}`);

    if (stats.topStream) {
      console.log('\n🏆 Top Performing Stream:');
      console.log(`   🎯 ${stats.topStream.name} (${stats.topStream.symbol})`);
      console.log(`   👥 ${stats.topStream.num_participants} participants`);
      console.log(`   💬 ${stats.topStream.reply_count} chat messages`);
      console.log(`   📺 "${stats.topStream.livestream_title || 'No Title'}"`);
    }

    console.log('');

    // Get additional info
    const solPrice = await client.getSolPrice();
    const isJurisdictionValid = await client.validateJurisdiction();

    console.log('Additional Information:');
    console.log(`   💰 SOL Price: $${solPrice.toFixed(2)}`);
    console.log(`   🌍 Jurisdiction Valid: ${isJurisdictionValid ? '✅ Yes' : '❌ No'}`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 5: Monitor specific tokens
 */
async function example5_MonitorTokens() {
  console.log('\n👀 Example 5: Monitor Specific Token Patterns');
  console.log('=' .repeat(50));

  const client = new PumpFunAPIClient();

  try {
    const titledStreams = await client.getTitledStreams();

    console.log('Live Streams with Titles (likely more active):\n');

    titledStreams.slice(0, 3).forEach((stream, index) => {
      console.log(`${index + 1}. ${stream.name} (${stream.symbol})`);
      console.log(`   📺 Title: "${stream.livestream_title}"`);
      console.log(`   👥 ${stream.num_participants} viewers`);
      console.log(`   💬 ${stream.reply_count} chat messages`);
      console.log(`   ⏰ Last activity: ${new Date(stream.last_reply).toLocaleString()}`);
      console.log(`   🖼️  Thumbnail: ${stream.thumbnail}`);
      console.log('');
    });

    if (titledStreams.length > 3) {
      console.log(`... and ${titledStreams.length - 3} more titled streams`);
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Main execution function - run all examples
 */
async function runAllExamples() {
  console.log('🚀 PumpFun API Discovery - Basic Usage Examples');
  console.log('=' .repeat(60));
  console.log('Demonstrating discovered API endpoints...\n');

  try {
    await example1_GetLiveCoins();
    await example2_GetTopStreams();
    await example3_SearchStreams();
    await example4_GetStatistics();
    await example5_MonitorTokens();

    console.log('✅ All examples completed successfully!');
    console.log('\n💡 Key Insights:');
    console.log('   • The /coins/currently-live endpoint returns tokens with active live streams');
    console.log('   • Stream data includes participant counts, chat activity, and thumbnails');
    console.log('   • No authentication required for these public endpoints');
    console.log('   • Rate limiting is in effect (60 requests/minute for live data)');
    console.log('   • NATS WebSocket infrastructure handles real-time updates');

  } catch (error) {
    console.error('\n💥 Some examples failed:', error instanceof Error ? error.message : error);
  }
}

// Export functions for individual testing
export {
  PumpFunAPIClient,
  example1_GetLiveCoins,
  example2_GetTopStreams,
  example3_SearchStreams,
  example4_GetStatistics,
  example5_MonitorTokens,
  runAllExamples
};

// Run all examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}