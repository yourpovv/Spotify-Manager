import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadConfig } from '../lib/auth';
import type { SpotifyConfig } from '../types/spotify';

export function SettingsView() {
  const { setConfiguration } = useAuth();
  const config = loadConfig();
  
  const [clientId, setClientId] = useState(config?.clientId || '');
  const [clientSecret, setClientSecret] = useState(config?.clientSecret || '');
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    
    if (!clientId || !clientSecret) return;

    const newConfig: SpotifyConfig = {
      clientId,
      clientSecret,
      redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://127.0.0.1:9876/callback',
    };

    setConfiguration(newConfig);
    setSaved(true);
    
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-spotify-lightgray rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">API Configuration</h2>

          <div className="mb-4">
            <label htmlFor="clientId" className="block text-sm font-medium text-white mb-2">
              Client ID
            </label>
            <input
              type="text"
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-3 bg-spotify-gray border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
              placeholder="Enter your Spotify Client ID"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="clientSecret" className="block text-sm font-medium text-white mb-2">
              Client Secret
            </label>
            <input
              type="password"
              id="clientSecret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full px-4 py-3 bg-spotify-gray border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
              placeholder="Enter your Spotify Client Secret"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-spotify-green text-black font-semibold py-3 px-6 rounded-full hover:bg-green-400 transition-colors"
          >
            Update Configuration
          </button>

          {saved && (
            <p className="mt-4 text-center text-spotify-green font-medium">
              Configuration saved successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
