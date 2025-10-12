# Getting Started Guide

Welcome to the PumpFun API Client! This comprehensive guide will help you install, configure, and start using the PumpFun API to access live streaming data and video stream information.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Basic Usage](#basic-usage)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Environment Variables](#environment-variables)
8. [Next Steps](#next-steps)
9. [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Node.js 18+ or modern browser environment
- npm, yarn, or pnpm package manager

### Install the Package

```bash
# Using npm
npm install @pumpfun/api-client

# Using yarn
yarn add @pumpfun/api-client

# Using pnpm
pnpm add @pumpfun/api-client
```

### Package Contents

The package includes:
- **TypeScript definitions** for full type safety
- **CommonJS and ES Modules** support for maximum compatibility
- **Minified production builds** for optimal performance
- **Source maps** for debugging

## Quick Start

Get up and running in just a few lines of code:

```typescript
import { PumpFunAPIClient } from '@pumpfun/api-client';

// Initialize the client
const client = new PumpFunAPIClient();

async function getStarted() {
  try {
    // Validate your connection
    const isValid = await client.validateJurisdiction();
    console.log('API connection valid:', isValid);

    // Get currently live streams
    const liveStreams = await client.getLiveCoins({ limit: 5 });
    console.log(`Found ${liveStreams.length} live streams`);

    // Display stream information
    liveStreams.forEach((stream, index) => {
      console.log(`${index + 1}. ${stream.name} (${stream.symbol})`);
      console.log(`   Participants: ${stream.num_participants}`);
      console.log(`   Market Cap: $${stream.usd_market_cap.toLocaleString()}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getStarted();
```

## Configuration

### Default Configuration

The client works out-of-the-box with sensible defaults:

```typescript
const client = new PumpFunAPIClient();
```

### Custom Configuration

You can customize the client behavior with configuration options:

```typescript
const client = new PumpFunAPIClient({
  baseURL: 'https://custom-api.pump.fun',  // Custom API endpoint
  timeout: 15000,                           // Request timeout in milliseconds
  retryConfig: {
    maxRetries: 5,                          // Maximum retry attempts
    baseDelay: 2000,                        // Base delay between retries
    maxDelay: 30000,                        // Maximum delay
    backoffFactor: 2                        // Exponential backoff factor
  },
  rateLimitConfig: {
    maxRequestsPerWindow: 50,               // Requests per minute
    windowMs: 60000,                        // Time window in milliseconds
    enableBackoff: true                     // Enable adaptive backoff
  },
  loggerConfig: {
    level: 'INFO',                          // Log level (DEBUG, INFO, WARN, ERROR)
    enableConsole: true,                    // Enable console logging
    enableColors: true                      // Enable colored output
  }
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | string | `https://frontend-api-v3.pump.fun` | API base URL |
| `timeout` | number | `10000` | Request timeout in milliseconds |
| `retryConfig` | object | See below | Retry behavior configuration |
| `rateLimitConfig` | object | See below | Rate limiting configuration |
| `loggerConfig` | object | See below | Logging configuration |

#### Retry Configuration Defaults

```typescript
{
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED']
}
```

#### Rate Limit Configuration Defaults

```typescript
{
  maxRequestsPerWindow: 60,     // PumpFun API limit
  windowMs: 60000,             // 1 minute window
  enableRetryAfter: true,      // Honor Retry-After headers
  enableSlidingWindow: true,   // Use sliding window algorithm
  enableBurstProtection: true, // Protect against request bursts
  enableBackoff: true,         // Adaptive backoff on errors
  baseBackoffMs: 1000,         // Base backoff delay
  maxBackoffMs: 10000,         // Maximum backoff delay
  backoffMultiplier: 1.5       // Backoff multiplier
}
```

#### Logger Configuration Defaults

```typescript
{
  level: 'INFO',
  enableConsole: true,
  enableColors: true,
  enableTimestamp: true,
  prefix: '[PumpFunAPI]'
}
```

## Basic Usage

### 1. Get Live Streaming Coins

```typescript
// Get live streams with default parameters
const liveCoins = await client.getLiveCoins();

// Get live streams with custom parameters
const liveCoins = await client.getLiveCoins({
  limit: 20,                    // Maximum streams to return
  offset: 0,                    // Number of streams to skip
  sort: 'participants',         // Sort field: 'currently_live', 'market_cap', 'participants'
  order: 'DESC',               // Sort order: 'ASC' or 'DESC'
  includeNsfw: false           // Include NSFW content
});
```

### 2. Get SOL Price

```typescript
const solPrice = await client.getSolPrice();
console.log(`Current SOL price: $${solPrice.sol_price}`);
```

### 3. Validate Jurisdiction

```typescript
const jurisdiction = await client.validateJurisdiction();
if (jurisdiction.is_valid) {
  console.log('Your jurisdiction is supported');
} else {
  console.log('Your jurisdiction is not supported');
}
```

## Error Handling

The client provides comprehensive error handling with detailed error information:

```typescript
import {
  PumpFunAPIError,
  RateLimitError,
  NetworkError,
  ValidationError
} from '@pumpfun/api-client';

async function robustAPICall() {
  try {
    const result = await client.getLiveCoins();
    return result;
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, error.retryAfter));
      return robustAPICall();
    } else if (error instanceof NetworkError) {
      console.log('Network error. Check your connection.');
      // Implement retry logic or inform user
    } else if (error instanceof ValidationError) {
      console.log(`Invalid parameters: ${error.message}`);
      // Fix parameters and retry
    } else if (error instanceof PumpFunAPIError) {
      console.log(`API Error (${error.statusCode}): ${error.message}`);
      if (error.isRetryable) {
        console.log('This error can be retried');
      }
    }
    throw error; // Re-throw if you can't handle it
  }
}
```

### Error Types

| Error Type | Description | Retryable |
|------------|-------------|-----------|
| `RateLimitError` | Too many requests | Yes |
| `NetworkError` | Connection issues | Yes |
| `ValidationError` | Invalid parameters | No |
| `AuthenticationError` | Invalid credentials | No |
| `PumpFunAPIError` | General API errors | Depends |

## Rate Limiting

The client automatically handles rate limiting to prevent API abuse:

### Automatic Rate Limiting

```typescript
// The client automatically tracks request counts and implements:
// - Sliding window rate limiting
// - Burst protection
// - Adaptive backoff on errors
// - Retry-After header honor

// These features work automatically - no additional code needed
const results = await Promise.all([
  client.getLiveCoins(),
  client.getSolPrice(),
  client.validateJurisdiction()
]);
```

### Manual Rate Limit Monitoring

```typescript
// Check current rate limit status
const rateLimitInfo = client.getRateLimitInfo();
console.log(`Requests used: ${rateLimitInfo.requestsUsed}/${rateLimitInfo.maxRequests}`);
console.log(`Reset in: ${rateLimitInfo.resetIn}ms`);

// Wait until rate limit resets if needed
if (rateLimitInfo.requestsUsed >= rateLimitInfo.maxRequests) {
  await client.waitForRateLimitReset();
}
```

### Best Practices for Rate Limiting

1. **Batch requests** when possible
2. **Implement caching** for frequently accessed data
3. **Use exponential backoff** for retries
4. **Monitor rate limit status** in high-traffic applications

## Environment Variables

You can configure the client using environment variables:

### Supported Environment Variables

```bash
# API Configuration
PUMPFUN_API_BASE_URL=https://frontend-api-v3.pump.fun
PUMPFUN_API_TIMEOUT=10000

# Retry Configuration
PUMPFUN_MAX_RETRIES=3
PUMPFUN_RETRY_DELAY=1000

# Rate Limiting
PUMPFUN_RATE_LIMIT=60
PUMPFUN_RATE_WINDOW=60000

# Logging
PUMPFUN_LOG_LEVEL=INFO
PUMPFUN_LOG_CONSOLE=true
```

### Using Environment Variables

```typescript
// Environment variables are automatically loaded
const client = new PumpFunAPIClient();

// Or specify custom environment variable prefix
const client = new PumpFunAPIClient({
  envPrefix: 'CUSTOM_'
});
```

### .env File Support

Create a `.env` file in your project root:

```env
PUMPFUN_API_BASE_URL=https://frontend-api-v3.pump.fun
PUMPFUN_LOG_LEVEL=DEBUG
PUMPFUN_MAX_RETRIES=5
```

## Next Steps

Now that you're set up, explore these advanced features:

### Video Streaming

```typescript
// Get detailed video stream analysis
const analysis = await client.getVideoStreamAnalysis(mintId);

// Get LiveKit connection info for video streaming
const connectionInfo = await client.getLiveKitConnectionInfo(mintId);
```

### Search and Filtering

```typescript
// Search for specific streams
const results = await client.searchLiveStreams('keyword');

// Get stream statistics
const stats = await client.getStreamStatistics();
```

### Stream Clips

```typescript
// Get recorded stream clips
const clips = await client.getStreamClips(mintId, 'COMPLETE', 10);
```

Check out the [API Reference](./api.md) for complete method documentation and the [Examples](../examples/) directory for complete implementation samples.

## Troubleshooting

### Common Issues

#### 1. "API connection failed"
- **Cause**: Network connectivity issues or invalid API URL
- **Solution**: Check internet connection and verify `baseURL` configuration

#### 2. "Rate limit exceeded"
- **Cause**: Too many requests in a short time
- **Solution**: Implement proper backoff or reduce request frequency

#### 3. "Invalid jurisdiction"
- **Cause**: Your location is not supported by PumpFun
- **Solution**: Use a VPN to access from a supported jurisdiction

#### 4. "Module not found" errors
- **Cause**: Package not installed or import path issues
- **Solution**: Verify installation and check import statements

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const client = new PumpFunAPIClient({
  loggerConfig: {
    level: 'DEBUG',
    enableConsole: true
  }
});
```

### Getting Help

If you encounter issues:

1. **Check the console logs** for detailed error messages
2. **Verify your configuration** matches the requirements
3. **Consult the API documentation** for method-specific requirements
4. **Check GitHub Issues** for known problems
5. **Join our Discord community** for community support

### Performance Tips

1. **Reuse client instances** - Don't create new clients for each request
2. **Use appropriate timeouts** - Balance between responsiveness and reliability
3. **Implement caching** - Cache responses when appropriate
4. **Monitor rate limits** - Stay within API limits for consistent performance

---

**Ready to dive deeper?** Check out our [API Reference](./api.md) for detailed documentation of all available methods and options.