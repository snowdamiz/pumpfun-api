/**
 * Comprehensive error handling system for PumpFun API Client
 * Provides hierarchical error classes with retryable/non-retryable categorization
 * and user-friendly messages with clear guidance for resolution
 */

/**
 * Base error class for all PumpFun API errors
 */
export abstract class PumpFunError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: string;
  public readonly isRetryable: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly originalError?: unknown;

  constructor(options: {
    message: string;
    code: string;
    statusCode: number;
    isRetryable: boolean;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.timestamp = new Date().toISOString();
    this.isRetryable = options.isRetryable;
    this.details = options.details;
    this.originalError = options.originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Check if this error can be retried
   */
  canRetry(): boolean {
    return this.isRetryable;
  }

  /**
   * Get suggested retry delay in milliseconds
   */
  getRetryDelay(): number {
    if (!this.isRetryable) {
      return 0;
    }

    // Default retry delays based on error type
    switch (this.code) {
      case 'RATE_LIMIT_EXCEEDED':
        return this.details?.retryAfter && typeof this.details.retryAfter === 'number'
          ? this.details.retryAfter * 1000
          : 60000;
      case 'NETWORK_TIMEOUT':
        return 2000;
      case 'CONNECTION_REFUSED':
        return 5000;
      case 'SERVICE_UNAVAILABLE':
        return 30000;
      default:
        return 1000;
    }
  }

  /**
   * Get user-friendly resolution suggestions
   */
  getResolution(): string[] {
    const suggestions: string[] = [];

    if (this.isRetryable) {
      const retryDelay = this.getRetryDelay();
      suggestions.push(`Wait ${retryDelay / 1000}s and retry the request`);
    }

    return suggestions.concat(this.getSpecificResolution());
  }

  /**
   * Override in subclasses to provide specific resolution suggestions
   */
  protected abstract getSpecificResolution(): string[];

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      isRetryable: this.isRetryable,
      details: this.details,
      resolution: this.getResolution(),
    };
  }
}

/**
 * Network-related errors (connection issues, timeouts, DNS failures)
 */
export class NetworkError extends PumpFunError {
  constructor(options: {
    message: string;
    code: string;
    statusCode?: number;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      ...options,
      statusCode: options.statusCode ?? 0,
      isRetryable: true,
    });
  }

  protected getSpecificResolution(): string[] {
    return [
      'Check your internet connection',
      'Verify the API endpoint is accessible',
      'Try again with a different network',
      'Check if firewall/proxy is blocking the request',
    ];
  }
}

/**
 * Rate limiting errors (too many requests)
 */
export class RateLimitError extends PumpFunError {
  public readonly retryAfter?: number;

  constructor(options: {
    message?: string;
    retryAfter?: number;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      message: options.message ?? 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      isRetryable: true,
      details: {
        ...options.details,
        retryAfter: options.retryAfter,
      },
      originalError: options.originalError,
    });
    this.retryAfter = options.retryAfter;
  }

  protected getSpecificResolution(): string[] {
    const suggestions = [
      'Reduce the frequency of requests',
      'Implement exponential backoff retry logic',
      'Consider upgrading your API plan for higher limits',
    ];

    if (this.retryAfter) {
      suggestions.unshift(`Wait ${this.retryAfter} seconds before retrying`);
    }

    return suggestions;
  }
}

/**
 * Authentication errors (invalid credentials, expired tokens)
 */
export class AuthenticationError extends PumpFunError {
  constructor(options: {
    message?: string;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      message: options.message ?? 'Authentication failed. Invalid credentials or expired token.',
      code: 'AUTHENTICATION_FAILED',
      statusCode: 401,
      isRetryable: false,
      details: options.details,
      originalError: options.originalError,
    });
  }

  protected getSpecificResolution(): string[] {
    return [
      'Check your API credentials are correct',
      'Verify your authentication token has not expired',
      'Ensure you have the required permissions',
      'Contact support if credentials appear correct',
    ];
  }
}

/**
 * Authorization errors (insufficient permissions)
 */
export class AuthorizationError extends PumpFunError {
  constructor(options: {
    message?: string;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      message: options.message ?? 'Access denied. Insufficient permissions for this operation.',
      code: 'ACCESS_DENIED',
      statusCode: 403,
      isRetryable: false,
      details: options.details,
      originalError: options.originalError,
    });
  }

  protected getSpecificResolution(): string[] {
    return [
      'Check if your account has the required permissions',
      'Verify you are accessing the correct resources',
      'Contact administrator to grant necessary permissions',
    ];
  }
}

