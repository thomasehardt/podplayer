import React, { useState, useMemo } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Car, Clock, X, Play, ListPlus, BookmarkPlus, Sparkles } from 'lucide-react';
import type { Episode, Podcast } from '../types/podcast';

interface CommuteModalProps {
  onClose: () => void;
}

export const CommuteModal: React.FC<CommuteModalProps> = ({ onClose }) => {
  const {
    subscriptions,
    selectedPodcast,
    podcastTags,
    isEpisodePlayed,
    playEpisode,
    addToQueue,
    createSmartPlaylist,
    playbackSpeed,
  } = usePlayer();

  const [targetMinutes, setTargetMinutes] = useState<number>(60);
  const [unplayedOnly, setUnplayedOnly] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [adjustForSpeed, setAdjustForSpeed] = useState<boolean>(true);

  const presets = [15, 30, 45, 60, 90, 120];

  // Extract all available tags across shows
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    subscriptions.forEach((show) => {
      const userTags = podcastTags[show.id] || [];
      const cats = show.categories || [];
      [...userTags, ...cats].forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [subscriptions, podcastTags]);

  // Generate optimal episode combination fitting target duration
  const commuteSelection = useMemo(() => {
    const effectiveTargetSeconds = (targetMinutes * 60) * (adjustForSpeed ? playbackSpeed : 1.0);

    const allShows: Podcast[] = [...subscriptions];
    if (selectedPodcast && !allShows.some((s) => s.id === selectedPodcast.id)) {
      allShows.push(selectedPodcast);
    }

    let candidates: Episode[] = [];
    allShows.forEach((show) => {
      if (selectedTag !== 'all') {
        const userTags = podcastTags[show.id] || [];
        const cats = show.categories || [];
        const combined = [...userTags, ...cats].map((t) => t.toLowerCase());
        if (!combined.includes(selectedTag.toLowerCase())) return;
      }
      if (show.episodes) {
        candidates.push(...show.episodes);
      }
    });

    if (unplayedOnly) {
      candidates = candidates.filter((ep) => !isEpisodePlayed(ep.id));
    }

    // Filter out invalid durations or episodes longer than total target
    candidates = candidates.filter((ep) => ep.duration && ep.duration > 0 && ep.duration <= effectiveTargetSeconds);

    // Sort newest first
    candidates.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Greedy Knapsack Selection
    const selected: Episode[] = [];
    let currentTotalSeconds = 0;

    for (const ep of candidates) {
      if (currentTotalSeconds + ep.duration <= effectiveTargetSeconds) {
        selected.push(ep);
        currentTotalSeconds += ep.duration;
      }
    }

    return {
      episodes: selected,
      totalSeconds: currentTotalSeconds,
      listeningTimeSeconds: currentTotalSeconds / (adjustForSpeed ? playbackSpeed : 1.0),
    };
  }, [subscriptions, selectedPodcast, podcastTags, targetMinutes, unplayedOnly, selectedTag, adjustForSpeed, playbackSpeed, isEpisodePlayed]);

  const handlePlayNow = () => {
    if (commuteSelection.episodes.length === 0) return;
    playEpisode(commuteSelection.episodes[0]);
    commuteSelection.episodes.slice(1).forEach((ep) => addToQueue(ep));
    onClose();
  };

  const handleAddAllToQueue = () => {
    commuteSelection.episodes.forEach((ep) => addToQueue(ep));
    onClose();
  };

  const handleSaveAsPlaylist = () => {
    createSmartPlaylist({
      name: `🚗 ${targetMinutes}m Commute Mix`,
      includeTags: selectedTag !== 'all' ? [selectedTag] : [],
      includePodcastIds: [],
      excludePodcastIds: [],
      unplayedOnly,
      maxDurationMinutes: targetMinutes,
      sortBy: 'newest',
      maxEpisodes: 10,
    });
    onClose();
  };

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}m ${s > 0 ? `${s}s` : ''}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Car size={22} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 800 }}>
                Commute & Drive Playlist Generator
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Auto-pack podcasts to fit your exact travel or drive time
              </div>
            </div>
          </div>
          <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Preset Duration Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            <Clock size={14} />
            TARGET DRIVE / LISTENING DURATION
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {presets.map((mins) => (
              <button
                key={mins}
                type="button"
                className={`btn-icon ${targetMinutes === mins ? 'active' : ''}`}
                style={{
                  width: 'auto',
                  padding: '0.4rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: targetMinutes === mins ? '1px solid var(--accent-primary)' : undefined,
                  background: targetMinutes === mins ? 'rgba(139, 92, 246, 0.2)' : undefined,
                  color: targetMinutes === mins ? 'var(--accent-primary)' : undefined,
                }}
                onClick={() => setTargetMinutes(mins)}
              >
                {mins} mins
              </button>
            ))}
          </div>

          {/* Custom Duration Range Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="range"
              min="10"
              max="180"
              step="5"
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', minWidth: '70px' }}>
              {targetMinutes} mins
            </span>
          </div>
        </div>

        {/* Filters & Options Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              FILTER CATEGORY / TAG
            </label>
            <select
              className="search-input"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{ width: '100%', paddingLeft: '0.8rem' }}
            >
              <option value="all">All Subscribed Categories</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1.2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={unplayedOnly}
                onChange={(e) => setUnplayedOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              Unplayed Episodes Only
            </label>

            {playbackSpeed !== 1.0 && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={adjustForSpeed}
                  onChange={(e) => setAdjustForSpeed(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                />
                Adjust for Speed ({playbackSpeed}x)
              </label>
            )}
          </div>
        </div>

        {/* Selection Results Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.2rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.88rem' }}>
              <Sparkles size={16} />
              <span>OPTIMAL MATCH: {commuteSelection.episodes.length} EPISODES</span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
              {formatMinSec(commuteSelection.totalSeconds)} audio ({formatMinSec(commuteSelection.listeningTimeSeconds)} at {playbackSpeed}x)
            </div>
          </div>

          {commuteSelection.episodes.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No combination of episodes found under {targetMinutes} minutes. Try selecting a longer duration or turning off "Unplayed Only".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {commuteSelection.episodes.map((ep, idx) => (
                <div
                  key={ep.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-secondary)',
                    padding: '0.5rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)', minWidth: '18px' }}>{idx + 1}.</span>
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.title}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.8rem', minWidth: '60px', textAlign: 'right' }}>
                    {ep.durationFormatted || formatMinSec(ep.duration)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-icon"
            style={{ width: 'auto', padding: '0 1rem', borderRadius: 'var(--radius-full)', gap: '6px' }}
            onClick={handleSaveAsPlaylist}
            disabled={commuteSelection.episodes.length === 0}
            title="Save as Smart Playlist"
          >
            <BookmarkPlus size={16} />
            <span>Save as Smart Playlist</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-icon"
              style={{ width: 'auto', padding: '0 1.2rem', borderRadius: 'var(--radius-full)', gap: '6px' }}
              onClick={handleAddAllToQueue}
              disabled={commuteSelection.episodes.length === 0}
            >
              <ListPlus size={16} />
              <span>Add to Queue</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handlePlayNow}
              disabled={commuteSelection.episodes.length === 0}
              style={{ gap: '6px' }}
            >
              <Play size={18} style={{ marginLeft: '2px' }} />
              <span>Start Drive Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
