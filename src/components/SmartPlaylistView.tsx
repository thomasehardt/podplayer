import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { EpisodeList } from './EpisodeList';
import { SmartPlaylistModal } from './SmartPlaylistModal';
import { ListFilter, Play, ListPlus, Edit3, ArrowLeft } from 'lucide-react';

export const SmartPlaylistView: React.FC = () => {
  const {
    selectedSmartPlaylist,
    evaluateSmartPlaylist,
    playEpisode,
    addToQueue,
    setActiveTab,
  } = usePlayer();

  const [isEditing, setIsEditing] = useState(false);

  if (!selectedSmartPlaylist) {
    return (
      <div>
        <button className="btn-icon" onClick={() => setActiveTab('discover')}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>No playlist selected.</div>
      </div>
    );
  }

  const matchingEpisodes = evaluateSmartPlaylist(selectedSmartPlaylist);

  const handlePlayAll = () => {
    if (matchingEpisodes.length === 0) return;
    playEpisode(matchingEpisodes[0]);
    // Queue remaining
    matchingEpisodes.slice(1).forEach((ep) => addToQueue(ep));
  };

  const handleAddAllToQueue = () => {
    matchingEpisodes.forEach((ep) => addToQueue(ep));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button
        className="btn-icon"
        onClick={() => setActiveTab('playlists')}
        style={{ marginBottom: '1.5rem' }}
        title="Back to Playlists"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Playlist Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          <ListFilter size={18} />
          <span>SMART PLAYLIST</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2.2rem',
            fontWeight: 800,
            marginBottom: '0.5rem',
          }}
        >
          {selectedSmartPlaylist.name}
        </h1>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {selectedSmartPlaylist.unplayedOnly && <span className="category-tag">Unplayed Only</span>}
          {selectedSmartPlaylist.maxDurationMinutes && <span className="category-tag">&lt; {selectedSmartPlaylist.maxDurationMinutes} mins</span>}
          {selectedSmartPlaylist.includeTags.map((tag: string) => (
            <span key={tag} className="category-tag" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-secondary)' }}>
              Tag: {tag}
            </span>
          ))}
          <span className="category-tag">Sort: {selectedSmartPlaylist.sortBy}</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {matchingEpisodes.length > 0 && (
            <>
              <button className="btn-primary" onClick={handlePlayAll}>
                <Play size={18} style={{ marginLeft: '2px' }} />
                <span>Play Playlist ({matchingEpisodes.length})</span>
              </button>

              <button
                className="btn-icon"
                style={{ width: 'auto', padding: '0 1.2rem', borderRadius: 'var(--radius-full)', gap: '6px' }}
                onClick={handleAddAllToQueue}
              >
                <ListPlus size={16} />
                <span>Add All to Queue</span>
              </button>
            </>
          )}

          <button
            className="btn-icon"
            style={{ width: 'auto', padding: '0 1rem', borderRadius: 'var(--radius-full)', gap: '6px' }}
            onClick={() => setIsEditing(true)}
          >
            <Edit3 size={16} />
            <span>Edit Rules</span>
          </button>
        </div>
      </div>

      {/* Episode Feed */}
      <h2 className="section-title" style={{ fontSize: '1.4rem' }}>
        Matching Episodes ({matchingEpisodes.length})
      </h2>

      <EpisodeList
        episodes={matchingEpisodes}
        emptyMessage="No episodes match this Smart Playlist's rules. Try editing the tags, duration limit, or unplayed filter."
      />

      {isEditing && (
        <SmartPlaylistModal
          editPlaylist={selectedSmartPlaylist}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};
