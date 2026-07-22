import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet default marker icon broken in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export default function HospitalMap({ hospitals, userLocation }) {
  if (!hospitals || hospitals.length === 0) return null

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [hospitals[0].lat, hospitals[0].lng]

  return (
    <div className="map-section">
      <h3>Nearest Hospitals with Antivenom</h3>
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '350px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>📍 Your location</Popup>
          </Marker>
        )}
        {hospitals.map((h, i) => (
          <Marker key={i} position={[h.lat, h.lng]} icon={redIcon}>
            <Popup>
              <strong>{h.name}</strong><br />
              {h.address}<br />
              {h.antivenom ? '✅ Antivenom available' : '⚠️ No antivenom confirmed'}<br />
              📞 {h.phone}<br />
              📏 {h.distance_km} km away
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="hospital-list">
        {hospitals.map((h, i) => (
          <div key={i} className="hospital-card">
            <div className="hospital-rank">#{i + 1}</div>
            <div className="hospital-info">
              <p className="hospital-name">{h.name}</p>
              <p className="hospital-address">{h.address}</p>
              <p className="hospital-meta">
                {h.antivenom ? '✅ Antivenom' : '⚠️ No antivenom'} &nbsp;·&nbsp;
                📞 {h.phone} &nbsp;·&nbsp;
                📏 {h.distance_km} km
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}