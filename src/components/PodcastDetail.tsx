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
  } = usePlayer();

  const [filterQuery, setFilterQuery] = useState('');
  const [showBatchMenu, setShowBatchMenu] = useState(false);

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

  // Apply filters
  let displayedEpisodes = episodes;

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
    </div>
  );
};
