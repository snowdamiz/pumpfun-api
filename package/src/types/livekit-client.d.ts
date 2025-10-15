// Type declarations for optional livekit-client dependency
// This file provides type definitions when livekit-client is not installed

declare module 'livekit-client' {
  export class Room {
    connect(url: string, token: string, options?: any): Promise<void>;
    disconnect(): Promise<void>;
    getStats(): Promise<RTCStatsReport>;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
  }

  export class RoomEvent {
    static Connected: string;
    static Disconnected: string;
    static TrackSubscribed: string;
    static TrackUnsubscribed: string;
    static ParticipantConnected: string;
    static ParticipantDisconnected: string;
  }

  export class LocalParticipant {
    setCameraEnabled(enabled: boolean): Promise<void>;
    setMicrophoneEnabled(enabled: boolean): Promise<void>;
    publishTrack(track: MediaStreamTrack, options?: any): Promise<any>;
    unpublishTrack(track: MediaStreamTrack): Promise<void>;
  }

  export class RemoteParticipant {
    identity: string;
    name: string;
    metadata?: string;
    trackPublications: Map<string, any>;
  }

  export class Track {
    kind: string;
    mediaStreamTrack: MediaStreamTrack;
    attach(element: HTMLMediaElement): MediaStream;
    detach(): MediaStream;
    isEnabled: boolean;
    mute(): void;
    unmute(): void;
  }

  export class AudioTrack extends Track {}
  export class VideoTrack extends Track {}
}