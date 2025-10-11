# Data Model: PumpFun Streaming API Discovery

**Created**: 2025-10-11
**Purpose**: TypeScript interfaces and data structures for discovered PumpFun streaming API

## Entity Overview

The API discovery focuses on documenting the following key data structures returned by PumpFun's streaming API:

1. **APIEndpoint** - Discovered API endpoints and their usage patterns
2. **StreamData** - Streaming information returned by the API
3. **Authentication** - Authentication methods and requirements
4. **TypeScriptInterface** - Type definitions for API responses
5. **APIResponse** - Common response structures

## Entity Definitions

### APIEndpoint

Represents a discovered PumpFun streaming API endpoint.

**Attributes**:
- `endpointId` (string, unique identifier) - Internal reference for the endpoint
- `url` (string, required) - Full URL of the API endpoint
- `method` (enum, required) - HTTP method (GET, POST, PUT, DELETE)
- `description` (string) - Human-readable description of what the endpoint does
- `discoveredAt` (timestamp) - When this endpoint was discovered
- `lastTested` (timestamp) - When the endpoint was last verified working
- `isActive` (boolean) - Whether the endpoint is currently functional

**Enums**:
- `HTTPMethod`: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

### StreamData

Represents streaming information returned by PumpFun's API (structure to be discovered).

**Expected Attributes** (based on typical streaming APIs):
- `streamId` (string) - Unique stream identifier
- `token` (object) - Associated token information
- `streamer` (object) - User who is streaming
- `isActive` (boolean) - Whether stream is currently live
- `viewerCount` (number) - Current number of viewers
- `startTime` (string/timestamp) - When the stream started
- `metadata` (object) - Additional stream information

**Note**: The exact structure will be discovered during API analysis.

### Authentication

Represents authentication methods and requirements for accessing the API.

**Attributes**:
- `authType` (enum, required) - Type of authentication required
- `description` (string) - How authentication works
- `requiredHeaders` (array) - Headers that must be included
- `tokenLocation` (enum) - Where the auth token is placed
- `tokenFormat` (string) - Expected format of the auth token

**Enums**:
- `AuthType`: NONE, BEARER_TOKEN, API_KEY, SESSION_COOKIE, CUSTOM
- `TokenLocation`: HEADER, QUERY_PARAM, COOKIE, BODY

### APIResponse

Represents common response structures from the API.

**Attributes**:
- `statusCode` (number) - HTTP status code
- `success` (boolean) - Whether the request was successful
- `data` (any) - Response payload
- `error` (object) - Error information if request failed
- `headers` (object) - Response headers
- `timestamp` (string) - When the response was received

## TypeScript Interfaces

### Core Interfaces (To Be Discovered)

```typescript
// Interface for stream information (will be updated based on discovery)
interface StreamInfo {
  streamId: string;
  token: TokenInfo;
  streamer: StreamerInfo;
  isActive: boolean;
  viewerCount: number;
  startTime: string;
  metadata?: Record<string, any>;
}

// Interface for token information (will be updated based on discovery)
interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  marketCap?: number;
  price?: number;
}

// Interface for streamer information (will be updated based on discovery)
interface StreamerInfo {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

// Common API response wrapper (will be updated based on discovery)
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Array response wrapper (for list endpoints)
interface ArrayResponse<T> extends APIResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Authentication Interfaces

```typescript
// Authentication request interface
interface AuthRequest {
  token: string;
  tokenType: 'bearer' | 'api_key';
}

// Authentication headers
interface AuthHeaders {
  Authorization?: string;
  'X-API-Key'?: string;
  Cookie?: string;
  [key: string]: string | undefined;
}

// Authentication configuration
interface AuthConfig {
  type: AuthType;
  tokenHeader?: string;
  tokenPrefix?: string;
  additionalHeaders?: Record<string, string>;
}
```

### API Client Interface

```typescript
// Main API client interface
interface PumpFunStreamAPI {
  // Get active streams (endpoint to be discovered)
  getActiveStreams(): Promise<StreamInfo[]>;

  // Get stream details (endpoint to be discovered)
  getStreamDetails(streamId: string): Promise<StreamInfo>;

  // Get streams by token (endpoint to be discovered)
  getStreamsByToken(tokenAddress: string): Promise<StreamInfo[]>;

  // WebSocket connection for real-time updates (to be discovered)
  connectToWebSocket?(params?: any): WebSocket;
}
```

## API Discovery Templates

### Endpoint Documentation Template

```typescript
interface EndpointDocumentation {
  name: string;
  description: string;
  method: HTTPMethod;
  url: string;
  headers: Record<string, string>;
  parameters?: {
    path?: Record<string, ParameterInfo>;
    query?: Record<string, ParameterInfo>;
    body?: ParameterInfo;
  };
  responses: {
    [statusCode: number]: ResponseExample;
  };
  examples: RequestExample[];
}

interface ParameterInfo {
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

interface ResponseExample {
  description: string;
  body: any;
  headers?: Record<string, string>;
}

interface RequestExample {
  description: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}
```

## Data Validation Rules

### API Response Validation

```typescript
// Validation function for API responses
function validateAPIResponse<T>(
  response: any,
  interfaceDefinition: any
): response is T {
  // Implementation will be created after discovering actual API structure
  return true;
}

// Error handling for API responses
interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Rate limit handling
interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}
```

## Documentation Structure

### Example Documentation Files

1. **README.md** - Main overview and getting started
2. **api-endpoints.md** - Detailed endpoint documentation
3. **authentication.md** - How to authenticate requests
4. **examples.md** - Usage examples and code samples
5. **typescript-interfaces.md** - All type definitions
6. **troubleshooting.md** - Common issues and solutions

### Example Code Structure

```
src/
├── types/
│   ├── index.ts           # Export all interfaces
│   ├── streaming-api.ts   # Stream-related interfaces
│   ├── authentication.ts  # Auth-related interfaces
│   └── common.ts          # Common response types
├── examples/
│   ├── basic-usage.ts     # Simple API usage example
│   ├── websocket.ts       # WebSocket connection example
│   └── error-handling.ts  # Error handling examples
├── utils/
│   ├── api-client.ts      # Simple API client implementation
│   └── auth-helpers.ts    # Authentication helper functions
└── index.ts               # Main entry point
```

## Data Discovery Process

### Step 1: Network Traffic Analysis
1. Monitor PumpFun web application network requests
2. Identify streaming-related API calls
3. Capture request/response formats
4. Document authentication requirements

### Step 2: API Response Analysis
1. Make test calls to discovered endpoints
2. Analyze response structures
3. Identify data types and optional fields
4. Create TypeScript interfaces

### Step 3: Documentation Creation
1. Document each discovered endpoint
2. Create working code examples
3. Add authentication guidance
4. Include error handling examples

### Step 4: Validation
1. Test all documented examples
2. Verify TypeScript interfaces match actual responses
3. Ensure authentication methods work
4. Validate error handling scenarios

This data model provides a flexible foundation for documenting PumpFun's streaming API based on what is actually discovered during the reverse engineering process. The interfaces will be updated as real API structures are identified.