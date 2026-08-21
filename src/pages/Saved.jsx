import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import FilmRow from '../components/FilmRow'
import Icon from '../components/Icon'
import { FilmGridSkeleton } from '../components/Skeleton'

export default function Saved() {
  const { byId, onOpen, profile, catalogLoading, libraryLoading } = useOutletContext()
  const films = useMemo(
    () => (profile?.savedFilmIds || []).map(byId).filter(Boolean),
    [profile, byId],
  )
  const loading = catalogLoading || libraryLoading

  return (
    <main className="page" aria-busy={loading}>
      <div className="page-head page-head-sm">
        <h1>Your list</h1>
        {!loading && films.length > 0 && <p>Films you saved to watch later.</p>}
      </div>
      {loading ? (
        <section className="block">
          <FilmGridSkeleton />
        </section>
      ) : films.length > 0 ? (
        <FilmRow films={films} onOpen={onOpen} />
      ) : (
        <div className="empty-panel">
          <Icon name="clapper" className="empty-panel-graphic" />
          <p>Your watchlist is empty</p>
          <Link to="/" className="upload-solid">
            Browse Films
          </Link>
        </div>
      )}
    </main>
  )
}
