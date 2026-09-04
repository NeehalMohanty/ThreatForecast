import {
  LayoutDashboard,
  ShieldAlert,
  Activity,
  Brain,
} from 'lucide-react'

import { NavLink } from 'react-router-dom'

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>CyberForecast</h2>

      <nav>
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? 'nav-item active' : 'nav-item'
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/threats"
          className={({ isActive }) =>
            isActive ? 'nav-item active' : 'nav-item'
          }
        >
          <ShieldAlert size={20} />
          <span>Threats</span>
        </NavLink>

        <NavLink
          to="/monitoring"
          className={({ isActive }) =>
            isActive ? 'nav-item active' : 'nav-item'
          }
        >
          <Activity size={20} />
          <span>Monitoring</span>
        </NavLink>

        <NavLink
          to="/forecast"
          className={({ isActive }) =>
            isActive ? 'nav-item active' : 'nav-item'
          }
        >
          <Brain size={20} />
          <span>Forecast</span>
        </NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar