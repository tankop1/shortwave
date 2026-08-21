import Icon from './Icon'
import { filmRating, formatAverage } from '../lib/reviews'

export default function FilmCard({ film, onOpen, tag = 'genre' }) {
  const rating = filmRating(film)
  const label =
    tag === 'rating'
      ? rating.count
        ? `${formatAverage(rating.average)}★`
        : null
      : film.genre

  return (
    <button type="button" className="shot" onClick={() => onOpen(film.id)}>
      <img src={film.poster} alt="" className="shot-img" />
      <div className="shot-shade" />
      {label ? (
        <span className={`shot-tag${tag === 'rating' ? ' shot-tag-rating' : ''}`}>{label}</span>
      ) : null}
      <span className="shot-dur">{film.dur}</span>
      <div className="shot-copy">
        <div className="shot-title">{film.title}</div>
        <div className="shot-maker">{film.maker}</div>
        {film.yourRole && <span className="shot-role">You · {film.yourRole}</span>}
      </div>
      <span className="shot-play">
        <Icon name="play" className="icon-dark" />
        Watch
      </span>
    </button>
  )
}
