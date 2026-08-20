import { useEffect } from "react";
import Icon from "./Icon";

export default function Player({ film, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="player-backdrop" onClick={onClose} role="presentation">
      <div
        className="player"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="player-stage">
          <img src={film.poster} alt="" className="player-still" />
          <div className="player-stage-fade" />
          <button type="button" className="player-watch">
            <Icon name="play" className="icon-dark" />
            Play
          </button>
          <button
            type="button"
            className="player-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="player-body">
          <div className="player-top">
            <div>
              <div className="player-kicker">
                {film.genre} · {film.dur} · {film.year}
              </div>
              <h2 id="player-title" className="player-title">
                {film.title}
              </h2>
              <div className="player-by">{film.maker}</div>
            </div>
            <div className="player-actions">
              <button type="button" className="ghost-btn">
                <Icon name="heart" />
                Save
              </button>
              <button type="button" className="ghost-btn">
                Share
              </button>
            </div>
          </div>
          <p className="player-logline">{film.logline}</p>
          <div className="credits-label">Cast &amp; crew</div>
          <div className="credits">
            {film.credits.map((credit) => (
              <div
                key={`${credit.name}-${credit.role}`}
                className="credit-chip"
              >
                <span
                  className="credit-avatar"
                  style={{ background: credit.stripe }}
                />
                <span>{credit.name}</span>
                <span className="credit-role">{credit.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
