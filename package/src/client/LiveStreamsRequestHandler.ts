/**
 * Live Streams Request Handler for PumpFun API Client
 *
 * This module handles HTTP request operations for live streams
 * including request execution, retry logic, and query string building.
 */

import {
  GetLiveCoinsParams
} from './types';
import { HTTPClient } from '../utils/http-client';
import { Logger } from '../utils/logger';
import { LiveStreamsServiceConfig } from './types';

/**
 * Handles HTTP requests for live streams operations
 */
export class LiveStreamsRequestHandler {
  constructor(
    private config: LiveStreamsServiceConfig,
    private httpClient: HTTPClient,
    private logger: Logger
  ) {}

  /**
   * Execute live coins request with retry logic
   */
  async executeLiveCoinsRequest(
    endpoint: string,
    _params: Required<GetLiveCoinsParams>
  ): Promise<any> {
    let lastError: any;

    // Implement retry logic specifically for API failures
    const maxRetries = this.config.retryConfig?.maxRetries ?? 3;
    const baseDelay = this.config.retryConfig?.baseDelay ?? 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient.get(endpoint);
        return response;
      } catch (error: unknown) {
        lastError = error;

        // Ensure error is properly typed for logging
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorConstructor = error instanceof Error ? error.constructor.name : 'Unknown';

        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          this.logger.warn('Non-retryable error encountered, not retrying', {
            attempt: attempt + 1,
            errorType: errorConstructor,
            message: errorMessage,
          });
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          this.logger.error('All retry attempts failed for live coins request', {
            totalAttempts: maxRetries + 1,
            lastError: errorMessage,
          });
          throw error;
        }

        // Calculate delay for this attempt
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);

        this.logger.warn(`Live coins request failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          error: errorMessage,
          nextRetryIn: delay,
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Build query string from parameters
   */
  buildQueryString(params: Required<GetLiveCoinsParams>): string {
    const queryParams = new URLSearchParams();

    // Only add parameters that differ from defaults or are explicitly provided
    if (params.offset !== 0) {
      queryParams.append('offset', params.offset.toString());
    }
    if (params.limit !== 10) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.sort !== 'currently_live') {
      queryParams.append('sort', params.sort);
    }
    if (params.order !== 'DESC') {
      queryParams.append('order', params.order);
    }
    if (params.includeNsfw !== false) {
      queryParams.append('includeNsfw', params.includeNsfw.toString());
    }

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Determine if an error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    // Don't retry configuration errors
    if (
      error.message?.includes('Configuration') ||
      error.message?.includes('Invalid baseURL') ||
      error.message?.includes('validation failed')
    ) {
      return true;
    }

    // Don't retry authentication errors (401)
    if (error.response?.status === 401) {
      return true;
    }

    // Don't retry forbidden errors (403)
    if (error.response?.status === 403) {
      return true;
    }

    // Don't retry not found errors (404) for live coins endpoint
    if (error.response?.status === 404) {
      return true;
    }

    // Don't retry validation errors (400)
    if (error.response?.status === 400) {
      return true;
    }

    return false;
  }
}