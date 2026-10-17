# BharatWatch - Free Indian Live Television & Cinema Streaming

BharatWatch delivers a premium, cinema-grade live streaming television experience for Indian audiences across news, movies, sports, entertainment, music, and regional categories with guaranteed playback uptime via hybrid Shaka Player (HLS/DASH/DRM) and official 24x7 YouTube Live broadcast channels.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices have been confirmed through user clarification:

- **Confirmed Decision 1 (Playback Engine)**: Hybrid player supporting Shaka Player (v5.3+) for HLS & MPEG-DASH (with Widevine DRM license handling) paired with responsive official YouTube Live 24/7 embeds for major Indian national and regional broadcasters (Aaj Tak, NDTV, ABP, Republic, DD Sports, TV9, Asianet, etc.) to guarantee 100% broadcast availability without CORS or geoblocking failures.
- **Confirmed Decision 2 (Data Architecture)**: Bundled verified `public/channels.json` enhanced with an Express backend stream proxy (`/api/proxy-stream`) to eliminate cross-origin media header blocks on public HLS/DASH streams.
- **Confirmed Decision 3 (Viewing Layout)**: Cinema split layout featuring a prominent theater-grade player with quick zap controls on desktop, collapsible side channel guide with language and category filters, and an in-app persistent Picture-in-Picture (PiP) mini-player when exploring schedules or other sections.

---

## 1. Overview & Core Concept

- **What It Does**: BharatWatch is a high-performance web broadcast hub designed for zero-friction access to live Indian TV channels. It categorizes channels by genres (News, Sports, Movies, Entertainment, Music, Devotional) and languages (Hindi, Tamil, Telugu, Bengali, Malayalam, Kannada, Marathi, Punjabi, Gujarati, English), providing an authentic TV remote experience in the browser.
- **Target Audience / Persona**: Indian viewers, sports fans, diaspora audiences, and news followers wanting instant, free, and reliable live streams without subscriptions, intrusive sign-ups, or broken stream links.
- **Key Value**: Delivers verified working live channels with broadcast-grade controls: instant channel zapping, Screen Wake Lock API during playback, PIP overlay, audio controls, and an interactive Electronic Program Guide (EPG).

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Zero-State & Auto-Play**: User arrives at BharatWatch; the featured high-definition channel (e.g., DD Sports HD or Aaj Tak 24x7) begins playing smoothly with sound indicator and cinema-grade lighting.
2. **Channel Zapping & Arrow-Key Navigation**: Users can press `[` / `]` or Up/Down arrows to zap instantly through the channel lineup with an on-screen TV channel number display (OSD) and title banner.
3. **Category & Regional Language Filtering**: Clean segmented buttons for categories (All, News, Sports, Movies, Entertainment, Music) and language pills (Hindi, Tamil, Telugu, Bengali, Malayalam, Marathi, etc.) filter channels in real-time.
4. **Picture-in-Picture (PiP) Browsing**: Clicking the PiP button or navigating away to the full EPG schedule floats the video stream into a draggable mini-player in the bottom corner with volume, pause, and restore controls.
5. **Stream Health & Auto-Recovery**: If a stream buffers or encounters a transient network error, the hybrid engine retries with exponential backoff (up to 5 attempts) and provides a clean fallback button to switch stream types.

### Visual Identity & Theme
- **Aesthetic Direction**: Sleek, cinematic dark aesthetic inspired by premium OTT platforms (Hotstar, SonyLIV, Netflix) featuring deep slate foundations (`#080C14`), hairline border dividers, and subtle warm saffron/gold accents (`#E65100` / `#FFB300`).
- **Typography & Hierarchy**:
  - *Display / Headings*: Plus Jakarta Sans (`font-semibold`, `tracking-tight`) for modern broadcast branding.
  - *Channel Numbers & Telemetry*: Tabular numbers (`tabular-nums font-mono`) for channel zapping numbers (e.g., `CH 101`), bitrate indicators, and timestamps.
  - *Metadata Discipline*: Unboxed metadata tags separated by typographic dots (`·`)—no static pill enclosures on cards.
