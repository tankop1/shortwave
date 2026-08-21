import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import FilmCard from '../components/FilmCard'
import SearchBar from '../components/SearchBar'
import { FilmGridSkeleton } from '../components/Skeleton'
import { filmMatches } from '../data'

export default function Search() {
  const { films, catalogLoading, onOpen } = useOutletContext()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState(null)
  const [durations, setDurations] = useState([])
  const [years, setYears] = useState([])

  const results = films.filter((film) => filmMatches(film, query, genre, { durations, years }))

  return (
    <main className="page search-page" aria-busy={catalogLoading}>
      <SearchBar
        query={query}
        setQuery={setQuery}
        genre={genre}
        setGenre={setGenre}
        durations={durations}
        setDurations={setDurations}
        years={years}
        setYears={setYears}
        films={films}
      />
      {catalogLoading ? (
        <>
          <div className="skeleton skeleton-text skeleton-results-meta" aria-hidden="true" />
          <FilmGridSkeleton count={8} />
        </>
      ) : (
        <>
          <p className="results-meta">
            {results.length} {results.length === 1 ? 'film' : 'films'}
            {query.trim() ? ` for “${query.trim()}”` : ''}
          </p>
          {results.length === 0 ? (
            <p className="empty">{films.length === 0 ? 'No films in the catalog yet.' : 'Nothing matches that mix.'}</p>
          ) : (
            <div className="feature-grid">
              {results.map((film) => (
                <FilmCard key={film.id} film={film} onOpen={onOpen} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
