import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, Settings, ShieldAlert, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'cases', label: 'Case Registry', icon: Briefcase, path: '/cases' },
    { id: 'reports', label: 'Intelligence Reports', icon: FileText, path: '/reports' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <ShieldAlert size={28} className="brand-icon" />
        <div className="brand-text">
          <h1>TRACEVAULT</h1>
          <span className="brand-subtitle">CHAIN INTELLIGENCE</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.id} 
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="investigator-info">
          <div className="avatar">IN</div>
          <div className="details">
            <span className="name">Investigator 01</span>
            <span className="role">Cyber Cell</span>
          </div>
        </div>
        <NavLink to="/login" className="nav-item logout">
          <LogOut size={20} />
          <span>Logout</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
