import { doc, increment, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const VIEWER_KEY = 'sw_viewer'
const recordedPlays = new Set()

export function getViewerId(uid) {
  if (uid) return `u_${uid}`
  try {
    let id = localStorage.getItem(VIEWER_KEY)
    if (!id) {
      id = `a_${crypto.randomUUID()}`
      localStorage.setItem(VIEWER_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

export function formatCount(value) {
  const n = Number(value) || 0
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `${Math.round(n / 1000)}k`
}

export function filmAnalytics(film) {
  return {
    plays: Number(film?.views || 0),
    watched: Number(film?.uniqueViewers || 0),
  }
}

export async function recordWatch(film, uid) {
  const filmId = film?.id
  if (!filmId) return
  if (uid && film.ownerId && uid === film.ownerId) return

  const viewerId = getViewerId(uid)
  if (!viewerId) return

  const playKey = `${filmId}:${viewerId}`
  if (recordedPlays.has(playKey)) return
  try {
    if (sessionStorage.getItem(`sw_play_${filmId}`)) {
      recordedPlays.add(playKey)
      return
    }
  } catch {
    /* private mode */
  }

  recordedPlays.add(playKey)

  const filmRef = doc(db, 'films', filmId)
  const viewerRef = doc(db, 'films', filmId, 'viewers', viewerId)

  try {
    await runTransaction(db, async (transaction) => {
      const viewerSnap = await transaction.get(viewerRef)
      if (viewerSnap.exists()) {
        transaction.update(filmRef, { views: increment(1) })
        return
      }
      transaction.set(viewerRef, {
        at: serverTimestamp(),
        uid: uid || null,
      })
      transaction.update(filmRef, {
        views: increment(1),
        uniqueViewers: increment(1),
      })
    })
  } catch {
    recordedPlays.delete(playKey)
    return
  }

  try {
    sessionStorage.setItem(`sw_play_${filmId}`, '1')
  } catch {
    /* ignore */
  }
}
