/**
 * Error Handler for PumpFun API Client
 *
 * This class handles all error detection, categorization, and recovery logic
 * for the PumpFun API client, providing centralized error management.
 */

import { ErrorHandlerConfig } from './types';
import {
  NetworkError,
  RateLimitError,
  ServerError,
  ConfigurationError,
  TimeoutError,
  ValidationError,
  PumpFunAPIError,
  ErrorUtils,
} from './errors';
import { Logger } from '../logging/logger';

/**
 * Centralized error handler for PumpFun API client
 */
export class ErrorHandler {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private config: ErrorHandlerConfig,
    private logger: Logger
  ) {
    // Required for parameter properties
  }

  /**
   * Main error handling method that routes to specific handlers
   */
  handleError(
    error: any,
    operation: string,
    context?: any
  ):
    | NetworkError
    | ConfigurationError
    | ServerError
    | ValidationError
    | RateLimitError
    | PumpFunAPIError
    | TimeoutError {
    // If it's already a PumpFunError, enhance it with operation context
    if (error.details && error.details.operation !== undefined) {
      // Add operation context if not already present
      if (!error.details.operation) {
        error.details.operation = operation;
      }
      if (context && error.details.context) {
        error.details.context = { ...error.details.context, ...context };
      } else if (context) {
        error.details.context = context;
      }
      return error;
    }

    // Categorize the error and route to appropriate handler
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, operation, context);
    }

    if (this.isHTTPError(error)) {
      return this.handleHTTPError(error, operation, context);
    }

    if (this.isTimeoutError(error)) {
      return this.handleTimeoutError(error, operation, context);
    }

    if (this.isConfigurationError(error)) {
      return this.handleConfigurationError(error, operation, context);
    }

    if (this.isAPIValidationError(error)) {
      return this.handleAPIValidationError(error, operation, context);
    }

    if (this.isRateLimitExceededError(error)) {
      return this.handleRateLimitExceededError(error, operation, context);
    }

    // Unknown error - wrap in generic NetworkError
    return new NetworkError({
      message: `Unexpected error during ${operation}: ${error.message || String(error)}`,
      code: 'UNKNOWN_ERROR',
      details: {
        operation,
        originalError: ErrorUtils.formatForLogging(error),
        ...context,
      },
    });
  }

  /**
   * Error detection methods
   */
  private isNetworkError(error: any): boolean {
    return (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET' ||
      error.code === 'EHOSTUNREACH' ||
      error.code === 'ENETUNREACH' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('fetch')
    );
  }

  private isTimeoutError(error: any): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'TIMEOUT' ||
      error.message?.includes('timeout') ||
      error.message?.includes('timed out')
    );
  }

  private isConfigurationError(error: any): boolean {
    return (
      error.message?.includes('Configuration') ||
      error.message?.includes('Invalid baseURL') ||
      error.message?.includes('Invalid timeout') ||
      error.message?.includes('validation failed')
    );
  }

  private isAPIValidationError(error: any): boolean {
    return (
      error.message?.includes('Invalid response') ||
      error.message?.includes('validation') ||
      error.message?.includes('schema') ||
      error.message?.includes('format')
    );
  }

  private isRateLimitExceededError(error: any): boolean {
    return (
      error.message?.includes('rate limit') ||
      error.message?.includes('too many requests') ||
      error.message?.includes('429') ||
      error.status === 429 ||
      error.response?.status === 429
    );
  }

  private isHTTPError(error: any): boolean {
    return error.response && typeof error.response.status === 'number';
  }

  /**
   * Error categorization for logging and metrics
   */
  categorizeError(error: any, _operation: string): string {
    // Network connectivity issues
    if (this.isNetworkError(error)) {
      return 'NETWORK';
    }

    // Timeout issues
    if (this.isTimeoutError(error)) {
      return 'TIMEOUT';
    }

    // Configuration issues
    if (this.isConfigurationError(error)) {
      return 'CONFIGURATION';
    }

    // API response validation issues
    if (this.isAPIValidationError(error)) {
      return 'VALIDATION';
    }

    // Rate limiting
    if (this.isRateLimitExceededError(error)) {
      return 'RATE_LIMIT';
    }

    // HTTP status errors
    if (this.isHTTPError(error)) {
      const status = error.response?.status;
      if (status >= 400 && status < 500) {
        return 'CLIENT_ERROR';
      } else if (status >= 500) {
        return 'SERVER_ERROR';
      }
    }

    return 'UNKNOWN';
  }

  /**
   * Specific error handlers
   */
  private handleNetworkError(error: any, operation: string, context?: any): NetworkError {
    return new NetworkError({
      message: `Network error during ${operation}: ${error.message}`,
      code: error.code || 'NETWORK_ERROR',
      originalError: error,
      details: {
        operation,
        errorCode: error.code,
        isRetryable: true,
        retryAfter: 1000,
        suggestions: this.getNetworkErrorRecovery(error, operation),
        ...context,
      },
    });
  }

  private handleHTTPError(
    error: any,
    operation: string,
    context?: any
  ): NetworkError | PumpFunAPIError | ValidationError | ServerError {
    const { response } = error;
    const statusCode = response.status;
    const responseData = response.data;

    // Handle specific HTTP status codes
    if (statusCode === 401) {
      return new PumpFunAPIError({
        message: `Authentication failed during ${operation}: ${responseData?.message || 'Unauthorized'}`,
        code: 'AUTHENTICATION_ERROR',
        statusCode,
        isRetryable: false,
        details: {
          operation,
          status: statusCode,
          suggestions: [
            'Check your API credentials',
            'Ensure your API key is valid and active',
            'Verify you have the necessary permissions',
          ],
          ...context,
        },
      });
    }

    if (statusCode === 403) {
      return new PumpFunAPIError({
        message: `Access forbidden during ${operation}: ${responseData?.message || 'Forbidden'}`,
        code: 'AUTHORIZATION_ERROR',
        statusCode,
        isRetryable: false,
        details: {
          operation,
          status: statusCode,
          suggestions: [
            'Check your account permissions',
            'Ensure you have access to this resource',
            'Contact support if you believe this is an error',
          ],
          ...context,
        },
      });
    }

    if (statusCode === 404) {
      return new PumpFunAPIError({
        message: `Resource not found during ${operation}: ${responseData?.message || 'Not Found'}`,
        code: 'NOT_FOUND_ERROR',
        statusCode,
        isRetryable: false,
        details: {
          operation,
          status: statusCode,
          suggestions: [
            'Verify the resource exists',
            'Check your request parameters',
            'Ensure you have the correct identifiers',
          ],
          ...context,
        },
      });
    }

    if (statusCode === 422) {
      return new ValidationError({
        message: `Validation failed during ${operation}: ${responseData?.message || 'Unprocessable Entity'}`,
        details: {
          operation,
          validationErrors: responseData?.errors || [],
          statusCode,
          suggestions: this.getHTTPErrorRecovery(statusCode, operation, responseData),
          ...context,
        },
      });
    }

    if (statusCode >= 400 && statusCode < 500) {
      return new PumpFunAPIError({
        message: `Client error ${statusCode} during ${operation}: ${responseData?.message || error.message}`,
        code: 'CLIENT_ERROR',
        statusCode,
        isRetryable: false,
        details: {
          operation,
          status: statusCode,
          suggestions: this.getHTTPErrorRecovery(statusCode, operation, responseData),
          ...context,
        },
      });
    }

    // Server errors (5xx)
    if (statusCode >= 500) {
      return new ServerError({
        message: `Server error ${statusCode} during ${operation}: ${responseData?.message || error.message}`,
        statusCode,
        details: {
          operation,
          status: statusCode,
          suggestions: this.getHTTPErrorRecovery(statusCode, operation, responseData),
          ...context,
        },
      });
    }

    // Fallback for other HTTP errors
    return new PumpFunAPIError({
      message: `HTTP ${statusCode} error during ${operation}: ${responseData?.message || error.message}`,
      code: 'HTTP_ERROR',
      statusCode,
      isRetryable: statusCode >= 500,
      details: {
        operation,
        status: statusCode,
        ...context,
      },
    });
  }

  private handleTimeoutError(error: any, operation: string, context?: any): TimeoutError {
    const timeoutError = new TimeoutError({
      message: this.getTimeoutErrorMessage(operation, this.config.timeout),
      timeout: this.config.timeout,
      originalError: error,
      details: {
        operation,
        timeout: this.config.timeout,
        isRetryable: true,
        retryAfter: 2000,
        suggestions: this.getTimeoutErrorRecovery(operation),
        ...context,
      },
    });

    return timeoutError;
  }

  private handleConfigurationError(
    error: any,
    operation: string,
    context?: any
  ): ConfigurationError {
    const configError = new ConfigurationError({
      message: this.getConfigurationErrorMessage(error, operation),
      originalError: error,
      details: {
        operation,
        currentConfig: this.sanitizeConfigForError(),
        isRetryable: false,
        suggestions: this.getConfigurationErrorRecovery(error, operation),
        ...context,
      },
    });

    this.logger.error('Configuration error detected', {
      operation,
      error: ErrorUtils.formatForLogging(error),
      suggestions: configError.details?.suggestions || [],
    });

    return configError;
  }

  private handleAPIValidationError(error: any, operation: string, context?: any): ServerError {
    const validationError = new ServerError({
      message: this.getAPIValidationErrorMessage(error, operation),
      statusCode: 500,
      originalError: error,
      details: {
        operation,
        validationErrors: [error.message],
        code: 'API_VALIDATION_ERROR',
        isRetryable: false,
        suggestions: this.getAPIValidationErrorRecovery(error, operation),
        ...context,
      },
    });

    return validationError;
  }

  private handleRateLimitExceededError(
    error: any,
    operation: string,
    context?: any
  ): RateLimitError {
    const retryAfter = this.extractRetryAfter(error);

    const rateLimitError = new RateLimitError({
      message: this.getRateLimitExceededErrorMessage(error, operation),
      retryAfter,
      originalError: error,
      details: {
        operation,
        limitInfo: {
          limit: error.response?.headers?.['x-ratelimit-limit'],
          remaining: error.response?.headers?.['x-ratelimit-remaining'],
          reset: error.response?.headers?.['x-ratelimit-reset'],
        },
        isRetryable: true,
        suggestions: this.getRateLimitExceededErrorRecovery(error, operation),
        ...context,
      },
    });

    return rateLimitError;
  }

  /**
   * Error recovery suggestion generators
   */
  private getNetworkErrorRecovery(error: any, operation: string): string[] {
    const suggestions = [
      'Check your internet connection',
      'Verify the server is accessible',
      'Try the request again in a few moments',
    ];

    if (error.code === 'ECONNREFUSED') {
      suggestions.push('Ensure the server is running and accessible');
      suggestions.push('Check if firewall rules are blocking the connection');
    }

    if (error.code === 'ENOTFOUND') {
      suggestions.push('Verify the server URL is correct');
      suggestions.push('Check DNS configuration');
    }

    if (operation === 'getLiveCoins') {
      suggestions.push('The live streaming API server may be temporarily unavailable');
      suggestions.push('Check server status at https://status.pump.fun');
    }

    return suggestions;
  }

  private getHTTPErrorRecovery(
    statusCode: number,
    operation: string,
    responseData?: any
  ): string[] {
    const suggestions: string[] = [];

    switch (statusCode) {
      case 400:
        suggestions.push('Check your request parameters');
        suggestions.push('Ensure all required fields are included');
        if (responseData?.errors) {
          suggestions.push(`Validation errors: ${JSON.stringify(responseData.errors)}`);
        }
        break;

      case 401:
        suggestions.push('Check your API credentials');
        suggestions.push('Ensure your API key is valid and active');
        break;

      case 403:
        suggestions.push('Verify you have the necessary permissions');
        suggestions.push('Check if your account has access to this resource');
        break;

      case 404:
        suggestions.push('Verify the resource exists');
        suggestions.push('Check your request parameters');
        break;

      case 429:
        suggestions.push('Rate limit exceeded. Please wait before making more requests');
        suggestions.push('Consider implementing exponential backoff');
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        suggestions.push('Server error occurred. Try again later');
        suggestions.push('Check server status for ongoing issues');
        break;

      default:
        suggestions.push('Check the HTTP status code and response details');
        suggestions.push('Refer to API documentation for this status code');
    }

    if (operation === 'getLiveCoins') {
      suggestions.push('The live streaming data format may have changed');
      suggestions.push('Contact support if the issue persists');
    }

    return suggestions;
  }

  private getTimeoutErrorRecovery(operation: string): string[] {
    const suggestions = [
      'Increase the timeout configuration',
      'Check your network connection speed',
      'Try the request again with a longer timeout',
    ];

    if (operation === 'getLiveCoins') {
      suggestions.push('The live streaming API may be experiencing high load');
      suggestions.push('Consider reducing the amount of data requested');
    }

    return suggestions;
  }

  private getConfigurationErrorRecovery(error: any, _operation: string): string[] {
    const suggestions = [
      'Check your client configuration',
      'Ensure all required configuration values are provided',
      'Validate configuration values against documentation',
    ];

    if (error.message?.includes('baseURL')) {
      suggestions.push('Verify the baseURL is a valid URL');
      suggestions.push('Ensure the URL includes the protocol (http:// or https://)');
    }

    if (error.message?.includes('timeout')) {
      suggestions.push('Ensure timeout is a positive number');
      suggestions.push('Consider increasing timeout for slow connections');
    }

    return suggestions;
  }

  private getAPIValidationErrorMessage(error: any, operation: string): string {
    if (error.message?.includes('Invalid response')) {
      return `Invalid API response format during ${operation}: ${error.message}`;
    }
    return `API response validation failed during ${operation}: ${error.message}`;
  }

  private getAPIValidationErrorRecovery(_error: any, operation: string): string[] {
    const suggestions = [
      'The API response format may have changed',
      'Check if you are using the latest version of the client',
      'Contact support if the issue persists',
    ];

    if (operation === 'getLiveCoins') {
      suggestions.push('The live streaming data format may have been updated');
      suggestions.push(
        'Use getLiveCoins() directly if you need all live streams without filtering'
      );
    }

    return suggestions;
  }

  private getRateLimitExceededErrorMessage(error: any, operation: string): string {
    const retryAfter = this.extractRetryAfter(error);
    const retryMsg = retryAfter > 0 ? ` Retry after ${retryAfter}ms.` : '';
    return `Rate limit exceeded during ${operation}.${retryMsg} ${error.message}`;
  }

  private extractRetryAfter(error: any): number {
    // Try to extract retry-after from headers
    if (error.response?.headers?.['retry-after']) {
      const retryAfter = parseInt(error.response.headers['retry-after'], 10);
      if (!isNaN(retryAfter)) {
        return retryAfter * 1000; // Convert to milliseconds
      }
    }

    // Try to extract from rate limit headers
    if (error.response?.headers?.['x-ratelimit-reset']) {
      const resetTime = parseInt(error.response.headers['x-ratelimit-reset'], 10);
      if (!isNaN(resetTime)) {
        const now = Math.floor(Date.now() / 1000);
        const retryAfter = resetTime - now;
        return Math.max(0, retryAfter) * 1000;
      }
    }

    // Default retry after
    return 60000; // 1 minute
  }

  private getRateLimitExceededErrorRecovery(error: any, operation: string): string[] {
    const retryAfter = this.extractRetryAfter(error);
    const suggestions: string[] = [
      `Wait ${retryAfter}ms before making another request`,
      'Implement exponential backoff in your client',
      'Consider reducing request frequency',
    ];

    if (operation === 'getLiveCoins') {
      suggestions.push('Cache live coins data to reduce API calls');
      suggestions.push('Consider using websockets for real-time updates instead of polling');
    }

    return suggestions;
  }

  private getTimeoutErrorMessage(operation: string, timeout: number): string {
    return `Request timeout during ${operation} operation. The server did not respond within ${timeout}ms. This could be due to network issues or high server load.`;
  }

  private getConfigurationErrorMessage(error: any, operation: string): string {
    if (error.message?.includes('baseURL')) {
      return `Invalid baseURL configuration during ${operation}: ${error.message}`;
    }
    if (error.message?.includes('timeout')) {
      return `Invalid timeout configuration during ${operation}: ${error.message}`;
    }
    return `Configuration error occurred during ${operation}: ${error.message}`;
  }

  private sanitizeConfigForError(): any {
    return {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      hasLoggerConfig: !!this.config.loggerConfig,
      hasRateLimitConfig: !!this.config.rateLimitConfig,
      hasRetryConfig: !!this.config.retryConfig,
    };
  }
}
