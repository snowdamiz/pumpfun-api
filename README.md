# @120356aa/pump-api

[![npm version](https://badge.fury.io/js/%40120356aa%2Fpump-api.svg)](https://badge.fury.io/js/%40120356aa%2Fpump-api)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

A TypeScript client library for PumpFun streaming data API that provides easy access to live cryptocurrency streams, stream clips, and real-time data from the PumpFun platform.

## Features

- 🔄 **Real-time Streaming**: Connect to live cryptocurrency streams with WebRTC
- 📊 **Stream Discovery**: Filter and discover live streams based on various criteria
- 🎬 **Clip Management**: Access stream highlights and complete recordings
- 🔧 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🛡️ **Error Handling**: Robust error handling with detailed error information
- 📝 **Logging**: Built-in logging system with configurable levels
- 🔄 **Retry Logic**: Automatic retry mechanism for failed requests
- 🚦 **Rate Limiting**: Built-in rate limiting to prevent API abuse

## Installation

```bash
npm install @120356aa/pump-api
# or
yarn add @120356aa/pump-api
# or
pnpm add @120356aa/pump-api
```

### Peer Dependencies

For live streaming functionality, you'll need to install the LiveKit client:

```bash
npm install livekit-client
```

## Quick Start

```typescript
import { createClient } from '@120356aa/pump-api';

// Create a client instance
const client = createClient({
  baseURL: 'https://frontend-api-v3.pump.fun',
  timeout: 10000,
});

// Get live streams
const liveStreams = await client.filterStreams({
  minParticipants: 10,
  limit: 20
});

console.log(`Found ${liveStreams.streams.length} live streams`);
```

## API Reference

### Client Configuration

```typescript
interface ClientConfig {
  baseURL?: string;           // Default: 'https://frontend-api-v3.pump.fun'
  livestreamURL?: string;     // Default: 'https://livestream-api.pump.fun'
  timeout?: number;           // Default: 10000 (10 seconds)
  apiKey?: string;           // Optional API key
  authToken?: string;        // Optional auth token
  retryConfig?: Partial<RetryConfig>;
  loggerConfig?: Partial<LoggerConfig>;
  rateLimitConfig?: Partial<RateLimitConfig>;
}
```

### Main API Methods

#### 1. Filter Live Streams

Filter and discover live streams based on various criteria:

```typescript
interface FilterCriteria {
  minParticipants?: number;
  maxParticipants?: number;
  limit?: number;
  offset?: number;
  marketCapRange?: { min?: number; max?: number };
  createdTimeRange?: { start: string; end: string };
  hasSocialMedia?: { twitter?: boolean; telegram?: boolean };
  contentQuality?: {
    hasTitle?: boolean;
    hasDescription?: boolean;
    minTitleLength?: number;
    minDescriptionLength?: number;
  };
  textPatterns?: {
    nameContains?: string[];
    symbolContains?: string[];
    excludePatterns?: string[];
  };
  sortBy?: 'participants' | 'market_cap' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

const filteredStreams = await client.filterStreams({
  minParticipants: 50,
  limit: 10,
  sortBy: 'participants',
  sortOrder: 'desc',
  hasSocialMedia: { twitter: true },
  contentQuality: { hasTitle: true, minTitleLength: 5 }
});

console.log(`Found ${filteredStreams.streams.length} streams`);
console.log(`Filtered out ${filteredStreams.filteredOut} streams`);
console.log(`Processing time: ${filteredStreams.processingTimeMs}ms`);
```

#### 2. Get Stream Content

Retrieve clips, highlights, and previous streams for a specific mint:

```typescript
interface ContentFilters {
  contentType?: 'all' | 'clips' | 'highlights' | 'previous_streams';
  clipType?: 'COMPLETE' | 'HIGHLIGHT' | 'all';
  includeHighlights?: boolean;
  includePreviousStreams?: boolean;
  includeClips?: boolean;
  limit?: number;
  maxHighlights?: number;
  maxPreviousStreams?: number;
  daysBack?: number;
  minDuration?: number;
  maxDuration?: number;
  minViewCount?: number;
  maxViewCount?: number;
  dateRange?: { start: string; end: string };
  hasUrl?: boolean;
  sortBy?: 'created_at' | 'duration' | 'view_count' | 'stream_start';
  sortOrder?: 'ASC' | 'DESC';
}

const streamContent = await client.getStreamContent('mint-id-here', {
  contentType: 'all',
  includeHighlights: true,
  includePreviousStreams: true,
  limit: 50,
  minDuration: 30,
  sortBy: 'created_at',
  sortOrder: 'DESC'
});

console.log(`Total content items: ${streamContent.totalCount}`);
console.log(`Clips: ${streamContent.contentSummary.clipsCount}`);
console.log(`Highlights: ${streamContent.contentSummary.highlightsCount}`);
console.log(`Previous streams: ${streamContent.contentSummary.previousStreamsCount}`);
```

#### 3. Connect to Live Stream

Connect to a live stream for real-time audio/video:

```typescript
interface StreamOptions {
  videoElement?: HTMLVideoElement | null;
  audioElement?: HTMLAudioElement | null;
  autoConnect?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  preferredQuality?: 'auto' | 'high' | 'medium' | 'low';
  maxReconnectAttempts?: number;
  reconnectDelayMs?: number;
}

// Connect to a stream
const connection = await client.connectToStream('mint-id-here', {
  videoElement: document.getElementById('video') as HTMLVideoElement,
  autoPlay: true,
  muted: true,
  preferredQuality: 'high'
});

console.log(`Connected to stream: ${connection.id}`);

// Control the stream
await connection.toggleAudio();
await connection.toggleVideo();
await connection.setQuality('medium');

// Disconnect when done
await connection.disconnect();
```

#### 4. Stream Management

Manage active stream connections:

```typescript
// Get all active connections
const activeConnections = await client.getActiveStreams();
console.log(`Active connections: ${activeConnections.length}`);

// Toggle audio/video for a specific connection
await client.toggleAudio('connection-id-or-mint-id');
await client.toggleVideo('connection-id-or-mint-id');

// Set stream quality
await client.setStreamQuality('connection-id-or-mint-id', 'high');

// Disconnect from a stream
await client.disconnectFromStream('connection-id-or-mint-id');
```

#### 5. Client Shutdown

Cleanly shutdown the client and all connections:

```typescript
await client.shutdown();
```

## Data Models

### LiveCoin

```typescript
interface LiveCoin {
  mint: string;                    // Token mint address
  name: string;                    // Token name
  symbol: string;                  // Token symbol
  description: string;             // Token description
  image_uri: string;               // Token image URL
  twitter?: string;                // Twitter handle
  telegram?: string;               // Telegram link
  creator: string;                 // Creator address
  created_timestamp: number;       // Creation timestamp
  market_cap: number;              // Market cap
  usd_market_cap: number;          // USD market cap
  is_currently_live: boolean;      // Currently streaming
  livestream_title?: string;       // Stream title
  num_participants: number;        // Number of participants
  reply_count: number;             // Number of replies
  thumbnail: string;               // Thumbnail URL
  last_reply: number;              // Last reply timestamp
}
```

### StreamClip

```typescript
interface StreamClip {
  id: string;                      // Clip ID
  mintId: string;                  // Associated mint ID
  clipType: 'COMPLETE' | 'HIGHLIGHT'; // Clip type
  duration: number;                // Duration in seconds
  view_count?: number;             // View count
  created_at: string;              // Creation timestamp
  roomName: string;                // Room name
  sessionId: string;               // Session ID
  startTime: string;               // Start time
  endTime: string;                 // End time
  playlistUrl?: string;            // Playlist URL
  mp4Url?: string;                 // MP4 URL
  thumbnailUrl: string;            // Thumbnail URL
  hidden: boolean;                 // Hidden status
  highlightCreatorAddress?: string; // Highlight creator
  clip_url?: string;               // Direct clip URL
}
```

### StreamConnection

```typescript
interface StreamConnection {
  id: string;                      // Connection ID
  mintId: string;                  // Mint ID
  isConnected: boolean;            // Connection status
  state: ConnectionState;          // Connection state
  mediaStream?: MediaStream;       // Media stream
  videoTrack?: MediaStreamTrack;   // Video track
  audioTrack?: MediaStreamTrack;   // Audio track

  // Connection management
  disconnect(): Promise<void>;
  reconnect(): Promise<void>;
  getStats(): Promise<RTCStatsReport>;

  // Media controls
  toggleAudio(): Promise<void>;
  toggleVideo(): Promise<void>;
  muteAudio(): Promise<void>;
  unmuteAudio(): Promise<void>;
  muteVideo(): Promise<void>;
  unmuteVideo(): Promise<void>;
  setQuality(quality: VideoQuality): Promise<void>;
}
```

## Error Handling

The library provides comprehensive error handling with specific error types:

```typescript
import {
  PumpFunError,
  NetworkError,
  RateLimitError,
  ValidationError,
  AuthenticationError
} from '@120356aa/pump-api';

try {
  const streams = await client.filterStreams({ limit: 100 });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after: ${error.getRetryDelay()}ms`);
    console.log('Suggestions:', error.getResolution());
  } else if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
    console.log('Field:', error.details?.field);
  } else if (error instanceof NetworkError) {
    console.log('Network error:', error.message);
    if (error.canRetry()) {
      setTimeout(() => retry(), error.getRetryDelay());
    }
  }
}
```

### Error Types

- **`PumpFunError`**: Base error class for all PumpFun errors
- **`NetworkError`**: Network-related errors (connection issues, DNS failures)
- **`RateLimitError`**: Rate limit exceeded
- **`AuthenticationError`**: Authentication failures
- **`AuthorizationError`**: Permission denied
- **`ValidationError`**: Invalid parameters or request format
- **`NotFoundError`**: Resource not found
- **`ServerError`**: Server-side errors
- **`ConfigurationError`**: Client configuration issues
- **`TimeoutError`**: Request timeout
- **`LiveKitError`**: LiveKit streaming errors

## Logging

Configure logging to monitor API activity:

```typescript
const client = createClient({
  loggerConfig: {
    level: 'INFO',                 // DEBUG, INFO, WARN, ERROR, CRITICAL
    enableConsole: true,
    enableColors: true,
    enableTimestamps: true,
    enableStructuredLogs: false,
    enablePerformanceLogging: true,
    enableRequestLogging: true,
    enableErrorTracking: true
  }
});
```

## Configuration Examples

### Basic Configuration

```typescript
const client = createClient({
  timeout: 15000,
  apiKey: process.env.PUMPFUN_API_KEY,
  authToken: process.env.PUMPFUN_AUTH_TOKEN
});
```

### Advanced Configuration

```typescript
const client = createClient({
  baseURL: 'https://api.pump.fun',
  livestreamURL: 'https://streams.pump.fun',
  timeout: 20000,
  retryConfig: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffFactor: 2,
    enableJitter: true
  },
  rateLimitConfig: {
    maxRequestsPerWindow: 100,
    windowMs: 60000,
    enableBackoff: true,
    enableBurstProtection: true,
    maxBurst: 20
  },
  loggerConfig: {
    level: 'DEBUG',
    enableConsole: true,
    enableFileLogging: true,
    logFilePath: './pumpfun-api.log'
  }
});
```

## Browser Usage

The library works in browser environments with WebRTC support:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { createClient } from '@120356aa/pump-api';

    const client = createClient();

    // Connect to a stream
    async function connectToStream(mintId) {
      const videoElement = document.getElementById('video');

      const connection = await client.connectToStream(mintId, {
        videoElement,
        autoPlay: true,
        muted: false
      });

      console.log('Connected to stream:', connection.id);
    }

    // Usage
    connectToStream('your-mint-id-here');
  </script>
</head>
<body>
  <video id="video" controls autoplay></video>
</body>
</html>
```

## Contributing

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build the project: `npm run build`
5. Run linting: `npm run lint`

## License

MIT License - see LICENSE file for details.

## Support

- 📖 [Documentation](https://github.com/snowdamiz/pumpfun-api)
- 🐛 [Issue Tracker](https://github.com/snowdamiz/pumpfun-api/issues)
- 💬 [Discussions](https://github.com/snowdamiz/pumpfun-api/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.