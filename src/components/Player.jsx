import { useEffect, useState } from 'react'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'
import FilmReviews from './FilmReviews'
import { embedUrl } from '../lib/video'
import { copyFilmLink } from '../lib/share'
import { filmRating, formatAverage } from '../lib/reviews'
import { filmAnalytics, formatCount, recordWatch } from '../lib/views'

export default function Player({ film, onClose, onSignup }) {
  const { user, profile, saveProfile } = useAuth()
  const [playing, setPlaying] = useState(Boolean(embedUrl(film)))
  const [copied, setCopied] = useState(false)
  const embed = embedUrl(film)
  const saved = (profile?.savedFilmIds || []).includes(film.id)
  const { watched, plays } = filmAnalytics(film)
  const { average, count } = filmRating(film)

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  useEffect(() => {
    recordWatch({ id: film.id, ownerId: film.ownerId }, user?.uid).catch(() => {})
  }, [film.id, film.ownerId, user?.uid])

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function toggleSave() {
    if (!user) return
    const ids = profile?.savedFilmIds || []
    await saveProfile({
      savedFilmIds: saved ? ids.filter((id) => id !== film.id) : [...ids, film.id],
    })
  }

  async function share() {
    try {
      await copyFilmLink(film.id)
      setCopied(true)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="player-backdrop" onClick={onClose} role="presentation">
      <div
        className="player"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="player-stage">
          {playing && embed ? (
            <iframe
              className="player-embed"
              src={embed}
              title={film.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              {film.poster && <img src={film.poster} alt="" className="player-still" />}
              <div className="player-stage-fade" />
              {embed && (
                <button type="button" className="player-watch" onClick={() => setPlaying(true)}>
                  <Icon name="play" className="icon-dark" />
                  Play
                </button>
              )}
            </>
          )}
          <button
            type="button"
            className="player-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="player-body">
          <div className="player-top">
            <div>
              <div className="player-kicker">
                {[
                  film.genre,
                  film.dur,
                  film.year,
                  watched > 0
                    ? `${formatCount(watched)} watched`
                    : plays > 0
                      ? `${formatCount(plays)} views`
                      : null,
                  count ? `${formatAverage(average)}★` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              <h2 id="player-title" className="player-title">
                {film.title}
              </h2>
              <div className="player-by">{film.maker}</div>
            </div>
            <div className="player-actions">
              {user && (
                <button type="button" className="ghost-btn" onClick={toggleSave}>
                  <Icon name="heart" className={saved ? 'icon-accent' : ''} />
                  {saved ? 'Saved' : 'Save'}
                </button>
              )}
              <button type="button" className="ghost-btn" onClick={share}>
                <Icon name="share" className="icon-share" />
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>
          {film.logline && <p className="player-logline">{film.logline}</p>}
          <FilmReviews film={film} onSignup={onSignup} />
          {(film.credits || []).length > 0 && (
            <>
              <div className="credits-label">Cast &amp; crew</div>
              <div className="credits">
                {film.credits.map((credit) => (
                  <div key={`${credit.name}-${credit.role}`} className="credit-chip">
                    <span className="credit-avatar" style={{ background: credit.stripe }} />
                    <span>{credit.name}</span>
                    <span className="credit-role">{credit.role}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
