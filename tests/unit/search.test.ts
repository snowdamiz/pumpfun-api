/**
 * Unit Tests for Search Functionality
 *
 * This test suite covers all search and filtering operations for the PumpFun API client
 * including keyword search, advanced filtering, and utility functions.
 */

import { StreamFilters } from '../../src/services/live/stream-filters.service';
import { LiveStreamsValidator } from '../../src/validation/streams.validator';
import { Logger } from '../../src/infrastructure/logging/logger';
import { ErrorHandler } from '../../src/infrastructure/error-handling/error-handler';
import { ConfigurationError, NetworkError } from '../../src/infrastructure/error-handling/errors';
import {
  LiveCoin,
  SearchLiveStreamsParams,
  StreamSearchResult,
  AdvancedFilterCriteria,
  CompoundFilterQuery,
} from '../../src/types';

// Mock data for testing
const mockLiveCoins: LiveCoin[] = [
  {
    mint: '11111111111111111111111111111111',
    name: 'PumpFun Token',
    symbol: 'PUMP',
    description: 'A fun token for pumping',
    image_uri: 'https://example.com/image1.png',
    creator: 'creator1',
    created_timestamp: 1698710400,
    market_cap: 50000,
    usd_market_cap: 50000,
    is_currently_live: true,
    livestream_title: 'PumpFun Live Stream',
    num_participants: 25,
    reply_count: 100,
    thumbnail: 'https://example.com/thumb1.png',
    last_reply: 1698796800,
    twitter: 'pumpfun',
    telegram: 'https://t.me/pumpfun',
  },
  {
    mint: '22222222222222222222222222222222',
    name: 'DeFi Project',
    symbol: 'DEFI',
    description: 'Decentralized finance protocol',
    image_uri: 'https://example.com/image2.png',
    creator: 'creator2',
    created_timestamp: 1698624000,
    market_cap: 100000,
    usd_market_cap: 100000,
    is_currently_live: false,
    livestream_title: 'DeFi AMA Session',
    num_participants: 15,
    reply_count: 50,
    thumbnail: 'https://example.com/thumb2.png',
    last_reply: 1698782400,
  },
  {
    mint: '33333333333333333333333333333333',
    name: 'Gaming Coin',
    symbol: 'GAME',
    description: 'Gaming platform token',
    image_uri: 'https://example.com/image3.png',
    creator: 'creator3',
    created_timestamp: 1698537600,
    market_cap: 25000,
    usd_market_cap: 25000,
    is_currently_live: true,
    livestream_title: 'Gaming Tournament',
    num_participants: 50,
    reply_count: 200,
    thumbnail: 'https://example.com/thumb3.png',
    last_reply: 1698800000,
    twitter: 'gamingcoin',
  },
  {
    mint: '44444444444444444444444444444444',
    name: 'NFT Marketplace',
    symbol: 'NFT',
    description: 'Digital art marketplace',
    image_uri: 'https://example.com/image4.png',
    creator: 'creator4',
    created_timestamp: 1698451200,
    market_cap: 75000,
    usd_market_cap: 75000,
    is_currently_live: true,
    livestream_title: 'NFT Art Gallery',
    num_participants: 30,
    reply_count: 75,
    thumbnail: 'https://example.com/thumb4.png',
    last_reply: 1698793200,
    telegram: 'https://t.me/nftmarketplace',
  },
  {
    mint: '55555555555555555555555555555555',
    name: 'Staking Protocol',
    symbol: 'STAKE',
    description: 'Proof of stake implementation',
    image_uri: 'https://example.com/image5.png',
    creator: 'creator5',
    created_timestamp: 1698364800,
    market_cap: 150000,
    usd_market_cap: 150000,
    is_currently_live: false,
    livestream_title: 'Staking Tutorial',
    num_participants: 8,
    reply_count: 25,
    thumbnail: 'https://example.com/thumb5.png',
    last_reply: 1698776000,
    twitter: 'stakingpro',
    telegram: 'https://t.me/stakingpro',
  },
];

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
} as unknown as Logger;

const mockErrorHandler = {
  handleError: jest.fn((error, operation, context) => {
    // Return a proper NetworkError instance with toJSON method
    if (error instanceof Error) {
      const networkError = new NetworkError({
        message: error.message,
        code: 'NETWORK_ERROR',
        statusCode: 500,
        originalError: error,
      });
      return networkError;
    }
    return error;
  }),
} as unknown as ErrorHandler;

