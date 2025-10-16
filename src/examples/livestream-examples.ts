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
import {
  LogLevel,
  LiveStreamInfo,
  JoinLiveStreamResponse,
} from '../types';
import {
  STREAM_INFO_LIMIT,
  MAX_STREAM_INFO_TEST,
  INDEX_OFFSET,
} from './constants';


/**
 * Example 9a: Get live streams with filtering options (NEW API)
 */
export async function getLiveStreamsExample() {
  console.log('=== Get Live Streams Example (New API) ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    console.log('🔍 Demonstrating new getLiveStreams API with various options...\n');

    // Test 1: Basic live streams
    console.log('1️⃣ Getting basic live streams...');
    const basicStreams = await client.getLiveStreams({
      limit: 5
    });
    console.log(`✅ Found ${basicStreams.length} basic live streams`);

    // Test 2: Active streams with minimum participants
    console.log('\n2️⃣ Getting active streams (min 5 participants)...');
    const activeStreams = await client.getLiveStreams({
      minParticipants: 5,
      limit: 5
    });
    console.log(`✅ Found ${activeStreams.length} active streams with 5+ participants`);

    // Test 3: Top streams by participants
    console.log('\n3️⃣ Getting top streams by participants...');
    const topStreams = await client.getLiveStreams({
      sortBy: 'participants',
      sortOrder: 'desc',
      limit: 5
    });
    console.log(`✅ Found ${topStreams.length} top streams by participants`);

    // Test 4: Titled streams only
    console.log('\n4️⃣ Getting titled streams only...');
    const titledStreams = await client.getLiveStreams({
      includeTitledOnly: true,
      limit: 5
    });
    console.log(`✅ Found ${titledStreams.length} titled streams`);

    // Display results
    console.log('\n📊 Results Summary:');
    console.log(`   Basic streams: ${basicStreams.length}`);
    console.log(`   Active streams (5+ participants): ${activeStreams.length}`);
    console.log(`   Top streams: ${topStreams.length}`);
    console.log(`   Titled streams: ${titledStreams.length}`);

    // Show top streams with details
    if (topStreams.length > 0) {
      console.log('\n🏆 Top Streams by Participants:');
      topStreams.forEach((stream, index) => {
        console.log(`${index + INDEX_OFFSET}. ${stream.name} (${stream.symbol})`);
        console.log(`   👥 Participants: ${stream.num_participants}`);
        console.log(`   📺 Title: "${stream.livestream_title ?? 'No Title'}"`);
        console.log(`   💰 Market Cap: $${stream.usd_market_cap?.toLocaleString()}`);
        console.log('');
      });
    }

    console.log('🎯 New getLiveStreams API Features:');
    console.log('   ✅ Consolidated filtering (minParticipants, includeTitledOnly)');
    console.log('   ✅ Multiple sorting options (participants, default)');
    console.log('   ✅ Sort order control (asc, desc)');
    console.log('   ✅ Pagination support (limit, offset)');
    console.log('   ✅ NSFW filtering');
    console.log('   ✅ Backward compatibility maintained');

    return {
      client,
      results: {
        basicStreams,
        activeStreams,
        topStreams,
        titledStreams
      }
    };
  } catch (error) {
    console.error('❌ Error testing getLiveStreams API:', error);
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
    const liveCoins = await client.getLiveStreams({ limit: STREAM_INFO_LIMIT });

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
          console.log(`      📝 Title: "${streamInfo.title ?? 'No Title'}"`);
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
    const liveCoins = await client.getLiveStreams({ limit: STREAM_INFO_LIMIT });

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
 * Example 18: Join a live stream
 *
 * This example demonstrates the new joinLiveStream method that attempts to join
 * an active live stream and returns connection details for successful joins.
 */
export async function joinLiveStreamExample() {
  console.log('=== Join Live Stream Example ===');

  const client = new PumpFunAPIClient({
    timeout: 15000,
    loggerConfig: {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    // First get some live coins to test with
    console.log('🔍 Getting live coins to test joining streams...');
    const liveCoins = await client.getLiveStreams({ limit: STREAM_INFO_LIMIT });

    if (liveCoins.length === 0) {
      console.log('⚠️ No live coins found to test joining streams');
      return { client, joinAttempts: [] };
    }

    console.log(
      `🎬 Testing stream joining for ${Math.min(liveCoins.length, MAX_STREAM_INFO_TEST)} coins...\n`
    );

    const joinAttempts: Array<{
      mint: string;
      name: string;
      symbol: string;
      participants: number;
      joinResult: JoinLiveStreamResponse;
    }> = [];

    for (let i = 0; i < Math.min(liveCoins.length, MAX_STREAM_INFO_TEST); i++) {
      const coin = liveCoins[i];
      if (!coin) {
        console.log(`${i + INDEX_OFFSET}. ⚠️ Skipping undefined coin data`);
        continue;
      }

      console.log(
        `${i + INDEX_OFFSET}. Attempting to join stream for: ${coin.name} (${coin.symbol})`
      );
      console.log(`   🔗 Mint: ${coin.mint}`);
      console.log(`   👥 Live Participants: ${coin.num_participants}`);
      console.log(`   📺 Stream Title: "${coin.livestream_title ?? 'No Title'}"`);

      try {
        const joinResult = await client.joinLiveStream(coin.mint);

        console.log(`   ✅ Join Attempt Result:`);
        console.log(`      🎯 Success: ${joinResult.success ? 'YES' : 'NO'}`);
        console.log(`      📝 Message: "${joinResult.message}"`);

        if (joinResult.success) {
          console.log(`      🎉 Stream Joined Successfully!`);

          if (joinResult.streamId) {
            console.log(`      📺 Stream ID: ${joinResult.streamId}`);
          }

          if (joinResult.roomName) {
            console.log(`      🏠 Room Name: ${joinResult.roomName}`);
          }

          if (joinResult.websocketUrl) {
            console.log(`      🔗 WebSocket URL: ${joinResult.websocketUrl}`);
          }

          if (joinResult.requiresAuthentication !== undefined) {
            console.log(
              `      🔐 Auth Required: ${joinResult.requiresAuthentication ? 'YES' : 'NO'}`
            );
          }

          console.log(`      💡 Next Steps:`);
          console.log(`         • Use WebSocket URL to connect to the stream`);
          console.log(`         • Join room using the provided room name`);
          console.log(`         • Handle authentication if required`);
          console.log(`         • Implement WebRTC for video/audio streaming`);
        } else {
          console.log(`      ❌ Join Failed:`);

          if (joinResult.error) {
            console.log(`         • Error Code: ${joinResult.error.code}`);
            console.log(`         • Details: ${joinResult.error.details}`);

            // Provide specific guidance based on error code
            switch (joinResult.error.code) {
              case 'STREAM_NOT_FOUND':
                console.log(`         💡 Resolution: Stream may not be active or may have ended`);
                break;
              case 'ACCESS_DENIED':
                console.log(
                  `         💡 Resolution: Check if you have permission to join this stream`
                );
                break;
              case 'RATE_LIMITED':
                console.log(`         💡 Resolution: Wait before making another join attempt`);
                break;
              case 'INVALID_PARAMETER':
                console.log(`         💡 Resolution: Verify the mintId is correct`);
                break;
              default:
                console.log(`         💡 Resolution: Check network connection and try again`);
            }
          }
        }

        joinAttempts.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          participants: coin.num_participants,
          joinResult,
        });
      } catch (error) {
        console.log(
          `   ❌ Unexpected error joining stream: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        // Create a failed join result for unexpected errors
        const failedResult: JoinLiveStreamResponse = {
          success: false,
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: {
            code: 'UNEXPECTED_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        };

        joinAttempts.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          participants: coin.num_participants,
          joinResult: failedResult,
        });
      }

      console.log('');
    }

    // Summary Statistics
    console.log(`📊 Join Stream Summary:`);
    console.log(`   Total Attempts: ${joinAttempts.length}`);

    if (joinAttempts.length > 0) {
      const successfulJoins = joinAttempts.filter(a => a.joinResult.success).length;
      const failedJoins = joinAttempts.filter(a => !a.joinResult.success).length;

      console.log(
        `   Successful: ${successfulJoins} (${((successfulJoins / joinAttempts.length) * 100).toFixed(1)}%)`
      );
      console.log(
        `   Failed: ${failedJoins} (${((failedJoins / joinAttempts.length) * 100).toFixed(1)}%)`
      );

      // Show successful joins
      if (successfulJoins > 0) {
        console.log(`\n🎉 Successfully Joined Streams:`);
        joinAttempts
          .filter(a => a.joinResult.success)
          .forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.name} (${item.symbol})`);
            console.log(`      • Mint: ${item.mint}`);
            console.log(`      • Participants: ${item.participants}`);
            console.log(`      • Room: ${item.joinResult.roomName ?? 'N/A'}`);
            console.log(`      • Stream ID: ${item.joinResult.streamId ?? 'N/A'}`);
            console.log(
              `      • WebSocket: ${item.joinResult.websocketUrl ? 'Available' : 'Not provided'}`
            );
          });

        console.log(`\n🚀 Ready for Live Streaming Integration:`);
        console.log(`   1. Use the provided WebSocket URLs for real-time connections`);
        console.log(`   2. Join the LiveKit rooms using the room names`);
        console.log(`   3. Handle authentication if requiresAuthentication is true`);
        console.log(`   4. Implement WebRTC for video/audio streaming`);
        console.log(`   5. Monitor stream status and handle disconnections`);

        // Show example integration code
        console.log(`\n💻 Integration Example:`);
        console.log(`   // Join a live stream`);
        console.log(`   const joinResult = await client.joinLiveStream(mintId);`);
        console.log(`   `);
        console.log(`   if (joinResult.success) {`);
        console.log(`     // Connect with LiveKit`);
        console.log(`     const room = new LiveKit.Room();`);
        console.log(`     await room.connect(joinResult.websocketUrl, joinResult.roomName);`);
        console.log(`     `);
        console.log(`     // Handle participant events`);
        console.log(`     room.on('participantConnected', (participant) => {`);
        console.log(`       console.log(\`Participant \${participant.identity} joined\`);`);
        console.log(`     });`);
        console.log(`     `);
        console.log(`     // Handle track events (video/audio)`);
        console.log(`     room.on('trackSubscribed', (track, participant) => {`);
        console.log(`       // Attach media elements`);
        console.log(`       if (track.kind === 'video') {`);
        console.log(
          `         document.getElementById('remoteVideo').srcObject = new MediaStream([track]);`
        );
        console.log(`       }`);
        console.log(`     });`);
        console.log(`   }`);
      }

      // Show error analysis
      if (failedJoins > 0) {
        console.log(`\n❌ Failed Join Attempts Analysis:`);
        const errorsByCode = new Map<string, number>();

        joinAttempts
          .filter(a => !a.joinResult.success)
          .forEach(item => {
            const errorCode = item.joinResult.error?.code ?? 'UNKNOWN';
            errorsByCode.set(errorCode, (errorsByCode.get(errorCode) ?? 0) + 1);
          });

        errorsByCode.forEach((count, code) => {
          const percentage = ((count / failedJoins) * 100).toFixed(1);
          console.log(`   • ${code}: ${count} (${percentage}%)`);
        });

        console.log(`\n💡 Common Failure Reasons:`);
        console.log(`   • STREAM_NOT_FOUND: Stream may not be active or accessible`);
        console.log(`   • ACCESS_DENIED: Permission required or stream is private`);
        console.log(`   • RATE_LIMITED: Too many join attempts, wait and retry`);
        console.log(`   • INVALID_PARAMETER: Check mintId format and validity`);
      }
    }

    return { client, joinAttempts };
  } catch (error) {
    console.error('❌ Error in join live stream example:', error);
    throw error;
  }
}

