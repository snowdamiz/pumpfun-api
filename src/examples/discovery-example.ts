/**
 * Example: API Discovery and Endpoint Testing
 *
 * This example demonstrates how to use the API discovery and endpoint testing
 * utilities to discover and verify PumpFun's streaming API endpoints.
 */

import { createAPIDiscovery, APIDiscovery } from '../utils/api-discovery';
import { createEndpointTester, EndpointTester } from '../utils/endpoint-tester';
import { Logger } from '../utils/logger';
import { AuthType } from '../types/common';

/**
 * Main discovery and testing example
 */
async function runDiscoveryAndTesting() {
  const logger = new Logger({}, { component: 'DiscoveryExample' });

  logger.info('Starting PumpFun API discovery and testing example...');

  try {
    // Step 1: Configure discovery
    const discoveryConfig = {
      baseURL: 'https://pump.fun',
      timeout: 10000,
      enableNetworkAnalysis: true,
      enableResponseLogging: false,
      maxConcurrentRequests: 3,
      requestDelay: 1000,
    };

    // Step 2: Create API discovery instance
    const discovery: APIDiscovery = createAPIDiscovery(discoveryConfig);

    logger.info('Step 1: Discovering API endpoints...');
    const discoveryResults = await discovery.discoverEndpoints();

    // Display discovery results
    logger.info('Discovery Results:', {
      totalEndpoints: discoveryResults.endpoints.length,
      activeEndpoints: discoveryResults.endpoints.filter(e => e.isActive).length,
      authMethods: discoveryResults.authenticationMethods,
      confidence: discoveryResults.documentation.confidence,
    });

    // Log discovered endpoints
    logger.info('Discovered Endpoints:');
    discoveryResults.endpoints.forEach((endpoint, index) => {
      console.log(`${index + 1}. ${endpoint.method} ${endpoint.url}`);
      console.log(`   Description: ${endpoint.description || 'No description'}`);
      console.log(`   Status: ${endpoint.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   Discovered: ${endpoint.discoveredAt}`);
      console.log('');
    });

    // Step 3: Configure endpoint testing
    const testConfig = {
      timeout: 15000,
      retryAttempts: 2,
      retryDelay: 1000,
      enableDetailedLogging: true,
      validateResponses: true,
      testAuthMethods: ['NONE', 'BEARER_TOKEN', 'API_KEY'] as AuthType[],
      customHeaders: {
        'User-Agent': 'pumpfun-api-discovery-example/1.0.0',
      },
    };

    // Step 4: Create endpoint tester instance
    const tester: EndpointTester = createEndpointTester(testConfig);

    logger.info('Step 2: Testing discovered endpoints...');
    const testResults = await tester.testEndpoints(discoveryResults.endpoints);

    // Display test results summary
    logger.info('Test Results Summary:', {
      totalEndpoints: testResults.totalEndpoints,
      successfulTests: testResults.successfulTests,
      failedTests: testResults.failedTests,
      successRate: `${(testResults.successfulTests / testResults.totalEndpoints * 100).toFixed(2)}%`,
      duration: `${testResults.testDuration}ms`,
    });

    // Log detailed test results
    logger.info('Detailed Test Results:');
    testResults.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.endpoint.method} ${result.endpoint.url}`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Status Code: ${result.statusCode}`);
      console.log(`   Response Time: ${result.responseTime}ms`);
      console.log(`   Auth Required: ${result.authRequired ? 'Yes' : 'No'}`);

      if (result.authMethods.length > 0) {
        console.log(`   Auth Methods: ${result.authMethods.join(', ')}`);
      }

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      if (result.validationResults) {
        console.log(`   Schema Valid: ${result.validationResults.isValid ? '✅' : '❌'}`);
        if (result.validationResults.warnings.length > 0) {
          console.log(`   Warnings: ${result.validationResults.warnings.join(', ')}`);
        }
      }

      console.log('');
    });

    // Step 5: Display recommendations
    if (testResults.recommendations.length > 0) {
      logger.info('Recommendations:');
      testResults.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log('');
    }

    // Step 6: Display performance metrics
    logger.info('Performance Metrics:', {
      averageResponseTime: `${testResults.performanceMetrics.averageResponseTime.toFixed(2)}ms`,
      fastestEndpoint: testResults.performanceMetrics.fastestEndpoint,
      slowestEndpoint: testResults.performanceMetrics.slowestEndpoint,
      reliabilityScore: `${testResults.performanceMetrics.reliabilityScore}%`,
    });

    // Step 7: Display authentication summary
    logger.info('Authentication Summary:', testResults.authRequirements);

    // Step 8: Export results
    const exportData = {
      discovery: discoveryResults,
      testing: testResults,
      timestamp: new Date().toISOString(),
    };

    // In a real implementation, you might save this to a file
    logger.info('Results exported successfully', {
      discoveryEndpoints: discoveryResults.endpoints.length,
      testResults: testResults.results.length,
      exportSize: JSON.stringify(exportData).length,
    });

    logger.info('API discovery and testing example completed successfully!');

  } catch (error) {
    logger.error('Discovery and testing example failed:', error);
    throw error;
  }
}

