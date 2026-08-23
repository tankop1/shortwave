import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions/v1'
import { creditInviteEmail, creditInviteText } from './email.js'

initializeApp()
const db = getFirestore()
const adminAuth = getAuth()

const APP_URL = process.env.APP_URL || 'https://shortwave-ut.web.app'
const MAIL_FROM = process.env.MAIL_FROM || 'Shortwave <beth.t@example.com>'

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function isLiveFilm(film) {
  return (
    film?.status === 'published' &&
    (film.visibility === 'public' || film.visibility === 'unlisted' || !film.visibility)
  )
}

function emailsForUser(auth, profile) {
  return [auth?.token?.email, profile?.email, profile?.utEmail].filter(Boolean).map(normalizeEmail)
}

function inviteDoc(id) {
  return db.collection('invites').doc(id)
}

function acceptLink(invite, token) {
  const base = String(invite?.appUrl || APP_URL).replace(/\/$/, '')
  return `${base}/invite/${token}`
}

async function sendResendEmail({ to, subject, html, text, idempotencyKey }) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('RESEND_API_KEY is not set. Add it to functions/.env and redeploy.')
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = payload.message || `Resend failed (${response.status})`
    if (String(detail).toLowerCase().includes('domain is not verified')) {
      throw new Error(
        `${detail} Until that domain is verified, Shortwave can’t email invited cast and crew.`,
      )
    }
    throw new Error(detail)
  }
  return payload
}

async function sendPendingInvites(filmId) {
  const filmSnap = await db.collection('films').doc(filmId).get()
  if (!filmSnap.exists) {
    throw new Error('That project is gone.')
  }
  const after = filmSnap.data()
  if (!isLiveFilm(after)) return { sent: 0 }

  const crew = Array.isArray(after.crew) ? after.crew.map((member) => ({ ...member })) : []
  const pendingIndexes = crew
    .map((member, index) => (member?.state === 'invited' && member.email && !member.inviteSentAt && !member.userId ? index : -1))
    .filter((index) => index >= 0)
  if (!pendingIndexes.length) return { sent: 0 }

  const failures = []
  let sent = 0
  for (const index of pendingIndexes) {
    const member = crew[index]
    const token = member.inviteToken || crypto.randomUUID()
    const inviteRef = inviteDoc(token)
    const inviteSnap = await inviteRef.get()
    const invite = inviteSnap.exists ? inviteSnap.data() : {}

    if (!invite.inviteSentAt) {
      try {
        const acceptUrl = acceptLink(invite, token)
        await sendResendEmail({
          to: member.email.trim(),
          subject: `${after.ownerName || 'A filmmaker'} credited you on ${after.title}`,
          html: creditInviteEmail({
            ownerName: after.ownerName || 'A filmmaker',
            filmTitle: after.title,
            role: member.role,
            roles: Array.isArray(member.roles) ? member.roles : [],
            kind: member.kind,
            poster: after.poster || invite.filmPoster,
            logline: after.logline || invite.logline,
            acceptUrl,
            inviteeName: member.name,
          }),
          text: creditInviteText({
            ownerName: after.ownerName || 'A filmmaker',
            filmTitle: after.title,
            role: member.role,
            roles: Array.isArray(member.roles) ? member.roles : [],
            kind: member.kind,
            acceptUrl,
            inviteeName: member.name,
          }),
          idempotencyKey: token,
        })
        const sentAt = FieldValue.serverTimestamp()
        await inviteRef.set(
          {
            filmId,
            filmTitle: after.title,
            filmPoster: after.poster || '',
            logline: after.logline || '',
            visibility: after.visibility,
            ownerId: after.ownerId,
            ownerName: after.ownerName || '',
            name: member.name,
            email: member.email.trim(),
            emailLower: normalizeEmail(member.email),
            role: member.role,
            roles: Array.isArray(member.roles) ? member.roles : [],
            kind: member.kind || 'crew',
            state: 'sent',
            inviteSentAt: sentAt,
            updatedAt: sentAt,
          },
          { merge: true },
        )
        crew[index] = { ...member, inviteToken: token, inviteSentAt: new Date().toISOString() }
        sent += 1
      } catch (err) {
        failures.push(`${member.name} (${member.email}): ${err.message}`)
      }
    } else {
      crew[index] = { ...member, inviteToken: token, inviteSentAt: invite.inviteSentAt }
    }
  }

  if (sent > 0) await filmSnap.ref.update({ crew })
  if (failures.length) {
    throw new Error(
      failures.length === 1
        ? `Couldn’t email ${failures[0]}`
        : `Couldn’t email ${failures.length} people. ${failures.join(' ')}`,
    )
  }
  return { sent }
}

export const sendCreditInviteEmails = functions.firestore.document('films/{filmId}').onWrite(async (change, context) => {
  if (!change.after.exists) return
  const after = change.after.data()
  if (!after || !isLiveFilm(after)) return
  try {
    await sendPendingInvites(context.params.filmId)
  } catch (err) {
    console.error('sendCreditInviteEmails', err)
  }
})

export const sendFilmCreditInvites = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in to send invites.')
  }
  const filmId = String(data?.filmId || '').trim()
  if (!filmId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing project.')
  }
  const filmSnap = await db.collection('films').doc(filmId).get()
  if (!filmSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'That project is gone.')
  }
  if (filmSnap.data().ownerId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Only the filmmaker can send these invites.')
  }
  try {
    return await sendPendingInvites(filmId)
  } catch (err) {
    throw new functions.https.HttpsError('internal', err.message || 'Couldn’t send invite emails.')
  }
})

