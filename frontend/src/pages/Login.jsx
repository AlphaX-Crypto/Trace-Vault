import React, { useState } from 'react';
import { ShieldCheck, LockKeyhole, AlertCircle } from 'lucide-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [division, setDivision] = useState('Central Cyber Forensic Cell');
  const [credentialMode, setCredentialMode] = useState('OFFICER_CREDENTIALS');
  const [identifier, setIdentifier] = useState('investigator@tracevault.local');
  const [password, setPassword] = useState('Investigator@123');
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!identifier.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(identifier.trim(), password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid government personnel credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="tv-login-page anim-workspace">
      <div className="tv-login-container">
        {/* Brand & Mission Tagline */}
        <div className="tv-login-brand-header">
          <div className="tv-login-logo-box">
            <div className="tv-logo-square" />
          </div>
          <h1 className="tv-login-brand-title">TRACEVAULT</h1>
          <div className="tv-login-brand-subtitle mono">FORENSIC INTELLIGENCE PLATFORM</div>
          <div className="tv-login-tagline">
            FOLLOW THE MOVEMENT.<br />
            PRESERVE THE EVIDENCE.
          </div>
        </div>

        {/* Telemetry Status Ribbon */}
        <div className="tv-login-status-ribbon">
          <div className="tv-login-status-item">
            <span className="tv-login-status-dot" />
            <span className="mono">Gateway status: <strong>Online</strong></span>
          </div>
          <div className="tv-login-status-item">
            <span className="mono text-muted">Docket status: <strong>Active</strong></span>
          </div>
        </div>

        {/* Form Card */}
        <div className="tv-login-card">
          <div className="tv-login-card-header">
            <h2 className="tv-login-card-title">Investigator Sign In</h2>
            <span className="tv-login-card-sub mono">Authorized Personnel Access Only</span>
          </div>

          <div className="tv-login-card-body">
            {errorMessage && (
              <div className="tv-login-error">
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="tv-login-form">
              {/* Credential Mode */}
              <div className="tv-form-group">
                <label className="tv-form-label">CREDENTIAL MODE</label>
                <select
                  className="tv-form-select"
                  value={credentialMode}
                  onChange={(e) => setCredentialMode(e.target.value)}
                >
                  <option value="OFFICER_CREDENTIALS">Officer ID &amp; Password</option>
                  <option value="AGENCY_PKI">Agency PKI Token Session</option>
                </select>
              </div>

              {/* Division */}
              <div className="tv-form-group">
                <label className="tv-form-label">DIVISION</label>
                <select
                  className="tv-form-select"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                >
                  <option value="Central Cyber Forensic Cell">Central Cyber Forensic Cell</option>
                  <option value="Financial Intelligence Unit (FIU-IND)">Financial Intelligence Unit (FIU-IND)</option>
                  <option value="Economic Offences Wing (EOW)">Economic Offences Wing (EOW)</option>
                  <option value="State Police Cyber Crime Division">State Police Cyber Crime Division</option>
                </select>
              </div>

              {/* Authorized Officer ID */}
              <div className="tv-form-group">
                <label className="tv-form-label">AUTHORIZED OFFICER ID / EMAIL</label>
                <input
                  className="tv-form-input mono"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="officer@agency.gov.in"
                />
              </div>

              {/* Passcode */}
              <div className="tv-form-group">
                <label className="tv-form-label">PASSCODE / ACCESS KEY</label>
                <input
                  className="tv-form-input mono"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>

              {/* Remember Session */}
              <div className="tv-login-options-row">
                <label className="tv-checkbox-row">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Maintain session (8h)
                  </span>
                </label>
                <span className="mono text-muted" style={{ fontSize: '10px' }}>
                  SHA-256 Digest
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="tv-btn-login-submit"
                disabled={isSubmitting}
              >
                <LockKeyhole size={13} />
                <span>{isSubmitting ? 'Authenticating Officer...' : 'Authenticate & Access Terminal'}</span>
              </button>
            </form>

            {/* Legal Notice */}
            <div className="tv-login-legal-notice">
              <strong>STATUTORY LEGAL NOTICE:</strong> This terminal is restricted to authorized law enforcement and regulatory personnel. Unauthorized access, monitoring, or copying is strictly prohibited and subject to legal prosecution under the Information Technology Act. All access requests are cryptographically audited in tamper-evident logs.
            </div>
          </div>
        </div>

        {/* Technical Footer */}
        <div className="tv-login-technical-footer mono">
          TRACEVAULT Forensic Intelligence Platform · Version 3.8 LE (FIPS 180-4 Compliant)
        </div>
      </div>
    </div>
  );
}
