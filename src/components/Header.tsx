import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Search, Moon, Sun, ListMusic, Rss, Menu, X, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    settings,
    updateSettings,
    queue,
    isQueueOpen,
    setIsQueueOpen,
    setOpenRssModal,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    username,
  } = usePlayer();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setActiveTab('discover');
    }
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
        <button
          className="btn-icon mobile-menu-btn"
          title="Toggle Navigation Menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search podcasts, topics, or creators..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="header-actions">
        <button
          className="btn-icon"
          title="Import RSS Feed URL"
          onClick={() => setOpenRssModal(true)}
        >
          <Rss size={18} />
        </button>

        <button
          className="btn-icon"
          title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          onClick={toggleTheme}
        >
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className={`btn-icon ${isQueueOpen ? 'active' : ''}`}
          title="Up Next Queue"
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          style={isQueueOpen ? { borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' } : {}}
        >
          <ListMusic size={18} />
          {queue.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--accent-primary)',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.65rem',
                fontWeight: '700',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {queue.length}
            </span>
          )}
        </button>

        {username && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {username}
            </span>
            <button
              className="btn-icon"
              title="Log out"
              onClick={() => {
                window.location.href = 'https://auth.thomasehardt.com/logout';
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
