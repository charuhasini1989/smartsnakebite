import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTitle } from './useTitle'
import VoiceRecorder from './components/VoiceRecorder'
import ResultCard from './components/ResultCard'
import HospitalMap from './components/HospitalMap'
import AnnouncementTicker from './components/AnnouncementTicker'
import { fullPipeline } from './api'
import './App.css'

const FOLLOWUP_PROMPT = {
  en: "Please tell us the patient's name and current location.",
  hi: 'कृपया मरीज़ का नाम और मौजूदा स्थान बताएं।',
  te: 'దయచేసి రోగి పేరు మరియు ప్రస్తుత ప్రదేశం చెప్పండి.',
}

const speakResponse = (data) => {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const lang = data.transcription?.language || 'en'
  const isHarmful = data.prediction?.label === 'HARMFUL'
  const topHospital = data.hospitals?.[0]

  let text = ''
  if (isHarmful) {
    if (lang === 'hi') {
      text = `चेतावनी! हानिकारक प्रथा पाई गई है। कृपया इसे तुरंत हटाएं और अस्पताल जाएं। `
      if (topHospital) text += `${topHospital.name} से एक एम्बुलेंस रवाना हो चुकी है। `
      text += `कृपया मरीज का नाम और लोकेशन बताएं।`
    } else if (lang === 'te') {
      text = `హెచ్చరిక! ప్రమాదకరమైన పద్ధతి గమనించబడింది. దయచేసి వెంటనే దీనిని తొలగించి ఆసుపత్రికి వెళ్ళండి. `
      if (topHospital) text += `${topHospital.name} నుండి అంబులెన్స్ బయలుదేరింది. `
      text += `దయచేసి రోగి పేరు మరియు స్థలం చెప్పండి.`
    } else {
      text = `Warning! A harmful practice has been detected. Stop immediately and proceed to the hospital. `
      if (topHospital) text += `An ambulance has been dispatched from ${topHospital.name}. `
      text += `Please tell us the patient's name and current location.`
    }
  } else {
    if (lang === 'hi') {
      text = `कोई हानिकारक प्रथा नहीं मिली। सावधानी के लिए अस्पताल जाएं। कृपया मरीज का नाम और लोकेशन बताएं।`
    } else if (lang === 'te') {
      text = `హానికరమైన పద్ధతి ఏదీ లేదు. దయచేసి ఆసుపత్రికి వెళ్ళండి. దయచేసి రోగి పేరు మరియు స్థలం చెప్పండి.`
    } else {
      text = `No harmful practice detected. Please proceed to the nearest hospital. Please state the patient's name and location.`
    }
  }

  const utterance = new SpeechSynthesisUtterance(text)
  if (lang === 'te') utterance.lang = 'te-IN'
  else if (lang === 'hi') utterance.lang = 'hi-IN'
  else utterance.lang = 'en-US'

  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

export default function App() {
  useTitle('Report a Snakebite — Voice Emergency First-Aid')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(false)

  // Conversation mode: stays open after the first result until the
  // user explicitly ends the session.
  const [caseId, setCaseId] = useState(null)
  const [conversation, setConversation] = useState([])
  const [sendingFollowup, setSendingFollowup] = useState(false)
  const [closing, setClosing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }),
      () => setUserLocation({ lat: 17.7231, lng: 83.3012 })
    )
  }, [])

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
    if (!caseId) return
    setClosing(true)
    try {
      await axios.post(`/api/cases/${caseId}/close`)
    } catch (err) {
      console.error('Failed to close case:', err)
    } finally {
      setClosing(false)
      setResult(null)
      setCaseId(null)
      setConversation([])
    }
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
                <span className="conversation-tag">● SESSION OPEN</span>
                <h2 style={{ marginTop: 10 }}>{FOLLOWUP_PROMPT[promptLang]}</h2>
                <p>Keep recording to add more details — name, location, anything useful
                   for the hospital. Tap End Session when you're done.</p>
              </div>
              <VoiceRecorder onResult={handleFollowup} disabled={sendingFollowup} />
              <button
                className="end-session-btn"
                onClick={handleEndSession}
                disabled={closing}
              >
                {closing ? 'Ending…' : '⏹ End Session'}
              </button>
            </>
          )}
        </section>

        {error && <div className="error-box">⚠️ {error}</div>}

        {result && (
          <div className="results-section">
            <ResultCard result={result} />
            <HospitalMap
              hospitals={result.hospitals}
              userLocation={userLocation}
              caseId={caseId || result.case_id}
            />

            {inConversation && conversation.length > 0 && (
              <section className="conversation-section">
                <span className="conversation-tag">Conversation so far</span>
                <div className="conversation-log">
                  {conversation.map((entry, i) => (
                    <div key={i} className="conversation-entry">
                      <span className="conversation-entry-lang">{entry.language?.toUpperCase()}</span>
                      <p>"{entry.transcript}"</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
