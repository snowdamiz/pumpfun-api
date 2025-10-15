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
import * as advancedFilteringExamples from './advanced-filtering-examples';
import * as clipUtilitiesExamples from './clip-utilities-examples';
import * as livekitExamples from './livekit-examples';

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
export const getStreamStatisticsExample = livestreamExamples.getStreamStatisticsExample;
export const getStreamClipsExample = livestreamExamples.getStreamClipsExample;
export const demonstrateClipFilteringT050 = livestreamExamples.demonstrateClipFilteringT050;

// T051 Clip Utilities Examples
export const demonstrateDurationUtilities = clipUtilitiesExamples.demonstrateDurationUtilities;
export const demonstrateMetadataExtraction = clipUtilitiesExamples.demonstrateMetadataExtraction;
export const demonstrateSortingFilteringUtilities = clipUtilitiesExamples.demonstrateSortingFilteringUtilities;
export const demonstrateDataValidation = clipUtilitiesExamples.demonstrateDataValidation;
export const runClipUtilitiesExamples = clipUtilitiesExamples.runClipUtilitiesExamples;

// LiveKit Integration Examples (T041)
export const basicLiveKitConnection = livekitExamples.basicLiveKitConnection;
export const liveKitConnectionWithCallbacks = livekitExamples.liveKitConnectionWithCallbacks;
export const liveKitErrorHandling = livekitExamples.liveKitErrorHandling;
export const advancedConnectionManagement = livekitExamples.advancedConnectionManagement;

// LiveKitStreamManager Examples (T042)
export const basicLiveKitStreamManagerUsage = livekitExamples.basicLiveKitStreamManagerUsage;
export const liveKitStreamManagerWithConfig = livekitExamples.liveKitStreamManagerWithConfig;
export const liveKitStreamManagerMultipleConnections = livekitExamples.liveKitStreamManagerMultipleConnections;
export const liveKitStreamManagerReconnection = livekitExamples.liveKitStreamManagerReconnection;
export const liveKitStreamManagerErrorHandling = livekitExamples.liveKitStreamManagerErrorHandling;
export const liveKitStreamManagerLifecycle = livekitExamples.liveKitStreamManagerLifecycle;

// Advanced Filtering Examples (T043)
export const demonstratePredefinedFilters = advancedFilteringExamples.demonstratePredefinedFilters;
export const demonstrateCustomFilters = advancedFilteringExamples.demonstrateCustomFilters;
export const demonstrateComplexCriteria = advancedFilteringExamples.demonstrateComplexCriteria;
export const demonstrateCompoundQueries = advancedFilteringExamples.demonstrateCompoundQueries;
export const demonstratePerformanceComparison =
  advancedFilteringExamples.demonstratePerformanceComparison;
export const runAdvancedFilteringExamples = advancedFilteringExamples.runAdvancedFilteringExamples;

// Best Practices Examples
export const productionBestPractices = bestPracticesExamples.productionBestPractices;
export const clientLifecycleManagement = bestPracticesExamples.clientLifecycleManagement;

