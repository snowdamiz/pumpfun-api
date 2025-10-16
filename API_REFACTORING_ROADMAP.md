# PumpFunAPI Client Refactoring Roadmap

## Executive Summary

Based on comprehensive analysis of the PumpFunAPIClient API, this roadmap outlines the systematic reduction of the current 65+ public methods to a streamlined 15-20 core methods. The refactoring will eliminate ~70% of the API surface while maintaining 100% of functionality, significantly improving developer experience and maintainability.

## Current State Analysis

### API Complexity Issues
- **65+ public methods** with significant overlap and redundancy
- **7 different stream retrieval methods** that could be consolidated into 1-2 parameterized methods
- **10+ clip filtering methods** that are variations of the same core functionality
- **Obsolete LiveKit connection methods** that expose unnecessary complexity
- **Internal debugging methods** that should not be part of the public API
- **Runtime configuration methods** that promote anti-patterns

### Examples File Impact
The `src/examples/basic-usage.ts` file contains:
- **25+ exported example functions** demonstrating current redundant APIs
- **864 lines of code** with many similar examples
- **Multiple CLI commands** for redundant functionality
- **Complex example runner** that will need significant updates

---

## Phase 1: High Priority API Consolidation (Week 1-2)

### Goal: Eliminate most redundant methods and provide core functionality

#### 1.1 Stream Retrieval Consolidation

**Current Methods (7 → 2):** 
- `getLiveCoins()` ❌ Remove - merge into new method
- `getActiveStreams()` ❌ Remove - merge into new method
- `getTopLiveStreams()` ❌ Remove - merge into new method
- `getTopActiveStreams()` ❌ Remove - merge into new method
- `getTitledStreams()` ❌ Remove - merge into new method
- `getTitledActiveStreams()` ❌ Remove - merge into new method

**New Consolidated API:**
```typescript
// Core method
getLiveStreams(options?: {
  minParticipants?: number;
  limit?: number;
  includeTitledOnly?: boolean;
  sortBy?: 'participants' | 'default';
  sortOrder?: 'asc' | 'desc';
}): Promise<LiveCoin[]>
```

**Checklist:**
- [x] Implement new `getLiveStreams()` with options parameter
- [x] Update internal LiveStreamsService to handle options
- [x] Add TypeScript interfaces for new options type
- [x] Remove 5 redundant methods from PumpFunAPIClient
- [x] Update examples to use new parameterized API

#### 1.2 Stream Clips Consolidation

**Current Methods (10 → 2):**
- `getStreamClips()` ✅ Keep as base method
- `getCompleteClips()` ❌ Remove - merge into base
- `getHighlightClips()` ❌ Remove - merge into base
- `getClipsByDuration()` ❌ Remove - merge into base
- `getClipsByViewCount()` ❌ Remove - merge into base
- `getClipsByCreationDate()` ❌ Remove - merge into base
- `getClipsByDurationRange()` ❌ Remove - merge into base
- `getClipsByViewCountRange()` ❌ Remove - merge into base
- `getClipsByDateRange()` ❌ Remove - merge into base
- `getClipsWithUrls()` ❌ Remove - merge into base

**New Consolidated API:**
```typescript
// Core filtering method
getStreamClips(mintId: string, filters?: {
  clipType?: 'COMPLETE' | 'HIGHLIGHT';
  limit?: number;
  sortBy?: 'created_at' | 'duration' | 'view_count';
  sortOrder?: 'ASC' | 'DESC';
  minDuration?: number;
  maxDuration?: number;
  minViewCount?: number;
  maxViewCount?: number;
  dateRange?: { start: string; end: string };
  hasUrl?: boolean;
}): Promise<StreamClip>
```

**Checklist:**
- [ ] Implement new `filterStreamClips()` with comprehensive filters
- [ ] Simplify `getStreamClips()` to basic retrieval
- [ ] Update StreamFilters service to use new consolidated API
- [ ] Remove 8 redundant clip filtering methods

#### 1.3 History Methods Consolidation

**Current Methods (3 → 1):**
- `getPreviousStreams()` ❌ Remove - redundant
- `getStreamHighlights()` ❌ Remove - redundant
- `getStreamHistory()` ✅ Keep and enhance

**Enhanced API:**
```typescript
getStreamHistory(mintId: string, options?: {
  includePreviousStreams?: boolean;
  includeHighlights?: boolean;
  maxPreviousStreams?: number;
  maxHighlights?: number;
  daysBack?: number;
  sortBy?: 'created_at' | 'duration' | 'view_count';
  sortOrder?: 'ASC' | 'DESC';
}): Promise<StreamHistoryResult>
```

