import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import Sidebar from '../components/Sidebar'
import MobileTopbar from '../components/MobileTopbar'
import Player from '../components/Player'
import UploadModal from '../components/UploadModal'
import AuthModal from '../components/AuthModal'
import OnboardingModal from '../components/OnboardingModal'
import ProfileModal from '../components/ProfileModal'
import SettingsModal from '../components/SettingsModal'
import DebugModal from '../components/DebugModal'
import { useAuth } from '../auth/AuthContext'
import { db } from '../firebase'
import { decorateFilm, isCatalogVisible, isPortfolioPublicPath, isPublicPath } from '../data'
import { filmIdFromSearch, wantsSignup } from '../lib/share'
import { parseVideoUrl } from '../lib/video'

function sortByCreated(a, b) {
  const av = a.createdAt?.toMillis?.() || 0
  const bv = b.createdAt?.toMillis?.() || 0
  return bv - av
}

function docsToFilms(snap, uid) {
  return snap.docs.map((item) => decorateFilm({ id: item.id, ...item.data() }, uid))
}

function featuredLookupKey(value) {
  if (value == null || value === '') return null
  if (typeof value === 'object') {
    if (typeof value.videoId === 'string' && value.videoId.trim()) return value.videoId.trim()
    if (typeof value.id === 'string' && value.id) return value.id
    return null
  }
  const raw = String(value).trim()
  if (!raw) return null
  return parseVideoUrl(raw)?.id || raw
}

