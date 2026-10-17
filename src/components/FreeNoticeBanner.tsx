import React from 'react';
import { ShieldCheck, Zap, Radio, Globe, HeartHandshake } from 'lucide-react';

export const FreeNoticeBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-amber-950/40 via-[#121826] to-indigo-950/40 border border-amber-500/20 rounded-xl p-4 lg:p-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Free Public Television
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">Zero Subscription · No Sign In Required</span>
          </div>

          <h3 className="text-base lg:text-lg font-bold text-white">
            Unlimited Free Live Telecasting for Every Indian Language & Section
          </h3>

          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            BharatWatch aggregates legal Free-to-Air (FTA) and public broadcast signals of Doordarshan, Sansad TV, state networks, sports hubs, news channels, and premier entertainment channels with zero charges.
          </p>
        </div>

        {/* Feature badges (Anti-slop: unboxed icons with crisp text) */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>High Speed 1080p</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>10+ Regional Languages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-rose-400" />
            <span>24/7 Live Satellite Feeds</span>
          </div>
        </div>
      </div>
    </div>
  );
};
