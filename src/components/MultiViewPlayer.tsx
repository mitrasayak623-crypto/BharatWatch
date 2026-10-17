import React, { useState } from 'react';
import { Layers, Volume2, VolumeX, Maximize2, X, Plus } from 'lucide-react';
import { Channel } from '../types';

interface MultiViewPlayerProps {
  channels: Channel[];
  onSelectMainChannel: (channel: Channel) => void;
  onClose: () => void;
}

export const MultiViewPlayer: React.FC<MultiViewPlayerProps> = ({
  channels,
  onSelectMainChannel,
  onClose,
}) => {
  const [layoutMode, setLayoutMode] = useState<'2' | '4'>('4');
  
  // Pick default channels for the quadrants
  const [slots, setSlots] = useState<Channel[]>([
    channels[0] || channels[0], // DD Sports
    channels[3] || channels[1], // DD News / Aaj Tak
    channels[12] || channels[2], // Star Gold / Sony Max
    channels[18] || channels[3], // 9XM Music / Entertainment
  ]);

  const [activeAudioSlot, setActiveAudioSlot] = useState<number>(0);
  const [changingSlotIndex, setChangingSlotIndex] = useState<number | null>(null);

  const displayedSlots = layoutMode === '2' ? slots.slice(0, 2) : slots;

  const handleSelectSlotChannel = (channel: Channel) => {
    if (changingSlotIndex === null) return;
    const next = [...slots];
    next[changingSlotIndex] = channel;
    setSlots(next);
    setChangingSlotIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar for Multi-View */}
      <div className="bg-[#121826] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Multi-View Live Telecast (Watch Together)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Stream up to 4 Indian channels simultaneously. Click any window to switch audio.
          </p>
        </div>

        {/* Layout Switcher & Close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0A0E17] p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setLayoutMode('2')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                layoutMode === '2' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2 Screens
            </button>
            <button
              onClick={() => setLayoutMode('4')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                layoutMode === '4' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              4 Screens (Quad)
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Return to Single Screen Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Video Panels */}
      <div
        className={`grid gap-4 ${
          layoutMode === '2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {displayedSlots.map((ch, idx) => {
          const isAudioActive = activeAudioSlot === idx;

          return (
            <div
              key={`${ch.id}-${idx}`}
              onClick={() => setActiveAudioSlot(idx)}
              className={`relative aspect-video bg-black rounded-xl overflow-hidden border transition-all cursor-pointer group shadow-lg ${
                isAudioActive
                  ? 'border-amber-400 ring-2 ring-amber-400/30'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <video
                src={ch.fallbackStreamUrl || ch.streamUrl}
                playsInline
                autoPlay
                loop
                muted={!isAudioActive}
                className="w-full h-full object-cover"
              />

              {/* Screen Top Header Overlay */}
              <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                <div className="flex items-center gap-2 bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10 pointer-events-auto">
                  <div className="w-5 h-5 rounded bg-black/60 p-0.5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {ch.logoUrl ? (
                      <img
                        src={ch.logoUrl}
                        alt={ch.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className={`w-full h-full rounded bg-gradient-to-br ${ch.logoAccent} flex items-center justify-center font-bold text-[9px] text-white`}
                      >
                        {ch.callsign.substring(0, 2)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-[140px]">
                    {ch.name}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    CH {ch.number}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {/* Audio Status */}
                  <div
                    className={`p-1.5 rounded backdrop-blur-sm border transition-colors ${
                      isAudioActive
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-black/60 text-slate-400 border-white/10'
                    }`}
                    title={isAudioActive ? 'Audio Active' : 'Click to enable audio for this channel'}
                  >
                    {isAudioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </div>

                  {/* Switch Channel for this slot */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChangingSlotIndex(idx);
                    }}
                    className="p-1.5 rounded bg-black/60 text-slate-300 hover:text-white border border-white/10 backdrop-blur-sm text-[10px] font-medium"
                    title="Change channel in this slot"
                  >
                    Switch
                  </button>

                  {/* Maximize to main player */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMainChannel(ch);
                      onClose();
                    }}
                    className="p-1.5 rounded bg-black/60 text-slate-300 hover:text-white border border-white/10 backdrop-blur-sm"
                    title="Open as Main Single Player"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom info banner */}
              <div className="absolute bottom-2 inset-x-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span className="truncate max-w-[70%] text-amber-200">
                  {ch.currentProgram.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{ch.language}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Channel Selector Modal for Slot */}
      {changingSlotIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-white/15 rounded-xl max-w-xl w-full p-6 max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                Select Channel for Screen {changingSlotIndex + 1}
              </h3>
              <button
                onClick={() => setChangingSlotIndex(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-white/5 pr-1 flex-1">
              {channels.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectSlotChannel(c)}
                  className="p-3 flex items-center justify-between hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.logoAccent} flex items-center justify-center font-bold text-xs text-white`}
                    >
                      {c.callsign.substring(0, 4)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.category} · {c.language}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-amber-400">CH {c.number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
