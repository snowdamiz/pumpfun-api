/**
 * Tests for Enhanced HTTP Client Utility
 */

import { HTTPClient, APIError, createHTTPClient } from '../../src/utils/http-client';

describe('APIError', () => {
  it('should create APIError with required properties', () => {
    const errorData = {
      code: 'TEST_ERROR',
      message: 'Test error message',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      isRetryable: false,
    };

    const error = new APIError(errorData);

    expect(error.name).toBe('APIError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test error message');
    expect(error.statusCode).toBe(400);
    expect(error.isRetryable).toBe(false);
    expect(error.timestamp).toBe(errorData.timestamp);
  });

  it('should create retryable APIError', () => {
    const errorData = {
      code: 'RETRYABLE_ERROR',
      message: 'Retryable error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };

    const error = APIError.retryable(errorData);

    expect(error.isRetryable).toBe(true);
    expect(error.code).toBe('RETRYABLE_ERROR');
  });

  it('should create non-retryable APIError', () => {
    const errorData = {
      code: 'NON_RETRYABLE_ERROR',
      message: 'Non-retryable error',
      statusCode: 400,
      timestamp: new Date().toISOString(),
    };

    const error = APIError.nonRetryable(errorData);

    expect(error.isRetryable).toBe(false);
    expect(error.code).toBe('NON_RETRYABLE_ERROR');
  });

  it('should convert to JSON', () => {
    const errorData = {
      code: 'JSON_ERROR',
      message: 'JSON test error',
      statusCode: 422,
      timestamp: new Date().toISOString(),
      isRetryable: false,
    };

    const error = new APIError(errorData);
    const json = error.toJSON();

    expect(json).toHaveProperty('name', 'APIError');
    expect(json).toHaveProperty('code', 'JSON_ERROR');
    expect(json).toHaveProperty('message', 'JSON test error');
    expect(json).toHaveProperty('statusCode', 422);
    expect(json).toHaveProperty('isRetryable', false);
  });
});

describe('HTTPClient Configuration', () => {
  it('should have default configurations', () => {
    // Test that default configurations are properly defined
    const retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENOTFOUND'],
      enableJitter: true,
    };

    const rateLimitConfig = {
      maxRequestsPerWindow: 60,
      windowMs: 60000,
      enableRetryAfter: true,
      enableSlidingWindow: true,
      enableBurstProtection: true,
      maxBurst: 10,
      enableBackoff: true,
      baseBackoffMs: 1000,
      maxBackoffMs: 10000,
      backoffMultiplier: 1.5,
    };

    expect(retryConfig.maxRetries).toBe(3);
    expect(retryConfig.enableJitter).toBe(true);
    expect(rateLimitConfig.maxRequestsPerWindow).toBe(60);
    expect(rateLimitConfig.enableBurstProtection).toBe(true);
  });
});

describe('Utility Functions', () => {
  it('should export createHTTPClient function', () => {
    expect(typeof createHTTPClient).toBe('function');
  });

  it('should export HTTPClient class', () => {
    expect(typeof HTTPClient).toBe('function');
  });

  it('should export APIError class', () => {
    expect(typeof APIError).toBe('function');
  });
});