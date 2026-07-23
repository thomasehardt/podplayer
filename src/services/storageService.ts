import type { Podcast, Episode, QueueItem, UserSettings } from '../types/podcast';

const KEYS = {
  SUBSCRIPTIONS: 'podplayer_subscriptions',
  FAVORITE_EPISODES: 'podplayer_favorite_episodes',
  HISTORY: 'podplayer_history',
  EPISODE_PROGRESS: 'podplayer_episode_progress',
  PLAYED_EPISODES: 'podplayer_played_episodes',
  PODCAST_TAGS: 'podplayer_podcast_tags',
  SMART_PLAYLISTS: 'podplayer_smart_playlists',
  QUEUE: 'podplayer_queue',
  SETTINGS: 'podplayer_settings',
};

import type { SmartPlaylistRule } from '../types/podcast';

const DEFAULT_PODCAST_TAGS: Record<string, string[]> = {
  'syntax-fm': ['Technology', 'Web Development', 'JavaScript', 'CSS', 'Fullstack'],
  'huberman-lab': ['Science', 'Neuroscience', 'Health', 'Fitness', 'Mindset'],
  'radiolab': ['Science', 'Culture', 'Storytelling', 'Audio'],
  'design-details': ['Design', 'UI/UX', 'Product', 'Software'],
  'hardcore-history': ['History', 'Documentary', 'Longform'],
  'shoptalk-show': ['Technology', 'Web Development', 'Frontend', 'CSS'],
};

