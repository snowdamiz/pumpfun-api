/** One second in milliseconds */
export const ONE_SECOND_MS = 1000;

/** Seconds per minute */
export const SECONDS_PER_MINUTE = 60;

/** One minute in milliseconds */
export const ONE_MINUTE_MS = SECONDS_PER_MINUTE * ONE_SECOND_MS;

/** Thirty seconds in milliseconds */
export const THIRTY_SECONDS_MS = 30 * ONE_SECOND_MS;

/** Small count for burst sizes */
export const SMALL_BURST_SIZE = 5;

/** Five seconds in milliseconds */
export const FIVE_SECONDS_MS = SMALL_BURST_SIZE * ONE_SECOND_MS;

/** Ten seconds in milliseconds */
export const TEN_SECONDS_MS = 10 * ONE_SECOND_MS;

/** Quarter minute in seconds */
export const QUARTER_MINUTE_SECONDS = 15;

/** Fifteen seconds in milliseconds */
export const FIFTEEN_SECONDS_MS = QUARTER_MINUTE_SECONDS * ONE_SECOND_MS;

/** Thirty seconds in milliseconds */
export const THIRTY_SECONDS_MS_ALIAS = 30 * ONE_SECOND_MS;

/** One hour in milliseconds */
export const ONE_HOUR_MS = SECONDS_PER_MINUTE * ONE_MINUTE_MS;

/** Default request timeout in milliseconds */
export const DEFAULT_TIMEOUT_MS = TEN_SECONDS_MS;

/** Maximum request timeout in milliseconds */
export const MAX_TIMEOUT_MS = ONE_MINUTE_MS;

/** Minimum request timeout in milliseconds */
export const MIN_TIMEOUT_MS = ONE_SECOND_MS;

/** Default retry delay in milliseconds */
export const DEFAULT_RETRY_DELAY_MS = ONE_SECOND_MS;

/** Maximum retry delay in milliseconds */
export const MAX_RETRY_DELAY_MS = THIRTY_SECONDS_MS_ALIAS;

/** Default rate limit window in milliseconds */
export const DEFAULT_RATE_LIMIT_WINDOW_MS = ONE_MINUTE_MS;

/** Minimum rate limit window in milliseconds */
export const MIN_RATE_LIMIT_WINDOW_MS = ONE_SECOND_MS;

/** Maximum requests per window */
export const MAX_REQUESTS_PER_WINDOW = 1000;

/** Default burst window duration in milliseconds */
export const BURST_WINDOW_MS = ONE_SECOND_MS;

/** Default backoff delay in milliseconds */
export const DEFAULT_BACKOFF_DELAY_MS = ONE_SECOND_MS;

/** Maximum backoff delay in milliseconds */
export const MAX_BACKOFF_DELAY_MS = TEN_SECONDS_MS;

/** Adaptive adjustment interval in milliseconds */
export const ADAPTIVE_ADJUSTMENT_INTERVAL_MS = THIRTY_SECONDS_MS;

/** Minimum delay between requests in milliseconds */
export const MIN_REQUEST_DELAY_MS = 100;

/** Default rate limit for live streaming (requests per minute) */
export const DEFAULT_LIVE_STREAMING_RATE_LIMIT = 55;

/** Conservative rate limit (requests per minute) */
export const CONSERVATIVE_RATE_LIMIT = 30;

/** Moderate rate limit for pagination (requests per minute) */
export const PAGINATION_RATE_LIMIT = 40;

/** Maximum burst size for live streaming */
export const MAX_LIVE_STREAMING_BURST = 8;

/** Conservative burst size */
export const CONSERVATIVE_BURST_SIZE = 5;

/** Rate limit recovery time in milliseconds */
export const RATE_LIMIT_RECOVERY_TIME_MS = THIRTY_SECONDS_MS;

/** Safety buffer between requests in milliseconds */
export const REQUEST_SAFETY_BUFFER_MS = ONE_SECOND_MS;

