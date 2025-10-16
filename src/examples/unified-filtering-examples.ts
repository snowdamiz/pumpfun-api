/**
 * Unified Stream Filtering Examples for PumpFun API Client
 *
 * This file demonstrates the new consolidated filterStreams() method
 * that replaces 11+ separate filtering methods with a single, comprehensive interface.
 */

import { PumpFunAPIClient } from '../client';
import { FilterBuilders } from '../utils';

/**
 * Initialize the client
 */
const client = new PumpFunAPIClient();

/**
 * Basic usage examples - backwards compatible with previous filtering methods
 */
export async function basicFilteringExamples() {
  console.log('=== Basic Filtering Examples ===');

  // Example 1: Get active streams with minimum participants
  const activeStreams = await client.filterStreams({
    minParticipants: 5,
    limit: 20
  });
  console.log(`Found ${activeStreams.streams.length} active streams with 5+ participants`);

  // Example 2: Get top streams by participant count
  const topStreams = await client.filterStreams({
    sortBy: 'participants',
    sortOrder: 'desc',
    limit: 10
  });
  console.log(`Found ${topStreams.streams.length} top streams by participants`);

  // Example 3: Get only streams with titles
  const titledStreams = await client.filterStreams({
    includeTitledOnly: true,
    limit: 15
  });
  console.log(`Found ${titledStreams.streams.length} streams with titles`);
}

/**
 * Advanced filtering examples - new unified capabilities
 */
export async function advancedFilteringExamples() {
  console.log('=== Advanced Filtering Examples ===');

  // Example 1: Market cap and participant range filtering
  const establishedStreams = await client.filterStreams({
    marketCapRange: { min: 10000, max: 500000 },
    participantRange: { min: 10, max: 100 },
    sortBy: 'market_cap',
    sortOrder: 'desc',
    limit: 20
  });
  console.log(`Found ${establishedStreams.streams.length} established streams`);

  // Example 2: Content quality filtering
  const qualityStreams = await client.filterStreams({
    contentQuality: {
      hasTitle: true,
      hasDescription: true,
      minTitleLength: 20,
      minDescriptionLength: 100
    },
    hasSocialMedia: { twitter: true, telegram: true },
    limit: 15
  });
  console.log(`Found ${qualityStreams.streams.length} high-quality streams`);

  // Example 3: Text pattern matching
  const cryptoStreams = await client.filterStreams({
    textPatterns: {
      nameContains: ['crypto', 'defi', 'token'],
      symbolContains: ['USD'],
      excludePatterns: ['scam', 'fake']
    },
    limit: 25
  });
  console.log(`Found ${cryptoStreams.streams.length} crypto-related streams`);

  // Example 4: Activity level filtering
  const activeCommunityStreams = await client.filterStreams({
    activityLevel: {
      minReplyCount: 10,
      hasRecentActivity: true,
      maxIdleTime: 60 // 1 hour
    },
    participantRange: { min: 5 },
    limit: 20
  });
  console.log(`Found ${activeCommunityStreams.streams.length} streams with active communities`);
}

/**
 * Compound query examples - complex logical operations
 */
export async function compoundQueryExamples() {
  console.log('=== Compound Query Examples ===');

  // Example 1: OR query - established OR high-quality streams
  const establishedOrQuality = await client.filterStreams({
    compoundQuery: {
      operator: 'OR',
      groups: [
        {
          operator: 'AND',
          filters: {
            marketCapRange: { min: 50000 },
            participantRange: { min: 10 }
          }
        },
        {
          operator: 'AND',
          filters: {
            contentQuality: { hasTitle: true, hasDescription: true },
            hasSocialMedia: { twitter: true }
          }
        }
      ]
    },
    limit: 30
  });
  console.log(`Found ${establishedOrQuality.streams.length} established OR high-quality streams`);

  // Example 2: Complex nested query
  const complexFilter = await client.filterStreams({
    compoundQuery: {
      operator: 'AND',
      groups: [
        {
          operator: 'OR',
          filters: {
            marketCapRange: { min: 10000, max: 100000 },
            participantRange: { min: 20, max: 200 }
          }
        },
        {
          operator: 'AND',
          filters: {
            activityLevel: { hasRecentActivity: true },
            contentQuality: { hasTitle: true }
          }
        }
      ]
    },
    sortBy: 'participants',
    sortOrder: 'desc',
    limit: 25
  });
  console.log(`Found ${complexFilter.streams.length} streams matching complex criteria`);
}

/**
 * Custom filter examples - using FilterBuilders
 */
