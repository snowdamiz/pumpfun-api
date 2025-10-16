# PumpFunAPI Client Refactoring Roadmap

## Executive Summary

Based on comprehensive analysis of the PumpFunAPIClient API, this roadmap outlines the systematic reduction of the current 65+ public methods to a streamlined 15-20 core methods. The refactoring will eliminate ~70% of thWe API surface while maintaining 100% of functionality, significantly improving developer experience and maintainability.

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

#### 1.1 Unified Stream Filtering Consolidation (Previously Phases 1.1 + 3.1)

**Consolidation Rationale:**
Phases 1.1 and 3.1 have been merged due to significant overlap in functionality. Both phases operate on the same stream dataset with different complexity levels, creating artificial API separation. Users frequently need both basic and advanced filtering in the same workflow.

**Current Methods (11 → 1):**
- `getLiveStreams()` ❌ Remove - merge into unified method
- `getLiveCoins()` ❌ Remove - merge into unified method
- `getActiveStreams()` ❌ Remove - merge into unified method
- `getTopLiveStreams()` ❌ Remove - merge into unified method
- `getTopActiveStreams()` ❌ Remove - merge into unified method
- `getTitledStreams()` ❌ Remove - merge into unified method
- `getTitledActiveStreams()` ❌ Remove - merge into unified method
- `applyAdvancedFilters()` ❌ Remove - merge into unified method
- `applyCompoundFilter()` ❌ Remove - merge into unified method
- `createCustomFilter()` ❌ Remove - merge as utility
- `getFilterBuilders()` ❌ Remove - merge as utility

**New Unified API:**
```typescript
// Single method for all stream filtering needs
filterStreams(criteria: {
  // Basic options (backwards compatible with previous getLiveStreams)
  minParticipants?: number;
  maxParticipants?: number;
  limit?: number;
  includeTitledOnly?: boolean;
  sortBy?: 'participants' | 'market_cap' | 'created_at' | 'default';
  sortOrder?: 'asc' | 'desc';
  offset?: number;

  // Advanced filtering options
  marketCapRange?: { min?: number; max?: number };
  participantRange?: { min?: number; max?: number };
  createdTimeRange?: { after?: number; before?: number };
  lastActivityRange?: { after?: number; before?: number };

  // Social media and content quality
  hasSocialMedia?: { twitter?: boolean; telegram?: boolean };
  contentQuality?: {
    hasTitle?: boolean;
    hasDescription?: boolean;
    hasImage?: boolean;
    minTitleLength?: number;
    minDescriptionLength?: number;
  };

  // Activity patterns
  activityLevel?: {
    minReplyCount?: number;
    hasRecentActivity?: boolean;
    maxIdleTime?: number;
  };

  // Text pattern matching
  textPatterns?: {
    nameContains?: string[];
    symbolContains?: string[];
    descriptionContains?: string[];
    titleContains?: string[];
    excludePatterns?: string[];
  };

  // Custom filters and compound queries
  customFilters?: Array<{ name: string; filter: (stream: LiveCoin) => boolean }>;
  compoundQuery?: {
    operator: 'AND' | 'OR';
    groups: Array<{
      filters: Partial<FilterCriteria>;
      operator: 'AND' | 'OR';
    }>;
  };
}, baseParams?: GetLiveCoinsParams): Promise<AdvancedFilterResult>
```

**Utility Functions (extracted from methods):**
```typescript
// Helper functions for common filter patterns
const FilterBuilders = {
  highQualityStreams: () => StreamFilterFunction,
  newAndTrending: (maxAgeHours?: number) => StreamFilterFunction,
  establishedStreams: (minMarketCap?: number) => StreamFilterFunction,
  activeCommunity: (minRepliesPerHour?: number) => StreamFilterFunction,
  professionalStreams: () => StreamFilterFunction,
  marketCapRange: (min: number, max: number) => StreamFilterFunction,
  participantRange: (min: number, max: number) => StreamFilterFunction,
};

// Create named custom filters
function createCustomFilter(filterFn: StreamFilterFunction, name?: string): StreamFilterFunction
```

**Benefits of Consolidation:**
- **Single Entry Point**: One method handles all filtering complexity levels
- **Backwards Compatibility**: Existing basic usage patterns still work
- **Reduced Cognitive Load**: No need to choose between basic vs advanced methods
- **Better Performance**: Unified filtering pipeline eliminates duplicate data fetching
- **Simpler API Surface**: 11 methods → 1 unified method + utilities

**Migration Examples:**
```typescript
// Old basic usage (now refactored)
const result = client.filterStreams({ minParticipants: 5, limit: 20 })
const streams = result.streams
// → New unified usage (extract streams from result)

// Old advanced usage
client.applyAdvancedFilters({ marketCapRange: { min: 1000, max: 50000 } })
// → New unified usage
client.filterStreams({ marketCapRange: { min: 1000, max: 50000 } })

// Old compound query
client.applyCompoundFilter({ groupOperator: 'OR', groups: [...] })
// → New unified usage
client.filterStreams({ compoundQuery: { operator: 'OR', groups: [...] } })
```

**Checklist:**
- [x] Implement new `filterStreams()` with unified criteria interface
- [x] Update internal StreamFilters to handle all filtering in one pipeline
- [x] Add TypeScript interfaces for unified criteria type
- [x] Extract FilterBuilders as utility functions
- [x] Remove 11 redundant methods from PumpFunAPIClient
- [x] Update examples to use unified filtering API
- [x] Update advanced filtering examples to demonstrate unified approach

#### 1.2 Stream Content Consolidation (History + Clips)

