# Request Format Documentation

**Created**: 2025-10-11
**Purpose**: Documentation for PumpFun API request formats based on discovered endpoints
**User Story**: US2 - Request/Response Documentation

## Overview

This document describes the standard request formats for interacting with PumpFun's streaming API endpoints. All requests follow RESTful conventions with consistent header requirements and parameter patterns.

## Base URL Structure

```
https://api.pumpfun-monitor.com/v1
```

## Authentication Requirements

### Bearer Token Authentication
Most endpoints require authentication using a bearer token:

```http
Authorization: Bearer <your_api_token>
```

### API Key Authentication
Some endpoints may use API key authentication:

```http
X-API-Key: <your_api_key>
```

## Standard Request Headers

### Required Headers (Authenticated Endpoints)

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <token>` | Authentication token |
| `Content-Type` | `application/json` | Request body format |
| `User-Agent` | `YourApp/1.0` | Client identification |
| `Accept` | `application/json` | Expected response format |

### Optional Headers

| Header | Value | Description |
|--------|-------|-------------|
| `X-Request-ID` | `<uuid>` | Unique request identifier for debugging |
| `X-Rate-Limit-Priority` | `low|medium|high` | Rate limit priority (if supported) |

## Request Formats by Endpoint Type

### 1. GET Requests - Data Retrieval

#### Basic List Requests
```http
GET /v1/streams?status=active&limit=100&offset=0
Authorization: Bearer <token>
Accept: application/json
```

#### Parameterized Requests
```http
GET /v1/streams/{streamId}?include_history=true&history_limit=10
Authorization: Bearer <token>
Accept: application/json
```

### 2. POST Requests - Data Creation

#### Webhook Registration
```http
POST /v1/webhooks
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["STREAM_STARTED", "STREAM_ENDED"],
  "secret": "optional_webhook_secret",
  "active": true
}
```

## Query Parameter Formats

### Pagination Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Maximum items per page (1-1000) |
| `offset` | integer | 0 | Number of items to skip |
| `page` | integer | 1 | Alternative pagination (1-based) |

### Filtering Parameters
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `status` | string | `active` | Filter by status enum |
| `search` | string | `token_name` | Text search query |
| `has_active_stream` | boolean | `true` | Boolean filter |
| `sort` | string | `viewer_count` | Sort field |
| `order` | string | `desc` | Sort direction (`asc`/`desc`) |

### Time-based Parameters
| Parameter | Type | Format | Example |
|-----------|------|--------|---------|
| `start_date` | string | ISO 8601 | `2025-10-11T00:00:00Z` |
| `end_date` | string | ISO 8601 | `2025-10-11T23:59:59Z` |
| `since` | string | ISO 8601 | `2025-10-11T15:30:00Z` |

## Path Parameter Formats

### Identifiers
| Parameter | Format | Example | Description |
|-----------|--------|---------|-------------|
| `{streamId}` | string | `stream_123456789` | Unique stream identifier |
| `{tokenId}` | string | `token_abc123` | Token contract address or ID |
| `{userId}` | string | `user_789` | User identifier |
| `{webhookId}` | string | `webhook_456` | Webhook identifier |

## Request Body Formats

### Standard POST Request Body
```json
{
  "required_field": "value",
  "optional_field": "value",
  "nested_object": {
    "property": "value"
  },
  "array_field": ["item1", "item2"]
}
```

### Webhook Registration Request
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["STREAM_STARTED", "STREAM_ENDED", "METADATA_UPDATED"],
  "secret": "optional_webhook_secret",
  "active": true
}
```

## Error Handling in Requests

### Validation Errors
If your request has invalid parameters, the API will return a 400 status with details:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid parameter value",
    "details": {
      "field": "limit",
      "issue": "Value must be between 1 and 1000"
    }
  }
}
```

### Rate Limiting
When rate limits are exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "retry_after": 60,
      "limit": 100,
      "window": 3600
    }
  }
}
```

## Request Examples by Use Case

### 1. Get Active Streams
```bash
curl -X GET "https://api.pumpfun-monitor.com/v1/streams?status=active&limit=50&sort=viewer_count&order=desc" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### 2. Get Stream Details
```bash
curl -X GET "https://api.pumpfun-monitor.com/v1/streams/stream_123456789?include_history=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### 3. Get Token Streaming History
```bash
curl -X GET "https://api.pumpfun-monitor.com/v1/tokens/token_abc123/streams?start_date=2025-10-10T00:00:00Z&end_date=2025-10-11T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### 4. Register Webhook
```bash
curl -X POST "https://api.pumpfun-monitor.com/v1/webhooks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "url": "https://your-app.com/webhook",
    "events": ["STREAM_STARTED", "STREAM_ENDED"],
    "secret": "webhook_secret_123"
  }'
```

### 5. Get Analytics Dashboard
```bash
curl -X GET "https://api.pumpfun-monitor.com/v1/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

## Best Practices

### 1. Authentication
- Always include a valid Authorization header
- Store tokens securely, never expose in client-side code
- Implement token refresh logic if using expiring tokens

### 2. Rate Limiting
- Implement exponential backoff for rate limit responses
- Use the `retry_after` header when provided
- Consider priority queuing for high-priority requests

### 3. Request Validation
- Validate parameters before sending requests
- Use proper URL encoding for special characters
- Validate date formats (ISO 8601)

### 4. Error Handling
- Always check the `success` field in responses
- Implement proper error handling for different error codes
- Log request IDs for debugging purposes

### 5. Performance
- Use appropriate pagination to limit response sizes
- Consider using field selection if supported
- Cache frequently accessed data

## TypeScript Request Types

### Base Request Interface
```typescript
interface BaseRequest {
  headers: {
    Authorization: string;
    'Content-Type'?: string;
    'Accept'?: string;
    'User-Agent'?: string;
    'X-Request-ID'?: string;
  };
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface TimeRangeParams {
  start_date?: string;
  end_date?: string;
  since?: string;
}
```

### Example Request Builder
```typescript
class PumpFunAPIRequest {
  private baseURL = 'https://api.pumpfun-monitor.com/v1';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'PumpFunClient/1.0'
    };
  }

  async getStreams(params: {
    status?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: string;
  } = {}): Promise<any> {
    const url = new URL(`${this.baseURL}/streams`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders()
    });

    return response.json();
  }
}
```

## Next Steps

For response format documentation, see [response-structure.md](./response-structure.md).

For complete API endpoint documentation, see [api-endpoints.md](./api-endpoints.md).

For working code examples, see the [examples](../examples/) directory.