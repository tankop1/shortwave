import { EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { auth, functions, googleProvider } from '../firebase'

const REAUTH_WINDOW_MS = 5 * 60 * 1000

function lastSignInAt(user) {
  const value = Date.parse(user?.metadata?.lastSignInTime || '')
  return Number.isFinite(value) ? value : 0
}

function loginIsStale(user) {
  return Date.now() - lastSignInAt(user) > REAUTH_WINDOW_MS
}

export function hasPasswordProvider(user) {
  return Boolean(user?.providerData?.some((item) => item.providerId === 'password'))
}

export function hasGoogleProvider(user) {
  return Boolean(user?.providerData?.some((item) => item.providerId === GoogleAuthProvider.PROVIDER_ID))
}

export function passwordReauthRequired(user) {
  return Boolean(user && hasPasswordProvider(user) && loginIsStale(user))
}

export async function reauthenticateForDelete(user, password) {
  if (!user) throw new Error('Sign in first.')

  if (passwordReauthRequired(user)) {
    if (!password) throw new Error('Enter your password to delete your account.')
    if (!user.email) throw new Error('This account has no email to verify.')
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
    return
  }

  if (loginIsStale(user) && hasGoogleProvider(user)) {
    await reauthenticateWithPopup(user, googleProvider)
  }
}

export async function deleteOwnAccount(password) {
  const user = auth.currentUser
  if (!user) throw new Error('Sign in first.')
  await reauthenticateForDelete(user, password)
  const run = httpsCallable(functions, 'deleteOwnAccount')
  try {
    await run()
  } catch (err) {
    const message = String(err?.message || '')
      .replace(/^Firebase:\s*/i, '')
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim()
    throw new Error(message || 'Couldn’t delete your account.')
  }
}
