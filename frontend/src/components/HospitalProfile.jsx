import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTitle } from '../useTitle'
import AmbulanceMap from './AmbulanceMap'
import './HospitalProfile.css'

const NAV_ITEMS = [
  { key: 'overview',   label: 'Overview',   icon: '📋' },
  { key: 'antivenom',  label: 'Antivenom Inventory', icon: '🧪' },
  { key: 'ambulances', label: 'Ambulances & Tracking', icon: '🚑' },
  { key: 'resolved',   label: 'Resolved Cases', icon: '✅' },
]

export default function HospitalProfile() {
  const { name } = useParams()
  const hospitalName = decodeURIComponent(name)
  const navigate = useNavigate()
  useTitle(`${hospitalName} — Hospital Profile & Inventory`)

  const [tab, setTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [antivenom, setAntivenom] = useState([])
  const [ambulances, setAmbulances] = useState([])
  const [activeCases, setActiveCases] = useState([])
  const [resolvedCases, setResolvedCases] = useState([])
  const [loading, setLoading] = useState(true)

  const encodedName = encodeURIComponent(hospitalName)

  const fetchAll = useCallback(async () => {
    try {
      const [ov, av, am, ac, rc] = await Promise.all([
        axios.get(`/api/hospitals/${encodedName}/overview`),
        axios.get(`/api/hospitals/${encodedName}/antivenom`),
        axios.get(`/api/hospitals/${encodedName}/ambulances`),
        axios.get(`/api/hospitals/${encodedName}/cases?status=active`),
        axios.get(`/api/hospitals/${encodedName}/cases?status=resolved`),
      ])
      setOverview(ov.data)
      setAntivenom(av.data.inventory || [])
      setAmbulances(am.data.shipments || [])
      setActiveCases(ac.data.cases || [])
      setResolvedCases(rc.data.cases || [])
    } catch (err) {
      console.error('Failed to load hospital profile:', err)
    } finally {
      setLoading(false)
    }
  }, [encodedName])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, tab === 'ambulances' ? 4000 : 10000)
    return () => clearInterval(interval)
  }, [fetchAll, tab])

  const handleResolve = async (caseId) => {
    try {
      await axios.post(`/api/cases/${caseId}/resolve`)
      fetchAll()
    } catch (err) {
      console.error('Failed to resolve case:', err)
    }
  }

  const vialLevel = (vials) => {
    if (vials === 0) return { label: 'OUT OF STOCK', cls: 'hp-level-out' }
    if (vials <= 2) return { label: 'LOW STOCK', cls: 'hp-level-low' }
    return { label: 'IN STOCK', cls: 'hp-level-ok' }
  }

  return (
    <div className="hp-page-wrapper">
      <div className="hp-container">

        {/* ── Top Bar with Clear Back Button & Breadcrumbs ── */}
        <div className="hp-top-navigation">
          <button className="hp-back-button" onClick={() => navigate('/hospitals')}>
            ← Back to Hospitals Directory
          </button>
          <div className="hp-breadcrumb">
            <Link to="/hospitals">Hospitals Directory</Link>
            <span className="separator">/</span>
            <span className="current">{hospitalName}</span>
          </div>
        </div>

        {/* ── Hospital Profile Header Banner Card ── */}
        <div className="hp-profile-banner">
          <div className="hp-banner-main">
            <div className="hp-banner-icon">🏥</div>
            <div className="hp-banner-details">
              <div className="hp-type-row">
                <span className="hp-facility-type">{overview?.hospital?.type || 'Government Hospital'}</span>
                <span className="hp-antivenom-badge">
                  {overview?.hospital?.antivenom ? '🧪 Antivenom Equipped' : '⚠️ No Antivenom'}
                </span>
              </div>
              <h1 className="hp-facility-name">{hospitalName}</h1>
              <p className="hp-facility-address">📍 {overview?.hospital?.address || 'Visakhapatnam Region'}</p>
            </div>
          </div>

          <div className="hp-banner-actions">
            {overview?.hospital?.phone && (
              <a
                href={`tel:${overview.hospital.phone.replace(/[^0-9]/g, '')}`}
                className="hp-call-button"
              >
                📞 Call Hospital ({overview.hospital.phone})
              </a>
            )}
          </div>
        </div>

        {/* ── Horizontal Navigation Tabs Bar ── */}
        <div className="hp-tabs-bar">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`hp-tab-btn ${tab === item.key ? 'active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              <span className="hp-tab-icon">{item.icon}</span>
              <span className="hp-tab-label">{item.label}</span>
              {item.key === 'overview' && overview && (
                <span className="hp-tab-badge">{overview.active_cases}</span>
              )}
              {item.key === 'ambulances' && (
                <span className="hp-tab-badge teal">{ambulances.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Main Tab Content ── */}
        {loading ? (
          <div className="hp-loading-card">Loading facility information…</div>
        ) : (
          <div className="hp-tab-content">

            {/* ── Overview tab ── */}
            {tab === 'overview' && overview && (
              <section className="hp-card-section">
                <div className="hp-stats-overview">
                  <div className="hp-stat-box primary">
                    <span className="stat-number">{overview.active_cases}</span>
                    <span className="stat-label">Active Incoming Cases</span>
                  </div>
                  <div className="hp-stat-box">
                    <span className="stat-number">{overview.resolved_cases}</span>
                    <span className="stat-label">Resolved Cases</span>
                  </div>
                  <div className="hp-stat-box">
                    <span className="stat-number">{overview.total_cases}</span>
                    <span className="stat-label">Total All-Time Intake</span>
                  </div>
                </div>

                <h3 className="hp-subheading">Active Patient Cases</h3>
                {activeCases.length === 0 ? (
                  <div className="hp-empty-card">No active cases currently logged for this hospital.</div>
                ) : (
                  <div className="hp-case-list">
                    {activeCases.map(c => (
                      <div key={c.id} className="hp-case-card">
                        <div className="hp-case-top">
                          <div className="hp-case-left">
                            <span className="hp-case-id">Case #{c.id}</span>
                            <span className={`hp-urgency-badge urgency-${c.urgency?.toLowerCase()}`}>{c.urgency}</span>
                          </div>
                          <button className="hp-resolve-btn" onClick={() => handleResolve(c.id)}>
                            Mark Resolved
                          </button>
                        </div>
                        <p className="hp-case-transcript">"{c.transcript}"</p>
                        {c.followups && c.followups.length > 0 && (
                          <div className="hp-followups-list">
                            <span className="followup-lbl">Patient Details:</span>
                            {c.followups.map((f, i) => (
                              <p key={i} className="followup-txt">"{f.transcript}"</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Antivenom tab ── */}
            {tab === 'antivenom' && (
              <section className="hp-card-section">
                <h3 className="hp-subheading">Polyvalent Antivenom Stock by Snake Species</h3>
                <p className="hp-desc-note">
                  Standard Indian Polyvalent Antivenom neutralizes venom from India's "Big Four" species.
                </p>
                <div className="hp-antivenom-grid">
                  {antivenom.map((a, i) => {
                    const level = vialLevel(a.vials)
                    return (
                      <div key={i} className="hp-antivenom-card">
                        <span className="hp-snake-name">{a.snake}</span>
                        <span className="hp-vial-count">{a.vials} Vials</span>
                        <span className={`hp-level-tag ${level.cls}`}>{level.label}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Ambulances tab ── */}
            {tab === 'ambulances' && (
              <section className="hp-card-section">
                <h3 className="hp-subheading">Ambulance Shipments & Live Route Tracking</h3>
                <p className="hp-desc-note">
                  Live simulated dispatch tracking showing vehicle coordinates, ETA, and cold-chain temperature telemetry.
                </p>
                {ambulances.length === 0 ? (
                  <div className="hp-empty-card">No ambulances currently dispatched from this facility.</div>
                ) : (
                  <>
                    <AmbulanceMap shipments={ambulances} hospitalName={hospitalName} />
                    <div className="hp-shipments-list">
                      {ambulances.map(s => (
                        <div key={s.id} className="hp-shipment-card">
                          <div className="hp-shipment-header">
                            <span className="shipment-id">Shipment #{s.id}{s.case_id ? ` · Case #${s.case_id}` : ''}</span>
                            <span className={`shipment-status ${s.status === 'arrived' ? 'arrived' : 'enroute'}`}>
                              {s.status === 'arrived' ? '✅ Arrived' : '🚑 En Route'}
                            </span>
                          </div>

                          <div className="hp-progress-bar-wrap">
                            <div className="hp-progress-fill" style={{ width: `${s.progress * 100}%` }} />
                            <span className="hp-progress-icon" style={{ left: `${s.progress * 100}%` }}>🚑</span>
                          </div>

                          <div className="hp-shipment-meta">
                            <span>📏 {s.distance_remaining_km} km remaining</span>
                            <span>⏱ ETA ~{s.eta_minutes} min</span>
                            <span className={s.cold_chain_breach ? 'temp-breach' : ''}>
                              🌡 {s.temperature_c}°C {s.cold_chain_breach ? '⚠ Cold-chain breach' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* ── Resolved tab ── */}
            {tab === 'resolved' && (
              <section className="hp-card-section">
                <h3 className="hp-subheading">Resolved Snakebite Cases</h3>
                {resolvedCases.length === 0 ? (
                  <div className="hp-empty-card">No resolved cases logged yet.</div>
                ) : (
                  <div className="hp-case-list">
                    {resolvedCases.map(c => (
                      <div key={c.id} className="hp-case-card resolved">
                        <div className="hp-case-top">
                          <span className="hp-case-id">Case #{c.id}</span>
                          <span className="hp-resolved-tag">✅ Treatment Complete</span>
                        </div>
                        <p className="hp-case-transcript">"{c.transcript}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
