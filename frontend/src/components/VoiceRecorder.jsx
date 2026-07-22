import { useState, useRef } from 'react'

export default function VoiceRecorder({ onResult }) {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setProcessing(true)
      try {
        await onResult(audioBlob)
      } finally {
        setProcessing(false)
      }
      stream.getTracks().forEach(t => t.stop())
    }

    mediaRecorder.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="recorder">
      <button
        className={`mic-btn ${recording ? 'recording' : ''}`}
        onClick={recording ? stopRecording : startRecording}
        disabled={processing}
      >
        {processing ? '⏳ Processing...' : recording ? '⏹ Stop' : '🎙 Speak'}
      </button>
      {recording && (
        <p className="recording-hint">Recording... speak now and press Stop when done.</p>
      )}
    </div>
  )
}