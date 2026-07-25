import { Link } from 'react-router-dom'
import { useTitle } from '../useTitle'
import './NotFound.css'

export default function NotFound() {
  useTitle('404 Page Not Found')

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon">🐍 404</div>
        <h1>Page Not Found</h1>
        <p>
          The page or hospital profile you are looking for does not exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="nf-btn primary">
            🏠 Back to Home
          </Link>
          <Link to="/report" className="nf-btn secondary">
            🎙 Report a Snakebite
          </Link>
          <Link to="/hospitals" className="nf-btn secondary">
            🏥 Browse Hospitals
          </Link>
        </div>
      </div>
    </div>
  )
}
