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
export async function filterStreamsExample() {
  console.log('=== Get Live Streams Example (New API) ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    console.log('🔍 Demonstrating new filterStreams API with various options...\n');

    // Test 1: Basic live streams
    console.log('1️⃣ Getting basic live streams...');
    const basicResult = await client.filterStreams({
      limit: 5
    });
    const basicStreams = basicResult.streams;
    console.log(`✅ Found ${basicStreams.length} basic live streams`);

    // Test 2: Active streams with minimum participants
    console.log('\n2️⃣ Getting active streams (min 5 participants)...');
    const activeResult = await client.filterStreams({
      minParticipants: 5,
      limit: 5
    });
    const activeStreams = activeResult.streams;
    console.log(`✅ Found ${activeStreams.length} active streams with 5+ participants`);

    // Test 3: Top streams by participants
    console.log('\n3️⃣ Getting top streams by participants...');
    const topResult = await client.filterStreams({
      sortBy: 'participants',
      sortOrder: 'desc',
      limit: 5
    });
    const topStreams = topResult.streams;
    console.log(`✅ Found ${topStreams.length} top streams by participants`);

    // Test 4: Titled streams only
    console.log('\n4️⃣ Getting titled streams only...');
    const titledResult = await client.filterStreams({
      includeTitledOnly: true,
      limit: 5
    });
    const titledStreams = titledResult.streams;
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

    console.log('🎯 New filterStreams API Features:');
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
    console.error('❌ Error testing filterStreams API:', error);
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
    const result = await client.filterStreams({ limit: STREAM_INFO_LIMIT });
    const liveCoins = result.streams;

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
    const result = await client.filterStreams({ limit: STREAM_INFO_LIMIT });
    const liveCoins = result.streams;

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
    const result = await client.filterStreams({ limit: STREAM_INFO_LIMIT });
    const liveCoins = result.streams;

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
 * Example 21: Unified stream content retrieval
 *
 * This example demonstrates the new getStreamContent method that consolidates
 * all content access (clips, previous streams, highlights) into a single unified API.
 */
export async function getStreamContentExample() {
  console.log('=== Unified Stream Content Example ===');

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
    console.log('🔍 Getting live coins to test stream content...');
    const result = await client.filterStreams({ limit: STREAM_INFO_LIMIT });
    const liveCoins = result.streams;

    if (liveCoins.length === 0) {
      console.log('⚠️ No live coins found to test stream content');
      return { client, contentTests: [] };
    }

    console.log(
      `📹 Testing unified stream content for ${Math.min(liveCoins.length, MAX_STREAM_INFO_TEST)} coins...\n`
    );

    const contentTests: Array<{
      mint: string;
      name: string;
      symbol: string;
      participants: number;
      allContent: any;
      highlightsOnly: any;
      previousStreamsOnly: any;
      filteredContent: any;
    }> = [];

    for (let i = 0; i < Math.min(liveCoins.length, MAX_STREAM_INFO_TEST); i++) {
      const coin = liveCoins[i];
      if (!coin) {
        console.log(`${i + INDEX_OFFSET}. ⚠️ Skipping undefined coin data`);
        continue;
      }

      console.log(`${i + INDEX_OFFSET}. Testing unified content for: ${coin.name} (${coin.symbol})`);
      console.log(`   🔗 Mint: ${coin.mint}`);
      console.log(`   👥 Live Participants: ${coin.num_participants}`);
      console.log(`   📺 Stream Title: "${coin.livestream_title ?? 'No Title'}"`);

      try {
        // Test 1: Get all content types (default behavior)
        console.log(`   📦 Testing getStreamContent (all content types)...`);
        const allContent = await client.getStreamContent(coin.mint);

        // Test 2: Get only highlights
        console.log(`   🌟 Testing getStreamContent (highlights only)...`);
        const highlightsOnly = await client.getStreamContent(coin.mint, {
          contentType: 'highlights',
          maxHighlights: 10
        });

        // Test 3: Get only previous streams
        console.log(`   🎬 Testing getStreamContent (previous streams only)...`);
        const previousStreamsOnly = await client.getStreamContent(coin.mint, {
          contentType: 'previous_streams',
          maxPreviousStreams: 5
        });

        // Test 4: Get filtered content (clips with min duration and views)
        console.log(`   🔍 Testing getStreamContent (filtered clips)...`);
        const filteredContent = await client.getStreamContent(coin.mint, {
          contentType: 'clips',
          clipType: 'HIGHLIGHT',
          minDuration: 30,
          minViewCount: 10,
          sortBy: 'view_count',
          sortOrder: 'DESC',
          limit: 5
        });

        console.log(`   ✅ Stream Content Retrieved:`);

        // Display all content results
        if (allContent.clips && allContent.clips.length > 0) {
          console.log(`      📦 All Content: ${allContent.totalCount} items`);
          console.log(`         • Clips: ${allContent.contentSummary.clipsCount}`);
          console.log(`         • Previous Streams: ${allContent.contentSummary.previousStreamsCount}`);
          console.log(`         • Highlights: ${allContent.contentSummary.highlightsCount}`);
          console.log(`         • Processing Time: ${allContent.metrics.processingTimeMs}ms`);
          console.log(`         • Filters Applied: ${allContent.metrics.filtersApplied}`);

          const totalDuration = allContent.clips.reduce((sum, clip) => sum + (clip.duration || 0), 0);
          const totalViews = allContent.clips.reduce((sum, clip) => sum + (clip.view_count || 0), 0);
          console.log(`         • Total Duration: ${totalDuration}s`);
          console.log(`         • Total Views: ${totalViews.toLocaleString()}`);
        } else {
          console.log(`      ⚠️ No content found for this stream`);
        }

        // Display highlights results
        if (highlightsOnly.highlights && highlightsOnly.highlights.length > 0) {
          console.log(`      🌟 Highlights Only: ${highlightsOnly.contentSummary.highlightsCount} items`);
          console.log(`         • Processing Time: ${highlightsOnly.metrics.processingTimeMs}ms`);
        } else {
          console.log(`      ⚠️ No highlights found`);
        }

        // Display previous streams results
        if (previousStreamsOnly.previousStreams && previousStreamsOnly.previousStreams.length > 0) {
          console.log(`      🎬 Previous Streams Only: ${previousStreamsOnly.contentSummary.previousStreamsCount} items`);
          console.log(`         • Processing Time: ${previousStreamsOnly.metrics.processingTimeMs}ms`);
        } else {
          console.log(`      ⚠️ No previous streams found`);
        }

        // Display filtered results
        if (filteredContent.clips && filteredContent.clips.length > 0) {
          console.log(`      🔍 Filtered Clips: ${filteredContent.contentSummary.clipsCount} items`);
          console.log(`         • Min Duration: 30s, Min Views: 10`);
          console.log(`         • Sorted by: view_count (DESC)`);
          console.log(`         • Processing Time: ${filteredContent.metrics.processingTimeMs}ms`);
        } else {
          console.log(`      ⚠️ No clips matching filter criteria`);
        }

        contentTests.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          participants: coin.num_participants,
          allContent,
          highlightsOnly,
          previousStreamsOnly,
          filteredContent,
        });
      } catch (error) {
        console.log(
          `   ❌ Error getting stream content: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        // Add failed test entry
        contentTests.push({
          mint: coin.mint,
          name: coin.name,
          symbol: coin.symbol,
          participants: coin.num_participants,
          allContent: { totalCount: 0 },
          highlightsOnly: { contentSummary: { highlightsCount: 0 } },
          previousStreamsOnly: { contentSummary: { previousStreamsCount: 0 } },
          filteredContent: { contentSummary: { clipsCount: 0 } },
        });
      }

      console.log('');
    }

    // Summary Statistics
    console.log(`📊 Stream Content Summary:`);
    console.log(`   Total Tested: ${contentTests.length}`);

    if (contentTests.length > 0) {
      const totalAllContent = contentTests.reduce((sum, test) => sum + test.allContent.totalCount, 0);
      const totalHighlights = contentTests.reduce((sum, test) => sum + test.highlightsOnly.contentSummary.highlightsCount, 0);
      const totalPreviousStreams = contentTests.reduce((sum, test) => sum + test.previousStreamsOnly.contentSummary.previousStreamsCount, 0);
      const totalFiltered = contentTests.reduce((sum, test) => sum + test.filteredContent.contentSummary.clipsCount, 0);
      const streamsWithContent = contentTests.filter(test => test.allContent.totalCount > 0).length;

      console.log(`   Streams with Content: ${streamsWithContent}`);
      console.log(`   Total All Content: ${totalAllContent}`);
      console.log(`   Total Highlights: ${totalHighlights}`);
      console.log(`   Total Previous Streams: ${totalPreviousStreams}`);
      console.log(`   Total Filtered Clips: ${totalFiltered}`);

      if (totalAllContent > 0) {
        const averageContentPerStream = (totalAllContent / contentTests.length).toFixed(1);
        console.log(`   Average Content per Stream: ${averageContentPerStream}`);
      }

      // Show streams with the most content
      const sortedByContentCount = contentTests
        .filter(test => test.allContent.totalCount > 0)
        .sort((a, b) => b.allContent.totalCount - a.allContent.totalCount)
        .slice(0, 3);

      if (sortedByContentCount.length > 0) {
        console.log(`\n🏆 Top ${sortedByContentCount.length} Streams by Content Count:`);
        sortedByContentCount.forEach((test, index) => {
          console.log(`   ${index + 1}. ${test.name} (${test.symbol})`);
          console.log(`      📦 Total Content: ${test.allContent.totalCount}`);
          console.log(`      👥 Participants: ${test.participants}`);
          console.log(`      🔗 Mint: ${test.mint}`);
        });
      }
    }

    console.log('\n🎯 Unified Stream Content Usage Examples:');
    console.log('   // Get all content types');
    console.log('   const content = await client.getStreamContent(mintId);');
    console.log('');
    console.log('   // Get only highlights from last 7 days');
    console.log('   const highlights = await client.getStreamContent(mintId, {');
    console.log('     contentType: "highlights",');
    console.log('     daysBack: 7');
    console.log('   });');
    console.log('');
    console.log('   // Get clips with specific criteria');
    console.log('   const qualityClips = await client.getStreamContent(mintId, {');
    console.log('     contentType: "clips",');
    console.log('     clipType: "HIGHLIGHT",');
    console.log('     minDuration: 30,');
    console.log('     minViewCount: 100,');
    console.log('     sortBy: "view_count",');
    console.log('     sortOrder: "DESC"');
    console.log('   });');
    console.log('');
    console.log('   // Get content from specific date range');
    console.log('   const archivalContent = await client.getStreamContent(mintId, {');
    console.log('     dateRange: {');
    console.log('       start: "2024-01-01T00:00:00Z",');
    console.log('       end: "2024-01-31T23:59:59Z"');
    console.log('     }');
    console.log('   });');
    console.log('');
    console.log('💡 Unified Stream Content Features:');
    console.log('   • Single API for all content types (clips, previous streams, highlights)');
    console.log('   • Advanced filtering (duration, view count, date range, URL availability)');
    console.log('   • Multiple sorting options (created_at, duration, view_count, stream_start)');
    console.log('   • Content type selection (all, clips, previous_streams, highlights)');
    console.log('   • Pagination and limiting options');
    console.log('   • Performance metrics and processing time tracking');
    console.log('   • Comprehensive content summary statistics');

    return { client, contentTests };
  } catch (error) {
    console.error('❌ Error in stream content example:', error);

    // Provide helpful error context
    if (error instanceof Error) {
      console.log('\n💡 Possible Solutions:');
      if (error.message.includes('rate limit')) {
        console.log('   • Wait before making another content request');
        console.log('   • Check rate limit status with client.isRateLimited()');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        console.log('   • Check internet connection');
        console.log('   • Increase timeout configuration');
        console.log('   • Try again later');
      } else if (error.message.includes('API')) {
        console.log('   • Verify API endpoints are accessible');
        console.log('   • Check if content endpoints are available');
      } else {
        console.log('   • Review error details above');
        console.log('   • Check client configuration');
      }
    }

    throw error;
  }
}
