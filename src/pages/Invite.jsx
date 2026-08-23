import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useOutletContext, Link, useParams } from 'react-router-dom'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { formatRolePhrase, memberRoles } from '../data'
import { acceptCreditInvite, INVITE_STORAGE_KEY, normalizeEmail } from '../lib/invites'

export default function Invite() {
  const { token } = useParams()
  const { onSignup, onLogin } = useOutletContext()
  const { user, profile, loading } = useAuth()
  const [invite, setInvite] = useState(token ? undefined : null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (token) sessionStorage.setItem(INVITE_STORAGE_KEY, token)
  }, [token])

  useEffect(() => {
    if (!token) return undefined
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
  }, [token])

  const emails = [user?.email, profile?.email, profile?.utEmail].filter(Boolean).map(normalizeEmail)
  const emailMatches = invite?.emailLower && emails.includes(invite.emailLower)
  const alreadyAccepted = invite?.state === 'accepted' || accepted
  const canAccept = Boolean(user && profile?.onboarded && invite && emailMatches && !alreadyAccepted)

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

  if (invite === undefined || loading) {
    return (
      <main className="page invite-page">
        <div className="invite-card">
          <p className="invite-kicker">Cast &amp; crew</p>
          <h1>Loading invite…</h1>
        </div>
      </main>
    )
  }

  if (!invite) {
    return (
      <main className="page invite-page">
        <div className="invite-card">
          <p className="invite-kicker">Cast &amp; crew</p>
          <h1>This invite isn’t valid</h1>
          <p>The link may have expired, or the project was updated. Ask the filmmaker to send it again.</p>
          <Link className="solid-btn" to="/">
            Go to Shortwave
          </Link>
        </div>
      </main>
    )
  }

  const rolePhrase = formatRolePhrase(memberRoles(invite)) || invite.role
  const roleLine = invite.kind === 'cast' ? `as ${rolePhrase || 'cast'}` : `as ${rolePhrase || 'crew'}`

  return (
    <main className="page invite-page">
      <div className="invite-card">
        <p className="invite-kicker">You’re invited</p>
        <h1>
          {invite.ownerName} credited you {roleLine} on “{invite.filmTitle}”
        </h1>
        <p>
          Accept this invite to appear on the film’s cast &amp; crew. Until then, the credit stays off Shortwave.
        </p>
        {invite.filmPoster ? (
          <div className="invite-poster">
            <img src={invite.filmPoster} alt="" />
          </div>
        ) : null}
        {invite.logline ? <p className="invite-logline">{invite.logline}</p> : null}

        {alreadyAccepted ? (
          <>
            <p className="field-help">You’re on the slate. The credit is live on this film.</p>
            <Link className="solid-btn" to="/projects">
              View your projects
            </Link>
          </>
        ) : !user ? (
          <>
            <p className="field-help">
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