/** Maximum description length */
export const MAX_DESCRIPTION_LENGTH = 1000;

/** Maximum reasonable participant count */
export const MAX_REASONABLE_PARTICIPANTS = 10000;

/** Maximum retry attempts */
export const MAX_RETRY_ATTEMPTS = 5;

/** Maximum concurrent errors before backoff */
export const MAX_CONSECUTIVE_ERRORS = 5;

/** Error rate threshold for warnings (percentage) */
export const ERROR_RATE_WARNING_THRESHOLD = 5;

/** Error rate threshold for critical (percentage) */
export const ERROR_RATE_CRITICAL_THRESHOLD = 20;

/** Rate limit utilization warning threshold (percentage) */
export const RATE_LIMIT_WARNING_THRESHOLD = 70;

/** Rate limit utilization critical threshold (percentage) */
export const RATE_LIMIT_CRITICAL_THRESHOLD = 90;

/** Default API base URL */
export const DEFAULT_API_BASE_URL = 'https://frontend-api-v3.pump.fun';

/** User agent string */
export const USER_AGENT = '@pumpfun/api-client/1.0.0';

/** Default log level */
export const DEFAULT_LOG_LEVEL = 'INFO';

/** Kilobyte in bytes */
export const KILOBYTE = 1024;

/** Maximum log file size (not implemented yet) */
export const MAX_LOG_FILE_SIZE = 10 * KILOBYTE * KILOBYTE; // 10MB

/** Jitter percentage for backoff calculations */
export const JITTER_PERCENTAGE = 0.1; // 10%

/** Adaptive rate limit increase factor */
export const ADAPTIVE_INCREASE_FACTOR = 1.1;

/** Adaptive rate limit decrease factor */
export const ADAPTIVE_DECREASE_FACTOR = 0.8;

/** Minimum adaptive rate limit factor */
export const MIN_ADAPTIVE_FACTOR = 0.3;

/** Maximum adaptive rate limit factor */
export const MAX_ADAPTIVE_FACTOR = 2.0;

/** HTTP Too Many Requests status code */
export const HTTP_TOO_MANY_REQUESTS = 429;

/** HTTP Internal Server Error status code */
export const HTTP_INTERNAL_SERVER_ERROR = 500;

/** HTTP Bad Gateway status code */
export const HTTP_BAD_GATEWAY = 502;

/** HTTP Service Unavailable status code */
export const HTTP_SERVICE_UNAVAILABLE = 503;

/** HTTP Gateway Timeout status code */
export const HTTP_GATEWAY_TIMEOUT = 504;

/** HTTP Request Timeout status code */
export const HTTP_REQUEST_TIMEOUT = 408;

/** Default LiveKit server regions with optimal selection */
export const LIVEKIT_REGIONS = [
  {
    region: 'us-east-1',
    url: 'wss://livekit-us-east-1.pump.fun',
    description: 'US East (N. Virginia)',
  },
  {
    region: 'us-west-2',
    url: 'wss://livekit-us-west-2.pump.fun',
    description: 'US West (Oregon)',
  },
  {
    region: 'eu-west-1',
    url: 'wss://livekit-eu-west-1.pump.fun',
    description: 'EU West (Ireland)',
  },
  {
    region: 'ap-southeast-1',
    url: 'wss://livekit-ap-southeast-1.pump.fun',
    description: 'Asia Pacific (Singapore)',
  },
] as const;

/** Default LiveKit region */
export const DEFAULT_LIVEKIT_REGION = 'us-east-1';

/** LiveKit room name pattern */
export const LIVEKIT_ROOM_PATTERN = '{mintId}:{streamId}';

/** LiveKit connection timeout in milliseconds */
export const LIVEKIT_CONNECTION_TIMEOUT_MS = 15 * ONE_SECOND_MS;

/** Maximum LiveKit regions to return */
export const MAX_LIVEKIT_REGIONS = 4;
