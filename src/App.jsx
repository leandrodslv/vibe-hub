import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import WorkspacePage from './pages/WorkspacePage';
import AdminPage from './pages/AdminPage';

const isAdminRoute = window.location.pathname === '/admin';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'app'
  const [initialTab, setInitialTab] = useState('ia');

  if (isAdminRoute) return <AdminPage />;

  const handleEnterApp = (tab = 'ia') => {
    setInitialTab(tab);
    setView('app');
  };

  if (view === 'app') {
    return (
      <WorkspacePage
        initialTab={initialTab}
        onBack={() => setView('landing')}
      />
    );
  }

  return (
    <LandingPage
      onEnterApp={() => handleEnterApp('ia')}
      onEnterModules={() => handleEnterApp('modules')}
      // Wrappers explicites : passer `handleEnterApp` directement à un onClick lui ferait
      // recevoir l'événement souris comme paramètre `tab`.
      onEnterTab={(tab) => handleEnterApp(tab)}
    />
  );
}
