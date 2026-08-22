export const FONT_PAIRS = [
  {
    id: 'cinema',
    label: 'Cinema',
    displayName: 'Syne',
    sansName: 'Outfit',
    display: '"Syne", system-ui, sans-serif',
    sans: '"Outfit", system-ui, sans-serif',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    displayName: 'Playfair Display',
    sansName: 'Source Sans 3',
    display: '"Playfair Display", Georgia, serif',
    sans: '"Source Sans 3", system-ui, sans-serif',
  },
  {
    id: 'poster',
    label: 'Poster',
    displayName: 'Oswald',
    sansName: 'Inter',
    display: '"Oswald", system-ui, sans-serif',
    sans: '"Inter", system-ui, sans-serif',
  },
  {
    id: 'classic',
    label: 'Classic',
    displayName: 'Cormorant Garamond',
    sansName: 'Karla',
    display: '"Cormorant Garamond", Georgia, serif',
    sans: '"Karla", system-ui, sans-serif',
  },
  {
    id: 'showreel',
    label: 'Showreel',
    displayName: 'Instrument Serif',
    sansName: 'DM Sans',
    display: '"Instrument Serif", Georgia, serif',
    sans: '"DM Sans", system-ui, sans-serif',
    ui: '"JetBrains Mono", ui-monospace, monospace',
    displayWeight: 400,
  },
]

export const COLOR_MODES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'accent', label: 'Accent' },
]

export const ACCENTS = [
  { id: 'ember', label: 'Ember', hex: '#e8703a', ink: '#160c06' },
  { id: 'crimson', label: 'Crimson', hex: '#c44536', ink: '#140807' },
  { id: 'rose', label: 'Rose', hex: '#d45d7a', ink: '#16080c' },
  { id: 'gold', label: 'Gold', hex: '#d4a056', ink: '#1a1206' },
  { id: 'lime', label: 'Lime', hex: '#8fb35a', ink: '#101408' },
  { id: 'teal', label: 'Teal', hex: '#2a9d8f', ink: '#061412' },
  { id: 'cyan', label: 'Cyan', hex: '#3aa8b5', ink: '#061214' },
  { id: 'sky', label: 'Sky', hex: '#4a90c8', ink: '#071018' },
  { id: 'indigo', label: 'Indigo', hex: '#5b6ee1', ink: '#080a18' },
  { id: 'violet', label: 'Violet', hex: '#8b6bb8', ink: '#100818' },
  { id: 'magenta', label: 'Magenta', hex: '#c44d9a', ink: '#160814' },
  { id: 'umber', label: 'Umber', hex: '#a67c52', ink: '#140e08' },
]

export const DEFAULT_SITE_STYLE = {
  fontPair: 'cinema',
  colorMode: 'dark',
  accent: 'ember',
}

export function getFontPair(id) {
  return FONT_PAIRS.find((item) => item.id === id) || FONT_PAIRS[0]
}

export function getAccent(id) {
  return ACCENTS.find((item) => item.id === id) || ACCENTS[0]
}

export function normalizeSiteStyle(raw = {}) {
  return {
    fontPair: FONT_PAIRS.some((item) => item.id === raw.fontPair) ? raw.fontPair : DEFAULT_SITE_STYLE.fontPair,
    colorMode: COLOR_MODES.some((item) => item.id === raw.colorMode) ? raw.colorMode : DEFAULT_SITE_STYLE.colorMode,
    accent: ACCENTS.some((item) => item.id === raw.accent) ? raw.accent : DEFAULT_SITE_STYLE.accent,
  }
}

function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

function mixHex(from, to, amount) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const mixed = a.map((channel, i) => Math.round(channel + (b[i] - channel) * amount))
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export function siteThemeStyle(portfolio) {
  const { fontPair, colorMode, accent } = normalizeSiteStyle(portfolio)
  const fonts = getFontPair(fontPair)
  const swatch = getAccent(accent)

  let bg = '#070708'
  let fg = '#f4f4f1'
  let mute = '#8d8d88'
  let band = '#121316'
  let lift = '#171718'
  let line = 'rgba(255, 255, 255, 0.08)'

  if (colorMode === 'light') {
    bg = '#f4f1ea'
    fg = '#161513'
    mute = '#6b6a66'
    band = '#ebe6dc'
    lift = '#fffdf8'
    line = 'rgba(22, 21, 19, 0.12)'
  } else if (colorMode === 'accent') {
    bg = swatch.hex
    fg = swatch.ink
    mute = mixHex(swatch.ink, swatch.hex, 0.28)
    band = mixHex(swatch.hex, '#000000', 0.2)
    lift = mixHex(swatch.hex, '#ffffff', 0.14)
    line = `color-mix(in srgb, ${swatch.ink} 18%, transparent)`
  }

  return {
    '--display': fonts.display,
    '--sans': fonts.sans,
    '--ui': fonts.ui || fonts.sans,
    '--display-weight': String(fonts.displayWeight || 800),
    '--accent': swatch.hex,
    '--accent-ink': swatch.ink,
    '--fg': fg,
    '--mute': mute,
    '--line': line,
    '--lift': lift,
    '--psite-bg': bg,
    '--psite-fg': fg,
    '--psite-band': band,
    background: bg,
    color: fg,
    fontFamily: fonts.sans,
    colorScheme: colorMode === 'dark' ? 'dark' : 'light',
  }
}
