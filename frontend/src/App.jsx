import { useState, useEffect } from 'react'
import VoiceRecorder from './components/VoiceRecorder'
import ResultCard from './components/ResultCard'
import HospitalMap from './components/HospitalMap'
import { fullPipeline } from './api'
import './App.css'

export default function App() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }),
      () => setUserLocation({ lat: 17.7231, lng: 83.3012 }) // fallback: Visakhapatnam
    )
  }, [])

  const handleAudio = async (audioBlob) => {
    setError(null)
    setResult(null)
    try {
      const lat = userLocation?.lat ?? 17.7231
      const lng = userLocation?.lng ?? 83.3012
      const data = await fullPipeline(audioBlob, lat, lng)
      setResult(data)
    } catch (err) {
      setError('Something went wrong. Make sure the backend is running.')
      console.error(err)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>🐍 SmartSnakebite</h1>
            <span className="header-badge">H-M2 Live</span>
        </div>
        <p className="subtitle">
              Speak in Telugu, Hindi, or English — harmful first aid practices are
              detected in real time and the nearest antivenom hospital is shown.
        </p>
      </header>

      <main className="app-main">
        <section className="recorder-section">
        <p className="recorder-label">Voice Input</p>
          <VoiceRecorder onResult={handleAudio} />
        <p className="lang-note">Supports Telugu · Hindi · English</p>
        </section>

        {error && (
          <div className="error-box">⚠️ {error}</div>
        )}

        {result && (
          <>
            <ResultCard result={result} />
            <HospitalMap
              hospitals={result.hospitals}
              userLocation={userLocation}
            />
          </>
        )}
      </main>
    </div>
  )
}