const DEFAULT_SMART_PLAYLISTS: SmartPlaylistRule[] = [
  {
    id: 'unplayed-all',
    name: 'Unplayed Queue',
    includeTags: [],
    includePodcastIds: [],
    excludePodcastIds: [],
    unplayedOnly: true,
    sortBy: 'newest',
    maxEpisodes: 20,
  },
  {
    id: 'tech-dev',
    name: 'Tech & Web Dev',
    includeTags: ['Technology', 'Web Development', 'Design'],
    includePodcastIds: [],
    excludePodcastIds: [],
    unplayedOnly: false,
    sortBy: 'newest',
    maxEpisodes: 15,
  },
  {
    id: 'quick-listens',
    name: 'Quick Listens (< 30m)',
    includeTags: [],
    includePodcastIds: [],
    excludePodcastIds: [],
    unplayedOnly: true,
    maxDurationMinutes: 30,
    sortBy: 'shortest',
    maxEpisodes: 10,
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  playbackSpeed: 1.0,
  volume: 0.9,
  isMuted: false,
  autoPlayNext: true,
  visualizerEnabled: true,
  hidePlayedEpisodes: true,
};

export const storageService = {
  // Subscriptions
  getSubscriptions(): Podcast[] {
    try {
      const data = localStorage.getItem(KEYS.SUBSCRIPTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSubscriptions(podcasts: Podcast[]): void {
    try {
      // Omit full episode objects to avoid localStorage 5MB quota limits
      const lightPodcasts = podcasts.map(({ episodes, ...rest }) => ({
        ...rest,
        episodesCount: episodes ? episodes.length : rest.episodesCount || 0,
      }));
      localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(lightPodcasts));
    } catch (err) {
      console.error('Failed to save subscriptions:', err);
    }
  },

  isSubscribed(podcastId: string): boolean {
    const subs = this.getSubscriptions();
    return subs.some((p) => p.id === podcastId);
  },

  toggleSubscription(podcast: Podcast): boolean {
    const subs = this.getSubscriptions();
    const index = subs.findIndex((p) => p.id === podcast.id);
    let isSubbed = false;
    if (index >= 0) {
      subs.splice(index, 1);
    } else {
      subs.unshift(podcast);
      isSubbed = true;
    }
    this.saveSubscriptions(subs);
    return isSubbed;
  },

  // Favorite Episodes
  getFavoriteEpisodes(): Episode[] {
    try {
      const data = localStorage.getItem(KEYS.FAVORITE_EPISODES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isFavoriteEpisode(episodeId: string): boolean {
    const favs = this.getFavoriteEpisodes();
    return favs.some((e) => e.id === episodeId);
  },

  toggleFavoriteEpisode(episode: Episode): boolean {
    const favs = this.getFavoriteEpisodes();
    const index = favs.findIndex((e) => e.id === episode.id);
    let isFav = false;
    if (index >= 0) {
      favs.splice(index, 1);
    } else {
      favs.unshift(episode);
      isFav = true;
    }
    try {
      localStorage.setItem(KEYS.FAVORITE_EPISODES, JSON.stringify(favs));
    } catch (err) {
      console.error('Failed to save favorites:', err);
    }
    return isFav;
  },

  // Listening History & Progress
  getHistory(): Episode[] {
    try {
      const data = localStorage.getItem(KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToHistory(episode: Episode): void {
    const history = this.getHistory();
    const filtered = history.filter((e) => e.id !== episode.id);
    filtered.unshift(episode);
    // Keep last 100 history items
    try {
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered.slice(0, 100)));
    } catch (err) {
      console.error('Failed to update history:', err);
    }
  },

  getEpisodeProgress(): Record<string, { progress: number; duration: number; updatedAt: number }> {
    try {
      const data = localStorage.getItem(KEYS.EPISODE_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveEpisodeProgress(episodeId: string, progress: number, duration: number): void {
    if (!episodeId || isNaN(progress)) return;
    const allProgress = this.getEpisodeProgress();
    allProgress[episodeId] = {
      progress,
      duration: duration || 0,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(KEYS.EPISODE_PROGRESS, JSON.stringify(allProgress));
    } catch (err) {
      console.error('Failed to save episode progress:', err);
    }

    // Auto-mark as played if user listened to >= 90%
    if (duration > 0 && progress / duration >= 0.9) {
      this.markEpisodesPlayed([episodeId]);
    }
  },

  // Played Episodes Tracking
  getPlayedEpisodes(): Record<string, boolean> {
    try {
      const data = localStorage.getItem(KEYS.PLAYED_EPISODES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  isEpisodePlayed(episodeId: string): boolean {
    const map = this.getPlayedEpisodes();
    if (map[episodeId]) return true;

    // Check if progress >= 90%
    const progressMap = this.getEpisodeProgress();
    const saved = progressMap[episodeId];
    if (saved && saved.duration > 0 && saved.progress / saved.duration >= 0.9) {
      return true;
    }
    return false;
  },

  togglePlayedEpisode(episodeId: string): boolean {
    const map = this.getPlayedEpisodes();
    const isPlayed = !this.isEpisodePlayed(episodeId);
    map[episodeId] = isPlayed;
    try {
      localStorage.setItem(KEYS.PLAYED_EPISODES, JSON.stringify(map));
    } catch (err) {
      console.error('Failed to save played state:', err);
    }
    return isPlayed;
  },

  markEpisodesPlayed(episodeIds: string[]): void {
    const map = this.getPlayedEpisodes();
    episodeIds.forEach((id) => {
      map[id] = true;
    });
    try {
      localStorage.setItem(KEYS.PLAYED_EPISODES, JSON.stringify(map));
    } catch (err) {
      console.error('Failed to mark episodes as played:', err);
    }
  },

  markEpisodesUnplayed(episodeIds: string[]): void {
    const map = this.getPlayedEpisodes();
    episodeIds.forEach((id) => {
      delete map[id];
    });
    try {
      localStorage.setItem(KEYS.PLAYED_EPISODES, JSON.stringify(map));
    } catch (err) {
      console.error('Failed to mark episodes as unplayed:', err);
    }
  },

  // Podcast Tags Management
  getPodcastTags(): Record<string, string[]> {
    try {
      const data = localStorage.getItem(KEYS.PODCAST_TAGS);
      const parsed = data ? JSON.parse(data) : {};
      return { ...DEFAULT_PODCAST_TAGS, ...parsed };
    } catch {
      return DEFAULT_PODCAST_TAGS;
    }
  },

  savePodcastTags(tagsMap: Record<string, string[]>): void {
    try {
      localStorage.setItem(KEYS.PODCAST_TAGS, JSON.stringify(tagsMap));
    } catch (err) {
      console.error('Failed to save podcast tags:', err);
    }
  },

  addTagToPodcast(podcastId: string, tag: string): string[] {
    const map = this.getPodcastTags();
    const current = map[podcastId] || [];
    const trimmed = tag.trim();
    if (trimmed && !current.includes(trimmed)) {
      current.push(trimmed);
      map[podcastId] = current;
      this.savePodcastTags(map);
    }
    return current;
  },

  removeTagFromPodcast(podcastId: string, tag: string): string[] {
    const map = this.getPodcastTags();
    const current = map[podcastId] || [];
    const updated = current.filter((t) => t !== tag);
    map[podcastId] = updated;
    this.savePodcastTags(map);
    return updated;
  },

  // Smart Playlists Management
  getSmartPlaylists(): SmartPlaylistRule[] {
    try {
      const data = localStorage.getItem(KEYS.SMART_PLAYLISTS);
      return data ? JSON.parse(data) : DEFAULT_SMART_PLAYLISTS;
    } catch {
      return DEFAULT_SMART_PLAYLISTS;
    }
  },

  saveSmartPlaylists(playlists: SmartPlaylistRule[]): void {
    try {
      localStorage.setItem(KEYS.SMART_PLAYLISTS, JSON.stringify(playlists));
    } catch (err) {
      console.error('Failed to save smart playlists:', err);
    }
  },

  // Queue
  getQueue(): QueueItem[] {
    try {
      const data = localStorage.getItem(KEYS.QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQueue(queue: QueueItem[]): void {
    try {
      localStorage.setItem(KEYS.QUEUE, JSON.stringify(queue));
    } catch (err) {
      console.error('Failed to save queue:', err);
    }
  },

  // Settings
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  },
};
