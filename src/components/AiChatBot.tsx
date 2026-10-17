import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Play, ChevronRight, MessageSquare } from 'lucide-react';
import { Channel, AiChatMessage } from '../types';

interface AiChatBotProps {
  currentChannel: Channel;
  channels: Channel[];
  onTuneToChannel: (channel: Channel) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AiChatBot: React.FC<AiChatBotProps> = ({
  currentChannel,
  channels,
  onTuneToChannel,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Namaste! I'm BharatLive AI, your live Indian TV companion. I can help you find ongoing cricket matches, breaking news debates, regional cinema, or family serials across 10+ Indian languages. What would you like to watch right now?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: AiChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages,
          currentChannel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');

      // Check if response mentions a specific channel in our catalog to provide quick-tune button
      const replyText = data.reply || 'Here are some great options to tune into on BharatLive TV.';
      const matchedChannel = channels.find((c) => 
        replyText.toLowerCase().includes(c.name.toLowerCase()) || 
        replyText.toLowerCase().includes(`ch ${c.number}`) ||
        replyText.toLowerCase().includes(c.callsign.toLowerCase())
      );

      const botMsg: AiChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedChannelId: matchedChannel ? matchedChannel.id : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'bot',
          text: 'I could not connect to the TV guide service momentarily. You can browse the categories below or try again in a second.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#101625] border-l border-white/10 shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-4 bg-[#0B0F1A] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>BharatLive AI</span>
              <span className="text-[10px] text-amber-400 font-mono">Gemini 3.8</span>
            </h3>
            <p className="text-[11px] text-slate-400">Your Indian Live TV & Cinema Guide</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          const recChannel = m.recommendedChannelId 
            ? channels.find((c) => c.id === m.recommendedChannelId) 
            : null;

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 font-mono">
                {isUser ? <span>You</span> : <span>BharatLive AI</span>}
                <span>·</span>
                <span>{m.time}</span>
              </div>

              <div
                className={`p-3 rounded-xl text-xs leading-relaxed max-w-[88%] ${
                  isUser
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-[#182032] text-slate-200 border border-white/10 rounded-tl-none'
                }`}
              >
                {m.text}

                {recChannel && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-400 truncate">
                      CH {recChannel.number} · {recChannel.name}
                    </span>
                    <button
                      onClick={() => {
                        onTuneToChannel(recChannel);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>Tune In</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-amber-400 p-2">
            <div className="w-4 h-4 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
            <span>Consulting Indian broadcast guide...</span>
          </div>
        )}
      </div>

      {/* Suggested Fast Prompts */}
      <div className="p-2.5 bg-[#0D121F] border-t border-white/5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        {[
          '🏏 Live Cricket matches',
          '🔥 Breaking News right now',
          '🎬 Best South Action movie',
          '🎶 Punjabi & Bollywood Hits',
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-md bg-[#161D2E] hover:bg-white/10 text-slate-300 text-[11px] whitespace-nowrap border border-white/5 transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-[#0B0F1A] border-t border-white/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask what to watch, cricket score, movie plots..."
          className="flex-1 bg-[#121826] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
