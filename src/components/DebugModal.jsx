import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { PREVIEW_INVITE_TOKEN, sendTestInviteEmail } from '../lib/invites'

const DEBUG_PASSWORD = 'debug'

export default function DebugModal({ onClose }) {
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

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

  async function onSendTestInvite() {
    setError('')
    setNote('')
    setBusy(true)
    try {
      await sendTestInviteEmail()
      setNote('Sent a test invite to shortwaveut@gmail.com.')
    } catch (err) {
      setError(err.message || 'Couldn’t send the test invite.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className="upload-modal settings-modal debug-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="debug-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-main">
          <div className="settings-main-top">
            <h2 id="debug-title">{unlocked ? 'Debug' : 'Enter debug password'}</h2>
            <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>

          {unlocked ? (
            <div className="settings-body">
              <p className="settings-copy">Tools for previewing screens that are hard to reach in a normal session.</p>
              {error ? <p className="auth-error">{error}</p> : null}
              {note ? <p className="settings-copy">{note}</p> : null}
              <div className="settings-rows">
                <button type="button" className="settings-row" disabled={busy} onClick={openInvitePreview}>
                  Open invite page
                </button>
                <button type="button" className="settings-row" disabled={busy} onClick={onSendTestInvite}>
                  {busy ? 'Sending…' : 'Send test invite email'}
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}
