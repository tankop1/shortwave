import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import Icon from '../components/Icon'
import { ProjectListSkeleton } from '../components/Skeleton'
import { db } from '../firebase'
import { statusKind, statusLabel } from '../data'
import { copyFilmLink } from '../lib/share'
import { filmRating, formatAverage } from '../lib/reviews'
import { filmAnalytics, formatCount } from '../lib/views'

export default function Projects() {
  const { myFilms, libraryLoading, pendingCredits, onUpload, onEdit, onOpen, user } = useOutletContext()
  const [dismissed, setDismissed] = useState([])
  const [copiedId, setCopiedId] = useState(null)

  const pending = pendingCredits.filter((film) => !dismissed.includes(film.id))
  const embargoed = myFilms.filter((film) => film.status === 'embargoed').length
  const waiting = pending.length

  async function acceptCredit(film) {
    if (!user) return
    const crew = (film.crew || []).map((member) =>
      member.userId === user.uid ? { ...member, state: 'accepted' } : member,
    )
    await updateDoc(doc(db, 'films', film.id), { crew })
  }

  function disputeCredit(film) {
    setDismissed((current) => [...current, film.id])
  }

  async function shareFilm(film) {
    try {
      await copyFilmLink(film.id)
      setCopiedId(film.id)
      window.setTimeout(() => setCopiedId((current) => (current === film.id ? null : current)), 1800)
    } catch {
      /* ignore */
    }
  }

  if (libraryLoading) {
    return (
      <main className="page projects-page" aria-busy="true">
        <div className="page-head-row">
          <div className="page-head page-head-sm">
            <h1>My projects</h1>
          </div>
        </div>
        <ProjectListSkeleton />
      </main>
    )
  }

  return (
    <main className="page projects-page">
      <div className="page-head-row">
        <div className="page-head page-head-sm">
          <h1>My projects</h1>
          {myFilms.length > 0 && (
            <p>
              {myFilms.length} {myFilms.length === 1 ? 'film' : 'films'}
              {embargoed ? ` · ${embargoed} embargoed` : ''}
              {waiting ? ` · ${waiting} credit${waiting === 1 ? '' : 's'} waiting on you` : ''}
            </p>
          )}
        </div>
        {myFilms.length > 0 && (
          <button type="button" className="upload-solid" onClick={onUpload}>
            <Icon name="plus" className="icon-dark" />
            Add a project
          </button>
        )}
      </div>

      {pending.map((film) => {
        const credit = (film.crew || []).find((member) => member.userId === user.uid)
        return (
          <div key={film.id} className="credit-banner">
            <div>
              <div className="credit-banner-title">
                {film.ownerName} credited you as <em>{credit?.role || 'crew'}</em> on “{film.title}”
              </div>
              <div className="credit-banner-copy">
                It won’t show on your profile or portfolio until you accept.
              </div>
            </div>
            <button type="button" className="solid-btn" onClick={() => acceptCredit(film)}>
              Accept credit
            </button>
            <button type="button" className="ghost-btn" onClick={() => disputeCredit(film)}>
              Dispute
            </button>
          </div>
        )
      })}

      {myFilms.length === 0 ? (
        <div className="empty-panel">
          <Icon name="folder" className="empty-panel-graphic" />
          <p>Your projects are empty</p>
          <button type="button" className="upload-solid" onClick={onUpload}>
            Add a project
          </button>
        </div>
      ) : (
        <div className="project-list">
          {myFilms.map((film) => (
            <div key={film.id} className="project-row">
              <div className="project-still">
                {film.poster ? <img src={film.poster} alt="" /> : <div className="project-still-empty" />}
              </div>
              <div className="project-body">
                <div className="project-title-row">
                  <span className="project-title">{film.title}</span>
                  <span className={`status-pill status-${statusKind(film)}`}>{statusLabel(film)}</span>
                </div>
                <p className="project-logline">{film.logline}</p>
                <div className="project-actions">
                  <button type="button" className="ghost-btn project-edit" onClick={() => onOpen(film.id)}>
                    <Icon name="eye" />
                    See project
                  </button>
                  <button type="button" className="ghost-btn project-edit" onClick={() => onEdit(film)}>
                    <Icon name="edit" />
                    Edit
                  </button>
                  {film.status === 'published' && (
                    <button type="button" className="ghost-btn project-edit" onClick={() => shareFilm(film)}>
                      <Icon name="share" className="icon-share" />
                      {copiedId === film.id ? 'Copied' : 'Share'}
                    </button>
                  )}
                </div>
              </div>
              <ProjectStats film={film} />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

function ProjectStats({ film }) {
  const { watched, plays } = filmAnalytics(film)
  const { average, count } = filmRating(film)
  return (
    <div className="project-stats">
      <div className="project-stat">
        <div className="project-views">{count ? formatAverage(average) : '—'}</div>
        <div className="project-views-label">avg</div>
      </div>
      <div className="project-stat">
        <div className="project-views">{formatCount(watched)}</div>
        <div className="project-views-label">{watched === 1 ? 'person' : 'people'}</div>
      </div>
      <div className="project-stat">
        <div className="project-views">{formatCount(plays)}</div>
        <div className="project-views-label">{plays === 1 ? 'play' : 'plays'}</div>
      </div>
    </div>
  )
}
