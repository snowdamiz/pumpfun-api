/**
 * Connection and Validation Examples for PumpFun API Client
 *
 * This module contains examples for:
 * - Basic connectivity testing
 * - Client health checks
 * - Jurisdiction validation
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel } from '../types';
import { SUCCESS_RATE_DECIMALS } from './constants';

/**
 * Example 4: Basic connectivity test
 */
export async function basicConnectionTest() {
  console.log('=== Basic Connection Test ===');

  const client = new PumpFunAPIClient();

  try {
    console.log('🔍 Testing API connectivity...');
    const isConnected = await client.testConnection();

    if (isConnected) {
      console.log('✅ API connection successful!');
    } else {
      console.log('❌ API connection failed!');
    }

    return isConnected;
  } catch (error) {
    console.error('💥 Connection test error:', error);
    throw error;
  }
}

/**
 * Example 5: Client health check and statistics
 */
export async function clientHealthCheck() {
  console.log('=== Client Health Check ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  // Get client state
  const state = client.getState();
  console.log('📊 Client State:', {
    initialized: state.isInitialized,
    requestCount: state.requestCount,
    errorCount: state.errorCount,
    lastRequestTime: state.lastRequestTime
      ? new Date(state.lastRequestTime).toISOString()
      : 'Never',
  });

  // Get statistics
  const stats = client.getStatistics();
  console.log('📈 Statistics:', {
    requests: stats.requestCount,
    errors: stats.errorCount,
    errorRate: `${stats.errorRate}%`,
    rateLimited: client.isRateLimited(),
    backoffRemaining: client.getRateLimitBackoffRemaining(),
  });

  // Test connection
  console.log('🔍 Testing connection...');
  const connected = await client.testConnection();
  console.log(`🌐 Connection Status: ${connected ? '✅ Connected' : '❌ Disconnected'}`);

  return {
    client,
    state,
    stats,
    connected,
  };
}

/**
 * Example 16: Validate jurisdiction and test connection
 */
export async function jurisdictionAndConnectionExample() {
  console.log('=== Jurisdiction & Connection Example ===');

  const client = new PumpFunAPIClient({
    timeout: 10000,
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    console.log('🌍 Testing API connection and jurisdiction validation...');

    // Test connection
    console.log('🔌 Testing API connection...');
    const isConnected = await client.testConnection();
    console.log(`   Connection Status: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);

    // Validate jurisdiction
    console.log('🌍 Validating jurisdiction...');
    const isValidJurisdiction = await client.validateJurisdiction();
    console.log(`   Jurisdiction Valid: ${isValidJurisdiction ? '✅ Yes' : '❌ No'}`);

    // Get client statistics
    const stats = client.getStatistics();
    console.log('\n📊 Client Statistics:');
    console.log(`   Requests Made: ${stats.requestCount}`);
    console.log(`   Errors: ${stats.errorCount}`);
    console.log(`   Success Rate: ${stats.successRate.toFixed(SUCCESS_RATE_DECIMALS)}%`);
    console.log(`   Rate Limited: ${client.isRateLimited() ? 'Yes' : 'No'}`);
    console.log(`   Backoff Remaining: ${client.getRateLimitBackoffRemaining()}ms`);

    // Get client state
    const state = client.getState();
    console.log('\n🔧 Client State:');
    console.log(`   Initialized: ${state.isInitialized}`);
    console.log(
      `   Last Request: ${state.lastRequestTime ? new Date(state.lastRequestTime).toLocaleString() : 'Never'}`
    );

    return {
      client,
      connectionTest: isConnected,
      jurisdictionValid: isValidJurisdiction,
      statistics: stats,
      state,
    };
  } catch (error) {
    console.error('❌ Error in jurisdiction and connection test:', error);
    throw error;
  }
}
