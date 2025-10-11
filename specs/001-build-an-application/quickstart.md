# Quickstart Guide: PumpFun Streaming API Monitor

**Created**: 2025-10-11
**Purpose**: Getting started guide for developers using the PumpFun streaming API monitoring system

## Overview

The PumpFun Streaming API Monitor provides real-time monitoring of streaming activity on the PumpFun platform. This guide will help you get started with accessing streaming data, setting up monitoring, and integrating the system into your applications.

## Prerequisites

- Node.js 20.x or higher
- TypeScript 5.x or higher
- Valid API key for authentication
- Basic understanding of WebSocket connections

## Installation

### 1. Install the SDK

```bash
npm install @pumpfun/stream-monitor
# or
yarn add @pumpfun/stream-monitor
```

### 2. TypeScript Configuration

Ensure your `tsconfig.json` includes the following settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## Authentication

### API Key Setup

1. Obtain your API key from the PumpFun developer dashboard
2. Set the API key as an environment variable:

```bash
export PUMPFUN_API_KEY="your_api_key_here"
```

### Initialize the Client

```typescript
import { StreamMonitorClient } from '@pumpfun/stream-monitor';

// Initialize the client
const client = new StreamMonitorClient({
  apiKey: process.env.PUMPFUN_API_KEY,
  baseURL: 'https://api.pumpfun-monitor.com/v1'
});
```

## Basic Usage

### 1. Get Active Streams

```typescript
import { StreamMonitorClient } from '@pumpfun/stream-monitor';

async function getActiveStreams() {
  try {
    const response = await client.streams.getActive({
      limit: 50,
      sort: 'viewer_count',
      order: 'desc'
    });

    console.log(`Found ${response.data.streams.length} active streams`);

    response.data.streams.forEach(stream => {
      console.log(`${stream.tokenName} (${stream.tokenSymbol}): ${stream.currentViewerCount} viewers`);
    });
  } catch (error) {
    console.error('Error fetching active streams:', error);
  }
}

getActiveStreams();
```

### 2. Monitor a Specific Token

```typescript
async function monitorToken(tokenId: string) {
  try {
    const streamDetails = await client.streams.getByToken(tokenId, {
      include_history: true,
      history_limit: 5
    });

    if (streamDetails.data.stream) {
      console.log(`Token ${streamDetails.data.token.name} is currently ${streamDetails.data.stream.status}`);
      console.log(`Current viewers: ${streamDetails.data.stream.currentViewerCount}`);
      console.log(`Peak viewers: ${streamDetails.data.stream.peakViewerCount}`);

      if (streamDetails.data.stream.metadata) {
        console.log(`Stream quality: ${streamDetails.data.stream.metadata.resolution}`);
        console.log(`Bitrate: ${streamDetails.data.stream.metadata.bitrate} kbps`);
      }
    } else {
      console.log(`No active stream for token: ${tokenId}`);
    }
  } catch (error) {
    console.error('Error monitoring token:', error);
  }
}

// Monitor a specific token
monitorToken('token_abc123');
```

### 3. Real-time Stream Monitoring

```typescript
import { StreamMonitorClient, StreamEventType } from '@pumpfun/stream-monitor';

async function setupRealTimeMonitoring() {
  const client = new StreamMonitorClient({
    apiKey: process.env.PUMPFUN_API_KEY
  });

  // Set up event listeners
  client.on('streamStarted', (event) => {
    console.log(`🔴 Stream started: ${event.data.tokenName} (${event.data.currentViewerCount} viewers)`);
  });

  client.on('streamEnded', (event) => {
    console.log(`⏹️ Stream ended: ${event.data.tokenName} (duration: ${event.data.duration}s)`);
  });

  client.on('metadataUpdated', (event) => {
    console.log(`📊 Metadata updated: ${event.data.tokenName} - ${event.data.currentViewerCount} viewers`);
  });

  // Connect to real-time updates
  await client.connect();

  // Monitor specific tokens
  await client.subscribe(['token_abc123', 'token_def456', 'token_ghi789']);

  console.log('Real-time monitoring started...');
}

setupRealTimeMonitoring().catch(console.error);
```

## Advanced Usage

### 1. Historical Data Analysis

