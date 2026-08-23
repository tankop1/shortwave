import { useEffect, useState } from 'react'
import Icon from './Icon'
import { authErrorMessage, useAuth } from '../auth/AuthContext'
import { deleteOwnAccount, passwordReauthRequired } from '../lib/account'

const SECTIONS = [{ id: 'account', label: 'Account' }]

export default function SettingsModal({ onClose }) {
  const { user, signOut } = useAuth()
  const [section, setSection] = useState('account')
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const needsPassword = passwordReauthRequired(user)

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

  async function onLogout() {
    setError('')
    setBusy(true)
    try {
      await signOut()
      onClose()
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  async function onDelete(event) {
    event.preventDefault()
    if (needsPassword && !password) {
      setError('Enter your password to delete your account.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await deleteOwnAccount(password)
      onClose()
    } catch (err) {
      const code = err?.code || ''
      if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        setError('That password is incorrect.')
      } else if (code.includes('popup-closed')) {
        setError('Google confirmation was closed. Nothing was deleted.')
      } else {
        setError(authErrorMessage(err) || err.message || 'Couldn’t delete your account.')
      }
      setBusy(false)
    }
  }

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className="upload-modal settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <nav className="settings-nav" aria-label="Settings">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-nav-btn${section === item.id ? ' is-on' : ''}`}
              onClick={() => {
                setSection(item.id)
                setConfirming(false)
                setPassword('')
                setError('')
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="settings-main">
          <div className="settings-main-top">
            <h2 id="settings-title">{confirming ? 'Delete account' : 'Account'}</h2>
            <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>

          {confirming ? (
            <form className="settings-body" onSubmit={onDelete}>
              <p className="settings-copy">
                This permanently deletes your films, portfolio, messages, and login. This can’t be undone.
              </p>
              {needsPassword ? (
                <label className="field">
                  <span className="field-label">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    autoFocus
                  />
                </label>
              ) : null}
              {error ? <p className="auth-error">{error}</p> : null}
              <div className="settings-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={busy}
                  onClick={() => {
                    setConfirming(false)
                    setPassword('')
                    setError('')
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="solid-btn is-danger" disabled={busy || (needsPassword && !password)}>
                  {busy ? 'Deleting…' : 'Delete account'}
                </button>
              </div>
            </form>
          ) : (
            <div className="settings-body">
              <p className="settings-copy">Manage your Shortwave login.</p>
              {error ? <p className="auth-error">{error}</p> : null}
              <div className="settings-rows">
                <button type="button" className="settings-row" disabled={busy} onClick={onLogout}>
                  Logout
                </button>
                <button
                  type="button"
                  className="settings-row is-danger"
                  disabled={busy}
                  onClick={() => {
                    setConfirming(true)
                    setError('')
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
