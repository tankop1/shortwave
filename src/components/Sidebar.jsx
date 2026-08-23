import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../auth/AuthContext'
import { NAV, PUBLIC_PATHS, initialsFromName } from '../data'
import { subscribeMessages } from '../lib/messages'

const MORE_ITEMS = [
  { id: 'saved', label: 'Your list', icon: 'heart', to: '/list' },
  { id: 'credits', label: 'Credits & Requests', icon: 'star', to: '/credits' },
]

export default function Sidebar({ open = false, onClose, onUpload, onSignup, onLogin, onProtectedNav, onEditProfile, onOpenSettings, onOpenDebug }) {
  const location = useLocation()
  const { user, profile, signOut } = useAuth()
  const menuRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [moreLocked, setMoreLocked] = useState(false)
  const [unread, setUnread] = useState(0)
  const loggedIn = Boolean(user && profile?.onboarded)
  const moreActive = MORE_ITEMS.some((item) => location.pathname === item.to)

  useEffect(() => {
    function onPointer(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  useEffect(() => {
    if (open) setMenuOpen(false)
    setMoreOpen(false)
  }, [open, location.pathname])

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
            {group.section === 'You' ? (
              <div
                className={`nav-more${moreOpen ? ' is-open' : ''}${moreLocked ? ' is-locked' : ''}${moreActive ? ' has-active' : ''}`}
                onMouseLeave={() => setMoreLocked(false)}
              >
                <button
                  type="button"
                  className={`side-link${moreActive ? ' is-active' : ''}`}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    setMoreLocked(false)
                    setMoreOpen((openMore) => !openMore)
                  }}
                >
                  <Icon name="ellipsis" />
                  More
                </button>
                <div className="nav-more-menu" role="menu">
                  {MORE_ITEMS.map((item) => (
                    <NavLink
                      key={item.id}
                      to={item.to}
                      role="menuitem"
                      className={({ isActive }) => `menu-item${isActive ? ' is-on' : ''}`}
                      onClick={(event) => {
                        setMoreOpen(false)
                        setMoreLocked(true)
                        close()
                        if (!loggedIn) onProtectedNav(event, item.to)
                      }}
                    >
                      <Icon name={item.icon} />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : null}
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
                    <Icon name="edit" />
                    Edit profile
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      close()
                      onOpenDebug()
                    }}
                  >
                    <Icon name="bug" />
                    Debug
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      close()
                      onOpenSettings()
                    }}
                  >
                    <Icon name="settings" />
                    Settings
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
                    <Icon name="logout" />
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
