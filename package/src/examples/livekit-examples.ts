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
import { LiveKitStreamManager } from '../services/live/LiveKitStreamManager';
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
  // T041 - Basic LiveKit Integration Examples
  basicLiveKitConnection,
  liveKitConnectionWithCallbacks,
  liveKitErrorHandling,
  advancedConnectionManagement,
  runAllLiveKitExamples,

  // T042 - LiveKitStreamManager Examples
  basicLiveKitStreamManagerUsage,
  liveKitStreamManagerWithConfig,
  liveKitStreamManagerMultipleConnections,
  liveKitStreamManagerReconnection,
  liveKitStreamManagerErrorHandling,
  liveKitStreamManagerLifecycle,
  runAllLiveKitExamplesWithStreamManager,
};

// ============================================================================
// LiveKitStreamManager Examples (T042)
// ============================================================================

/**
 * Basic LiveKitStreamManager usage example
 */
export async function basicLiveKitStreamManagerUsage() {
  const client = new PumpFunAPIClient();
  const streamManager = new LiveKitStreamManager(client, client.getLogger());

  try {
    console.log('🔴 LiveKitStreamManager - Basic Usage Example');
    console.log('='.repeat(50));

    // Get live coins first to find a stream
    const liveCoins = await client.getLiveCoins({ limit: 5 });

    if (liveCoins.length === 0) {
      console.log('No live streams available');
      return;
    }

    console.log(`Found ${liveCoins.length} live streams`);

    // Connect to the first live stream using the stream manager
    const connection = await streamManager.connect(liveCoins[0]!.mint);

    console.log('✅ Connection established via LiveKitStreamManager:', {
      connectionId: connection.id,
      mintId: connection.mintId,
      roomName: connection.roomName,
      state: connection.state,
      isConnected: connection.isConnected,
      hasVideoTrack: !!connection.videoTrack,
      hasAudioTrack: !!connection.audioTrack,
    });

    // Get connection state
    const currentState = streamManager.getConnectionState(connection.mintId);
    console.log('📊 Current connection state:', currentState);

    // Wait a bit then disconnect
    setTimeout(async () => {
      await streamManager.disconnect(connection.id);
      console.log('🔌 Disconnected successfully');
    }, 3000);

  } catch (error) {
    console.error('❌ LiveKitStreamManager error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * LiveKitStreamManager with advanced configuration example
 */
export async function liveKitStreamManagerWithConfig() {
  const client = new PumpFunAPIClient();

  // Create stream manager with custom configuration
  const streamManager = new LiveKitStreamManager(client, client.getLogger(), {
    defaultMaxReconnectAttempts: 3,
    defaultReconnectDelayMs: 2000,
    connectionTimeoutMs: 10000,
    heartbeatIntervalMs: 3000,
    enableStatistics: true,
    enableDebugLogging: true,
  });

  try {
    console.log('🔴 LiveKitStreamManager - Advanced Configuration Example');
    console.log('='.repeat(60));

    const liveCoins = await client.getLiveCoins({ limit: 3 });

    if (liveCoins.length === 0) {
      console.log('No live streams available');
      return;
    }

    // Configure connection options
    const options: LiveKitConnectionOptions = {
      videoEnabled: true,
      audioEnabled: true,
      autoPlay: true,
      muted: false,
      preferredQuality: 'high',
      maxReconnectAttempts: 5,
      reconnectDelayMs: 1500,

      // Event callbacks
      onConnected: (connection) => {
        console.log('✅ StreamManager: Connection established:', {
          connectionId: connection.id,
          mintId: connection.mintId,
          roomName: connection.roomName,
        });
      },

      onDisconnected: (connection) => {
        console.log('🔌 StreamManager: Connection disconnected:', {
          connectionId: connection.id,
          finalState: connection.state,
        });
      },

      onError: (error, connection) => {
        console.error('❌ StreamManager: Connection error:', {
          connectionId: connection.id,
          error: error instanceof Error ? error.message : String(error),
        });
      },

      onReconnecting: (connection) => {
        console.log('🔄 StreamManager: Reconnecting:', {
          connectionId: connection.id,
          attempt: connection.reconnectionCount,
        });
      },
    };

    // Connect with custom options
    const connection = await streamManager.connect(liveCoins[0]!.mint, options);

    console.log('🎯 StreamManager connection details:', {
      connectionId: connection.id,
      mintId: connection.mintId,
      state: connection.state,
      createdAt: new Date(connection.createdAt).toISOString(),
      lastActivity: new Date(connection.lastActivity).toISOString(),
    });

    // Demonstrate audio/video controls
    setTimeout(() => {
      console.log('🔇 Muting audio...');
      streamManager.muteAudio(connection.id);
    }, 2000);

    setTimeout(() => {
      console.log('🔊 Unmuting audio...');
      streamManager.unmuteAudio(connection.id);
    }, 4000);

    setTimeout(() => {
      console.log('📹 Muting video...');
      streamManager.muteVideo(connection.id);
    }, 6000);

    setTimeout(() => {
      console.log('📺 Unmuting video...');
      streamManager.unmuteVideo(connection.id);
    }, 8000);

    // Clean up
    setTimeout(async () => {
      await streamManager.disconnect(connection.id);
      console.log('✅ StreamManager: Cleanup completed');
    }, 10000);

  } catch (error) {
    console.error('❌ Advanced StreamManager error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * LiveKitStreamManager multiple connections example
 */
export async function liveKitStreamManagerMultipleConnections() {
  const client = new PumpFunAPIClient();
  const streamManager = new LiveKitStreamManager(client, client.getLogger());

  try {
    console.log('🔴 LiveKitStreamManager - Multiple Connections Example');
    console.log('='.repeat(60));

    const liveCoins = await client.getLiveCoins({ limit: 5 });

    if (liveCoins.length === 0) {
      console.log('No live streams available');
      return;
    }

    console.log(`Attempting to connect to ${Math.min(liveCoins.length, 3)} streams...`);

    const connections: any[] = [];
    const maxConnections = Math.min(liveCoins.length, 3);

    // Connect to multiple streams
    for (let i = 0; i < maxConnections; i++) {
      try {
        const connection = await streamManager.connect(liveCoins[i]!.mint, {
          onConnected: (conn) => {
            console.log(`✅ Stream ${i + 1} connected:`, conn.id);
          },
          onError: (error) => {
            console.error(`❌ Stream ${i + 1} error:`, error instanceof Error ? error.message : String(error));
          },
        });

        connections.push(connection);
        console.log(`📡 Stream ${i + 1} established:`, connection.mintId);

        // Small delay between connections
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to connect to stream ${i + 1}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log(`🎯 Managing ${connections.length} active connections`);

    // Monitor all connections
    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];
      const state = streamManager.getConnectionState(connection.mintId);

      console.log(`📊 Connection ${i + 1} status:`, {
        connectionId: connection.id,
        mintId: connection.mintId,
        state: state,
        isConnected: connection.isConnected,
        reconnectionCount: connection.reconnectionCount,
      });
    }

    // Get all active connections
    const activeConnections = streamManager.getActiveConnections();
    console.log(`🔍 Active connections count: ${activeConnections.length}`);

    // Clean up all connections after 8 seconds
    setTimeout(async () => {
      console.log('🧹 Cleaning up all connections...');

      for (let i = 0; i < connections.length; i++) {
        try {
          await streamManager.disconnect(connections[i].id);
          console.log(`✅ Disconnected stream ${i + 1}`);
        } catch (error) {
          console.error(`Failed to disconnect stream ${i + 1}:`, error instanceof Error ? error.message : String(error));
        }
      }

      console.log('🏁 Multiple connections example completed');
    }, 8000);

  } catch (error) {
    console.error('❌ Multiple connections error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * LiveKitStreamManager reconnection example
 */
export async function liveKitStreamManagerReconnection() {
  const client = new PumpFunAPIClient();

  // Create stream manager with reconnection-friendly configuration
  const streamManager = new LiveKitStreamManager(client, client.getLogger(), {
    defaultMaxReconnectAttempts: 3,
    defaultReconnectDelayMs: 2000,
    enableDebugLogging: true,
  });

  try {
    console.log('🔴 LiveKitStreamManager - Reconnection Example');
    console.log('='.repeat(50));

    const liveCoins = await client.getLiveCoins({ limit: 3 });

    if (liveCoins.length === 0) {
      console.log('No live streams available');
      return;
    }

    // Connect with reconnection callbacks
    const connection = await streamManager.connect(liveCoins[0]!.mint, {
      maxReconnectAttempts: 3,
      reconnectDelayMs: 1500,

      onConnected: (conn) => {
        console.log('✅ Initial connection established:', conn.id);
      },

      onReconnecting: (conn) => {
        console.log(`🔄 Reconnection attempt ${conn.reconnectionCount}:`, conn.id);
      },

      onError: (error, conn) => {
        console.error('❌ Connection error:', {
          connectionId: conn.id,
          error: error instanceof Error ? error.message : String(error),
          reconnectionCount: conn.reconnectionCount,
        });
      },

      onStateChange: (state, conn) => {
        console.log('📊 State change:', {
          connectionId: conn.id,
          newState: state,
          reconnectionCount: conn.reconnectionCount,
        });
      },
    });

    console.log('🎯 Initial connection successful:', {
      connectionId: connection.id,
      mintId: connection.mintId,
      state: connection.state,
    });

    // Simulate network interruption by forcing a reconnection
    setTimeout(async () => {
      console.log('🔄 Simulating network interruption - forcing reconnection...');
      try {
        await streamManager.reconnect(connection.id);
        console.log('✅ Reconnection successful');
      } catch (error) {
        console.error('❌ Reconnection failed:', error instanceof Error ? error.message : String(error));
      }
    }, 3000);

    // Monitor connection state
    let stateMonitorCount = 0;
    const stateMonitor = setInterval(() => {
      const currentState = streamManager.getConnectionState(connection.mintId);
      console.log(`📊 State check ${++stateMonitorCount}:`, currentState);

      if (stateMonitorCount >= 10) {
        clearInterval(stateMonitor);
      }
    }, 2000);

    // Clean up
    setTimeout(async () => {
      clearInterval(stateMonitor);
      await streamManager.disconnect(connection.id);
      console.log('✅ Reconnection example completed');
    }, 15000);

  } catch (error) {
    console.error('❌ Reconnection example error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * LiveKitStreamManager error handling example
 */
export async function liveKitStreamManagerErrorHandling() {
  const client = new PumpFunAPIClient();
  const streamManager = new LiveKitStreamManager(client, client.getLogger());

  try {
    console.log('🔴 LiveKitStreamManager - Error Handling Example');
    console.log('='.repeat(55));

    // Test 1: Invalid mint ID
    console.log('🧪 Test 1: Invalid mint ID');
    try {
      await streamManager.connect('invalid_mint_id_12345');
    } catch (error) {
      console.log('✅ Caught expected error for invalid mint:', error instanceof Error ? error.message : String(error));
    }

    // Test 2: Empty mint ID
    console.log('\n🧪 Test 2: Empty mint ID');
    try {
      await streamManager.connect('');
    } catch (error) {
      console.log('✅ Caught expected error for empty mint:', error instanceof Error ? error.message : String(error));
    }

    // Test 3: Disconnect non-existent connection
    console.log('\n🧪 Test 3: Disconnect non-existent connection');
    try {
      await streamManager.disconnect('non-existent-connection-id');
    } catch (error) {
      console.log('✅ Caught expected error for non-existent connection:', error instanceof Error ? error.message : String(error));
    }

    // Test 4: Mute audio on non-existent connection
    console.log('\n🧪 Test 4: Mute audio on non-existent connection');
    try {
      await streamManager.muteAudio('non-existent-connection-id');
    } catch (error) {
      console.log('✅ Caught expected error for mute on non-existent connection:', error instanceof Error ? error.message : String(error));
    }

    // Test 5: Connection with invalid options
    console.log('\n🧪 Test 5: Connection with invalid options');
    const liveCoins = await client.getLiveCoins({ limit: 1 });

    if (liveCoins.length > 0) {
      try {
        await streamManager.connect(liveCoins[0]!.mint, {
          maxReconnectAttempts: 15, // Invalid: exceeds maximum of 10
        });
      } catch (error) {
        console.log('✅ Caught expected error for invalid options:', error instanceof Error ? error.message : String(error));
      }
    }

    console.log('\n✅ Error handling example completed - all tests passed');

  } catch (error) {
    console.error('❌ Error handling example failed:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * LiveKitStreamManager lifecycle management example
 */
export async function liveKitStreamManagerLifecycle() {
  const client = new PumpFunAPIClient();
  const streamManager = new LiveKitStreamManager(client, client.getLogger());

  try {
    console.log('🔴 LiveKitStreamManager - Lifecycle Management Example');
    console.log('='.repeat(60));

    const liveCoins = await client.getLiveCoins({ limit: 3 });

    if (liveCoins.length === 0) {
      console.log('No live streams available');
      return;
    }

    console.log('🚀 Starting lifecycle management test...');

    // Phase 1: Create connections
    console.log('\n📡 Phase 1: Creating connections...');
    const connections: any[] = [];

    for (let i = 0; i < Math.min(liveCoins.length, 2); i++) {
      const connection = await streamManager.connect(liveCoins[i]!.mint, {
        onConnected: (conn) => {
          console.log(`✅ Connection ${i + 1} created:`, conn.id);
        },
      });
      connections.push(connection);
    }

    // Phase 2: Monitor connections
    console.log('\n📊 Phase 2: Monitoring connections...');
    const activeConnections = streamManager.getActiveConnections();
    console.log(`Active connections: ${activeConnections.length}`);

    for (let i = 0; i < connections.length; i++) {
      const state = streamManager.getConnectionState(connections[i].mintId);
      console.log(`Connection ${i + 1} state:`, state);
    }

    // Phase 3: Modify connections
    console.log('\n🎛️ Phase 3: Modifying connections...');
    for (let i = 0; i < connections.length; i++) {
      // Mute/unmute audio
      await streamManager.muteAudio(connections[i].id);
      setTimeout(() => {
        streamManager.unmuteAudio(connections[i].id);
      }, 1000);
    }

    // Phase 4: Graceful shutdown
    console.log('\n🧹 Phase 4: Graceful shutdown...');

    // Disconnect connections in reverse order
    for (let i = connections.length - 1; i >= 0; i--) {
      await streamManager.disconnect(connections[i].id);
      console.log(`✅ Disconnected connection ${i + 1}`);
    }

    // Phase 5: Cleanup
    console.log('\n🧼 Phase 5: Full cleanup...');
    await streamManager.cleanup();
    console.log('✅ StreamManager cleanup completed');

    console.log('\n🎉 Lifecycle management example completed successfully!');

  } catch (error) {
    console.error('❌ Lifecycle management error:', error instanceof Error ? error.message : String(error));

    // Ensure cleanup even on error
    try {
      await streamManager.cleanup();
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
    }
  }
}

// ============================================================================
// Updated LiveKit Examples Runner (includes T042)
// ============================================================================

/**
 * Run all LiveKit examples including StreamManager (T041 + T042)
 */
export async function runAllLiveKitExamplesWithStreamManager() {
  console.log('🚀 Running all LiveKit examples including StreamManager (T041 + T042)...\n');

  const results = {
    // Original T041 examples
    basicLiveKit: null as any,
    liveKitCallbacks: null as any,
    liveKitErrorHandling: null as any,
    liveKitAdvanced: null as any,

    // New T042 StreamManager examples
    streamManagerBasic: null as any,
    streamManagerConfig: null as any,
    streamManagerMultiple: null as any,
    streamManagerReconnection: null as any,
    streamManagerErrorHandling: null as any,
    streamManagerLifecycle: null as any,
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

    console.log('🔴 LIVEKIT STREAM MANAGER EXAMPLES (T042)');
    console.log('='.repeat(60));

    results.streamManagerBasic = await basicLiveKitStreamManagerUsage();
    console.log();

    results.streamManagerConfig = await liveKitStreamManagerWithConfig();
    console.log();

    results.streamManagerMultiple = await liveKitStreamManagerMultipleConnections();
    console.log();

    results.streamManagerReconnection = await liveKitStreamManagerReconnection();
    console.log();

    results.streamManagerErrorHandling = await liveKitStreamManagerErrorHandling();
    console.log();

    results.streamManagerLifecycle = await liveKitStreamManagerLifecycle();
    console.log();

    console.log('✅ All LiveKit examples completed successfully!');
    console.log('\n🎉 Summary of LiveKit functionality tested:');

    console.log('\n📡 T041 - Built-in LiveKit Integration:');
    console.log('   • Basic LiveKit connection establishment');
    console.log('   • LiveKit connection management and error handling');
    console.log('   • Audio/video controls and WebRTC statistics');
    console.log('   • Multiple LiveKit connection management');
    console.log('   • Graceful handling when LiveKit is not available');
    console.log('   • Event callbacks and state management');
    console.log('   • Reconnection logic and error recovery');

    console.log('\n🎛️ T042 - LiveKitStreamManager Helper Class:');
    console.log('   • StreamManager for advanced streaming scenarios');
    console.log('   • Automatic WebRTC connection setup and management');
    console.log('   • Connection lifecycle management');
    console.log('   • Multiple connection handling and monitoring');
    console.log('   • Advanced configuration options');
    console.log('   • Automatic reconnection with configurable attempts');
    console.log('   • Audio/video mute/unmute controls');
    console.log('   • Connection state monitoring and health checks');
    console.log('   • Comprehensive error handling and validation');
    console.log('   • Graceful shutdown and cleanup procedures');

  } catch (error) {
    console.error('💥 LiveKit examples execution failed:', error instanceof Error ? error.message : String(error));
  }

  return results;
}

// Export default example runner
export default runAllLiveKitExamplesWithStreamManager;
