import { Link, Outlet, useNavigate } from "react-router-dom";
import "../App.css";
import CustomButton from "../components/CustomButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useRef, useState } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);
  return (
    <div>
      <header className="site-header">
        <div className="container inner">
          <Link to="/" className="brand" aria-label="Shortwave home">
            <div className="brand-mark" aria-hidden>
              🤘
            </div>
            <div className="brand-name">Shortwave</div>
          </Link>
          {!loading && (
            <div className="header-actions">
              {user ? (
                <>
                  <CustomButton
                    className="btn btn--light"
                    onClick={() => navigate("/upload")}
                  >
                    Upload your film
                  </CustomButton>
                  <div style={{ position: "relative" }} ref={menuRef}>
                    <button
                      aria-label="Account menu"
                      onClick={() => setOpen((v) => !v)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.25)",
                        overflow: "hidden",
                        background: "transparent",
                        padding: 0,
                        lineHeight: 0,
                        cursor: "pointer",
                      }}
                      title={user?.displayName || user?.email}
                    >
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--color-white)",
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {(user?.displayName || user?.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </button>

                    {open && (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          marginTop: 8,
                          background: "#1a1a1a",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 10,
                          minWidth: 160,
                          boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
                          overflow: "hidden",
                          zIndex: 20,
                        }}
                      >
                        <button
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            background: "transparent",
                            color: "rgba(255,255,255,0.8)",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                          }}
                          onClick={() => {
                            setOpen(false);
                            navigate("/upload");
                          }}
                        >
                          Upload film
                        </button>
                        <div
                          style={{
                            height: 1,
                            background: "rgba(255,255,255,0.08)",
                          }}
                        />
                        <button
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            background: "transparent",
                            color: "rgba(255,255,255,0.8)",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                          }}
                          onClick={() => {
                            import("../lib/auth").then(({ logOut }) =>
                              logOut()
                            );
                            setOpen(false);
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <CustomButton
                    className="btn"
                    secondary
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </CustomButton>
                  <CustomButton
                    className="btn btn--light"
                    onClick={() => navigate("/signup")}
                  >
                    Sign Up
                  </CustomButton>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
