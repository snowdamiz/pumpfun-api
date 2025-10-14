/**
 * Best Practices Examples for PumpFun API Client
 *
 * This module contains examples for:
 * - Production-ready configuration
 * - Client lifecycle management
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel } from '../types';
import {
  EXAMPLE_TIMEOUT,
  MAX_RETRIES_PRODUCTION,
  BASE_DELAY,
  MAX_DELAY,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW,
} from './constants';

/**
 * Example 11: Best practices for production usage
 */
export function productionBestPractices() {
  console.log('=== Production Best Practices ===');

  // Production-ready configuration
  const client = new PumpFunAPIClient({
    timeout: EXAMPLE_TIMEOUT, // Reasonable timeout
    retryConfig: {
      maxRetries: MAX_RETRIES_PRODUCTION, // Don't overdo retries
      baseDelay: BASE_DELAY,
      maxDelay: MAX_DELAY,
    },
    rateLimitConfig: {
      maxRequestsPerWindow: RATE_LIMIT_REQUESTS, // Conservative rate limiting
      windowMs: RATE_LIMIT_WINDOW,
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
    client.shutdown();
    console.log('✅ Client shut down successfully');
  }
}