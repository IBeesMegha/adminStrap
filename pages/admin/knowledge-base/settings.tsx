import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import Link from 'next/link';
import { Settings as SettingsIcon, Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface Settings {
  id: string;
  chunkSize: number;
  chunkOverlap: number;
  similarityThreshold: number;
  maxSearchResults: number;
  embeddingModel: string;
  rerankerModel: string;
  llmModel: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/knowledge-base/settings');
      const result = await response.json();

      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settings) return;

    setSaving(true);

    try {
      const response = await fetch('/api/knowledge-base/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Settings saved successfully');
        setSettings(result.data);
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Settings, value: number | string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        </div>
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center text-red-600">Failed to load settings</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base Settings</h1>
            <p className="text-gray-600">
              Configure content processing and search parameters
            </p>
          </div>
          <Link
            href="/admin/knowledge-base"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Sources
          </Link>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Chunking Settings */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Content Chunking</h2>
              <p className="text-sm text-gray-600 mb-6">
                Control how content is split into chunks for processing
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chunk Size (words)
                  </label>
                  <input
                    type="number"
                    value={settings.chunkSize}
                    onChange={(e) => handleChange('chunkSize', parseInt(e.target.value))}
                    min={100}
                    max={5000}
                    step={100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended: 500-1000 words. Smaller chunks provide more precise results but require more storage.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chunk Overlap (words)
                  </label>
                  <input
                    type="number"
                    value={settings.chunkOverlap}
                    onChange={(e) => handleChange('chunkOverlap', parseInt(e.target.value))}
                    min={0}
                    max={500}
                    step={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended: 50-150 words. Overlap helps maintain context across chunk boundaries.
                  </p>
                </div>
              </div>
            </div>

            {/* Search Settings */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Search Configuration</h2>
              <p className="text-sm text-gray-600 mb-6">
                Control semantic search behavior and result filtering
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Similarity Threshold
                  </label>
                  <input
                    type="number"
                    value={settings.similarityThreshold}
                    onChange={(e) => handleChange('similarityThreshold', parseFloat(e.target.value))}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended: 0.6-0.8 for API embeddings, 0.1-0.3 for local embeddings. Higher values return only highly relevant results. Range: 0-1.
                  </p>
                  <p className="mt-1 text-xs text-yellow-600 font-medium">
                    💡 Using local embeddings? Start with 0.2-0.3 for best results!
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-xs">
                    <span className="text-gray-500">0.5 (Broad)</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                        style={{ width: `${settings.similarityThreshold * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-500">1.0 (Strict)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Search Results
                  </label>
                  <input
                    type="number"
                    value={settings.maxSearchResults}
                    onChange={(e) => handleChange('maxSearchResults', parseInt(e.target.value))}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended: 5-20 results. Maximum number of chunks to return per search query.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Models */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Embedding Model</h2>
              <p className="text-sm text-gray-600 mb-6">
                Model used for generating vector embeddings (768-dim recommended)
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Name
                </label>
                <select
                  value={settings.embeddingModel}
                  onChange={(e) => handleChange('embeddingModel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BAAI/bge-base-en-v1.5">BAAI/bge-base-en-v1.5 (Recommended, 768D)</option>
                  <option value="BAAI/bge-large-en-v1.5">BAAI/bge-large-en-v1.5 (High Quality, 1024D)</option>
                  <option value="sentence-transformers/all-MiniLM-L6-v2">all-MiniLM-L6-v2 (Fast, 384D)</option>
                  <option value="sentence-transformers/all-mpnet-base-v2">all-mpnet-base-v2 (768D)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reranker Model</h2>
              <p className="text-sm text-gray-600 mb-6">
                Cross-encoder model that reranks retrieved chunks by relevance
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  value={settings.rerankerModel}
                  onChange={(e) => handleChange('rerankerModel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Default: BAAI/bge-reranker-base
                </p>
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Answer Generation Model</h2>
              <p className="text-sm text-gray-600 mb-6">
                LLM used to generate final answers from retrieved context
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  value={settings.llmModel}
                  onChange={(e) => handleChange('llmModel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Default: Qwen/Qwen3-4B-Instruct-2507. Must be available on Hugging Face Inference Providers.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex items-center justify-end space-x-4">
            <Link
              href="/admin/knowledge-base"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Changes to chunk size and overlap only affect newly processed pages</li>
            <li>To apply new settings to existing content, reprocess the pages</li>
            <li>Search settings take effect immediately</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
