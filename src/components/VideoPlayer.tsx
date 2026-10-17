import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Tv, 
  ChevronLeft, 
  ChevronRight, 
  Radio, 
  Settings2, 
  Layers, 
  Heart, 
  Share2, 
  Check, 
  Eye, 
  Film, 
  Sparkles,
  Link2,
  RefreshCw,
  PictureInPicture2
} from 'lucide-react';
import { Channel } from '../types';

interface VideoPlayerProps {
  channel: Channel;
  allChannels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  isFavorite: boolean;
  onToggleFavorite: (channelId: string) => void;
  onOpenMultiView: () => void;
  onDockPiP: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  allChannels,
  onSelectChannel,
  isFavorite,
  onToggleFavorite,
  onOpenMultiView,
  onDockPiP,
  isPlaying,
  setIsPlaying,
  isMuted,
  setIsMuted,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const [volume, setVolume] = useState<number>(0.85);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [streamQuality, setStreamQuality] = useState<'Auto' | '1080p' | '720p' | '480p'>('1080p');
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [customUrlModal, setCustomUrlModal] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(channel.streamUrl);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [liveViewersCount, setLiveViewersCount] = useState<string>(channel.viewers);
  const [logoFailed, setLogoFailed] = useState<boolean>(false);

  useEffect(() => {
    setActiveStreamUrl(channel.streamUrl);
    setLiveViewersCount(channel.viewers);
    setLogoFailed(false);
  }, [channel]);

  // Real-time viewer count fluctuation simulation
  useEffect(() => {
    const interval = window.setInterval(() => {
      const baseNum = parseFloat(channel.viewers.replace('K', ''));
      const delta = (Math.random() * 1.8 - 0.9);
      const updated = Math.max(10, baseNum + delta).toFixed(1) + 'K';
      setLiveViewersCount(updated);
    }, 6000);
    return () => clearInterval(interval);
  }, [channel]);

