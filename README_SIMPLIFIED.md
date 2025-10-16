# PumpFun API v2.0 - Simplified Client

A dramatically simplified version of the PumpFun API client that reduces complexity from 28+ methods down to **8 core methods** focused on essential user needs.

## 🎯 Key Features

- **70% reduction in API surface area** (28+ methods → 8 methods)
- **Simplified exports** (40+ exports → 15 exports)
- **Enhanced error handling** with actionable suggestions
- **TypeScript-first** with comprehensive type safety
- **Focused on core user needs**: Stream discovery, content retrieval, and LiveKit video streaming

## 📦 Installation

```bash
npm install pumpfun-api
```

## 🚀 Quick Start

```typescript
import { createClient } from 'pumpfun-api';

// Create client with default configuration
const client = createClient();

// Or with custom configuration
const client = createClient({
  baseURL: 'https://api.pump.fun',
  timeout: 10000,
  apiKey: 'your-api-key'
});
```

## 📚 Core API Methods

### 1. Stream Discovery - `filterStreams()`

Search and filter live streams with powerful criteria:

```typescript
// Basic filtering
const streams = await client.filterStreams({
  minParticipants: 5,
  limit: 20,
  sortBy: 'participants',
  sortOrder: 'desc'
});

// Advanced filtering
const qualityStreams = await client.filterStreams({
  marketCapRange: { min: 10000, max: 500000 },
  hasSocialMedia: { twitter: true, telegram: true },
  contentQuality: {
    hasTitle: true,
    hasDescription: true,
    minTitleLength: 20
  },
  textPatterns: {
    nameContains: ['defi', 'crypto'],
    excludePatterns: ['scam']
  }
});
```

### 2. Content Retrieval - `getStreamContent()`

Get stream clips, highlights, and previous streams:

```typescript
// Get all content types
const content = await client.getStreamContent('mint-id');

// Get specific content with filters
const highlights = await client.getStreamContent('mint-id', {
  contentType: 'highlights',
  daysBack: 7,
  maxHighlights: 20,
  minDuration: 30,
  maxViewCount: 1000,
  sortBy: 'view_count',
  sortOrder: 'DESC'
});
```

### 3. LiveKit Connection - `connectToStream()`

Connect to live video streams:

```typescript
// Basic connection
const connection = await client.connectToStream('mint-id');

// With video element and callbacks
const videoElement = document.getElementById('video') as HTMLVideoElement;
const connection = await client.connectToStream('mint-id', {
  videoElement,
  autoPlay: true,
  preferredQuality: 'high',
  onConnected: (conn) => console.log('Connected:', conn.id),
  onError: (error, conn) => console.error('Error:', error)
});
```

### 4. Connection Management - `disconnectFromStream()`

```typescript
await client.disconnectFromStream('mint-id');
// or
await client.disconnectFromStream('connection-id');
```

### 5. Active Connections - `getActiveStreams()`

```typescript
const activeConnections = await client.getActiveStreams();
console.log(`Active connections: ${activeConnections.length}`);
```

### 6. Audio Control - `toggleAudio()`

```typescript
await client.toggleAudio('mint-id');
// or
await client.toggleAudio('connection-id');
```

### 7. Video Control - `toggleVideo()`

```typescript
await client.toggleVideo('mint-id');
// or
await client.toggleVideo('connection-id');
```

### 8. Quality Control - `setStreamQuality()`

```typescript
await client.setStreamQuality('mint-id', 'high');
// or 'medium', 'low', 'auto'
```

## 🔧 Advanced Usage

### Error Handling

The simplified API provides enhanced error handling with actionable suggestions:

```typescript
import { StreamError, ConnectionError, ValidationError } from 'pumpfun-api';

try {
  const streams = await client.filterStreams({
    minParticipants: -1 // Invalid
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof ConnectionError) {
    console.error('Connection failed:', error.message);
    console.log('Suggestions:', error.suggestions);
  }
}
```

### Stream Connection Events

```typescript
const connection = await client.connectToStream('mint-id', {
  onConnected: (conn) => {
    console.log('Connected to stream:', conn.id);
  },
  onDisconnected: (conn) => {
    console.log('Disconnected from stream:', conn.id);
  },
  onError: (error, conn) => {
    console.error('Stream error:', error.message);
  },
  onQualityChanged: (quality) => {
    console.log('Quality changed to:', quality);
  }
});
```

