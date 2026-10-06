import { useRef, useState, useCallback, useEffect } from 'react'

const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task'

/** MediaPipe hand bone connections for skeleton drawing */
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
]

/**
 * Detect peace/victory sign ✌️
 * Index + middle fingers extended, ring + pinky bent.
 */
function isPeaceSign(hand) {
  const indexUp  = hand[8].y  < hand[6].y  - 0.02
  const middleUp = hand[12].y < hand[10].y - 0.02
  const ringDown = hand[16].y > hand[14].y
  const pinkyDown = hand[20].y > hand[18].y
  return indexUp && middleUp && ringDown && pinkyDown
}

/**
 * Detect thumbs-up 👍
 * Thumb tip well above thumb base, other fingers bent.
 */
function isThumbsUp(hand) {
  const thumbUp  = hand[4].y < hand[2].y - 0.12
  const indexBent  = hand[8].y > hand[5].y
  const middleBent = hand[12].y > hand[9].y
  return thumbUp && indexBent && middleBent
}

/**
 * useGestureDetection
 *
 * Lazily loads MediaPipe HandLandmarker.
 * Provides detectGesture() and drawLandmarks() for use in a rAF loop.
 */
export function useGestureDetection() {
  const landmarkerRef = useRef(null)
  const [gestureStatus, setGestureStatus] = useState('idle') // idle|loading|ready|error

  /** Lazy-load the HandLandmarker model */
  const loadLandmarker = useCallback(async () => {
    if (landmarkerRef.current || gestureStatus === 'loading') return
    setGestureStatus('loading')
    try {
      const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
      const lm = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 1,
      })
      landmarkerRef.current = lm
      setGestureStatus('ready')
      console.log('[useGestureDetection] HandLandmarker ready ✅')
    } catch (e) {
      console.error('[useGestureDetection]', e)
      setGestureStatus('error')
    }
  }, [gestureStatus])

  /**
   * Run gesture detection on the current video frame.
   * Returns: 'peace' | 'thumbsup' | null
   */
  const detectGesture = useCallback((video, ts) => {
    if (!landmarkerRef.current || !video || video.readyState < 2) return null
    try {
      const result = landmarkerRef.current.detectForVideo(video, ts)
      const hands = result.landmarks
      if (!hands || hands.length === 0) { result.close?.(); return null }
      const hand = hands[0]
      result.close?.()
      if (isPeaceSign(hand)) return { type: 'peace', landmarks: hand }
      if (isThumbsUp(hand)) return { type: 'thumbsup', landmarks: hand }
      return { type: null, landmarks: hand } // hand visible but no gesture
    } catch (_) { return null }
  }, [])

  /**
   * Draw hand skeleton + landmark dots on a canvas 2D context.
   * Accounts for mirror mode by flipping x coordinates.
   */
  const drawLandmarks = useCallback((ctx, landmarks, vw, vh, mirror, gestureType) => {
    if (!landmarks) return

    const lx = (lm) => (mirror ? 1 - lm.x : lm.x) * vw
    const ly = (lm) => lm.y * vh

    // Pick colors based on detected gesture
    const lineColor = gestureType === 'peace'
      ? 'rgba(245,160,200,0.85)'
      : gestureType === 'thumbsup'
      ? 'rgba(110,231,183,0.85)'
      : 'rgba(192,132,252,0.6)'
    const dotColor = gestureType ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'

    // Connections
    ctx.save()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo(lx(landmarks[a]), ly(landmarks[a]))
      ctx.lineTo(lx(landmarks[b]), ly(landmarks[b]))
      ctx.stroke()
    }

    // Dots
    ctx.fillStyle = dotColor
    for (const lm of landmarks) {
      ctx.beginPath()
      ctx.arc(lx(lm), ly(lm), 5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }, [])

  // Cleanup
  useEffect(() => () => {
    try { landmarkerRef.current?.close() } catch (_) {}
  }, [])

  return { landmarkerRef, gestureStatus, loadLandmarker, detectGesture, drawLandmarks }
}
