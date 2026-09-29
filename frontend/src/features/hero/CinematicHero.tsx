import React, { useState, useEffect, useCallback } from 'react';
import { TechFrame } from './TechFrame';
import { ScrambleText } from './ScrambleText';

interface CinematicHeroProps {
  onEnterApplication: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onEnterApplication }) => {
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Transition handler
  const handleEnter = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      onEnterApplication();
    }, 800);
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

  // Mount trigger to initiate the smooth blur-to-clear entrance
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`hero-viewport ${isTransitioning ? 'hero-transitioning' : ''}`}
      aria-label="TRACEVAULT Institutional Forensic Platform"
    >
      {/* Real Background Video Provided by User in SIH/reference/hero_animation.mp4 */}
      <div className="video-background-layer" aria-hidden="true">
        <video
          className="hero-video"
          src="/hero_animation.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Soft atmospheric gradient vignettes around edges */}
        <div className="video-vignette-overlay" />
      </div>

      {/* Top Header Shell */}
      <div className={`top-header-stage ${mounted ? 'header-entered' : 'header-pre-enter'}`}>
        <TechFrame onEnter={handleEnter} isReady={mounted} />
      </div>

      {/* Hero Lower Third Section: Headline on Left, Action on Right (Reference Video 1 Layout) */}
      <main className="hero-bottom-stage">
        <div className="hero-stage-inner">
          {/* Left Column: Eyebrow + 3-Tier Headline with Blur-to-Clear Rise */}
          <div className="headline-cluster">
            {/* Eyebrow: Formal Institutional Tag */}
            <div className={`eyebrow-container ${mounted ? 'eyebrow-entered' : 'eyebrow-pre-enter'}`}>
              <span className="eyebrow-mark" aria-hidden="true">▮▮▮</span>
              <span className="eyebrow-label">
                <ScrambleText
                  text="INSTITUTIONAL FORENSIC INTELLIGENCE"
                  delay={400}
                  duration={400}
                />
              </span>
            </div>

            {/* 3-Tier Headline with Staggered Rise & Blur-to-Clear Transitions */}
            <h1 className="hero-headline">
              {/* Line 1: High Contrast Pure White */}
              <span className={`headline-line line-1 ${mounted ? 'line-entered' : 'line-pre-enter'}`}>
                Institutional
              </span>

              {/* Line 2: Optical Focal Unblur Transition */}
              <span className={`headline-line line-2 ${mounted ? 'line-entered' : 'line-pre-enter'}`}>
                financial forensics
              </span>

              {/* Line 3: Supporting Slate Line */}
              <span className={`headline-line line-3 ${mounted ? 'line-entered' : 'line-pre-enter'}`}>
                and asset recovery
              </span>
            </h1>
          </div>

          {/* Right Column: Horizontally Balanced Primary CTA (matching Reference Video 1) */}
          <div className={`cta-cluster ${mounted ? 'cta-entered' : 'cta-pre-enter'}`}>
            <button
              type="button"
              onClick={handleEnter}
              className="primary-launch-button"
              aria-label="Enter Investigation Workstation"
            >
              <span className="btn-text">
                <ScrambleText text="Enter Workstation" delay={900} duration={350} />
              </span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Minimal Institutional Authority Footer */}
        <div className={`authority-footer ${mounted ? 'footer-entered' : 'footer-pre-enter'}`}>
          <span className="authority-text">
            GOVERNMENT OF INDIA // LAW ENFORCEMENT & REGULATORY INVESTIGATION PLATFORM
          </span>
          <span className="authority-protocol">
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
          transition: opacity 0.8s var(--tv-ease-camera), transform 0.8s var(--tv-ease-camera), filter 0.8s var(--tv-ease-camera);
        }

        .hero-transitioning {
          opacity: 0;
          transform: scale(0.97) translateY(24px);
          filter: blur(14px);
        }

        /* Video Background Layer */
        .video-background-layer {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #000000;
        }

        .hero-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
        }

        .video-vignette-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 50% 50%,
            transparent 30%,
            rgba(5, 10, 14, 0.4) 65%,
            #050a0e 95%
          );
          pointer-events: none;
        }

        /* Top Header Stage */
        .top-header-stage {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 30;
          transition: transform 0.8s var(--tv-ease-smooth), opacity 0.8s var(--tv-ease-smooth), filter 0.8s var(--tv-ease-smooth);
        }

        .header-pre-enter {
          transform: translateY(-24px);
          opacity: 0;
          filter: blur(8px);
        }

        .header-entered {
          transform: translateY(0);
          opacity: 1;
          filter: blur(0px);
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
          transition: transform 0.8s var(--tv-ease-smooth), opacity 0.8s var(--tv-ease-smooth), filter 0.8s var(--tv-ease-smooth);
        }

        .eyebrow-pre-enter {
          transform: translateY(20px);
          opacity: 0;
          filter: blur(10px);
        }

        .eyebrow-entered {
          transform: translateY(0);
          opacity: 1;
          filter: blur(0px);
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
          color: #94a3b8;
        }

        /* 3-Tier Headline with Staggered Blur-to-Clear Rise */
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
          transition: transform 0.9s var(--tv-ease-smooth), opacity 0.9s var(--tv-ease-smooth), filter 0.9s var(--tv-ease-smooth);
        }

        .line-1 {
          color: #ffffff;
          transition-delay: 0.25s;
        }

        .line-2 {
          color: #ffffff;
          transition-delay: 0.5s;
        }

        .line-3 {
          color: #94a3b8;
          transition-delay: 0.75s;
        }

        .line-pre-enter {
          transform: translateY(32px);
          opacity: 0;
          filter: blur(14px);
        }

        .line-entered {
          transform: translateY(0);
          opacity: 1;
          filter: blur(0px);
        }

        /* Balanced CTA Cluster on the Right */
        .cta-cluster {
          padding-bottom: 8px;
          transition: transform 0.9s var(--tv-ease-smooth) 0.85s, opacity 0.9s var(--tv-ease-smooth) 0.85s, filter 0.9s var(--tv-ease-smooth) 0.85s;
        }

        .cta-pre-enter {
          transform: translateY(28px);
          opacity: 0;
          filter: blur(12px);
        }

        .cta-entered {
          transform: translateY(0);
          opacity: 1;
          filter: blur(0px);
        }

        .primary-launch-button {
          background: #ffffff;
          color: #050a0e;
          border: none;
          padding: 15px 30px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--tv-font-sans);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          transition: background 0.2s var(--tv-ease-smooth), transform 0.2s var(--tv-ease-smooth), box-shadow 0.2s;
          box-shadow: 0 4px 28px rgba(0, 0, 0, 0.7);
        }

        .primary-launch-button:hover {
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(36, 199, 201, 0.35);
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

        /* Formal Authority Footer */
        .authority-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 18px;
          border-top: 1px solid var(--tv-border);
          font-family: var(--tv-font-sans);
          font-size: 11px;
          color: #64748b;
          letter-spacing: 0.08em;
          transition: opacity 0.8s var(--tv-ease-smooth) 1.0s;
        }

        .footer-pre-enter {
          opacity: 0;
        }

        .footer-entered {
          opacity: 1;
        }

        .authority-protocol {
          font-family: var(--tv-font-sans);
          font-size: 11px;
          color: #64748b;
        }

        /* Peripheral Corner Accents */
        .corner-accent {
          position: absolute;
          font-family: var(--tv-font-sans);
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
