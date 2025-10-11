# PumpFun API Endpoints Documentation

**Created**: 2025-10-11
**Updated**: 2025-10-11
**Purpose**: Documentation of discovered PumpFun streaming API endpoints through reverse engineering

## Overview

This document contains the comprehensive list of discovered PumpFun API endpoints, their request/response formats, authentication requirements, and usage examples. All endpoints were discovered through systematic analysis of the PumpFun web application and verified to be functional.

## Base URL

```
https://frontend-api-v3.pump.fun
```

## Authentication

**Public API**: No authentication required for the discovered endpoints
**Rate Limiting**: 60 requests/minute for live data, 50 requests/minute for auth/price endpoints
**Headers**: Required `Origin: https://pump.fun` and `Referer: https://pump.fun/` for CORS compliance

## Discovered Endpoints

### 1. Live Streaming Coins

#### **GET** `/coins/currently-live`

Returns a list of tokens that are currently being live streamed on the PumpFun platform.

**Endpoint Details:**
- **Method**: GET
- **URL**: `https://frontend-api-v3.pump.fun/coins/currently-live`
- **Authentication**: None required
- **Rate Limit**: 60 requests/minute

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| offset | number | No | 0 | Number of items to skip for pagination |
| limit | number | No | 60 | Maximum number of items to return (max 100) |
| sort | string | No | currently_live | Sort field (currently_live, created_timestamp) |
| order | string | No | DESC | Sort order (ASC, DESC) |
| includeNsfw | boolean | No | false | Include NSFW content |

**Request Example:**
```bash
curl -X GET "https://frontend-api-v3.pump.fun/coins/currently-live?offset=0&limit=10&sort=currently_live&order=DESC&includeNsfw=false" \
  -H "Origin: https://pump.fun" \
  -H "Referer: https://pump.fun/" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

**Response Example:**
```json
[
  {
    "mint": "4F21SgBnms5bwQSjuc11ZF8ruSd9vJp6qu44rWLqpump",
    "name": "I AM PILL",
    "symbol": "IAMPILL",
    "description": "first ever person to officially came out as a pumpfun pill. my new purpose in life now revolves around creating bullish only moments.",
    "image_uri": "https://ipfs.io/ipfs/QmbwCyLQ4BFd4tbnLShm5nDdTiRc87cKv4QJ8XdntUgXp9",
    "metadata_uri": "https://ipfs.io/ipfs/QmczbyCZqB2kLwbJymUzL16NdY4gxarwEBeLcw3nnCk3Si",
    "twitter": "https://x.com/iampillcoin?s=21",
    "telegram": null,
    "bonding_curve": "8vf3FQeHi5do4JJDM6xzdhWUaGZGTgNvK8wFESpynrEG",
    "associated_bonding_curve": "BTfiQR3JSFwetYeFJrGU6eaazYNZu8jnB2yW52gs4VWa",
    "creator": "8tRrvRsXKnXBA2r1pJs8MRwTYGHu3vmYHAmJwdLpzsDV",
    "created_timestamp": 1760216813134,
    "raydium_pool": null,
    "complete": false,
    "virtual_sol_reserves": 45093863541,
    "virtual_token_reserves": 713844362470572,
    "hidden": null,
    "total_supply": 1000000000000000,
    "website": null,
    "show_name": true,
    "last_trade_timestamp": 1760220881000,
    "king_of_the_hill_timestamp": 1760217769000,
    "market_cap": 63.170441502,
    "nsfw": false,
    "market_id": null,
    "inverted": null,
    "real_sol_reserves": 15093863541,
    "real_token_reserves": 433944362470572,
    "livestream_ban_expiry": 0,
    "last_reply": 1760220186000,
    "reply_count": 35,
    "is_banned": false,
    "is_currently_live": true,
    "initialized": true,
    "video_uri": null,
    "updated_at": 1760220883,
    "pump_swap_pool": null,
    "ath_market_cap": 39232.52984935841,
    "ath_market_cap_timestamp": 1760217775195,
    "banner_uri": null,
    "hide_banner": false,
    "livestream_downrank_score": 0,
    "program": "pump",
    "platform": null,
    "thumbnail": "https://thumbnails.pump.fun/1272382/1760220776181.jpeg",
    "thumbnail_updated_at": 1760220776181,
    "num_participants": 78,
    "livestream_title": "",
    "downrank_score": 0,
    "usd_market_cap": 11190.643712079302
  }
]
```

**Key Response Fields for Live Streaming:**
- `is_currently_live: boolean` - Indicates if token is actively being streamed
- `livestream_title: string` - Title of the live stream (may be empty)
- `num_participants: number` - Number of participants in the live stream
- `reply_count: number` - Number of chat messages/replies
- `thumbnail: string` - URL to live stream thumbnail image
- `last_reply: number` - Timestamp of last chat activity

### 2. Jurisdiction Validation

#### **GET** `/auth/is-valid-jurisdiction`

Validates if the current user's jurisdiction is valid for accessing PumpFun services.

**Endpoint Details:**
- **Method**: GET
- **URL**: `https://frontend-api-v3.pump.fun/auth/is-valid-jurisdiction`
- **Authentication**: None required
- **Rate Limit**: 50 requests/minute

