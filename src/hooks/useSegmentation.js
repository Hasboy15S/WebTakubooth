import { useRef, useState, useCallback, useEffect } from 'react'

// MediaPipe model URLs (loaded from CDN so no WASM bundling headache)
const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite'

/**
 * useSegmentation
 *
 * Lazily loads MediaPipe ImageSegmenter (selfie_segmenter model).
 * Exposes segmenterRef and a runSegmentation() function that returns
 * a confidence mask as Uint8ClampedArray (values 0-255, person = higher).
 *
 * Usage:
 *   const { segStatus, segmenterRef, loadSegmenter } = useSegmentation()
 *   // trigger load when user enables background replacement
 *   // then call segmenterRef.current.segmentForVideo(video, ts) in render loop
 */
export function useSegmentation() {
  const segmenterRef = useRef(null)
  const [segStatus, setSegStatus] = useState('idle') // idle | loading | ready | error
  const [segError, setSegError] = useState(null)

  /** Load the MediaPipe segmenter lazily */
  const loadSegmenter = useCallback(async () => {
    if (segmenterRef.current) return        // already loaded
    if (segStatus === 'loading') return     // already in progress

    setSegStatus('loading')
    setSegError(null)

    try {
      // Dynamic import so this big lib only loads when needed
      const { ImageSegmenter, FilesetResolver } = await import('@mediapipe/tasks-vision')

      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)

      const segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU', // falls back to CPU automatically
        },
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true, // smooth alpha at edges
      })

      segmenterRef.current = segmenter
      setSegStatus('ready')
      console.log('[useSegmentation] MediaPipe ready ✅')
    } catch (err) {
      console.error('[useSegmentation] Load error:', err)
      setSegStatus('error')
      setSegError(err.message)
    }
  }, [segStatus])

  /** Unload and free WASM memory */
  const unloadSegmenter = useCallback(() => {
    if (segmenterRef.current) {
      try { segmenterRef.current.close() } catch (_) {}
      segmenterRef.current = null
    }
    setSegStatus('idle')
  }, [])

  // Free on unmount
  useEffect(() => () => unloadSegmenter(), [])

  return {
    segmenterRef,
    segStatus,   // 'idle' | 'loading' | 'ready' | 'error'
    segError,
    loadSegmenter,
    unloadSegmenter,
  }
}

// ─────────────────────────────────────────────
// Canvas compositing helpers (pure functions)
// ─────────────────────────────────────────────

/**
 * Draw a background config onto a canvas 2D context.
 * type: 'none' | 'color' | 'gradient' | 'blur' | 'image'
 */
export function drawBackground(ctx, bgConfig, w, h, video) {
  switch (bgConfig.type) {
    case 'color':
      ctx.fillStyle = bgConfig.value
      ctx.fillRect(0, 0, w, h)
      break

    case 'gradient': {
      const grad = ctx.createLinearGradient(0, 0, w, h)
      bgConfig.value.forEach((c, i) => {
        grad.addColorStop(i / (bgConfig.value.length - 1), c)
      })
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      break
    }

    case 'radial': {
      const rg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2)
      bgConfig.value.forEach((c, i) => {
        rg.addColorStop(i / (bgConfig.value.length - 1), c)
      })
      ctx.fillStyle = rg
      ctx.fillRect(0, 0, w, h)
      break
    }

    case 'blur':
      // Draw video blurred (slightly oversize to hide blur edges)
      ctx.save()
      ctx.filter = 'blur(24px)'
      ctx.drawImage(video, -30, -30, w + 60, h + 60)
      ctx.restore()
      break

    case 'image':
      if (bgConfig.img) {
        const { sx, sy, sw, sh } = coverFit(bgConfig.img.width, bgConfig.img.height, w, h)
        ctx.drawImage(bgConfig.img, sx, sy, sw, sh, 0, 0, w, h)
      }
      break

    default:
      // 'none' — raw video, handled by caller
      break
  }
}

/**
 * Composite person-only pixels from video onto the main canvas (which already has background).
 * Uses confidence mask for smooth feathered edges at hair, shoulders, etc.
 *
 * @param {CanvasRenderingContext2D} ctx - main canvas ctx (background already drawn)
 * @param {HTMLVideoElement} video
 * @param {{ data: Float32Array, width: number, height: number }} maskInfo
 * @param {number} vw - canvas width (video width)
 * @param {number} vh - canvas height (video height)
 * @param {boolean} mirror - flip horizontal
 * @param {string} filterCSS - CSS filter string for the video (applied to person layer)
 * @param {OffscreenCanvas} offVideo - reused offscreen canvas (video+filter+mirror)
 * @param {OffscreenCanvas} offPerson - reused offscreen canvas (person with mask alpha)
 */
export function compositePerson(ctx, video, maskInfo, vw, vh, mirror, filterCSS, offVideo, offPerson) {
  const { data: maskData, width: mw, height: mh } = maskInfo

  // Step 1: Draw video (with mirror + filter) to offVideo
  const offVCtx = offVideo.getContext('2d')
  offVCtx.save()
  offVCtx.filter = filterCSS || 'none'
  if (mirror) {
    offVCtx.translate(vw, 0)
    offVCtx.scale(-1, 1)
  }
  offVCtx.drawImage(video, 0, 0, vw, vh)
  offVCtx.restore()

  // Step 2: Build mask ImageData at mask resolution (mw × mh)
  const maskImgData = new ImageData(mw, mh)
  for (let i = 0; i < maskData.length; i++) {
    // Soft threshold: remap [0.3, 0.9] confidence → [0, 255] alpha
    const conf = maskData[i]
    const alpha = conf < 0.3 ? 0 : conf > 0.9 ? 255 : Math.round(((conf - 0.3) / 0.6) * 255)
    maskImgData.data[i * 4]     = 255
    maskImgData.data[i * 4 + 1] = 255
    maskImgData.data[i * 4 + 2] = 255
    maskImgData.data[i * 4 + 3] = alpha
  }

  // Use a small scratch canvas to hold the mask image
  const maskCanvas = new OffscreenCanvas(mw, mh)
  maskCanvas.getContext('2d').putImageData(maskImgData, 0, 0)

  // Step 3: Copy video to offPerson, clip by mask
  const offPCtx = offPerson.getContext('2d')
  offPCtx.clearRect(0, 0, vw, vh)
  offPCtx.drawImage(offVideo, 0, 0)              // person + bg pixels
  offPCtx.globalCompositeOperation = 'destination-in'
  offPCtx.drawImage(maskCanvas, 0, 0, vw, vh)    // mask (scaled bilinearly)
  offPCtx.globalCompositeOperation = 'source-over' // reset

  // Step 4: Draw person layer onto main canvas (which has background)
  ctx.drawImage(offPerson, 0, 0)
}

/** Object-fit: cover source crop rect */
function coverFit(iw, ih, tw, th) {
  const scale = Math.max(tw / iw, th / ih)
  const sw = tw / scale
  const sh = th / scale
  const sx = (iw - sw) / 2
  const sy = (ih - sh) / 2
  return { sx, sy, sw, sh }
}
