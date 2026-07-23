import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { AudioVisualizer } from './AudioVisualizer';
import { DEFAULT_PODCAST_ARTWORK } from '../services/rssService';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Gauge,
  Moon,
  ListMusic,
  SkipForward,
  Activity,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import type { SleepOption } from '../types/podcast';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const PlayerBar: React.FC = () => {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackSpeed,
    sleepTimerOption,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    toggleMute,
    setPlaybackSpeed,
    setSleepTimer,
    playNextInQueue,
    queue,
    isQueueOpen,
    setIsQueueOpen,
    setIsPlayerExpanded,
    isPopoutActive,
    openPopoutWindow,
    closePopoutWindow,
    visualizerEnabled,
    toggleVisualizer,
  } = usePlayer();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0];
  const sleepOptions: { label: string; value: SleepOption }[] = [
    { label: 'Off', value: 0 },
    { label: '15 Minutes', value: 900 },
    { label: '30 Minutes', value: 1800 },
    { label: '45 Minutes', value: 2700 },
    { label: '1 Hour', value: 3600 },
    { label: 'End of Episode', value: -1 },
  ];

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    seekTo(pct * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentEpisode) {
    return null;
  }

  return (
    <footer className="player-bar">
      {/* Left: Track Metadata */}
      <div className="player-track-info" onClick={() => setIsPlayerExpanded(true)} style={{ cursor: 'pointer' }} title="Expand full player overlay">
        <img
          src={currentEpisode.artworkUrl || currentEpisode.podcastArtwork || DEFAULT_PODCAST_ARTWORK}
          alt={currentEpisode.title}
          className="track-artwork"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PODCAST_ARTWORK;
          }}
        />
        <div className="track-text">
          <span className="track-title" title={currentEpisode.title}>
            {currentEpisode.title}
          </span>
          <span className="track-podcast" title={currentEpisode.podcastTitle}>
            {currentEpisode.podcastTitle}
          </span>
        </div>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="player-controls-center">
        <div className="control-buttons">
          <button className="btn-icon" style={{ width: '34px', height: '34px' }} onClick={() => skipBackward(10)} title="Rewind 10s">
            <RotateCcw size={16} />
          </button>

          <button className="btn-play" onClick={togglePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
          </button>

          <button className="btn-icon" style={{ width: '34px', height: '34px' }} onClick={() => skipForward(30)} title="Forward 30s">
            <RotateCw size={16} />
          </button>

          {queue.length > 0 && (
            <button className="btn-icon" style={{ width: '34px', height: '34px' }} onClick={playNextInQueue} title="Next in Queue">
              <SkipForward size={16} />
            </button>
          )}
        </div>

        <div className="scrubber-container">
          <span>{formatTime(currentTime)}</span>
          <div className="scrubber-bar" onClick={handleScrubberClick}>
            <div className="scrubber-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Auxiliary Controls & Speed/Sleep menus */}
      <div className="player-controls-right" style={{ position: 'relative' }}>
        <AudioVisualizer />

        <button
          className={`btn-icon ${visualizerEnabled ? 'active' : ''}`}
          style={{ width: '34px', height: '34px', color: visualizerEnabled ? 'var(--accent-primary)' : undefined }}
          onClick={toggleVisualizer}
          title="Toggle Audio Visualizer"
        >
          <Activity size={16} />
        </button>

        {/* Speed Selector Popover */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            style={{ width: 'auto', padding: '0 8px', borderRadius: 'var(--radius-full)', gap: '4px', fontSize: '0.78rem', fontWeight: 700 }}
            onClick={() => {
              setShowSpeedMenu(!showSpeedMenu);
              setShowSleepMenu(false);
            }}
            title="Playback Speed"
          >
            <Gauge size={15} />
            <span>{playbackSpeed}x</span>
          </button>

          {showSpeedMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '45px',
                right: '0',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.4rem',
                zIndex: 50,
                boxShadow: 'var(--shadow-lg)',
                width: '180px',
              }}
            >
              {speeds.map((s) => (
                <button
                  key={s}
                  style={{
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: playbackSpeed === s ? 'var(--accent-primary)' : 'transparent',
                    color: playbackSpeed === s ? '#fff' : 'var(--text-main)',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setPlaybackSpeed(s);
                    setShowSpeedMenu(false);
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sleep Timer Popover */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            style={{
              width: '34px',
              height: '34px',
              color: sleepTimerOption !== 0 ? 'var(--accent-secondary)' : undefined,
            }}
            onClick={() => {
              setShowSleepMenu(!showSleepMenu);
              setShowSpeedMenu(false);
            }}
            title="Sleep Timer"
          >
            <Moon size={16} />
          </button>

          {showSleepMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '45px',
                right: '0',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                zIndex: 50,
                boxShadow: 'var(--shadow-lg)',
                width: '160px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', padding: '0.3rem' }}>
                SLEEP TIMER
              </div>
              {sleepOptions.map((opt) => (
                <button
                  key={opt.label}
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: sleepTimerOption === opt.value ? 'var(--accent-secondary)' : 'transparent',
                    color: sleepTimerOption === opt.value ? '#fff' : 'var(--text-main)',
                    border: 'none',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSleepTimer(opt.value);
                    setShowSleepMenu(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Volume & Mute Control */}
        <button className="btn-icon" style={{ width: '34px', height: '34px' }} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Queue Drawer Toggle */}
        <button
          className="btn-icon"
          style={{
            width: '34px',
            height: '34px',
            borderColor: isQueueOpen ? 'var(--accent-primary)' : undefined,
            color: isQueueOpen ? 'var(--accent-primary)' : undefined,
          }}
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          title="Up Next Queue"
        >
          <ListMusic size={16} />
        </button>

        {/* Expand Player Overlay */}
        <button
          className="btn-icon"
          style={{ width: '34px', height: '34px' }}
          onClick={() => setIsPlayerExpanded(true)}
          title="Expand Player to Full Screen"
        >
          <Maximize2 size={16} />
        </button>

        {/* Pop Out to Window */}
        <button
          className="btn-icon"
          style={{
            width: '34px',
            height: '34px',
            borderColor: isPopoutActive ? 'var(--accent-primary)' : undefined,
            color: isPopoutActive ? 'var(--accent-primary)' : undefined,
          }}
          onClick={isPopoutActive ? closePopoutWindow : openPopoutWindow}
          title={isPopoutActive ? 'Close Pop-Out Window' : 'Pop Out Player to Small Standalone Window'}
        >
          <ExternalLink size={16} />
        </button>
      </div>
    </footer>
  );
};
