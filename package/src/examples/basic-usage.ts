/**
 * Basic Usage Examples for PumpFun API Client
 *
 * This file contains comprehensive examples showing how to install,
 * initialize, and use the PumpFun API client for all available operations.
 * Tests all currently implemented package functionality including live streams,
 * configuration management, error handling, rate limiting, and logging.
 *
 * USAGE:
 *   npx tsx src/examples/basic-usage.ts [demo-type]
 *
 * Available demo types:
 *   quick    - Quick functionality test (default)
 *   basic    - Basic initialization demo
 *   live     - Live coins API demo (with real API calls)
 *   all      - Run all examples (comprehensive demo)
 *
 * Examples:
 *   npx tsx src/examples/basic-usage.ts quick
 *   npx tsx src/examples/basic-usage.ts live
 *   npx tsx src/examples/basic-usage.ts all
 *
 * @version 1.0.0
 * @author PumpFun Team
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel, LiveCoin, LiveStreamInfo } from '../types';

// Constants to avoid magic numbers
const EXAMPLE_STREAM_LIMIT = 5;
const MIN_PARTICIPANTS = 1;
const EXAMPLE_TIMEOUT = 15000;
const BASE_DELAY = 1000;
const MAX_DELAY = 10000;
const RETRY_DELAY_2 = 2000;
const BACKOFF_FACTOR = 2;
const RATE_LIMIT_REQUESTS = 50;
const RATE_LIMIT_WINDOW = 60000;
const ACTIVE_STREAMS_LIMIT = 10;
const TEST_CONNECTION_TIMEOUT = 5000;
const TIMESTAMP_MULTIPLIER = 1000;
const INDEX_OFFSET = 1;
const JSON_INDENTATION = 2;
const PROMISE_DELAY = 100;
const INVALID_TIMEOUT = -1000;
const MAX_RETRIES_BASIC = 2;
const MAX_RETRIES_CUSTOM = 5;
const MAX_RETRIES_PRODUCTION = 3;
const LIVE_COINS_LIMIT = 20;
const ACTIVE_STREAMS_LIMIT_SMALL = 10;
const TOP_STREAMS_LIMIT = 5;
const TOP_ACTIVE_PARTICIPANTS = 3;
const MIN_ACTIVE_PARTICIPANTS = 2;
const TITLED_ACTIVE_PARTICIPANTS = 3;
const MIN_TITLED_PARTICIPANTS = 1;
const STREAM_INFO_LIMIT = 3;
const MAX_STREAM_INFO_TEST = 2;
const DESCRIPTION_PREVIEW_LENGTH = 100;
const SUBSTRING_START = 0;
const TO_FIXED_DECIMALS = 2;
const SUCCESS_RATE_DECIMALS = 1;
const ARGV_SLICE_START = 2;
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const REPEAT_COUNT_60 = 60;
const REPEAT_COUNT_50 = 50;

// ============================================================================
// Installation and Setup Examples
// ============================================================================

/**
 * Example 1: Basic client initialization with default configuration
 */
export function basicInitialization() {
  console.log('=== Basic Client Initialization ===');

  // Create a client with default settings
  const client = new PumpFunAPIClient();

  console.log('✅ Client initialized successfully!');
  console.log(`📡 Base URL: ${client.getBaseURL()}`);
  console.log(`⏱️ Timeout: ${client.getTimeout()}ms`);
  console.log(`🔧 Initialized: ${client.isClientInitialized()}`);

  return client;
}

/**
 * Example 2: Client initialization with custom configuration
 */
export function customConfiguration() {
  console.log('=== Custom Configuration ===');

  // Create a client with custom settings
  const client = new PumpFunAPIClient({
    baseURL: 'https://frontend-api-v3.pump.fun',
    timeout: EXAMPLE_TIMEOUT,
    retryConfig: {
      maxRetries: MAX_RETRIES_CUSTOM,
      baseDelay: RETRY_DELAY_2,
      maxDelay: MAX_DELAY,
      backoffFactor: BACKOFF_FACTOR,
    },
    rateLimitConfig: {
      maxRequestsPerWindow: RATE_LIMIT_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW,
      enableBackoff: true,
    },
    loggerConfig: {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableColors: true,
      enableTimestamps: true,
    },
  });

  console.log('✅ Client initialized with custom configuration!');
  console.log(
    '📋 Configuration:',
    JSON.stringify(client.getConfiguration(), null, JSON_INDENTATION)
  );

  return client;
}

