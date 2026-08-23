import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next)
      if (!next) {
        setProfile(null)
        setLoading(false)
      } else {
        setProfile(undefined)
        setLoading(true)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return undefined
    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      () => {
        setProfile(null)
        setLoading(false)
      },
    )
    return unsub
  }, [user])

  const value = useMemo(() => {
    async function signUpEmail(email, password) {
      await createUserWithEmailAndPassword(auth, email, password)
    }

    async function signInEmail(email, password) {
      await signInWithEmailAndPassword(auth, email, password)
    }

    async function signInGoogle() {
      await signInWithPopup(auth, googleProvider)
    }

    async function signOut() {
      await firebaseSignOut(auth)
    }

    async function saveProfile(data) {
      if (!user) return
      await setDoc(
        doc(db, 'users', user.uid),
        {
          ...data,
          email: data.email || user.email || null,
          emailLower: (data.email || user.email || '').trim().toLowerCase(),
          nameLower: (data.name || '').trim().toLowerCase(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    }

    return {
      user,
      profile,
      loading,
      needsOnboarding: Boolean(user && !loading && profile !== undefined && !profile?.onboarded),
      signUpEmail,
      signInEmail,
      signInGoogle,
      signOut,
      saveProfile,
    }
  }, [user, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function authErrorMessage(error) {
  const code = error?.code || ''
  if (code.includes('email-already-in-use')) return 'That email already has an account.'
  if (code.includes('invalid-email')) return 'Enter a valid email.'
  if (code.includes('weak-password')) return 'Use at least 6 characters.'
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Email or password is incorrect.'
  }
  if (code.includes('popup-closed')) return 'Google sign-in was closed.'
  if (code.includes('requires-recent-login')) return 'Enter your password again to continue.'
  return error?.message || 'Something went wrong. Try again.'
}
