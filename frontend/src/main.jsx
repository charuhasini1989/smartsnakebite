import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import LandingPage from './components/LandingPage.jsx'
import App from './App.jsx'
import HospitalsIndex from './components/HospitalsIndex.jsx'
import HospitalDashboard from './components/HospitalDashboard.jsx'
import HospitalProfile from './components/HospitalProfile.jsx'
import NotFound from './components/NotFound.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/report" element={<App />} />
          <Route path="/hospitals" element={<HospitalsIndex />} />
          <Route path="/hospital" element={<HospitalDashboard />} />
          <Route path="/hospital/:name" element={<HospitalProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </StrictMode>
)
