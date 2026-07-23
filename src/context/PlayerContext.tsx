import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Podcast, Episode, QueueItem, UserSettings, NavigationTab, SleepOption, SmartPlaylistRule } from '../types/podcast';
import { storageService } from '../services/storageService';
import { rssService } from '../services/rssService';

interface PlayerContextType {
  // Navigation & View State
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedPodcast: Podcast | null;
  setSelectedPodcast: (podcast: Podcast | null) => void;
  isFeedLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Podcast[];
  isSearching: boolean;
  
  // Audio Player State
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  sleepTimerOption: SleepOption;
  sleepTimerTimeRemaining: number | null;
  
  // Player Controls
  playEpisode: (episode: Episode, podcastContext?: Podcast) => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setSleepTimer: (option: SleepOption) => void;
  
  // Queue Management
  queue: QueueItem[];
  addToQueue: (episode: Episode) => void;
  removeFromQueue: (episodeId: string) => void;
  clearQueue: () => void;
  moveQueueItem: (fromIdx: number, toIdx: number) => void;
  playNextInQueue: () => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  
  // Subscriptions, Favorites & Played Tracking
  subscriptions: Podcast[];
  toggleSubscription: (podcast: Podcast) => void;
  isSubscribed: (podcastId: string) => boolean;
  favoriteEpisodes: Episode[];
  toggleFavoriteEpisode: (episode: Episode) => boolean;
  isFavoriteEpisode: (episodeId: string) => boolean;
  isEpisodePlayed: (episodeId: string) => boolean;
  togglePlayedEpisode: (episodeId: string) => boolean;
  markAllEpisodesPlayed: (episodes: Episode[], exceptLastN?: number) => void;
  markAllEpisodesUnplayed: (episodes: Episode[]) => void;
  hidePlayedEpisodes: boolean;
  toggleHidePlayedEpisodes: () => void;
  
  // Web Audio Visualizer
  analyserNode: AnalyserNode | null;
  visualizerEnabled: boolean;
  toggleVisualizer: () => void;
  
  // Theme & Settings
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  
  // RSS & OPML Import/Export
  openPodcastDetail: (podcast: Podcast) => Promise<void>;
  openRssModal: boolean;
  setOpenRssModal: (open: boolean) => void;
  importCustomRss: (url: string) => Promise<void>;
  importOpmlFile: (file: File) => Promise<number>;
  exportOpmlFile: () => void;

