/**
 * Authenticated Request Examples for PumpFun Streaming API
 *
 * This file demonstrates comprehensive usage of authenticated PumpFun API endpoints
 * with proper request formatting, error handling, and best practices.
 *
 * Created: 2025-10-11
 * Purpose: T021 - Show proper authenticated request formats and examples
 */

import { createExampleGenerator, APIConfig, WebhookRegistration } from '../utils/example-generator';
import { Logger } from '../utils/logger';

// Configuration
const API_CONFIG: APIConfig = {
  baseURL: 'https://api.pumpfun-monitor.com/v1',
  token: process.env.PUMPFUN_API_TOKEN || 'YOUR_API_TOKEN_HERE',
  userAgent: 'PumpFunClient/1.0'
};

/**
 * Authenticated PumpFun API Client
 * Demonstrates proper authentication and request handling
 */
class AuthenticatedPumpFunClient {
  private config: APIConfig;
  private logger: Logger;
  private exampleGenerator: ReturnType<typeof createExampleGenerator>;

  constructor(config: APIConfig) {
    this.config = config;
    this.logger = new Logger({}, { component: 'AuthenticatedPumpFunClient' });
    this.exampleGenerator = createExampleGenerator(config);
  }

  /**
   * Example: Get active streams with authentication
   */
  async getActiveStreams(params?: {
    status?: 'active' | 'inactive' | 'all';
    limit?: number;
    offset?: number;
    sort?: 'viewer_count' | 'start_time' | 'duration';
    order?: 'asc' | 'desc';
  }) {
    this.logger.info('Fetching active streams with authentication...');

    const example = this.exampleGenerator.getActiveStreams(params);
    console.log('\n📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));

    try {
      // Simulate making the request (in real implementation, use fetch/axios)
      const response = await this.makeRequest('GET', example.url, example.headers);

      this.logger.info('Successfully retrieved active streams');
      return response;
    } catch (error) {
      this.logger.error('Failed to get active streams:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Example: Get detailed stream information
   */
  async getStreamDetails(streamId: string, includeHistory: boolean = false) {
    this.logger.info(`Getting details for stream: ${streamId}`);

    const example = this.exampleGenerator.getStreamDetails(streamId, includeHistory);
    console.log('\n📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));

    try {
      const response = await this.makeRequest('GET', example.url, example.headers);

      this.logger.info('Successfully retrieved stream details');
      return response;
    } catch (error) {
      this.logger.error('Failed to get stream details:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Example: Get stream events with filtering
   */
  async getStreamEvents(
    streamId: string,
    options?: {
      eventType?: 'STREAM_STARTED' | 'STREAM_ENDED' | 'METADATA_UPDATED' | 'STATUS_CHANGED' | 'ERROR_OCCURRED';
      limit?: number;
      since?: string;
    }
  ) {
    this.logger.info(`Getting events for stream: ${streamId}`);

    const example = this.exampleGenerator.getStreamEvents(
      streamId,
      options?.eventType,
      { limit: options?.limit, since: options?.since }
    );
    console.log('\n📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));

    try {
      const response = await this.makeRequest('GET', example.url, example.headers);

      this.logger.info('Successfully retrieved stream events');
      return response;
    } catch (error) {
      this.logger.error('Failed to get stream events:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Example: Get tokens with search and filtering
   */
  async getTokens(params?: {
    search?: string;
    has_active_stream?: boolean;
    limit?: number;
    offset?: number;
  }) {
    this.logger.info('Fetching tokens with filters...');

    const example = this.exampleGenerator.getTokens(params);
    console.log('\n📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));

    try {
      const response = await this.makeRequest('GET', example.url, example.headers);

      this.logger.info('Successfully retrieved tokens');
      return response;
    } catch (error) {
      this.logger.error('Failed to get tokens:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Example: Get token streaming history with time range
   */
  async getTokenStreamingHistory(
    tokenId: string,
    params?: {
      start_date?: string;
      end_date?: string;
      limit?: number;
    }
  ) {
    this.logger.info(`Getting streaming history for token: ${tokenId}`);

    const example = this.exampleGenerator.getTokenStreamingHistory(tokenId, params);
    console.log('\n📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));

    try {
      const response = await this.makeRequest('GET', example.url, example.headers);

      this.logger.info('Successfully retrieved token streaming history');
      return response;
    } catch (error) {
      this.logger.error('Failed to get token streaming history:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Example: Get user streaming history
   */
  async getUserStreamingHistory(
    userId: string,
    includeActive: boolean = true,
    limit: number = 50
  ) {
    this.logger.info(`Getting streaming history for user: ${userId}`);

    const example = this.exampleGenerator.getUserStreamingHistory(userId, includeActive, limit);
    console.log('\n📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));

    try {
      const response = await this.makeRequest('GET', example.url, example.headers);

      this.logger.info('Successfully retrieved user streaming history');
      return response;
    } catch (error) {
      this.logger.error('Failed to get user streaming history:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Example: Get analytics data
   */
  async getTopStreams(
    metric: 'viewer_count' | 'duration' | 'peak_viewers',
    timeRange: '1h' | '24h' | '7d' | '30d',
    limit: number = 10
  ) {
    this.logger.info(`Getting top streams by ${metric} for ${timeRange}`);

    const example = this.exampleGenerator.getTopStreams(metric, timeRange, limit);
    console.log('\n📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));

    try {
      const response = await this.makeRequest('GET', example.url, example.headers);

      this.logger.info('Successfully retrieved top streams analytics');
      return response;
    } catch (error) {
      this.logger.error('Failed to get top streams:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Example: Get dashboard statistics
   */
  async getDashboardStats() {
    this.logger.info('Getting dashboard statistics...');

    const example = this.exampleGenerator.getDashboardStats();
    console.log('\n📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));

    try {
      const response = await this.makeRequest('GET', example.url, example.headers);

      this.logger.info('Successfully retrieved dashboard statistics');
      return response;
    } catch (error) {
      this.logger.error('Failed to get dashboard stats:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Example: Register a webhook for real-time notifications
   */
  async registerWebhook(webhook: WebhookRegistration) {
    this.logger.info(`Registering webhook for URL: ${webhook.url}`);

    const example = this.exampleGenerator.registerWebhook(webhook);
    console.log('\n📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));

    try {
      const response = await this.makeRequest('POST', example.url, example.headers, example.body);

      this.logger.info('Successfully registered webhook');
      return response;
    } catch (error) {
      this.logger.error('Failed to register webhook:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Make HTTP request with proper authentication and error handling
   */
  private async makeRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: any
  ): Promise<any> {
    // This is a simulation - in real implementation, use fetch or axios
    console.log(`\n🌐 Making ${method} request to: ${url}`);
    console.log('📤 Headers:', JSON.stringify(headers, null, 2));
    if (body) {
      console.log('📦 Body:', JSON.stringify(body, null, 2));
    }

    // Simulate API response (remove this in real implementation)
    return {
      success: true,
      data: {
        message: 'This is a simulated response',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Handle API errors with proper categorization and retry logic
   */
  private handleAPIError(error: any): Error {
    if (error.status === 401) {
      return new Error('Authentication failed - check your API token');
    } else if (error.status === 429) {
      const retryAfter = error.headers?.['retry-after'] || 60;
      return new Error(`Rate limit exceeded - retry after ${retryAfter} seconds`);
    } else if (error.status === 404) {
      return new Error('Resource not found');
    } else if (error.status >= 500) {
      return new Error('Server error - please try again later');
    } else {
      return new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Generate all request examples for documentation
   */
  generateAllExamples() {
    return this.exampleGenerator.generateAllExamples();
  }

  /**
   * Generate example with custom request ID for debugging
   */
  generateWithRequestID(endpoint: string, requestId?: string) {
    const examples = this.generateAllExamples();
    const example = examples[endpoint];

    if (!example) {
      throw new Error(`Example for endpoint '${endpoint}' not found`);
    }

    return this.exampleGenerator.generateWithRequestID(example, requestId);
  }
}

/**
 * Authentication setup and validation examples
 */
class AuthenticationManager {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
  }

  /**
   * Validate API token format
   */
  validateToken(token: string): boolean {
    // Basic validation - adjust based on actual token format
    return Boolean(token && token.length > 10 && !token.includes('YOUR_API_TOKEN_HERE'));
  }

  /**
   * Setup authentication headers
   */
  getAuthHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': this.config.userAgent || 'PumpFunClient/1.0',
      ...additionalHeaders
    };

    return headers;
  }

  /**
   * Test authentication with a simple API call
   */
  async testAuthentication(): Promise<boolean> {
    try {
      const client = new AuthenticatedPumpFunClient(this.config);
      await client.getDashboardStats();
      return true;
    } catch (error) {
      console.error('Authentication test failed:', error);
      return false;
    }
  }
}

/**
 * Example usage functions demonstrating different scenarios
 */

/**
 * Example 1: Basic authenticated request - Get active streams
 */
async function example1_BasicAuthenticatedRequest() {
  console.log('\n🔐 Example 1: Basic Authenticated Request - Get Active Streams');
  console.log('=' .repeat(70));

  // Validate authentication first
  const authManager = new AuthenticationManager(API_CONFIG);

  if (!authManager.validateToken(API_CONFIG.token)) {
    console.error('❌ Invalid API token - please set PUMPFUN_API_TOKEN environment variable');
    return;
  }

  const client = new AuthenticatedPumpFunClient(API_CONFIG);

  try {
    const streams = await client.getActiveStreams({
      status: 'active',
      limit: 10,
      sort: 'viewer_count',
      order: 'desc'
    });

    console.log('✅ Successfully retrieved active streams');
    console.log('📊 Response:', JSON.stringify(streams, null, 2));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 2: Parameterized request - Get stream details with history
 */
async function example2_ParameterizedRequest() {
  console.log('\n📋 Example 2: Parameterized Request - Stream Details with History');
  console.log('=' .repeat(70));

  const client = new AuthenticatedPumpFunClient(API_CONFIG);
  const streamId = 'stream_123456789'; // Example stream ID

  try {
    const details = await client.getStreamDetails(streamId, true);

    console.log('✅ Successfully retrieved stream details');
    console.log('📊 Response:', JSON.stringify(details, null, 2));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 3: Complex filtering - Get tokens with advanced filters
 */
async function example3_ComplexFiltering() {
  console.log('\n🔍 Example 3: Complex Filtering - Search Tokens with Active Streams');
  console.log('=' .repeat(70));

  const client = new AuthenticatedPumpFunClient(API_CONFIG);

  try {
    const tokens = await client.getTokens({
      search: 'pump',
      has_active_stream: true,
      limit: 20,
      offset: 0
    });

    console.log('✅ Successfully retrieved filtered tokens');
    console.log('📊 Response:', JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 4: Time-range queries - Get analytics for specific period
 */
async function example4_TimeRangeQueries() {
  console.log('\n📅 Example 4: Time Range Queries - Top Streams Analytics');
  console.log('=' .repeat(70));

  const client = new AuthenticatedPumpFunClient(API_CONFIG);

  try {
    const analytics = await client.getTopStreams('viewer_count', '24h', 5);

    console.log('✅ Successfully retrieved analytics data');
    console.log('📊 Response:', JSON.stringify(analytics, null, 2));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 5: POST request - Register webhook
 */
async function example5_POSTRequest() {
  console.log('\n🪝 Example 5: POST Request - Register Webhook');
  console.log('=' .repeat(70));

  const client = new AuthenticatedPumpFunClient(API_CONFIG);

  const webhookConfig: WebhookRegistration = {
    url: 'https://your-app.com/webhook',
    events: ['STREAM_STARTED', 'STREAM_ENDED', 'METADATA_UPDATED'],
    secret: 'webhook_secret_123',
    active: true
  };

  try {
    const result = await client.registerWebhook(webhookConfig);

    console.log('✅ Successfully registered webhook');
    console.log('📊 Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 6: Request with custom ID for debugging
 */
async function example6_RequestWithCustomID() {
  console.log('\n🆔 Example 6: Request with Custom ID - Debugging Support');
  console.log('=' .repeat(70));

  const client = new AuthenticatedPumpFunClient(API_CONFIG);
  const customRequestId = 'req_debug_12345';

  try {
    const example = client.generateWithRequestID('getActiveStreams', customRequestId);

    console.log('✅ Generated request with custom ID');
    console.log('📋 Request Example:');
    console.log(JSON.stringify(example, null, 2));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 7: Error handling demonstration
 */
async function example7_ErrorHandling() {
  console.log('\n⚠️  Example 7: Error Handling - Invalid Token');
  console.log('=' .repeat(70));

  // Use invalid token to demonstrate error handling
  const invalidConfig: APIConfig = {
    ...API_CONFIG,
    token: 'invalid_token_example'
  };

  const client = new AuthenticatedPumpFunClient(invalidConfig);

  try {
    await client.getDashboardStats();
    console.log('✅ Request succeeded (unexpected)');
  } catch (error) {
    console.log('✅ Error properly caught and handled');
    console.error('❌ Expected Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 8: Generate all request examples for documentation
 */
async function example8_GenerateDocumentation() {
  console.log('\n📚 Example 8: Generate Complete API Documentation Examples');
  console.log('=' .repeat(70));

  const client = new AuthenticatedPumpFunClient(API_CONFIG);

  try {
    const allExamples = client.generateAllExamples();

    console.log('✅ Generated all request examples');
    console.log('\n📋 Available Endpoints:');

    Object.keys(allExamples).forEach((endpoint, index) => {
      console.log(`${index + 1}. ${endpoint}`);
      const example = allExamples[endpoint];
      if (example) {
        console.log(`   📝 ${example.description}`);
        console.log(`   🌐 ${example.method} ${example.url}`);
      }
      console.log('');
    });

    // Save examples to file (in real implementation)
    console.log('💾 Examples can be saved to documentation files');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Main execution function - run all examples
 */
async function runAllAuthenticatedExamples() {
  console.log('🚀 PumpFun API - Authenticated Request Examples');
  console.log('=' .repeat(75));
  console.log('Demonstrating proper authentication, request formatting, and error handling...\n');

  try {
    await example1_BasicAuthenticatedRequest();
    await example2_ParameterizedRequest();
    await example3_ComplexFiltering();
    await example4_TimeRangeQueries();
    await example5_POSTRequest();
    await example6_RequestWithCustomID();
    await example7_ErrorHandling();
    await example8_GenerateDocumentation();

    console.log('✅ All authenticated examples completed!');
    console.log('\n💡 Key Authentication Insights:');
    console.log('   • Always include Authorization: Bearer <token> header');
    console.log('   • Set proper Content-Type and Accept headers');
    console.log('   • Handle 401 errors for authentication failures');
    console.log('   • Implement rate limit handling for 429 responses');
    console.log('   • Use request IDs for debugging and support');
    console.log('   • Validate tokens before making requests');
    console.log('   • Store tokens securely, never in client-side code');

  } catch (error) {
    console.error('\n💥 Some examples failed:', error instanceof Error ? error.message : error);
  }
}

// Export classes and functions for individual testing
export {
  AuthenticatedPumpFunClient,
  AuthenticationManager,
  API_CONFIG,
  example1_BasicAuthenticatedRequest,
  example2_ParameterizedRequest,
  example3_ComplexFiltering,
  example4_TimeRangeQueries,
  example5_POSTRequest,
  example6_RequestWithCustomID,
  example7_ErrorHandling,
  example8_GenerateDocumentation,
  runAllAuthenticatedExamples
};

// Run all examples if this file is executed directly
if (require.main === module) {
  // Check if API token is set
  if (!process.env.PUMPFUN_API_TOKEN || process.env.PUMPFUN_API_TOKEN === 'YOUR_API_TOKEN_HERE') {
    console.error('⚠️  Warning: PUMPFUN_API_TOKEN environment variable not set');
    console.error('Please set your API token: export PUMPFUN_API_TOKEN=your_actual_token');
    console.error('Examples will run with simulated responses.\n');
  }

  runAllAuthenticatedExamples().catch(console.error);
}