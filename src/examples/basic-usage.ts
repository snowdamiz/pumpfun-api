/**
 * Basic Usage Examples for PumpFun API Client
 *
 * This file contains essential examples showing how to install,
 * initialize, and use the PumpFun API client for core operations.
 *
 * USAGE:
 *   npx tsx src/examples/basic-usage.ts [demo-type]
 *
 * Available demo types:
 *   quick    - Quick functionality test (default)
 *   basic    - Basic initialization demo
 *   live     - Live streams API demo (with real API calls)
 *   unified  - Unified filtering examples (NEW advanced filtering)
 *   livekit  - LiveKit integration tests (validates refactoring)
 *   all      - Run all basic examples
 *
 * Examples:
 *   npx tsx src/examples/basic-usage.ts quick
 *   npx tsx src/examples/basic-usage.ts live
 *   npx tsx src/examples/basic-usage.ts unified
 *   npx tsx src/examples/basic-usage.ts livekit
 *   npx tsx src/examples/basic-usage.ts all
 *
 * @version 1.0.0
 * @author PumpFun Team
 */

// Import example modules
import * as setupExamples from './setup-examples';
import * as connectionExamples from './connection-examples';
import * as errorHandlingExamples from './error-handling-examples';
import * as livestreamExamples from './livestream-examples';
import * as bestPracticesExamples from './best-practices-examples';
import * as unifiedFilteringExamples from './unified-filtering-examples';
import * as livekitIntegrationTest from './livekit-integration-test';

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
// Re-export core example functions
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

// Live Stream API Usage Examples (Core Functions Only)
export const filterStreamsExample = livestreamExamples.filterStreamsExample;
export const getStreamInfoExample = livestreamExamples.getStreamInfoExample;
export const checkCreatorApprovalExample = livestreamExamples.checkCreatorApprovalExample;
export const joinLiveStreamExample = livestreamExamples.joinLiveStreamExample;
export const searchLiveStreamsExample = livestreamExamples.searchLiveStreamsExample;
export const getStreamStatisticsExample = livestreamExamples.getStreamStatisticsExample;
export const getStreamClipsExample = livestreamExamples.getStreamClipsExample;

// Best Practices Examples
export const productionBestPractices = bestPracticesExamples.productionBestPractices;
export const clientLifecycleManagement = bestPracticesExamples.clientLifecycleManagement;

// Unified Filtering Examples (NEW - replaces 11+ separate methods)
export const basicFilteringExamples = unifiedFilteringExamples.basicFilteringExamples;
export const advancedFilteringExamples = unifiedFilteringExamples.advancedFilteringExamples;
export const compoundQueryExamples = unifiedFilteringExamples.compoundQueryExamples;
export const customFilterExamples = unifiedFilteringExamples.customFilterExamples;
export const performanceExamples = unifiedFilteringExamples.performanceExamples;
export const migrationExamples = unifiedFilteringExamples.migrationExamples;
export const runUnifiedFilteringExamples = unifiedFilteringExamples.runUnifiedFilteringExamples;

// LiveKit Integration Tests (NEW - validates refactoring)
export const testLiveKitStreamManagerIntegration = livekitIntegrationTest.testLiveKitStreamManagerIntegration;
export const testConnectToLiveStreamIntegration = livekitIntegrationTest.testConnectToLiveStreamIntegration;
export const runLiveKitIntegrationTests = livekitIntegrationTest.runLiveKitIntegrationTests;

