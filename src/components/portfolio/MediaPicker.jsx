import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { uploadImage } from '../../lib/cloudinary'
import { fetchVideoMeta } from '../../lib/video'
import { statusLabel } from '../../data'

const MODES = [
  { id: 'video', label: 'Video' },
  { id: 'image', label: 'Image' },
  { id: 'carousel', label: 'Carousel' },
]

const EMPTY = { type: 'none', items: [] }
const MAX_CAROUSEL = 8

function inferMode(media) {
  if (media?.type === 'carousel' || (media?.type === 'image' && (media.items?.length || 0) > 1)) {
    return 'carousel'
  }
  if (media?.type === 'image') return 'image'
  if (media?.type === 'video') return 'video'
  return 'video'
}

function firstImage(media) {
  if (media?.type !== 'image' && media?.type !== 'carousel') return null
  return media.items?.[0] || null
}

function imageList(media) {
  if (media?.type !== 'image' && media?.type !== 'carousel') return []
  return media.items || []
}

export default function MediaPicker({ media, films = [], onChange, onClose }) {
  const imageRef = useRef(null)
  const carouselRef = useRef(null)
  const [mode, setMode] = useState(() => inferMode(media))
  const [videoItem, setVideoItem] = useState(() => (media?.type === 'video' ? media.items?.[0] || null : null))
  const [imageItem, setImageItem] = useState(() => firstImage(media))
  const [carouselItems, setCarouselItems] = useState(() => imageList(media))
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [chooser, setChooser] = useState(null)

  const modeIndex = Math.max(0, MODES.findIndex((item) => item.id === mode))
  const videoFilms = films.filter((film) => film.host && film.videoId)
  const posterFilms = films.filter((film) => film.poster)

  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape') return
      if (chooser) setChooser(null)
      else onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, chooser])

  function publish(nextMode, nextVideo, nextImage, nextCarousel) {
    if (nextMode === 'video') {
      onChange(nextVideo ? { type: 'video', items: [nextVideo] } : EMPTY)
      return
    }
    if (nextMode === 'image') {
      onChange(nextImage ? { type: 'image', items: [nextImage] } : EMPTY)
      return
    }
    onChange(nextCarousel.length ? { type: 'carousel', items: nextCarousel } : EMPTY)
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setDragging(false)
    publish(next, videoItem, imageItem, carouselItems)
  }

  async function addVideoLink(event) {
    event.preventDefault()
    if (busy || !link.trim()) return
    setBusy(true)
    setError('')
    try {
      const meta = await fetchVideoMeta(link)
      const next = { url: meta.poster, kind: 'embed', host: meta.host, videoId: meta.id }
      setVideoItem(next)
      publish('video', next, imageItem, carouselItems)
      setLink('')
    } catch (err) {
      setError(err?.message || 'Paste a YouTube or Vimeo link.')
    } finally {
      setBusy(false)
    }
  }

  function pickFilmVideo(film) {
    if (!film.host || !film.videoId) return
    const next = {
      url: film.poster,
      kind: 'embed',
      filmId: film.id,
      host: film.host,
      videoId: film.videoId,
    }
    setVideoItem(next)
    publish('video', next, imageItem, carouselItems)
    setChooser(null)
  }

  async function takeImages(list, { replace = false, forCarousel = false } = {}) {
    const files = [...(list || [])].filter((file) => file.type.startsWith('image/'))
    if (!files.length) return
    setBusy(true)
    setError('')
    try {
      const uploaded = []
      for (const file of files) {
        const url = await uploadImage(file, 'thumbnail', { maxWidth: 1920 })
        uploaded.push({ url, kind: 'image' })
      }
      if (forCarousel) {
        const next = [...(replace ? [] : carouselItems), ...uploaded].slice(0, MAX_CAROUSEL)
        setCarouselItems(next)
        if (next[0]) setImageItem(next[0])
        publish('carousel', videoItem, next[0] || null, next)
      } else {
        const next = uploaded[0]
        setImageItem(next)
        publish('image', videoItem, next, carouselItems)
      }
    } catch (err) {
      setError(err?.message || 'Couldn’t upload that image.')
    } finally {
      setBusy(false)
    }
  }

  function pickFilmPoster(film) {
    if (!film.poster) return
    const next = { url: film.poster, kind: 'image', filmId: film.id }
    setImageItem(next)
    publish('image', videoItem, next, carouselItems)
    setChooser(null)
  }

  function pickCarouselPoster(film) {
    if (!film.poster || carouselItems.length >= MAX_CAROUSEL) return
    const next = [...carouselItems, { url: film.poster, kind: 'image', filmId: film.id }].slice(0, MAX_CAROUSEL)
    setCarouselItems(next)
    setImageItem(next[0] || null)
    publish('carousel', videoItem, next[0] || null, next)
    setChooser(null)
  }

  function moveCarousel(index, dir) {
    const nextIndex = index + dir
    if (nextIndex < 0 || nextIndex >= carouselItems.length) return
    const next = [...carouselItems]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    setCarouselItems(next)
    setImageItem(next[0] || null)
    publish('carousel', videoItem, next[0] || null, next)
  }

  function removeCarousel(index) {
    const next = carouselItems.filter((_, i) => i !== index)
    setCarouselItems(next)
    setImageItem(next[0] || imageItem)
    publish('carousel', videoItem, next[0] || null, next)
  }

  function clearMedia() {
    setVideoItem(null)
    setImageItem(null)
    setCarouselItems([])
    onChange(EMPTY)
  }

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className="upload-modal psite-picker psite-media-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="upload-modal-top">
          <h2 id="media-picker-title" className="profile-modal-title">
            Hero media
          </h2>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <div className="psite-mode-slider" style={{ '--mode-i': modeIndex }} role="tablist" aria-label="Media type">
          <span className="psite-mode-slider-thumb" aria-hidden="true" />
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={mode === item.id ? 'is-on' : undefined}
              onClick={() => switchMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="psite-mode-pane">
          <div className="psite-mode-pane-top">
            {mode === 'carousel' ? (
              <button
                type="button"
                className="ghost-btn"
                disabled={busy || carouselItems.length >= MAX_CAROUSEL}
                onClick={() => carouselRef.current?.click()}
              >
                <Icon name="plus" />
                Add an image
              </button>
            ) : null}
          </div>

          {mode === 'video' && (
            <div className={`psite-drop${videoItem ? ' has-media' : ''}`}>
              {videoItem?.url ? <img src={videoItem.url} alt="" /> : null}
              <form className="psite-drop-link" onSubmit={addVideoLink}>
                <input
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="YouTube or Vimeo link"
                  aria-label="YouTube or Vimeo link"
                />
                <button type="submit" className="solid-btn" disabled={busy || !link.trim()}>
                  Add
                </button>
              </form>
            </div>
          )}

          {mode === 'image' && (
            <div
              className={`psite-drop${imageItem ? ' has-media' : ''}${dragging ? ' is-drag' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                takeImages(event.dataTransfer.files)
              }}
            >
              {imageItem?.url ? <img src={imageItem.url} alt="" /> : null}
              <button
                type="button"
                className={imageItem ? 'psite-media-edit' : 'psite-drop-upload'}
                disabled={busy}
                onClick={() => imageRef.current?.click()}
              >
                {imageItem ? (
                  'Replace image'
                ) : (
                  <>
                    <Icon name="add-image" />
                    Upload image
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'carousel' && (
            <div
              className={`credit-board${dragging ? ' is-drag' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                takeImages(event.dataTransfer.files, { forCarousel: true })
              }}
            >
              {carouselItems.length === 0 ? (
                <p className="credit-board-empty">Drag images here to build the carousel.</p>
              ) : (
                carouselItems.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="credit-board-row">
                    {item.url ? <img src={item.url} alt="" /> : <span className="psite-order-ph" />}
                    <span className="credit-board-name">Image {index + 1}</span>
                    <div className="reorder-btns">
                      <button
                        type="button"
                        onClick={() => moveCarousel(index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCarousel(index, 1)}
                        disabled={index === carouselItems.length - 1}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      className="crew-remove"
                      onClick={() => removeCarousel(index)}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              takeImages(event.target.files)
              event.target.value = ''
            }}
          />
          <input
            ref={carouselRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              takeImages(event.target.files, { forCarousel: true })
              event.target.value = ''
            }}
          />

          <div className="psite-mode-pane-bot">
            {mode === 'video' ? (
              <button
                type="button"
                className="ghost-btn psite-drop-sub"
                disabled={busy || videoFilms.length === 0}
                onClick={() => setChooser('video')}
              >
                Select from projects
              </button>
            ) : null}
            {mode === 'image' ? (
              <button
                type="button"
                className="ghost-btn psite-drop-sub"
                disabled={busy || posterFilms.length === 0}
                onClick={() => setChooser('image')}
              >
                Select a thumbnail from projects
              </button>
            ) : null}
            {mode === 'carousel' ? (
              <button
                type="button"
                className="ghost-btn psite-drop-sub"
                disabled={busy || posterFilms.length === 0 || carouselItems.length >= MAX_CAROUSEL}
                onClick={() => setChooser('carousel')}
              >
                Select a thumbnail from projects
              </button>
            ) : null}
          </div>
        </div>

        {error ? <p className="psite-form-error">{error}</p> : null}
        {busy ? <p className="upload-note">Uploading…</p> : null}

        <div className="upload-modal-foot">
          <button type="button" className="ghost-btn" onClick={clearMedia}>
            Remove media
          </button>
          <button type="button" className="solid-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      {chooser && (
        <ProjectChooser
          kind={chooser}
          films={chooser === 'video' ? videoFilms : posterFilms}
          onPick={chooser === 'video' ? pickFilmVideo : chooser === 'carousel' ? pickCarouselPoster : pickFilmPoster}
          onClose={() => setChooser(null)}
        />
      )}
    </div>
  )
}

function ProjectChooser({ kind, films, onPick, onClose }) {
  return (
    <div className="credit-dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="credit-dialog psite-project-chooser"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-chooser-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="credit-dialog-top">
          <h3 id="project-chooser-title">
            {kind === 'video' ? 'Select a project video' : 'Select a project thumbnail'}
          </h3>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {films.length === 0 ? (
          <p className="psite-muted">No projects with {kind === 'video' ? 'a video' : 'a thumbnail'} yet.</p>
        ) : (
          <div className="psite-picker-films">
            {films.map((film) => (
              <button key={film.id} type="button" className="psite-picker-film" onClick={() => onPick(film)}>
                {film.poster ? <img src={film.poster} alt="" /> : null}
                <span>
                  {film.title}
                  <small> {statusLabel(film)}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
