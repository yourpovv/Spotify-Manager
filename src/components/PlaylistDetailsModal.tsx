import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify';
import { TrackDetailsModal } from './TrackDetailsModal';

interface PlaylistDetailsModalProps {
  playlist: SpotifyPlaylist;
  onClose: () => void;
  onUpdate: () => void;
}

export function PlaylistDetailsModal({ playlist, onClose, onUpdate }: PlaylistDetailsModalProps) {
  const { client, user } = useAuth();
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [playlistName, setPlaylistName] = useState(playlist.name);
  const [playlistDescription, setPlaylistDescription] = useState(playlist.description || '');
  const [isPublic, setIsPublic] = useState(playlist.public);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [showTrackDetails, setShowTrackDetails] = useState(false);
  
  const isOwner = user?.id === playlist.owner.id;

  useEffect(() => {
    loadTracks();
  }, [playlist.id]);

  async function loadTracks(): Promise<void> {
    if (!client) return;

    try {
      setLoading(true);
      const data = await client.getPlaylistTracks(playlist.id);
      setTracks(data);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDetails(): Promise<void> {
    if (!client || !isOwner) return;

    try {
      await client.updatePlaylistDetails(playlist.id, {
        name: playlistName,
        description: playlistDescription,
        public: isPublic,
      });
      setEditMode(false);
      onUpdate();
      alert('Playlist updated successfully!');
    } catch (error) {
      console.error('Failed to update playlist:', error);
      alert('Failed to update playlist');
    }
  }

  async function handleRemoveTrack(trackId: string): Promise<void> {
    if (!client || !isOwner) return;
    if (!confirm('Remove this track from the playlist?')) return;

    try {
      await client.removeTracksFromPlaylist(playlist.id, [`spotify:track:${trackId}`]);
      await loadTracks();
      onUpdate();
    } catch (error) {
      console.error('Failed to remove track:', error);
      alert('Failed to remove track');
    }
  }

  async function handleSearch(): Promise<void> {
    if (!client || !searchQuery.trim()) return;

    try {
      setSearching(true);
      const results = await client.searchTracks({ query: searchQuery, limit: 20 });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddTrack(track: SpotifyTrack): Promise<void> {
    if (!client || !isOwner) return;

    try {
      await client.addTracksToPlaylist(playlist.id, [`spotify:track:${track.id}`]);
      await loadTracks();
      setSearchResults([]);
      setSearchQuery('');
      onUpdate();
      alert(`Added "${track.name}" to playlist!`);
    } catch (error) {
      console.error('Failed to add track:', error);
      alert('Failed to add track');
    }
  }

  function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4">
        <div className="bg-spotify-gray rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {}
          <div className="bg-gradient-to-b from-spotify-lightgray to-spotify-gray p-6 border-b border-gray-700">
            <div className="flex items-start gap-6">
              {}
              <div className="w-48 h-48 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                {playlist.images && playlist.images[0] ? (
                  <img
                    src={playlist.images[0].url}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl text-gray-600">
                    ♫
                  </div>
                )}
              </div>

              {}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase mb-2">Playlist</p>
                
                {editMode && isOwner ? (
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="text-4xl font-bold text-white bg-spotify-lightgray border border-gray-600 rounded px-3 py-2 mb-3 w-full focus:outline-none focus:ring-2 focus:ring-spotify-green"
                  />
                ) : (
                  <h1 className="text-4xl font-bold text-white mb-3 truncate">{playlist.name}</h1>
                )}

                {editMode && isOwner ? (
                  <textarea
                    value={playlistDescription}
                    onChange={(e) => setPlaylistDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="text-gray-300 bg-spotify-lightgray border border-gray-600 rounded px-3 py-2 mb-3 w-full h-20 resize-none focus:outline-none focus:ring-2 focus:ring-spotify-green"
                  />
                ) : (
                  playlist.description && (
                    <p className="text-gray-300 mb-3">{playlist.description}</p>
                  )
                )}

                <div className="flex items-center gap-4 mb-3">
                  <p className="text-sm text-gray-400">
                    By <span className="text-white font-semibold">{playlist.owner.displayName}</span>
                  </p>
                  <span className="text-gray-600">•</span>
                  <p className="text-sm text-gray-400">
                    <span className="text-white font-semibold">{tracks.length}</span> tracks
                  </p>
                  {editMode && isOwner && (
                    <>
                      <span className="text-gray-600">•</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-400">Public</span>
                      </label>
                    </>
                  )}
                </div>

                {}
                <div className="flex flex-wrap gap-3">
                  {isOwner && (
                    <>
                      {editMode ? (
                        <>
                          <button
                            onClick={handleSaveDetails}
                            className="bg-spotify-green text-black font-semibold py-2 px-6 rounded-full hover:bg-green-400 transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditMode(false);
                              setPlaylistName(playlist.name);
                              setPlaylistDescription(playlist.description || '');
                              setIsPublic(playlist.public);
                            }}
                            className="bg-spotify-lightgray text-white font-semibold py-2 px-6 rounded-full hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditMode(true)}
                          className="bg-spotify-lightgray text-white font-semibold py-2 px-6 rounded-full hover:bg-gray-600 transition-colors"
                        >
                          Edit Details
                        </button>
                      )}
                    </>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="bg-spotify-lightgray text-white font-semibold py-2 px-6 rounded-full hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>

          {}
          {isOwner && (
            <div className="p-4 border-b border-gray-700 bg-spotify-lightgray">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search tracks to add..."
                  className="flex-1 px-4 py-2 bg-spotify-gray border border-gray-600 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="bg-spotify-green text-black font-semibold py-2 px-6 rounded-full hover:bg-green-400 transition-colors disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {}
              {searchResults.length > 0 && (
                <div className="mt-3 bg-spotify-gray rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-400 mb-2">SEARCH RESULTS</p>
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 hover:bg-spotify-lightgray rounded group"
                    >
                      <div className="w-10 h-10 bg-gray-800 rounded flex-shrink-0">
                        {track.album.images[0] && (
                          <img src={track.album.images[0].url} alt="" className="w-full h-full object-cover rounded" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{track.name}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {track.artists.map(a => a.name).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddTrack(track)}
                        className="opacity-0 group-hover:opacity-100 bg-spotify-green text-black text-xs font-semibold py-1 px-3 rounded-full hover:bg-green-400 transition-all"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400">This playlist is empty</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-[40px_1fr_1fr_100px_60px] gap-4 px-4 py-2 text-xs text-gray-400 uppercase border-b border-gray-700">
                  <div>#</div>
                  <div>Title</div>
                  <div>Album</div>
                  <div>Duration</div>
                  <div></div>
                </div>
                
                {tracks.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className="grid grid-cols-[40px_1fr_1fr_100px_60px] gap-4 px-4 py-3 rounded hover:bg-spotify-lightgray group items-center"
                  >
                    <div className="text-gray-400 text-sm">{index + 1}</div>
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-gray-800 rounded flex-shrink-0">
                        {track.album.images[0] && (
                          <img src={track.album.images[0].url} alt="" className="w-full h-full object-cover rounded" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p 
                          className="text-white hover:underline cursor-pointer truncate"
                          onClick={() => {
                            setSelectedTrack(track);
                            setShowTrackDetails(true);
                          }}
                        >
                          {track.name}
                          {track.explicit && (
                            <span className="ml-2 text-xs bg-gray-600 px-1.5 py-0.5 rounded">E</span>
                          )}
                        </p>
                        <p className="text-gray-400 text-sm truncate">
                          {track.artists.map(a => a.name).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="text-gray-400 text-sm truncate">{track.album.name}</div>
                    <div className="text-gray-400 text-sm">{formatDuration(track.durationMs)}</div>
                    
                    <div className="flex gap-2">
                      {track.externalUrls?.spotify && (
                        <a
                          href={track.externalUrls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all"
                          title="Open in Spotify"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                        </a>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveTrack(track.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                          title="Remove from playlist"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      {showTrackDetails && selectedTrack && (
        <TrackDetailsModal
          track={selectedTrack}
          onClose={() => setShowTrackDetails(false)}
          onAddToPlaylist={() => {
            setShowTrackDetails(false);
          }}
        />
      )}
    </>
  );
}
