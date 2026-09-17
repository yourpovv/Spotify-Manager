import type {
  SpotifyUser,
  SpotifyPlaylist,
  SpotifyTrack,
  PlaylistCreateRequest,
  SearchTracksRequest,
} from '../types/spotify';
import { ApiError, NetworkError } from '../lib/errors';

const BASE_URL = 'https://api.spotify.com/v1';

export class SpotifyClient {
  constructor(private accessToken: string) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new ApiError(
          `API request failed: ${response.statusText}`,
          response.status
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new NetworkError('Network request failed');
    }
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    return this.request<SpotifyUser>('/me');
  }

  async getPlaylists(): Promise<SpotifyPlaylist[]> {
    const playlists: SpotifyPlaylist[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const response = await this.request<{ items: SpotifyPlaylist[] }>(
        `/me/playlists?limit=${limit}&offset=${offset}`
      );

      playlists.push(...response.items);

      if (response.items.length < limit) {
        break;
      }

      offset += limit;
    }

    return playlists;
  }

  async createPlaylist(
    userId: string,
    request: PlaylistCreateRequest
  ): Promise<SpotifyPlaylist> {
    return this.request<SpotifyPlaylist>(`/users/${userId}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name: request.name,
        description: request.description || '',
        public: request.public ?? true,
      }),
    });
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.request(`/playlists/${playlistId}/followers`, {
      method: 'DELETE',
    });
  }

  async searchTracks(request: SearchTracksRequest): Promise<SpotifyTrack[]> {
    const limit = request.limit || 20;
    const params = new URLSearchParams({
      q: request.query,
      type: 'track',
      limit: limit.toString(),
    });

    const response = await this.request<{ tracks: { items: SpotifyTrack[] } }>(
      `/search?${params}`
    );

    return response.tracks.items;
  }

  async addTracksToPlaylist(
    playlistId: string,
    trackUris: string[]
  ): Promise<void> {
    await this.request(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: trackUris }),
    });
  }

  async removeTracksFromPlaylist(
    playlistId: string,
    trackUris: string[]
  ): Promise<void> {
    await this.request(`/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      body: JSON.stringify({
        tracks: trackUris.map(uri => ({ uri })),
      }),
    });
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await this.request<{
        items: Array<{ track: SpotifyTrack }>;
      }>(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);

      tracks.push(...response.items.map(item => item.track));

      if (response.items.length < limit) {
        break;
      }

      offset += limit;
    }

    return tracks;
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    return this.request<SpotifyPlaylist>(`/playlists/${playlistId}`);
  }

  async getRecentlyPlayed(limit: number = 50): Promise<SpotifyTrack[]> {
    const response = await this.request<{
      items: Array<{ track: SpotifyTrack }>;
    }>(`/me/player/recently-played?limit=${limit}`);
    
    return response.items.map(item => item.track);
  }

  async updatePlaylistDetails(
    playlistId: string,
    updates: { name?: string; description?: string; public?: boolean }
  ): Promise<void> {
    await this.request(`/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async replacePlaylistTracks(
    playlistId: string,
    trackUris: string[]
  ): Promise<void> {
    const chunks: string[][] = [];
    for (let i = 0; i < trackUris.length; i += 100) {
      chunks.push(trackUris.slice(i, i + 100));
    }

    if (chunks.length > 0) {
      await this.request(`/playlists/${playlistId}/tracks`, {
        method: 'PUT',
        body: JSON.stringify({ uris: chunks[0] }),
      });
    }

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk) {
        await this.addTracksToPlaylist(playlistId, chunk);
      }
    }
  }
}
