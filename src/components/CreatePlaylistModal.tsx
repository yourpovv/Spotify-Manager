import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

interface CreatePlaylistModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePlaylistModal({ onClose, onSuccess }: CreatePlaylistModalProps) {
  const { client, user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    
    if (!client || !user || !name) return;

    try {
      setCreating(true);
      await client.createPlaylist(user.id, {
        name,
        description,
        public: isPublic,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create playlist:', error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-spotify-lightgray rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Playlist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Playlist Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-spotify-gray border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
              placeholder="My Awesome Playlist"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-spotify-gray border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent resize-none"
              placeholder="Add a description..."
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded border-gray-700 bg-spotify-gray text-spotify-green focus:ring-spotify-green focus:ring-offset-0"
              />
              <span className="text-sm font-medium text-white">Make playlist public</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 border border-gray-700 rounded-full text-white font-semibold hover:bg-spotify-gray transition-colors"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-spotify-green text-black rounded-full font-semibold hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={creating || !name}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
