// Service for caching audio episodes locally in browser Cache Storage for offline playback

const CACHE_NAME = 'podplayer-offline-audio-v1';

export const offlineCacheService = {
  // Check if an episode audio URL is saved in browser Cache storage
  async isCached(audioUrl: string): Promise<boolean> {
    if (!('caches' in window)) return false;
    try {
      const cache = await caches.open(CACHE_NAME);
      const streamUrl = `/api/stream?url=${encodeURIComponent(audioUrl)}`;
      const match = (await cache.match(audioUrl)) || (await cache.match(streamUrl));
      return !!match;
    } catch {
      return false;
    }
  },

  // Cache an episode's audio file into browser Cache storage with progress callback
  async cacheEpisode(
    audioUrl: string,
    onProgress?: (progressPercent: number) => void
  ): Promise<boolean> {
    if (!('caches' in window)) return false;
    try {
      const targetUrl = `/api/stream?url=${encodeURIComponent(audioUrl)}`;
      const response = await fetch(targetUrl);

      if (!response.ok) return false;

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body || totalBytes === 0) {
        // Fallback: simple response put if body stream is not available
        const cache = await caches.open(CACHE_NAME);
        await cache.put(audioUrl, response.clone());
        await cache.put(targetUrl, response.clone());
        if (onProgress) onProgress(100);
        return true;
      }

      // Track reader progress
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (onProgress && totalBytes > 0) {
          const percent = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
          onProgress(percent);
        }
      }

      // Combine chunks into single Blob
      const blob = new Blob(chunks as unknown as BlobPart[], { type: response.headers.get('content-type') || 'audio/mpeg' });
      const cacheResponse = new Response(blob, {
        status: 200,
        statusText: 'OK',
        headers: response.headers,
      });

      const cache = await caches.open(CACHE_NAME);
      await cache.put(audioUrl, cacheResponse.clone());
      await cache.put(targetUrl, cacheResponse.clone());

      if (onProgress) onProgress(100);
      return true;
    } catch (err) {
      console.error('Error caching episode offline:', err);
      return false;
    }
  },

  // Remove cached episode from browser Cache storage
  async removeCachedEpisode(audioUrl: string): Promise<boolean> {
    if (!('caches' in window)) return false;
    try {
      const cache = await caches.open(CACHE_NAME);
      const targetUrl = `/api/stream?url=${encodeURIComponent(audioUrl)}`;
      const deleted1 = await cache.delete(audioUrl);
      const deleted2 = await cache.delete(targetUrl);
      return deleted1 || deleted2;
    } catch {
      return false;
    }
  },

  // Get executable playable URL (Blob URL if cached locally offline, stream URL otherwise)
  async getPlayableUrl(audioUrl: string): Promise<string> {
    if (!('caches' in window)) return `/api/stream?url=${encodeURIComponent(audioUrl)}`;
    try {
      const cache = await caches.open(CACHE_NAME);
      const targetUrl = `/api/stream?url=${encodeURIComponent(audioUrl)}`;
      const match = (await cache.match(audioUrl)) || (await cache.match(targetUrl));

      if (match) {
        const blob = await match.blob();
        return URL.createObjectURL(blob);
      }
    } catch {
      // Fallback to stream
    }

    return `/api/stream?url=${encodeURIComponent(audioUrl)}`;
  },
};
