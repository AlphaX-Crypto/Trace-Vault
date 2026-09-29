import React, { useState, useEffect, useCallback } from 'react';
import { TopologicalCore } from './TopologicalCore';
import { TechFrame } from './TechFrame';
import { ScrambleText } from './ScrambleText';

interface CinematicHeroProps {
  onEnterApplication: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onEnterApplication }) => {
  // Step stages: 0 = Init, 1 = Scramble & Header, 2 = Eyebrow & Line 1, 3 = Focal Unblur, 4 = Ready
  const [stage, setStage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Transition handler
  const handleEnter = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      onEnterApplication();
    }, 750);
  }, [isTransitioning, onEnterApplication]);

  // Keyboard shortcut: Enter or Space triggers immediate entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter]);

  // Paced choreography matching Reference Video 1
  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 100);  // Header & Environment
    const timer2 = setTimeout(() => setStage(2), 500);  // Eyebrow & Line 1
    const timer3 = setTimeout(() => setStage(3), 1000); // Focal Blur Line 2 & 3
    const timer4 = setTimeout(() => setStage(4), 1500); // Fully Ready & CTA
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div
      className={`hero-viewport ${isTransitioning ? 'hero-transitioning' : ''}`}
      aria-label="TRACEVAULT Institutional Forensic Platform"
    >
      {/* Background Coordinate Atmosphere */}
      <div className="atmospheric-grid" aria-hidden="true" />

      {/* Top Frame Shell */}
      <TechFrame
        onEnter={handleEnter}
        isReady={stage >= 4}
      />

      {/* Central 3D Topological Core Lattice */}
      <div className="topology-container" aria-hidden="true">
        <TopologicalCore isTransitioning={isTransitioning} className="w-full h-full" />
      </div>

      {/* Hero Lower Third Section: Headline on Left, Action on Right (Reference Video 1 Layout) */}
      <main className="hero-bottom-stage">
        <div className="hero-stage-inner">
          {/* Left Column: Eyebrow + 3-Tier Headline */}
          <div className="headline-cluster">
            {/* Eyebrow: Formal Institutional Tag */}
            <div className={`eyebrow-container ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="eyebrow-mark" aria-hidden="true">▮▮▮</span>
              <span className="eyebrow-label">
                <ScrambleText
                  text="INSTITUTIONAL FORENSIC INTELLIGENCE"
                  delay={400}
                  duration={400}
                />
              </span>
            </div>

            {/* 3-Tier Headline matching Reference Video 1 */}
            <h1 className="hero-headline">
              {/* Line 1: High Contrast Pure White */}
              <span className={`headline-line line-1 ${stage >= 2 ? 'line-revealed' : ''}`}>
                Institutional
              </span>

              {/* Line 2: Optical Focal Unblur Transition */}
              <span className={`headline-line line-2 ${stage >= 3 ? 'focal-resolved' : 'focal-blurred'}`}>
                financial forensics
              </span>

              {/* Line 3: Muted Supporting Slate Line */}
              <span className={`headline-line line-3 ${stage >= 3 ? 'line-revealed' : ''}`}>
                and asset recovery
              </span>
            </h1>
          </div>

          {/* Right Column: Horizontally Balanced Primary CTA (matching Reference Video 1) */}
          <div className="cta-cluster">
            <button
              type="button"
              onClick={handleEnter}
              className={`primary-launch-button ${stage >= 4 ? 'cta-ready' : 'cta-waiting'}`}
              aria-label="Enter Investigation Workstation"
            >
              <span className="btn-text">
                <ScrambleText text="Enter Workstation" delay={1200} duration={350} />
              </span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Minimal Institutional Authority Footer */}
        <div className="authority-footer">
          <span className="authority-text">
            GOVERNMENT OF INDIA // LAW ENFORCEMENT & REGULATORY INVESTIGATION PLATFORM
          </span>
          <span className="authority-protocol font-mono">
            SEC 65B CERTIFIED // BNS 94 COMPLIANT
          </span>
        </div>
      </main>

      {/* Subtle Peripheral Corner Accents */}
      <div className="corner-accent corner-tl" aria-hidden="true">┌ 28.6139° N</div>
      <div className="corner-accent corner-tr" aria-hidden="true">77.2090° E ┐</div>
      <div className="corner-accent corner-bl" aria-hidden="true">└ TV-LEA.01</div>
      <div className="corner-accent corner-br" aria-hidden="true">SEC-AUTH ┘</div>

      <style>{`
        .hero-viewport {
          position: relative;
          width: 100vw;
          height: 100vh;
          background-color: var(--tv-canvas);
          color: var(--tv-text-primary);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 0 48px 24px 48px;
          transition: opacity 0.75s var(--tv-ease-camera), transform 0.75s var(--tv-ease-camera);
        }

        .hero-transitioning {
          opacity: 0;
          transform: scale(1.04);
          filter: blur(4px);
        }

        /* Subtle Coordinate Grid Atmosphere */
        .atmospheric-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(circle at 50% 50%, black 45%, transparent 85%);
          pointer-events: none;
          z-index: 1;
        }

        /* Central Topology Positioning */
        .topology-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          pointer-events: none;
        }

        /* Lower Third Stage (Matching Reference Video 1) */
        .hero-bottom-stage {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .hero-stage-inner {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          width: 100%;
        }

        /* Eyebrow Treatment */
        .eyebrow-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          transition: opacity 0.6s var(--tv-ease-smooth);
        }

        .eyebrow-mark {
          color: var(--tv-cyan);
          letter-spacing: 2px;
          font-size: 10px;
        }

        .eyebrow-label {
          font-family: var(--tv-font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: var(--tv-text-secondary);
        }

        /* 3-Tier Headline */
        .hero-headline {
          font-family: var(--tv-font-sans);
          font-size: clamp(40px, 4.4vw, 68px);
          font-weight: 600;
          line-height: 1.08;
          letter-spacing: -0.03em;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .headline-line {
          display: block;
          transition: opacity 0.7s var(--tv-ease-smooth), filter 0.8s var(--tv-ease-smooth), transform 0.7s var(--tv-ease-smooth);
        }

        .line-1 {
          color: #ffffff;
          opacity: 0;
          transform: translateY(12px);
        }

        .line-1.line-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* Optical Focal Blur */
        .line-2 {
          color: #ffffff;
        }

        .line-2.focal-blurred {
          opacity: 0.35;
          filter: blur(10px);
          transform: translateY(8px);
        }

        .line-2.focal-resolved {
          opacity: 1;
          filter: blur(0px);
          transform: translateY(0);
        }

        .line-3 {
          color: var(--tv-text-muted);
          opacity: 0;
          transform: translateY(6px);
        }

        .line-3.line-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* Balanced CTA Cluster on the Right */
        .cta-cluster {
          padding-bottom: 8px;
        }

        .primary-launch-button {
          background: #ffffff;
          color: #050a0e;
          border: none;
          padding: 14px 28px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--tv-font-sans);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition: background 0.2s var(--tv-ease-smooth), transform 0.2s var(--tv-ease-smooth), box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
        }

        .primary-launch-button:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(36, 199, 201, 0.25);
        }

        .primary-launch-button:active {
          transform: translateY(0);
        }

        .btn-arrow {
          font-size: 16px;
          line-height: 1;
          transition: transform 0.2s var(--tv-ease-smooth);
        }

        .primary-launch-button:hover .btn-arrow {
          transform: translateX(3px);
        }

        .cta-waiting {
          opacity: 0;
          pointer-events: none;
        }

        .cta-ready {
          opacity: 1;
          pointer-events: auto;
          transition: opacity 0.6s var(--tv-ease-smooth);
        }

        /* Formal Authority Footer */
        .authority-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 18px;
          border-top: 1px solid var(--tv-border);
          font-size: 11px;
          color: #64748b;
          letter-spacing: 0.06em;
        }

        .authority-protocol {
          font-size: 10px;
          color: #475569;
        }

        /* Peripheral Corner Accents */
        .corner-accent {
          position: absolute;
          font-family: var(--tv-font-mono);
          font-size: 10px;
          color: #1e293b;
          letter-spacing: 0.1em;
          pointer-events: none;
          z-index: 5;
        }

        .corner-tl { top: 12px; left: 48px; }
        .corner-tr { top: 12px; right: 48px; }
        .corner-bl { bottom: 8px; left: 48px; }
        .corner-br { bottom: 8px; right: 48px; }

        @media (max-width: 1024px) {
          .hero-viewport {
            padding: 0 24px 20px 24px;
          }
          .hero-stage-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 28px;
          }
          .authority-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};
