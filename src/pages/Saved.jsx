import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import FilmRow from '../components/FilmRow'
import FilmSort, { sortFilms } from '../components/FilmSort'
import Icon from '../components/Icon'
import { FilmGridSkeleton } from '../components/Skeleton'
import emptyWatchlistArt from '../assets/illustrations/Empty Watchlist Illustration.png'

export default function Saved() {
  const { byId, onOpen, profile, catalogLoading, libraryLoading } = useOutletContext()
  const [sort, setSort] = useState('new')
  const films = useMemo(
    () => (profile?.savedFilmIds || []).map(byId).filter(Boolean),
    [profile, byId],
  )
  const sortedFilms = useMemo(() => sortFilms(films, sort), [films, sort])
  const loading = catalogLoading || libraryLoading

  return (
    <main className="page list-page" aria-busy={loading}>
      {loading ? (
        <section className="block">
          <FilmGridSkeleton />
        </section>
      ) : films.length > 0 ? (
        <>
          <div className="projects-toolbar">
            <div className="projects-toolbar-meta">
              <p className="projects-count">
                {films.length} {films.length === 1 ? 'film' : 'films'}
              </p>
              <FilmSort value={sort} onChange={setSort} label="Sort list" />
            </div>
          </div>
          <FilmRow films={sortedFilms} onOpen={onOpen} />
        </>
      ) : (
        <div className="empty-panel">
          <img src={emptyWatchlistArt} alt="" className="empty-panel-art" />
          <p>Your watchlist is empty</p>
          <Link to="/" className="upload-solid">
            <Icon name="home" className="icon-dark" />
            Browse Films
          </Link>
        </div>
      )}
    </main>
  )
}
