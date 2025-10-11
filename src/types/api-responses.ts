/**
 * PumpFun API Common Response Wrapper Interfaces
 *
 * Complete TypeScript interface definitions for standardized API response formats,
 * error handling, pagination, and response wrappers used across all endpoints.
 *
 * Created: 2025-10-11
 * Purpose: T025 - Create common response wrapper interfaces
 */

/**
 * Base API Response Interface
 * Standard response format for all API endpoints
 */
export interface APIResponse<T = any> {
  /** Success status of the request */
  success: boolean;

  /** Response data payload */
  data?: T;

  /** Error information (if request failed) */
  error?: APIError;

  /** Response timestamp (ISO 8601) */
  timestamp: string;

  /** Unique request identifier */
  requestId?: string;

  /** Response processing time in milliseconds */
  processingTime?: number;

  /** API version */
  apiVersion?: string;

  /** Additional response metadata */
  metadata?: ResponseMetadata;
}

/**
 * Array Response Interface
 * Response format for endpoints returning arrays with pagination
 */
export interface ArrayResponse<T> extends APIResponse<T[]> {
  /** Pagination information */
  pagination: Pagination;

  /** Total count of items (may be different from array length due to pagination) */
  totalCount?: number;

  /** Filtering information */
  filters?: FilterInfo;

  /** Sorting information */
  sorting?: SortingInfo;
}

/**
 * Error Response Interface
 * Standardized error response format
 */
export interface ErrorResponse extends APIResponse<never> {
  success: false;

  /** Error details */
  error: APIError;

  /** Request that caused the error */
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };

  /** Server information */
  server?: {
    nodeId?: string;
    version?: string;
    uptime?: number;
  };
}

/**
 * API Error Interface
 * Detailed error information
 */
export interface APIError {
  /** Machine-readable error code */
  code: string;

  /** Human-readable error message */
  message: string;

  /** HTTP status code */
  statusCode: number;

  /** Error type category */
  type: ErrorType;

  /** Error severity level */
  severity: ErrorSeverity;

  /** Detailed error information */
  details?: ErrorDetails;

  /** Suggestions for resolution */
  suggestions?: string[];

  /** Retry information */
  retry?: RetryInfo;

  /** Support information */
  support?: SupportInfo;

  /** Error timestamp */
  timestamp: string;

  /** Unique error identifier */
  errorId?: string;

  /** Stack trace (for internal errors) */
  stackTrace?: string;

  /** Whether error is retryable */
  isRetryable: boolean;
}

/**
 * Error Type Enumeration
 */
export type ErrorType =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'PARSE_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'MAINTENANCE_MODE'
  | 'DEPRECATED_ENDPOINT'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR';

/**
 * Error Severity Enumeration
 */
export type ErrorSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

/**
 * Error Details Interface
 * Additional context for specific error types
 */
export interface ErrorDetails {
  /** Field that caused the error */
  field?: string;

  /** Invalid value */
  value?: any;

  /** Validation constraint that was violated */
  constraint?: string;

  /** Expected value or format */
  expected?: any;

  /** Additional properties */
  [key: string]: any;
}

/**
 * Retry Information Interface
 */
export interface RetryInfo {
  /** Whether the request can be retried */
  canRetry: boolean;

  /** Suggested retry delay in seconds */
  retryAfter?: number;

  /** Maximum number of retry attempts */
  maxRetries?: number;

  /** Exponential backoff configuration */
  backoff?: {
    baseDelay: number;
    maxDelay: number;
    multiplier: number;
  };

  /** Retry strategy */
  strategy?: 'linear' | 'exponential' | 'fixed';
}

/**
 * Support Information Interface
 */
export interface SupportInfo {
  /** Support contact email */
  email?: string;

  /** Support documentation URL */
  documentation?: string;

  /** Support FAQ URL */
  faq?: string;

  /** Status page URL */
  statusPage?: string;

  /** Support chat URL */
  chat?: string;

  /** Additional support information */
  [key: string]: string | undefined;
}

/**
 * Pagination Interface
 * Standard pagination information
 */
export interface Pagination {
  /** Current page number (1-based) */
  page?: number;

  /** Number of items per page */
  limit: number;

  /** Number of items skipped */
  offset: number;

  /** Total number of items available */
  total: number;

  /** Whether more items are available */
  hasMore: boolean;

  /** Number of pages */
  totalPages?: number;

  /** URL for next page */
  nextPageUrl?: string;

  /** URL for previous page */
  prevPageUrl?: string;

  /** URL for first page */
  firstPageUrl?: string;

  /** URL for last page */
  lastPageUrl?: string;
}

/**
 * Filter Information Interface
 */
export interface FilterInfo {
  /** Applied filters */
  applied: Record<string, any>;

  /** Available filters */
  available: FilterOption[];

  /** Total number of items before filtering */
  totalBeforeFilter?: number;

  /** Total number of items after filtering */
  totalAfterFilter?: number;
}

/**
 * Filter Option Interface
 */
