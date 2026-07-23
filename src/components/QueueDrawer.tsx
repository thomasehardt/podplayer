import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { DEFAULT_PODCAST_ARTWORK } from '../services/rssService';
import type { QueueItem } from '../types/podcast';
import { X, Trash2, Play, Pause, MoveUp, MoveDown, ListMusic, GripVertical } from 'lucide-react';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
    removeFromQueue,
    clearQueue,
    moveQueueItem,
    playEpisode,
    currentEpisode,
    isPlaying,
    togglePlayPause,
  } = usePlayer();

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  if (!isQueueOpen) return null;

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== targetIdx) {
      moveQueueItem(draggedIdx, targetIdx);
    }
    setDraggedIdx(null);
  };

  return (
    <div className="queue-drawer">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ListMusic size={20} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
            Queue ({(currentEpisode ? 1 : 0) + queue.length})
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {queue.length > 0 && (
            <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={clearQueue} title="Clear Queue">
              <Trash2 size={15} />
            </button>
          )}
          <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => setIsQueueOpen(false)} title="Close Drawer">
            <X size={15} />
          </button>
        </div>
      </div>

      {!currentEpisode && queue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <p>Your queue is empty.</p>
          <p style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>
            Add episodes to your queue using the queue button on any episode card.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, paddingRight: '0.3rem' }}>
          {currentEpisode && (
            <div
              style={{
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div style={{ width: '16px', flexShrink: 0 }} />
              <img
                src={currentEpisode.artworkUrl || currentEpisode.podcastArtwork || DEFAULT_PODCAST_ARTWORK}
                alt={currentEpisode.title}
                style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PODCAST_ARTWORK;
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    marginBottom: '0.15rem',
                    letterSpacing: '0.03em',
                  }}
                >
                  NOW PLAYING
                </div>
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentEpisode.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {currentEpisode.podcastTitle}
                </div>
              </div>
              <button
                className="btn-icon"
                style={{ width: '28px', height: '28px' }}
                onClick={togglePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              </button>
            </div>
          )}

          {queue.length === 0 && currentEpisode && (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Nothing queued next. Add episodes using the queue button on any episode card.
            </div>
          )}

          {queue.map((item: QueueItem, idx: number) => (
            <div
              key={`${item.episode.id}-${idx}`}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              style={{
                background: 'var(--bg-card)',
                border: draggedIdx === idx ? '1px dashed var(--accent-primary)' : '1px solid var(--border-subtle)',
                opacity: draggedIdx === idx ? 0.6 : 1,
                borderRadius: 'var(--radius-md)',
                padding: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'grab',
              }}
            >
              <GripVertical size={16} style={{ color: 'var(--text-dim)', flexShrink: 0, cursor: 'grab' }} />
              <img
                src={item.episode.artworkUrl || item.episode.podcastArtwork || DEFAULT_PODCAST_ARTWORK}
                alt={item.episode.title}
                style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PODCAST_ARTWORK;
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                  }}
                  onClick={() => playEpisode(item.episode)}
                >
                  {item.episode.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.episode.podcastTitle}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <button
                  className="btn-icon"
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => playEpisode(item.episode)}
                  title="Play Now"
                >
                  <Play size={13} />
                </button>

                {idx > 0 && (
                  <button
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => moveQueueItem(idx, idx - 1)}
                    title="Move Up"
                  >
                    <MoveUp size={13} />
                  </button>
                )}

                {idx < queue.length - 1 && (
                  <button
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                    onClick={() => moveQueueItem(idx, idx + 1)}
                    title="Move Down"
                  >
                    <MoveDown size={13} />
                  </button>
                )}

                <button
                  className="btn-icon"
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => removeFromQueue(item.episode.id)}
                  title="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
