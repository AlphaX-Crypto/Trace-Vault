import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  GitFork,
  FileSpreadsheet,
  Radar,
  FileLock2,
  UserCheck2,
  LayoutDashboard,
  FolderOpen,
  SearchCode,
  ShieldAlert,
  Building2,
  Scale,
  History
} from 'lucide-react';
import './layout.css';

export default function Sidebar() {
  return (
    <aside className="forensic-sidebar" aria-label="Forensic Navigation">
      <div>
        {/* Top Corridor Box matching screenshot */}
        <div className="sidebar-corridor-box">
          <div className="corridor-header">
            <span>CORRIDOR SEC_65B</span>
            <span className="corridor-dot" />
          </div>
          <div className="corridor-hash">
            HASH: SHA256//98AE...44BC
          </div>
        </div>

        {/* 5 Primary Forensic Modules from screenshot */}
        <div className="sidebar-nav-list">
          <NavLink
            to="/graph"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <GitFork size={15} />
            <span>1. Hop Architecture (Graph)</span>
          </NavLink>

          <NavLink
            to="/ledger"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <FileSpreadsheet size={15} />
            <span>2. Audit Ledger (Sec 65B)</span>
          </NavLink>

          <NavLink
            to="/geospatial"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Radar size={15} />
            <span>3. Geospatial Radar</span>
          </NavLink>

          <NavLink
            to="/evidence"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <FileLock2 size={15} />
            <span>4. Evidence Locker</span>
          </NavLink>

          <NavLink
            to="/entity"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <UserCheck2 size={15} />
            <span>5. Entity Dossier</span>
          </NavLink>
        </div>

        <div className="sidebar-nav-divider" />

        {/* Supporting Investigation Consoles */}
        <div className="sidebar-secondary-title">ADDITIONAL CONSOLES</div>
        <div className="sidebar-nav-list">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sidebar-secondary-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={13} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/cases"
            className={({ isActive }) => `sidebar-secondary-item ${isActive ? 'active' : ''}`}
          >
            <FolderOpen size={13} />
            <span>Cases Ledger</span>
          </NavLink>

          <NavLink
            to="/investigations"
            className={({ isActive }) => `sidebar-secondary-item ${isActive ? 'active' : ''}`}
          >
            <SearchCode size={13} />
            <span>Investigations Catalog</span>
          </NavLink>

          <NavLink
            to="/risk"
            className={({ isActive }) => `sidebar-secondary-item ${isActive ? 'active' : ''}`}
          >
            <ShieldAlert size={13} />
            <span>Risk Intelligence</span>
          </NavLink>

          <NavLink
            to="/vasp"
            className={({ isActive }) => `sidebar-secondary-item ${isActive ? 'active' : ''}`}
          >
            <Building2 size={13} />
            <span>VASP Attribution</span>
          </NavLink>

          <NavLink
            to="/disclosure"
            className={({ isActive }) => `sidebar-secondary-item ${isActive ? 'active' : ''}`}
          >
            <Scale size={13} />
            <span>Disclosure / SAHYOG</span>
          </NavLink>

          <NavLink
            to="/audit"
            className={({ isActive }) => `sidebar-secondary-item ${isActive ? 'active' : ''}`}
          >
            <History size={13} />
            <span>Audit Activity</span>
          </NavLink>
        </div>
      </div>

      {/* Bottom Integrity Box matching screenshot */}
      <div className="sidebar-bottom-status">
        <div className="bottom-status-row">
          <span>EVIDENCE INTEGRITY</span>
          <strong className="sealed">100% SEALED</strong>
        </div>
        <div className="bottom-status-row">
          <span>NODE ID: LE-BLR-04</span>
          <strong className="value">CHAIN: BTC/UPI</strong>
        </div>
      </div>
    </aside>
  );
}
