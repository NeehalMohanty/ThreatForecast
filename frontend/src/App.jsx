import { Routes, Route } from 'react-router-dom'

import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Threats from './pages/Threats'
import Monitoring from './pages/Monitoring'
import Forecast from './pages/Forecast'

import './App.css'


function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
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
    </Routes>
  )
}

export default App