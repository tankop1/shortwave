const ROLE_HUES = {
  Director: 28,
  Writer: 28,
  DP: 200,
  Gaffer: 200,
  Editor: 150,
  Sound: 150,
  Producer: 300,
  Grip: 200,
  Colorist: 150,
  Lead: 28,
  '1st AD': 300,
  'Prod. Design': 300,
  Cast: 28,
}

export const ROLES = Object.keys(ROLE_HUES)
export const CREW_ROLES = ROLES.filter((role) => role !== 'Cast')
export const GRADES = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad']
export const HEARD_ABOUT = ['Class', 'Friend', 'Instagram', 'Other']
export const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Experimental',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music Video',
  'Musical',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western',
]

export const COURSES = [
  'Not for a class',
  'Class (RTF 304)',
  'Class (Narrative Production)',
  'Class (Advanced Narrative)',
  'Class (Latinx Filmmaking)',
  'Class (Music Video Production)',
  'Class (Social Media Production)',
  'Class (Documentary)',
  'Class (Advanced Documentary)',
  'Class (Pre-Thesis)',
  'Class (Thesis)',
  'Class (Cinematography)',
  'Class (East Austin Stories)',
  'Class (Queer Media Production)',
  'Class (Directing Workshop)',
  'Class (other)',
]
export const DURATIONS = ['<5', '5–10', '10–20', '20+']
export const YEARS = ['2026', '2025', '2024']

export const NAV = [
  {
    section: 'Watch',
    items: [
      { id: 'home', label: 'Home', icon: 'home', to: '/' },
      { id: 'search', label: 'Search', icon: 'search', to: '/search' },
    ],
  },
  {
    section: 'You',
    items: [
      { id: 'projects', label: 'My Projects', icon: 'folder', to: '/projects' },
      { id: 'portfolio', label: 'Portfolio', icon: 'clapper', to: '/portfolio' },
      { id: 'saved', label: 'Your list', icon: 'heart', to: '/list' },
    ],
  },
]

export const PUBLIC_PATHS = ['/', '/search', '/invite']

export function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)))
}

export function roleChip(role) {
  const h = ROLE_HUES[role] ?? 40
  return {
    border: `oklch(0.62 0.11 ${h} / .45)`,
    bg: `oklch(0.62 0.11 ${h} / .13)`,
    color: `oklch(0.82 0.11 ${h})`,
  }
}

export function avatar(h) {
  return `linear-gradient(150deg, oklch(0.42 0.06 ${h}), oklch(0.24 0.03 ${h}))`
}

export function hueFromName(name = '') {
  let h = 0
  for (const char of name) h = (h + char.charCodeAt(0) * 17) % 360
  return h || 40
}

export function initialsFromName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function isUtEmail(value) {
  return /@(utexas\.edu|austin\.utexas\.edu)$/i.test(value.trim())
}

export function durationMinutes(dur) {
  if (!dur || !dur.includes(':')) return 0
  const [m, s] = dur.split(':').map(Number)
  return (m || 0) + (s || 0) / 60
}

export function durationBucket(minutes) {
  if (minutes < 5) return '<5'
  if (minutes < 10) return '5–10'
  if (minutes < 20) return '10–20'
  return '20+'
}

function creditName(credit) {
  if (Array.isArray(credit)) return credit[0]
  return credit.name
}

export function decorateFilm(film, uid) {
  const genre = Array.isArray(film.genres) ? film.genres[0] || '' : film.genre || ''
  const dur = film.durationLabel || film.dur || ''
  const created = film.createdAt?.toDate?.() instanceof Date ? film.createdAt.toDate() : null
  const year = created ? String(created.getFullYear()) : film.year || ''
  const crew = film.crew || []
  const credits = crew
    .filter((member) => member.state !== 'invited')
    .map((member) => ({
      name: member.name,
      role: member.role,
      state: member.state,
      stripe: avatar(ROLE_HUES[member.role] ?? 40),
      ...roleChip(member.role),
    }))
  const yourCredit = uid ? crew.find((member) => member.userId === uid) : null

  return {
    ...film,
    genre,
    dur,
    year,
    maker: film.ownerName || film.maker || '',
    minutes: durationMinutes(dur),
    poster: film.poster || '',
    hue: hueFromName(film.ownerName || film.title || ''),
    yourRole: yourCredit?.role || '',
    credits,
    meta: [film.ownerName, dur, genre, year].filter(Boolean).join(' · '),
  }
}

export function filmMatches(film, query, genre, { durations = [], years = [] } = {}) {
  const creditNames = (film.credits || []).map(creditName).join(' ')
  const hay = `${film.title} ${film.maker} ${film.genre} ${(film.genres || []).join(' ')} ${creditNames}`.toLowerCase()
  const q = query.trim().toLowerCase()
  if (q && !hay.includes(q)) return false
  if (genre && film.genre !== genre && !(film.genres || []).includes(genre)) return false
  if (durations.length && !durations.includes(durationBucket(film.minutes))) return false
  if (years.length && !years.includes(film.year)) return false
  return true
}

export function searchSuggestions(query, films) {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const seen = new Set()
  const out = []
  const push = (item) => {
    const key = `${item.kind}:${item.label}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(item)
  }

  for (const film of films) {
    if (film.title?.toLowerCase().includes(q)) {
      push({ kind: 'Film', label: film.title, hint: film.maker, id: film.id })
    }
  }
  for (const film of films) {
    if (film.maker?.toLowerCase().includes(q)) {
      push({ kind: 'Person', label: film.maker, hint: 'Director' })
    }
  }
  for (const g of GENRES) {
    if (g.toLowerCase().includes(q)) {
      push({ kind: 'Genre', label: g, hint: 'Filter' })
    }
  }

  return out.slice(0, 8)
}

export function isCatalogVisible(film) {
  return film.status === 'published' && (film.visibility === 'public' || !film.visibility)
}

export function statusLabel(film) {
  if (film.status === 'draft') return 'Draft'
  if (film.status === 'embargoed') {
    const date = film.embargoUntil?.toDate?.()
    if (!date) return 'Embargoed'
    return `Embargoed · lifts ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  return 'Published'
}

export function statusKind(film) {
  if (film.status === 'draft') return 'draft'
  if (film.status === 'embargoed') return 'embargo'
  return 'live'
}
