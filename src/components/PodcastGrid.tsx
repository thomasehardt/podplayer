import React from 'react';
import type { Podcast } from '../types/podcast';
import { PodcastCard } from './PodcastCard';

interface PodcastGridProps {
  podcasts: Podcast[];
  emptyMessage?: string;
}

export const PodcastGrid: React.FC<PodcastGridProps> = ({ podcasts, emptyMessage = 'No podcasts found.' }) => {
  if (podcasts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="podcast-grid">
      {podcasts.map((podcast) => (
        <PodcastCard key={podcast.id} podcast={podcast} />
      ))}
    </div>
  );
};
