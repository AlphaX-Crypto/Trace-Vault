import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, AlertTriangle, Info, Map } from 'lucide-react';
import { api } from '../../services/api';
import './Attribution.css';

const Attribution = () => {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);

  useEffect(() => {
    api.getCase(caseId).then(setCaseData);
  }, [caseId]);

  if (!caseData) return <div className="loading mono">LOADING...</div>;

  return (
    <div className="attribution-container">
      <div className="info-banner mb-6">
        <Info size={18} className="icon" />
        <p>Attribution is evidence-based and should be reviewed by an investigator. It indicates the probable destination entity.</p>
      </div>

      <div className="attribution-grid">
        <div className="card">
          <div className="card-header">
            <Shield size={18} className="icon auth-icon" />
            <h3>Likely VASP Attribution</h3>
          </div>
          <div className="card-body text-center py-6">
            <h2 className="entity-name-large">{caseData.attribution.entity}</h2>
            <p className="entity-type-large text-muted">{caseData.attribution.type}</p>
            
            <div className="confidence-large mt-6">
              <span className="label">Confidence Score</span>
              <span className="value mono">{caseData.attribution.confidence}%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <AlertTriangle size={18} className="icon risk-icon" />
            <h3>Investigation Risk Indicators</h3>
          </div>
          <div className="card-body">
            <div className="risk-level-banner" data-level={caseData.riskLevel.toLowerCase()}>
              <span className="score mono">{caseData.riskScore}</span>
              <span className="level">{caseData.riskLevel} RISK</span>
            </div>
            
            <ul className="indicators-list mt-4">
              <li>
                <span className="indicator-dot high"></span>
                Rapid Movement (&lt; 5 mins)
              </li>
              <li>
                <span className="indicator-dot high"></span>
                Mixer Interaction
              </li>
              <li>
                <span className="indicator-dot medium"></span>
                Multiple Hops (3)
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-header">
          <Map size={18} className="icon" />
          <h3>Attribution Path Summary</h3>
        </div>
        <div className="card-body">
          <div className="path-visualizer">
            <div className="path-node source">Subject</div>
            <div className="path-line"></div>
            <div className="path-node">Int. 1</div>
            <div className="path-line"></div>
            <div className="path-node deposit">Deposit</div>
            <div className="path-line"></div>
            <div className="path-node vasp">{caseData.attribution.entity}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attribution;
