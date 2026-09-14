import React from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { Activity, GitMerge, FileText, AlertTriangle, Database } from 'lucide-react';
import './CaseLayout.css';

const CaseLayout = () => {
  const { caseId } = useParams();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity, path: `/cases/${caseId}/overview` },
    { id: 'graph', label: 'Transaction Graph', icon: GitMerge, path: `/cases/${caseId}/graph` },
    { id: 'attribution', label: 'Attribution & Risk', icon: AlertTriangle, path: `/cases/${caseId}/attribution` },
    { id: 'evidence', label: 'Evidence Register', icon: Database, path: `/cases/${caseId}/evidence` },
    { id: 'report', label: 'Investigation Report', icon: FileText, path: `/cases/${caseId}/report` }
  ];

  return (
    <div className="case-layout">
      <div className="case-header card">
        <div className="case-title">
          <span className="case-id">{caseId}</span>
          <h2>Investigation Overview</h2>
        </div>
        <div className="case-actions">
          <span className="badge high">High Risk</span>
          <span className="badge medium">Pending Review</span>
        </div>
      </div>
      
      <div className="case-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink 
              key={tab.id} 
              to={tab.path}
              className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      <div className="case-content">
        <Outlet />
      </div>
    </div>
  );
};

export default CaseLayout;
