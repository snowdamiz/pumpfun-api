/**
 * Basic Usage Examples for PumpFun API Client
 *
 * This file contains comprehensive examples showing how to install,
 * initialize, and use the PumpFun API client for common operations.
 *
 * @version 1.0.0
 * @author PumpFun Team
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel } from '../types';

// ============================================================================
// Installation and Setup Examples
// ============================================================================

/**
 * Example 1: Basic client initialization with default configuration
 */
export function basicInitialization() {
  console.log('=== Basic Client Initialization ===');

  // Create a client with default settings
  const client = new PumpFunAPIClient();

  console.log('✅ Client initialized successfully!');
  console.log(`📡 Base URL: ${client.getBaseURL()}`);
  console.log(`⏱️ Timeout: ${client.getTimeout()}ms`);
  console.log(`🔧 Initialized: ${client.isClientInitialized()}`);

  return client;
}

/**
 * Example 2: Client initialization with custom configuration
 */
export function customConfiguration() {
  console.log('=== Custom Configuration ===');

  // Create a client with custom settings
  const client = new PumpFunAPIClient({
    baseURL: 'https://frontend-api-v3.pump.fun',
    timeout: 15000,
    retryConfig: {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 10000,
      backoffFactor: 2,
    },
    rateLimitConfig: {
      maxRequestsPerWindow: 50,
      windowMs: 60000,
      enableBackoff: true,
    },
    loggerConfig: {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableColors: true,
      enableTimestamps: true,
    },
  });

  console.log('✅ Client initialized with custom configuration!');
  console.log('📋 Configuration:', JSON.stringify(client.getConfiguration(), null, 2));

  return client;
}

/**
 * Example 3: Client initialization using environment variables
 */
export function environmentConfiguration() {
  console.log('=== Environment Variable Configuration ===');

  // These environment variables would be set in your environment:
  // PUMPFUN_API_BASE_URL=https://frontend-api-v3.pump.fun
  // PUMPFUN_API_TIMEOUT=15000
  // PUMPFUN_LOG_LEVEL=DEBUG
  // PUMPFUN_RATE_LIMIT_REQUESTS=50

  const client = new PumpFunAPIClient(); // Will automatically load from environment

  console.log('✅ Client initialized using environment variables!');
  console.log(`📡 Base URL: ${client.getBaseURL()}`);
  console.log(`⏱️ Timeout: ${client.getTimeout()}ms`);

  return client;
}

// ============================================================================
// Connection and Validation Examples
// ============================================================================

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

// ============================================================================
// Error Handling Examples
// ============================================================================

/**
 * Example 6: Basic error handling
 */
export async function basicErrorHandling() {
  console.log('=== Basic Error Handling ===');

  const client = new PumpFunAPIClient({
    timeout: 5000, // Short timeout for demonstration
    retryConfig: {
      maxRetries: 2,
      baseDelay: 1000,
    },
  });

  try {
    // This would be an API call in the future
    console.log('🔄 Attempting operation...');

    // Simulate operation that might fail
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('✅ Operation completed successfully');
  } catch (error) {
    console.error('❌ Operation failed:', error);

    // Log error details
    const logger = client.getLogger();
    logger.error('Operation failed', { error, timestamp: new Date().toISOString() });

    // Update statistics
    const stats = client.getStatistics();
    console.log(`📊 Updated error rate: ${stats.errorRate}%`);
  }

  return client;
}

/**
 * Example 7: Configuration validation
 */
export function configurationValidation() {
  console.log('=== Configuration Validation ===');

  try {
    // This will throw an error due to invalid timeout
    new PumpFunAPIClient({
      timeout: -1000, // Invalid timeout
      baseURL: 'not-a-valid-url', // Invalid URL
    });

    console.log('❌ This should not execute due to validation error');
  } catch (error) {
    console.log('✅ Configuration validation working correctly');
    console.log('🚫 Validation Error:', error instanceof Error ? error.message : String(error));
  }

  try {
    // This will work fine
    const validClient = new PumpFunAPIClient({
      timeout: 15000, // Valid timeout
      baseURL: 'https://frontend-api-v3.pump.fun', // Valid URL
    });

    console.log('✅ Valid configuration accepted');
    return validClient;
  } catch (error) {
    console.error('❌ Unexpected validation error:', error);
    throw error;
  }
}

// ============================================================================
// Configuration Management Examples
// ============================================================================

/**
 * Example 8: Runtime configuration updates
 */
export function runtimeConfiguration() {
  console.log('=== Runtime Configuration Updates ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
    },
  });

  console.log('📋 Initial configuration:');
  console.log(`📊 Log level: ${client.getLogger().getConfig().level}`);

  // Update logger configuration at runtime
  client.updateLoggerConfig({
    level: LogLevel.DEBUG,
    enableColors: true,
    enableTimestamps: true,
  });

  console.log('✅ Logger configuration updated:');
  console.log(`📊 New log level: ${client.getLogger().getConfig().level}`);

  // Update rate limit configuration
  client.updateRateLimitConfig({
    maxRequestsPerWindow: 30,
    enableBackoff: true,
  });

  console.log('✅ Rate limit configuration updated');

  return client;
}

// ============================================================================
// Future API Usage Examples (When API Methods Are Implemented)
// ============================================================================

/**
 * Example 9: Future API usage - Live streams (placeholder)
 */
