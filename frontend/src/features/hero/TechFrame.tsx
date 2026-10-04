import React from 'react';

interface TechFrameProps {
  onEnter: () => void;
  activeNav?: string;
  onNavClick?: (nav: string) => void;
}

export const TechFrame: React.FC<TechFrameProps> = ({
  onEnter,
  activeNav = 'Platform',
  onNavClick
}) => {
  const navItems = [
    { label: 'Platform', href: '#platform' },
    { label: 'Crypto Tracing', href: '#graph-tracing' },
    { label: 'UPI Fraud', href: '#capabilities' },
    { label: 'Investigations', href: '#workspace' },
    { label: 'Evidence', href: '#capabilities' }
  ];

  return (
    <header className="product-navbar" role="banner">
      <div className="navbar-container">
        {/* Brand Identity */}
        <div className="navbar-brand">
          <div className="brand-logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#24c7c9" strokeWidth="2" />
              <path d="M12 7l-5 3v4l5 3 5-3v-4l-5-3z" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-title">TRACEVAULT</span>
            <span className="brand-tagline">Crypto Wallet Tracing & UPI Fraud Detection</span>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="navbar-links" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeNav === item.label;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.href.startsWith('#')) {
                    const el = document.querySelector(item.href);
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                  onNavClick?.(item.label);
                }}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        <div className="navbar-actions">
          <button
            type="button"
            onClick={onEnter}
            className="signin-btn"
            aria-label="Sign in to TraceVault"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onEnter}
            className="start-investigation-btn"
            aria-label="Start Investigation"
          >
            Start Investigation →
          </button>
        </div>
      </div>

      <style>{`
        .product-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 68px;
          z-index: 100;
          display: flex;
          align-items: center;
          padding: 0 40px;
          background: rgba(5, 10, 14, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .navbar-container {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .brand-logo {
          display: flex;
          align-items: center;
        }

        .brand-text-group {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .brand-title {
          font-family: var(--tv-font-sans);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #ffffff;
          line-height: 1.1;
        }

        .brand-tagline {
          font-family: var(--tv-font-sans);
          font-size: 10px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .nav-link {
          font-family: var(--tv-font-sans);
          font-size: 13px;
          font-weight: 500;
          color: #cbd5e1;
          text-decoration: none;
          padding: 8px 0;
          position: relative;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #ffffff;
        }

        .nav-link-active {
          color: #ffffff;
          font-weight: 600;
        }

        .nav-link-active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--tv-cyan);
          box-shadow: 0 0 8px var(--tv-cyan);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .signin-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          font-family: var(--tv-font-sans);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .signin-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .start-investigation-btn {
          background: var(--tv-cyan);
          border: 1px solid var(--tv-cyan);
          color: #050a0e;
          font-family: var(--tv-font-sans);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 14px rgba(36, 199, 201, 0.3);
        }

        .start-investigation-btn:hover {
          background: #38d9db;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(36, 199, 201, 0.45);
        }

        @media (max-width: 992px) {
          .navbar-links {
            display: none;
          }
          .brand-tagline {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
