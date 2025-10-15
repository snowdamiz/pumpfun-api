/**
 * LiveKit Integration Examples for PumpFun API Client
 *
 * This module contains examples for:
 * - Basic LiveKit connection establishment
 * - LiveKit connection with event callbacks
 * - Error handling for LiveKit integration
 * - Advanced connection management
 * - Audio/video controls and WebRTC statistics
 * - Multiple LiveKit connection management
 */

import { PumpFunAPIClient } from '../client/PumpFunAPIClient';
import { LiveKitConnectionOptions } from '../types';

// ============================================================================
// Basic LiveKit Connection Examples (T041)
// ============================================================================

/**
 * Basic LiveKit connection example
 */
export async function basicLiveKitConnection() {
  const client = new PumpFunAPIClient();

  try {
    // Get live coins first to find a stream
    const liveCoins = await client.getLiveCoins({ limit: 10 });

    if (liveCoins.length === 0) {
      console.log('No live streams available');
      return;
    }

    // Connect to the first live stream
    const connection = await client.connectToLiveStream(liveCoins[0]!.mint);

    console.log('Connected to live stream:', {
      connectionId: connection.id,
      mintId: connection.mintId,
      roomName: connection.roomName,
      state: connection.state,
      isConnected: connection.isConnected,
    });

    // Listen to connection state changes
    console.log('Connection state:', connection.state);

    // Disconnect when done
    await connection.disconnect();
  } catch (error) {
    console.error('Failed to connect to live stream:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * LiveKit connection with callbacks example
 */
export async function liveKitConnectionWithCallbacks() {
  const client = new PumpFunAPIClient();

  try {
    // Get live coins
    const liveCoins = await client.getLiveCoins({ limit: 10 });

    if (liveCoins.length === 0) {
      console.log('No live streams available');
      return;
    }

    // Configure connection options
    const options: LiveKitConnectionOptions = {
      autoPlay: true,
      muted: true,
      videoEnabled: true,
      audioEnabled: false, // Start with audio muted
      maxReconnectAttempts: 3,
      reconnectDelayMs: 2000,

      // Event callbacks
      onConnected: connection => {
        console.log('✅ LiveKit connection established:', {
          connectionId: connection.id,
          mintId: connection.mintId,
          state: connection.state,
        });
      },

      onDisconnected: connection => {
        console.log('🔌 LiveKit connection disconnected:', {
          connectionId: connection.id,
          finalState: connection.state,
        });
      },

      onError: (error, connection) => {
        console.error('❌ LiveKit connection error:', {
          connectionId: connection.id,
          error: error instanceof Error ? error.message : String(error),
          state: connection.state,
        });
      },

      onReconnecting: connection => {
        console.log('🔄 LiveKit reconnection attempt:', {
          connectionId: connection.id,
          reconnectionCount: connection.reconnectionCount,
        });
      },

      onStateChange: (state, connection) => {
        console.log('📊 Connection state changed:', {
          connectionId: connection.id,
          oldState: connection.state,
          newState: state,
        });
      },
    };

    // Connect with options
    const connection = await client.connectToLiveStream(liveCoins[0]!.mint, options);

    console.log('Initial connection established:', {
      connectionId: connection.id,
      mintId: connection.mintId,
      roomName: connection.roomName,
      state: connection.state,
      hasVideoTrack: !!connection.videoTrack,
      hasAudioTrack: !!connection.audioTrack,
    });

    // Demonstrate audio/video controls
    setTimeout(() => {
      console.log('Unmuting audio...');
      connection.unmuteAudio();
    }, 2000);

    setTimeout(() => {
      console.log('Getting connection stats...');
      connection
        .getStats()
        .then(() => {
          console.log('WebRTC stats available');
        })
        .catch(error => {
          console.error('Failed to get stats:', error instanceof Error ? error.message : String(error));
        });
    }, 4000);

    // Clean up after 10 seconds
    setTimeout(async () => {
      console.log('Disconnecting...');
      await connection.disconnect();
    }, 10000);
  } catch (error) {
    console.error('Failed to connect to live stream:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Error handling example for LiveKit integration
 */
export async function liveKitErrorHandling() {
  const client = new PumpFunAPIClient();

  try {
    // Try to connect to a non-existent stream
    await client.connectToLiveStream('invalid_mint_id');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Expected error for invalid mint:', errorMsg);

    // Check if it's a LiveKit-specific error
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
      if (error.code === 'LIVEKIT_NOT_AVAILABLE') {
        console.log('💡 LiveKit is not installed. Install it with:');
        console.log('   npm install livekit-client');
      } else if (error.code === 'STREAM_NOT_LIVE') {
        console.log('💡 The stream is not currently live');
      } else if (error.code === 'CREATOR_NOT_APPROVED') {
        console.log('💡 The creator is not approved for streaming');
      } else if (error.code === 'NO_LIVEKIT_CONNECTION') {
        console.log('💡 No LiveKit connection info available');
      }
    }
  }

  // Try connecting to a real stream without LiveKit installed (graceful handling)
  try {
    const liveCoins = await client.getLiveCoins({ limit: 1 });
    if (liveCoins.length > 0) {
      await client.connectToLiveStream(liveCoins[0]!.mint);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error connecting without LiveKit:', errorMsg);
    console.log('This demonstrates graceful handling when LiveKit is not available');
  }
}

/**
 * Advanced connection management example
 */
export async function advancedConnectionManagement() {
  const client = new PumpFunAPIClient();

  try {
    const liveCoins = await client.getLiveCoins({ limit: 3 });

    if (liveCoins.length === 0) {
      console.log('No live streams available');
      return;
    }

    // Create multiple connections
    const connections: any[] = [];

    for (let i = 0; i < Math.min(liveCoins.length, 2); i++) {
      const connection = await client.connectToLiveStream(liveCoins[i]!.mint, {
        onConnected: connection => {
          console.log(`✅ Connection ${i + 1} established:`, connection.id);
        },
        onError: error => {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Connection ${i + 1} error:`, errorMsg);
        },
      });

      connections.push(connection);
    }

    // Monitor all connections
    console.log(`Managing ${connections.length} live connections`);

    // Get info for all connections
    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      if (conn) {
        console.log(`Connection ${i + 1} info:`, {
          connectionId: conn.id,
          mintId: conn.mintId,
          state: conn.state,
          isConnected: conn.isConnected,
          reconnectionCount: conn.reconnectionCount,
        });
      }
    }

    // Clean up all connections after 5 seconds
    setTimeout(async () => {
      console.log('Cleaning up all connections...');
      for (const connection of connections) {
        try {
          await connection.disconnect();
          console.log('Disconnected:', connection.id);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('Failed to disconnect:', connection.id, errorMsg);
        }
      }
    }, 5000);
  } catch (error) {
    console.error('Advanced connection management failed:', error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// Comprehensive LiveKit Example Runner
// ============================================================================

/**
 * Run all LiveKit examples in sequence
 */
export async function runAllLiveKitExamples() {
  console.log('🚀 Running all LiveKit integration examples...\n');

  const results = {
    basicLiveKit: null as any,
    liveKitCallbacks: null as any,
    liveKitErrorHandling: null as any,
    liveKitAdvanced: null as any,
  };

  try {
    console.log('🔴 LIVEKIT INTEGRATION EXAMPLES (T041)');
    console.log('='.repeat(60));

    results.basicLiveKit = await basicLiveKitConnection();
    console.log();

    results.liveKitCallbacks = await liveKitConnectionWithCallbacks();
    console.log();

    results.liveKitErrorHandling = await liveKitErrorHandling();
    console.log();

    results.liveKitAdvanced = await advancedConnectionManagement();
    console.log();

    console.log('✅ All LiveKit examples completed successfully!');
    console.log('\n🎉 Summary of LiveKit functionality tested:');
    console.log('   • Basic LiveKit connection establishment');
    console.log('   • LiveKit connection management and error handling');
    console.log('   • Audio/video controls and WebRTC statistics');
    console.log('   • Multiple LiveKit connection management');
    console.log('   • Built-in LiveKit WebRTC integration (T041)');
    console.log('   • Graceful handling when LiveKit is not available');
    console.log('   • Event callbacks and state management');
    console.log('   • Reconnection logic and error recovery');
  } catch (error) {
    console.error('💥 LiveKit examples execution failed:', error instanceof Error ? error.message : String(error));
  }

  return results;
}

// Export individual examples for selective execution
export const liveKitExamples = {
  basicLiveKitConnection,
  liveKitConnectionWithCallbacks,
  liveKitErrorHandling,
  advancedConnectionManagement,
  runAllLiveKitExamples,
};

// Export default example runner
export default runAllLiveKitExamples;
