import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  PictureInPicture2, 
  RotateCcw, 
  AlertCircle, 
  ShieldCheck, 
  Radio, 
  Tv, 
  Lock, 
  Check, 
  Sparkles,
  Layers,
  Eye,
  RefreshCw,
  X,
  ExternalLink,
  Flame,
  Globe
} from 'lucide-react';
import { LiveChannel, ChannelsResponse } from '../types';
import { useShakaPlayer } from '../hooks/useShakaPlayer';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';

interface LiveTvScreenProps {
  onOpenAiGuide?: () => void;
}

export const LiveTvScreen: React.FC<LiveTvScreenProps> = ({ onOpenAiGuide }) => {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  
  // Data fetch status
  const [isFetchingChannels, setIsFetchingChannels] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Player controls state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Picture-in-Picture state
  const [isFloatingPiP, setIsFloatingPiP] = useState<boolean>(false);
  const [isScrolledPastPlayer, setIsScrolledPastPlayer] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Fetch channels at runtime from VITE_CHANNELS_URL or /channels.json
  const fetchChannels = useCallback(async () => {
    setIsFetchingChannels(true);
    setFetchError(null);

    const channelsUrl = import.meta.env.VITE_CHANNELS_URL || '/channels.json';
    const apiToken = import.meta.env.VITE_API_TOKEN;

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (apiToken) {
        headers['Authorization'] = `Bearer ${apiToken}`;
      }

      const res = await fetch(channelsUrl, { headers });

      if (!res.ok) {
        throw new Error(`Failed to load channels: HTTP ${res.status} ${res.statusText}`);
      }

      const data: ChannelsResponse = await res.json();

      if (!data.channels || !Array.isArray(data.channels)) {
        throw new Error('Invalid channels data format. Expected a { channels: [...] } object.');
      }

      setChannels(data.channels);
      if (data.channels.length > 0) {
        setSelectedChannel(data.channels[0]);
      }
    } catch (err: any) {
      console.error('Fetch channels error:', err);
      setFetchError(err?.message || 'Failed to fetch channels list');
    } finally {
      setIsFetchingChannels(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Shaka Player Hook (for HLS and DASH streams)
  const isShakaStream = selectedChannel?.streamType === 'hls' || selectedChannel?.streamType === 'dash';

  const {
    isBuffering,
    isLoading: isShakaLoading,
    error: shakaError,
    retryCount,
    retry: retryShaka,
    isSupported: isShakaSupported,
  } = useShakaPlayer({
    videoRef,
    channel: isShakaStream ? selectedChannel : null,
    autoPlay: true,
  });

  // Screen Wake Lock API while playing
  const { isLocked: isWakeLockActive } = useScreenWakeLock(
    isPlaying && (!isShakaStream || (!isShakaLoading && !shakaError))
  );

  // Listen for scroll past main player to suggest / engage PiP
  useEffect(() => {
    const handleScroll = () => {
      const el = playerContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pastBottom = rect.bottom < 100;
      setIsScrolledPastPlayer(pastBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ['All', ...Array.from(set)];
  }, [channels]);

  // Available languages
  const languages = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => {
      if (c.language) set.add(c.language);
    });
    return ['All', ...Array.from(set)];
  }, [channels]);

  // Filter channels based on search, category, and language
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchesCategory =
        selectedCategory === 'All' || c.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesLanguage =
        selectedLanguage === 'All' ||
        (c.language && c.language.toLowerCase() === selectedLanguage.toLowerCase());
      const matchesSearch =
        searchQuery.trim() === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.language && c.language.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesLanguage && matchesSearch;
    });
  }, [channels, selectedCategory, selectedLanguage, searchQuery]);

  // Channel index and navigation
  const currentIndex = useMemo(() => {
    if (!selectedChannel) return -1;
    return filteredChannels.findIndex((c) => c.id === selectedChannel.id);
  }, [filteredChannels, selectedChannel]);

  const handlePrevChannel = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const prevIdx = (currentIndex - 1 + filteredChannels.length) % filteredChannels.length;
    setSelectedChannel(filteredChannels[prevIdx]);
  }, [filteredChannels, currentIndex]);

  const handleNextChannel = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const nextIdx = (currentIndex + 1) % filteredChannels.length;
    setSelectedChannel(filteredChannels[nextIdx]);
  }, [filteredChannels, currentIndex]);

  // Play/Pause toggle (for HTML5 video)
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(console.warn);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Volume & Mute handlers
  const handleVolumeChange = useCallback((newVol: number) => {
    const video = videoRef.current;
    if (video) {
      video.volume = newVol;
    }
    setVolume(newVol);
    setIsMuted(newVol === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (isMuted) {
        video.muted = false;
        video.volume = volume > 0 ? volume : 0.8;
      } else {
        video.muted = true;
      }
    }
    setIsMuted((prev) => !prev);
  }, [isMuted, volume]);

  // Picture-in-Picture: Native or In-App Floating Dock
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (video && document.pictureInPictureEnabled && !isFloatingPiP) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
          return;
        }
      } catch (err) {
        console.warn('Native PiP not available, using in-app floating dock', err);
      }
    }
    // Toggle in-app floating PiP
    setIsFloatingPiP((prev) => !prev);
  }, [isFloatingPiP]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  }, []);

  // Keyboard navigation & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in the search box
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === '[') {
        e.preventDefault();
        handlePrevChannel();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ']') {
        e.preventDefault();
        handleNextChannel();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        togglePiP();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handlePrevChannel, handleNextChannel, toggleMute, toggleFullscreen, togglePiP]);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice: BharatWatch Real-Time Stream Engine */}
      <div className="bg-[#121826] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>BharatWatch Live Cinema & Broadcast</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/30">
              Hybrid Engine · Official 24/7 & Shaka DRM
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming verified Indian channels at runtime from{' '}
            <code className="text-amber-300 font-mono">
              {import.meta.env.VITE_CHANNELS_URL || '/channels.json'}
            </code>
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 text-xs text-slate-300">
          {isWakeLockActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Wake Lock Active</span>
            </div>
          )}

          <button
            onClick={fetchChannels}
            disabled={isFetchingChannels}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
            title="Reload Channels from Server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingChannels ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Layout: Channel List on Left, Video Player on Right */}
      {/* Mobile: Player on top (flex-col-reverse), List below */}
      <div className="flex flex-col-reverse lg:flex-row gap-6 items-start">
        {/* ================= LEFT COLUMN: Channels Directory & Search ================= */}
        <div className="w-full lg:w-96 flex flex-col bg-[#121826] border border-white/10 rounded-xl p-4 h-[680px] shadow-xl">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels, news, sports, Hindi, Tamil..."
              className="w-full bg-[#0A0E17] border border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2 border-b border-white/5">
            {categories.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-[#0A0E17] text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Language Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2 border-b border-white/5">
            <span className="text-[10px] text-slate-500 font-mono shrink-0 uppercase tracking-wider">Lang:</span>
            {languages.map((lang) => {
              const isActive = selectedLanguage.toLowerCase() === lang.toLowerCase();
              return (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-[#0A0E17] text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>

          {/* Channel Count Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
            <span>
              Showing {filteredChannels.length} of {channels.length} channels
            </span>
            <span className="text-[10px] text-slate-500">Press [ or ] to zap</span>
          </div>

          {/* Channels List Scrollable Area */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1" role="list">
            {isFetchingChannels ? (
              // Loading Skeleton State
              <div className="space-y-2 py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#0A0E17] rounded-lg border border-white/5 animate-pulse flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded bg-white/10" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-3/4 h-3 bg-white/10 rounded" />
                      <div className="w-1/2 h-2 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : fetchError ? (
              // Error State for Channels Fetch
              <div className="py-12 text-center px-4">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white mb-1">Failed to Load Channels</h4>
                <p className="text-[11px] text-slate-400 mb-4">{fetchError}</p>
                <button
                  onClick={fetchChannels}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  Retry Loading
                </button>
              </div>
            ) : filteredChannels.length === 0 ? (
              // Empty State
              <div className="py-12 text-center text-slate-400 text-xs">
                <Tv className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No channels match your search or filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedLanguage('All');
                  }}
                  className="mt-3 text-xs text-amber-400 hover:underline"
                >
                  Reset search & filters
                </button>
              </div>
            ) : (
              // Channels List
              filteredChannels.map((ch, idx) => {
                const isSelected = selectedChannel?.id === ch.id;

                return (
                  <div
                    key={ch.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedChannel(ch)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedChannel(ch);
                      }
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-left focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
                        : 'bg-[#0A0E17]/60 hover:bg-[#0E1524] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Channel Logo */}
                      <div className="w-10 h-10 rounded-lg bg-black/60 p-1 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {ch.logo ? (
                          <img
                            src={ch.logo}
                            alt={ch.name}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="font-bold text-xs text-amber-400 font-mono">
                            CH
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-amber-400' : 'text-slate-200'
                          }`}
                        >
                          {ch.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{ch.category}</span>
                          {ch.language && (
                            <>
                              <span>·</span>
                              <span>{ch.language}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stream Type Tags: YouTube Live / HLS / DASH / DRM */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {ch.streamType === 'youtube' ? (
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          24/7 Live
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                          {ch.streamType}
                        </span>
                      )}
                      {ch.drm && (
                        <span className="text-[9px] font-semibold text-amber-400 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          <span>DRM</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Hybrid Video Player & Controls ================= */}
        <div className="flex-1 w-full flex flex-col space-y-4">
          {/* Video Player Container */}
          <div
            ref={playerContainerRef}
            className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 select-none group"
          >
            {/* Direct HTML5 Video Element Managed by Shaka Player */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted={isMuted}
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />

            {/* Top Right Channel & Status Badges */}
            <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-2 z-20">
              {selectedChannel?.drm && (
                <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-amber-500/30 flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                  <Lock className="w-3 h-3" />
                  <span>Widevine DRM</span>
                </div>
              )}

              {selectedChannel && (
                <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-[10px] font-mono text-slate-200 uppercase font-bold">
                  {selectedChannel.streamType}
                </div>
              )}

              <div className="bg-rose-600 px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1 tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            {/* Top Left Channel Info Scrim */}
            {selectedChannel && (
              <div className="absolute top-4 left-4 pointer-events-none z-20 flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                {selectedChannel.logo && (
                  <img
                    src={selectedChannel.logo}
                    alt={selectedChannel.name}
                    className="w-5 h-5 object-contain rounded"
                  />
                )}
                <div>
                  <h3 className="text-xs font-bold text-white truncate max-w-[200px]">
                    {selectedChannel.name}
                  </h3>
                  <div className="text-[10px] text-slate-300">
                    {selectedChannel.category} · {selectedChannel.language || 'Indian Telecast'}
                  </div>
                </div>
              </div>
            )}

            {/* Buffering Indicator for Shaka */}
            {isShakaStream && (isBuffering || isShakaLoading) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[2px] z-20">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-12 h-12 rounded-full border-3 border-amber-500/20 border-t-amber-400 animate-spin" />
                  <span className="text-xs font-medium text-slate-200 tracking-wide">
                    {isShakaLoading ? 'Loading Shaka Stream...' : 'Buffering Live Stream...'}
                  </span>
                </div>
              </div>
            )}

            {/* Shaka Error & Auto-Reconnect Overlay */}
            {isShakaStream && shakaError && !isShakaLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm p-6 z-30">
                <div className="max-w-md w-full bg-[#161D2D] border border-rose-500/40 rounded-xl p-5 text-center space-y-3 shadow-2xl">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Stream Playback Notice</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{shakaError}</p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleNextChannel}
                      className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Next Channel
                    </button>
                    <button
                      onClick={retryShaka}
                      className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Stream</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between gap-4 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              {/* Left Controls: Prev, Play/Pause, Next, Volume */}
              <div className="flex items-center gap-2.5">
                {/* Prev Channel */}
                <button
                  onClick={handlePrevChannel}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Previous Channel (Arrow Left / [)"
                  aria-label="Previous Channel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-slate-950" />
                  ) : (
                    <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                  )}
                </button>

                {/* Next Channel */}
                <button
                  onClick={handleNextChannel}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Next Channel (Arrow Right / ])"
                  aria-label="Next Channel"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Volume Slider & Mute Toggle */}
                <div className="flex items-center gap-2 ml-1">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-amber-500 h-1 bg-white/20 rounded cursor-pointer"
                    aria-label="Volume"
                  />
                </div>
              </div>

              {/* Right Controls: Channel Indicator, PiP, Fullscreen */}
              <div className="flex items-center gap-2">
                {currentIndex !== -1 && (
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline mr-2">
                    {currentIndex + 1} of {filteredChannels.length}
                  </span>
                )}

                {/* Picture in Picture */}
                <button
                  onClick={togglePiP}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    isFloatingPiP ? 'bg-amber-500 text-slate-950' : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                  title="Picture in Picture Mode (P)"
                  aria-label="Picture in Picture"
                >
                  <PictureInPicture2 className="w-4 h-4" />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Under-Player Metadata & Details */}
          {selectedChannel && (
            <div className="bg-[#121826] border border-white/10 rounded-xl p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wide">
                    {selectedChannel.category}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300">{selectedChannel.language || 'Indian Telecast'}</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono text-slate-400 uppercase">
                    {selectedChannel.streamType === 'youtube' ? 'YouTube 24/7 Live' : selectedChannel.streamType}
                  </span>
                </div>

                <h1 className="text-lg lg:text-xl font-bold text-white">
                  {selectedChannel.name}
                </h1>

                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  {selectedChannel.description ||
                    'Real-time live streaming managed through BharatWatch Hybrid Engine with automatic backoff reconnection, Widevine DRM handling, and Screen Wake Lock API.'}
                </p>
              </div>

              {/* Technical Specifications */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
                {selectedChannel.drm ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Widevine Modular DRM</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Free-To-Air Broadcast</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating In-App PiP Player when user scrolls or toggles PiP */}
      {(isFloatingPiP || isScrolledPastPlayer) && selectedChannel && (
        <aside
          aria-label="Picture in picture floating player"
          className="fixed bottom-5 right-5 z-50 w-72 sm:w-80 aspect-video rounded-xl shadow-2xl border border-amber-500/40 bg-black overflow-hidden group transition-all duration-300 ring-2 ring-black/70 animate-in fade-in slide-in-from-bottom-4"
        >
          <video
            src={selectedChannel.streamUrl}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />

          {/* Mini-player overlay banner */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 z-10 pointer-events-none">
            <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
              {selectedChannel.name}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          </div>

          {/* Mini-player controls */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
            <button
              onClick={() => {
                playerContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
                setIsFloatingPiP(false);
              }}
              className="p-1 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
              title="Expand to Full Player"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setIsFloatingPiP(false);
                setIsScrolledPastPlayer(false);
              }}
              className="p-1 rounded bg-black/80 text-slate-300 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
              title="Close Picture in Picture"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
