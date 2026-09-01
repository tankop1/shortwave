import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { formatRoles, memberRoles } from '../data'
import {
  PREVIEW_INVITE_TOKEN,
  listPendingInvites,
  sendCreditInviteEmail,
  sendTestInviteEmail,
} from '../lib/invites'
import {
  sendTestContactEmail,
  sendTestPlaysEmail,
  sendTestRatingEmail,
  sendTestWelcomeEmail,
} from '../lib/mail'

const DEBUG_PASSWORD = 'debug'

function inviteKey(invite) {
  return `${invite.filmId}:${invite.token || invite.email}`
}

function inviteRole(invite) {
  return formatRoles(memberRoles(invite)) || invite.role || 'crew'
}

export default function DebugModal({ onClose }) {
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState(false)
  const [view, setView] = useState('tools')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [invites, setInvites] = useState([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [sendingKey, setSendingKey] = useState('')
  const [sentKeys, setSentKeys] = useState([])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') {
        if (unlocked && view === 'invites') {
          setView('tools')
          setError('')
          return
        }
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, unlocked, view])

  function onUnlock(event) {
    event.preventDefault()
    if (password !== DEBUG_PASSWORD) {
      setError('That password is incorrect.')
      return
    }
    setError('')
    setUnlocked(true)
  }

  function openInvitePreview() {
    onClose()
    navigate(`/invite/${PREVIEW_INVITE_TOKEN}`)
  }

  async function sendTest(kind, send, successNote) {
    setError('')
    setNote('')
    setBusy(kind)
    try {
      await send()
      setNote(successNote)
    } catch (err) {
      setError(err.message || 'Couldn’t send the test email.')
    } finally {
      setBusy('')
    }
  }

  async function onSendTestInvite() {
    await sendTest('invite', sendTestInviteEmail, 'Sent a test invite to shortwaveut@gmail.com.')
  }

  async function openPendingInvites() {
    setError('')
    setNote('')
    setView('invites')
    setLoadingInvites(true)
    try {
      const next = await listPendingInvites()
      setInvites(next)
    } catch (err) {
      setError(err.message || 'Couldn’t load pending invites.')
    } finally {
      setLoadingInvites(false)
    }
  }

  async function onInvitePerson(invite) {
    const key = inviteKey(invite)
    setError('')
    setNote('')
    setSendingKey(key)
    try {
      await sendCreditInviteEmail({
        filmId: invite.filmId,
        token: invite.token,
        email: invite.email,
      })
      setSentKeys((current) => (current.includes(key) ? current : [...current, key]))
      setNote(`Sent an invite to ${invite.email}.`)
    } catch (err) {
      setError(err.message || 'Couldn’t send the invite.')
    } finally {
      setSendingKey('')
    }
  }

  const title = !unlocked ? 'Enter debug password' : view === 'invites' ? 'Pending invites' : 'Debug'

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className={`upload-modal settings-modal debug-modal${view === 'invites' ? ' is-list' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="debug-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-main">
          <div className="settings-main-top">
            <h2 id="debug-title">{title}</h2>
            <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>

          {!unlocked ? (
            <form className="settings-body" onSubmit={onUnlock}>
              <p className="settings-copy">Enter the debug password to open these tools.</p>
              <label className="field">
                <span className="field-label">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  autoComplete="off"
                  placeholder="Password"
                  autoFocus
                />
              </label>
              {error ? <p className="auth-error">{error}</p> : null}
              <div className="settings-rows">
                <button type="submit" className="settings-row">
                  Continue
                </button>
              </div>
            </form>
          ) : view === 'invites' ? (
            <div className="settings-body">
              <p className="settings-copy">
                People who were invited on a film but may not have received the email.
              </p>
              {error ? <p className="auth-error">{error}</p> : null}
              {note ? <p className="settings-copy">{note}</p> : null}
              {loadingInvites ? (
                <p className="settings-copy">Loading invites…</p>
              ) : error ? null : invites.length === 0 ? (
                <p className="settings-copy">No pending invite emails right now.</p>
              ) : (
                <div className="debug-invite-list">
                  {invites.map((invite) => {
                    const key = inviteKey(invite)
                    const sent = sentKeys.includes(key)
                    const sending = sendingKey === key
                    return (
                      <div className="debug-invite" key={key}>
                        <div className="debug-invite-copy">
                          <div className="debug-invite-name">{invite.name || 'Unnamed'}</div>
                          <div className="debug-invite-meta">
                            {invite.email}
                            {' · '}
                            {inviteRole(invite)}
                            {' · '}
                            {invite.filmTitle || 'Untitled'}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="solid-btn debug-invite-btn"
                          disabled={Boolean(sendingKey) || sent}
                          onClick={() => onInvitePerson(invite)}
                        >
                          {sent ? 'Sent' : sending ? 'Sending…' : 'Invite'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="settings-rows">
                <button
                  type="button"
                  className="settings-row"
                  disabled={Boolean(sendingKey)}
                  onClick={() => {
                    setView('tools')
                    setError('')
                    setNote('')
                  }}
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="settings-body">
              <p className="settings-copy">Tools for previewing screens that are hard to reach in a normal session.</p>
              {error ? <p className="auth-error">{error}</p> : null}
              {note ? <p className="settings-copy">{note}</p> : null}
              <div className="settings-rows">
                <button type="button" className="settings-row" disabled={Boolean(busy)} onClick={openInvitePreview}>
                  Open invite page
                </button>
                <button type="button" className="settings-row" disabled={Boolean(busy)} onClick={onSendTestInvite}>
                  {busy === 'invite' ? 'Sending…' : 'Send test invite email'}
                </button>
                <button
                  type="button"
                  className="settings-row"
                  disabled={Boolean(busy)}
                  onClick={() => sendTest('contact', sendTestContactEmail, 'Sent a test contact email to shortwaveut@gmail.com.')}
                >
                  {busy === 'contact' ? 'Sending…' : 'Send test contact email'}
                </button>
                <button
                  type="button"
                  className="settings-row"
                  disabled={Boolean(busy)}
                  onClick={() => sendTest('rating', sendTestRatingEmail, 'Sent a test rating email to shortwaveut@gmail.com.')}
                >
                  {busy === 'rating' ? 'Sending…' : 'Send test rating email'}
                </button>
                <button
                  type="button"
                  className="settings-row"
                  disabled={Boolean(busy)}
                  onClick={() => sendTest('plays', sendTestPlaysEmail, 'Sent a test 10-plays email to shortwaveut@gmail.com.')}
                >
                  {busy === 'plays' ? 'Sending…' : 'Send test 10-plays email'}
                </button>
                <button
                  type="button"
                  className="settings-row"
                  disabled={Boolean(busy)}
                  onClick={() => sendTest('welcome', sendTestWelcomeEmail, 'Sent a test welcome email to shortwaveut@gmail.com.')}
                >
                  {busy === 'welcome' ? 'Sending…' : 'Send test welcome email'}
                </button>
                <button type="button" className="settings-row" disabled={Boolean(busy)} onClick={openPendingInvites}>
                  Pending invite emails
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
