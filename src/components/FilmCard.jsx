import Icon from './Icon'

export default function FilmCard({ film, onOpen }) {
  return (
    <button type="button" className="shot" onClick={() => onOpen(film.id)}>
      <img src={film.poster} alt="" className="shot-img" />
      <div className="shot-shade" />
      <span className="shot-tag">{film.genre}</span>
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
