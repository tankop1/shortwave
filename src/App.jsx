import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { db } from "./lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

function App() {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [filteredFilms, setFilteredFilms] = useState([]);
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

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const filtered = films.filter(
        (film) =>
          film.title.toLowerCase().includes(value.toLowerCase()) ||
          film.logline?.toLowerCase().includes(value.toLowerCase()) ||
          film.tags?.some((tag) =>
            tag.toLowerCase().includes(value.toLowerCase())
          )
      );
      setFilteredFilms(filtered);
      setShowSearchMenu(true);
    } else {
      setFilteredFilms([]);
      setShowSearchMenu(false);
    }
  };

  const selectSearchResult = (film) => {
    navigate(`/film/${film.id}`);
    setSearchQuery("");
    setShowSearchMenu(false);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      // For now, just show the search results in the menu
      // In a real app, you might want to navigate to a search results page
      setShowSearchMenu(true);
    }
  };

  // Filter films based on search query
  const displayFilms = searchQuery.trim().length > 0 ? filteredFilms : films;
  const isSearching = searchQuery.trim().length > 0;

  // Create grid items
  const gridItems = [];

  if (isSearching && displayFilms.length === 0) {
    // Show no matches message when searching with no results
    gridItems.push(
      <div
        key="no-matches"
        style={{
          gridColumn: "1 / -1",
          textAlign: "center",
          padding: "60px 20px",
          color: "rgba(255, 255, 255, 0.6)",
          fontFamily: "var(--font-sans)",
          fontSize: "18px",
        }}
      >
        No films found matching "{searchQuery}"
      </div>
    );
  } else if (isSearching) {
    // When searching, only show matching films (no placeholders)
    displayFilms.forEach((film) => {
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
    });
  } else {
    // Normal view: show up to 12 items (films + placeholders)
    for (let i = 0; i < 12; i++) {
      if (i < displayFilms.length) {
        // Show film thumbnail
        const film = displayFilms[i];
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
              <div className="search-field" style={{ position: "relative" }}>
                <label htmlFor="search" className="visually-hidden">
                  Search
                </label>
                <input
                  id="search"
                  className="search-input"
                  placeholder="Search for a short…"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) {
                      setShowSearchMenu(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow clicking on menu items
                    setTimeout(() => setShowSearchMenu(false), 150);
                  }}
                />
                <button
                  className="search-btn"
                  aria-label="Search"
                  onClick={handleSearchSubmit}
                >
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

                {showSearchMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 10,
                      boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
                      overflow: "hidden",
                      zIndex: 30,
                      maxHeight: 300,
                      overflowY: "auto",
                    }}
                  >
                    {filteredFilms.map((film, idx) => (
                      <button
                        key={film.id}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 16px",
                          background: "transparent",
                          color: "rgba(255,255,255,0.9)",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          borderBottom:
                            idx < filteredFilms.length - 1
                              ? "1px solid rgba(255,255,255,0.08)"
                              : "none",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "4px",
                        }}
                        onClick={() => selectSearchResult(film)}
                        onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {film.title}
                        </div>
                        {film.logline && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.6)",
                              lineHeight: 1.3,
                            }}
                          >
                            {film.logline}
                          </div>
                        )}
                      </button>
                    ))}
                    {(() => {
                      const value = searchQuery.trim();
                      const hasExactMatch = filteredFilms.some(
                        (film) =>
                          film.title.toLowerCase() === value.toLowerCase()
                      );
                      const shouldShowSearch =
                        value.length > 0 && !hasExactMatch;
                      if (!shouldShowSearch) return null;
                      return (
                        <button
                          key="__search__"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "12px 16px",
                            background: "transparent",
                            color: "rgba(255,255,255,0.9)",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                            borderTop:
                              filteredFilms.length > 0
                                ? "1px solid rgba(255,255,255,0.08)"
                                : "none",
                          }}
                          onClick={() => {
                            // Navigate to search results page or show all results
                            setShowSearchMenu(false);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {`Search for "${value}"`}
                        </button>
                      );
                    })()}
                  </div>
                )}
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
