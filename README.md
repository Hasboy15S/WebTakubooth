# 📸 TakuBooth — Virtual Photobox

> Buat photostrip cantik langsung di browser. Tanpa server, tanpa upload, 100% privat.

[![Live Demo](https://img.shields.io/badge/Demo-Live-ff69b4?style=for-the-badge)](/)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%2B%20Vite%20%2B%20Tailwind-7c3aed?style=for-the-badge)](/)
[![License](https://img.shields.io/badge/License-MIT-6ee7b7?style=for-the-badge)](LICENSE)

---

## ✨ Fitur

| Fitur | Status |
|---|---|
| 🎬 Sesi foto multi-jepretan (2 / 4 / 6 foto) | ✅ Selesai |
| ⏱ Countdown timer (3 / 5 / 10 detik) | ✅ Selesai |
| 📸 Efek flash + suara shutter audio synthesis | ✅ Selesai |
| 🖼 Komposisi photostrip otomatis | ✅ Selesai |
| ⬇️ Download hasil resolusi tinggi (PNG) | ✅ Selesai |
| 🎞 6 tema frame (Minimal, Polaroid, Coquette, Film, Pastel, Neon) | ✅ Selesai |
| ✏️ Teks label kustom & tanggal otomatis | ✅ Selesai |
| 🎨 6 filter foto live CSS (Normal, Vintage, B&W, Soft Pink, Vivid, Cool) | ✅ Selesai |
| ↔️ Mirror mode toggle | ✅ Selesai |
| 🔄 Ganti background real-time (AI Selfie Segmentation @mediapipe) | ✅ Selesai |
| 🖼 17 background preset (color, gradient, blur) + custom upload | ✅ Selesai |
| 🤌 Gesture snap (✌️ peace & 👍 thumbs-up via MediaPipe HandLandmarker) | ✅ Selesai |
| 🌟 Efek partikel burst saat flash jepret | ✅ Selesai |
| ✨ Ambient floating partikel (hati, bintang, bunga, konfeti) | ✅ Selesai |
| 🌸 Stiker emoji draggable & resizable (60+ emoji, 5 kategori) | ✅ Selesai |
| 🎞 Export GIF animasi dengan progress bar (gif.js) | ✅ Selesai |
| 🔄 Retake foto individual tanpa ulang sesi | ✅ Selesai |
| 📤 Web Share API & Salin Gambar ke Clipboard | ✅ Selesai |
| ⌨️ Shortcut Keyboard (Spasi untuk jepret, Esc untuk kembali) | ✅ Selesai |
| 📳 Haptic feedback getaran saat capture & download | ✅ Selesai |
| 📱 PWA Ready (manifest.json, mobile-friendly touch gestures) | ✅ Selesai |

---

## 🛠 Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (native CSS tokens & utilities)
- **Animasi**: Framer Motion
- **AI/Vision**: `@mediapipe/tasks-vision` (SelfieSegmenter + HandLandmarker)
- **Canvas**: HTML5 Canvas API (compositing, offscreen rendering, sticker baking)
- **GIF Encoder**: `gif.js` with background web worker
- **Typography**: Pacifico (display) + Inter (body) + Space Grotesk (accent)
- **Deployment**: 100% Static / Jamstack (Vercel, Netlify, Cloudflare Pages, GitHub Pages)

---

## 🚀 Cara Run

### Prerequisites
- Node.js v18+
- npm v9+

### Install & Dev
```bash
git clone https://github.com/username/takubooth.git
cd takubooth

npm install
npm run dev
```

Buka **http://localhost:5173** di browser.

### Build Production
```bash
npm run build
npm run preview
```

---

## 📁 Struktur Proyek

```
takubooth/
├── public/
│   ├── favicon.svg         # Icon SVG
│   ├── gif.worker.js       # gif.js background worker
│   ├── icons.svg           # Sprite icon
│   └── manifest.json       # PWA Web App Manifest
├── src/
│   ├── components/
│   │   ├── BackgroundSelector.jsx  # Grid picker background AI
│   │   ├── RetakeModal.jsx         # Modal retake foto perorangan
│   │   └── StickerLayer.jsx        # Drag-and-drop stiker canvas overlay
│   ├── hooks/
│   │   ├── useCamera.js            # WebRTC MediaStream hook
│   │   ├── useGestureDetection.js  # MediaPipe HandLandmarker hook
│   │   └── useSegmentation.js      # MediaPipe SelfieSegmenter hook
│   ├── pages/
│   │   ├── LandingPage.jsx         # Hero, features, config modal
│   │   ├── SessionPage.jsx         # Live preview, gesture, capture loop
│   │   └── ResultPage.jsx          # Photostrip viewer, stickers, PNG/GIF/Share
│   ├── utils/
│   │   ├── canvasUtils.js          # Compositing strip, crop, download
│   │   ├── config.js               # Presets: filter, frame, bg, layout
│   │   └── gifUtils.js             # Generator GIF animasi
│   ├── App.jsx                     # Route state machine & page transitions
│   ├── index.css                   # Tailwind v4 theme, glassmorphism, animations
│   └── main.jsx                    # React entrypoint
├── index.html                      # PWA meta, title, OG tags
└── vite.config.js                  # COEP headers (credentialless) untuk WASM
```

---

## 🎨 Desain

TakuBooth menggunakan estetika **pastel dark aesthetic** dengan:
- Background gelap dengan gradient animasi dan orb ambient melayang
- Glassmorphism pada card, pills, dan modal
- Warna aksen: pink candy `#f5a0c8`, purple `#c084fc`, biru langit `#7dd3fc`
- Animasi Framer Motion pada transisi halaman dan micro-interactions
- Responsive penuh: ponsel (portrait) hingga desktop (layar lebar)

---

## 🔒 Privasi 100%

Semua pemrosesan terjadi **100% di browser pengguna**:
- ❌ Tidak ada foto yang dikirim ke server
- ❌ Tidak ada database
- ❌ Tidak ada tracking atau analitik
- ✅ Kamera dan canvas hanya berjalan di memori browser lokal
- ✅ Model MediaPipe dieksekusi secara lokal via WASM / WebGL

---

## 🤝 Kontribusi

Pull request disambut! Buka issue untuk diskusi fitur baru.

---

## 📄 Lisensi

MIT © 2024 TakuBooth Contributors
