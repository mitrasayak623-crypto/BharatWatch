import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Tv, 
  Search, 
  Flame, 
  Heart, 
  Layers, 
  Calendar, 
  Sparkles, 
  Check, 
  Play, 
  SlidersHorizontal,
  LayoutGrid,
  List,
  TrendingUp,
  Volume2,
  PictureInPicture2,
  Radio,
  Bot
} from 'lucide-react';
import { Channel, ChannelCategory, IndianLanguage } from './types';
import { CHANNELS_DATA, CATEGORIES_LIST, LANGUAGES_LIST } from './data/channels';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelCard } from './components/ChannelCard';
import { EPGGuide } from './components/EPGGuide';
import { MultiViewPlayer } from './components/MultiViewPlayer';
import { LiveChatPanel } from './components/LiveChatPanel';
import { FreeNoticeBanner } from './components/FreeNoticeBanner';
import { FloatingPiPPlayer } from './components/FloatingPiPPlayer';
import { AiChatBot } from './components/AiChatBot';
import { LiveTvScreen } from './components/LiveTvScreen';

export default function App() {
  const [channels] = useState<Channel[]>(CHANNELS_DATA);
  const [selectedChannel, setSelectedChannel] = useState<Channel>(CHANNELS_DATA[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<ChannelCategory>('all');
  const [activeLanguage, setActiveLanguage] = useState<IndianLanguage>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'livetv' | 'player' | 'guide' | 'multiview' | 'favorites'>('livetv');
  
  // Picture-in-Picture State
  const [isPiPManual, setIsPiPManual] = useState<boolean>(false);
  const [isScrolledPastHero, setIsScrolledPastHero] = useState<boolean>(false);
  const [isPiPDismissed, setIsPiPDismissed] = useState<boolean>(false);

  // Gemini AI Assistant state
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);

  const heroPlayerRef = useRef<HTMLDivElement>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bharat_tv_favorites');
      return saved ? JSON.parse(saved) : ['dd-sports', 'aaj-tak-hd', 'etv-cinema'];
    } catch {
      return ['dd-sports', 'aaj-tak-hd', 'etv-cinema'];
    }
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'number' | 'viewers' | 'trending'>('trending');
  const [showChat, setShowChat] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bharat_tv_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn(e);
    }
  }, [favorites]);

  // Monitor scroll position to automatically show PiP mini-player when user scrolls past main player
  useEffect(() => {
    const handleScroll = () => {
      if (activeView !== 'player') {
        setIsScrolledPastHero(false);
        return;
      }
      const hero = heroPlayerRef.current;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const scrolledOut = rect.bottom < 120;
      setIsScrolledPastHero(scrolledOut);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeView]);

  // Determine if Floating PiP should be active (only when on legacy player view or switched away from it)
  const showFloatingPiP = useMemo(() => {
    if (activeView === 'livetv') return false; // In Live TV screen, the player is on screen
    if (isPiPDismissed) return false;
    if (isPiPManual) return true;
    if (activeView !== 'player') return true;
    if (isScrolledPastHero) return true;
    return false;
  }, [isPiPDismissed, isPiPManual, activeView, isScrolledPastHero]);

  const toggleFavorite = (channelId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(channelId);
      const updated = exists ? prev.filter((id) => id !== channelId) : [...prev, channelId];
      const targetCh = channels.find((c) => c.id === channelId);
      showToast(exists ? `Removed ${targetCh?.name} from Favorites` : `Added ${targetCh?.name} to Favorites`);
      return updated;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Quick zap function
  const handleQuickZap = () => {
    const remaining = channels.filter((c) => c.id !== selectedChannel.id);
    const randomCh = remaining[Math.floor(Math.random() * remaining.length)];
    if (randomCh) {
      setSelectedChannel(randomCh);
      setActiveView('player');
      setIsPiPDismissed(false);
      showToast(`Zapped to CH ${randomCh.number} · ${randomCh.name}!`);
    }
  };

  // Filtered & Sorted Channels for the directory view
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      if (activeCategory !== 'all' && ch.category !== activeCategory) return false;
      if (activeLanguage !== 'all' && ch.language !== activeLanguage) return false;
      if (activeView === 'favorites' && !favorites.includes(ch.id)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = ch.name.toLowerCase().includes(query);
        const matchesProgram = ch.currentProgram.title.toLowerCase().includes(query);
        const matchesLanguage = ch.language.toLowerCase().includes(query);
        const matchesCategory = ch.category.toLowerCase().includes(query);
        const matchesRegion = ch.stateOrRegion?.toLowerCase().includes(query) || false;
        const matchesBroadcaster = ch.broadcaster?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesProgram && !matchesLanguage && !matchesCategory && !matchesRegion && !matchesBroadcaster) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'number') return a.number - b.number;
      if (sortBy === 'trending') return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
      if (sortBy === 'viewers') {
        const vA = parseFloat(a.viewers.replace('K', '')) || 0;
        const vB = parseFloat(b.viewers.replace('K', '')) || 0;
        return vB - vA;
      }
      return 0;
    });
  }, [channels, activeCategory, activeLanguage, activeView, favorites, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header with Top Bar Contract */}
      <Header
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          setIsPiPDismissed(false);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        favoritesCount={favorites.length}
        onQuickZap={handleQuickZap}
        onOpenAiChat={() => setIsAiChatOpen(true)}
      />

      {/* Floating Picture-in-Picture Mini-Player */}
      {showFloatingPiP && (
        <FloatingPiPPlayer
          channel={selectedChannel}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onToggleMute={() => setIsMuted(!isMuted)}
          onExpandToFull={() => {
            setActiveView('player');
            setIsPiPManual(false);
            setIsPiPDismissed(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onClosePiP={() => {
            setIsPiPDismissed(true);
            setIsPiPManual(false);
          }}
        />
      )}

      {/* Gemini AI TV Companion Drawer */}
      <AiChatBot
        currentChannel={selectedChannel}
        channels={channels}
        onTuneToChannel={(ch) => {
          setSelectedChannel(ch);
          setActiveView('player');
          setIsPiPDismissed(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          showToast(`Tuned to CH ${ch.number} · ${ch.name}`);
        }}
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-[#161D2D] border border-amber-500/40 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 100% Free Public Television & Database Connection Banner */}
        <FreeNoticeBanner />

        {/* View: Dedicated Live TV Screen (Shaka Player + Left Channel List + Runtime Fetch) */}
        {activeView === 'livetv' && (
          <LiveTvScreen onOpenAiGuide={() => setIsAiChatOpen(true)} />
        )}

        {/* View: Multi-View (2-4 Channels Simultaneously) */}
        {activeView === 'multiview' && (
          <MultiViewPlayer
            channels={channels}
            onSelectMainChannel={(ch) => {
              setSelectedChannel(ch);
              setActiveView('player');
              showToast(`Tuned to ${ch.name}`);
            }}
            onClose={() => setActiveView('player')}
          />
        )}

        {/* View: EPG Guide View */}
        {activeView === 'guide' && (
          <EPGGuide
            channels={channels}
            activeChannelId={selectedChannel.id}
            onSelectChannel={(ch) => {
              setSelectedChannel(ch);
              setActiveView('player');
              showToast(`Tuned to CH ${ch.number} · ${ch.name}`);
            }}
          />
        )}

        {/* View: Primary Live TV Player & Channel Feed */}
        {(activeView === 'player' || activeView === 'favorites') && (
          <div className="space-y-8">
            {/* Split Grid: Cinematic Player on Left + Live Chat on Right */}
            <div ref={heroPlayerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Player Column */}
              <div className={`${showChat ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'}`}>
                <VideoPlayer
                  channel={selectedChannel}
                  allChannels={channels}
                  onSelectChannel={(ch) => {
                    setSelectedChannel(ch);
                    setIsPiPDismissed(false);
                    showToast(`Tuned to CH ${ch.number} · ${ch.name}`);
                  }}
                  isFavorite={favorites.includes(selectedChannel.id)}
                  onToggleFavorite={toggleFavorite}
                  onOpenMultiView={() => setActiveView('multiview')}
                  onDockPiP={() => {
                    setIsPiPDismissed(false);
                    setIsPiPManual(true);
                    showToast(`Docked ${selectedChannel.name} to Picture-in-Picture`);
                  }}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  isMuted={isMuted}
                  setIsMuted={setIsMuted}
                />
              </div>

              {/* Collapsible Live Chat & Viewer Reaction Column */}
              {showChat && (
                <div className="lg:col-span-4 xl:col-span-3">
                  <LiveChatPanel channelName={selectedChannel.name} />
                </div>
              )}
            </div>

            {/* Section & Category Navigation Bar */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Tv className="w-5 h-5 text-amber-400" />
                    <span>Live Indian Television Channels Directory</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connected to real broadcast streams with official channel logos
                  </p>
                </div>

                {/* View Mode & Sort Controls */}
                <div className="flex items-center gap-2.5">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#121826] border border-white/10 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="trending">Sort: Trending First</option>
                    <option value="viewers">Sort: Highest Viewers</option>
                    <option value="number">Sort: Channel Number</option>
                  </select>

                  {/* Toggle Chat Column */}
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer hidden lg:flex items-center gap-1.5 ${
                      showChat
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-[#121826] text-slate-400 border-white/10 hover:text-white'
                    }`}
                    title="Toggle Live Chat & Viewer Reactions"
                  >
                    <span>{showChat ? 'Hide Chat' : 'Show Chat'}</span>
                  </button>

                  {/* Grid / List Mode */}
                  <div className="flex items-center bg-[#121826] p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        viewMode === 'grid' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        viewMode === 'list' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Segmented Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {CATEGORIES_LIST.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        if (activeView === 'favorites') setActiveView('player');
                      }}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                          : 'bg-[#121826] text-slate-300 hover:text-white hover:bg-[#161F32] border border-white/5'
                      }`}
                    >
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Language Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 whitespace-nowrap">
                  Languages:
                </span>
                {LANGUAGES_LIST.map((lang) => {
                  const isActive = activeLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setActiveLanguage(lang.id);
                        if (activeView === 'favorites') setActiveView('player');
                      }}
                      className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-white text-slate-950 font-bold'
                          : 'bg-[#101522] text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-[10px] opacity-70 font-normal">({lang.native})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Channels Showcase Matrix */}
            <div>
              {filteredChannels.length === 0 ? (
                <div className="bg-[#121826] border border-white/10 rounded-xl p-12 text-center">
                  <Tv className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No channels found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    {activeView === 'favorites'
                      ? 'You have not added any channels to your favorites yet. Click the heart icon on any channel to save it.'
                      : 'Try adjusting your category or language filter.'}
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory('all');
                      setActiveLanguage('all');
                      setSearchQuery('');
                      setActiveView('player');
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredChannels.map((ch) => (
                    <ChannelCard
                      key={ch.id}
                      channel={ch}
                      isActive={ch.id === selectedChannel.id}
                      isFavorite={favorites.includes(ch.id)}
                      onSelect={(selected) => {
                        setSelectedChannel(selected);
                        setIsPiPDismissed(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        showToast(`Tuned to CH ${selected.number} · ${selected.name}`);
                      }}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                /* Compact List View */
                <div className="bg-[#121826] border border-white/10 rounded-xl divide-y divide-white/5 overflow-hidden">
                  {filteredChannels.map((ch) => {
                    const isSelected = ch.id === selectedChannel.id;
                    const isFav = favorites.includes(ch.id);

                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setSelectedChannel(ch);
                          setIsPiPDismissed(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          showToast(`Tuned to CH ${ch.number} · ${ch.name}`);
                        }}
                        className={`p-4 flex items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors cursor-pointer ${
                          isSelected ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black/60 p-1 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
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
                                className={`w-full h-full rounded bg-gradient-to-br ${ch.logoAccent} flex items-center justify-center font-bold text-xs text-white`}
                              >
                                {ch.callsign.substring(0, 4)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-400">
                                CH {ch.number}
                              </span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-400 capitalize">{ch.category}</span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-400">{ch.language}</span>
                              {ch.broadcaster && (
                                <>
                                  <span className="text-xs text-slate-400">·</span>
                                  <span className="text-xs text-slate-400">{ch.broadcaster.split('(')[0].trim()}</span>
                                </>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-white">{ch.name}</h4>
                            <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              Now: {ch.currentProgram.title} ({ch.currentProgram.startTime} - {ch.currentProgram.endTime})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden sm:inline font-mono text-xs text-slate-400">
                            {ch.viewers} watching
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(ch.id);
                            }}
                            className={`p-2 rounded-lg cursor-pointer ${
                              isFav ? 'text-rose-500' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                          </button>
                          <button
                            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Play</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom AI Guide Trigger Button */}
      <button
        onClick={() => setIsAiChatOpen(true)}
        className="fixed bottom-5 left-5 z-40 bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/40"
      >
        <Sparkles className="w-4 h-4 fill-slate-950" />
        <span className="text-xs">Ask AI TV Guide</span>
      </button>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 bg-[#070A12] py-8 px-4 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center font-bold text-[11px] text-white">
              B
            </div>
            <span className="font-bold text-slate-200">BharatWatch</span>
            <span className="text-slate-600">·</span>
            <span>Shaka Player Live HLS & DASH Telecast with Widevine DRM</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>News</span>
            <span aria-hidden="true">·</span>
            <span>Movies</span>
            <span aria-hidden="true">·</span>
            <span>Sports</span>
            <span aria-hidden="true">·</span>
            <span>Entertainment</span>
            <span aria-hidden="true">·</span>
            <span>Music</span>
            <span aria-hidden="true">·</span>
            <span>Wake Lock Active</span>
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            © {new Date().getFullYear()} BharatWatch Network
          </div>
        </div>
      </footer>
    </div>
  );
}
