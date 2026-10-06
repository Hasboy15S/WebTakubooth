import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCamera } from '../hooks/useCamera'
import { useSegmentation, drawBackground, compositePerson } from '../hooks/useSegmentation'
import { useGestureDetection } from '../hooks/useGestureDetection'
import BackgroundSelector from '../components/BackgroundSelector'
import { FILTERS, BACKGROUNDS } from '../utils/config'

// ── Constants ─────────────────────────────────────────────────────────────
const BURST_EMOJIS  = ['💗','✨','⭐','💫','🌸','🎊','💜','🩷','🎈','🌟']

const AMBIENT_SETS = {
  none:     null,
  hearts:   ['💗','🩷','❤️','💜','🩵','💛'],
  stars:    ['⭐','🌟','✨','💫','⚡','🌙'],
  flowers:  ['🌸','🌺','🌼','🌷','💐','🌻'],
  confetti: ['🎊','🎉','🎈','🎀','🪩','✨'],
}

const AMBIENT_OPTIONS = [
  { key: 'none',    label: 'Tidak Ada', emoji: '✕' },
  { key: 'hearts',  label: 'Hati',      emoji: '💗' },
  { key: 'stars',   label: 'Bintang',   emoji: '⭐' },
  { key: 'flowers', label: 'Bunga',     emoji: '🌸' },
  { key: 'confetti',label: 'Konfeti',   emoji: '🎊' },
]

// Shutter beep via Web Audio API
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

// Gesture detected sound (soft chime)
function playGestureChime() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)()
    const freqs = [523, 659, 784]
    freqs.forEach((freq, i) => {
      const o = ac.createOscillator(), g = ac.createGain()
      o.connect(g); g.connect(ac.destination)
      o.frequency.value = freq
      o.type = 'sine'
      const t = ac.currentTime + i * 0.08
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.15, t + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      o.start(t); o.stop(t + 0.3)
    })
  } catch (_) {}
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))

// ─────────────────────────────────────────────────────────────────────────────
// Particle system helpers (pure functions, mutates array in place for perf)
// ─────────────────────────────────────────────────────────────────────────────

function spawnBurst(arr, w, h) {
  for (let i = 0; i < 28; i++) {
    arr.push({
      x: w * (0.25 + Math.random() * 0.5),
      y: h * (0.2 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      emoji: BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)],
      size: 22 + Math.random() * 26,
      life: 1.0,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 12,
    })
  }
}

function spawnAmbient(arr, w, h, emojiSet) {
  if (!emojiSet) return
  arr.push({
    x: Math.random() * w,
    y: h + 20,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -1.4 - Math.random() * 1.8,
    emoji: emojiSet[Math.floor(Math.random() * emojiSet.length)],
    size: 14 + Math.random() * 18,
    life: 1.0,
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 2.5,
  })
}

