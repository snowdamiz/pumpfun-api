/**
 * Live Stream API Usage Examples for PumpFun API Client
 *
 * This module contains examples for:
 * - Getting live streaming coins
 * - Filtering active streams
 * - Finding top streams by participants
 * - Getting detailed stream information
 * - Checking creator approval status
 * - Getting LiveKit video streaming connections
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel, LiveStreamInfo, LiveKitConnectionInfo, VideoStreamAnalysis } from '../types';
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

/**
 * Example 16: Get LiveKit connection information for video streaming
 */
export async function getLiveKitConnectionInfoExample() {
  console.log('=== Get LiveKit Connection Info Example ===');

  const client = new PumpFunAPIClient({
    timeout: 15000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    // First get some live coins to test with
    console.log('🔍 Getting live coins to test LiveKit connections...');
    const liveCoins = await client.getLiveCoins({ limit: STREAM_INFO_LIMIT });

    if (liveCoins.length === 0) {
      console.log('⚠️ No live coins found to test LiveKit connections');
      return { client, connections: [] };
    }

    console.log(
      `🎥 Testing LiveKit connection info for ${Math.min(liveCoins.length, MAX_STREAM_INFO_TEST)} coins...\n`
    );

    const connections: Array<{
      mint: string;
      name: string;
      symbol: string;
      connectionInfo: LiveKitConnectionInfo | null;
    }> = [];

    for (let i = 0; i < Math.min(liveCoins.length, MAX_STREAM_INFO_TEST); i++) {
      const coin = liveCoins[i];
      if (!coin) {
        console.log(`${i + INDEX_OFFSET}. ⚠️ Skipping undefined coin data`);
        continue;
      }

      console.log(
        `${i + INDEX_OFFSET}. Getting LiveKit connection for: ${coin.name} (${coin.symbol})`
      );
      console.log(`   🔗 Mint: ${coin.mint}`);
      console.log(`   👥 Live Participants: ${coin.num_participants}`);

      try {
        const connectionInfo = await client.getLiveKitConnectionInfo(coin.mint);

        if (connectionInfo) {
          console.log(`   ✅ LiveKit Connection Found:`);
          console.log(`      🏠 Room Name: ${connectionInfo.roomName}`);
          console.log(`      🔗 WebSocket URL: ${connectionInfo.websocketUrl}`);
          console.log(`      🌐 Primary Server: ${connectionInfo.primaryServer}`);
          console.log(`      📡 Stream ID: ${connectionInfo.streamId}`);
          console.log(
            `      🔐 Requires Auth: ${connectionInfo.requiresAuthentication ? 'YES' : 'NO'}`
          );
          console.log(`      🌍 Available Regions: ${connectionInfo.regions.length}`);

          // Display available regions
          console.log(`      📍 Region Options:`);
          connectionInfo.regions.forEach((region, index) => {
            console.log(`         ${index + 1}. ${region.region} (Distance: ${region.distance})`);
            console.log(`            URL: ${region.url}`);
          });

          console.log(`      🎬 Ready for LiveKit video streaming integration`);
        } else {
          console.log(`   ⚠️ No active LiveKit connection available`);
          console.log(`      💡 This might mean:`);
          console.log(`         • Stream is not currently active`);
          console.log(`         • Creator is not approved for streaming`);
          console.log(`         • Video streaming not enabled for this token`);
        }

        connections.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          connectionInfo,
        });
      } catch (error) {
        console.log(
          `   ❌ Error getting LiveKit connection: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        connections.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          connectionInfo: null,
        });
      }

      console.log('');
    }

    // Summary
    const successfulConnections = connections.filter(c => c.connectionInfo !== null).length;
    console.log(`📊 LiveKit Connection Summary:`);
    console.log(`   Total Tested: ${connections.length}`);
    console.log(`   Successful: ${successfulConnections}`);
    console.log(`   Failed: ${connections.length - successfulConnections}`);
    console.log(
      `   Success Rate: ${((successfulConnections / connections.length) * 100).toFixed(1)}%`
    );

    if (successfulConnections > 0) {
      console.log(`\n🎥 Video Streaming Integration Guide:`);
      console.log(`   1. Use the WebSocket URL to connect to LiveKit server`);
      console.log(`   2. Join the room using the provided room name`);
      console.log(`   3. Handle authentication if required`);
      console.log(`   4. Select optimal region based on user location`);
      console.log(`   5. Implement WebRTC for video/audio streaming`);

      // Show example integration code
      console.log(`\n💻 Integration Example:`);
      console.log(`   import LiveKit from 'livekit-client';`);
      console.log(`   `);
      console.log(`   // Connect to LiveKit room`);
      console.log(`   const room = new LiveKit.Room();`);
      console.log(`   await room.connect(connectionInfo.websocketUrl, connectionInfo.roomName);`);
      console.log(`   `);
      console.log(`   // Handle video tracks`);
      console.log(`   room.on('trackSubscribed', (track, participant) => {`);
      console.log(`     if (track.kind === 'video') {`);
      console.log(`       // Attach video element`);
      console.log(`       document.getElementById('video').srcObject = new MediaStream([track]);`);
      console.log(`     }`);
      console.log(`   });`);
    }

    return { client, connections };
  } catch (error) {
    console.error('❌ Error in LiveKit connection example:', error);
    throw error;
  }
}

/**
 * Example 17: Get comprehensive video stream analysis
 *
 * This example demonstrates the new getVideoStreamAnalysis method that combines
 * all video stream related information into a single comprehensive analysis.
 */
export async function getVideoStreamAnalysisExample() {
  console.log('=== Video Stream Analysis Example ===');

  const client = new PumpFunAPIClient({
    timeout: 15000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    // First get some live coins to test with
    console.log('🔍 Getting live coins to test video stream analysis...');
    const liveCoins = await client.getLiveCoins({ limit: STREAM_INFO_LIMIT });

    if (liveCoins.length === 0) {
      console.log('⚠️ No live coins found to test video stream analysis');
      return { client, analyses: [] };
    }

    console.log(
      `🎬 Testing comprehensive video stream analysis for ${Math.min(liveCoins.length, MAX_STREAM_INFO_TEST)} coins...\n`
    );

    const analyses: Array<{
      mint: string;
      name: string;
      symbol: string;
      analysis: VideoStreamAnalysis;
    }> = [];

    for (let i = 0; i < Math.min(liveCoins.length, MAX_STREAM_INFO_TEST); i++) {
      const coin = liveCoins[i];
      if (!coin) {
        console.log(`${i + INDEX_OFFSET}. ⚠️ Skipping undefined coin data`);
        continue;
      }

      console.log(`${i + INDEX_OFFSET}. Analyzing video stream for: ${coin.name} (${coin.symbol})`);
      console.log(`   🔗 Mint: ${coin.mint}`);
      console.log(`   👥 Live Participants: ${coin.num_participants}`);
      console.log(`   📺 Stream Title: "${coin.livestream_title ?? 'No Title'}"`);

      try {
        const analysis = await client.getVideoStreamAnalysis(coin.mint);

        console.log(`   ✅ Video Stream Analysis Complete:`);
        console.log(`      🔴 Active Stream: ${analysis.hasActiveStream ? 'YES' : 'NO'}`);
        console.log(`      ✅ Creator Approved: ${analysis.isApprovedCreator ? 'YES' : 'NO'}`);

        if (analysis.streamInfo) {
          console.log(`      📺 Stream Details:`);
          console.log(`         • Stream ID: ${analysis.streamInfo.id}`);
          console.log(`         • Title: "${analysis.streamInfo.title ?? 'No Title'}"`);
          console.log(`         • Mode: ${analysis.streamInfo.mode}`);
          console.log(
            `         • Participants: ${analysis.streamInfo.numParticipants}/${analysis.streamInfo.maxParticipants}`
          );
          console.log(`         • Live Status: ${analysis.streamInfo.isLive ? 'LIVE' : 'OFFLINE'}`);
          console.log(`         • Quality Score: ${analysis.streamInfo.downrankScore}/100`);
        }

        if (analysis.liveKitConnection) {
          console.log(`      🎥 LiveKit Connection:`);
          console.log(`         • Room: ${analysis.liveKitConnection.roomName}`);
          console.log(`         • WebSocket: ${analysis.liveKitConnection.websocketUrl}`);
          console.log(`         • Regions: ${analysis.liveKitConnection.regions.length} available`);
          console.log(
            `         • Auth Required: ${analysis.liveKitConnection.requiresAuthentication ? 'YES' : 'NO'}`
          );

          // Show best region
          const bestRegion = analysis.liveKitConnection.regions[0];
          if (bestRegion) {
            console.log(
              `         • Best Region: ${bestRegion.region} (Distance: ${bestRegion.distance})`
            );
          }
        }

        // Analysis Summary
        console.log(`      📊 Analysis Summary:`);
        if (analysis.hasActiveStream && analysis.isApprovedCreator) {
          console.log(`         🟢 READY for video streaming - All checks passed`);
        } else if (analysis.hasActiveStream && !analysis.isApprovedCreator) {
          console.log(`         🟡 Stream active but creator not approved`);
        } else if (!analysis.hasActiveStream && analysis.isApprovedCreator) {
          console.log(`         🟡 Creator approved but no active stream`);
        } else {
          console.log(`         🔴 Not ready for video streaming`);
        }

        console.log(`      ⏰ Analyzed at: ${new Date(analysis.analyzedAt).toLocaleString()}`);

        analyses.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          analysis,
        });
      } catch (error) {
        console.log(
          `   ❌ Error analyzing video stream: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        // Don't add failed analyses to the array
      }

      console.log('');
    }

    // Summary Statistics
    console.log(`📊 Video Stream Analysis Summary:`);
    console.log(`   Total Analyzed: ${analyses.length}`);

    if (analyses.length > 0) {
      const activeStreams = analyses.filter(a => a.analysis.hasActiveStream).length;
      const approvedCreators = analyses.filter(a => a.analysis.isApprovedCreator).length;
      const withLiveKitConnection = analyses.filter(
        a => a.analysis.liveKitConnection !== null
      ).length;
      const readyForStreaming = analyses.filter(
        a => a.analysis.hasActiveStream && a.analysis.isApprovedCreator
      ).length;

      console.log(
        `   Active Streams: ${activeStreams} (${((activeStreams / analyses.length) * 100).toFixed(1)}%)`
      );
      console.log(
        `   Approved Creators: ${approvedCreators} (${((approvedCreators / analyses.length) * 100).toFixed(1)}%)`
      );
      console.log(
        `   LiveKit Connections: ${withLiveKitConnection} (${((withLiveKitConnection / analyses.length) * 100).toFixed(1)}%)`
      );
      console.log(
        `   Ready for Streaming: ${readyForStreaming} (${((readyForStreaming / analyses.length) * 100).toFixed(1)}%)`
      );

      if (readyForStreaming > 0) {
        console.log(`\n🎥 Ready for Video Streaming:`);
        analyses
          .filter(a => a.analysis.hasActiveStream && a.analysis.isApprovedCreator)
          .forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.name} (${item.symbol})`);
            console.log(`      • Mint: ${item.mint}`);
            console.log(`      • Room: ${item.analysis.liveKitConnection?.roomName || 'N/A'}`);
            console.log(`      • Participants: ${item.analysis.streamInfo?.numParticipants || 0}`);
          });

        console.log(`\n💡 Integration Tips:`);
        console.log(`   1. Use getVideoStreamAnalysis() for comprehensive stream status`);
        console.log(`   2. Check hasActiveStream && isApprovedCreator before connecting`);
        console.log(`   3. Use LiveKit connection info for WebRTC video streaming`);
        console.log(`   4. Monitor analysis.analyzedAt for freshness of data`);
        console.log(`   5. Handle cases where components may be null/undefined`);
      }
    }

    return { client, analyses };
  } catch (error) {
    console.error('❌ Error in video stream analysis example:', error);
    throw error;
  }
}
