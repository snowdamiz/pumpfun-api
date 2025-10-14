/**
 * Enhanced Logging Infrastructure for PumpFun API Client
 *
 * Provides comprehensive logging functionality for tracking API requests,
 * debugging issues, monitoring performance, and error tracking.
 * Optimized for npm package usage with minimal dependencies.
 */

import { LogLevel, LogContext, LogEntry, LoggerConfig, DEFAULT_LOGGER_CONFIG } from '../../types';

import * as fs from 'fs';
import * as path from 'path';

// Re-export types for backward compatibility
export type { LogLevel, LogContext, LogEntry, LoggerConfig };

/**
 * Default logger configuration for npm package with environment variable support
 */
const getDefaultLoggerConfig = (): LoggerConfig => ({
  ...DEFAULT_LOGGER_CONFIG,
  level: (process?.env?.LOG_LEVEL as LogLevel) ?? DEFAULT_LOGGER_CONFIG.level,
});

/**
 * Log levels in order of severity
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.CRITICAL]: 4,
};

/**
 * Enhanced Logger class for npm package
 */
export class Logger {
  private config: LoggerConfig;
  private context?: LogContext;
  private performanceTimers: Map<string, number> = new Map();
  private requestCounter: number = 0;
  private errorCounter: number = 0;

  constructor(config: Partial<LoggerConfig> = {}, context?: LogContext) {
    this.config = { ...getDefaultLoggerConfig(), ...config };
    this.context = context;

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Validate logger configuration
   */
  private validateConfig(): void {
    if (!Object.values(LogLevel).includes(this.config.level)) {
      console.warn(`Invalid log level: ${this.config.level}. Using INFO.`);
      this.config.level = LogLevel.INFO;
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const mergedContext = { ...this.context, ...context };
    return new Logger(this.config, mergedContext);
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any, context?: LogContext): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any, context?: LogContext): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, error, context);
    this.errorCounter++;
  }

  /**
   * Log a critical error message
   */
  critical(message: string, error?: Error | any, context?: LogContext): void {
    this.log(LogLevel.CRITICAL, message, error, context);
    this.errorCounter++;
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, context?: LogContext): void {
    // Check if we should log at this level
    if (!this.shouldLog(level)) {
      return;
    }

    // Create log entry
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: { ...this.context, ...context },
      logger: this.constructor.name,
    };

    // Add error details if provided
    if (data instanceof Error) {
      logEntry.error = {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    }

    // Add performance tracking if enabled
    if (this.config.enablePerformanceLogging) {
      logEntry.performance = this.getPerformanceStats();
    }

    // Output log entry
    this.outputLogEntry(logEntry);
  }

  /**
   * Check if we should log at the given level
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * Output log entry to configured destinations
   */
  private outputLogEntry(logEntry: LogEntry): void {
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // File logging (Node.js only)
    if (this.config.enableFileLogging && this.config.logFilePath && this.isFileLoggingAvailable()) {
      this.outputToFile(logEntry);
    }
  }

  /**
   * Check if file logging is available (Node.js environment)
   */
  private isFileLoggingAvailable(): boolean {
    return !!(typeof process !== 'undefined' && process?.versions?.node);
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(logEntry: LogEntry): void {
    const formattedMessage = this.formatLogMessage(logEntry);

    if (this.config.enableColors && this.isColorsSupported()) {
      const colorCode = this.getColorCode(logEntry.level);
      const resetCode = '\x1b[0m';
      console.log(`${colorCode}${formattedMessage}${resetCode}`);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Check if colors are supported in the current environment
   */
  private isColorsSupported(): boolean {
    // Check if we're in a Node.js environment with TTY support
    if (typeof process !== 'undefined' && process.stdout && process.stdout.isTTY) {
      return true;
    }
    // Check if we're in a browser environment (no colors for better compatibility)
    return false;
  }

  /**
   * Output log entry to file (Node.js only)
   */
  private outputToFile(logEntry: LogEntry): void {
    if (!this.config.logFilePath || !this.isFileLoggingAvailable()) {
      return;
    }

    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.config.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const formattedMessage = `${this.formatLogMessage(logEntry, false)}\n`;
      fs.appendFileSync(this.config.logFilePath, formattedMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Format log message
   */
  private formatLogMessage(logEntry: LogEntry, useConsoleFormat: boolean = true): string {
    if (this.config.enableStructuredLogs ?? !useConsoleFormat) {
      return JSON.stringify(logEntry, null, 2);
    }

    // Console-friendly format
    const parts: string[] = [];

    if (this.config.enableTimestamps) {
      parts.push(`[${logEntry.timestamp}]`);
    }

    parts.push(`[${logEntry.level}]`);

    if (logEntry.context?.component) {
      parts.push(`[${logEntry.context.component}]`);
    }

    if (logEntry.context?.requestId) {
      parts.push(`[${logEntry.context.requestId}]`);
    }

    if (logEntry.context?.mintId) {
      parts.push(`[mint:${logEntry.context.mintId}]`);
    }

    parts.push(logEntry.message);

    if (logEntry.data && !(logEntry.data instanceof Error)) {
      // Sanitize sensitive data before logging
      const sanitizedData = this.sanitizeData(logEntry.data);
      parts.push(`| ${JSON.stringify(sanitizedData)}`);
    }

    if (logEntry.error) {
      parts.push(`| Error: ${logEntry.error.name}: ${logEntry.error.message}`);
    }

    return parts.join(' ');
  }

  /**
   * Get ANSI color code for log level (Node.js only)
   */
  private getColorCode(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m', // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.CRITICAL]: '\x1b[35m', // Magenta
    };

    return colors[level] || '\x1b[0m';
  }

  /**
   * Sanitize sensitive data for logging
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key', 'authorization'];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Start performance timer
   */
  startTimer(name: string): void {
    if (!this.config.enablePerformanceLogging) {
      return;
    }

    this.performanceTimers.set(name, Date.now());
  }

  /**
   * End performance timer and log duration
   */
  endTimer(name: string, message?: string): number {
    if (!this.config.enablePerformanceLogging) {
      return 0;
    }

    const startTime = this.performanceTimers.get(name);
    if (!startTime) {
      this.warn(`Performance timer '${name}' was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.performanceTimers.delete(name);

    const logMessage = message ?? `Performance: ${name}`;
    this.debug(logMessage, { duration, timer: name });

    return duration;
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>, message?: string): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name, message);
      return result;
    } catch (error) {
      this.endTimer(name, message);
      throw error;
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(method: string, url: string, statusCode?: number, duration?: number): void {
    if (!this.config.enableRequestLogging) {
      return;
    }

    this.requestCounter++;
    const requestId = `req_${this.requestCounter}`;

    this.info(
      `HTTP ${method} ${url}`,
      {
        method,
        url,
        statusCode,
        duration,
        requestId,
      },
      { requestId }
    );
  }

  /**
   * Log API client activity
   */
  logAPICall(method: string, endpoint: string, success: boolean, details?: any): void {
    const level: LogLevel = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(
      level,
      `API ${method} ${endpoint}`,
      {
        method,
        endpoint,
        success,
        details,
      },
      { component: 'api-client' }
    );
  }

  /**
   * Log rate limit events
   */
  logRateLimit(endpoint: string, resetTime?: number, retryAfter?: number): void {
    this.warn(
      `Rate limit exceeded for ${endpoint}`,
      {
        endpoint,
        resetTime,
        retryAfter,
      },
      { component: 'rate-limiter' }
    );
  }

  /**
   * Log WebSocket events
   */
  logWebSocketEvent(event: string, data?: any): void {
    this.debug(`WebSocket: ${event}`, data, { component: 'websocket' });
  }

  /**
   * Get performance statistics
   */
  private getPerformanceStats(): any {
    return {
      activeTimers: this.performanceTimers.size,
      totalRequests: this.requestCounter,
      totalErrors: this.errorCounter,
      errorRate: this.requestCounter > 0 ? (this.errorCounter / this.requestCounter) * 100 : 0,
    };
  }

  /**
   * Get logger statistics
   */
  getStats(): {
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    activeTimers: number;
  } {
    return {
      totalRequests: this.requestCounter,
      totalErrors: this.errorCounter,
      errorRate: this.requestCounter > 0 ? (this.errorCounter / this.requestCounter) * 100 : 0,
      activeTimers: this.performanceTimers.size,
    };
  }

  /**
   * Reset logger statistics
   */
  resetStats(): void {
    this.requestCounter = 0;
    this.errorCounter = 0;
    this.performanceTimers.clear();
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.validateConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Create a context-aware logger for specific components
   */
  static forComponent(component: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger(config, { component });
  }

  /**
   * Create a request-scoped logger
   */
  static forRequest(requestId: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger(config, { requestId });
  }

  /**
   * Create a token-specific logger
   */
  static forToken(mintId: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger(config, { mintId });
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger with custom configuration
 */
export function createLogger(config: Partial<LoggerConfig> = {}, context?: LogContext): Logger {
  return new Logger(config, context);
}

/**
 * Logger utilities and helpers
 */
export const LoggerUtils = {
  /**
   * Create a child logger with component context
   */
  component(component: string): Logger {
    return logger.child({ component });
  },

  /**
   * Create a child logger with request context
   */
  request(requestId: string): Logger {
    return logger.child({ requestId });
  },

  /**
   * Create a child logger with token context
   */
  token(mintId: string): Logger {
    return logger.child({ mintId });
  },

  /**
   * Format duration for logging
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${(ms / 60000).toFixed(2)}m`;
  },

  /**
   * Format bytes for logging
   */
  formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) {
      return '0 Bytes';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  },

  /**
   * Validate log level
   */
  isValidLogLevel(level: string): level is LogLevel {
    return Object.prototype.hasOwnProperty.call(Object.values(LOG_LEVELS), level.toUpperCase());
  },

  /**
   * Get available log levels
   */
  getLogLevels(): LogLevel[] {
    return Object.values(LogLevel);
  },

  /**
   * Create a no-op logger for testing
   */
  createNoOpLogger(): Logger {
    return new Logger({ level: LogLevel.CRITICAL, enableConsole: false });
  },
};

// Export default logger for convenience
export default logger;
