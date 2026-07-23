import { XMLParser } from 'fast-xml-parser';
import type { Podcast, Episode } from '../types/podcast';

export const DEFAULT_PODCAST_ARTWORK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="%238b5cf6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="background:%2312161f;"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2"/></svg>';

// Popular curated podcasts for discovery view
export const FEATURED_PODCASTS: Podcast[] = [
  {
    id: 'syntax-fm',
    feedUrl: 'https://feed.syntax.fm',
    title: 'Syntax - Tasty Web Development Treats',
    author: 'Wes Bos & Scott Tolinski',
    description: 'Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, JavaScript frameworks, CSS tricks, node, react, performance and web security.',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/37/ef/5c/37ef5c20-6d43-5246-86c0-6d80a1ad14b8/mza_10787720970341775730.jpg/600x600bb.jpg',
    categories: ['Technology', 'Web Development'],
    website: 'https://syntax.fm',
    episodesCount: 750,
  },
  {
    id: 'huberman-lab',
    feedUrl: 'https://feeds.megaphone.fm/hubermanlab',
    title: 'Huberman Lab',
    author: 'Scicomm Media / Dr. Andrew Huberman',
    description: 'Huberman Lab discusses neuroscience: how our brain and its connections with the organs of our body control our behaviors, our perceptions, and our health.',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/4a/ee/80/4aee80d3-34e8-8bb8-a006-25805a8f4cbb/mza_10331005230983196969.jpg/600x600bb.jpg',
    categories: ['Science', 'Health & Fitness'],
    website: 'https://hubermanlab.com',
    episodesCount: 180,
  },
  {
    id: 'radiolab',
    feedUrl: 'https://feeds.publicradio.org/public_feeds/radiolab/podcast/itunes.rss',
    title: 'Radiolab',
    author: 'WNYC Studios',
    description: 'Investigating a strange world. Radiolab is a show about curiosity. Where sound illuminates ideas, and the boundaries blur between science, philosophy, and human experience.',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/8a/7e/1a/8a7e1ad4-3617-68b3-3a17-380ff98126e8/mza_14838615967733475713.png/600x600bb.jpg',
    categories: ['Science', 'Society & Culture'],
    website: 'https://radiolab.org',
    episodesCount: 420,
  },
  {
    id: 'design-details',
    feedUrl: 'https://feeds.simplecast.com/6_206951',
    title: 'Design Details',
    author: 'Brian Lovin & Marshall Bock',
    description: 'A weekly show about the design process, culture, and products behind software development.',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/21/df/b5/21dfb5c8-10be-098a-7848-d36c53578703/mza_14169724128522645604.jpg/600x600bb.jpg',
    categories: ['Design', 'Technology'],
    website: 'https://designdetails.fm',
    episodesCount: 450,
  },
  {
    id: 'hardcore-history',
    feedUrl: 'https://feeds.feedburner.com/dancarlin/history',
    title: "Dan Carlin's Hardcore History",
    author: 'Dan Carlin',
    description: 'In "Hardcore History" journalist and broadcaster Dan Carlin takes his unique "Theatre of the Mind" style and applies it to history’s dramatic events.',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/fa/12/ed/fa12ed3b-65ff-7d05-4f3f-fae1efdf34b5/mza_7493774880816999620.jpg/600x600bb.jpg',
    categories: ['History', 'Education'],
    website: 'https://dancarlin.com',
    episodesCount: 70,
  },
  {
    id: 'shoptalk-show',
    feedUrl: 'https://shoptalkshow.com/feed/podcast/',
    title: 'ShopTalk Show',
    author: 'Dave Rupert & Chris Coyier',
    description: 'A podcast about building websites. Hosted by Dave Rupert and Chris Coyier.',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/d1/8b/6e/d18b6e22-c841-f6cb-5d3c-99c00b3e70cf/mza_7314546419799292850.jpg/600x600bb.jpg',
    categories: ['Technology', 'Web Development'],
    website: 'https://shoptalkshow.com',
    episodesCount: 610,
  }
];

// Parser setup
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'category', 'itunes:category'].includes(name),
});

