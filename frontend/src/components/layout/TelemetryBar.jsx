import React from 'react';
import { Activity, ShieldCheck, Database, Server, Cpu } from 'lucide-react';
import './layout.css';

export default function TelemetryBar() {
  return (
    <footer className="telemetry-bar" aria-label="System telemetry">
      <div className="telemetry-group">
        <span className="telemetry-pill live">
          <span className="telemetry-pulse" />
          GATEWAY: <strong>TLS 1.3 SECURE</strong>
        </span>
        <span className="telemetry-divider">|</span>
        <span className="telemetry-item">
          DOCKET: <strong>POSTGRESQL (NOMINAL)</strong>
        </span>
        <span className="telemetry-divider">|</span>
        <span className="telemetry-item">
          INTELLIGENCE: <strong>FASTAPI NETWORKX (ONLINE · 12ms)</strong>
        </span>
      </div>

      <div className="telemetry-group">
        <span className="telemetry-item">
          RAILS: <strong>EVM · UPI · GEO-IP</strong>
        </span>
        <span className="telemetry-divider">|</span>
        <span className="telemetry-item">
          AUDIT STREAM: <strong>APPEND-ONLY ACTIVE</strong>
        </span>
        <span className="telemetry-divider">|</span>
        <span className="telemetry-item mono">
          SESSION: <strong>SES-8327-LE</strong>
        </span>
      </div>
    </footer>
  );
}
