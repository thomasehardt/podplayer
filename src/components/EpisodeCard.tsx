import React, { useState } from 'react';
import type { Episode } from '../types/podcast';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Heart, ListPlus, Clock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';

interface EpisodeCardProps {
  episode: Episode;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({ episode }) => {
  const {
    currentEpisode,
    isPlaying,
    playEpisode,
    togglePlayPause,
    addToQueue,
    isFavoriteEpisode,
    toggleFavoriteEpisode,
    isEpisodePlayed,
    togglePlayedEpisode,
  } = usePlayer();

  const [expanded, setExpanded] = useState(false);

  const isCurrent = currentEpisode?.id === episode.id;
  const isPlayingCurrent = isCurrent && isPlaying;
  const isFav = isFavoriteEpisode(episode.id);
  const isPlayed = isEpisodePlayed(episode.id);

  // Retrieve saved progress
  const progressMap = storageService.getEpisodeProgress();
  const savedProgress = progressMap[episode.id];
  const progressPercent = savedProgress && savedProgress.duration > 0
    ? Math.min(100, Math.round((savedProgress.progress / savedProgress.duration) * 100))
    : 0;

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playEpisode(episode);
    }
  };

  return (
    <div
      className="episode-item"
      style={{
        ...(isCurrent ? { borderColor: 'var(--accent-primary)', background: 'var(--bg-surface-hover)' } : {}),
        ...(isPlayed && !isCurrent ? { opacity: 0.75 } : {}),
      }}
    >
      <button
        className="btn-play"
        style={{ width: '42px', height: '42px', flexShrink: 0 }}
        onClick={handlePlayClick}
        title={isPlayingCurrent ? 'Pause' : 'Play Episode'}
      >
        {isPlayingCurrent ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
      </button>

      <div className="episode-info">
        <div
          className="episode-title"
          onClick={() => setExpanded(!expanded)}
          style={isCurrent ? { color: 'var(--accent-primary)' } : isPlayed ? { color: 'var(--text-muted)' } : {}}
        >
          {episode.title}
        </div>

        <div className="episode-meta">
          {isPlayed && (
            <span
              className="category-tag"
              style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.4rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--color-success)',
              }}
            >
              PLAYED
            </span>
          )}
          <span>{episode.pubDate}</span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            {episode.durationFormatted}
          </span>
          {progressPercent > 0 && progressPercent < 95 && !isPlayed && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--accent-secondary)' }}>{progressPercent}% listened</span>
            </>
          )}
        </div>

        {/* Progress Bar Indicator */}
        {progressPercent > 0 && (
          <div
            style={{
              width: '100%',
              height: '3px',
              background: 'var(--border-subtle)',
              borderRadius: '99px',
              marginTop: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: isPlayed || progressPercent >= 95 ? 'var(--color-success)' : 'var(--accent-secondary)',
              }}
            />
          </div>
        )}

        {/* Expandable description */}
        {expanded && (
          <div
            style={{
              marginTop: '0.8rem',
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.8rem',
            }}
            dangerouslySetInnerHTML={{ __html: episode.description }}
          />
        )}
      </div>

      <div className="episode-actions">
        <button
          className="btn-icon"
          style={{
            width: '34px',
            height: '34px',
            color: isPlayed ? 'var(--color-success)' : undefined,
          }}
          onClick={() => togglePlayedEpisode(episode.id)}
          title={isPlayed ? 'Mark as Unplayed' : 'Mark as Played'}
        >
          <CheckCircle2 size={16} />
        </button>

        <button
          className="btn-icon"
          style={{ width: '34px', height: '34px' }}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Show Less' : 'Show Details'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <button
          className="btn-icon"
          style={{ width: '34px', height: '34px', color: isFav ? 'var(--color-danger)' : undefined }}
          onClick={() => toggleFavoriteEpisode(episode)}
          title={isFav ? 'Remove from Saved' : 'Save Episode'}
        >
          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
        </button>

        <button
          className="btn-icon"
          style={{ width: '34px', height: '34px' }}
          onClick={() => addToQueue(episode)}
          title="Add to Queue"
        >
          <ListPlus size={16} />
        </button>
      </div>
    </div>
  );
};
