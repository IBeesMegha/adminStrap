import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import { MediaAsset, mediaApi } from '@/lib/media';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaAsset | MediaAsset[]) => void;
  multiple?: boolean;
  selectedIds?: string[];
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  selectedIds = [],
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [uploadTab, setUploadTab] = useState<'computer' | 'url'>('computer');
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>(selectedIds);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Upload states
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMedia();
      setSelectedMedia(selectedIds);
    }
  }, [isOpen, selectedIds]);

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setUploadFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...files]);
    }
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      
      if (uploadTab === 'computer' && uploadFiles.length > 0) {
        // Upload files
        for (const file of uploadFiles) {
          await mediaApi.upload({
            file,
            name: file.name,
          });
        }
        setUploadFiles([]);
      } else if (uploadTab === 'url' && urlInput.trim()) {
        // Upload from URL
        const fileName = urlInput.split('/').pop() || 'image';
        await mediaApi.upload({
          url: urlInput,
          name: fileName,
        });
        setUrlInput('');
      }

      // Reload media library
      await loadMedia();
      setActiveTab('library');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload media');
    } finally {
      setLoading(false);
    }
  };

  const toggleMediaSelection = (id: string) => {
    if (multiple) {
      setSelectedMedia(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedMedia([id]);
    }
  };

  const handleConfirm = () => {
    const selected = media.filter(m => selectedMedia.includes(m.id));
    onSelect(multiple ? selected : selected[0]);
    onClose();
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {activeTab === 'library' ? 'Media Library' : 'Add new assets'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'library'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'library' ? (
            // Media Library View
            <div>
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : media.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No media assets yet</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Upload your first asset
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {media.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => toggleMediaSelection(asset.id)}
                      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition ${
                        selectedMedia.includes(asset.id)
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
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
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-700 truncate">{asset.name}</p>
                        <p className="text-xs text-gray-400">{asset.ext.toUpperCase()}</p>
                      </div>
                      {selectedMedia.includes(asset.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Upload View
            <div>
              {/* Upload Tabs */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setUploadTab('computer')}
                  className={`px-4 py-2 text-sm font-medium ${
                    uploadTab === 'computer'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  FROM COMPUTER
                </button>
                <button
                  onClick={() => setUploadTab('url')}
                  className={`px-4 py-2 text-sm font-medium ${
                    uploadTab === 'url'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  FROM URL
                </button>
              </div>

              {uploadTab === 'computer' ? (
                <div>
                  {/* Drag & Drop Area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <Upload size={48} className="mx-auto text-blue-600 mb-4" />
                    <p className="text-gray-700 mb-2">Drag & Drop here or</p>
                    <label className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                      Browse files
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* File Preview */}
                  {uploadFiles.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-700">
                          {uploadFiles.length} asset{uploadFiles.length > 1 ? 's' : ''} ready to upload
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {uploadFiles.map((file, index) => (
                          <div key={index} className="relative border rounded-lg p-3">
                            <button
                              onClick={() => removeUploadFile(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X size={14} />
                            </button>
                            <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon size={32} className="text-gray-400" />
                              )}
                            </div>
                            <p className="text-xs text-gray-700 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{file.type.split('/')[1]?.toUpperCase()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <div className="flex items-center space-x-3">
            {activeTab === 'library' && selectedMedia.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedMedia.length} selected
              </span>
            )}
            {activeTab === 'upload' ? (
              <button
                onClick={handleUpload}
                disabled={loading || (uploadTab === 'computer' ? uploadFiles.length === 0 : !urlInput.trim())}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : `Upload ${uploadTab === 'computer' ? uploadFiles.length : 1} asset${uploadFiles.length > 1 ? 's' : ''} to library`}
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={selectedMedia.length === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
