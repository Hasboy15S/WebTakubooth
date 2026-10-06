import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * useCamera - manages camera stream lifecycle only.
 * Does NOT own a render loop — the consumer (SessionPage) drives rendering
 * via its own rAF loop using videoRef.current.
 */
export function useCamera() {
  const videoRef = useRef(null)    // hidden <video> element driven by stream
  const streamRef = useRef(null)   // MediaStream
  const [status, setStatus] = useState('idle') // idle | requesting | active | denied | error
  const [error, setError] = useState(null)

  /** Request camera permission and start stream */
  const startCamera = useCallback(async (deviceId = null) => {
    setStatus('requesting')
    setError(null)

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Create a persistent hidden video element
      if (!videoRef.current) {
        const vid = document.createElement('video')
        vid.playsInline = true
        vid.muted = true
        vid.autoplay = true
        videoRef.current = vid
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setStatus('active')
    } catch (err) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('denied')
        setError('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.')
      } else if (err.name === 'NotFoundError') {
        setStatus('error')
        setError('Kamera tidak ditemukan. Pastikan kamera terhubung.')
      } else {
        setStatus('error')
        setError(`Terjadi kesalahan: ${err.message}`)
      }
    }
  }, [])

  /** Stop camera and release resources */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus('idle')
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera])

  return { videoRef, status, error, startCamera, stopCamera }
}
