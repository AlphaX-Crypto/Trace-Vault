import React, { useState, useEffect } from 'react';
import { ArrowRight, SkipForward } from 'lucide-react';
import './IntroExperience.css';

export default function IntroExperience({ onComplete }) {
  // Sequence phases: 
  // 0: Telemetry init (0 - 1.6s)
  // 1: Wordmark & Core Creed (1.6s - 3.8s)
  // 2: Technical Topology Generation (3.8s - 6.2s)
  // 3: Investigation Flow Sequence (6.2s - 8.2s)
  // 4: System Ready / Enter (8.2s+)
  const [phase, setPhase] = useState(0);
  const [flowIndex, setFlowIndex] = useState(0);
  const [topologyStep, setTopologyStep] = useState(0);

  const FLOW_WORDS = ['TRACE', 'CONNECT', 'ANALYZE', 'EVIDENCE', 'REPORT'];

  useEffect(() => {
    // Timeline steps
    const timer1 = setTimeout(() => setPhase(1), 1600);
    const timer2 = setTimeout(() => {
      setPhase(2);
      setTopologyStep(1);
    }, 3800);
    const timerTopo2 = setTimeout(() => setTopologyStep(2), 4600);
    const timerTopo3 = setTimeout(() => setTopologyStep(3), 5400);

    const timer3 = setTimeout(() => {
      setPhase(3);
    }, 6200);

    const timer4 = setTimeout(() => {
      setPhase(4);
    }, 8400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timerTopo2);
      clearTimeout(timerTopo3);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Flow words sequence
  useEffect(() => {
    if (phase === 3) {
      const interval = setInterval(() => {
        setFlowIndex((prev) => (prev < FLOW_WORDS.length - 1 ? prev + 1 : prev));
      }, 400);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="tv-intro-container" role="dialog" aria-label="System Introduction">
      {/* Background subtle technical grid */}
      <div className="tv-intro-grid" aria-hidden="true" />

      {/* Top telemetry & Skip trigger */}
      <header className="tv-intro-header">
        <div className="tv-intro-telemetry">
          <span className="telemetry-item">TRACEVAULT // CORE ENGINE</span>
          <span className="telemetry-item">LE INVESTIGATION PLATFORM</span>
          <span className="telemetry-item">SEC 91 / SEC 65B PROTOCOL</span>
        </div>

        <button 
          type="button" 
          className="tv-intro-skip-btn" 
          onClick={onComplete}
          title="Skip cinematic introduction"
        >
          <span>SKIP INTRO</span>
          <SkipForward size={12} />
        </button>
      </header>

      {/* Center Cinematic Stage */}
      <main className="tv-intro-stage">
        {/* PHASE 0: Telemetry Initializing */}
        {phase === 0 && (
          <div className="stage-block phase-0-block">
            <span className="phase-micro-label">SYSTEM INITIALIZING</span>
            <div className="phase-init-bar">
              <div className="phase-init-progress" />
            </div>
            <span className="phase-init-ref technical">INDEXING NATIONAL REPOSITORIES</span>
          </div>
        )}

        {/* PHASE 1: Main Wordmark & Creed */}
        {phase === 1 && (
          <div className="stage-block phase-1-block">
            <h1 className="tv-intro-wordmark">TRACEVAULT</h1>
            <div className="tv-intro-tagline">INVESTIGATION PLATFORM</div>
            <div className="tv-intro-creed">
              <span className="creed-line">FOLLOW THE MOVEMENT.</span>
              <span className="creed-line">PRESERVE THE EVIDENCE.</span>
            </div>
          </div>
        )}

        {/* PHASE 2: Minimal Transaction Topology */}
        {phase === 2 && (
          <div className="stage-block phase-2-block">
            <div className="topology-title-bar">
              <span className="micro-label">TOPOLOGY INGESTION // UNIFIED GRAPH</span>
              <span className="technical text-muted">0x71c8...b29 ➔ CORRIDORS</span>
            </div>

            <svg 
              className="topology-canvas" 
              viewBox="0 0 600 240" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Subtle grid lines */}
              <line x1="40" y1="40" x2="560" y2="40" stroke="#16222f" strokeWidth="0.8" />
              <line x1="40" y1="120" x2="560" y2="120" stroke="#16222f" strokeWidth="0.8" />
              <line x1="40" y1="200" x2="560" y2="200" stroke="#16222f" strokeWidth="0.8" />

              {/* Edge 1: Source to Node 1 */}
              <line 
                x1="80" y1="120" x2="220" y2="120" 
                stroke="#24c7c9" 
                strokeWidth="1.2" 
                className="svg-edge-line"
              />

              {/* Edge 2: Node 1 branches to Node 2 (top) & Node 3 (bottom) */}
              {topologyStep >= 2 && (
                <>
                  <path 
                    d="M 220 120 L 320 60 L 400 60" 
                    stroke="#24c7c9" 
                    strokeWidth="1.2" 
                    fill="none"
                    className="svg-edge-line"
                  />
                  <path 
                    d="M 220 120 L 320 180 L 400 180" 
                    stroke="#24c7c9" 
                    strokeWidth="1.2" 
                    fill="none"
                    className="svg-edge-line"
                  />
                </>
              )}

              {/* Edge 3: Reconverge to VASP Node */}
              {topologyStep >= 3 && (
                <>
                  <path 
                    d="M 400 60 L 480 120 L 520 120" 
                    stroke="#24c7c9" 
                    strokeWidth="1.2" 
                    fill="none"
                    className="svg-edge-line"
                  />
                  <path 
                    d="M 400 180 L 480 120" 
                    stroke="#24c7c9" 
                    strokeWidth="1.2" 
                    fill="none"
                    className="svg-edge-line"
                  />
                </>
              )}

              {/* Nodes */}
              {/* Source Node */}
              <circle cx="80" cy="120" r="4.5" fill="#f8fafc" stroke="#24c7c9" strokeWidth="1.5" />
              <text x="80" y="142" textAnchor="middle" fill="#64748b" className="svg-node-text">SOURCE</text>

              {/* Hop 1 Node */}
              <circle cx="220" cy="120" r="3.5" fill="#24c7c9" />
              <text x="220" y="142" textAnchor="middle" fill="#64748b" className="svg-node-text">HOP 01</text>

              {/* Branched Nodes */}
              {topologyStep >= 2 && (
                <>
                  <circle cx="400" cy="60" r="3.5" fill="#24c7c9" />
                  <text x="400" y="48" textAnchor="middle" fill="#64748b" className="svg-node-text">PEEL LAYER</text>

                  <circle cx="400" cy="180" r="3.5" fill="#24c7c9" />
                  <text x="400" y="202" textAnchor="middle" fill="#64748b" className="svg-node-text">UPI SWITCH</text>
                </>
              )}

              {/* Terminal VASP Node */}
              {topologyStep >= 3 && (
                <>
                  <circle cx="520" cy="120" r="5" fill="#10b981" stroke="#f8fafc" strokeWidth="1" />
                  <text x="520" y="144" textAnchor="middle" fill="#10b981" className="svg-node-text font-bold">VASP ENDPOINT</text>
                </>
              )}
            </svg>
          </div>
        )}

        {/* PHASE 3: Investigation Flow Sequence */}
        {phase === 3 && (
          <div className="stage-block phase-3-block">
            <div className="flow-words-track">
              {FLOW_WORDS.map((word, i) => (
                <div 
                  key={word} 
                  className={`flow-word-item ${i === flowIndex ? 'active' : i < flowIndex ? 'past' : ''}`}
                >
                  <span className="flow-num technical">0{i + 1}</span>
                  <span className="flow-label">{word}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHASE 4: Final Ready Frame */}
        {phase === 4 && (
          <div className="stage-block phase-4-block">
            <div className="ready-eyebrow">
              <span className="status-dot-pulse" />
              <span>SYSTEM READY</span>
            </div>

            <h1 className="tv-intro-wordmark final">TRACEVAULT</h1>
            <div className="tv-intro-tagline">INVESTIGATION PLATFORM</div>

            <div className="ready-action-box">
              <button 
                type="button" 
                className="tv-btn-enter"
                onClick={onComplete}
              >
                <span>ENTER INVESTIGATION</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer telemetry */}
      <footer className="tv-intro-footer">
        <span className="technical text-muted">BUILD // 3.4.0-PROD</span>
        <span className="technical text-muted">FIPS 180-4 ATTESTED</span>
      </footer>
    </div>
  );
}
