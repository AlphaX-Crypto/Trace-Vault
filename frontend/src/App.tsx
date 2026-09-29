import React, { useState } from 'react';
import { CinematicHero } from './features/hero/CinematicHero';
import { ApplicationShellPlaceholder } from './components/layout/ApplicationShellPlaceholder';

export const App: React.FC = () => {
  const [view, setView] = useState<'hero' | 'application'>('hero');

  return (
    <div className="w-full h-full">
      {view === 'hero' ? (
        <CinematicHero onEnterApplication={() => setView('application')} />
      ) : (
        <ApplicationShellPlaceholder onReturnToHero={() => setView('hero')} />
      )}
    </div>
  );
};

export default App;
