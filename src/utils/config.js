/**
 * CSS filter strings for each filter preset
 * Used on both the live canvas preview and captured frames
 */
export const FILTERS = {
  normal: { label: 'Normal', css: 'none', emoji: '🎨' },
  vintage: {
    label: 'Vintage',
    css: 'sepia(0.6) contrast(1.1) brightness(0.9) saturate(0.8)',
    emoji: '📷',
  },
  bw: {
    label: 'B&W',
    css: 'grayscale(1) contrast(1.1)',
    emoji: '🎞️',
  },
  soft: {
    label: 'Soft Pink',
    css: 'saturate(1.3) brightness(1.05) hue-rotate(330deg)',
    emoji: '🌸',
  },
  vivid: {
    label: 'Vivid',
    css: 'saturate(1.8) contrast(1.1) brightness(1.05)',
    emoji: '🌈',
  },
  cool: {
    label: 'Cool',
    css: 'hue-rotate(200deg) saturate(1.2) brightness(0.95)',
    emoji: '🧊',
  },
}

/**
 * Available background presets
 * type: 'color' | 'gradient' | 'blur' | 'image'
 */
export const BACKGROUNDS = [
  { id: 'none', label: 'Original', type: 'none', emoji: '🎥' },
  { id: 'blur', label: 'Blur BG', type: 'blur', emoji: '🫧' },
  { id: 'black', label: 'Hitam', type: 'color', value: '#0a0a0a', emoji: '⬛' },
  { id: 'white', label: 'Putih', type: 'color', value: '#f8f8f8', emoji: '⬜' },
  { id: 'pink', label: 'Pink', type: 'color', value: '#f9a8d4', emoji: '🩷' },
  { id: 'purple', label: 'Purple', type: 'color', value: '#a855f7', emoji: '💜' },
  { id: 'mint', label: 'Mint', type: 'color', value: '#6ee7b7', emoji: '🌿' },
  { id: 'peach', label: 'Peach', type: 'color', value: '#fca5a1', emoji: '🍑' },
  { id: 'navy', label: 'Navy', type: 'color', value: '#1e3a5f', emoji: '🌊' },
  {
    id: 'sunset',
    label: 'Sunset',
    type: 'gradient',
    value: ['#f97316', '#ec4899', '#8b5cf6'],
    emoji: '🌅',
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    type: 'gradient',
    value: ['#0f0c29', '#302b63', '#24243e'],
    emoji: '🌌',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    type: 'gradient',
    value: ['#00c6ff', '#0072ff', '#6a00f4'],
    emoji: '🌌',
  },
  {
    id: 'rose',
    label: 'Rose Dream',
    type: 'gradient',
    value: ['#ffecd2', '#fcb69f', '#ff9a9e'],
    emoji: '🌹',
  },
  {
    id: 'forest',
    label: 'Forest',
    type: 'gradient',
    value: ['#134e5e', '#71b280'],
    emoji: '🌲',
  },
  {
    id: 'neonCity',
    label: 'Neon City',
    type: 'gradient',
    value: ['#0d0d1a', '#1a0a2e', '#2d1b69'],
    emoji: '🌆',
  },
  {
    id: 'candy',
    label: 'Candy',
    type: 'radial',
    value: ['#ffeef8', '#ffd1ec', '#f5a0c8'],
    emoji: '🍬',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    type: 'gradient',
    value: ['#1a2980', '#26d0ce'],
    emoji: '🌊',
  },
]

/**
 * Photostrip frame themes
 */
export const FRAMES = [
  {
    id: 'minimal',
    label: 'Minimal',
    emoji: '⬜',
    bgColor: '#ffffff',
    borderColor: '#e5e7eb',
    textColor: '#374151',
    accentColor: '#6b7280',
  },
  {
    id: 'polaroid',
    label: 'Polaroid',
    emoji: '📸',
    bgColor: '#fffdf7',
    borderColor: '#f3f0e8',
    textColor: '#4a3f35',
    accentColor: '#b45309',
  },
  {
    id: 'coquette',
    label: 'Coquette',
    emoji: '🎀',
    bgColor: '#fdf2f8',
    borderColor: '#fbb6ce',
    textColor: '#9d174d',
    accentColor: '#ec4899',
  },
  {
    id: 'film',
    label: 'Film Strip',
    emoji: '🎞️',
    bgColor: '#1a1a1a',
    borderColor: '#333333',
    textColor: '#f5f5f5',
    accentColor: '#fbbf24',
  },
  {
    id: 'pastel',
    label: 'Pastel Dream',
    emoji: '🌈',
    bgColor: '#faf5ff',
    borderColor: '#d8b4fe',
    textColor: '#6d28d9',
    accentColor: '#7c3aed',
  },
  {
    id: 'neon',
    label: 'Neon Night',
    emoji: '🌆',
    bgColor: '#0d0d1a',
    borderColor: '#00f5ff',
    textColor: '#e0e0ff',
    accentColor: '#ff00aa',
  },
]

/**
 * Strip layout configurations
 */
export const STRIP_LAYOUTS = {
  2: { cols: 1, rows: 2, photoAspect: 4 / 3 },
  4: { cols: 1, rows: 4, photoAspect: 4 / 3 },
  6: { cols: 2, rows: 3, photoAspect: 4 / 3 },
}

/** Build a gradient on a canvas 2D context */
export function applyGradientBackground(ctx, w, h, colors) {
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}