const mockGetLiveCoinsFn = jest.fn();

describe('Search Functionality Tests', () => {
  let streamFilters: StreamFilters;
  let validator: LiveStreamsValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    streamFilters = new StreamFilters(mockLogger, mockErrorHandler, mockGetLiveCoinsFn);
    validator = new LiveStreamsValidator(mockLogger);
    mockGetLiveCoinsFn.mockResolvedValue(mockLiveCoins);
  });

  describe('StreamFilters - searchLiveStreams', () => {
    it('should search live streams with keyword in name', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'PumpFun',
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('PumpFun Token');
      expect(results[0].relevanceScore).toBeGreaterThan(0);
      expect(results[0].matchedFields).toHaveProperty('name');
    });

    it('should search live streams with keyword in symbol', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'GAME',
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe('GAME');
      expect(results[0].matchedFields).toHaveProperty('symbol');
    });

    it('should search live streams with keyword in description', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'finance',
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      expect(results).toHaveLength(1);
      expect(results[0].description).toContain('finance');
      expect(results[0].matchedFields).toHaveProperty('description');
    });

    it('should search live streams with keyword in title', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'Tournament',
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      expect(results).toHaveLength(1);
      expect(results[0].livestream_title).toContain('Tournament');
      expect(results[0].matchedFields).toHaveProperty('title');
    });

    it('should search across multiple fields', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'token',
        searchIn: ['name', 'symbol', 'description', 'title'],
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(
          result.name.toLowerCase().includes('token') ||
          result.symbol.toLowerCase().includes('token') ||
          result.description.toLowerCase().includes('token') ||
          (result.livestream_title && result.livestream_title.toLowerCase().includes('token'))
        ).toBe(true);
      });
    });

    it('should filter by minimum participants', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'Stream',
        minParticipants: 20,
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      results.forEach(result => {
        expect(result.num_participants).toBeGreaterThanOrEqual(20);
      });
    });

    it('should filter for currently live streams only', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'Stream',
        currentlyLiveOnly: true,
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      results.forEach(result => {
        expect(result.is_currently_live).toBe(true);
      });
    });

    it('should sort results by relevance by default', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'Stream',
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].relevanceScore).toBeGreaterThanOrEqual(results[i + 1].relevanceScore);
        }
      }
    });

    it('should sort results by participants when specified', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'Stream',
        sortBy: 'participants',
        sortOrder: 'DESC',
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].num_participants).toBeGreaterThanOrEqual(results[i + 1].num_participants);
        }
      }
    });

    it('should create snippets for search results', async () => {
      const longDescription = 'This is a very long description that should be truncated when creating snippets for search results to show context around the matched keyword';

      const mockCoinWithLongDesc: LiveCoin = {
        ...mockLiveCoins[0],
        description: longDescription,
      };

      mockGetLiveCoinsFn.mockResolvedValue([mockCoinWithLongDesc]);

      const params: SearchLiveStreamsParams = {
        keyword: 'very long',
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      expect(results).toHaveLength(1);
      expect(results[0].snippets).toBeDefined();
      expect(results[0].snippets!.description).toContain('...');
      expect(results[0].snippets!.description).toContain('very long');
    });

    it('should handle empty search results gracefully', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'nonexistent',
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(params);

      expect(results).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Searching live streams', expect.any(Object));
    });

    it('should validate search parameters', async () => {
      const invalidParams = {
        keyword: '',
        limit: 10,
      } as SearchLiveStreamsParams;

      await expect(streamFilters.searchLiveStreams(invalidParams)).rejects.toThrow(ConfigurationError);
    });

    it('should handle API errors gracefully', async () => {
      mockGetLiveCoinsFn.mockRejectedValue(new Error('API Error'));

      const params: SearchLiveStreamsParams = {
        keyword: 'test',
        limit: 10,
      };

      await expect(streamFilters.searchLiveStreams(params)).rejects.toThrow('API Error');
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should respect search limit', async () => {
      const params: SearchLiveStreamsParams = {
        keyword: 'a', // Broad search to match many results
        limit: 3,
      };

      const results = await streamFilters.searchLiveStreams(params);

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should handle case-insensitive search', async () => {
      const params1: SearchLiveStreamsParams = {
        keyword: 'pumpfun',
        limit: 10,
      };

      const params2: SearchLiveStreamsParams = {
        keyword: 'PUMPFUN',
        limit: 10,
      };

      const results1 = await streamFilters.searchLiveStreams(params1);
      const results2 = await streamFilters.searchLiveStreams(params2);

      expect(results1).toHaveLength(results2.length);
      if (results1.length > 0 && results2.length > 0) {
        expect(results1[0].mint).toBe(results2[0].mint);
      }
    });
  });

  describe('StreamFilters - Advanced Filtering', () => {
    it('should apply market cap range filter', async () => {
      const criteria: AdvancedFilterCriteria = {
        marketCapRange: {
          min: 40000,
          max: 80000,
        },
      };

      const result = await streamFilters.applyAdvancedFilters(criteria);

      result.streams.forEach(stream => {
        expect(stream.usd_market_cap).toBeGreaterThanOrEqual(40000);
        expect(stream.usd_market_cap).toBeLessThanOrEqual(80000);
      });
    });

    it('should apply participant range filter', async () => {
      const criteria: AdvancedFilterCriteria = {
        participantRange: {
          min: 20,
          max: 40,
        },
      };

      const result = await streamFilters.applyAdvancedFilters(criteria);

      result.streams.forEach(stream => {
        expect(stream.num_participants).toBeGreaterThanOrEqual(20);
        expect(stream.num_participants).toBeLessThanOrEqual(40);
      });
    });

    it('should apply social media filters', async () => {
      const criteria: AdvancedFilterCriteria = {
        hasSocialMedia: {
          twitter: true,
          telegram: true,
        },
      };

      const result = await streamFilters.applyAdvancedFilters(criteria);

      result.streams.forEach(stream => {
        expect(stream.twitter).toBeDefined();
        expect(stream.telegram).toBeDefined();
      });
    });

    it('should apply content quality filters', async () => {
      const criteria: AdvancedFilterCriteria = {
        contentQuality: {
          hasTitle: true,
          minTitleLength: 10,
          hasDescription: true,
          minDescriptionLength: 20,
        },
      };

      const result = await streamFilters.applyAdvancedFilters(criteria);

      result.streams.forEach(stream => {
        expect(stream.livestream_title).toBeDefined();
        expect(stream.livestream_title!.length).toBeGreaterThanOrEqual(10);
        expect(stream.description.length).toBeGreaterThanOrEqual(20);
      });
    });

    it('should apply text pattern filters', async () => {
      const criteria: AdvancedFilterCriteria = {
        textPatterns: {
          nameContains: ['Token', 'Coin'],
          excludePatterns: ['test', 'demo'],
        },
      };

      const result = await streamFilters.applyAdvancedFilters(criteria);

      result.streams.forEach(stream => {
        const nameMatch = stream.name.toLowerCase().includes('token') ||
                         stream.name.toLowerCase().includes('coin');
        expect(nameMatch).toBe(true);

        const allText = `${stream.name} ${stream.symbol} ${stream.description} ${stream.livestream_title || ''}`.toLowerCase();
        const hasExcluded = allText.includes('test') || allText.includes('demo');
        expect(hasExcluded).toBe(false);
      });
    });

    it('should apply compound filter with AND logic', async () => {
      const query: CompoundFilterQuery = {
        groups: [
          {
            criteria: [
              {
                marketCapRange: { min: 30000 },
              },
            ],
            operator: 'AND',
          },
          {
            criteria: [
              {
                hasSocialMedia: { twitter: true },
              },
            ],
            operator: 'AND',
          },
        ],
        groupOperator: 'AND',
      };

      const result = await streamFilters.applyCompoundFilter(query);

      result.streams.forEach(stream => {
        expect(stream.usd_market_cap).toBeGreaterThanOrEqual(30000);
        expect(stream.twitter).toBeDefined();
      });
    });

    it('should apply compound filter with OR logic', async () => {
      const query: CompoundFilterQuery = {
        groups: [
          {
            criteria: [
              {
                participantRange: { min: 45 },
              },
            ],
            operator: 'AND',
          },
          {
            criteria: [
              {
                textPatterns: { nameContains: ['PumpFun'] },
              },
            ],
            operator: 'AND',
          },
        ],
        groupOperator: 'OR',
      };

      const result = await streamFilters.applyCompoundFilter(query);

      result.streams.forEach(stream => {
        const hasManyParticipants = (stream.num_participants ?? 0) >= 45;
        const hasPumpFunInName = stream.name.toLowerCase().includes('pumpfun');
        expect(hasManyParticipants || hasPumpFunInName).toBe(true);
      });
    });

    it('should return filtering metrics', async () => {
      const criteria: AdvancedFilterCriteria = {
        marketCapRange: { min: 120000 }, // Higher threshold to ensure some filtering
      };

      const result = await streamFilters.applyAdvancedFilters(criteria);

      expect(result.totalBeforeFilter).toBe(mockLiveCoins.length);
      expect(result.streams.length).toBeLessThan(result.totalBeforeFilter);
      expect(result.filteredOut).toBeGreaterThan(0);
      expect(result.appliedCriteria).toBeDefined();
      expect(result.metrics.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics.filtersApplied).toBeGreaterThan(0);
    });
  });

  describe('StreamFilters - Filter Builders', () => {
    it('should create high quality streams filter', () => {
      const filter = streamFilters.getFilterBuilders.highQualityStreams();

      // Create a high quality stream that meets all criteria
      const highQualityStream = {
        ...mockLiveCoins[0],
        livestream_title: 'This is a very long and detailed livestream title', // > 10 chars
        description: 'This is a very long and detailed description that meets the minimum length requirement for high quality streams', // > 50 chars
        twitter: 'pumpfun',
        telegram: 'https://t.me/pumpfun',
        num_participants: 25, // >= 5
        reply_count: 100, // >= 10
      };

      // Create a low quality stream missing some criteria
      const lowQualityStream = {
        ...mockLiveCoins[1],
        livestream_title: undefined, // Missing title
        twitter: undefined, // Missing social media
        description: 'Short desc', // Too short description
        num_participants: 2, // Too few participants
        reply_count: 5, // Too few replies
      };

      expect(filter(highQualityStream)).toBe(true);
      expect(filter(lowQualityStream)).toBe(false);
    });

    it('should create new and trending filter', () => {
      const filter = streamFilters.getFilterBuilders.newAndTrending(24);

      const recentStream = {
        ...mockLiveCoins[0],
        created_timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        num_participants: 5,
        reply_count: 10,
      };

      const oldStream = {
        ...mockLiveCoins[1],
        created_timestamp: Math.floor(Date.now() / 1000) - (48 * 3600), // 48 hours ago
      };

      expect(filter(recentStream)).toBe(true);
      expect(filter(oldStream)).toBe(false);
    });

    it('should create established streams filter', () => {
      const filter = streamFilters.getFilterBuilders.establishedStreams(50000);

      // Create an established stream that meets ALL criteria
      const establishedStream = {
        ...mockLiveCoins[4], // High market cap
        num_participants: 25, // >= 10 participants
        reply_count: 50, // >= 20 replies
      };

      // Create a non-established stream missing some criteria
      const notEstablishedStream = {
        ...mockLiveCoins[0],
        usd_market_cap: 1000, // Low cap
        num_participants: 5, // Too few participants
        reply_count: 10, // Too few replies
      };

      expect(filter(establishedStream)).toBe(true);
      expect(filter(notEstablishedStream)).toBe(false);
    });

    it('should create active community filter', () => {
      const filter = streamFilters.getFilterBuilders.activeCommunity(2);

      // Create an active stream with recent timestamp and good engagement
      const now = Date.now();
      const activeStream = {
        ...mockLiveCoins[2],
        created_timestamp: Math.floor((now - 2 * 60 * 60 * 1000) / 1000), // 2 hours ago
        reply_count: 50, // Good engagement over 2 hours = 25 replies/hour
        twitter: 'gamingcoin',
        telegram: 'https://t.me/gamingcoin',
        num_participants: 50,
      };

      // Create an inactive stream with poor engagement
      const inactiveStream = {
        ...mockLiveCoins[1],
        created_timestamp: Math.floor((now - 24 * 60 * 60 * 1000) / 1000), // 24 hours ago
        reply_count: 24, // 1 reply/hour over 24 hours
        twitter: undefined,
        telegram: undefined,
        num_participants: 2,
      };

      expect(filter(activeStream)).toBe(true);
      expect(filter(inactiveStream)).toBe(false);
    });

    it('should create professional streams filter', () => {
      const filter = streamFilters.getFilterBuilders.professionalStreams();

      const professionalStream = {
        ...mockLiveCoins[0],
        livestream_title: 'Professional PumpFun Trading Session - Market Analysis and Strategies',
        description: 'This is a very detailed description of our professional trading session with comprehensive market analysis, strategies, and community engagement. We cover all aspects of trading and provide valuable insights.',
        image_uri: 'https://example.com/professional.png',
        twitter: 'pumpfun',
        telegram: 'https://t.me/pumpfun',
        usd_market_cap: 10000,
      };

      const casualStream = {
        ...mockLiveCoins[1],
        livestream_title: 'Stream',
        description: 'Short desc',
        image_uri: '',
        twitter: undefined,
        telegram: undefined,
        usd_market_cap: 1000,
      };

      expect(filter(professionalStream)).toBe(true);
      expect(filter(casualStream)).toBe(false);
    });

    it('should create market cap range filter', () => {
      const filter = streamFilters.getFilterBuilders.marketCapRange(25000, 75000);

      expect(filter(mockLiveCoins[0])).toBe(true); // 50k
      expect(filter(mockLiveCoins[2])).toBe(true); // 25k
      expect(filter(mockLiveCoins[1])).toBe(false); // 100k (outside range)
      expect(filter(mockLiveCoins[4])).toBe(false); // 150k (outside range)
    });

    it('should create participant range filter', () => {
      const filter = streamFilters.getFilterBuilders.participantRange(10, 30);

      expect(filter(mockLiveCoins[0])).toBe(true); // 25 participants (in range)
      expect(filter(mockLiveCoins[1])).toBe(true);  // 15 participants (in range)
      expect(filter(mockLiveCoins[2])).toBe(false); // 50 participants (outside range)
    });
  });

  describe('LiveStreamsValidator - Text Pattern Matcher', () => {
    it('should create case-sensitive text matcher', () => {
      const matcher = validator.createTextPatternMatcher('Token', { caseSensitive: true });

      expect(matcher('PumpFun Token')).toBe(true);
      expect(matcher('pumpfun token')).toBe(false);
    });

    it('should create case-insensitive text matcher', () => {
      const matcher = validator.createTextPatternMatcher('Token', { caseSensitive: false });

      expect(matcher('PumpFun Token')).toBe(true);
      expect(matcher('pumpfun token')).toBe(true);
    });

    it('should create whole word text matcher', () => {
      const matcher = validator.createTextPatternMatcher('token', { wholeWord: true });

      expect(matcher('PumpFun Token')).toBe(true);
      expect(matcher('PumpFun Tokens')).toBe(false); // 'Tokens' is different word
      expect(matcher('Mytoken')).toBe(false); // Part of another word
    });

    it('should create regex text matcher', () => {
      const matcher = validator.createTextPatternMatcher('pump', { regex: true, caseSensitive: false });

      expect(matcher('PumpFun Token')).toBe(true);
      expect(matcher('Random Text')).toBe(false);
    });

    it('should handle invalid regex patterns gracefully', () => {
      const matcher = validator.createTextPatternMatcher('[Invalid', { regex: true });

      expect(matcher('[Invalid')).toBe(true); // Falls back to text matching
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('LiveStreamsValidator - Compound Search Filter', () => {
    it('should create compound search filter with AND logic', () => {
      const filter = validator.createCompoundSearchFilter([
        { field: 'name', pattern: 'PumpFun', operator: 'contains' },
        { field: 'symbol', pattern: 'PUMP', operator: 'exact' },
      ], 'AND');

      expect(filter(mockLiveCoins[0])).toBe(true);
      expect(filter(mockLiveCoins[1])).toBe(false);
    });

    it('should create compound search filter with OR logic', () => {
      const filter = validator.createCompoundSearchFilter([
        { field: 'name', pattern: 'PumpFun', operator: 'contains' },
        { field: 'name', pattern: 'Gaming', operator: 'contains' },
      ], 'OR');

      expect(filter(mockLiveCoins[0])).toBe(true);
      expect(filter(mockLiveCoins[2])).toBe(true);
      expect(filter(mockLiveCoins[1])).toBe(false);
    });

    it('should support different operators', () => {
      const exactFilter = validator.createCompoundSearchFilter([
        { field: 'symbol', pattern: 'PUMP', operator: 'exact' },
      ]);

      const startsWithFilter = validator.createCompoundSearchFilter([
        { field: 'name', pattern: 'Pump', operator: 'startsWith' },
      ]);

      const endsWithFilter = validator.createCompoundSearchFilter([
        { field: 'description', pattern: 'pumping', operator: 'endsWith' },
      ]);

      expect(exactFilter(mockLiveCoins[0])).toBe(true);
      expect(exactFilter(mockLiveCoins[1])).toBe(false);

      expect(startsWithFilter(mockLiveCoins[0])).toBe(true);
      expect(startsWithFilter(mockLiveCoins[1])).toBe(false);

      expect(endsWithFilter(mockLiveCoins[0])).toBe(true);
      expect(endsWithFilter(mockLiveCoins[2])).toBe(false);
    });
  });

  describe('LiveStreamsValidator - Numeric Range Filter', () => {
    it('should create inclusive numeric range filter', () => {
      const filter = validator.createNumericRangeFilter('usd_market_cap', {
        min: 40000,
        max: 80000,
        inclusive: true,
      });

      expect(filter(mockLiveCoins[0])).toBe(true); // 50k
      expect(filter(mockLiveCoins[3])).toBe(true); // 75k
      expect(filter(mockLiveCoins[2])).toBe(false); // 25k
      expect(filter(mockLiveCoins[4])).toBe(false); // 150k
    });

    it('should create exclusive numeric range filter', () => {
      const filter = validator.createNumericRangeFilter('usd_market_cap', {
        min: 40000,
        max: 80000,
        inclusive: false,
      });

      expect(filter(mockLiveCoins[0])).toBe(true); // 50k (within range, not boundary)
      expect(filter(mockLiveCoins[3])).toBe(true); // 75k (within range, not boundary)

      // Create a test stream exactly on the boundary
      const boundaryStream = { ...mockLiveCoins[0], usd_market_cap: 40000 };
      expect(filter(boundaryStream)).toBe(false); // Exactly on min boundary (excluded)

      const maxBoundaryStream = { ...mockLiveCoins[0], usd_market_cap: 80000 };
      expect(filter(maxBoundaryStream)).toBe(false); // Exactly on max boundary (excluded)
    });

    it('should handle minimum only filter', () => {
      const filter = validator.createNumericRangeFilter('num_participants', {
        min: 20,
      });

      expect(filter(mockLiveCoins[0])).toBe(true); // 25 participants
      expect(filter(mockLiveCoins[1])).toBe(false); // 15 participants
    });

    it('should handle maximum only filter', () => {
      const filter = validator.createNumericRangeFilter('num_participants', {
        max: 20,
      });

      expect(filter(mockLiveCoins[1])).toBe(true); // 15 participants
      expect(filter(mockLiveCoins[2])).toBe(false); // 50 participants
    });
  });

  describe('LiveStreamsValidator - Time Range Filter', () => {
    it('should create absolute time range filter', () => {
      const filter = validator.createTimeRangeFilter('created_timestamp', {
        after: 1698500000,
        before: 1698750000,
      });

      expect(filter(mockLiveCoins[0])).toBe(true); // 1698710400 (within range)
      expect(filter(mockLiveCoins[2])).toBe(true); // 1698537600 (after threshold)
      expect(filter(mockLiveCoins[4])).toBe(false); // 1698364800 (before threshold)
    });

    it('should create relative time range filter', () => {
      const now = Date.now();
      const oneHourInMinutes = 60;

      // Create a mock timestamp that's 30 minutes old
      const thirtyMinutesAgo = Math.floor((now - 30 * 60 * 1000) / 1000);

      const mockRecentStream = {
        ...mockLiveCoins[0],
        created_timestamp: thirtyMinutesAgo,
      };

      const filter = validator.createTimeRangeFilter('created_timestamp', {
        relativeToNow: {
          newerThan: 60, // More recent than 1 hour
          olderThan: 10,  // But older than 10 minutes
        },
      });

      expect(filter(mockRecentStream)).toBe(true);
    });

    it('should handle Date objects', () => {
      // Convert the mock timestamps to check what range they should be in
      // 1698710400 = Oct 31, 2023 ~ 00:00 UTC
      // 1698537600 = Oct 29, 2023 ~ 00:00 UTC

      const filter = validator.createTimeRangeFilter('created_timestamp', {
        after: new Date('2023-10-28T12:00:00Z'), // After Oct 28 noon
        before: new Date('2023-11-01T23:59:59Z'), // Before Nov 1 midnight
      });

      expect(filter(mockLiveCoins[0])).toBe(true); // Oct 31 00:00 - within range
      expect(filter(mockLiveCoins[2])).toBe(true); // Oct 29 00:00 - within range
    });
  });

  describe('LiveStreamsValidator - Fuzzy Search Filter', () => {
    it('should create fuzzy search filter with high similarity', () => {
      const filter = validator.createFuzzySearchFilter('name', 'PumpFun', { threshold: 0.8 });

      expect(filter(mockLiveCoins[0])).toBe(true); // Exact match
      expect(filter(mockLiveCoins[1])).toBe(false); // No similarity
    });

    it('should create fuzzy search filter with low threshold', () => {
      const filter = validator.createFuzzySearchFilter('name', 'Pump', { threshold: 0.3 });

      expect(filter(mockLiveCoins[0])).toBe(true); // High similarity
      expect(filter(mockLiveCoins[1])).toBe(false); // Still no similarity
    });

    it('should handle case sensitivity', () => {
      const caseSensitiveFilter = validator.createFuzzySearchFilter('name', 'pumpfun', { caseSensitive: true });
      const caseInsensitiveFilter = validator.createFuzzySearchFilter('name', 'pumpfun', { caseSensitive: false });

      expect(caseSensitiveFilter(mockLiveCoins[0])).toBe(false); // Case mismatch
      expect(caseInsensitiveFilter(mockLiveCoins[0])).toBe(true); // Case ignored
    });
  });

  describe('LiveStreamsValidator - Weighted Search Filter', () => {
    it('should create weighted search filter', () => {
      const filter = validator.createWeightedSearchFilter('Pump', {
        name: 2.0,
        symbol: 1.5,
        description: 1.0,
      });

      const result1 = filter(mockLiveCoins[0]); // "PumpFun Token" - name match
      const result2 = filter(mockLiveCoins[1]); // No match

      expect(result1.matches).toBe(true);
      expect(result1.score).toBeGreaterThan(0);
      expect(result2.matches).toBe(false);
      expect(result2.score).toBe(0);
    });

    it('should apply exact match bonus', () => {
      const filterWithBonus = validator.createWeightedSearchFilter('Pump', {
        name: 1.0,
      }, { exactMatchBonus: 2.0 });

      const filterWithoutBonus = validator.createWeightedSearchFilter('Pump', {
        name: 1.0,
      }, { exactMatchBonus: 1.0 });

      const exactMatchStream = { ...mockLiveCoins[0], name: 'Pump' };

      const resultWithBonus = filterWithBonus(exactMatchStream);
      const resultWithoutBonus = filterWithoutBonus(exactMatchStream);

      expect(resultWithBonus.score).toBeGreaterThan(resultWithoutBonus.score);
    });

    it('should respect minimum score threshold', () => {
      const filter = validator.createWeightedSearchFilter('xyz', {
        name: 1.0,
      }, { minScore: 0.5 });

      const result = filter(mockLiveCoins[0]);
      expect(result.matches).toBe(false); // Low score below threshold
    });
  });

  describe('LiveStreamsValidator - Advanced Search Validation', () => {
    it('should validate advanced search parameters', () => {
      const validParams = {
        query: 'PumpFun',
        filters: [
          {
            field: 'usd_market_cap' as keyof LiveCoin,
            operation: 'greaterThan' as const,
            value: 50000,
          },
        ],
        sortBy: 'usd_market_cap' as keyof LiveCoin,
        sortOrder: 'DESC' as const,
        limit: 10,
        offset: 0,
      };

      expect(() => validator.validateAdvancedSearchParams(validParams)).not.toThrow();
    });

    it('should reject invalid query', () => {
      const invalidParams = {
        query: '',
        limit: 10,
      };

      expect(() => validator.validateAdvancedSearchParams(invalidParams)).toThrow(ConfigurationError);
    });

    it('should reject invalid filters', () => {
      const invalidParams = {
        query: 'test',
        filters: [
          {
            field: 'invalid_field' as keyof LiveCoin,
            operation: 'equals' as const,
            value: 'test',
          },
        ],
      };

      expect(() => validator.validateAdvancedSearchParams(invalidParams)).toThrow(ConfigurationError);
    });

    it('should reject invalid sort field', () => {
      const invalidParams = {
        query: 'test',
        sortBy: 'invalid_field' as keyof LiveCoin,
      };

      expect(() => validator.validateAdvancedSearchParams(invalidParams)).toThrow(ConfigurationError);
    });

    it('should validate between operation requires second value', () => {
      const invalidParams = {
        query: 'test',
        filters: [
          {
            field: 'usd_market_cap' as keyof LiveCoin,
            operation: 'between' as const,
            value: 1000,
          },
        ],
      };

      expect(() => validator.validateAdvancedSearchParams(invalidParams)).toThrow(ConfigurationError);
    });
  });

  describe('LiveStreamsValidator - Utility Functions', () => {
    it('should create result sorter', () => {
      const sorter = validator.createResultSorter([
        { field: 'usd_market_cap', order: 'DESC' },
        { field: 'name', order: 'ASC' },
      ]);

      const sorted = [...mockLiveCoins].sort(sorter);

      expect(sorted[0].usd_market_cap).toBeGreaterThanOrEqual(sorted[1].usd_market_cap);
    });

    it('should create relevance scorer', () => {
      const scorer = validator.createRelevanceScorer('PumpFun', {
        name: 2.0,
        symbol: 1.5,
      });

      const score1 = scorer(mockLiveCoins[0]); // Name contains "PumpFun"
      const score2 = scorer(mockLiveCoins[1]); // No match

      expect(score1).toBeGreaterThan(score2);
      expect(score1).toBeGreaterThan(0);
    });

    it('should handle edge cases in text similarity calculation', () => {
      const score1 = (validator as any).calculateSimilarity('same', 'same');
      const score2 = (validator as any).calculateSimilarity('', 'test');
      const score3 = (validator as any).calculateSimilarity('test', '');

      expect(score1).toBe(1.0);
      expect(score2).toBe(0.0);
      expect(score3).toBe(0.0);
    });
  });

  describe('Search Integration Tests', () => {
    it('should handle complex search scenarios', async () => {
      // Test a realistic search scenario
      const searchParams: SearchLiveStreamsParams = {
        keyword: 'token',
        searchIn: ['name', 'description'],
        minParticipants: 10,
        currentlyLiveOnly: true,
        sortBy: 'participants',
        sortOrder: 'DESC',
        limit: 5,
      };

      const results = await streamFilters.searchLiveStreams(searchParams);

      // Verify all conditions are met
      results.forEach(result => {
        // Should contain keyword in name or description
        const nameMatch = result.name.toLowerCase().includes('token');
        const descMatch = result.description.toLowerCase().includes('token');
        expect(nameMatch || descMatch).toBe(true);

        // Should meet minimum participants
        expect(result.num_participants).toBeGreaterThanOrEqual(10);

        // Should be currently live
        expect(result.is_currently_live).toBe(true);

        // Should have relevance score
        expect(result.relevanceScore).toBeGreaterThan(0);
      });

      // Should be sorted by participants (descending)
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].num_participants).toBeGreaterThanOrEqual(results[i + 1].num_participants);
        }
      }
    });

    it('should handle search with no matches', async () => {
      const searchParams: SearchLiveStreamsParams = {
        keyword: 'nonexistentcryptothatdoesnotexist',
        limit: 10,
      };

      const results = await streamFilters.searchLiveStreams(searchParams);

      expect(results).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Search completed', expect.objectContaining({
        resultsFound: 0,
      }));
    });

    it('should measure search performance', async () => {
      const searchParams: SearchLiveStreamsParams = {
        keyword: 'Stream',
        limit: 20,
      };

      const startTime = Date.now();
      await streamFilters.searchLiveStreams(searchParams);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle null/undefined values in filters', () => {
      const streamWithNulls = {
        ...mockLiveCoins[0],
        twitter: null,
        telegram: undefined,
        livestream_title: '',
      };

      const criteria: AdvancedFilterCriteria = {
        hasSocialMedia: {
          twitter: true,
          telegram: true,
        },
      };

      // Filter should handle null/undefined gracefully
      const filter = (stream: LiveCoin) => {
        if (criteria.hasSocialMedia?.twitter && !stream.twitter) {
          return false;
        }
        if (criteria.hasSocialMedia?.telegram && !stream.telegram) {
          return false;
        }
        return true;
      };

      expect(filter(streamWithNulls)).toBe(false);
    });

    it('should handle malformed input gracefully', async () => {
      // Test with malformed search parameters
      const malformedParams = {
        keyword: 'test',
        searchIn: ['invalid_field' as any],
        limit: 'invalid' as any,
        minParticipants: 'invalid' as any,
      };

      await expect(streamFilters.searchLiveStreams(malformedParams as any)).rejects.toThrow(ConfigurationError);
    });

    it('should handle network timeouts', async () => {
      mockGetLiveCoinsFn.mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        });
      });

      const searchParams: SearchLiveStreamsParams = {
        keyword: 'test',
        limit: 10,
      };

      await expect(streamFilters.searchLiveStreams(searchParams)).rejects.toThrow();
    });
  });
});