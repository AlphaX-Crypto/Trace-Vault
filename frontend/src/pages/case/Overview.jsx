import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, GitMerge, FileText, Activity } from 'lucide-react';
import { api } from '../../services/api';
import './Overview.css';

const Overview = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);

  useEffect(() => {
    api.getCase(caseId).then(setCaseData);
  }, [caseId]);

  if (!caseData) return <div className="loading mono">LOADING INTELLIGENCE DATA...</div>;

  return (
    <div className="overview-container">
      <div className="summary-grid">
        {/* Wallet Details */}
        <div className="card">
          <div className="card-header">
            <Activity size={18} className="icon" />
            <h3>Subject Wallet</h3>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="label">Address</span>
              <span className="value mono">{caseData.subjectWallet}</span>
            </div>
            <div className="info-row">
              <span className="label">Blockchain</span>
              <span className="value uppercase">{caseData.blockchain}</span>
            </div>
            <div className="info-row">
              <span className="label">Status</span>
              <span className="value">{caseData.status}</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="card risk-card">
          <div className="card-header">
            <AlertTriangle size={18} className="icon risk-icon" />
            <h3>Investigation Risk</h3>
          </div>
          <div className="card-body risk-body">
            <div className="risk-score-circle" data-level={caseData.riskLevel.toLowerCase()}>
              <span className="score">{caseData.riskScore}</span>
              <span className="max">/ 100</span>
            </div>
            <div className="risk-level">
              <span className={`badge ${caseData.riskLevel.toLowerCase()} large`}>
                {caseData.riskLevel} RISK
              </span>
            </div>
          </div>
        </div>

        {/* VASP Attribution */}
        <div className="card attribution-card">
          <div className="card-header">
            <Shield size={18} className="icon auth-icon" />
            <h3>Probable VASP Attribution</h3>
          </div>
          <div className="card-body">
            <div className="entity-name">{caseData.attribution.entity}</div>
            <div className="entity-type text-muted">{caseData.attribution.type}</div>
            
            <div className="confidence-meter mt-4">
              <div className="info-row">
                <span className="label">Attribution Confidence</span>
                <span className="value mono">{caseData.attribution.confidence}%</span>
              </div>
              <div className="meter-bar">
                <div 
                  className="meter-fill" 
                  style={{ width: `${caseData.attribution.confidence}%`, backgroundColor: 'var(--accent-primary)' }}
                ></div>
              </div>
            </div>
            <div className="info-row mt-2">
              <span className="label">Distance</span>
              <span className="value">{caseData.attribution.distance} hops</span>
            </div>
          </div>
        </div>
      </div>

      <div className="investigation-summary card mt-6">
        <div className="card-header">
          <FileText size={18} className="icon" />
          <h3>Investigation Summary</h3>
        </div>
        <div className="card-body">
          <p className="summary-text">{caseData.summary}</p>
          <div className="actions mt-4">
            <button className="btn btn-primary" onClick={() => navigate(`/cases/${caseId}/graph`)}>
              <GitMerge size={16} />
              Open Transaction Graph
            </button>
            <button className="btn btn-outline" onClick={() => navigate(`/cases/${caseId}/report`)}>
              View Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
