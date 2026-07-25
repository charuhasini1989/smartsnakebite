import { useState, useEffect } from 'react'
import axios from 'axios'
import AmbulanceMap from './AmbulanceMap'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet default marker icon broken in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const patientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export default function HospitalMap({ hospitals, userLocation, caseId }) {
  const [shipments, setShipments] = useState([])

  if (!hospitals || hospitals.length === 0) return null

  // SINGLE assigned hospital (Rank #1 top match)
  const assignedHospital = hospitals[0]

  useEffect(() => {
    if (!assignedHospital) return

    const fetchAmbulances = async () => {
      try {
        const encoded = encodeURIComponent(assignedHospital.name)
        const res = await axios.get(`/api/hospitals/${encoded}/ambulances`)
        setShipments(res.data.shipments || [])
      } catch (err) {
        console.error('Failed to fetch ambulance shipments:', err)
      }
    }

    fetchAmbulances()
    const interval = setInterval(fetchAmbulances, 3000)
    return () => clearInterval(interval)
  }, [assignedHospital?.name])

  const activeShipments = shipments.filter(s => s.status !== 'arrived')
  const hasActiveAmbulance = activeShipments.length > 0

  return (
    <div className="map-section assigned-hospital-section">
      <div className="assigned-map-header">
        <span className="assigned-tag">🚑 LIVE EMERGENCY ROUTE & AMBULANCE DISPATCH</span>
        <h3>Assigned Hospital & Live Ambulance Tracking</h3>
      </div>

      {/* Map View */}
      {hasActiveAmbulance ? (
        <AmbulanceMap shipments={shipments} hospitalName={assignedHospital.name} />
      ) : (
        <div className="map-wrapper" style={{ marginTop: '12px' }}>
          <MapContainer
            center={userLocation ? [userLocation.lat, userLocation.lng] : [assignedHospital.lat, assignedHospital.lng]}
            zoom={11}
            style={{ height: '340px', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={patientIcon}>
                <Popup>📍 Your reported location</Popup>
              </Marker>
            )}
            <Marker position={[assignedHospital.lat, assignedHospital.lng]} icon={hospitalIcon}>
              <Popup>
                🏥 <strong>{assignedHospital.name}</strong><br />
                {assignedHospital.address}<br />
                📞 {assignedHospital.phone}
              </Popup>
            </Marker>
            {userLocation && (
              <Polyline
                positions={[
                  [userLocation.lat, userLocation.lng],
                  [assignedHospital.lat, assignedHospital.lng],
                ]}
                pathOptions={{ color: '#0d7d6a', weight: 3, dashArray: '6 8' }}
              />
            )}
          </MapContainer>
        </div>
      )}

      {/* Single Assigned Hospital Card */}
      <div className="assigned-hospital-single-card">
        <div className="ah-card-header">
          <div className="ah-header-left">
            <span className="ah-rank-badge">RANK #1 ASSIGNED HOSPITAL</span>
            <h2 className="ah-title">🏥 {assignedHospital.name}</h2>
            <p className="ah-address">📍 {assignedHospital.address}</p>
          </div>
          <div className="ah-header-right">
            <span className="ah-stock-pill">
              {assignedHospital.antivenom ? `🧪 ${assignedHospital.antivenom_stock} Vials` : '⚠️ No Stock'}
            </span>
          </div>
        </div>

        <div className="ah-metrics-bar">
          <div className="ah-metric">
            <span className="metric-label">DISTANCE</span>
            <span className="metric-value">📏 {assignedHospital.distance_km} km</span>
          </div>
          <div className="ah-metric">
            <span className="metric-label">ESTIMATED TRAVEL</span>
            <span className="metric-value">⏱ ~{Math.round(assignedHospital.travel_minutes)} min</span>
          </div>
          <div className="ah-metric">
            <span className="metric-label">AMBULANCE STATUS</span>
            <span className="metric-value">
              {hasActiveAmbulance ? '🚑 En Route (Live)' : `🚑 ${assignedHospital.ambulance_available} Free`}
            </span>
          </div>
        </div>

        {/* Direct Call Button */}
        <div className="ah-call-section">
          <a
            href={`tel:${assignedHospital.phone ? assignedHospital.phone.replace(/[^0-9]/g, '') : '108'}`}
            className="call-hospital-now-btn"
          >
            📞 Call {assignedHospital.name} Immediately ({assignedHospital.phone || '108'})
          </a>
        </div>
      </div>
    </div>
  )
}