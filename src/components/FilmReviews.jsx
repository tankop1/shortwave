import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { initialsFromName } from '../data'
import { filmRating, formatAverage, subscribeReviews, upsertReview } from '../lib/reviews'
import Icon from './Icon'
import StarRating from './StarRating'

function firstName(name) {
  return (name || 'Student').trim().split(/\s+/).filter(Boolean)[0] || 'Student'
}

export default function FilmReviews({ film, onSignup }) {
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState([])
  const [draftRating, setDraftRating] = useState(0)
  const [draftText, setDraftText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const clicksReady = useRef(true)
  const armTimer = useRef(0)
  const stats = filmRating(film)
  const mine = useMemo(
    () => reviews.find((review) => review.userId === user?.uid || review.id === user?.uid) || null,
    [reviews, user?.uid],
  )

  useEffect(() => {
    setIsEditing(false)
    setDraftRating(0)
    setDraftText('')
    setError('')
    return subscribeReviews(film.id, setReviews)
  }, [film.id])

  useEffect(() => () => window.clearTimeout(armTimer.current), [])

  const composing = !mine || isEditing
  const rating = composing ? draftRating : mine.rating
  const text = composing ? draftText : mine.text || ''
  const maxBucket = Math.max(1, ...stats.buckets)

  function armClicks() {
    clicksReady.current = false
    window.clearTimeout(armTimer.current)
    armTimer.current = window.setTimeout(() => {
      clicksReady.current = true
    }, 500)
  }

  function startEdit() {
    if (!mine) return
    setDraftRating(Number(mine.rating) || 0)
    setDraftText(mine.text || '')
    setError('')
    setIsEditing(true)
    armClicks()
  }

  async function saveReview(event) {
    event.preventDefault()
    if (!clicksReady.current) return
    if (!user) {
      onSignup?.()
      return
    }
    setSaving(true)
    setError('')
    try {
      await upsertReview({ filmId: film.id, user, profile, rating: draftRating, text: draftText })
      setIsEditing(false)
    } catch (err) {
      setError(err.message || 'Couldn’t save that review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="reviews">
      <div className="rating-board">
        <div className="rating-avg">
          <div className="rating-avg-value">{formatAverage(stats.average)}</div>
          <StarRating value={stats.average} readOnly />
          <div className="rating-avg-count">
            {stats.count === 0
              ? 'No reviews yet'
              : `${stats.count} review${stats.count === 1 ? '' : 's'}`}
          </div>
        </div>
        <div className="rating-dist" aria-hidden="true">
          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} className="rating-dist-row">
              <span>{n}</span>
              <div className="rating-dist-track">
                <div
                  className="rating-dist-fill"
                  style={{ width: `${stats.count ? (stats.buckets[n - 1] / maxBucket) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {user ? (
        <form className="review-form" onSubmit={saveReview}>
          <div className="review-form-head">
            <h3 className="review-form-title">{mine ? 'Your review' : 'Leave a review'}</h3>
            {mine && !isEditing ? (
              <button type="button" className="ghost-btn review-form-btn" onClick={startEdit}>
                <Icon name="edit" />
                Edit review
              </button>
            ) : null}
          </div>
          <StarRating
            value={rating}
            onChange={(value) => {
              if (!clicksReady.current) return
              setDraftRating(value)
              if (!isEditing && mine) setIsEditing(true)
            }}
            readOnly={!composing}
          />
          {composing ? (
            <textarea
              value={text}
              onChange={(event) => setDraftText(event.target.value)}
              placeholder="Add an explanation (optional)"
              rows={3}
              maxLength={1200}
            />
          ) : mine.text ? (
            <p className="review-form-text">{mine.text}</p>
          ) : null}
          {composing ? (
            <button
              type="button"
              className="ghost-btn review-form-btn review-form-submit"
              disabled={saving || draftRating < 1}
              onClick={saveReview}
            >
              <Icon name="sent" />
              Post review
            </button>
          ) : null}
          {error ? <p className="review-error">{error}</p> : null}
        </form>
      ) : (
        <button type="button" className="ghost-btn review-signin" onClick={() => onSignup?.()}>
          Sign in to leave a review
        </button>
      )}

      {reviews.length > 0 && (
        <div className="review-list">
          {reviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="review-person">
                <span className="review-avatar" aria-hidden="true">
                  {review.userPhoto ? (
                    <img src={review.userPhoto} alt="" />
                  ) : (
                    initialsFromName(review.userName)
                  )}
                </span>
                <span className="review-name">{firstName(review.userName)}</span>
              </div>
              <div className="review-card-body">
                <StarRating value={review.rating} readOnly size="sm" />
                {review.text ? <p className="review-text">{review.text}</p> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
