/**
 * Unit tests for Video Streaming functionality
 *
 * This test suite validates:
 * - getLiveStreamInfo method with various scenarios
 * - isApprovedCreator method functionality
 * - getLiveKitConnectionInfo method with region selection
 * - getVideoStreamAnalysis comprehensive method
 * - joinLiveStream method with edge cases
 * - Error handling and validation for video streaming methods
 * - Mock API responses and network error scenarios
 *
 * @version 1.0.0
 */

import axios from 'axios';
import { LiveStreamInfoService } from '../../src/services/live/stream-info.service';
import { LiveStreamsService } from '../../src/services/live/live-streams.service';
import {
  LiveStreamInfo,
  LiveKitConnectionInfo,
  LiveKitRegion,
  VideoStreamAnalysis,
  JoinLiveStreamResponse,
  LiveStreamsServiceConfig,
} from '../../src/types';
import {
  NetworkError,
  ServerError,
  TimeoutError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
} from '../../src/infrastructure/error-handling/errors';
import { Logger } from '../../src/infrastructure/logging/logger';
import { RateLimiter } from '../../src/infrastructure/rate-limiting/rate-limiter';
import { HTTPClient } from '../../src/infrastructure/http/http-client';
import { ErrorHandler } from '../../src/infrastructure/error-handling/error-handler';

// Mock axios
jest.mock('axios');
const MockedAxios = axios as jest.Mocked<typeof axios>;

// Mock dependencies
jest.mock('../../src/infrastructure/logging/logger');
jest.mock('../../src/infrastructure/rate-limiting/rate-limiter');
jest.mock('../../src/infrastructure/http/http-client');
jest.mock('../../src/infrastructure/error-handling/error-handler');

