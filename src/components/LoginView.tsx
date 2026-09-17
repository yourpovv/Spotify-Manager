import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildAuthUrl, exchangeCodeForToken, loadConfig } from '../lib/auth';

export function LoginView() {
  const { authenticate } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      handleCallback(code);
    }
  }, []);

  async function handleCallback(code: string): Promise<void> {
    const config = loadConfig();
    if (!config) {
      return;
    }

    try {
      const token = await exchangeCodeForToken(code, config);
      await authenticate(token);
      window.history.replaceState({}, document.title, '/');
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }

  function handleLogin(): void {
    const config = loadConfig();
    if (!config) {
      return;
    }

    const authUrl = buildAuthUrl(config);
    window.location.href = authUrl;
  }

  return (
    <div className="min-h-screen bg-spotify-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <svg
          className="w-32 h-32 mx-auto mb-8 text-spotify-green"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1. 559.3z"/>
        </svg>
        
        <h1 className="text-5xl font-bold text-white mb-4">Connect to Spotify</h1>
        <p className="text-xl text-gray-400 mb-12">
          Sign in with your Spotify account to manage your playlists
        </p>

        <button
          onClick={handleLogin}
          className="inline-flex items-center gap-3 bg-spotify-green text-black font-semibold text-lg py-4 px-8 rounded-full hover:bg-green-400 transition-all hover:scale-105"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Login with Spotify
        </button>
      </div>
    </div>
  );
}
