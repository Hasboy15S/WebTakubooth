import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/** All available sticker emoji categories */
export const STICKER_CATEGORIES = [
  {
    label: '💗 Hati',
    stickers: ['💗','❤️','🩷','💜','🩵','💙','🧡','💛','💚','🖤','🤍','🫀'],
  },
  {
    label: '✨ Bintang',
    stickers: ['⭐','🌟','✨','💫','⚡','🌙','☀️','🌈','🌠','💥','🔥','❄️'],
  },
  {
    label: '🌸 Bunga',
    stickers: ['🌸','🌺','🌼','🌻','🌹','🌷','🌱','🍀','🌿','🪷','💐','🌾'],
  },
  {
    label: '🦋 Lucu',
    stickers: ['🦋','🐝','🦄','🍄','🍒','🍓','🍑','🍭','🧁','🎀','🪩','🫧'],
  },
  {
    label: '🎊 Seru',
    stickers: ['🎊','🎉','🎈','🎁','🏆','🎆','🎇','🥳','🎂','🎠','🌟','✌️'],
  },
]

/** Default sticker properties when added */
const DEFAULT_SIZE = 48

/**
 * StickerLayer
 *
 * Renders draggable sticker elements absolutely over a container.
 * Sticker positions are stored as (x,y) in [0,1] fractions of the container.
 *
 * @prop {Array}    stickers       - current sticker array
 * @prop {Function} onUpdate       - called with new sticker array on change
 * @prop {object}   containerRef   - ref to the container element (for coord mapping)
 */
export function StickerLayer({ stickers, onUpdate, containerRef }) {
  const [selectedId, setSelectedId] = useState(null)
  const draggingRef = useRef(null) // { id, offsetX, offsetY }

  /** Delete selected sticker */
  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    onUpdate(stickers.filter(s => s.id !== selectedId))
    setSelectedId(null)
  }, [selectedId, stickers, onUpdate])

  /** Handle drag start (mouse or touch) */
  const handlePointerDown = useCallback((e, sticker) => {
    e.preventDefault()
    e.stopPropagation()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    draggingRef.current = {
      id: sticker.id,
      offsetX: clientX - rect.left - sticker.x * rect.width,
      offsetY: clientY - rect.top - sticker.y * rect.height,
    }
    setSelectedId(sticker.id)
  }, [containerRef])

  /** Deselect when clicking outside stickers */
  const handleContainerClick = useCallback((e) => {
    if (e.target === e.currentTarget) setSelectedId(null)
  }, [])

  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current) return
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY

      const newX = Math.max(0.02, Math.min(0.98,
        (clientX - rect.left - draggingRef.current.offsetX) / rect.width
      ))
      const newY = Math.max(0.02, Math.min(0.98,
        (clientY - rect.top - draggingRef.current.offsetY) / rect.height
      ))

      onUpdate(stickers.map(s =>
        s.id === draggingRef.current.id ? { ...s, x: newX, y: newY } : s
      ))
    }

    const handleUp = () => { draggingRef.current = null }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchend', handleUp)
    }
  }, [stickers, onUpdate, containerRef])

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onClick={handleContainerClick}
    >
      <AnimatePresence>
        {stickers.map((s) => (
          <motion.div
            key={s.id}
            className="absolute select-none cursor-grab active:cursor-grabbing"
            style={{
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              fontSize: s.size ?? DEFAULT_SIZE,
              transform: `translate(-50%, -50%) rotate(${s.rotation ?? 0}deg)`,
              zIndex: selectedId === s.id ? 50 : 10,
              filter: selectedId === s.id
                ? 'drop-shadow(0 0 8px rgba(245,160,200,0.9))'
                : 'none',
            }}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: s.rotation ?? 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 400 }}
            onMouseDown={(e) => handlePointerDown(e, s)}
            onTouchStart={(e) => handlePointerDown(e, s)}
          >
            {s.emoji}

            {/* Delete button on selected */}
            {selectedId === s.id && (
              <motion.button
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full text-white flex items-center justify-center shadow-lg z-50"
                style={{ fontSize: 12, lineHeight: 1 }}
                onClick={(e) => { e.stopPropagation(); deleteSelected() }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.2 }}
              >
                ×
              </motion.button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * StickerPicker - panel to select and add stickers
 */
export function StickerPicker({ onAdd }) {
  const [activeCategory, setActiveCategory] = useState(0)

  const addSticker = (emoji) => {
    onAdd({
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      emoji,
      x: 0.3 + Math.random() * 0.4,
      y: 0.2 + Math.random() * 0.6,
      size: DEFAULT_SIZE,
      rotation: (Math.random() - 0.5) * 20,
    })
  }

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {STICKER_CATEGORIES.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveCategory(i)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
              activeCategory === i
                ? 'border-pink-400 bg-pink-500/20 text-pink-300'
                : 'border-white/10 bg-white/5 text-white/50 hover:border-white/25'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-6 gap-2">
        {STICKER_CATEGORIES[activeCategory].stickers.map((emoji) => (
          <motion.button
            key={emoji}
            onClick={() => addSticker(emoji)}
            className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl hover:bg-white/15 hover:border-white/30 transition-all"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            {emoji}
          </motion.button>
        ))}
      </div>

      <p className="text-xs text-white/30 mt-3 text-center">
        Klik stiker untuk tambahkan · Seret untuk pindahkan
      </p>
    </div>
  )
}
