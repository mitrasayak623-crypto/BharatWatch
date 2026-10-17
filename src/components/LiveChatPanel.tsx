import React, { useState } from 'react';
import { MessageSquare, Send, Heart, Sparkles, Flame, Trophy, ThumbsUp } from 'lucide-react';
import { ChatMessage } from '../types';
import { INITIAL_CHAT_MESSAGES } from '../data/channels';

interface LiveChatPanelProps {
  channelName: string;
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({ channelName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [reactionsCount, setReactionsCount] = useState<number>(1420);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      user: 'You',
      city: 'Live Viewer',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarColor: 'bg-amber-600',
      isVerified: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleSendEmoji = (emoji: string) => {
    setReactionsCount((prev) => prev + 1);
    const newId = Date.now() + Math.random();
    setFloatingEmojis((prev) => [...prev, { id: newId, emoji }]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newId));
    }, 2000);
  };

  return (
    <div className="bg-[#121826] border border-white/10 rounded-xl flex flex-col h-[520px] shadow-xl overflow-hidden relative">
      {/* Floating Reactions Canvas */}
      <div className="absolute bottom-20 right-4 pointer-events-none flex flex-col items-center gap-1 z-30">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="text-2xl animate-bounce transition-all duration-1000 transform -translate-y-12 opacity-80"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="p-3.5 border-b border-white/10 bg-[#0E1422] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white">Live Viewer Chat</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {reactionsCount} reactions
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="text-center py-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Streaming room for {channelName}
          </span>
        </div>

        {messages.map((m) => (
          <div key={m.id} className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-200">{m.user}</span>
              <span className="text-[10px] text-slate-500 font-mono">({m.city})</span>
              <span className="text-[10px] text-slate-500 ml-auto font-mono">{m.time}</span>
            </div>
            <p className="text-slate-300 leading-relaxed break-words bg-[#090D16]/60 p-2 rounded-lg border border-white/5">
              {m.text}
            </p>
          </div>
        ))}
      </div>

      {/* Fast Reaction Bar */}
      <div className="px-3 py-1.5 bg-[#0B0F1A] border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium">Quick React:</span>
        <div className="flex items-center gap-2">
          {['🔥', '🏏', '🇮🇳', '❤️', '👏', '🏆'].map((em) => (
            <button
              key={em}
              onClick={() => handleSendEmoji(em)}
              className="text-sm hover:scale-125 transition-transform cursor-pointer p-0.5"
              title={`React with ${em}`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-2.5 bg-[#0E1422] border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Share your thoughts on the telecast..."
          className="flex-1 bg-[#070A12] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
