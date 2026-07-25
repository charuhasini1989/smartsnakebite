import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()

  const isActive = (path) => {
    const current = location.pathname
    if (path === '/') return current === '/'
    if (path === '/report') return current === '/report'
    if (path === '/hospitals') return current === '/hospitals' || current.startsWith('/hospital/')
    if (path === '/hospital') return current === '/hospital'
    return current === path
  }

  return (
    <header className="site-header">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-logo">🐍</span>
          <span className="brand-title">SmartSnakebite</span>
          <span className="brand-badge">LIVE</span>
        </Link>

        {/* Nav Links */}
        <nav className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/report" className={`nav-link ${isActive('/report') ? 'active' : ''}`}>
            Report a Bite
          </Link>
          <Link to="/hospitals" className={`nav-link ${isActive('/hospitals') ? 'active' : ''}`}>
            Hospitals
          </Link>
          <Link to="/hospital" className={`nav-link ${isActive('/hospital') ? 'active' : ''}`}>
            Hospital Dashboard
          </Link>
        </nav>

        <div className="nav-actions">
          <Link to="/report" className="nav-cta-btn">
            🎙 Report a Bite
          </Link>
        </div>
      </div>
    </header>
  )
}
