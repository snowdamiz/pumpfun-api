# Data Model: PumpFun API npm Package

**Date**: 2025-10-12
**Feature**: Build PumpFun API npm Package

## Core Entities

### PumpFunAPIClient

**Purpose**: Main API client class providing access to all PumpFun API functionality including built-in LiveKit integration
**Fields**:
- `httpClient`: HTTPClient - HTTP client with retry logic and interceptors
- `logger`: Logger - Logging instance for debugging and monitoring
- `config`: ClientConfig - Configuration options and settings
- `rateLimiter`: RateLimiter - Rate limiting and request throttling

**Methods**:
- `connectToLiveStream(mintId: string, options: LiveKitConnectionOptions): Promise<LiveStreamConnection>` - Built-in LiveKit integration

**Relationships**:
- Uses HTTPClient for all API requests
- Uses Logger for debugging and error reporting
- Uses RateLimiter for request throttling
- Creates LiveCoin, LiveStreamInfo, and other response objects
- Can instantiate LiveKitStreamManager for advanced streaming scenarios

**Relationships**:
- Uses HTTPClient from `infrastructure/http/http-client.ts` for all API requests
- Uses Logger from `infrastructure/logging/logger.ts` for debugging and error reporting
- Uses RateLimiter from `infrastructure/rate-limiting/rate-limiter.ts` for request throttling
- Creates LiveCoin, LiveStreamInfo, and other response objects from types in `types/`
- Creates LiveKitStreamManager instances for WebRTC connections

**Validation Rules**:
- `config` must be valid ClientConfig object from `types/config.types.ts`
- `httpClient` must be properly initialized with base URLs from `constants/api.constants.ts`
- `rateLimiter` must respect 60 requests/minute limit
- `connectToLiveStream` requires valid mintId and LiveKit connection options

**File Location**: `src/client/PumpFunAPIClient.ts`

### LiveKitStreamManager

**Purpose**: Helper class that manages WebRTC connections and handles LiveKit integration automatically
**Fields**:
- `client`: PumpFunAPIClient - Reference to main API client
- `activeConnections`: Map<string, LiveStreamConnection> - Active WebRTC connections
- `reconnectionAttempts`: Map<string, number> - Reconnection attempt tracking
- `connectionConfig`: ConnectionConfig - Default connection settings

**Methods**:
- `connect(mintId: string, options?: LiveKitConnectionOptions): Promise<LiveStreamConnection>` - Establish WebRTC connection
- `disconnect(connectionId: string): Promise<void>` - Close connection and cleanup
- `reconnect(connectionId: string): Promise<LiveStreamConnection>` - Attempt reconnection
- `getConnectionState(connectionId: string): ConnectionState` - Get connection status
- `muteAudio(connectionId: string): Promise<void>` - Mute audio
- `unmuteAudio(connectionId: string): Promise<void>` - Unmute audio
- `muteVideo(connectionId: string): Promise<void>` - Mute video
- `unmuteVideo(connectionId: string): Promise<void>` - Unmute video

**Relationships**:
- Created by PumpFunAPIClient or instantiated directly
- Creates and manages LiveStreamConnection objects
- Uses HTTPClient to fetch LiveKit connection details
- Logs connection events and errors

**Validation Rules**:
- `mintId` must be valid Solana address with active stream
- `options` must conform to LiveKitConnectionOptions interface
- Connection limits apply (max 10 concurrent connections)
- Reconnection attempts limited to 5 per connection

**File Location**: `src/services/live/LiveKitStreamManager.ts`

### LiveStreamConnection

**Purpose**: Managed WebRTC connection object returned by connectToLiveStream() method
**Fields**:
- `id`: string (required) - Unique connection identifier
- `mintId`: string (required) - Associated token mint
- `roomName`: string (required) - LiveKit room name
- `state`: ConnectionState (required) - Current connection state
- `isConnected`: boolean (required) - Connection status
- `createdAt`: number (required) - Connection creation timestamp
- `lastActivity`: number (required) - Last activity timestamp
- `reconnectionCount`: number (required) - Number of reconnections
- `audioTrack`: MediaStreamTrack | null (optional) - Audio track
- `videoTrack`: MediaStreamTrack | null (optional) - Video track
- `mediaStream`: MediaStream | null (optional) - Combined media stream

**Methods**:
- `disconnect(): Promise<void>` - Close connection and cleanup
- `reconnect(): Promise<void>` - Attempt reconnection
- `getStats(): Promise<RTCStatsReport>` - Get WebRTC statistics
- `muteAudio(): void` - Mute audio track
- `unmuteAudio(): void` - Unmute audio track
- `muteVideo(): void` - Mute video track
- `unmuteVideo(): void` - Unmute video track

**Validation Rules**:
- `id` must be unique UUID string
- `mintId` must be valid Solana address
- `state` must be valid ConnectionState enum value
- Timestamps must be valid Unix timestamps
- `reconnectionCount` must be non-negative integer

