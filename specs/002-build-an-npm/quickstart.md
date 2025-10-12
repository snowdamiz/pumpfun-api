# Quick Start Guide: PumpFun API Client

This guide will help you get started with the PumpFun API npm package to access live streaming data and video stream information.

## Installation

```bash
npm install @pumpfun/api-client
# or
yarn add @pumpfun/api-client
# or
pnpm add @pumpfun/api-client
```

## Basic Usage

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

### 4. Search Streams

```typescript
async function searchStreams(keyword: string) {
  try {
    const results = await client.searchLiveStreams(keyword);

    console.log(`Found ${results.length} streams matching "${keyword}":`);
    results.forEach((stream, index) => {
      console.log(`${index + 1}. ${stream.name} - ${stream.livestream_title}`);
    });
  } catch (error) {
    console.error('Failed to search streams:', error);
  }
}
```

### 5. Get Stream Clips

```typescript
async function getStreamClips(mintId: string) {
  try {
    // Get complete clips
    const completeClips = await client.getStreamClips(mintId, 'COMPLETE', 10);
    console.log(`Found ${completeClips.length} complete clips`);

    // Get highlight clips
    const highlightClips = await client.getStreamClips(mintId, 'HIGHLIGHT', 10);
    console.log(`Found ${highlightClips.length} highlight clips`);

    // Display clip information
    [...completeClips, ...highlightClips].forEach((clip, index) => {
      console.log(`Clip ${index + 1}: ${clip.duration}s - ${clip.view_count} views`);
    });
  } catch (error) {
    console.error('Failed to get stream clips:', error);
  }
}
```

## Advanced Usage

### Custom Configuration

```typescript
import { PumpFunAPIClient, Logger } from '@pumpfun/api-client';

// Advanced configuration
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

### Error Handling

```typescript
import { PumpFunAPIError, RateLimitError } from '@pumpfun/api-client';

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
      console.error(`API Error (${error.getErrorCode()}): ${error.getMessage()}`);
      if (error.isRetryable()) {
        console.log('This error can be retried');
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

### Working with LiveKit Video Streams

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

### Batch Operations

```typescript
async function analyzeMultipleStreams(mintIds: string[]) {
  const results = [];

  // Process in parallel with rate limiting
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

## Configuration Options

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

## Common Use Cases

### 1. Building a Live Stream Dashboard

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

### 2. Monitoring Specific Tokens

```typescript
async function monitorToken(mintId: string) {
  const [streamInfo, isApproved, clips] = await Promise.all([
    client.getLiveStreamInfo(mintId),
    client.isApprovedCreator(mintId),
    client.getStreamClips(mintId, 'COMPLETE', 5)
  ]);

  return {
    hasStream: !!streamInfo,
    isLive: streamInfo?.isLive || false,
    isApproved,
    recentClips: clips.length,
    participants: streamInfo?.numParticipants || 0
  };
}
```

### 3. Video Stream Integration

```typescript
async function setupVideoStream(mintId: string, videoElement: HTMLVideoElement) {
  const connectionInfo = await client.getLiveKitConnectionInfo(mintId);

  if (!connectionInfo) {
    throw new Error('No video stream available');
  }

  // Integrate with LiveKit or other WebRTC client
  const room = await createLiveKitRoom(connectionInfo);

  room.on('trackSubscribed', (track) => {
    if (track.kind === 'video') {
      videoElement.srcObject = new MediaStream([track]);
    }
  });

  return room;
}
```

## Error Handling Guide

### Common Error Types

1. **RateLimitError**: Too many requests
   - Solution: Implement exponential backoff or wait for retry-after

2. **NetworkError**: Connection issues
   - Solution: Retry with exponential backoff

3. **ValidationError**: Invalid parameters
   - Solution: Check parameter formats and values

4. **AuthenticationError**: Invalid credentials
   - Solution: Update API keys or tokens

### Best Practices

1. **Always wrap API calls in try-catch blocks**
2. **Implement proper retry logic for retryable errors**
3. **Log errors for debugging**
4. **Provide user-friendly error messages**
5. **Monitor rate limits and implement backoff**

## Next Steps

- Check out the [API Reference](./docs/api.md) for detailed method documentation
- Browse [examples](./examples/) for complete implementation samples
- Read the [troubleshooting guide](./docs/troubleshooting.md) for common issues

## Support

If you encounter issues or have questions:
- Check the [GitHub Issues](https://github.com/pumpfun/pumpfun-api/issues)
- Review the [documentation](./docs/)
- Join our [Discord community](https://discord.gg/pumpfun)