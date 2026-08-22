import { useEffect, useRef, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import Icon from '../components/Icon'
import { ProjectListSkeleton } from '../components/Skeleton'
import { db } from '../firebase'
import { statusKind, statusLabel } from '../data'
import { copyFilmLink } from '../lib/share'
import { filmRating, formatAverage } from '../lib/reviews'
import { filmAnalytics, formatCount } from '../lib/views'
import { deleteProject } from '../lib/films'
import { normalizePortfolio } from '../lib/portfolio'

export default function Projects() {
  const { myFilms, libraryLoading, pendingCredits, onUpload, onEdit, onOpen, user, profile } = useOutletContext()
  const [dismissed, setDismissed] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const [confirmFilm, setConfirmFilm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const pending = pendingCredits.filter((film) => !dismissed.includes(film.id))
  const embargoed = myFilms.filter((film) => film.status === 'embargoed').length
  const waiting = pending.length

  useEffect(() => {
    if (!confirmFilm || deleting) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setConfirmFilm(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirmFilm, deleting])

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

  async function confirmDelete() {
    if (!user || !confirmFilm || deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteProject(user.uid, confirmFilm, normalizePortfolio(profile?.portfolio))
      setConfirmFilm(null)
    } catch (err) {
      setDeleteError(err?.message || 'Couldn’t delete that project.')
    } finally {
      setDeleting(false)
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
                  <ProjectMenu
                    open={menuId === film.id}
                    onToggle={() => setMenuId((current) => (current === film.id ? null : film.id))}
                    onClose={() => setMenuId(null)}
                    onDelete={() => {
                      setMenuId(null)
                      setDeleteError('')
                      setConfirmFilm(film)
                    }}
                  />
                </div>
              </div>
              <ProjectStats film={film} />
            </div>
          ))}
        </div>
      )}

      {confirmFilm && (
        <div className="credit-dialog-backdrop" onClick={() => !deleting && setConfirmFilm(null)} role="presentation">
          <div
            className="credit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="credit-dialog-top">
              <h3 id="delete-project-title">Delete this project?</h3>
              <button
                type="button"
                className="upload-modal-close"
                onClick={() => !deleting && setConfirmFilm(null)}
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>
            <p className="field-help">
              “{confirmFilm.title}” will be permanently removed from Shortwave. This can’t be undone.
            </p>
            {deleteError ? <p className="auth-error">{deleteError}</p> : null}
            <div className="credit-dialog-foot">
              <button type="button" className="ghost-btn" disabled={deleting} onClick={() => setConfirmFilm(null)}>
                Cancel
              </button>
              <button type="button" className="solid-btn is-danger" disabled={deleting} onClick={confirmDelete}>
                {deleting ? 'Deleting…' : 'Delete project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function ProjectMenu({ open, onToggle, onClose, onDelete }) {
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (!wrapRef.current?.contains(event.target)) onClose()
    }
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div className="project-more-wrap" ref={wrapRef}>
      <button
        type="button"
        className="project-more-btn"
        aria-label="Project options"
        aria-expanded={open}
        onClick={onToggle}
      >
        <Icon name="ellipsis" />
      </button>
      {open && (
        <div className="menu project-more-menu" role="menu">
          <button type="button" className="menu-item is-danger" role="menuitem" onClick={onDelete}>
            Delete project
          </button>
        </div>
      )}
    </div>
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
