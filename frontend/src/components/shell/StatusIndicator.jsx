import React from 'react';
import './StatusIndicator.css';

export default function StatusIndicator() {
  return (
    <footer className="tv-status-bar" role="contentinfo" aria-label="System Telemetry">
      <div className="status-left">
        <div className="telemetry-node">
          <span className="telemetry-dot" />
          <span className="telemetry-text technical">POSTGRESQL // CONNECTED</span>
        </div>
        <span className="telemetry-divider">•</span>
        <div className="telemetry-node">
          <span className="telemetry-text technical">NETWORKX ENGINE // 127.0.0.1:8000</span>
        </div>
        <span className="telemetry-divider">•</span>
        <div className="telemetry-node">
          <span className="telemetry-text technical">SEC 65B RFC 3161 // VERIFIED</span>
        </div>
      </div>

      <div className="status-right">
        <span className="telemetry-text technical text-muted">CENTRAL FORENSIC NODE // AUTHENTICATED LE ACCESS ONLY</span>
      </div>
    </footer>
  );
}
