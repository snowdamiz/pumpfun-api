import { PumpFunClient } from '../client/PumpFunClient';
import { ClientConfig } from '../types';

export function createClient(config?: ClientConfig): PumpFunClient {
  return new PumpFunClient(config);
}
