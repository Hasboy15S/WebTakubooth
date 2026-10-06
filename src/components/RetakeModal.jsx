import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCamera } from '../hooks/useCamera'
import { FILTERS } from '../utils/config'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

function playShutter() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)()
    const o = ac.createOscillator(), g = ac.createGain()
    o.connect(g); g.connect(ac.destination)
    o.frequency.value = 900
    g.gain.setValueAtTime(0.25, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18)
    o.start(); o.stop(ac.currentTime + 0.18)
  } catch (_) {}
}

/**
 * RetakeModal
 * 
 * A camera overlay for retaking a single photo at a given index.
 * Opens camera → 3-second countdown → captures → shows preview → confirm or retry.
 *
 * @prop {number}   photoIndex - which photo index is being retaken (0-based)
 * @prop {function} onConfirm  - called with new dataURL when user confirms
 * @prop {function} onClose    - called when user cancels
 */
export default function RetakeModal({ photoIndex, onConfirm, onClose }) {
  const canvasRef = useRef(null)
  const { videoRef, status, error, startCamera, stopCamera } = useCamera()

  const [flash,     setFlash]     = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [captured,  setCaptured]  = useState(null) // preview dataURL
  const [mirror,    setMirror]    = useState(true)

  const mirrorRef = useRef(mirror)
  useEffect(() => { mirrorRef.current = mirror }, [mirror])

  // ── Render loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'active') return
    let frameId
    const loop = () => {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState >= 2) {
        const vw = video.videoWidth, vh = video.videoHeight
        if (canvas.width !== vw || canvas.height !== vh) {
          canvas.width = vw; canvas.height = vh
        }
        const ctx = canvas.getContext('2d')
        ctx.save()
        if (mirrorRef.current) { ctx.translate(vw, 0); ctx.scale(-1, 1) }
        ctx.drawImage(video, 0, 0, vw, vh)
        ctx.restore()
      }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [status, videoRef])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  // ── Capture with countdown ───────────────────────────────────────────────
  const captureWithCountdown = useCallback(async () => {
    for (let t = 3; t >= 1; t--) {
      setCountdown(t)
      await delay(1000)
    }
    setCountdown(null)
    setFlash(true)
    playShutter()
    await delay(80)
    const dataURL = canvasRef.current?.toDataURL('image/png', 1.0)
    setFlash(false)
    setCaptured(dataURL ?? null)
    stopCamera()
  }, [stopCamera])

  const handleConfirm = () => {
    if (captured) { onConfirm(captured); onClose() }
  }

  const handleRetry = () => {
    setCaptured(null)
    startCamera()
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="glass-strong rounded-3xl w-full max-w-sm overflow-hidden"
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 24, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="font-semibold text-white">Ulangi Foto {photoIndex + 1}</h3>
            <p className="text-xs text-white/40">Ambil foto pengganti yang lebih keren</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-lg p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => setMirror(m => !m)}
              title="Flip"
            >
              ↔️
            </button>
            <button
              className="text-xl text-white/40 hover:text-white/80 transition-colors p-1.5"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        {/* Camera or preview */}
        <div className="px-5 pb-5 space-y-4">
          {!captured ? (
            // ── Camera preview ─────────────────────────────────────────────
            <>
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                {/* Live canvas */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-cover"
                  style={{ display: status === 'active' ? 'block' : 'none' }}
                />

                {/* Status overlays */}
                {status === 'requesting' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-3 border-purple-400 border-t-transparent animate-spin" />
                  </div>
                )}
                {(status === 'denied' || status === 'error') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <span className="text-3xl">📷</span>
                    <p className="text-xs text-white/60">{error}</p>
                    <button className="btn-primary px-4 py-2 text-sm" onClick={startCamera}>Coba Lagi</button>
                  </div>
                )}

                {/* Flash */}
                <AnimatePresence>
                  {flash && (
                    <motion.div
                      className="absolute inset-0 bg-white"
                      initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>

                {/* Countdown */}
                <AnimatePresence mode="wait">
                  {countdown !== null && (
                    <motion.div
                      key={countdown}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <motion.span
                        className="text-9xl font-display text-white"
                        style={{ textShadow: '0 0 60px rgba(192,132,252,0.8)' }}
                        initial={{ scale: 1.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {countdown}
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
                onClick={captureWithCountdown}
                disabled={status !== 'active' || countdown !== null}
                whileTap={{ scale: 0.97 }}
              >
                📸 Ambil Foto (3 detik)
              </motion.button>
            </>
          ) : (
            // ── Preview captured photo ──────────────────────────────────────
            <>
              <motion.div
                className="rounded-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <img src={captured} alt="Hasil retake" className="w-full" />
              </motion.div>

              <div className="flex gap-3">
                <motion.button
                  className="btn-secondary flex-1 py-3 text-sm"
                  onClick={handleRetry}
                  whileTap={{ scale: 0.96 }}
                >
                  🔄 Coba Lagi
                </motion.button>
                <motion.button
                  className="btn-primary flex-1 py-3 text-sm"
                  onClick={handleConfirm}
                  whileTap={{ scale: 0.96 }}
                >
                  ✓ Gunakan Ini
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
