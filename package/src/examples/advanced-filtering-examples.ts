/**
 * Advanced Filtering Examples for PumpFun API Client
 *
 * This module demonstrates the new advanced filtering capabilities introduced in T043,
 * including custom filter functions, compound queries, and predefined filter builders.
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import {
  LogLevel,
  AdvancedFilterCriteria,
  CompoundFilterQuery,
  StreamFilterFunction,
} from '../types';

/**
 * Example 1: Using predefined filter builders
 */
export async function demonstratePredefinedFilters() {
  console.log('=== Predefined Filter Builders Example ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableColors: true,
    },
  });

  try {
    const filterBuilders = client.getFilterBuilders();

    // Get high-quality streams
    console.log('🔍 Finding high-quality streams...');
    const highQualityFilter = filterBuilders.highQualityStreams();
    const highQualityResult = await client.applyAdvancedFilters({
      customFilters: [highQualityFilter],
    });

    console.log(`✅ Found ${highQualityResult.streams.length} high-quality streams`);
    console.log(`   📊 Filtered from ${highQualityResult.totalBeforeFilter} total streams`);
    console.log(`   ⏱️  Processing time: ${highQualityResult.metrics.processingTimeMs}ms`);

    // Get new and trending streams (last 24 hours)
    console.log('\n🔥 Finding new and trending streams (last 24 hours)...');
    const trendingFilter = filterBuilders.newAndTrending(24);
    const trendingResult = await client.applyAdvancedFilters({
      customFilters: [trendingFilter],
    });

    console.log(`✅ Found ${trendingResult.streams.length} trending streams`);
    console.log(`   📊 Filtered from ${trendingResult.totalBeforeFilter} total streams`);

    // Get professional streams
    console.log('\n💼 Finding professional streams...');
    const professionalFilter = filterBuilders.professionalStreams();
    const professionalResult = await client.applyAdvancedFilters({
      customFilters: [professionalFilter],
    });

    console.log(`✅ Found ${professionalResult.streams.length} professional streams`);
    console.log(`   📊 Filtered from ${professionalResult.totalBeforeFilter} total streams`);

    return {
      client,
      results: {
        highQuality: highQualityResult,
        trending: trendingResult,
        professional: professionalResult,
      },
    };
  } catch (error) {
    console.error('❌ Error with predefined filters:', error);
    throw error;
  }
}

/**
 * Example 2: Custom filter functions
 */
export async function demonstrateCustomFilters() {
  console.log('=== Custom Filter Functions Example ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
    },
  });

  try {
    // Create custom filter for streams with specific characteristics
    const customFilter: StreamFilterFunction = stream => {
      const hasTitle = !!(stream.livestream_title && stream.livestream_title.length > 15);
      const hasSocial = !!(stream.twitter && stream.telegram);
      const isEngaging = (stream.num_participants ?? 0) >= 3 && (stream.reply_count ?? 0) >= 5;
      const hasGoodMarketCap = stream.usd_market_cap >= 1000;

      return hasTitle && hasSocial && isEngaging && hasGoodMarketCap;
    };

    const namedFilter = client.createCustomFilter(customFilter, 'engagingSocialStreams');

    console.log('🎯 Applying custom filter for engaging social streams...');
    const customResult = await client.applyAdvancedFilters({
      customFilters: [namedFilter],
    });

    console.log(`✅ Found ${customResult.streams.length} streams matching custom criteria`);
    console.log(`   📊 Filtered from ${customResult.totalBeforeFilter} total streams`);
    console.log(`   ⏱️  Processing time: ${customResult.metrics.processingTimeMs}ms`);

    // Display some results
    if (customResult.streams.length > 0) {
      console.log('\n📋 Sample results:');
      customResult.streams.slice(0, 3).forEach((stream, index) => {
        console.log(`   ${index + 1}. ${stream.name} (${stream.symbol})`);
        console.log(`      📺 Title: "${stream.livestream_title}"`);
        console.log(`      👥 Participants: ${stream.num_participants}`);
        console.log(`      💬 Messages: ${stream.reply_count}`);
        console.log(`      💰 Market Cap: $${stream.usd_market_cap.toLocaleString()}`);
        console.log(`      🐦 Twitter: ${stream.twitter ?? 'None'}`);
        console.log(`      📱 Telegram: ${stream.telegram ?? 'None'}`);
      });
    }

    return { client, result: customResult };
  } catch (error) {
    console.error('❌ Error with custom filters:', error);
    throw error;
  }
}

/**
 * Example 3: Complex criteria filtering
 */
