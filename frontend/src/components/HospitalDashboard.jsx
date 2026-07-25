import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTitle } from '../useTitle'
import './HospitalDashboard.css'

const URGENCY_COLOR = {
  CRITICAL: { bg: '#fff5f5', border: '#c81e1e', text: '#9b1c1c', dot: '#c81e1e' },
  HIGH:     { bg: '#fffbeb', border: '#b45309', text: '#92400e', dot: '#d97706' },
  MEDIUM:   { bg: '#eff6ff', border: '#0d7d6a', text: '#085c4d', dot: '#0d7d6a' },
  LOW:      { bg: '#f0fdf4', border: '#057a55', text: '#065f46', dot: '#057a55' },
}

const URGENCY_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const TREATMENT_PROTOCOL = {
  tourniquet:    "Remove tourniquet immediately. Assess limb for compartment syndrome. Administer polyvalent antivenom IV.",
  incision:      "Clean and dress wound. Assess blood loss. Administer antivenom. Monitor for infection.",
  suction:       "Clean oral cavity of helper if present. Administer antivenom. Monitor patient vitals.",
  healer_visit:  "Assess time lost to traditional treatment. Administer antivenom immediately. Monitor for delayed presentation.",
  herbal_remedy: "Remove any applied substance. Clean wound. Administer antivenom. Check for allergic reaction.",
  electrotherapy:"Assess for electrical burns. Administer antivenom. Monitor cardiac rhythm.",
  black_stone:   "Remove black stone. Clean wound. Administer antivenom.",
  alcohol:       "Monitor liver function. Administer antivenom. IV fluids.",
  delay:         "Time-critical — administer antivenom immediately. Assess for end-organ damage.",
  walking:       "Rest patient. Elevate bitten limb. Administer antivenom. Monitor vitals.",
  default:       "Administer polyvalent antivenom IV. Monitor vitals. Keep patient calm and still.",
  safe:          "No harmful practice detected. Administer antivenom as per standard protocol. Monitor vitals.",
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function HospitalDashboard() {
  useTitle('Hospital Dashboard — Live Triage Feed')
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [notified, setNotified] = useState({})
  const [filter, setFilter] = useState('ALL')     // ALL | CRITICAL | HIGH | SAFE
  const [sortBy, setSortBy] = useState('newest')  // newest | danger | hospital | distance
  const [viewerLocation, setViewerLocation] = useState(null)
  const navigate = useNavigate()

  const fetchCases = async () => {
    try {
      const res = await axios.get('/api/cases')
      setCases(res.data.cases)
    } catch (err) {
      console.error('Failed to fetch cases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
    const interval = setInterval(fetchCases, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleNotify = (id) => {
    setNotified(prev => ({ ...prev, [id]: true }))
  }

  const requestViewerLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setViewerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn('Location permission denied — cannot sort by distance')
    )
  }

  useEffect(() => {
    if (sortBy === 'distance' && !viewerLocation) requestViewerLocation()
  }, [sortBy])

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
      ' · ' + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const visibleCases = useMemo(() => {
    let list = cases
    if (filter === 'CRITICAL') list = cases.filter(c => c.urgency === 'CRITICAL')
    else if (filter === 'HIGH') list = cases.filter(c => c.urgency === 'HIGH')
    else if (filter === 'SAFE') list = cases.filter(c => c.label === 'SAFE')

    const sorted = [...list]
    if (sortBy === 'danger') {
      sorted.sort((a, b) => (URGENCY_RANK[a.urgency] ?? 9) - (URGENCY_RANK[b.urgency] ?? 9))
    } else if (sortBy === 'hospital') {
      sorted.sort((a, b) => (a.hospital_name || 'zzz').localeCompare(b.hospital_name || 'zzz'))
    } else if (sortBy === 'distance' && viewerLocation) {
      sorted.sort((a, b) => {
        const da = haversine(viewerLocation.lat, viewerLocation.lng, a.lat, a.lng)
        const db = haversine(viewerLocation.lat, viewerLocation.lng, b.lat, b.lng)
        return da - db
      })
    }
    // 'newest' is already the default order from the backend (id DESC)
    return sorted
  }, [cases, filter, sortBy, viewerLocation])

  const criticalCount = cases.filter(c => c.urgency === 'CRITICAL').length
  const highCount = cases.filter(c => c.urgency === 'HIGH').length
  const safeCount = cases.filter(c => c.label === 'SAFE').length

  return (
    <div className="hd-app">

      <div className="hd-header-bar">
        <div className="hd-header-title">
          <h2>🏥 Live Hospital Dashboard</h2>
          <p>Real-time snakebite case feed, urgency triage, and treatment protocols</p>
        </div>
        <div className="hd-topbar-right">
          <span className="hd-live-dot" />
          <span className="hd-live-text">Live · auto-refreshes every 10s</span>
        </div>
      </div>

      <main className="hd-main">

        {/* ── Stats bar (click to filter) ── */}
        <div className="hd-stats">
          <div
            className={`hd-stat hd-stat-clickable ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            <span className="hd-stat-number">{cases.length}</span>
            <span className="hd-stat-label">Total Cases</span>
          </div>
          <div
            className={`hd-stat hd-stat-clickable ${filter === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => setFilter('CRITICAL')}
          >
            <span className="hd-stat-number" style={{ color: '#c81e1e' }}>{criticalCount}</span>
            <span className="hd-stat-label">Critical</span>
          </div>
          <div
            className={`hd-stat hd-stat-clickable ${filter === 'HIGH' ? 'active' : ''}`}
            onClick={() => setFilter('HIGH')}
          >
            <span className="hd-stat-number" style={{ color: '#b45309' }}>{highCount}</span>
            <span className="hd-stat-label">High</span>
          </div>
          <div
            className={`hd-stat hd-stat-clickable ${filter === 'SAFE' ? 'active' : ''}`}
            onClick={() => setFilter('SAFE')}
          >
            <span className="hd-stat-number" style={{ color: '#057a55' }}>{safeCount}</span>
            <span className="hd-stat-label">Safe</span>
          </div>
        </div>

        {/* ── Sort + filter status bar ── */}
        <div className="hd-toolbar">
          <div className="hd-toolbar-left">
            {filter !== 'ALL' && (
              <span className="hd-filter-chip">
                Showing: {filter}
                <button onClick={() => setFilter('ALL')}>✕</button>
              </span>
            )}
          </div>
          <label className="hd-sort-label">
            Sort by
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="danger">Danger</option>
              <option value="hospital">Hospital Allocated</option>
              <option value="distance">Nearest to Me</option>
            </select>
          </label>
        </div>

        {/* ── Cases ── */}
        {loading ? (
          <div className="hd-empty">Loading cases...</div>
        ) : visibleCases.length === 0 ? (
          <div className="hd-empty">
            {cases.length === 0
              ? 'No cases reported yet. Waiting for incoming reports.'
              : 'No cases match this filter.'}
          </div>
        ) : (
          <div className="hd-cases">
            {visibleCases.map((c) => {
              const u = URGENCY_COLOR[c.urgency] || URGENCY_COLOR.LOW
              const protocol = TREATMENT_PROTOCOL[c.category] || TREATMENT_PROTOCOL.default
              return (
                <div
                  key={c.id}
                  className="hd-case-card"
                  style={{ borderLeft: `4px solid ${u.border}` }}
                >
                  <div className="hd-case-header">
                    <div className="hd-case-header-left">
                      <span className="hd-case-id">Case #{c.id}</span>
                      <span
                        className="hd-urgency-badge"
                        style={{ background: u.bg, color: u.text, border: `1px solid ${u.border}` }}
                      >
                        <span className="hd-urgency-dot" style={{ background: u.dot }} />
                        {c.urgency}
                      </span>
                      <span className="hd-label-badge" style={{
                        background: c.label === 'HARMFUL' ? '#fff5f5' : '#f0fdf4',
                        color: c.label === 'HARMFUL' ? '#9b1c1c' : '#065f46',
                        border: `1px solid ${c.label === 'HARMFUL' ? '#fbd5d5' : '#bbf7d0'}`
                      }}>
                        {c.label === 'HARMFUL' ? '🚨' : '✅'} {c.label}
                      </span>
                      {c.session_status === 'in_progress' && (
                        <span className="hd-session-badge">● LIVE SESSION</span>
                      )}
                    </div>
                    <span className="hd-timestamp">{formatTime(c.timestamp)}</span>
                  </div>

                  {c.transcript && (
                    <div className="hd-transcript">
                      <span className="hd-field-label">Reported</span>
                      <p>"{c.transcript}"</p>
                      <span className="hd-lang-tag">{c.language?.toUpperCase()}</span>
                    </div>
                  )}

                  <div className="hd-details-grid">
                    <div className="hd-detail">
                      <span className="hd-field-label">Practice Detected</span>
                      <span className="hd-detail-value">{c.category?.replace('_', ' ').toUpperCase() || '—'}</span>
                    </div>
                    <div className="hd-detail">
                      <span className="hd-field-label">Language</span>
                      <span className="hd-detail-value">{c.language?.toUpperCase() || '—'}</span>
                    </div>
                    <div className="hd-detail">
                      <span className="hd-field-label">Location</span>
                      <span className="hd-detail-value">
                        {c.lat?.toFixed(4)}, {c.lng?.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="hd-hospital-block">
                    <span className="hd-field-label">Hospital Allocated</span>
                    {c.hospital_name ? (
                      <div className="hd-hospital-info">
                        <span
                          className="hd-hospital-name hd-hospital-link"
                          onClick={() => navigate(`/hospital/${encodeURIComponent(c.hospital_name)}`)}
                        >
                          🏥 {c.hospital_name}
                        </span>
                        <span className="hd-hospital-meta">
                          {c.hospital_distance_km?.toFixed(1)} km · ~{Math.round(c.hospital_travel_min)} min
                          {c.hospital_phone && ` · ${c.hospital_phone}`}
                        </span>
                      </div>
                    ) : (
                      <span className="hd-hospital-none">Not available for this case</span>
                    )}
                  </div>

                  {c.followups && c.followups.length > 0 && (
                    <div className="hd-followups">
                      <span className="hd-field-label">Patient-Provided Details</span>
                      {c.followups.map((f, i) => (
                        <div key={i} className="hd-followup-entry">
                          <span className="hd-followup-lang">{f.language?.toUpperCase()}</span>
                          <p>"{f.transcript}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {c.label === 'HARMFUL' && (
                    <div className="hd-protocol">
                      <span className="hd-field-label">Treatment Protocol</span>
                      <p>{protocol}</p>
                    </div>
                  )}

                  <div className="hd-case-footer">
                    {notified[c.id] ? (
                      <span className="hd-notified">✅ Nearby hospitals notified</span>
                    ) : (
                      <button
                        className="hd-notify-btn"
                        onClick={() => handleNotify(c.id)}
                      >
                        📡 Notify Nearby Hospitals
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