**Checklist:**
- [ ] Enhance `getStreamHistory()` with comprehensive options
- [ ] Remove `getPreviousStreams()` and `getStreamHighlights()`
- [ ] Update history-related examples

---

## Phase 2: Obsolete Methods Removal (Week 3)

### Goal: Remove deprecated LiveKit and internal methods

#### 2.1 LiveKit Connection Methods

**Current Methods to Remove:**
- `connectToLiveStream()` ❌ Remove - too complex, should be abstracted
- `joinLiveStream()` ❌ Remove - superseded by simplified connection
- `getLiveKitConnectionInfo()` ❌ Remove - internal detail
- `getVideoStreamAnalysis()` ❌ Remove - combine into stream info

**New Simplified API:**
```typescript
// Simple stream joining
joinStream(mintId: string, options?: {
  autoPlay?: boolean;
  videoElement?: HTMLVideoElement;
  audioElement?: HTMLAudioElement;
}): Promise<StreamConnection>

// Enhanced stream info (includes analysis)
getStreamInfo(mintId: string): Promise<LiveStreamInfo & {
  videoAnalysis?: VideoStreamAnalysis;
  liveKitConnection?: LiveKitConnectionInfo;
}>
```

**Checklist:**
- [ ] Implement simplified `joinStream()` method
- [ ] Enhance `getStreamInfo()` to include analysis data
- [ ] Remove 4 complex LiveKit methods
- [ ] Update LiveKit integration to use new API
- [ ] Create LiveKitManager class for advanced use cases (separate package)
- [ ] Update all LiveKit examples
- [ ] Remove LiveKit-related complexity from main client

#### 2.2 Internal and Debugging Methods

**Methods to Remove:**
- `attemptErrorRecovery()` ❌ Remove - internal logic
- `getErrorDiagnostics()` ❌ Remove - debugging tool
- `isClientInitialized()` ❌ Remove - should throw errors automatically
- `getRateLimitBackoffRemaining()` ❌ Remove - internal detail
- `getLogger()` ❌ Remove - internal access
- `getRateLimiter()` ❌ Remove - internal access
- `ensureInitialized()` ❌ Remove - private method made public
- `getBaseURL()` ❌ Remove - configuration detail
- `getTimeout()` ❌ Remove - configuration detail

**Checklist:**
- [ ] Remove 9 internal/debugging methods
- [ ] Ensure proper error handling throws automatically
- [ ] Remove configuration detail exposure
- [ ] Update error handling to be automatic
- [ ] Remove internal component access methods

#### 2.3 Redundant Utility Methods

**Methods to Remove/Consolidate:**
- `testConnection()` ❌ Remove - just calls validateJurisdiction
- `validateJurisdiction()` ❌ Remove - should be internal
- `updateLoggerConfig()` ❌ Remove - runtime config anti-pattern
- `updateRateLimitConfig()` ❌ Remove - runtime config anti-pattern
- `getConfiguration()` ❌ Remove - internal exposure
- `getState()` ❌ Remove - internal exposure
- `resetStatistics()` ❌ Remove - rarely needed
- `getStatistics()` ❌ Remove - use external monitoring

**Checklist:**
- [ ] Remove 8 redundant utility methods
- [ ] Make jurisdiction validation internal
- [ ] Remove runtime configuration methods
- [ ] Remove configuration and state exposure
- [ ] Remove manual statistics methods
- [ ] Update all configuration examples

---

## Phase 3: Advanced Filtering Consolidation (Week 4)

### Goal: Simplify complex filtering into unified API

#### 3.1 Advanced Filtering Methods

**Current Methods (4 → 1):**
- `applyAdvancedFilters()` ❌ Remove - merge
- `applyCompoundFilter()` ❌ Remove - merge
- `createCustomFilter()` ❌ Remove - merge
- `getFilterBuilders()` ❌ Remove - merge

**New Unified API:**
```typescript
filterStreams(criteria: {
  // Basic filters
  minParticipants?: number;
  maxParticipants?: number;
  includeTitledOnly?: boolean;

  // Custom filters
  customFilters?: Array<{
    name: string;
    filter: (stream: LiveCoin) => boolean;
  }>;

  // Compound queries
  compoundQuery?: {
    operator: 'AND' | 'OR';
    groups: Array<{
      filters: Partial<FilterCriteria>;
      operator: 'AND' | 'OR';
    }>;
  };

  // Sorting and pagination
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}, baseParams?: GetLiveCoinsParams): Promise<AdvancedFilterResult>
```

