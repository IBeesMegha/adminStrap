import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import Link from 'next/link';
import { 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  PlayCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Stats {
  pages: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  chunks: {
    total: number;
  };
  sources: Array<{
    id: string;
    name: string;
    status: string;
    totalPages: number;
    totalChunks: number;
  }>;
  recentActivity: Array<{
    id: string;
    url: string;
    pageTitle: string | null;
    processingStatus: string;
    lastProcessedAt: Date;
    errorMessage: string | null;
    source: {
      name: string;
    };
  }>;
}

export default function ProcessingJobsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStats();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/knowledge-base/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAll = async () => {
    if (!confirm('Start processing all pending pages?')) {
      return;
    }

    setProcessing(true);
    
    try {
      const response = await fetch('/api/knowledge-base/process', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchStats();
      } else {
        toast.error(result.error || 'Failed to start processing');
      }
    } catch (error) {
      console.error('Error starting processing:', error);
      toast.error('Failed to start processing');
    } finally {
      setProcessing(false);
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

  if (!stats) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center text-red-600">Failed to load statistics</div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Processing Jobs</h1>
            <p className="text-gray-600">
              Monitor content processing pipeline status
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleProcessAll}
              disabled={processing || stats.pages.pending === 0}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <PlayCircle size={20} />
                  <span>Process All Pending</span>
                </>
              )}
            </button>
            <Link
              href="/admin/knowledge-base"
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Sources
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Pages</span>
              <Activity className="text-blue-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.pages.total}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Pending</span>
              <Clock className="text-gray-400" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.pages.pending}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Completed</span>
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.pages.completed}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Failed</span>
              <XCircle className="text-red-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.pages.failed}</div>
          </div>
        </div>

        {/* Total Chunks */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-100 mb-1">Total Embeddings Generated</div>
              <div className="text-4xl font-bold">{stats.chunks.total.toLocaleString()}</div>
            </div>
            <div className="text-6xl opacity-20">📊</div>
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Processing Pipeline</h2>
          
          <div className="space-y-4">
            {/* Stage 1: Crawling */}
            <div className="flex items-center space-x-4">
              <div className="w-48 text-sm font-medium text-gray-700">1. Website Crawling</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ 
                    width: `${stats.pages.total > 0 ? 100 : 0}%` 
                  }}
                />
              </div>
              <div className="w-32 text-sm text-gray-600 text-right">
                {stats.pages.total} pages
              </div>
            </div>

            {/* Stage 2: Processing */}
            <div className="flex items-center space-x-4">
              <div className="w-48 text-sm font-medium text-gray-700">2. Chunk Generation</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-green-600 h-full transition-all duration-500"
                  style={{ 
                    width: `${stats.pages.total > 0 
                      ? ((stats.pages.completed + stats.pages.failed) / stats.pages.total * 100) 
                      : 0}%` 
                  }}
                />
              </div>
              <div className="w-32 text-sm text-gray-600 text-right">
                {stats.pages.completed + stats.pages.failed} / {stats.pages.total}
              </div>
            </div>

            {/* Stage 3: Embeddings */}
            <div className="flex items-center space-x-4">
              <div className="w-48 text-sm font-medium text-gray-700">3. Embedding Generation</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-purple-600 h-full transition-all duration-500"
                  style={{ 
                    width: `${stats.pages.total > 0 
                      ? (stats.pages.completed / stats.pages.total * 100) 
                      : 0}%` 
                  }}
                />
              </div>
              <div className="w-32 text-sm text-gray-600 text-right">
                {stats.chunks.total} chunks
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          
          {stats.recentActivity.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No processing activity yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        {activity.pageTitle || 'Untitled Page'}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{activity.source.name}</div>
                      <a
                        href={activity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {activity.url}
                      </a>
                      {activity.errorMessage && (
                        <div className="flex items-center space-x-1 text-xs text-red-600 mt-2">
                          <AlertCircle size={12} />
                          <span>{activity.errorMessage}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      {activity.processingStatus === 'completed' && (
                        <CheckCircle className="text-green-600 mb-1" size={20} />
                      )}
                      {activity.processingStatus === 'failed' && (
                        <XCircle className="text-red-600 mb-1" size={20} />
                      )}
                      {activity.processingStatus === 'processing' && (
                        <Loader className="animate-spin text-blue-600 mb-1" size={20} />
                      )}
                      <div className="text-xs text-gray-500">
                        {format(new Date(activity.lastProcessedAt), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
