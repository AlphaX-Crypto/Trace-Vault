import React, { useState, useEffect, useCallback } from 'react';
import { TopologicalCore } from './TopologicalCore';
import { TechFrame } from './TechFrame';
import { ScrambleText } from './ScrambleText';

interface CinematicHeroProps {
  onEnterApplication: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onEnterApplication }) => {
  // Step stages: 0 = Init, 1 = Scramble & Header, 2 = Eyebrow & Headline, 3 = Focal Unblur, 4 = Ready
  const [stage, setStage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Transition handler
  const handleEnter = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    // Smooth deceleration zoom into the application shell
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
    const timer2 = setTimeout(() => setStage(2), 600);  // Eyebrow & Line 1
    const timer3 = setTimeout(() => setStage(3), 1100); // Focal Blur Line 2
    const timer4 = setTimeout(() => setStage(4), 1600); // Fully Ready & CTA
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
      aria-label="TRACEVAULT Investigation Console Entry"
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

      {/* Hero Spatial Canvas Container */}
      <main className="hero-content-container">
        <div className="hero-typography-block">
          {/* Eyebrow: Technical Status Bar */}
          <div className={`eyebrow-wrapper ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            <span className="eyebrow-bars" aria-hidden="true">▮▮▮</span>
            <span className="eyebrow-text font-mono">
              <ScrambleText
                text="AUTONOMOUS FORENSIC INTELLIGENCE"
                delay={500}
                duration={500}
              />
            </span>
          </div>

          {/* 3-Level Typographic Hierarchy */}
          <h1 className="hero-headline">
            {/* Line 1: High Contrast Crisp White */}
            <span className={`headline-line line-primary ${stage >= 2 ? 'line-revealed' : ''}`}>
              Decentralized asset
            </span>

            {/* Line 2: Optical Focal Blur Transition */}
            <span className={`headline-line line-focal ${stage >= 3 ? 'focal-resolved' : 'focal-blurred'}`}>
              investigation & trace
            </span>

            {/* Line 3: Muted Supporting Line */}
            <span className={`headline-line line-muted ${stage >= 3 ? 'line-revealed' : ''}`}>
              by institutional design
            </span>
          </h1>

          {/* Explanatory Technical Micro-brief */}
          <p className={`hero-subtext ${stage >= 4 ? 'opacity-100' : 'opacity-0'}`}>
            Next-generation blockchain forensic workstation orchestrating cross-chain entity attribution, 
            automated transaction graph traversal, and court-admissible Section 65B evidence ledgers.
          </p>
        </div>

        {/* Bottom Horizontal Bar: Telemetry & Primary CTA */}
        <footer className="hero-footer-bar">
          {/* Left: System Verification Telemetry */}
          <div className="telemetry-group font-mono text-xs text-[#64748b]">
            <div className="telemetry-item">
              <span className="telemetry-label">SECURITY:</span>
              <span className="telemetry-value text-white">ED25519 VERIFIED</span>
            </div>
            <div className="telemetry-divider">/</div>
            <div className="telemetry-item">
              <span className="telemetry-label">TOPOLOGY:</span>
              <span className="telemetry-value text-[#24c7c9]">NETWORKX 3.7</span>
            </div>
            <div className="telemetry-divider">/</div>
            <div className="telemetry-item">
              <span className="telemetry-label">EVIDENCE:</span>
              <span className="telemetry-value text-[#f59e0b]">SEC 65B READY</span>
            </div>
          </div>

          {/* Right: Corner-Cut Primary Action CTA */}
          <div className="cta-wrapper">
            <button
              type="button"
              onClick={handleEnter}
              className={`primary-cta-button ${stage >= 4 ? 'cta-ready' : 'cta-waiting'}`}
              aria-label="Launch Investigation Workspace"
            >
              <div className="cta-content">
                <span className="cta-text font-mono text-xs uppercase tracking-wider">
                  <ScrambleText text="LAUNCH INVESTIGATION" delay={1400} duration={400} />
                </span>
                <span className="cta-key-hint font-mono text-[10px] text-[#24c7c9]" aria-hidden="true">[↵]</span>
              </div>
              <div className="corner-chamfer" aria-hidden="true">+</div>
            </button>
          </div>
        </footer>
      </main>

      {/* Peripheral Corner Chamfer Accents */}
      <div className="corner-accent corner-tl font-mono" aria-hidden="true">┌ 28.6139° N</div>
      <div className="corner-accent corner-tr font-mono" aria-hidden="true">77.2090° E ┐</div>
      <div className="corner-accent corner-bl font-mono" aria-hidden="true">└ TV-CORE.01</div>
      <div className="corner-accent corner-br font-mono" aria-hidden="true">INST-SEC ┘</div>

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
          justify-content: space-between;
          padding: 80px 48px 36px 48px;
          transition: opacity 0.75s var(--tv-ease-camera), transform 0.75s var(--tv-ease-camera);
        }

        .hero-transitioning {
          opacity: 0;
          transform: scale(1.05);
          filter: blur(4px);
        }

        /* Fine Coordinate Grid Atmosphere */
        .atmospheric-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(circle at 50% 50%, black 40%, transparent 85%);
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

        /* Main Spatial Container */
        .hero-content-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1560px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .hero-typography-block {
          max-width: 820px;
          margin-top: 6vh;
        }

        /* Eyebrow Treatment */
        .eyebrow-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          transition: opacity 0.6s var(--tv-ease-smooth);
        }

        .eyebrow-bars {
          color: var(--tv-cyan);
          letter-spacing: 2px;
          font-size: 11px;
        }

        .eyebrow-text {
          font-size: 11px;
          letter-spacing: 0.15em;
          color: var(--tv-text-secondary);
          font-weight: 500;
        }

        /* 3-Tier Headline */
        .hero-headline {
          font-family: var(--tv-font-sans);
          font-size: clamp(40px, 4.6vw, 68px);
          font-weight: 600;
          line-height: 1.08;
          letter-spacing: -0.035em;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .headline-line {
          display: block;
          transition: opacity 0.7s var(--tv-ease-smooth), filter 0.8s var(--tv-ease-smooth), transform 0.7s var(--tv-ease-smooth);
        }

        .line-primary {
          color: #ffffff;
          opacity: 0;
          transform: translateY(12px);
        }

        .line-primary.line-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* Optical Focal Blur */
        .line-focal {
          color: #ffffff;
        }

        .line-focal.focal-blurred {
          opacity: 0.4;
          filter: blur(10px);
          transform: translateY(8px);
        }

        .line-focal.focal-resolved {
          opacity: 1;
          filter: blur(0px);
          transform: translateY(0);
        }

        .line-muted {
          color: var(--tv-text-muted);
          opacity: 0;
          transform: translateY(6px);
        }

        .line-muted.line-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-subtext {
          margin-top: 28px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--tv-text-secondary);
          max-width: 580px;
          font-weight: 400;
          transition: opacity 0.8s var(--tv-ease-smooth);
        }

        /* Bottom Telemetry & CTA Footer */
        .hero-footer-bar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid var(--tv-border);
          position: relative;
          z-index: 20;
        }

        .telemetry-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .telemetry-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .telemetry-label {
          color: var(--tv-text-muted);
          font-size: 11px;
        }

        .telemetry-value {
          font-weight: 500;
          font-size: 11px;
        }

        .telemetry-divider {
          color: var(--tv-border);
        }

        /* Corner-Cut Primary CTA Button */
        .primary-cta-button {
          background: #ffffff;
          color: #050a0e;
          border: none;
          padding: 14px 28px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative;
          transition: background 0.2s var(--tv-ease-smooth), transform 0.2s var(--tv-ease-smooth), box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .primary-cta-button:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(36, 199, 201, 0.25);
        }

        .primary-cta-button:active {
          transform: translateY(0);
        }

        .cta-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cta-text {
          font-weight: 600;
          color: #050a0e;
        }

        .corner-chamfer {
          font-family: var(--tv-font-mono);
          font-weight: 700;
          color: #050a0e;
          font-size: 14px;
          line-height: 1;
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

        /* Peripheral Corner Accents */
        .corner-accent {
          position: absolute;
          font-size: 10px;
          color: #334155;
          letter-spacing: 0.1em;
          pointer-events: none;
          z-index: 5;
        }

        .corner-tl { top: 12px; left: 48px; }
        .corner-tr { top: 12px; right: 48px; }
        .corner-bl { bottom: 12px; left: 48px; }
        .corner-br { bottom: 12px; right: 48px; }

        @media (max-width: 1024px) {
          .hero-viewport {
            padding: 70px 24px 24px 24px;
          }
          .hero-footer-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
};