/**
 * Validation errors (invalid parameters, malformed requests)
 */
export class ValidationError extends PumpFunError {
  constructor(options: {
    message: string;
    field?: string;
    value?: unknown;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      message: options.message,
      code: 'VALIDATION_FAILED',
      statusCode: 400,
      isRetryable: false,
      details: {
        ...options.details,
        field: options.field,
        value: options.value,
      },
      originalError: options.originalError,
    });
  }

  protected getSpecificResolution(): string[] {
    const suggestions = [
      'Check the format and values of your parameters',
      'Verify required fields are provided',
      'Refer to API documentation for valid parameter ranges',
    ];

    if (this.details?.field) {
      suggestions.unshift(`Check the '${this.details.field}' parameter`);
    }

    return suggestions;
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends PumpFunError {
  constructor(options: {
    message?: string;
    resource?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      message: options.message ?? 'The requested resource was not found.',
      code: 'RESOURCE_NOT_FOUND',
      statusCode: 404,
      isRetryable: false,
      details: {
        ...options.details,
        resource: options.resource,
        resourceId: options.resourceId,
      },
      originalError: options.originalError,
    });
  }

  protected getSpecificResolution(): string[] {
    const suggestions = [
      'Verify the resource identifier is correct',
      'Check if the resource exists and is accessible',
      'Ensure you have permission to access this resource',
    ];

    if (this.details?.resource) {
      suggestions.unshift(`Check if the ${this.details.resource} exists`);
    }

    return suggestions;
  }
}

/**
 * Server errors (5xx responses, service unavailable)
 */
export class ServerError extends PumpFunError {
  constructor(options: {
    message?: string;
    statusCode?: number;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      message:
        options.message ??
        'Internal server error. The service encountered an unexpected condition.',
      code: 'SERVER_ERROR',
      statusCode: options.statusCode ?? 500,
      isRetryable: true,
      details: options.details,
      originalError: options.originalError,
    });
  }

  protected getSpecificResolution(): string[] {
    return [
      'The server encountered an error processing your request',
      'Try again after a few minutes',
      'Check service status page for ongoing issues',
      'Contact support if the problem persists',
    ];
  }
}

/**
 * Configuration errors (invalid client configuration)
 */
export class ConfigurationError extends PumpFunError {
  constructor(options: {
    message: string;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      message: options.message,
      code: 'CONFIGURATION_ERROR',
      statusCode: 0,
      isRetryable: false,
      details: options.details,
      originalError: options.originalError,
    });
  }

  protected getSpecificResolution(): string[] {
    return [
      'Check your client configuration settings',
      'Verify all required configuration values are provided',
      'Refer to documentation for proper configuration format',
    ];
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends NetworkError {
  constructor(options: {
    message?: string;
    timeout?: number;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      message:
        options.message ?? `Request timed out after ${options.timeout ?? 'default'} milliseconds`,
      code: 'REQUEST_TIMEOUT',
      statusCode: 408,
      details: {
        ...options.details,
        timeout: options.timeout,
      },
      originalError: options.originalError,
    });
  }

  protected override getSpecificResolution(): string[] {
    const suggestions = [
      'Increase the timeout configuration',
      'Check your network connection speed',
      'Try again with a smaller request',
      'Check if the server is experiencing high load',
    ];

    if (this.details?.timeout) {
      suggestions.unshift(`Consider increasing timeout beyond ${this.details.timeout}ms`);
    }

    return suggestions;
  }
}

/**
 * Error factory for creating appropriate error instances from HTTP responses
 */
export class ErrorFactory {
  /**
   * Create appropriate error instance from HTTP response and error data
   */
  static createFromResponse(
    statusCode: number,
    data: Record<string, unknown> | undefined,
    originalError?: unknown
  ): PumpFunError {
    const message = (data?.message as string) || this.getDefaultMessage(statusCode);
    const code = (data?.code as string) || this.getDefaultCode(statusCode);

    switch (statusCode) {
      case 400:
        return new ValidationError({
          message,
          details: data,
          originalError,
        });

      case 401:
        return new AuthenticationError({
          message,
          details: data,
          originalError,
        });

      case 403:
        return new AuthorizationError({
          message,
          details: data,
          originalError,
        });

      case 404:
        return new NotFoundError({
          message,
          details: data,
          originalError,
        });

      case 408:
        return new TimeoutError({
          message,
          details: data,
          originalError,
        });

      case 429:
        return new RateLimitError({
          message,
          retryAfter: typeof data?.retryAfter === 'number' ? data.retryAfter : undefined,
          details: data,
          originalError,
        });

      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError({
          message,
          statusCode,
          details: data,
          originalError,
        });

      default:
        return new NetworkError({
          message,
          code,
          statusCode,
          details: data,
          originalError,
        });
    }
  }