/**
 * Example 3: Client initialization using environment variables
 */
export function environmentConfiguration() {
  console.log('=== Environment Variable Configuration ===');

  // These environment variables would be set in your environment:
  // PUMPFUN_API_BASE_URL=https://frontend-api-v3.pump.fun
  // PUMPFUN_API_TIMEOUT=15000
  // PUMPFUN_LOG_LEVEL=DEBUG
  // PUMPFUN_RATE_LIMIT_REQUESTS=50

  const client = new PumpFunAPIClient(); // Will automatically load from environment

  console.log('✅ Client initialized using environment variables!');
  console.log(`📡 Base URL: ${client.getBaseURL()}`);
  console.log(`⏱️ Timeout: ${client.getTimeout()}ms`);

  return client;
}

// ============================================================================
// Connection and Validation Examples
// ============================================================================

/**
 * Example 4: Basic connectivity test
 */
export async function basicConnectionTest() {
  console.log('=== Basic Connection Test ===');

  const client = new PumpFunAPIClient();

  try {
    console.log('🔍 Testing API connectivity...');
    const isConnected = await client.testConnection();

    if (isConnected) {
      console.log('✅ API connection successful!');
    } else {
      console.log('❌ API connection failed!');
    }

    return isConnected;
  } catch (error) {
    console.error('💥 Connection test error:', error);
    throw error;
  }
}

/**
 * Example 5: Client health check and statistics
 */
export async function clientHealthCheck() {
  console.log('=== Client Health Check ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  // Get client state
  const state = client.getState();
  console.log('📊 Client State:', {
    initialized: state.isInitialized,
    requestCount: state.requestCount,
    errorCount: state.errorCount,
    lastRequestTime: state.lastRequestTime
      ? new Date(state.lastRequestTime).toISOString()
      : 'Never',
  });

  // Get statistics
  const stats = client.getStatistics();
  console.log('📈 Statistics:', {
    requests: stats.requestCount,
    errors: stats.errorCount,
    errorRate: `${stats.errorRate}%`,
    rateLimited: client.isRateLimited(),
    backoffRemaining: client.getRateLimitBackoffRemaining(),
  });

  // Test connection
  console.log('🔍 Testing connection...');
  const connected = await client.testConnection();
  console.log(`🌐 Connection Status: ${connected ? '✅ Connected' : '❌ Disconnected'}`);

  return {
    client,
    state,
    stats,
    connected,
  };
}

// ============================================================================
// Error Handling Examples
// ============================================================================

/**
 * Example 6: Basic error handling
 */
export async function basicErrorHandling() {
  console.log('=== Basic Error Handling ===');

  const client = new PumpFunAPIClient({
    timeout: TEST_CONNECTION_TIMEOUT, // Short timeout for demonstration
    retryConfig: {
      maxRetries: MAX_RETRIES_BASIC,
      baseDelay: BASE_DELAY,
    },
  });

  try {
    // This would be an API call in the future
    console.log('🔄 Attempting operation...');

    // Simulate operation that might fail
    await new Promise(resolve => setTimeout(resolve, PROMISE_DELAY));

    console.log('✅ Operation completed successfully');
  } catch (error) {
    console.error('❌ Operation failed:', error);

    // Log error details
    const logger = client.getLogger();
    logger.error('Operation failed', { error, timestamp: new Date().toISOString() });

    // Update statistics
    const stats = client.getStatistics();
    console.log(`📊 Updated error rate: ${stats.errorRate}%`);
  }

  return client;
}

/**
 * Example 7: Configuration validation
 */
export function configurationValidation() {
  console.log('=== Configuration Validation ===');

  try {
    // This will throw an error due to invalid timeout
    new PumpFunAPIClient({
      timeout: INVALID_TIMEOUT, // Invalid timeout
      baseURL: 'not-a-valid-url', // Invalid URL
    });

    console.log('❌ This should not execute due to validation error');
  } catch (error) {
    console.log('✅ Configuration validation working correctly');
    console.log('🚫 Validation Error:', error instanceof Error ? error.message : String(error));
  }

  try {
    // This will work fine
    const validClient = new PumpFunAPIClient({
      timeout: EXAMPLE_TIMEOUT, // Valid timeout
      baseURL: 'https://frontend-api-v3.pump.fun', // Valid URL
    });

    console.log('✅ Valid configuration accepted');
    return validClient;
  } catch (error) {
    console.error('❌ Unexpected validation error:', error);
    throw error;
  }
}

// ============================================================================
// Configuration Management Examples
// ============================================================================

/**
 * Example 8: Runtime configuration updates
 */
export function runtimeConfiguration() {
  console.log('=== Runtime Configuration Updates ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
    },
  });

  console.log('📋 Initial configuration:');
  console.log(`📊 Log level: ${client.getLogger().getConfig().level}`);

  // Update logger configuration at runtime
  client.updateLoggerConfig({
    level: LogLevel.DEBUG,
    enableColors: true,
    enableTimestamps: true,
  });

  console.log('✅ Logger configuration updated:');
  console.log(`📊 New log level: ${client.getLogger().getConfig().level}`);

  // Update rate limit configuration
  client.updateRateLimitConfig({
    maxRequestsPerWindow: 30,
    enableBackoff: true,
  });

  console.log('✅ Rate limit configuration updated');

  return client;
}

