export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface SpotifyToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  expiresAt?: number;
}

export interface SpotifyUser {
  id: string;
  displayName: string;
  email: string;
  images: SpotifyImage[];
  product: string;
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  owner: SpotifyUser;
  public: boolean;
  tracks: {
    total: number;
  };
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  durationMs: number;
  explicit?: boolean;
  popularity?: number;
  trackNumber?: number;
  previewUrl?: string;
  externalUrls?: {
    spotify: string;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  externalUrls?: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  totalTracks?: number;
  releaseDate?: string;
}

export interface PlaylistCreateRequest {
  name: string;
  description?: string;
  public?: boolean;
}

export interface SearchTracksRequest {
  query: string;
  limit?: number;
}
