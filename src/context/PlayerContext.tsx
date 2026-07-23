import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Podcast, Episode, QueueItem, UserSettings, NavigationTab, SleepOption, SmartPlaylistRule, PodcastSettings } from '../types/podcast';
import { storageService } from '../services/storageService';
import { rssService, DEFAULT_PODCAST_ARTWORK } from '../services/rssService';
import { syncService } from '../services/syncService';
import { offlineCacheService } from '../services/offlineCacheService';

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
  playEpisode: (episode: Episode, initialTime?: number) => void;
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
  loadPlaylistQueue: (episodes: Episode[], startPlayingImmediately?: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isPlayerExpanded: boolean;
  setIsPlayerExpanded: (expanded: boolean) => void;
  isPopoutActive: boolean;
  openPopoutWindow: () => void;
  closePopoutWindow: () => void;
  
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
  openCommuteModal: boolean;
  setOpenCommuteModal: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Per-Podcast Settings (Playback Speed, Ordering, Auto-Download)
  allPodcastSettings: Record<string, PodcastSettings>;
  getPodcastShowSettings: (podcastId: string) => PodcastSettings;
  updatePodcastShowSettings: (podcastId: string, settings: Partial<PodcastSettings>) => void;

  // Account (Authelia-backed)
  username: string | null;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Settings & Storage Sync
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [subscriptions, setSubscriptions] = useState<Podcast[]>(() => storageService.getSubscriptions());
  const [favoriteEpisodes, setFavoriteEpisodes] = useState<Episode[]>(() => storageService.getFavoriteEpisodes());
  const [queue, setQueue] = useState<QueueItem[]>(() => storageService.getQueue());
  const [podcastTags, setPodcastTags] = useState<Record<string, string[]>>(() => storageService.getPodcastTags());
  const [allPodcastSettings, setAllPodcastSettings] = useState<Record<string, PodcastSettings>>(() => storageService.getAllPodcastSettings());
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
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isPopoutActive, setIsPopoutActive] = useState(false);
  const [openRssModal, setOpenRssModal] = useState(false);
  const [openPlaylistModal, setOpenPlaylistModal] = useState(false);
  const [openCommuteModal, setOpenCommuteModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const popoutWindowRef = useRef<Window | null>(null);
  const popoutActiveRef = useRef(false);
  const mirroredStateRef = useRef<{ episode: Episode | null; time: number; playing: boolean; speed: number }>({
    episode: null,
    time: 0,
    playing: false,
    speed: 1,
  });
  const isPopoutWindowSelf =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('popout') === 'true';

  useEffect(() => {
    popoutActiveRef.current = isPopoutActive;
  }, [isPopoutActive]);

  // Reclaims local audio playback from the point the pop-out window last reported,
  // used both when the main window re-attaches and when the pop-out closes itself.
  const reclaimPlaybackFromPopout = () => {
    const audio = audioRef.current;
    const { episode, time, playing, speed } = mirroredStateRef.current;
    if (!audio || !episode) return;
    void offlineCacheService.getPlayableUrl(episode.audioUrl).then((playableUrl) => {
      setAudioSrc(audio, playableUrl);
      audio.playbackRate = speed || 1;
      const resume = () => {
        try {
          audio.currentTime = time;
        } catch {
          // ignore seek error if unbuffered
        }
        if (playing) {
          audio.play().catch((err: unknown) => console.error('Audio reclaim playback error:', err));
        }
      };
      if (audio.readyState >= 1) {
        resume();
      } else {
        audio.addEventListener('loadedmetadata', resume, { once: true });
      }
    });
  };

  // Broadcasts this window's live audio state; only meaningful from the pop-out
  // window, which is the active player while it's open.
  const broadcastPopoutState = () => {
    if (!isPopoutWindowSelf || !channelRef.current || !audioRef.current) return;
    channelRef.current.postMessage({
      type: 'STATE_SYNC',
      currentEpisode: currentEpisodeRef.current,
      currentTime: audioRef.current.currentTime,
      duration: audioRef.current.duration || 0,
      isPlaying: !audioRef.current.paused,
      playbackSpeed: audioRef.current.playbackRate,
    });
  };

  // BroadcastChannel Sync between Main Window & Pop-Out Player Window
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('podplayer_popout_sync');
    channelRef.current = channel;

    const handleMessage = (event: MessageEvent) => {
      const { type } = event.data || {};
      if (type === 'POPOUT_OPENED') {
        setIsPopoutActive(true);
      } else if (type === 'POPOUT_CLOSED') {
        const wasActive = popoutActiveRef.current;
        popoutActiveRef.current = false;
        setIsPopoutActive(false);
        if (wasActive && !isPopoutWindowSelf) {
          reclaimPlaybackFromPopout();
        }
      } else if (type === 'STATE_SYNC' && !isPopoutWindowSelf) {
        const { currentEpisode: ep, currentTime: t, duration: d, isPlaying: p, playbackSpeed: s } = event.data;
        mirroredStateRef.current = { episode: ep ?? null, time: t ?? 0, playing: !!p, speed: s || 1 };
        setCurrentEpisode(ep ?? null);
        setCurrentTime(t ?? 0);
        setDuration(d ?? 0);
        setIsPlaying(!!p);
        if (s) setPlaybackSpeedState(s);
      }
    };

    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  const openPopoutWindow = () => {
    const win = window.open(
      window.location.origin + '/?popout=true',
      'PodPlayerMiniWindow',
      'width=420,height=660,left=120,top=120,resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no'
    );
    if (!win) {
      // Popup blocked — leave main-window playback untouched.
      console.warn('Pop-out window blocked by the browser.');
      return;
    }
    popoutWindowRef.current = win;
    // Hand off audio ownership to the pop-out window so both windows never
    // play at once — the pop-out reports its state back via STATE_SYNC once open.
    if (audioRef.current) audioRef.current.pause();
    popoutActiveRef.current = true;
    setIsPopoutActive(true);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'POPOUT_OPENED' });
    }
  };

  const closePopoutWindow = () => {
    // Close the real window handle; the pop-out's own beforeunload handler
    // broadcasts POPOUT_CLOSED, which is what actually triggers reclaiming
    // playback below — keeping a single source of truth for "the popout is gone."
    if (popoutWindowRef.current && !popoutWindowRef.current.closed) {
      popoutWindowRef.current.close();
    }
    popoutWindowRef.current = null;
  };
  
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
  const activeBlobUrlRef = useRef<string | null>(null);

  // Sets audio.src, revoking any previously-assigned blob: URL so cached
  // episode Blobs (which can be tens of MB) don't pile up in memory over a session.
  const setAudioSrc = (audio: HTMLAudioElement, url: string) => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    if (url.startsWith('blob:')) {
      activeBlobUrlRef.current = url;
    }
    audio.src = url;
  };

  const currentEpisodeRef = useRef<Episode | null>(null);
  useEffect(() => {
    currentEpisodeRef.current = currentEpisode;
  }, [currentEpisode]);

  // Initialize HTML5 Audio Element & Restore Saved State
  useEffect(() => {
    const audio = new Audio();
    // Do NOT set crossOrigin = 'anonymous' so cross-origin podcast CDNs play without CORS blocking
    audioRef.current = audio;
    
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackSpeed;

    const handlePlay = () => {
      setIsPlaying(true);
      broadcastPopoutState();
    };
    const handlePause = () => {
      setIsPlaying(false);
      broadcastPopoutState();
    };
    const handleTimeUpdate = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      if (currentEpisodeRef.current) {
        storageService.saveEpisodeProgress(currentEpisodeRef.current.id, t, audio.duration || 0);
        storageService.savePlayerState({
          currentEpisode: currentEpisodeRef.current,
          currentTime: t,
          duration: audio.duration || 0,
          playbackSpeed: audio.playbackRate || 1.0,
        });
      }
      broadcastPopoutState();
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      broadcastPopoutState();
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

    // Restore initial player state snapshot from local storage on launch
    const savedState = storageService.getPlayerState();
    if (savedState && savedState.currentEpisode) {
      setCurrentEpisode(savedState.currentEpisode);
      setCurrentTime(savedState.currentTime);
      setDuration(savedState.duration);
      if (savedState.playbackSpeed) setPlaybackSpeedState(savedState.playbackSpeed);

      void offlineCacheService.getPlayableUrl(savedState.currentEpisode.audioUrl).then((playableUrl) => {
        setAudioSrc(audio, playableUrl);
        const targetTime = savedState.currentTime;
        const setInitialSeek = () => {
          if (targetTime > 0 && targetTime < (audio.duration || Infinity)) {
            try {
              audio.currentTime = targetTime;
            } catch {
              // Ignore seek error if unbuffered
            }
          }
        };
        if (audio.readyState >= 1) {
          setInitialSeek();
        } else {
          audio.addEventListener('loadedmetadata', setInitialSeek, { once: true });
        }
      });
    }

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
            // Attempt feed recovery via iTunes search if primary feed URL failed
            try {
              const searchResults = await rssService.searchiTunes(show.title);
              const match = searchResults.find(
                (p) => p.feedUrl && p.feedUrl !== show.feedUrl && p.title.toLowerCase().trim() === show.title.toLowerCase().trim()
              ) || searchResults[0];

              if (match && match.feedUrl && match.feedUrl !== show.feedUrl) {
                const healed = await rssService.parseRssFeed(match.feedUrl, { ...show, feedUrl: match.feedUrl });
                return healed;
              }
            } catch {
              // Ignore recovery error
            }
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
  const playEpisode = async (episode: Episode, initialTime?: number) => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    // Apply per-podcast custom playback speed if configured for this show
    const showSettings = storageService.getPodcastShowSettings(episode.podcastId);
    if (showSettings.playbackSpeed && showSettings.playbackSpeed > 0) {
      setPlaybackSpeedState(showSettings.playbackSpeed);
      audio.playbackRate = showSettings.playbackSpeed;
    }

    setCurrentEpisode(episode);
    storageService.addToHistory(episode);

    if (initialTime === undefined) {
      const progressMap = storageService.getEpisodeProgress();
      const saved = progressMap[episode.id];
      initialTime = saved && saved.progress < (saved.duration - 10) ? saved.progress : 0;
    }

    const playableUrl = await offlineCacheService.getPlayableUrl(episode.audioUrl);
    setAudioSrc(audio, playableUrl);

    const targetTime = initialTime;
    const startPlay = () => {
      if (targetTime > 0 && targetTime < (audio.duration || Infinity)) {
        try {
          audio.currentTime = targetTime;
        } catch {
          // ignore seek error
        }
      }
      audio.play().catch((err: unknown) => {
        console.error('Audio playback error:', err);
      });
    };

    if (audio.readyState >= 1) {
      startPlay();
    } else {
      audio.addEventListener('loadedmetadata', startPlay, { once: true });
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || !currentEpisode) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
    } else {
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        const playableUrl = await offlineCacheService.getPlayableUrl(currentEpisode.audioUrl);
        setAudioSrc(audio, playableUrl);
        const targetTime = currentTime;

        const startResume = () => {
          if (targetTime > 0 && targetTime < (audio.duration || Infinity)) {
            try {
              audio.currentTime = targetTime;
            } catch {
              // ignore seek error
            }
          }
          audio.play().catch((err: unknown) => console.error('Audio resume error:', err));
        };

        if (audio.readyState >= 1) {
          startResume();
        } else {
          audio.addEventListener('loadedmetadata', startResume, { once: true });
        }
        return;
      }

      audio.play().catch((err: unknown) => {
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

  const loadPlaylistQueue = (episodes: Episode[], startPlayingImmediately = true) => {
    if (!episodes || episodes.length === 0) return;

    if (startPlayingImmediately) {
      playEpisode(episodes[0]);
    }

    const remainingEpisodes = startPlayingImmediately ? episodes.slice(1) : episodes;
    const newQueueItems: QueueItem[] = remainingEpisodes.map((ep) => ({
      episode: ep,
      addedAt: Date.now(),
    }));

    setQueue(newQueueItems);
    storageService.saveQueue(newQueueItems);
    setIsQueueOpen(true);
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

  // Account Sync: identify the Authelia-authenticated user and hydrate local
  // state from their server-side data, if any exists yet.
  useEffect(() => {
    (async () => {
      const user = await syncService.whoAmI();
      setUsername(user);
      if (!user) return;

      const hydrated = await syncService.pullAndHydrate();
      if (hydrated) {
        setSettings(storageService.getSettings());
        setSubscriptions(storageService.getSubscriptions());
        setFavoriteEpisodes(storageService.getFavoriteEpisodes());
        setQueue(storageService.getQueue());
        setPodcastTags(storageService.getPodcastTags());
        setAllPodcastSettings(storageService.getAllPodcastSettings());
        setSmartPlaylists(storageService.getSmartPlaylists());
        setPlayedTick((t) => t + 1);

        const savedState = storageService.getPlayerState();
        if (savedState && savedState.currentEpisode && audioRef.current) {
          setCurrentEpisode(savedState.currentEpisode);
          setCurrentTime(savedState.currentTime);
          setDuration(savedState.duration);
          if (savedState.playbackSpeed) setPlaybackSpeedState(savedState.playbackSpeed);

          const proxiedStreamUrl = savedState.currentEpisode.audioUrl.startsWith('/api/stream')
            ? savedState.currentEpisode.audioUrl
            : `/api/stream?url=${encodeURIComponent(savedState.currentEpisode.audioUrl)}`;

          setAudioSrc(audioRef.current, proxiedStreamUrl);
          audioRef.current.currentTime = savedState.currentTime;
        }
      } else {
        // First time this account has been seen server-side: back up whatever's
        // already in this browser's localStorage.
        void syncService.pushNow();
      }
    })();
  }, []);

  // Background RSS feed hydration & auto-download engine
  useEffect(() => {
    let isCancelled = false;

    const hydrateSubscribedFeeds = async () => {
      const currentSubs = storageService.getSubscriptions();
      if (currentSubs.length === 0) return;

      const updatedSubs = [...currentSubs];
      let hasNewData = false;

      for (let i = 0; i < updatedSubs.length; i++) {
        if (isCancelled) break;
        const sub = updatedSubs[i];

        try {
          const fresh = await rssService.parseRssFeed(sub.feedUrl, sub);
          if (fresh.episodes && fresh.episodes.length > 0) {
            updatedSubs[i] = fresh;
            hasNewData = true;

            // Auto-precache latest episodes if configured for this podcast show
            const showSettings = storageService.getPodcastShowSettings(sub.id);
            if (showSettings.autoDownloadCount && showSettings.autoDownloadCount > 0) {
              const toPrecache = fresh.episodes.slice(0, showSettings.autoDownloadCount);
              toPrecache.forEach((ep) => {
                if (ep.audioUrl) {
                  const streamUrl = `/api/stream?url=${encodeURIComponent(ep.audioUrl)}`;
                  fetch(streamUrl, { method: 'HEAD' }).catch(() => {});
                }
              });
            }
          }
        } catch {
          // Silently keep stub if individual feed fails
        }
      }

      if (!isCancelled && hasNewData) {
        setSubscriptions(updatedSubs);
        playlistCacheRef.current.clear(); // Clear cached playlist evaluations to include new episodes
      }
    };

    // Run initial feed hydration on app launch
    void hydrateSubscribedFeeds();

    // Auto-refresh subscribed feeds every 15 minutes in the background
    const interval = setInterval(() => {
      void hydrateSubscribedFeeds();
    }, 15 * 60 * 1000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  const getPodcastShowSettings = (podcastId: string): PodcastSettings => {
    return allPodcastSettings[podcastId] || {};
  };

  const updatePodcastShowSettings = (podcastId: string, updated: Partial<PodcastSettings>) => {
    const res = storageService.savePodcastShowSettings(podcastId, updated);
    setAllPodcastSettings(storageService.getAllPodcastSettings());
    return res;
  };

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
    } catch (err: any) {
      console.warn(`Primary RSS feed failed (${podcast.feedUrl}):`, err?.message || err);
      // Attempt auto-healing: search iTunes API by podcast title to discover updated feed URL
      try {
        const searchResults = await rssService.searchiTunes(podcast.title);
        const match = searchResults.find(
          (p) => p.feedUrl && p.feedUrl !== podcast.feedUrl && p.title.toLowerCase().trim() === podcast.title.toLowerCase().trim()
        ) || searchResults[0];

        if (match && match.feedUrl && match.feedUrl !== podcast.feedUrl) {
          console.log(`Auto-healing feed for "${podcast.title}": switching to ${match.feedUrl}`);
          const healedPodcast = await rssService.parseRssFeed(match.feedUrl, { ...podcast, feedUrl: match.feedUrl });
          setSelectedPodcast(healedPodcast);
          // If subscribed, update saved subscription with new working feedUrl
          const currentSubs = storageService.getSubscriptions();
          const subIdx = currentSubs.findIndex((s) => s.id === podcast.id || s.feedUrl === podcast.feedUrl);
          if (subIdx >= 0) {
            currentSubs[subIdx] = healedPodcast;
            storageService.saveSubscriptions(currentSubs);
            setSubscriptions(currentSubs);
          }
          return;
        }
      } catch (fallbackErr) {
        console.error('iTunes feed recovery failed:', fallbackErr);
      }

      // If all fallbacks fail, set podcast with error indication
      setSelectedPodcast({
        ...podcast,
        episodes: [],
        feedError: err?.message || 'Failed to connect to podcast RSS feed',
      } as Podcast & { feedError?: string });
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

    const newlyAddedFeeds: Podcast[] = [];
    const newSubs: Podcast[] = [...currentSubs];

    for (const item of parsedOutlines) {
      if (!existingUrls.has(item.feedUrl)) {
        existingUrls.add(item.feedUrl);
        addedCount++;
        const stub: Podcast = {
          id: item.feedUrl,
          feedUrl: item.feedUrl,
          title: item.title,
          author: 'RSS Podcast',
          description: item.description || `Imported via OPML (${item.title})`,
          artworkUrl: DEFAULT_PODCAST_ARTWORK,
          categories: ['Imported'],
          website: item.website,
        };
        newlyAddedFeeds.push(stub);
        newSubs.unshift(stub);
      }
    }

    if (addedCount > 0) {
      storageService.saveSubscriptions(newSubs);
      setSubscriptions(newSubs);

      // Async background hydration of newly imported feeds
      (async () => {
        const hydratedList = [...newSubs];
        for (const stub of newlyAddedFeeds) {
          try {
            const fresh = await rssService.parseRssFeed(stub.feedUrl, stub);
            const idx = hydratedList.findIndex((s) => s.feedUrl === stub.feedUrl);
            if (idx >= 0) {
              hydratedList[idx] = fresh;
              setSubscriptions([...hydratedList]);
              storageService.saveSubscriptions(hydratedList);
            }
          } catch {
            // Keep stub if individual feed parse fails
          }
        }
      })();
    }

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
  const playlistCacheRef = useRef<Map<string, Episode[]>>(new Map());

  const createSmartPlaylist = (ruleData: Omit<SmartPlaylistRule, 'id'>) => {
    const newRule: SmartPlaylistRule = {
      ...ruleData,
      id: 'playlist-' + Date.now(),
    };
    const updated = [...smartPlaylists, newRule];
    setSmartPlaylists(updated);
    storageService.saveSmartPlaylists(updated);
    playlistCacheRef.current.clear();
  };

  const updateSmartPlaylist = (id: string, rule: Partial<SmartPlaylistRule>) => {
    const updated = smartPlaylists.map((p) => (p.id === id ? { ...p, ...rule } : p));
    setSmartPlaylists(updated);
    storageService.saveSmartPlaylists(updated);
    playlistCacheRef.current.clear();
  };

  const deleteSmartPlaylist = (id: string) => {
    const updated = smartPlaylists.filter((p) => p.id !== id);
    setSmartPlaylists(updated);
    storageService.saveSmartPlaylists(updated);
    playlistCacheRef.current.clear();
  };

  const evaluateSmartPlaylist = (rule: SmartPlaylistRule, forceRefresh = false): Episode[] => {
    if (!forceRefresh && playlistCacheRef.current.has(rule.id)) {
      return playlistCacheRef.current.get(rule.id)!;
    }

    // Gather all shows from subscriptions & selected podcast
    const allShows: Podcast[] = [...subscriptions];
    if (selectedPodcast && !allShows.some((s) => s.id === selectedPodcast.id)) {
      allShows.push(selectedPodcast);
    }

    const playedMap = storageService.getPlayedEpisodes();
    const progressMap = storageService.getEpisodeProgress();

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
        const isMatchAll = rule.tagMatchMode === 'all';
        const matchesTag = isMatchAll
          ? rule.includeTags.every((tag: string) => combined.includes(tag.toLowerCase()))
          : rule.includeTags.some((tag: string) => combined.includes(tag.toLowerCase()));
        if (!matchesTag) return;
      }

      if (show.episodes) {
        candidateEpisodes.push(...show.episodes);
      }
    });

    // Unplayed filter
    if (rule.unplayedOnly) {
      candidateEpisodes = candidateEpisodes.filter((ep) => {
        if (playedMap[ep.id]) return false;
        const saved = progressMap[ep.id];
        if (saved && saved.duration > 0 && saved.progress / saved.duration >= 0.9) return false;
        return true;
      });
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

    const result = rule.maxEpisodes && rule.maxEpisodes > 0 ? candidateEpisodes.slice(0, rule.maxEpisodes) : candidateEpisodes;
    playlistCacheRef.current.set(rule.id, result);
    return result;
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
        loadPlaylistQueue,
        isQueueOpen,
        setIsQueueOpen,
        isPlayerExpanded,
        setIsPlayerExpanded,
        isPopoutActive,
        openPopoutWindow,
        closePopoutWindow,
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
        openCommuteModal,
        setOpenCommuteModal,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        allPodcastSettings,
        getPodcastShowSettings,
        updatePodcastShowSettings,
        username,
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
