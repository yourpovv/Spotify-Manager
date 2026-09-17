import type { SpotifyPlaylist } from '../types/spotify';

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShare: (id: string) => void;
  onAutoSort?: (id: string) => void;
  onClick?: (playlist: SpotifyPlaylist) => void;
  bulkSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function PlaylistCard({ 
  playlist, 
  onDelete, 
  onDuplicate, 
  onShare,
  onAutoSort,
  onClick,
  bulkSelectMode = false,
  isSelected = false,
  onToggleSelect
}: PlaylistCardProps) {
  const imageUrl = playlist.images && playlist.images[0]?.url;

  const handleClick = () => {
    if (bulkSelectMode) {
      onToggleSelect?.(playlist.id);
    } else {
      onClick?.(playlist);
    }
  };

  return (
    <div 
      className={`bg-spotify-lightgray rounded-lg p-4 hover:bg-gray-700 transition-colors group relative cursor-pointer ${
        isSelected ? 'ring-2 ring-spotify-green' : ''
      }`}
      onClick={handleClick}
    >
      {}
      {bulkSelectMode && (
        <div className="absolute top-2 right-2 z-10">
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected 
              ? 'bg-spotify-green border-spotify-green' 
              : 'bg-transparent border-gray-400'
          }`}>
            {isSelected && (
              <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
          </div>
        </div>
      )}

      <div className="aspect-square mb-4 rounded-md overflow-hidden bg-gray-800 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-gray-600">
            ♫
          </div>
        )}
        
        {}
        {!bulkSelectMode && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-white text-center">
              <svg className="w-12 h-12 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <p className="font-semibold">View Details</p>
            </div>
          </div>
        )}
      </div>

      <h3 className="text-white font-semibold text-lg mb-1 truncate">{playlist.name}</h3>
      <p className="text-gray-400 text-sm mb-3">
        {playlist.tracks.total} tracks • {playlist.owner.displayName}
      </p>

      {!bulkSelectMode && (
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(playlist.id);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-2 bg-spotify-gray rounded-md text-xs text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
            title="Copy link to clipboard"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(playlist.id);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-2 bg-spotify-gray rounded-md text-xs text-gray-300 hover:text-spotify-green hover:bg-gray-600 transition-colors"
            title="Duplicate playlist"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>

          {onAutoSort && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAutoSort(playlist.id);
              }}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-2 bg-spotify-gray rounded-md text-xs text-gray-300 hover:text-spotify-green hover:bg-gray-600 transition-colors"
              title="Auto-sort tracks"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
              </svg>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(playlist.id);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-2 bg-spotify-gray rounded-md text-xs text-gray-300 hover:text-red-400 hover:bg-gray-600 transition-colors"
            title="Delete playlist"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
