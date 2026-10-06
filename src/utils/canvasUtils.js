import { FILTERS, applyGradientBackground } from './config'

/**
 * Applies a named CSS filter to a canvas ImageData by drawing to an offscreen canvas
 * with CSS filter and reading back. Works across all browsers.
 */
export async function applyFilterToCanvas(sourceCanvas, filterKey) {
  const filter = FILTERS[filterKey]
  if (!filter || filter.css === 'none') return sourceCanvas

  const off = new OffscreenCanvas(sourceCanvas.width, sourceCanvas.height)
  const ctx = off.getContext('2d')
  ctx.filter = filter.css
  ctx.drawImage(sourceCanvas, 0, 0)
  return off
}

/**
 * Compose a photostrip from an array of photo dataURLs.
 *
 * @param {string[]} photos    - array of dataURL strings
 * @param {object}   frame     - frame theme object from FRAMES
 * @param {object}   layout    - layout config from STRIP_LAYOUTS
 * @param {string}   labelText - bottom label text
 * @param {Array}    stickers  - array of sticker objects {emoji, x, y, size, rotation}
 * @returns {Promise<string>}  - dataURL of the composed strip PNG
 */
export async function composeStrip(photos, frame, layout, labelText = '', stickers = []) {
  const { cols, rows } = layout

  // Strip dimensions
  const PADDING = 24          // outer padding
  const GAP = 12              // gap between photos
  const PHOTO_W = 360         // width of each photo cell
  const PHOTO_H = Math.round(PHOTO_W / (4 / 3)) // respect aspect ratio
  const FOOTER_H = 60         // space for text label
  const HEADER_H = 40         // space at top

  const stripW = PADDING * 2 + PHOTO_W * cols + GAP * (cols - 1)
  const stripH = HEADER_H + PADDING + PHOTO_H * rows + GAP * (rows - 1) + FOOTER_H + PADDING

  const canvas = document.createElement('canvas')
  canvas.width = stripW
  canvas.height = stripH
  const ctx = canvas.getContext('2d')

  // ── Background fill ──
  ctx.fillStyle = frame.bgColor
  ctx.fillRect(0, 0, stripW, stripH)

  // Decorative border
  ctx.strokeStyle = frame.borderColor
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, stripW - 4, stripH - 4)

  // ── Load & draw each photo ──
  const loadImg = (src) =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.src = src
    })

  for (let i = 0; i < photos.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)

    const x = PADDING + col * (PHOTO_W + GAP)
    const y = HEADER_H + PADDING / 2 + row * (PHOTO_H + GAP)

    // Round-corner clip
    ctx.save()
    roundRect(ctx, x, y, PHOTO_W, PHOTO_H, 8)
    ctx.clip()

    if (photos[i]) {
      const img = await loadImg(photos[i])
      // Cover-fit the image into the cell
      const { sx, sy, sw, sh } = coverFit(img.width, img.height, PHOTO_W, PHOTO_H)
      ctx.drawImage(img, sx, sy, sw, sh, x, y, PHOTO_W, PHOTO_H)
    } else {
      // Placeholder for missing photos
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(x, y, PHOTO_W, PHOTO_H)
    }

    ctx.restore()

    // Photo number badge
    ctx.fillStyle = frame.accentColor + 'cc'
    ctx.beginPath()
    ctx.arc(x + 18, y + 18, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(i + 1, x + 18, y + 18)
  }

  // ── Footer text ──
  const footerY = stripH - FOOTER_H

  ctx.fillStyle = frame.accentColor + '22'
  ctx.fillRect(PADDING, footerY, stripW - PADDING * 2, 1)

  ctx.fillStyle = frame.textColor
  ctx.font = 'bold 22px Pacifico, cursive'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TakuBooth', stripW / 2, footerY + 22)

  if (labelText) {
    ctx.font = '11px Inter, sans-serif'
    ctx.fillStyle = frame.accentColor
    ctx.fillText(labelText, stripW / 2, footerY + 44)
  }

  // ── Stickers ──
  // Sticker positions are (x,y) fractions [0,1] of the strip canvas
  for (const s of stickers) {
    const sx = s.x * stripW
    const sy = s.y * stripH
    // Scale sticker size proportional to strip width (s.size is display px at ~360px wide preview)
    const scaledSize = s.size * (stripW / 360)
    ctx.save()
    ctx.font = `${scaledSize}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.translate(sx, sy)
    if (s.rotation) ctx.rotate(s.rotation * Math.PI / 180)
    ctx.fillText(s.emoji, 0, 0)
    ctx.restore()
  }

  return canvas.toDataURL('image/png', 1.0)
}

/** Create a rounded rect path */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** Calculate object-fit:cover source rect */
function coverFit(iw, ih, tw, th) {
  const scale = Math.max(tw / iw, th / ih)
  const sw = tw / scale
  const sh = th / scale
  const sx = (iw - sw) / 2
  const sy = (ih - sh) / 2
  return { sx, sy, sw, sh }
}

/**
 * Trigger browser download of a data URL
 */
export function downloadDataURL(dataURL, filename = 'takubooth.png') {
  const a = document.createElement('a')
  a.href = dataURL
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Format current date as "DD Mon YYYY"
 */
export function formatDate(date = new Date()) {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
