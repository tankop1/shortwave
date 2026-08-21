import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { DURATIONS, GENRES, YEARS, searchSuggestions } from '../data'

export default function SearchBar({
  query,
  setQuery,
  genre,
  setGenre,
  durations,
  setDurations,
  years,
  setYears,
  films,
}) {
  const rootRef = useRef(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [active, setActive] = useState(0)

  const suggestions = useMemo(() => searchSuggestions(query, films), [query, films])
  const showSuggest = suggestOpen && !filtersOpen && suggestions.length > 0
  const filtersOn = Boolean(genre || durations.length || years.length)
  const highlight = suggestions.length ? Math.min(active, suggestions.length - 1) : 0

  function toggle(list, value, setter) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  function applySuggestion(item) {
    if (item.kind === 'Genre') {
      setGenre(item.label)
      setQuery('')
    } else {
      setQuery(item.label)
    }
    setSuggestOpen(false)
  }

  useEffect(() => {
    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) {
        setFiltersOpen(false)
        setSuggestOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  return (
    <div className="search" ref={rootRef}>
      <Icon name="search" />
      <input
        value={query}
        autoFocus
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
          setSuggestOpen(true)
          setFiltersOpen(false)
        }}
        onFocus={() => {
          if (suggestions.length) setSuggestOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && showSuggest) {
            event.preventDefault()
            setActive((i) => (i + 1) % suggestions.length)
          } else if (event.key === 'ArrowUp' && showSuggest) {
            event.preventDefault()
            setActive((i) => (i - 1 + suggestions.length) % suggestions.length)
          } else if (event.key === 'Enter' && showSuggest) {
            event.preventDefault()
            applySuggestion(suggestions[highlight])
          } else if (event.key === 'Escape') {
            setSuggestOpen(false)
            setFiltersOpen(false)
          }
        }}
        placeholder="Search films, people, roles…"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSuggest}
        aria-controls="search-suggest"
      />

      {showSuggest && (
        <div className="search-suggest" id="search-suggest" role="listbox">
          {suggestions.map((item, index) => (
            <button
              key={`${item.kind}-${item.label}`}
              type="button"
              role="option"
              aria-selected={index === highlight}
              className={`search-suggest-item${index === highlight ? ' is-on' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => applySuggestion(item)}
            >
              <span className="search-suggest-kind">{item.kind}</span>
              <span className="search-suggest-label">{item.label}</span>
              <span className="search-suggest-hint">{item.hint}</span>
            </button>
          ))}
        </div>
      )}

      <div className="search-filter">
        <button
          type="button"
          className={`filter-btn${filtersOn ? ' is-on' : ''}`}
          aria-label="Filter"
          aria-expanded={filtersOpen}
          onClick={() => {
            setFiltersOpen((open) => !open)
            setSuggestOpen(false)
          }}
        >
          <Icon name="filter" />
        </button>
        {filtersOpen && (
          <div className="filter-menu" role="menu">
            <FilterChips
              title="Genre"
              items={GENRES}
              selected={genre ? [genre] : []}
              onToggle={(value) => setGenre(genre === value ? null : value)}
            />
            <FilterChips
              title="Duration"
              items={DURATIONS}
              selected={durations}
              onToggle={(value) => toggle(durations, value, setDurations)}
            />
            <FilterChips
              title="Year"
              items={YEARS}
              selected={years}
              onToggle={(value) => toggle(years, value, setYears)}
            />
            {filtersOn && (
              <button
                type="button"
                className="filter-clear"
                onClick={() => {
                  setGenre(null)
                  setDurations([])
                  setYears([])
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChips({ title, items, selected, onToggle }) {
  return (
    <div className="filter-group">
      <div className="filter-label">{title}</div>
      <div className="chips">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className={`chip${selected.includes(item) ? ' is-on' : ''}`}
            onClick={() => onToggle(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
