/**
 * Endpoint Testing Framework for PumpFun API Discovery
 *
 * Provides comprehensive testing capabilities for discovered API endpoints
 * to verify functionality, authentication requirements, and response structures.
 */

import { HTTPClient } from './http-client';
import { Logger } from './logger';
import { ErrorHandler } from './errors';
import {
  APIEndpoint,
  APIResponse,
  AuthType,
  HTTPMethod,
  RequestConfig,
  NetworkRequest,
  RateLimitInfo
} from '../types/common';

/**
 * Endpoint Test Configuration
 */
export interface EndpointTestConfig {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableDetailedLogging?: boolean;
  validateResponses?: boolean;
  testAuthMethods?: AuthType[];
  customHeaders?: Record<string, string>;
  testPayloads?: Record<string, any>;
}

/**
 * Test Result for a single endpoint
 */
export interface EndpointTestResult {
  endpoint: APIEndpoint;
  success: boolean;
  responseTime: number;
  statusCode: number;
  error?: string;
  response?: any;
  headers?: Record<string, string>;
  authRequired: boolean;
  authMethods: AuthType[];
  rateLimit?: RateLimitInfo;
  responseSchema?: any;
  validationResults?: ValidationResult;
  performanceMetrics: PerformanceMetrics;
  testTimestamp: string;
  authMethod?: AuthType; // Temporary field for testing
}

/**
 * Validation Result for response schema
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  schemaType: string;
  expectedFields: string[];
  actualFields: string[];
  missingFields: string[];
  unexpectedFields: string[];
}

/**
 * Performance Metrics for endpoint testing
 */
export interface PerformanceMetrics {
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  timeoutRate: number;
  errorRate: number;
}

/**
 * Batch Test Results
 */
export interface BatchTestResults {
  totalEndpoints: number;
  successfulTests: number;
  failedTests: number;
  results: EndpointTestResult[];
  summary: TestSummary;
  performanceMetrics: OverallPerformanceMetrics;
  authRequirements: AuthRequirementSummary;
  recommendations: string[];
  testDuration: number;
  testTimestamp: string;
}

/**
 * Test Summary
 */
export interface TestSummary {
  activeEndpoints: number;
  authRequiredEndpoints: number;
  publicEndpoints: number;
  streamingEndpoints: number;
  averageResponseTime: number;
  successRate: number;
  commonErrors: Array<{ error: string; count: number }>;
}

/**
 * Overall Performance Metrics
 */
export interface OverallPerformanceMetrics {
  totalRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
  fastestEndpoint: string;
  slowestEndpoint: string;
  reliabilityScore: number;
}

/**
 * Authentication Requirement Summary
 */
export interface AuthRequirementSummary {
  none: number;
  bearerToken: number;
  apiKey: number;
  sessionCookie: number;
  custom: number;
  unknown: number;
}

/**
 * Endpoint Test Class
 */
export class EndpointTester {
  private httpClient: HTTPClient;
  private logger: Logger;
  private config: EndpointTestConfig;
  private testResults: Map<string, EndpointTestResult> = new Map();
  private performanceData: Map<string, number[]> = new Map();

