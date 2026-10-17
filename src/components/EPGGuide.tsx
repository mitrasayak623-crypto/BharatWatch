import React, { useState } from 'react';
import { Clock, Play, Calendar, Info, Radio } from 'lucide-react';
import { Channel, ChannelCategory, IndianLanguage } from '../types';

interface EPGGuideProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  activeChannelId: string;
}

export const EPGGuide: React.FC<EPGGuideProps> = ({
  channels,
  onSelectChannel,
  activeChannelId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<IndianLanguage>('all');
  const [selectedProgramDetail, setSelectedProgramDetail] = useState<{
    channel: Channel;
    programTitle: string;
    genre: string;
    time: string;
    synopsis: string;
    cast?: string;
  } | null>(null);

  // Filter channels
  const filteredChannels = channels.filter((ch) => {
    const matchesCat = selectedCategory === 'all' || ch.category === selectedCategory;
    const matchesLang = selectedLanguage === 'all' || ch.language === selectedLanguage;
    return matchesCat && matchesLang;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Controls: Functional Segmented Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121826] p-4 rounded-xl border border-white/10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Electronic Programme Guide (EPG Timeline)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time schedule of all Indian television channels across categories and languages
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ChannelCategory)}
            className="bg-[#0A0E17] border border-white/10 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Categories</option>
            <option value="news">News</option>
            <option value="movies">Movies</option>
            <option value="sports">Sports</option>
            <option value="entertainment">Entertainment</option>
            <option value="music">Music</option>
            <option value="devotional">Devotional</option>
            <option value="kids">Kids & Culture</option>
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as IndianLanguage)}
            className="bg-[#0A0E17] border border-white/10 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Languages</option>
            <option value="Hindi">Hindi</option>
            <option value="Tamil">Tamil</option>
            <option value="Telugu">Telugu</option>
            <option value="Bengali">Bengali</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Kannada">Kannada</option>
            <option value="Marathi">Marathi</option>
            <option value="Punjabi">Punjabi</option>
            <option value="English">English</option>
          </select>
        </div>
      </div>

      {/* Program Guide Matrix */}
      <div className="bg-[#121826] border border-white/10 rounded-xl overflow-hidden shadow-xl">
        {/* Time Header Grid */}
        <div className="grid grid-cols-12 bg-[#0E1422] border-b border-white/10 text-xs font-semibold text-slate-400 py-3 px-4">
          <div className="col-span-12 md:col-span-4 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Channel & Telecast Details</span>
          </div>
          <div className="hidden md:block md:col-span-4 text-amber-400">
            <span>Now Telecasting (Live Slot)</span>
          </div>
          <div className="hidden md:block md:col-span-4">
            <span>Next Lineup (Upcoming)</span>
          </div>
        </div>

        {/* Channel EPG Rows */}
        <div className="divide-y divide-white/5">
          {filteredChannels.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No channels match the selected category and language filter.
            </div>
          ) : (
            filteredChannels.map((ch) => {
              const isCurrentPlaying = ch.id === activeChannelId;

              return (
                <div
                  key={ch.id}
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-white/[0.02] ${
                    isCurrentPlaying ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {/* Channel Identifier Info */}
                  <div className="col-span-12 md:col-span-4 flex items-center justify-between md:justify-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-black/60 p-0.5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {ch.logoUrl ? (
                          <img
                            src={ch.logoUrl}
                            alt={ch.name}
                            loading="lazy"
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
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-amber-400 font-bold">
                            CH {ch.number}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-400">{ch.language}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{ch.name}</h4>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectChannel(ch)}
                      className="md:hidden px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
                    >
                      Watch
                    </button>
                  </div>

                  {/* Ongoing Program Cell */}
                  <div
                    onClick={() => {
                      setSelectedProgramDetail({
                        channel: ch,
                        programTitle: ch.currentProgram.title,
                        genre: ch.currentProgram.genre,
                        time: `${ch.currentProgram.startTime} - ${ch.currentProgram.endTime}`,
                        synopsis: ch.currentProgram.synopsis,
                        cast: ch.currentProgram.hostOrCast,
                      });
                    }}
                    className="col-span-12 md:col-span-4 bg-[#0A0E17]/90 hover:bg-[#0E1524] rounded-lg p-3 border border-white/5 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-mono text-amber-400 font-semibold">
                        {ch.currentProgram.startTime} - {ch.currentProgram.endTime}
                      </span>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        {ch.category}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                      {ch.currentProgram.title}
                    </div>

                    <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                        style={{ width: `${ch.currentProgram.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Upcoming Program Cell */}
                  <div className="hidden md:flex md:col-span-4 items-center justify-between gap-3">
                    {ch.upcomingPrograms.length > 0 ? (
                      <div
                        onClick={() => {
                          setSelectedProgramDetail({
                            channel: ch,
                            programTitle: ch.upcomingPrograms[0].title,
                            genre: ch.upcomingPrograms[0].genre,
                            time: `${ch.upcomingPrograms[0].startTime} - ${ch.upcomingPrograms[0].endTime}`,
                            synopsis: ch.upcomingPrograms[0].synopsis,
                          });
                        }}
                        className="flex-1 bg-[#0A0E17]/50 hover:bg-[#0E1524] rounded-lg p-3 border border-white/5 cursor-pointer text-left group"
                      >
                        <div className="text-[11px] font-mono text-slate-400 mb-1">
                          Starts at {ch.upcomingPrograms[0].startTime}
                        </div>
                        <div className="text-xs font-semibold text-slate-300 group-hover:text-amber-400 transition-colors line-clamp-1">
                          {ch.upcomingPrograms[0].title}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Regular Broadcast</span>
                    )}

                    <button
                      onClick={() => onSelectChannel(ch)}
                      className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      title={`Tune into ${ch.name}`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Tune In</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Program Detail Popup Modal */}
      {selectedProgramDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-white/15 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedProgramDetail.channel.logoAccent} flex items-center justify-center font-bold text-xs text-white`}
                >
                  {selectedProgramDetail.channel.callsign.substring(0, 4)}
                </div>
                <div>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    CH {selectedProgramDetail.channel.number} · {selectedProgramDetail.channel.name}
                  </span>
                  <div className="text-xs text-slate-400">{selectedProgramDetail.time}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProgramDetail(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              {selectedProgramDetail.programTitle}
            </h3>
            <div className="text-xs text-slate-400 mb-3">{selectedProgramDetail.genre}</div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-[#0A0E17] p-3 rounded-lg border border-white/5">
              {selectedProgramDetail.synopsis}
            </p>

            {selectedProgramDetail.cast && (
              <div className="text-xs text-slate-400 mb-5">
                <span className="text-slate-500">Key Personalities:</span>{' '}
                <span className="text-slate-200 font-medium">{selectedProgramDetail.cast}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedProgramDetail(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectChannel(selectedProgramDetail.channel);
                  setSelectedProgramDetail(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Watch Channel Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
