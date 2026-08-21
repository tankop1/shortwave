import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'
import { NAV, PUBLIC_PATHS, initialsFromName } from '../data'

export default function Sidebar({ onUpload, onSignup, onLogin, onProtectedNav }) {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const menuRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const loggedIn = Boolean(user && profile?.onboarded)

  useEffect(() => {
    function onPointer(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  const yearLine = [profile?.grade, profile?.major].filter(Boolean).join(' · ')

  return (
    <aside className="sidebar">
      <div className="brand">
        <Link to="/" className="brand-name">
          Shortwave
        </Link>
        <div className="brand-tag">
          The UT film site by{' '}
          <a href="https://tannerkopel.com" target="_blank" rel="noreferrer">
            Tanner
          </a>
        </div>
      </div>

      <nav className="side-nav">
        {NAV.map((group) => (
          <div key={group.section} className="nav-group">
            <div className="nav-label">{group.section}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `side-link${isActive ? ' is-active' : ''}`}
                onClick={(event) => {
                  if (!PUBLIC_PATHS.includes(item.to) && !loggedIn) {
                    onProtectedNav(event, item.to)
                  }
                }}
              >
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="side-foot">
        {loggedIn ? (
          <>
            <button type="button" className="upload-solid" onClick={onUpload}>
              <Icon name="plus" className="icon-dark" />
              Upload a film
            </button>
            <div className="side-user-wrap" ref={menuRef}>
              <button
                type="button"
                className="side-user"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="avatar-ring">{initialsFromName(profile.name)}</span>
                <span className="side-user-copy">
                  <span className="side-user-name">{profile.name}</span>
                  {yearLine ? (
                    <span className="side-user-meta" title={yearLine}>
                      {yearLine}
                    </span>
                  ) : null}
                </span>
              </button>
              {menuOpen && (
                <div className="menu" role="menu">
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/portfolio')
                    }}
                  >
                    Portfolio settings
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/projects')
                    }}
                  >
                    Credit requests
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      signOut()
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : user ? null : (
          <div className="side-auth">
            <button type="button" className="upload-solid" onClick={onSignup}>
              Sign up
            </button>
            <button type="button" className="ghost-btn" onClick={onLogin}>
              Log in
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
