/**
 * Example Request Generator for PumpFun API
 *
 * This utility generates example HTTP requests for all documented PumpFun API endpoints
 * based on the OpenAPI specification and request format documentation.
 *
 * Created: 2025-10-11
 * Purpose: T020 - Generate example requests for documented endpoints
 */

import { randomUUID } from 'crypto';

/**
 * Base configuration for API requests
 */
export interface APIConfig {
  baseURL: string;
  token: string;
  userAgent?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

/**
 * Time range parameters
 */
export interface TimeRangeParams {
  start_date?: string;
  end_date?: string;
  since?: string;
}

/**
 * Filter parameters
 */
export interface FilterParams {
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  has_active_stream?: boolean;
  sort?: 'viewer_count' | 'start_time' | 'duration';
  order?: 'asc' | 'desc';
}

/**
 * Webhook registration request
 */
export interface WebhookRegistration {
  url: string;
  events: Array<'STREAM_STARTED' | 'STREAM_ENDED' | 'METADATA_UPDATED'>;
  secret?: string;
  active?: boolean;
}

/**
 * Generated request example
 */
export interface RequestExample {
  description: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  curlCommand: string;
  notes?: string[];
}

/**
 * Example Request Generator class
 */
export class ExampleRequestGenerator {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = {
      userAgent: 'PumpFunClient/1.0',
      ...config
    };
  }

