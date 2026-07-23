import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { EpisodeList } from './EpisodeList';
import { DEFAULT_PODCAST_ARTWORK } from '../services/rssService';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Search,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCheck,
  RotateCcw,
  X,
  Sliders,
  Gauge,
  ArrowDownUp,
  Download,
} from 'lucide-react';

export const PodcastDetail: React.FC = () => {
  const {
    selectedPodcast,
    isFeedLoading,
    isSubscribed,
    toggleSubscription,
    setActiveTab,
    isEpisodePlayed,
    markAllEpisodesPlayed,
    markAllEpisodesUnplayed,
    hidePlayedEpisodes,
    toggleHidePlayedEpisodes,
    getPodcastTags,
    addTagToPodcast,
    removeTagFromPodcast,
    getPodcastShowSettings,
    updatePodcastShowSettings,
    openPodcastDetail,
    playbackSpeed,
  } = usePlayer();

  const [filterQuery, setFilterQuery] = useState('');
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  if (!selectedPodcast) {
    return (
      <div>
        <button className="btn-icon" onClick={() => setActiveTab('discover')}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>No podcast selected.</div>
      </div>
    );
  }

  const subscribed = isSubscribed(selectedPodcast.id);
  const episodes = selectedPodcast.episodes || [];

  // Count played & unplayed
  const playedCount = episodes.filter((e) => isEpisodePlayed(e.id)).length;
  const unplayedCount = episodes.length - playedCount;

  // Apply sorting & filters
  const showSettings = getPodcastShowSettings(selectedPodcast.id);
  const sortOrder = showSettings.sortOrder || 'newest';

  let displayedEpisodes = [...episodes];

  if (sortOrder === 'oldest') {
    displayedEpisodes.reverse();
  }

  if (hidePlayedEpisodes) {
    displayedEpisodes = displayedEpisodes.filter((e) => !isEpisodePlayed(e.id));
  }

  if (filterQuery.trim()) {
    const q = filterQuery.toLowerCase();
    displayedEpisodes = displayedEpisodes.filter(
      (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button
        className="btn-icon"
        onClick={() => setActiveTab('discover')}
        style={{ marginBottom: '1.5rem' }}
        title="Back to Discover"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Podcast Header Banner */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-start',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
        }}
      >
        <img
          src={selectedPodcast.artworkUrl}
          alt={selectedPodcast.title}
          style={{
            width: '200px',
            height: '200px',
            borderRadius: 'var(--radius-md)',
            objectFit: 'cover',
            boxShadow: 'var(--shadow-lg)',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PODCAST_ARTWORK;
          }}
        />

        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedPodcast.categories.map((cat, idx) => (
              <span key={idx} className="category-tag">
                {cat}
              </span>
            ))}
            {getPodcastTags(selectedPodcast.id).map((tag) => (
              <span key={tag} className="category-tag" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-secondary)' }}>
                {tag}
                <X
                  size={12}
                  style={{ marginLeft: '4px', cursor: 'pointer' }}
                  onClick={() => removeTagFromPodcast(selectedPodcast.id, tag)}
                />
              </span>
            ))}
            <button
              type="button"
              className="category-tag"
              style={{ background: 'var(--bg-surface-hover)', cursor: 'pointer', border: '1px dashed var(--border-strong)' }}
              onClick={() => {
                const tag = prompt('Enter a custom tag for this show (e.g. Work, Commute, Favorites):');
                if (tag && tag.trim()) {
                  addTagToPodcast(selectedPodcast.id, tag.trim());
                }
              }}
            >
              + Tag
            </button>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.2rem',
              fontWeight: 800,
              marginBottom: '0.5rem',
              lineHeight: '1.2',
            }}
          >
            {selectedPodcast.title}
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '1rem' }}>
            {selectedPodcast.author}
          </p>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            {selectedPodcast.description}
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => toggleSubscription(selectedPodcast)}>
              {subscribed ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              <span>{subscribed ? 'Subscribed' : 'Subscribe to Show'}</span>
            </button>

            <button
              className="btn-icon"
              style={{ width: 'auto', padding: '0 1rem', borderRadius: 'var(--radius-full)', gap: '6px', fontSize: '0.85rem' }}
              onClick={() => setShowPreferencesModal(true)}
              title="Podcast Rules & Preferences"
            >
              <Sliders size={16} />
              <span>Show Rules & Options</span>
            </button>

            {selectedPodcast.website && (
              <a
                href={selectedPodcast.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-icon"
                style={{ width: 'auto', padding: '0 1rem', borderRadius: 'var(--radius-full)', gap: '6px' }}
                title="Visit Website"
              >
                <ExternalLink size={16} />
                <span style={{ fontSize: '0.85rem' }}>Website</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Episode Feed Header & Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700 }}>
            Episodes ({episodes.length})
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {unplayedCount} unplayed • {playedCount} played
            {hidePlayedEpisodes && playedCount > 0 && (
              <span style={{ color: 'var(--accent-secondary)', marginLeft: '6px' }}>
                ({playedCount} hidden)
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Hide / Show Played Toggle */}
          <button
            className={`btn-icon ${hidePlayedEpisodes ? 'active' : ''}`}
            style={{
              width: 'auto',
              padding: '0 0.8rem',
              borderRadius: 'var(--radius-full)',
              gap: '6px',
              fontSize: '0.82rem',
              color: hidePlayedEpisodes ? 'var(--accent-primary)' : undefined,
              borderColor: hidePlayedEpisodes ? 'var(--accent-primary)' : undefined,
            }}
            onClick={toggleHidePlayedEpisodes}
            title={hidePlayedEpisodes ? 'Show Played Episodes' : 'Hide Played Episodes'}
          >
            {hidePlayedEpisodes ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{hidePlayedEpisodes ? 'Hide Played: ON' : 'Hide Played: OFF'}</span>
          </button>

          {/* Batch Mark Options Menu */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn-icon"
              style={{ width: 'auto', padding: '0 0.8rem', borderRadius: 'var(--radius-full)', gap: '6px', fontSize: '0.82rem' }}
              onClick={() => setShowBatchMenu(!showBatchMenu)}
              title="Batch Mark Options"
            >
              <CheckCheck size={15} />
              <span>Mark Actions</span>
            </button>

            {showBatchMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '45px',
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
                  width: '230px',
                }}
              >
                <button
                  style={{
                    padding: '0.5rem 0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    border: 'none',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => {
                    markAllEpisodesPlayed(episodes, 0);
                    setShowBatchMenu(false);
                  }}
                >
                  <CheckCheck size={15} style={{ color: 'var(--color-success)' }} />
                  Mark ALL as Played
                </button>

                <button
                  style={{
                    padding: '0.5rem 0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    border: 'none',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => {
                    markAllEpisodesPlayed(episodes, 3);
                    setShowBatchMenu(false);
                  }}
                >
                  <CheckCheck size={15} style={{ color: 'var(--accent-secondary)' }} />
                  Mark All EXCEPT Latest 3
                </button>

                <button
                  style={{
                    padding: '0.5rem 0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    border: 'none',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => {
                    markAllEpisodesUnplayed(episodes);
                    setShowBatchMenu(false);
                  }}
                >
                  <RotateCcw size={15} />
                  Reset ALL to Unplayed
                </button>
              </div>
            )}
          </div>

          {/* Search Filter input */}
          <div className="search-container" style={{ width: '220px' }}>
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Filter..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ padding: '0.45rem 1rem 0.45rem 2.2rem', fontSize: '0.82rem' }}
            />
          </div>
        </div>
      </div>

      {/* Episode list */}
      {isFeedLoading ? (
        <div className="loading-spinner">
          <div className="wave-bar" />
          <div className="wave-bar" />
          <div className="wave-bar" />
        </div>
      ) : (selectedPodcast as any).feedError ? (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            textAlign: 'center',
            color: '#f87171',
          }}
        >
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Unable to Load Episode List</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
            {(selectedPodcast as any).feedError}
          </p>
          <button className="btn-primary" onClick={() => openPodcastDetail(selectedPodcast)}>
            <RotateCcw size={16} />
            <span>Retry Fetching Feed</span>
          </button>
        </div>
      ) : (
        <EpisodeList
          episodes={displayedEpisodes}
          emptyMessage={
            hidePlayedEpisodes && playedCount > 0
              ? `All ${playedCount} episodes are marked as played! Click "Hide Played: ON" above to view played episodes.`
              : 'No episodes match your search query.'
          }
        />
      )}
      {/* Show Preferences & Rules Modal */}
      {showPreferencesModal && (
        <div className="modal-overlay" onClick={() => setShowPreferencesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sliders size={22} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700 }}>
                  Show Rules & Preferences
                </h3>
              </div>
              <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => setShowPreferencesModal(false)}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Custom playback speed, episode ordering, and auto-downloading rules for <strong>{selectedPodcast.title}</strong>.
            </p>

            {/* Custom Playback Speed */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <Gauge size={14} />
                DEFAULT PLAYBACK SPEED FOR THIS SHOW
              </label>
              <select
                className="search-input"
                value={getPodcastShowSettings(selectedPodcast.id).playbackSpeed || 0}
                onChange={(e) => updatePodcastShowSettings(selectedPodcast.id, { playbackSpeed: Number(e.target.value) || undefined })}
                style={{ width: '100%', paddingLeft: '0.8rem' }}
              >
                <option value={0}>Use Global Speed ({playbackSpeed}x)</option>
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x (Normal Speed)</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.75}>1.75x</option>
                <option value={2.0}>2.0x</option>
                <option value={3.0}>3.0x</option>
              </select>
            </div>

            {/* Episode Ordering / Sorting */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <ArrowDownUp size={14} />
                EPISODE ORDERING
              </label>
              <select
                className="search-input"
                value={getPodcastShowSettings(selectedPodcast.id).sortOrder || 'newest'}
                onChange={(e) => updatePodcastShowSettings(selectedPodcast.id, { sortOrder: e.target.value as 'newest' | 'oldest' })}
                style={{ width: '100%', paddingLeft: '0.8rem' }}
              >
                <option value="newest">Newest First (Standard Podcasts)</option>
                <option value="oldest">Oldest First (Story / Serial Podcasts)</option>
              </select>
            </div>

            {/* Auto Download Count */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <Download size={14} />
                AUTO-PRECACHE LATEST EPISODES TO LOCAL SERVER
              </label>
              <select
                className="search-input"
                value={getPodcastShowSettings(selectedPodcast.id).autoDownloadCount || 0}
                onChange={(e) => updatePodcastShowSettings(selectedPodcast.id, { autoDownloadCount: Number(e.target.value) })}
                style={{ width: '100%', paddingLeft: '0.8rem' }}
              >
                <option value={0}>Disabled (Stream on Demand)</option>
                <option value={1}>Auto-Cache Latest 1 Episode</option>
                <option value={3}>Auto-Cache Latest 3 Episodes</option>
                <option value={5}>Auto-Cache Latest 5 Episodes</option>
                <option value={10}>Auto-Cache Latest 10 Episodes</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowPreferencesModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