// ============================================================================
// Live Stream API Usage Examples
// ============================================================================

/**
 * Example 9: Get currently live streaming coins
 */
export async function getLiveCoinsExample() {
  console.log('=== Get Live Coins Example ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    console.log('🔍 Fetching currently live streaming coins...');

    const liveCoins = await client.getLiveCoins({
      limit: EXAMPLE_STREAM_LIMIT,
      includeNsfw: false,
    });

    console.log(`✅ Found ${liveCoins.length} live streaming coins:\n`);

    liveCoins.forEach((coin, index) => {
      console.log(`${index + INDEX_OFFSET}. ${coin.name} (${coin.symbol})`);
      console.log(`   📺 Stream: ${coin.livestream_title ?? 'No Title'}`);
      console.log(`   👥 Participants: ${coin.num_participants}`);
      console.log(`   💬 Chat Messages: ${coin.reply_count}`);
      console.log(`   💰 Market Cap: $${coin.usd_market_cap?.toFixed(TO_FIXED_DECIMALS) ?? 'N/A'}`);
      console.log(`   🖼️  Thumbnail: ${coin.thumbnail ?? 'No thumbnail'}`);
      console.log(`   🔗 Mint: ${coin.mint}`);
      console.log('');
    });

    return { client, liveCoins };
  } catch (error) {
    console.error('❌ Error fetching live coins:', error);
    throw error;
  }
}

/**
 * Example 10: Get active streams with minimum participants
 */
export async function getActiveStreamsExample() {
  console.log('=== Get Active Streams Example ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    console.log('🔍 Fetching active streams with at least 1 participant...');

    const activeStreams = await client.getActiveStreams(
      MIN_PARTICIPANTS, // minimum participants
      { limit: ACTIVE_STREAMS_LIMIT }
    );

    console.log(`✅ Found ${activeStreams.length} active streams:\n`);

    activeStreams.forEach((stream, index) => {
      console.log(`${index + INDEX_OFFSET}. ${stream.name} (${stream.symbol})`);
      console.log(`   👥 Active Participants: ${stream.num_participants}`);
      console.log(`   💬 Chat Activity: ${stream.reply_count} messages`);
      console.log(`   📺 Stream Title: "${stream.livestream_title ?? 'No Title'}"`);
      console.log(
        `   💎 Market Cap: $${stream.usd_market_cap?.toFixed(TO_FIXED_DECIMALS) ?? 'N/A'}`
      );
      console.log('');
    });

    return { client, activeStreams };
  } catch (error) {
    console.error('❌ Error fetching active streams:', error);
    throw error;
  }
}

/**
 * Example 11: Get top live streams by participant count
 */