**File Location**: `src/types/domain.types.ts`

### LiveKitConnectionOptions

**Purpose**: TypeScript interface defining connection configuration including video/audio elements and event callbacks
**Fields**:
- `videoElement`: HTMLVideoElement | null (optional) - Target video element for playback
- `audioElement`: HTMLAudioElement | null (optional) - Target audio element for playback
- `autoConnect`: boolean (optional) - Auto-connect on initialization (default: true)
- `autoPlay`: boolean (optional) - Auto-play media (default: true)
- `muted`: boolean (optional) - Start muted (default: false)
- `videoEnabled`: boolean (optional) - Enable video track (default: true)
- `audioEnabled`: boolean (optional) - Enable audio track (default: true)
- `preferredQuality`: 'auto' | 'high' | 'medium' | 'low' (optional) - Video quality preference
- `maxReconnectAttempts`: number (optional) - Maximum reconnection attempts (default: 5)
- `reconnectDelayMs`: number (optional) - Delay between reconnections (default: 3000)
- `onConnected`: (connection: LiveStreamConnection) => void (optional) - Connection success callback
- `onDisconnected`: (connection: LiveStreamConnection) => void (optional) - Connection closed callback
- `onError`: (error: Error, connection: LiveStreamConnection) => void (optional) - Error callback
- `onReconnecting`: (connection: LiveStreamConnection) => void (optional) - Reconnection attempt callback
- `onStateChange`: (state: ConnectionState, connection: LiveStreamConnection) => void (optional) - State change callback

**Validation Rules**:
- Video/audio elements must be valid DOM elements if provided
- `maxReconnectAttempts` must be between 0 and 10
- `reconnectDelayMs` must be positive integer (1000-30000 range)
- `preferredQuality` must be valid enum value
- Callbacks must be functions if provided

**File Location**: `src/types/domain.types.ts`

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

### ConnectionState

**Purpose**: Enumeration for WebRTC connection states
**Values**:
- `DISCONNECTED`: No active connection
- `CONNECTING`: Connection attempt in progress
- `CONNECTED`: Connection established and ready
- `RECONNECTING`: Reconnection attempt in progress
- `DISCONNECTING`: Connection is being closed
- `FAILED`: Connection failed with error

### ConnectionConfig

**Purpose**: Default configuration for LiveKit connections
**Fields**:
- `defaultMaxReconnectAttempts`: number - Default maximum reconnection attempts (default: 5)
- `defaultReconnectDelayMs`: number - Default reconnection delay (default: 3000)
- `connectionTimeoutMs`: number - Connection timeout (default: 10000)
- `heartbeatIntervalMs`: number - Connection heartbeat interval (default: 5000)
- `enableStatistics`: boolean - Enable WebRTC statistics collection (default: true)
- `enableDebugLogging`: boolean - Enable debug logging for connections (default: false)

**Validation Rules**:
- `defaultMaxReconnectAttempts` must be between 0 and 10
- `defaultReconnectDelayMs` must be positive integer (1000-30000 range)
- `connectionTimeoutMs` must be between 5000 and 60000
- `heartbeatIntervalMs` must be between 1000 and 30000

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
- **API Types**: `src/types/api.types.ts` - LiveCoin, LiveStreamInfo, StreamClip, APIError
- **Common Types**: `src/types/common.types.ts` - Response wrappers, pagination
- **Config Types**: `src/types/config.types.ts` - ClientConfig, RetryConfig, RateLimitConfig
- **Domain Types**: `src/types/domain.types.ts` - Business logic entities

### Service Classes
- **Live Streams Service**: `src/services/live/live-streams.service.ts`
- **Stream Filters Service**: `src/services/live/stream-filters.service.ts`
- **Stream Info Service**: `src/services/live/stream-info.service.ts`
- **LiveKit Stream Manager**: `src/services/live/LiveKitStreamManager.ts` - WebRTC connection management

### Infrastructure Components
- **HTTP Client**: `src/infrastructure/http/http-client.ts`
- **Error Handler**: `src/infrastructure/error-handling/error-handler.ts`
- **Logger**: `src/infrastructure/logging/logger.ts`
- **Rate Limiter**: `src/infrastructure/rate-limiting/rate-limiter.ts`
- **Configuration Manager**: `src/infrastructure/config/config-manager.ts`

### Constants and Validation
- **API Constants**: `src/constants/api.constants.ts`
- **Stream Validation**: `src/validation/streams.validator.ts`

### Examples and Documentation
- **LiveKit Integration Examples**: `src/examples/livekit-integration.ts`
- **LiveKit Documentation**: `docs/livekit-integration.md`

This data model provides comprehensive type safety and validation for the PumpFun API npm package while maintaining flexibility for future API changes.