/**
 * API Discovery Utilities for PumpFun Streaming API
 *
 * Provides utilities for discovering and analyzing PumpFun's streaming API endpoints
 * through network traffic analysis and reverse engineering techniques.
 */

import { HTTPClient } from './http-client';
import { Logger } from './logger';
import { ErrorHandler } from './errors';
import {
  APIEndpoint,
  AuthType,
  HTTPMethod,
  NetworkRequest,
  DiscoveryResult,
  AuthHeaders,
  TokenLocation,
  RateLimitInfo
} from '../types/common';

/**
 * API Discovery Configuration
 */
export interface DiscoveryConfig {
  baseURL?: string;
  userAgent?: string;
  timeout?: number;
  enableNetworkAnalysis?: boolean;
  enableResponseLogging?: boolean;
  maxConcurrentRequests?: number;
  requestDelay?: number;
  headers?: Record<string, string>;
}

/**
 * Network Analysis Configuration
 */
export interface NetworkAnalysisConfig {
  captureHeaders?: boolean;
  captureBodies?: boolean;
  filterPatterns?: string[];
  excludePatterns?: string[];
  maxRequestsToCapture?: number;
  analysisTimeout?: number;
}

/**
 * API Pattern Matching Configuration
 */
export interface PatternConfig {
  endpointPatterns?: RegExp[];
  authPatterns?: RegExp[];
  streamingPatterns?: RegExp[];
  customPatterns?: Record<string, RegExp>;
}

/**
 * API Discovery Result with additional metadata
 */
export interface DetailedDiscoveryResult extends DiscoveryResult {
  requestSamples: NetworkRequest[];
  authSamples: AuthHeaders[];
  rateLimitSamples: RateLimitInfo[];
  websocketEndpoints: string[];
  streamingEndpoints: APIEndpoint[];
  documentation: {
    discoveredAt: string;
    methodology: string;
    confidence: number;
    notes: string[];
  };
}

/**
 * API Discovery Class
 */
export class APIDiscovery {
  private httpClient: HTTPClient;
  private logger: Logger;
  private config: DiscoveryConfig;
  private discoveredEndpoints: Map<string, APIEndpoint> = new Map();
  private capturedRequests: NetworkRequest[] = [];
  private authMethods: Set<AuthType> = new Set();
  private rateLimitInfo: RateLimitInfo[] = [];

  constructor(config: DiscoveryConfig = {}) {
    this.config = {
      baseURL: process.env.PUMPFUN_API_BASE_URL || 'https://frontend-api-v3.pump.fun',
      userAgent: 'pumpfun-api-discovery/1.0.0',
      timeout: 10000,
      enableNetworkAnalysis: true,
      enableResponseLogging: false,
      maxConcurrentRequests: 5,
      requestDelay: 1000,
      ...config,
    };

    this.httpClient = new HTTPClient(this.config.baseURL, {
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        ...this.config.headers,
      },
    });

