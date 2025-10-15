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

/**
 * Helper class that manages WebRTC connections and handles LiveKit integration automatically
 */
export class LiveKitStreamManager {
  private activeConnections: Map<string, LiveStreamConnection> = new Map();
  private reconnectionAttempts: Map<string, number> = new Map();
  private connectionConfig: ConnectionConfig;
  private connectionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

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

      // Create connection object
      const connection = await this.createConnection(
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

      // Close WebRTC connection (simulated - in real implementation would close actual WebRTC tracks)
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
      for (const conn of this.activeConnections.values()) {
        if (conn.id === connectionIdOrMintId) {
          connection = conn;
          break;
        }
      }
    }

    return connection;
  }

  /**
   * Create a new LiveKit connection object
   */
  private async createConnection(
    connectionId: string,
    mintId: string,
    connectionInfo: any,
    options?: LiveKitConnectionOptions
  ): Promise<LiveStreamConnection> {
    const now = Date.now();

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

    // Simulate WebRTC connection setup
    // In a real implementation, this would establish actual WebRTC connection
    await this.simulateWebRTCConnection(connection, options);

    return connection;
  }

  /**
   * Simulate WebRTC connection establishment
   * In production, this would use actual LiveKit SDK
   */
  private async simulateWebRTCConnection(
    connection: LiveStreamConnection,
    options?: LiveKitConnectionOptions
  ): Promise<void> {
    this.logger.debug('Simulating WebRTC connection setup', {
      connectionId: connection.id,
      mintId: connection.mintId,
      roomName: connection.roomName,
    });

    // Simulate connection delay
    await this.delay(1000);

    // Update connection state to connected
    this.updateConnectionState(connection, ConnectionState.CONNECTED);
    connection.isConnected = true;

    // Simulate media tracks (in real implementation, these would come from WebRTC)
    if (options?.videoEnabled !== false) {
      connection.videoTrack = {
        enabled: true,
        kind: 'video',
        id: `video-${connection.id}`,
        label: 'Video Track',
        muted: false,
        readyState: 'live',
        stop: () => {},
        getSettings: () => ({}),
        getCapabilities: () => ({}),
        getConstraints: () => ({}),
      } as MediaStreamTrack;
    }

    if (options?.audioEnabled !== false) {
      connection.audioTrack = {
        enabled: !options?.muted,
        kind: 'audio',
        id: `audio-${connection.id}`,
        label: 'Audio Track',
        muted: options?.muted || false,
        readyState: 'live',
        stop: () => {},
        getSettings: () => ({}),
        getCapabilities: () => ({}),
        getConstraints: () => ({}),
      } as MediaStreamTrack;
    }

    // Create media stream
    const tracks: MediaStreamTrack[] = [];
    if (connection.videoTrack) tracks.push(connection.videoTrack);
    if (connection.audioTrack) tracks.push(connection.audioTrack);

    if (tracks.length > 0) {
      connection.mediaStream = new MediaStream(tracks);
    }

    // Attach to DOM elements if provided
    if (connection.mediaStream) {
      if (options?.videoElement) {
        options.videoElement.srcObject = connection.mediaStream;
        if (options?.autoPlay) {
          options.videoElement.play().catch(error => {
            this.logger.warn('Failed to auto-play video', {
              connectionId: connection.id,
              error: (error as Error).message,
            });
          });
        }
      }

      if (options?.audioElement) {
        options.audioElement.srcObject = connection.mediaStream;
        if (options?.autoPlay) {
          options.audioElement.play().catch(error => {
            this.logger.warn('Failed to auto-play audio', {
              connectionId: connection.id,
              error: (error as Error).message,
            });
          });
        }
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

    // In a real implementation, this would return actual WebRTC stats
    // For now, return a mock stats report
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

    // Clear all timers
    for (const timeout of this.connectionTimeouts.values()) {
      clearTimeout(timeout);
    }
    for (const interval of this.heartbeatIntervals.values()) {
      clearInterval(interval);
    }

    // Clear all maps
    this.activeConnections.clear();
    this.reconnectionAttempts.clear();
    this.connectionTimeouts.clear();
    this.heartbeatIntervals.clear();

    this.logger.info('LiveKitStreamManager cleanup completed');
  }
}