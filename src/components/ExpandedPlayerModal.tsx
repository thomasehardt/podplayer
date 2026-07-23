import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { offlineCacheService } from '../services/offlineCacheService';
import { DEFAULT_PODCAST_ARTWORK } from '../services/rssService';
import {
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Gauge,
  HardDriveDownload,
  Check,
  X,
} from 'lucide-react';
import type { QueueItem } from '../types/podcast';

export const ExpandedPlayerModal: React.FC = () => {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackSpeed,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    toggleMute,
    setVolume,
    setPlaybackSpeed,
    queue,
    playEpisode,
    removeFromQueue,
    setIsPlayerExpanded,
  } = usePlayer();

  const [isCachedOffline, setIsCachedOffline] = useState(false);
  const [cachingProgress, setCachingProgress] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'player' | 'queue' | 'notes'>('player');

  // Check offline status
  useEffect(() => {
    if (!currentEpisode?.audioUrl) {
      setIsCachedOffline(false);
      return;
    }
    let mounted = true;
    void offlineCacheService.isCached(currentEpisode.audioUrl).then((cached) => {
      if (mounted) setIsCachedOffline(cached);
    });
    return () => {
      mounted = false;
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
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentEpisode) return null;

  const artworkSrc = currentEpisode.artworkUrl || currentEpisode.podcastArtwork || DEFAULT_PODCAST_ARTWORK;
  const speeds = [0.8, 1.0, 1.2, 1.25, 1.5, 1.75, 2.0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* Background Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)`,
          opacity: 0.4,
          pointerEvents: 'none',
          filter: 'blur(60px)',
        }}
      />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.2rem 2rem',
          zIndex: 10,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          className="btn-icon"
          onClick={() => setIsPlayerExpanded(false)}
          title="Minimize Player"
          style={{ width: '40px', height: '40px' }}
        >
          <ChevronDown size={22} />
        </button>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className="category-tag"
            onClick={() => setActiveTab('player')}
            style={{
              background: activeTab === 'player' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'player' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '0.3rem 1rem',
            }}
          >
            Now Playing
          </button>
          <button
            type="button"
            className="category-tag"
            onClick={() => setActiveTab('queue')}
            style={{
              background: activeTab === 'queue' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'queue' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '0.3rem 1rem',
            }}
          >
            Up Next ({queue.length})
          </button>
          <button
            type="button"
            className="category-tag"
            onClick={() => setActiveTab('notes')}
            style={{
              background: activeTab === 'notes' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'notes' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '0.3rem 1rem',
            }}
          >
            Show Notes
          </button>
        </div>

        {/* Offline Cache Action */}
        <button
          className="btn-icon"
          onClick={handleToggleOfflineCache}
          style={{
            width: 'auto',
            height: '36px',
            padding: '0 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: isCachedOffline ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
            color: isCachedOffline ? '#10b981' : 'var(--text-main)',
            border: isCachedOffline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
          }}
          title={isCachedOffline ? 'Episode stored offline in browser' : 'Cache episode locally for offline playback'}
        >
          {cachingProgress !== null ? (
            <span>Caching {cachingProgress}%...</span>
          ) : isCachedOffline ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              Cached Offline
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDriveDownload size={16} />
              Cache Offline
            </span>
          )}
        </button>
      </div>

      {/* Main Content View */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', zIndex: 10 }}>
        {activeTab === 'player' && (
          <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Artwork */}
            <div style={{ marginBottom: '2rem', position: 'relative' }}>
              <img
                src={artworkSrc}
                alt={currentEpisode.title}
                style={{
                  width: '280px',
                  height: '280px',
                  borderRadius: 'var(--radius-lg)',
                  objectFit: 'cover',
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4)',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PODCAST_ARTWORK;
                }}
              />
            </div>

            {/* Episode Title & Podcast */}
            <div style={{ textAlign: 'center', marginBottom: '1.8rem', width: '100%' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  marginBottom: '0.4rem',
                  lineHeight: 1.3,
                }}
              >
                {currentEpisode.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                {currentEpisode.podcastTitle}
              </p>
            </div>

            {/* Scrubber Bar */}
            <div style={{ width: '100%', marginBottom: '2rem' }}>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="scrubber-bar"
                style={{ width: '100%', height: '8px', cursor: 'pointer', marginBottom: '0.6rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
              <button className="btn-icon" style={{ width: '48px', height: '48px' }} onClick={() => skipBackward()} title="Back 15s">
                <RotateCcw size={22} />
              </button>

              <button
                className="btn-primary"
                onClick={togglePlayPause}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  justifyContent: 'center',
                  padding: 0,
                  boxShadow: '0 8px 25px var(--accent-glow)',
                }}
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
              </button>

              <button className="btn-icon" style={{ width: '48px', height: '48px' }} onClick={() => skipForward()} title="Forward 30s">
                <RotateCw size={22} />
              </button>
            </div>

            {/* Secondary Controls Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                padding: '0.8rem 1.2rem',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              {/* Playback Speed */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Gauge size={16} style={{ color: 'var(--text-muted)' }} />
                <select
                  className="search-input"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem', height: '32px' }}
                >
                  {speeds.map((s) => (
                    <option key={s} value={s}>
                      {s}x
                    </option>
                  ))}
                </select>
              </div>

              {/* Volume Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button className="btn-icon" style={{ width: '32px', height: '32px', border: 'none' }} onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  style={{ width: '90px', height: '4px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Up Next Queue Tab */}
        {activeTab === 'queue' && (
          <div style={{ width: '100%', maxWidth: '600px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
              Up Next Queue ({queue.length})
            </h3>
            {queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Your queue is empty. Add episodes to play next!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', flex: 1 }}>
                {queue.map((item: QueueItem, idx: number) => (
                  <div
                    key={`${item.episode.id}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.8rem 1rem',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <img
                      src={item.episode.artworkUrl || item.episode.podcastArtwork || DEFAULT_PODCAST_ARTWORK}
                      alt={item.episode.title}
                      style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                        }}
                        onClick={() => playEpisode(item.episode)}
                      >
                        {item.episode.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.episode.podcastTitle}</div>
                    </div>
                    <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => playEpisode(item.episode)}>
                      <Play size={16} />
                    </button>
                    <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => removeFromQueue(item.episode.id)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Show Notes Tab */}
        {activeTab === 'notes' && (
          <div style={{ width: '100%', maxWidth: '680px', flex: 1, overflowY: 'auto', background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.8rem' }}>
              {currentEpisode.title}
            </h3>
            <div
              style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}
              dangerouslySetInnerHTML={{ __html: currentEpisode.description || 'No description available for this episode.' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
