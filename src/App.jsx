import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { db } from "./lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

function App() {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        const filmsQuery = query(
          collection(db, "films"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(filmsQuery);
        const filmsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFilms(filmsData);
      } catch (error) {
        console.error("Error fetching films:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilms();
  }, []);

  // Create array of 12 items: films first, then placeholders
  const gridItems = [];
  for (let i = 0; i < 12; i++) {
    if (i < films.length) {
      // Show film thumbnail
      const film = films[i];
      gridItems.push(
        <div
          className="card film-card"
          key={film.id}
          onClick={() => navigate(`/film/${film.id}`)}
        >
          <img
            src={film.thumbnailUrl}
            alt={film.title}
            style={{
              position: "absolute",
              top: "-20px",
              left: "-20px",
              width: "calc(100% + 40px)",
              height: "calc(100% + 40px)",
              objectFit: "cover",
              borderRadius: "22px",
              margin: 0,
              padding: 0,
              display: "block",
            }}
          />
        </div>
      );
    } else {
      // Show placeholder rectangle
      gridItems.push(<div className="card" key={`placeholder-${i}`} />);
    }
  }

  return (
    <div>
      <main>
        <section className="hero">
          <div className="container">
            <h1 className="hero-headline">
              All of the best short films in one convenient place
            </h1>
            <div className="search">
              <div className="search-field">
                <label htmlFor="search" className="visually-hidden">
                  Search
                </label>
                <input
                  id="search"
                  className="search-input"
                  placeholder="Search for a short…"
                />
                <button className="search-btn" aria-label="Search">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="container">
          <div className="grid">
            {loading
              ? // Show loading placeholders
                Array.from({ length: 12 }).map((_, i) => (
                  <div className="card" key={i} />
                ))
              : gridItems}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
