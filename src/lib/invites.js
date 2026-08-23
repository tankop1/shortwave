import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'

export const INVITE_STORAGE_KEY = 'shortwaveInviteToken'
export const PREVIEW_INVITE_TOKEN = 'preview'

export function newInviteToken() {
  return crypto.randomUUID()
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function rankPeople(people, query) {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return people
    .map((person) => {
      const name = (person.nameLower || person.name || '').toLowerCase()
      const words = name.split(/\s+/).filter(Boolean)
      let score = 0
      if (name === q) score = 4
      else if (name.startsWith(q)) score = 3
      else if (words.some((word) => word.startsWith(q))) score = 2
      else if (name.includes(q)) score = 1
      return { person, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.person.name || '').localeCompare(b.person.name || ''))
    .map((item) => item.person)
}

export async function upsertCreditInvites({ filmId, title, poster, logline, visibility, ownerId, ownerName, crew, host, videoId }) {
  const invited = (crew || []).filter(
    (member) => member.state === 'invited' && member.email && member.inviteToken && !member.userId,
  )
  await Promise.all(
    invited.map(async (member) => {
      const ref = doc(db, 'invites', member.inviteToken)
      const existing = await getDoc(ref)
      const prior = existing.exists() ? existing.data() : null
      if (prior?.state === 'accepted') {
        await setDoc(
          ref,
          {
            filmTitle: title,
            filmPoster: poster || '',
            logline: logline || '',
            host: host || '',
            videoId: videoId || '',
            visibility,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
        return
      }
      await setDoc(
        ref,
        {
          filmId,
          filmTitle: title,
          filmPoster: poster || '',
          logline: logline || '',
          host: host || '',
          videoId: videoId || '',
          visibility,
          appUrl: typeof window !== 'undefined' ? window.location.origin : '',
          ownerId,
          ownerName,
          name: member.name,
          email: member.email.trim(),
          emailLower: normalizeEmail(member.email),
          role: member.role,
          roles: Array.isArray(member.roles) ? member.roles : member.role ? [member.role] : [],
          kind: member.kind || 'crew',
          state: prior?.state || 'invited',
          createdAt: prior?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    }),
  )
}

export async function acceptCreditInvite(token) {
  const accept = httpsCallable(functions, 'acceptCreditInvite')
  const result = await accept({ token })
  return result.data
}

export async function sendFilmCreditInvites(filmId) {
  const send = httpsCallable(functions, 'sendFilmCreditInvites')
  try {
    const result = await send({ filmId })
    return result.data
  } catch (err) {
    const message = String(err?.message || '')
      .replace(/^Firebase:\s*/i, '')
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim()
    throw new Error(message || 'Couldn’t send invite emails.')
  }
}

export async function sendTestInviteEmail() {
  const send = httpsCallable(functions, 'sendTestInviteEmail')
  try {
    const result = await send({})
    return result.data
  } catch (err) {
    const message = String(err?.message || '')
      .replace(/^Firebase:\s*/i, '')
      .replace(/\s*\([^)]*\)\s*$/, '')
      .replace(/\s*\[[^\]]*\]\s*$/, '')
      .trim()
    throw new Error(message || 'Couldn’t send the test invite.')
  }
}
