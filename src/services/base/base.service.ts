/**
 * Base service class for all PumpFun API services
 *
 * Provides common functionality that all services can inherit from,
 * including error handling, logging, and state management.
 */

import { Logger } from '../../infrastructure/logging/logger';
import { ServiceState } from '../../types/domain.types';

/**
 * Abstract base service class
 */
export abstract class BaseService {
  protected state: ServiceState;

  constructor(
    protected logger: Logger,
    serviceName: string
  ) {
    this.state = {
      requestCount: 0,
      errorCount: 0,
      lastRequestTime: 0,
    };

    this.logger.info(`Initialized ${serviceName}`, {
      service: serviceName,
      timestamp: Date.now(),
    });
  }

  /**
   * Get the current service state
   */
  public getState(): ServiceState {
    return { ...this.state };
  }

  /**
   * Reset the service state
   */
  public resetState(): void {
    this.state = {
      requestCount: 0,
      errorCount: 0,
      lastRequestTime: 0,
    };
  }

  /**
   * Update state after a successful request
   */
  protected recordSuccess(): void {
    this.state.requestCount++;
    this.state.lastRequestTime = Date.now();
  }

  /**
   * Update state after a failed request
   */
  protected recordError(): void {
    this.state.errorCount++;
    this.state.lastRequestTime = Date.now();
  }

  /**
   * Get the error rate as a percentage
   */
  public getErrorRate(): number {
    if (this.state.requestCount === 0) {
      return 0;
    }
    return (this.state.errorCount / this.state.requestCount) * 100;
  }

  /**
   * Check if the service is healthy based on error rate
   */
  public isHealthy(threshold: number = 10): boolean {
    return this.getErrorRate() < threshold;
  }
}
