/**
 * Error Handling Framework for PumpFun API Discovery
 *
 * Provides comprehensive error handling for API discovery failures,
 * including network errors, authentication errors, rate limiting,
 * and validation errors.
 */

import { APIError, ErrorSeverity, ErrorCategory } from '../types/common';

/**
 * Base PumpFun API Error class
 */
export abstract class PumpFunError extends Error {
  public readonly timestamp: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    severity: ErrorSeverity = 'ERROR',
    category: ErrorCategory = 'UNKNOWN',
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.severity = severity;
    this.category = category;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to APIError format
   */
  toAPIError(): APIError {
    return {
      code: this.getErrorCode(),
      message: this.message,
      statusCode: this.getStatusCode(),
      details: this.details,
      timestamp: this.timestamp,
      isRetryable: this.isRetryable(),
    };
  }

  /**
   * Get error code
   */
  abstract getErrorCode(): string;

  /**
   * Get HTTP status code
   */
  abstract getStatusCode(): number;

  /**
   * Check if error is retryable
   */
  abstract isRetryable(): boolean;

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends PumpFunError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ERROR', 'NETWORK', details);
  }

  override getErrorCode(): string {
    return 'NETWORK_ERROR';
  }

  override getStatusCode(): number {
    return 0; // Network errors don't have HTTP status codes
  }

  override isRetryable(): boolean {
    return true;
  }

  override getUserMessage(): string {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends NetworkError {
  constructor(timeout: number, url?: string) {
    super(`Request timed out after ${timeout}ms`, { timeout, url });
  }

  override getErrorCode(): string {
    return 'TIMEOUT_ERROR';
  }

  override getUserMessage(): string {
    return 'The request took too long to complete. Please try again.';
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends PumpFunError {
  constructor(message: string = 'Authentication failed', details?: Record<string, any>) {
    super(message, 'ERROR', 'AUTHENTICATION', details);
  }

  override getErrorCode(): string {
    return 'AUTHENTICATION_ERROR';
  }

  override getStatusCode(): number {
    return 401;
  }

  override isRetryable(): boolean {
    return false; // Auth errors usually require fixing credentials
  }

  override getUserMessage(): string {
    return 'Authentication failed. Please check your API credentials and try again.';
  }
}

/**
 * Authorization errors (insufficient permissions)
 */
export class AuthorizationError extends PumpFunError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, any>) {
    super(message, 'ERROR', 'AUTHENTICATION', details);
  }

  override getErrorCode(): string {
    return 'AUTHORIZATION_ERROR';
  }

  override getStatusCode(): number {
    return 403;
  }

  override isRetryable(): boolean {
    return false;
  }

  override getUserMessage(): string {
    return 'You do not have permission to access this resource.';
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends PumpFunError {
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;
  public readonly resetTime?: string;

  constructor(
    message: string = 'Rate limit exceeded',
    details?: Record<string, any>
  ) {
    super(message, 'WARNING', 'RATE_LIMIT', details);
    this.retryAfter = details?.retryAfter;
    this.limit = details?.limit;
    this.remaining = details?.remaining;
    this.resetTime = details?.resetTime;
  }

  override getErrorCode(): string {
    return 'RATE_LIMIT_ERROR';
  }

  override getStatusCode(): number {
    return 429;
  }

  override isRetryable(): boolean {
    return true;
  }

  override getUserMessage(): string {
    const retryMsg = this.retryAfter
      ? ` Please wait ${this.retryAfter} seconds before trying again.`
      : ' Please wait before trying again.';
    return `Rate limit exceeded.${retryMsg}`;
  }

  /**
   * Get recommended delay before retrying
   */
  getRetryDelay(): number {
    if (this.retryAfter) {
      return this.retryAfter * 1000;
    }
    return 60000; // Default to 1 minute
  }
}

/**
 * Validation errors
 */
export class ValidationError extends PumpFunError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any, details?: Record<string, any>) {
    super(message, 'ERROR', 'VALIDATION', { field, value, ...details });
    this.field = field;
    this.value = value;
  }

  override getErrorCode(): string {
    return 'VALIDATION_ERROR';
  }

  override getStatusCode(): number {
    return 400;
  }

  override isRetryable(): boolean {
    return false; // Validation errors require fixing the input
  }

  override getUserMessage(): string {
    const fieldMsg = this.field ? ` in field '${this.field}'` : '';
    return `Invalid input${fieldMsg}: ${this.message}`;
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends PumpFunError {
  constructor(resource: string, identifier?: string) {
    super(
      `${resource}${identifier ? ` with identifier '${identifier}'` : ''} not found`,
      'ERROR',
      'NOT_FOUND',
      { resource, identifier }
    );
  }

  override getErrorCode(): string {
    return 'NOT_FOUND_ERROR';
  }

  override getStatusCode(): number {
    return 404;
  }

  override isRetryable(): boolean {
    return false;
  }

  override getUserMessage(): string {
    return 'The requested resource was not found.';
  }
}

/**
 * Server errors
 */
export class ServerError extends PumpFunError {
  constructor(message: string = 'Internal server error', details?: Record<string, any>) {
    super(message, 'ERROR', 'SERVER', details);
  }

  override getErrorCode(): string {
    return 'SERVER_ERROR';
  }

  override getStatusCode(): number {
    return 500;
  }

  override isRetryable(): boolean {
    return true;
  }

  override getUserMessage(): string {
    return 'The server encountered an error. Please try again later.';
  }
}

/**
 * API configuration errors
 */
export class ConfigurationError extends PumpFunError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ERROR', 'CONFIGURATION', details);
  }

  override getErrorCode(): string {
    return 'CONFIGURATION_ERROR';
  }

  override getStatusCode(): number {
    return 500;
  }

  override isRetryable(): boolean {
    return false;
  }

  override getUserMessage(): string {
    return 'Configuration error. Please check your settings.';
  }
}

/**
 * API discovery specific errors
 */
export class DiscoveryError extends PumpFunError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ERROR', 'DISCOVERY', details);
  }

  override getErrorCode(): string {
    return 'DISCOVERY_ERROR';
  }

  override getStatusCode(): number {
    return 500;
  }

  override isRetryable(): boolean {
    return true;
  }

  override getUserMessage(): string {
    return 'Failed to discover API endpoint. Please try again.';
  }
}