export interface FilterOption {
  /** Filter name */
  name: string;

  /** Filter type */
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array';

  /** Current value */
  value?: any;

  /** Available options for enum filters */
  options?: Array<{
    value: any;
    label: string;
    description?: string;
  }>;

  /** Filter description */
  description?: string;

  /** Whether filter is active */
  active?: boolean;
}

/**
 * Sorting Information Interface
 */
export interface SortingInfo {
  /** Field being sorted */
  field: string;

  /** Sort direction */
  direction: 'asc' | 'desc';

  /** Available sort options */
  available: SortOption[];

  /** Current sort priority (for multi-column sorting) */
  priority?: number;
}

/**
 * Sort Option Interface
 */
export interface SortOption {
  /** Field name */
  field: string;

  /** Field label */
  label: string;

  /** Whether field is sortable */
  sortable: boolean;

  /** Default sort direction */
  defaultDirection?: 'asc' | 'desc';

  /** Field type */
  type: 'string' | 'number' | 'date' | 'boolean';
}

/**
 * Response Metadata Interface
 */
export interface ResponseMetadata {
  /** API version used */
  version?: string;

  /** Server information */
  server?: {
    nodeId?: string;
    region?: string;
    version?: string;
  };

  /** Request processing metrics */
  metrics?: {
    processingTime: number;
    databaseTime?: number;
    cacheHit?: boolean;
    memoryUsage?: number;
  };

  /** Rate limit information */
  rateLimit?: RateLimitInfo;

  /** Cache information */
  cache?: CacheInfo;

  /** Debug information (only in development) */
  debug?: {
    query?: string;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    trace?: string;
  };
}

/**
 * Rate Limit Information Interface
 */
export interface RateLimitInfo {
  /** Maximum requests per window */
  limit?: number;

  /** Remaining requests in current window */
  remaining?: number;

  /** Time when window resets (Unix timestamp) */
  resetTime?: number;

  /** Time until reset (seconds) */
  retryAfter?: number;

  /** Current window size */
  windowSize?: number;

  /** Requests made in current window */
  current?: number;
}

/**
 * Cache Information Interface
 */
export interface CacheInfo {
  /** Whether response was cached */
  cached: boolean;

  /** Cache key */
  key?: string;

  /** Cache TTL (seconds) */
  ttl?: number;

  /** Cache age (seconds) */
  age?: number;

  /** Cache hit status */
  hit?: boolean;

  /** Cache storage location */
  storage?: 'memory' | 'redis' | 'database';
}

/**
 * Success Response Interface
 * Convenience interface for successful responses
 */
export interface SuccessResponse<T> extends APIResponse<T> {
  success: true;

  data: T;

  error?: never;
}

/**
 * Created Response Interface
 * Response for resource creation (HTTP 201)
 */
export interface CreatedResponse<T> extends SuccessResponse<T> {
  /** Location of created resource */
  location?: string;

  /** Resource ID */
  id?: string;
}

/**
 * No Content Response Interface
 * Response for successful operations with no content (HTTP 204)
 */
export interface NoContentResponse extends APIResponse<never> {
  success: true;

  data?: never;
}

/**
 * Batch Response Interface
 * Response for batch operations
 */
export interface BatchResponse<T> extends APIResponse<{
  /** Successful items */
  successful: Array<{
    id: string;
    data: T;
    index: number;
  }>;

  /** Failed items */
  failed: Array<{
    id: string;
    error: APIError;
    index: number;
  }>;

  /** Total counts */
  totals: {
    requested: number;
    successful: number;
    failed: number;
  };
}> {
  /** Batch operation identifier */
  batchId?: string;

  /** Batch processing status */
  batchStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
}

/**
 * Stream Response Interface
 * Response for streaming endpoints
 */
export interface StreamResponse<T> extends APIResponse<T> {
  /** Stream identifier */
  streamId?: string;

  /** Stream type */
  streamType?: 'sse' | 'websocket' | 'chunked';

  /** Stream endpoint URL */
  streamUrl?: string;

  /** Connection status */
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
}

/**
 * File Response Interface
 * Response for file download/upload operations
 */
export interface FileResponse extends APIResponse<{
  /** File name */
  filename: string;

  /** File size in bytes */
  size: number;

  /** MIME type */
  mimeType: string;

  /** File URL (for downloads) */
  url?: string;

  /** Upload progress */
  uploadProgress?: {
    bytesUploaded: number;
    totalBytes: number;
    percentage: number;
  };
}> {
  /** File operation type */
  operation: 'upload' | 'download';

  /** File storage location */
  storage?: 'local' | 's3' | 'gcs' | 'azure';

  /** File checksum */
  checksum?: string;

  /** Expiration time (for temporary URLs) */
  expiresAt?: string;
}

/**
 * Health Check Response Interface
 * Response for health check endpoints
 */
export interface HealthCheckResponse extends APIResponse<{
  /** Service status */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** Service uptime */
  uptime: number;

  /** Service version */
  version: string;