export async function getTopLiveStreamsExample() {
  console.log('=== Get Top Live Streams Example ===');

  const client = new PumpFunAPIClient();

  try {
    console.log(`🏆 Fetching top ${EXAMPLE_STREAM_LIMIT} live streams by participant count...`);

    const topStreams = await client.getTopLiveStreams(EXAMPLE_STREAM_LIMIT);

    console.log(`✅ Top ${EXAMPLE_STREAM_LIMIT} Live Streams:\n`);

    topStreams.forEach((stream, index) => {
      console.log(`${index + INDEX_OFFSET}. ${stream.name} (${stream.symbol})`);
      console.log(`   👥 Participants: ${stream.num_participants}`);
      console.log(`   💬 Chat Activity: ${stream.reply_count} messages`);
      console.log(`   📺 Title: "${stream.livestream_title ?? 'No Title'}"`);
      console.log(
        `   💎 Market Cap: $${stream.usd_market_cap?.toFixed(TO_FIXED_DECIMALS) ?? 'N/A'}`
      );
      console.log(
        `   🕒 Created: ${new Date(stream.created_timestamp * TIMESTAMP_MULTIPLIER).toLocaleString()}`
      );
      console.log('');
    });

    return { client, topStreams };
  } catch (error) {
    console.error('❌ Error fetching top live streams:', error);
    throw error;
  }
}

/**
 * Example 12: Get titled streams (streams with meaningful titles)
 */
export async function getTitledStreamsExample() {
  console.log('=== Get Titled Streams Example ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableTimestamps: true,
    },
  });

  try {
    console.log('📝 Fetching streams with meaningful titles...');

    const titledStreams = await client.getTitledStreams(EXAMPLE_STREAM_LIMIT);

    console.log(`✅ Found ${titledStreams.length} titled streams:\n`);

    titledStreams.forEach((stream, index) => {
      console.log(`${index + INDEX_OFFSET}. ${stream.name} (${stream.symbol})`);
      console.log(`   📺 Title: "${stream.livestream_title}"`);
      console.log(`   👥 Participants: ${stream.num_participants}`);
      console.log(`   💬 Messages: ${stream.reply_count}`);
      console.log(
        `   📝 Description: ${stream.description.substring(SUBSTRING_START, DESCRIPTION_PREVIEW_LENGTH)}...`
      );
      console.log('');
    });

    return { client, titledStreams };
  } catch (error) {
    console.error('❌ Error fetching titled streams:', error);
    throw error;
  }
}

/**
 * Example 13: Get comprehensive live stream data
 */
