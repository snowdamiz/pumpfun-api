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

// Import all example modules
import * as setupExamples from './setup-examples';
import * as connectionExamples from './connection-examples';
import * as errorHandlingExamples from './error-handling-examples';
import * as configurationExamples from './configuration-examples';
import * as livestreamExamples from './livestream-examples';
import * as bestPracticesExamples from './best-practices-examples';

// Import constants and types
import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel } from '../types';
import {
  REPEAT_COUNT_60,
  REPEAT_COUNT_50,
  ARGV_SLICE_START,
  EXIT_SUCCESS,
  EXIT_FAILURE,
} from './constants';

// ============================================================================
// Re-export all example functions from modules
// ============================================================================

// Setup and Installation Examples
export const basicInitialization = setupExamples.basicInitialization;
export const customConfiguration = setupExamples.customConfiguration;
export const environmentConfiguration = setupExamples.environmentConfiguration;

// Connection and Validation Examples
export const basicConnectionTest = connectionExamples.basicConnectionTest;
export const clientHealthCheck = connectionExamples.clientHealthCheck;
export const jurisdictionAndConnectionExample = connectionExamples.jurisdictionAndConnectionExample;

// Error Handling and Validation Examples
export const basicErrorHandling = errorHandlingExamples.basicErrorHandling;
export const configurationValidation = errorHandlingExamples.configurationValidation;

// Configuration Management Examples
export const runtimeConfiguration = configurationExamples.runtimeConfiguration;

// Live Stream API Usage Examples
export const getLiveCoinsExample = livestreamExamples.getLiveCoinsExample;
export const getActiveStreamsExample = livestreamExamples.getActiveStreamsExample;
export const getTopLiveStreamsExample = livestreamExamples.getTopLiveStreamsExample;
export const getTitledStreamsExample = livestreamExamples.getTitledStreamsExample;
export const getComprehensiveLiveDataExample = livestreamExamples.getComprehensiveLiveDataExample;
export const getStreamInfoExample = livestreamExamples.getStreamInfoExample;
export const checkCreatorApprovalExample = livestreamExamples.checkCreatorApprovalExample;
export const getLiveKitConnectionInfoExample = livestreamExamples.getLiveKitConnectionInfoExample;
export const getVideoStreamAnalysisExample = livestreamExamples.getVideoStreamAnalysisExample;
export const joinLiveStreamExample = livestreamExamples.joinLiveStreamExample;
export const searchLiveStreamsExample = livestreamExamples.searchLiveStreamsExample;

// Best Practices Examples
export const productionBestPractices = bestPracticesExamples.productionBestPractices;
export const clientLifecycleManagement = bestPracticesExamples.clientLifecycleManagement;

// ============================================================================
// Comprehensive Example Runner
// ============================================================================

/**
 * Run all basic examples in sequence
 */
