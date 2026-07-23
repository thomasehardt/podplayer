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
import { FEATURED_PODCASTS } from './services/rssService';
import { storageService } from './services/storageService';
import { Sparkles, Bookmark, Heart, History, TrendingUp } from 'lucide-react';

const MainView: React.FC = () => {
  const {
    activeTab,
    searchQuery,
    searchResults,
    isSearching,
    subscriptions,
    favoriteEpisodes,
  } = usePlayer();

  const historyEpisodes = storageService.getHistory();

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
      return (
        <div>
          <h2 className="section-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bookmark style={{ color: 'var(--accent-primary)' }} />
              Subscribed Shows
            </span>
          </h2>
          <PodcastGrid
            podcasts={subscriptions}
            emptyMessage="You haven't subscribed to any podcasts yet. Explore podcasts in Discover or import a custom RSS feed!"
          />
        </div>
      );

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
    default:
      return (
        <div>
          {/* Featured Hero Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 2rem',
              marginBottom: '2.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem' }}>
              <Sparkles size={18} />
              <span>WELCOME TO PODPLAYER</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.4rem',
                fontWeight: 800,
                marginBottom: '0.8rem',
                letterSpacing: '-0.5px',
              }}
            >
              Stream Your Favorite Shows & RSS Feeds
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', lineHeight: '1.6' }}>
              Explore curated podcasts, search millions of shows via iTunes, customize playback speed, view dynamic audio visualizers, and resume where you left off.
            </p>
          </div>

          <h2 className="section-title">Featured Shows</h2>
          <PodcastGrid podcasts={FEATURED_PODCASTS} />
        </div>
      );
  }
};

const AppContent: React.FC = () => {
  const { openPlaylistModal, setOpenPlaylistModal } = usePlayer();

  return (
    <div className="app-container">
      <Sidebar />
      <Header />
      <main className="main-content">
        <MainView />
      </main>
      <PlayerBar />
      <QueueDrawer />
      <RssImportModal />
      {openPlaylistModal && <SmartPlaylistModal onClose={() => setOpenPlaylistModal(false)} />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
};

export default App;
