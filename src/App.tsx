import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SetupView } from './components/SetupView';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';

function AppContent() {
  const { isConfigured, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<'setup' | 'login' | 'dashboard'>('setup');

  useEffect(() => {
    if (!isConfigured) {
      setCurrentView('setup');
    } else if (!isAuthenticated) {
      setCurrentView('login');
    } else {
      setCurrentView('dashboard');
    }
  }, [isConfigured, isAuthenticated]);

  if (currentView === 'setup') {
    return <SetupView />;
  }

  if (currentView === 'login') {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-spotify-gray">
      <DashboardView />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
