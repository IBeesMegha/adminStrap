import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/admin/Layout';
import { MediaAsset, mediaApi } from '@/lib/media';
import { Upload, Image as ImageIcon, Trash2, Edit, Search, Grid, List } from 'lucide-react';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const assets = await mediaApi.getAll();
      setMedia(assets);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) {
      return;
    }

    try {
      await mediaApi.delete(id);
      await loadMedia();
    } catch (error) {
      console.error('Failed to delete media:', error);
      alert('Failed to delete media');
    }
  };

  const filteredMedia = media.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600 mt-1">Manage your media assets</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Upload size={20} />
            <span>Upload</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search media..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">
                {searchQuery ? 'No media found matching your search' : 'No media assets yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Upload your first asset
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMedia.map((asset) => (
                <div
                  key={asset.id}
                  className="relative border-2 border-gray-200 rounded-lg overflow-hidden group hover:border-blue-500 transition"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {asset.mime.startsWith('image/') ? (
                      <img
                        src={asset.url}
                        alt={asset.alternativeText || asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setSelectedMedia(asset)}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-700 truncate font-medium">{asset.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">{asset.ext.toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(asset.size)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedia.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    {asset.mime.startsWith('image/') ? (
                      <img
                        src={asset.url}
                        alt={asset.alternativeText || asset.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <ImageIcon size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                    <p className="text-xs text-gray-500">
                      {asset.ext.toUpperCase()} • {formatFileSize(asset.size)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedMedia(asset)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <MediaLibraryModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          loadMedia();
        }}
        onSelect={() => {
          setShowUploadModal(false);
          loadMedia();
        }}
        multiple={false}
      />

      {/* Edit Modal */}
      {selectedMedia && (
        <EditMediaModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onSave={async (updated) => {
            try {
              await mediaApi.update(selectedMedia.id, updated);
              await loadMedia();
              setSelectedMedia(null);
            } catch (error) {
              console.error('Failed to update media:', error);
              alert('Failed to update media');
            }
          }}
        />
      )}
    </Layout>
  );
}

// Edit Media Modal Component
interface EditMediaModalProps {
  media: MediaAsset;
  onClose: () => void;
  onSave: (data: Partial<MediaAsset>) => void;
}

const EditMediaModal: React.FC<EditMediaModalProps> = ({ media, onClose, onSave }) => {
  const [name, setName] = useState(media.name);
  const [alternativeText, setAlternativeText] = useState(media.alternativeText || '');
  const [caption, setCaption] = useState(media.caption || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, alternativeText, caption });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Media Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex space-x-4">
            <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
              {media.mime.startsWith('image/') ? (
                <img
                  src={media.url}
                  alt={media.alternativeText || media.name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <ImageIcon size={48} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternative text
                </label>
                <input
                  type="text"
                  value={alternativeText}
                  onChange={(e) => setAlternativeText(e.target.value)}
                  placeholder="This text will be displayed if the asset can't be shown"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
