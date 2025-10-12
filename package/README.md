# @pumpfun/api-client

[![npm version](https://badge.fury.io/js/%40pumpfun%2Fapi-client.svg)](https://badge.fury.io/js/%40pumpfun%2Fapi-client)
[![Build Status](https://github.com/pumpfun/pumpfun-api/workflows/CI/badge.svg)](https://github.com/pumpfun/pumpfun-api/actions)
[![codecov](https://codecov.io/gh/pumpfun/pumpfun-api/branch/main/graph/badge.svg)](https://codecov.io/gh/pumpfun/pumpfun-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript client library for accessing PumpFun's streaming data API, including live stream discovery, video stream analysis with LiveKit integration, and comprehensive error handling.

## Features

- 🎥 **Live Stream Discovery**: Find currently streaming coins with filtering and pagination
- 🔗 **LiveKit Integration**: Connect to video streams using WebRTC
- 🔍 **Search & Filtering**: Advanced search across streams with various criteria
- 📹 **Stream Clips**: Access recorded stream segments and highlights
- 🛡️ **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🔄 **Retry Logic**: Built-in retry mechanisms with exponential backoff
- 🚦 **Rate Limiting**: Automatic rate limiting to respect API limits
- 📊 **Error Handling**: Comprehensive error handling with user-friendly messages
- ⚡ **Performance**: Optimized for speed and minimal bundle size

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
  }
});
```

### 2. Get Currently Live Streams

```typescript
async function getLiveStreams() {
  try {
    const liveCoins = await client.getLiveCoins({ limit: 10 });

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

### 3. Analyze Video Streams

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
    }

    if (analysis.liveKitConnection) {
      console.log(`   🔗 Room: ${analysis.liveKitConnection.roomName}`);
      console.log(`   🌐 WebSocket: ${analysis.liveKitConnection.websocketUrl}`);
    }
  } catch (error) {
    console.error('Failed to analyze video stream:', error);
  }
}
```

### 4. Connect to Live Video Streams

```typescript
async function connectToVideoStream(mintId: string) {
  try {
    // Get LiveKit connection info
    const connectionInfo = await client.getLiveKitConnectionInfo(mintId);

    if (!connectionInfo) {
      console.log('No video stream available for this token');
      return;
    }

    // Use the connection info with LiveKit SDK
    // This is pseudocode - actual implementation depends on your LiveKit client
    const room = await connectToLiveKitRoom({
      url: connectionInfo.websocketUrl,
      roomName: connectionInfo.roomName,
      token: await getLiveKitToken(connectionInfo.roomName)
    });

    console.log(`Connected to room: ${connectionInfo.roomName}`);

    // Handle video streams, audio, etc.
    room.on('trackSubscribed', (track, participant) => {
      if (track.kind === 'video') {
        // Attach video element
        document.getElementById('video').srcObject = track.mediaStream;
      }
    });

  } catch (error) {
    console.error('Failed to connect to video stream:', error);
  }
}
```

## API Reference

### PumpFunAPIClient

The main client class for interacting with the PumpFun API.

#### Constructor

```typescript
constructor(config?: ClientConfig)
```

#### Methods

##### `getLiveCoins(options?: LiveCoinsOptions): Promise<LiveCoin[]>`

Get currently live streaming coins with optional filtering and pagination.

**Parameters:**
- `options.limit?: number` - Maximum number of results (default: 10, max: 100)
- `options.offset?: number` - Number of items to skip (default: 0)
- `options.sort?: 'currently_live' | 'market_cap' | 'participants'` - Sort field (default: 'currently_live')
- `options.order?: 'ASC' | 'DESC'` - Sort order (default: 'DESC')
- `options.includeNsfw?: boolean` - Include NSFW content (default: false)

**Returns:** Promise resolving to array of LiveCoin objects

##### `getVideoStreamAnalysis(mintId: string): Promise<VideoStreamAnalysis>`

Get comprehensive video stream analysis for a specific token.

**Parameters:**
- `mintId: string` - The mint ID of the token

**Returns:** Promise resolving to VideoStreamAnalysis object

##### `searchLiveStreams(keyword: string, options?: SearchOptions): Promise<LiveCoin[]>`

Search live streams by keyword across names, symbols, descriptions, and titles.

**Parameters:**
- `keyword: string` - Search term
- `options.limit?: number` - Maximum results (default: 20)
- `options.offset?: number` - Items to skip (default: 0)

**Returns:** Promise resolving to array of matching LiveCoin objects

##### `getStreamClips(mintId: string, clipType?: 'COMPLETE' | 'HIGHLIGHT', limit?: number): Promise<StreamClip[]>`

Get recorded stream clips for a specific token.

**Parameters:**
- `mintId: string` - The mint ID of the token
- `clipType?: 'COMPLETE' | 'HIGHLIGHT'` - Type of clips to retrieve (default: 'COMPLETE')
- `limit?: number` - Maximum number of clips (default: 20, max: 100)

**Returns:** Promise resolving to array of StreamClip objects

##### `validateJurisdiction(): Promise<JurisdictionResponse>`

Validate if the current jurisdiction is supported.

**Returns:** Promise resolving to jurisdiction validation result

##### `getSolPrice(): Promise<number>`

Get current SOL price in USD.

**Returns:** Promise resolving to current SOL price

### Type Definitions

#### LiveCoin

```typescript
interface LiveCoin {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  twitter?: string;
  telegram?: string;
  creator: string;
  created_timestamp: number;
  market_cap: number;
  usd_market_cap: number;
  is_currently_live: boolean;
  livestream_title?: string;
  num_participants: number;
  reply_count: number;
  thumbnail: string;
  last_reply: number;
}
```

#### VideoStreamAnalysis

```typescript
interface VideoStreamAnalysis {
  hasActiveStream: boolean;
  isApprovedCreator: boolean;
  streamInfo?: LiveStreamInfo;
  liveKitConnection?: LiveKitConnectionInfo;
}
```

#### LiveKitConnectionInfo

```typescript
interface LiveKitConnectionInfo {
  regions: LiveKitRegion[];
  primaryServer: string;
  roomName: string;
  mintId: string;
  streamId: number;
  websocketUrl: string;
  requiresAuthentication: boolean;
}
```

## Configuration

### Client Configuration

```typescript
interface ClientConfig {
  baseURL?: string;           // Custom API base URL
  timeout?: number;           // Request timeout in ms (default: 10000)
  retryConfig?: Partial<RetryConfig>;
  rateLimitConfig?: Partial<RateLimitConfig>;
  loggerConfig?: Partial<LoggerConfig>;
}
```

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries: number;        // Maximum retry attempts (default: 3)
  baseDelay: number;         // Base delay in ms (default: 1000)
  maxDelay: number;          // Maximum delay in ms (default: 30000)
  backoffFactor: number;     // Exponential backoff factor (default: 2)
  retryableStatusCodes: number[];  // HTTP codes to retry
  retryableErrors: string[];        // Error codes to retry
}
```

### Rate Limit Configuration

```typescript
interface RateLimitConfig {
  maxRequestsPerWindow: number;    // Max requests per window (default: 60)
  windowMs: number;                // Window duration in ms (default: 60000)
  enableRetryAfter: boolean;       // Use Retry-After header (default: true)
  enableSlidingWindow: boolean;    // Use sliding window (default: true)
  enableBurstProtection: boolean;  // Enable burst protection (default: true)
  enableBackoff: boolean;          // Enable adaptive backoff (default: true)
}
```

## Error Handling

The client provides comprehensive error handling with specific error types:

```typescript
import { PumpFunAPIError, RateLimitError, NetworkError, ValidationError } from '@pumpfun/api-client';

async function robustAPICall() {
  try {
    const result = await client.getLiveCoins();
    return result;
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log('Rate limited. Waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, error.retryAfter));
      return robustAPICall(); // Retry after rate limit
    } else if (error instanceof PumpFunAPIError) {
      console.error(`API Error (${error.statusCode}): ${error.message}`);
      if (error.isRetryable) {
        console.log('This error can be retried');
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

## Advanced Usage

### Custom Configuration

```typescript
const client = new PumpFunAPIClient({
  baseURL: 'https://custom-api.pump.fun',
  timeout: 30000,
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  },
  rateLimitConfig: {
    maxRequestsPerWindow: 50,
    windowMs: 60000,
    enableBackoff: true
  },
  loggerConfig: {
    level: 'DEBUG',
    enableConsole: true,
    enableColors: true
  }
});
```

### Batch Operations

```typescript
async function analyzeMultipleStreams(mintIds: string[]) {
  const results = [];

  for (const mintId of mintIds) {
    try {
      const analysis = await client.getVideoStreamAnalysis(mintId);
      results.push({ mintId, success: true, data: analysis });
    } catch (error) {
      results.push({ mintId, success: false, error: error.message });
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
```

### Building a Live Stream Dashboard

```typescript
async function buildDashboard() {
  const [liveStreams, stats, solPrice] = await Promise.all([
    client.getLiveCoins({ limit: 20 }),
    client.getStreamStatistics(),
    client.getSolPrice()
  ]);

  return {
    streams: liveStreams,
    statistics: stats,
    solPrice: solPrice,
    lastUpdated: new Date()
  };
}
```

## Examples

See the [examples](./examples/) directory for complete implementation samples:

- [Basic Usage](./examples/basic-usage.ts) - Simple client initialization and API calls
- [Advanced Usage](./examples/advanced-usage.ts) - Error handling, batch operations, and LiveKit integration
- [React Integration](./examples/react-integration.tsx) - Using the client in a React application
- [Video Streaming](./examples/video-streaming.ts) - Complete LiveKit video streaming setup

## Browser Support

This package supports all modern browsers:
- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development

```bash
# Clone the repository
git clone https://github.com/pumpfun/pumpfun-api.git
cd pumpfun-api/packages/api-client

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

## Support

- 📖 [Documentation](https://pumpfun.github.io/pumpfun-api/)
- 🐛 [Issues](https://github.com/pumpfun/pumpfun-api/issues)
- 💬 [Discord](https://discord.gg/pumpfun)
- 📧 [Email](mailto:support@pump.fun)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.