```typescript
async function analyzeTokenHistory(tokenId: string, days: number = 7) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

  try {
    const history = await client.tokens.getStreamingHistory(tokenId, {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      limit: 100
    });

    const stats = history.data.statistics;

    console.log(`📈 Streaming Statistics for ${history.data.token.name}:`);
    console.log(`  Total streams: ${stats.totalStreams}`);
    console.log(`  Total duration: ${Math.round(stats.totalDuration / 3600)} hours`);
    console.log(`  Average viewers: ${Math.round(stats.averageViewers)}`);
    console.log(`  Peak viewers: ${stats.peakViewers}`);

    // Analyze viewer trends
    const viewerCounts = history.data.streams.map(s => s.peakViewerCount);
    const avgViewers = viewerCounts.reduce((a, b) => a + b, 0) / viewerCounts.length;

    console.log(`  Performance: ${Math.round((avgViewers / stats.peakViewers) * 100)}% of peak performance`);
  } catch (error) {
    console.error('Error analyzing history:', error);
  }
}

analyzeTokenHistory('token_abc123', 30);
```

### 2. Top Streams Analytics

```typescript
async function getTopStreams() {
  try {
    const topStreams = await client.analytics.getTopStreams({
      metric: 'viewer_count',
      time_range: '24h',
      limit: 10
    });

    console.log('🏆 Top 24-hour streams by viewer count:');
    topStreams.data.streams.forEach((stream, index) => {
      console.log(`${index + 1}. ${stream.stream.tokenName}: ${stream.value} viewers`);
    });
  } catch (error) {
    console.error('Error fetching top streams:', error);
  }
}

getTopStreams();
```

### 3. User Activity Monitoring

```typescript
async function monitorUserActivity(userId: string) {
  try {
    const userStreams = await client.users.getStreams(userId, {
      include_active: true,
      limit: 20
    });

    const user = userStreams.data.user;
    console.log(`👤 User: ${user.username} (${user.followerCount} followers)`);

    if (userStreams.data.active_streams.length > 0) {
      console.log(`🔴 Currently streaming: ${userStreams.data.active_streams.length} streams`);
      userStreams.data.active_streams.forEach(stream => {
        console.log(`  - ${stream.tokenName}: ${stream.currentViewerCount} viewers`);
      });
    }

    if (userStreams.data.historical_streams.length > 0) {
      console.log(`📚 Recent streams: ${userStreams.data.historical_streams.length}`);
      userStreams.data.historical_streams.slice(0, 5).forEach(stream => {
        console.log(`  - ${stream.tokenName}: ${stream.peakViewerCount} peak viewers`);
      });
    }
  } catch (error) {
    console.error('Error monitoring user:', error);
  }
}

monitorUserActivity('user_789');
```

### 4. Webhook Integration

```typescript
async function setupWebhook() {
  try {
    const webhook = await client.webhooks.register({
      url: 'https://your-app.com/webhook/pumpfun',
      events: ['STREAM_STARTED', 'STREAM_ENDED', 'METADATA_UPDATED'],
      secret: 'your_webhook_secret',
      active: true
    });

    console.log(`✅ Webhook registered: ${webhook.data.webhookId}`);
    console.log(`📡 Endpoint: ${webhook.data.url}`);
    console.log(`🔔 Events: ${webhook.data.events.join(', ')}`);
  } catch (error) {
    console.error('Error registering webhook:', error);
  }
}

setupWebhook();
```

## Error Handling

### Best Practices

```typescript
import { StreamMonitorClient, StreamMonitorError } from '@pumpfun/stream-monitor';

async function robustStreamMonitoring(tokenId: string) {
  const client = new StreamMonitorClient({
    apiKey: process.env.PUMPFUN_API_KEY,
    retryConfig: {
      maxRetries: 3,
      retryDelay: 1000
    }
  });

  try {
    const stream = await client.streams.getByToken(tokenId);
    return stream.data;
  } catch (error) {
    if (error instanceof StreamMonitorError) {
      switch (error.code) {
        case 'RATE_LIMITED':
          console.log('⏳ Rate limited. Retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, error.retryAfter || 5000));
          return robustStreamMonitoring(tokenId);

        case 'NOT_FOUND':
          console.log(`❌ Stream not found for token: ${tokenId}`);
          return null;

        case 'UNAUTHORIZED':
          console.log('🔑 Authentication failed. Check your API key.');
          throw error;

        default:
          console.log(`❌ Unexpected error: ${error.message}`);
          throw error;
      }
    } else {
      console.log('❌ Unknown error occurred:', error);
      throw error;
    }
  }
}
```

### Rate Limiting

