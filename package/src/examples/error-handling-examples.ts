/**
 * Error Handling and Validation Examples for PumpFun API Client
 *
 * This module contains examples for:
 * - Basic error handling
 * - Configuration validation
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import {
  TEST_CONNECTION_TIMEOUT,
  MAX_RETRIES_BASIC,
  BASE_DELAY,
  PROMISE_DELAY,
  EXAMPLE_TIMEOUT,
  INVALID_TIMEOUT,
} from './constants';

/**
 * Example 6: Basic error handling
 */
export async function basicErrorHandling() {
  console.log('=== Basic Error Handling ===');

  const client = new PumpFunAPIClient({
    timeout: TEST_CONNECTION_TIMEOUT, // Short timeout for demonstration
    retryConfig: {
      maxRetries: MAX_RETRIES_BASIC,
      baseDelay: BASE_DELAY,
    },
  });

  try {
    // This would be an API call in the future
    console.log('🔄 Attempting operation...');

    // Simulate operation that might fail
    await new Promise(resolve => setTimeout(resolve, PROMISE_DELAY));

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
      timeout: INVALID_TIMEOUT, // Invalid timeout
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
      timeout: EXAMPLE_TIMEOUT, // Valid timeout
      baseURL: 'https://frontend-api-v3.pump.fun', // Valid URL
    });

    console.log('✅ Valid configuration accepted');
    return validClient;
  } catch (error) {
    console.error('❌ Unexpected validation error:', error);
    throw error;
  }
}