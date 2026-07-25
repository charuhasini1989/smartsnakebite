import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getNearestHospitals } from '../api'
import { useTitle } from '../useTitle'
import './LandingPage.css'

export default function LandingPage() {
  useTitle('SmartSnakebite — Voice First-Aid & Emergency Hospital Routing')

  const [userLocation, setUserLocation] = useState(null)
  const [locationGranted, setLocationGranted] = useState(false)
  const [locating, setLocating] = useState(false)
  const [nearestHospital, setNearestHospital] = useState(null)

  const detectLocation = () => {
    setLocating(true)
    if (!navigator.geolocation) {
      fallbackLocation()
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setLocationGranted(true)
        setLocating(false)
        fetchTopHospital(loc.lat, loc.lng)
      },
      () => {
        fallbackLocation()
      }
    )
  }

  const fallbackLocation = async () => {
    const fallback = { lat: 17.7231, lng: 83.3012 }
    setUserLocation(fallback)
    setLocationGranted(false)
    setLocating(false)
    fetchTopHospital(fallback.lat, fallback.lng)
  }

  const fetchTopHospital = async (lat, lng) => {
    try {
      const res = await getNearestHospitals(lat, lng)
      if (res.hospitals && res.hospitals.length > 0) {
        setNearestHospital(res.hospitals[0])
      }
    } catch (err) {
      console.error('Failed to fetch nearest hospital:', err)
    }
  }

  useEffect(() => {
    detectLocation()
  }, [])

  return (
    <div className="landing-page">
      {/* ── Honest Prototype Banner ── */}
      <div className="demo-notice-bar">
        <div className="notice-content">
          <span className="notice-tag">RESEARCH PROTOTYPE</span>
          <p>
            SmartSnakebite is a functional demonstration tool. In an actual medical emergency, call <strong>108</strong> immediately.
          </p>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-text">
            <div className="hero-badge">
              <span>🐍 Voice-Based Snakebite Safety</span>
            </div>
            <h1 className="hero-title">
              Instant voice guidance & smart antivenom hospital routing
            </h1>
            <p className="hero-description">
              Speak in Telugu, Hindi, or English to describe first aid given. SmartSnakebite detects harmful practices (tourniquets, incisions, healer visits), provides instant corrective audio instructions, and routes you to the optimal antivenom-stocked hospital.
            </p>
            <div className="hero-cta-group">
              <Link to="/report" className="hero-btn-primary">
                🎙 Report a Snakebite Now
              </Link>
              <Link to="/hospitals" className="hero-btn-secondary">
                🏥 Find Hospitals with Antivenom
              </Link>
            </div>
            <div className="hero-meta">
              <span>✅ Supports Telugu · Hindi · English</span>
              <span>⚡ Real-time Antivenom Scoring</span>
            </div>
          </div>

          {/* Asymmetric Graphic / SVG Illustration Collage */}
          <div className="hero-visual">
            <div className="visual-card main-card">
              <div className="card-badge alert-badge">🚨 HARMFUL PRACTICE DETECTED</div>
              <div className="card-header">
                <span className="card-icon">🎙</span>
                <div>
                  <h4>Voice Report Analyzed</h4>
                  <p>"కట్టు కట్టాము మరియు కత్తితో నాటు పెట్టాము..."</p>
                </div>
              </div>
              <div className="corrective-preview">
                <span className="warning-icon">⚠️</span>
                <p><strong>Corrective Advice:</strong> Remove tourniquet immediately! Do NOT cut wound. Keep patient calm and still.</p>
              </div>
            </div>

            <div className="visual-card sub-card-1">
              <div className="sub-card-header">
                <span className="hospital-pin-icon">🏥</span>
                <div>
                  <strong>King George Hospital</strong>
                  <p>12 Polyvalent Vials · 3.4 km away</p>
                </div>
              </div>
              <span className="match-score">Rank #1 (Score: 0.94)</span>
            </div>

            <div className="visual-card sub-card-2">
              <span className="coldchain-icon">🚑</span>
              <div>
                <strong>Ambulance En Route</strong>
                <p>Temp: 4.2°C (Cold-chain secure)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-subtitle">THE EMERGENCY PIPELINE</span>
            <h2 className="section-title">How SmartSnakebite Saves Critical Time</h2>
            <p className="section-desc">From voice recording to hospital admission in 4 simple steps</p>
          </div>

          <div className="timeline-wrap">
            <div className="timeline-line" />

            <div className="timeline-item left">
              <div className="timeline-number">01</div>
              <div className="timeline-card">
                <div className="timeline-icon">🎙</div>
                <h3>Speak in Your Language</h3>
                <p>
                  Speak naturally in Telugu, Hindi, or English to describe first aid applied.
                </p>
              </div>
            </div>

            <div className="timeline-item right">
              <div className="timeline-number">02</div>
              <div className="timeline-card">
                <div className="timeline-icon">🧠</div>
                <h3>Detect Harmful Practices</h3>
                <p>
                  Instantly flags dangerous practices like tourniquets, incisions, or suction.
                </p>
              </div>
            </div>

            <div className="timeline-item left">
              <div className="timeline-number">03</div>
              <div className="timeline-card">
                <div className="timeline-icon">🔊</div>
                <h3>Corrective Voice Guidance</h3>
                <p>
                  Plays clear audio emergency guidance to prevent severe tissue damage.
                </p>
              </div>
            </div>

            <div className="timeline-item right">
              <div className="timeline-number">04</div>
              <div className="timeline-card">
                <div className="timeline-icon">🗺</div>
                <h3>Smart Multi-Factor Routing</h3>
                <p>
                  Routes patient to top hospital using travel time, antivenom stock & beds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature / Service Card Grid Section ── */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-subtitle">CORE CAPABILITIES</span>
            <h2 className="section-title">Why SmartSnakebite Matters</h2>
            <p className="section-desc">Designed to address delay, panic, and incorrect first aid in emergency response</p>
          </div>

          <div className="feature-grid">
            {/* Card 1 */}
            <div className="feature-card">
              <div className="feature-badge-icon teal">🚨</div>
              <h3>Harmful Practice Detection</h3>
              <p>
                Detects tourniquets, incisions & suction to prevent tissue damage.
              </p>
              <Link to="/report" className="feature-btn secondary">Try Voice Reporting</Link>
            </div>

            {/* Card 2 - Featured Highlighted Card */}
            <div className="feature-card highlighted-card">
              <div className="feature-badge-icon filled">⚖️</div>
              <h3>Multi-Factor Hospital Scoring</h3>
              <p>
                Ranks hospitals by travel time, antivenom stock & ICU beds.
              </p>
              <Link to="/hospitals" className="feature-btn primary-filled">Browse Hospitals</Link>
            </div>

            {/* Card 3 */}
            <div className="feature-card">
              <div className="feature-badge-icon amber">🗣</div>
              <h3>Multilingual Speech AI</h3>
              <p>
                Understands natural voice input in Telugu, Hindi & English.
              </p>
              <Link to="/report" className="feature-btn secondary">Test Speech Input</Link>
            </div>

            {/* Card 4 */}
            <div className="feature-card">
              <div className="feature-badge-icon amber">🚑</div>
              <h3>Live Ambulance Tracking</h3>
              <p>
                Real-time ambulance tracking & cold-chain telemetry.
              </p>
              <Link to="/hospital" className="feature-btn secondary">View Live Map</Link>
            </div>

            {/* Card 5 */}
            <div className="feature-card">
              <div className="feature-badge-icon teal">🧪</div>
              <h3>Species Antivenom Inventory</h3>
              <p>
                Tracks polyvalent antivenom for Big Four venomous species.
              </p>
              <Link to="/hospitals" className="feature-btn secondary">Check Inventory</Link>
            </div>

            {/* Card 6 */}
            <div className="feature-card">
              <div className="feature-badge-icon alert">📊</div>
              <h3>Hospital Dashboard</h3>
              <p>
                Live case triage feed & emergency protocols for staff.
              </p>
              <Link to="/hospital" className="feature-btn secondary">Open Dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Emergency Assistance Banner ── */}
      <section className="emergency-banner-section">
        <div className="emergency-banner-container">
          <div className="eb-header">
            <div className="eb-title-group">
              <span className="eb-badge">🚨 LIVE EMERGENCY ASSISTANCE & ROUTING</span>
              <h2>Emergency Hotlines & Nearest Antivenom Hospital</h2>
            </div>
            <button className="eb-locate-btn" onClick={detectLocation} disabled={locating}>
              {locating ? '📡 Locating...' : '📍 Refresh Live Location'}
            </button>
          </div>

          <div className="eb-grid">
            {/* Box 1: All Emergency Contact Numbers */}
            <div className="eb-box contacts-box">
              <span className="eb-box-tag">HOTLINE NUMBERS</span>
              <h4>📞 Emergency Contacts</h4>
              <div className="contact-list">
                <div className="contact-item primary">
                  <span className="contact-icon">🚑</span>
                  <div>
                    <strong>108 — Free Emergency Ambulance</strong>
                    <p>Toll-Free in AP & Telangana</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🆘</span>
                  <div>
                    <strong>112 — National Emergency</strong>
                    <p>Single Universal Helpline</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🏥</span>
                  <div>
                    <strong>0891-2564891 — KGH Emergency</strong>
                    <p>Regional Venom Poisoning Unit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Requesting Person's Exact Live Location */}
            <div className="eb-box location-box">
              <span className="eb-box-tag">YOUR GPS LOCATION</span>
              <h4>📍 Live Patient Location</h4>
              {userLocation ? (
                <div className="location-info">
                  <div className="coord-chip">
                    <span>LAT: {userLocation.lat.toFixed(4)}° N</span>
                    <span>LNG: {userLocation.lng.toFixed(4)}° E</span>
                  </div>
                  <p className="loc-status">
                    {locationGranted ? '✅ Live GPS Location Active' : '📍 Region Location (Visakhapatnam Area)'}
                  </p>
                  <p className="loc-note">
                    Your exact coordinates are used to calculate travel time and dispatch nearest ambulances.
                  </p>
                </div>
              ) : (
                <div className="location-info">
                  <p className="loc-status">Detecting live coordinates…</p>
                </div>
              )}
            </div>

            {/* Box 3: Nearest Hospital (Only One!) */}
            <div className="eb-box hospital-box">
              <span className="eb-box-tag">TOP NEAREST MATCH</span>
              <h4>🏥 Single Nearest Hospital</h4>
              {nearestHospital ? (
                <div className="nearest-hospital-card">
                  <div className="nh-top">
                    <span className="nh-name">{nearestHospital.name}</span>
                    <span className={`nh-stock-badge ${nearestHospital.antivenom_stock > 0 ? 'stocked' : 'unstocked'}`}>
                      {nearestHospital.antivenom_stock > 0
                        ? `🧪 ${nearestHospital.antivenom_stock} Vials`
                        : '⚠️ No Stock'}
                    </span>
                  </div>
                  <p className="nh-address">📍 {nearestHospital.address}</p>
                  <div className="nh-meta">
                    <span>📏 {nearestHospital.distance_km} km away</span>
                    <span>⏱ ~{Math.round(nearestHospital.travel_minutes)} min travel</span>
                    {nearestHospital.phone && <span>📞 {nearestHospital.phone}</span>}
                  </div>
                  <div className="nh-action">
                    <Link
                      to={`/hospital/${encodeURIComponent(nearestHospital.name)}`}
                      className="nh-profile-link"
                    >
                      View Hospital Profile →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="nh-loading">Finding nearest hospital...</p>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
