import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function MobileTopbar({ open, onToggle }) {
  return (
    <header className="mobile-topbar">
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
      <button
        type="button"
        id="mobile-menu-btn"
        className="mobile-menu-btn"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={onToggle}
      >
        <Icon name={open ? 'close' : 'menu'} />
      </button>
    </header>
  )
}
