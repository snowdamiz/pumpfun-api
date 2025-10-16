/**
 * Basic Usage Examples for PumpFun API Client
 *
 * This file contains essential examples showing how to install,
 * initialize, and use the PumpFun API client for core operations.
 *
 * USAGE:
 *   npx tsx src/examples/basic-usage.ts [demo-type]
 *
 * Examples:
 *   npx tsx src/examples/basic-usage.ts live
 *
 * @version 1.0.0
 * @author PumpFun Team
 */

// Import example modules
import * as livestreamExamples from './livestream-examples';
import * as unifiedFilteringExamples from './unified-filtering-examples';
import * as livekitExamples from './livekit-examples';

// Import constants and types
import { REPEAT_COUNT_60, ARGV_SLICE_START, EXIT_FAILURE } from './constants';

// ============================================================================
// Re-export core example functions
// ============================================================================

// Live Stream API Usage Examples (Core Functions Only)
export const filterStreamsExample = livestreamExamples.filterStreamsExample;
export const checkCreatorApprovalExample = livestreamExamples.checkCreatorApprovalExample;
export const joinLiveStreamExample = livestreamExamples.joinLiveStreamExample;
export const searchLiveStreamsExample = livestreamExamples.searchLiveStreamsExample;
export const getStreamStatisticsExample = livestreamExamples.getStreamStatisticsExample;
export const getStreamContentExample = livestreamExamples.getStreamContentExample;

// Unified Filtering Examples (NEW - replaces 11+ separate methods)
export const runUnifiedFilteringExamples = unifiedFilteringExamples.runUnifiedFilteringExamples;

// LiveKit Integration Examples
export const runAllLiveKitExamplesWithStreamManager = livekitExamples.runAllLiveKitExamplesWithStreamManager;

// ============================================================================
// Basic Example Runner
// ============================================================================

// Export individual examples for selective execution
export const examples = {
  // Core live stream API examples
  filterStreamsExample,
  checkCreatorApprovalExample,
  joinLiveStreamExample,
  searchLiveStreamsExample,
  getStreamStatisticsExample,
  getStreamContentExample,
};

// ============================================================================
// Direct execution block - runs when file is executed directly
// ============================================================================

/**
 * Check if this file is being run directly and execute appropriate demo
 */
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('basic-usage.ts')) {
  console.log('🚀 PumpFun API Client - Basic Usage Examples');
  console.log('='.repeat(REPEAT_COUNT_60));
  console.log('');

  console.log('📋 Available examples:');
  console.log('   1. Quick test (verifies basic functionality)');
  console.log('   2. Basic initialization demo');
  console.log('   3. Live streams demo (with API calls)');
  console.log('   4. Unified filtering examples (NEW advanced filtering)');
  console.log('   5. LiveKit integration tests (validates refactoring)');
  console.log('   6. All examples (comprehensive demo)');
  console.log('');

  // Get command line arguments
  const args = process.argv.slice(ARGV_SLICE_START);
  const demoType = args[0] ?? 'quick';

  console.log(`🎯 Running demo: ${demoType}`);
  console.log('');

  switch (demoType.toLowerCase()) {
    case 'live':
      filterStreamsExample()
        .then(() => {
          console.log('\n✅ Live streams demo completed');
        })
        .catch((err: unknown) => {
          console.error('\n💥 Live streams demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'approved':
      checkCreatorApprovalExample()
        .then(() => {
          console.log('\n✅ Creator approval demo completed');
        })
        .catch((err: unknown) => {
          console.error('\n💥 Creator approval demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'join':
      joinLiveStreamExample()
        .then(() => {
          console.log('\n✅ Join live stream demo completed');
        })
        .catch((err: unknown) => {
          console.error('\n💥 Join live stream demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'search':
      searchLiveStreamsExample()
        .then(() => {
          console.log('\n✅ Search live streams demo completed');
        })
        .catch((err: unknown) => {
          console.error('\n💥 Search live streams demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'stats':
      getStreamStatisticsExample()
        .then(() => {
          console.log('\n✅ Stream statistics demo completed');
        })
        .catch((err: unknown) => {
          console.error('\n💥 Stream statistics demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    
    case 'content':
      getStreamContentExample()
        .then(() => {
          console.log('\n✅ Stream content demo completed');
        })
        .catch((err: unknown) => {
          console.error('\n💥 Stream content demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'unified':
      runUnifiedFilteringExamples()
        .then(() => {
          console.log('\n✅ Unified filtering examples completed');
        })
        .catch((err: unknown) => {
          console.error('\n💥 Unified filtering examples failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'livekit':
      runAllLiveKitExamplesWithStreamManager()
        .then(() => {
          console.log('\n✅ LiveKit integration examples completed');
        })
        .catch((err: unknown) => {
          console.error('\n💥 LiveKit integration examples failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    default:
      console.log('❌ Unknown demo type. Available options:');
      console.log('   live          - Live streams API demo');
      console.log('   streams       - Live streams API demo with filtering');
      console.log('   unified       - Unified filtering examples (NEW advanced filtering)');
      console.log('   livekit       - LiveKit integration tests (validates refactoring)');
      console.log('   approval      - Creator approval demo');
      console.log('   join          - Join live stream demo');
      console.log('   search        - Search live streams demo');
      console.log('   statistics    - Stream statistics demo');
      console.log('   content       - Unified stream content demo (NEW)');
      process.exit(EXIT_FAILURE);
  }
}