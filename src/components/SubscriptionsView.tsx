import React, { useState, useMemo } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { PodcastGrid } from './PodcastGrid';
import { Bookmark, Tag, Search } from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const { subscriptions, podcastTags } = usePlayer();

  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'alpha-asc' | 'alpha-desc' | 'default'>('alpha-asc');
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Extract all unique tags & categories across subscriptions with episode/show counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    subscriptions.forEach((show) => {
      const userTags = podcastTags[show.id] || [];
      const categories = show.categories || [];
      const allForShow = Array.from(new Set([...userTags, ...categories]));
      allForShow.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [subscriptions, podcastTags]);

  const availableTags = useMemo(() => {
    return Object.keys(tagCounts).sort((a, b) => a.localeCompare(b));
  }, [tagCounts]);

  // Filter and sort podcasts
  const processedSubscriptions = useMemo(() => {
    let list = [...subscriptions];

    // Filter by search query
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (show) => show.title.toLowerCase().includes(q) || show.author.toLowerCase().includes(q)
      );
    }

    // Filter by selected tag
    if (selectedTag !== 'all') {
      list = list.filter((show) => {
        const userTags = podcastTags[show.id] || [];
        const categories = show.categories || [];
        const combined = [...userTags, ...categories].map((t) => t.toLowerCase());
        return combined.includes(selectedTag.toLowerCase());
      });
    }

    // Sort alphabetically or default
    if (sortBy === 'alpha-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    } else if (sortBy === 'alpha-desc') {
      list.sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: 'base' }));
    }

    return list;
  }, [subscriptions, podcastTags, selectedTag, sortBy, filterQuery]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: '0.2rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bookmark style={{ color: 'var(--accent-primary)' }} />
              Subscribed Shows ({subscriptions.length})
            </span>
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sorted alphabetically • Filter by category or tag
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Quick Filter Input */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Filter subscriptions..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.3rem', fontSize: '0.85rem', height: '36px' }}
            />
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <select
              className="search-input"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              style={{ paddingLeft: '0.8rem', paddingRight: '1.8rem', fontSize: '0.85rem', height: '36px' }}
            >
              <option value="alpha-asc">Alphabetical (A - Z)</option>
              <option value="alpha-desc">Alphabetical (Z - A)</option>
              <option value="default">Default Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category / Tag Filter Bar */}
      {availableTags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.4rem' }}>
            <Tag size={14} />
            <span>TAGS:</span>
          </div>

          <button
            type="button"
            className={`category-tag ${selectedTag === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTag('all')}
            style={{
              cursor: 'pointer',
              background: selectedTag === 'all' ? 'var(--accent-primary)' : undefined,
              color: selectedTag === 'all' ? '#fff' : undefined,
              padding: '0.3rem 0.8rem',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            All Shows ({subscriptions.length})
          </button>

          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`category-tag ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
              style={{
                cursor: 'pointer',
                background: selectedTag === tag ? 'var(--accent-primary)' : undefined,
                color: selectedTag === tag ? '#fff' : undefined,
                padding: '0.3rem 0.8rem',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              {tag} ({tagCounts[tag]})
            </button>
          ))}
        </div>
      )}

      {/* Podcast Grid */}
      <PodcastGrid
        podcasts={processedSubscriptions}
        emptyMessage={
          selectedTag !== 'all'
            ? `No subscribed shows found matching tag "${selectedTag}".`
            : filterQuery.trim()
            ? `No subscribed shows matching "${filterQuery}".`
            : "You haven't subscribed to any podcasts yet. Explore podcasts in Discover or import a custom RSS feed!"
        }
      />
    </div>
  );
};
