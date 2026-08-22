import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import PortfolioSite from '../components/portfolio/PortfolioSite'
import SiteLoader from '../components/portfolio/SiteLoader'
import Icon from '../components/Icon'
import { db } from '../firebase'
import { loadPortfolioFilms, normalizePortfolio, normalizeSlug } from '../lib/portfolio'
import { siteThemeStyle } from '../lib/siteStyle'

export default function PublicPortfolio() {
  const { slug: rawSlug } = useParams()
  const { onOpen } = useOutletContext()
  const slug = normalizeSlug(rawSlug)
  const [status, setStatus] = useState('loading')
  const [ownerId, setOwnerId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [films, setFilms] = useState([])

  const portfolio = useMemo(() => normalizePortfolio(profile?.portfolio), [profile])

  useEffect(() => {
    let cancelled = false
    let unsub = () => {}

    async function load() {
      if (!slug) {
        setStatus('missing')
        return
      }
      setStatus('loading')
      try {
        const snap = await getDoc(doc(db, 'portfolioSlugs', slug))
        if (cancelled) return
        if (!snap.exists()) {
          setStatus('missing')
          return
        }
        const uid = snap.data().uid
        setOwnerId(uid)
        unsub = onSnapshot(
          doc(db, 'users', uid),
          (userSnap) => {
            if (!userSnap.exists()) {
              setStatus('missing')
              setProfile(null)
              return
            }
            setProfile({ id: userSnap.id, ...userSnap.data() })
            setStatus('ready')
          },
          () => {
            if (!cancelled) setStatus('missing')
          },
        )
      } catch {
        if (!cancelled) setStatus('missing')
      }
    }

    load()
    return () => {
      cancelled = true
      unsub()
    }
  }, [slug])

  const filmKey = portfolio.filmIds.join(',')

  useEffect(() => {
    let cancelled = false
    if (status !== 'ready') return undefined
    loadPortfolioFilms(filmKey ? filmKey.split(',') : []).then((next) => {
      if (!cancelled) setFilms(next)
    })
    return () => {
      cancelled = true
    }
  }, [status, filmKey])

  useEffect(() => {
    const prev = document.title
    if (profile?.name) document.title = `${profile.name} — Portfolio`
    return () => {
      document.title = prev
    }
  }, [profile?.name])

  if (status === 'loading') {
    return (
      <main className="psite-page" aria-busy="true">
        <SiteLoader label="Loading portfolio…" />
      </main>
    )
  }

  if (status === 'missing' || !profile) {
    return (
      <main className="psite-page">
        <div className="empty-panel">
          <Icon name="clapper" className="empty-panel-graphic" />
          <p>This portfolio isn’t live</p>
          <Link to="/" className="upload-solid">
            Go to Shortwave
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="psite-page" style={siteThemeStyle(portfolio)}>
      <PortfolioSite
        name={profile.name}
        portfolio={portfolio}
        films={films}
        ownerId={ownerId}
        onOpenFilm={onOpen}
      />
    </main>
  )
}
