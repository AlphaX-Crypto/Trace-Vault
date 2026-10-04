import React, { useState, useEffect, useCallback } from 'react';
import { TechFrame } from './TechFrame';

interface CinematicHeroProps {
  onEnterApplication: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onEnterApplication }) => {
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Transition handler when launching full workstation
  const handleEnter = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      onEnterApplication();
    }, 600);
  }, [isTransitioning, onEnterApplication]);

  // Mount trigger to initiate the smooth blur-to-clear entrance
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const handleScrollToGraph = () => {
    const el = document.getElementById('graph-tracing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="platform"
      className={`hero-viewport ${isTransitioning ? 'hero-transitioning' : ''}`}
      aria-label="TraceVault Financial Investigation Platform"
    >
      {/* Fullscreen Video Background */}
      <div className="video-background-layer" aria-hidden="true">
        <video
          className="hero-video"
          src="/hero_animation.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Cinematic Vignette Overlay */}
        <div className="video-vignette-overlay" />
      </div>

      {/* Top Navbar */}
      <TechFrame onEnter={handleEnter} />

      {/* Hero Lower Content Stage */}
      <div className="hero-content-stage">
        <div className="hero-content-inner">
          {/* Eyebrow Badge */}
          <div className={`eyebrow-container ${mounted ? 'entered' : 'pre-enter'}`}>
            <span className="eyebrow-mark" aria-hidden="true">▮▮▮</span>
            <span className="eyebrow-text">FINANCIAL INVESTIGATION PLATFORM</span>
          </div>

          {/* 3-Line Headline with Optical Blur-to-Clear Rise */}
          <h1 className="hero-headline">
            <span className={`headline-line line-1 ${mounted ? 'entered' : 'pre-enter'}`}>
              Trace suspicious crypto wallets
            </span>
            <span className={`headline-line line-2 ${mounted ? 'entered' : 'pre-enter'}`}>
              and investigate UPI fraud
            </span>
            <span className={`headline-line line-3 ${mounted ? 'entered' : 'pre-enter'}`}>
              with connected intelligence.
            </span>
          </h1>

          {/* Institutional Subtitle */}
          <p className={`hero-subtitle ${mounted ? 'entered' : 'pre-enter'}`}>
            Trace multi-hop transactions across peeling chains and mixer pools, 
            detect suspicious fund flows, and link pseudo-anonymous crypto addresses 
            directly to domestic UPI recipient endpoints.
          </p>

          {/* Dual Action Buttons */}
          <div className={`hero-actions-cluster ${mounted ? 'entered' : 'pre-enter'}`}>
            <button
              type="button"
              onClick={handleEnter}
              className="btn-start-investigation"
              aria-label="Start Investigation"
            >
              <span>Start Investigation</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              onClick={handleScrollToGraph}
              className="btn-explore-graph"
              aria-label="Explore Graph Tracing"
            >
              <span>Explore Graph Tracing</span>
              <span className="btn-down" aria-hidden="true">↓</span>
            </button>
          </div>
        </div>

        {/* Minimal Institutional Status Metric Bar */}
        <div className={`hero-status-strip ${mounted ? 'entered' : 'pre-enter'}`}>
          <div className="status-item">
            <span className="status-dot" />
            <span className="status-k">MULTI-CHAIN ENGINE:</span>
            <span className="status-v font-mono">18 NETWORKS MONITORED</span>
          </div>
          <div className="status-item">
            <span className="status-dot" />
            <span className="status-k">UPI FRAUD DETECTOR:</span>
            <span className="status-v font-mono">REAL-TIME VPA RESOLUTION</span>
          </div>
          <div className="status-item">
            <span className="status-dot" />
            <span className="status-k">CROSS-RAIL RECOGNITION:</span>
            <span className="status-v font-mono">TEMPORAL HEURISTICS ACTIVE</span>
          </div>
        </div>
      </div>

      <style>{`
        .hero-viewport {
          position: relative;
          width: 100vw;
          height: 100vh;
          min-height: 700px;
          background-color: #050a0e;
          color: #ffffff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 0 48px 36px 48px;
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-transitioning {
          opacity: 0;
          transform: scale(0.98);
        }

        /* Fullscreen Edge-to-Edge Video Background */
        .video-background-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: hidden;
          background: #000000;
        }

        .hero-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
        }

        /* Cinematic Vignette Overlay */
        .video-vignette-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 50% 45%,
            rgba(5, 10, 14, 0.15) 0%,
            rgba(5, 10, 14, 0.55) 60%,
            #050a0e 95%
          );
          pointer-events: none;
        }

        /* Content Lower Stage */
        .hero-content-stage {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .hero-content-inner {
          max-width: 900px;
          display: flex;
          flex-direction: column;
        }

        /* Eyebrow */
        .eyebrow-container {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .eyebrow-mark {
          color: #24c7c9;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .eyebrow-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #24c7c9;
        }

        /* 3-Line Headline */
        .hero-headline {
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
          margin-bottom: 20px;
          line-height: 1.12;
        }

        .headline-line {
          display: block;
          font-size: clamp(38px, 4.4vw, 64px);
          font-weight: 600;
          letter-spacing: -0.03em;
          transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .line-1 {
          color: #ffffff;
          transition-delay: 0.1s;
        }

        .line-2 {
          color: #24c7c9;
          transition-delay: 0.22s;
        }

        .line-3 {
          color: #94a3b8;
          transition-delay: 0.34s;
        }

        /* Blur-to-Clear and Rise Motion */
        .pre-enter {
          transform: translateY(28px);
          opacity: 0;
          filter: blur(14px);
        }

        .entered {
          transform: translateY(0);
          opacity: 1;
          filter: blur(0px);
        }

        /* Subtitle */
        .hero-subtitle {
          font-size: clamp(14px, 1.2vw, 17px);
          font-weight: 400;
          color: #cbd5e1;
          line-height: 1.6;
          max-width: 680px;
          margin-bottom: 32px;
          transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: 0.45s;
        }

        /* Actions */
        .hero-actions-cluster {
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: 0.55s;
          flex-wrap: wrap;
        }

        .btn-start-investigation {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          height: 48px;
          padding: 0 28px;
          background: #24c7c9;
          color: #050a0e;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(36, 199, 201, 0.35);
          transition: all 0.25s ease;
        }

        .btn-start-investigation:hover {
          background: #3ee8eb;
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(36, 199, 201, 0.5);
        }

        .btn-arrow {
          font-size: 16px;
          transition: transform 0.2s ease;
        }

        .btn-start-investigation:hover .btn-arrow {
          transform: translateX(4px);
        }

        .btn-explore-graph {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 48px;
          padding: 0 24px;
          background: rgba(14, 24, 34, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .btn-explore-graph:hover {
          background: rgba(20, 34, 48, 0.9);
          border-color: #24c7c9;
          color: #24c7c9;
        }

        .btn-down {
          font-size: 15px;
          transition: transform 0.2s ease;
        }

        .btn-explore-graph:hover .btn-down {
          transform: translateY(3px);
        }

        /* Status Strip */
        .hero-status-strip {
          display: flex;
          align-items: center;
          gap: 32px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: 0.65s;
          flex-wrap: wrap;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #24c7c9;
          box-shadow: 0 0 6px #24c7c9;
        }

        .status-k {
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
        }

        .status-v {
          font-size: 11px;
          font-weight: 600;
          color: #cbd5e1;
        }

        @media (max-width: 768px) {
          .hero-viewport {
            padding: 0 20px 24px 20px;
          }
          .hero-status-strip {
            gap: 16px;
          }
        }
      `}</style>
    </section>
  );
};
