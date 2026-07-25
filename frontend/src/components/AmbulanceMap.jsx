import { Fragment } from 'react'
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

// Ambulance marker as a divIcon (emoji) — no extra image asset needed,
// and it's easy to spot moving among the other pins.
const ambulanceIcon = L.divIcon({
  className: 'ambulance-div-icon',
  html: '<div class="ambulance-emoji">🚑</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

export default function AmbulanceMap({ shipments, hospitalName }) {
  const active = (shipments || []).filter(s => s.status !== 'arrived')

  if (active.length === 0) return null

  const first = active[0]
  const center = [first.current_lat, first.current_lng]

  return (
    <div className="map-section">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: '340px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* Hospital origin — shown once, all shipments start here */}
        <Marker position={[first.origin_lat, first.origin_lng]} icon={hospitalIcon}>
          <Popup>🏥 {hospitalName}</Popup>
        </Marker>

        {active.map((s) => (
          <Fragment key={s.id}>
            <Polyline
              positions={[
                [s.origin_lat, s.origin_lng],
                [s.dest_lat, s.dest_lng],
              ]}
              pathOptions={{ color: '#0d7d6a', weight: 3, dashArray: '6 8', opacity: 0.7 }}
            />
            <Marker position={[s.dest_lat, s.dest_lng]} icon={patientIcon}>
              <Popup>📍 Patient location{s.case_id ? ` · Case #${s.case_id}` : ''}</Popup>
            </Marker>
            <Marker position={[s.current_lat, s.current_lng]} icon={ambulanceIcon}>
              <Popup>
                🚑 Shipment #{s.id}<br />
                {s.distance_remaining_km} km remaining · ETA {s.eta_minutes} min<br />
                🌡 {s.temperature_c}°C {s.cold_chain_breach ? '⚠ Cold-chain breach' : ''}
              </Popup>
            </Marker>
          </Fragment>
        ))}
      </MapContainer>
    </div>
  )
}
