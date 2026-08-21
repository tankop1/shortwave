import { useEffect, useState } from 'react'
import { doc, increment, updateDoc } from 'firebase/firestore'
import Icon from './Icon'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { embedUrl } from '../lib/video'

export default function Player({ film, onClose }) {
  const { user, profile, saveProfile } = useAuth()
  const [playing, setPlaying] = useState(Boolean(embedUrl(film)))
  const embed = embedUrl(film)
  const saved = (profile?.savedFilmIds || []).includes(film.id)

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
    if (!film?.id) return undefined
    updateDoc(doc(db, 'films', film.id), { views30d: increment(1) }).catch(() => {})
    return undefined
  }, [film.id])

  async function toggleSave() {
    if (!user) return
    const ids = profile?.savedFilmIds || []
    await saveProfile({
      savedFilmIds: saved ? ids.filter((id) => id !== film.id) : [...ids, film.id],
    })
  }

  async function share() {
    const url = film.videoUrl || window.location.href
    try {
      await navigator.clipboard.writeText(url)
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
                {[film.genre, film.dur, film.year].filter(Boolean).join(' · ')}
              </div>
              <h2 id="player-title" className="player-title">
                {film.title}
              </h2>
              <div className="player-by">{film.maker}</div>
            </div>
            <div className="player-actions">
              {user && (
                <button type="button" className="ghost-btn" onClick={toggleSave}>
                  <Icon name="heart" />
                  {saved ? 'Saved' : 'Save'}
                </button>
              )}
              <button type="button" className="ghost-btn" onClick={share}>
                Share
              </button>
            </div>
          </div>
          {film.logline && <p className="player-logline">{film.logline}</p>}
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
