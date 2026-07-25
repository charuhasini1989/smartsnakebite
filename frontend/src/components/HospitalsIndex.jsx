import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getHospitalsList } from '../api'
import { useTitle } from '../useTitle'
import './HospitalsIndex.css'

// Fix leaflet default marker icon in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export default function HospitalsIndex() {
  useTitle('Hospitals Directory — Antivenom Availability')

  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('ALL') // ALL | STOCKED | UNSTOCKED
  const [typeFilter, setTypeFilter] = useState('ALL')   // ALL | Government | PHC | CHC
  const [sortBy, setSortBy] = useState('name')         // name | stock | distance

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        fetchHospitals(loc.lat, loc.lng)
      },
      () => {
        // Fallback default coordinates (Visakhapatnam area)
        fetchHospitals(17.7231, 83.3012)
      }
    )
  }, [])

  const fetchHospitals = async (lat, lng) => {
    try {
      const data = await getHospitalsList(lat, lng)
      setHospitals(data.hospitals || [])
    } catch (err) {
      console.error('Failed to load hospitals:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase())

    const matchesStock =
      stockFilter === 'ALL'
        ? true
        : stockFilter === 'STOCKED'
        ? h.antivenom_stock > 0
        : h.antivenom_stock === 0

    const matchesType =
      typeFilter === 'ALL' ? true : h.type === typeFilter

    return matchesSearch && matchesStock && matchesType
  }).sort((a, b) => {
    if (sortBy === 'stock') return b.antivenom_stock - a.antivenom_stock
    if (sortBy === 'distance') return (a.distance_km ?? 999) - (b.distance_km ?? 999)
    return a.name.localeCompare(b.name)
  })

  const totalStocked = hospitals.filter(h => h.antivenom_stock > 0).length

  return (
    <div className="hospitals-index-page">
      <div className="hi-header">
        <div className="hi-container">
          <div className="hi-header-text">
            <span className="hi-badge">HEALTHCARE NETWORK</span>
            <h1>Regional Antivenom Hospital Directory</h1>
            <p>
              Browse all {hospitals.length} registered government hospitals, PHCs, and CHCs across Visakhapatnam and Alluri Sitharama Raju districts. Check live antivenom stock, ambulance availability, and view detailed profiles.
            </p>
          </div>

          <div className="hi-stats-grid">
            <div className="hi-stat-card">
              <span className="hi-stat-val">{hospitals.length}</span>
              <span className="hi-stat-lbl">Total Facilities</span>
            </div>
            <div className="hi-stat-card green">
              <span className="hi-stat-val">{totalStocked}</span>
              <span className="hi-stat-lbl">Antivenom Stocked</span>
            </div>
            <div className="hi-stat-card red">
              <span className="hi-stat-val">{hospitals.length - totalStocked}</span>
              <span className="hi-stat-lbl">Out of Stock / PHCs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hi-main hi-container">
        {/* Controls Bar */}
        <div className="hi-toolbar">
          <div className="hi-search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by hospital name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
          </div>

          <div className="hi-filters">
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="ALL">All Stock Statuses</option>
              <option value="STOCKED">🧪 Antivenom Available</option>
              <option value="UNSTOCKED">⚠️ Out of Stock / Referral Only</option>
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="ALL">All Facility Types</option>
              <option value="Government">Government Hospitals</option>
              <option value="CHC">Community Health Centers (CHC)</option>
              <option value="PHC">Primary Health Centers (PHC)</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort: Name (A–Z)</option>
              <option value="stock">Sort: Highest Antivenom Stock</option>
              {userLocation && <option value="distance">Sort: Nearest to Me</option>}
            </select>
          </div>
        </div>

        {/* Map View Toggle Section */}
        {filteredHospitals.length > 0 && (
          <div className="hi-map-wrapper">
            <MapContainer
              center={userLocation ? [userLocation.lat, userLocation.lng] : [17.7231, 83.3012]}
              zoom={9}
              style={{ height: '320px', width: '100%', borderRadius: '12px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>📍 Your reported position</Popup>
                </Marker>
              )}
              {filteredHospitals.map((h, i) => (
                <Marker
                  key={i}
                  position={[h.lat, h.lng]}
                  icon={h.antivenom_stock > 0 ? greenIcon : redIcon}
                >
                  <Popup>
                    <strong>{h.name}</strong><br />
                    {h.address}<br />
                    🧪 Stock: {h.antivenom_stock} vials<br />
                    🚑 Ambulances: {h.ambulance_available}/{h.ambulance_total}<br />
                    <Link to={`/hospital/${encodeURIComponent(h.name)}`}>View Profile →</Link>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Hospital Card Grid */}
        {loading ? (
          <div className="hi-loading">Loading hospital directory…</div>
        ) : filteredHospitals.length === 0 ? (
          <div className="hi-empty">
            No hospital matches your search criteria. Try clearing filters.
          </div>
        ) : (
          <div className="hi-grid">
            {filteredHospitals.map((h, i) => {
              const isStocked = h.antivenom_stock > 0
              const stockClass = isStocked ? (h.antivenom_stock <= 3 ? 'low-stock' : 'in-stock') : 'no-stock'
              const stockLabel = isStocked
                ? `${h.antivenom_stock} Vials in Stock`
                : 'No Antivenom Stock'

              return (
                <div key={i} className="hi-card">
                  <div className="hi-card-header">
                    <div>
                      <span className="hi-type-tag">{h.type}</span>
                      <h3 className="hi-name">{h.name}</h3>
                    </div>
                    <span className={`hi-stock-badge ${stockClass}`}>
                      {isStocked ? '🧪' : '⚠️'} {stockLabel}
                    </span>
                  </div>

                  <p className="hi-address">📍 {h.address}</p>

                  <div className="hi-metrics-row">
                    <div className="hi-metric">
                      <span className="metric-lbl">Ambulances</span>
                      <span className="metric-val">🚑 {h.ambulance_available}/{h.ambulance_total} free</span>
                    </div>
                    <div className="hi-metric">
                      <span className="metric-lbl">Beds / Patients</span>
                      <span className="metric-val">🛏 {h.current_patients}/{h.capacity}</span>
                    </div>
                    {h.distance_km != null && (
                      <div className="hi-metric">
                        <span className="metric-lbl">Distance & Travel</span>
                        <span className="metric-val">📏 {h.distance_km} km (~{h.travel_minutes}m)</span>
                      </div>
                    )}
                  </div>

                  <div className="hi-card-footer">
                    {h.phone ? (
                      <span className="hi-phone">📞 {h.phone}</span>
                    ) : (
                      <span className="hi-phone mute">Phone not listed</span>
                    )}

                    <Link
                      to={`/hospital/${encodeURIComponent(h.name)}`}
                      className="hi-profile-link"
                    >
                      View Hospital Profile →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
