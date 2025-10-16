# PumpFun API Simplification Plan

## Overview

This document outlines a comprehensive plan to simplify the PumpFun API from 28+ public methods to a streamlined 8-method client that focuses on core user needs while maintaining essential LiveKit functionality.

**Current State**: 28+ public methods, 40+ exports, complex service abstractions
**Target State**: 8 core methods, simplified exports, focused functionality
**Reduction**: ~70% reduction in API surface area

## 🎯 Core User Requirements

1. **Live Stream Discovery**: Search and filter live streams
2. **Content Retrieval**: Fetch and filter clips/content
3. **LiveKit Video Streaming**: Connect to and control live video streams

---

## 📋 Proposed Simplified API Structure

### Core Client Class: `PumpFunClient`

```typescript
class PumpFunClient {
  // Stream Discovery & Filtering
  filterStreams(criteria: FilterCriteria): Promise<FilteredStreams>

  // Clip Content Retrieval
  getStreamContent(mintId: string, filters?: ContentFilters): Promise<StreamContent>

  // LiveKit Video Streaming (6 methods)
  connectToStream(mintId: string, options?: StreamOptions): Promise<StreamConnection>
  disconnectFromStream(mintId: string): Promise<void>
  getActiveStreams(): Promise<StreamConnection[]>

  // Audio/Video Controls (essential for LiveKit)
  toggleAudio(connectionIdOrMintId: string): Promise<void>
  toggleVideo(connectionIdOrMintId: string): Promise<void>
  setStreamQuality(connectionIdOrMintId: string, quality: VideoQuality): Promise<void>

  // Utility
  shutdown(): Promise<void>
}
```

### Enhanced StreamConnection Object

```typescript
interface StreamConnection {
  id: string;
  mintId: string;
  isConnected: boolean;
  state: ConnectionState;
  mediaStream?: MediaStream;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;

  // Connection management
  disconnect(): Promise<void>;
  reconnect(): Promise<void>;
  getStats(): Promise<RTCStatsReport>;

  // Media controls (convenience methods)
  toggleAudio(): Promise<void>;
  toggleVideo(): Promise<void>;
  muteAudio(): Promise<void>;
  unmuteAudio(): Promise<void>;
  muteVideo(): Promise<void>;
  unmuteVideo(): Promise<void>;
  setQuality(quality: VideoQuality): Promise<void>;

  // Event handlers
  onConnected?: (connection: StreamConnection) => void;
  onDisconnected?: (connection: StreamConnection) => void;
  onError?: (error: Error, connection: StreamConnection) => void;
  onQualityChanged?: (quality: VideoQuality) => void;
}
```

### Simplified Export Structure

```typescript
// Main exports (15 items instead of 40+)
export { PumpFunClient } from './client/PumpFunClient';
export { createClient } from './factory'; // Convenience factory

// Core types
export type {
  FilterCriteria,
  FilteredStreams,
  ContentFilters,
  StreamContent,
  StreamOptions,
  StreamConnection,
  VideoQuality,
  ConnectionState
} from './types';

// Domain types
export type {
  StreamClip,
  LiveStream,
  LiveStreamInfo
} from './types/domain.types';

// Error handling
export {
  StreamError,
  ConnectionError,
  ValidationError
} from './errors';

// Utilities
export {
  isValidMintId,
  parseStreamUrl,
  DEFAULT_STREAM_OPTIONS
} from './utils';
```

---

## 🚀 Implementation Plan: Step-by-Step Guide

### Phase 1: Foundation Setup (Days 1-2)

#### ✅ Step 1.1: Create New Type Definitions
- [ ] Create `src/types/stream.types.ts` with simplified types
- [ ] Create `src/types/content.types.ts` with content-related types
- [ ] Create `src/types/connection.types.ts` with LiveKit connection types
- [ ] Update `src/types/index.ts` to export new simplified types

```typescript
// src/types/stream.types.ts
export interface FilterCriteria {
  // Basic filters
  minParticipants?: number;
  maxParticipants?: number;
  limit?: number;
  offset?: number;

  // Advanced filters
  marketCapRange?: { min?: number; max?: number };
  createdTimeRange?: { start: string; end: string };
  hasSocialMedia?: { twitter?: boolean; telegram?: boolean };
  contentQuality?: {
    hasTitle?: boolean;
    hasDescription?: boolean;
    minTitleLength?: number;
  };

  // Search
  textPatterns?: {
    nameContains?: string[];
    symbolContains?: string[];
    excludePatterns?: string[];
  };

  // Sorting
  sortBy?: 'participants' | 'market_cap' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface FilteredStreams {
  streams: LiveStream[];
  totalCount: number;
  filteredOut: number;
  processingTimeMs: number;
  filtersApplied: string[];
}
```

#### ✅ Step 1.2: Create Utility Functions
- [ ] Create `src/utils/validation.ts` with input validation
- [ ] Create `src/utils/stream-helpers.ts` with stream processing utilities
- [ ] Create `src/utils/error-mapping.ts` with error conversion utilities