### Connection Management

```typescript
// Get connection state
const connection = client.findConnection('mint-id');
if (connection?.isConnected) {
  console.log('Connection is active');
}

// Get connection statistics
const stats = await connection.getStats();
console.log('Connection stats:', stats);

// Manual reconnection
await connection.reconnect();
```

## 📊 API Comparison

| Feature | Old API | New API | Reduction |
|---------|---------|---------|------------|
| Public Methods | 28+ | 8 | **71%** |
| Exports | 40+ | 15 | **62%** |
| Service Files | 6+ | 3 | **50%** |

## 🎯 Migration Guide

### From Old API to New API

**Old API:**
```typescript
// Multiple methods for different filter types
const activeStreams = await client.getActiveLiveStreams();
const filteredStreams = await client.filterStreamsByParticipants(10, 50);
const marketCapStreams = await client.filterStreamsByMarketCap(1000, 100000);
const socialStreams = await client.getStreamsWithSocialMedia();
```

**New API:**
```typescript
// Single method with comprehensive filtering
const streams = await client.filterStreams({
  minParticipants: 10,
  maxParticipants: 50,
  marketCapRange: { min: 1000, max: 100000 },
  hasSocialMedia: { twitter: true, telegram: true }
});
```

### Content Access Migration

**Old API:**
```typescript
// Multiple methods for different content types
const highlights = await client.getStreamHighlights('mint-id');
const clips = await client.getStreamClips('mint-id', 'HIGHLIGHT');
const completeStreams = await client.getStreamClips('mint-id', 'COMPLETE');
const previousStreams = await client.getPreviousStreams('mint-id');
```

**New API:**
```typescript
// Single method with content type filtering
const content = await client.getStreamContent('mint-id', {
  contentType: 'highlights',
  includePreviousStreams: true,
  limit: 50
});
```

## 🔍 Type Definitions

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
  };
  textPatterns?: {
    nameContains?: string[];
    symbolContains?: string[];
    excludePatterns?: string[];
  };
  sortBy?: 'participants' | 'market_cap' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

interface StreamConnection {
  id: string;
  mintId: string;
  isConnected: boolean;
  state: ConnectionState;
  mediaStream?: MediaStream;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  // ... lifecycle and control methods
}
```

## 🎬 Complete Example

```typescript
import { createClient, FilterCriteria } from 'pumpfun-api';

async function example() {
  const client = createClient({
    baseURL: 'https://api.pump.fun',
    timeout: 10000
  });

  try {
    // 1. Discover quality streams
    const streams = await client.filterStreams({
      minParticipants: 10,
      marketCapRange: { min: 5000, max: 500000 },
      hasSocialMedia: { twitter: true },
      contentQuality: { hasTitle: true },
      sortBy: 'participants',
      sortOrder: 'desc',
      limit: 5
    });

    console.log(`Found ${streams.streams.length} quality streams`);

    // 2. Get content for the first stream
    if (streams.streams.length > 0) {
      const stream = streams.streams[0];
      const content = await client.getStreamContent(stream.id, {
        contentType: 'highlights',
        daysBack: 7,
        limit: 10
      });

      console.log(`Found ${content.totalCount} content items`);

      // 3. Connect to the stream
      const connection = await client.connectToStream(stream.id, {
        autoPlay: true,
        preferredQuality: 'high',
        onConnected: (conn) => {
          console.log('Connected to live stream');
        },
        onError: (error, conn) => {
          console.error('Stream error:', error.message);
        }
      });

      // 4. Control the stream
      await client.toggleAudio(stream.id);
      await client.setStreamQuality(stream.id, 'medium');

      // 5. Cleanup when done
      setTimeout(async () => {
        await client.disconnectFromStream(stream.id);
        await client.shutdown();
      }, 60000); // Disconnect after 1 minute
    }

  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

example();
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**: Check if the stream is still live and the mint ID is valid
2. **No Audio/Video**: Ensure the stream has active media tracks
3. **Quality Issues**: Try different quality settings ('auto', 'high', 'medium', 'low')
4. **Rate Limited**: Implement retry logic with exponential backoff

### Debug Mode

Enable debug logging:

```typescript
const client = createClient({
  loggerConfig: {
    level: 'debug',
    enableConsole: true
  }
});
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Please read our contributing guidelines and submit pull requests to our main repository.

---

**PumpFun API v2.0** - Simplified, focused, and developer-friendly.