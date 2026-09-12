import { Outlet, useLocation } from 'react-router-dom'
import { ShieldCheck, ChevronRight } from 'lucide-react'
import Sidebar from './Sidebar'
const titles = { '/': 'Overview', '/workspace': 'Analysis workspace', '/forecast': 'Forecast studio', '/threats': 'Browser threat log', '/monitoring': 'Traffic simulation' }
export default function Layout() {
  const { pathname } = useLocation()
  return <div className="app-layout"><a className="skip-link" href="#main">Skip to content</a><Sidebar /><main id="main" className="main-content">
    <div className="app-topbar"><span>Workspace <ChevronRight size={14} /><strong>{titles[pathname] || 'Page not found'}</strong></span><span><ShieldCheck size={15} /> SIH26153 <span className="topbar-divider" /> v2.1</span></div>
    <Outlet />
    <footer className="app-footer">ThreatForecast · Research prototype <span>ML classification + uncalibrated heuristic forecasting</span></footer>
  </main></div>
}