  constructor(config: EndpointTestConfig = {}) {
    this.config = {
      timeout: 15000, // Increased timeout for pump.fun API
      retryAttempts: 3,
      retryDelay: 1000,
      enableDetailedLogging: true,
      validateResponses: true,
      testAuthMethods: ['NONE', 'BEARER_TOKEN', 'API_KEY'],
      customHeaders: {
        // Pump.fun specific headers
        'Origin': 'https://pump.fun',
        'Referer': 'https://pump.fun/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      },
      testPayloads: {
        // Pump.fun specific test payloads
        '/coins/currently-live?offset=0&limit=60': {},
        '/auth/is-valid-jurisdiction': {},
        '/sol-price': {},
      },
      ...config,
    };

    this.httpClient = new HTTPClient('https://frontend-api-v3.pump.fun', {
      timeout: this.config.timeout,
      headers: this.config.customHeaders,
    });

    this.logger = new Logger({}, { component: 'EndpointTester' });
  }

  /**
   * Test a single endpoint
   */
  async testEndpoint(endpoint: APIEndpoint): Promise<EndpointTestResult> {
    this.logger.info(`Testing endpoint: ${endpoint.method} ${endpoint.url}`);

    const startTime = Date.now();
    const result: EndpointTestResult = {
      endpoint,
      success: false,
      responseTime: 0,
      statusCode: 0,
      authRequired: false,
      authMethods: [],
      performanceMetrics: this.createEmptyPerformanceMetrics(),
      testTimestamp: new Date().toISOString(),
    };

    try {
      // Test without authentication first
      const noAuthResult = await this.testEndpointWithAuth(endpoint, 'NONE');

      if (noAuthResult.success) {
        Object.assign(result, noAuthResult);
        result.authRequired = false;
        result.authMethods = ['NONE'];
      } else {
        // Test with different authentication methods
        const authResults = await this.testAuthenticationMethods(endpoint);
        const successfulAuth = authResults.find(r => r.success);

        if (successfulAuth) {
          Object.assign(result, successfulAuth);
          result.authRequired = true;
          result.authMethods = [successfulAuth.authMethod || 'NONE'];
        } else {
          // All auth methods failed, use the best result
          const bestResult = authResults.reduce((best, current) =>
            (current.statusCode || 0) > (best.statusCode || 0) ? current : best
          );
          Object.assign(result, bestResult);
          result.authRequired = true;
          result.authMethods = authResults.map(r => r.authMethod).filter(Boolean) as AuthType[];
        }
      }

      // Validate response schema if validation is enabled
      if (this.config.validateResponses && result.response) {
        result.validationResults = this.validateResponseSchema(result.response);
      }

      // Collect performance data
      this.collectPerformanceData(endpoint.endpointId, result.responseTime);

      result.success = result.statusCode >= 200 && result.statusCode < 300;
      result.responseTime = Date.now() - startTime;

      this.logger.info(`Endpoint test completed: ${endpoint.method} ${endpoint.url}`, {
        success: result.success,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        authRequired: result.authRequired,
      });

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.responseTime = Date.now() - startTime;
      result.success = false;

      this.logger.error(`Endpoint test failed: ${endpoint.method} ${endpoint.url}`, error instanceof Error ? error : new Error(String(error)));
    }

    // Store result
    this.testResults.set(endpoint.endpointId, result);

    return result;
  }

  /**
   * Test multiple endpoints in batch
   */
  async testEndpoints(endpoints: APIEndpoint[]): Promise<BatchTestResults> {
    this.logger.info(`Starting batch test for ${endpoints.length} endpoints`);

    const startTime = Date.now();
    const results: EndpointTestResult[] = [];

    // Test endpoints concurrently with rate limiting
    const batchSize = 5; // Test 5 endpoints concurrently
    for (let i = 0; i < endpoints.length; i += batchSize) {
      const batch = endpoints.slice(i, i + batchSize);
      const batchPromises = batch.map(endpoint => this.testEndpoint(endpoint));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < endpoints.length && this.config.retryDelay) {
          await this.sleep(this.config.retryDelay);
        }
      } catch (error) {
        this.logger.error(`Batch test failed at index ${i}:`, error);
      }
    }

    const testDuration = Date.now() - startTime;

    // Generate comprehensive results
    const batchResults: BatchTestResults = {
      totalEndpoints: endpoints.length,
      successfulTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      results,
      summary: this.generateTestSummary(results),
      performanceMetrics: this.generateOverallPerformanceMetrics(results),
      authRequirements: this.generateAuthRequirementSummary(results),
      recommendations: this.generateRecommendations(results),
      testDuration,
      testTimestamp: new Date().toISOString(),
    };

