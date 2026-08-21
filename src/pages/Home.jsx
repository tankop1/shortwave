import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import Icon from '../components/Icon'
import FilmRow from '../components/FilmRow'

export default function Home() {
  const { films, byId, onOpen, profile, user } = useOutletContext()
  const featured = films[0] || null
  const week = films.slice(0, 4)

  const crew = useMemo(() => {
    if (!user) return []
    return films.filter(
      (film) => film.ownerId !== user.uid && (film.crewUids || []).includes(user.uid),
    )
  }, [films, user])

  const saved = useMemo(() => {
    const ids = profile?.savedFilmIds || []
    return ids.map(byId).filter(Boolean)
  }, [profile, byId])

  if (!featured) {
    return (
      <main className="home">
        <div className="empty-hero">
          <h1>Nothing screening yet</h1>
          <p>When someone publishes a film, it’ll land here.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="home">
      <button type="button" className="hero" onClick={() => onOpen(featured.id)}>
        <img src={featured.poster} alt="" className="hero-img" />
        <div className="hero-shade" />
        <span className="hero-live">Featured this week</span>
        <div className="hero-copy">
          <h1>{featured.title}</h1>
          <p>{featured.logline}</p>
          <div className="hero-row">
            <span className="hero-watch">
              <Icon name="play" className="icon-dark" />
              Watch
            </span>
            <span className="hero-meta">
              {[featured.maker, featured.genre].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
      </button>

      {week.length > 0 && (
        <FilmRow title="New this week" hint={`${week.length} titles`} films={week} onOpen={onOpen} />
      )}
      {crew.length > 0 && (
        <FilmRow title="From your crew" hint={`${crew.length} shared`} films={crew} onOpen={onOpen} />
      )}
      {saved.length > 0 && (
        <FilmRow title="Your list" hint="Saved" films={saved} onOpen={onOpen} />
      )}
    </main>
  )
}
