import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'
import { NAV, PUBLIC_PATHS, initialsFromName } from '../data'
import { subscribeMessages } from '../lib/messages'

export default function Sidebar({ open = false, onClose, onUpload, onSignup, onLogin, onProtectedNav, onEditProfile }) {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const menuRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const loggedIn = Boolean(user && profile?.onboarded)

  useEffect(() => {
    function onPointer(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  useEffect(() => {
    if (open) setMenuOpen(false)
  }, [open])

  const yearLine = [profile?.grade, profile?.major].filter(Boolean).join(' · ')

  useEffect(() => {
    if (!user?.uid || !loggedIn) {
      setUnread(0)
      return undefined
    }
    return subscribeMessages(user.uid, (messages) => {
      setUnread(messages.filter((item) => !item.read).length)
    })
  }, [user?.uid, loggedIn])

  function close() {
    onClose?.()
  }

  return (
    <aside id="mobile-nav" className={`sidebar${open ? ' is-open' : ''}`} tabIndex={-1}>
      <div className="brand">
        <Link to="/" className="brand-name" onClick={close}>
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
                  close()
                  if (!PUBLIC_PATHS.includes(item.to) && !loggedIn) {
                    onProtectedNav(event, item.to)
                  }
                }}
              >
                <Icon name={item.icon} />
                {item.label}
                {item.id === 'inbox' && unread > 0 ? (
                  <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="side-foot">
        {loggedIn ? (
          <>
            <button
              type="button"
              className="upload-solid"
              onClick={() => {
                close()
                onUpload()
              }}
            >
              <Icon name="plus" className="icon-dark" />
              Upload a film
            </button>
            <div className="side-user-wrap" ref={menuRef}>
              <button
                type="button"
                className="side-user"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((openMenu) => !openMenu)}
              >
                <span className="avatar-ring">
                  {profile.photoUrl ? <img src={profile.photoUrl} alt="" /> : initialsFromName(profile.name)}
                </span>
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
                      close()
                      onEditProfile()
                    }}
                  >
                    Edit profile
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      close()
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
                      close()
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
            <button
              type="button"
              className="upload-solid"
              onClick={() => {
                close()
                onSignup()
              }}
            >
              Sign up
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                close()
                onLogin()
              }}
            >
              Log in
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
