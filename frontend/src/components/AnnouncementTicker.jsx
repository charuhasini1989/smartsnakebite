import { useState, useEffect } from 'react'

const MESSAGES = [
  // English
  "🐍 If bitten by a snake, keep calm and stay still — movement speeds up venom spread.",
  "🏥 Go to the nearest government hospital immediately — antivenom is available free of cost.",
  "🚫 Do NOT tie a cloth or rope above the bite — this worsens tissue damage.",
  "🚫 Do NOT cut the wound or suck the venom — this does not help and causes infection.",
  "🚫 Do NOT apply herbs, turmeric, or any paste on the bite site.",
  "📞 Call 108 immediately for a free ambulance anywhere in Andhra Pradesh and Telangana.",
  // Telugu
  "🐍 పాము కాటు వేస్తే — ప్రశాంతంగా ఉండండి, కదలకండి. కదలిక విషాన్ని వేగంగా వ్యాపింపజేస్తుంది.",
  "🏥 వెంటనే సమీపంలోని ప్రభుత్వ ఆసుపత్రికి వెళ్ళండి — యాంటీవెనమ్ ఉచితంగా అందుబాటులో ఉంది.",
  "🚫 కాటు పైన గుడ్డ లేదా తాడు కట్టకండి — ఇది కణజాల నష్టాన్ని పెంచుతుంది.",
  "🚫 కాటు చోట కోత పెట్టకండి లేదా నోటితో పీల్చకండి — ఇది సహాయం చేయదు.",
  "🚫 మూలికలు, పసుపు లేదా ఎలాంటి పేస్టు కాటు మీద వేయకండి.",
  "📞 108 కి వెంటనే కాల్ చేయండి — ఆంధ్రప్రదేశ్ మరియు తెలంగాణలో ఉచిత అంబులెన్స్.",
  // Hindi
  "🐍 सांप के काटने पर — शांत रहें और हिलें नहीं। हिलने से जहर तेजी से फैलता है।",
  "🏥 तुरंत नजदीकी सरकारी अस्पताल जाएं — एंटीवेनम मुफ्त में उपलब्ध है।",
  "🚫 काटे हुए स्थान के ऊपर कपड़ा या रस्सी न बांधें — इससे नुकसान बढ़ता है।",
  "🚫 घाव को न काटें और न मुंह से जहर चूसें — यह मदद नहीं करता।",
  "🚫 काटे हुए जगह पर जड़ी-बूटी, हल्दी या कोई लेप न लगाएं।",
  "📞 108 पर तुरंत कॉल करें — आंध्र प्रदेश और तेलंगाना में मुफ्त एम्बुलेंस।",
]

export default function AnnouncementTicker() {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % MESSAGES.length)
        setFade(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="ticker-wrap">
      <span className="ticker-tag">ADVISORY</span>
      <p className={`ticker-text ${fade ? 'fade-in' : 'fade-out'}`}>
        {MESSAGES[index]}
      </p>
    </div>
  )
}