function formatDuration(secondsOrString: any): { seconds: number; formatted: string } {
  if (!secondsOrString) return { seconds: 0, formatted: '00:00' };
  
  const str = String(secondsOrString).trim();
  
  // If it's hh:mm:ss or mm:ss
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    let totalSec = 0;
    if (parts.length === 3) {
      totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      totalSec = parts[0] * 60 + parts[1];
    }
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    const formatted = hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
    return { seconds: totalSec, formatted };
  }
  
  const totalSec = parseInt(str, 10) || 0;
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = Math.floor(totalSec % 60);
  const formatted = hrs > 0 
    ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins}:${secs.toString().padStart(2, '0')}`;
  return { seconds: totalSec, formatted };
}

// Strip HTML tags for clean text snippets
export function stripHtml(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

async function fetchWithCorsProxy(url: string): Promise<string> {
  // 1. Try local server feed proxy endpoint first for 100% reliable CORS-free XML fetching
  try {
    const serverProxyRes = await fetch(`/api/feed-proxy?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (serverProxyRes.ok) {
      const text = await serverProxyRes.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    }
  } catch {
    // Local server proxy fallback
  }

  // 2. Try direct fetch
  try {
    const directRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (directRes.ok) {
      return await directRes.text();
    }
  } catch {
    // Direct fetch failed
  }

  // 3. Fallback to public CORS proxies
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];

  for (const proxyFn of proxies) {
    try {
      const res = await fetch(proxyFn(url), { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        return await res.text();
      }
    } catch {
      continue;
    }
  }

  throw new Error(`Unable to fetch RSS feed from ${url}`);
}

