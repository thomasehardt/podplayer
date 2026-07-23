# 🎙️ PodPlayer

> A modern, responsive web podcast player & RSS feed manager featuring local audio proxy streaming, custom podcast tagging, dynamic smart playlists, OPML import/export, and playback position persistence.

![PodPlayer Interface](https://raw.githubusercontent.com/thomasehardt/podplayer/main/docs/preview.png)

---

## ✨ Features

- **🎧 Local Audio Server Proxy & Caching (`/api/stream`)**: Streams and caches podcast audio files directly on your local server. Bypasses cross-origin (CORS) blocks, mixed-content HTTP/HTTPS restrictions, and CDN rate limits while supporting full HTTP Range header seeking (`206 Partial Content`).
- **🏷️ Custom Podcast Tags**: Assign custom user tags (e.g. `Commute`, `Work`, `Deep Tech`, `Bedtime`) to any podcast show.
- **⚡ Dynamic Smart Playlists**: Auto-updating playlists driven by customizable rules:
  - Match Tags & Categories
  - Filter Unplayed Episodes Only
  - Set Max Episode Duration (e.g. `< 30 mins`)
  - Custom Sorting (Newest, Oldest, Shortest, Longest)
  - Pre-built playlists: *"Unplayed Queue"*, *"Tech & Web Dev"*, and *"Quick Listens (< 30m)"*.
- **📦 OPML Import & Export**: Import your existing podcast subscriptions from AntennaPod, Overcast, Apple Podcasts, or Pocket Casts via OPML XML files. Export your subscriptions anytime.
- **✅ Played Episode Management**: Batch-mark episodes as played/unplayed (*"Mark ALL as Played"*, *"Mark All EXCEPT Latest 3"*). Played episodes are automatically hidden by default with a live count toggle.
- **📱 Fully Responsive & Mobile-First**: Slide-over off-canvas drawer navigation, responsive compact player bar, and fluid grid layouts optimized for mobile, tablet, and desktop viewports.
- **🎵 Interactive Controls**: Variable playback speed (0.5x – 3.0x), custom sleep timer, up-next queue drawer, search millions of shows via iTunes Directory API, and real-time audio waveform visualizer.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Modern Vanilla CSS, Glassmorphism, CSS Variables, Container Queries
- **Icons**: Lucide React
- **Feed Parser**: Fast XML Parser (`fast-xml-parser`)
- **Backend & Proxy**: Node.js Vite Server Middleware (`/api/stream`, `/api/image`, `/api/feed-proxy`)

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ 
- `npm` or `yarn` or `pnpm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/thomasehardt/podplayer.git
   cd podplayer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server (exposed to LAN)**:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```

4. **Open in browser**:
   - Local: `http://localhost:5173/`
   - Mobile / LAN: `http://<your-local-ip>:5173/`

---

## 🛠️ Scripts

- `npm run dev`: Start Vite development server with LAN host exposure.
- `npm run build`: Build production bundle with TypeScript type-checking.
- `npm run preview`: Preview production build locally.

---

## 📄 License

MIT License © 2026 Thomas E. Hardt
