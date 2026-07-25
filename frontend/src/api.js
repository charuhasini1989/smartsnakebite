import axios from 'axios'

export const predictText = async (text) => {
  const res = await axios.post('/api/predict', { text })
  return res.data
}

export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  const res = await axios.post('/api/transcribe', formData)
  return res.data
}

export const getNearestHospitals = async (lat, lng) => {
  const res = await axios.post('/api/hospitals', { lat, lng })
  return res.data
}

export const fullPipeline = async (audioBlob, lat, lng) => {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  const res = await axios.post(
    `/api/full-pipeline?lat=${lat}&lng=${lng}`,
    formData
  )
  return res.data
}

export const getHospitalsList = async (lat, lng) => {
  const query = (lat != null && lng != null) ? `?lat=${lat}&lng=${lng}` : ''
  const res = await axios.get(`/api/hospitals/list${query}`)
  return res.data
}