import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck, AlertCircle, UserCheck, KeyRound, CreditCard } from 'lucide-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [authMethod, setAuthMethod] = useState('STANDARD'); // 'STANDARD' | 'SMARTCARD'
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
    if (authMethod === 'SMARTCARD') {
      return;
    }
    if (!identifier.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(identifier.trim(), password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-overlay" aria-hidden="true" />
      <section className="login-intro" aria-label="TRACEVAULT">
        <div className="login-brand">
          <span className="login-brand-mark">
            <ShieldCheck size={28} />
          </span>
          <span>
            <strong>TRACEVAULT</strong>
            <small className="mono">FORENSIC INTELLIGENCE PLATFORM · v3.8 LE</small>
          </span>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="mono" style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            GATEWAY SECURE : NOMINAL
          </div>
          <div className="mono" style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
            DOCKET PORTAL : ONLINE
          </div>
        </div>

        <p style={{ marginTop: '24px' }}>
          Multi-Rail Forensic Tracing & Attribution Platform.
          <br />
          Authoritative Evidence Enclave.
        </p>
        <span className="mono" style={{ fontSize: '11px', color: '#64748b' }}>
          National Cyber Forensic Infrastructure · LE Jurisdiction
        </span>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <header>
          <span className="login-security-mark">
            <LockKeyhole />
          </span>
          <div>
            <p className="mono" style={{ fontSize: '10px', color: '#24c7c9' }}>LE FORENSIC GATEWAY</p>
            <h1 id="login-title" style={{ fontSize: '18px' }}>Authorized Sign In</h1>
          </div>
        </header>

        {/* Authentication Mode Switcher */}
        <div style={{ display: 'flex', gap: '6px', margin: '14px 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
          <button
            type="button"
            className={`button ${authMethod === 'STANDARD' ? 'button-primary' : 'button-ghost'}`}
            style={{ fontSize: '10px', height: '28px' }}
            onClick={() => setAuthMethod('STANDARD')}
          >
            <KeyRound size={12} />
            <span>STANDARD ID / PASSPHRASE</span>
          </button>
          <button
            type="button"
            className={`button ${authMethod === 'SMARTCARD' ? 'button-primary' : 'button-ghost'}`}
            style={{ fontSize: '10px', height: '28px' }}
            onClick={() => setAuthMethod('SMARTCARD')}
          >
            <CreditCard size={12} />
            <span>SMARTCARD / CAC</span>
          </button>
        </div>

        {authMethod === 'SMARTCARD' ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', background: 'var(--color-surface-soft)', borderRadius: '4px', border: '1px dashed var(--color-border)', margin: '14px 0' }}>
            <CreditCard size={28} style={{ color: '#64748b', margin: '0 auto 8px' }} />
            <p className="mono" style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
              Interface unavailable in demonstration environment.
            </p>
            <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Please utilize Standard ID / Passphrase credentials to enter the workspace.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  marginBottom: 12,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: 4,
                  color: '#fca5a5',
                  fontSize: '11px'
                }}
                role="alert"
              >
                <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <label htmlFor="division-select" style={{ fontSize: '11px', color: '#94a3b8' }}>Designated Division</label>
            <select
              id="division-select"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              style={{
                width: '100%',
                height: '32px',
                padding: '0 8px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                color: 'var(--color-primary-text)',
                fontSize: '11px',
                marginBottom: '10px'
              }}
            >
              <option value="Central Cyber Forensic Cell">Central Cyber Forensic Cell</option>
              <option value="Economic Offences Wing">Economic Offences Wing</option>
              <option value="Financial Intelligence Unit">Financial Intelligence Unit</option>
            </select>

            <label htmlFor="investigator-id" style={{ fontSize: '11px', color: '#94a3b8' }}>Investigator Identifier</label>
            <input
              id="investigator-id"
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="investigator@tracevault.local"
              required
            />

            <label htmlFor="investigator-password" style={{ fontSize: '11px', color: '#94a3b8' }}>Password</label>
            <input
              id="investigator-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />

            <label className="remember-control">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span style={{ fontSize: '11px' }}>Remember session on this forensic station</span>
            </label>

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating...' : 'Sign In to Command Console'}
            </button>
          </form>
        )}

        {/* Statutory Notice Panel */}
        <div style={{
          marginTop: 14,
          padding: '8px 10px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid #1e293b',
          borderRadius: 4,
          fontSize: '9px',
          color: '#64748b',
          lineHeight: 1.4
        }}>
          <strong style={{ color: '#eab308', display: 'block', marginBottom: '2px' }}>STATUTORY NOTICE:</strong>
          Access restricted to authorized law enforcement and regulatory personnel under Section 91 CrPC / Bharatiya Sakshya Adhiniyam 2023. Unauthorized access is recorded and subject to prosecution under the Information Technology Act 2000.
        </div>
      </section>
    </main>
  );
}