export const rssService = {
  async searchiTunes(query: string): Promise<Podcast[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(query)}&limit=24`);
      if (!res.ok) throw new Error('iTunes API error');
      const data = await res.json();
      return data.results.map((item: any) => ({
        id: String(item.collectionId || item.feedUrl),
        feedUrl: item.feedUrl,
        title: item.collectionName || item.trackName,
        author: item.artistName,
        description: item.collectionExplicitness || 'No description available',
        artworkUrl: item.artworkUrl600 || item.artworkUrl100,
        categories: item.primaryGenreName ? [item.primaryGenreName] : ['General'],
        website: item.collectionViewUrl,
        episodesCount: item.trackCount || 0,
      })).filter((p: Podcast) => Boolean(p.feedUrl));
    } catch (err) {
      console.error('iTunes search failed:', err);
      // Fallback search in featured
      const q = query.toLowerCase();
      return FEATURED_PODCASTS.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
  },

  async parseRssFeed(feedUrl: string, fallbackPodcastInfo?: Partial<Podcast>): Promise<Podcast> {
    const xmlText = await fetchWithCorsProxy(feedUrl);
    const parsed = xmlParser.parse(xmlText);

    const channel = parsed.rss?.channel || parsed.feed;
    if (!channel) {
      throw new Error('Invalid RSS / Atom feed format');
    }

    const title = channel.title || fallbackPodcastInfo?.title || 'Untitled Podcast';
    const author = channel['itunes:author'] || channel.author || fallbackPodcastInfo?.author || 'Unknown Author';
    const rawDesc = channel.description || channel['itunes:summary'] || fallbackPodcastInfo?.description || '';
    const description = stripHtml(rawDesc);
    
    // Enhanced Channel Artwork Extraction from RSS Feed Tags
    let artworkUrl = '';
    if (channel['itunes:image']) {
      artworkUrl = typeof channel['itunes:image'] === 'string'
        ? channel['itunes:image']
        : channel['itunes:image']['@_href'] || channel['itunes:image']['#text'] || '';
    }
    if (!artworkUrl && channel.image) {
      artworkUrl = typeof channel.image === 'string' ? channel.image : channel.image.url || channel.image['@_href'] || '';
    }
    if (!artworkUrl && channel['media:thumbnail']) {
      artworkUrl = channel['media:thumbnail']['@_url'] || channel['media:thumbnail']['#text'] || '';
    }
    if (!artworkUrl) {
      artworkUrl = fallbackPodcastInfo?.artworkUrl || DEFAULT_PODCAST_ARTWORK;
    }

    const categoriesRaw = channel['itunes:category'] || channel.category || [];
    const categories: string[] = Array.isArray(categoriesRaw)
      ? categoriesRaw.map((c: any) => (typeof c === 'string' ? c : c['@_text'] || c.text || '')).filter(Boolean)
      : [typeof categoriesRaw === 'string' ? categoriesRaw : categoriesRaw['@_text'] || 'General'];

    const items = channel.item || channel.entry || [];
    const episodes: Episode[] = items.map((item: any, idx: number) => {
      const epTitle = item.title || `Episode ${idx + 1}`;
      const epDesc = item['itunes:summary'] || item.description || item['content:encoded'] || '';
      
      // Audio URL extraction
      let audioUrl = '';
      if (item.enclosure && item.enclosure['@_url']) {
        audioUrl = item.enclosure['@_url'];
      } else if (item['media:content'] && item['media:content']['@_url']) {
        audioUrl = item['media:content']['@_url'];
      } else if (item.link) {
        audioUrl = typeof item.link === 'string' ? item.link : item.link['@_href'] || '';
      }

      const rawDuration = item['itunes:duration'] || 0;
      const { seconds: durationSec, formatted: durationFmt } = formatDuration(rawDuration);

      // Episode-specific Artwork Extraction from RSS item
      let epArtwork = '';
      if (item['itunes:image']) {
        epArtwork = typeof item['itunes:image'] === 'string'
          ? item['itunes:image']
          : item['itunes:image']['@_href'] || item['itunes:image']['#text'] || '';
      }
      if (!epArtwork && item['media:thumbnail']) {
        epArtwork = item['media:thumbnail']['@_url'] || item['media:thumbnail']['#text'] || '';
      }
      if (!epArtwork && item.image) {
        epArtwork = typeof item.image === 'string' ? item.image : item.image.url || item.image['@_href'] || '';
      }
      // Fallback to channel main podcast artwork if episode artwork not specified in feed
      if (!epArtwork) {
        epArtwork = artworkUrl;
      }

      // Unique ID generation
      const epGuid = item.guid
        ? (typeof item.guid === 'string' ? item.guid : item.guid['#text'] || String(idx))
        : `${feedUrl}-${idx}-${epTitle}`;

      return {
        id: epGuid,
        podcastId: fallbackPodcastInfo?.id || feedUrl,
        podcastTitle: title,
        podcastArtwork: artworkUrl,
        title: epTitle,
        description: epDesc,
        audioUrl,
        pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently',
        duration: durationSec,
        durationFormatted: durationFmt,
        artworkUrl: epArtwork,
      };
    }).filter((ep: Episode) => Boolean(ep.audioUrl));

    return {
      id: fallbackPodcastInfo?.id || feedUrl,
      feedUrl,
      title,
      author,
      description,
      artworkUrl,
      categories: categories.length ? categories : ['General'],
      website: channel.link || fallbackPodcastInfo?.website,
      episodesCount: episodes.length,
      episodes,
    };
  },

  parseOpml(xmlText: string): { title: string; feedUrl: string; website?: string }[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const outlines = xmlDoc.querySelectorAll('outline');
    
    const results: { title: string; feedUrl: string; website?: string }[] = [];
    const seenUrls = new Set<string>();

    outlines.forEach((node) => {
      const xmlUrl = node.getAttribute('xmlUrl') || node.getAttribute('xmlurl');
      if (xmlUrl && !seenUrls.has(xmlUrl)) {
        seenUrls.add(xmlUrl);
        const title = node.getAttribute('text') || node.getAttribute('title') || 'Untitled Podcast';
        const website = node.getAttribute('htmlUrl') || node.getAttribute('htmlurl') || undefined;
        results.push({ title, feedUrl: xmlUrl, website });
      }
    });

    return results;
  },

  generateOpml(subscriptions: Podcast[]): string {
    const header = `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="1.0">\n  <head>\n    <title>PodPlayer Subscriptions</title>\n  </head>\n  <body>\n    <outline text="Feeds" title="Feeds">\n`;
    const items = subscriptions
      .map(
        (sub) =>
          `      <outline type="rss" text="${escapeXml(sub.title)}" title="${escapeXml(sub.title)}" xmlUrl="${escapeXml(sub.feedUrl)}"${
            sub.website ? ` htmlUrl="${escapeXml(sub.website)}"` : ''
          } />`
      )
      .join('\n');
    const footer = `\n    </outline>\n  </body>\n</opml>`;
    return header + items + footer;
  },
};

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

