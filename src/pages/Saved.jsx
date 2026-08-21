import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import FilmRow from '../components/FilmRow'
import Icon from '../components/Icon'

export default function Saved() {
  const { byId, onOpen, profile } = useOutletContext()
  const films = useMemo(
    () => (profile?.savedFilmIds || []).map(byId).filter(Boolean),
    [profile, byId],
  )

  return (
    <main className="page">
      <div className="page-head page-head-sm">
        <h1>Your list</h1>
        {films.length > 0 && <p>Films you saved to watch later.</p>}
      </div>
      {films.length > 0 ? (
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
