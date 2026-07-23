const SYNCED_KEYS = [
  'podplayer_subscriptions',
  'podplayer_favorite_episodes',
  'podplayer_history',
  'podplayer_episode_progress',
  'podplayer_played_episodes',
  'podplayer_podcast_tags',
  'podplayer_podcast_settings',
  'podplayer_smart_playlists',
  'podplayer_queue',
  'podplayer_settings',
  'podplayer_current_state',
];

const DATA_CHANGED_EVENT = 'podplayer:data-changed';
const PUSH_DEBOUNCE_MS = 1200;
// Continuous playback fires the change event every timeupdate tick, which keeps
// resetting the debounce and would otherwise mean nothing is pushed until playback
// stops. This caps how long a burst of changes can defer a push.
const PUSH_MAX_WAIT_MS = 25000;

let username: string | null = null;
let pushTimer: number | null = null;
let maxWaitTimer: number | null = null;

function collectLocalStorageBlob(): Record<string, unknown> {
  const blob: Record<string, unknown> = {};
  for (const key of SYNCED_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      blob[key] = JSON.parse(raw);
    } catch {
      // skip malformed entries rather than corrupting the server copy
    }
  }
  return blob;
}

async function pushNow(): Promise<void> {
  if (!username) return;
  try {
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectLocalStorageBlob()),
    });
  } catch (err) {
    console.error('[sync] Failed to push user data:', err);
  }
}

export const syncService = {
  async whoAmI(): Promise<string | null> {
    try {
      const res = await fetch('/api/whoami');
      if (!res.ok) return null;
      const data = await res.json();
      username = data.username || null;
      return username;
    } catch {
      return null;
    }
  },

  getUsername(): string | null {
    return username;
  },

  /** Fetches the server-side blob and writes it into localStorage. Returns true if any keys were hydrated. */
  async pullAndHydrate(): Promise<boolean> {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) return false;
      const blob = await res.json();
      if (!blob || typeof blob !== 'object') return false;
      let hydrated = false;
      for (const key of SYNCED_KEYS) {
        if (key in blob) {
          localStorage.setItem(key, JSON.stringify(blob[key]));
          hydrated = true;
        }
      }
      return hydrated;
    } catch {
      return false;
    }
  },

  pushNow,

  /**
   * Debounces a push so rapid successive writes (e.g. scrubbing playback, or the
   * continuous timeupdate tick during playback) collapse into one request — but
   * guarantees a push at least every PUSH_MAX_WAIT_MS even if changes keep coming,
   * so a long listening session isn't lost if the tab closes before it pauses.
   */
  schedulePush(): void {
    if (!username) return;
    if (pushTimer !== null) window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => {
      pushTimer = null;
      if (maxWaitTimer !== null) {
        window.clearTimeout(maxWaitTimer);
        maxWaitTimer = null;
      }
      void pushNow();
    }, PUSH_DEBOUNCE_MS);

    if (maxWaitTimer === null) {
      maxWaitTimer = window.setTimeout(() => {
        maxWaitTimer = null;
        if (pushTimer !== null) {
          window.clearTimeout(pushTimer);
          pushTimer = null;
        }
        void pushNow();
      }, PUSH_MAX_WAIT_MS);
    }
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener(DATA_CHANGED_EVENT, () => syncService.schedulePush());
}
