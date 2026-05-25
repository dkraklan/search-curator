import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthGate } from './components/AuthGate'
import ReviewQueue from './views/ReviewQueue'
import DomainReview from './views/DomainReview'
import CalibrationDashboard from './views/CalibrationDashboard'

export default function App() {
  return (
    <AuthGate>
      <Layout>
        <Routes>
          <Route path="/queue" element={<ReviewQueue />} />
          <Route path="/domains" element={<DomainReview />} />
          <Route path="/calibration" element={<CalibrationDashboard />} />
          <Route path="*" element={<Navigate to="/queue" replace />} />
        </Routes>
      </Layout>
    </AuthGate>
  )
}
