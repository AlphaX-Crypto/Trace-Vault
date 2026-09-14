import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import './AnalysisProgress.css';

const stages = [
  'Validating wallet',
  'Fetching transactions',
  'Normalizing transactions',
  'Building transaction graph',
  'Tracing transaction paths',
  'Identifying VASP',
  'Calculating risk',
  'Calculating attribution confidence',
  'Preparing evidence'
];

const AnalysisProgress = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (currentStage < stages.length) {
      const timer = setTimeout(() => {
        setCurrentStage(prev => prev + 1);
      }, 800 + Math.random() * 800); // 0.8s to 1.6s per stage
      return () => clearTimeout(timer);
    } else {
      // Analysis complete
      setTimeout(() => {
        navigate(`/cases/${caseId}/overview`);
      }, 1000);
    }
  }, [currentStage, caseId, navigate]);

  return (
    <div className="analysis-progress-container">
      <div className="card progress-card">
        <div className="progress-header">
          <h2>Intelligence Engine Analysis</h2>
          <span className="mono text-muted">CASE ID: {caseId}</span>
        </div>

        <div className="progress-stages">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            const isPending = index > currentStage;

            return (
              <div key={index} className={`stage-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="stage-icon">
                  {isCompleted && <CheckCircle2 size={24} className="icon-success" />}
                  {isCurrent && <Loader2 size={24} className="icon-loading spin" />}
                  {isPending && <Circle size={24} className="icon-pending" />}
                </div>
                <div className="stage-details">
                  <span className="stage-name">{stage}</span>
                  {isCurrent && <span className="stage-status mono">PROCESSING...</span>}
                  {isCompleted && <span className="stage-status mono success">DONE</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgress;
