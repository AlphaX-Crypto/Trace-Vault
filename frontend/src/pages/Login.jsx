import { useState } from 'react';
import { LockKeyhole, ShieldCheck, AlertCircle, UserCheck } from 'lucide-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Target path after login
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
      setErrorMessage(err.message || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function setDevCredentials(devUser, devPass) {
    setIdentifier(devUser);
    setPassword(devPass);
    setErrorMessage('');
  }

  return (
    <main className="login-page">
      <video
        className="login-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex="-1"
      >
        <source src="/videos/tracevault-login-bg.mp4" type="video/mp4" />
      </video>
      <div className="login-overlay" aria-hidden="true" />
      <section className="login-intro" aria-label="TRACEVAULT">
        <div className="login-brand">
          <span className="login-brand-mark">
            <ShieldCheck />
          </span>
          <span>
            <strong>TRACEVAULT</strong>
            <small>CHAIN INTELLIGENCE</small>
          </span>
        </div>
        <p>
          Follow the movement.
          <br />
          Preserve the evidence.
        </p>
        <span>Blockchain Intelligence & Financial Investigation Platform</span>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <header>
          <span className="login-security-mark">
            <LockKeyhole />
          </span>
          <div>
            <p>Secure Investigation Workspace</p>
            <h1 id="login-title">Investigator Sign In</h1>
          </div>
        </header>

        <p className="login-instruction">
          Enter your authorized credentials to access active cases, graph intelligence, and evidence records.
        </p>

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              marginBottom: 16,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: 6,
              color: '#fca5a5',
              fontSize: '0.85rem'
            }}
            role="alert"
          >
            <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="investigator-id">Email / Username</label>
          <input
            id="investigator-id"
            name="identifier"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="investigator@tracevault.local"
            required
            autoFocus
          />

          <label htmlFor="investigator-password">Password</label>
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
            <span>Remember session on this device</span>
          </label>

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="login-access-note">
          <ShieldCheck />
          <span>
            <strong>Authorized access only.</strong> Activity within this environment is cryptographically audited and recorded.
          </span>
        </div>

        {/* Development Seed Credentials Helper */}
        <div style={{
          marginTop: 16,
          padding: '10px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid #334155',
          borderRadius: 6,
          fontSize: '0.75rem',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#38bdf8' }}>
            <UserCheck style={{ width: 14, height: 14 }} />
            <strong>DEV ONLY — Quick Credentials:</strong>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setDevCredentials('investigator@tracevault.local', 'Investigator@123')}
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #475569',
                padding: '3px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Investigator
            </button>
            <button
              type="button"
              onClick={() => setDevCredentials('supervisor@tracevault.local', 'Supervisor@123')}
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #475569',
                padding: '3px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Supervisor
            </button>
            <button
              type="button"
              onClick={() => setDevCredentials('admin@tracevault.local', 'Admin@123')}
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #475569',
                padding: '3px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Admin
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
