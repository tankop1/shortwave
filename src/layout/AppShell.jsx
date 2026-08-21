import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import Sidebar from '../components/Sidebar'
import Player from '../components/Player'
import UploadModal from '../components/UploadModal'
import AuthModal from '../components/AuthModal'
import OnboardingModal from '../components/OnboardingModal'
import ProfileModal from '../components/ProfileModal'
import { useAuth } from '../auth/AuthContext'
import { db } from '../firebase'
import { PUBLIC_PATHS, decorateFilm, isCatalogVisible } from '../data'

function sortByCreated(a, b) {
  const av = a.createdAt?.toMillis?.() || 0
  const bv = b.createdAt?.toMillis?.() || 0
  return bv - av
}

function docsToFilms(snap, uid) {
  return snap.docs.map((item) => decorateFilm({ id: item.id, ...item.data() }, uid))
}

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, loading, needsOnboarding } = useAuth()
  const [authMode, setAuthMode] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editFilm, setEditFilm] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [catalogRaw, setCatalogRaw] = useState([])
  const [catalogReady, setCatalogReady] = useState(false)
  const [myRaw, setMyRaw] = useState([])
  const [myReady, setMyReady] = useState(false)
  const [crewRaw, setCrewRaw] = useState([])
  const [crewReady, setCrewReady] = useState(false)

  const uid = user?.uid || null

  useEffect(() => {
    const q = query(collection(db, 'films'), where('status', '==', 'published'))
    return onSnapshot(
      q,
      (snap) => {
        setCatalogRaw(docsToFilms(snap, uid))
        setCatalogReady(true)
      },
      () => {
        setCatalogRaw([])
        setCatalogReady(true)
      },
    )
  }, [uid])

  useEffect(() => {
    if (!uid) {
      setMyRaw([])
      setCrewRaw([])
      setMyReady(true)
      setCrewReady(true)
      return undefined
    }
    setMyReady(false)
    setCrewReady(false)
    const mine = query(collection(db, 'films'), where('ownerId', '==', uid))
    const crewed = query(collection(db, 'films'), where('crewUids', 'array-contains', uid))
    const unsubMine = onSnapshot(
      mine,
      (snap) => {
        setMyRaw(docsToFilms(snap, uid))
        setMyReady(true)
      },
      () => {
        setMyRaw([])
        setMyReady(true)
      },
    )
    const unsubCrew = onSnapshot(
      crewed,
      (snap) => {
        setCrewRaw(docsToFilms(snap, uid))
        setCrewReady(true)
      },
      () => {
        setCrewRaw([])
        setCrewReady(true)
      },
    )
    return () => {
      unsubMine()
      unsubCrew()
    }
  }, [uid])

  useEffect(() => {
    myRaw.forEach((film) => {
      const lift = film.embargoUntil?.toDate?.()
      if (film.status === 'embargoed' && lift && lift <= new Date()) {
        updateDoc(doc(db, 'films', film.id), { status: 'published', visibility: 'public' }).catch(() => {})
      }
    })
  }, [myRaw])

  useEffect(() => {
    if (loading) return
    if (!user && !PUBLIC_PATHS.includes(location.pathname)) {
      navigate('/', { replace: true })
      setAuthMode('signup')
    }
  }, [user, loading, location.pathname, navigate])

  const catalog = useMemo(
    () => catalogRaw.filter(isCatalogVisible).sort(sortByCreated),
    [catalogRaw],
  )
  const myFilms = useMemo(() => [...myRaw].sort(sortByCreated), [myRaw])

  const byId = useCallback(
    (id) => {
      const pool = [...catalogRaw, ...myRaw, ...crewRaw]
      return pool.find((film) => film.id === id) || null
    },
    [catalogRaw, myRaw, crewRaw],
  )

  const activeFilm = activeId ? byId(activeId) : null

  const pendingCredits = useMemo(() => {
    if (!uid) return []
    return crewRaw.filter((film) => {
      if (film.ownerId === uid) return false
      return (film.crew || []).some((member) => member.userId === uid && member.state === 'pending')
    })
  }, [crewRaw, uid])

  function openAuth(mode) {
    setAuthMode(mode)
  }

  function openUpload(film = null) {
    if (!user) {
      setAuthMode('signup')
      return
    }
    if (needsOnboarding) return
    setActiveId(null)
    setEditFilm(film)
    setUploadOpen(true)
  }

  function requireAccount(event) {
    if (user && !needsOnboarding) return
    event.preventDefault()
    if (!user) setAuthMode('signup')
  }

  return (
    <div className="app">
      <Sidebar
        onUpload={() => openUpload()}
        onSignup={() => openAuth('signup')}
        onLogin={() => openAuth('login')}
        onProtectedNav={requireAccount}
        onEditProfile={() => setProfileOpen(true)}
      />

      <div className="shell">
        <Outlet
          context={{
            films: catalog,
            catalogLoading: !catalogReady,
            myFilms,
            libraryLoading: loading || Boolean(uid && (!myReady || !crewReady)),
            pendingCredits,
            byId,
            onOpen: setActiveId,
            onUpload: () => openUpload(),
            onEdit: (film) => openUpload(film),
            user,
            profile,
          }}
        />
      </div>

      {activeFilm && <Player film={activeFilm} onClose={() => setActiveId(null)} />}
      {uploadOpen && !needsOnboarding && (
        <UploadModal
          film={editFilm}
          onClose={() => {
            setUploadOpen(false)
            setEditFilm(null)
          }}
        />
      )}
      {authMode && !user && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitch={setAuthMode}
        />
      )}
      {profileOpen && !needsOnboarding && <ProfileModal onClose={() => setProfileOpen(false)} />}
      {needsOnboarding && <OnboardingModal />}
    </div>
  )
}