    this.logger.info(`Batch test completed`, {
      totalEndpoints: batchResults.totalEndpoints,
      successfulTests: batchResults.successfulTests,
      failedTests: batchResults.failedTests,
      successRate: (batchResults.successfulTests / batchResults.totalEndpoints * 100).toFixed(2) + '%',
      duration: testDuration,
    });

    return batchResults;
  }

  /**
   * Test endpoint with specific authentication method
   */
  private async testEndpointWithAuth(
    endpoint: APIEndpoint,
    authMethod: AuthType
  ): Promise<Partial<EndpointTestResult>> {
    const headers = this.buildAuthHeaders(authMethod);
    const requestConfig: RequestConfig = {
      timeout: this.config.timeout,
      headers: {
        ...endpoint.headers,
        ...headers,
        ...this.config.customHeaders,
      },
    };

    try {
      const response = await this.makeHTTPCall(endpoint.method, endpoint.url, requestConfig);

      return {
        statusCode: response.status || 200,
        response: response.data,
        headers: response.headers,
        authMethod,
      };
    } catch (error) {
      return {
        statusCode: (error as any).response?.status || 0,
        error: error instanceof Error ? error.message : String(error),
        authMethod,
      };
    }
  }

  /**
   * Test different authentication methods for an endpoint
   */
  private async testAuthenticationMethods(
    endpoint: APIEndpoint
  ): Promise<Array<Partial<EndpointTestResult> & { authMethod?: AuthType }>> {
    const authMethods = this.config.testAuthMethods || ['NONE', 'BEARER_TOKEN', 'API_KEY'];
    const results: Array<Partial<EndpointTestResult> & { authMethod?: AuthType }> = [];

    for (const authMethod of authMethods) {
      try {
        const result = await this.testEndpointWithAuth(endpoint, authMethod);
        result.authMethod = authMethod;
        results.push(result);

        // If we find a working auth method, we can stop testing others
        if (result.statusCode && result.statusCode >= 200 && result.statusCode < 300) {
          break;
        }
      } catch (error) {
        results.push({
          statusCode: 0,
          error: error instanceof Error ? error.message : String(error),
          authMethod,
        });
      }

      // Add delay between auth method tests
      if (this.config.retryDelay) {
        await this.sleep(this.config.retryDelay / 2);
      }
    }

    return results;
  }

  /**
   * Build authentication headers for testing
   */
  private buildAuthHeaders(authMethod: AuthType): Record<string, string> {
    switch (authMethod) {
      case 'BEARER_TOKEN':
        return {
          Authorization: 'Bearer test-token-for-discovery',
        };
      case 'API_KEY':
        return {
          'X-API-Key': 'test-api-key-for-discovery',
        };
      case 'SESSION_COOKIE':
        return {
          Cookie: 'session=test-session-for-discovery',
        };
      case 'CUSTOM':
        return {
          'X-Custom-Auth': 'custom-auth-for-discovery',
        };
      case 'NONE':
      default:
        return {};
    }
  }

  /**
   * Make HTTP call with proper error handling
   */
  private async makeHTTPCall(
    method: HTTPMethod,
    url: string,
    config?: RequestConfig
  ): Promise<any> {
    const startTime = Date.now();

    try {
      let response;
      switch (method) {
        case 'GET':
          response = await this.httpClient.get(url, config);
          break;
        case 'POST':
          response = await this.httpClient.post(url, this.config.testPayloads?.[url], config);
          break;
        case 'PUT':
          response = await this.httpClient.put(url, this.config.testPayloads?.[url], config);
          break;
        case 'DELETE':
          response = await this.httpClient.delete(url, config);
          break;
        case 'PATCH':
          response = await this.httpClient.patch(url, this.config.testPayloads?.[url], config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return {
        status: 200,
        data: response,
        headers: {},
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: (error as any).response?.status || 0,
        data: (error as any).response?.data || null,
        headers: (error as any).response?.headers || {},
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate response schema
   */
  private validateResponseSchema(response: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      schemaType: 'unknown',
      expectedFields: [],
      actualFields: [],
      missingFields: [],
      unexpectedFields: [],
    };

    try {
      if (!response || typeof response !== 'object') {
        result.isValid = false;
        result.errors.push('Response is not a valid object');
        return result;
      }

      const actualFields = Object.keys(response);
      result.actualFields = actualFields;

      // Pump.fun specific schema validation
      if (Array.isArray(response) && response.length > 0 && response[0]?.mint) {
        result.schemaType = 'pumpfun-coin-array';
        result.expectedFields = ['mint', 'name', 'symbol', 'description', 'image_uri', 'created_timestamp'];
        // Additional optional fields for pump.fun coins
        const optionalFields = [
          'bonding_curve', 'associated_bonding_curve', 'creator', 'market_cap', 'usd_market_cap',
          'is_currently_live', 'livestream_title', 'num_participants', 'reply_count', 'thumbnail',
          'virtual_sol_reserves', 'virtual_token_reserves', 'real_sol_reserves', 'real_token_reserves',
          'twitter', 'telegram', 'website', 'show_name', 'nsfw', 'complete', 'raydium_pool',
          'last_trade_timestamp', 'king_of_the_hill_timestamp', 'total_supply', 'hidden',
          'market_id', 'inverted', 'livestream_ban_expiry', 'last_reply', 'reply_count',
          'is_banned', 'initialized', 'video_uri', 'updated_at', 'pump_swap_pool',
          'ath_market_cap', 'ath_market_cap_timestamp', 'banner_uri', 'hide_banner',
          'livestream_downrank_score', 'program', 'platform', 'thumbnail_updated_at',
          'downrank_score'
        ];
        result.expectedFields.push(...optionalFields);
      } else if (actualFields.includes('mint') && actualFields.includes('symbol')) {
        result.schemaType = 'pumpfun-coin-object';
        result.expectedFields = ['mint', 'name', 'symbol', 'description', 'image_uri', 'created_timestamp'];
      } else if (actualFields.includes('is_valid') || actualFields.includes('jurisdiction')) {
        result.schemaType = 'pumpfun-auth-response';
        result.expectedFields = ['is_valid', 'jurisdiction'];
      } else if (actualFields.includes('sol_price') || actualFields.includes('price')) {
        result.schemaType = 'pumpfun-price-response';
        result.expectedFields = ['sol_price', 'timestamp'];
      } else if (response.success !== undefined) {
        result.schemaType = 'api-response';
        result.expectedFields = ['success', 'data', 'timestamp'];

        if (response.data) {
          result.expectedFields.push('data');
        }

        if (!response.success && response.error) {
          result.expectedFields.push('error');
        }
      } else if (Array.isArray(response)) {
        result.schemaType = 'array';
        result.expectedFields = ['length'];
      } else if (actualFields.some(field => field.includes('stream'))) {
        result.schemaType = 'streaming-data';
        result.expectedFields = ['streamId', 'status', 'timestamp'];
      } else if (actualFields.some(field => field.includes('token'))) {
        result.schemaType = 'token-data';
        result.expectedFields = ['tokenId', 'name', 'symbol'];
      } else {
        result.schemaType = 'generic-object';
      }

      // Check for required fields
      result.missingFields = result.expectedFields.filter(field => !actualFields.includes(field));
      result.unexpectedFields = actualFields.filter(field =>
        !result.expectedFields.includes(field) && !field.startsWith('_')
      );

      // Validation rules
      if (result.missingFields.length > 0) {
        result.warnings.push(`Missing expected fields: ${result.missingFields.join(', ')}`);
      }

      if (result.unexpectedFields.length > 0) {
        result.warnings.push(`Unexpected fields found: ${result.unexpectedFields.slice(0, 5).join(', ')}`);
      }

      // Type validation for pump.fun specific fields
      if (result.schemaType === 'pumpfun-coin-array' && Array.isArray(response)) {
        const firstCoin = response[0];
        if (firstCoin) {
          if (typeof firstCoin.mint !== 'string') {
            result.errors.push('mint field should be string');
          }
          if (typeof firstCoin.created_timestamp !== 'number') {
            result.warnings.push('created_timestamp field should be number');
          }
          if (firstCoin.is_currently_live !== undefined && typeof firstCoin.is_currently_live !== 'boolean') {
            result.warnings.push('is_currently_live field should be boolean');
          }
        }
      }

      if (response.success !== undefined && typeof response.success !== 'boolean') {
        result.isValid = false;
        result.errors.push('success field should be boolean');
      }

      if (response.timestamp && typeof response.timestamp !== 'string') {
        result.warnings.push('timestamp field should be string');
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Schema validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Collect performance data for an endpoint
   */
  private collectPerformanceData(endpointId: string, responseTime: number): void {
    if (!this.performanceData.has(endpointId)) {
      this.performanceData.set(endpointId, []);
    }

    const times = this.performanceData.get(endpointId)!;
    times.push(responseTime);

    // Keep only last 10 measurements
    if (times.length > 10) {
      times.shift();
    }
  }

  /**
   * Create empty performance metrics
   */
  private createEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      successRate: 0,
      totalRequests: 0,
      failedRequests: 0,
      timeoutRate: 0,
      errorRate: 0,
    };
  }

  /**
   * Generate test summary
   */
  private generateTestSummary(results: EndpointTestResult[]): TestSummary {
    const successfulResults = results.filter(r => r.success);
    const authRequiredResults = results.filter(r => r.authRequired);
    const streamingResults = results.filter(r => r.endpoint.description?.includes('streaming'));

    // Calculate common errors
    const errorCounts = new Map<string, number>();
    results.forEach(result => {
      if (result.error) {
        errorCounts.set(result.error, (errorCounts.get(result.error) || 0) + 1);
      }
    });

    const commonErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    return {
      activeEndpoints: successfulResults.length,
      authRequiredEndpoints: authRequiredResults.length,
      publicEndpoints: results.length - authRequiredResults.length,
      streamingEndpoints: streamingResults.length,
      averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
      successRate: (successfulResults.length / results.length) * 100,
      commonErrors,
    };
  }

  /**
   * Generate overall performance metrics
   */
  private generateOverallPerformanceMetrics(results: EndpointTestResult[]): OverallPerformanceMetrics {
    const successfulResults = results.filter(r => r.success);
    const totalResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0);
    const averageResponseTime = totalResponseTime / results.length;

    // Find fastest and slowest endpoints
    const fastestEndpoint = successfulResults.length > 0 ? successfulResults.reduce((fastest, current) =>
      current.responseTime < fastest.responseTime ? current : fastest
    ) : undefined;

    const slowestEndpoint = results.length > 0 ? results.reduce((slowest, current) =>
      current.responseTime > slowest.responseTime ? current : slowest
    ) : undefined;

    // Calculate reliability score (success rate weighted by response time)
    const reliabilityScore = (successfulResults.length / results.length) *
      (1 - Math.min(averageResponseTime / 5000, 0.5)); // Penalize slow responses

    return {
      totalRequests: results.length,
      totalResponseTime,
      averageResponseTime,
      fastestEndpoint: `${fastestEndpoint?.endpoint.method} ${fastestEndpoint?.endpoint.url}` || 'N/A',
      slowestEndpoint: `${slowestEndpoint?.endpoint.method} ${slowestEndpoint?.endpoint.url}` || 'N/A',
      reliabilityScore: Math.round(reliabilityScore * 100),
    };
  }

  /**
   * Generate authentication requirement summary
   */
  private generateAuthRequirementSummary(results: EndpointTestResult[]): AuthRequirementSummary {
    const summary: AuthRequirementSummary = {
      none: 0,
      bearerToken: 0,
      apiKey: 0,
      sessionCookie: 0,
      custom: 0,
      unknown: 0,
    };

    results.forEach(result => {
      if (result.authMethods.length === 0) {
        summary.unknown++;
      } else {
        result.authMethods.forEach(authMethod => {
          switch (authMethod) {
            case 'NONE':
              summary.none++;
              break;
            case 'BEARER_TOKEN':
              summary.bearerToken++;
              break;
            case 'API_KEY':
              summary.apiKey++;
              break;
            case 'SESSION_COOKIE':
              summary.sessionCookie++;
              break;
            case 'CUSTOM':
              summary.custom++;
              break;
            default:
              summary.unknown++;
          }
        });
      }
    });

    return summary;
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: EndpointTestResult[]): string[] {
    const recommendations: string[] = [];
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const authRequiredCount = results.filter(r => r.authRequired).length;

    // Success rate recommendations
    if (successRate < 80) {
      recommendations.push('Low success rate detected. Consider reviewing endpoint configurations and authentication requirements.');
    }

    // Performance recommendations
    if (averageResponseTime > 5000) {
      recommendations.push('High average response time detected. Consider implementing caching or optimization strategies.');
    }

    // Authentication recommendations
    if (authRequiredCount > results.length * 0.8) {
      recommendations.push('Most endpoints require authentication. Consider implementing a unified authentication strategy.');
    }

    // Error analysis recommendations
    const commonErrors = results.filter(r => r.error).map(r => r.error!);
    const errorGroups = this.groupErrors(commonErrors);

    if (errorGroups['401'] && errorGroups['401'] > 3) {
      recommendations.push('Multiple authentication errors detected. Review authentication token management.');
    }

    if (errorGroups['429'] && errorGroups['429'] > 2) {
      recommendations.push('Rate limiting detected. Consider implementing request throttling.');
    }

    if (errorGroups['timeout'] && errorGroups['timeout'] > 2) {
      recommendations.push('Multiple timeouts detected. Consider increasing timeout values or investigating network issues.');
    }

    // Streaming-specific recommendations
    const streamingEndpoints = results.filter(r => r.endpoint.description?.includes('streaming'));
    if (streamingEndpoints.length > 0) {
      recommendations.push('Streaming endpoints detected. Consider implementing WebSocket connections for real-time data.');
    }

    return recommendations;
  }

  /**
   * Group errors by type
   */
  private groupErrors(errors: string[]): Record<string, number> {
    const groups: Record<string, number> = {};

    errors.forEach(error => {
      const lowerError = error.toLowerCase();

      if (lowerError.includes('401') || lowerError.includes('unauthorized')) {
        groups['401'] = (groups['401'] || 0) + 1;
      } else if (lowerError.includes('429') || lowerError.includes('rate limit')) {
        groups['429'] = (groups['429'] || 0) + 1;
      } else if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
        groups['timeout'] = (groups['timeout'] || 0) + 1;
      } else if (lowerError.includes('network') || lowerError.includes('connection')) {
        groups['network'] = (groups['network'] || 0) + 1;
      } else {
        groups['other'] = (groups['other'] || 0) + 1;
      }
    });

    return groups;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get test results for all tested endpoints
   */
  getTestResults(): EndpointTestResult[] {
    return Array.from(this.testResults.values());
  }

  /**
   * Get performance data for specific endpoint
   */
  getPerformanceData(endpointId: string): number[] {
    return this.performanceData.get(endpointId) || [];
  }

  /**
   * Clear all test results and performance data
   */
  clearResults(): void {
    this.testResults.clear();
    this.performanceData.clear();
  }

  /**
   * Export test results to JSON
   */
  exportResults(): string {
    return JSON.stringify({
      testResults: Array.from(this.testResults.values()),
      performanceData: Object.fromEntries(this.performanceData),
      config: this.config,
      exportTimestamp: new Date().toISOString(),
    }, null, 2);
  }
}

/**
 * Utility function to create a new endpoint tester instance
 */
export function createEndpointTester(config?: EndpointTestConfig): EndpointTester {
  return new EndpointTester(config);
}

/**
 * Default endpoint tester instance
 */
export const endpointTester = new EndpointTester();