  // Podcast Tags & Smart Playlists
  podcastTags: Record<string, string[]>;
  getPodcastTags: (podcastId: string) => string[];
  addTagToPodcast: (podcastId: string, tag: string) => void;
  removeTagFromPodcast: (podcastId: string, tag: string) => void;
  smartPlaylists: SmartPlaylistRule[];
  selectedSmartPlaylist: SmartPlaylistRule | null;
  setSelectedSmartPlaylist: (rule: SmartPlaylistRule | null) => void;
  createSmartPlaylist: (playlist: Omit<SmartPlaylistRule, 'id'>) => void;
  updateSmartPlaylist: (id: string, rule: Partial<SmartPlaylistRule>) => void;
  deleteSmartPlaylist: (id: string) => void;
  evaluateSmartPlaylist: (rule: SmartPlaylistRule) => Episode[];
  openPlaylistModal: boolean;
  setOpenPlaylistModal: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Settings & Storage Sync
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [subscriptions, setSubscriptions] = useState<Podcast[]>(() => storageService.getSubscriptions());
  const [favoriteEpisodes, setFavoriteEpisodes] = useState<Episode[]>(() => storageService.getFavoriteEpisodes());
  const [queue, setQueue] = useState<QueueItem[]>(() => storageService.getQueue());
  const [podcastTags, setPodcastTags] = useState<Record<string, string[]>>(() => storageService.getPodcastTags());
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylistRule[]>(() => storageService.getSmartPlaylists());
  const [selectedSmartPlaylist, setSelectedSmartPlaylist] = useState<SmartPlaylistRule | null>(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('discover');
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Podcast[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [openRssModal, setOpenRssModal] = useState(false);
  const [openPlaylistModal, setOpenPlaylistModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Audio State
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(settings.volume);
  const [isMuted, setIsMutedState] = useState(settings.isMuted);
  const [playbackSpeed, setPlaybackSpeedState] = useState(settings.playbackSpeed);
  
  // Sleep Timer State
  const [sleepTimerOption, setSleepTimerOption] = useState<SleepOption>(0);
  const [sleepTimerTimeRemaining, setSleepTimerTimeRemaining] = useState<number | null>(null);
  
  // Audio Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sleepTimerIntervalRef = useRef<number | null>(null);

  // Initialize HTML5 Audio Element
  useEffect(() => {
    const audio = new Audio();
    // Do NOT set crossOrigin = 'anonymous' so cross-origin podcast CDNs play without CORS blocking
    audioRef.current = audio;
    
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackSpeed;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (currentEpisode) {
        storageService.saveEpisodeProgress(currentEpisode.id, audio.currentTime, audio.duration || 0);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (sleepTimerOption === -1) {
        setSleepTimerOption(0);
        setSleepTimerTimeRemaining(null);
        return;
      }
      if (settings.autoPlayNext && queue.length > 0) {
        playNextInQueue();
      }
    };
    const handleError = (e: Event) => {
      console.warn('Audio element error:', audio.error || e);
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Background Auto-Hydrate podcast feeds (artwork, descriptions, hosts, categories, episodes)
  useEffect(() => {
    const hydrateFeeds = async () => {
      const currentSubs = storageService.getSubscriptions();
      if (currentSubs.length === 0) return;

      const updatedSubs = await Promise.all(
        currentSubs.map(async (show) => {
          try {
            const fresh = await rssService.parseRssFeed(show.feedUrl, show);
            return fresh;
          } catch {
            return show;
          }
        })
      );

      setSubscriptions(updatedSubs);
      storageService.saveSubscriptions(updatedSubs);
    };

    hydrateFeeds();
  }, []);

  // Sync Theme attribute on document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // MediaSession API Integration
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentEpisode) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentEpisode.title,
      artist: currentEpisode.podcastTitle,
      album: 'PodPlayer',
      artwork: [
        { src: currentEpisode.artworkUrl || currentEpisode.podcastArtwork || '', sizes: '512x512', type: 'image/png' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
    navigator.mediaSession.setActionHandler('seekbackward', () => skipBackward());
    navigator.mediaSession.setActionHandler('seekforward', () => skipForward());
    navigator.mediaSession.setActionHandler('previoustrack', () => skipBackward(30));
    navigator.mediaSession.setActionHandler('nexttrack', () => playNextInQueue());
  }, [currentEpisode]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipBackward(10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipForward(10);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEpisode, isPlaying]);

  // Debounced iTunes Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await rssService.searchiTunes(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sleep Timer Countdown Interval
  useEffect(() => {
    if (sleepTimerIntervalRef.current) {
      clearInterval(sleepTimerIntervalRef.current);
      sleepTimerIntervalRef.current = null;
    }

    if (sleepTimerOption > 0) {
      setSleepTimerTimeRemaining(sleepTimerOption);
      sleepTimerIntervalRef.current = window.setInterval(() => {
        setSleepTimerTimeRemaining((prev: number | null) => {
          if (prev === null || prev <= 1) {
            if (audioRef.current) audioRef.current.pause();
            clearInterval(sleepTimerIntervalRef.current!);
            sleepTimerIntervalRef.current = null;
            setSleepTimerOption(0);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (sleepTimerOption === 0) {
      setSleepTimerTimeRemaining(null);
    }

    return () => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    };
  }, [sleepTimerOption]);

  // Controls Methods
  const playEpisode = (episode: Episode) => {
    if (!audioRef.current) return;

    setCurrentEpisode(episode);
    storageService.addToHistory(episode);
    
    // Check saved progress
    const progressMap = storageService.getEpisodeProgress();
    const saved = progressMap[episode.id];
    const initialTime = saved && saved.progress < (saved.duration - 10) ? saved.progress : 0;

    const proxiedStreamUrl = episode.audioUrl.startsWith('/api/stream')
      ? episode.audioUrl
      : `/api/stream?url=${encodeURIComponent(episode.audioUrl)}`;

    audioRef.current.src = proxiedStreamUrl;
    audioRef.current.currentTime = initialTime;
    audioRef.current.play().catch((err: unknown) => {
      console.error('Audio playback error:', err);
    });
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentEpisode) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err: unknown) => {
        console.error('Audio resume error:', err);
      });
    }
  };

  const seekTo = (seconds: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(seconds, duration));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const skipForward = (seconds = 30) => {
    if (!audioRef.current) return;
    seekTo(audioRef.current.currentTime + seconds);
  };

  const skipBackward = (seconds = 10) => {
    if (!audioRef.current) return;
    seekTo(audioRef.current.currentTime - seconds);
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    setIsMutedState(clamped === 0);
    if (audioRef.current) audioRef.current.volume = clamped;
    updateSettings({ volume: clamped, isMuted: clamped === 0 });
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMutedState(nextMute);
    audioRef.current.volume = nextMute ? 0 : volume;
    updateSettings({ isMuted: nextMute });
  };

  const setPlaybackSpeed = (speed: number) => {
    setPlaybackSpeedState(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
    updateSettings({ playbackSpeed: speed });
  };

  const setSleepTimer = (option: SleepOption) => {
    setSleepTimerOption(option);
  };

  // Queue Operations
  const addToQueue = (episode: Episode) => {
    const newItem: QueueItem = { episode, addedAt: Date.now() };
    const updated = [...queue, newItem];
    setQueue(updated);
    storageService.saveQueue(updated);
  };

  const removeFromQueue = (episodeId: string) => {
    const updated = queue.filter((item: QueueItem) => item.episode.id !== episodeId);
    setQueue(updated);
    storageService.saveQueue(updated);
  };

  const clearQueue = () => {
    setQueue([]);
    storageService.saveQueue([]);
  };

  const moveQueueItem = (fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || fromIdx >= queue.length || toIdx < 0 || toIdx >= queue.length) return;
    const updated = [...queue];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setQueue(updated);
    storageService.saveQueue(updated);
  };

  const playNextInQueue = () => {
    if (queue.length === 0) return;
    const nextEpisode = queue[0].episode;
    const remainingQueue = queue.slice(1);
    setQueue(remainingQueue);
    storageService.saveQueue(remainingQueue);
    playEpisode(nextEpisode);
  };

  // Subscriptions & Favorites
  const toggleSubscription = (podcast: Podcast) => {
    storageService.toggleSubscription(podcast);
    setSubscriptions(storageService.getSubscriptions());
  };

  const isSubscribed = (podcastId: string) => {
    return subscriptions.some((p: Podcast) => p.id === podcastId);
  };

  const toggleFavoriteEpisode = (episode: Episode) => {
    const res = storageService.toggleFavoriteEpisode(episode);
    setFavoriteEpisodes(storageService.getFavoriteEpisodes());
    return res;
  };

  const isFavoriteEpisode = (episodeId: string) => {
    return favoriteEpisodes.some((e: Episode) => e.id === episodeId);
  };

  // Played Status Tracking & Actions
  const [, setPlayedTick] = useState(0);

  const isEpisodePlayed = (episodeId: string) => {
    return storageService.isEpisodePlayed(episodeId);
  };

  const togglePlayedEpisode = (episodeId: string) => {
    const res = storageService.togglePlayedEpisode(episodeId);
    setPlayedTick((t) => t + 1);
    return res;
  };

  const markAllEpisodesPlayed = (episodes: Episode[], exceptLastN = 0) => {
    const targetEpisodes = exceptLastN > 0 ? episodes.slice(exceptLastN) : episodes;
    const ids = targetEpisodes.map((e) => e.id);
    storageService.markEpisodesPlayed(ids);
    setPlayedTick((t) => t + 1);
  };

  const markAllEpisodesUnplayed = (episodes: Episode[]) => {
    const ids = episodes.map((e) => e.id);
    storageService.markEpisodesUnplayed(ids);
    setPlayedTick((t) => t + 1);
  };

  const toggleHidePlayedEpisodes = () => {
    updateSettings({ hidePlayedEpisodes: !settings.hidePlayedEpisodes });
  };

  // Settings & Theme
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storageService.saveSettings(updated);
  };

  const toggleVisualizer = () => {
    updateSettings({ visualizerEnabled: !settings.visualizerEnabled });
  };

  // RSS Feed Loader
  const openPodcastDetail = async (podcast: Podcast) => {
    setSelectedPodcast(podcast);
    setActiveTab('detail');
    setIsFeedLoading(true);
    try {
      const fullPodcast = await rssService.parseRssFeed(podcast.feedUrl, podcast);
      setSelectedPodcast(fullPodcast);
    } catch (err) {
      console.error('Failed to parse podcast feed:', err);
    } finally {
      setIsFeedLoading(false);
    }
  };

  const importCustomRss = async (url: string) => {
    setIsFeedLoading(true);
    try {
      const imported = await rssService.parseRssFeed(url);
      toggleSubscription(imported);
      await openPodcastDetail(imported);
      setOpenRssModal(false);
    } catch (err: any) {
      alert(`Failed to import RSS feed: ${err.message || err}`);
    } finally {
      setIsFeedLoading(false);
    }
  };

  const importOpmlFile = async (file: File): Promise<number> => {
    const text = await file.text();
    const parsedOutlines = rssService.parseOpml(text);
    if (parsedOutlines.length === 0) {
      throw new Error('No valid podcast feeds found in OPML file.');
    }

    const currentSubs = storageService.getSubscriptions();
    const existingUrls = new Set(currentSubs.map((s) => s.feedUrl));
    let addedCount = 0;

    const newSubs: Podcast[] = [...currentSubs];
    for (const item of parsedOutlines) {
      if (!existingUrls.has(item.feedUrl)) {
        existingUrls.add(item.feedUrl);
        addedCount++;
        newSubs.unshift({
          id: item.feedUrl,
          feedUrl: item.feedUrl,
          title: item.title,
          author: 'RSS Podcast',
          description: `Imported via OPML (${item.title})`,
          artworkUrl: 'https://picsum.photos/600/600?random=' + (addedCount % 10),
          categories: ['Imported'],
          website: item.website,
        });
      }
    }

    storageService.saveSubscriptions(newSubs);
    setSubscriptions(newSubs);
    return addedCount;
  };

  const exportOpmlFile = () => {
    const subs = storageService.getSubscriptions();
    const opmlText = rssService.generateOpml(subs);
    const blob = new Blob([opmlText], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'podplayer_subscriptions.opml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Podcast Tags Methods
  const getPodcastTags = (podcastId: string): string[] => {
    return podcastTags[podcastId] || [];
  };

  const addTagToPodcast = (podcastId: string, tag: string) => {
    const updated = storageService.addTagToPodcast(podcastId, tag);
    setPodcastTags({ ...podcastTags, [podcastId]: updated });
  };

  const removeTagFromPodcast = (podcastId: string, tag: string) => {
    const updated = storageService.removeTagFromPodcast(podcastId, tag);
    setPodcastTags({ ...podcastTags, [podcastId]: updated });
  };

  // Smart Playlists Methods
  const createSmartPlaylist = (ruleData: Omit<SmartPlaylistRule, 'id'>) => {
    const newRule: SmartPlaylistRule = {
      ...ruleData,
      id: 'playlist-' + Date.now(),
    };
    const updated = [...smartPlaylists, newRule];
    setSmartPlaylists(updated);
    storageService.saveSmartPlaylists(updated);
  };

  const updateSmartPlaylist = (id: string, rule: Partial<SmartPlaylistRule>) => {
    const updated = smartPlaylists.map((p) => (p.id === id ? { ...p, ...rule } : p));
    setSmartPlaylists(updated);
    storageService.saveSmartPlaylists(updated);
  };

  const deleteSmartPlaylist = (id: string) => {
    const updated = smartPlaylists.filter((p) => p.id !== id);
    setSmartPlaylists(updated);
    storageService.saveSmartPlaylists(updated);
  };

  const evaluateSmartPlaylist = (rule: SmartPlaylistRule): Episode[] => {
    // Gather all shows from subscriptions & selected podcast
    const allShows: Podcast[] = [...subscriptions];
    if (selectedPodcast && !allShows.some((s) => s.id === selectedPodcast.id)) {
      allShows.push(selectedPodcast);
    }

    let candidateEpisodes: Episode[] = [];
    allShows.forEach((show) => {
      // Exclude check
      if (rule.excludePodcastIds && rule.excludePodcastIds.includes(show.id)) {
        return;
      }
      // Include podcast ID check
      if (rule.includePodcastIds && rule.includePodcastIds.length > 0 && !rule.includePodcastIds.includes(show.id)) {
        return;
      }
      // Tag filter check
      if (rule.includeTags && rule.includeTags.length > 0) {
        const userTags = podcastTags[show.id] || [];
        const showCategories = show.categories || [];
        const combined = [...userTags, ...showCategories].map((t) => t.toLowerCase());
        const matchesTag = rule.includeTags.some((tag: string) => combined.includes(tag.toLowerCase()));
        if (!matchesTag) return;
      }

      if (show.episodes) {
        candidateEpisodes.push(...show.episodes);
      }
    });

    // Unplayed filter
    if (rule.unplayedOnly) {
      candidateEpisodes = candidateEpisodes.filter((ep) => !storageService.isEpisodePlayed(ep.id));
    }

    // Max duration filter
    if (rule.maxDurationMinutes && rule.maxDurationMinutes > 0) {
      const maxSec = rule.maxDurationMinutes * 60;
      candidateEpisodes = candidateEpisodes.filter((ep) => ep.duration > 0 && ep.duration <= maxSec);
    }

    // Sort
    candidateEpisodes.sort((a, b) => {
      if (rule.sortBy === 'shortest') return (a.duration || 0) - (b.duration || 0);
      if (rule.sortBy === 'longest') return (b.duration || 0) - (a.duration || 0);
      if (rule.sortBy === 'oldest') return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
      // default: newest
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    if (rule.maxEpisodes && rule.maxEpisodes > 0) {
      return candidateEpisodes.slice(0, rule.maxEpisodes);
    }

    return candidateEpisodes;
  };

  return (
    <PlayerContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedPodcast,
        setSelectedPodcast,
        isFeedLoading,
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        currentEpisode,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackSpeed,
        sleepTimerOption,
        sleepTimerTimeRemaining,
        playEpisode,
        togglePlayPause,
        seekTo,
        skipForward,
        skipBackward,
        setVolume,
        toggleMute,
        setPlaybackSpeed,
        setSleepTimer,
        queue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        moveQueueItem,
        playNextInQueue,
        isQueueOpen,
        setIsQueueOpen,
        subscriptions,
        toggleSubscription,
        isSubscribed,
        favoriteEpisodes,
        toggleFavoriteEpisode,
        isFavoriteEpisode,
        isEpisodePlayed,
        togglePlayedEpisode,
        markAllEpisodesPlayed,
        markAllEpisodesUnplayed,
        hidePlayedEpisodes: settings.hidePlayedEpisodes,
        toggleHidePlayedEpisodes,
        analyserNode: analyserRef.current,
        visualizerEnabled: settings.visualizerEnabled,
        toggleVisualizer,
        settings,
        updateSettings,
        openPodcastDetail,
        openRssModal,
        setOpenRssModal,
        importCustomRss,
        importOpmlFile,
        exportOpmlFile,
        podcastTags,
        getPodcastTags,
        addTagToPodcast,
        removeTagFromPodcast,
        smartPlaylists,
        selectedSmartPlaylist,
        setSelectedSmartPlaylist,
        createSmartPlaylist,
        updateSmartPlaylist,
        deleteSmartPlaylist,
        evaluateSmartPlaylist,
        openPlaylistModal,
        setOpenPlaylistModal,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