  /**
   * Create error from network-related issues
   */
  static createFromNetworkError(error: { code?: string; message?: string }): NetworkError {
    const code = error.code ?? 'NETWORK_ERROR';
    const message = error.message ?? 'Network error occurred';

    // Handle specific network error codes
    switch (code) {
      case 'ECONNREFUSED':
        return new NetworkError({
          message: 'Connection refused. The server is not accepting connections.',
          code: 'CONNECTION_REFUSED',
          originalError: error,
        });

      case 'ENOTFOUND':
        return new NetworkError({
          message: 'DNS lookup failed. Could not resolve the hostname.',
          code: 'DNS_RESOLUTION_FAILED',
          originalError: error,
        });

      case 'ETIMEDOUT':
        return new TimeoutError({
          message: 'Connection timeout. The server did not respond in time.',
          originalError: error,
        });

      case 'ECONNRESET':
        return new NetworkError({
          message: 'Connection was reset by the server.',
          code: 'CONNECTION_RESET',
          originalError: error,
        });

      default:
        return new NetworkError({
          message,
          code,
          originalError: error,
        });
    }
  }

  /**
   * Create configuration error
   */
  static createConfigurationError(
    message: string,
    details?: Record<string, unknown>
  ): ConfigurationError {
    return new ConfigurationError({
      message,
      details,
    });
  }

  private static getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Bad request. Invalid parameters or request format.';
      case 401:
        return 'Authentication required. Please provide valid credentials.';
      case 403:
        return 'Access denied. You do not have permission to access this resource.';
      case 404:
        return 'Resource not found. The requested resource does not exist.';
      case 408:
        return 'Request timeout. The server took too long to respond.';
      case 429:
        return 'Rate limit exceeded. Too many requests were made.';
      case 500:
        return 'Internal server error. An unexpected error occurred.';
      case 502:
        return 'Bad gateway. The server received an invalid response.';
      case 503:
        return 'Service unavailable. The server is temporarily unavailable.';
      case 504:
        return 'Gateway timeout. The server took too long to respond.';
      default:
        return `HTTP error ${statusCode}. An error occurred while processing the request.`;
    }
  }

  private static getDefaultCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 408:
        return 'TIMEOUT';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return `HTTP_${statusCode}`;
    }
  }
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Check if an error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof PumpFunError) {
      return error.canRetry();
    }
    return false;
  }

  /**
   * Get retry delay for an error
   */
  static getRetryDelay(error: unknown): number {
    if (error instanceof PumpFunError) {
      return error.getRetryDelay();
    }
    return 0;
  }

  /**
   * Get resolution suggestions for an error
   */
  static getResolution(error: unknown): string[] {
    if (error instanceof PumpFunError) {
      return error.getResolution();
    }
    return ['An unknown error occurred. Please try again or contact support.'];
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: unknown): string {
    if (error instanceof PumpFunError) {
      return `${error.name} (${error.code}): ${error.message}`;
    }
    const err = error as Error;
    return err?.message || err?.toString() || 'Unknown error';
  }

  /**
   * Convert error to safe JSON (removing circular references)
   */
  static toJSON(error: unknown): Record<string, unknown> {
    if (error instanceof PumpFunError) {
      return error.toJSON();
    }

    const err = error as Error;
    return {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    };
  }
}

// Re-export commonly used error types for convenience
export { PumpFunError as BaseError };

/**
 * LiveKit integration errors
 */
export class LiveKitError extends PumpFunError {
  constructor(options: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
    originalError?: unknown;
  }) {
    super({
      ...options,
      statusCode: 0, // Custom errors don't have HTTP status codes
      isRetryable: false, // LiveKit integration errors are typically not retryable
    });
  }

  protected getSpecificResolution(): string[] {
    return [
      'Install livekit-client as a peer dependency: npm install livekit-client',
      'Check if you are in a browser environment with WebRTC support',
      'Verify that the stream is currently live and accessible',
      'Check your network connection and firewall settings',
      'Refer to LiveKit documentation: https://docs.livekit.io',
    ];
  }
}

// Legacy export for backward compatibility
export class PumpFunAPIError extends PumpFunError {
  // No additional constructor needed - inherits from PumpFunError

  protected override getSpecificResolution(): string[] {
    return [
      'Check the error code and message for more details',
      'Refer to the API documentation',
      'Contact support if the issue persists',
    ];
  }
}
