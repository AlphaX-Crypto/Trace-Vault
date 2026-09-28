import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, BriefcaseBusiness, Compass, FileText, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './layout.css'
import './sidebarAuth.css'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/investigations', label: 'Investigations', icon: Compass },
  { to: '/cases', label: 'Cases', icon: BriefcaseBusiness },
  { to: '/reports', label: 'Reports', icon: FileText }
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  async function handleSignOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'TV'
  const displayName = user?.username ? user.username.toUpperCase() : 'INVESTIGATOR'
  const roleDisplay = user?.role || 'INVESTIGATOR'

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><ShieldCheck /></span>
        <span className="brand-copy">
          <strong>TRACEVAULT</strong>
          <small>CHAIN INTELLIGENCE</small>
        </span>
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <p className="nav-label">Workspace</p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-context">
        <span className="context-pulse" />
        <div>
          <span>Intelligence index</span>
          <small>Operational</small>
        </div>
      </div>
      <div className="sidebar-user">
        <div className="avatar">{initials}</div>
        <div>
          <strong>{displayName}</strong>
          <small>{roleDisplay} · LE ID #{user?.id ? `832${user.id}` : '8327A'}</small>
        </div>
        <button
          className="sidebar-signout"
          type="button"
          aria-label="Sign out"
          title="Sign out"
          onClick={handleSignOut}
        >
          <LogOut />
        </button>
      </div>
    </aside>
  )
}