```typescript
// src/utils/validation.ts
export function isValidMintId(mintId: string): boolean {
  return typeof mintId === 'string' && mintId.length > 0 && /^[a-zA-Z0-9]+$/.test(mintId);
}

export function validateFilterCriteria(criteria: FilterCriteria): void {
  if (criteria.minParticipants !== undefined && criteria.minParticipants < 0) {
    throw new ValidationError('minParticipants must be non-negative');
  }
  // Add more validations...
}
```

#### ✅ Step 1.3: Create Factory Function
- [ ] Create `src/factory/index.ts` with convenience factory function
- [ ] Implement `createClient()` with default configuration

```typescript
// src/factory/index.ts
export function createClient(config?: ClientConfig): PumpFunClient {
  return new PumpFunClient(config);
}
```

### Phase 2: Core Client Implementation (Days 3-5)

#### ✅ Step 2.1: Create New Simplified Client
- [ ] Create `src/client/PumpFunClient.ts` with new class structure
- [ ] Implement constructor with dependency injection
- [ ] Add private initialization methods for core components

```typescript
// src/client/PumpFunClient.ts
export class PumpFunClient {
  private httpClient: HTTPClient;
  private logger: Logger;
  private liveKitManager: LiveKitManager;
  private configManager: ConfigurationManager;

  constructor(config?: ClientConfig) {
    this.initializeComponents(config);
  }

  private initializeComponents(config?: ClientConfig): void {
    // Initialize core components
  }
}
```

#### ✅ Step 2.2: Implement Stream Discovery Method
- [ ] Implement `filterStreams()` method
- [ ] Add comprehensive filtering logic
- [ ] Include performance metrics and error handling
- [ ] Add unit tests

```typescript
public async filterStreams(criteria: FilterCriteria): Promise<FilteredStreams> {
  // Validation
  validateFilterCriteria(criteria);

  // Convert criteria to internal format
  const internalCriteria = this.convertFilterCriteria(criteria);

  // Fetch and filter streams
  const result = await this.streamService.filterStreams(internalCriteria);

  return {
    streams: result.streams,
    totalCount: result.totalCount,
    filteredOut: result.filteredOut,
    processingTimeMs: result.processingTimeMs,
    filtersApplied: this.getAppliedFilters(criteria)
  };
}
```

#### ✅ Step 2.3: Implement Content Retrieval Method
- [ ] Implement `getStreamContent()` method (can reuse existing logic)
- [ ] Add comprehensive filtering for clips
- [ ] Include all content types (highlights, complete streams, previous streams)
- [ ] Add unit tests

#### ✅ Step 2.4: Implement LiveKit Connection Methods
- [ ] Create `src/services/LiveKitManager.ts` (refactor existing)
- [ ] Implement `connectToStream()` method
- [ ] Implement `disconnectFromStream()` method
- [ ] Implement `getActiveStreams()` method
- [ ] Add comprehensive error handling
- [ ] Add unit tests

```typescript
public async connectToStream(
  mintId: string,
  options?: StreamOptions
): Promise<StreamConnection> {
  // Validate mint ID
  if (!isValidMintId(mintId)) {
    throw new ValidationError('Invalid mint ID provided');
  }

  // Check if already connected
  const existingConnection = this.liveKitManager.getConnection(mintId);
  if (existingConnection?.isConnected) {
    return existingConnection;
  }

  // Create new connection
  return await this.liveKitManager.connect(mintId, options);
}
```

#### ✅ Step 2.5: Implement Audio/Video Control Methods
- [ ] Implement `toggleAudio()` method
- [ ] Implement `toggleVideo()` method
- [ ] Implement `setStreamQuality()` method
- [ ] Add comprehensive validation and error handling
- [ ] Add unit tests

```typescript
public async toggleAudio(connectionIdOrMintId: string): Promise<void> {
  const connection = this.findConnection(connectionIdOrMintId);
  if (!connection) {
    throw new ConnectionError('Connection not found');
  }

  if (connection.audioTrack) {
    connection.audioTrack.enabled = !connection.audioTrack.enabled;
    this.logger.info('Audio toggled', {
      connectionId: connection.id,
      enabled: connection.audioTrack.enabled
    });
  }
}
```

### Phase 3: Service Layer Refactoring (Days 6-8)

#### ✅ Step 3.1: Simplify LiveKit Manager
- [ ] Refactor existing `LiveKitStreamManager.ts` to `LiveKitManager.ts`
- [ ] Remove unnecessary complexity and abstractions
- [ ] Focus on core connection management
- [ ] Simplify event handling
- [ ] Add comprehensive error handling

