import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useOutletContext, Link, useParams } from 'react-router-dom'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { formatRolePhrase, memberRoles } from '../data'
import { acceptCreditInvite, INVITE_STORAGE_KEY, PREVIEW_INVITE_TOKEN, normalizeEmail } from '../lib/invites'
import { embedUrl, youtubePoster } from '../lib/video'

const PREVIEW_VIDEO_ID = 'aqz-KE-bpKQ'

const PREVIEW_INVITE = {
  id: 'preview',
  email: 'maya.reyes@utexas.edu',
  emailLower: 'maya.reyes@utexas.edu',
  ownerName: 'Jordan Hale',
  filmTitle: 'Night Bus',
  filmPoster: youtubePoster(PREVIEW_VIDEO_ID),
  host: 'youtube',
  videoId: PREVIEW_VIDEO_ID,
  kind: 'crew',
  role: 'Cinematographer',
  roles: ['Cinematographer'],
  state: 'invited',
}

const CONFETTI_COLORS = ['#e8703a', '#f4b183', '#f4f4f1', '#ffd6a8', '#c94e1e', '#fff3e8']

function InviteConfetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 72 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 3.4,
        duration: 1.25 + Math.random() * 0.7,
        size: 6 + Math.random() * 7,
        drift: `${(Math.random() - 0.5) * 80}px`,
        spin: `${220 + Math.random() * 280}deg`,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      })),
    [],
  )
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 6400)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="invite-confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * (0.55 + (piece.id % 3) * 0.25),
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            '--drift': piece.drift,
            '--spin': piece.spin,
          }}
        />
      ))}
    </div>
  )
}

