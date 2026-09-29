import React from 'react';
import { ScrambleText } from './ScrambleText';

interface TechFrameProps {
  onEnter: () => void;
  activeNav?: string;
  onNavClick?: (nav: string) => void;
  isReady?: boolean;
}

export const TechFrame: React.FC<TechFrameProps> = ({
  onEnter,
  activeNav = 'INVESTIGATION',
  onNavClick,
  isReady = false
}) => {
  const navItems = ['CASES', 'INVESTIGATION', 'EVIDENCE', 'INTELLIGENCE'];

  return (
    <header className="tech-frame-header" role="banner">
      <div className="tech-frame-inner">
        {/* Left Platform Identity */}
        <div className="platform-id">
          <div className="platform-emblem" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#24c7c9" strokeWidth="1.75" />
              <path d="M12 7l-5 3v4l5 3 5-3v-4l-5-3z" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
            </svg>
          </div>
          <span className="platform-wordmark tracking-wider text-white font-bold text-sm">
            TRACEVAULT
          </span>
        </div>

        {/* Center Technical Navigation Bar */}
        <nav className="center-nav-bar" aria-label="Investigation Suite Navigation">
          <div className="nav-items-wrapper">
            {navItems.map((item, index) => {
              const isActive = activeNav === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onNavClick?.(item)}
                  className={`nav-btn text-xs tracking-widest uppercase transition-colors ${
                    isActive ? 'text-white font-medium' : 'text-[#64748b] hover:text-[#94a3b8]'
                  }`}
                >
                  <ScrambleText text={item} delay={150 + index * 80} duration={350} />
                  {isActive && <div className="active-nav-notch" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right Corner Technical Action */}
        <div className="right-action">
          <button
            type="button"
            onClick={onEnter}
            aria-label="Access Investigation Console"
            className={`tech-cta-button group ${isReady ? 'border-[#24c7c9]/40' : ''}`}
          >
            <span className="text-xs uppercase tracking-wider text-white group-hover:text-[#24c7c9] transition-colors font-medium">
              <ScrambleText text="ACCESS CONSOLE" delay={500} duration={350} />
            </span>
            <span className="corner-plus text-[#24c7c9] font-mono" aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      <style>{`
        .tech-frame-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          z-index: 40;
          display: flex;
          align-items: center;
          padding: 0 48px;
          pointer-events: auto;
        }

        .tech-frame-inner {
          width: 100%;
          max-width: 1560px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--tv-border);
          padding-bottom: 14px;
        }

        .platform-id {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .platform-emblem {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .platform-wordmark {
          font-family: var(--tv-font-sans);
          letter-spacing: 0.12em;
          font-size: 15px;
          font-weight: 700;
        }

        .center-nav-bar {
          display: flex;
          align-items: center;
          background: #080e14;
          border: 1px solid var(--tv-border);
          border-radius: 4px;
          padding: 0 20px;
          height: 38px;
        }

        .nav-items-wrapper {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-btn {
          font-family: var(--tv-font-sans);
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 8px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 11px;
        }

        .active-nav-notch {
          position: absolute;
          bottom: -1px;
          width: 18px;
          height: 2px;
          background-color: var(--tv-cyan);
          box-shadow: 0 0 10px var(--tv-cyan);
        }

        .right-action {
          display: flex;
          align-items: center;
        }

        .tech-cta-button {
          font-family: var(--tv-font-sans);
          background: #0a1219;
          border: 1px solid var(--tv-border);
          border-radius: 4px;
          padding: 8px 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: border-color 0.2s var(--tv-ease-smooth), background 0.2s;
        }

        .tech-cta-button:hover {
          border-color: var(--tv-cyan);
          background: #0e1822;
        }

        .corner-plus {
          font-size: 13px;
          line-height: 1;
        }
      `}</style>
    </header>
  );
};
