import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { 
  Radio, 
  Compass, 
  TrendingUp, 
  Bookmark, 
  History, 
  Heart, 
  PlusCircle,
  ListFilter,
  Plus
} from 'lucide-react';
import type { NavigationTab } from '../types/podcast';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    subscriptions = [], 
    favoriteEpisodes = [], 
    setOpenRssModal,
    smartPlaylists = [],
    setSelectedSmartPlaylist,
    setOpenPlaylistModal,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = usePlayer();

  const handleNavClick = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'discover', label: 'Discover', icon: <Compass size={19} /> },
    { id: 'top', label: 'Top Charts', icon: <TrendingUp size={19} /> },
    { id: 'subscriptions', label: 'Subscribed Shows', icon: <Bookmark size={19} />, badge: subscriptions.length },
    { id: 'favorites', label: 'Saved Episodes', icon: <Heart size={19} />, badge: favoriteEpisodes.length },
    { id: 'history', label: 'Listening History', icon: <History size={19} /> },
  ];

  return (
    <>
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`app-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand-logo">
          <Radio className="brand-icon" />
          <span>PodPlayer</span>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Menu</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="category-tag" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

      {/* Smart Playlists Section */}
      <div className="nav-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '0.5rem' }}>
          <div className="nav-section-title">Smart Playlists</div>
          <button
            className="btn-icon"
            style={{ width: '24px', height: '24px', border: 'none' }}
            onClick={() => setOpenPlaylistModal(true)}
            title="New Smart Playlist"
          >
            <Plus size={14} />
          </button>
        </div>

        {smartPlaylists.map((pl) => (
          <button
            key={pl.id}
            className={`nav-item ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => {
              setSelectedSmartPlaylist(pl);
              setActiveTab('playlists');
              setIsMobileMenuOpen(false);
            }}
          >
            <ListFilter size={17} style={{ color: 'var(--accent-secondary)' }} />
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</span>
          </button>
        ))}
      </div>

      <div className="nav-section" style={{ marginTop: 'auto' }}>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOpenRssModal(true)}>
          <PlusCircle size={18} />
          <span>Add Custom RSS</span>
        </button>
      </div>
    </aside>
  </>
  );
};