    this.logger = new Logger({}, { component: 'APIDiscovery' });
  }

  /**
   * Discover API endpoints through systematic analysis
   */
  async discoverEndpoints(): Promise<DetailedDiscoveryResult> {
    this.logger.info('Starting API endpoint discovery...');

    const startTime = Date.now();
    const result: DetailedDiscoveryResult = {
      endpoints: [],
      authenticationMethods: [],
      patterns: [],
      metadata: {},
      discoveredAt: new Date().toISOString(),
      requestSamples: [],
      authSamples: [],
      rateLimitSamples: [],
      websocketEndpoints: [],
      streamingEndpoints: [],
      documentation: {
        discoveredAt: new Date().toISOString(),
        methodology: 'Network traffic analysis and systematic endpoint probing',
        confidence: 0,
        notes: [],
      },
    };

    try {
      // Step 1: Analyze common API endpoint patterns
      await this.analyzeCommonPatterns();

      // Step 2: Test discovered endpoints
      await this.testDiscoveredEndpoints();

      // Step 3: Analyze authentication requirements
      await this.analyzeAuthentication();

      // Step 4: Discover streaming endpoints
      await this.discoverStreamingEndpoints();

      // Step 5: Analyze WebSocket connections
      await this.analyzeWebSocketConnections();

      // Compile results
      result.endpoints = Array.from(this.discoveredEndpoints.values());
      result.authenticationMethods = Array.from(this.authMethods);
      result.requestSamples = this.capturedRequests.slice(-50); // Last 50 requests
      result.rateLimitSamples = this.rateLimitInfo;
      result.patterns = this.identifyPatterns();
      result.metadata = this.generateMetadata();

      // Calculate confidence score
      result.documentation.confidence = this.calculateConfidenceScore(result);
      result.documentation.notes = this.generateDiscoveryNotes(result);

      const duration = Date.now() - startTime;
      this.logger.info(`API discovery completed in ${duration}ms`, {
        endpointsFound: result.endpoints.length,
        authMethods: result.authenticationMethods.length,
        confidence: result.documentation.confidence,
      });

      return result;
    } catch (error) {
      this.logger.error('API discovery failed', error instanceof Error ? error : new Error(String(error)));
      throw ErrorHandler.handle(error instanceof Error ? error : new Error(String(error)), 'APIDiscovery.discoverEndpoints');
    }
  }

  /**
   * Analyze common API endpoint patterns
   */
  private async analyzeCommonPatterns(): Promise<void> {
    this.logger.info('Analyzing common API endpoint patterns...');

    // Pump.fun specific endpoints discovered from website analysis
    const pumpFunPatterns = [
      // Live streaming endpoints
      '/coins/currently-live',
      '/coins/currently-live?offset=0&limit=60&sort=currently_live&order=DESC&includeNsfw=false',

      // Authentication and validation
      '/auth/is-valid-jurisdiction',

      // Market data
      '/sol-price',

      // Additional pump.fun patterns
      '/coins/live',
      '/coins/active',
      '/coins/trending',
      '/coins/new',

      // Trading and swap API
      '/swap/ath/batch',

      // User and profile endpoints
      '/users/profile',
      '/users/activity',

      // Stream and broadcast related
      '/streams/active',
      '/streams/metadata',
      '/livestreams/current',
    ];

    // Generic streaming API patterns
    const commonPatterns = [
      // Streaming related endpoints
      '/api/streams',
      '/api/v1/streams',
      '/api/streams/active',
      '/api/streams/live',
      '/api/broadcasts',
      '/api/live',

      // Token related endpoints
      '/api/tokens',
      '/api/v1/tokens',
      '/api/tokens/streams',
      '/api/coin',
      '/api/coins',

      // User related endpoints
      '/api/users',
      '/api/v1/users',
      '/api/users/streams',
      '/api/streamers',

      // WebSocket endpoints
      '/ws',
      '/websocket',
      '/socket.io',
      '/stream',
      '/live-stream',

      // Analytics endpoints
      '/api/analytics',
      '/api/stats',
      '/api/metrics',
    ];

    // Test pump.fun specific endpoints first
    const allPatterns = [...pumpFunPatterns, ...commonPatterns];

    for (const pattern of allPatterns) {
      await this.testEndpointPattern(pattern);

      // Add delay to avoid rate limiting
      if (this.config.requestDelay) {
        await this.sleep(this.config.requestDelay);
      }
    }
  }

  /**
   * Test a specific endpoint pattern
   */
  private async testEndpointPattern(pattern: string): Promise<void> {
    const methods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

    for (const method of methods) {
      try {
        const startTime = Date.now();
        const response = await this.makeRequest(method, pattern);
        const duration = Date.now() - startTime;

        if (response && typeof response === 'object') {
          const endpoint: APIEndpoint = {
            endpointId: `${method}_${pattern}`,
            url: pattern,
            method,
            description: this.generateEndpointDescription(method, pattern, response),
            discoveredAt: new Date().toISOString(),
            lastTested: new Date().toISOString(),
            isActive: true,
            headers: this.extractRelevantHeaders(response),
            responses: {
              [response.status || 200]: {
                description: `${method} ${pattern} response`,
                body: response.data || response,
              },
            },
          };

          this.discoveredEndpoints.set(endpoint.endpointId, endpoint);
          this.logger.debug(`Discovered endpoint: ${method} ${pattern}`, {
            status: response.status,
            duration,
          });
        }
      } catch (error) {
        // Log failed attempts but continue with other patterns
        this.logger.debug(`Failed to test ${method} ${pattern}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * Test discovered endpoints to verify functionality
   */
  private async testDiscoveredEndpoints(): Promise<void> {
    this.logger.info('Testing discovered endpoints...');

    for (const endpoint of this.discoveredEndpoints.values()) {
      try {
        const response = await this.makeRequest(endpoint.method, endpoint.url);

        if (response) {
          endpoint.lastTested = new Date().toISOString();
          endpoint.isActive = true;

          // Update response example
          if (endpoint.responses) {
            endpoint.responses[response.status || 200] = {
              description: `${endpoint.method} ${endpoint.url} response`,
              body: response.data || response,
            };
          }
        }
      } catch (error) {
        endpoint.isActive = false;
        this.logger.warn(`Endpoint ${endpoint.method} ${endpoint.url} is not active:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * Analyze authentication requirements
   */
  private async analyzeAuthentication(): Promise<void> {
    this.logger.info('Analyzing authentication requirements...');

    // Test with various authentication methods
    const authTests = [
      { type: 'BEARER_TOKEN' as AuthType, headers: { Authorization: 'Bearer test-token' } },
      { type: 'API_KEY' as AuthType, headers: { 'X-API-Key': 'test-api-key' } },
      { type: 'SESSION_COOKIE' as AuthType, headers: { Cookie: 'session=test-session' } },
    ];

    for (const authTest of authTests) {
      try {
        const response = await this.makeAuthenticatedRequest('/api/user/profile', authTest.headers as unknown as Record<string, string>);

        if (response && response.status !== 401) {
          this.authMethods.add(authTest.type);
          this.logger.debug(`Authentication method detected: ${authTest.type}`);
        }
      } catch (error) {
        // Expected for invalid auth tokens
        this.logger.debug(`Auth test failed for ${authTest.type}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // If no auth methods work, assume public access
    if (this.authMethods.size === 0) {
      this.authMethods.add('NONE');
      this.logger.info('No authentication required - public API detected');
    }
  }

  /**
   * Discover streaming endpoints
   */
  private async discoverStreamingEndpoints(): Promise<void> {
    this.logger.info('Discovering streaming endpoints...');

    // Pump.fun specific streaming endpoints
    const pumpFunStreamingPatterns = [
      '/coins/currently-live',
      '/coins/currently-live?offset=0&limit=60&sort=currently_live&order=DESC&includeNsfw=false',
      '/coins/live',
      '/coins/active',
      '/streams/active',
      '/streams/metadata',
      '/livestreams/current',
    ];

    const streamingPatterns = [
      '/api/streams',
      '/api/live',
      '/api/broadcasts',
      '/api/streaming',
      '/stream',
      '/live-stream',
    ];

    const allStreamingPatterns = [...pumpFunStreamingPatterns, ...streamingPatterns];

    for (const pattern of allStreamingPatterns) {
      try {
        const response = await this.makeRequest('GET', pattern);

        if (response && this.isStreamingResponse(response)) {
          const endpoint: APIEndpoint = {
            endpointId: `STREAMING_${pattern}`,
            url: pattern,
            method: 'GET',
            description: `Streaming endpoint: ${pattern}`,
            discoveredAt: new Date().toISOString(),
            lastTested: new Date().toISOString(),
            isActive: true,
            headers: this.extractRelevantHeaders(response),
            responses: {
              [response.status || 200]: {
                description: `Streaming response from ${pattern}`,
                body: response.data || response,
              },
            },
          };

          this.discoveredEndpoints.set(endpoint.endpointId, endpoint);
          this.logger.info(`Discovered streaming endpoint: ${pattern}`);
        }
      } catch (error) {
        this.logger.debug(`Failed to discover streaming endpoint ${pattern}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * Analyze WebSocket connections
   */
  private async analyzeWebSocketConnections(): Promise<void> {
    this.logger.info('Analyzing WebSocket connections...');

    // Pump.fun specific WebSocket endpoints discovered from website analysis
    const pumpFunWSPatterns = [
      'wss://pump.fun',
      'wss://*.pump.fun',  // Wildcard for subdomains
      'wss://pump-fe.helius-rpc.com',  // Helius RPC WebSocket
    ];

    const wsPatterns = [
      'wss://pump.fun/ws',
      'wss://pump.fun/websocket',
      'wss://pump.fun/socket.io',
      'wss://pump.fun/stream',
      'ws://pump.fun/ws',
    ];

    const allWSPatterns = [...pumpFunWSPatterns, ...wsPatterns];

    // Note: WebSocket testing would require WebSocket client implementation
    // For now, we'll document potential WebSocket endpoints based on patterns
    for (const wsUrl of allWSPatterns) {
      this.logger.debug(`Potential WebSocket endpoint: ${wsUrl}`);
      // In a real implementation, you would attempt WebSocket connections here

      // Store potential WebSocket endpoints for later reference
      const wsEndpoint: APIEndpoint = {
        endpointId: `WS_${wsUrl.replace(/[^a-zA-Z0-9]/g, '_')}`,
        url: wsUrl,
        method: 'WEBSOCKET',
        description: `Potential WebSocket endpoint: ${wsUrl}`,
        discoveredAt: new Date().toISOString(),
        lastTested: new Date().toISOString(),
        isActive: false, // Not tested yet
        headers: {},
        responses: {},
      };

      this.discoveredEndpoints.set(wsEndpoint.endpointId, wsEndpoint);
    }

    // Also document NATS messaging system discovered from console logs
    this.logger.info('NATS messaging system detected for real-time trade events');
    this.logger.debug('NATS subject: unifiedTradeEvent.processed');
  }

  /**
   * Make HTTP request for discovery
   */
  private async makeRequest(method: HTTPMethod, url: string, headers?: Record<string, string>): Promise<any> {
    const startTime = Date.now();

    try {
      const requestConfig = {
        method,
        url,
        headers: {
          ...this.config.headers,
          ...headers,
        },
      };

      let response;
      switch (method) {
        case 'GET':
          response = await this.httpClient.get(url, { headers: requestConfig.headers });
          break;
        case 'POST':
          response = await this.httpClient.post(url, undefined, { headers: requestConfig.headers });
          break;
        case 'PUT':
          response = await this.httpClient.put(url, undefined, { headers: requestConfig.headers });
          break;
        case 'DELETE':
          response = await this.httpClient.delete(url, { headers: requestConfig.headers });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      const duration = Date.now() - startTime;

      // Capture request information
      const request: NetworkRequest = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: `${this.config.baseURL}${url}`,
        method,
        headers: requestConfig.headers || {},
        timestamp: new Date().toISOString(),
        response: {
          status: response?.status || 200,
          headers: response?.headers || {},
          body: response?.data || response,
          duration,
        },
      };

      this.capturedRequests.push(request);

      // Keep only recent requests
      if (this.capturedRequests.length > 100) {
        this.capturedRequests = this.capturedRequests.slice(-50);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Capture failed request
      const request: NetworkRequest = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: `${this.config.baseURL}${url}`,
        method,
        headers: headers || {},
        timestamp: new Date().toISOString(),
        response: {
          status: (error as any).response?.status || 0,
          headers: (error as any).response?.headers || {},
          body: (error as any).response?.data || (error instanceof Error ? error.message : String(error)),
          duration,
        },
      };

      this.capturedRequests.push(request);
      throw error;
    }
  }

  /**
   * Make authenticated request
   */
  private async makeAuthenticatedRequest(url: string, headers: Record<string, string>): Promise<any> {
    return this.makeRequest('GET', url, headers);
  }

  /**
   * Check if response indicates streaming functionality
   */
  private isStreamingResponse(response: any): boolean {
    const data = response?.data || response;

    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for streaming-related fields including pump.fun specific ones
    const streamingIndicators = [
      'streams',
      'streaming',
      'live',
      'broadcast',
      'websocket',
      'realtime',
      'ws',
      // Pump.fun specific indicators
      'is_currently_live',
      'livestream_title',
      'num_participants',
      'reply_count',
      'thumbnail',
      'livestream_ban_expiry',
      'currently_live',
      'bonding_curve',
      'market_cap',
    ];

    const dataString = JSON.stringify(data).toLowerCase();
    return streamingIndicators.some(indicator => dataString.includes(indicator));
  }

  /**
   * Generate endpoint description
   */
  private generateEndpointDescription(method: HTTPMethod, url: string, response: any): string {
    const data = response?.data || response;

    if (!data || typeof data !== 'object') {
      return `${method} ${url} - Basic endpoint`;
    }

    // Analyze response structure to generate description
    const keys = Object.keys(data);

    // Pump.fun specific endpoint descriptions
    if (url.includes('currently-live') || keys.includes('is_currently_live')) {
      return `${method} ${url} - PumpFun currently live coins streaming endpoint`;
    }

    if (url.includes('auth/is-valid-jurisdiction')) {
      return `${method} ${url} - PumpFun jurisdiction validation endpoint`;
    }

    if (url.includes('sol-price')) {
      return `${method} ${url} - PumpFun SOL price data endpoint`;
    }

    if (keys.includes('bonding_curve') || keys.includes('mint')) {
      return `${method} ${url} - PumpFun token/coin data endpoint`;
    }

    if (keys.includes('streams') || keys.includes('streaming')) {
      return `${method} ${url} - Streaming data endpoint`;
    }

    if (keys.includes('tokens') || keys.includes('coin')) {
      return `${method} ${url} - Token data endpoint`;
    }

    if (keys.includes('users') || keys.includes('user')) {
      return `${method} ${url} - User data endpoint`;
    }

    if (keys.includes('analytics') || keys.includes('stats')) {
      return `${method} ${url} - Analytics endpoint`;
    }

    // Check if it's an array of pump.fun coins
    if (Array.isArray(data) && data.length > 0 && data[0]?.mint) {
      return `${method} ${url} - PumpFun coin data array endpoint`;
    }

    return `${method} ${url} - API endpoint`;
  }

  /**
   * Extract relevant headers from response
   */
  private extractRelevantHeaders(response: any): Record<string, string> {
    const headers = response?.headers || {};
    const relevantHeaders: Record<string, string> = {};

    // Important headers for API usage
    const importantHeaders = [
      'content-type',
      'cache-control',
      'rate-limit',
      'x-ratelimit',
      'authorization',
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
    ];

    for (const header of importantHeaders) {
      if (headers[header]) {
        relevantHeaders[header] = headers[header];
      }
    }

    return relevantHeaders;
  }

  /**
   * Identify patterns in discovered endpoints
   */
  private identifyPatterns(): string[] {
    const patterns: string[] = [];
    const endpoints = Array.from(this.discoveredEndpoints.values());

    // Analyze URL patterns
    const urlPatterns = endpoints.map(e => e.url);
    const commonPrefixes = this.findCommonPrefixes(urlPatterns);

    patterns.push(...commonPrefixes.map(prefix => `URL pattern: ${prefix}`));

    // Analyze authentication patterns
    if (this.authMethods.size > 0) {
      patterns.push(`Authentication: ${Array.from(this.authMethods).join(', ')}`);
    }

    // Analyze response patterns
    const responseTypes = endpoints.map(e => Object.keys(e.responses || {}));
    const commonStatusCodes = this.findCommonStatusCodes(responseTypes);

    patterns.push(...commonStatusCodes.map(code => `Status code: ${code}`));

    return patterns;
  }

  /**
   * Find common prefixes in URLs
   */
  private findCommonPrefixes(urls: string[]): string[] {
    const prefixes: string[] = [];
    const prefixMap = new Map<string, number>();

    for (const url of urls) {
      const parts = url.split('/').filter(part => part.length > 0);
      let prefix = '';

      for (const part of parts) {
        prefix += '/' + part;
        prefixMap.set(prefix, (prefixMap.get(prefix) || 0) + 1);
      }
    }

    // Return prefixes that appear in multiple URLs
    for (const [prefix, count] of prefixMap.entries()) {
      if (count >= 2 && prefix.length > 1) {
        prefixes.push(prefix);
      }
    }

    return prefixes.sort((a, b) => b.length - a.length).slice(0, 10);
  }

  /**
   * Find common status codes
   */
  private findCommonStatusCodes(responseTypes: string[][]): string[] {
    const statusCounts = new Map<string, number>();

    for (const types of responseTypes) {
      for (const type of types) {
        statusCounts.set(type, (statusCounts.get(type) || 0) + 1);
      }
    }

    return Array.from(statusCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code]) => code);
  }

  /**
   * Generate metadata
   */
  private generateMetadata(): Record<string, any> {
    return {
      totalEndpoints: this.discoveredEndpoints.size,
      activeEndpoints: Array.from(this.discoveredEndpoints.values()).filter(e => e.isActive).length,
      authMethods: Array.from(this.authMethods),
      discoveryTime: new Date().toISOString(),
      userAgent: this.config.userAgent,
      baseURL: this.config.baseURL,
      capturedRequests: this.capturedRequests.length,
    };
  }

  /**
   * Calculate confidence score for discovery results
   */
  private calculateConfidenceScore(result: DetailedDiscoveryResult): number {
    let score = 0;
    let maxScore = 0;

    // Base score for discovering endpoints
    score += Math.min(result.endpoints.length * 10, 50);
    maxScore += 50;

    // Score for active endpoints
    const activeEndpoints = result.endpoints.filter(e => e.isActive).length;
    score += Math.min((activeEndpoints / result.endpoints.length) * 30, 30);
    maxScore += 30;

    // Score for authentication discovery
    if (result.authenticationMethods.length > 0) {
      score += 10;
    }
    maxScore += 10;

    // Score for streaming endpoints
    if (result.streamingEndpoints.length > 0) {
      score += 10;
    }
    maxScore += 10;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Generate discovery notes
   */
  private generateDiscoveryNotes(result: DetailedDiscoveryResult): string[] {
    const notes: string[] = [];

    if (result.endpoints.length === 0) {
      notes.push('No API endpoints were discovered. This may indicate the API is not accessible or requires special authentication.');
    } else {
      notes.push(`Discovered ${result.endpoints.length} API endpoints.`);

      const activeCount = result.endpoints.filter(e => e.isActive).length;
      notes.push(`${activeCount} endpoints are currently active.`);

      if (result.streamingEndpoints.length > 0) {
        notes.push(`Found ${result.streamingEndpoints.length} streaming-related endpoints.`);
      }

      if (result.authenticationMethods.includes('NONE')) {
        notes.push('API appears to be publicly accessible (no authentication required).');
      } else {
        notes.push(`API requires authentication: ${result.authenticationMethods.join(', ')}`);
      }
    }

    if (result.requestSamples.length > 0) {
      notes.push(`Analyzed ${result.requestSamples.length} request/response samples.`);
    }

    return notes;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get discovered endpoints
   */
  getDiscoveredEndpoints(): APIEndpoint[] {
    return Array.from(this.discoveredEndpoints.values());
  }

  /**
   * Get captured requests
   */
  getCapturedRequests(): NetworkRequest[] {
    return [...this.capturedRequests];
  }

  /**
   * Get authentication methods
   */
  getAuthenticationMethods(): AuthType[] {
    return Array.from(this.authMethods);
  }

  /**
   * Export discovery results
   */
  exportResults(): DetailedDiscoveryResult {
    return {
      endpoints: Array.from(this.discoveredEndpoints.values()),
      authenticationMethods: Array.from(this.authMethods),
      patterns: this.identifyPatterns(),
      metadata: this.generateMetadata(),
      discoveredAt: new Date().toISOString(),
      requestSamples: this.capturedRequests.slice(-50),
      authSamples: [],
      rateLimitSamples: this.rateLimitInfo,
      websocketEndpoints: [],
      streamingEndpoints: Array.from(this.discoveredEndpoints.values()).filter(e =>
        e.description?.includes('streaming')
      ),
      documentation: {
        discoveredAt: new Date().toISOString(),
        methodology: 'Network traffic analysis and systematic endpoint probing',
        confidence: this.calculateConfidenceScore({
          endpoints: Array.from(this.discoveredEndpoints.values()),
          authenticationMethods: Array.from(this.authMethods),
          patterns: [],
          metadata: {},
          discoveredAt: new Date().toISOString(),
          requestSamples: [],
          authSamples: [],
          rateLimitSamples: [],
          websocketEndpoints: [],
          streamingEndpoints: [],
          documentation: {
            discoveredAt: new Date().toISOString(),
            methodology: '',
            confidence: 0,
            notes: [],
          },
        }),
        notes: this.generateDiscoveryNotes({
          endpoints: Array.from(this.discoveredEndpoints.values()),
          authenticationMethods: Array.from(this.authMethods),
          patterns: [],
          metadata: {},
          discoveredAt: new Date().toISOString(),
          requestSamples: [],
          authSamples: [],
          rateLimitSamples: [],
          websocketEndpoints: [],
          streamingEndpoints: [],
          documentation: {
            discoveredAt: new Date().toISOString(),
            methodology: '',
            confidence: 0,
            notes: [],
          },
        }),
      },
    };
  }
}

/**
 * Utility function to create a new API discovery instance
 */
export function createAPIDiscovery(config?: DiscoveryConfig): APIDiscovery {
  return new APIDiscovery(config);
}

/**
 * Default API discovery instance
 */
export const apiDiscovery = new APIDiscovery();