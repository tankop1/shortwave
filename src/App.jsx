import { useCallback, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import FilmCard from './components/FilmCard'
import Player from './components/Player'
import Icon from './components/Icon'
import { FILMS, GENRES, MENU_ITEMS, decorateFilm } from './data'

function FilmRow({ title, hint, films, onOpen }) {
  return (
    <section className="block">
      <div className="block-head">
        <h2>{title}</h2>
        <span>{hint}</span>
      </div>
      {films.length === 0 ? (
        <p className="empty">Nothing matches that mix.</p>
      ) : (
        <div className="feature-grid">
          {films.map((film) => (
            <FilmCard key={film.id} film={film} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeId, setActiveId] = useState(null)

  const films = useMemo(() => FILMS.map(decorateFilm), [])
  const byId = useCallback((id) => films.find((film) => film.id === id), [films])

  const featured = byId('caliche')
  const matches = useCallback(
    (film) => {
      const hay = `${film.title} ${film.maker} ${film.genre}`.toLowerCase()
      const q = query.trim().toLowerCase()
      if (q && !hay.includes(q)) return false
      if (genre && film.genre !== genre) return false
      return true
    },
    [genre, query],
  )

  const week = ['pecan', 'redriver', 'tuesday', 'heat'].map(byId).filter(matches)
  const crew = ['greenbelt', 'sixmonths', 'lamar', 'kolache'].map(byId).filter(matches)
  const saved = ['lamar', 'heat', 'tuesday', 'sixmonths'].map(byId).filter(matches)
  const activeFilm = activeId ? byId(activeId) : null

  return (
    <div className="app">
      <Sidebar />

      <div className="shell">
        <header className="topbar">
          <div className="search">
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search films, people, roles…"
            />
            <div className="search-filter">
              <button
                type="button"
                className={`filter-btn${genre ? ' is-on' : ''}`}
                aria-label="Filter"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <Icon name="filter" />
              </button>
              {filtersOpen && (
                <div className="filter-menu" role="menu">
                  <button
                    type="button"
                    className={`filter-option${!genre ? ' is-on' : ''}`}
                    onClick={() => {
                      setGenre(null)
                      setFiltersOpen(false)
                    }}
                  >
                    All genres
                  </button>
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`filter-option${genre === g ? ' is-on' : ''}`}
                      onClick={() => {
                        setGenre(genre === g ? null : g)
                        setFiltersOpen(false)
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="topbar-user">
            <button
              type="button"
              className="avatar-ring"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              MR
            </button>
            {menuOpen && (
              <div className="menu" role="menu">
                {MENU_ITEMS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="home">
          <button type="button" className="hero" onClick={() => setActiveId(featured.id)}>
            <img src={featured.poster} alt="" className="hero-img" />
            <div className="hero-shade" />
            <span className="hero-live">Now screening</span>
            <div className="hero-copy">
              <h1>{featured.title}</h1>
              <p>{featured.logline}</p>
              <div className="hero-row">
                <span className="hero-watch">
                  <Icon name="play" className="icon-dark" />
                  Watch
                </span>
                <span className="hero-meta">
                  {featured.maker} · {featured.dur} · {featured.genre}
                </span>
              </div>
            </div>
          </button>

          <FilmRow title="New this week" hint="RTF ’27" films={week} onOpen={setActiveId} />
          <FilmRow title="From your crew" hint="9 shared credits" films={crew} onOpen={setActiveId} />
          <FilmRow title="Your list" hint="Saved" films={saved} onOpen={setActiveId} />
        </main>
      </div>

      {activeFilm && <Player film={activeFilm} onClose={() => setActiveId(null)} />}
    </div>
  )
}

export default App
