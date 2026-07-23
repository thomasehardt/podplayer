import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { offlineCacheService } from '../services/offlineCacheService';
import { DEFAULT_PODCAST_ARTWORK } from '../services/rssService';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Check,
  ListMusic,
  HardDriveDownload,
  Minimize2,
} from 'lucide-react';
import type { QueueItem } from '../types/podcast';

export const PopoutPlayerView: React.FC = () => {
  const {
    currentEpisode,
    isPlaying,
    togglePlayPause,
    currentTime,
    duration,
    seekTo,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    playbackSpeed,
    setPlaybackSpeed,
    skipForward,
    skipBackward,
    queue,
    playEpisode,
  } = usePlayer();

  const [isCachedOffline, setIsCachedOffline] = useState(false);
  const [cachingProgress, setCachingProgress] = useState<number | null>(null);
  const [showQueue, setShowQueue] = useState(false);

  // Notify main window when pop-up closes
  const handleClosePopout = () => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('podplayer_popout_sync');
      channel.postMessage({ type: 'POPOUT_CLOSED' });
      channel.close();
    }
    window.close();
  };

  useEffect(() => {
    const handleUnload = () => {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('podplayer_popout_sync');
        channel.postMessage({ type: 'POPOUT_CLOSED' });
        channel.close();
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Check offline cache status when current episode changes
  useEffect(() => {
    if (!currentEpisode?.audioUrl) {
      setIsCachedOffline(false);
      return;
    }

    let isMounted = true;
    void offlineCacheService.isCached(currentEpisode.audioUrl).then((cached) => {
      if (isMounted) setIsCachedOffline(cached);
    });

    return () => {
      isMounted = false;
    };
  }, [currentEpisode?.audioUrl]);

  const handleToggleOfflineCache = async () => {
    if (!currentEpisode?.audioUrl) return;

    if (isCachedOffline) {
      const removed = await offlineCacheService.removeCachedEpisode(currentEpisode.audioUrl);
      if (removed) setIsCachedOffline(false);
    } else {
      setCachingProgress(0);
      const success = await offlineCacheService.cacheEpisode(
        currentEpisode.audioUrl,
        (percent) => setCachingProgress(percent)
      );
      setCachingProgress(null);
      if (success) setIsCachedOffline(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentEpisode) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg-base)',
          color: 'var(--text-main)',
        }}
      >
        <ListMusic size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1rem', opacity: 0.8 }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          No Episode Playing
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Select an episode in your main PodPlayer window to start listening.
        </p>
      </div>
    );
  }

  const artworkSrc = currentEpisode.artworkUrl || currentEpisode.podcastArtwork || DEFAULT_PODCAST_ARTWORK;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-main)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.2rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isPlaying ? '#10b981' : '#f59e0b',
              boxShadow: isPlaying ? '0 0 10px #10b981' : 'none',
            }}
          />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.3px' }}>
            PodPlayer Pop-Out
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {/* Offline Cache Button */}
          <button
            className="btn-icon"
            onClick={handleToggleOfflineCache}
            style={{
              width: 'auto',
              height: '32px',
              padding: '0 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: isCachedOffline ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
              color: isCachedOffline ? '#10b981' : 'var(--text-muted)',
              border: isCachedOffline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
            }}
            title={isCachedOffline ? 'Episode cached offline in browser' : 'Cache episode offline'}
          >
            {cachingProgress !== null ? (
              <span style={{ fontSize: '0.75rem' }}>Caching {cachingProgress}%...</span>
            ) : isCachedOffline ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} />
                Cached Offline
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HardDriveDownload size={14} />
                Cache Offline
              </span>
            )}
          </button>

          {/* Re-attach to main page button */}
          <button
            className="btn-icon"
            onClick={handleClosePopout}
            style={{ width: '32px', height: '32px' }}
            title="Re-attach player to main page"
          >
            <Minimize2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Artwork */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0 1.2rem 0' }}>
        <img
          src={artworkSrc}
          alt={currentEpisode.title}
          style={{
            width: '180px',
            height: '180px',
            borderRadius: 'var(--radius-md)',
            objectFit: 'cover',
            boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.3)',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PODCAST_ARTWORK;
          }}
        />
      </div>

      {/* Title & Author */}
      <div style={{ textAlign: 'center', marginBottom: '1.2rem', padding: '0 0.5rem' }}>
        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.05rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '0.3rem',
          }}
          title={currentEpisode.title}
        >
          {currentEpisode.title}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {currentEpisode.podcastTitle}
        </p>
      </div>

      {/* Scrubber Bar */}
      <div style={{ marginBottom: '1.2rem' }}>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="scrubber-bar"
          style={{ width: '100%', cursor: 'pointer', marginBottom: '0.4rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <button className="btn-icon" onClick={() => skipBackward()} title="Back 15s">
          <RotateCcw size={18} />
        </button>

        <button
          className="btn-primary"
          onClick={togglePlayPause}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
        </button>

        <button className="btn-icon" onClick={() => skipForward()} title="Forward 30s">
          <RotateCw size={18} />
        </button>
      </div>

      {/* Speed & Volume Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: 'auto', background: 'var(--bg-surface)', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        {/* Speed Selector */}
        <select
          className="search-input"
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', height: '28px' }}
        >
          <option value={0.8}>0.8x</option>
          <option value={1.0}>1.0x</option>
          <option value={1.2}>1.2x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={1.75}>1.75x</option>
          <option value={2.0}>2.0x</option>
        </select>

        {/* Queue Drawer Toggle */}
        <button
          className="btn-icon"
          onClick={() => setShowQueue(!showQueue)}
          style={{ width: '28px', height: '28px', background: showQueue ? 'var(--accent-primary)' : undefined, color: showQueue ? '#fff' : undefined }}
          title="Toggle Queue"
        >
          <ListMusic size={14} />
        </button>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button className="btn-icon" style={{ width: '24px', height: '24px', border: 'none' }} onClick={toggleMute}>
            {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ width: '60px', height: '4px' }}
          />
        </div>
      </div>

      {/* Up Next Mini Queue Modal inside Pop-Out */}
      {showQueue && (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '1.2rem',
            right: '1.2rem',
            maxHeight: '220px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '0.8rem',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.6rem', color: 'var(--accent-primary)' }}>
            Up Next ({queue.length})
          </div>
          {queue.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Queue is empty.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {queue.map((item: QueueItem, i: number) => (
                <div
                  key={`${item.episode.id}-${i}`}
                  onClick={() => playEpisode(item.episode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '0.5rem' }}>
                    {item.episode.title}
                  </span>
                  <Play size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
