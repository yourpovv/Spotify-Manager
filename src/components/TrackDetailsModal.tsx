import type { SpotifyTrack } from '../types/spotify';

interface TrackDetailsModalProps {
  track: SpotifyTrack;
  onClose: () => void;
  onAddToPlaylist?: () => void;
}

export function TrackDetailsModal({ track, onClose, onAddToPlaylist }: TrackDetailsModalProps) {
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-spotify-gray rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-spotify-gray border-b border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Track Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          {}
          <div className="flex gap-6 mb-6">
            <div className="w-48 h-48 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
              {track.album.images && track.album.images[0] ? (
                <img
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-gray-600">
                  ♫
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-3xl font-bold text-white mb-2">{track.name}</h3>
              <p className="text-xl text-gray-300 mb-3">
                {track.artists.map(a => a.name).join(', ')}
              </p>
              <p className="text-lg text-gray-400 mb-4">{track.album.name}</p>

              <div className="flex gap-3 mb-4">
                {track.externalUrls?.spotify && (
                  <a
                    href={track.externalUrls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-spotify-green text-black font-semibold py-2 px-4 rounded-full hover:bg-green-400 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Open in Spotify
                  </a>
                )}

                {onAddToPlaylist && (
                  <button
                    onClick={onAddToPlaylist}
                    className="flex items-center gap-2 bg-spotify-lightgray text-white font-semibold py-2 px-4 rounded-full hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add to Playlist
                  </button>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-spotify-lightgray p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Duration</p>
              <p className="text-white text-xl font-semibold">{formatDuration(track.durationMs)}</p>
            </div>

            <div className="bg-spotify-lightgray p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Popularity</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-spotify-green h-2 rounded-full transition-all"
                    style={{ width: `${track.popularity || 0}%` }}
                  />
                </div>
                <span className="text-white font-semibold">{track.popularity || 0}%</span>
              </div>
            </div>

            <div className="bg-spotify-lightgray p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Track Number</p>
              <p className="text-white text-xl font-semibold">
                {track.trackNumber || 'N/A'}{track.album.totalTracks ? ` of ${track.album.totalTracks}` : ''}
              </p>
            </div>

            <div className="bg-spotify-lightgray p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Explicit</p>
              <p className="text-white text-xl font-semibold">
                {track.explicit ? (
                  <span className="text-red-400">Yes</span>
                ) : (
                  <span className="text-green-400">No</span>
                )}
              </p>
            </div>
          </div>

          {}
          <div className="space-y-4">
            <div className="bg-spotify-lightgray p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Album</p>
              <p className="text-white text-lg font-semibold mb-1">{track.album.name}</p>
              {track.album.releaseDate && (
                <p className="text-gray-400 text-sm">
                  Release Date: {formatDate(track.album.releaseDate)}
                </p>
              )}
            </div>

            <div className="bg-spotify-lightgray p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Artists</p>
              <div className="flex flex-wrap gap-2">
                {track.artists.map(artist => (
                  artist.externalUrls?.spotify ? (
                    <a
                      key={artist.id}
                      href={artist.externalUrls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-spotify-gray text-white px-3 py-1 rounded-full text-sm hover:bg-gray-600 transition-colors"
                    >
                      {artist.name}
                    </a>
                  ) : (
                    <span
                      key={artist.id}
                      className="bg-spotify-gray text-white px-3 py-1 rounded-full text-sm"
                    >
                      {artist.name}
                    </span>
                  )
                ))}
              </div>
            </div>

            {track.previewUrl && (
              <div className="bg-spotify-lightgray p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">Preview</p>
                <audio controls className="w-full">
                  <source src={track.previewUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
