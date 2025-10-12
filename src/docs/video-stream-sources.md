# PumpFun Live Stream Video Sources Discovery

## Overview

This document contains the findings from investigating PumpFun's live streaming infrastructure to discover the source of live video data for streams.

## Key Findings

### 1. Video Streaming Technology: LiveKit WebRTC

PumpFun uses **LiveKit** for their live video streaming infrastructure, which is a WebRTC-based streaming solution. This was confirmed by:

- Video element with `lk-participant-media-video` class
- `data-lk-*` attributes indicating LiveKit participant media
- LiveKit cloud region endpoints discovered

### 2. LiveKit Cloud Infrastructure

**Primary LiveKit Server**: `pump-prod-tg2x8veh.livekit.cloud`

**Available Regions** (with approximate distances):
- **Phoenix**: `pump-prod-tg2x8veh.ophoenix1b.production.livekit.cloud` (1,630,067 distance units)
- **Chicago**: `pump-prod-tg2x8veh.ochicago1b.production.livekit.cloud` (2,820,890 distance units)
- **Ashburn**: `pump-prod-tg2x8veh.oashburn1b.production.livekit.cloud` (3,727,319 distance units)

### 3. LiveStream API Endpoints

#### Stream Information API
```
GET https://livestream-api.pump.fun/livestream?mintId={mintId}
```

**Example Response**:
```json
{
  "id": 1273190,
  "supabaseId": 1273190,
  "mintId": "4F21SgBnms5bwQSjuc11ZF8ruSd9vJp6qu44rWLqpump",
  "creatorAddress": "8tRrvRsXKnXBA2r1pJs8MRwTYGHu3vmYHAmJwdLpzsDV",
  "streamStartTimestamp": 1760226028189,
  "numParticipants": 20,
  "maxParticipants": 0,
  "isLive": true,
  "downrankScore": 0,
  "title": "",
  "mode": "interactive"
}
```

#### Stream Join API
```
POST https://livestream-api.pump.fun/livestream/join
```

#### Stream Status Check
```
GET https://livestream-api.pump.fun/livestream/is-approved-creator?mintId={mintId}
```

### 4. WebRTC Connection Pattern

**WebSocket Endpoints**: `wss://pump-prod-tg2x8veh.[region].production.livekit.cloud`

**Room Naming Convention**: `{mintId}:{streamId}`
- Example: `4F21SgBnms5bwQSjuc11ZF8ruSd9vJp6qu44rWLqpump:1273190`

**Authentication**: Bearer tokens are used for LiveKit authentication (JWT format discovered in network requests)

### 5. Video Element Structure

```html
<video class="lk-participant-media-video"
       data-lk-local-participant="false"
       data-lk-source="camera"
       data-lk-orientation="landscape"
       autoplay=""
       playsinline="">
</video>
```

- **Resolution**: 360x480 (portrait mode)
- **Ready State**: 4 (HAVE_ENOUGH_DATA)
- **Source**: WebRTC stream (no direct src attribute)

### 6. Real-time Data Infrastructure

**NATS WebSocket**: `wss://prod-v2.nats.realtime.pump.fun`

**Subscribed Channels**:
- `unifiedTradeEvent.{mintId}` - Trade updates
- `newReplyCreated.{mintId}.prod` - New chat replies
- `replyDeleted.{mintId}.prod` - Deleted chat replies

### 7. Video Streaming Architecture

```
Stream Creator → LiveKit Ingest → LiveKit Cloud → WebRTC → Viewer Browser
```

1. **Ingestion**: Stream creators push video to LiveKit ingest servers
2. **Distribution**: LiveKit distributes across multiple regions
3. **WebRTC Delivery**: Viewers receive video via WebRTC directly from LiveKit
4. **Real-time Chat**: NATS WebSocket handles chat/messaging
5. **Trade Data**: Separate WebSocket for real-time trading updates

## Implementation Notes

### Authentication Flow
1. Client requests stream info from `livestream-api.pump.fun`
2. Server returns stream details and LiveKit room info
3. Client receives JWT token for LiveKit room access
4. Client connects to optimal LiveKit region via WebRTC

### Quality Selection
The UI includes a video quality selector, suggesting adaptive bitrate streaming is supported through LiveKit.

### Regional Optimization
LiveKit automatically selects the closest region based on network latency, with Phoenix being the closest for the tested location.

## Security Considerations

- **CSP Headers**: Strict Content Security Policy allowing only authorized domains
- **Authentication**: JWT-based authentication for LiveKit access
- **Origin Validation**: CORS restrictions to `https://pump.fun`

## Conclusion

PumpFun uses a sophisticated WebRTC streaming infrastructure powered by LiveKit, which provides:
- Low-latency video streaming
- Adaptive quality
- Multi-region distribution
- Real-time chat integration
- Web-based viewing without plugins

The video streams are **not** accessible via simple HTTP URLs or traditional streaming protocols like HLS/DASH, but rather through WebRTC connections to LiveKit's distributed infrastructure.