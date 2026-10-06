import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FRAMES, STRIP_LAYOUTS } from '../utils/config'
import { composeStrip, downloadDataURL, formatDate } from '../utils/canvasUtils'
import { createGIF, downloadURL } from '../utils/gifUtils'
import { StickerLayer, StickerPicker } from '../components/StickerLayer'
import RetakeModal from '../components/RetakeModal'

/**
 * ResultPage
 *
 * Full-featured result viewer:
 *  • Live strip preview  (auto-recomposes on frame/label change)
 *  • Frame picker (6 themes)
 *  • Label editor with presets
 *  • Draggable sticker overlay (included in PNG download)
 *  • Retake individual photos via camera modal
 *  • PNG download (high-quality)
 *  • GIF export with progress bar
 */
export default function ResultPage({ photos: initialPhotos, config, onUpdatePhotos, onRetake, onReset }) {
  // Live-editable copy of photos (retake mutates this)
  const [photos,       setPhotos]       = useState(initialPhotos)
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0])
  const [labelText,    setLabelText]    = useState(formatDate())
  const [stripDataURL, setStripDataURL] = useState(null)
  const [composing,    setComposing]    = useState(false)
  const [activeTab,    setActiveTab]    = useState('frame')
  const [stickers,     setStickers]     = useState([])
  const [retakeIdx,    setRetakeIdx]    = useState(null)  // null = no modal

  // Download & Share state
  const [pngState,   setPngState]   = useState('idle')  // idle | done
  const [gifState,   setGifState]   = useState('idle')  // idle | encoding | done | error
  const [gifProgress, setGifProgress] = useState(0)
  const [shareState, setShareState] = useState('idle')  // idle | shared | copied | error

  const stripContainerRef = useRef(null)
  const layout = STRIP_LAYOUTS[config?.layout ?? 4]

  // Sync photos up to App state whenever they change (retakes)
  useEffect(() => { onUpdatePhotos?.(photos) }, [photos])

  // Recompose strip on photo/frame/label change (NOT stickers — they're overlaid live)
  useEffect(() => {
    let cancelled = false
    setComposing(true)
    composeStrip(photos, selectedFrame, layout, labelText)
      .then(url => { if (!cancelled) { setStripDataURL(url); setComposing(false) } })
      .catch(console.error)
    return () => { cancelled = true }
  }, [photos, selectedFrame, layout, labelText])

  // ── PNG download ──────────────────────────────────────────────────────────
  const handleDownloadPNG = async () => {
    if (!stripDataURL || composing) return
    try { navigator.vibrate?.(30) } catch (_) {}
    const finalURL = await composeStrip(photos, selectedFrame, layout, labelText, stickers)
    downloadDataURL(finalURL, `takubooth-${new Date().toISOString().slice(0,10)}.png`)
    setPngState('done')
    setTimeout(() => setPngState('idle'), 2500)
  }

  // ── Share or Copy Image ───────────────────────────────────────────────────
  const handleShareOrCopy = async () => {
    if (!stripDataURL || composing) return
    try {
      try { navigator.vibrate?.(30) } catch (_) {}
      const finalURL = await composeStrip(photos, selectedFrame, layout, labelText, stickers)
      const res = await fetch(finalURL)
      const blob = await res.blob()
      const file = new File([blob], `takubooth-${Date.now()}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'TakuBooth Photostrip ✨',
          text: 'Photostrip aesthetic dari TakuBooth! ✨',
        })
        setShareState('shared')
        setTimeout(() => setShareState('idle'), 2500)
        return
      }

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        setShareState('copied')
        setTimeout(() => setShareState('idle'), 2500)
        return
      }

      downloadDataURL(finalURL, `takubooth-${Date.now()}.png`)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share/copy failed:', err)
        setShareState('error')
        setTimeout(() => setShareState('idle'), 2500)
      }
    }
  }

  // ── GIF export ────────────────────────────────────────────────────────────
  const handleExportGIF = useCallback(async () => {
    if (gifState === 'encoding') return
    setGifState('encoding')
    setGifProgress(0)
    try {
      const url = await createGIF(photos, {
        delay: 500,
        width: 420,
        quality: 8,
        onProgress: setGifProgress,
      })
      downloadURL(url, `takubooth-${new Date().toISOString().slice(0,10)}.gif`)
      setGifState('done')
      setTimeout(() => setGifState('idle'), 3000)
    } catch (e) {
      console.error('GIF error:', e)
      setGifState('error')
      setTimeout(() => setGifState('idle'), 3000)
    }
  }, [photos, gifState])

  // ── Retake a single photo ─────────────────────────────────────────────────
  const handleRetakeConfirm = useCallback((idx, dataURL) => {
    setPhotos(prev => prev.map((p, i) => i === idx ? dataURL : p))
    setRetakeIdx(null)
  }, [])

  const TABS = [
    { key: 'frame',   label: '🖼', title: 'Frame'  },
    { key: 'label',   label: '✏️', title: 'Label'  },
    { key: 'sticker', label: '🌸', title: 'Stiker' },
  ]

  return (
    <div className="relative min-h-dvh flex flex-col lg:flex-row overflow-hidden bg-[#070b14]">
      {/* Ambient orbs */}
      <div className="orb orb-1 opacity-10 pointer-events-none" />
      <div className="orb orb-2 opacity-8  pointer-events-none" />

      {/* ── Left: Strip preview ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center p-5 lg:p-10 overflow-y-auto">

        {/* Nav */}
        <div className="w-full max-w-sm mb-4 flex justify-between items-center gap-2">
          <button className="btn-secondary px-4 py-2 text-sm flex items-center gap-1.5" onClick={onReset}>
            ← Beranda
          </button>
          <button className="btn-secondary px-4 py-2 text-sm flex items-center gap-1.5" onClick={onRetake}>
            🔄 Ulangi Sesi
          </button>
        </div>

        {/* Strip + sticker overlay */}
        <div className="relative w-full max-w-sm">
          {composing && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
                <p className="text-sm text-cyan-200">Menyusun strip…</p>
              </div>
            </div>
          )}

          <div ref={stripContainerRef} className="relative w-full">
            {stripDataURL
              ? <motion.img
                  key={selectedFrame.id + photos.join('').length}
                  src={stripDataURL}
                  alt="Photostrip"
                  className="w-full rounded-2xl shadow-2xl"
                  draggable={false}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                />
              : <div className="w-full shimmer rounded-2xl" style={{ aspectRatio: '1/2.4' }} />
            }
            <StickerLayer
              stickers={stickers}
              onUpdate={setStickers}
              containerRef={stripContainerRef}
            />
          </div>
        </div>

        {/* Download buttons */}
        <div className="mt-5 w-full max-w-sm flex flex-col gap-2">
          {/* PNG download */}
          <motion.button
            className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
            onClick={handleDownloadPNG}
            disabled={!stripDataURL || composing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <AnimatePresence mode="wait">
              {pngState === 'done'
                ? <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}>✓ PNG Tersimpan!</motion.span>
                : <motion.span key="dl">⬇️ Download PNG</motion.span>
              }
            </AnimatePresence>
          </motion.button>

          {/* GIF export & Share/Copy row */}
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              className={`py-3 rounded-full border font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                gifState === 'encoding'
                  ? 'border-purple-500/50 bg-purple-500/15 text-purple-300 cursor-wait'
                  : gifState === 'done'
                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                  : gifState === 'error'
                  ? 'border-red-500/50 bg-red-500/10 text-red-400'
                  : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
              }`}
              onClick={handleExportGIF}
              disabled={gifState === 'encoding' || photos.length < 2}
              whileHover={gifState === 'idle' ? { scale: 1.02 } : {}}
              whileTap={gifState === 'idle' ? { scale: 0.97 } : {}}
            >
              {gifState === 'encoding' ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                  <span>{gifProgress}%</span>
                </>
              ) : gifState === 'done' ? '✓ Tersimpan!'
                : gifState === 'error' ? '⚠️ Coba lagi'
                : '🎞️ Export GIF'}
            </motion.button>

            <motion.button
              className={`py-3 rounded-full border font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                shareState === 'shared' || shareState === 'copied'
                  ? 'border-green-500/50 bg-green-500/10 text-green-400'
                  : shareState === 'error'
                  ? 'border-red-500/50 bg-red-500/10 text-red-400'
                  : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
              }`}
              onClick={handleShareOrCopy}
              disabled={!stripDataURL || composing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {shareState === 'shared' ? '✓ Terbagikan!'
                : shareState === 'copied' ? '✓ Disalin!'
                : shareState === 'error' ? '⚠️ Gagal'
                : '📤 Bagikan'}
            </motion.button>
          </div>

          {/* GIF progress bar */}
          <AnimatePresence>
            {gifState === 'encoding' && (
              <motion.div
                className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${gifProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {stickers.length > 0 && (
            <p className="text-center text-xs text-white/30">
              {stickers.length} stiker disertakan dalam PNG
            </p>
          )}
        </div>

        {/* Individual photo thumbnails — click to retake */}
        <div className="mt-5 w-full max-w-sm">
          <p className="text-xs text-white/40 mb-2 text-center">Klik foto untuk retake</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {photos.map((p, i) => (
              <motion.button
                key={i}
                className="relative group focus:outline-none"
                onClick={() => setRetakeIdx(i)}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={p}
                  alt={`foto ${i + 1}`}
                  className="w-16 h-12 object-cover rounded-xl border-2 border-white/15 group-hover:border-pink-400 transition-all shadow-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-xl">
                  <span className="text-white text-lg">↺</span>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white font-bold">
                  {i + 1}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Customization panel ───────────────────────────────────── */}
      <div className="lg:w-80 xl:w-96 glass-strong border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col min-h-0">
        {/* Panel header */}
        <div className="px-4 pt-4 pb-0 shrink-0">
          <h2 className="text-sm font-semibold font-accent gradient-text mb-3">Kustomisasi Strip</h2>
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px flex items-center justify-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'border-purple-400 text-purple-300'
                    : 'border-transparent text-white/40 hover:text-white/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className="hidden sm:inline">{tab.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <AnimatePresence mode="wait">

            {/* ── Frame ───────────────────────────────────────────────── */}
            {activeTab === 'frame' && (
              <motion.div key="frame" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                {FRAMES.map(frame => (
                  <motion.button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedFrame.id === frame.id
                        ? 'border-pink-400 bg-pink-500/10 shadow-[0_0_20px_rgba(244,114,182,0.2)]'
                        : 'border-white/10 bg-white/5 hover:border-white/25'
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div
                      className="w-full h-14 rounded-xl mb-2 flex items-center justify-center text-2xl shadow-inner transition-transform"
                      style={{ background: frame.bgColor, border: `3px solid ${frame.borderColor}` }}
                    >
                      {frame.emoji}
                    </div>
                    <p className="text-xs font-semibold text-white/80 truncate">{frame.label}</p>
                    {selectedFrame.id === frame.id
                      ? <p className="text-[10px] text-pink-400 mt-0.5">✓ Dipilih</p>
                      : <div className="h-3.5" />
                    }
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* ── Label ───────────────────────────────────────────────── */}
            {activeTab === 'label' && (
              <motion.div key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">Teks Strip</label>
                  <input
                    type="text"
                    value={labelText}
                    onChange={e => setLabelText(e.target.value)}
                    maxLength={40}
                    placeholder="mis. Bestie Trip 2025 🌸"
                    className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <p className="text-xs text-white/25 mt-1 text-right">{labelText.length}/40</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">Tanggal</label>
                  <input
                    type="date"
                    onChange={e => {
                      if (e.target.value) {
                        const d = new Date(e.target.value)
                        setLabelText(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }))
                      }
                    }}
                    className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Preset Cepat</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'BFF Forever 💜', 'Liburan Seru 🌴', 'No Filter Needed 💅',
                      'Memories ✨', 'Bestie Trip 🌸', 'Girls Day Out 👯',
                      'Main Bareng 🎉', 'Study Break ☕',
                    ].map(t => (
                      <button
                        key={t}
                        onClick={() => setLabelText(t)}
                        className="text-xs px-2.5 py-1 rounded-full border border-white/12 bg-white/5 text-white/55 hover:border-purple-400/60 hover:text-purple-300 transition-all"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Stiker ──────────────────────────────────────────────── */}
            {activeTab === 'sticker' && (
              <motion.div key="sticker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {stickers.length > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/50 font-medium">{stickers.length} stiker aktif</span>
                      <button
                        onClick={() => setStickers([])}
                        className="text-xs text-red-400/80 hover:text-red-300 transition-colors"
                      >
                        Hapus semua
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {stickers.map(s => (
                        <span
                          key={s.id}
                          className="text-xl cursor-pointer hover:scale-125 transition-transform"
                          onClick={() => setStickers(p => p.filter(x => x.id !== s.id))}
                          title="Klik untuk hapus"
                        >
                          {s.emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <StickerPicker onAdd={sticker => setStickers(p => [...p, sticker])} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Retake modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {retakeIdx !== null && (
          <RetakeModal
            photoIndex={retakeIdx}
            onConfirm={(dataURL) => handleRetakeConfirm(retakeIdx, dataURL)}
            onClose={() => setRetakeIdx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