export async function demonstrateComplexCriteria() {
  console.log('=== Complex Criteria Filtering Example ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
    },
  });

  try {
    const complexCriteria: AdvancedFilterCriteria = {
      // Market cap range: $1,000 - $100,000
      marketCapRange: {
        min: 1000,
        max: 100000,
      },
      // Participant range: 5-50 participants
      participantRange: {
        min: 5,
        max: 50,
      },
      // Must have social media presence
      hasSocialMedia: {
        twitter: true,
        telegram: false, // Telegram optional
      },
      // Content quality requirements
      contentQuality: {
        hasTitle: true,
        minTitleLength: 10,
        hasDescription: true,
        minDescriptionLength: 50,
      },
      // Activity level requirements
      activityLevel: {
        minReplyCount: 10,
        hasRecentActivity: true, // Activity in last hour
      },
      // Text pattern matching
      textPatterns: {
        nameContains: ['crypto', 'defi', 'token'],
        excludePatterns: ['scam', 'fake', 'test'],
      },
    };

    console.log('🎯 Applying complex filtering criteria...');
    console.log('   📊 Market Cap: $1,000 - $100,000');
    console.log('   👥 Participants: 5-50');
    console.log('   🐦 Must have Twitter');
    console.log('   📝 Title min 10 chars, Description min 50 chars');
    console.log('   💬 Min 10 replies, recent activity');
    console.log('   🔍 Name contains crypto/defi/token');
    console.log('   ❌ Excludes scam/fake/test');

    const complexResult = await client.applyAdvancedFilters(complexCriteria);

    console.log(`\n✅ Found ${complexResult.streams.length} streams matching complex criteria`);
    console.log(`   📊 Filtered from ${complexResult.totalBeforeFilter} total streams`);
    console.log(`   ⏱️  Processing time: ${complexResult.metrics.processingTimeMs}ms`);
    console.log(`   🔧 Filters applied: ${complexResult.metrics.filtersApplied}`);

    // Display criteria summary
    console.log('\n📋 Applied criteria summary:');
    Object.entries(complexResult.appliedCriteria).forEach(([key, value]) => {
      console.log(`   ${key}: ${JSON.stringify(value)}`);
    });

    return { client, result: complexResult };
  } catch (error) {
    console.error('❌ Error with complex criteria:', error);
    throw error;
  }
}

/**
 * Example 4: Compound filter queries with logical operators
 */
export async function demonstrateCompoundQueries() {
  console.log('=== Compound Filter Queries Example ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
    },
  });

  try {
    const compoundQuery: CompoundFilterQuery = {
      groupOperator: 'OR',
      groups: [
        {
          operator: 'AND',
          criteria: [
            {
              // Group 1: High engagement streams
              participantRange: { min: 20 },
              activityLevel: { minReplyCount: 50 },
              hasSocialMedia: { twitter: true },
            },
            {
              // Group 1 continued: Good content quality
              contentQuality: {
                hasTitle: true,
                minTitleLength: 15,
              },
            },
          ],
        },
        {
          operator: 'AND',
          criteria: [
            {
              // Group 2: Established streams
              marketCapRange: { min: 50000 },
              textPatterns: {
                nameContains: ['bitcoin', 'ethereum', 'solana'],
              },
            },
            {
              // Group 2 continued: Active community
              activityLevel: {
                hasRecentActivity: true,
              },
            },
          ],
        },
      ],
    };

    console.log('🔗 Applying compound query with OR logic...');
    console.log('   Group 1 (AND): High engagement + Good content');
    console.log('     - Min 20 participants');
    console.log('     - Min 50 replies');
    console.log('     - Has Twitter');
    console.log('     - Title min 15 chars');
    console.log('   OR');
    console.log('   Group 2 (AND): Established + Active community');
    console.log('     - Market cap min $50,000');
    console.log('     - Name contains bitcoin/ethereum/solana');
    console.log('     - Recent activity');

    const compoundResult = await client.applyCompoundFilter(compoundQuery);

    console.log(`\n✅ Found ${compoundResult.streams.length} streams matching compound query`);
    console.log(`   📊 Filtered from ${compoundResult.totalBeforeFilter} total streams`);
    console.log(`   ⏱️  Processing time: ${compoundResult.metrics.processingTimeMs}ms`);
    console.log(`   🔧 Filters applied: ${compoundResult.metrics.filtersApplied}`);

    // Display query summary
    console.log('\n📋 Query summary:');
    Object.entries(compoundResult.appliedCriteria.query).forEach(([key, value]) => {
      console.log(`   ${key}: ${JSON.stringify(value)}`);
    });

    return { client, result: compoundResult };
  } catch (error) {
    console.error('❌ Error with compound queries:', error);
    throw error;
  }
}

/**
 * Example 5: Performance comparison
 */
