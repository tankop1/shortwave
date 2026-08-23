import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import Icon from '../components/Icon'
import FilmRow from '../components/FilmRow'
import { HomeSkeleton } from '../components/Skeleton'
import { filmRating } from '../lib/reviews'

export default function Home() {
  const { films, catalogLoading, featuredFilm, featuredLoading, byId, onOpen, onUpload, profile, user } =
    useOutletContext()
  const featured = featuredFilm || films[0] || null

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

  const bestRated = useMemo(
    () =>
      films
        .map((film) => ({ film, ...filmRating(film) }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.average - a.average || b.count - a.count)
        .map((item) => item.film),
    [films],
  )

  if (catalogLoading || featuredLoading) {
    return (
      <main className="home" aria-busy="true">
        <HomeSkeleton />
      </main>
    )
  }

  if (!featured) {
    return (
      <main className="home">
        <div className="empty-panel">
          <Icon name="clapper" className="empty-panel-graphic" />
          <p>Nothing screening yet</p>
          <button type="button" className="upload-solid" onClick={onUpload}>
            <Icon name="plus" className="icon-dark" />
            Upload a film
          </button>
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

      {films.length > 0 && (
        <FilmRow
          scroll
          title="New this week"
          hint={`${films.length} titles`}
          films={films}
          onOpen={onOpen}
        />
      )}
      {bestRated.length > 0 && (
        <FilmRow
          scroll
          title="Best rated"
          hint={`${bestRated.length} titles`}
          films={bestRated}
          onOpen={onOpen}
          tag="rating"
        />
      )}
      {crew.length > 0 && (
        <FilmRow
          scroll
          title="From your crew"
          hint={`${crew.length} shared`}
          films={crew}
          onOpen={onOpen}
        />
      )}
      {saved.length > 0 && (
        <FilmRow scroll title="Your list" hint="Saved" films={saved} onOpen={onOpen} />
      )}
    </main>
  )
}
