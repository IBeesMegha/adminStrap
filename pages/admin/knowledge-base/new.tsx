import React, { useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewKnowledgeSourcePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (startCrawl: boolean) => {
    if (!formData.name || !formData.websiteUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          websiteUrl: formData.websiteUrl,
          startCrawl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        router.push(`/admin/knowledge-base/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to create knowledge source');
      }
    } catch (error) {
      console.error('Error creating source:', error);
      toast.error('Failed to create knowledge source');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/knowledge-base"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Knowledge Base</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Add Knowledge Source
          </h1>
          <p className="text-gray-600">
            Add a website to crawl and extract knowledge from
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Company Documentation"
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  A friendly name to identify this knowledge source
                </p>
              </div>

              {/* Website URL Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  The website URL to crawl. Must be a valid HTTPS or HTTP URL.
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Attempts to fetch sitemap.xml for efficient crawling</li>
                  <li>• Falls back to homepage crawling if no sitemap exists</li>
                  <li>• Extracts page titles, text content, and HTML</li>
                  <li>• Limits to 100 pages and 3 levels deep</li>
                  <li>• Only crawls pages from the same domain</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-end space-x-4">
              <Link
                href="/admin/knowledge-base"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                <span>Save</span>
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                <span>Save & Crawl</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
