import { collection, doc, increment, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export function filmRating(film) {
  const count = Number(film?.ratingCount || 0)
  const sum = Number(film?.ratingSum || 0)
  return {
    count,
    sum,
    average: count ? sum / count : 0,
    buckets: [1, 2, 3, 4, 5].map((n) => Number(film?.[`rating${n}`] || 0)),
  }
}

export function formatAverage(average) {
  if (!average) return '—'
  return average.toFixed(1)
}

export function subscribeReviews(filmId, onChange) {
  if (!filmId) return () => {}
  return onSnapshot(
    collection(db, 'films', filmId, 'reviews'),
    (snap) => {
      const reviews = snap.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          const av = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0
          const bv = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0
          return bv - av
        })
      onChange(reviews)
    },
    () => onChange([]),
  )
}

export async function upsertReview({ filmId, user, profile, rating, text }) {
  if (!user?.uid || !filmId) throw new Error('Sign in to review this film.')
  const nextRating = Number(rating)
  if (!Number.isInteger(nextRating) || nextRating < 1 || nextRating > 5) {
    throw new Error('Pick a star rating.')
  }

  const filmRef = doc(db, 'films', filmId)
  const reviewRef = doc(db, 'films', filmId, 'reviews', user.uid)
  const body = (text || '').trim()

  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(reviewRef)
    const prev = current.exists() ? current.data() : null
    const prevRating = Number(prev?.rating) || 0

    transaction.set(reviewRef, {
      userId: user.uid,
      userName: profile?.name || 'Student',
      userPhoto: profile?.photoUrl || null,
      rating: nextRating,
      text: body,
      createdAt: prev?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    if (!prev) {
      transaction.update(filmRef, {
        ratingCount: increment(1),
        ratingSum: increment(nextRating),
        [`rating${nextRating}`]: increment(1),
      })
      return
    }

    if (prevRating !== nextRating) {
      transaction.update(filmRef, {
        ratingSum: increment(nextRating - prevRating),
        [`rating${prevRating}`]: increment(-1),
        [`rating${nextRating}`]: increment(1),
      })
    }
  })
}

export async function deleteReview({ filmId, userId, rating }) {
  if (!filmId || !userId) return
  const prevRating = Number(rating)
  const filmRef = doc(db, 'films', filmId)
  const reviewRef = doc(db, 'films', filmId, 'reviews', userId)

  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(reviewRef)
    if (!current.exists()) return
    const stored = Number(current.data()?.rating) || prevRating
    transaction.delete(reviewRef)
    transaction.update(filmRef, {
      ratingCount: increment(-1),
      ratingSum: increment(-stored),
      [`rating${stored}`]: increment(-1),
    })
  })
}
