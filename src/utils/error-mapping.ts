/**
 * Error mapping and conversion utilities
 */

import { ValidationError } from './validation';

/**
 * Maps various error types to simplified error hierarchy
 */
export function mapToStreamError(error: any, _context?: string): StreamError {
  if (error instanceof ValidationError) {
    // Convert ValidationError to StreamError
    return new StreamError(error.message, 'VALIDATION_ERROR', { originalError: error });
  }

  if (error instanceof StreamError) {
    return error;
  }

  // Handle HTTP errors
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;

    switch (status) {
      case 400:
        return new StreamError(message || 'Bad request', 'VALIDATION_ERROR');
      case 401:
        return new StreamError(
          'Authentication required',
          'AUTH_ERROR',
          { status, originalError: error },
          ['Check your API credentials', 'Verify your authentication token']
        );
      case 403:
        return new StreamError(
          'Access forbidden',
          'FORBIDDEN',
          { status, originalError: error },
          ['Check your permissions', 'Verify you have access to this resource']
        );
      case 404:
        return new StreamError(
          'Resource not found',
          'NOT_FOUND',
          { status, originalError: error },
          ['Verify the mint ID is correct', 'Check if the stream still exists']
        );
      case 429:
        return new StreamError(
          'Rate limit exceeded',
          'RATE_LIMIT',
          { status, originalError: error },
          ['Wait before making more requests', 'Consider reducing request frequency']
        );
      case 500:
      case 502:
      case 503:
        return new StreamError(
          'Server error',
          'SERVER_ERROR',
          { status, originalError: error },
          ['Try again later', 'Contact support if the issue persists']
        );
      default:
        return new StreamError(
          message || `HTTP ${status} error`,
          'HTTP_ERROR',
          { status, originalError: error }
        );
    }
  }

  // Handle network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
    return new ConnectionError(
      'Network connection failed',
      { code: error.code, originalError: error }
    );
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return new StreamError(
      'Request timeout',
      'TIMEOUT',
      { code: error.code, originalError: error },
      ['Try again with a longer timeout', 'Check your network connection']
    );
  }

  // Handle LiveKit specific errors
  if (error.name?.includes('LiveKit') || error.message?.includes('LiveKit')) {
    return new ConnectionError(
      `LiveKit connection error: ${error.message}`,
      { liveKitError: error }
    );
  }

  // Handle validation errors from Joi/yup/etc
  if (error.name === 'ValidationError' || error.name === 'SchemaError') {
    return new StreamError(
      error.details?.map((d: any) => d.message).join(', ') || error.message,
      'VALIDATION_ERROR'
    );
  }

  // Default error handling
  return new StreamError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR',
    { originalError: error },
    ['Try again', 'Contact support if the issue persists']
  );
}

/**
 * Creates a context-aware error with suggestions
 */
export function createContextualError(
  message: string,
  code: string,
  context: string,
  suggestions: string[] = []
): StreamError {
  const contextualSuggestions = {
    filterStreams: [
      'Check if the filter criteria are valid',
      'Verify the API server is accessible',
      'Consider reducing the complexity of filter criteria',
      'Try using basic filtering options first',
    ],
    getStreamContent: [
      'Check if the mintId is valid',
      'Verify the API server is accessible',
      'Consider checking if the mint has any available content',
      'Try with fewer filter restrictions',
    ],
    connectToStream: [
      'Check if the stream is currently live',
      'Verify your network connection',
      'Check if the creator is approved for streaming',
      'Try refreshing the stream information',
    ],
    toggleAudio: [
      'Check if the connection is still active',
      'Verify the audio track exists',
      'Try reconnecting to the stream',
    ],
    toggleVideo: [
      'Check if the connection is still active',
      'Verify the video track exists',
      'Try reconnecting to the stream',
    ],
  };

  const defaultSuggestions = [
    'Try again',
    'Check the documentation',
    'Contact support if the issue persists',
  ];

  const allSuggestions = [
    ...contextualSuggestions[context as keyof typeof contextualSuggestions] || [],
    ...suggestions,
    ...defaultSuggestions,
  ];

  return new StreamError(message, code, { context }, allSuggestions);
}

/**
 * Enhanced error class for streaming operations
 */
export class StreamError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'StreamError';
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      suggestions: this.suggestions,
      stack: this.stack,
    };
  }
}

/**
 * Connection-specific error
 */
export class ConnectionError extends StreamError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', details, [
      'Check your network connection',
      'Verify the stream is still active',
      'Try reconnecting',
    ]);
  }
}