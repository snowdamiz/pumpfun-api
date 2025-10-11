/**
 * HTTP Client Infrastructure for PumpFun API Discovery
 *
 * Provides a robust HTTP client with retry logic, timeout handling,
 * and rate limiting for API discovery operations.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { APIError, RetryConfig } from '../types/common';

/**
 * Default configuration for HTTP requests
 */
const DEFAULT_CONFIG: Partial<AxiosRequestConfig> = {
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'pumpfun-api-discovery/1.0.0',
  },
};

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EHOSTUNREACH'],
};

/**
 * HTTP Client class with retry logic and error handling
 */
export class HTTPClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(
    baseURL?: string,
    config: Partial<AxiosRequestConfig> = {},
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    this.client = axios.create({
      baseURL: baseURL || process.env.PUMPFUN_API_BASE_URL,
      ...DEFAULT_CONFIG,
      ...config,
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.debug(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          params: config.params,
        });
        return config;
      },
      (error) => {
        console.error('[HTTP] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        console.debug(`[HTTP] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`, {
          status: response.status,
          headers: response.headers,
          dataSize: JSON.stringify(response.data).length,
        });
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retryCount?: number };

        console.error(`[HTTP] Response error: ${error.message}`, {
          status: error.response?.status,
          url: originalRequest?.url,
          method: originalRequest?.method,
        });

        // Check if we should retry
        if (this.shouldRetry(error, originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        // Convert to APIError and reject
        return Promise.reject(this.createAPIError(error));
      }
    );
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: AxiosError, originalRequest: AxiosRequestConfig & { _retryCount?: number }): boolean {
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Check retry count
    if (originalRequest._retryCount >= this.retryConfig.maxRetries) {
      return false;
    }

    // Check status code
    if (error.response?.status && this.retryConfig.retryableStatusCodes.includes(error.response.status)) {
      return true;
    }

    // Check error type
    if (error.code && this.retryConfig.retryableErrors.includes(error.code)) {
      return true;
    }

    return false;
  }

  /**
   * Retry a request with exponential backoff
   */
  private async retryRequest(originalRequest: AxiosRequestConfig & { _retryCount?: number }): Promise<AxiosResponse> {
    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, originalRequest._retryCount - 1),
      this.retryConfig.maxDelay
    );

    console.warn(`[HTTP] Retrying request (${originalRequest._retryCount}/${this.retryConfig.maxRetries}) after ${delay}ms`);

    await this.sleep(delay);

    return this.client(originalRequest);
  }

  /**
   * Create a standardized API error from Axios error
   */
  private createAPIError(error: AxiosError): APIError {
    const statusCode = error.response?.status || 0;
    const errorCode = error.code || 'UNKNOWN_ERROR';
    const message = error.response?.data?.message || error.message || 'Unknown error occurred';
    const details = error.response?.data || { originalError: error.message };

    return {
      code: errorCode,
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
      isRetryable: this.isRetryableError(error),
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    return !!(
      (error.response?.status && this.retryConfig.retryableStatusCodes.includes(error.response.status)) ||
      (error.code && this.retryConfig.retryableErrors.includes(error.code))
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * HTTP GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * HTTP POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * HTTP PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * HTTP DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * HTTP PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Custom request method for more flexibility
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  /**
   * Set default headers for all requests
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.client.defaults.headers, headers);
  }

  /**
   * Set authorization header
   */
  setAuthorization(token: string, type: 'Bearer' | 'ApiKey' = 'Bearer'): void {
    this.client.defaults.headers.Authorization = `${type} ${token}`;
  }

  /**
   * Clear authorization header
   */
  clearAuthorization(): void {
    delete this.client.defaults.headers.Authorization;
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }
}

/**
 * Default HTTP client instance
 */
export const httpClient = new HTTPClient();

/**
 * Convenience function to create a new HTTP client
 */
export function createHTTPClient(
  baseURL?: string,
  config?: Partial<AxiosRequestConfig>,
  retryConfig?: Partial<RetryConfig>
): HTTPClient {
  return new HTTPClient(baseURL, config, retryConfig);
}