  /** Dependencies status */
  dependencies: Array<{
    name: string;
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    lastCheck: string;
    error?: string;
  }>;

  /** System metrics */
  metrics?: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}> {
  /** Health check timestamp */
  timestamp: string;

  /** Request ID */
  requestId: string;
}

/**
 * Type guards for runtime validation
 */
export const isAPIResponse = <T>(obj: any): obj is APIResponse<T> => {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean' &&
    typeof obj.timestamp === 'string';
};

export const isSuccessResponse = <T>(obj: any): obj is SuccessResponse<T> => {
  return isAPIResponse<T>(obj) &&
    obj.success === true &&
    obj.data !== undefined;
};

export const isErrorResponse = (obj: any): obj is ErrorResponse => {
  return isAPIResponse(obj) &&
    obj.success === false &&
    obj.error !== undefined;
};

export const isArrayResponse = <T>(obj: any): obj is ArrayResponse<T> => {
  return obj &&
    typeof obj === 'object' &&
    obj.success === true &&
    Array.isArray(obj.data) &&
    typeof obj.pagination === 'object';
};

export const isAPIError = (obj: any): obj is APIError => {
  return obj &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.statusCode === 'number' &&
    typeof obj.timestamp === 'string';
};

export const isPagination = (obj: any): obj is Pagination => {
  return obj &&
    typeof obj.limit === 'number' &&
    typeof obj.offset === 'number' &&
    typeof obj.total === 'number' &&
    typeof obj.hasMore === 'boolean';
};

/**
 * Response utility functions
 */
export const createSuccessResponse = <T>(
  data: T,
  metadata?: ResponseMetadata
): SuccessResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
  metadata
});

export const createErrorResponse = (
  error: APIError,
  metadata?: ResponseMetadata
): ErrorResponse => ({
  success: false,
  error,
  timestamp: new Date().toISOString(),
  metadata
});

export const createAPIError = (
  code: string,
  message: string,
  statusCode: number,
  type: ErrorType,
  options?: {
    severity?: ErrorSeverity;
    details?: ErrorDetails;
    suggestions?: string[];
    retry?: RetryInfo;
    isRetryable?: boolean;
  }
): APIError => ({
  code,
  message,
  statusCode,
  type,
  severity: options?.severity || 'ERROR',
  details: options?.details,
  suggestions: options?.suggestions,
  retry: options?.retry,
  timestamp: new Date().toISOString(),
  isRetryable: options?.isRetryable || false
});

export const createPagination = (
  limit: number,
  offset: number,
  total: number,
  options?: {
    page?: number;
    hasMore?: boolean;
    totalPages?: number;
  }
): Pagination => ({
  limit,
  offset,
  total,
  hasMore: options?.hasMore ?? (offset + limit < total),
  ...(options?.page && { page: options.page }),
  ...(options?.totalPages && { totalPages: options.totalPages })
});

export const createArrayResponse = <T>(
  data: T[],
  pagination: Pagination,
  metadata?: ResponseMetadata
): ArrayResponse<T> => ({
  success: true,
  data,
  pagination,
  timestamp: new Date().toISOString(),
  metadata
});

/**
 * Common error creators
 */
export const createValidationError = (
  message: string,
  field?: string,
  value?: any
): APIError => createAPIError(
  'VALIDATION_ERROR',
  message,
  400,
  'VALIDATION_ERROR',
  {
    severity: 'ERROR',
    details: field ? { field, value } : undefined,
    suggestions: ['Check the request parameters and try again'],
    isRetryable: false
  }
);

export const createAuthenticationError = (
  message: string = 'Authentication failed'
): APIError => createAPIError(
  'AUTHENTICATION_ERROR',
  message,
  401,
  'AUTHENTICATION_ERROR',
  {
    severity: 'ERROR',
    suggestions: ['Check your API token and try again'],
    isRetryable: false
  }
);

export const createRateLimitError = (
  retryAfter: number,
  limit?: number
): APIError => createAPIError(
  'RATE_LIMIT_EXCEEDED',
  'Rate limit exceeded',
  429,
  'RATE_LIMIT_EXCEEDED',
  {
    severity: 'WARNING',
    retry: {
      canRetry: true,
      retryAfter,
      maxRetries: 3,
      strategy: 'exponential'
    },
    details: limit ? { limit } : undefined,
    suggestions: [`Wait ${retryAfter} seconds before trying again`],
    isRetryable: true
  }
);

export const createNotFoundError = (
  resource: string = 'Resource'
): APIError => createAPIError(
  'NOT_FOUND',
  `${resource} not found`,
  404,
  'NOT_FOUND',
  {
    severity: 'ERROR',
    suggestions: ['Check the resource ID and try again'],
    isRetryable: false
  }
);

export const createInternalServerError = (
  message: string = 'Internal server error'
): APIError => createAPIError(
  'INTERNAL_ERROR',
  message,
  500,
  'INTERNAL_ERROR',
  {
    severity: 'CRITICAL',
    suggestions: ['Try again later or contact support'],
    isRetryable: true
  }
);