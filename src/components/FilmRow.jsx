import FilmCard from './FilmCard'

export default function FilmRow({ title, hint, films, onOpen, scroll = false }) {
  return (
    <section className={scroll ? 'block block-scroll' : 'block'}>
      {title && (
        <div className="block-head">
          <h2>{title}</h2>
          {hint && <span>{hint}</span>}
        </div>
      )}
      {films.length === 0 ? (
        <p className="empty">Nothing matches that mix.</p>
      ) : (
        <div className={scroll ? 'feature-row' : 'feature-grid'}>
          {films.map((film) => (
            <FilmCard key={film.id} film={film} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  )
}