/**
 * Quick discovery example (minimal configuration)
 */
async function quickDiscoveryExample() {
  const logger = new Logger({}, { component: 'QuickDiscovery' });

  logger.info('Running quick discovery example...');

  try {
    // Use default configuration
    const discovery = createAPIDiscovery();
    const results = await discovery.discoverEndpoints();

    logger.info('Quick discovery completed', {
      endpointsFound: results.endpoints.length,
      confidence: results.documentation.confidence,
    });

    // Show first few endpoints
    logger.info('Sample discovered endpoints:');
    results.endpoints.slice(0, 3).forEach((endpoint, index) => {
      console.log(`${index + 1}. ${endpoint.method} ${endpoint.url} - ${endpoint.description || 'No description'}`);
    });

  } catch (error) {
    logger.error('Quick discovery failed:', error);
  }
}

/**
 * Streaming-specific discovery example
 */
async function streamingDiscoveryExample() {
  const logger = new Logger({}, { component: 'StreamingDiscovery' });

  logger.info('Running streaming-specific discovery example...');

  try {
    const discovery = createAPIDiscovery({
      baseURL: 'https://pump.fun',
      enableResponseLogging: true,
      requestDelay: 500,
    });

    const results = await discovery.discoverEndpoints();

    // Filter for streaming-related endpoints
    const streamingEndpoints = results.endpoints.filter(endpoint =>
      (endpoint.description || '').toLowerCase().includes('stream') ||
      endpoint.url.toLowerCase().includes('stream') ||
      endpoint.url.toLowerCase().includes('live') ||
      endpoint.url.toLowerCase().includes('broadcast')
    );

    logger.info('Streaming discovery results:', {
      totalEndpoints: results.endpoints.length,
      streamingEndpoints: streamingEndpoints.length,
    });

    if (streamingEndpoints.length > 0) {
      logger.info('Discovered streaming endpoints:');
      streamingEndpoints.forEach((endpoint, index) => {
        console.log(`${index + 1}. ${endpoint.method} ${endpoint.url}`);
        console.log(`   Description: ${endpoint.description || 'No description'}`);
        console.log(`   Status: ${endpoint.isActive ? 'Active' : 'Inactive'}`);
        console.log('');
      });

      // Test streaming endpoints
      const tester = createEndpointTester({
        timeout: 20000,
        validateResponses: true,
      });

      const streamTestResults = await tester.testEndpoints(streamingEndpoints);

      logger.info('Streaming endpoint test results:', {
        successful: streamTestResults.successfulTests,
        failed: streamTestResults.failedTests,
        successRate: `${(streamTestResults.successfulTests / streamTestResults.totalEndpoints * 100).toFixed(2)}%`,
      });
    } else {
      logger.info('No streaming endpoints were discovered');
    }

  } catch (error) {
    logger.error('Streaming discovery failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('PumpFun API Discovery Examples');
  console.log('================================\n');

  // Example 1: Full discovery and testing
  console.log('Example 1: Full Discovery and Testing');
  console.log('--------------------------------------');
  runDiscoveryAndTesting()
    .then(() => {
      console.log('\nExample 1 completed successfully!\n');

      // Example 2: Quick discovery
      console.log('Example 2: Quick Discovery');
      console.log('---------------------------');
      return quickDiscoveryExample();
    })
    .then(() => {
      console.log('\nExample 2 completed successfully!\n');

      // Example 3: Streaming-specific discovery
      console.log('Example 3: Streaming Discovery');
      console.log('------------------------------');
      return streamingDiscoveryExample();
    })
    .then(() => {
      console.log('\nExample 3 completed successfully!');
      console.log('\nAll examples completed successfully!');
    })
    .catch((error) => {
      console.error('Example failed:', error);
      process.exit(1);
    });
}

// Export functions for use in other modules
export {
  runDiscoveryAndTesting,
  quickDiscoveryExample,
  streamingDiscoveryExample,
};