**Request Example:**
```bash
curl -X GET "https://frontend-api-v3.pump.fun/auth/is-valid-jurisdiction" \
  -H "Origin: https://pump.fun" \
  -H "Referer: https://pump.fun/" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

**Response Example:**
```json
{
  "is_valid": true
}
```

### 3. SOL Price Data

#### **GET** `/sol-price`

Returns the current SOL price information.

**Endpoint Details:**
- **Method**: GET
- **URL**: `https://frontend-api-v3.pump.fun/sol-price`
- **Authentication**: None required
- **Rate Limit**: 50 requests/minute

**Request Example:**
```bash
curl -X GET "https://frontend-api-v3.pump.fun/sol-price" \
  -H "Origin: https://pump.fun" \
  -H "Referer: https://pump.fun/" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

**Response Example:**
```json
{
  "sol_price": 143.25
}
```

## WebSocket Infrastructure (Discovered)

While not directly accessible via HTTP endpoints, the following WebSocket infrastructure was discovered:

### NATS Messaging System
- **WebSocket URL**: `wss://prod-v2.nats.realtime.pump.fun`
- **Purpose**: Real-time trade events and live stream updates
- **Discovered Channels**:
  - `unifiedTradeEvent.{tokenMint}` - Real-time trade events for specific tokens
  - `newReplyCreated.{tokenMint}.prod` - New chat messages in live streams
  - `replyDeleted.{tokenMint}.prod` - Deleted chat messages

### Live Room Connections
- **Pattern**: `{tokenMint}:{streamId}`
- **Example**: `4F21SgBnms5bwQSjuc11ZF8ruSd9vJp6qu44rWLqpump:1272382`

## Response Schema

### Live Coin Object (from `/coins/currently-live`)

```typescript
interface LiveCoin {
  mint: string;                           // Token contract address
  name: string;                          // Token name
  symbol: string;                        // Token symbol
  description: string;                   // Token description
  image_uri: string;                     // Token image URL
  metadata_uri: string;                  // IPFS metadata URI
  twitter?: string;                      // Twitter link
  telegram?: string;                     // Telegram link
  bonding_curve: string;                 // Bonding curve address
  associated_bonding_curve: string;      // Associated bonding curve
  creator: string;                       // Creator wallet address
  created_timestamp: number;             // Creation timestamp (Unix ms)
  raydium_pool?: string;                 // Raydium pool address
  complete: boolean;                     // Whether bonding curve is complete
  virtual_sol_reserves: number;          // Virtual SOL reserves
  virtual_token_reserves: number;        // Virtual token reserves
  real_sol_reserves: number;             // Real SOL reserves
  real_token_reserves: number;           // Real token reserves
  total_supply: number;                  // Total token supply
  market_cap: number;                    // Market cap in SOL
  usd_market_cap: number;                // Market cap in USD
  last_trade_timestamp: number;          // Last trade timestamp
  king_of_the_hill_timestamp?: number;   // King of the hill timestamp
  ath_market_cap: number;                // All-time high market cap
  ath_market_cap_timestamp: number;      // ATH timestamp

  // Live streaming specific fields
  is_currently_live: boolean;            // ✅ KEY: Currently being streamed
  livestream_title: string;              // ✅ KEY: Stream title
  num_participants: number;              // ✅ KEY: Live participant count
  reply_count: number;                    // ✅ KEY: Chat message count
  thumbnail: string;                     // ✅ KEY: Stream thumbnail URL
  last_reply: number;                    // ✅ KEY: Last chat activity
  livestream_ban_expiry: number;         // Stream ban expiry
  livestream_downrank_score: number;     // Stream downrank score

  // Additional metadata
  nsfw: boolean;                         // NSFW flag
  is_banned: boolean;                    // Ban status
  hidden: boolean;                       // Hidden status
  initialized: boolean;                  // Initialization status
  video_uri?: string;                    // Video URI
  updated_at: string;                    // Last update timestamp
  program: string;                       // Program type
  platform?: string;                     // Platform
  thumbnail_updated_at: number;          // Thumbnail update timestamp
  downrank_score: number;                // Downrank score
}
```

