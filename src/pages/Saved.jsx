import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import FilmRow from '../components/FilmRow'
import Icon from '../components/Icon'
import { FilmGridSkeleton } from '../components/Skeleton'
import emptyWatchlistArt from '../assets/illustrations/Empty Watchlist Illustration.png'

export default function Saved() {
  const { byId, onOpen, profile, catalogLoading, libraryLoading } = useOutletContext()
  const films = useMemo(
    () => (profile?.savedFilmIds || []).map(byId).filter(Boolean),
    [profile, byId],
  )
  const loading = catalogLoading || libraryLoading

  return (
    <main className="page list-page" aria-busy={loading}>
      {loading ? (
        <section className="block">
          <FilmGridSkeleton />
        </section>
      ) : films.length > 0 ? (
        <FilmRow films={films} onOpen={onOpen} />
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
