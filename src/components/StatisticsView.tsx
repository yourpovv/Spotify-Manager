import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { SpotifyTrack } from '../types/spotify';

interface PlaylistStats {
  totalPlaylists: number;
  totalTracks: number;
  totalDuration: number;
  averageTracksPerPlaylist: number;
  largestPlaylist: { name: string; tracks: number } | null;
  topArtists: Array<{ name: string; count: number }>;
  recentTracks: SpotifyTrack[];
}

export function StatisticsView() {
  const { client } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlaylistStats>({
    totalPlaylists: 0,
    totalTracks: 0,
    totalDuration: 0,
    averageTracksPerPlaylist: 0,
    largestPlaylist: null,
    topArtists: [],
    recentTracks: [],
  });

  useEffect(() => {
    loadStatistics();
  }, [client]);

  async function loadStatistics(): Promise<void> {
    if (!client) return;

    try {
      setLoading(true);
      const playlists = await client.getPlaylists();
      
      let recentTracks: SpotifyTrack[] = [];
      try {
        recentTracks = await client.getRecentlyPlayed(20);
      } catch (error) {
        console.log('Recently played not available');
      }

      const totalPlaylists = playlists.length;
      const totalTracks = playlists.reduce((sum, p) => sum + p.tracks.total, 0);
      
      let largestPlaylist: { name: string; tracks: number } | null = null;
      if (playlists.length > 0) {
        const largest = playlists.reduce((max, p) => 
          p.tracks.total > max.tracks.total ? p : max
        );
        largestPlaylist = { name: largest.name, tracks: largest.tracks.total };
      }

      const sampleSize = Math.min(5, playlists.length);
      const sampledPlaylists = playlists.slice(0, sampleSize);
      
      let totalDuration = 0;
      const artistCounts: Record<string, number> = {};

      for (const playlist of sampledPlaylists) {
        try {
          const tracks = await client.getPlaylistTracks(playlist.id);
          tracks.forEach(track => {
            if (track.durationMs && !isNaN(track.durationMs)) {
              totalDuration += track.durationMs;
            }
            track.artists.forEach(artist => {
              artistCounts[artist.name] = (artistCounts[artist.name] || 0) + 1;
            });
          });
        } catch (error) {
          console.error(`Failed to load tracks for ${playlist.name}`, error);
        }
      }

      const topArtists = Object.entries(artistCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setStats({
        totalPlaylists,
        totalTracks,
        totalDuration,
        averageTracksPerPlaylist: totalPlaylists > 0 ? Math.round(totalTracks / totalPlaylists) : 0,
        largestPlaylist,
        topArtists,
        recentTracks,
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(ms: number): string {
    if (!ms || isNaN(ms) || ms <= 0) {
      return '0m';
    }
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Analyzing your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Your Statistics</h1>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-spotify-lightgray rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-spotify-green" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
            <span className="text-gray-400 text-sm">Playlists</span>
          </div>
          <p className="text-4xl font-bold text-white">{stats.totalPlaylists}</p>
        </div>

        <div className="bg-spotify-lightgray rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-spotify-green" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <span className="text-gray-400 text-sm">Total Tracks</span>
          </div>
          <p className="text-4xl font-bold text-white">{stats.totalTracks.toLocaleString()}</p>
        </div>

        <div className="bg-spotify-lightgray rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-spotify-green" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <span className="text-gray-400 text-sm">Music Time</span>
          </div>
          <p className="text-4xl font-bold text-white">{formatDuration(stats.totalDuration)}</p>
          <p className="text-gray-500 text-xs mt-1">(from sample)</p>
        </div>

        <div className="bg-spotify-lightgray rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-spotify-green" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
            </svg>
            <span className="text-gray-400 text-sm">Avg Tracks</span>
          </div>
          <p className="text-4xl font-bold text-white">{stats.averageTracksPerPlaylist}</p>
          <p className="text-gray-500 text-xs mt-1">per playlist</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        {stats.topArtists.length > 0 && (
          <div className="bg-spotify-lightgray rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🎤</span>
              Top Artists
              <span className="text-sm font-normal text-gray-500">(from sample)</span>
            </h2>
            <div className="space-y-3">
              {stats.topArtists.map((artist, index) => (
                <div key={artist.name} className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-600 w-8">{index + 1}</span>
                  <div className="flex-1">
                    <p className="text-white font-medium">{artist.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-spotify-gray rounded-full overflow-hidden">
                        <div
                          className="h-full bg-spotify-green rounded-full transition-all"
                          style={{
                            width: `${(artist.count / (stats.topArtists[0]?.count || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm">{artist.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {stats.largestPlaylist && (
          <div className="bg-spotify-lightgray rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🏆</span>
              Largest Playlist
            </h2>
            <div className="text-center py-8">
              <p className="text-6xl font-bold text-spotify-green mb-4">
                {stats.largestPlaylist.tracks}
              </p>
              <p className="text-xl text-white font-medium mb-2">tracks in</p>
              <p className="text-2xl text-gray-300">"{stats.largestPlaylist.name}"</p>
            </div>
          </div>
        )}

        {}
        {stats.recentTracks.length > 0 && (
          <div className="bg-spotify-lightgray rounded-lg p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🕒</span>
              Recently Played
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.recentTracks.slice(0, 10).map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className="flex items-center gap-3 p-3 bg-spotify-gray rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {track.album.images && track.album.images[0] && (
                    <img
                      src={track.album.images[track.album.images.length - 1]?.url || ''}
                      alt={track.album.name}
                      className="w-12 h-12 rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-sm">{track.name}</p>
                    <p className="text-gray-400 text-xs truncate">
                      {track.artists.map(a => a.name).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
