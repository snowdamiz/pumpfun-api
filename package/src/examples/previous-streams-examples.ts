/**
 * Previous Streams Examples for PumpFun API Client
 *
 * This module demonstrates the new previous streams video fetching functionality.
 * It shows how to retrieve full completed streams and highlight segments.
 *
 * USAGE:
 *   npx tsx src/examples/previous-streams-examples.ts
 *
 * @version 1.0.0
 * @author PumpFun Team
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel } from '../types';

/**
 * Example 1: Get Previous Streams (Full Completed Streams)
 *
 * Demonstrates how to retrieve complete previous stream recordings
 * that represent the full duration of past livestreams.
 */
export async function demonstratePreviousStreams() {
  console.log('=== Previous Streams Example ===');

  const client = new PumpFunAPIClient({
    timeout: 15000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    // Get some live coins to test with
    console.log('🔍 Getting live coins to test previous streams...');
    const liveCoins = await client.getLiveCoins({ limit: 3 });

    if (liveCoins.length === 0) {
      console.log('⚠️ No live coins found to test previous streams');
      return { client, results: [] };
    }

    const results: Array<{
      mint: string;
      name: string;
      symbol: string;
      previousStreams: any[];
      count: number;
      totalDuration: number;
    }> = [];

    for (let i = 0; i < Math.min(liveCoins.length, 3); i++) {
      const coin = liveCoins[i];
      console.log(`\n${i + 1}. Testing previous streams for: ${coin.name} (${coin.symbol})`);
      console.log(`   🔗 Mint: ${coin.mint}`);

      try {
        // Get previous streams
        const previousStreams = await client.getPreviousStreams(coin.mint, 5);

        if (previousStreams.length > 0) {
          const totalDuration = previousStreams.reduce((sum, stream) => sum + stream.duration, 0);

          console.log(`   ✅ Found ${previousStreams.length} previous streams`);
          console.log(`   ⏱️  Total duration: ${Math.round(totalDuration / 60)} minutes`);
          console.log(`   📊 Average duration: ${Math.round(totalDuration / previousStreams.length / 60)} minutes`);

          // Show sample stream details
          const sampleStream = previousStreams[0];
          console.log(`   📋 Sample Stream Details:`);
          console.log(`      🆔 ID: ${sampleStream.id}`);
          console.log(`      ⏱️  Duration: ${Math.round(sampleStream.duration / 60)} minutes`);
          console.log(`      📅 Created: ${new Date(sampleStream.created_at).toLocaleDateString()}`);
          console.log(`      🎬 Stream: ${sampleStream.startTime} → ${sampleStream.endTime}`);
          console.log(`      📺 Playlist URL: ${sampleStream.playlistUrl ? 'Available' : 'Not Available'}`);
          console.log(`      🖼️  Thumbnail: ${sampleStream.thumbnailUrl ? 'Available' : 'Not Available'}`);

          results.push({
            mint: coin.mint,
            name: coin.name,
            symbol: coin.symbol,
            previousStreams,
            count: previousStreams.length,
            totalDuration,
          });
        } else {
          console.log(`   ⚠️ No previous streams found`);
          results.push({
            mint: coin.mint,
            name: coin.name,
            symbol: coin.symbol,
            previousStreams: [],
            count: 0,
            totalDuration: 0,
          });
        }
      } catch (error) {
        console.log(`   ❌ Error getting previous streams: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('\n📊 Previous Streams Summary:');
    const totalPreviousStreams = results.reduce((sum, result) => sum + result.count, 0);
    const totalDuration = results.reduce((sum, result) => sum + result.totalDuration, 0);

    console.log(`   Total Previous Streams: ${totalPreviousStreams}`);
    console.log(`   Total Duration: ${Math.round(totalDuration / 60)} minutes`);
    console.log(`   Average Per Token: ${totalPreviousStreams > 0 ? Math.round(totalDuration / totalPreviousStreams / 60) : 0} minutes`);

    console.log('\n💡 Previous Streams Usage:');
    console.log('   import { PumpFunAPIClient } from "@pumpfun/api-client";');
    console.log('   const client = new PumpFunAPIClient();');
    console.log('   const previousStreams = await client.getPreviousStreams(mintId, 10);');
    console.log('   // Each stream includes HLS playlistUrl for full video playback');

    return { client, results };
  } catch (error) {
    console.error('❌ Error in previous streams example:', error);
    throw error;
  }
}

/**
 * Example 2: Get Stream Highlights (Short Segments)
 *
 * Demonstrates how to retrieve short highlight segments that are
 * automatically generated from stream content.
 */
export async function demonstrateStreamHighlights() {
  console.log('\n=== Stream Highlights Example ===');

  const client = new PumpFunAPIClient({
    timeout: 15000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    // Get some live coins to test with
    console.log('🔍 Getting live coins to test stream highlights...');
    const liveCoins = await client.getLiveCoins({ limit: 3 });

    if (liveCoins.length === 0) {
      console.log('⚠️ No live coins found to test stream highlights');
      return { client, results: [] };
    }

    const results: Array<{
      mint: string;
      name: string;
      symbol: string;
      highlights: any[];
      count: number;
      totalViews: number;
    }> = [];

    for (let i = 0; i < Math.min(liveCoins.length, 3); i++) {
      const coin = liveCoins[i];
      console.log(`\n${i + 1}. Testing stream highlights for: ${coin.name} (${coin.symbol})`);
      console.log(`   🔗 Mint: ${coin.mint}`);

      try {
        // Get stream highlights
        const highlights = await client.getStreamHighlights(coin.mint, 10);

        if (highlights.length > 0) {
          const totalViews = highlights.reduce((sum, highlight) => sum + (highlight.view_count || 0), 0);

          console.log(`   ✅ Found ${highlights.length} highlights`);
          console.log(`   👁️ Total views: ${totalViews.toLocaleString()}`);
          console.log(`   📊 Average views: ${totalViews > 0 ? Math.round(totalViews / highlights.length).toLocaleString() : 0}`);

          // Show sample highlight details
          const sampleHighlight = highlights[0];
          console.log(`   📋 Sample Highlight Details:`);
          console.log(`      🆔 ID: ${sampleHighlight.id}`);
          console.log(`      ⏱️  Duration: ${sampleHighlight.duration} seconds`);
          console.log(`      👁️ Views: ${sampleHighlight.view_count?.toLocaleString() || 'N/A'}`);
          console.log(`      📅 Created: ${new Date(sampleHighlight.created_at).toLocaleDateString()}`);
          console.log(`      🎬 Creator: ${sampleHighlight.highlightCreatorAddress || 'Unknown'}`);
          console.log(`      📺 MP4 URL: ${sampleHighlight.mp4Url ? 'Available' : 'Not Available'}`);
          console.log(`      🖼️  Thumbnail: ${sampleHighlight.thumbnailUrl ? 'Available' : 'Not Available'}`);

          results.push({
            mint: coin.mint,
            name: coin.name,
            symbol: coin.symbol,
            highlights,
            count: highlights.length,
            totalViews,
          });
        } else {
          console.log(`   ⚠️ No highlights found`);
          results.push({
            mint: coin.mint,
            name: coin.name,
            symbol: coin.symbol,
            highlights: [],
            count: 0,
            totalViews: 0,
          });
        }
      } catch (error) {
        console.log(`   ❌ Error getting stream highlights: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('\n📊 Stream Highlights Summary:');
    const totalHighlights = results.reduce((sum, result) => sum + result.count, 0);
    const totalViews = results.reduce((sum, result) => sum + result.totalViews, 0);

    console.log(`   Total Highlights: ${totalHighlights}`);
    console.log(`   Total Views: ${totalViews.toLocaleString()}`);
    console.log(`   Average Views: ${totalHighlights > 0 ? Math.round(totalViews / totalHighlights).toLocaleString() : 0}`);

    console.log('\n💡 Stream Highlights Usage:');
    console.log('   import { PumpFunAPIClient } from "@pumpfun/api-client";');
    console.log('   const client = new PumpFunAPIClient();');
    console.log('   const highlights = await client.getStreamHighlights(mintId, 20);');
    console.log('   // Each highlight includes direct MP4 URL for download/playback');

    return { client, results };
  } catch (error) {
    console.error('❌ Error in stream highlights example:', error);
    throw error;
  }
}

/**
 * Example 3: Get Comprehensive Stream History
 *
 * Demonstrates how to retrieve a complete view of all available video content
 * for a token, including both previous streams and highlights.
 */
export async function demonstrateStreamHistory() {
  console.log('\n=== Stream History Example ===');

  const client = new PumpFunAPIClient({
    timeout: 15000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    // Get a specific coin with known previous streams
    const testMintId = '43yfnktSfyKkPXRLyevHu8rNXwWHxTXS1ntQbeArpump'; // Example from investigation

    console.log(`🔍 Getting comprehensive stream history for mint: ${testMintId}`);

    try {
      // Get complete stream history
      const history = await client.getStreamHistory(testMintId, {
        maxPreviousStreams: 10,
        maxHighlights: 25,
        daysBack: 30, // Last 30 days
        sortBy: 'created_at',
        sortOrder: 'DESC'
      });

      console.log(`\n📊 Stream History Results:`);
      console.log(`   🎬 Previous Streams: ${history.totalPreviousStreams}`);
      console.log(`   🌟 Highlights: ${history.totalHighlights}`);
      console.log(`   📹 Total Clips: ${history.totalClips}`);
      console.log(`   ⏱️  Total Duration: ${Math.round(history.totalDuration / 60)} minutes`);
      console.log(`   👁️ Total Views: ${history.totalViews.toLocaleString()}`);
      console.log(`   📊 Average Duration: ${Math.round(history.averageDuration)} seconds`);

      // Show breakdown by type
      console.log(`\n📋 Content Breakdown:`);

      if (history.previousStreams.length > 0) {
        const previousDuration = history.previousStreams.reduce((sum, stream) => sum + stream.duration, 0);
        console.log(`   🎬 Previous Streams (${history.previousStreams.length}):`);
        console.log(`      ⏱️  Total: ${Math.round(previousDuration / 60)} minutes`);
        console.log(`      📊 Average: ${Math.round(previousDuration / history.previousStreams.length / 60)} minutes`);

        // Show most recent previous stream
        const mostRecent = history.previousStreams[0];
        console.log(`      🕐 Most Recent: ${new Date(mostRecent.created_at).toLocaleDateString()}`);
        console.log(`      ⏱️  Duration: ${Math.round(mostRecent.duration / 60)} minutes`);
      }

      if (history.highlights.length > 0) {
        const highlightViews = history.highlights.reduce((sum, highlight) => sum + (highlight.view_count || 0), 0);
        console.log(`   🌟 Highlights (${history.highlights.length}):`);
        console.log(`      👁️ Total Views: ${highlightViews.toLocaleString()}`);
        console.log(`      📊 Average Views: ${Math.round(highlightViews / history.highlights).toLocaleString()}`);

        // Show most viewed highlight
        const mostViewed = history.highlights.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))[0];
        console.log(`      🏆 Most Viewed: ${mostViewed.view_count?.toLocaleString() || 'N/A'} views`);
        console.log(`      ⏱️  Duration: ${mostViewed.duration} seconds`);
      }

      console.log(`\n💡 Stream History Usage:`);
      console.log('   import { PumpFunAPIClient } from "@pumpfun/api-client";');
      console.log('   const client = new PumpFunAPIClient();');
      console.log('   const history = await client.getStreamHistory(mintId, {');
      console.log('     daysBack: 7,');
      console.log('     maxPreviousStreams: 5,');
      console.log('     maxHighlights: 20');
      console.log('   });');

      return { client, history };
    } catch (error) {
      console.log(`   ❌ Error getting stream history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`   ℹ️  This might be expected if the mint has no previous streams`);

      // Try with a different approach - get live coins and test the first one
      console.log(`\n🔄 Trying with live coins instead...`);
      const liveCoins = await client.getLiveCoins({ limit: 1 });

      if (liveCoins.length > 0) {
        const coin = liveCoins[0];
        console.log(`   🎯 Testing with: ${coin.name} (${coin.symbol})`);

        try {
          const fallbackHistory = await client.getStreamHistory(coin.mint, {
            maxPreviousStreams: 3,
            maxHighlights: 5,
          });

          console.log(`   ✅ Success! Found ${fallbackHistory.totalClips} total clips`);
          return { client, history: fallbackHistory };
        } catch (fallbackError) {
          console.log(`   ⚠️ No stream history available for this token either`);
        }
      }

      return { client, history: null };
    }
  } catch (error) {
    console.error('❌ Error in stream history example:', error);
    throw error;
  }
}

/**
 * Main function to run all previous streams examples
 */
export async function runPreviousStreamsExamples() {
  console.log('🚀 Running Previous Streams Examples...\n');

  const results = {
    previousStreams: null as any,
    highlights: null as any,
    history: null as any,
  };

  try {
    // Run all examples
    console.log('🎬 PREVIOUS STREAMS');
    console.log('='.repeat(60));
    results.previousStreams = await demonstratePreviousStreams();
    console.log('');

    console.log('🌟 STREAM HIGHLIGHTS');
    console.log('='.repeat(60));
    results.highlights = await demonstrateStreamHighlights();
    console.log('');

    console.log('📊 COMPREHENSIVE STREAM HISTORY');
    console.log('='.repeat(60));
    results.history = await demonstrateStreamHistory();
    console.log('');

    console.log('🎉 All previous streams examples completed successfully!');
    console.log('\n📊 Summary of functionality demonstrated:');
    console.log('   ✅ Previous streams (full completed stream videos)');
    console.log('   ✅ Stream highlights (short highlight segments)');
    console.log('   ✅ Comprehensive stream history with statistics');
    console.log('   ✅ HLS streaming URLs for full video playback');
    console.log('   ✅ Direct MP4 URLs for highlight downloads');
    console.log('   ✅ Advanced filtering and sorting options');
    console.log('   ✅ Date range filtering');
    console.log('   ✅ View count and duration analytics');

    console.log('\n🚀 Previous Streams Ready for Production Use!');
    console.log('   • COMPLETE clips = Full previous stream recordings (VOD)');
    console.log('   • HIGHLIGHT clips = Short highlight segments (15-60s)');
    console.log('   • Comprehensive API with filtering and analytics');
    console.log('   • HLS streaming for full videos');
    console.log('   • Direct MP4 downloads for highlights');

    return results;
  } catch (error) {
    console.error('❌ Previous streams examples failed:', error);
    throw error;
  }
}

// Export all individual examples for selective execution
export const previousStreamsExamples = {
  demonstratePreviousStreams,
  demonstrateStreamHighlights,
  demonstrateStreamHistory,
  runPreviousStreamsExamples,
};

// Export default runner
export default runPreviousStreamsExamples;

// ============================================================================
// Direct execution block - runs when file is executed directly
// ============================================================================

/**
 * Check if this file is being run directly and execute the examples
 */
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('previous-streams-examples.ts')) {
  console.log('🚀 Previous Streams Examples for PumpFun API Client');
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 Available examples:');
  console.log('   1. Previous streams (full completed stream videos)');
  console.log('   2. Stream highlights (short highlight segments)');
  console.log('   3. Comprehensive stream history with analytics');
  console.log('   4. All examples (comprehensive demo)');
  console.log('');

  runPreviousStreamsExamples()
    .then(() => {
      console.log('\n🎉 Previous streams examples completed successfully!');
    })
    .catch(err => {
      console.error('\n💥 Previous streams examples execution failed:', err);
      process.exit(1);
    });
}