describe('Video Streaming Functionality', () => {
  let liveStreamInfoService: LiveStreamInfoService;
  let liveStreamsService: LiveStreamsService;
  let mockLogger: jest.Mocked<Logger>;
  let mockRateLimiter: jest.Mocked<RateLimiter>;
  let mockHttpClient: jest.Mocked<HTTPClient>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  let mockConfig: LiveStreamsServiceConfig;

  // Mock test data
  const mockMintId = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
  const mockStreamInfo: LiveStreamInfo = {
    id: 12345,
    supabaseId: 67890,
    mintId: mockMintId,
    creatorAddress: '11111111111111111111111111111111',
    streamStartTimestamp: 1640995200000,
    numParticipants: 150,
    maxParticipants: 200,
    isLive: true,
    downrankScore: 0.85,
    title: 'Test Live Stream',
    mode: 'broadcast',
  };

  const mockLiveKitConnectionInfo: LiveKitConnectionInfo = {
    regions: [
      { region: 'us-east-1', url: 'wss://livekit-us-east-1.pump.fun', distance: '10.00' },
      { region: 'us-west-2', url: 'wss://livekit-us-west-2.pump.fun', distance: '25.00' },
      { region: 'eu-west-1', url: 'wss://livekit-eu-west-1.pump.fun', distance: '50.00' },
      { region: 'ap-southeast-1', url: 'wss://livekit-ap-southeast-1.pump.fun', distance: '80.00' },
    ],
    primaryServer: 'wss://livekit-us-east-1.pump.fun',
    roomName: `${mockMintId}:12345`,
    mintId: mockMintId,
    streamId: 12345,
    websocketUrl: 'wss://livekit-us-east-1.pump.fun',
    requiresAuthentication: true,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      critical: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn().mockReturnValue('INFO'),
      createChild: jest.fn().mockReturnThis(),
      logPerformance: jest.fn(),
      logApiCall: jest.fn(),
      logError: jest.fn(),
      logRequest: jest.fn(),
      logResponse: jest.fn(),
      logStreamEvent: jest.fn(),
      logUserAction: jest.fn(),
      logSystemEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
      logBusinessEvent: jest.fn(),
      logValidationError: jest.fn(),
      logNetworkError: jest.fn(),
      logRateLimitEvent: jest.fn(),
      logCacheEvent: jest.fn(),
      logConfigEvent: jest.fn(),
      logMetric: jest.fn(),
      setContext: jest.fn(),
      getContext: jest.fn().mockReturnValue({}),
      clearContext: jest.fn(),
      updateContext: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
      flush: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Create mock rate limiter
    mockRateLimiter = {
      waitForRequest: jest.fn().mockResolvedValue(undefined),
      recordRequest: jest.fn(),
      canMakeRequest: jest.fn().mockResolvedValue(true),
      isRateLimited: jest.fn().mockReturnValue(false),
      reset: jest.fn(),
      updateConfig: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        requests: 0,
        maxRequests: 60,
        windowStart: Date.now(),
        windowEnd: Date.now() + 60000,
        burstCount: 0,
        maxBurst: 10,
        consecutiveErrors: 0,
        isBackoffActive: false,
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
      }),
    } as any;

    // Create mock HTTP client
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      client: {
        request: jest.fn(),
      },
    } as any;

    // Create mock error handler
    mockErrorHandler = {
      handleError: jest.fn(),
      isRetryableError: jest.fn(),
      getRetryDelay: jest.fn(),
      getCircuitBreakerStatus: jest.fn(),
      resetCircuitBreaker: jest.fn(),
    } as any;

    // Create mock config
    mockConfig = {
      baseURL: 'https://frontend-api-v3.pump.fun',
      livestreamURL: 'https://livestream-api.pump.fun',
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000,
    };

    // Create service instances
    liveStreamInfoService = new LiveStreamInfoService(mockConfig, mockLogger);
    liveStreamsService = new LiveStreamsService(
      mockConfig,
      mockHttpClient,
      mockLogger,
      mockRateLimiter,
      mockErrorHandler,
      { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
    );
  });

  describe('LiveStreamInfoService', () => {
    describe('getLiveStreamInfo', () => {
      test('should successfully fetch live stream information', async () => {
        const mockResponse = { data: mockStreamInfo };
        MockedAxios.get.mockResolvedValue(mockResponse);

        const result = await liveStreamInfoService.getLiveStreamInfo(mockMintId);

        expect(MockedAxios.get).toHaveBeenCalledWith(
          `${mockConfig.livestreamURL}/livestream?mintId=${mockMintId}`,
          {
            timeout: mockConfig.timeout,
            headers: {
              'User-Agent': 'PumpFun-API-Client/1.0.0',
              Accept: 'application/json',
            },
          }
        );
        expect(result).toEqual(mockStreamInfo);
        expect(mockLogger.info).toHaveBeenCalledWith('Successfully fetched live stream information', {
          mintId: mockMintId,
          isLive: true,
          numParticipants: 150,
          hasTitle: true,
        });
      });

      test('should handle missing fields in API response', async () => {
        const partialResponse = {
          data: {
            id: 12345,
            mintId: mockMintId,
            // Missing other fields
          },
        };
        MockedAxios.get.mockResolvedValue(partialResponse);

        const result = await liveStreamInfoService.getLiveStreamInfo(mockMintId);

        expect(result).toEqual({
          id: 12345,
          supabaseId: 0,
          mintId: mockMintId,
          creatorAddress: '',
          streamStartTimestamp: 0,
          numParticipants: 0,
          maxParticipants: 0,
          isLive: false,
          downrankScore: 0,
          title: '',
          mode: 'broadcast',
        });
      });

      test('should return null when stream is not found (404)', async () => {
        const mockError = {
          response: { status: 404 },
        };
        MockedAxios.get.mockRejectedValue(mockError);

        const result = await liveStreamInfoService.getLiveStreamInfo(mockMintId);

        expect(result).toBeNull();
        expect(mockLogger.info).toHaveBeenCalledWith('Live stream not found', { mintId: mockMintId });
      });

      test('should handle 400 bad request error', async () => {
        const mockError = {
          response: {
            status: 400,
            data: { message: 'Invalid mint ID format' },
          },
        };
        MockedAxios.get.mockRejectedValue(mockError);

        await expect(liveStreamInfoService.getLiveStreamInfo(mockMintId)).rejects.toThrow(
          ValidationError
        );
      });

      test('should handle 401 unauthorized error', async () => {
        const mockError = {
          response: { status: 401 },
        };
        MockedAxios.get.mockRejectedValue(mockError);

        await expect(liveStreamInfoService.getLiveStreamInfo(mockMintId)).rejects.toThrow(
          AuthenticationError
        );
      });

      test('should handle 403 forbidden error', async () => {
        const mockError = {
          response: { status: 403 },
        };
        MockedAxios.get.mockRejectedValue(mockError);

        await expect(liveStreamInfoService.getLiveStreamInfo(mockMintId)).rejects.toThrow(
          AuthorizationError
        );
      });

      test('should handle 500 server error', async () => {
        const mockError = {
          response: { status: 500 },
        };
        MockedAxios.get.mockRejectedValue(mockError);

        await expect(liveStreamInfoService.getLiveStreamInfo(mockMintId)).rejects.toThrow(
          ServerError
        );
      });

      test('should handle network connection errors', async () => {
        const mockError = {
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        };
        MockedAxios.get.mockRejectedValue(mockError);

        await expect(liveStreamInfoService.getLiveStreamInfo(mockMintId)).rejects.toThrow(
          NetworkError
        );
      });

      test('should handle timeout errors', async () => {
        const mockError = {
          code: 'ECONNABORTED',
          message: 'Request timeout',
        };
        MockedAxios.get.mockRejectedValue(mockError);

        await expect(liveStreamInfoService.getLiveStreamInfo(mockMintId)).rejects.toThrow(
          TimeoutError
        );
      });

      test('should handle null/empty response data', async () => {
        const mockResponse = { data: null };
        MockedAxios.get.mockResolvedValue(mockResponse);

        const result = await liveStreamInfoService.getLiveStreamInfo(mockMintId);

        expect(result).toBeNull();
        expect(mockLogger.warn).toHaveBeenCalledWith('No live stream information found', {
          mintId: mockMintId,
          responseType: 'object',
        });
      });

      test('should handle non-object response data', async () => {
        const mockResponse = { data: 'invalid data' };
        MockedAxios.get.mockResolvedValue(mockResponse);

        const result = await liveStreamInfoService.getLiveStreamInfo(mockMintId);

        expect(result).toBeNull();
      });
    });

    describe('isApprovedCreator', () => {
      test('should return true for approved creator', async () => {
        const mockResponse = { data: true };
        MockedAxios.get.mockResolvedValue(mockResponse);

        const result = await liveStreamInfoService.isApprovedCreator(mockMintId);

        expect(MockedAxios.get).toHaveBeenCalledWith(
          `${mockConfig.livestreamURL}/livestream/is-approved-creator?mintId=${mockMintId}`,
          {
            timeout: mockConfig.timeout,
            headers: {
              'User-Agent': 'PumpFun-API-Client/1.0.0',
              Accept: 'application/json',
            },
          }
        );
        expect(result).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith('Successfully checked creator approval status', {
          mintId: mockMintId,
          isApproved: true,
          responseType: 'boolean',
        });
      });

      test('should return false for non-approved creator', async () => {
        const mockResponse = { data: false };
        MockedAxios.get.mockResolvedValue(mockResponse);

        const result = await liveStreamInfoService.isApprovedCreator(mockMintId);

        expect(result).toBe(false);
      });

      test('should return false for creator not found (404)', async () => {
        const mockError = { response: { status: 404 } };
        MockedAxios.get.mockRejectedValue(mockError);

        const result = await liveStreamInfoService.isApprovedCreator(mockMintId);

        expect(result).toBe(false);
        expect(mockLogger.info).toHaveBeenCalledWith('Creator not found, treating as not approved', {
          mintId: mockMintId,
          statusCode: 404,
        });
      });

      test('should handle API errors appropriately', async () => {
        const mockError = {
          response: { status: 500, data: { message: 'Server error' } },
        };
        MockedAxios.get.mockRejectedValue(mockError);

        await expect(liveStreamInfoService.isApprovedCreator(mockMintId)).rejects.toThrow(
          ServerError
        );
      });

      test('should handle various boolean response formats', async () => {
        const testCases = [
          { data: 1, expected: true },
          { data: 0, expected: false },
          { data: 'true', expected: true }, // Non-empty string is truthy
          { data: 'false', expected: true }, // Non-empty string is truthy
          { data: {}, expected: true }, // Non-empty object is truthy
          { data: [], expected: true }, // Non-empty array is truthy
          { data: '', expected: false }, // Empty string is falsy
          { data: null, expected: false }, // null is falsy
          { data: undefined, expected: false }, // undefined is falsy
        ];

        for (const testCase of testCases) {
          MockedAxios.get.mockResolvedValue({ data: testCase.data });

          const result = await liveStreamInfoService.isApprovedCreator(mockMintId);

          expect(result).toBe(testCase.expected);
        }
      });
    });

    describe('getLiveKitConnectionInfo', () => {
      test('should generate LiveKit connection info for active stream', async () => {
        // Mock getLiveStreamInfo to return active stream
        jest.spyOn(liveStreamInfoService, 'getLiveStreamInfo').mockResolvedValue(mockStreamInfo);

        const result = await liveStreamInfoService.getLiveKitConnectionInfo(mockMintId);

        expect(result).toEqual(expect.objectContaining({
          mintId: mockMintId,
          streamId: mockStreamInfo.id,
          roomName: `${mockMintId}:12345`,
          primaryServer: expect.stringContaining('wss://'),
          requiresAuthentication: true,
        }));
        expect(result?.regions).toHaveLength(4); // MAX_LIVEKIT_REGIONS is 4
        expect(result?.regions[0]).toEqual(expect.objectContaining({
          region: expect.any(String),
          url: expect.stringContaining('wss://livekit-'),
          distance: expect.any(String),
        }));
      });

      test('should return null for inactive stream', async () => {
        const inactiveStreamInfo = { ...mockStreamInfo, isLive: false };
        jest.spyOn(liveStreamInfoService, 'getLiveStreamInfo').mockResolvedValue(inactiveStreamInfo);

        const result = await liveStreamInfoService.getLiveKitConnectionInfo(mockMintId);

        expect(result).toBeNull();
        expect(mockLogger.info).toHaveBeenCalledWith('No active stream found for LiveKit connection', {
          mintId: mockMintId,
          hasStreamInfo: true,
          isLive: false,
        });
      });

      test('should return null when stream info not found', async () => {
        jest.spyOn(liveStreamInfoService, 'getLiveStreamInfo').mockResolvedValue(null);

        const result = await liveStreamInfoService.getLiveKitConnectionInfo(mockMintId);

        expect(result).toBeNull();
      });

      test('should handle errors from getLiveStreamInfo', async () => {
        const error = new NetworkError({ message: 'Network error', code: 'NETWORK_ERROR' });
        jest.spyOn(liveStreamInfoService, 'getLiveStreamInfo').mockRejectedValue(error);

        await expect(liveStreamInfoService.getLiveKitConnectionInfo(mockMintId)).rejects.toThrow(
          NetworkError
        );
      });

      test('should select optimal regions correctly', async () => {
        const highParticipantStream = { ...mockStreamInfo, numParticipants: 500 };
        jest.spyOn(liveStreamInfoService, 'getLiveStreamInfo').mockResolvedValue(highParticipantStream);

        const result = await liveStreamInfoService.getLiveKitConnectionInfo(mockMintId);

        expect(result?.regions).toBeDefined();
        expect(result?.regions.length).toBeGreaterThan(0);
        // Regions should be sorted by distance (lowest first)
        const distances = result!.regions.map(r => parseFloat(r.distance));
        expect(distances).toEqual([...distances].sort((a, b) => a - b));
      });
    });
  });

  describe('LiveStreamsService Video Methods', () => {
    describe('getLiveStreamInfo', () => {
      test('should delegate to LiveStreamInfoService', async () => {
        const mockStreamInfoService = {
          getLiveStreamInfo: jest.fn().mockResolvedValue(mockStreamInfo),
        } as any;

        // Create a new LiveStreamsService with mocked streamInfoService
        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        // Replace the private streamInfoService with our mock
        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        const result = await mockLiveStreamsService.getLiveStreamInfo(mockMintId);

        expect(mockStreamInfoService.getLiveStreamInfo).toHaveBeenCalledWith(mockMintId);
        expect(result).toEqual(mockStreamInfo);
      });
    });

    describe('isApprovedCreator', () => {
      test('should delegate to LiveStreamInfoService', async () => {
        const mockStreamInfoService = {
          isApprovedCreator: jest.fn().mockResolvedValue(true),
        } as any;

        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        const result = await mockLiveStreamsService.isApprovedCreator(mockMintId);

        expect(mockStreamInfoService.isApprovedCreator).toHaveBeenCalledWith(mockMintId);
        expect(result).toBe(true);
      });
    });

    describe('getLiveKitConnectionInfo', () => {
      test('should delegate to LiveStreamInfoService with logging', async () => {
        const mockStreamInfoService = {
          getLiveKitConnectionInfo: jest.fn().mockResolvedValue(mockLiveKitConnectionInfo),
        } as any;

        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        const result = await mockLiveStreamsService.getLiveKitConnectionInfo(mockMintId);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Getting LiveKit connection information via LiveStreamsService',
          { mintId: mockMintId, operation: 'getLiveKitConnectionInfo' }
        );
        expect(mockStreamInfoService.getLiveKitConnectionInfo).toHaveBeenCalledWith(mockMintId);
        expect(result).toEqual(mockLiveKitConnectionInfo);
      });

      test('should handle and log errors appropriately', async () => {
        const error = new Error('Test error');
        const mockStreamInfoService = {
          getLiveKitConnectionInfo: jest.fn().mockRejectedValue(error),
        } as any;

        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        await expect(mockLiveStreamsService.getLiveKitConnectionInfo(mockMintId)).rejects.toThrow(error);

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to get LiveKit connection info via LiveStreamsService',
          { mintId: mockMintId, error: 'Test error' }
        );
      });
    });

    describe('getVideoStreamAnalysis', () => {
      test('should return comprehensive analysis with all data', async () => {
        // Create a mock streamInfoService
        const mockStreamInfoService = {
          getLiveStreamInfo: jest.fn().mockResolvedValue(mockStreamInfo),
          isApprovedCreator: jest.fn().mockResolvedValue(true),
          getLiveKitConnectionInfo: jest.fn().mockResolvedValue(mockLiveKitConnectionInfo),
        } as any;

        // Create a new LiveStreamsService with mocked streamInfoService
        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        // Replace the private streamInfoService with our mock
        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        const result = await mockLiveStreamsService.getVideoStreamAnalysis(mockMintId);

        expect(result).toEqual({
          hasActiveStream: true,
          isApprovedCreator: true,
          streamInfo: mockStreamInfo,
          liveKitConnection: mockLiveKitConnectionInfo,
          analyzedAt: expect.any(String),
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Successfully completed video stream analysis', {
          mintId: mockMintId,
          hasActiveStream: true,
          isApprovedCreator: true,
          hasStreamInfo: true,
          hasLiveKitConnection: true,
          streamId: mockStreamInfo.id,
          participantCount: mockStreamInfo.numParticipants,
          analyzedAt: result.analyzedAt,
        });
      });

      test('should handle analysis with inactive stream', async () => {
        const inactiveStream = { ...mockStreamInfo, isLive: false };
        const mockStreamInfoService = {
          getLiveStreamInfo: jest.fn().mockResolvedValue(inactiveStream),
          isApprovedCreator: jest.fn().mockResolvedValue(false),
          getLiveKitConnectionInfo: jest.fn().mockResolvedValue(null),
        } as any;

        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        const result = await mockLiveStreamsService.getVideoStreamAnalysis(mockMintId);

        expect(result).toEqual({
          hasActiveStream: false,
          isApprovedCreator: false,
          streamInfo: inactiveStream,
          liveKitConnection: undefined,
          analyzedAt: expect.any(String),
        });
      });

      test('should handle analysis with no stream info', async () => {
        const mockStreamInfoService = {
          getLiveStreamInfo: jest.fn().mockResolvedValue(null),
          isApprovedCreator: jest.fn().mockResolvedValue(false),
          getLiveKitConnectionInfo: jest.fn().mockResolvedValue(null),
        } as any;

        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        const result = await mockLiveStreamsService.getVideoStreamAnalysis(mockMintId);

        expect(result).toEqual({
          hasActiveStream: false,
          isApprovedCreator: false,
          streamInfo: undefined,
          liveKitConnection: undefined,
          analyzedAt: expect.any(String),
        });
      });

      test('should handle partial failures gracefully', async () => {
        const mockStreamInfoService = {
          getLiveStreamInfo: jest.fn().mockResolvedValue(mockStreamInfo),
          isApprovedCreator: jest.fn().mockRejectedValue(new Error('API Error')),
          getLiveKitConnectionInfo: jest.fn().mockResolvedValue(mockLiveKitConnectionInfo),
        } as any;

        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        const result = await mockLiveStreamsService.getVideoStreamAnalysis(mockMintId);

        expect(result).toEqual({
          hasActiveStream: true,
          isApprovedCreator: false, // Defaults to false on error
          streamInfo: mockStreamInfo,
          liveKitConnection: mockLiveKitConnectionInfo,
          analyzedAt: expect.any(String),
        });
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Failed to check creator approval during analysis',
          { mintId: mockMintId, error: 'API Error' }
        );
      });

      test('should handle all methods failing', async () => {
        const mockStreamInfoService = {
          getLiveStreamInfo: jest.fn().mockRejectedValue(new Error('Stream error')),
          isApprovedCreator: jest.fn().mockRejectedValue(new Error('Approval error')),
          getLiveKitConnectionInfo: jest.fn().mockRejectedValue(new Error('Connection error')),
        } as any;

        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        const result = await mockLiveStreamsService.getVideoStreamAnalysis(mockMintId);

        expect(result).toEqual({
          hasActiveStream: false,
          isApprovedCreator: false,
          streamInfo: undefined,
          liveKitConnection: undefined,
          analyzedAt: expect.any(String),
        });
        expect(mockLogger.warn).toHaveBeenCalledTimes(3); // One for each failed method
      });

      test('should execute all methods in parallel for efficiency', async () => {
        const mockStreamInfoService = {
          getLiveStreamInfo: jest.fn().mockResolvedValue(mockStreamInfo),
          isApprovedCreator: jest.fn().mockResolvedValue(true),
          getLiveKitConnectionInfo: jest.fn().mockResolvedValue(mockLiveKitConnectionInfo),
        } as any;

        const mockLiveStreamsService = new LiveStreamsService(
          mockConfig,
          mockHttpClient,
          mockLogger,
          mockRateLimiter,
          mockErrorHandler,
          { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
        );

        (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

        await mockLiveStreamsService.getVideoStreamAnalysis(mockMintId);

        // All spies should have been called
        expect(mockStreamInfoService.getLiveStreamInfo).toHaveBeenCalledWith(mockMintId);
        expect(mockStreamInfoService.isApprovedCreator).toHaveBeenCalledWith(mockMintId);
        expect(mockStreamInfoService.getLiveKitConnectionInfo).toHaveBeenCalledWith(mockMintId);
      });
    });

    describe('joinLiveStream', () => {
      test('should successfully join live stream with 201 status', async () => {
        const mockResponse = {
          status: 201,
          data: null, // No data but successful status
        };
        mockHttpClient.client.request.mockResolvedValue(mockResponse);

        const result = await liveStreamsService.joinLiveStream(mockMintId);

        expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
        expect(mockHttpClient.client.request).toHaveBeenCalledWith({
          method: 'POST',
          url: `${mockConfig.livestreamURL}/livestream/join`,
          data: { mintId: mockMintId },
          headers: { 'Content-Type': 'application/json' },
          timeout: mockConfig.timeout,
        });
        expect(result).toEqual({
          success: true,
          message: `Successfully joined live stream for ${mockMintId}`,
          streamId: undefined,
          roomName: `${mockMintId}:stream`,
          websocketUrl: undefined,
          requiresAuthentication: true,
        });
        expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
      });

      test('should handle successful join with response data', async () => {
        const mockResponse = {
          status: 200,
          data: {
            streamId: 12345,
            roomName: 'test-room',
            websocketUrl: 'wss://test.livekit.cloud',
            requiresAuthentication: false,
          },
        };
        mockHttpClient.client.request.mockResolvedValue(mockResponse);

        const result = await liveStreamsService.joinLiveStream(mockMintId);

        expect(result).toEqual({
          success: true,
          message: `Successfully joined live stream for ${mockMintId}`,
          streamId: 12345,
          roomName: 'test-room',
          websocketUrl: 'wss://test.livekit.cloud',
          requiresAuthentication: false,
        });
      });

      test('should handle successful join with partial response data', async () => {
        const mockResponse = {
          status: 200,
          data: {
            id: 12345, // Alternative field name
            url: 'wss://test.livekit.cloud', // Alternative field name
          },
        };
        mockHttpClient.client.request.mockResolvedValue(mockResponse);

        const result = await liveStreamsService.joinLiveStream(mockMintId);

        expect(result).toEqual({
          success: true,
          message: `Successfully joined live stream for ${mockMintId}`,
          streamId: 12345,
          roomName: `${mockMintId}:stream`, // Fallback
          websocketUrl: 'wss://test.livekit.cloud',
          requiresAuthentication: false, // Default
        });
      });

      test('should validate mintId parameter', async () => {
        const invalidMintIds = [null, undefined, '', '   ', false, 0, []];

        for (const invalidMintId of invalidMintIds) {
          const result = await liveStreamsService.joinLiveStream(invalidMintId as any);

          expect(result).toEqual({
            success: false,
            message: 'Invalid mintId provided',
            error: {
              code: 'INVALID_PARAMETER',
              details: 'mintId must be a non-empty string',
            },
          });
        }
        expect(mockHttpClient.client.request).not.toHaveBeenCalled();
      });

      test('should handle 404 stream not found error', async () => {
        const mockError = new Error('Request failed with status code 404');
        mockHttpClient.client.request.mockRejectedValue(mockError);

        const result = await liveStreamsService.joinLiveStream(mockMintId);

        expect(result).toEqual({
          success: false,
          message: `No active stream found for mint: ${mockMintId}`,
          error: {
            code: 'STREAM_NOT_FOUND',
            details: 'There is no active live stream for this token',
          },
        });
      });

      test('should handle 403/401 access denied error', async () => {
        const mockError = new Error('Request failed with status code 403');
        mockHttpClient.client.request.mockRejectedValue(mockError);

        const result = await liveStreamsService.joinLiveStream(mockMintId);

        expect(result).toEqual({
          success: false,
          message: `Access denied for stream: ${mockMintId}`,
          error: {
            code: 'ACCESS_DENIED',
            details: 'You do not have permission to join this stream',
          },
        });
      });

      test('should handle 429 rate limit error', async () => {
        const mockError = new Error('Request failed with status code 429');
        mockHttpClient.client.request.mockRejectedValue(mockError);

        const result = await liveStreamsService.joinLiveStream(mockMintId);

        expect(result).toEqual({
          success: false,
          message: `Rate limit exceeded while joining stream: ${mockMintId}`,
          error: {
            code: 'RATE_LIMITED',
            details: 'Too many join requests, please try again later',
          },
        });
      });

      test('should handle generic network errors', async () => {
        const mockError = new Error('Network connection failed');
        mockHttpClient.client.request.mockRejectedValue(mockError);

        const result = await liveStreamsService.joinLiveStream(mockMintId);

        expect(result).toEqual({
          success: false,
          message: `Failed to join stream for ${mockMintId}: Network connection failed`,
          error: {
            code: 'JOIN_FAILED',
            details: 'Network connection failed',
          },
        });
      });

      test('should handle unknown error types', async () => {
        mockHttpClient.client.request.mockRejectedValue('Unknown error');

        const result = await liveStreamsService.joinLiveStream(mockMintId);

        expect(result).toEqual({
          success: false,
          message: `Unknown error occurred while joining stream for ${mockMintId}`,
          error: {
            code: 'UNKNOWN_ERROR',
            details: 'Unknown error',
          },
        });
      });

      test('should trim whitespace from mintId', async () => {
        const mockResponse = { status: 201, data: null };
        mockHttpClient.client.request.mockResolvedValue(mockResponse);

        await liveStreamsService.joinLiveStream(`  ${mockMintId}  `);

        expect(mockHttpClient.client.request).toHaveBeenCalledWith({
          method: 'POST',
          url: `${mockConfig.livestreamURL}/livestream/join`,
          data: { mintId: mockMintId }, // Trimmed
          headers: { 'Content-Type': 'application/json' },
          timeout: mockConfig.timeout,
        });
      });

      test('should provide appropriate error resolution messages', async () => {
        const errorCases = [
          {
            error: new Error('Request failed with status code 404'),
            expectedCode: 'STREAM_NOT_FOUND',
            expectedResolution: 'Verify the mintId is correct and the stream is currently active',
          },
          {
            error: new Error('Request failed with status code 403'),
            expectedCode: 'ACCESS_DENIED',
            expectedResolution: 'Check if you have the required permissions or if the stream is private',
          },
          {
            error: new Error('Request failed with status code 429'),
            expectedCode: 'RATE_LIMITED',
            expectedResolution: 'Wait before making another join request or check your rate limit status',
          },
        ];

        for (const testCase of errorCases) {
          mockHttpClient.client.request.mockRejectedValue(testCase.error);

          const result = await liveStreamsService.joinLiveStream(mockMintId);

          expect(result.error?.code).toBe(testCase.expectedCode);
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Failed to join live stream',
            expect.objectContaining({
              resolution: testCase.expectedResolution,
            })
          );
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed API responses gracefully', async () => {
      const testCases = [
        { data: undefined, expected: 'null' },
        { data: null, expected: 'null' },
        { data: 'string instead of object', expected: 'null' }, // typeof string !== 'object'
        { data: 123, expected: 'null' }, // typeof number !== 'object'
        { data: [], expected: 'object' }, // typeof array === 'object'
        { data: {}, expected: 'object' }, // typeof object === 'object'
      ];

      for (const testCase of testCases) {
        MockedAxios.get.mockResolvedValue({ data: testCase.data });

        const result = await liveStreamInfoService.getLiveStreamInfo(mockMintId);

        if (testCase.expected === 'null') {
          expect(result).toBeNull();
        } else {
          // For arrays and objects, service creates default structure
          expect(result).toEqual(expect.objectContaining({
            id: 0,
            supabaseId: 0,
            mintId: mockMintId,
            creatorAddress: '',
            streamStartTimestamp: 0,
            numParticipants: 0,
            maxParticipants: 0,
            isLive: false,
            downrankScore: 0,
            title: '',
            mode: 'broadcast',
          }));
        }
      }
    });

    test('should handle concurrent requests to same stream', async () => {
      const mockStreamInfoService = {
        getLiveStreamInfo: jest.fn().mockResolvedValue(mockStreamInfo),
        isApprovedCreator: jest.fn().mockResolvedValue(true),
        getLiveKitConnectionInfo: jest.fn().mockResolvedValue(mockLiveKitConnectionInfo),
      } as any;

      const mockLiveStreamsService = new LiveStreamsService(
        mockConfig,
        mockHttpClient,
        mockLogger,
        mockRateLimiter,
        mockErrorHandler,
        { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
      );

      (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

      const promises = [
        mockLiveStreamsService.getLiveStreamInfo(mockMintId),
        mockLiveStreamsService.getVideoStreamAnalysis(mockMintId),
        mockLiveStreamsService.getLiveKitConnectionInfo(mockMintId),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual(mockStreamInfo);
      expect(results[1]).toEqual(expect.objectContaining({ streamInfo: mockStreamInfo }));
      expect(results[2]).toEqual(mockLiveKitConnectionInfo);
    });

    test('should handle empty mint IDs', async () => {
      const emptyMintIds = ['', '   ', '\n\t'];

      for (const mintId of emptyMintIds) {
        // Empty mintIds should still work - they're just passed to the API
        MockedAxios.get.mockResolvedValue({ data: null });
        const result = await liveStreamInfoService.getLiveStreamInfo(mintId);
        expect(result).toBeNull();
      }
    });

    test('should handle very long mint IDs', async () => {
      const longMintId = 'a'.repeat(1000);
      MockedAxios.get.mockRejectedValue({ response: { status: 400 } });

      await expect(liveStreamInfoService.getLiveStreamInfo(longMintId)).rejects.toThrow(
        ValidationError
      );
    });

    test('should handle special characters in mint IDs', async () => {
      const specialMintId = 'test@#$%^&*()_+-=[]{}|;:,.<>?';
      MockedAxios.get.mockResolvedValue({ data: mockStreamInfo });

      const result = await liveStreamInfoService.getLiveStreamInfo(specialMintId);

      expect(MockedAxios.get).toHaveBeenCalledWith(
        `${mockConfig.livestreamURL}/livestream?mintId=${specialMintId}`,
        expect.any(Object)
      );
      expect(result).toEqual(mockStreamInfo);
    });
  });

  describe('Integration with Other Services', () => {
    test('should work with HTTP client timeouts', async () => {
      jest.useFakeTimers();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 1000);
      });
      MockedAxios.get.mockReturnValue(timeoutPromise as any);

      const promise = liveStreamInfoService.getLiveStreamInfo(mockMintId);
      jest.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow();
      jest.useRealTimers();
    });

    test('should integrate with rate limiting for join operations', async () => {
      mockRateLimiter.waitForRequest.mockResolvedValue(undefined);
      const mockResponse = { status: 201, data: null };
      mockHttpClient.client.request.mockResolvedValue(mockResponse);

      await liveStreamsService.joinLiveStream(mockMintId);

      expect(mockRateLimiter.waitForRequest).toHaveBeenCalled();
      expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
    });

    test('should handle circuit breaker status', async () => {
      mockErrorHandler.getCircuitBreakerStatus = jest.fn().mockReturnValue({
        isOpen: true,
        remainingTime: 30000,
      });

      // This should be handled by the error handler
      const error = new Error('Circuit breaker is open');
      mockErrorHandler.handleError.mockReturnValue(error);

      const mockStreamInfoService = {
        getLiveStreamInfo: jest.fn().mockRejectedValue(error),
      } as any;

      const mockLiveStreamsService = new LiveStreamsService(
        mockConfig,
        mockHttpClient,
        mockLogger,
        mockRateLimiter,
        mockErrorHandler,
        { requestCount: 0, errorCount: 0, lastRequestTime: 0 }
      );

      (mockLiveStreamsService as any).streamInfoService = mockStreamInfoService;

      await expect(mockLiveStreamsService.getLiveStreamInfo(mockMintId)).rejects.toThrow(error);
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete video stream analysis within reasonable time', async () => {
      jest.spyOn(liveStreamInfoService, 'getLiveStreamInfo').mockResolvedValue(mockStreamInfo);
      jest.spyOn(liveStreamInfoService, 'isApprovedCreator').mockResolvedValue(true);
      jest.spyOn(liveStreamInfoService, 'getLiveKitConnectionInfo').mockResolvedValue(
        mockLiveKitConnectionInfo
      );

      const startTime = Date.now();
      await liveStreamsService.getVideoStreamAnalysis(mockMintId);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle high participant counts in region selection', async () => {
      const highParticipantStream = { ...mockStreamInfo, numParticipants: 10000 };
      jest.spyOn(liveStreamInfoService, 'getLiveStreamInfo').mockResolvedValue(highParticipantStream);

      const result = await liveStreamInfoService.getLiveKitConnectionInfo(mockMintId);

      expect(result?.regions).toBeDefined();
      // Even with high participants, should still return valid regions
      expect(result?.regions.length).toBeGreaterThan(0);
    });

    test('should handle different stream modes correctly', async () => {
      const streamModes = ['interactive', 'broadcast'] as const;

      for (const mode of streamModes) {
        const streamWithMode = { ...mockStreamInfo, mode };
        jest.spyOn(liveStreamInfoService, 'getLiveStreamInfo').mockResolvedValue(streamWithMode);

        const result = await liveStreamInfoService.getLiveKitConnectionInfo(mockMintId);

        expect(result).toBeDefined();
        expect(result?.mintId).toBe(mockMintId);
      }
    });
  });
});