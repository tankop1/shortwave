import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { PREVIEW_INVITE_TOKEN } from '../lib/invites'

const DEBUG_PASSWORD = 'debug'

export default function DebugModal({ onClose }) {
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

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

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className="upload-modal debug-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="debug-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="debug-modal-top">
          <h2 id="debug-title">{unlocked ? 'Debug' : 'Enter debug password'}</h2>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        {unlocked ? (
          <div className="debug-body">
            <p className="settings-copy">Tools for previewing screens that are hard to reach in a normal session.</p>
            <button type="button" className="solid-btn" onClick={openInvitePreview}>
              Open invite page
            </button>
          </div>
        ) : (
          <form className="debug-body" onSubmit={onUnlock}>
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
            <button type="submit" className="solid-btn">
              Continue
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
