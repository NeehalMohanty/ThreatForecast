import { LayoutDashboard, ShieldAlert, Activity, Radar, ScanLine, Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'
const links = [
  ['/', 'Overview', LayoutDashboard], ['/workspace', 'Analysis workspace', ScanLine],
  ['/forecast', 'Forecast studio', Radar], ['/threats', 'Browser threat log', ShieldAlert],
  ['/monitoring', 'Traffic simulation', Activity],
]
export default function Sidebar() {
  return <aside className="sidebar">
    <NavLink to="/" className="brand"><span className="brand-symbol"><Shield size={22} /></span><span>Threat<span className="brand-light">Forecast</span><small>NETWORK INTELLIGENCE</small></span></NavLink>
    <p className="nav-caption">WORKSPACE</p>
    <nav aria-label="Main navigation">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
    <div className="sidebar-footer"><span className="project-badge">SIH 2026</span><strong>Predict. Investigate. Defend.</strong><p>SIH26153 · NTRO problem statement</p><span className="research-label"><span /> Research prototype</span></div>
  </aside>
}
