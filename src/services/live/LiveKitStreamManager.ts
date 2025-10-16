/**
 * LiveKit Stream Manager for PumpFun API Client
 *
 * This helper class manages WebRTC connections and handles LiveKit integration
 * automatically for advanced streaming scenarios with connection lifecycle management.
 */

import {
  ConnectionState,
  LiveKitConnectionOptions,
  LiveStreamConnection,
  ConnectionConfig,
} from '../../types/domain.types';
import { Logger } from '../../infrastructure/logging/logger';
import {
  LIVEKIT_CONNECTION_TIMEOUT_MS,
} from '../../constants/api.constants';
import {
  NetworkError,
  ValidationError
} from '../../infrastructure/error-handling/errors';

// Try to import LiveKit SDK - will be undefined if not installed
let LiveKitRoom: any = null;
let LiveKitRoomEvent: any = null;

try {
  const livekitModule = require('@livekit/client');
  LiveKitRoom = livekitModule.Room;
  LiveKitRoomEvent = livekitModule.RoomEvent;
} catch (error) {
  // LiveKit not available - will be handled gracefully
}

/**
 * Helper class that manages WebRTC connections and handles LiveKit integration automatically
 */
export class LiveKitStreamManager {
  private activeConnections: Map<string, LiveStreamConnection> = new Map();
  private reconnectionAttempts: Map<string, number> = new Map();
  private connectionConfig: ConnectionConfig;
  private connectionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private liveKitRooms: Map<string, any> = new Map(); // Map to store actual LiveKit Room instances

  constructor(
    private client: any, // PumpFunAPIClient - using any to avoid circular dependency
    private logger: Logger,
    config?: Partial<ConnectionConfig>
  ) {
    this.connectionConfig = {
      defaultMaxReconnectAttempts: 5,
      defaultReconnectDelayMs: 3000,
      connectionTimeoutMs: LIVEKIT_CONNECTION_TIMEOUT_MS,
      heartbeatIntervalMs: 5000,
      enableStatistics: true,
      enableDebugLogging: false,
      ...config,
    };

    this.logger.info('LiveKitStreamManager initialized', {
      config: this.connectionConfig,
    });
  }

  /**
   * Establish WebRTC connection to a live stream
   */
  async connect(
    mintId: string,
    options?: LiveKitConnectionOptions
  ): Promise<LiveStreamConnection> {
    this.logger.info('Establishing LiveKit connection', {
      mintId,
      options: options ? {
        hasVideoElement: !!options.videoElement,
        hasAudioElement: !!options.audioElement,
        autoConnect: options.autoConnect,
        autoPlay: options.autoPlay,
        videoEnabled: options.videoEnabled,
        audioEnabled: options.audioEnabled,
        preferredQuality: options.preferredQuality,
      } : undefined,
    });

    // Check if LiveKit SDK is available
    if (!LiveKitRoom) {
      throw new ValidationError({
        message: 'LiveKit SDK not installed. Install with: npm install @livekit/client',
        details: { mintId },
      });
    }

    // Validate input parameters
    this.validateConnectParameters(mintId, options);

    // Check if connection already exists
    const existingConnection = this.activeConnections.get(mintId);
    if (existingConnection && existingConnection.isConnected) {
      this.logger.info('Connection already exists and is active', {
        mintId,
        connectionId: existingConnection.id,
      });
      return existingConnection;
    }

    // Generate unique connection ID
    const connectionId = this.generateConnectionId(mintId);

    try {
      // Get LiveKit connection info from client
      const connectionInfo = await this.client.getLiveKitConnectionInfo(mintId);

      if (!connectionInfo) {
        throw new ValidationError({
          message: `No active LiveKit stream found for mint: ${mintId}`,
          details: { mintId },
        });
      }

      // Create connection object with real LiveKit integration
      const connection = await this.createRealLiveKitConnection(
        connectionId,
        mintId,
        connectionInfo,
        options
      );

      // Store connection
      this.activeConnections.set(mintId, connection);

      // Start connection timeout
      this.startConnectionTimeout(connectionId, mintId);

      // Start heartbeat for connection monitoring
      this.startHeartbeat(connectionId, mintId);

      this.logger.info('LiveKit connection established successfully', {
        connectionId,
        mintId,
        roomName: connection.roomName,
        state: connection.state,
      });

      // Trigger success callback if provided
      if (options?.onConnected) {
        try {
          options.onConnected(connection);
        } catch (callbackError) {
          this.logger.warn('Error in onConnected callback', {
            connectionId,
            mintId,
            error: (callbackError as Error).message,
          });
        }
      }

      return connection;

    } catch (error: any) {
      this.logger.error('Failed to establish LiveKit connection', {
        mintId,
        connectionId,
        error: error.message,
        errorType: error.constructor.name,
      });

      // Trigger error callback if provided
      if (options?.onError) {
        try {
          options.onError(error as Error, this.createMockConnection(mintId));
        } catch (callbackError) {
          this.logger.warn('Error in onError callback', {
            connectionId,
            mintId,
            error: (callbackError as Error).message,
          });
        }
      }

      throw error;
    }
  }