function filmMatchesFeatured(film, key) {
  if (!key || !film) return false
  return String(film.videoId || '') === String(key) || film.id === key
}

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, loading, needsOnboarding } = useAuth()
  const [authMode, setAuthMode] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [debugOpen, setDebugOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editFilm, setEditFilm] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [catalogRaw, setCatalogRaw] = useState([])
  const [catalogReady, setCatalogReady] = useState(false)
  const [myRaw, setMyRaw] = useState([])
  const [myReady, setMyReady] = useState(false)
  const [crewRaw, setCrewRaw] = useState([])
  const [crewReady, setCrewReady] = useState(false)
  const [linkedFilm, setLinkedFilm] = useState(null)
  const [featuredKey, setFeaturedKey] = useState(null)
  const [featuredReady, setFeaturedReady] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  const uid = user?.uid || null
  const filmParam = filmIdFromSearch(location.search)
  const signupParam = wantsSignup(location.search)
  const bare = isPortfolioPublicPath(location.pathname)

  useEffect(() => {
    return onSnapshot(
      doc(db, 'admin', 'featuredFilmControls'),
      (snap) => {
        const value = snap.exists() ? snap.data()?.weeklyFeaturedFilm : null
        setFeaturedKey(featuredLookupKey(value))
        setFeaturedReady(true)
      },
      () => {
        setFeaturedKey(null)
        setFeaturedReady(true)
      },
    )
  }, [])

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
    if (!user && !isPublicPath(location.pathname)) {
      navigate(filmParam ? `/?film=${encodeURIComponent(filmParam)}` : '/', { replace: true })
      setAuthMode('signup')
    }
  }, [user, loading, location.pathname, navigate, filmParam])

  useEffect(() => {
    if (loading || !signupParam) return
    if (!user) setAuthMode('signup')
    const params = new URLSearchParams(location.search)
    params.delete('signup')
    const search = params.toString()
    navigate(
      { pathname: '/', search: search ? `?${search}` : '' },
      { replace: true },
    )
  }, [loading, signupParam, user, location.search, navigate])

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    function onChange() {
      if (!mq.matches) setNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!navOpen) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [navOpen])

  useEffect(() => {
    if (!navOpen) return
    document.getElementById('mobile-nav')?.focus()
  }, [navOpen])

  const catalog = useMemo(
    () => catalogRaw.filter(isCatalogVisible).sort(sortByCreated),
    [catalogRaw],
  )
  const myFilms = useMemo(() => [...myRaw].sort(sortByCreated), [myRaw])
  const featuredFilm = useMemo(() => {
    if (featuredKey) {
      const match = [...catalogRaw, ...myRaw, ...crewRaw].find((film) =>
        filmMatchesFeatured(film, featuredKey),
      )
      if (match) return match
    }
    return catalog[0] || null
  }, [featuredKey, catalogRaw, myRaw, crewRaw, catalog])

  const byId = useCallback(
    (id) => {
      const pool = [...catalogRaw, ...myRaw, ...crewRaw, linkedFilm].filter(Boolean)
      return pool.find((film) => film.id === id) || null
    },
    [catalogRaw, myRaw, crewRaw, linkedFilm],
  )

  const activeFilm = activeId ? byId(activeId) : null

  useEffect(() => {
    if (filmParam) setActiveId(filmParam)
  }, [filmParam])

  useEffect(() => {
    if (!activeId) {
      setLinkedFilm(null)
      return undefined
    }
    if (catalogRaw.some((film) => film.id === activeId) || myRaw.some((film) => film.id === activeId) || crewRaw.some((film) => film.id === activeId)) {
      setLinkedFilm(null)
      return undefined
    }
    if (!catalogReady) return undefined

    let cancelled = false
    getDoc(doc(db, 'films', activeId))
      .then((snap) => {
        if (cancelled) return
        if (!snap.exists()) {
          setLinkedFilm(null)
          return
        }
        setLinkedFilm(decorateFilm({ id: snap.id, ...snap.data() }, uid))
      })
      .catch(() => {
        if (!cancelled) setLinkedFilm(null)
      })
    return () => {
      cancelled = true
    }
  }, [activeId, catalogRaw, myRaw, crewRaw, catalogReady, uid])

  const pendingCredits = useMemo(() => {
    if (!uid) return []
    return crewRaw.filter((film) => {
      if (film.ownerId === uid) return false
      return (film.crew || []).some((member) => member.userId === uid && member.state === 'pending')
    })
  }, [crewRaw, uid])

  const acceptedCredits = useMemo(() => {
    if (!uid) return []
    return crewRaw.filter((film) => {
      if (film.ownerId === uid) return false
      return (film.crew || []).some((member) => member.userId === uid && member.state === 'accepted')
    })
  }, [crewRaw, uid])

  function closePlayer() {
    setActiveId(null)
    if (!filmParam) return
    const params = new URLSearchParams(location.search)
    params.delete('film')
    const search = params.toString()
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true },
    )
  }

  function openAuth(mode) {
    setAuthMode(mode)
  }

  function openUpload(film = null) {
    if (!user) {
      setAuthMode('signup')
      return
    }
    if (needsOnboarding) return
    closePlayer()
    setEditFilm(film)
    setUploadOpen(true)
  }

  function requireAccount(event) {
    if (user && !needsOnboarding) return
    event.preventDefault()
    if (!user) setAuthMode('signup')
  }

  return (
    <div className={bare ? 'app is-bare' : 'app'}>
      {!bare && <MobileTopbar open={navOpen} onToggle={() => setNavOpen((open) => !open)} />}
      {!bare && navOpen && (
        <button
          type="button"
          className="nav-overlay"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      )}
      {!bare && (
        <Sidebar
          open={navOpen}
          onClose={() => setNavOpen(false)}
          onUpload={() => openUpload()}
          onSignup={() => openAuth('signup')}
          onLogin={() => openAuth('login')}
          onProtectedNav={requireAccount}
          onEditProfile={() => setProfileOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenDebug={() => setDebugOpen(true)}
        />
      )}

      <div className={bare ? 'shell shell-bare' : 'shell'}>
        <Outlet
          context={{
            films: catalog,
            catalogLoading: !catalogReady,
            featuredFilm,
            featuredLoading: !featuredReady,
            myFilms,
            libraryLoading: loading || Boolean(uid && (!myReady || !crewReady)),
            pendingCredits,
            acceptedCredits,
            byId,
            onOpen: setActiveId,
            onUpload: () => openUpload(),
            onEdit: (film) => openUpload(film),
            onSignup: () => openAuth('signup'),
            onLogin: () => openAuth('login'),
            user,
            profile,
          }}
        />
      </div>

      {activeFilm && <Player film={activeFilm} onClose={closePlayer} onSignup={() => openAuth('signup')} />}
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
      {profileOpen && !needsOnboarding && !bare && <ProfileModal onClose={() => setProfileOpen(false)} />}
      {settingsOpen && !needsOnboarding && !bare && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {debugOpen && !needsOnboarding && !bare && <DebugModal onClose={() => setDebugOpen(false)} />}
      {needsOnboarding && !bare && <OnboardingModal />}
    </div>
  )
}
