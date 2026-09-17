import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import type { SpotifyConfig } from '../types/spotify';

export function SetupView() {
  const { setConfiguration } = useAuth();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    
    if (!clientId || !clientSecret) {
      return;
    }

    const config: SpotifyConfig = {
      clientId,
      clientSecret,
      redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://127.0.0.1:9876/callback',
    };

    setConfiguration(config);
  }

  return (
    <div className="min-h-screen bg-spotify-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <svg
            className="w-20 h-20 mx-auto mb-6 text-spotify-green"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Spotify Manager</h1>
          <p className="text-gray-400">Configure your Spotify API credentials to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-spotify-lightgray rounded-lg p-8">
          <div className="mb-6">
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
            Save Configuration
          </button>
        </form>

        <div className="mt-6 bg-spotify-lightgray rounded-lg p-6 text-sm text-gray-300">
          <h3 className="font-semibold text-white mb-3">How to get your credentials:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-spotify-green hover:underline">Spotify Developer Dashboard</a></li>
            <li>Create a new app or select an existing one</li>
            <li>Copy the Client ID and Client Secret</li>
            <li>Add <code className="bg-spotify-gray px-2 py-1 rounded">http://127.0.0.1:9876/callback</code> to Redirect URIs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
