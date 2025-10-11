# Response Structure Documentation

**Created**: 2025-10-11
**Purpose**: Documentation for PumpFun API response structures based on discovered endpoints
**User Story**: US2 - Request/Response Documentation

## Overview

This document describes the standard response structures for PumpFun's streaming API endpoints. All responses follow consistent patterns with standardized error handling and pagination formats.

## Standard Response Format

### Successful Response Structure
```json
{
  "success": true,
  "data": {
    // Response data varies by endpoint
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error context
    }
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

## Response Headers

### Standard Headers
| Header | Description | Example |
|--------|-------------|---------|
| `Content-Type` | Response format | `application/json` |
| `X-Rate-Limit-Remaining` | Remaining requests | `999` |
| `X-Rate-Limit-Reset` | Rate limit reset time | `1697044800` |
| `X-Request-ID` | Request identifier | `req_123456789` |
| `X-Response-Time` | Response processing time | `150ms` |

## Data Types and Formats

### Timestamp Format
All timestamps follow ISO 8601 format:
```json
"timestamp": "2025-10-11T15:30:00Z"
```

### Numeric Formats
- **Integers**: Whole numbers for IDs, counts, limits
- **Floats**: Decimal numbers for rates, percentages, monetary values
- **Boolean**: `true` or `false` lowercase

### String Formats
- **Identifiers**: Alphanumeric with underscores (`stream_123456789`)
- **Enums**: Uppercase with underscores (`STREAM_STARTED`)
- **URLs**: Full HTTPS URLs
- **Text**: Human-readable strings

## Response Structures by Endpoint

### 1. Streams Endpoints

#### GET /streams - List Active Streams
```json
{
  "success": true,
  "data": {
    "streams": [
      {
        "streamId": "stream_123456789",
        "tokenId": "token_abc123",
        "tokenName": "MyToken",
        "tokenSymbol": "MTK",
        "userId": "user_789",
        "username": "streamer_user",
        "status": "LIVE",
        "startTime": "2025-10-11T15:30:00Z",
        "currentViewerCount": 1250,
        "peakViewerCount": 2100,
        "thumbnailUrl": "https://cdn.example.com/thumbnails/stream_123456789.jpg",
        "quality": "1080p"
      }
    ],
    "pagination": {
      "limit": 100,
      "offset": 0,
      "total": 1500,
      "hasMore": true
    }
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

#### GET /streams/{streamId} - Stream Details
```json
{
  "success": true,
  "data": {
    "streamId": "stream_123456789",
    "tokenId": "token_abc123",
    "tokenName": "MyToken",
    "tokenSymbol": "MTK",
    "userId": "user_789",
    "username": "streamer_user",
    "status": "LIVE",
    "startTime": "2025-10-11T15:30:00Z",
    "endTime": null,
    "duration": 8100,
    "currentViewerCount": 1250,
    "peakViewerCount": 2100,
    "thumbnailUrl": "https://cdn.example.com/thumbnails/stream_123456789.jpg",
    "quality": "1080p",
    "videoUrl": "https://stream.example.com/live/stream_123456789.m3u8",
    "metadata": {
      "bitrate": 4500,
      "resolution": "1920x1080",
      "frameRate": 30.0,
      "videoCodec": "H.264",
      "audioCodec": "AAC",
      "fileSize": 2147483648,
      "viewerTimeline": [
        {
          "timestamp": "2025-10-11T16:00:00Z",
          "viewerCount": 1500
        }
      ],
      "platformData": {}
    },
    "historicalEvents": [
      {
        "eventId": "event_987654321",
        "streamId": "stream_123456789",
        "eventType": "STREAM_STARTED",
        "previousStatus": null,
        "newStatus": "STARTING",
        "eventData": {},
        "timestamp": "2025-10-11T15:30:00Z"
      }
    ]
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### 2. Stream Events

#### GET /streams/{streamId}/events - Stream Events
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "eventId": "event_987654321",
        "streamId": "stream_123456789",
        "eventType": "STREAM_STARTED",
        "previousStatus": null,
        "newStatus": "STARTING",
        "eventData": {
          "source": "user_action",
          "initiator": "user_789"
        },
        "timestamp": "2025-10-11T15:30:00Z"
      },
      {
        "eventId": "event_987654322",
        "streamId": "stream_123456789",
        "eventType": "STATUS_CHANGED",
        "previousStatus": "STARTING",
        "newStatus": "LIVE",
        "eventData": {
          "viewer_count": 100
        },
        "timestamp": "2025-10-11T15:31:00Z"
      }
    ]
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### 3. Tokens Endpoints

#### GET /tokens - List Tokens
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "tokenId": "token_abc123",
        "name": "MyToken",
        "symbol": "MTK",
        "currentStreamStatus": "LIVE",
        "streamHistoryCount": 25,
        "lastStreamActivity": "2025-10-11T15:30:00Z",
        "createdAt": "2025-09-01T10:00:00Z"
      }
    ],
    "pagination": {
      "limit": 100,
      "offset": 0,
      "total": 500,
      "hasMore": true
    }
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

#### GET /tokens/{tokenId}/streams - Token Streaming History
```json
{
  "success": true,
  "data": {
    "token": {
      "tokenId": "token_abc123",
      "name": "MyToken",
      "symbol": "MTK",
      "currentStreamStatus": "LIVE",
      "streamHistoryCount": 25,
      "lastStreamActivity": "2025-10-11T15:30:00Z",
      "createdAt": "2025-09-01T10:00:00Z"
    },
    "streams": [
      {
        "streamId": "stream_123456789",
        "tokenId": "token_abc123",
        "tokenName": "MyToken",
        "tokenSymbol": "MTK",
        "userId": "user_789",
        "username": "streamer_user",
        "status": "LIVE",
        "startTime": "2025-10-11T15:30:00Z",
        "currentViewerCount": 1250,
        "peakViewerCount": 2100,
        "thumbnailUrl": "https://cdn.example.com/thumbnails/stream_123456789.jpg",
        "quality": "1080p"
      }
    ],
    "statistics": {
      "totalStreams": 25,
      "totalDuration": 180000,
      "averageViewers": 850.5,
      "peakViewers": 5000,
      "currentStreak": 3
    }
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### 4. Users Endpoints

#### GET /users/{userId}/streams - User Streaming History
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user_789",
      "username": "streamer_user",
      "avatarUrl": "https://cdn.example.com/avatars/user_789.jpg",
      "isVerified": true,
      "followerCount": 15000,
      "totalStreamCount": 150,
      "activeStreamCount": 1,
      "lastActivity": "2025-10-11T15:30:00Z"
    },
    "activeStreams": [
      {
        "streamId": "stream_123456789",
        "tokenId": "token_abc123",
        "tokenName": "MyToken",
        "tokenSymbol": "MTK",
        "status": "LIVE",
        "startTime": "2025-10-11T15:30:00Z",
        "currentViewerCount": 1250,
        "peakViewerCount": 2100,
        "thumbnailUrl": "https://cdn.example.com/thumbnails/stream_123456789.jpg",
        "quality": "1080p"
      }
    ],
    "historicalStreams": [
      {
        "streamId": "stream_123456788",
        "tokenId": "token_def456",
        "tokenName": "OtherToken",
        "tokenSymbol": "OTK",
        "status": "ENDED",
        "startTime": "2025-10-10T18:00:00Z",
        "endTime": "2025-10-10T20:30:00Z",
        "currentViewerCount": 0,
        "peakViewerCount": 800,
        "thumbnailUrl": "https://cdn.example.com/thumbnails/stream_123456788.jpg",
        "quality": "720p"
      }
    ]
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### 5. Analytics Endpoints

#### GET /analytics/top-streams - Top Streams by Metrics
```json
{
  "success": true,
  "data": {
    "metric": "viewer_count",
    "time_range": "24h",
    "streams": [
      {
        "stream": {
          "streamId": "stream_123456789",
          "tokenId": "token_abc123",
          "tokenName": "MyToken",
          "tokenSymbol": "MTK",
          "userId": "user_789",
          "username": "streamer_user",
          "status": "LIVE",
          "startTime": "2025-10-11T15:30:00Z",
          "currentViewerCount": 1250,
          "peakViewerCount": 2100,
          "thumbnailUrl": "https://cdn.example.com/thumbnails/stream_123456789.jpg",
          "quality": "1080p"
        },
        "value": 5000,
        "rank": 1
      }
    ]
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

#### GET /analytics/dashboard - Dashboard Statistics
```json
{
  "success": true,
  "data": {
    "activeStreams": 150,
    "totalViewers": 45000,
    "streamsStarted24h": 1200,
    "peakConcurrentViewers": 75000,
    "topTokens": [
      {
        "tokenId": "token_abc123",
        "tokenName": "MyToken",
        "activeStreamCount": 5
      },
      {
        "tokenId": "token_def456",
        "tokenName": "OtherToken",
        "activeStreamCount": 3
      }
    ],
    "topStreamers": [
      {
        "userId": "user_789",
        "username": "streamer_user",
        "activeStreamCount": 1,
        "totalViewers": 5000
      },
      {
        "userId": "user_456",
        "username": "another_user",
        "activeStreamCount": 2,
        "totalViewers": 3000
      }
    ]
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### 6. Webhooks

#### POST /webhooks - Register Webhook
```json
{
  "success": true,
  "data": {
    "webhookId": "webhook_456",
    "url": "https://your-app.com/webhook",
    "events": ["STREAM_STARTED", "STREAM_ENDED"],
    "secret": "webhook_secret_123",
    "active": true,
    "createdAt": "2025-10-11T15:30:00Z"
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

## Error Response Structures

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid parameter value",
    "details": {
      "field": "limit",
      "issue": "Value must be between 1 and 1000",
      "provided_value": 2000
    }
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### 401 Unauthorized - Authentication Error
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token",
    "details": {
      "reason": "token_expired",
      "suggestion": "Please refresh your authentication token"
    }
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### 404 Not Found - Resource Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Requested resource not found",
    "details": {
      "resource": "stream",
      "identifier": "stream_invalid_id"
    }
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### 429 Rate Limited - Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "retry_after": 60,
      "limit": 100,
      "window": 3600,
      "current_usage": 101
    }
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "details": {
      "request_id": "req_123456789",
      "suggestion": "Please try again later or contact support"
    }
  },
  "timestamp": "2025-10-11T15:30:00Z"
}
```

## TypeScript Response Types

### Base Response Interfaces
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: string;
}

interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

interface Pagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

interface PaginatedResponse<T> extends APIResponse<{
  items: T[];
  pagination: Pagination;
}> {}
```

### Stream Response Types
```typescript
interface StreamSummary {
  streamId: string;
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  userId: string;
  username: string;
  status: StreamStatus;
  startTime: string;
  currentViewerCount: number;
  peakViewerCount: number;
  thumbnailUrl: string;
  quality: string;
}

interface StreamDetails extends StreamSummary {
  endTime?: string;
  duration: number;
  videoUrl: string;
  metadata: StreamMetadata;
  historicalEvents: StreamEvent[];
}

interface StreamEvent {
  eventId: string;
  streamId: string;
  eventType: EventType;
  previousStatus?: StreamStatus;
  newStatus?: StreamStatus;
  eventData: Record<string, any>;
  timestamp: string;
}

type StreamStatus = 'STARTING' | 'LIVE' | 'ENDING' | 'ENDED' | 'ERROR';
type EventType = 'STREAM_STARTED' | 'STREAM_ENDED' | 'METADATA_UPDATED' | 'STATUS_CHANGED' | 'ERROR_OCCURRED';
```

### Token Response Types
```typescript
interface Token {
  tokenId: string;
  name: string;
  symbol: string;
  currentStreamStatus?: StreamStatus;
  streamHistoryCount: number;
  lastStreamActivity?: string;
  createdAt: string;
}

interface StreamingStatistics {
  totalStreams: number;
  totalDuration: number;
  averageViewers: number;
  peakViewers: number;
  currentStreak: number;
}
```

### User Response Types
```typescript
interface User {
  userId: string;
  username: string;
  avatarUrl: string;
  isVerified: boolean;
  followerCount: number;
  totalStreamCount: number;
  activeStreamCount: number;
  lastActivity: string;
}
```

## Pagination Pattern

All list endpoints follow the same pagination pattern:

### Request Parameters
- `limit`: Number of items per page (1-1000)
- `offset`: Number of items to skip
- Alternative: `page`: 1-based page number

### Response Structure
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "limit": 100,
      "offset": 0,
      "total": 1500,
      "hasMore": true
    }
  }
}
```

### Pagination Navigation
To navigate pages:
- **Next page**: `offset += limit`
- **Previous page**: `offset -= limit` (ensure >= 0)
- **Page number**: `offset = (page - 1) * limit`

## Response Validation

### Checking Response Success
```typescript
function handleAPIResponse<T>(response: APIResponse<T>): T {
  if (!response.success) {
    throw new Error(`API Error: ${response.error?.message || 'Unknown error'}`);
  }

  if (!response.data) {
    throw new Error('No data in successful response');
  }

  return response.data;
}
```

### Type Validation
```typescript
function isStreamSummary(obj: any): obj is StreamSummary {
  return obj &&
    typeof obj.streamId === 'string' &&
    typeof obj.tokenId === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.currentViewerCount === 'number';
}
```

## Webhook Payload Structure

When webhooks are triggered, they send POST requests to your registered URL with the following structure:

### Stream Started Webhook
```json
{
  "webhookId": "webhook_456",
  "eventType": "STREAM_STARTED",
  "timestamp": "2025-10-11T15:30:00Z",
  "data": {
    "streamId": "stream_123456789",
    "tokenId": "token_abc123",
    "userId": "user_789",
    "username": "streamer_user",
    "startTime": "2025-10-11T15:30:00Z"
  }
}
```

### Stream Ended Webhook
```json
{
  "webhookId": "webhook_456",
  "eventType": "STREAM_ENDED",
  "timestamp": "2025-10-11T15:30:00Z",
  "data": {
    "streamId": "stream_123456789",
    "tokenId": "token_abc123",
    "userId": "user_789",
    "username": "streamer_user",
    "endTime": "2025-10-11T17:45:00Z",
    "duration": 8100,
    "peakViewerCount": 2100
  }
}
```

## Best Practices

### 1. Response Handling
- Always check the `success` field first
- Handle different error codes appropriately
- Use the `timestamp` field for debugging and logging

### 2. Data Validation
- Validate response structure before processing
- Check for required fields and data types
- Handle missing optional fields gracefully

### 3. Pagination
- Use the `hasMore` flag to determine if more pages exist
- Respect rate limits when making multiple requests
- Consider implementing cursor-based pagination for large datasets

### 4. Error Recovery
- Implement exponential backoff for rate limits
- Use the `retry_after` header when available
- Log request IDs for debugging

### 5. Performance
- Cache frequently accessed data
- Use appropriate pagination sizes
- Consider streaming responses for large datasets

## Next Steps

For request format documentation, see [request-format.md](./request-format.md).

For complete API endpoint documentation, see [api-endpoints.md](./api-endpoints.md).

For working code examples, see the [examples](../examples/) directory.