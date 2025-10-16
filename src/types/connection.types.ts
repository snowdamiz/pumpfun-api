/**
 * LiveKit connection management types
 *
 * Simplified types for LiveKit video streaming connections
 */

// ============================================================================
// Connection State Types
// ============================================================================

/**
 * Connection states for LiveKit streaming
 */
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  DISCONNECTING = 'DISCONNECTING',
  FAILED = 'FAILED',
}

// ============================================================================
// Stream Connection Types
// ============================================================================

/**
 * Enhanced stream connection object with integrated controls
 */
export interface StreamConnection {
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
  setQuality(quality: import('./stream.types').VideoQuality): Promise<void>;

  // Event handlers
  onConnected?: (connection: StreamConnection) => void;
  onDisconnected?: (connection: StreamConnection) => void;
  onError?: (error: Error, connection: StreamConnection) => void;
  onQualityChanged?: (quality: import('./stream.types').VideoQuality) => void;
}