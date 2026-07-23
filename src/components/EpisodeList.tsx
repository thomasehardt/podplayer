import React from 'react';
import type { Episode } from '../types/podcast';
import { EpisodeCard } from './EpisodeCard';

interface EpisodeListProps {
  episodes: Episode[];
  emptyMessage?: string;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({ episodes, emptyMessage = 'No episodes available.' }) => {
  if (episodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="episode-list">
      {episodes.map((episode) => (
        <EpisodeCard key={episode.id} episode={episode} />
      ))}
    </div>
  );
};
