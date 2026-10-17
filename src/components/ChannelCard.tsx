import React, { useState } from 'react';
import { Play, Heart, Eye } from 'lucide-react';
import { Channel } from '../types';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  return (
    <div
      onClick={() => onSelect(channel)}
      className={`group relative bg-[#121826] hover:bg-[#161F32] rounded-xl border transition-all duration-200 cursor-pointer p-4 flex flex-col justify-between ${
        isActive
          ? 'border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div>
        {/* Top Header: Channel Number, Real Logo & Favorite Action */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Real Broadcaster Logo with Fallback */}
            <div className="w-11 h-11 rounded-lg bg-black/60 p-1 flex items-center justify-center border border-white/10 shadow-sm shrink-0 overflow-hidden">
              {channel.logoUrl && !imageFailed ? (
                <img
                  src={channel.logoUrl}
                  alt={channel.name}
                  loading="lazy"
                  onError={() => setImageFailed(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div
                  className={`w-full h-full rounded bg-gradient-to-br ${channel.logoAccent} flex items-center justify-center font-black text-xs text-white`}
                >
                  {channel.callsign.substring(0, 4)}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-amber-400 font-semibold">
                  CH {channel.number}
                </span>
                {channel.isHd && (
                  <span className="text-[9px] font-bold text-slate-300 border border-slate-600 px-1 rounded font-mono">
                    HD
                  </span>
                )}
                {channel.broadcaster && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[110px] hidden sm:inline">
                    · {channel.broadcaster.split('(')[0].trim()}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                {channel.name}
              </h3>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel.id);
            }}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isFavorite
                ? 'text-rose-500 bg-rose-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
          </button>
        </div>

        {/* Clean Unboxed Metadata: Anti-slop rule */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2.5">
          <span className="capitalize">{channel.category}</span>
          <span aria-hidden="true">·</span>
          <span>{channel.language}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Eye className="w-3 h-3 text-amber-400" />
            <span className="font-mono tabular-nums">{channel.viewers}</span>
          </span>
        </div>

        {/* Current Program Info */}
        <div className="bg-[#0A0E17]/80 rounded-lg p-2.5 border border-white/5">
          <div className="text-[11px] text-amber-400/90 font-medium mb-0.5 line-clamp-1">
            Now: {channel.currentProgram.title}
          </div>
          <div className="text-[11px] text-slate-400 line-clamp-1">
            {channel.currentProgram.genre}
          </div>

          {/* Progress bar */}
          <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
              style={{ width: `${channel.currentProgram.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-mono">{channel.currentProgram.startTime} - {channel.currentProgram.endTime}</span>
        
        <div className="flex items-center gap-1 text-amber-400 group-hover:translate-x-0.5 transition-transform font-medium">
          <Play className="w-3 h-3 fill-amber-400" />
          <span>Tune In</span>
        </div>
      </div>
    </div>
  );
};
