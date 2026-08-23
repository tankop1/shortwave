import { useEffect, useRef, useState } from 'react'

export const SORT_OPTIONS = [
  { id: 'new', label: 'New to Old' },
  { id: 'old', label: 'Old to New' },
  { id: 'az', label: 'A to Z' },
]

function filmTime(film) {
  return film.createdAt?.toMillis?.() || 0
}

export function sortFilms(films, sort) {
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

export default function FilmSort({ value, onChange, label = 'Sort' }) {
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
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        {current.label}
      </button>
      {open && (
        <div className="menu projects-sort-menu" role="listbox" aria-label={label}>
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
