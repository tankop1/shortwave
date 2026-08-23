import { doc, getDoc, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { decorateFilm } from '../data'
import { normalizeSiteStyle } from './siteStyle'

export const RESERVED_SLUGS = new Set([
  'search',
  'projects',
  'portfolio',
  'invite',
  'list',
  'inbox',
  'credits',
  'admin',
  'login',
  'signup',
  'api',
  'assets',
  'static',
  'home',
  'settings',
  'profile',
  'about',
  'contact',
  'work',
  'user',
  'users',
  'film',
  'films',
  'watch',
  'upload',
])

export const EMPTY_HERO_MEDIA = { type: 'none', items: [] }

export function slugFromName(name = '') {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 24) || 'portfolio'
  )
}

export function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}

export function isValidSlug(slug) {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$|^[a-z0-9]{3,30}$/.test(slug || '')
}

export const PORTFOLIO_DISPLAY_HOST = 'shortwaveut.netlify.app'

export function portfolioUrl(slug) {
  return `${window.location.origin}/${slug}`
}

export function normalizePortfolio(raw = {}) {
  const media = raw.heroMedia || EMPTY_HERO_MEDIA
  const items = Array.isArray(media.items) ? media.items.filter(Boolean) : []
  let type = media.type === 'image' || media.type === 'video' || media.type === 'carousel' ? media.type : 'none'
  if (type === 'image' && items.length > 1) type = 'carousel'
  return {
    heroTitle: typeof raw.heroTitle === 'string' ? raw.heroTitle : '',
    heroDescription: typeof raw.heroDescription === 'string' ? raw.heroDescription : '',
    heroMedia: {
      type,
      items,
    },
    filmIds: Array.isArray(raw.filmIds) ? raw.filmIds.filter(Boolean) : [],
    aboutText: typeof raw.aboutText === 'string' ? raw.aboutText : '',
    aboutImageUrl: typeof raw.aboutImageUrl === 'string' ? raw.aboutImageUrl : '',
    ...normalizeSiteStyle(raw),
  }
}

export function defaultPortfolio(profile, films = []) {
  const name = profile?.name || 'Filmmaker'
  const roles = (profile?.roles || []).filter(Boolean)
  const roleLine = roles.length ? roles.join(', ').toLowerCase() : 'filmmaker'
  const published = films.filter((film) => film.status === 'published').slice(0, 6)
  const grade = profile?.grade ? `, a ${String(profile.grade).toLowerCase()}` : ''
  return normalizePortfolio({
    heroTitle: 'I’ll make your film',
    heroDescription: `${name} is a ${roleLine} at UT Austin. Films, commercials, and everything in between.`,
    filmIds: published.map((film) => film.id),
    aboutText: [
      `My name is ${name}${grade} at the University of Texas at Austin.`,
      profile?.major ? `I study ${profile.major}.` : '',
      'I love the art of filmmaking — whether it be films, commercials, or everything in between.',
      'If you’d like to collaborate, get in touch below.',
    ]
      .filter(Boolean)
      .join(' '),
    aboutImageUrl: profile?.photoUrl || '',
  })
}

export async function findAvailableSlug(base) {
  let candidate = normalizeSlug(base)
  if (!isValidSlug(candidate) || RESERVED_SLUGS.has(candidate)) {
    candidate = 'portfolio'
  }
  for (let n = 0; n < 40; n += 1) {
    const slug = n === 0 ? candidate : `${candidate}${n + 1}`.slice(0, 30)
    if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) continue
    const snap = await getDoc(doc(db, 'portfolioSlugs', slug))
    if (!snap.exists()) return slug
  }
  return `${candidate}${Date.now().toString(36)}`.slice(0, 30)
}

export async function claimOrChangeSlug(uid, nextSlug, prevSlug) {
  const slug = normalizeSlug(nextSlug)
  if (!isValidSlug(slug)) throw new Error('Use 3–30 letters, numbers, or hyphens.')
  if (RESERVED_SLUGS.has(slug)) throw new Error('That link is reserved.')
  if (slug === prevSlug) return slug

  await runTransaction(db, async (tx) => {
    const nextRef = doc(db, 'portfolioSlugs', slug)
    const nextSnap = await tx.get(nextRef)
    if (nextSnap.exists() && nextSnap.data().uid !== uid) {
      throw new Error('That link is already taken.')
    }
    if (prevSlug && prevSlug !== slug) {
      const prevRef = doc(db, 'portfolioSlugs', prevSlug)
      const prevSnap = await tx.get(prevRef)
      if (prevSnap.exists() && prevSnap.data().uid === uid) {
        tx.delete(prevRef)
      }
    }
    tx.set(nextRef, { uid, updatedAt: serverTimestamp() })
    tx.update(doc(db, 'users', uid), { portfolioSlug: slug, updatedAt: serverTimestamp() })
  })
  return slug
}

export async function savePortfolio(uid, portfolio) {
  await updateDoc(doc(db, 'users', uid), {
    portfolio: normalizePortfolio(portfolio),
    updatedAt: serverTimestamp(),
  })
}

export async function ensurePortfolioSetup(uid, profile, films = []) {
  const existing = normalizePortfolio(profile?.portfolio)
  let slug = normalizeSlug(profile?.portfolioSlug || '')
  let portfolio = profile?.portfolio ? existing : defaultPortfolio(profile, films)

  if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) {
    let attempt = await findAvailableSlug(slugFromName(profile?.name))
    let claimed = null
    for (let i = 0; i < 8; i += 1) {
      try {
        claimed = await claimOrChangeSlug(uid, attempt, profile?.portfolioSlug || null)
        break
      } catch (error) {
        if (!String(error?.message || '').includes('already taken')) throw error
        attempt = await findAvailableSlug(`${slugFromName(profile?.name)}${i + 2}`)
      }
    }
    if (!claimed) throw new Error('Couldn’t reserve a portfolio link.')
    slug = claimed
  } else {
    const mapping = await getDoc(doc(db, 'portfolioSlugs', slug))
    if (!mapping.exists()) {
      await setDoc(doc(db, 'portfolioSlugs', slug), { uid, updatedAt: serverTimestamp() })
    } else if (mapping.data().uid !== uid) {
      const attempt = await findAvailableSlug(slugFromName(profile?.name))
      slug = await claimOrChangeSlug(uid, attempt, null)
    }
  }

  if (!profile?.portfolio) {
    await savePortfolio(uid, portfolio)
  }

  return { slug, portfolio }
}

export async function loadPortfolioFilms(ids = []) {
  const films = []
  for (const id of ids) {
    try {
      const snap = await getDoc(doc(db, 'films', id))
      if (!snap.exists()) continue
      const film = decorateFilm({ id: snap.id, ...snap.data() })
      if (film.status !== 'published') continue
      films.push(film)
    } catch {
      /* unreadable or missing */
    }
  }
  return films
}
