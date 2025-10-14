/**
 * Setup and Installation Examples for PumpFun API Client
 *
 * This module contains examples for:
 * - Basic client initialization
 * - Custom configuration
 * - Environment variable configuration
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel } from '../types';
import {
  EXAMPLE_TIMEOUT,
  MAX_RETRIES_CUSTOM,
  RETRY_DELAY_2,
  MAX_DELAY,
  BACKOFF_FACTOR,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW,
  JSON_INDENTATION,
} from './constants';

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
    timeout: EXAMPLE_TIMEOUT,
    retryConfig: {
      maxRetries: MAX_RETRIES_CUSTOM,
      baseDelay: RETRY_DELAY_2,
      maxDelay: MAX_DELAY,
      backoffFactor: BACKOFF_FACTOR,
    },
    rateLimitConfig: {
      maxRequestsPerWindow: RATE_LIMIT_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW,
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
  console.log(
    '📋 Configuration:',
    JSON.stringify(client.getConfiguration(), null, JSON_INDENTATION)
  );

  return client;
}

/**
 * Example 3: Client initialization using environment variables
 */
export function environmentConfiguration() {
  console.log('=== Environment Variable Configuration ===');

  const client = new PumpFunAPIClient(); // Will automatically load from environment

  console.log('✅ Client initialized using environment variables!');
  console.log(`📡 Base URL: ${client.getBaseURL()}`);
  console.log(`⏱️ Timeout: ${client.getTimeout()}ms`);

  return client;
}
