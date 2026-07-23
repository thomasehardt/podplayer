import React from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { PodcastGrid } from './components/PodcastGrid';
import { PodcastDetail } from './components/PodcastDetail';
import { EpisodeList } from './components/EpisodeList';
import { QueueDrawer } from './components/QueueDrawer';
import { RssImportModal } from './components/RssImportModal';
import { SmartPlaylistView } from './components/SmartPlaylistView';
import { SmartPlaylistModal } from './components/SmartPlaylistModal';
import { CommuteModal } from './components/CommuteModal';
import { SubscriptionsView } from './components/SubscriptionsView';
import { FEATURED_PODCASTS } from './services/rssService';
import { storageService } from './services/storageService';
import { Sparkles, Heart, History, TrendingUp, X } from 'lucide-react';

const MainView: React.FC = () => {
  const {
    activeTab,
    searchQuery,
    searchResults,
    isSearching,
    favoriteEpisodes,
  } = usePlayer();

  const historyEpisodes = storageService.getHistory();
  const [showHero, setShowHero] = React.useState(() => {
    return localStorage.getItem('podplayer_hero_dismissed') !== 'true';
  });

  // If user is actively searching
  if (searchQuery.trim()) {
    return (
      <div>
        <h2 className="section-title">
          Search Results for "{searchQuery}"
        </h2>
        {isSearching ? (
          <div className="loading-spinner">
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
          </div>
        ) : (
          <PodcastGrid podcasts={searchResults} emptyMessage="No podcasts found matching your search term." />
        )}
      </div>
    );
  }

  switch (activeTab) {
    case 'playlists':
      return <SmartPlaylistView />;

    case 'detail':
      return <PodcastDetail />;

    case 'subscriptions':
      return <SubscriptionsView />;

    case 'favorites':
      return (
        <div>
          <h2 className="section-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Heart style={{ color: 'var(--color-danger)' }} />
              Saved Episodes
            </span>
          </h2>
          <EpisodeList
            episodes={favoriteEpisodes}
            emptyMessage="No saved episodes yet. Click the heart icon on any episode card to save it here for later."
          />
        </div>
      );

    case 'history':
      return (
        <div>
          <h2 className="section-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <History style={{ color: 'var(--accent-secondary)' }} />
              Listening History
            </span>
          </h2>
          <EpisodeList
            episodes={historyEpisodes}
            emptyMessage="No listening history yet. Start playing episodes to track your listening history."
          />
        </div>
      );

    case 'top':
      return (
        <div>
          <h2 className="section-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <TrendingUp style={{ color: 'var(--color-warning)' }} />
              Top Charts
            </span>
          </h2>
          <PodcastGrid podcasts={FEATURED_PODCASTS} />
        </div>
      );

    case 'discover':
    default: {
      const dismissHero = () => {
        setShowHero(false);
        localStorage.setItem('podplayer_hero_dismissed', 'true');
      };

      return (
        <div>
          {/* Featured Hero Banner */}
          {showHero && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.2rem 2.5rem',
                marginBottom: '2.5rem',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <button
                className="btn-icon"
                onClick={dismissHero}
                style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', width: '32px', height: '32px' }}
                title="Dismiss Banner"
              >
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem' }}>
                <Sparkles size={18} />
                <span>WELCOME TO PODPLAYER</span>
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  marginBottom: '0.8rem',
                  letterSpacing: '-0.5px',
                }}
              >
                Stream Your Favorite Shows & RSS Feeds
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', lineHeight: '1.6' }}>
                Explore curated podcasts, search millions of shows via iTunes, customize playback speed, view dynamic audio visualizers, and resume where you left off.
              </p>
            </div>
          )}

          <h2 className="section-title">Featured Shows</h2>
          <PodcastGrid podcasts={FEATURED_PODCASTS} />
        </div>
      );
    }
  }
};


import { ExpandedPlayerModal } from './components/ExpandedPlayerModal';

const AppContent: React.FC = () => {
  const { currentEpisode, openPlaylistModal, setOpenPlaylistModal, openCommuteModal, setOpenCommuteModal, isPlayerExpanded } = usePlayer();

  return (
    <div className={`app-container ${!currentEpisode ? 'no-player' : ''}`}>
      <Sidebar />
      <Header />
      <main className="main-content">
        <MainView />
      </main>
      <PlayerBar />
      <QueueDrawer />
      <RssImportModal />
      {openPlaylistModal && <SmartPlaylistModal onClose={() => setOpenPlaylistModal(false)} />}
      {openCommuteModal && <CommuteModal onClose={() => setOpenCommuteModal(false)} />}
      {isPlayerExpanded && <ExpandedPlayerModal />}
    </div>
  );
};

import { PopoutPlayerView } from './components/PopoutPlayerView';

export const App: React.FC = () => {
  const isPopout = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('popout') === 'true';

  return (
    <PlayerProvider>
      {isPopout ? <PopoutPlayerView /> : <AppContent />}
    </PlayerProvider>
  );
};

export default App;
