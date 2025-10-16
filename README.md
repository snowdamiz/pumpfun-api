# @pumpfun/api-client

[![npm version](https://badge.fury.io/js/%40pumpfun%2Fapi-client.svg)](https://badge.fury.io/js/%40pumpfun%2Fapi-client)
[![Build Status](https://github.com/pumpfun/pumpfun-api/workflows/CI/badge.svg)](https://github.com/pumpfun/pumpfun-api/actions)
[![codecov](https://codecov.io/gh/pumpfun/pumpfun-api/branch/main/graph/badge.svg)](https://codecov.io/gh/pumpfun/pumpfun-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript client library for accessing PumpFun's streaming data API, including live stream discovery, video stream analysis with LiveKit WebRTC integration, comprehensive search capabilities, and robust error handling.

## 📚 [Complete API Documentation](./docs/api.md)

For detailed API reference, advanced usage, and all available methods, see the [complete API documentation](./docs/api.md).

## Features

- 🎥 **Live Stream Discovery**: Find currently streaming coins with filtering and pagination
- 🔗 **LiveKit WebRTC Integration**: Direct video streaming with automatic connection management
- 🔍 **Advanced Search**: Search streams by keywords with relevance scoring
- 📹 **Stream Clips**: Access recorded segments with filtering by duration, views, and dates
- 🛡️ **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🔄 **Retry Logic**: Built-in retry mechanisms with exponential backoff
- 🚦 **Rate Limiting**: Automatic rate limiting to respect API limits
- 📊 **Error Handling**: Comprehensive error handling with specific error types
- ⚡ **Performance**: Optimized for speed and minimal bundle size
- 📈 **Statistics**: Monitor API usage and connection statistics

## Installation

```bash
npm install @pumpfun/api-client
# or
yarn add @pumpfun/api-client
# or
pnpm add @pumpfun/api-client
```

## Quick Start

### 1. Initialize the Client

```typescript
import { PumpFunAPIClient } from '@pumpfun/api-client';

// Create a client with default configuration
const client = new PumpFunAPIClient();

// Or with custom configuration
const client = new PumpFunAPIClient({
  timeout: 15000,
  retryConfig: {
    maxRetries: 5,
    baseDelay: 2000
  },
  rateLimitConfig: {
    maxRequestsPerWindow: 50,
    enableBackoff: true
  }
});
```

### 2. Get Currently Live Streams

```typescript
async function getLiveStreams() {
  try {
    const liveCoins = await client.getLiveCoins({
      limit: 10,
      sort: 'participants',
      order: 'DESC',
      includeNsfw: false
    });

    console.log(`Found ${liveCoins.length} live streams:`);
    liveCoins.forEach((coin, index) => {
      console.log(`${index + 1}. ${coin.name} (${coin.symbol})`);
      console.log(`   📺 ${coin.livestream_title || 'No title'}`);
      console.log(`   👥 ${coin.num_participants} participants`);
      console.log(`   💰 $${coin.usd_market_cap.toFixed(2)} market cap`);
    });
  } catch (error) {
    console.error('Failed to get live streams:', error);
  }
}
```

### 3. Search and Filter Streams

```typescript
// Search for specific streams
async function searchStreams() {
  try {
    const gamingStreams = await client.searchLiveStreams({
      keyword: 'gaming',
      minParticipants: 5,
      limit: 20,
      sortBy: 'relevance',
      sortOrder: 'DESC'
    });

    console.log(`Found ${gamingStreams.length} gaming streams`);
    gamingStreams.forEach(stream => {
      console.log(`${stream.name} - Relevance: ${stream.relevanceScore}`);
    });
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Get top active streams
async function getTopStreams() {
  try {
    const topStreams = await client.getTopActiveStreams(10, 5); // limit 10, min 5 participants

    console.log('Top active streams:');
    topStreams.forEach(stream => {
      console.log(`${stream.name}: ${stream.num_participants} participants`);
    });
  } catch (error) {
    console.error('Failed to get top streams:', error);
  }
}
```

### 4. Analyze Video Streams

```typescript
async function analyzeVideoStream(mintId: string) {
  try {
    const analysis = await client.getVideoStreamAnalysis(mintId);

    console.log('Video Stream Analysis:');
    console.log(`   🔴 Active: ${analysis.hasActiveStream ? 'YES' : 'NO'}`);
    console.log(`   ✅ Creator Approved: ${analysis.isApprovedCreator ? 'YES' : 'NO'}`);

    if (analysis.streamInfo) {
      console.log(`   📺 Stream ID: ${analysis.streamInfo.id}`);
      console.log(`   👥 Participants: ${analysis.streamInfo.numParticipants}`);
      console.log(`   🎯 Mode: ${analysis.streamInfo.mode}`);
      console.log(`   📊 Quality Score: ${analysis.streamInfo.downrankScore}`);
    }

    if (analysis.liveKitConnection) {
      console.log(`   🔗 Room: ${analysis.liveKitConnection.roomName}`);
      console.log(`   🌐 WebSocket: ${analysis.liveKitConnection.websocketUrl}`);
      console.log(`   🔒 Auth Required: ${analysis.liveKitConnection.requiresAuthentication}`);
    }
  } catch (error) {
    console.error('Failed to analyze video stream:', error);
  }
}
```

### 5. LiveKit WebRTC Integration (Built-in)

```typescript
import { PumpFunAPIClient } from '@pumpfun/api-client';

// Install LiveKit client: npm install @livekit/client

async function connectToLiveStream(mintId: string) {
  try {
    const connection = await client.connectToLiveStream(mintId, {
      videoElement: document.getElementById('video') as HTMLVideoElement,
      audioElement: document.getElementById('audio') as HTMLAudioElement,
      autoPlay: true,
      videoEnabled: true,
      audioEnabled: true,
      onConnected: (connection) => {
        console.log('✅ Connected to stream:', {
          connectionId: connection.id,
          roomName: connection.roomName,
          hasVideo: !!connection.videoTrack,
          hasAudio: !!connection.audioTrack,
        });
      },
      onError: (error, connection) => {
        console.error('❌ Connection error:', error.message);
      },
      onDisconnected: (connection) => {
        console.log('🔌 Disconnected from stream');
      }
    });

    // Control the stream programmatically
    await connection.muteAudio();
    await connection.unmuteVideo();

    // Get connection statistics
    const stats = await connection.getStats();
    console.log('📊 Connection stats:', stats);

    // Disconnect when done
    setTimeout(() => connection.disconnect(), 300000); // 5 minutes

  } catch (error) {
    if (error.message.includes('LiveKit SDK')) {
      console.error('Please install LiveKit: npm install @livekit/client');
    }
    console.error('Failed to connect:', error);
  }
}
```

### 6. Stream Clips Management

```typescript
// Get popular highlight clips
async function getPopularHighlights(mintId: string) {
  try {
    const highlights = await client.filterStreamClips(mintId, {
      clipType: 'HIGHLIGHT',
      minViewCount: 1000,
      minDuration: 30,
      maxDuration: 300,
      sortBy: 'view_count',
      sortOrder: 'DESC',
      limit: 10
    });

    console.log(`Found ${highlights.clips.length} popular highlights:`);
    highlights.clips.forEach(clip => {
      console.log(`${clip.duration}s - ${clip.view_count} views - ${clip.clip_url}`);
    });
  } catch (error) {
    console.error('Failed to get highlights:', error);
  }
}

// Get clips by duration range
async function getMediumLengthClips(mintId: string) {
  try {
    const clips = await client.getClipsByDurationRange(
      mintId,
      60,    // 1 minute minimum
      300    // 5 minutes maximum
    );

    console.log(`Found ${clips.clips.length} medium-length clips`);
  } catch (error) {
    console.error('Failed to get clips by duration:', error);
  }
}
```

## Essential API Methods

### Live Streaming

| Method | Description | Example |
|--------|-------------|---------|
| `getLiveCoins(params?)` | Get currently live streams with filtering | `client.getLiveCoins({ limit: 10, sort: 'participants' })` |
| `getActiveStreams(minParticipants, params?)` | Get streams with minimum participants | `client.getActiveStreams(5, { limit: 20 })` |
| `getTopLiveStreams(limit?, params?)` | Get top streams by participants | `client.getTopLiveStreams(10)` |
| `getTitledStreams(limit?, params?)` | Get streams with meaningful titles | `client.getTitledStreams(15)` |

### Video Stream Analysis

| Method | Description | Example |
|--------|-------------|---------|
| `getVideoStreamAnalysis(mintId)` | Complete stream analysis | `client.getVideoStreamAnalysis('7xKX...')` |
| `getLiveStreamInfo(mintId)` | Get detailed stream info | `client.getLiveStreamInfo('7xKX...')` |
| `isApprovedCreator(mintId)` | Check creator approval status | `client.isApprovedCreator('7xKX...')` |
| `getLiveKitConnectionInfo(mintId)` | Get WebRTC connection details | `client.getLiveKitConnectionInfo('7xKX...')` |

### LiveKit WebRTC Integration

| Method | Description | Example |
|--------|-------------|---------|
| `connectToLiveStream(mintId, options?)` | **Direct WebRTC connection** | See example above |
| `joinLiveStream(mintId)` | Join a stream as participant | `client.joinLiveStream('7xKX...')` |

### Search & Filtering

| Method | Description | Example |
|--------|-------------|---------|
| `searchLiveStreams(params)` | Search streams with relevance scoring | `client.searchLiveStreams({ keyword: 'gaming', minParticipants: 5 })` |
| `applyAdvancedFilters(criteria, params?)` | Custom filter functions | `client.applyAdvancedFilters({ name: 'high-quality', filters: [fn] })` |
| `getStreamStatistics()` | Get aggregate statistics | `client.getStreamStatistics()` |

### Stream Clips

| Method | Description | Example |
|--------|-------------|---------|
| `getStreamClips(mintId, clipType?, limit?)` | Get basic clips list | `client.getStreamClips('7xKX...', 'HIGHLIGHT', 20)` |
| `filterStreamClips(mintId, params)` | Advanced clip filtering | `client.filterStreamClips('7xKX...', { minDuration: 30, sortBy: 'view_count' })` |
| `getClipsByDurationRange(mintId, min, max, params?)` | Clips by duration range | `client.getClipsByDurationRange('7xKX...', 60, 300)` |
| `getClipsByViewCount(mintId, order?, params?)` | Clips sorted by views | `client.getClipsByViewCount('7xKX...', 'DESC')` |

### Utility

| Method | Description | Example |
|--------|-------------|---------|
| `validateJurisdiction()` | Check API access | `await client.validateJurisdiction()` |
| `testConnection()` | Test API connectivity | `await client.testConnection()` |
| `getStatistics()` | Client usage statistics | `client.getStatistics()` |
| `getState()` | Current client state | `client.getState()` |

### Configuration

| Method | Description | Example |
|--------|-------------|---------|
| `getConfiguration()` | Get current config | `client.getConfiguration()` |
| `updateLoggerConfig(config)` | Update logging | `client.updateLoggerConfig({ level: 'DEBUG' })` |
| `updateRateLimitConfig(config)` | Update rate limiting | `client.updateRateLimitConfig({ maxRequestsPerWindow: 100 })` |
| `resetStatistics()` | Reset usage stats | `client.resetStatistics()` |

## Key Types

### LiveCoin
```typescript
interface LiveCoin {
  mint: string;                    // Token identifier
  name: string;                    // Token name
  symbol: string;                  // Token symbol
  description: string;             // Token description
  image_uri: string;               // Token image URL
  twitter?: string;                // Twitter handle
  telegram?: string;               // Telegram link
  creator: string;                 // Creator address
  created_timestamp: number;       // Creation time
  market_cap: number;              // Market cap value
  usd_market_cap: number;          // USD market cap
  is_currently_live: boolean;      // Live streaming status
  livestream_title?: string;       // Stream title
  num_participants: number;        // Current participants
  reply_count: number;             // Chat message count
  thumbnail: string;               // Stream thumbnail URL
  last_reply: number;              // Last activity timestamp
}
```

### VideoStreamAnalysis
```typescript
interface VideoStreamAnalysis {
  hasActiveStream: boolean;        // Whether an active stream exists
  isApprovedCreator: boolean;      // Whether creator is approved
  streamInfo?: LiveStreamInfo;     // Stream information if available
  liveKitConnection?: LiveKitConnectionInfo; // LiveKit connection if available
  lastUpdated: string;             // Analysis timestamp
}
```

### LiveKitConnectionOptions
```typescript
interface LiveKitConnectionOptions {
  videoElement?: HTMLVideoElement;         // Video element to attach stream
  audioElement?: HTMLAudioElement;         // Audio element to attach stream
  autoPlay?: boolean;                     // Auto-play media (default: true)
  videoEnabled?: boolean;                 // Enable video track (default: true)
  audioEnabled?: boolean;                 // Enable audio track (default: true)
  muted?: boolean;                        // Start muted (default: false)
  maxReconnectAttempts?: number;          // Max reconnection attempts
  reconnectDelayMs?: number;              // Delay between reconnection attempts

  // Event callbacks
  onConnected?: (connection: LiveStreamConnection) => void;
  onDisconnected?: (connection: LiveStreamConnection) => void;
  onError?: (error: Error, connection: LiveStreamConnection) => void;
  onStateChange?: (state: ConnectionState, connection: LiveStreamConnection) => void;
}
```

## Configuration

### Client Configuration
```typescript
interface ClientConfig {
  baseURL?: string;           // Custom API base URL
  timeout?: number;           // Request timeout in ms (default: 10000)
  apiKey?: string;            // API key for authentication
  authToken?: string;         // Auth token for authentication
  retryConfig?: Partial<RetryConfig>;
  rateLimitConfig?: Partial<RateLimitConfig>;
  loggerConfig?: Partial<LoggerConfig>;
}
```

### Common Configuration Options
```typescript
const client = new PumpFunAPIClient({
  timeout: 30000,                          // 30 second timeout
  retryConfig: {
    maxRetries: 5,                        // Retry up to 5 times
    baseDelay: 2000,                      // Start with 2 second delay
    maxDelay: 30000,                      // Max 30 second delay
    backoffFactor: 2                      // Exponential backoff
  },
  rateLimitConfig: {
    maxRequestsPerWindow: 50,             // 50 requests per minute
    enableBackoff: true,                  // Enable adaptive backoff
    enableBurstProtection: true           // Enable burst protection
  },
  loggerConfig: {
    level: 'INFO',                        // Log level
    enableConsole: true,                  // Console logging
    enableColors: true                    // Colored output
  }
});
```

## Error Handling

The client provides comprehensive error handling with specific error types:

### Error Types
- **PumpFunError**: Base error class for all PumpFun API errors
- **RateLimitError**: Rate limiting errors (429 status codes)
- **NetworkError**: Network connectivity issues
- **ServerError**: Internal server errors (5xx status codes)
- **ConfigurationError**: Invalid configuration
- **TimeoutError**: Request timeout errors
- **ValidationError**: Invalid input parameters

### Error Handling Example
```typescript
import { PumpFunAPIError, RateLimitError, NetworkError } from '@pumpfun/api-client';

async function robustAPICall() {
  try {
    const result = await client.getLiveCoins();
    return result;
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log('Rate limited. Waiting before retry...');
      console.log('Retry after:', error.retryAfter);
      await new Promise(resolve => setTimeout(resolve, error.retryAfter));
      return robustAPICall(); // Retry after rate limit
    } else if (error instanceof NetworkError) {
      console.log('Network error. Check your connection.');
    } else if (error instanceof PumpFunAPIError) {
      console.log(`API Error (${error.code}): ${error.message}`);
      if (error.isRetryable) {
        console.log('This error can be retried.');
      }
      if (error.details) {
        console.log('Additional details:', error.details);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

### Automatic Error Recovery
```typescript
// The client can automatically attempt recovery for certain errors
if (error.isRetryable) {
  const recovered = client.attemptErrorRecovery(error);
  if (recovered) {
    console.log('Automatic recovery successful');
    return robustAPICall();
  }
}
```

## Advanced Usage

### Building a Live Stream Dashboard
```typescript
async function buildDashboard() {
  try {
    const [liveStreams, stats] = await Promise.all([
      client.getLiveCoins({ limit: 20, sort: 'participants' }),
      client.getStreamStatistics()
    ]);

    return {
      streams: liveStreams,
      statistics: stats,
      clientStats: client.getStatistics(),
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Dashboard update failed:', error);
    return null;
  }
}

// Update dashboard every 30 seconds
setInterval(buildDashboard, 30000);
```

### Advanced Filtering and Search
```typescript
// Create custom filters for specific use cases
const gamingFilter = client.createCustomFilter(
  (coin) => {
    const gamingKeywords = ['game', 'play', 'gaming', 'crypto game'];
    const searchText = (coin.name + ' ' + coin.description + ' ' + (coin.livestream_title || '')).toLowerCase();
    return gamingKeywords.some(keyword => searchText.includes(keyword));
  },
  'gaming-streams'
);

// Apply multiple filters
const highQualityGamingStreams = await client.applyAdvancedFilters({
  name: 'premium-gaming',
  filters: [
    gamingFilter,
    (coin) => coin.num_participants >= 10,
    (coin) => coin.livestream_title && coin.livestream_title.length > 10,
    (coin) => coin.usd_market_cap > 50000
  ],
  sortBy: 'num_participants',
  sortOrder: 'DESC'
});
```

### Batch Operations with Rate Limiting
```typescript
async function analyzeMultipleStreams(mintIds: string[]) {
  const results = [];
  const batchSize = 5; // Process 5 at a time

  for (let i = 0; i < mintIds.length; i += batchSize) {
    const batch = mintIds.slice(i, i + batchSize);

    const batchPromises = batch.map(async (mintId) => {
      try {
        const analysis = await client.getVideoStreamAnalysis(mintId);
        return { mintId, success: true, data: analysis };
      } catch (error) {
        return { mintId, success: false, error: error.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Respect rate limits between batches
    if (i + batchSize < mintIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

### Monitoring and Statistics
```typescript
// Monitor client performance
function monitorClient() {
  setInterval(() => {
    const stats = client.getStatistics();
    const state = client.getState();

    console.log('📊 Client Statistics:');
    console.log(`  Requests: ${stats.requestCount}`);
    console.log(`  Success Rate: ${stats.successRate.toFixed(2)}%`);
    console.log(`  Error Rate: ${stats.errorRate.toFixed(2)}%`);
    console.log(`  Rate Limited: ${client.isRateLimited()}`);

    if (client.isRateLimited()) {
      const backoffMs = client.getRateLimitBackoffRemaining();
      console.log(`  Backoff remaining: ${backoffMs}ms`);
    }
  }, 30000); // Every 30 seconds
}
```

## Best Practices

1. **Always handle errors appropriately** with try-catch blocks and specific error types
2. **Monitor rate limits** using `client.isRateLimited()` and respect backoff periods
3. **Use appropriate filtering** to reduce API calls and improve performance
4. **Implement retry logic** for retryable errors using the built-in retry mechanism
5. **Validate input parameters** before making API calls
6. **Log errors and debugging information** for troubleshooting
7. **Use statistics methods** to monitor client performance and usage
8. **Batch operations** when possible to respect rate limits
9. **Optimize requests** by using pagination and filtering parameters
10. **Test connectivity** with `client.testConnection()` before critical operations

## Dependencies

### Required Dependencies
- `axios` - HTTP client for API requests
- `@livekit/client` - WebRTC video streaming (optional, for LiveKit features)

### Optional Dependencies
- TypeScript types are included in the package

## Browser Support

This package supports all modern browsers:
- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

**Note:** LiveKit WebRTC features require a compatible browser environment.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development

```bash
# Clone the repository
git clone https://github.com/pumpfun/pumpfun-api.git
cd pumpfun-api

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build the package
npm run build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Resources

- 📖 **[Complete API Documentation](./docs/api.md)** - Comprehensive API reference
- 🐛 [Issues](https://github.com/pumpfun/pumpfun-api/issues) - Report bugs and request features
- 💬 [Discord](https://discord.gg/pumpfun) - Community support
- 📧 [Email](mailto:support@pump.fun) - Direct support

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.