  /**
   * Get standard headers for authenticated requests
   */
  private getHeaders(contentType: string = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.token}`,
      'Accept': 'application/json',
      'User-Agent': this.config.userAgent || 'PumpFunClient/1.0'
    };

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    return headers;
  }

  /**
   * Convert object to query string
   */
  private toQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Generate cURL command for a request
   */
  private generateCurlCommand(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: any
  ): string {
    let curl = `curl -X ${method} "${url}"`;

    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
      curl += ` \\\n  -H "${key}: ${value}"`;
    });

    // Add body if present
    if (body) {
      const bodyJson = JSON.stringify(body, null, 2);
      curl += ` \\\n  -d '${bodyJson}'`;
    }

    return curl;
  }

  /**
   * Generate example request for getting active streams
   */
  getActiveStreams(params?: PaginationParams & FilterParams): RequestExample {
    const queryParams = {
      status: 'active',
      limit: 100,
      offset: 0,
      sort: 'viewer_count',
      order: 'desc',
      ...params
    };

    const url = `${this.config.baseURL}/streams${this.toQueryString(queryParams)}`;
    const headers = this.getHeaders();

    return {
      description: 'Get list of currently active streams with optional filtering and pagination',
      method: 'GET',
      url,
      headers,
      curlCommand: this.generateCurlCommand('GET', url, headers),
      notes: [
        'Returns streams sorted by viewer count (highest first)',
        'Use limit and offset for pagination',
        'Filter by status: active, inactive, or all'
      ]
    };
  }

  /**
   * Generate example request for getting stream details
   */
  getStreamDetails(streamId: string, includeHistory: boolean = false): RequestExample {
    const queryParams = { include_history: includeHistory };
    const url = `${this.config.baseURL}/streams/${streamId}${this.toQueryString(queryParams)}`;
    const headers = this.getHeaders();

    return {
      description: `Get detailed information for stream ${streamId}`,
      method: 'GET',
      url,
      headers,
      curlCommand: this.generateCurlCommand('GET', url, headers),
      notes: [
        'Include historical data by setting include_history=true',
        'Returns complete stream metadata and events',
        'Stream ID should be a valid stream identifier'
      ]
    };
  }

  /**
   * Generate example request for getting stream events
   */
  getStreamEvents(
    streamId: string,
    eventType?: string,
    params?: PaginationParams & TimeRangeParams
  ): RequestExample {
    const queryParams = {
      limit: 100,
      ...params,
      ...(eventType && { event_type: eventType })
    };

    const url = `${this.config.baseURL}/streams/${streamId}/events${this.toQueryString(queryParams)}`;
    const headers = this.getHeaders();

    return {
      description: `Get events for stream ${streamId}`,
      method: 'GET',
      url,
      headers,
      curlCommand: this.generateCurlCommand('GET', url, headers),
      notes: [
        'Filter by event_type: STREAM_STARTED, STREAM_ENDED, METADATA_UPDATED, STATUS_CHANGED, ERROR_OCCURRED',
        'Use since parameter to get events after a specific timestamp',
        'Events are returned in reverse chronological order'
      ]
    };
  }

  /**
   * Generate example request for getting tokens
   */
  getTokens(params?: PaginationParams & FilterParams): RequestExample {
    const queryParams = {
      limit: 100,
      offset: 0,
      ...params
    };

    const url = `${this.config.baseURL}/tokens${this.toQueryString(queryParams)}`;
    const headers = this.getHeaders();

    return {
      description: 'Get list of tokens with optional filtering and search',
      method: 'GET',
      url,
      headers,
      curlCommand: this.generateCurlCommand('GET', url, headers),
      notes: [
        'Search tokens by name or symbol using the search parameter',
        'Filter tokens with active streams using has_active_stream=true',
        'Supports pagination with limit and offset parameters'
      ]
    };
  }

  /**
   * Generate example request for getting token streaming history
   */
  getTokenStreamingHistory(
    tokenId: string,
    params?: TimeRangeParams & PaginationParams
  ): RequestExample {
    const queryParams = {
      limit: 50,
      ...params
    };

    const url = `${this.config.baseURL}/tokens/${tokenId}/streams${this.toQueryString(queryParams)}`;
    const headers = this.getHeaders();

    return {
      description: `Get streaming history for token ${tokenId}`,
      method: 'GET',
      url,
      headers,
      curlCommand: this.generateCurlCommand('GET', url, headers),
      notes: [
        'Use start_date and end_date to specify time range',
        'Returns historical streams along with statistics',
        'Include pagination parameters for large result sets'
      ]
    };
  }

  /**
   * Generate example request for getting user streaming history
   */
  getUserStreamingHistory(
    userId: string,
    includeActive: boolean = true,
    limit: number = 50
  ): RequestExample {
    const queryParams = {
      include_active: includeActive,
      limit
    };

    const url = `${this.config.baseURL}/users/${userId}/streams${this.toQueryString(queryParams)}`;
    const headers = this.getHeaders();

    return {
      description: `Get streaming history for user ${userId}`,
      method: 'GET',
      url,
      headers,
      curlCommand: this.generateCurlCommand('GET', url, headers),
      notes: [
        'Returns both active and historical streams for the user',
        'Set include_active=false to only get historical streams',
        'Includes user profile information in the response'
      ]
    };
  }

  /**
   * Generate example request for getting top streams analytics
   */
  getTopStreams(
    metric: 'viewer_count' | 'duration' | 'peak_viewers',
    timeRange: '1h' | '24h' | '7d' | '30d',
    limit: number = 10
  ): RequestExample {
    const queryParams = { metric, time_range: timeRange, limit };
    const url = `${this.config.baseURL}/analytics/top-streams${this.toQueryString(queryParams)}`;
    const headers = this.getHeaders();

    return {
      description: `Get top streams by ${metric} for the last ${timeRange}`,
      method: 'GET',
      url,
      headers,
      curlCommand: this.generateCurlCommand('GET', url, headers),
      notes: [
        'Available metrics: viewer_count, duration, peak_viewers',
        'Available time ranges: 1h, 24h, 7d, 30d',
        'Returns ranked streams with the specified metric values'
      ]
    };
  }

  /**
   * Generate example request for getting dashboard statistics
   */
  getDashboardStats(): RequestExample {
    const url = `${this.config.baseURL}/analytics/dashboard`;
    const headers = this.getHeaders();

    return {
      description: 'Get overall system statistics for dashboard',
      method: 'GET',
      url,
      headers,
      curlCommand: this.generateCurlCommand('GET', url, headers),
      notes: [
        'Returns system-wide statistics including active streams and viewers',
        'Includes top tokens and streamers',
        'Useful for dashboard and overview displays'
      ]
    };
  }

  /**
   * Generate example request for registering a webhook
   */
  registerWebhook(webhook: WebhookRegistration): RequestExample {
    const url = `${this.config.baseURL}/webhooks`;
    const headers = this.getHeaders();
    const body = {
      url: webhook.url,
      events: webhook.events,
      active: webhook.active ?? true,
      ...(webhook.secret && { secret: webhook.secret })
    };

    return {
      description: 'Register a webhook endpoint for real-time notifications',
      method: 'POST',
      url,
      headers,
      body,
      curlCommand: this.generateCurlCommand('POST', url, headers, body),
      notes: [
        'Webhook URL must be publicly accessible',
        'Events: STREAM_STARTED, STREAM_ENDED, METADATA_UPDATED',
        'Optional secret for webhook signature validation',
        'Webhook must return 200 status to confirm receipt'
      ]
    };
  }

  /**
   * Generate all example requests for quick reference
   */
  generateAllExamples(): Record<string, RequestExample> {
    const sampleStreamId = 'stream_123456789';
    const sampleTokenId = 'token_abc123';
    const sampleUserId = 'user_789';

    return {
      getActiveStreams: this.getActiveStreams(),
      getStreamDetails: this.getStreamDetails(sampleStreamId, true),
      getStreamEvents: this.getStreamEvents(sampleStreamId),
      getTokens: this.getTokens({ search: 'MyToken' }),
      getTokenStreamingHistory: this.getTokenStreamingHistory(sampleTokenId),
      getUserStreamingHistory: this.getUserStreamingHistory(sampleUserId),
      getTopStreams: this.getTopStreams('viewer_count', '24h'),
      getDashboardStats: this.getDashboardStats(),
      registerWebhook: this.registerWebhook({
        url: 'https://your-app.com/webhook',
        events: ['STREAM_STARTED', 'STREAM_ENDED'],
        secret: 'webhook_secret_123'
      })
    };
  }

  /**
   * Generate example with custom request ID for debugging
   */
  generateWithRequestID(
    baseExample: RequestExample,
    requestId?: string
  ): RequestExample {
    const id = requestId || randomUUID();
    const headersWithId = {
      ...baseExample.headers,
      'X-Request-ID': id
    };

    return {
      ...baseExample,
      headers: headersWithId,
      curlCommand: this.generateCurlCommand(
        baseExample.method,
        baseExample.url,
        headersWithId,
        baseExample.body
      ),
      notes: [
        ...(baseExample.notes || []),
        `Request ID: ${id} (useful for debugging and support)`
      ]
    };
  }
}

/**
 * Create a configured example generator instance
 */
export function createExampleGenerator(config: APIConfig): ExampleRequestGenerator {
  return new ExampleRequestGenerator(config);
}

/**
 * Quick example generator with default configuration
 */
export function getQuickExamples(token: string): Record<string, RequestExample> {
  const generator = createExampleGenerator({
    baseURL: 'https://api.pumpfun-monitor.com/v1',
    token
  });

  return generator.generateAllExamples();
}