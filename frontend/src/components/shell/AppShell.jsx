import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SystemHeader from './SystemHeader';
import Sidebar from './Sidebar';
import StatusIndicator from './StatusIndicator';
import IntroExperience from '../intro/IntroExperience';
import './AppShell.css';

export default function AppShell() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(() => {
    // Show intro on first arrival or if manually triggered
    const seen = sessionStorage.getItem('tv_intro_played');
    return !seen && location.pathname === '/dashboard';
  });

  function handleIntroComplete() {
    sessionStorage.setItem('tv_intro_played', 'true');
    setShowIntro(false);
  }

  function handleReplayIntro() {
    setShowIntro(true);
  }

  return (
    <div className="tv-app-shell">
      {/* Cinematic Layer (Layer 1) */}
      {showIntro && (
        <IntroExperience onComplete={handleIntroComplete} />
      )}

      {/* Investigation Application (Layer 2) */}
      <SystemHeader onReplayIntro={handleReplayIntro} />
      <Sidebar />

      <main className="tv-main-workspace anim-enter-workspace" id="main-content">
        <Outlet />
      </main>

      <StatusIndicator />
    </div>
  );
}
