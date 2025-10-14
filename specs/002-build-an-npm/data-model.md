# Data Model: PumpFun API npm Package

**Date**: 2025-10-12
**Feature**: Build PumpFun API npm Package

## Core Entities

### PumpFunAPIClient

**Purpose**: Main API client class providing access to all PumpFun API functionality
**Fields**:
- `httpClient`: HTTPClient - HTTP client with retry logic and interceptors
- `logger`: Logger - Logging instance for debugging and monitoring
- `config`: ClientConfig - Configuration options and settings
- `rateLimiter`: RateLimiter - Rate limiting and request throttling

**Relationships**:
- Uses HTTPClient for all API requests
- Uses Logger for debugging and error reporting
- Uses RateLimiter for request throttling
- Creates LiveCoin, LiveStreamInfo, and other response objects

**Relationships**:
- Uses HTTPClient from `infrastructure/http/http-client.ts` for all API requests
- Uses Logger from `infrastructure/logging/logger.ts` for debugging and error reporting
- Uses RateLimiter from `infrastructure/rate-limiting/rate-limiter.ts` for request throttling
- Creates LiveCoin, LiveStreamInfo, and other response objects from types in `types/`

**Validation Rules**:
- `config` must be valid ClientConfig object from `types/config.types.ts`
- `httpClient` must be properly initialized with base URLs from `constants/api.constants.ts`
- `rateLimiter` must respect 60 requests/minute limit

**File Location**: `package/src/client/PumpFunAPIClient.ts`

### LiveCoin

**Purpose**: Represents a coin with current live streaming data
**Fields**:
- `mint`: string (required) - Unique identifier for the token
- `name`: string (required) - Token name
- `symbol`: string (required) - Token symbol
- `description`: string (required) - Token description
- `image_uri`: string (required) - Token image URL
- `twitter`: string (optional) - Twitter handle
- `telegram`: string (optional) - Telegram link
- `creator`: string (required) - Creator address
- `created_timestamp`: number (required) - Creation timestamp
- `market_cap`: number (required) - Market cap value
- `usd_market_cap`: number (required) - USD market cap
- `is_currently_live`: boolean (required) - Live streaming status
- `livestream_title`: string (optional) - Stream title
- `num_participants`: number (required) - Current participant count
- `reply_count`: number (required) - Chat message count
- `thumbnail`: string (required) - Stream thumbnail URL
- `last_reply`: number (required) - Last activity timestamp

**Validation Rules**:
- `mint` must be a valid Solana address format
- `name`, `symbol`, `description` must be non-empty strings
- `market_cap`, `usd_market_cap` must be non-negative numbers
- `num_participants`, `reply_count` must be non-negative integers
- URLs must be valid HTTP/HTTPS URLs
- Timestamps must be valid Unix timestamps

### LiveStreamInfo

**Purpose**: Contains detailed video stream information
**Fields**:
- `id`: number (required) - Stream unique identifier
- `supabaseId`: number (required) - Supabase database ID
- `mintId`: string (required) - Associated token mint
- `creatorAddress`: string (required) - Stream creator address
- `streamStartTimestamp`: number (required) - Stream start time
- `numParticipants`: number (required) - Current participants
- `maxParticipants`: number (required) - Maximum participants
- `isLive`: boolean (required) - Live status
- `downrankScore`: number (required) - Quality/relevance score
- `title`: string (required) - Stream title
- `mode`: 'interactive' | 'broadcast' (required) - Stream mode

**Validation Rules**:
- `id`, `supabaseId` must be positive integers
- `mintId`, `creatorAddress` must be valid Solana addresses
- `streamStartTimestamp` must be valid Unix timestamp
- `numParticipants`, `maxParticipants` must be non-negative integers
- `mode` must be either 'interactive' or 'broadcast'
- `downrankScore` must be between 0 and 100

### LiveKitConnectionInfo

**Purpose**: Provides WebRTC connection details for video streaming
**Fields**:
- `regions`: LiveKitRegion[] (required) - Available server regions
- `primaryServer`: string (required) - Primary server URL
- `roomName`: string (required) - LiveKit room identifier
- `mintId`: string (required) - Associated token mint
- `streamId`: number (required) - Stream identifier
- `websocketUrl`: string (required) - WebSocket connection URL
- `requiresAuthentication`: boolean (required) - Authentication requirement

