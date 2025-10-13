/**
 * Simple test script to verify package functionality
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel } from '../client/types';

async function testPackageFunctionality() {
  console.log('🚀 Testing PumpFun API Package Functionality');
  console.log('='.repeat(50));

  try {
    // Test 1: Basic initialization
    console.log('\n1. Testing Basic Initialization:');
    const client = new PumpFunAPIClient();
    console.log('✅ Client created successfully');
    console.log('📡 Base URL:', client.getBaseURL());
    console.log('⏱️ Timeout:', `${client.getTimeout()}ms`);
    console.log('🔧 Initialized:', client.isClientInitialized());

    // Test 2: Custom configuration
    console.log('\n2. Testing Custom Configuration:');
    const customClient = new PumpFunAPIClient({
      timeout: 15000,
      loggerConfig: {
        level: LogLevel.DEBUG,
        enableConsole: true,
        enableColors: true,
        enableTimestamps: true,
      },
    });
    console.log('✅ Custom client created');
    console.log('📊 Log level:', customClient.getLogger().getConfig().level);

    // Test 3: Connection test
    console.log('\n3. Testing API Connectivity:');
    const isConnected = await client.testConnection();
    console.log('🔗 Connection result:', isConnected ? '✅ Connected' : '❌ Failed');

    // Test 4: Client statistics
    console.log('\n4. Testing Client Statistics:');
    const stats = client.getStatistics();
    console.log('📊 Statistics:', stats);

    // Test 5: Client state
    console.log('\n5. Testing Client State:');
    const state = client.getState();
    console.log('📋 State:', {
      initialized: state.isInitialized,
      requestCount: state.requestCount,
      errorCount: state.errorCount,
    });

    console.log('\n✅ All package functionality tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : String(error));
  }
}

// Run the test
testPackageFunctionality();
