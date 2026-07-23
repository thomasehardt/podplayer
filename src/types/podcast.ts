export interface Chapter {
  title: string;
  startTime: number; // in seconds
}

export interface Episode {
  id: string;
  podcastId: string;
  podcastTitle: string;
  podcastArtwork?: string;
  title: string;
  description: string;
  audioUrl: string;
  pubDate: string;
  duration: number; // duration in seconds
  durationFormatted: string;
  artworkUrl?: string;
  chapters?: Chapter[];
  progress?: number; // last listened position in seconds
  completed?: boolean;
}

export interface Podcast {
  id: string; // feedUrl hash or iTunes collectionId
  feedUrl: string;
  title: string;
  author: string;
  description: string;
  artworkUrl: string;
  categories: string[];
  website?: string;
  episodesCount?: number;
  episodes?: Episode[];
}

export interface QueueItem {
  episode: Episode;
  addedAt: number;
}

export type NavigationTab = 
  | 'discover'
  | 'top'
  | 'subscriptions'
  | 'history'
  | 'favorites'
  | 'playlists'
  | 'detail';

export type SleepOption = 0 | 900 | 1800 | 2700 | 3600 | -1; // 0 = off, -1 = end of episode, seconds otherwise

export interface SmartPlaylistRule {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  includeTags: string[];
  includePodcastIds: string[];
  excludePodcastIds: string[];
  unplayedOnly: boolean;
  maxDurationMinutes?: number; // 0 or undefined = no limit
  sortBy: 'newest' | 'oldest' | 'shortest' | 'longest';
  maxEpisodes: number; // 0 = no limit
}

export interface UserSettings {
  theme: 'dark' | 'light';
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  autoPlayNext: boolean;
  visualizerEnabled: boolean;
  hidePlayedEpisodes: boolean;
}
