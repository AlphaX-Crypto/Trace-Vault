import React, { useState } from 'react';
import { ShieldCheck, LockKeyhole, AlertCircle, ArrowRight } from 'lucide-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [division, setDivision] = useState('Central Cyber Forensic Cell');
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
    <div className="gov-login-container">
      <div className="gov-login-card">
        <div className="gov-login-header">
          <div className="gov-login-emblem">
            <ShieldCheck size={24} />
          </div>
          <h1 className="gov-login-title">National Cyber Forensic Gateway</h1>
          <p className="gov-login-subtitle">Law Enforcement & Financial Intelligence Unit Access</p>
        </div>

        <div className="gov-login-body">
          {errorMessage && (
            <div style={{ padding: '8px 12px', background: 'var(--status-critical-bg)', color: 'var(--status-critical-text)', border: '1px solid var(--status-critical-border)', borderRadius: 'var(--radius-sm)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="gov-form-group">
              <label className="gov-form-label">Investigation Division / Unit</label>
              <select 
                className="gov-form-select"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
              >
                <option value="Central Cyber Forensic Cell">Central Cyber Forensic Cell</option>
                <option value="Financial Intelligence Unit (FIU-IND)">Financial Intelligence Unit (FIU-IND)</option>
                <option value="Economic Offences Wing (EOW)">Economic Offences Wing (EOW)</option>
                <option value="State Police Cyber Crime Division">State Police Cyber Crime Division</option>
              </select>
            </div>

            <div className="gov-form-group">
              <label className="gov-form-label">Authorized Officer ID / Email</label>
              <input
                className="gov-form-input mono"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="officer@agency.gov.in"
              />
            </div>

            <div className="gov-form-group">
              <label className="gov-form-label">Passcode / PKI Token</label>
              <input
                className="gov-form-input mono"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Maintain Secure Session (8h)
              </label>
              <span className="mono" style={{ color: 'var(--primary-color)', fontSize: '10px' }}>FIPS 140-3 HSM</span>
            </div>

            <button 
              type="submit" 
              className="gov-login-btn"
              disabled={isSubmitting}
            >
              <LockKeyhole size={14} />
              <span>{isSubmitting ? 'Authenticating Officer...' : 'Authenticate & Access Terminal'}</span>
            </button>
          </form>

          <div className="gov-login-notice">
            <strong>STATUTORY WARNING:</strong> This terminal is restricted to authorized law enforcement and regulatory personnel. Unauthorized access, monitoring, or copying is strictly prohibited and subject to legal prosecution under Section 43/66 of the Information Technology Act. All activities are cryptographically recorded in tamper-evident audit logs.
          </div>
        </div>
      </div>

      <div className="gov-login-footer">
        TRACEVAULT Forensic Intelligence Platform · Version 3.8 LE (FIPS 180-4 Compliant)
      </div>
    </div>
  );
}
