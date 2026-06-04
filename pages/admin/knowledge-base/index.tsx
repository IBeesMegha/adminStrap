import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import Link from 'next/link';
import { 
  Plus, 
  Globe, 
  Trash2, 
  RefreshCw, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface KnowledgeSource {
  id: string;
  name: string;
  websiteUrl: string;
  status: string;
  totalPages: number;
  lastCrawlAt: Date | null;
  createdAt: Date;
}

export default function KnowledgeBasePage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSources();
    
    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchSources, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/knowledge-base');
      const result = await response.json();
      
      if (result.success) {
        setSources(result.data);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Knowledge source deleted successfully');
        fetchSources();
      } else {
        toast.error(result.error || 'Failed to delete knowledge source');
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      toast.error('Failed to delete knowledge source');
    }
  };

  const handleReCrawl = async (id: string, name: string) => {
    if (!confirm(`Start re-crawling "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base/${id}/crawl`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Crawling started');
        fetchSources();
      } else {
        toast.error(result.error || 'Failed to start crawling');
      }
    } catch (error) {
      console.error('Error starting crawl:', error);
      toast.error('Failed to start crawling');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} />
            <span>Completed</span>
          </span>
        );
      case 'crawling':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Loader size={14} className="animate-spin" />
            <span>Crawling</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={14} />
            <span>Failed</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock size={14} />
            <span>Pending</span>
          </span>
        );
      default:
        return <span className="text-gray-500">{status}</span>;
    }
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

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
            <p className="text-gray-600">
              Manage website crawling and AI-powered knowledge sources
            </p>
          </div>
          <Link
            href="/admin/knowledge-base/new"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Knowledge Source</span>
          </Link>
        </div>

        {/* Sources List */}
        {sources.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Globe className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Knowledge Sources Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first website to crawl
            </p>
            <Link
              href="/admin/knowledge-base/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Knowledge Source</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Website URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Crawl
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{source.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={source.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                      >
                        <Globe size={14} />
                        <span className="truncate max-w-xs">{source.websiteUrl}</span>
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(source.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 font-medium">{source.totalPages}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {source.lastCrawlAt
                        ? format(new Date(source.lastCrawlAt), 'MMM dd, yyyy HH:mm')
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/knowledge-base/${source.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() => handleReCrawl(source.id, source.name)}
                          className="text-green-600 hover:text-green-900"
                          title="Re-crawl"
                          disabled={source.status === 'crawling'}
                        >
                          <RefreshCw 
                            size={18} 
                            className={source.status === 'crawling' ? 'animate-spin' : ''}
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(source.id, source.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                          disabled={source.status === 'crawling'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
