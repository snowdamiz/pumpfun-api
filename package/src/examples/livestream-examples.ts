/**
 * Live Stream API Usage Examples for PumpFun API Client
 *
 * This module contains examples for:
 * - Getting live streaming coins
 * - Filtering active streams
 * - Finding top streams by participants
 * - Getting detailed stream information
 * - Checking creator approval status
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel, LiveStreamInfo } from '../types';
import {
  EXAMPLE_STREAM_LIMIT,
  MIN_PARTICIPANTS,
  ACTIVE_STREAMS_LIMIT,
  LIVE_COINS_LIMIT,
  ACTIVE_STREAMS_LIMIT_SMALL,
  TOP_STREAMS_LIMIT,
  TOP_ACTIVE_PARTICIPANTS,
  MIN_ACTIVE_PARTICIPANTS,
  TITLED_ACTIVE_PARTICIPANTS,
  MIN_TITLED_PARTICIPANTS,
  STREAM_INFO_LIMIT,
  MAX_STREAM_INFO_TEST,
  DESCRIPTION_PREVIEW_LENGTH,
  SUBSTRING_START,
  TO_FIXED_DECIMALS,
  TIMESTAMP_MULTIPLIER,
  INDEX_OFFSET,
  BASE_DELAY,
  MAX_RETRIES_PRODUCTION,
} from './constants';

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
 * Example 15: Check creator approval status
 */
export async function checkCreatorApprovalExample() {
  console.log('=== Check Creator Approval Example ===');

  const client = new PumpFunAPIClient({
    timeout: 10000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    // First get some live coins to test with
    console.log('🔍 Getting live coins to test creator approval...');
    const liveCoins = await client.getLiveCoins({ limit: STREAM_INFO_LIMIT });

    if (liveCoins.length === 0) {
      console.log('⚠️ No live coins found to test creator approval');
      return { client, approvals: [] };
    }

    console.log(
      `📋 Testing creator approval for ${Math.min(liveCoins.length, MAX_STREAM_INFO_TEST)} coins...\n`
    );

    const approvals: Array<{
      mint: string;
      name: string;
      symbol: string;
      isApproved: boolean;
    }> = [];

    for (let i = 0; i < Math.min(liveCoins.length, MAX_STREAM_INFO_TEST); i++) {
      const coin = liveCoins[i];
      if (!coin) {
        console.log(`${i + INDEX_OFFSET}. ⚠️ Skipping undefined coin data`);
        continue;
      }

      console.log(`${i + INDEX_OFFSET}. Checking approval for: ${coin.name} (${coin.symbol})`);
      console.log(`   🔗 Mint: ${coin.mint}`);

      try {
        const isApproved = await client.isApprovedCreator(coin.mint);

        console.log(`   ✅ Approval Status: ${isApproved ? '✅ APPROVED' : '❌ NOT APPROVED'}`);

        if (isApproved) {
          console.log(`   🎬 This creator can start live streams`);
        } else {
          console.log(`   🚫 This creator cannot start live streams`);
        }

        approvals.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          isApproved,
        });
      } catch (error) {
        console.log(
          `   ❌ Error checking approval: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        approvals.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          isApproved: false,
        });
      }

      console.log('');
    }

    // Summary
    const approvedCount = approvals.filter(a => a.isApproved).length;
    console.log(`📊 Approval Summary:`);
    console.log(`   Total Checked: ${approvals.length}`);
    console.log(`   Approved: ${approvedCount}`);
    console.log(`   Not Approved: ${approvals.length - approvedCount}`);
    console.log(`   Approval Rate: ${((approvedCount / approvals.length) * 100).toFixed(1)}%`);

    return { client, approvals };
  } catch (error) {
    console.error('❌ Error in creator approval example:', error);
    throw error;
  }
}