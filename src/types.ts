export type ChannelCategory =
  | 'all'
  | 'news'
  | 'movies'
  | 'sports'
  | 'entertainment'
  | 'music'
  | 'devotional'
  | 'kids';

export type IndianLanguage =
  | 'all'
  | 'Hindi'
  | 'Tamil'
  | 'Telugu'
  | 'Bengali'
  | 'Malayalam'
  | 'Kannada'
  | 'Marathi'
  | 'Punjabi'
  | 'Gujarati'
  | 'English'
  | 'Odia';

export interface ChannelDrm {
  widevineLicenseUrl?: string;
  headers?: Record<string, string>;
}

export interface LiveChannel {
  id: string;
  name: string;
  logo: string;
  category: string;
  language?: string;
  streamType: 'hls' | 'dash' | 'youtube';
  streamUrl?: string;
  youtubeChannelId?: string;
  youtubeEmbedUrl?: string;
  youtubeVideoId?: string;
  drm?: ChannelDrm;
  description?: string;
  number?: number;
}

export interface ChannelsResponse {
  channels: LiveChannel[];
}

export interface ProgramItem {
  id: string;
  title: string;
  genre: string;
  startTime: string;
  endTime: string;
  progressPercent: number;
  synopsis: string;
  hostOrCast?: string;
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  callsign: string;
  category: Exclude<ChannelCategory, 'all'>;
  language: Exclude<IndianLanguage, 'all'>;
  logoUrl?: string;
  logoAccent: string;
  logoBg: string;
  logoText: string;
  streamUrl: string;
  fallbackStreamUrl: string;
  youtubeLiveEmbed?: string;
  currentProgram: ProgramItem;
  upcomingPrograms: ProgramItem[];
  resolution: string;
  fps: number;
  audio: string;
  bitrate: string;
  viewers: string;
  isHd: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
  broadcaster?: string;
  stateOrRegion?: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  city: string;
  text: string;
  time: string;
  isVerified?: boolean;
  avatarColor: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  recommendedChannelId?: string;
}
