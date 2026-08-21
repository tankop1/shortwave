import { useEffect } from 'react'
import Icon from '../Icon'
import { statusLabel } from '../../data'

export default function FilmPicker({ films = [], selectedIds = [], onChange, onClose }) {
  const selected = selectedIds
    .map((id) => films.find((film) => film.id === id))
    .filter(Boolean)

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

  function toggle(id) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((item) => item !== id))
    else onChange([...selectedIds, id])
  }

  function move(id, dir) {
    const index = selectedIds.indexOf(id)
    const nextIndex = index + dir
    if (index < 0 || nextIndex < 0 || nextIndex >= selectedIds.length) return
    const next = [...selectedIds]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    onChange(next)
  }

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className="upload-modal psite-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="film-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="upload-modal-top">
          <h2 id="film-picker-title" className="profile-modal-title">
            Selected work
          </h2>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        {selected.length > 0 && (
          <>
            <div className="field-label">On the site</div>
            <div className="psite-order-list">
              {selected.map((film, index) => (
                <div key={film.id} className="psite-order-row">
                  {film.poster ? <img src={film.poster} alt="" /> : <span className="psite-order-ph" />}
                  <div>
                    <div className="psite-order-title">{film.title}</div>
                    <div className="psite-order-meta">{statusLabel(film)}</div>
                  </div>
                  <div className="reorder-btns">
                    <button type="button" onClick={() => move(film.id, -1)} disabled={index === 0} aria-label="Move up">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(film.id, 1)}
                      disabled={index === selected.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {films.length === 0 ? (
          <p className="psite-muted">Upload a film first, then add it here.</p>
        ) : (
          <>
            <div className="field-label" style={{ marginTop: selected.length ? 18 : 0 }}>
              Your films
            </div>
            <div className="psite-picker-films">
              {films.map((film) => {
                const on = selectedIds.includes(film.id)
                return (
                  <button
                    key={film.id}
                    type="button"
                    className={`psite-picker-film${on ? ' is-on' : ''}`}
                    onClick={() => toggle(film.id)}
                  >
                    {film.poster ? <img src={film.poster} alt="" /> : null}
                    <span>
                      {film.title}
                      <small> {statusLabel(film)}</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="upload-modal-foot">
          <button type="button" className="solid-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
