/**
 * Factory function for simplified PumpFun client creation
 */

import { PumpFunClient } from '../client/PumpFunClient';
import { ClientConfig } from '../types';

/**
 * Convenience factory function to create a new PumpFunClient instance
 *
 * @param config - Optional configuration options
 * @returns New PumpFunClient instance
 *
 * @example
 * ```typescript
 * // Create client with default configuration
 * const client = createClient();
 *
 * // Create client with custom configuration
 * const client = createClient({
 *   baseURL: 'https://api.pump.fun',
 *   timeout: 10000,
 *   apiKey: 'your-api-key'
 * });
 * ```
 */
export function createClient(config?: ClientConfig): PumpFunClient {
  return new PumpFunClient(config);
}