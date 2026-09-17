import type { SpotifyConfig, SpotifyToken } from '../types/spotify';
import { AuthError } from '../lib/errors';

const TOKEN_KEY = 'spotify_token';
const CONFIG_KEY = 'spotify_config';

export function saveToken(token: SpotifyToken): void {
  const tokenWithExpiry = {
    ...token,
    expiresAt: Date.now() + token.expiresIn * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenWithExpiry));
}

export function loadToken(): SpotifyToken | null {
  const data = localStorage.getItem(TOKEN_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as SpotifyToken;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function saveConfig(config: SpotifyConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function loadConfig(): SpotifyConfig | null {
  const data = localStorage.getItem(CONFIG_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as SpotifyConfig;
  } catch {
    return null;
  }
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

export async function exchangeCodeForToken(
  code: string,
  config: SpotifyConfig
): Promise<SpotifyToken> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
  });

  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    throw new AuthError('Failed to exchange code for token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  config: SpotifyConfig
): Promise<SpotifyToken> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    throw new AuthError('Failed to refresh token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token || refreshToken,
  };
}

export function isTokenExpired(token: SpotifyToken): boolean {
  if (!token.expiresAt) return false;
  return Date.now() >= token.expiresAt - 60000; // 1 min buffer
}

export function buildAuthUrl(config: SpotifyConfig): string {
  const scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-email',
    'user-read-private',
  ];

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: scopes.join(' '),
  });

  return `https://accounts.spotify.com/authorize?${params}`;
}
