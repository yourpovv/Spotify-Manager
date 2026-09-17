import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify';

export function ToolsView() {
  const { client, user } = useAuth();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'merge' | 'duplicates' | 'import' | 'export' | 'from-link'>('merge');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'text'>('json');

  useState(() => {
    loadPlaylists();
  });

  async function loadPlaylists(): Promise<void> {
    if (!client) return;
    try {
      const data = await client.getPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }

  async function handleMergePlaylists(): Promise<void> {
    if (!client || !user || selectedPlaylists.length < 2) {
      alert('Please select at least 2 playlists to merge');
      return;
    }

    const mergedName = prompt('Enter name for merged playlist:', 'Merged Playlist');
    if (!mergedName) return;

    try {
      setLoading(true);
      
      const allTracks: SpotifyTrack[] = [];
      for (const playlistId of selectedPlaylists) {
        const tracks = await client.getPlaylistTracks(playlistId);
        allTracks.push(...tracks);
      }

      const uniqueTracks = Array.from(
        new Map(allTracks.map(track => [track.id, track])).values()
      );

      const newPlaylist = await client.createPlaylist(user.id, {
        name: mergedName,
        description: `Merged from ${selectedPlaylists.length} playlists`,
        public: false,
      });

      const trackUris = uniqueTracks.map(t => `spotify:track:${t.id}`);
      await client.replacePlaylistTracks(newPlaylist.id, trackUris);

      alert(`Successfully created "${mergedName}" with ${uniqueTracks.length} unique tracks!`);
      setSelectedPlaylists([]);
      await loadPlaylists();
    } catch (error) {
      console.error('Merge failed:', error);
      alert('Failed to merge playlists');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveDuplicates(): Promise<void> {
    if (!client || selectedPlaylists.length !== 1) {
      alert('Please select exactly one playlist to remove duplicates');
      return;
    }

    if (!confirm('Remove duplicate tracks from this playlist?')) return;

    try {
      setLoading(true);
      const playlistId = selectedPlaylists[0];
      if (!playlistId) {
        alert('Please select a playlist');
        return;
      }

      const tracks = await client.getPlaylistTracks(playlistId);

      const seen = new Set<string>();
      const unique: SpotifyTrack[] = [];
      const duplicates: string[] = [];

      for (const track of tracks) {
        if (seen.has(track.id)) {
          duplicates.push(`spotify:track:${track.id}`);
        } else {
          seen.add(track.id);
          unique.push(track);
        }
      }

      if (duplicates.length === 0) {
        alert('No duplicates found!');
        return;
      }

      const uniqueUris = unique.map(t => `spotify:track:${t.id}`);
      await client.replacePlaylistTracks(playlistId, uniqueUris);

      alert(`Removed ${duplicates.length} duplicate tracks!`);
      await loadPlaylists();
    } catch (error) {
      console.error('Failed to remove duplicates:', error);
      alert('Failed to remove duplicates');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFromLink(): Promise<void> {
    if (!client || !user) return;

    const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match || !match[1]) {
      alert('Invalid Spotify playlist URL');
      return;
    }

    const sourcePlaylistId = match[1];

    try {
      setLoading(true);

      const sourcePlaylist = await client.getPlaylist(sourcePlaylistId);
      const tracks = await client.getPlaylistTracks(sourcePlaylistId);

      const newPlaylist = await client.createPlaylist(user.id, {
        name: `Copy of ${sourcePlaylist.name}`,
        description: sourcePlaylist.description || '',
        public: false,
      });

      const trackUris = tracks.map(t => `spotify:track:${t.id}`);
      await client.replacePlaylistTracks(newPlaylist.id, trackUris);

      alert(`Successfully created "${newPlaylist.name}" with ${tracks.length} tracks!`);
      setPlaylistUrl('');
      await loadPlaylists();
    } catch (error) {
      console.error('Failed to create from link:', error);
      alert('Failed to create playlist. Make sure the playlist is public.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(): Promise<void> {
    if (!client || selectedPlaylists.length === 0) {
      alert('Please select at least one playlist to export');
      return;
    }

    try {
      setLoading(true);
      const exportData: Array<{
        playlist: SpotifyPlaylist;
        tracks: SpotifyTrack[];
      }> = [];

      for (const playlistId of selectedPlaylists) {
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) continue;
        
        const tracks = await client.getPlaylistTracks(playlistId);
        exportData.push({ playlist, tracks });
      }

      if (exportFormat === 'json') {
        const json = JSON.stringify(exportData, null, 2);
        downloadFile(json, 'playlists-export.json', 'application/json');
      } else if (exportFormat === 'csv') {
        let csv = 'Playlist,Track,Artist,Album,Duration\\n';
        exportData.forEach(({ playlist, tracks }) => {
          tracks.forEach(track => {
            csv += `"${playlist.name}","${track.name}","${track.artists.map(a => a.name).join(', ')}","${track.album.name}","${track.durationMs}"\\n`;
          });
        });
        downloadFile(csv, 'playlists-export.csv', 'text/csv');
      } else {
        let text = '';
        exportData.forEach(({ playlist, tracks }) => {
          text += `\\n=== ${playlist.name} ===\\n`;
          tracks.forEach((track, i) => {
            text += `${i + 1}. ${track.name} - ${track.artists.map(a => a.name).join(', ')}\\n`;
          });
        });
        downloadFile(text, 'playlists-export.txt', 'text/plain');
      }

      alert('Export successful!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export playlists');
    } finally {
      setLoading(false);
    }
  }

  function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function togglePlaylistSelection(playlistId: string): void {
    setSelectedPlaylists(prev =>
      prev.includes(playlistId)
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId]
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Playlist Tools</h1>

      {}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {[
          { id: 'merge', label: 'Merge Playlists', icon: '🔀' },
          { id: 'duplicates', label: 'Remove Duplicates', icon: '🗑️' },
          { id: 'from-link', label: 'Create from Link', icon: '🔗' },
          { id: 'export', label: 'Export', icon: '📥' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-spotify-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-spotify-green" />
            )}
          </button>
        ))}
      </div>

      {}
      {activeTab === 'merge' && (
        <div className="max-w-4xl">
          <div className="bg-spotify-lightgray rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Merge Multiple Playlists</h2>
            <p className="text-gray-400 mb-4">
              Combine multiple playlists into one. Duplicates will automatically be removed.
            </p>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Selected: {selectedPlaylists.length} playlists
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {playlists.map(playlist => (
                  <label
                    key={playlist.id}
                    className="flex items-center gap-3 p-3 bg-spotify-gray rounded-lg hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlaylists.includes(playlist.id)}
                      onChange={() => togglePlaylistSelection(playlist.id)}
                      className="w-5 h-5 rounded border-gray-600 text-spotify-green focus:ring-spotify-green"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{playlist.name}</p>
                      <p className="text-gray-400 text-sm">{playlist.tracks.total} tracks</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleMergePlaylists}
              disabled={loading || selectedPlaylists.length < 2}
              className="w-full bg-spotify-green text-black font-semibold py-3 px-6 rounded-full hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Merging...' : `Merge ${selectedPlaylists.length} Playlists`}
            </button>
          </div>
        </div>
      )}

      {}
      {activeTab === 'duplicates' && (
        <div className="max-w-4xl">
          <div className="bg-spotify-lightgray rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Remove Duplicate Tracks</h2>
            <p className="text-gray-400 mb-4">
              Select a playlist to scan and remove duplicate tracks.
            </p>

            <div className="mb-4">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {playlists.map(playlist => (
                  <label
                    key={playlist.id}
                    className="flex items-center gap-3 p-3 bg-spotify-gray rounded-lg hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="duplicate-playlist"
                      checked={selectedPlaylists[0] === playlist.id}
                      onChange={() => setSelectedPlaylists([playlist.id])}
                      className="w-5 h-5 border-gray-600 text-spotify-green focus:ring-spotify-green"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{playlist.name}</p>
                      <p className="text-gray-400 text-sm">{playlist.tracks.total} tracks</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleRemoveDuplicates}
              disabled={loading || selectedPlaylists.length !== 1}
              className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scanning...' : 'Remove Duplicates'}
            </button>
          </div>
        </div>
      )}

      {}
      {activeTab === 'from-link' && (
        <div className="max-w-4xl">
          <div className="bg-spotify-lightgray rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Create Playlist from URL</h2>
            <p className="text-gray-400 mb-4">
              Paste a Spotify playlist URL to create your own copy.
            </p>

            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full mb-4 px-6 py-4 bg-spotify-gray border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green"
            />

            <button
              onClick={handleCreateFromLink}
              disabled={loading || !playlistUrl}
              className="w-full bg-spotify-green text-black font-semibold py-3 px-6 rounded-full hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Copy'}
            </button>
          </div>
        </div>
      )}

      {}
      {activeTab === 'export' && (
        <div className="max-w-4xl">
          <div className="bg-spotify-lightgray rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Export Playlists</h2>
            <p className="text-gray-400 mb-4">
              Export your playlists as JSON, CSV, or plain text for backup or sharing.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
                className="w-full px-4 py-3 bg-spotify-gray border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-spotify-green"
              >
                <option value="json">JSON (Complete data)</option>
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="text">Text (Human readable)</option>
              </select>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Selected: {selectedPlaylists.length} playlists
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {playlists.map(playlist => (
                  <label
                    key={playlist.id}
                    className="flex items-center gap-3 p-3 bg-spotify-gray rounded-lg hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlaylists.includes(playlist.id)}
                      onChange={() => togglePlaylistSelection(playlist.id)}
                      className="w-5 h-5 rounded border-gray-600 text-spotify-green focus:ring-spotify-green"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{playlist.name}</p>
                      <p className="text-gray-400 text-sm">{playlist.tracks.total} tracks</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={loading || selectedPlaylists.length === 0}
              className="w-full bg-spotify-green text-black font-semibold py-3 px-6 rounded-full hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Exporting...' : `Export ${selectedPlaylists.length} Playlists`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
