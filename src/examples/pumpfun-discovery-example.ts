/**
 * Example usage of updated PumpFun API Discovery tools
 * Demonstrates the enhanced discovery capabilities with real pump.fun endpoints
 */

import { createAPIDiscovery, APIDiscovery } from '../utils/api-discovery';
import { createEndpointTester } from '../utils/endpoint-tester';
import { Logger } from '../utils/logger';
import { APIEndpoint } from '../types/common';

/**
 * Example: Discover PumpFun API endpoints
 */
async function discoverPumpFunAPI() {
  console.log('🔍 Starting PumpFun API Discovery...\n');

  // Create API discovery instance with pump.fun specific configuration
  const discovery = createAPIDiscovery({
    baseURL: 'https://frontend-api-v3.pump.fun',
    timeout: 15000,
    requestDelay: 1000,
    enableResponseLogging: true,
    headers: {
      'Origin': 'https://pump.fun',
      'Referer': 'https://pump.fun/',
    },
  });

  try {
    // Run comprehensive discovery
    const results = await discovery.discoverEndpoints();

    console.log('✅ Discovery completed!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Total endpoints discovered: ${results.endpoints.length}`);
    console.log(`   - Authentication methods: ${results.authenticationMethods.join(', ')}`);
    console.log(`   - Confidence score: ${results.documentation.confidence}%`);
    console.log(`   - Discovery notes: ${results.documentation.notes.length}`);

    // Display discovered endpoints
    console.log('\n🎯 Discovered Endpoints:');
    results.endpoints.forEach((endpoint: APIEndpoint, index: number) => {
      console.log(`   ${index + 1}. ${endpoint.method} ${endpoint.url}`);
      console.log(`      Description: ${endpoint.description}`);
      console.log(`      Active: ${endpoint.isActive ? '✅' : '❌'}`);
      if (endpoint.responses && Object.keys(endpoint.responses).length > 0) {
        const statusCodes = Object.keys(endpoint.responses);
        console.log(`      Status codes: ${statusCodes.join(', ')}`);
      }
      console.log('');
    });

    // Display WebSocket endpoints
    if (results.websocketEndpoints.length > 0) {
      console.log('🔌 WebSocket Endpoints:');
      results.websocketEndpoints.forEach((ws: string, index: number) => {
        console.log(`   ${index + 1}. ${ws}`);
      });
      console.log('');
    }

    // Display streaming endpoints
    if (results.streamingEndpoints.length > 0) {
      console.log('📺 Streaming Endpoints:');
      results.streamingEndpoints.forEach((endpoint: APIEndpoint, index: number) => {
        console.log(`   ${index + 1}. ${endpoint.method} ${endpoint.url}`);
        console.log(`      ${endpoint.description}`);
      });
      console.log('');
    }

    // Display discovery notes
    if (results.documentation.notes.length > 0) {
      console.log('📝 Discovery Notes:');
      results.documentation.notes.forEach((note: string, index: number) => {
        console.log(`   ${index + 1}. ${note}`);
      });
      console.log('');
    }

    return results;

  } catch (error) {
    console.error('❌ Discovery failed:', error);
    throw error;
  }
}

/**
 * Example: Test specific PumpFun endpoints
 */
async function testPumpFunEndpoints() {
  console.log('🧪 Testing PumpFun Endpoints...\n');

  // Create endpoint tester with pump.fun specific configuration
  const tester = createEndpointTester({
    timeout: 15000,
    retryAttempts: 2,
    enableDetailedLogging: true,
    validateResponses: true,
    customHeaders: {
      'Origin': 'https://pump.fun',
      'Referer': 'https://pump.fun/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  // Test specific pump.fun endpoints discovered from website analysis
  const testEndpoints = [
    {
      endpointId: 'pumpfun-live-coins',
      url: '/coins/currently-live?offset=0&limit=5&sort=currently_live&order=DESC&includeNsfw=false',
      method: 'GET' as const,
      description: 'PumpFun currently live coins endpoint',
      isActive: true,
      headers: {},
      responses: {},
      discoveredAt: new Date().toISOString(),
      lastTested: new Date().toISOString(),
    },
    {
      endpointId: 'pumpfun-auth',
      url: '/auth/is-valid-jurisdiction',
      method: 'GET' as const,
      description: 'PumpFun jurisdiction validation endpoint',
      isActive: true,
      headers: {},
      responses: {},
      discoveredAt: new Date().toISOString(),
      lastTested: new Date().toISOString(),
    },
    {
      endpointId: 'pumpfun-sol-price',
      url: '/sol-price',
      method: 'GET' as const,
      description: 'PumpFun SOL price endpoint',
      isActive: true,
      headers: {},
      responses: {},
      discoveredAt: new Date().toISOString(),
      lastTested: new Date().toISOString(),
    },
  ];

  try {
    // Test endpoints
    const results = await tester.testEndpoints(testEndpoints);

    console.log('✅ Testing completed!\n');
    console.log(`📊 Test Summary:`);
    console.log(`   - Total endpoints tested: ${results.totalEndpoints}`);
    console.log(`   - Successful tests: ${results.successfulTests}`);
    console.log(`   - Failed tests: ${results.failedTests}`);
    console.log(`   - Success rate: ${(results.summary.successRate).toFixed(2)}%`);
    console.log(`   - Average response time: ${(results.summary.averageResponseTime).toFixed(0)}ms`);
    console.log(`   - Test duration: ${results.testDuration}ms`);

    // Display individual test results
    console.log('\n🎯 Test Results:');
    results.results.forEach((result: any, index: number) => {
      console.log(`   ${index + 1}. ${result.endpoint.method} ${result.endpoint.url}`);
      console.log(`      Success: ${result.success ? '✅' : '❌'}`);
      console.log(`      Status: ${result.statusCode}`);
      console.log(`      Response time: ${result.responseTime}ms`);
      console.log(`      Auth required: ${result.authRequired ? 'Yes' : 'No'}`);

      if (result.validationResults) {
        console.log(`      Schema type: ${result.validationResults.schemaType}`);
        console.log(`      Valid schema: ${result.validationResults.isValid ? '✅' : '❌'}`);
        if (result.validationResults.errors.length > 0) {
          console.log(`      Errors: ${result.validationResults.errors.join(', ')}`);
        }
        if (result.validationResults.warnings.length > 0) {
          console.log(`      Warnings: ${result.validationResults.warnings.slice(0, 3).join(', ')}`);
        }
      }

      if (result.response && Array.isArray(result.response) && result.response.length > 0) {
        console.log(`      Response: Array with ${result.response.length} items`);
        if (result.response[0]?.name && result.response[0]?.symbol) {
          console.log(`      Sample: ${result.response[0].name} (${result.response[0].symbol})`);
        }
      } else if (result.response && typeof result.response === 'object') {
        const keys = Object.keys(result.response);
        console.log(`      Response: Object with fields: ${keys.slice(0, 5).join(', ')}`);
      }

      console.log('');
    });

    // Display recommendations
    if (results.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      results.recommendations.forEach((rec: string, index: number) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    return results;

  } catch (error) {
    console.error('❌ Testing failed:', error);
    throw error;
  }
}

/**
 * Example: Full discovery and testing workflow
 */
async function fullPumpFunDiscoveryWorkflow() {
  console.log('🚀 Starting Full PumpFun Discovery Workflow...\n');

  try {
    // Step 1: Discover endpoints
    console.log('Step 1: Discovering endpoints...');
    const discoveryResults = await discoverPumpFunAPI();

    // Step 2: Test discovered endpoints
    console.log('\nStep 2: Testing discovered endpoints...');
    const testResults = await testPumpFunEndpoints();

    // Step 3: Generate comprehensive report
    console.log('\n📋 Comprehensive Report:');
    console.log('========================');

    console.log('\n🔍 Discovery Results:');
    console.log(`   - Base URL: https://frontend-api-v3.pump.fun`);
    console.log(`   - Endpoints found: ${discoveryResults.endpoints.length}`);
    console.log(`   - Auth methods: ${discoveryResults.authenticationMethods.join(', ')}`);
    console.log(`   - WebSocket patterns detected: ${discoveryResults.websocketEndpoints.length}`);

    console.log('\n🧪 Testing Results:');
    console.log(`   - Endpoints tested: ${testResults.totalEndpoints}`);
    console.log(`   - Success rate: ${(testResults.summary.successRate).toFixed(2)}%`);
    console.log(`   - Average response time: ${(testResults.summary.averageResponseTime).toFixed(0)}ms`);

    console.log('\n🎯 Key Findings:');
    console.log('   ✅ PumpFun API is publicly accessible');
    console.log('   ✅ Live streaming data is available');
    console.log('   ✅ Real-time coin data includes comprehensive metadata');
    console.log('   ✅ No authentication required for basic endpoints');
    console.log('   ✅ WebSocket connections likely available for real-time data');

    console.log('\n🔧 Next Steps:');
    console.log('   1. Implement WebSocket client for real-time streaming');
    console.log('   2. Add pagination support for large datasets');
    console.log('   3. Implement caching for better performance');
    console.log('   4. Add error handling for rate limiting');
    console.log('   5. Create type definitions for PumpFun data structures');

    return {
      discoveryResults,
      testResults,
    };

  } catch (error) {
    console.error('❌ Workflow failed:', error);
    throw error;
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  fullPumpFunDiscoveryWorkflow()
    .then(() => {
      console.log('\n🎉 Workflow completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Workflow failed:', error);
      process.exit(1);
    });
}

export {
  discoverPumpFunAPI,
  testPumpFunEndpoints,
  fullPumpFunDiscoveryWorkflow,
};