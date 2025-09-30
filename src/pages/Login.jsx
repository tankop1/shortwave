import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomButton from "../components/CustomButton.jsx";
import { signInWithEmail } from "../lib/auth";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  return (
    <main>
      <section
        className="hero"
        style={{
          minHeight: "calc(100vh - 72px)",
          display: "grid",
          placeItems: "center",
          padding: 0,
        }}
      >
        <div className="container" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              transform: "translateY(-50px)",
            }}
          >
            <form
              style={{
                width: "min(560px, 92%)",
                display: "grid",
                gap: 14,
                padding: 40,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
              }}
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setError("");
                  setSubmitting(true);
                  await signInWithEmail(email, password);
                  navigate("/");
                } catch (err) {
                  setError(err?.message || "Failed to login");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <h1
                  className="page-title"
                  style={{ margin: 0, textAlign: "center" }}
                >
                  Welcome back!
                </h1>
                <p className="page-lead" style={{ marginTop: 6 }}>
                  Login to see your short films or upload a new one
                </p>
              </div>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="visually-hidden">Email</span>
                <input
                  className="search-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <div style={{ position: "relative" }}>
                <label className="visually-hidden" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="search-input"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  style={{ paddingRight: 52 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 6,
                    width: 44,
                    height: 44,
                    background: "transparent",
                    border: "none",
                    color: "var(--color-white)",
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? (
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
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.62-1.45 1.6-2.82 2.82-4.02" />
                      <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
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
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <div
                  style={{
                    color: "#ffb4b4",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  {error}
                </div>
              )}
              <CustomButton
                className="btn btn--light"
                type="submit"
                disabled={submitting}
                style={{
                  justifySelf: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  {submitting ? "Logging in…" : "Login"}
                  <span
                    aria-hidden="true"
                    style={{ marginLeft: 8, display: "inline-flex" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </span>
              </CustomButton>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
