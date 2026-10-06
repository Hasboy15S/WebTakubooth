import GIF from 'gif.js'

/**
 * createGIF
 * Encodes an array of photo dataURLs into an animated GIF using gif.js.
 * Worker is served from /gif.worker.js (copied from node_modules in build).
 *
 * @param {string[]} photoDataURLs - array of dataURL strings
 * @param {object}   opts
 * @param {number}   opts.delay      - frame delay in ms (default 500)
 * @param {number}   opts.width      - output width in px (default 420)
 * @param {number}   opts.quality    - gif.js quality 1 (best)–20 (fastest) (default 8)
 * @param {function} opts.onProgress - called with 0–100 progress value
 * @returns {Promise<string>}        - object URL of the resulting GIF blob
 */
export function createGIF(photoDataURLs, { delay = 500, width = 420, quality = 8, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality,
      width,
      workerScript: '/gif.worker.js',
      repeat: 0,    // loop forever
    })

    let loaded = 0

    const addFrame = (dataURL) =>
      new Promise((res) => {
        const img = new Image()
        img.onload = () => {
          // Letterbox into output width, preserving aspect ratio
          const aspect = img.height / img.width
          const canvas = document.createElement('canvas')
          canvas.width  = width
          canvas.height = Math.round(width * aspect)
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          gif.addFrame(canvas, { delay, copy: true })
          loaded++
          onProgress?.(Math.round((loaded / photoDataURLs.length) * 50)) // 0–50% for loading
          res()
        }
        img.onerror = res // skip broken frames
        img.src = dataURL
      })

    // Load all photos then encode
    Promise.all(photoDataURLs.map(addFrame)).then(() => {
      gif.on('progress', (p) => onProgress?.(50 + Math.round(p * 50))) // 50–100% for encoding
      gif.on('finished', (blob) => {
        resolve(URL.createObjectURL(blob))
      })
      gif.on('error', reject)
      gif.render()
    })
  })
}

/**
 * Download a blob/object URL as a file.
 */
export function downloadURL(url, filename = 'takubooth.gif') {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke after a tick to allow download to start
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
