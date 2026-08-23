import { speakText, generateEmergencySpeechText } from '../speech'

export default function ResultCard({ result }) {
  if (!result) return null

  const isHarmful = result.prediction.label === 'HARMFUL'
  const lang = result.transcription?.language || 'en'

  const handleReplayVoice = () => {
    const text = generateEmergencySpeechText(result)
    speakText(text, lang)
  }

  return (
    <div className={`result-card ${isHarmful ? 'harmful' : 'safe'}`}>
      <div className="result-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="result-icon">{isHarmful ? '🚨' : '✅'}</span>
          <span className="result-label">{result.prediction.label}</span>
          <span className="result-confidence">
            {result.prediction.confidence}% confidence
          </span>
        </div>

        <button className="replay-voice-btn" onClick={handleReplayVoice} title="Replay voice guidance audio">
          🔊 Replay Audio Guidance
        </button>
      </div>

      {result.transcription && (
        <div className="transcript-box">
          <p className="transcript-label">Heard:</p>
          <p className="transcript-text">"{result.transcription.transcript}"</p>
          <p className="transcript-lang">
            Language detected: {result.transcription.language?.toUpperCase()}
          </p>
        </div>
      )}

      {isHarmful && result.prediction.message && (
        <div className="corrective-message">
          <p>⚠️ {result.prediction.message}</p>
        </div>
      )}
    </div>
  )
}