## Error Handling

### Common HTTP Status Codes

| Status Code | Description | Cause |
|-------------|-------------|-------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid parameters |
| 429 | Rate Limited | Too many requests |
| 500 | Internal Error | Server error |

### Rate Limit Headers

When rate limited, the response includes:
- `x-ratelimit-limit: 60` - Requests allowed per minute
- `x-ratelimit-remaining: 59` - Remaining requests
- `x-ratelimit-reset: 60` - Seconds until reset

## Implementation Notes

### CORS Requirements
All requests must include proper CORS headers:
- `Origin: https://pump.fun`
- `Referer: https://pump.fun/`

### User Agent
Use a realistic user agent to avoid blocking:
- `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36`

### Rate Limiting
- Implement exponential backoff for rate limit responses
- Respect `Retry-After` headers when provided
- Cache non-time-sensitive data to reduce API calls

### Data Validation
- Always validate the `is_currently_live` field when filtering for live streams
- Handle missing optional fields gracefully
- Verify image URLs and thumbnails before displaying

## Usage Examples

### Get Currently Live Streaming Coins

```typescript
async function getLiveCoins() {
  const response = await fetch(
    'https://frontend-api-v3.pump.fun/coins/currently-live?offset=0&limit=10&includeNsfw=false',
    {
      headers: {
        'Origin': 'https://pump.fun',
        'Referer': 'https://pump.fun/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
  );

  const coins = await response.json();

  // Filter for actually live streams with activity
  const activeStreams = coins.filter(coin =>
    coin.is_currently_live &&
    coin.num_participants > 0 &&
    coin.livestream_title
  );

  return activeStreams;
}
```

### Monitor Live Stream Activity

```typescript
interface LiveStreamInfo {
  token: string;
  name: string;
  symbol: string;
  participants: number;
  chatMessages: number;
  thumbnail: string;
  title: string;
  marketCap: number;
}

async function monitorLiveStreams(): Promise<LiveStreamInfo[]> {
  const response = await fetch(
    'https://frontend-api-v3.pump.fun/coins/currently-live?limit=20',
    {
      headers: {
        'Origin': 'https://pump.fun',
        'Referer': 'https://pump.fun/'
      }
    }
  );

  const coins = await response.json();

  return coins.map(coin => ({
    token: coin.mint,
    name: coin.name,
    symbol: coin.symbol,
    participants: coin.num_participants,
    chatMessages: coin.reply_count,
    thumbnail: coin.thumbnail,
    title: coin.livestream_title || 'No Title',
    marketCap: coin.usd_market_cap
  }));
}
```

## Verification Status

All documented endpoints have been tested and verified to be functional:

- ✅ `/coins/currently-live` - Returns live streaming tokens with comprehensive metadata
- ✅ `/auth/is-valid-jurisdiction` - Validates user jurisdiction
- ✅ `/sol-price` - Provides current SOL price data

## Future Discovery Areas

Based on the analysis, additional endpoints that may exist but require further investigation:

- `/coins/{mint}/stream-details` - Individual stream details
- `/streams/chat/{streamId}` - Chat message history
- `/streams/{streamId}/participants` - Participant list
- `/users/{userId}/streams` - User's streaming history
- WebSocket endpoints for real-time updates

## Security Considerations

- No API keys or authentication required for discovered endpoints
- Respect rate limits to avoid IP blocking
- Use proper CORS headers to avoid cross-origin issues
- Cache responses appropriately to reduce server load
- Validate and sanitize all user inputs when using this data

---

*This documentation is based on API discovery conducted on 2025-10-11. Endpoints and response formats may change over time. Regular verification is recommended.*