function updateAndDrawParticles(ctx, particles, gravity = 0.45) {
  const alive = []
  for (const p of particles) {
    if (p.life <= 0) continue
    ctx.save()
    ctx.globalAlpha = Math.min(1, p.life * 2.5)
    ctx.font = `${p.size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot * Math.PI / 180)
    ctx.fillText(p.emoji, 0, 0)
    ctx.restore()
    p.x   += p.vx
    p.y   += p.vy
    p.vy  += gravity
    p.rot += p.rotV
    p.life -= 0.022
    alive.push(p)
  }
  return alive
}

function updateAndDrawAmbient(ctx, particles) {
  const alive = []
  for (const p of particles) {
    if (p.life <= 0 || p.y < -60) continue
    ctx.save()
    ctx.globalAlpha = Math.min(0.85, p.life * 3)
    ctx.font = `${p.size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot * Math.PI / 180)
    ctx.fillText(p.emoji, 0, 0)
    ctx.restore()
    p.x   += p.vx
    p.y   += p.vy
    p.rot += p.rotV
    p.life -= 0.005
    alive.push(p)
  }
  return alive
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionPage
// ─────────────────────────────────────────────────────────────────────────────
export default function SessionPage({ config, onComplete, onCancel }) {
  // ── Canvas refs ────────────────────────────────────────────────────────────
  const canvasRef        = useRef(null)  // main camera + segmentation canvas
  const particleCanvasRef = useRef(null) // transparent overlay for particles

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { videoRef, status: cameraStatus, error: cameraError, startCamera, stopCamera } = useCamera()
  const { segmenterRef, segStatus, loadSegmenter } = useSegmentation()
  const { landmarkerRef, gestureStatus, loadLandmarker, detectGesture, drawLandmarks } = useGestureDetection()

  // ── Settings state ─────────────────────────────────────────────────────────
  const [mirror,       setMirror]       = useState(true)
  const [activeFilter, setActiveFilter] = useState('normal')
  const [background,   setBackground]   = useState(BACKGROUNDS[0])
  const [gestureEnabled, setGestureEnabled] = useState(false)
  const [ambientKey,   setAmbientKey]   = useState('none')

  // ── Session state ──────────────────────────────────────────────────────────
  const [photos,      setPhotos]      = useState([])
  const [phase,       setPhase]       = useState('setup')
  const [countdownNum, setCountdownNum] = useState(null)
  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [flash,       setFlash]       = useState(false)
  const [activePanel, setActivePanel] = useState(null) // null | 'bg' | 'filter' | 'ambient' | 'gesture'

  // ── Gesture feedback state ─────────────────────────────────────────────────
  const [gestureHint, setGestureHint]   = useState(null)  // null | 'peace' | 'thumbsup'
  const [gestureCooldown, setGestureCooldown] = useState(false)
  const pendingCaptureRef = useRef(false)

  // ── Refs synced from state (for use inside rAF without stale closures) ─────
  const mirrorRef      = useRef(mirror)
  const filterRef      = useRef(activeFilter)
  const bgRef          = useRef(background)
  const gestureEnabledRef = useRef(gestureEnabled)
  const phaseRef       = useRef(phase)
  const ambientKeyRef  = useRef(ambientKey)

  useEffect(() => { mirrorRef.current = mirror },           [mirror])
  useEffect(() => { filterRef.current = activeFilter },     [activeFilter])
  useEffect(() => { bgRef.current = background },           [background])
  useEffect(() => { gestureEnabledRef.current = gestureEnabled }, [gestureEnabled])
  useEffect(() => { phaseRef.current = phase },             [phase])
  useEffect(() => { ambientKeyRef.current = ambientKey },   [ambientKey])

  // ── Offscreen canvas refs (reused, resized only when camera dimensions change) ──
  const offVideoRef  = useRef(null)
  const offPersonRef = useRef(null)

  // ── Particle refs ──────────────────────────────────────────────────────────
  const burstParticles   = useRef([])
  const ambientParticles = useRef([])
  const frameCountRef    = useRef(0)

  // ── Segmentation + gesture timing refs ────────────────────────────────────
  const lastSegTsRef    = useRef(0)
  const lastGestureTsRef = useRef(0)

  // Latest gesture result (for drawing landmarks)
  const lastGestureResultRef = useRef(null)

  // ─────────────────────────────────────────────────────────────────────────
  // rAF tick: segmentation → gesture detection → render
  // ─────────────────────────────────────────────────────────────────────────
  const maskRef = useRef(null)

  const tick = useCallback((ts) => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    const pCanvas = particleCanvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return

    // Resize canvases when video dimensions change
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width  = vw;  canvas.height  = vh
      if (pCanvas) { pCanvas.width = vw; pCanvas.height = vh }
      offVideoRef.current  = new OffscreenCanvas(vw, vh)
      offPersonRef.current = new OffscreenCanvas(vw, vh)
    }

    // ── 1. Segmentation (throttled ~15fps) ─────────────────────────────────
    const bg = bgRef.current
    if (bg.type !== 'none' && segStatus === 'ready' && segmenterRef.current && ts - lastSegTsRef.current > 66) {
      lastSegTsRef.current = ts
      try {
        const r = segmenterRef.current.segmentForVideo(video, ts)
        if (r.confidenceMasks?.[0]) {
          const m = r.confidenceMasks[0]
          maskRef.current = { data: m.getAsFloat32Array(), width: m.width, height: m.height }
          m.close()
        }
        r.close()
      } catch (_) {}
    }

    // ── 2. Gesture detection (throttled ~8fps) ─────────────────────────────
    if (gestureEnabledRef.current && gestureStatus === 'ready' && landmarkerRef.current && ts - lastGestureTsRef.current > 125) {
      lastGestureTsRef.current = ts
      const gr = detectGesture(video, ts)
      lastGestureResultRef.current = gr

      if (gr?.type && !pendingCaptureRef.current && phaseRef.current === 'setup') {
        pendingCaptureRef.current = true
        setGestureHint(gr.type)
        playGestureChime()
        // After 2-second grace period → trigger session
        setTimeout(() => {
          setGestureHint(null)
          pendingCaptureRef.current = false
          setGestureCooldown(true)
          // Dispatch a custom event to trigger startSession from the component
          window.dispatchEvent(new CustomEvent('takubooth:gesture-trigger'))
        }, 2000)
      }
    }

    // ── 3. Draw camera frame to main canvas ───────────────────────────────
    const ctx = canvas.getContext('2d')
    const filterCSS = FILTERS[filterRef.current]?.css ?? 'none'

    const useSegPath = bg.type !== 'none' && segStatus === 'ready' && maskRef.current
    if (useSegPath) {
      drawBackground(ctx, bg, vw, vh, video)
      compositePerson(ctx, video, maskRef.current, vw, vh, mirrorRef.current, filterCSS, offVideoRef.current, offPersonRef.current)
    } else {
      ctx.save()
      ctx.filter = filterCSS
      if (mirrorRef.current) { ctx.translate(vw, 0); ctx.scale(-1, 1) }
      ctx.drawImage(video, 0, 0, vw, vh)
      ctx.restore()
    }

    // ── 4. Draw hand landmarks (gesture visualization) ─────────────────────
    if (gestureEnabledRef.current && lastGestureResultRef.current?.landmarks) {
      drawLandmarks(ctx, lastGestureResultRef.current.landmarks, vw, vh, mirrorRef.current, lastGestureResultRef.current.type)
    }

    // ── 5. Gesture ring indicator ──────────────────────────────────────────
    // (drawn on main canvas so it's part of the visual feedback, not in photos)

    // ── 6. Draw particles to particle canvas ──────────────────────────────
    if (pCanvas) {
      const pCtx = pCanvas.getContext('2d')
      pCtx.clearRect(0, 0, vw, vh)

      // Burst particles
      burstParticles.current = updateAndDrawParticles(pCtx, burstParticles.current, 0.45)

      // Ambient particles (spawn every ~25 frames)
      frameCountRef.current++
      const ambSet = AMBIENT_SETS[ambientKeyRef.current]
      if (ambSet && frameCountRef.current % 25 === 0) {
        spawnAmbient(ambientParticles.current, vw, vh, ambSet)
      }
      ambientParticles.current = updateAndDrawAmbient(pCtx, ambientParticles.current)
    }
  }, [segStatus, gestureStatus, detectGesture, drawLandmarks, segmenterRef, landmarkerRef, videoRef])

  // ── rAF driver ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (cameraStatus !== 'active') return
    let frameId
    const loop = (ts) => { tick(ts); frameId = requestAnimationFrame(loop) }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [cameraStatus, tick])

  // ── Reset mask when background = none ─────────────────────────────────────
  useEffect(() => {
    if (background.type === 'none') maskRef.current = null
  }, [background.type])


  // ── Start camera on mount ──────────────────────────────────────────────────
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // Capture helpers
  // ─────────────────────────────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png', 1.0)
  }, [])

  const totalPhotos = config?.layout ?? 4
  const timerSecs   = config?.timer   ?? 3

  const startSession = useCallback(async () => {
    pendingCaptureRef.current = false
    setGestureCooldown(false)
    const captured = []

    for (let i = 0; i < totalPhotos; i++) {
      setCurrentIdx(i)
      setPhase('countdown')

      for (let t = timerSecs; t >= 1; t--) {
        setCountdownNum(t)
        await delay(1000)
      }
      setCountdownNum(null)

      // Flash → capture → burst particles
      setFlash(true)
      playShutter()
      try { navigator.vibrate?.([60, 40, 100]) } catch (_) {}
      await delay(80)
      const dataURL = captureFrame()
      // Spawn burst particles on particle canvas
      if (canvasRef.current) {
        spawnBurst(burstParticles.current, canvasRef.current.width, canvasRef.current.height)
      }
      setFlash(false)

      if (dataURL) {
        captured.push(dataURL)
        setPhotos([...captured])
      }

      if (i < totalPhotos - 1) {
        setPhase('between')
        await delay(900)
      }
    }

    setPhase('done')
    await delay(600)
    stopCamera()
    onComplete(captured)
  }, [totalPhotos, timerSecs, captureFrame, stopCamera, onComplete])

  // Keep startSession accessible to gesture and keyboard event listeners
  const startSessionRef = useRef(startSession)
  useEffect(() => { startSessionRef.current = startSession }, [startSession])
  
  useEffect(() => {
    const gestureHandler = () => { if (phaseRef.current === 'setup') startSessionRef.current() }
    window.addEventListener('takubooth:gesture-trigger', gestureHandler)

    const keyHandler = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (phaseRef.current === 'setup') {
          startSessionRef.current()
        }
      } else if (e.code === 'Escape') {
        if (phaseRef.current === 'setup') {
          stopCamera()
          onCancel()
        }
      }
    }
    window.addEventListener('keydown', keyHandler)

    return () => {
      window.removeEventListener('takubooth:gesture-trigger', gestureHandler)
      window.removeEventListener('keydown', keyHandler)
    }
  }, [stopCamera, onCancel])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const isCapturing = phase === 'countdown' || phase === 'between'

  return (
    <div className="relative min-h-dvh flex flex-col bg-[#070b14] overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
        <button
          className="btn-secondary px-4 py-2 text-sm"
          onClick={() => { stopCamera(); onCancel() }}
          disabled={isCapturing}
        >
          ← Kembali
        </button>

        {/* Photo progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPhotos }).map((_, i) => (
            <motion.div
              key={i}
              className={`rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                photos[i]             ? 'w-7 h-7 bg-cyan-500 text-slate-950 font-black'
                : i === currentIdx && phase === 'countdown'
                                      ? 'w-7 h-7 bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 font-black'
                                      : 'w-5 h-5 bg-white/15 text-white/40'
              }`}
              animate={photos[i] ? { scale: [1.3, 1] } : {}}
            >
              {photos[i] ? '✓' : i + 1}
            </motion.div>
          ))}
        </div>

        {/* Mirror toggle */}
        <button
          className={`btn-secondary px-3 py-2 text-sm ${mirror ? 'border-cyan-400/50 text-cyan-300' : ''}`}
          onClick={() => setMirror(m => !m)}
        >
          ↔️
        </button>
      </div>

      {/* ── Camera area ──────────────────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-0">

        {/* Camera status */}
        {cameraStatus === 'requesting' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-white/60">Meminta akses kamera…</p>
          </div>
        )}
        {(cameraStatus === 'denied' || cameraStatus === 'error') && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="text-5xl">📷</span>
            <h3 className="text-xl font-semibold">Kamera Tidak Dapat Diakses</h3>
            <p className="text-white/60 max-w-sm text-sm">{cameraError}</p>
            <button className="btn-primary px-6 py-3" onClick={startCamera}>Coba Lagi</button>
            <button className="btn-secondary px-6 py-2 text-sm" onClick={onCancel}>Kembali ke Beranda</button>
          </div>
        )}

        {/* Canvas wrapper — inline-block so particle canvas overlays exactly */}
        <div
          className="relative max-h-[70dvh] max-w-full"
          style={{ display: cameraStatus === 'active' ? 'inline-flex' : 'none' }}
        >
          <canvas
            ref={canvasRef}
            className="block max-h-[70dvh] max-w-full object-contain rounded-2xl shadow-2xl"
          />
          {/* Particle overlay — never captured in photos */}
          <canvas
            ref={particleCanvasRef}
            className="absolute inset-0 w-full h-full rounded-2xl pointer-events-none"
          />
        </div>

        {/* Flash overlay */}
        <AnimatePresence>
          {flash && (
            <motion.div
              className="absolute inset-0 bg-white pointer-events-none z-20 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.92 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
          )}
        </AnimatePresence>

        {/* Countdown number */}
        <AnimatePresence mode="wait">
          {countdownNum !== null && (
            <motion.div
              key={countdownNum}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <motion.span
                className="font-display text-white select-none"
                style={{
                  fontSize: 'clamp(80px, 22vw, 180px)',
                  textShadow: '0 0 80px rgba(192,132,252,0.9), 0 0 30px rgba(245,160,200,0.7)',
                }}
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {countdownNum}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gesture hint overlay */}
        <AnimatePresence>
          {gestureHint && (
            <motion.div
              className="absolute top-20 left-0 right-0 flex justify-center z-20 pointer-events-none"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="glass-strong px-6 py-3 rounded-full flex items-center gap-3">
                <motion.span
                  className="text-3xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                >
                  {gestureHint === 'peace' ? '✌️' : '👍'}
                </motion.span>
                <div>
                  <p className="text-white font-semibold">
                    {gestureHint === 'peace' ? 'Peace sign terdeteksi!' : 'Thumbs up terdeteksi!'}
                  </p>
                  <p className="text-white/60 text-sm">Mulai foto dalam 2 detik…</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo counter */}
        <AnimatePresence>
          {phase === 'countdown' && (
            <motion.div
              className="absolute top-20 left-0 right-0 flex justify-center z-10"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass px-4 py-2 rounded-full text-sm font-medium text-white/90">
                📸 Foto {currentIdx + 1} dari {totalPhotos}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thumbnail strip */}
        {photos.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            <AnimatePresence>
              {photos.map((p, i) => (
                <motion.img
                  key={i} src={p} alt={`foto ${i + 1}`}
                  className="w-14 h-10 object-cover rounded-lg border-2 border-white/25 shadow-lg"
                  initial={{ x: 40, opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Bottom controls ───────────────────────────────────────────────── */}
      {cameraStatus === 'active' && (
        <div className="relative z-20 flex flex-col items-center gap-3 px-4 pb-5 pt-2">

          {/* Expandable panels */}
          <AnimatePresence>
            {activePanel === 'bg' && (
              <Panel title="🌄 Ganti Background" onClose={() => setActivePanel(null)}>
                <div className="overflow-y-auto max-h-52">
                  <BackgroundSelector
                    selected={background}
                    onSelect={(bg) => {
                      setBackground(bg)
                      if (bg.type === 'none') setActivePanel(null)
                    }}
                    segStatus={segStatus}
                    loadSegmenter={loadSegmenter}
                  />
                </div>
              </Panel>
            )}

            {activePanel === 'filter' && (
              <Panel title="🎨 Filter" onClose={() => setActivePanel(null)}>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {Object.entries(FILTERS).map(([key, f]) => (
                    <button key={key}
                      onClick={() => setActiveFilter(key)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl border text-xs transition-all ${
                        activeFilter === key
                          ? 'border-pink-400 bg-pink-500/20 text-pink-300'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/25'
                      }`}
                    >
                      <span className="text-base">{f.emoji}</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </Panel>
            )}

            {activePanel === 'ambient' && (
              <Panel title="✨ Efek Partikel" onClose={() => setActivePanel(null)}>
                <div className="grid grid-cols-5 gap-2">
                  {AMBIENT_OPTIONS.map(opt => (
                    <button key={opt.key}
                      onClick={() => setAmbientKey(opt.key)}
                      className={`py-2 rounded-xl border flex flex-col items-center gap-1 text-xs transition-all ${
                        ambientKey === opt.key
                          ? 'border-pink-400 bg-pink-500/20 text-pink-300'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/25'
                      }`}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </Panel>
            )}

            {activePanel === 'gesture' && (
              <Panel title="✌️ Gesture Snap" onClose={() => setActivePanel(null)}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80 font-medium">Aktifkan Gesture Snap</p>
                      <p className="text-xs text-white/40">Tunjukkan ✌️ atau 👍 ke kamera untuk jepret otomatis</p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !gestureEnabled
                        setGestureEnabled(next)
                        if (next && gestureStatus === 'idle') loadLandmarker()
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        gestureEnabled ? 'bg-purple-500' : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        gestureEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {gestureStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-xs text-purple-300">
                      <div className="w-3 h-3 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                      Memuat model deteksi tangan…
                    </div>
                  )}
                  {gestureStatus === 'ready' && (
                    <div className="text-xs text-green-400">✓ Model siap! Coba tunjukkan ✌️ ke kamera.</div>
                  )}
                  {gestureStatus === 'error' && (
                    <div className="text-xs text-red-400">⚠️ Gagal memuat model. Coba lagi.</div>
                  )}

                  <div className="flex gap-3 text-center text-xs text-white/40">
                    <div className="flex-1 glass rounded-xl p-2">
                      <div className="text-2xl mb-1">✌️</div>
                      <div>Peace Sign</div>
                      <div>Mulai jepret</div>
                    </div>
                    <div className="flex-1 glass rounded-xl p-2">
                      <div className="text-2xl mb-1">👍</div>
                      <div>Thumbs Up</div>
                      <div>Mulai jepret</div>
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </AnimatePresence>

          {/* Tool row */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <ToolPill
              active={activePanel === 'bg' || background.type !== 'none'}
              onClick={() => setActivePanel(p => p === 'bg' ? null : 'bg')}
              loading={segStatus === 'loading'}
            >
              {background.emoji} <span className="max-sm:hidden">{background.label}</span>
            </ToolPill>

            <ToolPill
              active={activePanel === 'ambient' || ambientKey !== 'none'}
              onClick={() => setActivePanel(p => p === 'ambient' ? null : 'ambient')}
            >
              {AMBIENT_SETS[ambientKey] ? AMBIENT_SETS[ambientKey][0] : '✨'}
              <span className="max-sm:hidden">Partikel</span>
            </ToolPill>

            {/* ── Main capture button ───────────────────────────── */}
            <motion.button
              className="btn-primary w-16 h-16 rounded-full text-2xl shadow-2xl flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 0 32px rgba(6,182,212,0.55)' }}
              onClick={startSession}
              disabled={isCapturing}
              whileHover={!isCapturing ? { scale: 1.1 } : {}}
              whileTap={!isCapturing ? { scale: 0.9 } : {}}
            >
              {isCapturing
                ? <div className="w-6 h-6 rounded-full border-3 border-white/70 border-t-transparent animate-spin" />
                : '📸'
              }
            </motion.button>

            <ToolPill
              active={activePanel === 'gesture' || gestureEnabled}
              onClick={() => setActivePanel(p => p === 'gesture' ? null : 'gesture')}
              loading={gestureStatus === 'loading'}
            >
              ✌️ <span className="max-sm:hidden">Gesture</span>
            </ToolPill>

            <ToolPill
              active={activePanel === 'filter' || activeFilter !== 'normal'}
              onClick={() => setActivePanel(p => p === 'filter' ? null : 'filter')}
            >
              {FILTERS[activeFilter]?.emoji} <span className="max-sm:hidden">{FILTERS[activeFilter]?.label}</span>
            </ToolPill>
          </div>

          {!isCapturing && (
            <p className="text-white/40 text-xs text-center flex items-center justify-center gap-1.5 flex-wrap">
              <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">Space</span>
              <span>atau klik tombol untuk mulai</span>
              <span>·</span>
              <span>{totalPhotos} foto</span>
              <span>·</span>
              <span>{timerSecs}s timer</span>
              {gestureEnabled && gestureStatus === 'ready' && (
                <>
                  <span>·</span>
                  <span className="text-purple-300">✌️ gesture aktif</span>
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Small reusable components ─────────────────────────────────────────────────

function Panel({ title, children, onClose }) {
  return (
    <motion.div
      className="w-full max-w-lg glass rounded-2xl p-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white/80">{title}</span>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 text-xl leading-none">×</button>
      </div>
      {children}
    </motion.div>
  )
}

function ToolPill({ children, active, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all ${
        active
          ? 'border-purple-400 bg-purple-500/20 text-purple-300'
          : 'border-white/15 bg-white/5 text-white/60 hover:border-white/30'
      }`}
    >
      {children}
      {loading && <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin flex-shrink-0" />}
    </button>
  )
}