/**
 * Error factory to create appropriate error instances
 */
export class ErrorFactory {
  /**
   * Create an error from API response
   */
  static fromAPIResponse(statusCode: number, data: any): PumpFunError {
    const message = data?.message || 'Unknown error';
    const details = data?.details || {};

    switch (statusCode) {
      case 400:
        return new ValidationError(message, details.field, details.value, details);
      case 401:
        return new AuthenticationError(message, details);
      case 403:
        return new AuthorizationError(message, details);
      case 404:
        return new NotFoundError(details.resource, details.identifier);
      case 429:
        return new RateLimitError(message, details);
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(message, details);
      default:
        return new DiscoveryError(message, details);
    }
  }

  /**
   * Create an error from network error
   */
  static fromNetworkError(error: any): PumpFunError {
    if (error.code === 'ETIMEDOUT') {
      return new TimeoutError(error.timeout || 10000, error.url);
    }

    return new NetworkError(error.message || 'Network error', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
    });
  }

  /**
   * Create an error from generic error
   */
  static fromError(error: Error): PumpFunError {
    if (error instanceof PumpFunError) {
      return error;
    }

    // Try to identify error type from message
    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('timed out')) {
      return new TimeoutError(10000);
    }

    if (message.includes('network') || message.includes('connection')) {
      return new NetworkError(error.message);
    }

    if (message.includes('auth') || message.includes('unauthorized')) {
      return new AuthenticationError(error.message);
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return new RateLimitError(error.message);
    }

    // Default to discovery error for API discovery context
    return new DiscoveryError(error.message, { originalError: error.name });
  }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  /**
   * Handle and log errors appropriately
   */
  static handle(error: Error, context?: string): APIError {
    const pumpFunError = error instanceof PumpFunError
      ? error
      : ErrorFactory.fromError(error);

    // Log the error
    this.logError(pumpFunError, context);

    return pumpFunError.toAPIError();
  }

  /**
   * Log error with appropriate level
   */
  private static logError(error: PumpFunError, context?: string): void {
    const logData = {
      error: error.name,
      message: error.message,
      code: error.getErrorCode(),
      statusCode: error.getStatusCode(),
      severity: error.severity,
      category: error.category,
      context,
      details: error.details,
      timestamp: error.timestamp,
    };

    switch (error.severity) {
      case 'CRITICAL':
        console.error('[CRITICAL]', logData);
        break;
      case 'ERROR':
        console.error('[ERROR]', logData);
        break;
      case 'WARNING':
        console.warn('[WARNING]', logData);
        break;
      case 'INFO':
        console.info('[INFO]', logData);
        break;
      default:
        console.log('[LOG]', logData);
    }
  }

  /**
   * Check if error should be retried
   */
  static isRetryable(error: Error): boolean {
    const pumpFunError = error instanceof PumpFunError
      ? error
      : ErrorFactory.fromError(error);

    return pumpFunError.isRetryable();
  }

  /**
   * Get retry delay for error
   */
  static getRetryDelay(error: Error): number {
    const pumpFunError = error instanceof PumpFunError
      ? error
      : ErrorFactory.fromError(error);

    if (pumpFunError instanceof RateLimitError) {
      return pumpFunError.getRetryDelay();
    }

    // Default retry delays for different error types
    switch (pumpFunError.category) {
      case 'NETWORK':
        return 2000; // 2 seconds
      case 'RATE_LIMIT':
        return 60000; // 1 minute
      case 'SERVER':
        return 5000; // 5 seconds
      default:
        return 1000; // 1 second
    }
  }
}