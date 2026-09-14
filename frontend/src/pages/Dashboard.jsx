import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldAlert, Zap, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    api.getCases().then(setRecentCases);
  }, []);

  const metrics = [
    { label: 'Active Cases', value: '14', icon: Activity, color: 'var(--accent-primary)' },
    { label: 'High Risk', value: '3', icon: AlertTriangle, color: 'var(--risk-high)' },
    { label: 'Traces Completed', value: '128', icon: Zap, color: 'var(--risk-low)' },
    { label: 'VASP Attributions', value: '45', icon: ShieldAlert, color: 'var(--accent-secondary)' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Intelligence Dashboard</h2>
        <button className="btn btn-primary" onClick={() => navigate('/cases/new')}>
          <span>New Investigation</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="metrics-grid">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="metric-card card">
              <div className="metric-icon" style={{ color: m.color, backgroundColor: `${m.color}20` }}>
                <Icon size={24} />
              </div>
              <div className="metric-info">
                <span className="metric-value mono">{m.value}</span>
                <span className="metric-label">{m.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        <div className="card recent-cases">
          <h3>Recent Investigations</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Subject Wallet</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map(c => (
                  <tr key={c.caseId}>
                    <td className="mono">{c.caseId}</td>
                    <td className="mono">{c.subjectWallet.slice(0, 10)}...{c.subjectWallet.slice(-4)}</td>
                    <td>
                      <span className={`badge ${c.riskLevel.toLowerCase()}`}>{c.riskLevel}</span>
                    </td>
                    <td>{c.status}</td>
                    <td>
                      <button className="btn btn-outline" onClick={() => navigate(`/cases/${c.caseId}`)}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card activity-feed">
          <h3>System Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot new"></div>
              <p>New disclosure request prepared for <strong>CASE-002</strong></p>
              <span className="time mono">10m ago</span>
            </div>
            <div className="activity-item">
              <div className="activity-dot"></div>
              <p>Analysis completed for wallet <strong>0x7a2...88d</strong></p>
              <span className="time mono">1h ago</span>
            </div>
            <div className="activity-item">
              <div className="activity-dot alert"></div>
              <p>High risk indicator detected in <strong>CASE-001</strong></p>
              <span className="time mono">2h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