export async function runAllBasicExamples() {
  console.log('🚀 Running all basic usage examples...\n');

  const results = {
    // Setup examples
    basicInit: null as PumpFunAPIClient | null,
    customConfig: null as PumpFunAPIClient | null,
    envConfig: null as PumpFunAPIClient | null,

    // Connection examples
    connectionTest: null as boolean | null,
    healthCheck: null as any,
    jurisdictionTest: null as any,

    // Error handling examples
    errorHandling: null as PumpFunAPIClient | null,
    validation: null as PumpFunAPIClient | null,

    // Configuration examples
    runtimeConfig: null as PumpFunAPIClient | null,

    // Best practices examples
    production: null as PumpFunAPIClient | null,
    lifecycle: null as void | null,

    // Live stream examples
    liveCoins: null as any,
    activeStreams: null as any,
    topStreams: null as any,
    titledStreams: null as any,
    comprehensiveData: null as any,
    streamInfo: null as any,
    creatorApproval: null as any,
    liveKitConnection: null as any,
    videoStreamAnalysis: null as any,
    joinStream: null as any,
    searchStreams: null as any,
  };

  try {
    // Setup examples
    console.log('📦 SETUP EXAMPLES');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.basicInit = basicInitialization();
    console.log();

    results.customConfig = customConfiguration();
    console.log();

    results.envConfig = environmentConfiguration();
    console.log();

    // Connection examples
    console.log('🔌 CONNECTION EXAMPLES');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.connectionTest = await basicConnectionTest();
    console.log();

    results.healthCheck = await clientHealthCheck();
    console.log();

    // Error handling examples
    console.log('🚨 ERROR HANDLING EXAMPLES');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.errorHandling = await basicErrorHandling();
    console.log();

    results.validation = configurationValidation();
    console.log();

    // Configuration examples
    console.log('⚙️ CONFIGURATION EXAMPLES');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.runtimeConfig = runtimeConfiguration();
    console.log();

    // Best practices examples
    console.log('🏭 BEST PRACTICES EXAMPLES');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.production = productionBestPractices();
    console.log();

    // Live stream API examples
    console.log('🔴 LIVE STREAM API EXAMPLES');
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

    results.creatorApproval = await checkCreatorApprovalExample();
    console.log();

    results.liveKitConnection = await getLiveKitConnectionInfoExample();
    console.log();

    results.videoStreamAnalysis = await getVideoStreamAnalysisExample();
    console.log();

    results.joinStream = await joinLiveStreamExample();
    console.log();

    results.searchStreams = await searchLiveStreamsExample();
    console.log();

    results.jurisdictionTest = await jurisdictionAndConnectionExample();
    console.log();

    // Lifecycle example
    console.log('🔄 LIFECYCLE MANAGEMENT');
    console.log('='.repeat(REPEAT_COUNT_60));
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
    console.log('   • Creator approval status checking');
    console.log('   • LiveKit video streaming connections');
    console.log('   • Comprehensive video stream analysis');
    console.log('   • Live stream joining functionality');
    console.log('   • Keyword search across streams');
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
  // Setup and configuration examples
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
  checkCreatorApprovalExample,
  getLiveKitConnectionInfoExample,
  getVideoStreamAnalysisExample,
  joinLiveStreamExample,
  searchLiveStreamsExample,
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
  console.log('   4. Creator approval demo (test isApprovedCreator)');
  console.log('   5. LiveKit video streaming demo (test getLiveKitConnectionInfo)');
  console.log('   6. Video stream analysis demo (test getVideoStreamAnalysis)');
  console.log('   7. Join live stream demo (test joinLiveStream)');
  console.log('   8. All examples (comprehensive demo)');
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

    case 'approval':
    case 'creator':
    case 'approved':
      checkCreatorApprovalExample()
        .then(() => {
          console.log('\n✅ Creator approval demo completed');
        })
        .catch(err => {
          console.error('\n💥 Creator approval demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'livekit':
    case 'video':
    case 'connection':
      getLiveKitConnectionInfoExample()
        .then(() => {
          console.log('\n✅ LiveKit connection demo completed');
        })
        .catch(err => {
          console.error('\n💥 LiveKit connection demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'analysis':
    case 'video-analysis':
    case 'stream-analysis':
    case 'comprehensive':
      getVideoStreamAnalysisExample()
        .then(() => {
          console.log('\n✅ Video stream analysis demo completed');
        })
        .catch(err => {
          console.error('\n💥 Video stream analysis demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'join':
    case 'join-stream':
    case 'joinlive':
    case 'live-join':
      joinLiveStreamExample()
        .then(() => {
          console.log('\n✅ Join live stream demo completed');
        })
        .catch(err => {
          console.error('\n💥 Join live stream demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'search':
    case 'search-streams':
    case 'stream-search':
      searchLiveStreamsExample()
        .then(() => {
          console.log('\n✅ Search live streams demo completed');
        })
        .catch(err => {
          console.error('\n💥 Search live streams demo failed:', err);
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
      console.log('   quick         - Quick functionality test');
      console.log('   basic         - Basic initialization demo');
      console.log('   live          - Live coins API demo');
      console.log('   approval      - Creator approval demo (isApprovedCreator)');
      console.log('   livekit       - LiveKit video streaming demo (getLiveKitConnectionInfo)');
      console.log('   analysis      - Video stream analysis demo (getVideoStreamAnalysis)');
      console.log('   join          - Join live stream demo (joinLiveStream)');
      console.log('   search        - Search live streams demo (searchLiveStreams)');
      console.log('   all           - Run all examples');
      console.log('');
      console.log('Usage: node basic-usage.ts [demo-type]');
      console.log('Example: node basic-usage.ts quick');
      console.log('');
      console.log('Video Analysis Options:');
      console.log('   analysis      - Video stream analysis demo');
      console.log('   video-analysis - Same as analysis');
      console.log('   stream-analysis - Same as analysis');
      console.log('   comprehensive  - Same as analysis');
      process.exit(EXIT_FAILURE);
  }
}