**Current Methods (13 → 1):**
- `getStreamContent()` ✅ New base method
- `getStreamClips()` ❌ Remove - merge into base
- `getCompleteClips()` ❌ Remove - merge into base
- `getHighlightClips()` ❌ Remove - merge into base
- `getClipsByDuration()` ❌ Remove - merge into base
- `getClipsByViewCount()` ❌ Remove - merge into base
- `getClipsByCreationDate()` ❌ Remove - merge into base
- `getClipsByDurationRange()` ❌ Remove - merge into base
- `getClipsByViewCountRange()` ❌ Remove - merge into base
- `getClipsByDateRange()` ❌ Remove - merge into base
- `getClipsWithUrls()` ❌ Remove - merge into base
- `getPreviousStreams()` ❌ Remove - merge into base
- `getStreamHighlights()` ❌ Remove - merge into base
- `getStreamHistory()` ❌ Remove - merge into base

**New Consolidated API:**
```typescript
// Single method for all historical/replay content
getStreamContent(mintId: string, filters?: {
  // Content type selection
  contentType?: 'clips' | 'previous_streams' | 'highlights' | 'all';
  clipType?: 'COMPLETE' | 'HIGHLIGHT' | 'all';

  // Filtering options
  includeHighlights?: boolean;
  includePreviousStreams?: boolean;
  includeClips?: boolean;

  // Limiting and sorting
  limit?: number;
  maxHighlights?: number;
  maxPreviousStreams?: number;
  daysBack?: number;

  // Clip-specific filters
  minDuration?: number;
  maxDuration?: number;
  minViewCount?: number;
  maxViewCount?: number;
  dateRange?: { start: string; end: string };
  hasUrl?: boolean;

  // Sorting options
  sortBy?: 'created_at' | 'duration' | 'view_count' | 'stream_start';
  sortOrder?: 'ASC' | 'DESC';
}): Promise<{
  clips?: StreamClip[];
  previousStreams?: PreviousStream[];
  highlights?: StreamHighlight[];
  totalCount: number;
  contentSummary: {
    clipsCount: number;
    previousStreamsCount: number;
    highlightsCount: number;
  };
}>
```

**Checklist:**
- [ ] Implement new `getStreamContent()` method with comprehensive filtering
- [ ] Update StreamFilters service to use new consolidated API
- [ ] Remove 12 redundant content retrieval methods
- [ ] Update examples to use new unified content API

---

## Phase 2: Obsolete Methods Removal (Week 3)

### Goal: Remove deprecated LiveKit and internal methods

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

## Phase 3: Examples Migration (Week 3-4)

### Goal: Update examples to demonstrate streamlined API

#### 3.1 Basic Usage Examples Overhaul

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

#### 3.2 Example Function Mapping

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
filterStreamsExample() // Shows all unified filtering options
getStreamInfoExample() // Enhanced with analysis data
liveKitConnectionExample() // Direct LiveKit usage

// Content and history examples
getStreamContentExample() // Unified content retrieval
filterStreamClipsExample() // Clip filtering
searchLiveStreamsExample() // Search functionality
getStreamStatisticsExample() // Analytics and insights

// Best practices
productionBestPractices()
errorHandlingExamples()
unifiedFilteringExamples() // Demonstrates simple to complex filtering
```

**Checklist:**
- [ ] Implement new example structure
- [ ] Update CLI commands for new examples
- [ ] Add deprecation warnings for old examples
- [ ] Update example documentation

---

## Phase 4: Documentation and Migration (Week 5-6)

### Goal: Complete documentation and migration support

#### 4.1 API Documentation Updates

**Checklist:**
- [ ] Update all JSDoc comments for new API
- [ ] Update README with new API examples
- [ ] Create breaking changes documentation
- [ ] Update changelog
- [ ] Create API comparison table
- [ ] Document removed methods and alternatives

---

## Final Target API (15-18 core methods)

### Core Stream Data and Filtering
```typescript
// Unified filtering - handles basic to advanced filtering scenarios
filterStreams(criteria: UnifiedFilterCriteria): Promise<AdvancedFilterResult>

// Search functionality
searchLiveStreams(params: SearchParams): Promise<StreamSearchResult[]>

// Stream information and analytics
getStreamInfo(mintId: string): Promise<LiveStreamInfo>
getStreamStatistics(): Promise<StreamStatistics>
isApprovedCreator(mintId: string): Promise<boolean>
```

### Stream Content and History
```typescript
getStreamContent(mintId: string, filters?: StreamContentFilters): Promise<StreamContentResult>
filterStreamClips(mintId: string, filters?: ClipFilters): Promise<ClipFilterResult>
```

### Filter Utilities (Not methods, but utility functions)
```typescript
// Available as importable utilities, not client methods
import { FilterBuilders, createCustomFilter } from './utils/filters'
```

### LiveKit Integration
```typescript
// Access LiveKitStreamManager for advanced streaming scenarios
client.liveKitManager // LiveKitStreamManager instance
LiveKitStreamManager // Exported class for direct use
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
- [ ] Reduce public API methods from 65+ to 13-15 (77% reduction) - improved by phase consolidation
- [ ] Reduce examples file from 864 to ~400 lines (54% reduction)
- [ ] Reduce example functions from 25+ to 12-15 (40% reduction)
- [ ] Maintain 100% of existing functionality
- [ ] Eliminate artificial basic/advanced filtering distinction

### Qualitative Goals
- [ ] Improve developer experience with intuitive, unified filtering approach
- [ ] Reduce cognitive load by eliminating basic/advanced filtering decision
- [ ] Eliminate redundant functionality through aggressive consolidation
- [ ] Maintain backward compatibility during transition
- [ ] Single entry point for all filtering complexity levels