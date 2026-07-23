import React from 'react';
import type { Podcast } from '../types/podcast';
import { usePlayer } from '../context/PlayerContext';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { DEFAULT_PODCAST_ARTWORK } from '../services/rssService';

interface PodcastCardProps {
  podcast: Podcast;
}

export const PodcastCard: React.FC<PodcastCardProps> = ({ podcast }) => {
  const { openPodcastDetail, isSubscribed, toggleSubscription } = usePlayer();
  const subscribed = isSubscribed(podcast.id);

  const handleSubscribeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSubscription(podcast);
  };

  return (
    <div className="podcast-card" onClick={() => openPodcastDetail(podcast)}>
      <div className="podcast-cover-wrapper">
        <img
          src={podcast.artworkUrl}
          alt={podcast.title}
          className="podcast-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PODCAST_ARTWORK;
          }}
        />
        <button
          className="btn-icon"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '32px',
            height: '32px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            border: 'none',
            color: subscribed ? 'var(--accent-primary)' : '#fff',
          }}
          onClick={handleSubscribeClick}
          title={subscribed ? 'Subscribed' : 'Subscribe'}
        >
          {subscribed ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      <h3 className="podcast-card-title" title={podcast.title}>
        {podcast.title}
      </h3>
      <p className="podcast-card-author">{podcast.author}</p>

      {podcast.categories && podcast.categories[0] && (
        <span className="category-tag">{podcast.categories[0]}</span>
      )}
    </div>
  );
};