/**
 * Example 19: Search live streams by keyword
 *
 * This example demonstrates the new searchLiveStreams method that allows searching
 * for live streams using keywords across multiple fields with relevance scoring.
 */
export async function searchLiveStreamsExample() {
  console.log('=== Search Live Streams Example ===');

  const client = new PumpFunAPIClient({
    timeout: 15000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    // Test 1: Basic search with keyword
    console.log('🔍 Test 1: Basic search with keyword "pepe"...');
    const basicSearchResults = await client.searchLiveStreams({
      keyword: 'pepe',
      limit: 5,
    });

    console.log(`✅ Found ${basicSearchResults.length} results for "pepe":\n`);

    basicSearchResults.forEach((result, index) => {
      console.log(`${index + INDEX_OFFSET}. ${result.name} (${result.symbol})`);
      console.log(`   🎯 Relevance: ${result.relevanceScore.toFixed(3)}`);
      console.log(`   📺 Stream: ${result.livestream_title ?? 'No Title'}`);
      console.log(`   👥 Participants: ${result.num_participants}`);
      console.log(`   💰 Market Cap: $${result.usd_market_cap.toLocaleString()}`);
      console.log(`   🔍 Matched Fields: ${Object.keys(result.matchedFields).join(', ')}`);

      // Show snippets if available
      if (result.snippets) {
        Object.entries(result.snippets).forEach(([field, snippet]) => {
          console.log(`   📝 ${field} snippet: "${snippet}"`);
        });
      }
      console.log('');
    });

    // Test 2: Search with specific fields
    console.log('🔍 Test 2: Searching in specific fields (name, symbol)...');
    const fieldSpecificResults = await client.searchLiveStreams({
      keyword: 'doge',
      searchIn: ['name', 'symbol'],
      limit: 3,
      sortBy: 'relevance',
    });

    console.log(
      `✅ Found ${fieldSpecificResults.length} results searching name and symbol only:\n`
    );

    fieldSpecificResults.forEach((result, index) => {
      console.log(
        `${index + INDEX_OFFSET}. ${result.name} - ${result.livestream_title ?? 'No Title'}`
      );
      console.log(`   🎯 Relevance: ${result.relevanceScore.toFixed(3)}`);
      console.log(`   🔍 Matched: ${Object.keys(result.matchedFields).join(', ')}`);
      console.log('');
    });

    // Test 3: Search with minimum participants filter
    console.log('🔍 Test 3: Search with minParticipants filter...');
    const activeResults = await client.searchLiveStreams({
      keyword: 'live',
      minParticipants: 1,
      limit: 3,
      sortBy: 'participants',
      sortOrder: 'DESC',
    });

    console.log(`✅ Found ${activeResults.length} active results with at least 1 participant:\n`);

    activeResults.forEach((result, index) => {
      console.log(`${index + INDEX_OFFSET}. ${result.name} (${result.symbol})`);
      console.log(`   👥 Participants: ${result.num_participants}`);
      console.log(`   🎯 Relevance: ${result.relevanceScore.toFixed(3)}`);
      console.log(`   📺 Stream: ${result.livestream_title ?? 'No Title'}`);
      console.log('');
    });

    // Test 4: Search with sorting by market cap
    console.log('🔍 Test 4: Search sorted by market cap...');
    const marketCapResults = await client.searchLiveStreams({
      keyword: 'crypto',
      limit: 3,
      sortBy: 'market_cap',
      sortOrder: 'DESC',
    });

    console.log(`✅ Top ${marketCapResults.length} results by market cap:\n`);

    marketCapResults.forEach((result, index) => {
      console.log(`${index + INDEX_OFFSET}. ${result.name} (${result.symbol})`);
      console.log(`   💰 Market Cap: $${result.usd_market_cap.toLocaleString()}`);
      console.log(`   🎯 Relevance: ${result.relevanceScore.toFixed(3)}`);
      console.log(`   👥 Participants: ${result.num_participants}`);
      console.log('');
    });

    // Test 5: Search for currently live streams only
    console.log('🔍 Test 5: Search for currently live streams only...');
    const liveOnlyResults = await client.searchLiveStreams({
      keyword: 'stream',
      currentlyLiveOnly: true,
      limit: 3,
      sortBy: 'relevance',
    });

    console.log(`✅ Found ${liveOnlyResults.length} currently live streaming results:\n`);

    liveOnlyResults.forEach((result, index) => {
      console.log(`${index + INDEX_OFFSET}. ${result.name} (${result.symbol})`);
      console.log(`   🔴 Live Status: ${result.is_currently_live ? 'LIVE' : 'OFFLINE'}`);
      console.log(`   🎯 Relevance: ${result.relevanceScore.toFixed(3)}`);
      console.log(`   📺 Title: ${result.livestream_title ?? 'No Title'}`);
      console.log('');
    });

    // Summary
    console.log('📊 Search Summary:');
    console.log(`   Basic search ("pepe"): ${basicSearchResults.length} results`);
    console.log(`   Field-specific search ("doge"): ${fieldSpecificResults.length} results`);
    console.log(`   Active streams search ("live"): ${activeResults.length} results`);
    console.log(`   Market cap search ("crypto"): ${marketCapResults.length} results`);
    console.log(`   Live only search ("stream"): ${liveOnlyResults.length} results`);

    console.log('\n💡 Search Features Demonstrated:');
    console.log('   1. Basic keyword search across all fields');
    console.log('   2. Field-specific searching (name, symbol, description, title)');
    console.log('   3. Minimum participant filtering');
    console.log('   4. Multiple sorting options (relevance, participants, market_cap)');
    console.log('   5. Currently live stream filtering');
    console.log('   6. Relevance scoring and matched field highlighting');
    console.log('   7. Search snippets for context');

    console.log('\n🚀 Search Usage Examples:');
    console.log('   // Search for specific tokens');
    console.log('   const results = await client.searchLiveStreams({');
    console.log('     keyword: "bitcoin",');
    console.log('     limit: 10');
    console.log('   });');
    console.log('');
    console.log('   // Search with filters');
    console.log('   const activeStreams = await client.searchLiveStreams({');
    console.log('     keyword: "defi",');
    console.log('     minParticipants: 5,');
    console.log('     currentlyLiveOnly: true,');
    console.log('     sortBy: "participants",');
    console.log('     sortOrder: "DESC"');
    console.log('   });');
    console.log('');
    console.log('   // Search specific fields');
    console.log('   const symbolMatches = await client.searchLiveStreams({');
    console.log('     keyword: "PEPE",');
    console.log('     searchIn: ["symbol"],');
    console.log('     sortBy: "relevance"');
    console.log('   });');

    return {
      client,
      searchResults: {
        basicSearch: basicSearchResults,
        fieldSpecific: fieldSpecificResults,
        activeStreams: activeResults,
        marketCap: marketCapResults,
        liveOnly: liveOnlyResults,
      },
    };
  } catch (error) {
    console.error('❌ Error in search live streams example:', error);
    throw error;
  }
}

/**
 * Example 20: Get comprehensive stream statistics
 *
 * This example demonstrates the new getStreamStatistics method that calculates
 * and returns aggregate statistics for live streaming data across all streams.
 */
export async function getStreamStatisticsExample() {
  console.log('=== Stream Statistics Example ===');

  const client = new PumpFunAPIClient({
    timeout: 20000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    console.log('📊 Calculating comprehensive live stream statistics...\n');

    const startTime = Date.now();
    const statistics = await client.getStreamStatistics();
    const calculationTime = Date.now() - startTime;

    console.log(`✅ Statistics calculated in ${calculationTime}ms\n`);

    // Display total statistics
    console.log('📈 Global Streaming Statistics:');
    console.log(`   📡 Total Live Streams: ${statistics.totalLiveStreams}`);
    console.log(`   👥 Total Participants: ${statistics.totalParticipants.toLocaleString()}`);
    console.log(`   📊 Average Participants per Stream: ${statistics.averageParticipants}`);
    console.log(`   ⏰ Calculated at: ${new Date(statistics.calculatedAt).toLocaleString()}`);

    // Display top streams
    if (statistics.topStreams.length > 0) {
      console.log(`\n🏆 Top ${statistics.topStreams.length} Live Streams by Participants:`);
      statistics.topStreams.forEach((stream, index) => {
        console.log(`   ${index + 1}. ${stream.name}`);
        console.log(`      👥 Participants: ${stream.participants.toLocaleString()}`);
        console.log(`      🔗 Mint: ${stream.mintId}`);
      });
    } else {
      console.log('\n🏆 No active streams found for top streams ranking');
    }

    // Display mode distribution
    console.log('\n🎥 Stream Mode Distribution:');
    console.log(`   📹 Interactive Streams: ${statistics.modeDistribution.interactive}`);
    console.log(`   📺 Broadcast Streams: ${statistics.modeDistribution.broadcast}`);

    const totalStreams =
      statistics.modeDistribution.interactive + statistics.modeDistribution.broadcast;
    if (totalStreams > 0) {
      const interactivePercentage = (
        (statistics.modeDistribution.interactive / totalStreams) *
        100
      ).toFixed(1);
      const broadcastPercentage = (
        (statistics.modeDistribution.broadcast / totalStreams) *
        100
      ).toFixed(1);
      console.log(
        `   📊 Interactive: ${interactivePercentage}% | Broadcast: ${broadcastPercentage}%`
      );
    }

    // Calculate additional insights
    console.log('\n💡 Streaming Insights:');

    if (statistics.totalLiveStreams === 0) {
      console.log('   ⚠️ No live streams currently active');
      console.log('   💡 Try again later when more streams are active');
    } else {
      // Participant distribution insights
      if (statistics.averageParticipants > 100) {
        console.log('   🔥 High engagement - Average participants > 100');
      } else if (statistics.averageParticipants > 50) {
        console.log('   📈 Good engagement - Average participants > 50');
      } else if (statistics.averageParticipants > 10) {
        console.log('   👥 Moderate engagement - Average participants > 10');
      } else {
        console.log('   📉 Low engagement - Average participants < 10');
      }

      // Mode distribution insights
      const interactiveRatio = statistics.modeDistribution.interactive / totalStreams;
      if (interactiveRatio > 0.7) {
        console.log('   🎮 Interactive-dominant platform (>70% interactive)');
      } else if (interactiveRatio > 0.3) {
        console.log('   🔄 Mixed content (30-70% interactive)');
      } else {
        console.log('   📺 Broadcast-dominant platform (>70% broadcast)');
      }

      // Top stream insights
      if (statistics.topStreams.length > 0) {
        const topStream = statistics.topStreams[0];
        if (topStream) {
          const topStreamPercentage = (
            (topStream.participants / statistics.totalParticipants) *
            100
          ).toFixed(1);
          console.log(
            `   👑 Top stream (${topStream.name}) has ${topStreamPercentage}% of all participants`
          );
        }
      }
    }

    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    console.log(`   ⏱️  Calculation Time: ${calculationTime}ms`);
    if (calculationTime < 1000) {
      console.log('   ✅ Excellent performance (< 1 second)');
    } else if (calculationTime < 3000) {
      console.log('   ✅ Good performance (< 3 seconds)');
    } else if (calculationTime < 10000) {
      console.log('   ⚠️  Moderate performance (< 10 seconds)');
    } else {
      console.log('   ⚠️  Slow performance (> 10 seconds)');
    }

    // API efficiency metrics
    console.log('\n📊 API Efficiency Analysis:');
    if (statistics.totalLiveStreams > 0) {
      const participantsPerStream = statistics.totalParticipants / statistics.totalLiveStreams;
      console.log(`   👥 Participants per Stream: ${participantsPerStream.toFixed(1)}`);

      // Stream health indicator
      const healthyStreams = statistics.topStreams.filter(s => s.participants > 5).length;
      const healthPercentage = ((healthyStreams / statistics.totalLiveStreams) * 100).toFixed(1);
      console.log(`   💚 Stream Health: ${healthPercentage}% have >5 participants`);

      // Engagement level
      if (participantsPerStream > 50) {
        console.log('   🔥 High engagement platform');
      } else if (participantsPerStream > 20) {
        console.log('   📈 Growing engagement platform');
      } else if (participantsPerStream > 5) {
        console.log('   📊 Moderate engagement platform');
      } else {
        console.log('   🌱 Early-stage platform');
      }
    }

    console.log('\n🎯 Stream Statistics Usage Examples:');
    console.log('   // Get current streaming statistics');
    console.log('   const stats = await client.getStreamStatistics();');
    console.log('');
    console.log('   // Monitor platform health');
    console.log('   console.log(`Active streams: ${stats.totalLiveStreams}`);');
    console.log('   console.log(`Total engagement: ${stats.totalParticipants}`);');
    console.log('');
    console.log('   // Find top performing streams');
    console.log('   const topStream = stats.topStreams[0];');
    console.log('   if (topStream) {');
    console.log('     console.log(`Top stream: ${topStream.name}`);');
    console.log('     console.log(`Participants: ${topStream.participants}`);');
    console.log('   }');
    console.log('');
    console.log('   // Track content preferences');
    console.log('   const interactivePercentage = ');
    console.log('     (stats.modeDistribution.interactive / (');
    console.log('       stats.modeDistribution.interactive + stats.modeDistribution.broadcast');
    console.log('     )) * 100;');
    console.log('   console.log(`Interactive content: ${interactivePercentage.toFixed(1)}%`);');

    return { client, statistics, calculationTime };
  } catch (error) {
    console.error('❌ Error calculating stream statistics:', error);

    // Provide helpful error context
    if (error instanceof Error) {
      console.log('\n💡 Possible Solutions:');
      if (error.message.includes('rate limit')) {
        console.log('   • Wait before making another statistics request');
        console.log('   • Check rate limit status with client.isRateLimited()');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        console.log('   • Check internet connection');
        console.log('   • Increase timeout configuration');
        console.log('   • Try again later');
      } else if (error.message.includes('API')) {
        console.log('   • Verify API endpoints are accessible');
        console.log('   • Check API service status');
      } else {
        console.log('   • Review error details above');
        console.log('   • Check client configuration');
      }
    }

    throw error;
  }
}

/**
 * Example 21: Get stream clips for a specific mint
 *
 * This example demonstrates the new getStreamClips method that fetches
 * recorded stream clips for a specific token mint with type filtering and pagination.
 */
export async function getStreamClipsExample() {
  console.log('=== Stream Clips Example ===');

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
    console.log('🔍 Getting live coins to test stream clips...');
    const liveCoins = await client.getLiveStreams({ limit: STREAM_INFO_LIMIT });

    if (liveCoins.length === 0) {
      console.log('⚠️ No live coins found to test stream clips');
      return { client, clipTests: [] };
    }

    console.log(
      `📹 Testing stream clips for ${Math.min(liveCoins.length, MAX_STREAM_INFO_TEST)} coins...\n`
    );

    const clipTests: Array<{
      mint: string;
      name: string;
      symbol: string;
      participants: number;
      allClips: any[];
      completeClips: any[];
      highlightClips: any[];
    }> = [];

    for (let i = 0; i < Math.min(liveCoins.length, MAX_STREAM_INFO_TEST); i++) {
      const coin = liveCoins[i];
      if (!coin) {
        console.log(`${i + INDEX_OFFSET}. ⚠️ Skipping undefined coin data`);
        continue;
      }

      console.log(`${i + INDEX_OFFSET}. Testing stream clips for: ${coin.name} (${coin.symbol})`);
      console.log(`   🔗 Mint: ${coin.mint}`);
      console.log(`   👥 Live Participants: ${coin.num_participants}`);
      console.log(`   📺 Stream Title: "${coin.livestream_title ?? 'No Title'}"`);

      try {
        // Test 1: Get all clips (no filtering)
        console.log(`   📹 Testing getStreamClips (all clips)...`);
        const allClips = await client.getStreamClips(coin.mint);

        // Test 2: Get only COMPLETE clips
        console.log(`   🎬 Testing getStreamClips (COMPLETE only)...`);
        const completeClips = await client.getStreamClips(coin.mint, 'COMPLETE');

        // Test 3: Get only HIGHLIGHT clips
        console.log(`   🌟 Testing getStreamClips (HIGHLIGHT only)...`);
        const highlightClips = await client.getStreamClips(coin.mint, 'HIGHLIGHT');

        console.log(`   ✅ Stream Clips Retrieved:`);
        console.log(`      📦 All Clips: ${allClips.length}`);
        console.log(`      🎬 Complete Clips: ${completeClips.length}`);
        console.log(`      🌟 Highlight Clips: ${highlightClips.length}`);

        // Display details about the clips
        if (allClips.length > 0) {
          const clipTypes = new Set(allClips.map(clip => clip.clipType));
          console.log(
            `      📋 Clip Types: ${Array.from(clipTypes).join(', ')}`
          );

          const totalDuration = allClips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
          const totalViews = allClips.reduce((sum, clip) => sum + (clip.view_count || 0), 0);

          console.log(`      ⏱️  Total Duration: ${totalDuration}s`);
          console.log(`      👁️ Total Views: ${totalViews.toLocaleString()}`);

          // Show clip URLs if available
          const clipsWithUrls = allClips.filter(clip => clip.clip_url);
          if (clipsWithUrls.length > 0) {
            console.log(`      🔗 Clips with URLs: ${clipsWithUrls.length}`);
          }

          // Show oldest and newest clips
          const sortedByDate = allClips
            .filter(clip => clip.created_at)
            .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());

          if (sortedByDate.length > 0) {
            const oldest = sortedByDate[0];
            const newest = sortedByDate[sortedByDate.length - 1];
            if (oldest && newest) {
              console.log(
                `      📅 Oldest Clip: ${new Date(oldest.created_at!).toLocaleString()} (${oldest.clipType})`
              );
              console.log(
                `      📅 Newest Clip: ${new Date(newest.created_at!).toLocaleString()} (${newest.clipType})`
              );
            }
          }
        } else {
          console.log(`      ⚠️ No clips found for this stream`);
        }

        clipTests.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          participants: coin.num_participants,
          allClips,
          completeClips,
          highlightClips,
        });
      } catch (error) {
        console.log(
          `   ❌ Error getting stream clips: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        // Add failed test entry
        clipTests.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          participants: coin.num_participants,
          allClips: [],
          completeClips: [],
          highlightClips: [],
        });
      }

      console.log('');
    }

    // Summary Statistics
    console.log(`📊 Stream Clips Summary:`);
    console.log(`   Total Tested: ${clipTests.length}`);

    if (clipTests.length > 0) {
      const totalAllClips = clipTests.reduce((sum, test) => sum + test.allClips.length, 0);
      const totalCompleteClips = clipTests.reduce(
        (sum, test) => sum + test.completeClips.length,
        0
      );
      const totalHighlightClips = clipTests.reduce(
        (sum, test) => sum + test.highlightClips.length,
        0
      );
      const streamsWithClips = clipTests.filter(test => test.allClips.length > 0).length;

      console.log(`   Streams with Clips: ${streamsWithClips}`);
      console.log(`   Total All Clips: ${totalAllClips}`);
      console.log(`   Total Complete Clips: ${totalCompleteClips}`);
      console.log(`   Total Highlight Clips: ${totalHighlightClips}`);

      if (totalAllClips > 0) {
        const averageClipsPerStream = (totalAllClips / clipTests.length).toFixed(1);
        console.log(`   Average Clips per Stream: ${averageClipsPerStream}`);

        // Clip type distribution
        const completePercentage = ((totalCompleteClips / totalAllClips) * 100).toFixed(1);
        const highlightPercentage = ((totalHighlightClips / totalAllClips) * 100).toFixed(1);
        console.log(
          `   Clip Type Distribution: ${completePercentage}% Complete, ${highlightPercentage}% Highlight`
        );
      }

      // Show streams with the most clips
      const sortedByClipCount = clipTests
        .filter(test => test.allClips.length > 0)
        .sort((a, b) => b.allClips.length - a.allClips.length)
        .slice(0, 3);

      if (sortedByClipCount.length > 0) {
        console.log(`\n🏆 Top ${sortedByClipCount.length} Streams by Clip Count:`);
        sortedByClipCount.forEach((test, index) => {
          console.log(`   ${index + 1}. ${test.name} (${test.symbol})`);
          console.log(`      📹 Total Clips: ${test.allClips.length}`);
          console.log(`      👥 Participants: ${test.participants}`);
          console.log(`      🔗 Mint: ${test.mint}`);
        });
      }
    }

    console.log('\n🎯 Stream Clips Usage Examples:');
    console.log('   // Get all clips for a stream');
    console.log('   const clips = await client.getStreamClips(mintId);');
    console.log('');
    console.log('   // Get only complete clips');
    console.log('   const completeClips = await client.getStreamClips(mintId, "COMPLETE");');
    console.log('');
    console.log('   // Get only highlight clips with pagination');
    console.log('   const highlights = await client.getStreamClips(mintId, "HIGHLIGHT", 5);');
    console.log('');
    console.log('   // Clip data structure');
    console.log('   clips.forEach(clip => {');
    console.log('     console.log(`Clip ID: ${clip.id}`);');
    console.log('     console.log(`Type: ${clip.clipType}`);');
    console.log('     console.log(`Duration: ${clip.duration}s`);');
    console.log('     console.log(`Views: ${clip.view_count}`);');
    console.log('     console.log(`URL: ${clip.clip_url}`);');
    console.log('   });');
    console.log('');
    console.log('💡 Stream Clips Features:');
    console.log('   • Support for COMPLETE and HIGHLIGHT clip types');
    console.log('   • Pagination with configurable limit (max 100)');
    console.log('   • Comprehensive validation of clip data');
    console.log('   • View count and duration information');
    console.log('   • Creation timestamps for chronological ordering');
    console.log('   • Clip URLs for video playback integration');

    return { client, clipTests };
  } catch (error) {
    console.error('❌ Error in stream clips example:', error);

    // Provide helpful error context
    if (error instanceof Error) {
      console.log('\n💡 Possible Solutions:');
      if (error.message.includes('rate limit')) {
        console.log('   • Wait before making another clips request');
        console.log('   • Check rate limit status with client.isRateLimited()');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        console.log('   • Check internet connection');
        console.log('   • Increase timeout configuration');
        console.log('   • Try again later');
      } else if (error.message.includes('API')) {
        console.log('   • Verify API endpoints are accessible');
        console.log('   • Check if clips endpoint is available');
      } else {
        console.log('   • Review error details above');
        console.log('   • Check client configuration');
      }
    }

    throw error;
  }
}
