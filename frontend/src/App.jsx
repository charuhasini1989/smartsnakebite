import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTitle } from './useTitle'
import VoiceRecorder from './components/VoiceRecorder'
import ResultCard from './components/ResultCard'
import HospitalMap from './components/HospitalMap'
import AnnouncementTicker from './components/AnnouncementTicker'
import { fullPipeline } from './api'
import { speakText, generateEmergencySpeechText } from './speech'
import './App.css'

const FOLLOWUP_PROMPT = {
  en: "Please tell us the patient's name and current location.",
  hi: 'कृपया मरीज़ का नाम और मौजूदा स्थान बताएं।',
  te: 'దయచేసి రోగి పేరు మరియు ప్రస్తుత ప్రదేశం చెప్పండి.',
}

const speakResponse = (data) => {
  const lang = data.transcription?.language || 'en'
  const speechText = generateEmergencySpeechText(data)
  speakText(speechText, lang)
}

export default function App() {
  useTitle('Report a Snakebite — Voice Emergency First-Aid')

  // Persist session state across page navigation until explicitly ended
  const [result, setResult] = useState(() => {
    try {
      const saved = sessionStorage.getItem('smartsnakebite_result')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [caseId, setCaseId] = useState(() => {
    try {
      const saved = sessionStorage.getItem('smartsnakebite_caseId')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [conversation, setConversation] = useState(() => {
    try {
      const saved = sessionStorage.getItem('smartsnakebite_conversation')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sendingFollowup, setSendingFollowup] = useState(false)
  const [closing, setClosing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (result) sessionStorage.setItem('smartsnakebite_result', JSON.stringify(result))
    else sessionStorage.removeItem('smartsnakebite_result')
  }, [result])

  useEffect(() => {
    if (caseId) sessionStorage.setItem('smartsnakebite_caseId', JSON.stringify(caseId))
    else sessionStorage.removeItem('smartsnakebite_caseId')
  }, [caseId])

  useEffect(() => {
    if (conversation && conversation.length > 0) {
      sessionStorage.setItem('smartsnakebite_conversation', JSON.stringify(conversation))
    } else {
      sessionStorage.removeItem('smartsnakebite_conversation')
    }
  }, [conversation])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }),
      () => setUserLocation({ lat: 17.7231, lng: 83.3012 })
    )
  }, [])

  // Poll for hospital responses in real-time when a case is active
  useEffect(() => {
    if (!caseId) return

    const pollUpdates = async () => {
      try {
        const res = await axios.get(`/api/cases/${caseId}`)
        if (res.data?.case?.followups) {
          setConversation(res.data.case.followups)
        }
      } catch (err) {
        console.error('Failed to poll case updates:', err)
      }
    }

    pollUpdates()
    const interval = setInterval(pollUpdates, 3000)
    return () => clearInterval(interval)
  }, [caseId])

  const handleAudio = async (audioBlob) => {
    setError(null)
    setResult(null)
    setCaseId(null)
    setConversation([])
    setLoading(true)
    try {
      const lat = userLocation?.lat ?? 17.7231
      const lng = userLocation?.lng ?? 83.3012
      const data = await fullPipeline(audioBlob, lat, lng)
      setResult(data)
      setCaseId(data.case_id ?? null)
      speakResponse(data)
    } catch (err) {
      setError('Something went wrong. Make sure the backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollowup = async (audioBlob) => {
    if (!caseId) return
    setSendingFollowup(true)
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'followup.webm')
      const res = await axios.post(`/api/cases/${caseId}/followup`, formData)
      setConversation(prev => [...prev, res.data])
    } catch (err) {
      console.error('Failed to send follow-up:', err)
    } finally {
      setSendingFollowup(false)
    }
  }

  const handleEndSession = async () => {
    if (caseId) {
      setClosing(true)
      try {
        await axios.post(`/api/cases/${caseId}/close`)
      } catch (err) {
        console.error('Failed to close case:', err)
      } finally {
        setClosing(false)
      }
    }
    sessionStorage.removeItem('smartsnakebite_result')
    sessionStorage.removeItem('smartsnakebite_caseId')
    sessionStorage.removeItem('smartsnakebite_conversation')
    setResult(null)
    setCaseId(null)
    setConversation([])
  }

  const inConversation = !!caseId
  const promptLang = result?.transcription?.language in FOLLOWUP_PROMPT
    ? result.transcription.language
    : 'en'

  return (
    <div className="app">
      <AnnouncementTicker />

      <main className="app-main">

        <section className="voice-section">
          {!inConversation ? (
            <>
              <div className="voice-section-text">
                <h2>Speak to report a snakebite</h2>
                <p>Describe what first aid was given — in Telugu, Hindi, or English.
                   The system will detect harmful practices and find the nearest hospital.</p>
              </div>
              <VoiceRecorder onResult={handleAudio} />
              <p className="lang-note">తెలుగు · हिंदी · English</p>
              {loading && (
                <div className="processing-bar">
                  <div className="processing-fill" />
                  <span>Analysing speech...</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="voice-section-text">
                <span className="conversation-tag">● ACTIVE REPORT SESSION</span>
                <h2 style={{ marginTop: 10 }}>{FOLLOWUP_PROMPT[promptLang]}</h2>
                <p>Keep recording to add details. Hospital staff updates will appear below automatically. Tap End Session when finished.</p>
              </div>
              <VoiceRecorder onResult={handleFollowup} disabled={sendingFollowup} />
              <button
                className="end-session-btn"
                onClick={handleEndSession}
                disabled={closing}
              >
                {closing ? 'Ending…' : 'End Session'}
              </button>
            </>
          )}
        </section>

        {error && <div className="error-banner">{error}</div>}

        {result && (
          <>
            <ResultCard result={result} />

            {/* ── Two-Way Hospital & Patient Conversation Feed ── */}
            {conversation.length > 0 && (
              <section className="conversation-section">
                <h3>💬 Live Emergency Communications (Hospital & Patient)</h3>
                <div className="conversation-log">
                  {conversation.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`conversation-entry ${entry.sender === 'hospital' ? 'from-hospital-bubble' : 'from-patient-bubble'}`}
                    >
                      <div className="entry-meta">
                        <span className="entry-sender">
                          {entry.sender === 'hospital' ? '🏥 Hospital Staff Notification' : '🗣 You (Patient Voice Message)'}
                        </span>
                        <span className="entry-time">{entry.timestamp}</span>
                      </div>
                      <p className="entry-transcript">"{entry.transcript}"</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <HospitalMap
              hospitals={result.hospitals}
              userLocation={userLocation}
              caseId={caseId}
            />
          </>
        )}

      </main>
    </div>
  )
}