export function futureLiveStreamsExample() {
  console.log('=== Future: Live Streams Example ===');
  console.log('📝 This example will work once API methods are implemented');

  const client = new PumpFunAPIClient();

  // These methods will be implemented in future tasks:
  // const liveCoins = await client.getLiveCoins({ limit: 10 });
  // const solPrice = await client.getSolPrice();
  // const isValid = await client.validateJurisdiction();

  console.log('🔄 When implemented, this will:');
  console.log('   • Fetch currently live streaming coins');
  console.log('   • Get current SOL price');
  console.log('   • Validate user jurisdiction');
  console.log('   • Handle rate limiting automatically');

  return client;
}

/**
 * Example 10: Future API usage - Advanced configuration (placeholder)
 */
export function futureAdvancedExample() {
  console.log('=== Future: Advanced Usage Example ===');
  console.log('📝 This example will work once API methods are implemented');

  const client = new PumpFunAPIClient({
    timeout: 30000,
    retryConfig: {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 15000,
    },
    rateLimitConfig: {
      maxRequestsPerWindow: 60,
      enableBurstProtection: true,
      enableBackoff: true,
    },
    loggerConfig: {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableColors: true,
      enableTimestamps: true,
    },
  });

  console.log('🔄 When implemented, this will:');
  console.log('   • Process live streaming data');
  console.log('   • Handle video stream analysis');
  console.log('   • Manage rate limiting intelligently');
  console.log('   • Provide comprehensive error handling');
  console.log('   • Support advanced filtering and search');

  return client;
}

// ============================================================================
// Best Practices Examples
// ============================================================================

/**
 * Example 11: Best practices for production usage
 */
export function productionBestPractices() {
  console.log('=== Production Best Practices ===');

  // Production-ready configuration
  const client = new PumpFunAPIClient({
    timeout: 15000, // Reasonable timeout
    retryConfig: {
      maxRetries: 3, // Don't overdo retries
      baseDelay: 1000,
      maxDelay: 10000,
    },
    rateLimitConfig: {
      maxRequestsPerWindow: 50, // Conservative rate limiting
      windowMs: 60000,
      enableBackoff: true,
      enableBurstProtection: true,
    },
    loggerConfig: {
      level: LogLevel.WARN, // Only log warnings and errors in production
      enableConsole: false, // Disable console logs in production
      enableFile: true, // Enable file logging
      filePath: './logs/pumpfun-api.log',
      enableTimestamps: true,
    },
  });

  console.log('✅ Production client configured with:');
  console.log('   • Conservative timeout and retry settings');
  console.log('   • Rate limiting with backoff');
  console.log('   • File-based logging');
  console.log('   • Error-only log level');

  return client;
}

/**
 * Example 12: Client lifecycle management
 */
export async function clientLifecycleManagement() {
  console.log('=== Client Lifecycle Management ===');

  const client = new PumpFunAPIClient();

  try {
    console.log('🚀 Client initialized');

    // Use client...
    await client.testConnection();
    console.log('✅ Connection tested');

    // Get final statistics
    const finalStats = client.getStatistics();
    console.log('📊 Final statistics:', finalStats);
  } finally {
    // Always clean up
    console.log('🔄 Shutting down client...');
    await client.shutdown();
    console.log('✅ Client shut down successfully');
  }
}

// ============================================================================
// Example Runner
// ============================================================================

/**
 * Run all basic examples in sequence
 */
export async function runAllBasicExamples() {
  console.log('🚀 Running all basic usage examples...\n');

  const results: {
    basicInit: PumpFunAPIClient | null;
    customConfig: PumpFunAPIClient | null;
    envConfig: PumpFunAPIClient | null;
    connectionTest: boolean | null;
    healthCheck: {
      client: PumpFunAPIClient;
      state: any;
      stats: any;
      connected: boolean;
    } | null;
    errorHandling: PumpFunAPIClient | null;
    validation: PumpFunAPIClient | null;
    runtimeConfig: PumpFunAPIClient | null;
    production: PumpFunAPIClient | null;
    lifecycle: void | null;
  } = {
    basicInit: null,
    customConfig: null,
    envConfig: null,
    connectionTest: null,
    healthCheck: null,
    errorHandling: null,
    validation: null,
    runtimeConfig: null,
    production: null,
    lifecycle: null,
  };

  try {
    // Basic examples
    results.basicInit = basicInitialization();
    console.log();

    results.customConfig = customConfiguration();
    console.log();

    results.envConfig = environmentConfiguration();
    console.log();

    // Connection examples
    results.connectionTest = await basicConnectionTest();
    console.log();

    results.healthCheck = await clientHealthCheck();
    console.log();

    // Error handling examples
    results.errorHandling = await basicErrorHandling();
    console.log();

    results.validation = configurationValidation();
    console.log();

    // Configuration examples
    results.runtimeConfig = runtimeConfiguration();
    console.log();

    results.production = productionBestPractices();
    console.log();

    // Lifecycle example
    results.lifecycle = await clientLifecycleManagement();
    console.log();

    console.log('✅ All basic examples completed successfully!');
  } catch (error) {
    console.error('💥 Example execution failed:', error);
  }

  return results;
}

// Export individual examples for selective execution
export const examples = {
  basicInitialization,
  customConfiguration,
  environmentConfiguration,
  basicConnectionTest,
  clientHealthCheck,
  basicErrorHandling,
  configurationValidation,
  runtimeConfiguration,
  futureLiveStreamsExample,
  futureAdvancedExample,
  productionBestPractices,
  clientLifecycleManagement,
  runAllBasicExamples,
};

// Export default example runner
export default runAllBasicExamples;