- **Spatial Composition**:
  - Desktop: Full 1440px canvas featuring a 2-column layout (Left: Cinema video player with program information; Right: Interactive channel guide and upcoming lineup).
  - Mobile: Responsive vertical stack with sticky top video player and scrollable channel feed below.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Shaka Player + Official YouTube Live Stream Architecture**
  - *Chosen Approach*: Implement a smart dual-renderer: Shaka Player for HLS (`.m3u8`) and DASH (`.mpd`) with Widevine DRM support, and responsive YouTube Player API embeds for verified 24/7 official Indian news and sports broadcasts.
  - *Why*: Raw IPTV M3U8 links found on the web regularly suffer from strict CORS policies, token expiration, and geoblocks when requested in client browsers. Official YouTube Live streams from Aaj Tak, NDTV, Zee, and ABP broadcast 24/7 with 99.99% uptime, zero CORS barriers, and adaptive HD quality.
  - *Alternatives Considered*: Pure raw IPTV m3u URLs (causes frequent media decode and CORS errors); pure YouTube links (lacks custom DRM and HLS capability demanded by user specification).

- **Decision 2: Express Server Stream Proxy for CORS Bypass**
  - *Chosen Approach*: Add an Express endpoint `/api/proxy-stream` in `server.ts` that pipes external HLS and DASH manifests and segments while injecting permissive `Access-Control-Allow-Origin: *` headers.
  - *Why*: Allows HLS/DASH streams that lack browser CORS headers to play seamlessly in Shaka Player.
  - *Alternatives Considered*: Client-only fetch (fails when origin server disallows cross-origin requests).

- **Decision 3: In-App Picture-in-Picture (PiP) + Native Document PiP**
  - *Chosen Approach*: Support both native browser PiP API (`video.requestPictureInPicture()`) and an in-app persistent floating mini-dock component so YouTube embeds and HLS video stay visible while users navigate between the Live Player, EPG Guide, and Multi-View modes.
  - *Why*: YouTube iframe embeds cannot always invoke HTML5 native `<video>` PiP directly; the in-app floating dock guarantees PiP works universally across all stream types.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              BharatWatch UI                            │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Cinema Video Player │  │       Live Channel Sidebar Guide      │  │
│  │  - Shaka Player (HLS) │  │  - Category Filter (News/Sports/...)  │  │
│  │  - YouTube Live Embed │  │  - Language Filter (Hindi/Tamil/...)  │  │
│  │  - In-App Floating PiP│  │  - Search & Instant Filtering        │  │
│  │  - Wake Lock & Zap OSD│  │  - EPG Current / Next Program         │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
└──────────────┼──────────────────────────────────┼──────────────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────────┐  ┌──────────────────────────────────────┐
│       useShakaPlayer         │  │           Channel Store              │
│  - Attach / Detach lifecycle │  │  - Fetch VITE_CHANNELS_URL           │
│  - Widevine DRM License Auth │  │  - Default: /channels.json           │
│  - Exponential backoff (5x)  │  │  - Bearer Token Auth (if set)        │
│  - Buffer state & Wake Lock  │  │  - Local verified fallback data      │
└──────────────┬───────────────┘  └──────────────────┬───────────────────┘
               │                                     │
               ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express Backend (server.ts)                       │
│  - /api/proxy-stream (CORS bypass for HLS/DASH manifests & segments)   │
│  - /api/channels (Static / cached verified channels feed)              │
│  - Vite Middleware integration for production & development            │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown
1. **`useShakaPlayer.ts`**: Custom hook that configures `shaka.Player`, attaches to `<video>`, handles Widevine DRM licensing (`drm.widevineLicenseUrl` + headers), sets up exponential backoff retry logic (up to 5 attempts), manages buffer states, and requests `navigator.wakeLock`.
2. **`VideoPlayer.tsx`**: Unified cinema-grade player component supporting both Shaka native `<video>` and official YouTube Live feeds, equipped with OSD channel banner, zap buttons, PiP trigger, fullscreen, and volume controls.
3. **`FloatingMiniPlayer.tsx`**: In-app PiP container that docks in the bottom-right corner when PiP mode is active, enabling video continuity while browsing EPG or channel grids.
4. **`public/channels.json`**: Comprehensive catalogue of real Indian channels with verified working stream URLs (YouTube 24/7 live feeds for major networks + reliable HLS/DASH streams with DRM examples).
5. **`server.ts`**: Express backend providing CORS proxying for external stream sources and serving production assets.

---

## Verification & Validation Plan

1. **Compilation & Linting**: Run `compile_applet` and `lint_applet` to guarantee error-free TypeScript and bundle generation.
2. **Stream Playback Verification**: Test playback on YouTube Live channels (Aaj Tak, NDTV, ABP, DD Sports, TV9) and Shaka Player HLS/DASH streams.
3. **Interaction Testing**:
   - Verify keyboard shortcuts: Left/Right arrows or `[`/`]` to change channels, Space to play/pause, `M` to mute, `F` to fullscreen, `P` to toggle PiP.
   - Verify Category and Language filters instantly filter the channel list.
   - Verify In-App PiP persists when toggling between Live Player and EPG Guide views.