export const claimInvitesOnProfile = functions.firestore.document('users/{uid}').onWrite(async (change, context) => {
  if (!change.after.exists) return
  const after = change.after.data()
  const uid = context.params.uid
  if (!after?.onboarded) return

  const emails = [...new Set([after.email, after.utEmail].filter(Boolean).map(normalizeEmail))]
  if (!emails.length) return

  const snaps = await Promise.all(
    emails.map((email) => db.collection('invites').where('emailLower', '==', email).get()),
  )
  const invites = new Map()
  for (const snap of snaps) {
    for (const docSnap of snap.docs) invites.set(docSnap.id, { id: docSnap.id, ...docSnap.data() })
  }

  for (const invite of invites.values()) {
    if (invite.state === 'accepted' || !invite.filmId) continue
    const filmRef = db.collection('films').doc(invite.filmId)
    await db.runTransaction(async (tx) => {
      const filmSnap = await tx.get(filmRef)
      if (!filmSnap.exists) return
      const film = filmSnap.data()
      let changed = false
      const nextCrew = (Array.isArray(film.crew) ? film.crew : []).map((member) => {
        const matchesToken = member.inviteToken === invite.id
        const matchesEmail = normalizeEmail(member.email) === normalizeEmail(invite.email)
        if (!matchesToken && !matchesEmail) return member
        if (member.userId && member.userId !== uid) return member
        if (member.userId === uid && member.state !== 'invited') return member
        changed = true
        return { ...member, userId: uid, state: member.state === 'accepted' ? 'accepted' : 'pending' }
      })
      if (!changed) return
      tx.update(filmRef, {
        crew: nextCrew,
        crewUids: [...new Set([...(film.crewUids || []), uid])],
      })
      tx.set(inviteDoc(invite.id), { claimedBy: uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    })
  }
})

export const acceptCreditInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in to accept this credit.')
  }
  const token = String(data?.token || '').trim()
  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing invite.')
  }

  const uid = context.auth.uid
  const [inviteSnap, profileSnap] = await Promise.all([
    inviteDoc(token).get(),
    db.collection('users').doc(uid).get(),
  ])
  if (!inviteSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'This invite isn’t valid.')
  }
  const invite = inviteSnap.data()
  const profile = profileSnap.exists ? profileSnap.data() : null
  if (!profile?.onboarded) {
    throw new functions.https.HttpsError('failed-precondition', 'Finish setting up your Shortwave profile first.')
  }
  if (!emailsForUser(context.auth, profile).includes(normalizeEmail(invite.email))) {
    throw new functions.https.HttpsError('permission-denied', `This invite was sent to ${invite.email}.`)
  }

  const filmRef = db.collection('films').doc(invite.filmId)
  await db.runTransaction(async (tx) => {
    const filmSnap = await tx.get(filmRef)
    if (!filmSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'That project is gone.')
    }
    const film = filmSnap.data()
    const nextCrew = (Array.isArray(film.crew) ? film.crew : []).map((member) => {
      const matchesToken = member.inviteToken === token
      const matchesEmail =
        normalizeEmail(member.email) === normalizeEmail(invite.email) && member.state === 'invited'
      if (!matchesToken && !matchesEmail) return member
      return { ...member, userId: uid, state: 'accepted' }
    })
    tx.update(filmRef, {
      crew: nextCrew,
      crewUids: [...new Set([...(film.crewUids || []), uid])],
    })
    tx.set(
      inviteSnap.ref,
      {
        state: 'accepted',
        acceptedBy: uid,
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  })

  return { ok: true }
})

async function commitDeletes(refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch()
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
}

async function deleteQuery(queryRef) {
  while (true) {
    const snap = await queryRef.limit(400).get()
    if (snap.empty) return
    await commitDeletes(snap.docs.map((item) => item.ref))
    if (snap.size < 400) return
  }
}

async function deleteOwnedFilm(filmRef) {
  await Promise.all([
    deleteQuery(filmRef.collection('reviews')),
    deleteQuery(filmRef.collection('viewers')),
  ])
  await filmRef.delete()
}

export const deleteOwnAccount = functions
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in to delete your account.')
    }
    const uid = context.auth.uid
    const userRef = db.collection('users').doc(uid)
    const profileSnap = await userRef.get()
    const profile = profileSnap.exists ? profileSnap.data() : {}

    const ownedFilms = await db.collection('films').where('ownerId', '==', uid).get()
    for (const filmSnap of ownedFilms.docs) {
      await deleteOwnedFilm(filmSnap.ref)
    }

    const crewedFilms = await db.collection('films').where('crewUids', 'array-contains', uid).get()
    for (const filmSnap of crewedFilms.docs) {
      const film = filmSnap.data()
      const nextCrew = (Array.isArray(film.crew) ? film.crew : []).filter((member) => member?.userId !== uid)
      await filmSnap.ref.update({
        crew: nextCrew,
        crewUids: (film.crewUids || []).filter((id) => id !== uid),
      })
    }

    await deleteQuery(db.collection('invites').where('ownerId', '==', uid))
    await deleteQuery(userRef.collection('messages'))

    const slug = String(profile?.portfolioSlug || '').trim()
    if (slug) {
      const slugRef = db.collection('portfolioSlugs').doc(slug)
      const slugSnap = await slugRef.get()
      if (slugSnap.exists && slugSnap.data()?.uid === uid) {
        await slugRef.delete()
      }
    }

    try {
      const reviewSnaps = await db.collectionGroup('reviews').where('userId', '==', uid).get()
      await commitDeletes(reviewSnaps.docs.map((item) => item.ref))
    } catch {
      /* collection-group index may be missing */
    }

    if (profileSnap.exists) await userRef.delete()
    await adminAuth.deleteUser(uid)
    return { ok: true }
  })