export async function getComprehensiveLiveDataExample() {
  console.log('=== Comprehensive Live Data Example ===');

  const client = new PumpFunAPIClient({
    timeout: 15000,
    retryConfig: {
      maxRetries: MAX_RETRIES_PRODUCTION,
      baseDelay: BASE_DELAY,
    },
    loggerConfig: {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    console.log('📊 Gathering comprehensive live stream data...');

    // Get basic live coins
    const liveCoins = await client.getLiveCoins({ limit: LIVE_COINS_LIMIT });
    console.log(`📡 Found ${liveCoins.length} live coins`);

    // Get active streams
    const activeStreams = await client.getActiveStreams(MIN_PARTICIPANTS, {
      limit: ACTIVE_STREAMS_LIMIT_SMALL,
    });
    console.log(`🔥 Found ${activeStreams.length} active streams`);

    // Get top streams
    const topStreams = await client.getTopLiveStreams(TOP_STREAMS_LIMIT);
    console.log(`🏆 Top ${topStreams.length} streams by participants`);

    // Get titled streams
    const titledStreams = await client.getTitledStreams(EXAMPLE_STREAM_LIMIT);
    console.log(`📝 Found ${titledStreams.length} titled streams`);

    // Get top active streams
    const topActiveStreams = await client.getTopActiveStreams(
      TOP_ACTIVE_PARTICIPANTS,
      MIN_ACTIVE_PARTICIPANTS
    );
    console.log(`⭐ Top ${topActiveStreams.length} active streams`);

    // Get titled active streams
    const titledActiveStreams = await client.getTitledActiveStreams(
      TITLED_ACTIVE_PARTICIPANTS,
      MIN_TITLED_PARTICIPANTS
    );
    console.log(`🎯 Found ${titledActiveStreams.length} titled active streams`);

    console.log('\n📈 Summary Statistics:');
    console.log(`   Total Live Coins: ${liveCoins.length}`);
    console.log(`   Active Streams: ${activeStreams.length}`);
    console.log(`   Titled Streams: ${titledStreams.length}`);
    console.log(`   Top Active Streams: ${topActiveStreams.length}`);

    if (liveCoins.length > 0) {
      const totalParticipants = liveCoins.reduce((sum, coin) => sum + coin.num_participants, 0);
      const avgParticipants = Math.round(totalParticipants / liveCoins.length);
      const totalMessages = liveCoins.reduce((sum, coin) => sum + coin.reply_count, 0);

      console.log(`   Total Participants: ${totalParticipants}`);
      console.log(`   Average Participants: ${avgParticipants}`);
      console.log(`   Total Chat Messages: ${totalMessages}`);
    }

    return {
      client,
      data: {
        liveCoins,
        activeStreams,
        topStreams,
        titledStreams,
        topActiveStreams,
        titledActiveStreams,
      },
    };
  } catch (error) {
    console.error('❌ Error gathering comprehensive data:', error);
    throw error;
  }
}

/**
 * Example 14: Get detailed stream information for specific coins
 */
export async function getStreamInfoExample() {
  console.log('=== Get Stream Info Example ===');

  const client = new PumpFunAPIClient({
    timeout: 10000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
    },
  });

  try {
    // First get some live coins to test with
    console.log('🔍 Getting live coins to test stream info...');
    const liveCoins = await client.getLiveCoins({ limit: STREAM_INFO_LIMIT });

    if (liveCoins.length === 0) {
      console.log('⚠️ No live coins found to test stream info');
      return { client, streamInfos: [] };
    }

    console.log(
      `📡 Testing stream info for ${Math.min(liveCoins.length, MAX_STREAM_INFO_TEST)} coins...\n`
    );

    const streamInfos: Array<{ mint: string; name: string; info: LiveStreamInfo | null }> = [];

    for (let i = 0; i < Math.min(liveCoins.length, MAX_STREAM_INFO_TEST); i++) {
      const coin = liveCoins[i];
      if (!coin) {
        console.log(`${i + INDEX_OFFSET}. ⚠️ Skipping undefined coin data`);
        continue;
      }

      console.log(`${i + INDEX_OFFSET}. Getting stream info for: ${coin.name} (${coin.symbol})`);
      console.log(`   🔗 Mint: ${coin.mint}`);

      try {
        const streamInfo = await client.getLiveStreamInfo(coin.mint);

        if (streamInfo) {
          console.log(`   ✅ Stream Info Found:`);
          console.log(`      📺 Stream ID: ${streamInfo.id}`);
          console.log(`      🔴 Is Live: ${streamInfo.isLive ? 'YES' : 'NO'}`);
          console.log(`      👥 Participants: ${streamInfo.numParticipants}`);
          console.log(`      🎯 Stream Mode: ${streamInfo.mode}`);
          console.log(`      📝 Title: "${streamInfo.title || 'No Title'}"`);
          console.log(`      👤 Creator: ${streamInfo.creatorAddress}`);
          console.log(
            `      ⏰ Started: ${new Date(streamInfo.streamStartTimestamp).toLocaleString()}`
          );
          console.log(`      📊 Downrank Score: ${streamInfo.downrankScore}`);
        } else {
          console.log(`   ⚠️ No active stream info found`);
        }

        streamInfos.push({
          mint: coin.mint,
          name: coin.name,
          info: streamInfo,
        });
      } catch (error) {
        console.log(
          `   ❌ Error getting stream info: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        streamInfos.push({
          mint: coin.mint,
          name: coin.name,
          info: null,
        });
      }

      console.log('');
    }

    return { client, streamInfos };
  } catch (error) {
    console.error('❌ Error in stream info example:', error);
    throw error;
  }
}

/**
 * Example 15: Validate jurisdiction and test connection
 */
export async function jurisdictionAndConnectionExample() {
  console.log('=== Jurisdiction & Connection Example ===');

  const client = new PumpFunAPIClient({
    timeout: 10000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    console.log('🌍 Testing API connection and jurisdiction validation...');

    // Test connection
    console.log('🔌 Testing API connection...');
    const isConnected = await client.testConnection();
    console.log(`   Connection Status: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);

    // Validate jurisdiction
    console.log('🌍 Validating jurisdiction...');
    const isValidJurisdiction = await client.validateJurisdiction();
    console.log(`   Jurisdiction Valid: ${isValidJurisdiction ? '✅ Yes' : '❌ No'}`);

    // Get client statistics
    const stats = client.getStatistics();
    console.log('\n📊 Client Statistics:');
    console.log(`   Requests Made: ${stats.requestCount}`);
    console.log(`   Errors: ${stats.errorCount}`);
    console.log(`   Success Rate: ${stats.successRate.toFixed(SUCCESS_RATE_DECIMALS)}%`);
    console.log(`   Rate Limited: ${client.isRateLimited() ? 'Yes' : 'No'}`);
    console.log(`   Backoff Remaining: ${client.getRateLimitBackoffRemaining()}ms`);

    // Get client state
    const state = client.getState();
    console.log('\n🔧 Client State:');
    console.log(`   Initialized: ${state.isInitialized}`);
    console.log(
      `   Last Request: ${state.lastRequestTime ? new Date(state.lastRequestTime).toLocaleString() : 'Never'}`
    );

    return {
      client,
      connectionTest: isConnected,
      jurisdictionValid: isValidJurisdiction,
      statistics: stats,
      state,
    };
  } catch (error) {
    console.error('❌ Error in jurisdiction and connection test:', error);
    throw error;
  }
}

// ============================================================================
// Best Practices Examples
// ============================================================================

/**
 * Example 11: Best practices for production usage
 */
export function productionBestPractices() {
  console.log('=== Production Best Practices ===');

  // Production-ready configuration
  const client = new PumpFunAPIClient({
    timeout: 15000, // Reasonable timeout
    retryConfig: {
      maxRetries: MAX_RETRIES_PRODUCTION, // Don't overdo retries
      baseDelay: BASE_DELAY,
      maxDelay: MAX_DELAY,
    },
    rateLimitConfig: {
      maxRequestsPerWindow: RATE_LIMIT_REQUESTS, // Conservative rate limiting
      windowMs: RATE_LIMIT_WINDOW,
      enableBackoff: true,
      enableBurstProtection: true,
    },
    loggerConfig: {
      level: LogLevel.WARN, // Only log warnings and errors in production
      enableConsole: false, // Disable console logs in production
      enableFile: true, // Enable file logging
      filePath: './logs/pumpfun-api.log',
      enableTimestamps: true,
    },
  });

  console.log('✅ Production client configured with:');
  console.log('   • Conservative timeout and retry settings');
  console.log('   • Rate limiting with backoff');
  console.log('   • File-based logging');
  console.log('   • Error-only log level');

  return client;
}

/**
 * Example 12: Client lifecycle management
 */
export async function clientLifecycleManagement() {
  console.log('=== Client Lifecycle Management ===');

  const client = new PumpFunAPIClient();

  try {
    console.log('🚀 Client initialized');

    // Use client...
    await client.testConnection();
    console.log('✅ Connection tested');

    // Get final statistics
    const finalStats = client.getStatistics();
    console.log('📊 Final statistics:', finalStats);
  } finally {
    // Always clean up
    console.log('🔄 Shutting down client...');
    client.shutdown();
    console.log('✅ Client shut down successfully');
  }
}

// ============================================================================
// Example Runner
// ============================================================================

/**
 * Run all basic examples in sequence
 */
export async function runAllBasicExamples() {
  console.log('🚀 Running all basic usage examples...\n');

  const results: {
    basicInit: PumpFunAPIClient | null;
    customConfig: PumpFunAPIClient | null;
    envConfig: PumpFunAPIClient | null;
    connectionTest: boolean | null;
    healthCheck: {
      client: PumpFunAPIClient;
      state: {
        isInitialized: boolean;
        requestCount: number;
        errorCount: number;
        lastRequestTime: number | null;
      };
      stats: {
        requestCount: number;
        errorCount: number;
        errorRate: number;
        successRate: number;
      };
      connected: boolean;
    } | null;
    errorHandling: PumpFunAPIClient | null;
    validation: PumpFunAPIClient | null;
    runtimeConfig: PumpFunAPIClient | null;
    production: PumpFunAPIClient | null;
    lifecycle: void | null;
    liveCoins: { client: PumpFunAPIClient; liveCoins: LiveCoin[] } | null;
    activeStreams: { client: PumpFunAPIClient; activeStreams: LiveCoin[] } | null;
    topStreams: { client: PumpFunAPIClient; topStreams: LiveCoin[] } | null;
    titledStreams: { client: PumpFunAPIClient; titledStreams: LiveCoin[] } | null;
    comprehensiveData: {
      client: PumpFunAPIClient;
      data: {
        liveCoins: LiveCoin[];
        activeStreams: LiveCoin[];
        topStreams: LiveCoin[];
        titledStreams: LiveCoin[];
        topActiveStreams: LiveCoin[];
        titledActiveStreams: LiveCoin[];
      };
    } | null;
    streamInfo: {
      client: PumpFunAPIClient;
      streamInfos: Array<{ mint: string; name: string; info: LiveStreamInfo | null }>;
    } | null;
    jurisdictionTest: {
      client: PumpFunAPIClient;
      connectionTest: boolean;
      jurisdictionValid: boolean;
      statistics: {
        requestCount: number;
        errorCount: number;
        errorRate: number;
        successRate: number;
      };
      state: {
        isInitialized: boolean;
        requestCount: number;
        errorCount: number;
        lastRequestTime: number | null;
      };
    } | null;
  } = {
    basicInit: null,
    customConfig: null,
    envConfig: null,
    connectionTest: null,
    healthCheck: null,
    errorHandling: null,
    validation: null,
    runtimeConfig: null,
    production: null,
    lifecycle: null,
    liveCoins: null,
    activeStreams: null,
    topStreams: null,
    titledStreams: null,
    comprehensiveData: null,
    streamInfo: null,
    jurisdictionTest: null,
  };

  try {
    // Basic examples
    results.basicInit = basicInitialization();
    console.log();

    results.customConfig = customConfiguration();
    console.log();

    results.envConfig = environmentConfiguration();
    console.log();

    // Connection examples
    results.connectionTest = await basicConnectionTest();
    console.log();

    results.healthCheck = await clientHealthCheck();
    console.log();

    // Error handling examples
    results.errorHandling = await basicErrorHandling();
    console.log();

    results.validation = configurationValidation();
    console.log();

    // Configuration examples
    results.runtimeConfig = runtimeConfiguration();
    console.log();

    results.production = productionBestPractices();
    console.log();

    // API Usage Examples - Live Streams
    console.log('🔴 API USAGE EXAMPLES - LIVE STREAMS');
    console.log('='.repeat(REPEAT_COUNT_60));

    results.liveCoins = await getLiveCoinsExample();
    console.log();

    results.activeStreams = await getActiveStreamsExample();
    console.log();

    results.topStreams = await getTopLiveStreamsExample();
    console.log();

    results.titledStreams = await getTitledStreamsExample();
    console.log();

    results.comprehensiveData = await getComprehensiveLiveDataExample();
    console.log();

    results.streamInfo = await getStreamInfoExample();
    console.log();

    results.jurisdictionTest = await jurisdictionAndConnectionExample();
    console.log();

    // Lifecycle example
    results.lifecycle = await clientLifecycleManagement();
    console.log();

    console.log('✅ All basic examples completed successfully!');
    console.log('\n🎉 Summary of API functionality tested:');
    console.log('   • Client initialization and configuration');
    console.log('   • Connection testing and jurisdiction validation');
    console.log('   • Live streaming coins retrieval');
    console.log('   • Active streams filtering');
    console.log('   • Top streams by participants');
    console.log('   • Titled streams discovery');
    console.log('   • Comprehensive data gathering');
    console.log('   • Detailed stream information');
    console.log('   • Error handling and rate limiting');
    console.log('   • Statistics and state management');
    console.log('   • Configuration management and lifecycle');
  } catch (error) {
    console.error('💥 Example execution failed:', error);
  }

  return results;
}

// Export individual examples for selective execution
export const examples = {
  // Basic and configuration examples
  basicInitialization,
  customConfiguration,
  environmentConfiguration,
  basicConnectionTest,
  clientHealthCheck,
  basicErrorHandling,
  configurationValidation,
  runtimeConfiguration,
  productionBestPractices,
  clientLifecycleManagement,

  // Live stream API examples
  getLiveCoinsExample,
  getActiveStreamsExample,
  getTopLiveStreamsExample,
  getTitledStreamsExample,
  getComprehensiveLiveDataExample,
  getStreamInfoExample,
  jurisdictionAndConnectionExample,

  // Main runner
  runAllBasicExamples,

  // Quick test
  quickTest,
};

// Export default example runner
export default runAllBasicExamples;

// ============================================================================
// Quick Test Functionality
// ============================================================================

/**
 * Quick test to verify the updated basic usage file works correctly
 */
export function quickTest() {
  console.log('🧪 Quick Test - Basic Usage Functionality');
  console.log('='.repeat(REPEAT_COUNT_50));

  try {
    // Test basic client creation
    console.log('1. Testing basic client creation...');
    const client = new PumpFunAPIClient({
      loggerConfig: { level: LogLevel.WARN, enableConsole: false },
    });
    console.log('✅ Client created successfully');

    // Test configuration
    console.log('2. Testing configuration access...');
    const config = client.getConfiguration();
    console.log(`✅ Configuration accessible - URL: ${config.baseURL}`);

    // Test state
    console.log('3. Testing state access...');
    const state = client.getState();
    console.log(`✅ State accessible - Initialized: ${state.isInitialized}`);

    // Test statistics
    console.log('4. Testing statistics...');
    const stats = client.getStatistics();
    console.log(`✅ Statistics accessible - Requests: ${stats.requestCount}`);

    // Test rate limiting
    console.log('5. Testing rate limiting...');
    const isRateLimited = client.isRateLimited();
    console.log(`✅ Rate limiting check - Limited: ${isRateLimited}`);

    console.log('\n✅ All quick tests passed!');
    console.log('\n🚀 Ready to run full examples with:');
    console.log('   examples.runAllBasicExamples()');
    console.log('   examples.getLiveCoinsExample()');
    console.log('   examples.getActiveStreamsExample()');
    console.log('   ...and many more!');

    return true;
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
}

// ============================================================================
// Direct execution block - runs when file is executed directly
// ============================================================================

/**
 * Check if this file is being run directly and execute appropriate demo
 */
if (import.meta.url.endsWith('basic-usage.ts')) {
  console.log('🚀 PumpFun API Client - Basic Usage Examples');
  console.log('='.repeat(REPEAT_COUNT_60));
  console.log('');

  console.log('📋 Available examples:');
  console.log('   1. Quick test (verifies basic functionality)');
  console.log('   2. Basic initialization demo');
  console.log('   3. Live coins demo (with API calls)');
  console.log('   4. All examples (comprehensive demo)');
  console.log('');

  // Get command line arguments
  const args = process.argv.slice(ARGV_SLICE_START);
  const demoType = args[0] ?? 'quick';

  console.log(`🎯 Running demo: ${demoType}`);
  console.log('');

  switch (demoType.toLowerCase()) {
    case 'quick':
    case 'test':
      try {
        const success = quickTest();
        console.log(`\n🏁 Quick test ${success ? 'PASSED' : 'FAILED'}`);
        process.exit(success ? EXIT_SUCCESS : EXIT_FAILURE);
      } catch (err) {
        console.error('\n💥 Quick test crashed:', err);
        process.exit(EXIT_FAILURE);
      }
      break;

    case 'basic':
    case 'init':
      basicInitialization();
      console.log('\n✅ Basic initialization demo completed');
      break;

    case 'live':
    case 'api':
      getLiveCoinsExample()
        .then(() => {
          console.log('\n✅ Live coins demo completed');
        })
        .catch(err => {
          console.error('\n💥 Live coins demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'all':
    case 'full':
      runAllBasicExamples()
        .then(() => {
          console.log('\n🎉 All examples completed!');
        })
        .catch(err => {
          console.error('\n💥 Examples execution failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    default:
      console.log('❌ Unknown demo type. Available options:');
      console.log('   quick    - Quick functionality test');
      console.log('   basic    - Basic initialization demo');
      console.log('   live     - Live coins API demo');
      console.log('   all      - Run all examples');
      console.log('');
      console.log('Usage: node basic-usage.ts [demo-type]');
      console.log('Example: node basic-usage.ts quick');
      process.exit(EXIT_FAILURE);
  }
}