function InviteWatch({ film }) {
  const [playing, setPlaying] = useState(false)
  const embed = embedUrl(film)
  const poster = film?.poster

  useEffect(() => {
    setPlaying(false)
  }, [film?.host, film?.videoId, film?.poster])

  if (!poster && !embed) return null

  return (
    <div className="invite-media">
      {playing && embed ? (
        <iframe
          className="invite-embed"
          src={embed}
          title={film.title || 'Film'}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : embed ? (
        <button type="button" className="invite-media-btn" onClick={() => setPlaying(true)}>
          {poster ? <img src={poster} alt="" /> : <div className="invite-media-empty" />}
          <span className="invite-watch">
            <svg className="invite-watch-play" viewBox="0 0 12 14" aria-hidden="true">
              <path d="M1.6.8v12.4L11.8 7z" fill="currentColor" />
            </svg>
            Watch
          </span>
        </button>
      ) : (
        <div className="invite-media-still">
          <img src={poster} alt="" />
        </div>
      )}
    </div>
  )
}

export default function Invite() {
  const { token } = useParams()
  const { onSignup, onLogin, byId } = useOutletContext()
  const { user, profile, loading } = useAuth()
  const isPreview = token === PREVIEW_INVITE_TOKEN
  const [invite, setInvite] = useState(isPreview ? PREVIEW_INVITE : token ? undefined : null)
  const [linkedFilm, setLinkedFilm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (token && !isPreview) sessionStorage.setItem(INVITE_STORAGE_KEY, token)
  }, [token, isPreview])

  useEffect(() => {
    if (!token) return undefined
    if (isPreview) {
      setInvite(PREVIEW_INVITE)
      return undefined
    }
    let cancelled = false
    getDoc(doc(db, 'invites', token))
      .then((snap) => {
        if (cancelled) return
        setInvite(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      })
      .catch(() => {
        if (!cancelled) setInvite(null)
      })
    return () => {
      cancelled = true
    }
  }, [token, isPreview])

  const catalogFilm = invite?.filmId ? byId?.(invite.filmId) : null

  useEffect(() => {
    if (!invite?.filmId || catalogFilm || (invite.host && invite.videoId)) {
      setLinkedFilm(null)
      return undefined
    }
    let cancelled = false
    getDoc(doc(db, 'films', invite.filmId))
      .then((snap) => {
        if (!cancelled) setLinkedFilm(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      })
      .catch(() => {
        if (!cancelled) setLinkedFilm(null)
      })
    return () => {
      cancelled = true
    }
  }, [invite, catalogFilm])

  const watchFilm = useMemo(() => {
    const source = catalogFilm || linkedFilm
    return {
      title: invite?.filmTitle || source?.title || '',
      poster: invite?.filmPoster || source?.poster || '',
      host: invite?.host || source?.host || '',
      videoId: invite?.videoId || source?.videoId || '',
    }
  }, [invite, catalogFilm, linkedFilm])

  const emails = [user?.email, profile?.email, profile?.utEmail].filter(Boolean).map(normalizeEmail)
  const emailMatches = invite?.emailLower && emails.includes(invite.emailLower)
  const alreadyAccepted = !isPreview && (invite?.state === 'accepted' || accepted)
  const showGuest = isPreview || !user
  const canAccept = Boolean(!isPreview && user && profile?.onboarded && invite && emailMatches && !alreadyAccepted)

  async function onAccept() {
    if (!canAccept) return
    setError('')
    setBusy(true)
    try {
      await acceptCreditInvite(token)
      sessionStorage.removeItem(INVITE_STORAGE_KEY)
      setAccepted(true)
    } catch (err) {
      setError(err.message || 'Couldn’t accept that invite.')
    } finally {
      setBusy(false)
    }
  }

  if ((invite === undefined || loading) && !isPreview) {
    return (
      <main className="page invite-page">
        <div className="invite-card">
          <p className="invite-kicker">Cast &amp; crew</p>
          <h1 className="shot-title invite-title">Loading invite…</h1>
        </div>
      </main>
    )
  }

  if (!invite) {
    return (
      <main className="page invite-page">
        <div className="invite-card">
          <p className="invite-kicker">Cast &amp; crew</p>
          <h1 className="shot-title invite-title">This invite isn’t valid</h1>
          <p>The link may have expired, or the project was updated. Ask the filmmaker to send it again.</p>
          <Link className="solid-btn" to="/">
            Go to Shortwave
          </Link>
        </div>
      </main>
    )
  }

  const rolePhrase = formatRolePhrase(memberRoles(invite)) || invite.role
  const roleLabel = rolePhrase || (invite.kind === 'cast' ? 'cast' : 'crew')

  return (
    <main className="page invite-page">
      <InviteConfetti />
      <div className="invite-card">
        <p className="invite-kicker">You’re invited</p>
        <h1 className="shot-title invite-title">
          {invite.ownerName} credited you as <span className="invite-role">{roleLabel}</span> on “{invite.filmTitle}”
        </h1>
        <p className="invite-copy">
          Accept this invite to appear on the film’s cast &amp; crew. Until then, the credit stays off Shortwave.
        </p>
        <InviteWatch film={watchFilm} />

        {alreadyAccepted ? (
          <>
            <p className="field-help">You’re on the slate. The credit is live on this film.</p>
            <Link className="solid-btn" to="/projects">
              View your projects
            </Link>
          </>
        ) : showGuest ? (
          <>
            <p className="field-help invite-account">
              Create a Shortwave account with <strong>{invite.email}</strong> to accept.
            </p>
            <div className="invite-actions">
              <button type="button" className="solid-btn" onClick={onSignup}>
                Sign up
              </button>
              <button type="button" className="ghost-btn" onClick={onLogin}>
                Log in
              </button>
            </div>
          </>
        ) : !profile?.onboarded ? (
          <p className="field-help">Finish setting up your profile, then you can accept this credit.</p>
        ) : !emailMatches ? (
          <p className="auth-error">
            This invite was sent to {invite.email}. Sign in with that address to accept.
          </p>
        ) : (
          <button type="button" className="solid-btn" disabled={busy} onClick={onAccept}>
            {busy ? 'Accepting…' : 'Accept credit'}
          </button>
        )}
        {error ? <p className="auth-error">{error}</p> : null}
      </div>
    </main>
  )
}
