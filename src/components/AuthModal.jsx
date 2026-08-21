import { useEffect, useState } from 'react'
import Icon from './Icon'
import { authErrorMessage, useAuth } from '../auth/AuthContext'

export default function AuthModal({ mode, onClose, onSwitch }) {
  const { signUpEmail, signInEmail, signInGoogle } = useAuth()
  const isSignup = mode === 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
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

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignup) await signUpEmail(email.trim(), password)
      else await signInEmail(email.trim(), password)
      onClose()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setError('')
    setBusy(true)
    try {
      await signInGoogle()
      onClose()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="upload-backdrop" onClick={onClose} role="presentation">
      <div
        className="upload-modal auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="upload-modal-top">
          <div className="upload-step-kicker">{isSignup ? 'Create account' : 'Welcome back'}</div>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="upload-modal-copy">
          <h2 id="auth-title">{isSignup ? 'Sign up' : 'Log in'}</h2>
          <p>
            {isSignup
              ? 'Use your email or Google. You’ll verify a UT address next.'
              : 'Log in to upload, save films, and manage your projects.'}
          </p>
        </div>

        <form className="upload-fields" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@utexas.edu"
              autoFocus
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
              minLength={6}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="solid-btn auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          </button>
          <button type="button" className="ghost-btn auth-google" onClick={onGoogle} disabled={busy}>
            Continue with Google
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <button type="button" onClick={() => onSwitch(isSignup ? 'login' : 'signup')}>
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
