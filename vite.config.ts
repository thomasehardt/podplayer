import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';

function audioProxyPlugin(): Plugin {
  const cacheDir = path.resolve(__dirname, '.audio-cache');

  return {
    name: 'audio-proxy-plugin',
    configureServer(server) {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/feed-proxy')) {
          try {
            const reqUrl = new URL(req.url, `http://${req.headers.host}`);
            const targetFeedUrl = reqUrl.searchParams.get('url');
            if (!targetFeedUrl) {
              res.statusCode = 400;
              res.end('Missing feed url');
              return;
            }
            proxyLiveXml(targetFeedUrl, req, res);
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.end('Feed proxy error: ' + err.message);
            return;
          }
        }

        if (req.url?.startsWith('/api/image')) {
          try {
            const reqUrl = new URL(req.url, `http://${req.headers.host}`);
            const targetImageUrl = reqUrl.searchParams.get('url');
            if (!targetImageUrl) {
              res.statusCode = 400;
              res.end('Missing url');
              return;
            }
            proxyLiveStream(targetImageUrl, req, res);
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.end('Image proxy error: ' + err.message);
            return;
          }
        }

        if (!req.url?.startsWith('/api/stream') && !req.url?.startsWith('/api/download')) {
          return next();
        }

        try {
          const reqUrl = new URL(req.url, `http://${req.headers.host}`);
          const targetAudioUrl = reqUrl.searchParams.get('url');

          if (!targetAudioUrl) {
            res.statusCode = 400;
            res.end('Missing target url query parameter');
            return;
          }

          // Generate safe local filename hash
          const fileHash = Buffer.from(targetAudioUrl).toString('hex').slice(0, 32);
          const filePath = path.join(cacheDir, `${fileHash}.mp3`);

          // If already cached locally on server, serve from disk
          if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
            serveLocalFile(req, res, filePath);
            return;
          }

          // Download from remote podcast server to local cache file first
          await downloadRemoteFile(targetAudioUrl, filePath);
          serveLocalFile(req, res, filePath);
        } catch (err: any) {
          console.error('[Audio Proxy Plugin] Download/stream error:', err);
          const reqUrl = new URL(req.url, `http://${req.headers.host}`);
          const targetUrl = reqUrl.searchParams.get('url');
          if (targetUrl) {
            proxyLiveStream(targetUrl, req, res);
          } else {
            res.statusCode = 500;
            res.end('Failed to load audio: ' + err.message);
          }
        }
      });
    },
  };
}

function serveLocalFile(req: any, res: any, filePath: string) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

function downloadRemoteFile(urlStr: string, destPath: string, redirectCount = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 8) {
      return reject(new Error('Too many redirects while downloading audio feed'));
    }

    const file = fs.createWriteStream(destPath);
    const protocol = urlStr.startsWith('https') ? https : http;

    const request = protocol.get(
      urlStr,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } },
      (response) => {
        // Handle HTTP redirects (301, 302, 303, 307, 308)
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          const redirectUrl = new URL(response.headers.location, urlStr).toString();
          return downloadRemoteFile(redirectUrl, destPath, redirectCount + 1).then(resolve).catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          return reject(new Error(`Failed to download audio. HTTP Status: ${response.statusCode}`));
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve());
        });
      }
    );

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

function proxyLiveStream(targetUrl: string, req: any, res: any, redirectCount = 0) {
  if (redirectCount > 8) {
    res.statusCode = 500;
    res.end('Proxy redirect loop');
    return;
  }

  const protocol = targetUrl.startsWith('https') ? https : http;
  protocol
    .get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (remoteRes) => {
      if (remoteRes.statusCode && remoteRes.statusCode >= 300 && remoteRes.statusCode < 400 && remoteRes.headers.location) {
        const redirectUrl = new URL(remoteRes.headers.location, targetUrl).toString();
        return proxyLiveStream(redirectUrl, req, res, redirectCount + 1);
      }

      res.writeHead(remoteRes.statusCode || 200, {
        ...remoteRes.headers,
        'Access-Control-Allow-Origin': '*',
      });
      remoteRes.pipe(res);
    })
    .on('error', (err) => {
      res.statusCode = 500;
      res.end('Proxy stream failed: ' + err.message);
    });
}

function proxyLiveXml(targetUrl: string, req: any, res: any, redirectCount = 0) {
  if (redirectCount > 8) {
    res.statusCode = 500;
    res.end('Proxy redirect loop');
    return;
  }

  const protocol = targetUrl.startsWith('https') ? https : http;
  protocol
    .get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PodPlayer/1.0' } }, (remoteRes) => {
      if (remoteRes.statusCode && remoteRes.statusCode >= 300 && remoteRes.statusCode < 400 && remoteRes.headers.location) {
        const redirectUrl = new URL(remoteRes.headers.location, targetUrl).toString();
        return proxyLiveXml(redirectUrl, req, res, redirectCount + 1);
      }

      res.writeHead(remoteRes.statusCode || 200, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      remoteRes.pipe(res);
    })
    .on('error', (err) => {
      res.statusCode = 500;
      res.end('Feed proxy failed: ' + err.message);
    });
}

function sanitizeUsername(raw: string | string[] | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  // No path separators allowed in the allowed charset, so this can never escape dataDir.
  if (!/^[a-zA-Z0-9._-]{1,64}$/.test(trimmed)) return null;
  return trimmed;
}

function readRequestBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Authenticates via the `Remote-User` header nginx-proxy-manager sets after a
// successful Authelia auth_request check. This is only trustworthy because the
// app container isn't reachable except through NPM (no published host port) —
// NPM's proxy_set_header unconditionally overwrites any client-supplied header
// of the same name, so it can't be forged by a direct request.
function userDataPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, 'data', 'users');

  return {
    name: 'user-data-plugin',
    configureServer(server) {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/whoami') && !req.url?.startsWith('/api/data')) {
          return next();
        }

        const username = sanitizeUsername(req.headers['remote-user'] as string | undefined);

        if (req.url.startsWith('/api/whoami')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ username }));
          return;
        }

        // /api/data
        if (!username) {
          res.statusCode = 401;
          res.end('Not authenticated');
          return;
        }

        const filePath = path.join(dataDir, `${username}.json`);

        if (req.method === 'GET') {
          try {
            const contents = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '{}';
            res.setHeader('Content-Type', 'application/json');
            res.end(contents);
          } catch (err: any) {
            res.statusCode = 500;
            res.end('Failed to read user data: ' + err.message);
          }
          return;
        }

        if (req.method === 'PUT') {
          try {
            const body = await readRequestBody(req);
            const parsed = JSON.parse(body);
            fs.writeFileSync(filePath, JSON.stringify(parsed));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch (err: any) {
            res.statusCode = 400;
            res.end('Failed to save user data: ' + err.message);
          }
          return;
        }

        res.statusCode = 405;
        res.end('Method not allowed');
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), audioProxyPlugin(), userDataPlugin()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['podplayer.thomasehardt.com'],
    watch: {
      // Native inotify watches against a Docker bind mount are unreliable and
      // this host's inotify budget is shared across many containers; poll instead.
      usePolling: true,
    },
  },
});
