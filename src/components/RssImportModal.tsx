import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { X, Rss, Plus, FileSpreadsheet, Upload, Download, CheckCircle2 } from 'lucide-react';

export const RssImportModal: React.FC = () => {
  const {
    openRssModal,
    setOpenRssModal,
    importCustomRss,
    importOpmlFile,
    exportOpmlFile,
    subscriptions,
    isFeedLoading,
    setActiveTab,
  } = usePlayer();

  const [activeMode, setActiveMode] = useState<'url' | 'opml'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [opmlStatus, setOpmlStatus] = useState<string | null>(null);
  const [isImportingOpml, setIsImportingOpml] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!openRssModal) return null;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    importCustomRss(urlInput.trim());
  };

  const processOpmlFile = async (file: File) => {
    setIsImportingOpml(true);
    setOpmlStatus(null);
    try {
      const count = await importOpmlFile(file);
      setOpmlStatus(`Successfully imported ${count} podcast subscriptions!`);
      setTimeout(() => {
        setOpenRssModal(false);
        setActiveTab('subscriptions');
      }, 1500);
    } catch (err: any) {
      setOpmlStatus(`Error: ${err.message || err}`);
    } finally {
      setIsImportingOpml(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processOpmlFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processOpmlFile(file);
  };

  const sampleFeeds = [
    { label: 'Syntax.fm (Web Dev)', url: 'https://feed.syntax.fm' },
    { label: 'Huberman Lab (Science)', url: 'https://feeds.megaphone.fm/hubermanlab' },
    { label: 'ShopTalk Show (CSS & JS)', url: 'https://shoptalkshow.com/feed/podcast/' },
    { label: 'Design Details', url: 'https://feeds.simplecast.com/eew_vyNL' },
  ];

  return (
    <div className="modal-overlay" onClick={() => setOpenRssModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Rss size={22} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700 }}>
              Import Podcasts & Feeds
            </h3>
          </div>
          <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => setOpenRssModal(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            background: 'var(--bg-surface-hover)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeMode === 'url' ? 'var(--accent-primary)' : 'transparent',
              color: activeMode === 'url' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={() => setActiveMode('url')}
          >
            <Rss size={15} />
            Single RSS Feed
          </button>

          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeMode === 'opml' ? 'var(--accent-primary)' : 'transparent',
              color: activeMode === 'opml' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={() => setActiveMode('opml')}
          >
            <FileSpreadsheet size={15} />
            OPML File Import
          </button>
        </div>

        {/* Single URL Tab */}
        {activeMode === 'url' ? (
          <form onSubmit={handleUrlSubmit}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Paste the direct RSS XML feed URL of any podcast to import its full catalog.
            </p>

            <input
              type="url"
              className="search-input"
              placeholder="https://example.com/podcast/feed.xml"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{ width: '100%', marginBottom: '1.2rem', paddingLeft: '1rem' }}
              required
            />

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.6rem' }}>
                OR TRY A QUICK SAMPLE FEED:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {sampleFeeds.map((feed) => (
                  <button
                    type="button"
                    key={feed.url}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-surface-hover)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={() => setUrlInput(feed.url)}
                  >
                    <Plus size={12} />
                    {feed.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-icon"
                style={{ width: 'auto', padding: '0 1.2rem', borderRadius: 'var(--radius-full)' }}
                onClick={() => setOpenRssModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isFeedLoading}>
                {isFeedLoading ? 'Parsing Feed...' : 'Import & Subscribe'}
              </button>
            </div>
          </form>
        ) : (
          /* OPML File Import Tab */
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Upload an OPML file exported from Apple Podcasts, Overcast, Pocket Casts, AntennaPod, or gPodder to import your complete show subscriptions list.
            </p>

            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.8rem',
                border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '2.5rem 1rem',
                cursor: 'pointer',
                background: isDragging ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-card)',
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
            >
              <Upload size={32} style={{ color: isDragging ? 'var(--accent-secondary)' : 'var(--accent-primary)' }} />
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {isDragging ? 'Drop OPML file here...' : 'Click or Drag & Drop OPML file here'}
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Supports .opml or .xml files exported from any podcast app
                </p>
              </div>
              <input
                type="file"
                accept=".opml,.xml"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={isImportingOpml}
              />
            </label>

            {opmlStatus && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: opmlStatus.startsWith('Error')
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                  color: opmlStatus.startsWith('Error')
                    ? 'var(--color-danger)'
                    : 'var(--color-success)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {!opmlStatus.startsWith('Error') && <CheckCircle2 size={16} />}
                {opmlStatus}
              </div>
            )}

            {/* Export OPML Section */}
            {subscriptions.length > 0 && (
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Export your {subscriptions.length} subscribed show(s) to OPML:
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  style={{ width: 'auto', padding: '0 0.8rem', borderRadius: 'var(--radius-full)', gap: '6px' }}
                  onClick={exportOpmlFile}
                >
                  <Download size={14} />
                  <span style={{ fontSize: '0.8rem' }}>Export OPML</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
