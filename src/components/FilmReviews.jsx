import { useEffect, useMemo, useState } from 'react'
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
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const stats = filmRating(film)
  const mine = useMemo(
    () => reviews.find((review) => review.userId === user?.uid) || null,
    [reviews, user?.uid],
  )

  useEffect(() => {
    return subscribeReviews(film.id, setReviews)
  }, [film.id])

  useEffect(() => {
    setRating(mine?.rating || 0)
    setText(mine?.text || '')
    setError('')
    setEditing(false)
  }, [mine?.rating, mine?.text, film.id])

  const maxBucket = Math.max(1, ...stats.buckets)
  const composing = !mine || editing

  async function saveReview(event) {
    event.preventDefault()
    if (!user) {
      onSignup?.()
      return
    }
    setSaving(true)
    setError('')
    try {
      await upsertReview({ filmId: film.id, user, profile, rating, text })
      setEditing(false)
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
            {composing ? (
              <button type="submit" className="ghost-btn review-form-btn" disabled={saving || rating < 1}>
                <Icon name="sent" />
                Post review
              </button>
            ) : (
              <button type="button" className="ghost-btn review-form-btn" onClick={() => setEditing(true)}>
                <Icon name="edit" />
                Edit review
              </button>
            )}
          </div>
          <StarRating
            value={composing ? rating : mine.rating}
            onChange={setRating}
            readOnly={!composing}
          />
          {composing ? (
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Add an explanation (optional)"
              rows={3}
              maxLength={1200}
            />
          ) : mine.text ? (
            <p className="review-form-text">{mine.text}</p>
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
