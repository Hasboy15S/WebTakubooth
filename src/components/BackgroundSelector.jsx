import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BACKGROUNDS } from '../utils/config'

/**
 * BackgroundSelector component
 *
 * Shows a grid of background presets (color, gradient, blur) plus an upload button.
 * When a non-'none' background is selected, it triggers loadSegmenter() to lazily
 * initialize MediaPipe.
 *
 * @prop {object} selected - current background config
 * @prop {function} onSelect - called with background config when user picks one
 * @prop {'idle'|'loading'|'ready'|'error'} segStatus - MediaPipe load status
 * @prop {function} loadSegmenter - call to trigger model loading
 */
export default function BackgroundSelector({ selected, onSelect, segStatus, loadSegmenter }) {
  const uploadRef = useRef(null)
  const [customBg, setCustomBg] = useState(null)

  const handleSelect = (bg) => {
    onSelect(bg)
    // Lazy-load MediaPipe when any non-none bg is chosen
    if (bg.type !== 'none') {
      loadSegmenter()
    }
  }

  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const bgConfig = {
        id: 'custom',
        label: 'Upload',
        type: 'image',
        img,
        emoji: '🖼️',
      }
      setCustomBg(bgConfig)
      handleSelect(bgConfig)
    }
    img.src = url
  }

  const allBgs = customBg ? [...BACKGROUNDS, customBg] : BACKGROUNDS

  return (
    <div>
      {/* MediaPipe status indicator */}
      <AnimatePresence>
        {segStatus === 'loading' && (
          <motion.div
            className="mb-3 flex items-center gap-2 glass px-3 py-2 rounded-xl text-xs text-purple-300"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="w-3 h-3 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
            Memuat model AI segmentasi… (sekali saja)
          </motion.div>
        )}
        {segStatus === 'error' && (
          <motion.div
            className="mb-3 flex items-center gap-2 glass px-3 py-2 rounded-xl text-xs text-red-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ⚠️ Gagal memuat AI. Background warna tetap tersedia.
          </motion.div>
        )}
        {segStatus === 'ready' && selected.type !== 'none' && (
          <motion.div
            className="mb-3 flex items-center gap-2 glass px-3 py-2 rounded-xl text-xs text-green-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            ✓ Segmentasi aktif
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background grid */}
      <div className="grid grid-cols-3 gap-2">
        {allBgs.map((bg) => (
          <BackgroundTile
            key={bg.id}
            bg={bg}
            isSelected={selected.id === bg.id}
            onSelect={() => handleSelect(bg)}
          />
        ))}

        {/* Upload custom background */}
        <button
          onClick={() => uploadRef.current?.click()}
          className="aspect-[4/3] rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white/40 hover:border-white/40 hover:text-white/60 transition-all text-xs"
        >
          <span className="text-xl">＋</span>
          <span>Upload</span>
        </button>
      </div>

      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}

function BackgroundTile({ bg, isSelected, onSelect }) {
  return (
    <motion.button
      onClick={onSelect}
      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
        isSelected ? 'border-pink-400 scale-105' : 'border-white/10 hover:border-white/30'
      }`}
      whileTap={{ scale: 0.95 }}
    >
      {/* Preview */}
      <div className="absolute inset-0" style={getBgStyle(bg)} />

      {/* Label overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
        <span className="text-base">{bg.emoji}</span>
        <span className="text-[10px] text-white font-medium mt-0.5 px-1 text-center leading-tight">
          {bg.label}
        </span>
      </div>

      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">✓</span>
        </div>
      )}
    </motion.button>
  )
}

/** Return an inline CSS style for previewing the background */
function getBgStyle(bg) {
  switch (bg.type) {
    case 'color':
      return { background: bg.value }
    case 'gradient':
      return { background: `linear-gradient(135deg, ${bg.value.join(', ')})` }
    case 'radial':
      return { background: `radial-gradient(circle, ${bg.value.join(', ')})` }
    case 'blur':
      return {
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        filter: 'blur(4px)',
      }
    case 'image':
      return bg.img
        ? { backgroundImage: `url(${bg.img.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: '#333' }
    default:
      return { background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }
  }
}
