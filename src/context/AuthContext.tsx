import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import type { SpotifyConfig, SpotifyToken, SpotifyUser } from '../types/spotify';
import { SpotifyClient } from '../api/spotify';
import { 
  loadToken, 
  loadConfig, 
  saveToken, 
  saveConfig, 
  clearToken,
  refreshAccessToken,
  isTokenExpired,
} from '../lib/auth';

interface AuthContextValue {
  isConfigured: boolean;
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  client: SpotifyClient | null;
  setConfiguration: (config: SpotifyConfig) => void;
  authenticate: (token: SpotifyToken) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [client, setClient] = useState<SpotifyClient | null>(null);
  const [, setCurrentToken] = useState<SpotifyToken | null>(null);
  const refreshIntervalRef = useRef<number>();

  useEffect(() => {
    const config = loadConfig();
    setIsConfigured(!!config);

    const token = loadToken();
    if (token && config) {
      setCurrentToken(token);
      initializeClient(token, config);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  async function initializeClient(token: SpotifyToken, config: SpotifyConfig): Promise<void> {
    try {
      let activeToken = token;

      if (isTokenExpired(token) && token.refreshToken) {
        activeToken = await refreshAccessToken(token.refreshToken, config);
        saveToken(activeToken);
        setCurrentToken(activeToken);
      }

      const newClient = new SpotifyClient(activeToken.accessToken);
      setClient(newClient);
      
      const userData = await newClient.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      refreshIntervalRef.current = window.setInterval(async () => {
        const currentConfig = loadConfig();
        const latestToken = loadToken();
        
        if (latestToken && currentConfig && latestToken.refreshToken && isTokenExpired(latestToken)) {
          try {
            const refreshedToken = await refreshAccessToken(latestToken.refreshToken, currentConfig);
            saveToken(refreshedToken);
            setCurrentToken(refreshedToken);
            setClient(new SpotifyClient(refreshedToken.accessToken));
          } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
          }
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Failed to initialize client:', error);
      clearToken();
    }
  }

  function setConfiguration(config: SpotifyConfig): void {
    saveConfig(config);
    setIsConfigured(true);
  }

  async function authenticate(token: SpotifyToken): Promise<void> {
    const config = loadConfig();
    if (!config) return;

    saveToken(token);
    setCurrentToken(token);
    await initializeClient(token, config);
  }

  function logout(): void {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    clearToken();
    setIsAuthenticated(false);
    setUser(null);
    setClient(null);
    setCurrentToken(null);
  }

  const value: AuthContextValue = {
    isConfigured,
    isAuthenticated,
    user,
    client,
    setConfiguration,
    authenticate,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
