import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { X, ListFilter, Plus, Trash2 } from 'lucide-react';
import type { SmartPlaylistRule } from '../types/podcast';

interface SmartPlaylistModalProps {
  editPlaylist?: SmartPlaylistRule | null;
  onClose: () => void;
}

export const SmartPlaylistModal: React.FC<SmartPlaylistModalProps> = ({ editPlaylist, onClose }) => {
  const { createSmartPlaylist, updateSmartPlaylist, deleteSmartPlaylist } = usePlayer();

  const [name, setName] = useState(editPlaylist?.name || '');
  const [unplayedOnly, setUnplayedOnly] = useState(editPlaylist?.unplayedOnly ?? true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'shortest' | 'longest'>(editPlaylist?.sortBy || 'newest');
  const [maxEpisodes, setMaxEpisodes] = useState(editPlaylist?.maxEpisodes || 20);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(editPlaylist?.maxDurationMinutes || 0);

  // Tag inputs
  const [tagInput, setTagInput] = useState('');
  const [includeTags, setIncludeTags] = useState<string[]>(editPlaylist?.includeTags || []);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !includeTags.includes(trimmed)) {
      setIncludeTags([...includeTags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setIncludeTags(includeTags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const playlistData: Omit<SmartPlaylistRule, 'id'> = {
      name: name.trim(),
      includeTags,
      includePodcastIds: [],
      excludePodcastIds: [],
      unplayedOnly,
      sortBy,
      maxEpisodes: Number(maxEpisodes),
      maxDurationMinutes: Number(maxDurationMinutes),
    };

    if (editPlaylist) {
      updateSmartPlaylist(editPlaylist.id, playlistData);
    } else {
      createSmartPlaylist(playlistData);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ListFilter size={22} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700 }}>
              {editPlaylist ? 'Edit Smart Playlist' : 'Create Smart Playlist'}
            </h3>
          </div>
          <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Playlist Name */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              PLAYLIST NAME
            </label>
            <input
              type="text"
              className="search-input"
              placeholder="e.g. Daily Commute, Tech News..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', paddingLeft: '1rem' }}
              required
            />
          </div>

          {/* Include Tags / Categories */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              MATCH TAGS & CATEGORIES (Leave empty to match all)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Add tag (e.g. Technology, Work, Commute)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                style={{ flex: 1, paddingLeft: '1rem' }}
              />
              <button
                type="button"
                className="btn-icon"
                style={{ width: 'auto', padding: '0 1rem', borderRadius: 'var(--radius-full)' }}
                onClick={handleAddTag}
              >
                <Plus size={16} />
                <span>Add Tag</span>
              </button>
            </div>

            {includeTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {includeTags.map((tag) => (
                  <span
                    key={tag}
                    className="category-tag"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.2rem 0.6rem' }}
                  >
                    {tag}
                    <X
                      size={12}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rule options grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            {/* Sort Order */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                SORT ORDER
              </label>
              <select
                className="search-input"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                style={{ width: '100%', paddingLeft: '0.8rem' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="shortest">Shortest Duration First</option>
                <option value="longest">Longest Duration First</option>
              </select>
            </div>

            {/* Max Episodes Limit */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                EPISODE LIMIT
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="search-input"
                placeholder="20"
                value={maxEpisodes}
                onChange={(e) => setMaxEpisodes(Number(e.target.value))}
                style={{ width: '100%', paddingLeft: '0.8rem' }}
              />
            </div>
          </div>

          {/* Max Duration Minutes & Unplayed Only */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                MAX DURATION (MINS)
              </label>
              <input
                type="number"
                min="0"
                className="search-input"
                placeholder="0 = No Limit"
                value={maxDurationMinutes}
                onChange={(e) => setMaxDurationMinutes(Number(e.target.value))}
                style={{ width: '100%', paddingLeft: '0.8rem' }}
              />
            </div>

            <div style={{ paddingTop: '1.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={unplayedOnly}
                  onChange={(e) => setUnplayedOnly(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                />
                Unplayed Episodes Only
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {editPlaylist ? (
              <button
                type="button"
                className="btn-icon"
                style={{ color: 'var(--color-danger)' }}
                onClick={() => {
                  deleteSmartPlaylist(editPlaylist.id);
                  onClose();
                }}
                title="Delete Smart Playlist"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-icon"
                style={{ width: 'auto', padding: '0 1.2rem', borderRadius: 'var(--radius-full)' }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editPlaylist ? 'Save Changes' : 'Create Smart Playlist'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