export async function demonstratePerformanceComparison() {
  console.log('=== Performance Comparison Example ===');

  const client = new PumpFunAPIClient({
    loggerConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
    },
  });

  try {
    // Test 1: Simple market cap range filter
    console.log('📊 Test 1: Simple market cap range filter...');
    const startTime1 = Date.now();
    const simpleResult = await client.applyAdvancedFilters({
      marketCapRange: { min: 1000, max: 50000 },
    });
    const time1 = Date.now() - startTime1;

    console.log(`   ⏱️  Time: ${time1}ms`);
    console.log(`   📊 Results: ${simpleResult.streams.length} streams`);
    console.log(
      `   📈 Efficiency: ${((simpleResult.streams.length / time1) * 1000).toFixed(1)} streams/sec`
    );

    // Test 2: Complex multi-criteria filter
    console.log('\n📊 Test 2: Complex multi-criteria filter...');
    const startTime2 = Date.now();
    const complexResult = await client.applyAdvancedFilters({
      marketCapRange: { min: 1000, max: 50000 },
      participantRange: { min: 5, max: 100 },
      hasSocialMedia: { twitter: true },
      contentQuality: {
        hasTitle: true,
        hasDescription: true,
      },
      activityLevel: {
        minReplyCount: 10,
        hasRecentActivity: true,
      },
      textPatterns: {
        excludePatterns: ['test', 'demo'],
      },
    });
    const time2 = Date.now() - startTime2;

    console.log(`   ⏱️  Time: ${time2}ms`);
    console.log(`   📊 Results: ${complexResult.streams.length} streams`);
    console.log(
      `   📈 Efficiency: ${((complexResult.streams.length / time2) * 1000).toFixed(1)} streams/sec`
    );

    // Test 3: Compound query with logical operators
    console.log('\n📊 Test 3: Compound query with logical operators...');
    const startTime3 = Date.now();
    const compoundResult = await client.applyCompoundFilter({
      groupOperator: 'OR',
      groups: [
        {
          operator: 'AND',
          criteria: [{ participantRange: { min: 10 } }, { hasSocialMedia: { twitter: true } }],
        },
        {
          operator: 'AND',
          criteria: [{ marketCapRange: { min: 10000 } }, { contentQuality: { hasTitle: true } }],
        },
      ],
    });
    const time3 = Date.now() - startTime3;

    console.log(`   ⏱️  Time: ${time3}ms`);
    console.log(`   📊 Results: ${compoundResult.streams.length} streams`);
    console.log(
      `   📈 Efficiency: ${((compoundResult.streams.length / time3) * 1000).toFixed(1)} streams/sec`
    );

    // Performance analysis
    console.log('\n📈 Performance Analysis:');
    console.log(`   🏃‍♂️ Fastest: ${Math.min(time1, time2, time3)}ms`);
    console.log(`   🐌 Slowest: ${Math.max(time1, time2, time3)}ms`);
    console.log(`   ⚡ Average: ${((time1 + time2 + time3) / 3).toFixed(1)}ms`);

    if (time1 < 100 && time2 < 200 && time3 < 300) {
      console.log('   ✅ Excellent performance (< 100ms simple, < 300ms complex)');
    } else {
      console.log('   ⚠️  Performance could be optimized');
    }

    return {
      client,
      performance: {
        simple: { time: time1, results: simpleResult.streams.length },
        complex: { time: time2, results: complexResult.streams.length },
        compound: { time: time3, results: compoundResult.streams.length },
      },
    };
  } catch (error) {
    console.error('❌ Error in performance comparison:', error);
    throw error;
  }
}

/**
 * Main example runner that demonstrates all advanced filtering features
 */
export async function runAdvancedFilteringExamples() {
  console.log('🚀 Advanced Filtering Examples for PumpFun API');
  console.log('==========================================\n');

  try {
    // Run all examples
    await demonstratePredefinedFilters();
    console.log(`\n${'='.repeat(50)}\n`);

    await demonstrateCustomFilters();
    console.log(`\n${'='.repeat(50)}\n`);

    await demonstrateComplexCriteria();
    console.log(`\n${'='.repeat(50)}\n`);

    await demonstrateCompoundQueries();
    console.log(`\n${'='.repeat(50)}\n`);

    const performanceResults = await demonstratePerformanceComparison();

    console.log('\n🎉 All advanced filtering examples completed successfully!');
    console.log('\n💡 Key Features Demonstrated:');
    console.log('   ✅ Predefined filter builders for common use cases');
    console.log('   ✅ Custom filter functions with naming support');
    console.log('   ✅ Complex multi-criteria filtering');
    console.log('   ✅ Compound queries with AND/OR logic');
    console.log('   ✅ Performance optimization and metrics');
    console.log('   ✅ Comprehensive logging and error handling');

    return performanceResults;
  } catch (error) {
    console.error('❌ Error running advanced filtering examples:', error);
    throw error;
  }
}
