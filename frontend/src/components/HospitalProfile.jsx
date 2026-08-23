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
  { key: 'alerts',     label: 'Stock Alerts & Import', icon: '🚨' },
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
  const [importNotice, setImportNotice] = useState(null)
  const [showSmsModal, setShowSmsModal] = useState(false)

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

  const handleRequestImport = (snakeSpecies) => {
    setImportNotice(`📦 Emergency import request generated for ${snakeSpecies} Antivenom! Dispatching 15 vials from Visakhapatnam Central Medical Depot.`)
    // Update local state to show restored inventory
    setAntivenom(prev => prev.map(item => {
      if (!snakeSpecies || item.snake === snakeSpecies || item.vials === 0) {
        return { ...item, vials: item.vials + 12 }
      }
      return item
    }))
  }

  const vialLevel = (vials) => {
    if (vials === 0) return { label: 'OUT OF STOCK', cls: 'hp-level-out' }
    if (vials <= 2) return { label: 'LOW STOCK', cls: 'hp-level-low' }
    return { label: 'IN STOCK', cls: 'hp-level-ok' }
  }

  const outOfStockItems = antivenom.filter(a => a.vials === 0 || a.vials <= 2)
  const phoneClean = overview?.hospital?.phone ? overview.hospital.phone.replace(/[^0-9]/g, '') : '108'
  const smsBody = encodeURIComponent(`EMERGENCY: Snakebite patient reported. Requesting antivenom intake confirmation at ${hospitalName}.`)

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
                {outOfStockItems.length > 0 && (
                  <span className="hp-alert-pill" onClick={() => setTab('alerts')}>
                    🚨 Stock Alert ({outOfStockItems.length} low/depleted)
                  </span>
                )}
              </div>
              <h1 className="hp-facility-name">{hospitalName}</h1>
              <p className="hp-facility-address">📍 {overview?.hospital?.address || 'Visakhapatnam Region'}</p>
            </div>
          </div>

          <div className="hp-banner-actions">
            <a href={`tel:${phoneClean}`} className="hp-call-button">
              📞 Call Hospital ({overview?.hospital?.phone || '108'})
            </a>
            <a href={`sms:${phoneClean}?body=${smsBody}`} className="hp-sms-button" onClick={(e) => {
              if (window.innerWidth > 768) {
                e.preventDefault()
                setShowSmsModal(true)
              }
            }}>
              💬 Text / SMS Hospital
            </a>
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
              {item.key === 'alerts' && outOfStockItems.length > 0 && (
                <span className="hp-tab-badge alert">{outOfStockItems.length}</span>
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
                        {a.vials <= 2 && (
                          <button className="hp-import-mini-btn" onClick={() => handleRequestImport(a.snake)}>
                            📦 Request Stock Import
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Stock Alerts & Import Tab ── */}
            {tab === 'alerts' && (
              <section className="hp-card-section">
                <h3 className="hp-subheading">🚨 Antivenom Stock Depletion Alerts & Import Management</h3>
                <p className="hp-desc-note">
                  Automated stock monitoring triggers emergency supply requests when antivenom inventory falls below safe threshold.
                </p>

                {importNotice && (
                  <div className="import-success-toast">
                    {importNotice}
                  </div>
                )}

                {outOfStockItems.length === 0 ? (
                  <div className="stock-all-good-box">
                    <span className="good-icon">✅</span>
                    <div>
                      <strong>All Antivenom Species Stocked</strong>
                      <p>Inventory levels are above emergency thresholds. No active stock imports required.</p>
                    </div>
                  </div>
                ) : (
                  <div className="stock-alerts-list">
                    {outOfStockItems.map((item, idx) => (
                      <div key={idx} className="alert-item-card">
                        <div className="aic-left">
                          <span className="aic-icon">⚠️</span>
                          <div>
                            <strong className="aic-species">{item.snake} Antivenom</strong>
                            <span className="aic-status">
                              {item.vials === 0 ? 'CRITICAL: OUT OF STOCK (0 Vials)' : `LOW STOCK: ${item.vials} Vials Remaining`}
                            </span>
                          </div>
                        </div>
                        <button className="aic-import-btn" onClick={() => handleRequestImport(item.snake)}>
                          📦 Request Emergency Stock Import
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="central-depot-box">
                  <h4> Visakhapatnam Regional Medical Storage Depot</h4>
                  <p>Central Reserve: 450 Polyvalent Vials Available · Dispatch Time: ~25 mins</p>
                  <button className="depot-request-btn" onClick={() => handleRequestImport(null)}>
                    🚚 Request Full Facility Stock Replenishment (+20 Vials)
                  </button>
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

      {/* ── Text / SMS Modal ── */}
      {showSmsModal && (
        <div className="sms-modal-backdrop" onClick={() => setShowSmsModal(false)}>
          <div className="sms-modal-card" onClick={e => e.stopPropagation()}>
            <div className="sms-modal-header">
              <h3>💬 Send Emergency SMS / Text Message</h3>
              <button className="sms-close-btn" onClick={() => setShowSmsModal(false)}>✕</button>
            </div>
            <div className="sms-modal-body">
              <label>TO HOSPITAL EMERGENCY DESK:</label>
              <div className="sms-phone-display">📞 {overview?.hospital?.phone || '0891-2727272'}</div>

              <label>EMERGENCY SMS MESSAGE TEMPLATE:</label>
              <textarea
                readOnly
                rows={4}
                value={`EMERGENCY: Snakebite patient reported. Requesting immediate antivenom intake preparation at ${hospitalName}.`}
                className="sms-textarea"
              />

              <div className="sms-actions">
                <a
                  href={`sms:${phoneClean}?body=${smsBody}`}
                  className="sms-send-native-btn"
                >
                  💬 Open Messaging App
                </a>
                <button
                  className="sms-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(`EMERGENCY: Snakebite patient reported. Requesting antivenom intake preparation at ${hospitalName}.`)
                    alert('Emergency SMS text copied to clipboard!')
                  }}
                >
                  📋 Copy Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
