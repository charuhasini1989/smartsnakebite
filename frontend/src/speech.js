/**
 * Native Multilingual Web Speech Synthesis (Telugu, Hindi, English)
 */
export function speakText(text, lang = 'en') {
  if (!('speechSynthesis' in window)) return

  // Cancel any active speech synthesis
  window.speechSynthesis.cancel()

  const speakNow = () => {
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()

    let selectedVoice = null

    if (lang === 'te') {
      // Prioritize authentic native Telugu voice engines
      selectedVoice = voices.find(v => v.lang === 'te-IN' || v.lang === 'te_IN')
        || voices.find(v => v.lang.startsWith('te') || v.name.toLowerCase().includes('telugu'))
        || voices.find(v => v.name.includes('Mohan') || v.name.includes('Google తెలుగు'))
        || voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'))
        || voices.find(v => v.lang.includes('IN'))
      utterance.lang = 'te-IN'
      utterance.rate = 0.88 // Slightly calmer rate for clear Telugu syllable articulation
    } else if (lang === 'hi') {
      selectedVoice = voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi_IN')
        || voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'))
        || voices.find(v => v.lang.includes('IN'))
      utterance.lang = 'hi-IN'
      utterance.rate = 0.90
    } else {
      selectedVoice = voices.find(v => v.lang === 'en-IN')
        || voices.find(v => v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('india'))
        || voices.find(v => v.lang.startsWith('en'))
      utterance.lang = 'en-US'
      utterance.rate = 0.95
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    speakNow()
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      speakNow()
      window.speechSynthesis.onvoiceschanged = null
    }
    setTimeout(speakNow, 250)
  }
}

export function generateEmergencySpeechText(data) {
  const lang = data.transcription?.language || 'en'
  const isHarmful = data.prediction?.label === 'HARMFUL'
  const topHospital = data.hospitals?.[0]

  if (isHarmful) {
    if (lang === 'hi') {
      let msg = `चेतावनी! हानिकारक प्रथा पाई गई है। कृपया इसे तुरंत हटाएं और अस्पताल जाएं। `
      if (topHospital) msg += `${topHospital.name} से एक एम्बुलेंस रवाना हो चुकी है। `
      msg += `कृपया मरीज का नाम और लोकेशन बताएं।`
      return msg
    } else if (lang === 'te') {
      let msg = `హెచ్చరిక! ప్రమాదకరమైన పద్ధతి గమనించబడింది. దయచేసి కట్టును వెంటనే తొలగించండి. దగ్గరలోని ఆసుపత్రికి వెళ్లండి. `
      if (topHospital) msg += `${topHospital.name} నుండి అంబులెన్స్ బయలుదేరింది. `
      msg += `దయచేసి రోగి పేరు మరియు స్థలం చెప్పండి.`
      return msg
    } else {
      let msg = `Warning! A harmful practice has been detected. Stop immediately and proceed to the hospital. `
      if (topHospital) msg += `An ambulance has been dispatched from ${topHospital.name}. `
      msg += `Please tell us the patient's name and current location.`
      return msg
    }
  } else {
    if (lang === 'hi') {
      return `कोई हानिकारक प्रथा नहीं मिली। सावधानी के लिए निकटतम अस्पताल जाएं। कृपया मरीज का नाम और लोकेशन बताएं।`
    } else if (lang === 'te') {
      return `హానికరమైన పద్ధతి ఏదీ లేదు. దయచేసి దగ్గరలోని ఆసుపత్రికి వెళ్లండి. దయచేసి రోగి పేరు మరియు స్థలం చెప్పండి.`
    } else {
      return `No harmful practice detected. Please proceed to the nearest hospital as a precaution. Please state the patient's name and location.`
    }
  }
}