export async function customFilterExamples() {
  console.log('=== Custom Filter Examples ===');

  // Example 1: Using predefined filter builders
  const highQualityStreams = await client.filterStreams({
    customFilters: [
      { name: 'high-quality', filter: FilterBuilders.highQualityStreams() }
    ],
    limit: 20
  });
  console.log(`Found ${highQualityStreams.streams.length} high-quality streams`);

  // Example 2: Combining multiple filter builders
  const trendingStreams = await client.filterStreams({
    customFilters: [
      { name: 'new-trending', filter: FilterBuilders.newAndTrending(24) },
      { name: 'active-community', filter: FilterBuilders.activeCommunity(5) }
    ],
    sortBy: 'participants',
    sortOrder: 'desc',
    limit: 15
  });
  console.log(`Found ${trendingStreams.streams.length} trending streams`);

  // Example 3: Custom inline filter
  const customEngagementFilter = await client.filterStreams({
    customFilters: [
      {
        name: 'high-engagement',
        filter: (stream) => {
          const engagementRatio = (stream.reply_count ?? 0) / Math.max(stream.num_participants ?? 1, 1);
          return engagementRatio > 2; // More than 2 replies per participant
        }
      },
      {
        name: 'recent-creation',
        filter: (stream) => {
          const ageHours = (Date.now() - stream.created_timestamp * 1000) / (1000 * 60 * 60);
          return ageHours < 48; // Created within last 48 hours
        }
      }
    ],
    limit: 20
  });
  console.log(`Found ${customEngagementFilter.streams.length} streams with high engagement`);
}

/**
 * Performance and analytics examples
 */
export async function performanceExamples() {
  console.log('=== Performance and Analytics Examples ===');

  // Example 1: Large-scale filtering with performance metrics
  const startTime = Date.now();
  const largeFilter = await client.filterStreams({
    marketCapRange: { min: 1000 },
    participantRange: { min: 1 },
    contentQuality: { hasTitle: true },
    limit: 100
  });
  const duration = Date.now() - startTime;

  console.log(`Performance metrics:`);
  console.log(`- Processing time: ${largeFilter.metrics.processingTimeMs}ms`);
  console.log(`- Filters applied: ${largeFilter.metrics.filtersApplied}`);
  console.log(`- Total before filtering: ${largeFilter.totalBeforeFilter}`);
  console.log(`- Filtered out: ${largeFilter.filteredOut}`);
  console.log(`- Final count: ${largeFilter.streams.length}`);
  console.log(`- API call duration: ${duration}ms`);

  // Example 2: Comparative filtering
  const filters = [
    { name: 'Basic', criteria: { minParticipants: 5, limit: 20 } },
    { name: 'Quality', criteria: { contentQuality: { hasTitle: true, hasDescription: true }, limit: 20 } },
    { name: 'Social', criteria: { hasSocialMedia: { twitter: true }, limit: 20 } },
    { name: 'Active', criteria: { activityLevel: { hasRecentActivity: true }, limit: 20 } }
  ];

  console.log('\nComparative filtering results:');
  for (const filterConfig of filters) {
    const result = await client.filterStreams(filterConfig.criteria);
    console.log(`${filterConfig.name}: ${result.streams.length} streams (${result.metrics.processingTimeMs}ms)`);
  }
}

/**
 * Migration examples - showing how to migrate from old methods
 */
export async function migrationExamples() {
  console.log('=== Migration Examples ===');

  // NEW WAY (unified):
  const newResult = await client.filterStreams({
    marketCapRange: { min: 10000 },
    participantRange: { min: 5 }
  });
  console.log(`Advanced filtering: ${newResult.streams.length} streams`);

  // NEW WAY (unified):
  const qualityFilter = FilterBuilders.highQualityStreams();
  const qualityResult = await client.filterStreams({
    customFilters: [{ name: 'high-quality', filter: qualityFilter }],
    limit: 20
  });
  console.log(`Filter builders: ${qualityResult.streams.length} streams`);
}

/**
 * Run all examples
 */
export async function runUnifiedFilteringExamples() {
  try {
    await basicFilteringExamples();
    console.log('\n');

    await advancedFilteringExamples();
    console.log('\n');

    await compoundQueryExamples();
    console.log('\n');

    await customFilterExamples();
    console.log('\n');

    await performanceExamples();
    console.log('\n');

    await migrationExamples();

    console.log('\n=== All unified filtering examples completed successfully! ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('unified-filtering-examples.ts')) {
  runUnifiedFilteringExamples();
}