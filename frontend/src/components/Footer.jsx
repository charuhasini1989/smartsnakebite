import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-curve">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 48H1440V0C1440 0 1140 32 720 32C300 32 0 0 0 0V48Z"
            fill="var(--ink)"
          />
        </svg>
      </div>

      <div className="footer-inner">
        <div className="footer-grid">

          {/* Column 1: Brand & Emergency Numbers */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <span className="footer-logo">🐍</span>
              <span className="footer-title">SmartSnakebite</span>
            </div>
            <p className="footer-tagline">
              Voice-based snakebite first-aid safety & multi-factor emergency hospital routing system.
            </p>
            <div className="emergency-callout">
              <span className="callout-icon">📞</span>
              <div>
                <strong>In an Emergency: Call 108</strong>
                <p>Free emergency ambulance service in Andhra Pradesh & Telangana</p>
              </div>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home Page</Link></li>
              <li><Link to="/report">Report a Snakebite</Link></li>
              <li><Link to="/hospitals">Hospitals Directory</Link></li>
              <li><Link to="/hospital">Hospital Dashboard</Link></li>
            </ul>
          </div>

          {/* Column 3: Medical Disclaimer */}
          <div className="footer-col disclaimer-col">
            <h4 className="footer-heading">Medical Disclaimer</h4>
            <div className="disclaimer-box">
              <p>
                <strong>⚠️ Research Prototype / Demo Tool</strong>
              </p>
              <p>
                SmartSnakebite is a demonstration project created to explore speech analysis for first-aid practice detection and dynamic medical routing. It is <strong>NOT</strong> a certified medical device and must not replace professional medical judgment or emergency services. Always call emergency responders immediately.
              </p>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} SmartSnakebite Safety Tool · Voice First-Aid & Emergency Routing</p>
          <p className="footer-credits">Visakhapatnam & Agency Region Healthcare Prototype</p>
        </div>
      </div>
    </footer>
  )
}
