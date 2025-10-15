/**
 * Constants for PumpFun API Examples
 * Centralized configuration values to avoid magic numbers
 */

// Example limits and timeouts
export const EXAMPLE_STREAM_LIMIT = 5;
export const MIN_PARTICIPANTS = 1;
export const EXAMPLE_TIMEOUT = 15000;
export const TEST_CONNECTION_TIMEOUT = 5000;

// Timing and delays
export const BASE_DELAY = 1000;
export const MAX_DELAY = 10000;
export const RETRY_DELAY_2 = 2000;
export const PROMISE_DELAY = 100;
export const BACKOFF_FACTOR = 2;

// Rate limiting
export const RATE_LIMIT_REQUESTS = 50;
export const RATE_LIMIT_WINDOW = 60000;

// Retry configurations
export const MAX_RETRIES_BASIC = 2;
export const MAX_RETRIES_CUSTOM = 5;
export const MAX_RETRIES_PRODUCTION = 3;

// Stream limits
export const ACTIVE_STREAMS_LIMIT = 10;
export const LIVE_COINS_LIMIT = 20;
export const ACTIVE_STREAMS_LIMIT_SMALL = 10;
export const TOP_STREAMS_LIMIT = 5;
export const STREAM_INFO_LIMIT = 3;
export const MAX_STREAM_INFO_TEST = 2;

// Participant thresholds
export const TOP_ACTIVE_PARTICIPANTS = 3;
export const MIN_ACTIVE_PARTICIPANTS = 2;
export const TITLED_ACTIVE_PARTICIPANTS = 3;
export const MIN_TITLED_PARTICIPANTS = 1;

// Display formatting
export const DESCRIPTION_PREVIEW_LENGTH = 100;
export const TO_FIXED_DECIMALS = 2;
export const SUCCESS_RATE_DECIMALS = 1;
export const JSON_INDENTATION = 2;

// Command line parsing
export const ARGV_SLICE_START = 2;
export const INDEX_OFFSET = 1;
export const SUBSTRING_START = 0;

// Exit codes
export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;

// Time conversions
export const TIMESTAMP_MULTIPLIER = 1000;

// Repeating characters for formatting
export const REPEAT_COUNT_60 = 60;
export const REPEAT_COUNT_50 = 50;

// Invalid configuration for testing
export const INVALID_TIMEOUT = -1000;