  // Initialize Video & HLS
  const loadStream = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video) return;

    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsUrl = url.includes('.m3u8');

    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setIsBuffering(false);
          if (url !== channel.fallbackStreamUrl && channel.fallbackStreamUrl) {
            loadStream(channel.fallbackStreamUrl);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHlsUrl) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setIsBuffering(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        if (url !== channel.fallbackStreamUrl && channel.fallbackStreamUrl) {
          loadStream(channel.fallbackStreamUrl);
        }
      });
    } else {
      video.src = url;
      video.load();
      video.play().then(() => {
        setIsBuffering(false);
        setIsPlaying(true);
      }).catch(() => {
        setIsBuffering(false);
        setIsPlaying(false);
      });
    }
  }, [channel.fallbackStreamUrl, setIsPlaying]);

  useEffect(() => {
    loadStream(activeStreamUrl);
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamUrl, loadStream]);

  // Sync mute
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  // Handle Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Handle Volume
  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVol;
    setVolume(newVol);
    if (newVol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      video.volume = volume > 0 ? volume : 0.8;
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Channel Navigation: Prev / Next
  const currentIndex = allChannels.findIndex((c) => c.id === channel.id);
  const handlePrevChannel = () => {
    const prevIdx = (currentIndex - 1 + allChannels.length) % allChannels.length;
    onSelectChannel(allChannels[prevIdx]);
  };

  const handleNextChannel = () => {
    const nextIdx = (currentIndex + 1) % allChannels.length;
    onSelectChannel(allChannels[nextIdx]);
  };

  // Auto-hide controls on mouse idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowQualityMenu(false);
      }
    }, 3200);
  };

  // Native Browser PiP
  const toggleNativePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error', err);
    }
  };

  const copyShareLink = () => {
    const url = window.location.origin + '?channel=' + channel.id;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setActiveStreamUrl(customUrlInput.trim());
    setCustomUrlModal(false);
  };

  return (
    <div className="w-full">
      {/* Video Container Frame */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 select-none group"
      >
        {/* Actual Video Element */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted={isMuted}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Live Channel Watermark Bug (Top Right - TV Broadcast Style) */}
        <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-2 z-20">
          <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 flex items-center gap-2">
            <span className="font-bold text-xs tracking-wider text-slate-200">
              {channel.callsign}
            </span>
            {channel.isHd && (
              <span className="text-[10px] font-extrabold text-amber-400 border border-amber-400/40 px-1 py-0.2 rounded font-mono">
                HD
              </span>
            )}
          </div>
        </div>

        {/* Buffering Spinner */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30 backdrop-blur-[2px] z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-3 border-amber-500/20 border-t-amber-400 animate-spin" />
              <span className="text-xs font-medium text-slate-300 tracking-wide">
                Buffering Live Feed...
              </span>
            </div>
          </div>
        )}

        {/* Top Information Scrim (Visible on hover/tap) */}
        <div
          className={`absolute top-0 inset-x-0 p-4 lg:p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-300 z-20 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Channel Real Logo Box */}
              <div className="w-12 h-12 rounded-lg bg-black/60 p-1 flex items-center justify-center border border-white/20 shadow-md shrink-0 overflow-hidden">
                {channel.logoUrl && !logoFailed ? (
                  <img
                    src={channel.logoUrl}
                    alt={channel.name}
                    onError={() => setLogoFailed(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className={`w-full h-full rounded bg-gradient-to-br ${channel.logoAccent} flex items-center justify-center font-black text-xs text-white`}>
                    {channel.callsign.substring(0, 4)}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm lg:text-base font-bold text-white tracking-tight">
                    {channel.number} · {channel.name}
                  </span>
                  
                  {/* Real Live Indicator */}
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-600/90 text-[11px] font-bold tracking-wider text-white uppercase shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>LIVE</span>
                  </div>
                </div>

                {/* Quiet unboxed metadata: Anti-slop zero-pill rule */}
                <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                  <span>{channel.currentProgram.title}</span>
                  <span aria-hidden="true">·</span>
                  <span>{channel.language}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-300 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">{liveViewersCount}</span> watching
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action buttons on top bar */}
            <div className="flex items-center gap-2">
              {/* In-App Floating PiP Mini Player Dock */}
              <button
                onClick={onDockPiP}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 backdrop-blur-md transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Dock to Floating Mini-Player (PiP) to browse other sections"
              >
                <PictureInPicture2 className="w-4 h-4" />
                <span className="hidden sm:inline">Mini Player (PiP)</span>
              </button>

              <button
                onClick={() => onToggleFavorite(channel.id)}
                className={`p-2 rounded-lg backdrop-blur-md transition-colors cursor-pointer ${
                  isFavorite 
                    ? 'bg-rose-600/30 text-rose-400 border border-rose-500/40' 
                    : 'bg-black/50 text-slate-300 hover:text-white border border-white/10'
                }`}
                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              <button
                onClick={copyShareLink}
                className="p-2 rounded-lg bg-black/50 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
                title="Share Channel Link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setCustomUrlModal(true)}
                className="p-2 rounded-lg bg-black/50 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer hidden sm:block"
                title="Input Custom Stream URL (M3U8 / MP4)"
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Quick Play/Pause Gesture indicator */}
        <div 
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 z-10 ${
            !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
            <Play className="w-8 h-8 fill-white ml-1" />
          </div>
        </div>

        {/* Bottom Television Player Controls Bar */}
        <div
          className={`absolute bottom-0 inset-x-0 p-4 lg:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-20 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Timeline for Current Program */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5 font-medium">
              <span className="truncate max-w-[70%] text-slate-200">
                {channel.currentProgram.title} ({channel.currentProgram.genre})
              </span>
              <span className="font-mono tabular-nums text-slate-400">
                {channel.currentProgram.startTime} - {channel.currentProgram.endTime}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500" 
                style={{ width: `${channel.currentProgram.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Player Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            {/* Left Controls: Play/Pause, Channel Zap Prev/Next, Volume */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={togglePlay}
                className="p-2 sm:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              {/* Channel Zap */}
              <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={handlePrevChannel}
                  className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Previous Channel ([)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold text-amber-300 px-1.5 tabular-nums">
                  CH {channel.number}
                </span>
                <button
                  onClick={handleNextChannel}
                  className="p-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Next Channel (])"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
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
                />
              </div>

              {/* Live Edge Sync Indicator */}
              <button 
                onClick={() => loadStream(activeStreamUrl)}
                className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/30 transition-colors cursor-pointer"
                title="Sync to Live Broadcast Edge"
              >
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Live Edge</span>
              </button>
            </div>

            {/* Right Controls: Quality, Multi-view, In-App PiP, Native PiP, Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Quality Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-200 font-mono transition-colors flex items-center gap-1 cursor-pointer"
                  title="Stream Quality"
                >
                  <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{streamQuality}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-36 bg-[#161D2D] border border-white/15 rounded-lg shadow-2xl py-1 text-xs z-30">
                    <div className="px-3 py-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider border-b border-white/5">
                      Stream Quality
                    </div>
                    {(['Auto', '1080p', '720p', '480p'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setStreamQuality(q);
                          setShowQualityMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center justify-between transition-colors ${
                          streamQuality === q ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-300'
                        }`}
                      >
                        <span>{q}</span>
                        {streamQuality === q && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-View button */}
              <button
                onClick={onOpenMultiView}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer hidden md:flex"
                title="Launch Multi-Channel View (2-4 screens)"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">Multi-View</span>
              </button>

              {/* Native Browser Picture in Picture */}
              <button
                onClick={toggleNativePiP}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer hidden sm:block"
                title="Pop-out Browser PiP"
              >
                <Film className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Program Details Banner underneath the player */}
      <div className="mt-4 bg-[#121826] border border-white/10 rounded-xl p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                Now Telecasting · {channel.category.toUpperCase()}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400">{channel.language}</span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono">{channel.bitrate}</span>
              {channel.broadcaster && (
                <>
                  <span className="text-slate-500">·</span>
                  <span className="text-xs text-slate-400">{channel.broadcaster}</span>
                </>
              )}
            </div>

            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">
              {channel.currentProgram.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {channel.currentProgram.synopsis}
            </p>

            {channel.currentProgram.hostOrCast && (
              <div className="pt-1 text-xs text-slate-400 flex items-center gap-1.5">
                <span className="text-slate-500">Featuring:</span>
                <span className="text-slate-300 font-medium">{channel.currentProgram.hostOrCast}</span>
              </div>
            )}
          </div>

          {/* Next upcoming program preview */}
          {channel.upcomingPrograms.length > 0 && (
            <div className="lg:w-72 bg-[#0E131F] rounded-lg p-3.5 border border-white/5 shrink-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Up Next at {channel.upcomingPrograms[0].startTime}</span>
                <span className="text-amber-400 font-mono text-[10px]">Upcoming</span>
              </div>
              <div className="text-sm font-bold text-slate-200 line-clamp-1">
                {channel.upcomingPrograms[0].title}
              </div>
              <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {channel.upcomingPrograms[0].genre}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Stream URL Modal */}
      {customUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-white/15 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-amber-400" />
              <span>Custom Indian Channel Stream URL</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Stream any direct HLS (.m3u8), MP4 or test video stream url directly inside BharatLive player.
            </p>

            <form onSubmit={handleApplyCustomUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  M3U8 / Stream URL:
                </label>
                <input
                  type="url"
                  required
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://example.com/live/channel.m3u8"
                  className="w-full bg-[#0A0E17] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomUrlModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
                >
                  Play Custom Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
