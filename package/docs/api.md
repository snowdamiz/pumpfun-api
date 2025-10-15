# PumpFun API Client Reference

This comprehensive API reference covers all public methods, types, and configuration options available in the PumpFun API client.

## Table of Contents

- [PumpFunAPIClient](#pumpfunapiclient)
  - [Constructor](#constructor)
  - [Configuration Methods](#configuration-methods)
  - [Live Streaming Methods](#live-streaming-methods)
  - [Video Stream Analysis](#video-stream-analysis)
  - [Search and Filtering](#search-and-filtering)
  - [Stream Clips](#stream-clips)
  - [Utility Methods](#utility-methods)
- [Types and Interfaces](#types-and-interfaces)
- [Error Handling](#error-handling)
- [Configuration](#configuration)

---

## PumpFunAPIClient

The main client class for accessing PumpFun API functionality.

### Constructor

```typescript
constructor(config?: ClientConfig)
```

Creates a new PumpFunAPIClient instance with optional configuration.

**Parameters:**
- `config` (optional): `ClientConfig` - Configuration options for the client

**Example:**
```typescript
import { PumpFunAPIClient } from '@pumpfun/api-client';

// Default configuration
const client = new PumpFunAPIClient();

// Custom configuration
const client = new PumpFunAPIClient({
  timeout: 15000,
  retryConfig: {
    maxRetries: 5,
    baseDelay: 2000
  }
});
```

---

## Configuration Methods

### getConfiguration()

```typescript
public getConfiguration(): Readonly<ReturnType<typeof this.configManager.getConfig>>
```

Returns the current client configuration.

**Returns:** Readonly configuration object

**Example:**
```typescript
const config = client.getConfiguration();
console.log('Base URL:', config.baseURL);
console.log('Timeout:', config.timeout);
```

### getState()

```typescript
public getState(): Readonly<ClientState>
```

Returns the current client state including request statistics and rate limit information.

**Returns:** Readonly client state object

**Example:**
```typescript
const state = client.getState();
console.log('Requests made:', state.requestCount);
console.log('Errors encountered:', state.errorCount);
console.log('Rate limited:', state.rateLimitInfo.consecutiveErrors);
```

### getStatistics()

```typescript
public getStatistics(): {
  requestCount: number;
  errorCount: number;
  errorRate: number;
  successRate: number;
  lastRequestTime: number | null;
  uptime: number;
  startTime: string;
  rateLimitState: RateLimitState;
}
```

Returns comprehensive statistics about client usage.

**Returns:** Statistics object with request counts, error rates, and timing information

**Example:**
```typescript
const stats = client.getStatistics();
console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
console.log(`Error rate: ${stats.errorRate.toFixed(2)}%`);
```

### updateLoggerConfig()

```typescript
public updateLoggerConfig(
  config: Partial<typeof import('../types').DEFAULT_LOGGER_CONFIG>
): void
```

Updates the logger configuration at runtime.

**Parameters:**
- `config`: Partial logger configuration object

### updateRateLimitConfig()

```typescript
public updateRateLimitConfig(
  config: Partial<typeof import('../types').DEFAULT_RATE_LIMIT_CONFIG>
): void
```

Updates the rate limit configuration at runtime.

**Parameters:**
- `config`: Partial rate limit configuration object

### resetStatistics()

```typescript
public resetStatistics(): void
```

Resets all client statistics including request counts and error tracking.

---

## Live Streaming Methods

### getLiveCoins()

```typescript
public async getLiveCoins(params?: GetLiveCoinsParams): Promise<LiveCoin[]>
```

Retrieves currently live streaming coins with optional filtering and pagination.

**Parameters:**
- `params` (optional): `GetLiveCoinsParams` - Query parameters for filtering and pagination

**Returns:** Promise resolving to array of `LiveCoin` objects

**Example:**
```typescript
// Get all live streams
const liveCoins = await client.getLiveCoins();

// Get live streams with pagination
const liveCoins = await client.getLiveCoins({
  limit: 20,
  offset: 0,
  sort: 'participants',
  order: 'DESC',
  includeNsfw: false
});
```

### getActiveStreams()

```typescript
public async getActiveStreams(
  minParticipants: number = 1,
  params?: GetLiveCoinsParams
): Promise<LiveCoin[]>
```

Returns live streams with at least the specified number of participants.

**Parameters:**
- `minParticipants`: Minimum number of participants required (default: 1)
- `params` (optional): Additional query parameters

**Returns:** Promise resolving to array of active `LiveCoin` objects

**Example:**
```typescript
// Get streams with at least 10 participants
const activeStreams = await client.getActiveStreams(10);

// Combine with other filters
const activeStreams = await client.getActiveStreams(5, {
  limit: 15,
  sort: 'market_cap'
});
```

### getTopLiveStreams()

```typescript
public async getTopLiveStreams(
  limit: number = 10,
  params?: GetLiveCoinsParams
): Promise<LiveCoin[]>
```

Returns top live streams sorted by participant count in descending order.

**Parameters:**
- `limit`: Maximum number of streams to return (default: 10)
- `params` (optional): Additional query parameters

**Returns:** Promise resolving to array of top `LiveCoin` objects

**Example:**
```typescript
// Get top 5 streams by participants
const topStreams = await client.getTopLiveStreams(5);

// Get top streams with additional filtering
const topStreams = await client.getTopLiveStreams(10, {
  includeNsfw: false
});
```

### getTopActiveStreams()

```typescript
public async getTopActiveStreams(
  limit: number = 10,
  minParticipants: number = 1
): Promise<LiveCoin[]>
```

Combines active and top stream filtering to return the most popular active streams.

**Parameters:**
- `limit`: Maximum number of streams to return (default: 10)
- `minParticipants`: Minimum participants required (default: 1)

**Returns:** Promise resolving to array of top active `LiveCoin` objects

**Example:**
```typescript
// Get top 10 active streams with at least 5 participants
const topActive = await client.getTopActiveStreams(10, 5);
```

### getTitledStreams()

```typescript
public async getTitledStreams(
  limit: number = 10,
  params?: GetLiveCoinsParams
): Promise<LiveCoin[]>
```

Returns streams that have meaningful titles, indicating more active content.

**Parameters:**
- `limit`: Maximum number of streams to return (default: 10)
- `params` (optional): Additional query parameters

**Returns:** Promise resolving to array of titled `LiveCoin` objects

**Example:**
```typescript
// Get 15 streams with titles
const titledStreams = await client.getTitledStreams(15);
```

### getTitledActiveStreams()

```typescript
public async getTitledActiveStreams(
  limit: number = 10,
  minParticipants: number = 1,
  params?: GetLiveCoinsParams
): Promise<LiveCoin[]>
```

Returns active streams that have titles, combining content quality with activity metrics.

**Parameters:**
- `limit`: Maximum number of streams to return (default: 10)
- `minParticipants`: Minimum participants required (default: 1)
- `params` (optional): Additional query parameters

**Returns:** Promise resolving to array of titled active `LiveCoin` objects

**Example:**
```typescript
// Get titled streams with at least 3 participants
const titledActive = await client.getTitledActiveStreams(20, 3);
```

---

## Video Stream Analysis

### getLiveStreamInfo()

```typescript
public async getLiveStreamInfo(mintId: string): Promise<LiveStreamInfo | null>
```

Retrieves detailed live stream information for a specific token.

**Parameters:**
- `mintId`: The mint identifier of the token

**Returns:** Promise resolving to `LiveStreamInfo` object or null if no stream exists

**Example:**
```typescript
const streamInfo = await client.getLiveStreamInfo('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
if (streamInfo) {
  console.log(`Stream ${streamInfo.id} has ${streamInfo.numParticipants} participants`);
  console.log(`Title: ${streamInfo.title}`);
  console.log(`Mode: ${streamInfo.mode}`);
}
```

### isApprovedCreator()

```typescript
public async isApprovedCreator(mintId: string): Promise<boolean>
```

Checks if a creator is approved for streaming on the PumpFun platform.

**Parameters:**
- `mintId`: The mint identifier of the token

**Returns:** Promise resolving to boolean indicating approval status

**Example:**
```typescript
const isApproved = await client.isApprovedCreator('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
if (isApproved) {
  console.log('Creator is approved for streaming');
} else {
  console.log('Creator is not approved or stream not found');
}
```

### getLiveKitConnectionInfo()

```typescript
public async getLiveKitConnectionInfo(mintId: string): Promise<LiveKitConnectionInfo | null>
```

Retrieves LiveKit connection details for video streaming integration.

**Parameters:**
- `mintId`: The mint identifier of the token

**Returns:** Promise resolving to `LiveKitConnectionInfo` object or null if no stream exists

**Example:**
```typescript
const connectionInfo = await client.getLiveKitConnectionInfo('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
if (connectionInfo) {
  console.log(`Connect to room: ${connectionInfo.roomName}`);
  console.log(`WebSocket URL: ${connectionInfo.websocketUrl}`);
  console.log(`Available regions:`, connectionInfo.regions.map(r => r.region));
}
```

### getVideoStreamAnalysis()

```typescript
public async getVideoStreamAnalysis(mintId: string): Promise<VideoStreamAnalysis>
```

Provides comprehensive video stream analysis combining all video-related information.

**Parameters:**
- `mintId`: The mint identifier of the token

**Returns:** Promise resolving to `VideoStreamAnalysis` object with complete stream data

**Example:**
```typescript
const analysis = await client.getVideoStreamAnalysis('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
console.log(`Has active stream: ${analysis.hasActiveStream}`);
console.log(`Is approved creator: ${analysis.isApprovedCreator}`);
if (analysis.streamInfo) {
  console.log(`Stream quality score: ${analysis.streamInfo.downrankScore}`);
}
```

### joinLiveStream()

```typescript
public async joinLiveStream(mintId: string): Promise<JoinLiveStreamResponse>
```

Attempts to join an active live stream for a specific token.

**Parameters:**
- `mintId`: The mint identifier of the token to join

**Returns:** Promise resolving to `JoinLiveStreamResponse` with join attempt result

**Example:**
```typescript
const joinResult = await client.joinLiveStream('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
if (joinResult.success) {
  console.log('Successfully joined stream:', joinResult.message);
  // Use joinResult.connectionInfo for LiveKit connection
} else {
  console.log('Failed to join stream:', joinResult.message);
}
```

---

## Search and Filtering

### searchLiveStreams()

```typescript
public async searchLiveStreams(params: SearchLiveStreamsParams): Promise<StreamSearchResult[]>
```

Searches for live streams using keywords across multiple fields (names, symbols, descriptions, titles).

**Parameters:**
- `params`: `SearchLiveStreamsParams` - Search parameters including keyword and filters

**Returns:** Promise resolving to array of `StreamSearchResult` objects with relevance scoring

**Example:**
```typescript
// Basic keyword search
const results = await client.searchLiveStreams({
  keyword: 'defi',
  limit: 10
});

// Advanced search with filters
const results = await client.searchLiveStreams({
  keyword: 'gaming',
  minParticipants: 5,
  includeNsfw: false,
  sortBy: 'relevance',
  sortOrder: 'DESC',
  limit: 20
});

results.forEach(result => {
  console.log(`${result.name} - ${result.livestream_title} (relevance: ${result.relevanceScore})`);
});
```

### getStreamStatistics()

```typescript
public async getStreamStatistics(): Promise<StreamStatistics>
```

Calculates and returns aggregate statistics for live streaming data.

**Returns:** Promise resolving to `StreamStatistics` object with comprehensive metrics

**Example:**
```typescript
const stats = await client.getStreamStatistics();
console.log(`Total live streams: ${stats.totalStreams}`);
console.log(`Total participants: ${stats.totalParticipants}`);
console.log(`Average participants per stream: ${stats.averageParticipants}`);
console.log(`Streams with titles: ${stats.titledStreams}`);
console.log(`Market cap statistics:`, stats.marketCapStats);
```

### applyAdvancedFilters()

```typescript
public async applyAdvancedFilters(
  criteria: AdvancedFilterCriteria,
  params?: GetLiveCoinsParams
): Promise<AdvancedFilterResult>
```

Applies advanced filtering with custom criteria and complex filter functions.

**Parameters:**
- `criteria`: `AdvancedFilterCriteria` - Advanced filter configuration
- `params` (optional): Base parameters for stream fetching

**Returns:** Promise resolving to `AdvancedFilterResult` with filtered streams and metadata

**Example:**
```typescript
// Filter by market cap and participant count
const result = await client.applyAdvancedFilters({
  name: 'high-quality-streams',
  filters: [
    (coin) => coin.usd_market_cap > 100000,
    (coin) => coin.num_participants >= 10,
    (coin) => coin.livestream_title && coin.livestream_title.length > 10
  ],
  sortBy: 'usd_market_cap',
  sortOrder: 'DESC'
});

console.log(`Found ${result.filtered.length} high-quality streams`);
console.log(`Filtered from ${result.total} total streams`);
```

### applyCompoundFilter()

```typescript
public async applyCompoundFilter(
  query: CompoundFilterQuery,
  params?: GetLiveCoinsParams
): Promise<AdvancedFilterResult>
```

Applies compound filter queries with logical operators (AND/OR) across multiple filter groups.

**Parameters:**
- `query`: `CompoundFilterQuery` - Compound filter query with groups and operators
- `params` (optional): Base parameters for stream fetching

**Returns:** Promise resolving to `AdvancedFilterResult` with filtered streams and metadata

**Example:**
```typescript
// Complex query with AND/OR logic
const result = await client.applyCompoundFilter({
  operator: 'AND',
  groups: [
    {
      operator: 'OR',
      filters: [
        (coin) => coin.num_participants > 50,
        (coin) => coin.usd_market_cap > 1000000
      ]
    },
    {
      operator: 'AND',
      filters: [
        (coin) => coin.livestream_title && coin.livestream_title.length > 5,
        (coin) => !coin.name.toLowerCase().includes('test')
      ]
    }
  ]
});
```

### createCustomFilter()

```typescript
public createCustomFilter(filterFn: StreamFilterFunction, name?: string): StreamFilterFunction
```

Creates a named custom filter function for advanced filtering scenarios.

**Parameters:**
- `filterFn`: Custom filter function that takes a LiveCoin and returns boolean
- `name` (optional): Name for the filter function for debugging

**Returns:** Named custom filter function

**Example:**
```typescript
// Create custom filter for gaming streams
const gamingFilter = client.createCustomFilter(
  (coin) => {
    const gamingKeywords = ['game', 'play', 'gaming', 'crypto game'];
    const searchText = (coin.name + ' ' + coin.description + ' ' + (coin.livestream_title || '')).toLowerCase();
    return gamingKeywords.some(keyword => searchText.includes(keyword));
  },
  'gaming-streams'
);

// Use the filter
const gamingStreams = await client.applyAdvancedFilters({
  name: 'gaming-streams',
  filters: [gamingFilter]
});
```

### getFilterBuilders()

```typescript
public getFilterBuilders()
```

Returns predefined filter builders for common use cases like high-quality streams, trending streams, etc.

**Returns:** Object containing filter builder functions

**Example:**
```typescript
const builders = client.getFilterBuilders();

// Get high-quality streams (high engagement, good titles)
const highQualityFilter = builders.highQuality();
const highQualityStreams = await client.applyAdvancedFilters({
  name: 'high-quality',
  filters: [highQualityFilter]
});

// Get trending streams (high participant growth)
const trendingFilter = builders.trending();
const trendingStreams = await client.applyAdvancedFilters({
  name: 'trending',
  filters: [trendingFilter],
  sortBy: 'num_participants'
});
```

---

## Stream Clips

### getStreamClips()

```typescript
public async getStreamClips(
  mintId: string,
  clipType?: 'COMPLETE' | 'HIGHLIGHT',
  limit: number = 10
): Promise<StreamClip[]>
```

Retrieves recorded stream clips for a specific token with type filtering and pagination.

**Parameters:**
- `mintId`: The mint identifier of the token to get clips for
- `clipType` (optional): Filter by clip type ('COMPLETE' | 'HIGHLIGHT')
- `limit`: Maximum number of clips to return (default: 10)

**Returns:** Promise resolving to array of `StreamClip` objects

**Example:**
```typescript
// Get all clips
const allClips = await client.getStreamClips('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

// Get only complete clips
const completeClips = await client.getStreamClips('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'COMPLETE', 20);

// Get only highlight clips
const highlightClips = await client.getStreamClips('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'HIGHLIGHT', 15);
```

### filterStreamClips()

```typescript
public async filterStreamClips(
  mintId: string,
  params: ClipFilterParams
): Promise<ClipFilterResult>
```

Provides advanced filtering capabilities for stream clips with multiple criteria.

**Parameters:**
- `mintId`: The mint identifier of the token to filter clips for
- `params`: `ClipFilterParams` - Filtering and sorting parameters

**Returns:** Promise resolving to `ClipFilterResult` with filtered clips and metadata

**Example:**
```typescript
const result = await client.filterStreamClips('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', {
  clipType: 'HIGHLIGHT',
  minDuration: 30,
  maxDuration: 300,
  minViewCount: 100,
  sortBy: 'view_count',
  sortOrder: 'DESC',
  limit: 10
});

console.log(`Found ${result.clips.length} clips matching criteria`);
result.clips.forEach(clip => {
  console.log(`${clip.duration}s - ${clip.view_count} views - ${clip.clip_url}`);
});
```

### getCompleteClips()

```typescript
public async getCompleteClips(
  mintId: string,
  params?: Omit<ClipFilterParams, 'clipType'>
): Promise<ClipFilterResult>
```

Returns only complete stream clips with optional additional filtering.

**Parameters:**
- `mintId`: The mint identifier of the token to get complete clips for
- `params` (optional): Additional filtering parameters

**Returns:** Promise resolving to `ClipFilterResult` with complete clips

**Example:**
```typescript
const result = await client.getCompleteClips('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', {
  sortBy: 'duration',
  sortOrder: 'ASC',
  limit: 5
});
```

### getHighlightClips()

```typescript
public async getHighlightClips(
  mintId: string,
  params?: Omit<ClipFilterParams, 'clipType'>
): Promise<ClipFilterResult>
```

Returns only highlight stream clips with optional additional filtering.

**Parameters:**
- `mintId`: The mint identifier of the token to get highlight clips for
- `params` (optional): Additional filtering parameters

**Returns:** Promise resolving to `ClipFilterResult` with highlight clips

**Example:**
```typescript
const highlights = await client.getHighlightClips('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', {
  minViewCount: 1000,
  sortBy: 'view_count',
  sortOrder: 'DESC'
});
```

### getClipsByDuration()

```typescript
public async getClipsByDuration(
  mintId: string,
  sortOrder: 'ASC' | 'DESC' = 'DESC',
  params?: Omit<ClipFilterParams, 'sortBy' | 'sortOrder'>
): Promise<ClipFilterResult>
```

Returns stream clips sorted by duration.

**Parameters:**
- `mintId`: The mint identifier of the token to get clips for
- `sortOrder`: Sort order ('ASC' for shortest first, 'DESC' for longest first)
- `params` (optional): Additional filtering parameters

**Returns:** Promise resolving to `ClipFilterResult` with clips sorted by duration

**Example:**
```typescript
// Get longest clips first
const longestClips = await client.getClipsByDuration('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'DESC');

// Get shortest clips first
const shortestClips = await client.getClipsByDuration('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'ASC');
```

### getClipsByViewCount()

```typescript
public async getClipsByViewCount(
  mintId: string,
  sortOrder: 'ASC' | 'DESC' = 'DESC',
  params?: Omit<ClipFilterParams, 'sortBy' | 'sortOrder'>
): Promise<ClipFilterResult>
```

Returns stream clips sorted by view count.

**Parameters:**
- `mintId`: The mint identifier of the token to get clips for
- `sortOrder`: Sort order ('ASC' for lowest first, 'DESC' for highest first)
- `params` (optional): Additional filtering parameters

**Returns:** Promise resolving to `ClipFilterResult` with clips sorted by view count

**Example:**
```typescript
// Get most popular clips first
const popularClips = await client.getClipsByViewCount('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'DESC');
```

### getClipsByCreationDate()

```typescript
public async getClipsByCreationDate(
  mintId: string,
  sortOrder: 'ASC' | 'DESC' = 'DESC',
  params?: Omit<ClipFilterParams, 'sortBy' | 'sortOrder'>
): Promise<ClipFilterResult>
```

Returns stream clips sorted by creation date.

**Parameters:**
- `mintId`: The mint identifier of the token to get clips for
- `sortOrder`: Sort order ('ASC' for oldest first, 'DESC' for newest first)
- `params` (optional): Additional filtering parameters

**Returns:** Promise resolving to `ClipFilterResult` with clips sorted by creation date

**Example:**
```typescript
// Get newest clips first
const newestClips = await client.getClipsByCreationDate('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'DESC');
```

### getClipsByDurationRange()

```typescript
public async getClipsByDurationRange(
  mintId: string,
  minDuration: number,
  maxDuration: number,
  params?: Omit<ClipFilterParams, 'minDuration' | 'maxDuration'>
): Promise<ClipFilterResult>
```

Returns clips with duration within specified range.

**Parameters:**
- `mintId`: The mint identifier of the token to get clips for
- `minDuration`: Minimum duration in seconds
- `maxDuration`: Maximum duration in seconds
- `params` (optional): Additional filtering parameters

**Returns:** Promise resolving to `ClipFilterResult` with clips within duration range

**Example:**
```typescript
// Get clips between 1-5 minutes
const mediumClips = await client.getClipsByDurationRange('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 60, 300);
```

### getClipsByViewCountRange()

```typescript
public async getClipsByViewCountRange(
  mintId: string,
  minViewCount: number,
  maxViewCount: number,
  params?: Omit<ClipFilterParams, 'minViewCount' | 'maxViewCount'>
): Promise<ClipFilterResult>
```

Returns clips with view count within specified range.

**Parameters:**
- `mintId`: The mint identifier of the token to get clips for
- `minViewCount`: Minimum view count
- `maxViewCount`: Maximum view count
- `params` (optional): Additional filtering parameters

**Returns:** Promise resolving to `ClipFilterResult` with clips within view count range

**Example:**
```typescript
// Get clips with 100-1000 views
const mediumPopularityClips = await client.getClipsByViewCountRange('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 100, 1000);
```

### getClipsByDateRange()

```typescript
public async getClipsByDateRange(
  mintId: string,
  startDate: string,
  endDate: string,
  params?: Omit<ClipFilterParams, 'createdDateRange'>
): Promise<ClipFilterResult>
```

Returns clips created within specified date range.

**Parameters:**
- `mintId`: The mint identifier of the token to get clips for
- `startDate`: Start date in ISO format
- `endDate`: End date in ISO format
- `params` (optional): Additional filtering parameters

**Returns:** Promise resolving to `ClipFilterResult` with clips within date range

**Example:**
```typescript
// Get clips from last week
const lastWeekClips = await client.getClipsByDateRange(
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  '2023-12-01T00:00:00Z',
  '2023-12-07T23:59:59Z'
);
```

### getClipsWithUrls()

```typescript
public async getClipsWithUrls(
  mintId: string,
  params?: Omit<ClipFilterParams, 'hasUrl'>
): Promise<ClipFilterResult>
```

Returns clips that have URLs available for playback.

**Parameters:**
- `mintId`: The mint identifier of the token to get clips for
- `params` (optional): Additional filtering parameters

**Returns:** Promise resolving to `ClipFilterResult` with clips that have available URLs

**Example:**
```typescript
const playableClips = await client.getClipsWithUrls('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', {
  clipType: 'HIGHLIGHT',
  sortBy: 'view_count',
  sortOrder: 'DESC'
});
```

---

## Utility Methods

### validateJurisdiction()

```typescript
public async validateJurisdiction(): Promise<boolean>
```

Validates if the current jurisdiction is allowed to access the PumpFun API.

**Returns:** Promise resolving to boolean indicating jurisdiction validity

**Example:**
```typescript
const isValid = await client.validateJurisdiction();
if (isValid) {
  console.log('Jurisdiction is valid for API access');
} else {
  console.log('Jurisdiction is not supported');
}
```

### testConnection()

```typescript
public async testConnection(): Promise<boolean>
```

Tests the connection to the API by performing a simple jurisdiction validation.

**Returns:** Promise resolving to boolean indicating connection success

**Example:**
```typescript
const isConnected = await client.testConnection();
if (isConnected) {
  console.log('API connection is working');
} else {
  console.log('API connection failed');
}
```

### isClientInitialized()

```typescript
public isClientInitialized(): boolean
```

Checks if the client is properly initialized and ready for use.

**Returns:** Boolean indicating initialization status

### getBaseURL()

```typescript
public getBaseURL(): string
```

Returns the base URL used by the client.

**Returns:** Base URL string

### getTimeout()

```typescript
public getTimeout(): number
```

Returns the timeout configuration in milliseconds.

**Returns:** Timeout duration in milliseconds

### isRateLimited()

```typescript
public isRateLimited(): boolean
```

Checks if the client is currently rate limited.

**Returns:** Boolean indicating rate limit status

### getRateLimitBackoffRemaining()

```typescript
public getRateLimitBackoffRemaining(): number
```

Returns the remaining backoff time in milliseconds before the next request can be made.

**Returns:** Remaining backoff time in milliseconds

### attemptErrorRecovery()

```typescript
public attemptErrorRecovery(error: PumpFunError): boolean
```

Attempts automatic error recovery for specific error types.

**Parameters:**
- `error`: The error to attempt recovery from

**Returns:** Boolean indicating if recovery was successful

### getErrorDiagnostics()

```typescript
public getErrorDiagnostics(): {
  clientState: ClientState;
  configuration: ValidatedConfig;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  configSource: string;
  troubleshootingSuggestions: string[];
}
```

Returns comprehensive error diagnostics information for troubleshooting.

**Returns:** Diagnostics object with client state, configuration, and suggestions

### shutdown()

```typescript
public shutdown(): void
```

Gracefully shuts down the client and cleans up resources.

### toString()

```typescript
public toString(): string
```

Returns a string representation of the client for debugging.

### toJSON()

```typescript
public toJSON()
```

Returns a JSON representation of the client for debugging.

### getLogger()

```typescript
public getLogger(): Logger
```

Returns the logger instance for advanced logging scenarios.

### getRateLimiter()

```typescript
public getRateLimiter(): RateLimiter
```

Returns the rate limiter instance for advanced rate limit management.

---

## Types and Interfaces

### LiveCoin

Represents a coin with current live streaming data.

```typescript
interface LiveCoin {
  mint: string;                    // Unique identifier for the token
  name: string;                    // Token name
  symbol: string;                  // Token symbol
  description: string;             // Token description
  image_uri: string;               // Token image URL
  twitter?: string;                // Twitter handle (optional)
  telegram?: string;               // Telegram link (optional)
  creator: string;                 // Creator address
  created_timestamp: number;       // Creation timestamp
  market_cap: number;              // Market cap value
  usd_market_cap: number;          // USD market cap
  is_currently_live: boolean;      // Live streaming status
  livestream_title?: string;       // Stream title (optional)
  num_participants: number;        // Current participant count
  reply_count: number;             // Chat message count
  thumbnail: string;               // Stream thumbnail URL
  last_reply: number;              // Last activity timestamp
}
```

### LiveStreamInfo

Contains detailed video stream information.

```typescript
interface LiveStreamInfo {
  id: number;                      // Stream unique identifier
  supabaseId: number;              // Supabase database ID
  mintId: string;                  // Associated token mint
  creatorAddress: string;          // Stream creator address
  streamStartTimestamp: number;    // Stream start time
  numParticipants: number;         // Current participants
  maxParticipants: number;         // Maximum participants
  isLive: boolean;                 // Live status
  downrankScore: number;           // Quality/relevance score
  title: string;                   // Stream title
  mode: 'interactive' | 'broadcast'; // Stream mode
}
```

### LiveKitConnectionInfo

Provides WebRTC connection details for video streaming.

```typescript
interface LiveKitConnectionInfo {
  regions: LiveKitRegion[];         // Available server regions
  primaryServer: string;           // Primary server URL
  roomName: string;                // LiveKit room identifier
  mintId: string;                  // Associated token mint
  streamId: number;                // Stream identifier
  websocketUrl: string;            // WebSocket connection URL
  requiresAuthentication: boolean; // Authentication requirement
}
```

### StreamClip

Represents recorded stream segments.

```typescript
interface StreamClip {
  id: string;                      // Clip unique identifier
  mintId: string;                  // Associated token mint
  clipType: 'COMPLETE' | 'HIGHLIGHT'; // Clip type
  duration?: number;               // Clip duration in seconds (optional)
  view_count?: number;             // View count (optional)
  created_at?: string;             // Creation timestamp (optional)
  clip_url?: string;               // Clip playback URL (optional)
}
```

### VideoStreamAnalysis

Comprehensive video stream analysis combining all video-related information.

```typescript
interface VideoStreamAnalysis {
  hasActiveStream: boolean;        // Whether an active stream exists
  isApprovedCreator: boolean;      // Whether creator is approved
  streamInfo?: LiveStreamInfo;     // Stream information if available
  liveKitConnection?: LiveKitConnectionInfo; // LiveKit connection if available
  lastUpdated: string;             // Analysis timestamp
}
```

### StreamSearchResult

Search result with relevance scoring.

```typescript
interface StreamSearchResult extends LiveCoin {
  relevanceScore: number;          // Relevance score (0-1)
  matchFields: string[];           // Fields that matched the search
}
```

### StreamStatistics

Aggregate statistics for live streaming data.

```typescript
interface StreamStatistics {
  totalStreams: number;            // Total number of live streams
  totalParticipants: number;       // Total participants across all streams
  averageParticipants: number;     // Average participants per stream
  maxParticipants: number;         // Maximum participants in a single stream
  titledStreams: number;           // Number of streams with titles
  marketCapStats: {
    total: number;                 // Total market cap
    average: number;               // Average market cap
    median: number;                // Median market cap
  };
  participantDistribution: {
    1-10: number;                  // Streams with 1-10 participants
    11-50: number;                 // Streams with 11-50 participants
    51-100: number;                // Streams with 51-100 participants
    100+: number;                  // Streams with 100+ participants
  };
  lastUpdated: string;             // Statistics timestamp
}
```

---

## Error Handling

The client provides comprehensive error handling with specific error types:

### Error Types

- **PumpFunError**: Base error class for all PumpFun API errors
- **NetworkError**: Network connectivity issues
- **RateLimitError**: Rate limiting errors (429 status codes)
- **ServerError**: Internal server errors (5xx status codes)
- **ConfigurationError**: Invalid configuration
- **TimeoutError**: Request timeout errors
- **ValidationError**: Invalid input parameters

### Error Properties

All errors include the following properties:

```typescript
interface PumpFunError {
  code: string;                    // Error code
  message: string;                 // Human-readable error message
  statusCode: number;              // HTTP status code
  details?: Record<string, any>;   // Additional error details
  timestamp: string;               // Error timestamp
  isRetryable: boolean;            // Whether error can be retried
}
```

### Error Handling Example

```typescript
import { PumpFunAPIError, RateLimitError, NetworkError } from '@pumpfun/api-client';

async function handleAPIErrors() {
  try {
    const liveCoins = await client.getLiveCoins();
    return liveCoins;
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log('Rate limited. Wait before retrying.');
      console.log('Retry after:', error.retryAfter);
    } else if (error instanceof NetworkError) {
      console.log('Network error. Check your connection.');
    } else if (error instanceof PumpFunAPIError) {
      console.log(`API Error (${error.code}): ${error.message}`);
      if (error.isRetryable) {
        console.log('This error can be retried.');
      }
      // Log additional details if available
      if (error.details) {
        console.log('Additional details:', error.details);
      }
    } else {
      console.log('Unexpected error:', error);
    }
    throw error;
  }
}
```

---

## Configuration

### ClientConfig

Main client configuration interface.

```typescript
interface ClientConfig {
  baseURL?: string;                 // Custom API base URL
  timeout?: number;                 // Request timeout in ms (default: 10000)
  apiKey?: string;                  // API key for authentication
  authToken?: string;               // Auth token for authentication
  retryConfig?: Partial<RetryConfig>;
  rateLimitConfig?: Partial<RateLimitConfig>;
  loggerConfig?: Partial<LoggerConfig>;
}
```

### RetryConfig

Configuration for request retry logic.

```typescript
interface RetryConfig {
  maxRetries: number;              // Maximum retry attempts (default: 3)
  baseDelay: number;               // Base delay in ms (default: 1000)
  maxDelay: number;                // Maximum delay in ms (default: 30000)
  backoffFactor: number;           // Exponential backoff factor (default: 2)
  retryableStatusCodes: number[];  // HTTP codes to retry
  retryableErrors: string[];       // Error codes to retry
}
```

### RateLimitConfig

Configuration for rate limiting.

```typescript
interface RateLimitConfig {
  maxRequestsPerWindow: number;    // Max requests per window (default: 60)
  windowMs: number;                // Window duration in ms (default: 60000)
  enableRetryAfter: boolean;       // Use Retry-After header (default: true)
  enableSlidingWindow: boolean;    // Use sliding window (default: true)
  enableBurstProtection: boolean;  // Enable burst protection (default: true)
  maxBurst?: number;               // Maximum burst size
  enableBackoff: boolean;          // Enable adaptive backoff (default: true)
  baseBackoffMs: number;           // Base backoff delay (default: 1000)
  maxBackoffMs: number;            // Maximum backoff delay (default: 30000)
  backoffMultiplier: number;       // Backoff multiplier (default: 2)
}
```

### LoggerConfig

Configuration for logging.

```typescript
interface LoggerConfig {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  enableConsole: boolean;          // Enable console logging (default: true)
  enableColors: boolean;           // Enable colored output (default: true)
  enableTimestamp: boolean;        // Enable timestamps (default: true)
  enableFileLogging: boolean;      // Enable file logging (default: false)
  logFilePath?: string;            // Path for log files
  maxFileSize?: number;            // Maximum log file size in bytes
  maxFiles?: number;               // Maximum number of log files to keep
}
```

---

## Usage Examples

### Basic Usage

```typescript
import { PumpFunAPIClient } from '@pumpfun/api-client';

const client = new PumpFunAPIClient();

// Get live streams
const liveStreams = await client.getLiveCoins({ limit: 10 });
console.log(`Found ${liveStreams.length} live streams`);

// Analyze a specific stream
const analysis = await client.getVideoStreamAnalysis('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
console.log('Stream analysis:', analysis);
```

### Advanced Configuration

```typescript
const client = new PumpFunAPIClient({
  baseURL: 'https://custom-api.pump.fun',
  timeout: 30000,
  retryConfig: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffFactor: 2
  },
  rateLimitConfig: {
    maxRequestsPerWindow: 50,
    enableBackoff: true
  },
  loggerConfig: {
    level: 'DEBUG',
    enableConsole: true,
    enableColors: true
  }
});
```

### Error Handling and Retry Logic

```typescript
async function robustAPIcall() {
  try {
    const result = await client.getLiveCoins({ limit: 20 });
    return result;
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log('Rate limited. Waiting...');
      await new Promise(resolve => setTimeout(resolve, error.retryAfter));
      return robustAPIcall(); // Retry
    } else if (error.isRetryable) {
      console.log('Retrying due to retryable error');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return robustAPIcall();
    }
    throw error;
  }
}
```

### Stream Filtering and Search

```typescript
// Search for specific streams
const gamingStreams = await client.searchLiveStreams({
  keyword: 'gaming',
  minParticipants: 10,
  sortBy: 'participants',
  sortOrder: 'DESC'
});

// Advanced filtering
const highQualityStreams = await client.applyAdvancedFilters({
  name: 'premium-streams',
  filters: [
    (coin) => coin.num_participants >= 20,
    (coin) => coin.livestream_title && coin.livestream_title.length > 10,
    (coin) => coin.usd_market_cap > 50000
  ],
  sortBy: 'num_participants',
  sortOrder: 'DESC'
});
```

### Working with Stream Clips

```typescript
// Get popular highlight clips
const popularHighlights = await client.filterStreamClips('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', {
  clipType: 'HIGHLIGHT',
  minViewCount: 1000,
  sortBy: 'view_count',
  sortOrder: 'DESC',
  limit: 10
});

// Get clips from specific duration range
const mediumClips = await client.getClipsByDurationRange(
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  60,  // 1 minute minimum
  300  // 5 minutes maximum
);
```

---

## Best Practices

1. **Always handle errors appropriately** with try-catch blocks
2. **Implement retry logic** for retryable errors using the built-in retry mechanism
3. **Monitor rate limits** and implement backoff when needed
4. **Use appropriate filtering** to reduce API calls and improve performance
5. **Validate input parameters** before making API calls
6. **Log errors and debugging information** for troubleshooting
7. **Use the statistics methods** to monitor client performance
8. **Gracefully handle network issues** with proper error recovery
9. **Optimize requests** by using pagination and filtering parameters
10. **Cache results** when appropriate to reduce API calls

---

## Support

For additional support:
- Check the [GitHub Issues](https://github.com/pumpfun/pumpfun-api/issues)
- Review the [troubleshooting guide](./troubleshooting.md)
- Join our [Discord community](https://discord.gg/pumpfun)