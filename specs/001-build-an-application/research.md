# Research Findings: PumpFun Streaming API Discovery

**Created**: 2025-10-11
**Purpose**: Research findings for discovering and documenting PumpFun's streaming API

## Executive Summary

Research into API reverse engineering approaches and tools for discovering undocumented APIs. The focus is on finding PumpFun's streaming API endpoints through network traffic analysis, examining web application behavior, and creating clear documentation and TypeScript interfaces for developer use.

## Technology Decisions

### Core Runtime and Framework

**Decision**: Node.js 20.x LTS with TypeScript 5.x

**Rationale**:
- Node.js 20.x provides excellent HTTP/HTTPS client capabilities
- TypeScript 5.x offers strong type safety for API interface definitions
- Rich ecosystem for HTTP clients and network analysis tools
- Good support for making authenticated requests to discovered APIs

**Alternatives considered**:
- Python with requests library (excellent for HTTP but weaker TypeScript ecosystem)
- Browser-based JavaScript (limited by CORS for cross-origin requests)
- Go (excellent HTTP clients but overkill for simple discovery tasks)

### HTTP Client Libraries

**Decision**: Axios for HTTP requests + node-fetch for modern fetch API

**Rationale**:
- Axios provides comprehensive retry logic and error handling
- Excellent support for custom headers and authentication
- Built-in request/response transformation capabilities
- Strong TypeScript support

**Alternatives considered**:
- Got (modern but smaller ecosystem)
- node-fetch (fetch API compliant but fewer features)

### API Discovery Tools

**Decision**: Chrome DevTools + Network analysis + Manual reverse engineering

**Rationale**:
- Chrome DevTools provides excellent network traffic inspection
- Can capture real API calls made by PumpFun web application
- Manual analysis allows understanding of authentication and request patterns
- No special tools required beyond browser developer tools

**Alternatives considered**:
- Burp Suite (powerful but complex for simple API discovery)
- Fiddler (Windows-only, more complex than needed)
- Custom proxy servers (unnecessary overhead)

### Testing Framework

**Decision**: Jest with simple HTTP mocking

**Rationale**:
- Simple verification that discovered endpoints work as expected
- Mock HTTP responses for testing example code
- TypeScript support for type checking examples

**Alternatives considered**:
- No testing framework (minimal but risky for documentation quality)
- Vitest (faster but newer with fewer examples available)

## API Discovery Strategy

### Network Traffic Analysis

**Approach**: Use Chrome DevTools to monitor PumpFun's web application traffic

**Process**:
1. Navigate to PumpFun website with live streaming features
2. Open Chrome DevTools Network tab
3. Filter for XHR/Fetch requests to see API calls
4. Look for WebSocket connections for real-time data
5. Analyze request headers, parameters, and authentication

**Key Indicators of Streaming API**:
- WebSocket connections (wss:// URLs)
- API endpoints with "stream", "live", or "broadcast" in path
- Repeated polling endpoints that return stream status
- Authentication tokens in headers/cookies

### Authentication Discovery

**Methods to Identify**:
- Check localStorage/sessionStorage for tokens
- Examine cookie headers in network requests
- Look for authorization headers in API calls
- Identify JWT tokens or API key patterns

**Common Patterns**:
- Bearer tokens in Authorization headers
- API keys in X-API-Key headers
- Session cookies for authentication
- WebSocket authentication via query parameters

### API Endpoint Documentation

**Documentation Structure**:
```typescript
interface PumpFunStreamAPI {
  // Discovered endpoints and their usage
  endpoints: {
    [key: string]: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      url: string;
      headers: Record<string, string>;
      parameters?: Record<string, any>;
      body?: any;
    };
  };

  // Response structures
  responses: {
    [endpoint: string]: {
      status: number;
      data: any;
      headers: Record<string, string>;
    };
  };
}
```

### TypeScript Interface Creation

**Process**:
1. Capture actual API responses
2. Analyze response structure and data types
3. Create TypeScript interfaces matching the structure
4. Handle optional fields and null/undefined values
5. Document field meanings and constraints

**Example Structure**:
```typescript
interface StreamInfo {
  id: string;
  token: {
    address: string;
    symbol: string;
    name: string;
  };
  streamer: {
    id: string;
    username: string;
  };
  isActive: boolean;
  viewerCount: number;
  startTime: string;
  metadata?: Record<string, any>;
}
```

## Implementation Approach

### Simple Discovery Process

**Phase 1: Traffic Analysis**
1. Monitor PumpFun website network traffic
2. Identify streaming-related API calls
3. Document authentication requirements
4. Capture request/response formats

**Phase 2: API Testing**
1. Replicate discovered API calls
2. Test authentication methods
3. Verify response structures
4. Handle error cases

**Phase 3: Documentation**
1. Create TypeScript interfaces
2. Write example usage code
3. Document authentication process
4. Provide troubleshooting guidance

### Example Code Structure

```typescript
// Simple API client for discovered endpoints
class PumpFunStreamClient {
  private baseURL: string;
  private authHeaders: Record<string, string>;

  constructor(baseURL: string, authToken: string) {
    this.baseURL = baseURL;
    this.authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getActiveStreams(): Promise<StreamInfo[]> {
    // Implementation using discovered endpoint
  }

  async getStreamDetails(streamId: string): Promise<StreamInfo> {
    // Implementation using discovered endpoint
  }
}
```

## Risk Assessment

### Technical Risks

**API Discovery Challenges**:
- Risk: Streaming functionality uses WebRTC or proprietary protocols
- Mitigation: Focus on discoverable HTTP/WebSocket APIs, document limitations

**Authentication Complexity**:
- Risk: Complex authentication with rotating tokens
- Mitigation: Document authentication process clearly, provide helper functions

**API Changes**:
- Risk: PumpFun changes undocumented API frequently
- Mitigation: Focus on stable endpoints, document change detection methods

### Business Risks

**Terms of Service**:
- Risk: Reverse engineering violates terms of service
- Mitigation: Focus on public API behavior, respect rate limits

**Rate Limiting**:
- Risk: API calls get blocked during discovery
- Mitigation: Use conservative request rates, implement backoff

## Conclusion

The recommended approach focuses on simple, non-invasive API discovery using standard web development tools. By leveraging Chrome DevTools and basic HTTP client libraries, we can effectively document PumpFun's streaming API without complex infrastructure.

The emphasis is on creating clear documentation and TypeScript interfaces that enable other developers to use the discovered APIs in their projects. This approach minimizes complexity while maximizing practical utility for the development community.

Next steps should focus on the traffic analysis phase to identify actual API endpoints and patterns used by PumpFun's streaming functionality.