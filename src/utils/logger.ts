/**
 * Logging Infrastructure for PumpFun API Discovery
 *
 * Provides comprehensive logging functionality for tracking API discovery progress,
 * debugging issues, and monitoring performance.
 */

import { LogLevel, LogEntry, LogContext } from '../types/common';

/**
 * Log levels in order of severity
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  enableTimestamps: boolean;
  enableColors: boolean;
  enableStructuredLogs: boolean;
  maxFileSize?: number; // In bytes
  maxFiles?: number;
  enableRotation: boolean;
  rotationInterval?: string; // Cron pattern
  enablePerformanceLogging: boolean;
  enableRequestLogging: boolean;
  enableErrorTracking: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'INFO',
  enableConsole: true,
  enableFile: true,
  filePath: process.env.LOG_FILE_PATH || './logs/discovery.log',
  enableTimestamps: true,
  enableColors: true,
  enableStructuredLogs: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  enableRotation: true,
  rotationInterval: '0 0 * * *', // Daily rotation at midnight
  enablePerformanceLogging: true,
  enableRequestLogging: true,
  enableErrorTracking: true,
};

/**
 * Logger class for structured logging
 */
export class Logger {
  private config: LoggerConfig;
  private context?: LogContext;
  private performanceTimers: Map<string, number> = new Map();
  private requestCounter: number = 0;
  private errorCounter: number = 0;

  constructor(config: Partial<LoggerConfig> = {}, context?: LogContext) {
    this.config = { ...DEFAULT_LOGGER_CONFIG, ...config };
    this.context = context;

    // Initialize logging directories
    this.initializeLogging();
  }

  /**
   * Initialize logging infrastructure
   */
  private initializeLogging(): void {
    if (this.config.enableFile && this.config.filePath) {
      this.ensureLogDirectory();
    }
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    const fs = require('fs');
    const path = require('path');

    if (this.config.filePath) {
      const logDir = path.dirname(this.config.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
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
    this.log('DEBUG', message, data, context);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any, context?: LogContext): void {
    this.log('INFO', message, data, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any, context?: LogContext): void {
    this.log('WARN', message, data, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    this.log('ERROR', message, error, context);

    // Track errors
    this.errorCounter++;
  }

  /**
   * Log a critical error message
   */
  critical(message: string, error?: Error | any, context?: LogContext): void {
    this.log('CRITICAL', message, error, context);

    // Track errors
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

    if (this.config.enableFile) {
      this.outputToFile(logEntry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(logEntry: LogEntry): void {
    const formattedMessage = this.formatLogMessage(logEntry);

    if (this.config.enableColors) {
      const colorCode = this.getColorCode(logEntry.level);
      const resetCode = '\x1b[0m';
      console.log(`${colorCode}${formattedMessage}${resetCode}`);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Output log entry to file
   */
  private outputToFile(logEntry: LogEntry): void {
    if (!this.config.filePath) return;

    const fs = require('fs');
    const formattedMessage = this.formatLogMessage(logEntry, false) + '\n';

    try {
      fs.appendFileSync(this.config.filePath, formattedMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Format log message
   */
  private formatLogMessage(logEntry: LogEntry, useConsoleFormat: boolean = true): string {
    if (this.config.enableStructuredLogs || !useConsoleFormat) {
      return JSON.stringify(logEntry);
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

    parts.push(logEntry.message);

    if (logEntry.data && !(logEntry.data instanceof Error)) {
      parts.push(`| ${JSON.stringify(logEntry.data)}`);
    }

    if (logEntry.error) {
      parts.push(`| Error: ${logEntry.error.name}: ${logEntry.error.message}`);
    }

    return parts.join(' ');
  }

  /**
   * Get ANSI color code for log level
   */
  private getColorCode(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      DEBUG: '\x1b[36m',    // Cyan
      INFO: '\x1b[32m',     // Green
      WARN: '\x1b[33m',     // Yellow
      ERROR: '\x1b[31m',    // Red
      CRITICAL: '\x1b[35m', // Magenta
    };

    return colors[level] || '\x1b[0m';
  }

  /**
   * Start performance timer
   */
  startTimer(name: string): void {
    if (!this.config.enablePerformanceLogging) return;

    this.performanceTimers.set(name, Date.now());
  }

  /**
   * End performance timer and log duration
   */
  endTimer(name: string, message?: string): number {
    if (!this.config.enablePerformanceLogging) return 0;

    const startTime = this.performanceTimers.get(name);
    if (!startTime) {
      this.warn(`Performance timer '${name}' was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.performanceTimers.delete(name);

    const logMessage = message || `Performance: ${name}`;
    this.debug(logMessage, { duration, timer: name });

    return duration;
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    message?: string
  ): Promise<T> {
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
    if (!this.config.enableRequestLogging) return;

    this.requestCounter++;
    const requestId = `req_${this.requestCounter}`;

    this.info(`HTTP ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
      requestId,
    }, { requestId });
  }

  /**
   * Log API discovery progress
   */
  logDiscoveryProgress(
    stage: string,
    progress: number,
    total: number,
    details?: any
  ): void {
    this.info(`Discovery Progress: ${stage}`, {
      stage,
      progress,
      total,
      percentage: Math.round((progress / total) * 100),
      details,
    }, { component: 'discovery' });
  }

  /**
   * Log API endpoint discovery
   */
  logEndpointDiscovery(
    endpoint: string,
    method: string,
    success: boolean,
    details?: any
  ): void {
    const level: LogLevel = success ? 'INFO' : 'WARN';
    this.log(level, `Endpoint ${method} ${endpoint}`, {
      endpoint,
      method,
      success,
      details,
    }, { component: 'discovery' });
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
    this.initializeLogging();
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger with custom configuration
 */
export function createLogger(
  config: Partial<LoggerConfig> = {},
  context?: LogContext
): Logger {
  return new Logger(config, context);
}

/**
 * Logger utilities
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
   * Format duration for logging
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      return `${(ms / 60000).toFixed(2)}m`;
    }
  },

  /**
   * Sanitize sensitive data for logging
   */
  sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  },
};