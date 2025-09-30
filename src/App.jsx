import "./App.css";
function App() {
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
            {Array.from({ length: 12 }).map((_, i) => (
              <div className="card" key={i} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
