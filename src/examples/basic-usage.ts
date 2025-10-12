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

// LiveKit Video Stream Types (discovered from video stream analysis)
interface LiveStreamInfo {
  id: number;
  supabaseId: number;
  mintId: string;
  creatorAddress: string;
  streamStartTimestamp: number;
  numParticipants: number;
  maxParticipants: number;
  isLive: boolean;
  downrankScore: number;
  title: string;
  mode: 'interactive' | 'broadcast';
}

interface LiveKitRegion {
  region: string;
  url: string;
  distance: string;
}

interface LiveKitConnectionInfo {
  regions: LiveKitRegion[];
  primaryServer: string;
  roomName: string;
  mintId: string;
  streamId: number;
  websocketUrl: string;
  requiresAuthentication: boolean;
}

interface VideoStreamElement {
  className: string;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
  isLocalParticipant: boolean;
  source: 'camera' | 'screen' | 'microphone';
  orientation: 'landscape' | 'portrait';
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
  private liveStreamAPIURL = 'https://livestream-api.pump.fun';

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

  // ==================== VIDEO STREAM DISCOVERY METHODS ====================

  /**
   * Get detailed live stream information for a specific coin
   * Uses the livestream-api to get WebRTC/LiveKit connection details
   */
  async getLiveStreamInfo(mintId: string): Promise<LiveStreamInfo | null> {
    this.logger.info(`Fetching live stream info for mint: ${mintId}`);

    try {
      const response = await this.httpClient.get(`${this.liveStreamAPIURL}/livestream?mintId=${mintId}`);

      if (response && typeof response === 'object' && 'id' in response) {
        const streamInfo = response as LiveStreamInfo;
        this.logger.info(`Successfully retrieved stream info: ${streamInfo.isLive ? 'LIVE' : 'OFFLINE'}`);
        return streamInfo;
      } else {
        this.logger.info(`No active stream found for mint: ${mintId}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch live stream info for ${mintId}:`, error);
      throw error;
    }
  }

  /**
   * Get LiveKit connection information for a stream
   * Returns the WebSocket URLs and room details needed for WebRTC connection
   */
  async getLiveKitConnectionInfo(mintId: string): Promise<LiveKitConnectionInfo | null> {
    this.logger.info(`Fetching LiveKit connection info for mint: ${mintId}`);

    try {
      // First get the stream info to validate it exists and get the stream ID
      const streamInfo = await this.getLiveStreamInfo(mintId);
      if (!streamInfo) {
        return null;
      }

      // LiveKit regions (discovered from network analysis)
      const liveKitRegions: LiveKitRegion[] = [
        {
          region: 'ophoenix1b',
          url: 'https://pump-prod-tg2x8veh.ophoenix1b.production.livekit.cloud',
          distance: '1630067'
        },
        {
          region: 'ochicago1b',
          url: 'https://pump-prod-tg2x8veh.ochicago1b.production.livekit.cloud',
          distance: '2820890'
        },
        {
          region: 'oashburn1b',
          url: 'https://pump-prod-tg2x8veh.oashburn1b.production.livekit.cloud',
          distance: '3727319'
        }
      ];

      const connectionInfo: LiveKitConnectionInfo = {
        regions: liveKitRegions,
        primaryServer: 'pump-prod-tg2x8veh.livekit.cloud',
        roomName: `${mintId}:${streamInfo.id}`,
        mintId: mintId,
        streamId: streamInfo.id,
        websocketUrl: `wss://pump-prod-tg2x8veh.ophoenix1b.production.livekit.cloud`,
        requiresAuthentication: true
      };

      this.logger.info(`LiveKit connection info prepared for room: ${connectionInfo.roomName}`);
      return connectionInfo;

    } catch (error) {
      this.logger.error(`Failed to get LiveKit connection info for ${mintId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a creator is approved for streaming
   */
  async isApprovedCreator(mintId: string): Promise<boolean> {
    this.logger.info(`Checking creator approval for mint: ${mintId}`);

    try {
      const response = await this.httpClient.get(`${this.liveStreamAPIURL}/livestream/is-approved-creator?mintId=${mintId}`);

      // The API returns 304 for cached responses, 200 for fresh data
      // Both indicate the creator exists and is approved
      this.logger.info(`Creator approval status for ${mintId}: Approved`);
      return true;
    } catch (error) {
      this.logger.error(`Creator approval check failed for ${mintId}:`, error);
      return false;
    }
  }

  /**
   * Get stream clips for a coin
   */
  async getStreamClips(mintId: string, clipType: 'COMPLETE' | 'HIGHLIGHT' = 'COMPLETE', limit: number = 20): Promise<any[]> {
    this.logger.info(`Fetching ${clipType} clips for mint: ${mintId}`);

    try {
      const response = await this.httpClient.get(
        `${this.liveStreamAPIURL}/clips/${mintId}?limit=${limit}&clipType=${clipType}`
      );

      if (Array.isArray(response)) {
        this.logger.info(`Retrieved ${response.length} ${clipType} clips for ${mintId}`);
        return response;
      } else {
        this.logger.info(`No ${clipType} clips found for ${mintId}`);
        return [];
      }
    } catch (error) {
      this.logger.error(`Failed to fetch clips for ${mintId}:`, error);
      return [];
    }
  }

  /**
   * Join a live stream (simulate the join request)
   */
  async joinLiveStream(mintId: string): Promise<{ success: boolean; message: string }> {
    this.logger.info(`Attempting to join live stream for mint: ${mintId}`);

    try {
      const response = await this.httpClient.post(`${this.liveStreamAPIURL}/livestream/join`, {
        mintId: mintId
      });

      this.logger.info(`Successfully joined stream for ${mintId}`);
      return {
        success: true,
        message: `Joined live stream for ${mintId}`
      };
    } catch (error) {
      this.logger.error(`Failed to join stream for ${mintId}:`, error);
      return {
        success: false,
        message: `Failed to join stream: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get comprehensive video stream analysis for a coin
   * Combines all video stream discovery methods
   */
  async getVideoStreamAnalysis(mintId: string): Promise<{
    hasActiveStream: boolean;
    streamInfo: LiveStreamInfo | null;
    liveKitConnection: LiveKitConnectionInfo | null;
    isApprovedCreator: boolean;
    availableClips: {
      complete: any[];
      highlight: any[];
    };
    canJoin: boolean;
  }> {
    this.logger.info(`Performing comprehensive video stream analysis for: ${mintId}`);

    const analysis = {
      hasActiveStream: false,
      streamInfo: null as LiveStreamInfo | null,
      liveKitConnection: null as LiveKitConnectionInfo | null,
      isApprovedCreator: false,
      availableClips: {
        complete: [] as any[],
        highlight: [] as any[]
      },
      canJoin: false
    };

    try {
      // Check if creator is approved
      analysis.isApprovedCreator = await this.isApprovedCreator(mintId);

      // Get stream info
      analysis.streamInfo = await this.getLiveStreamInfo(mintId);
      analysis.hasActiveStream = analysis.streamInfo?.isLive || false;

      // Get LiveKit connection info if stream is active
      if (analysis.hasActiveStream) {
        analysis.liveKitConnection = await this.getLiveKitConnectionInfo(mintId);
      }

      // Get available clips
      analysis.availableClips.complete = await this.getStreamClips(mintId, 'COMPLETE');
      analysis.availableClips.highlight = await this.getStreamClips(mintId, 'HIGHLIGHT');

      // Test join capability
      if (analysis.hasActiveStream) {
        const joinResult = await this.joinLiveStream(mintId);
        analysis.canJoin = joinResult.success;
      }

      this.logger.info(`Video stream analysis completed for ${mintId}: ${analysis.hasActiveStream ? 'ACTIVE' : 'INACTIVE'}`);
      return analysis;

    } catch (error) {
      this.logger.error(`Video stream analysis failed for ${mintId}:`, error);
      throw error;
    }
  }

  // ==================== ORIGINAL LIVE COIN METHODS ====================

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

// ==================== VIDEO STREAM DISCOVERY EXAMPLES ====================

/**
 * Example 6: Analyze video stream sources for a specific coin
 */
async function example6_VideoStreamAnalysis() {
  console.log('\n🎥 Example 6: Video Stream Source Analysis');
  console.log('='.repeat(50));

  const client = new PumpFunAPIClient();

  // Use a known live coin mint (you can replace with any live coin)
  const testMintId = '4F21SgBnms5bwQSjuc11ZF8ruSd9vJp6qu44rWLqpump'; // I AM PILL

  try {
    console.log(`Analyzing video stream sources for: ${testMintId}\n`);

    const analysis = await client.getVideoStreamAnalysis(testMintId);

    console.log('📊 Video Stream Analysis Results:');
    console.log(`   🔴 Active Stream: ${analysis.hasActiveStream ? 'YES' : 'NO'}`);
    console.log(`   ✅ Creator Approved: ${analysis.isApprovedCreator ? 'YES' : 'NO'}`);
    console.log(`   🔗 Can Join Stream: ${analysis.canJoin ? 'YES' : 'NO'}`);

    if (analysis.streamInfo) {
      console.log('\n🎬 Stream Information:');
      console.log(`   📺 Stream ID: ${analysis.streamInfo.id}`);
      console.log(`   👤 Creator: ${analysis.streamInfo.creatorAddress}`);
      console.log(`   👥 Participants: ${analysis.streamInfo.numParticipants}`);
      console.log(`   🎯 Stream Mode: ${analysis.streamInfo.mode}`);
      console.log(`   ⏰ Started: ${new Date(analysis.streamInfo.streamStartTimestamp).toLocaleString()}`);
      console.log(`   📊 Downrank Score: ${analysis.streamInfo.downrankScore}`);
    }

    if (analysis.liveKitConnection) {
      console.log('\n🔗 LiveKit Connection Details:');
      console.log(`   🌐 Primary Server: ${analysis.liveKitConnection.primaryServer}`);
      console.log(`   🏠 Room Name: ${analysis.liveKitConnection.roomName}`);
      console.log(`   🔌 WebSocket URL: ${analysis.liveKitConnection.websocketUrl}`);
      console.log(`   🔐 Auth Required: ${analysis.liveKitConnection.requiresAuthentication ? 'YES' : 'NO'}`);

      console.log('\n🌍 Available Regions:');
      analysis.liveKitConnection.regions.forEach((region, index) => {
        console.log(`   ${index + 1}. ${region.region} - ${region.url} (distance: ${region.distance})`);
      });
    }

    console.log('\n📹 Available Clips:');
    console.log(`   🎬 Complete Clips: ${analysis.availableClips.complete.length}`);
    console.log(`   ⭐ Highlight Clips: ${analysis.availableClips.highlight.length}`);

    if (analysis.availableClips.complete.length > 0) {
      console.log('\n📼 Recent Complete Clips:');
      analysis.availableClips.complete.slice(0, 3).forEach((clip, index) => {
        console.log(`   ${index + 1}. Clip ID: ${clip.id || 'N/A'}`);
        console.log(`      Duration: ${clip.duration || 'N/A'}s`);
        console.log(`      Created: ${clip.created_at ? new Date(clip.created_at).toLocaleString() : 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 7: Get LiveKit connection info for multiple streams
 */
async function example7_LiveKitConnectionDemo() {
  console.log('\n🔌 Example 7: LiveKit Connection Discovery');
  console.log('='.repeat(50));

  const client = new PumpFunAPIClient();

  try {
    // Get some currently live streams
    const liveStreams = await client.getLiveCoins({ limit: 3 });

    if (liveStreams.length === 0) {
      console.log('No live streams found to analyze.');
      return;
    }

    console.log(`Analyzing LiveKit connections for ${liveStreams.length} live streams:\n`);

    for (let i = 0; i < Math.min(liveStreams.length, 2); i++) {
      const stream = liveStreams[i];
      if (!stream) continue;
      console.log(`${i + 1}. ${stream.name} (${stream.symbol})`);
      console.log(`   🔗 Mint: ${stream.mint}`);
      console.log(`   👥 Participants: ${stream.num_participants}`);

      try {
        const connectionInfo = await client.getLiveKitConnectionInfo(stream.mint);

        if (connectionInfo) {
          console.log(`   🏠 LiveKit Room: ${connectionInfo.roomName}`);
          console.log(`   🌐 Optimal Region: ${connectionInfo.regions[0]?.region || 'N/A'}`);
          console.log(`   🔌 WebSocket: ${connectionInfo.websocketUrl}`);
          console.log(`   ✅ Connection Ready: YES`);
        } else {
          console.log(`   ❌ No LiveKit connection available`);
        }
      } catch (connError) {
        console.log(`   ❌ Connection failed: ${connError instanceof Error ? connError.message : 'Unknown error'}`);
      }

      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 8: Stream clips analysis
 */
async function example8_StreamClipsAnalysis() {
  console.log('\n📼 Example 8: Stream Clips Analysis');
  console.log('='.repeat(50));

  const client = new PumpFunAPIClient();

  try {
    // Get a live stream with some activity
    const activeStreams = await client.getActiveStreams({ minParticipants: 1, limit: 2 });

    if (activeStreams.length === 0) {
      console.log('No active streams found for clips analysis.');
      return;
    }

    const targetStream = activeStreams[0];
    if (!targetStream) {
      console.log('No valid target stream found for clips analysis.');
      return;
    }
    console.log(`Analyzing clips for: ${targetStream.name} (${targetStream.symbol})`);
    console.log(`🔗 Mint: ${targetStream.mint}\n`);

    // Get complete clips
    const completeClips = await client.getStreamClips(targetStream.mint, 'COMPLETE', 10);
    console.log(`📹 Complete Clips Found: ${completeClips.length}`);

    if (completeClips.length > 0) {
      console.log('\n📼 Recent Complete Clips:');
      completeClips.slice(0, 3).forEach((clip, index) => {
        console.log(`   ${index + 1}. Clip ${clip.id || 'N/A'}`);
        console.log(`      📊 Views: ${clip.view_count || 'N/A'}`);
        console.log(`      ⏱️  Duration: ${clip.duration || 'N/A'}s`);
        console.log(`      📅 Created: ${clip.created_at ? new Date(clip.created_at).toLocaleString() : 'N/A'}`);
        console.log(`      🔗 URL: ${clip.clip_url || 'N/A'}`);
      });
    }

    // Get highlight clips
    const highlightClips = await client.getStreamClips(targetStream.mint, 'HIGHLIGHT', 10);
    console.log(`\n⭐ Highlight Clips Found: ${highlightClips.length}`);

    if (highlightClips.length > 0) {
      console.log('\n🌟 Recent Highlight Clips:');
      highlightClips.slice(0, 3).forEach((clip, index) => {
        console.log(`   ${index + 1.}. Highlight ${clip.id || 'N/A'}`);
        console.log(`      📊 Views: ${clip.view_count || 'N/A'}`);
        console.log(`      ⏱️  Duration: ${clip.duration || 'N/A'}s`);
        console.log(`      📅 Created: ${clip.created_at ? new Date(clip.created_at).toLocaleString() : 'N/A'}`);
        console.log(`      🔗 URL: ${clip.clip_url || 'N/A'}`);
      });
    }

    if (completeClips.length === 0 && highlightClips.length === 0) {
      console.log('💡 No clips found for this stream. Clips may be generated periodically.');
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 9: Creator approval verification
 */
async function example9_CreatorApprovalCheck() {
  console.log('\n✅ Example 9: Creator Approval Verification');
  console.log('='.repeat(50));

  const client = new PumpFunAPIClient();

  try {
    // Test a few different coins
    const testCoins = [
      { mint: '4F21SgBnms5bwQSjuc11ZF8ruSd9vJp6qu44rWLqpump', name: 'I AM PILL' },
      { mint: 'So11111111111111111111111111111111111111112', name: 'Wrapped SOL' }, // Test with non-streaming coin
    ];

    console.log('Checking creator approval status:\n');

    for (const coin of testCoins) {
      console.log(`🔍 ${coin.name} (${coin.mint.substring(0, 8)}...)`);

      const isApproved = await client.isApprovedCreator(coin.mint);
      console.log(`   ✅ Approved for Streaming: ${isApproved ? 'YES' : 'NO'}`);

      if (isApproved) {
        // If approved, try to get stream info
        try {
          const streamInfo = await client.getLiveStreamInfo(coin.mint);
          if (streamInfo) {
            console.log(`   🔴 Currently Live: ${streamInfo.isLive ? 'YES' : 'NO'}`);
            console.log(`   👥 Current Participants: ${streamInfo.numParticipants}`);
            console.log(`   📺 Stream Title: "${streamInfo.title || 'No Title'}"`);
          } else {
            console.log(`   🔴 Currently Live: NO (No active stream)`);
          }
        } catch (streamError) {
          console.log(`   ⚠️  Could not fetch stream info`);
        }
      }

      console.log('');
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
    await example6_VideoStreamAnalysis();
    await example7_LiveKitConnectionDemo();
    await example8_StreamClipsAnalysis();
    await example9_CreatorApprovalCheck();

    console.log('✅ All examples completed successfully!');
    console.log('\n💡 Key Insights:');
    console.log('   • The /coins/currently-live endpoint returns tokens with active live streams');
    console.log('   • Stream data includes participant counts, chat activity, and thumbnails');
    console.log('   • No authentication required for these public endpoints');
    console.log('   • Rate limiting is in effect (60 requests/minute for live data)');
    console.log('   • NATS WebSocket infrastructure handles real-time updates');
    console.log('   • LiveKit WebRTC infrastructure powers the video streaming');
    console.log('   • Video streams use room naming pattern: {mintId}:{streamId}');
    console.log('   • Multiple LiveKit regions available for optimal connectivity');

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
  example6_VideoStreamAnalysis,
  example7_LiveKitConnectionDemo,
  example8_StreamClipsAnalysis,
  example9_CreatorApprovalCheck,
  runAllExamples
};

// Run all examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}