**Validation Rules**:
- `regions` must contain at least one valid region
- URLs must be valid WebSocket (wss://) URLs
- `roomName` must follow pattern `{mintId}:{streamId}`
- `streamId` must be positive integer

### LiveKitRegion

**Purpose**: Represents a LiveKit server region
**Fields**:
- `region`: string (required) - Region identifier
- `url`: string (required) - Region server URL
- `distance`: string (required) - Distance metric

**Validation Rules**:
- `region` must be non-empty string
- `url` must be valid WebSocket URL
- `distance` must be numeric string

### StreamClip

**Purpose**: Represents recorded stream segments
**Fields**:
- `id`: string (required) - Clip unique identifier
- `mintId`: string (required) - Associated token mint
- `clipType`: 'COMPLETE' | 'HIGHLIGHT' (required) - Clip type
- `duration`: number (optional) - Clip duration in seconds
- `view_count`: number (optional) - View count
- `created_at`: string (optional) - Creation timestamp
- `clip_url`: string (optional) - Clip playback URL

**Validation Rules**:
- `mintId` must be valid Solana address
- `clipType` must be 'COMPLETE' or 'HIGHLIGHT'
- `duration` must be positive integer if present
- `view_count` must be non-negative integer if present
- URLs must be valid HTTP/HTTPS URLs

### APIError

**Purpose**: Standardized error format for API responses
**Fields**:
- `code`: string (required) - Error code
- `message`: string (required) - Human-readable error message
- `statusCode`: number (required) - HTTP status code
- `details`: Record<string, any> (optional) - Additional error details
- `timestamp`: string (required) - Error timestamp
- `isRetryable`: boolean (required) - Whether error can be retried

**Validation Rules**:
- `statusCode` must be valid HTTP status code (100-599)
- `code` must be non-empty string
- `message` must be non-empty string
- `timestamp` must be valid ISO 8601 timestamp

## Configuration Objects

### ClientConfig

**Purpose**: Configuration options for PumpFunAPIClient
**Fields**:
- `baseURL`: string (optional) - Custom API base URL
- `timeout`: number (optional) - Request timeout in milliseconds
- `retryConfig`: Partial<RetryConfig> (optional) - Retry configuration
- `loggerConfig`: Partial<LoggerConfig> (optional) - Logger configuration
- `rateLimitConfig`: Partial<RateLimitConfig> (optional) - Rate limiting config

**Validation Rules**:
- `baseURL` must be valid HTTP/HTTPS URL
- `timeout` must be positive integer (1000-60000 range)
- All nested configs must be valid if provided

### RetryConfig

**Purpose**: Configuration for request retry logic
**Fields**:
- `maxRetries`: number (required) - Maximum retry attempts
- `baseDelay`: number (required) - Base delay in milliseconds
- `maxDelay`: number (required) - Maximum delay in milliseconds
- `backoffFactor`: number (required) - Multiplier for exponential backoff
- `retryableStatusCodes`: number[] (required) - HTTP codes to retry
- `retryableErrors`: string[] (required) - Error codes to retry

**Validation Rules**:
- `maxRetries` must be between 0 and 10
- `baseDelay` must be between 100 and 10000 ms
- `maxDelay` must be between 1000 and 300000 ms
- `backoffFactor` must be between 1 and 5
- Arrays must contain valid values

### RateLimitConfig

**Purpose**: Configuration for rate limiting
**Fields**:
- `maxRequestsPerWindow`: number (required) - Max requests per window
- `windowMs`: number (required) - Window duration in milliseconds
- `enableRetryAfter`: boolean (required) - Enable retry-after header handling
- `enableSlidingWindow`: boolean (required) - Use sliding window algorithm
- `enableBurstProtection`: boolean (required) - Enable burst protection
- `maxBurst`: number (optional) - Maximum burst size
- `enableBackoff`: boolean (required) - Enable adaptive backoff
- `baseBackoffMs`: number (required) - Base backoff delay
- `maxBackoffMs`: number (required) - Maximum backoff delay
- `backoffMultiplier`: number (required) - Backoff multiplier

**Validation Rules**:
- `maxRequestsPerWindow` must be positive (default: 60)
- `windowMs` must be positive (default: 60000)
- `maxBurst` must be positive if provided
- Backoff delays must be positive integers
- Multiplier must be between 1 and 5

## Response Wrappers

### APIResponse<T>

**Purpose**: Standard wrapper for API responses
**Fields**:
- `success`: boolean (required) - Request success status
- `data`: T (optional) - Response data
- `error`: APIError (optional) - Error information
- `timestamp`: string (required) - Response timestamp
- `headers`: Record<string, string> (optional) - Response headers

### ArrayResponse<T>

**Purpose**: Wrapper for array responses with pagination
**Extends**: APIResponse<T[]>
**Additional Fields**:
- `pagination`: Pagination (optional) - Pagination information

### Pagination

**Purpose**: Pagination metadata
**Fields**:
- `limit`: number (required) - Items per page
- `offset`: number (required) - Items skipped
- `total`: number (required) - Total items
- `hasMore`: boolean (required) - More items available
- `page`: number (optional) - Current page number

## State Management

### ClientState

**Purpose**: Runtime state for API client
**Fields**:
- `isInitialized`: boolean - Initialization status
- `lastRequestTime`: number - Timestamp of last request
- `requestCount`: number - Total requests made
- `errorCount`: number - Total errors encountered
- `rateLimitInfo`: RateLimitInfo - Current rate limit status

### RateLimitState

**Purpose**: Rate limiting state
**Fields**:
- `requestsInWindow`: number - Requests in current window
- `windowStart`: number - Window start timestamp
- `backoffUntil`: number - Backoff end timestamp
- `consecutiveErrors`: number - Consecutive error count

## Type Definitions

### StreamStatus

**Purpose**: Enumeration for stream states
**Values**:
- `STARTING`: Stream is initializing
- `LIVE`: Stream is actively running
- `ENDING`: Stream is shutting down
- `ENDED`: Stream has completed
- `ERROR`: Stream encountered error

### LogLevel

**Purpose**: Enumeration for logging levels
**Values**:
- `DEBUG`: Detailed debugging information
- `INFO`: General information messages
- `WARN`: Warning messages
- `ERROR`: Error messages
- `CRITICAL`: Critical error messages

### HTTPMethod

**Purpose**: Enumeration for HTTP methods
**Values**:
- `GET`: Retrieve data
- `POST`: Create data
- `PUT`: Update data
- `DELETE`: Remove data
- `PATCH`: Partial update
- `HEAD`: Retrieve headers
- `OPTIONS`: Retrieve options

## Validation Rules Summary

### Input Validation
- All string fields must be non-empty unless marked optional
- All numeric fields must be within reasonable ranges
- All URLs must be valid HTTP/HTTPS or WebSocket URLs
- All addresses must follow Solana address format
- All timestamps must be valid Unix timestamps or ISO 8601 strings

### Business Logic Validation
- Rate limits cannot exceed 60 requests per minute
- Retry attempts limited to maximum of 10
- Timeouts limited to reasonable range (1-60 seconds)
- Stream participant counts cannot be negative
- Market cap values must be non-negative

### Data Consistency
- Related objects must reference valid identifiers
- Timestamps must be chronologically consistent
- Boolean flags must match actual data state
- Optional fields must be null or valid values

## File Organization

### Type Definitions
- **API Types**: `package/src/types/api.types.ts` - LiveCoin, LiveStreamInfo, StreamClip, APIError
- **Common Types**: `package/src/types/common.types.ts` - Response wrappers, pagination
- **Config Types**: `package/src/types/config.types.ts` - ClientConfig, RetryConfig, RateLimitConfig
- **Domain Types**: `package/src/types/domain.types.ts` - Business logic entities

### Service Classes
- **Live Streams Service**: `package/src/services/live/live-streams.service.ts`
- **Stream Filters Service**: `package/src/services/live/stream-filters.service.ts`
- **Stream Info Service**: `package/src/services/live/stream-info.service.ts`

### Infrastructure Components
- **HTTP Client**: `package/src/infrastructure/http/http-client.ts`
- **Error Handler**: `package/src/infrastructure/error-handling/error-handler.ts`
- **Logger**: `package/src/infrastructure/logging/logger.ts`
- **Rate Limiter**: `package/src/infrastructure/rate-limiting/rate-limiter.ts`
- **Configuration Manager**: `package/src/infrastructure/config/config-manager.ts`

### Constants and Validation
- **API Constants**: `package/src/constants/api.constants.ts`
- **Stream Validation**: `package/src/validation/streams.validator.ts`

This data model provides comprehensive type safety and validation for the PumpFun API npm package while maintaining flexibility for future API changes.