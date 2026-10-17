import React from 'react';
import { Tv, Sparkles, Search, Radio } from 'lucide-react';

interface HeaderProps {
  activeView: 'livetv' | 'player' | 'guide' | 'multiview' | 'favorites';
  setActiveView: (view: 'livetv' | 'player' | 'guide' | 'multiview' | 'favorites') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  favoritesCount: number;
  onQuickZap: () => void;
  onOpenAiChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  favoritesCount,
  onQuickZap,
  onOpenAiChat,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090D16]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5">
      {/* Universal Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Zone - Single text element wordmark */}
        <div 
          onClick={() => setActiveView('livetv')} 
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-rose-600 to-indigo-600 p-[1px] shadow-lg shadow-rose-900/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B0E14] rounded-[7px] flex items-center justify-center">
              <Tv className="w-4.5 h-4.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
            Bharat<span className="text-amber-400">Watch</span>
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300 shrink-0">
          <button
            onClick={() => setActiveView('livetv')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer flex items-center gap-1.5 ${
              activeView === 'livetv' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span>Live TV</span>
          </button>
          <button
            onClick={() => setActiveView('player')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              activeView === 'player' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-400'
            }`}
          >
            Channels Grid
          </button>
          <button
            onClick={() => setActiveView('guide')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              activeView === 'guide' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-400'
            }`}
          >
            EPG Guide
          </button>
          <button
            onClick={() => setActiveView('multiview')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer ${
              activeView === 'multiview' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-400'
            }`}
          >
            Multi-View (2-4 Ch)
          </button>
          <button
            onClick={() => setActiveView('favorites')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer flex items-center gap-1.5 ${
              activeView === 'favorites' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-400'
            }`}
          >
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="text-xs text-amber-400 font-mono tabular-nums">({favoritesCount})</span>
            )}
          </button>
          <button
            onClick={onOpenAiChat}
            className="whitespace-nowrap transition-colors text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1.5 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Guide</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (with search input integrated cleanly) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative hidden sm:block w-48 lg:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels, sports, news..."
              className="w-full bg-[#121826] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
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

          <button
            onClick={onQuickZap}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-lg shadow-sm hover:shadow-amber-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95"
            title="Randomly zap to an active Indian channel"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Channel Zap</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="md:hidden flex items-center justify-between gap-1 pt-3 border-t border-white/5 mt-2.5 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setActiveView('livetv')}
          className={`px-3 py-1.5 rounded whitespace-nowrap flex items-center gap-1 ${
            activeView === 'livetv' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          <Radio className="w-3 h-3 text-rose-500" />
          <span>Live TV</span>
        </button>
        <button
          onClick={() => setActiveView('player')}
          className={`px-3 py-1.5 rounded whitespace-nowrap ${
            activeView === 'player' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-slate-400'
          }`}
        >
          Channels Grid
        </button>
        <button
          onClick={() => setActiveView('guide')}
          className={`px-3 py-1.5 rounded whitespace-nowrap ${
            activeView === 'guide' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-slate-400'
          }`}
        >
          EPG Guide
        </button>
        <button
          onClick={() => setActiveView('multiview')}
          className={`px-3 py-1.5 rounded whitespace-nowrap ${
            activeView === 'multiview' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-slate-400'
          }`}
        >
          Multi-View
        </button>
        <button
          onClick={() => setActiveView('favorites')}
          className={`px-3 py-1.5 rounded whitespace-nowrap ${
            activeView === 'favorites' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-slate-400'
          }`}
        >
          Favorites ({favoritesCount})
        </button>
        <button
          onClick={onOpenAiChat}
          className="px-3 py-1.5 rounded whitespace-nowrap text-amber-400 font-semibold flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>AI Guide</span>
        </button>
      </div>
    </header>
  );
};
