import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

function Film() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [film, setFilm] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const getYouTubeId = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/");
      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1])
        return parts[embedIndex + 1];
      return "";
    } catch {
      return "";
    }
  };

  const getEmbedUrl = (url) => {
    const vid = getYouTubeId(url || "");
    if (!vid) return "";
    return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`;
  };

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        const filmDoc = await getDoc(doc(db, "films", id));
        if (filmDoc.exists()) {
          const filmData = { id: filmDoc.id, ...filmDoc.data() };
          setFilm(filmData);

          // Fetch author profile if ownerUid exists
          if (filmData.ownerUid) {
            try {
              const authorDoc = await getDoc(
                doc(db, "users", filmData.ownerUid)
              );
              if (authorDoc.exists()) {
                setAuthor({ id: authorDoc.id, ...authorDoc.data() });
              }
            } catch (authorError) {
              console.error("Error fetching author:", authorError);
            }
          }
        } else {
          // Film not found, redirect to home
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching film:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFilm();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="film-page">
        <div className="film-container">
          <div className="film-player-placeholder">
            <div className="loading-placeholder"></div>
          </div>
          <div className="film-details">
            <div className="film-title-placeholder"></div>
            <div className="film-description-placeholder"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!film) {
    return null;
  }

  return (
    <div className="film-page">
      <div className="film-container">
        <div className="film-player">
          {isPlaying && getEmbedUrl(film.youtubeUrl) ? (
            <iframe
              title={film.title}
              src={getEmbedUrl(film.youtubeUrl)}
              className="film-player-placeholder"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          ) : (
            <div className="film-player-placeholder">
              <img
                src={film.thumbnailUrl}
                alt={film.title}
                className="film-thumbnail"
              />
              <div className="play-overlay">
                <button
                  className="play-button"
                  aria-label="Play video"
                  onClick={() => setIsPlaying(true)}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="film-details">
          <div className="film-info">
            <h1 className="film-title">{film.title}</h1>
            {film.logline && <p className="film-description">{film.logline}</p>}
          </div>
          <div className="film-author">
            {author?.photoURL ? (
              <img
                src={author.photoURL}
                alt={author.name || author.email || "Author"}
                className="author-avatar"
              />
            ) : (
              <div className="author-avatar author-avatar-placeholder">
                {(author?.name || author?.email || "A").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Film;