// LiveKit Integration Examples (T041) are now imported from livekit-examples.ts

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
    streamStatistics: null as any,

    // LiveKit integration examples (T041)
    liveKitBasic: null as any,
    liveKitCallbacks: null as any,
    liveKitErrorHandling: null as any,
    liveKitAdvanced: null as any,

    // LiveKitStreamManager examples (T042)
    streamManagerBasic: null as any,
    streamManagerConfig: null as any,
    streamManagerMultiple: null as any,
    streamManagerReconnection: null as any,
    streamManagerErrorHandling: null as any,
    streamManagerLifecycle: null as any,

    // T050 clip filtering examples
    clipFilteringT050: null as any,

    // T051 clip utilities examples
    durationUtilities: null as any,
    metadataExtraction: null as any,
    sortingFiltering: null as any,
    dataValidation: null as any,

    // Advanced filtering examples (T043)
    predefinedFilters: null as any,
    customFilters: null as any,
    complexCriteria: null as any,
    compoundQueries: null as any,
    performanceComparison: null as any,
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

    results.streamStatistics = await getStreamStatisticsExample();
    console.log();

    // LiveKit integration examples (T041)
    console.log('🔴 LIVEKIT INTEGRATION EXAMPLES (T041)');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.liveKitBasic = await livekitExamples.basicLiveKitConnection();
    console.log();

    results.liveKitCallbacks = await livekitExamples.liveKitConnectionWithCallbacks();
    console.log();

    results.liveKitErrorHandling = await livekitExamples.liveKitErrorHandling();
    console.log();

    results.liveKitAdvanced = await livekitExamples.advancedConnectionManagement();
    console.log();

    // LiveKitStreamManager examples (T042)
    console.log('🎛️ LIVEKIT STREAM MANAGER EXAMPLES (T042)');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.streamManagerBasic = await livekitExamples.basicLiveKitStreamManagerUsage();
    console.log();

    results.streamManagerConfig = await livekitExamples.liveKitStreamManagerWithConfig();
    console.log();

    results.streamManagerMultiple = await livekitExamples.liveKitStreamManagerMultipleConnections();
    console.log();

    results.streamManagerReconnection = await livekitExamples.liveKitStreamManagerReconnection();
    console.log();

    results.streamManagerErrorHandling = await livekitExamples.liveKitStreamManagerErrorHandling();
    console.log();

    results.streamManagerLifecycle = await livekitExamples.liveKitStreamManagerLifecycle();
    console.log();

    // T050 clip filtering examples
    console.log('🎬 T050 CLIP FILTERING EXAMPLES');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.clipFilteringT050 = await demonstrateClipFilteringT050();
    console.log();

    // T051 clip utilities examples
    console.log('🛠️ T051 CLIP UTILITIES EXAMPLES');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.durationUtilities = await demonstrateDurationUtilities();
    console.log();

    results.metadataExtraction = await demonstrateMetadataExtraction();
    console.log();

    results.sortingFiltering = await demonstrateSortingFilteringUtilities();
    console.log();

    results.dataValidation = await demonstrateDataValidation();
    console.log();

    // Advanced filtering examples (T043)
    console.log('🔍 ADVANCED FILTERING EXAMPLES (T043)');
    console.log('='.repeat(REPEAT_COUNT_60));
    results.predefinedFilters = await demonstratePredefinedFilters();
    console.log();

    results.customFilters = await demonstrateCustomFilters();
    console.log();

    results.complexCriteria = await demonstrateComplexCriteria();
    console.log();

    results.compoundQueries = await demonstrateCompoundQueries();
    console.log();

    results.performanceComparison = await demonstratePerformanceComparison();
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
    console.log('   • Built-in LiveKit WebRTC integration (T041)');
    console.log('   • LiveKit connection management and error handling');
    console.log('   • Audio/video controls and WebRTC statistics');
    console.log('   • Multiple LiveKit connection management');
    console.log('   • LiveKitStreamManager helper class (T042)');
    console.log('   • Advanced WebRTC connection lifecycle management');
    console.log('   • Automatic reconnection and error recovery');
    console.log('   • Multiple StreamManager connection handling');
    console.log('   • Keyword search across streams');
    console.log('   • Aggregate stream statistics');
    console.log('   • Advanced filtering with custom criteria (T043)');
    console.log('   • Predefined filter builders (high-quality, trending, professional)');
    console.log('   • Complex multi-criteria filtering');
    console.log('   • Compound filter queries with AND/OR logic');
    console.log('   • Performance optimization and metrics');
    console.log('   • T051 clip utilities (duration calculation, metadata extraction)');
    console.log('   • Data validation and quality assessment');
    console.log('   • Clip sorting and filtering utilities');
    console.log('   • Comprehensive analysis reporting');
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
  getStreamStatisticsExample,
  getStreamClipsExample,
  jurisdictionAndConnectionExample,

  // Advanced filtering examples (T043)
  demonstratePredefinedFilters,
  demonstrateCustomFilters,
  demonstrateComplexCriteria,
  demonstrateCompoundQueries,
  demonstratePerformanceComparison,
  runAdvancedFilteringExamples,

  // T050 clip filtering examples
  demonstrateClipFilteringT050,

  // T051 clip utilities examples
  demonstrateDurationUtilities,
  demonstrateMetadataExtraction,
  demonstrateSortingFilteringUtilities,
  demonstrateDataValidation,
  runClipUtilitiesExamples,

  // LiveKit integration examples (T041) - imported from livekit-examples
  ...livekitExamples,

  // LiveKitStreamManager examples (T042) - imported from livekit-examples
  basicLiveKitStreamManagerUsage,
  liveKitStreamManagerWithConfig,
  liveKitStreamManagerMultipleConnections,
  liveKitStreamManagerReconnection,
  liveKitStreamManagerErrorHandling,
  liveKitStreamManagerLifecycle,
  runAllLiveKitExamplesWithStreamManager: livekitExamples.runAllLiveKitExamplesWithStreamManager,

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
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('basic-usage.ts')) {
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
  console.log('   8. Stream statistics demo (test getStreamStatistics)');
  console.log('   9. Stream clips demo (test getStreamClips)');
  console.log('   10. T050 clip filtering demo (advanced filtering and sorting)');
  console.log('   11. T051 clip utilities demo (duration calculation, metadata extraction)');
  console.log('   12. Advanced filtering demo (T043 - custom filters, compound queries)');
  console.log('   13. All examples (comprehensive demo)');
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

    case 'statistics':
    case 'stats':
    case 'stream-statistics':
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
    case 'stream-clips':
    case 'get-stream-clips':
      getStreamClipsExample()
        .then(() => {
          console.log('\n✅ Stream clips demo completed');
        })
        .catch(err => {
          console.error('\n💥 Stream clips demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'clip-filtering':
    case 'advanced-clips':
      demonstrateClipFilteringT050()
        .then(() => {
          console.log('\n✅ T050 clip filtering demo completed');
        })
        .catch(err => {
          console.error('\n💥 T050 clip filtering demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'clip-utilities':
    case 'duration-utilities':
    case 'clip-utils':
      runClipUtilitiesExamples()
        .then(() => {
          console.log('\n✅ T051 clip utilities demo completed');
        })
        .catch(err => {
          console.error('\n💥 T051 clip utilities demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'livekit-integration':
    case 'livekit-webRTC':
    case 'webrtc':
    case 'connect-live':
      livekitExamples.runAllLiveKitExamplesWithStreamManager()
        .then(() => {
          console.log('\n✅ Complete LiveKit integration demo completed');
          console.log('🎉 This demonstrates production-ready LiveKit functionality with:');
          console.log('   • Real LiveKit SDK integration');
          console.log('   • WebRTC connection management');
          console.log('   • Advanced streaming scenarios');
          console.log('   • Built-in LiveKit integration (T041)');
          console.log('   • LiveKitStreamManager helper class (T042)');
        })
        .catch(err => {
          console.error('\n💥 LiveKit integration demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'stream-manager':
    case 'livestream-manager':
    case 'livestreammanager':
    case 't042':
      livekitExamples.runAllLiveKitExamplesWithStreamManager()
        .then(() => {
          console.log('\n✅ LiveKitStreamManager demo completed');
        })
        .catch(err => {
          console.error('\n💥 LiveKitStreamManager demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'livekit-basic':
    case 'webrtc-basic':
      livekitExamples.basicLiveKitConnection()
        .then(() => {
          console.log('\n✅ Basic LiveKit connection demo completed');
        })
        .catch(err => {
          console.error('\n💥 Basic LiveKit connection demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'livekit-callbacks':
    case 'webrtc-callbacks':
      livekitExamples.liveKitConnectionWithCallbacks()
        .then(() => {
          console.log('\n✅ LiveKit callbacks demo completed');
        })
        .catch(err => {
          console.error('\n💥 LiveKit callbacks demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'livekit-multi':
    case 'webrtc-multi':
      livekitExamples.advancedConnectionManagement()
        .then(() => {
          console.log('\n✅ Multiple LiveKit connections demo completed');
        })
        .catch(err => {
          console.error('\n💥 Multiple LiveKit connections demo failed:', err);
          process.exit(EXIT_FAILURE);
        });
      break;

    case 'advanced':
    case 'filtering':
    case 'advanced-filtering':
      runAdvancedFilteringExamples()
        .then(() => {
          console.log('\n✅ Advanced filtering demo completed');
        })
        .catch(err => {
          console.error('\n💥 Advanced filtering demo failed:', err);
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
      console.log('   statistics    - Stream statistics demo (getStreamStatistics)');
      console.log('   clips         - Stream clips demo (getStreamClips)');
      console.log('   clip-filter   - Clip filtering demo (advanced filtering and sorting)');
      console.log('   clip-utils    - Clip utilities demo (duration, metadata, validation)');
      console.log('');
      console.log('🔴 LiveKit Integration Options (Production-Ready WebRTC):');
      console.log('   livekit-integration - Complete LiveKit integration demo (T041 + T042)');
      console.log('   livekit-basic  - Basic LiveKit connection demo');
      console.log('   livekit-callbacks - LiveKit with event callbacks demo');
      console.log('   livekit-multi  - Multiple LiveKit connections demo');
      console.log('   stream-manager - LiveKitStreamManager advanced management demo');
      console.log('   webrtc        - Alias for livekit-integration');
      console.log('   webrtc-basic  - Alias for livekit-basic');
      console.log('   webrtc-callbacks - Alias for livekit-callbacks');
      console.log('   webrtc-multi  - Alias for livekit-multi');
      console.log('');
      console.log('🔍 Advanced Options:');
      console.log(
        '   advanced      - Advanced filtering demo (T043 - custom filters, compound queries)'
      );
      console.log('   all           - Run all examples');
      console.log('');
      console.log('Usage: node basic-usage.ts [demo-type]');
      console.log('Example: node basic-usage.ts quick');
      console.log('Example: node basic-usage.ts livekit-integration');
      console.log('');
      console.log('Video Analysis Options:');
      console.log('   analysis      - Video stream analysis demo');
      console.log('   video-analysis - Same as analysis');
      console.log('   stream-analysis - Same as analysis');
      console.log('   comprehensive  - Same as analysis');
      process.exit(EXIT_FAILURE);
  }
}
