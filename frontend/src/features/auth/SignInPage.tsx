import React, { useState } from 'react';

interface SignInPageProps {
  onSignInSuccess: () => void;
  onReturnHome: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onSignInSuccess,
  onReturnHome
}) => {
  const [email, setEmail] = useState('investigator@tracevault.com');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignInSuccess();
  };

  return (
    <div className="signin-root">
      {/* Top Simple Brand Bar */}
      <header className="signin-topbar">
        <button type="button" onClick={onReturnHome} className="btn-brand-back">
          ← Return to TraceVault
        </button>
      </header>

      {/* Center Split Container Mirroring Reference 3 */}
      <main className="signin-split-layout">
        {/* Left Form Section */}
        <div className="signin-form-col">
          <div className="signin-card">
            <div className="card-header">
              <div className="brand-logo-badge">
                <div className="brand-circle">TV</div>
                <span className="brand-title">TraceVault</span>
              </div>
              <h1 className="signin-title">Sign in</h1>
              <p className="signin-subtitle">Enter your workstation credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="signin-form">
              <div className="form-group">
                <label htmlFor="country" className="form-label">
                  Jurisdiction / Deployment Realm
                </label>
                <div className="select-input-wrapper">
                  <select id="country" className="form-input select-styled" defaultValue="India - FIU Sandbox / Production">
                    <option value="India - FIU Sandbox / Production">India - FIU Sandbox / Production</option>
                    <option value="Global - Interpol Cross-Rail">Global - Interpol Cross-Rail</option>
                    <option value="United States - FinCEN Node">United States - FinCEN Node</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Investigator Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investigator@agency.gov.in"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <div className="password-row">
                  <label htmlFor="password" className="form-label">
                    Access Key / Password
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset verification dispatched to authorized terminal.'); }} className="forgot-link">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input"
                />
              </div>

              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Maintain persistent hardware enclave session</span>
                </label>
              </div>

              <button type="submit" className="btn-submit">
                Sign In to Workstation
              </button>
            </form>

            <div className="card-footer">
              <span className="footer-note">
                Authorized access only. All actions are cryptographically logged.
              </span>
            </div>
          </div>
        </div>

        {/* Right Product Overview Card Stack Mirroring Reference 3 */}
        <div className="signin-promo-col">
          <div className="promo-card-stack">
            <div className="preview-floating-card top-card">
              <div className="floating-row">
                <div className="card-icon-circle blue">₿</div>
                <div className="card-info">
                  <div className="card-title-sm">Multi-Rail Peeling Traced</div>
                  <div className="card-sub-sm">0x71F9...89b0 • 42.50 ETH</div>
                </div>
                <div className="card-badge-pill green">Verified</div>
              </div>
            </div>

            <div className="preview-floating-card mid-card">
              <div className="floating-row">
                <div className="card-icon-circle amber">₹</div>
                <div className="card-info">
                  <div className="card-title-sm">Domestic UPI Sweep</div>
                  <div className="card-sub-sm">vpa98@okhdfcbank • ₹71,40,000</div>
                </div>
                <div className="card-badge-pill amber">High Risk</div>
              </div>
            </div>

            <div className="preview-floating-card bottom-card">
              <div className="floating-row">
                <div className="card-icon-circle purple">🏛</div>
                <div className="card-info">
                  <div className="card-title-sm">VASP Requisition Dispatched</div>
                  <div className="card-sub-sm">SAHYOG Ref #SR-2026-9041</div>
                </div>
                <div className="card-badge-pill blue">Submitted</div>
              </div>
            </div>
          </div>

          <div className="promo-quote-block">
            <h2 className="promo-quote">
              "TraceVault provides cross-rail investigative intelligence to reconstruct complex peeling chains and domestic transaction routing."
            </h2>
            <div className="promo-author">Financial Intelligence &amp; Fraud Investigation Platform</div>
          </div>
        </div>
      </main>

      <style>{`
        .signin-root {
          position: relative;
          width: 100vw;
          min-height: 100vh;
          background-color: #f8fafc;
          color: #111827;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .signin-topbar {
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 40px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }

        .btn-brand-back {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .btn-brand-back:hover {
          color: #2563eb;
        }

        .signin-split-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 40px 24px;
          gap: 48px;
          align-items: center;
        }

        @media (max-width: 900px) {
          .signin-split-layout {
            grid-template-columns: 1fr;
          }
          .signin-promo-col {
            display: none;
          }
        }

        .signin-form-col {
          display: flex;
          justify-content: center;
        }

        .signin-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .card-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .brand-logo-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .brand-circle {
          width: 32px;
          height: 32px;
          background: #2563eb;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
        }

        .brand-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .signin-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .signin-subtitle {
          font-size: 13.5px;
          color: #64748b;
        }

        .signin-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .password-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: #334155;
        }

        .forgot-link {
          font-size: 12px;
          color: #2563eb;
          text-decoration: none;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .form-input {
          height: 42px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 14px;
          color: #111827;
          font-size: 13.5px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .select-styled {
          appearance: auto;
          cursor: pointer;
        }

        .form-checkbox-row {
          display: flex;
          align-items: center;
          font-size: 12.5px;
          color: #64748b;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .btn-submit {
          height: 44px;
          background: #2563eb;
          color: #ffffff;
          border: 1px solid #2563eb;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.15s ease;
        }

        .btn-submit:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .card-footer {
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
          text-align: center;
        }

        .footer-note {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Right Promo Column */
        .signin-promo-col {
          display: flex;
          flex-direction: column;
          gap: 36px;
          padding: 20px;
        }

        .promo-card-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .preview-floating-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .floating-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .card-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
        }

        .card-icon-circle.blue { background: #eff6ff; color: #2563eb; }
        .card-icon-circle.amber { background: #fffbeb; color: #d97706; }
        .card-icon-circle.purple { background: #f5f3ff; color: #7c3aed; }

        .card-info {
          flex: 1;
        }

        .card-title-sm {
          font-size: 13.5px;
          font-weight: 600;
          color: #1e293b;
        }

        .card-sub-sm {
          font-size: 12px;
          color: #64748b;
          font-family: ui-monospace, monospace;
        }

        .card-badge-pill {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .card-badge-pill.green { background: #ecfdf5; color: #059669; }
        .card-badge-pill.amber { background: #fffbeb; color: #d97706; }
        .card-badge-pill.blue { background: #eff6ff; color: #2563eb; }

        .promo-quote-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .promo-quote {
          font-size: 16px;
          font-weight: 500;
          color: #334155;
          line-height: 1.6;
          font-style: italic;
        }

        .promo-author {
          font-size: 12.5px;
          font-weight: 600;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};
