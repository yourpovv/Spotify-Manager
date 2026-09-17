import { useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { PlaylistsView } from './PlaylistsView';
import { SearchView } from './SearchView';
import { SettingsView } from './SettingsView';
import { ToolsView } from './ToolsView';
import { StatisticsView } from './StatisticsView';
import { Sidebar } from './Sidebar';

export function DashboardView() {
  const [currentView, setCurrentView] = useState<'playlists' | 'search' | 'tools' | 'statistics' | 'settings'>('playlists');

  useKeyboardShortcuts({
    'ctrl+1': () => setCurrentView('playlists'),
    'ctrl+2': () => setCurrentView('search'),
    'ctrl+3': () => setCurrentView('tools'),
    'ctrl+4': () => setCurrentView('statistics'),
    'ctrl+5': () => setCurrentView('settings'),
    'ctrl+k': () => setCurrentView('search'),
    'ctrl+p': () => setCurrentView('playlists'),
  });

  return (
    <>
      <Sidebar onViewChange={setCurrentView} />
      <main className="flex-1 overflow-y-auto">
        {currentView === 'playlists' && <PlaylistsView />}
        {currentView === 'search' && <SearchView />}
        {currentView === 'tools' && <ToolsView />}
        {currentView === 'statistics' && <StatisticsView />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </>
  );
}