The API implements rate limiting to ensure fair usage. Here's how to handle it:

```typescript
async function handleRateLimiting() {
  const client = new StreamMonitorClient({
    apiKey: process.env.PUMPFUN_API_KEY
  });

  // This will automatically handle rate limiting with exponential backoff
  const streams = await client.streams.getActive({
    limit: 100
  }, {
    // Custom retry configuration
    retry: {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000
    }
  });
}
```

## Configuration Options

### Client Configuration

```typescript
const client = new StreamMonitorClient({
  apiKey: process.env.PUMPFUN_API_KEY,
  baseURL: 'https://api.pumpfun-monitor.com/v1',
  timeout: 30000, // 30 seconds timeout
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  },
  websocket: {
    reconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  }
});
```

### Environment Variables

```bash
# Required
PUMPFUN_API_KEY=your_api_key_here

# Optional
PUMPFUN_API_BASE_URL=https://api.pumpfun-monitor.com/v1
PUMPFUN_TIMEOUT=30000
PUMPFUN_MAX_RETRIES=3
PUMPFUN_LOG_LEVEL=info
```

## TypeScript Types

### Key Interfaces

```typescript
interface Stream {
  streamId: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  userId?: string;
  username?: string;
  status: StreamStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  currentViewerCount: number;
  peakViewerCount: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  quality?: string;
  metadata?: StreamMetadata;
}

interface StreamMetadata {
  bitrate?: number;
  resolution?: string;
  frameRate?: number;
  videoCodec?: string;
  audioCodec?: string;
  fileSize?: number;
  viewerTimeline: ViewerTimelinePoint[];
}

interface ViewerTimelinePoint {
  timestamp: Date;
  viewerCount: number;
}

type StreamStatus = 'STARTING' | 'LIVE' | 'ENDING' | 'ENDED' | 'ERROR';
type EventType = 'STREAM_STARTED' | 'STREAM_ENDED' | 'METADATA_UPDATED' | 'STATUS_CHANGED' | 'ERROR_OCCURRED';
```

## Examples Repository

Complete examples are available in our GitHub repository:

```bash
git clone https://github.com/pumpfun/stream-monitor-examples.git
cd stream-monitor-examples
npm install
npm run dev
```

The examples include:
- Basic stream monitoring
- Real-time WebSocket connections
- Historical data analysis
- Webhook integration
- Error handling patterns
- TypeScript usage examples

## Support

- **Documentation**: https://docs.pumpfun-monitor.com
- **API Reference**: https://api.pumpfun-monitor.com/docs
- **GitHub Issues**: https://github.com/pumpfun/stream-monitor/issues
- **Discord Community**: https://discord.gg/pumpfun
- **Email Support**: support@pumpfun-monitor.com

## Common Use Cases

### 1. Trading Bot Integration

```typescript
// Monitor high-activity tokens for trading opportunities
async function monitorTradingSignals() {
  const client = new StreamMonitorClient({ apiKey: process.env.PUMPFUN_API_KEY });

  client.on('streamStarted', async (event) => {
    if (event.data.currentViewerCount > 1000) {
      // High viewer count - potential trading signal
      await executeTradeSignal(event.data.tokenId, 'HIGH_ACTIVITY');
    }
  });

  await client.connect();
}
```

### 2. Analytics Dashboard

```typescript
// Gather data for analytics dashboard
async function populateDashboard() {
  const client = new StreamMonitorClient({ apiKey: process.env.PUMPFUN_API_KEY });

  const [activeStreams, dashboardStats] = await Promise.all([
    client.streams.getActive({ limit: 100 }),
    client.analytics.getDashboardStats()
  ]);

  return {
    activeStreams: activeStreams.data.streams,
    stats: dashboardStats.data
  };
}
```

### 3. Alert System

```typescript
// Set up alerts for specific conditions
async function setupAlerts() {
  const client = new StreamMonitorClient({ apiKey: process.env.PUMPFUN_API_KEY });

  client.on('metadataUpdated', (event) => {
    if (event.data.currentViewerCount > 5000) {
      sendAlert({
        type: 'HIGH_VIEWER_COUNT',
        token: event.data.tokenName,
        viewers: event.data.currentViewerCount
      });
    }
  });

  await client.connect();
}
```

This quickstart guide provides everything you need to get started with the PumpFun Streaming API Monitor. For more advanced usage and detailed API documentation, refer to the official documentation website.