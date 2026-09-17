import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { SpotifyPlaylist } from '../types/spotify';
import { PlaylistCard } from './PlaylistCard';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { PlaylistDetailsModal } from './PlaylistDetailsModal';

export function PlaylistsView() {
  const { client, user } = useAuth();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'tracks' | 'recent'>('name');
  const [filterType, setFilterType] = useState<'all' | 'owned' | 'followed' | 'public' | 'private'>('all');
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPlaylists();
  }, [client]);

  useEffect(() => {
    filterAndSortPlaylists();
  }, [playlists, searchQuery, sortBy, filterType]);

  function filterAndSortPlaylists(): void {
    let filtered = [...playlists];

    if (filterType === 'owned' && user) {
      filtered = filtered.filter(p => p.owner.id === user.id);
    } else if (filterType === 'followed' && user) {
      filtered = filtered.filter(p => p.owner.id !== user.id);
    } else if (filterType === 'public') {
      filtered = filtered.filter(p => p.public);
    } else if (filterType === 'private') {
      filtered = filtered.filter(p => !p.public);
    }

    if (searchQuery) {
      filtered = filtered.filter(playlist =>
        playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.owner.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'tracks':
          return b.tracks.total - a.tracks.total;
        case 'recent':
          return 0;
        default:
          return 0;
      }
    });

    setFilteredPlaylists(filtered);
  }

  async function loadPlaylists(): Promise<void> {
    if (!client) return;

    try {
      setLoading(true);
      const data = await client.getPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(playlistId: string): Promise<void> {
    if (!client) return;
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await client.deletePlaylist(playlistId);
      await loadPlaylists();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  }

  async function handleDuplicate(playlistId: string): Promise<void> {
    if (!client) return;
    
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const newName = `${playlist.name} (Copy)`;
    if (!confirm(`Duplicate "${playlist.name}" as "${newName}"?`)) return;

    try {
      const user = await client.getCurrentUser();
      
      await client.createPlaylist(user.id, {
        name: newName,
        description: playlist.description || '',
        public: playlist.public,
      });

      alert(`Playlist "${newName}" created! Note: Tracks are not copied due to API limitations.`);
      await loadPlaylists();
    } catch (error) {
      console.error('Failed to duplicate playlist:', error);
      alert('Failed to duplicate playlist');
    }
  }

  function handleShare(playlistId: string): void {
    const url = `https://open.spotify.com/playlist/${playlistId}`;
    navigator.clipboard.writeText(url);
    alert('Playlist link copied to clipboard!');
  }

  async function handleBulkDelete(): Promise<void> {
    if (!client || selectedPlaylists.size === 0) return;
    
    if (!confirm(`Delete ${selectedPlaylists.size} selected playlists? This cannot be undone!`)) return;

    try {
      setLoading(true);
      for (const playlistId of Array.from(selectedPlaylists)) {
        await client.deletePlaylist(playlistId);
      }
      alert(`Successfully deleted ${selectedPlaylists.size} playlists`);
      setSelectedPlaylists(new Set());
      setBulkSelectMode(false);
      await loadPlaylists();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Failed to delete some playlists');
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoSort(playlistId: string): Promise<void> {
    if (!client) return;
    
    const sortOption = prompt('Sort by:\n1 = Alphabetical\n2 = Artist\n3 = Album\n4 = Duration', '1');
    if (!sortOption || !['1', '2', '3', '4'].includes(sortOption)) return;

    try {
      setLoading(true);
      const tracks = await client.getPlaylistTracks(playlistId);
      
      let sorted = [...tracks];
      switch (sortOption) {
        case '1':
          sorted.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case '2':
          sorted.sort((a, b) => (a.artists[0]?.name || '').localeCompare(b.artists[0]?.name || ''));
          break;
        case '3':
          sorted.sort((a, b) => a.album.name.localeCompare(b.album.name));
          break;
        case '4':
          sorted.sort((a, b) => a.durationMs - b.durationMs);
          break;
      }

      const sortedUris = sorted.map(t => `spotify:track:${t.id}`);
      await client.replacePlaylistTracks(playlistId, sortedUris);
      
      alert('Playlist sorted successfully!');
      await loadPlaylists();
    } catch (error) {
      console.error('Auto-sort failed:', error);
      alert('Failed to sort playlist');
    } finally {
      setLoading(false);
    }
  }

  function togglePlaylistSelection(playlistId: string): void {
    setSelectedPlaylists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  }

  function selectAllFiltered(): void {
    setSelectedPlaylists(new Set(filteredPlaylists.map(p => p.id)));
  }

  function clearSelection(): void {
    setSelectedPlaylists(new Set());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-white">Your Playlists</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setBulkSelectMode(!bulkSelectMode);
              if (bulkSelectMode) clearSelection();
            }}
            className={`flex items-center gap-2 py-3 px-6 rounded-full font-semibold transition-colors ${
              bulkSelectMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-spotify-lightgray text-white hover:bg-gray-700'
            }`}
          >
            {bulkSelectMode ? 'Exit Bulk Mode' : 'Bulk Select'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-spotify-green text-black font-semibold py-3 px-6 rounded-full hover:bg-green-400 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Create Playlist
          </button>
        </div>
      </div>

      {}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter playlists..."
          className="flex-1 min-w-64 px-4 py-2 bg-spotify-lightgray border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
        />
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="px-4 py-2 bg-spotify-lightgray border border-gray-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
        >
          <option value="all">All Playlists</option>
          <option value="owned">My Playlists</option>
          <option value="followed">Followed</option>
          <option value="public">Public Only</option>
          <option value="private">Private Only</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'tracks' | 'recent')}
          className="px-4 py-2 bg-spotify-lightgray border border-gray-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
        >
          <option value="name">Sort by Name</option>
          <option value="tracks">Sort by Tracks</option>
          <option value="recent">Recent</option>
        </select>

        <span className="px-4 py-2 bg-spotify-lightgray rounded-full text-gray-400 text-sm flex items-center">
          {filteredPlaylists.length} of {playlists.length}
        </span>
      </div>

      {}
      {bulkSelectMode && (
        <div className="mb-6 p-4 bg-spotify-lightgray rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">
              {selectedPlaylists.size} selected
            </span>
            <button
              onClick={selectAllFiltered}
              className="text-spotify-green hover:underline text-sm"
            >
              Select All ({filteredPlaylists.length})
            </button>
            <button
              onClick={clearSelection}
              className="text-gray-400 hover:underline text-sm"
            >
              Clear
            </button>
          </div>
          {selectedPlaylists.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-red-700 transition-colors"
            >
              Delete {selectedPlaylists.size} Playlists
            </button>
          )}
        </div>
      )}

      {filteredPlaylists.length === 0 && playlists.length > 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No playlists match your search</p>
        </div>
      ) : filteredPlaylists.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-24 h-24 mx-auto mb-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
          <p className="text-gray-400">Create your first playlist to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlaylists.map(playlist => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onShare={handleShare}
              onAutoSort={handleAutoSort}
              onClick={(playlist) => {
                setSelectedPlaylist(playlist);
                setShowDetailsModal(true);
              }}
              bulkSelectMode={bulkSelectMode}
              isSelected={selectedPlaylists.has(playlist.id)}
              onToggleSelect={togglePlaylistSelection}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPlaylists();
          }}
        />
      )}

      {showDetailsModal && selectedPlaylist && (
        <PlaylistDetailsModal
          playlist={selectedPlaylist}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPlaylist(null);
          }}
          onUpdate={() => {
            loadPlaylists();
          }}
        />
      )}
    </div>
  );
}