  /**
   * Close connection and cleanup resources
   */
  async disconnect(connectionIdOrMintId: string): Promise<void> {
    const connection = this.findConnection(connectionIdOrMintId);

    if (!connection) {
      this.logger.warn('Connection not found for disconnect', {
        connectionIdOrMintId,
      });
      return;
    }

    this.logger.info('Disconnecting LiveKit connection', {
      connectionId: connection.id,
      mintId: connection.mintId,
      currentState: connection.state,
    });

    try {
      // Update connection state
      this.updateConnectionState(connection, ConnectionState.DISCONNECTING);

      // Clear timeouts and intervals
      this.clearConnectionTimers(connection.id);

      // Disconnect LiveKit room if it exists
      const liveKitRoom = this.liveKitRooms.get(connection.id);
      if (liveKitRoom) {
        this.logger.debug('Disconnecting LiveKit room', {
          connectionId: connection.id,
          roomName: connection.roomName,
        });

        // Remove event listeners
        liveKitRoom.removeAllListeners();

        // Disconnect from room
        await liveKitRoom.disconnect();

        // Remove from rooms map
        this.liveKitRooms.delete(connection.id);
      }

      // Close WebRTC connection
      if (connection.mediaStream) {
        connection.mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }

      // Remove from active connections
      this.activeConnections.delete(connection.mintId);
      this.reconnectionAttempts.delete(connection.mintId);

      // Update final state
      this.updateConnectionState(connection, ConnectionState.DISCONNECTED);

      this.logger.info('LiveKit connection disconnected successfully', {
        connectionId: connection.id,
        mintId: connection.mintId,
      });

    } catch (error: any) {
      this.logger.error('Error during disconnection', {
        connectionId: connection.id,
        mintId: connection.mintId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Attempt to reconnect an existing connection
   */
  async reconnect(connectionIdOrMintId: string): Promise<void> {
    await this.reconnectAndGetConnection(connectionIdOrMintId);
  }

  /**
   * Attempt to reconnect an existing connection and return the new connection
   */
  async reconnectAndGetConnection(connectionIdOrMintId: string): Promise<LiveStreamConnection> {
    const connection = this.findConnection(connectionIdOrMintId);

    if (!connection) {
      throw new ValidationError({
        message: `Connection not found for reconnection: ${connectionIdOrMintId}`,
        details: { connectionIdOrMintId },
      });
    }

    this.logger.info('Attempting to reconnect LiveKit connection', {
      connectionId: connection.id,
      mintId: connection.mintId,
      previousReconnections: connection.reconnectionCount,
    });

    // Check reconnection limits
    const currentAttempts = this.reconnectionAttempts.get(connection.mintId) || 0;
    if (currentAttempts >= this.connectionConfig.defaultMaxReconnectAttempts) {
      throw new NetworkError({
        message: `Maximum reconnection attempts exceeded for ${connection.mintId}`,
        code: 'MAX_RECONNECTION_ATTEMPTS',
        details: {
          mintId: connection.mintId,
          attempts: currentAttempts,
          maxAttempts: this.connectionConfig.defaultMaxReconnectAttempts,
        },
      });
    }

    // Update reconnection count
    this.reconnectionAttempts.set(connection.mintId, currentAttempts + 1);
    connection.reconnectionCount = currentAttempts + 1;

    // Update connection state
    this.updateConnectionState(connection, ConnectionState.RECONNECTING);

    try {
      // Disconnect existing connection
      await this.disconnect(connection.id);

      // Wait before reconnecting
      await this.delay(this.connectionConfig.defaultReconnectDelayMs);

      // Create new connection
      const newConnection = await this.connect(connection.mintId);

      this.logger.info('LiveKit connection reconnected successfully', {
        connectionId: newConnection.id,
        mintId: newConnection.mintId,
        reconnectionCount: newConnection.reconnectionCount,
      });

      return newConnection;

    } catch (error: any) {
      this.logger.error('Failed to reconnect LiveKit connection', {
        connectionId: connection.id,
        mintId: connection.mintId,
        reconnectionAttempt: currentAttempts + 1,
        error: error.message,
      });

      // Update connection state to failed
      this.updateConnectionState(connection, ConnectionState.FAILED);

      throw error;
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(connectionIdOrMintId: string): ConnectionState {
    const connection = this.findConnection(connectionIdOrMintId);
    return connection?.state ?? ConnectionState.DISCONNECTED;
  }

  /**
   * Mute audio track for a connection
   */
  async muteAudio(connectionIdOrMintId: string): Promise<void> {
    const connection = this.findConnection(connectionIdOrMintId);

    if (!connection) {
      throw new ValidationError({
        message: `Connection not found: ${connectionIdOrMintId}`,
        details: { connectionIdOrMintId },
      });
    }

    if (connection.audioTrack) {
      connection.audioTrack.enabled = false;
      this.logger.debug('Audio track muted', {
        connectionId: connection.id,
        mintId: connection.mintId,
      });
    }
  }

  /**
   * Unmute audio track for a connection
   */
  async unmuteAudio(connectionIdOrMintId: string): Promise<void> {
    const connection = this.findConnection(connectionIdOrMintId);

    if (!connection) {
      throw new ValidationError({
        message: `Connection not found: ${connectionIdOrMintId}`,
        details: { connectionIdOrMintId },
      });
    }

    if (connection.audioTrack) {
      connection.audioTrack.enabled = true;
      this.logger.debug('Audio track unmuted', {
        connectionId: connection.id,
        mintId: connection.mintId,
      });
    }
  }

  /**
   * Mute video track for a connection
   */
  async muteVideo(connectionIdOrMintId: string): Promise<void> {
    const connection = this.findConnection(connectionIdOrMintId);

    if (!connection) {
      throw new ValidationError({
        message: `Connection not found: ${connectionIdOrMintId}`,
        details: { connectionIdOrMintId },
      });
    }

    if (connection.videoTrack) {
      connection.videoTrack.enabled = false;
      this.logger.debug('Video track muted', {
        connectionId: connection.id,
        mintId: connection.mintId,
      });
    }
  }

  /**
   * Unmute video track for a connection
   */
  async unmuteVideo(connectionIdOrMintId: string): Promise<void> {
    const connection = this.findConnection(connectionIdOrMintId);

    if (!connection) {
      throw new ValidationError({
        message: `Connection not found: ${connectionIdOrMintId}`,
        details: { connectionIdOrMintId },
      });
    }

    if (connection.videoTrack) {
      connection.videoTrack.enabled = true;
      this.logger.debug('Video track unmuted', {
        connectionId: connection.id,
        mintId: connection.mintId,
      });
    }
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): LiveStreamConnection[] {
    return Array.from(this.activeConnections.values());
  }

  /**
   * Get connection by ID or mint ID
   */
  private findConnection(connectionIdOrMintId: string): LiveStreamConnection | undefined {
    // Try to find by mint ID first
    let connection = this.activeConnections.get(connectionIdOrMintId);

    // If not found, try to find by connection ID
    if (!connection) {
      for (const conn of Array.from(this.activeConnections.values())) {
        if (conn.id === connectionIdOrMintId) {
          connection = conn;
          break;
        }
      }
    }

    return connection;
  }

  /**
   * Create a new LiveKit connection object with real SDK integration
   */
  private async createRealLiveKitConnection(
    connectionId: string,
    mintId: string,
    connectionInfo: any,
    options?: LiveKitConnectionOptions
  ): Promise<LiveStreamConnection> {
    const now = Date.now();

    // Create LiveKit room
    const room = new LiveKitRoom({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        width: 1280,
        height: 720,
        frameRate: 30,
      },
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Store the LiveKit room instance
    this.liveKitRooms.set(connectionId, room);

    // Set up event listeners
    this.setupLiveKitEventListeners(room, connectionId, mintId, options);

    // Create connection object
    const connection: LiveStreamConnection = {
      id: connectionId,
      mintId,
      roomName: connectionInfo.roomName,
      state: ConnectionState.CONNECTING,
      isConnected: false,
      createdAt: now,
      lastActivity: now,
      reconnectionCount: 0,
      videoTrack: null,
      audioTrack: null,
      mediaStream: null,

      // Connection methods
      disconnect: async () => this.disconnect(connectionId),
      reconnect: async () => {
        await this.reconnect(connectionId);
      },
      getStats: async () => this.getWebRTCStats(connectionId),
      muteAudio: async () => this.muteAudio(connectionId),
      unmuteAudio: async () => this.unmuteAudio(connectionId),
      muteVideo: async () => this.muteVideo(connectionId),
      unmuteVideo: async () => this.unmuteVideo(connectionId),
    };

    // Connect to LiveKit room
    await this.connectToLiveKitRoom(room, connectionInfo, connection, options);

    return connection;
  }

  /**
   * Set up LiveKit room event listeners
   */
  private setupLiveKitEventListeners(
    room: any,
    connectionId: string,
    mintId: string,
    options?: LiveKitConnectionOptions
  ): void {
    // Room connected
    room.on(LiveKitRoomEvent.Connected, () => {
      this.logger.debug('LiveKit room connected', {
        connectionId,
        mintId,
        roomName: room.name,
      });

      const connection = this.findConnection(connectionId);
      if (connection) {
        this.updateConnectionState(connection, ConnectionState.CONNECTED);
        connection.isConnected = true;

        // Extract tracks from room
        this.extractMediaTracks(room, connection);

        // Attach to DOM elements if provided
        if (connection.mediaStream && options) {
          this.attachMediaToElements(connection, options);
        }

        // Trigger success callback
        if (options?.onConnected) {
          try {
            options.onConnected(connection);
          } catch (error) {
            this.logger.warn('Error in onConnected callback', {
              connectionId,
              error: (error as Error).message,
            });
          }
        }
      }
    });

    // Room disconnected
    room.on(LiveKitRoomEvent.Disconnected, () => {
      this.logger.debug('LiveKit room disconnected', {
        connectionId,
        mintId,
      });

      const connection = this.findConnection(connectionId);
      if (connection) {
        this.updateConnectionState(connection, ConnectionState.DISCONNECTED);
        connection.isConnected = false;

        // Trigger disconnect callback
        if (options?.onDisconnected) {
          try {
            options.onDisconnected(connection);
          } catch (error) {
            this.logger.warn('Error in onDisconnected callback', {
              connectionId,
              error: (error as Error).message,
            });
          }
        }
      }
    });

    // Connection failed
    room.on(LiveKitRoomEvent.ConnectionQualityChanged, (quality: any) => {
      this.logger.debug('LiveKit connection quality changed', {
        connectionId,
        mintId,
        quality,
      });
    });

    // Track subscribed
    room.on(LiveKitRoomEvent.TrackSubscribed, (track: any, _publication: any, participant: any) => {
      this.logger.debug('LiveKit track subscribed', {
        connectionId,
        mintId,
        trackKind: track.kind,
        participantIdentity: participant?.identity,
      });

      const connection = this.findConnection(connectionId);
      if (connection) {
        this.updateConnectionTracks(connection, track, options);
      }
    });

    // Track unsubscribed
    room.on(LiveKitRoomEvent.TrackUnsubscribed, (track: any, _publication: any, participant: any) => {
      this.logger.debug('LiveKit track unsubscribed', {
        connectionId,
        mintId,
        trackKind: track.kind,
        participantIdentity: participant?.identity,
      });

      const connection = this.findConnection(connectionId);
      if (connection) {
        this.removeTrackFromConnection(connection, track);
      }
    });

    // Handle connection errors
    room.on(LiveKitRoomEvent.SignalConnected, () => {
      this.logger.debug('LiveKit signal connected', {
        connectionId,
        mintId,
      });
    });

    room.on(LiveKitRoomEvent.MediaDevicesError, (error: any) => {
      this.logger.error('LiveKit media devices error', {
        connectionId,
        mintId,
        error: error.message,
      });

      const connection = this.findConnection(connectionId);
      if (connection && options?.onError) {
        try {
          options.onError(error, connection);
        } catch (callbackError) {
          this.logger.warn('Error in onError callback', {
            connectionId,
            error: (callbackError as Error).message,
          });
        }
      }
    });
  }

  /**
   * Connect to LiveKit room with token
   */
  private async connectToLiveKitRoom(
    room: any,
    connectionInfo: any,
    connection: LiveStreamConnection,
    options?: LiveKitConnectionOptions
  ): Promise<void> {
    try {
      // Connect to the LiveKit room
      await room.connect(connectionInfo.serverUrl, connectionInfo.accessToken, {
        autoSubscribe: true,
        adaptiveStream: true,
      });

      this.logger.debug('Connected to LiveKit room', {
        connectionId: connection.id,
        roomName: room.name,
      });

    } catch (error: any) {
      this.logger.error('Failed to connect to LiveKit room', {
        connectionId: connection.id,
        roomName: connectionInfo.roomName,
        error: error.message,
      });

      this.updateConnectionState(connection, ConnectionState.FAILED);

      if (options?.onError) {
        try {
          options.onError(error, connection);
        } catch (callbackError) {
          this.logger.warn('Error in onError callback', {
            connectionId: connection.id,
            error: (callbackError as Error).message,
          });
        }
      }

      throw error;
    }
  }

  /**
   * Extract media tracks from LiveKit room
   */
  private extractMediaTracks(room: any, connection: LiveStreamConnection): void {
    // Get all remote tracks
    const remoteTracks: MediaStreamTrack[] = [];

    room.remoteParticipants.forEach((participant: any) => {
      participant.tracks.forEach((trackPublication: any) => {
        if (trackPublication.track) {
          remoteTracks.push(trackPublication.track.mediaStreamTrack);

          // Store track references
          if (trackPublication.track.kind === 'audio') {
            connection.audioTrack = trackPublication.track.mediaStreamTrack;
          } else if (trackPublication.track.kind === 'video') {
            connection.videoTrack = trackPublication.track.mediaStreamTrack;
          }
        }
      });
    });

    // Create media stream if we have tracks
    if (remoteTracks.length > 0) {
      connection.mediaStream = new MediaStream(remoteTracks);
    }

    this.logger.debug('Extracted media tracks', {
      connectionId: connection.id,
      audioTracks: remoteTracks.filter(t => t.kind === 'audio').length,
      videoTracks: remoteTracks.filter(t => t.kind === 'video').length,
    });
  }

  /**
   * Update connection tracks when new tracks are subscribed
   */
  private updateConnectionTracks(
    connection: LiveStreamConnection,
    track: any,
    options?: LiveKitConnectionOptions
  ): void {
    if (track.kind === 'audio') {
      connection.audioTrack = track.mediaStreamTrack;
    } else if (track.kind === 'video') {
      connection.videoTrack = track.mediaStreamTrack;
    }

    // Update media stream
    const tracks: MediaStreamTrack[] = [];
    if (connection.audioTrack) tracks.push(connection.audioTrack);
    if (connection.videoTrack) tracks.push(connection.videoTrack);

    if (tracks.length > 0) {
      connection.mediaStream = new MediaStream(tracks);

      // Attach to DOM elements if provided
      if (options) {
        this.attachMediaToElements(connection, options);
      }
    }

    this.logger.debug('Updated connection tracks', {
      connectionId: connection.id,
      trackKind: track.kind,
      totalTracks: tracks.length,
    });
  }

  /**
   * Remove track from connection
   */
  private removeTrackFromConnection(connection: LiveStreamConnection, track: any): void {
    if (track.kind === 'audio' && connection.audioTrack === track.mediaStreamTrack) {
      connection.audioTrack = null;
    } else if (track.kind === 'video' && connection.videoTrack === track.mediaStreamTrack) {
      connection.videoTrack = null;
    }

    // Recreate media stream
    const tracks: MediaStreamTrack[] = [];
    if (connection.audioTrack) tracks.push(connection.audioTrack);
    if (connection.videoTrack) tracks.push(connection.videoTrack);

    connection.mediaStream = tracks.length > 0 ? new MediaStream(tracks) : null;

    this.logger.debug('Removed track from connection', {
      connectionId: connection.id,
      trackKind: track.kind,
      remainingTracks: tracks.length,
    });
  }

  /**
   * Attach media stream to DOM elements
   */
  private attachMediaToElements(
    connection: LiveStreamConnection,
    options: LiveKitConnectionOptions
  ): void {
    if (!connection.mediaStream) return;

    if (options.videoElement) {
      options.videoElement.srcObject = connection.mediaStream;
      if (options.autoPlay) {
        options.videoElement.play().catch(error => {
          this.logger.warn('Failed to auto-play video', {
            connectionId: connection.id,
            error: (error as Error).message,
          });
        });
      }
    }

    if (options.audioElement) {
      options.audioElement.srcObject = connection.mediaStream;
      if (options.autoPlay) {
        options.audioElement.play().catch(error => {
          this.logger.warn('Failed to auto-play audio', {
            connectionId: connection.id,
            error: (error as Error).message,
          });
        });
      }
    }
  }

  /**
   * Get WebRTC statistics for a connection
   */
  private async getWebRTCStats(connectionId: string): Promise<RTCStatsReport> {
    const connection = this.findConnection(connectionId);

    if (!connection) {
      throw new ValidationError({
        message: `Connection not found: ${connectionId}`,
        details: { connectionId },
      });
    }

    // Get LiveKit room for stats
    const liveKitRoom = this.liveKitRooms.get(connectionId);
    if (liveKitRoom) {
      try {
        // Get stats from LiveKit room
        const stats = await liveKitRoom.getStats();
        return stats;
      } catch (error) {
        this.logger.warn('Failed to get LiveKit stats', {
          connectionId,
          error: (error as Error).message,
        });
      }
    }

    // Fallback: return empty stats report
    return {} as RTCStatsReport;
  }

  /**
   * Update connection state and trigger callbacks
   */
  private updateConnectionState(
    connection: LiveStreamConnection,
    newState: ConnectionState
  ): void {
    const oldState = connection.state;
    connection.state = newState;
    connection.lastActivity = Date.now();
    connection.isConnected = newState === ConnectionState.CONNECTED;

    this.logger.debug('Connection state changed', {
      connectionId: connection.id,
      mintId: connection.mintId,
      oldState,
      newState,
    });

    // In a real implementation, you would trigger state change callbacks here
  }

  /**
   * Start connection timeout
   */
  private startConnectionTimeout(connectionId: string, mintId: string): void {
    const timeout = setTimeout(() => {
      const connection = this.findConnection(mintId);
      if (connection && connection.state === ConnectionState.CONNECTING) {
        this.logger.warn('Connection timeout', {
          connectionId,
          mintId,
          timeout: this.connectionConfig.connectionTimeoutMs,
        });

        this.updateConnectionState(connection, ConnectionState.FAILED);
        this.clearConnectionTimers(connectionId);
      }
    }, this.connectionConfig.connectionTimeoutMs);

    this.connectionTimeouts.set(connectionId, timeout);
  }

  /**
   * Start heartbeat for connection monitoring
   */
  private startHeartbeat(connectionId: string, mintId: string): void {
    const interval = setInterval(() => {
      const connection = this.findConnection(mintId);
      if (!connection) {
        this.clearConnectionTimers(connectionId);
        return;
      }

      // Update last activity
      connection.lastActivity = Date.now();

      // In a real implementation, you would check connection health here
      if (this.connectionConfig.enableDebugLogging) {
        this.logger.debug('Connection heartbeat', {
          connectionId,
          mintId,
          state: connection.state,
          isConnected: connection.isConnected,
        });
      }
    }, this.connectionConfig.heartbeatIntervalMs);

    this.heartbeatIntervals.set(connectionId, interval);
  }

  /**
   * Clear all timers for a connection
   */
  private clearConnectionTimers(connectionId: string): void {
    // Clear timeout
    const timeout = this.connectionTimeouts.get(connectionId);
    if (timeout) {
      clearTimeout(timeout);
      this.connectionTimeouts.delete(connectionId);
    }

    // Clear heartbeat interval
    const interval = this.heartbeatIntervals.get(connectionId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(connectionId);
    }
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(mintId: string): string {
    return `${mintId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate connect parameters
   */
  private validateConnectParameters(
    mintId: string,
    options?: LiveKitConnectionOptions
  ): void {
    if (!mintId || typeof mintId !== 'string') {
      throw new ValidationError({
        message: 'mintId is required and must be a string',
        details: { mintId },
      });
    }

    if (options?.maxReconnectAttempts !== undefined) {
      if (options.maxReconnectAttempts < 0 || options.maxReconnectAttempts > 10) {
        throw new ValidationError({
          message: 'maxReconnectAttempts must be between 0 and 10',
          details: { maxReconnectAttempts: options.maxReconnectAttempts },
        });
      }
    }

    if (options?.reconnectDelayMs !== undefined) {
      if (options.reconnectDelayMs < 1000 || options.reconnectDelayMs > 30000) {
        throw new ValidationError({
          message: 'reconnectDelayMs must be between 1000 and 30000',
          details: { reconnectDelayMs: options.reconnectDelayMs },
        });
      }
    }
  }

  /**
   * Create a mock connection for error callbacks
   */
  private createMockConnection(mintId: string): LiveStreamConnection {
    const now = Date.now();
    return {
      id: this.generateConnectionId(mintId),
      mintId,
      roomName: '',
      state: ConnectionState.FAILED,
      isConnected: false,
      createdAt: now,
      lastActivity: now,
      reconnectionCount: 0,
      disconnect: async () => {},
      reconnect: async () => {},
      getStats: async () => ({} as RTCStatsReport),
      muteAudio: () => {},
      unmuteAudio: () => {},
      muteVideo: () => {},
      unmuteVideo: () => {},
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup all connections (useful for shutdown)
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up LiveKitStreamManager', {
      activeConnections: this.activeConnections.size,
      liveKitRooms: this.liveKitRooms.size,
    });

    // Disconnect all active connections
    const disconnectPromises = Array.from(this.activeConnections.keys()).map(
      mintId => this.disconnect(mintId).catch(error => {
        this.logger.warn('Error during cleanup disconnect', {
          mintId,
          error: (error as Error).message,
        });
      })
    );

    await Promise.all(disconnectPromises);

    // Disconnect all remaining LiveKit rooms
    const roomDisconnectPromises = Array.from(this.liveKitRooms.entries()).map(
      async ([connectionId, room]) => {
        try {
          this.logger.debug('Disconnecting LiveKit room during cleanup', {
            connectionId,
          });

          // Remove all event listeners
          room.removeAllListeners();

          // Disconnect room
          await room.disconnect();
        } catch (error) {
          this.logger.warn('Error disconnecting LiveKit room during cleanup', {
            connectionId,
            error: (error as Error).message,
          });
        }
      }
    );

    await Promise.all(roomDisconnectPromises);

    // Clear all timers
    for (const timeout of Array.from(this.connectionTimeouts.values())) {
      clearTimeout(timeout);
    }
    for (const interval of Array.from(this.heartbeatIntervals.values())) {
      clearInterval(interval);
    }

    // Clear all maps
    this.activeConnections.clear();
    this.reconnectionAttempts.clear();
    this.connectionTimeouts.clear();
    this.heartbeatIntervals.clear();
    this.liveKitRooms.clear();

    this.logger.info('LiveKitStreamManager cleanup completed');
  }
}