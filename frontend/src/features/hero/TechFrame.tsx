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
  const navItems = ['INVESTIGATION', 'EVIDENCE', 'TOPOLOGY', 'DISCLOSURE'];

  return (
    <header className="tech-frame-header" role="banner">
      {/* Top Hairline Container */}
      <div className="tech-frame-inner">
        {/* Left Platform Identity */}
        <div className="platform-id">
          <div className="platform-emblem" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#24c7c9" strokeWidth="1.5" />
              <path d="M12 7l-5 3v4l5 3 5-3v-4l-5-3z" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
            </svg>
          </div>
          <div className="platform-wordmark">
            <span className="wordmark-title font-mono font-semibold tracking-wider text-white text-sm">
              <ScrambleText
                text="TRACEVAULT"
                delay={100}
                duration={500}
              />
            </span>
            <span className="platform-subtag font-mono text-[10px] text-[#64748b] tracking-widest">
              // INSTITUTIONAL
            </span>
          </div>
        </div>

        {/* Center Chamfered Technical Frame Bar */}
        <nav className="center-nav-bar" aria-label="Investigation Suite Navigation">
          <div className="chamfer-cut-left" aria-hidden="true" />
          <div className="nav-items-wrapper">
            {navItems.map((item, index) => {
              const isActive = activeNav === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onNavClick?.(item)}
                  className={`nav-btn font-mono text-xs tracking-wider uppercase transition-colors ${
                    isActive ? 'text-white' : 'text-[#64748b] hover:text-[#94a3b8]'
                  }`}
                >
                  <ScrambleText text={item} delay={250 + index * 100} duration={400} />
                  {isActive && <div className="active-nav-notch" />}
                </button>
              );
            })}
          </div>
          <div className="chamfer-cut-right" aria-hidden="true" />
        </nav>

        {/* Right Corner Technical Action Pill */}
        <div className="right-action">
          <button
            type="button"
            onClick={onEnter}
            aria-label="Enter Investigation Console"
            className={`tech-cta-button group ${isReady ? 'cta-pulse-ready' : ''}`}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-white group-hover:text-[#24c7c9] transition-colors">
              <ScrambleText text="ENTER CONSOLE" delay={600} duration={400} />
            </span>
            <span className="corner-plus font-mono text-[#24c7c9]" aria-hidden="true">+</span>
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
          padding: 0 32px;
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
          padding-bottom: 12px;
          position: relative;
        }

        .platform-id {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .platform-wordmark {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .platform-emblem {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .center-nav-bar {
          display: flex;
          align-items: center;
          background: #0a1219;
          border: 1px solid var(--tv-border);
          border-radius: 4px;
          padding: 0 16px;
          height: 36px;
          position: relative;
        }

        .nav-items-wrapper {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .nav-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          position: relative;
          padding: 8px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .active-nav-notch {
          position: absolute;
          bottom: -1px;
          width: 16px;
          height: 2px;
          background-color: var(--tv-cyan);
          box-shadow: 0 0 8px var(--tv-cyan);
        }

        .right-action {
          display: flex;
          align-items: center;
        }

        .tech-cta-button {
          background: #0e1822;
          border: 1px solid var(--tv-border);
          border-radius: 4px;
          padding: 8px 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          transition: border-color 0.2s var(--tv-ease-smooth), background 0.2s;
        }

        .tech-cta-button:hover {
          border-color: var(--tv-cyan);
          background: #142230;
        }

        .corner-plus {
          font-size: 14px;
          line-height: 1;
        }
      `}</style>
    </header>
  );
};
