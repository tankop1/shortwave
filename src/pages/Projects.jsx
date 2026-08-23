import { useEffect, useMemo, useRef, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import Icon from '../components/Icon'
import { ProjectListSkeleton } from '../components/Skeleton'
import { db } from '../firebase'
import { formatRolePhrase, memberRoles, statusKind, statusLabel } from '../data'
import { copyFilmLink } from '../lib/share'
import { filmRating, formatAverage } from '../lib/reviews'
import { filmAnalytics, formatCount } from '../lib/views'
import { deleteProject } from '../lib/films'
import { normalizePortfolio } from '../lib/portfolio'
import emptyProjectsArt from '../assets/illustrations/Empty Projects Illustration.png'

const SORT_OPTIONS = [
  { id: 'new', label: 'New to Old' },
  { id: 'old', label: 'Old to New' },
  { id: 'az', label: 'A to Z' },
]

function filmTime(film) {
  return film.createdAt?.toMillis?.() || 0
}

function sortFilms(films, sort) {
  const next = [...films]
  if (sort === 'az') {
    next.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }))
  } else if (sort === 'old') {
    next.sort((a, b) => filmTime(a) - filmTime(b))
  } else {
    next.sort((a, b) => filmTime(b) - filmTime(a))
  }
  return next
}

export default function Projects() {
  const { myFilms, libraryLoading, pendingCredits, onUpload, onEdit, onOpen, user, profile } = useOutletContext()
  const [dismissed, setDismissed] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const [confirmFilm, setConfirmFilm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [sort, setSort] = useState('new')
  const sortedFilms = useMemo(() => sortFilms(myFilms, sort), [myFilms, sort])

  const pending = pendingCredits.filter((film) => !dismissed.includes(film.id))

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
        <ProjectListSkeleton />
      </main>
    )
  }

  return (
    <main className="page projects-page">
      {myFilms.length > 0 && (
        <div className="projects-toolbar">
          <div className="projects-toolbar-meta">
            <p className="projects-count">
              {myFilms.length} {myFilms.length === 1 ? 'film' : 'films'}
            </p>
            <ProjectSort value={sort} onChange={setSort} />
          </div>
          <button type="button" className="upload-solid" onClick={onUpload}>
            <Icon name="plus" className="icon-dark" />
            Add a project
          </button>
        </div>
      )}

      {pending.map((film) => {
        const credit = (film.crew || []).find((member) => member.userId === user.uid)
        return (
          <div key={film.id} className="credit-banner">
            <div>
              <div className="credit-banner-title">
                {film.ownerName} credited you as <em>{formatRolePhrase(memberRoles(credit)) || credit?.role || 'crew'}</em> on “{film.title}”
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
          <img src={emptyProjectsArt} alt="" className="empty-panel-art" />
          <p>Your projects are empty</p>
          <button type="button" className="upload-solid" onClick={onUpload}>
            <Icon name="plus" className="icon-dark" />
            Add a project
          </button>
        </div>
      ) : (
        <div className="project-list">
          {sortedFilms.map((film) => (
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

function ProjectSort({ value, onChange }) {
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const current = SORT_OPTIONS.find((option) => option.id === value) || SORT_OPTIONS[0]

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="projects-sort" ref={wrapRef}>
      <button
        type="button"
        className="projects-sort-btn"
        aria-label="Sort projects"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        {current.label}
      </button>
      {open && (
        <div className="menu projects-sort-menu" role="listbox" aria-label="Sort projects">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`menu-item${option.id === value ? ' is-on' : ''}`}
              role="option"
              aria-selected={option.id === value}
              onClick={() => {
                onChange(option.id)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
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