```typescript
// src/services/LiveKitManager.ts (simplified)
export class LiveKitManager {
  private connections: Map<string, StreamConnection> = new Map();
  private liveKitRooms: Map<string, Room> = new Map();

  async connect(mintId: string, options?: StreamOptions): Promise<StreamConnection> {
    // Simplified connection logic
  }

  async disconnect(connectionIdOrMintId: string): Promise<void> {
    // Simplified disconnection logic
  }

  getConnection(connectionIdOrMintId: string): StreamConnection | undefined {
    return this.findConnection(connectionIdOrMintId);
  }

  getActiveConnections(): StreamConnection[] {
    return Array.from(this.connections.values());
  }
}
```

#### ✅ Step 3.2: Consolidate Stream Services
- [ ] Merge functionality from multiple stream services
- [ ] Create unified `StreamService.ts`
- [ ] Remove redundant service classes
- [ ] Update dependency injection

#### ✅ Step 3.3: Update Error Handling
- [ ] Create simplified error hierarchy
- [ ] Update error mapping utilities
- [ ] Ensure consistent error messages
- [ ] Add error context and suggestions

```typescript
// src/errors/index.ts
export class StreamError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'StreamError';
  }
}

export class ConnectionError extends StreamError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', details, [
      'Check your network connection',
      'Verify the stream is still active',
      'Try reconnecting'
    ]);
  }
}
```

### Phase 4: Testing & Documentation (Days 9-10)

#### ✅ Step 4.1: Comprehensive Unit Testing
- [ ] Write unit tests for all new methods
- [ ] Test error scenarios and edge cases
- [ ] Test LiveKit integration (mock LiveKit SDK)
- [ ] Add integration tests for end-to-end workflows
- [ ] Achieve >90% code coverage

```typescript
// tests/client/PumpFunClient.test.ts
describe('PumpFunClient', () => {
  describe('filterStreams', () => {
    it('should filter streams by participant count', async () => {
      const client = new PumpFunClient();
      const result = await client.filterStreams({
        minParticipants: 5,
        limit: 10
      });

      expect(result.streams).toHaveLength(10);
      expect(result.streams.every(s => s.num_participants >= 5)).toBe(true);
    });
  });
});
```

#### ✅ Step 4.2: Update Documentation
- [ ] Update README.md with new API examples
- [ ] Create migration guide from old API
- [ ] Update JSDoc comments for all public methods
- [ ] Add code examples for each use case
- [ ] Create API reference documentation

#### ✅ Step 4.3: Performance Testing
- [ ] Benchmark new API performance
- [ ] Test memory usage with multiple connections
- [ ] Verify stream filtering performance with large datasets
- [ ] Test LiveKit connection stability

### Phase 5: Deployment & Release (Days 11-12)

#### ✅ Step 5.1: Update Package Exports
- [ ] Update `src/index.ts` with new export structure
- [ ] Remove all old exports and imports
- [ ] Update package.json exports if needed

#### ✅ Step 5.2: Version Management
- [ ] Plan version bump strategy (major version for breaking changes)
- [ ] Create changelog with new features
- [ ] Update npm package information
- [ ] Prepare release notes

#### ✅ Step 5.3: Remove Legacy Code
- [ ] Delete old `PumpFunAPIClient.ts` file
- [ ] Remove unused service classes
- [ ] Clean up deprecated type definitions
- [ ] Remove legacy test files

---

## 📊 Success Metrics

### API Surface Area Reduction
- **Methods**: 28+ → 8 methods (~71% reduction)
- **Exports**: 40+ → 15 exports (~62% reduction)
- **File count**: Reduce service files by 50%

### Developer Experience Improvements
- **Learning curve**: Reduced from complex to simple
- **Documentation**: Clear examples for all methods
- **TypeScript support**: Better IntelliSense with fewer options
- **Error messages**: More actionable and specific

### Performance Improvements
- **Bundle size**: Reduced by ~30%
- **Initialization time**: Faster with fewer dependencies
- **Memory usage**: Lower with streamlined architecture

---

## 🚦 Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] API examples created
- [ ] Changelog prepared

### Deployment Steps
- [ ] Update version number (major version bump)
- [ ] Merge to main branch
- [ ] Run CI/CD pipeline
- [ ] Publish to npm
- [ ] Update GitHub releases
- [ ] Update documentation website

### Post-Deployment
- [ ] Monitor for issues
- [ ] Collect user feedback
- [ ] Update examples and tutorials
- [ ] Plan future improvements

---

## 📅 Timeline Summary

- **Phase 1**: Foundation Setup (2 days)
- **Phase 2**: Core Client Implementation (3 days)
- **Phase 3**: Service Layer Refactoring (3 days)
- **Phase 4**: Testing & Documentation (2 days)
- **Phase 5**: Deployment & Release (2 days)

**Total Estimated Time**: 12 days

---

## 🎯 Next Steps

1. **Review and approve** this plan with stakeholders
2. **Create project board** with tasks and assignments
3. **Set up branch protection** for main branch
4. **Start Phase 1 implementation**
5. **Daily progress reviews** to stay on track

This simplification will dramatically improve the developer experience while maintaining all essential functionality for live stream discovery, content retrieval, and LiveKit video streaming.