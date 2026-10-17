import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  X, 
  Radio, 
  Eye, 
  ExternalLink 
} from 'lucide-react';
import { Channel } from '../types';

interface FloatingPiPPlayerProps {
  channel: Channel;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onExpandToFull: () => void;
  onClosePiP: () => void;
}

export const FloatingPiPPlayer: React.FC<FloatingPiPPlayerProps> = ({
  channel,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onExpandToFull,
  onClosePiP,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    setImageError(false);
  }, [channel.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = channel.streamUrl;
    const isHls = streamUrl.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal && channel.fallbackStreamUrl) {
          hls.destroy();
          hlsRef.current = null;
          video.src = channel.fallbackStreamUrl;
          if (isPlaying) video.play().catch(() => {});
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      video.src = streamUrl;
      if (isPlaying) video.play().catch(() => {});
    } else {
      video.src = streamUrl;
      if (isPlaying) video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.streamUrl, channel.fallbackStreamUrl, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  const requestNativePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('Native PiP error', e);
    }
  };

  return (
    <aside
      aria-label="Picture in picture video player"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className="fixed bottom-5 right-5 z-50 w-72 sm:w-84 aspect-video rounded-xl shadow-2xl border border-amber-500/30 bg-black overflow-hidden group transition-all duration-300 ring-2 ring-black/50"
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted={isMuted}
        onClick={onTogglePlay}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Persistent Channel Header Badge (Top-Left) */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 z-10 pointer-events-none">
        {channel.logoUrl && !imageError ? (
          <img
            src={channel.logoUrl}
            alt={channel.name}
            onError={() => setImageError(true)}
            className="w-4 h-4 object-contain rounded-sm"
          />
        ) : (
          <div className={`w-4 h-4 rounded bg-gradient-to-br ${channel.logoAccent} flex items-center justify-center text-[9px] font-bold text-white`}>
            {channel.callsign.substring(0, 2)}
          </div>
        )}
        <span className="text-[11px] font-bold text-white truncate max-w-[110px]">
          {channel.name}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse ml-0.5" />
      </div>

      {/* Top-Right Control Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
        {/* Native Browser PiP */}
        <button
          onClick={requestNativePiP}
          className="p-1 rounded bg-black/70 hover:bg-black/90 text-slate-300 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer"
          title="Open Native Browser PiP"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {/* Maximize to full view */}
        <button
          onClick={onExpandToFull}
          className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          title="Expand to Full Player"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Close PiP */}
        <button
          onClick={onClosePiP}
          className="p-1 rounded bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer"
          title="Close Mini-Player"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Bottom Quick Controls Overlay */}
      <div
        className={`absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between transition-opacity duration-200 z-10 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="text-[10px] text-slate-300 font-mono flex items-center gap-1">
          <span className="text-amber-400 font-bold">CH {channel.number}</span>
          <span>·</span>
          <span>{channel.language}</span>
        </div>
      </div>
    </aside>
  );
};
