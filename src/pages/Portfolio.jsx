import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import PortfolioSite from '../components/portfolio/PortfolioSite'
import MediaPicker from '../components/portfolio/MediaPicker'
import FilmPicker from '../components/portfolio/FilmPicker'
import StylePicker from '../components/portfolio/StylePicker'
import SiteLoader from '../components/portfolio/SiteLoader'
import Icon from '../components/Icon'
import { uploadImage } from '../lib/cloudinary'
import {
  claimOrChangeSlug,
  ensurePortfolioSetup,
  isValidSlug,
  normalizePortfolio,
  normalizeSlug,
  PORTFOLIO_DISPLAY_HOST,
  portfolioUrl,
  savePortfolio,
} from '../lib/portfolio'

export default function Portfolio() {
  const { myFilms, libraryLoading, profile, user, onOpen } = useOutletContext()
  const [slug, setSlug] = useState('')
  const [slugDraft, setSlugDraft] = useState('')
  const [portfolio, setPortfolio] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')
  const [slugNote, setSlugNote] = useState('')
  const [slugChecking, setSlugChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [filmsOpen, setFilmsOpen] = useState(false)
  const [styleOpen, setStyleOpen] = useState(false)
  const [domainOpen, setDomainOpen] = useState(false)
  const saveTimer = useRef(null)
  const portfolioRef = useRef(null)
  const booted = useRef(false)
  const lastSaved = useRef('')

  useEffect(() => {
    if (booted.current || !user || !profile || libraryLoading) return undefined
    let cancelled = false
    ensurePortfolioSetup(user.uid, profile, myFilms)
      .then(({ slug: nextSlug, portfolio: nextPortfolio }) => {
        if (cancelled) return
        booted.current = true
        lastSaved.current = JSON.stringify(nextPortfolio)
        setSlug(nextSlug)
        setSlugDraft(nextSlug)
        setPortfolio(nextPortfolio)
        portfolioRef.current = nextPortfolio
        setReady(true)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Couldn’t open the editor.')
      })
    return () => {
      cancelled = true
    }
  }, [user, profile, libraryLoading, myFilms])

  const films = useMemo(() => {
    if (!portfolio) return []
    return portfolio.filmIds.map((id) => myFilms.find((film) => film.id === id)).filter(Boolean)
  }, [portfolio, myFilms])

  const scheduleSave = useCallback(
    (next) => {
      if (!user) return
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(async () => {
        setSaving(true)
        try {
          await savePortfolio(user.uid, next)
        } catch {
          /* keep local copy */
        } finally {
          setSaving(false)
        }
      }, 400)
    },
    [user],
  )

  useEffect(() => {
    if (!ready || !portfolio) return undefined
    portfolioRef.current = portfolio
    const encoded = JSON.stringify(portfolio)
    if (encoded === lastSaved.current) return undefined
    lastSaved.current = encoded
    scheduleSave(portfolio)
    return () => window.clearTimeout(saveTimer.current)
  }, [portfolio, ready, scheduleSave])

  function patch(partial) {
    setPortfolio((current) => {
      if (!current) return current
      return normalizePortfolio({ ...current, ...partial })
    })
  }

  async function flushSave() {
    window.clearTimeout(saveTimer.current)
    if (!user || !portfolioRef.current) return
    await savePortfolio(user.uid, portfolioRef.current)
  }

  async function commitSlug() {
    if (!user || !slug || slugChecking) return true
    const next = normalizeSlug(slugDraft)
    setSlugError('')
    setSlugNote('')
    if (!next || next === slug) {
      setSlugDraft(slug)
      return true
    }
    if (!isValidSlug(next)) {
      setSlugError('Use 3–30 letters, numbers, or hyphens.')
      return false
    }
    setSlugChecking(true)
    try {
      const claimed = await claimOrChangeSlug(user.uid, next, slug)
      setSlug(claimed)
      setSlugDraft(claimed)
      setSlugNote('Available — link updated')
      window.setTimeout(() => setSlugNote(''), 2200)
      return true
    } catch (err) {
      setSlugError(err?.message || 'That link isn’t available.')
      return false
    } finally {
      setSlugChecking(false)
    }
  }

  async function saveDomain(event) {
    event.preventDefault()
    const ok = await commitSlug()
    if (ok) setDomainOpen(false)
  }

  async function preview() {
    await flushSave()
    if (slug) window.open(`${window.location.origin}/${slug}`, '_blank', 'noopener,noreferrer')
  }

  async function share() {
    if (!slug) return
    try {
      await flushSave()
      await navigator.clipboard.writeText(portfolioUrl(slug))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  async function onAboutImageFile(file) {
    try {
      const aboutImageUrl = await uploadImage(file, 'profile', { maxWidth: 1200 })
      patch({ aboutImageUrl })
    } catch (err) {
      setError(err?.message || 'Couldn’t upload that photo.')
    }
  }

  if (error && !ready) {
    return (
      <main className="page">
        <div className="empty-panel">
          <p>{error}</p>
        </div>
      </main>
    )
  }

  if (!ready || !portfolio) {
    return (
      <main className="studio" aria-busy="true">
        <SiteLoader label="Opening your site…" />
      </main>
    )
  }

  return (
    <main className="studio">
      <div className="studio-bar">
        <label className="studio-slug">
          <span className="studio-host">{PORTFOLIO_DISPLAY_HOST}/</span>
          <span className="studio-slug-field">
            <input
              value={slugDraft}
              spellCheck={false}
              aria-label="Portfolio link"
              disabled={slugChecking}
              onChange={(event) => {
                setSlugDraft(event.target.value.toLowerCase())
                setSlugError('')
                setSlugNote('')
              }}
              onBlur={commitSlug}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
              }}
            />
            {slugChecking ? <span className="studio-slug-spin" aria-label="Checking availability" /> : null}
          </span>
          {slugChecking ? <span className="studio-slug-wait">Checking…</span> : null}
          {!slugChecking && slugNote ? <span className="studio-slug-ok">{slugNote}</span> : null}
          {!slugChecking && slugError ? <span className="studio-slug-err">{slugError}</span> : null}
        </label>
        <div className="studio-actions">
          <button
            type="button"
            className="ghost-btn studio-domain-btn"
            onClick={() => {
              setSlugError('')
              setSlugNote('')
              setDomainOpen(true)
            }}
          >
            <Icon name="edit" />
            Domain
          </button>
          {saving ? <span className="studio-save">Saving</span> : null}
          <button type="button" className="ghost-btn" aria-label="Style" onClick={() => setStyleOpen(true)}>
            <Icon name="palette" />
            <span className="studio-btn-copy">Style</span>
          </button>
          <button type="button" className="ghost-btn" aria-label="Preview" onClick={preview}>
            <Icon name="eye" />
            <span className="studio-btn-copy">Preview</span>
          </button>
          <button type="button" className="solid-btn" onClick={share}>
            <Icon name="share" className="icon-dark icon-share" />
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>

      <div className="studio-canvas">
        <PortfolioSite
          name={profile.name}
          portfolio={portfolio}
          films={films}
          editable
          ownerId={user.uid}
          onChange={patch}
          onOpenFilm={onOpen}
          onEditHeroMedia={() => setMediaOpen(true)}
          onEditFilms={() => setFilmsOpen(true)}
          onAboutImageFile={onAboutImageFile}
        />
      </div>

      {mediaOpen && (
        <MediaPicker
          media={portfolio.heroMedia}
          films={myFilms}
          onChange={(heroMedia) => patch({ heroMedia })}
          onClose={() => setMediaOpen(false)}
        />
      )}
      {filmsOpen && (
        <FilmPicker
          films={myFilms}
          selectedIds={portfolio.filmIds}
          onChange={(filmIds) => patch({ filmIds })}
          onClose={() => setFilmsOpen(false)}
        />
      )}
      {styleOpen && (
        <StylePicker
          portfolio={portfolio}
          onChange={patch}
          onClose={() => setStyleOpen(false)}
        />
      )}
      {domainOpen && (
        <div className="upload-backdrop" onClick={() => setDomainOpen(false)} role="presentation">
          <form
            className="upload-modal studio-domain-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="domain-panel-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={saveDomain}
          >
            <div className="upload-modal-top">
              <h2 id="domain-panel-title" className="profile-modal-title">
                Domain
              </h2>
              <button type="button" className="upload-modal-close" onClick={() => setDomainOpen(false)} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
            <p className="studio-domain-copy">This is the public link for your site.</p>
            <label className="field">
              <span className="field-label">Your link</span>
              <span className="studio-domain-input">
                <span className="studio-host">{PORTFOLIO_DISPLAY_HOST}/</span>
                <input
                  value={slugDraft}
                  spellCheck={false}
                  aria-label="Portfolio link"
                  disabled={slugChecking}
                  autoFocus
                  onChange={(event) => {
                    setSlugDraft(event.target.value.toLowerCase())
                    setSlugError('')
                    setSlugNote('')
                  }}
                />
              </span>
            </label>
            {slugChecking ? <p className="studio-slug-wait">Checking…</p> : null}
            {!slugChecking && slugNote ? <p className="studio-slug-ok">{slugNote}</p> : null}
            {!slugChecking && slugError ? <p className="studio-slug-err">{slugError}</p> : null}
            <div className="upload-modal-foot">
              <button type="button" className="ghost-btn" onClick={() => setDomainOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="solid-btn" disabled={slugChecking}>
                {slugChecking ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