**Checklist:**
- [ ] Implement unified `filterStreams()` method
- [ ] Support all current filtering capabilities
- [ ] Remove 4 redundant filtering methods
- [ ] Update advanced filtering examples

---

## Phase 4: Examples Migration (Week 5-6)

### Goal: Update examples to demonstrate streamlined API

#### 4.1 Basic Usage Examples Overhaul

**Current State:**
- 864 lines of code
- 25+ exported example functions
- Many redundant examples

**Target State:**
- ~400 lines of code
- 12-15 focused example functions
- Clear demonstration of consolidated API

**Checklist:**
- [ ] Remove redundant example functions
- [ ] Update examples to use new consolidated methods
- [ ] Consolidate similar examples (e.g., all stream retrieval examples)
- [ ] Update CLI command structure
- [ ] Simplify example runner
- [ ] Update example documentation
- [ ] Remove obsolete LiveKit examples (move to separate package)
- [ ] Consolidate clip filtering examples
- [ ] Update advanced filtering examples

#### 4.2 Example Function Mapping

**Examples to Remove/Consolidate:**
- `getActiveStreamsExample()` → merge into `getLiveStreamsExample()`
- `getTopLiveStreamsExample()` → merge into `getLiveStreamsExample()`
- `getTitledStreamsExample()` → merge into `getLiveStreamsExample()`
- `getComprehensiveLiveDataExample()` → remove, covered by other examples
- `getCompleteClipsExample()` → merge into clip filtering examples
- `getHighlightClipsExample()` → merge into clip filtering examples
- All 8 clip filtering utility examples → consolidate into 2-3
- 4 LiveKit integration examples → move to separate package

**New Example Structure:**
```typescript
// Core API examples
basicInitialization()
getLiveStreamsExample() // Shows all stream retrieval options
getStreamInfoExample() // Enhanced with analysis data
joinStreamExample() // Simplified connection

// Filtering examples
searchLiveStreamsExample()
filterStreamsExample() // Advanced filtering
filterStreamClipsExample() // Clip filtering

// History and analysis
getStreamHistoryExample()
getStreamStatisticsExample()

// Best practices
productionBestPractices()
errorHandlingExamples()
```

**Checklist:**
- [ ] Implement new example structure
- [ ] Update CLI commands for new examples
- [ ] Add deprecation warnings for old examples
- [ ] Update example documentation

---

## Phase 5: Documentation and Migration (Week 7-8)

### Goal: Complete documentation and migration support

#### 5.1 API Documentation Updates

**Checklist:**
- [ ] Update all JSDoc comments for new API
- [ ] Update README with new API examples
- [ ] Create breaking changes documentation
- [ ] Update changelog
- [ ] Create API comparison table
- [ ] Document removed methods and alternatives

---

## Final Target API (15-18 core methods)

### Core Stream Data
```typescript
getLiveStreams(options?: StreamOptions): Promise<LiveCoin[]>
searchLiveStreams(params: SearchParams): Promise<StreamSearchResult[]>
getStreamInfo(mintId: string): Promise<LiveStreamInfo>
getStreamStatistics(): Promise<StreamStatistics>
```

### Stream History and Clips
```typescript
getStreamHistory(mintId: string, options?: HistoryOptions): Promise<StreamHistoryResult>
filterStreamClips(mintId: string, filters?: ClipFilters): Promise<ClipFilterResult>
getStreamClips(mintId: string, clipType?: 'COMPLETE' | 'HIGHLIGHT', limit?: number): Promise<StreamClip[]>
```

### Filtering and Search
```typescript
filterStreams(criteria: FilterCriteria, baseParams?: GetLiveCoinsParams): Promise<AdvancedFilterResult>
isApprovedCreator(mintId: string): Promise<boolean>
```

### Simplified Live Streaming
```typescript
joinStream(mintId: string, options?: JoinOptions): Promise<StreamConnection>
```

### Utilities and Configuration
```typescript
constructor(config?: ClientConfig)
shutdown(): void
toString(): string
toJSON(): object
```

---

## Success Metrics

### Quantitative Goals
- [ ] Reduce public API methods from 65+ to 15-18 (72% reduction)
- [ ] Reduce examples file from 864 to ~400 lines (54% reduction)
- [ ] Reduce example functions from 25+ to 12-15 (40% reduction)
- [ ] Maintain 100% of existing functionality

### Qualitative Goals
- [ ] Improve developer experience with intuitive, parameterized methods
- [ ] Reduce cognitive load for API users
- [ ] Eliminate redundant functionality
- [ ] Maintain backward compatibility during transition