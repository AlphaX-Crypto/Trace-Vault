import React, { useState } from 'react';
import { SimpleLanding } from './features/home/SimpleLanding';
import { SignInPage } from './features/auth/SignInPage';
import { SimpleWorkspace } from './features/app/SimpleWorkspace';

export const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'signin' | 'app'>('landing');

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-[#111827]">
      {view === 'landing' && (
        <SimpleLanding
          onSignInClick={() => setView('signin')}
          onExploreClick={() => setView('signin')}
        />
      )}

      {view === 'signin' && (
        <SignInPage
          onSignInSuccess={() => setView('app')}
          onReturnHome={() => setView('landing')}
        />
      )}

      {view === 'app' && (
        <SimpleWorkspace onSignOut={() => setView('landing')} />
      )}
    </div>
  );
};

export default App;
