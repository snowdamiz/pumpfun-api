/**
 * Configuration Management Examples for PumpFun API Client
 *
 * This module contains examples for:
 * - Runtime configuration updates
 * - Dynamic configuration changes
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LogLevel } from '../types';

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