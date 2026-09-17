import { useState, FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { SpotifyTrack, SpotifyPlaylist } from '../types/spotify';

export function SearchView() {
  const { client } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'explicit' | 'clean'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'popularity' | 'duration'>('relevance');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('search_history');
    return saved ? JSON.parse(saved) : [];
  });
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, client]);

  async function performSearch(searchQuery: string): Promise<void> {
    if (!client || !searchQuery.trim()) return;

    try {
      setLoading(true);
      const tracks = await client.searchTracks({ query: searchQuery, limit: 50 });
      setResults(tracks);

      setSearchHistory(prevHistory => {
        const newHistory = [searchQuery, ...prevHistory.filter(q => q !== searchQuery)].slice(0, 10);
        localStorage.setItem('search_history', JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    await performSearch(query);
  }

  function getFilteredAndSortedResults(): SpotifyTrack[] {
    let filtered = [...results];

    if (filterType === 'explicit') {
      filtered = filtered.filter(track => track.explicit);
    } else if (filterType === 'clean') {
      filtered = filtered.filter(track => !track.explicit);
    }

    if (sortBy === 'popularity') {
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sortBy === 'duration') {
      filtered.sort((a, b) => b.durationMs - a.durationMs);
    }

    return filtered;
  }

  function toggleTrackSelection(trackId: string): void {
    const newSelection = new Set(selectedTracks);
    if (newSelection.has(trackId)) {
      newSelection.delete(trackId);
    } else {
      newSelection.add(trackId);
    }
    setSelectedTracks(newSelection);
  }

  function selectAll(): void {
    const filtered = getFilteredAndSortedResults();
    setSelectedTracks(new Set(filtered.map(t => t.id)));
  }

  function clearSelection(): void {
    setSelectedTracks(new Set());
  }

  async function handleAddToPlaylist(track: SpotifyTrack): Promise<void> {
    if (!client) return;

    setSelectedTrack(track);
    
    try {
      const userPlaylists = await client.getPlaylists();
      setPlaylists(userPlaylists);
      setShowPlaylistModal(true);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }

  async function handleBatchAdd(): Promise<void> {
    if (!client || selectedTracks.size === 0) return;
    
    try {
      const userPlaylists = await client.getPlaylists();
      setPlaylists(userPlaylists);
      setShowPlaylistModal(true);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }

  async function addTrackToPlaylist(playlistId: string): Promise<void> {
    if (!client) return;

    try {
      if (batchMode && selectedTracks.size > 0) {
        const trackUris = Array.from(selectedTracks).map(id => `spotify:track:${id}`);
        await client.addTracksToPlaylist(playlistId, trackUris);
        alert(`${trackUris.length} tracks added successfully!`);
        clearSelection();
        setBatchMode(false);
      } else if (selectedTrack) {
        await client.addTracksToPlaylist(playlistId, [`spotify:track:${selectedTrack.id}`]);
        alert('Track added successfully!');
      }
      
      setShowPlaylistModal(false);
      setSelectedTrack(null);
    } catch (error) {
      console.error('Failed to add track:', error);
      alert('Failed to add track');
    }
  }

  function exportResults(): void {
    const filtered = getFilteredAndSortedResults();
    const text = filtered.map(track => 
      `${track.name} - ${track.artists.map(a => a.name).join(', ')} (${track.album.name})`
    ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spotify-search-${query}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openInSpotify(trackId: string): void {
    window.open(`https://open.spotify.com/track/${trackId}`, '_blank');
  }

  function loadHistoryQuery(historyQuery: string): void {
    setQuery(historyQuery);
  }

  function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-white">Search Tracks</h1>
        {results.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={exportResults}
              className="flex items-center gap-2 px-4 py-2 bg-spotify-lightgray text-white rounded-full hover:bg-gray-700 transition-colors text-sm"
              title="Export results to text file"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
              </svg>
              Export
            </button>
            <button
              onClick={() => {
                setBatchMode(!batchMode);
                if (batchMode) clearSelection();
              }}
              className={`px-4 py-2 rounded-full transition-colors text-sm font-semibold ${
                batchMode 
                  ? 'bg-spotify-green text-black' 
                  : 'bg-spotify-lightgray text-white hover:bg-gray-700'
              }`}
            >
              {batchMode ? 'Exit Batch Mode' : 'Batch Select'}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSearch} className="max-w-2xl mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Start typing to search tracks, artists, or albums..."
            className="w-full px-6 py-4 bg-spotify-lightgray border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </form>

      {searchHistory.length > 0 && !results.length && (
        <div className="max-w-2xl mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((historyQuery, index) => (
              <button
                key={index}
                onClick={() => loadHistoryQuery(historyQuery)}
                className="px-4 py-2 bg-spotify-lightgray text-gray-300 rounded-full hover:bg-gray-700 transition-colors text-sm"
              >
                {historyQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'explicit' | 'clean')}
              className="px-4 py-2 bg-spotify-lightgray border border-gray-700 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-spotify-green"
            >
              <option value="all">All Tracks</option>
              <option value="explicit">Explicit Only</option>
              <option value="clean">Clean Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevance' | 'popularity' | 'duration')}
              className="px-4 py-2 bg-spotify-lightgray border border-gray-700 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-spotify-green"
            >
              <option value="relevance">Relevance</option>
              <option value="popularity">Popularity</option>
              <option value="duration">Duration</option>
            </select>
          </div>

          {batchMode && (
            <>
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-spotify-lightgray text-white rounded-full hover:bg-gray-700 transition-colors text-sm"
              >
                Select All ({getFilteredAndSortedResults().length})
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-spotify-lightgray text-white rounded-full hover:bg-gray-700 transition-colors text-sm"
              >
                Clear ({selectedTracks.size})
              </button>
              {selectedTracks.size > 0 && (
                <button
                  onClick={handleBatchAdd}
                  className="px-6 py-2 bg-spotify-green text-black font-semibold rounded-full hover:bg-green-400 transition-colors text-sm"
                >
                  Add {selectedTracks.size} tracks to playlist
                </button>
              )}
            </>
          )}

          <span className="text-sm text-gray-400 ml-auto">
            {getFilteredAndSortedResults().length} results
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {getFilteredAndSortedResults().map(track => (
            <div
              key={track.id}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                selectedTracks.has(track.id) && batchMode
                  ? 'bg-spotify-green bg-opacity-20 border-2 border-spotify-green'
                  : 'bg-spotify-lightgray hover:bg-gray-700'
              }`}
            >
              {batchMode && (
                <input
                  type="checkbox"
                  checked={selectedTracks.has(track.id)}
                  onChange={() => toggleTrackSelection(track.id)}
                  className="w-5 h-5 rounded border-gray-600 text-spotify-green focus:ring-spotify-green focus:ring-offset-spotify-gray"
                />
              )}
              
              {track.album.images && track.album.images[0] && (
                <img
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  className="w-14 h-14 rounded"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-medium truncate">{track.name}</p>
                  {track.explicit && (
                    <span className="px-1.5 py-0.5 bg-gray-600 text-gray-300 text-xs font-bold rounded">
                      E
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm truncate mb-1">
                  {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                </p>
                {track.popularity !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-spotify-green rounded-full transition-all"
                        style={{ width: `${track.popularity}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{track.popularity}%</span>
                  </div>
                )}
              </div>
              
              {!batchMode && (
                <>
                  <button
                    onClick={() => openInSpotify(track.id)}
                    className="p-2 text-gray-400 hover:text-spotify-green transition-colors"
                    title="Open in Spotify"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </button>

                  <button
                    onClick={() => handleAddToPlaylist(track)}
                    className="px-4 py-2 bg-spotify-green text-black font-semibold rounded-full hover:bg-green-400 transition-colors text-sm"
                  >
                    Add
                  </button>
                </>
              )}

              <span className="text-gray-400 text-sm tabular-nums">
                {formatDuration(track.durationMs)}
              </span>
            </div>
          ))}
        </div>
      ) : query && !loading ? (
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <p className="text-gray-400 text-lg mb-2">No results found for "{query}"</p>
          <p className="text-gray-500 text-sm">Try different keywords or check your spelling</p>
        </div>
      ) : null}

      {showPlaylistModal && (selectedTrack || selectedTracks.size > 0) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-spotify-lightgray rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Add to Playlist</h2>
              <button
                onClick={() => {
                  setShowPlaylistModal(false);
                  setSelectedTrack(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            {batchMode && selectedTracks.size > 0 ? (
              <p className="text-gray-300 mb-4">
                Adding <span className="font-semibold text-spotify-green">{selectedTracks.size} tracks</span> to playlist
              </p>
            ) : selectedTrack && (
              <p className="text-gray-300 mb-4">
                Adding: <span className="font-semibold text-white">{selectedTrack.name}</span>
              </p>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {playlists.map(playlist => (
                <button
                  key={playlist.id}
                  onClick={() => addTrackToPlaylist(playlist.id)}
                  className="w-full flex items-center gap-3 p-3 bg-spotify-black rounded-lg hover:bg-gray-900 transition-colors text-left"
                >
                  {playlist.images && playlist.images[0] ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-12 h-12 rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{playlist.name}</p>
                    <p className="text-gray-400 text-sm">{playlist.tracks.total} tracks</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
