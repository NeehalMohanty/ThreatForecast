import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import Layout from './components/Layout'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Threats = lazy(() => import('./pages/Threats'))
const Monitoring = lazy(() => import('./pages/Monitoring'))
const Forecast = lazy(() => import('./pages/Forecast'))
const Workspace = lazy(() => import('./pages/Workspace'))

import './App.css'
import './ui.css'


function App() {
  return (
    <Suspense fallback={<p role="status" style={{ padding: 32 }}>Loading workspace…</p>}><Routes>
      <Route element={<Layout />}>
        <Route path="/workspace" element={<Workspace />} />
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/threats"
          element={<Threats />}
        />

        <Route
          path="/monitoring"
          element={<Monitoring />}
        />

        <Route
          path="/forecast"
          element={<Forecast />}
        />
      </Route>
    </Routes></Suspense>
  )
}

export default App