// ============================================================================
// Basic Example Runner
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

    // Live stream examples
    liveStreams: null as any,
    streamInfo: null as any,
    creatorApproval: null as any,
    joinStream: null as any,
    searchStreams: null as any,
    streamStatistics: null as any,
    streamClips: null as any,

    // Best practices examples
    production: null as PumpFunAPIClient | null,
    lifecycle: null as void | null,
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

    // Live stream API examples
    console.log('🔴 LIVE STREAM API EXAMPLES');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.liveStreams = await filterStreamsExample();
    console.log();

    results.streamInfo = await getStreamInfoExample();
    console.log();

    results.creatorApproval = await checkCreatorApprovalExample();
    console.log();

    results.joinStream = await joinLiveStreamExample();
    console.log();

    results.searchStreams = await searchLiveStreamsExample();
    console.log();

    results.streamStatistics = await getStreamStatisticsExample();
    console.log();

    results.streamClips = await getStreamClipsExample();
    console.log();

    // Best practices examples
    console.log('🏭 BEST PRACTICES EXAMPLES');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.production = productionBestPractices();
    console.log();

    // Lifecycle example
    console.log('🔄 LIFECYCLE MANAGEMENT');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.lifecycle = await clientLifecycleManagement();
    console.log();

    console.log('✅ All basic examples completed successfully!');
    console.log('\n🎉 Summary of core API functionality tested:');
    console.log('   • Client initialization and configuration');
    console.log('   • Connection testing and jurisdiction validation');
    console.log('   • Live streams with filtering (filterStreams)');
    console.log('   • Detailed stream information');
    console.log('   • Creator approval status checking');
    console.log('   • Live stream joining functionality');
    console.log('   • Keyword search across streams');
    console.log('   • Aggregate stream statistics');
    console.log('   • Stream clips retrieval');
    console.log('   • Error handling and rate limiting');
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
  productionBestPractices,
  clientLifecycleManagement,

  // Core live stream API examples
  filterStreamsExample,
  getStreamInfoExample,
  checkCreatorApprovalExample,
  joinLiveStreamExample,
  searchLiveStreamsExample,
  getStreamStatisticsExample,
  getStreamClipsExample,
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
    console.log('   examples.filterStreamsExample()');
    console.log('   ...and other core functions!');

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
    case 'quick':
      try {
        const success = quickTest();
        console.log(`\n🏁 Quick test ${success ? 'PASSED' : 'FAILED'}`);
        process.exit(success ? EXIT_SUCCESS : EXIT_FAILURE);
      } catch (err) {
        console.error('\n💥 Quick test crashed:', err);
        process.exit(EXIT_FAILURE);
      }
      break;

    case 'init':
      basicInitialization();
      console.log('\n✅ Basic initialization demo completed');
      break;

    case 'live':
      filterStreamsExample()
        .then(() => {
          console.log('\n✅ Live streams demo completed');
        })
        .catch(err => {
          console.error('\n💥 Live streams demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

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

    case 'join':
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
      searchLiveStreamsExample()
        .then(() => {
          console.log('\n✅ Search live streams demo completed');
        })
        .catch(err => {
          console.error('\n💥 Search live streams demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'stats':
      getStreamStatisticsExample()
        .then(() => {
          console.log('\n✅ Stream statistics demo completed');
        })
        .catch(err => {
          console.error('\n💥 Stream statistics demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'clips':
      getStreamClipsExample()
        .then(() => {
          console.log('\n✅ Stream clips demo completed');
        })
        .catch(err => {
          console.error('\n💥 Stream clips demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'unified':
      runUnifiedFilteringExamples()
        .then(() => {
          console.log('\n✅ Unified filtering examples completed');
        })
        .catch(err => {
          console.error('\n💥 Unified filtering examples failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'livekit':
      runLiveKitIntegrationTests()
        .then(() => {
          console.log('\n✅ LiveKit integration tests completed');
        })
        .catch(err => {
          console.error('\n💥 LiveKit integration tests failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'all':
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
      console.log('   live          - Live streams API demo');
      console.log('   streams       - Live streams API demo with filtering');
      console.log('   unified       - Unified filtering examples (NEW advanced filtering)');
      console.log('   livekit       - LiveKit integration tests (validates refactoring)');
      console.log('   approval      - Creator approval demo');
      console.log('   join          - Join live stream demo');
      console.log('   search        - Search live streams demo');
      console.log('   statistics    - Stream statistics demo');
      console.log('   clips         - Stream clips demo');
      console.log('   all           - Run all examples');
      console.log('');
      console.log('Usage: node basic-usage.ts [demo-type]');
      console.log('Example: node basic-usage.ts quick');
      console.log('Example: node basic-usage.ts livekit');
      console.log('Example: node basic-usage.ts unified');
      console.log('Example: node basic-usage.ts streams');
      process.exit(EXIT_FAILURE);
  }
}