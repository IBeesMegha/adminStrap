import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import Link from 'next/link';
import { 
  FileText,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  url: string;
  pageTitle: string | null;
  contentLength: number;
  totalChunks: number;
  crawlStatus: string;
  processingStatus: string;
  errorMessage: string | null;
  lastCrawledAt: Date | null;
  lastProcessedAt: Date | null;
  updatedAt: Date;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<string>('');
  const [sources, setSources] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchSources();
  }, [filterSource]);

  const fetchDocuments = async () => {
    try {
      const url = filterSource 
        ? `/api/knowledge-base/documents?sourceId=${filterSource}`
        : '/api/knowledge-base/documents';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/knowledge-base');
      const result = await response.json();
      
      if (result.success) {
        setSources(result.data);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const handleReprocess = async (documentId: string, pageTitle: string) => {
    if (!confirm(`Reprocess "${pageTitle || 'this document'}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base/process?pageId=${documentId}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Document reprocessing started');
        fetchDocuments();
      } else {
        toast.error(result.error || 'Failed to start reprocessing');
      }
    } catch (error) {
      console.error('Error reprocessing document:', error);
      toast.error('Failed to start reprocessing');
    }
  };

  const toggleSelectDoc = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(d => d.id)));
    }
  };

  const handleBulkProcess = async () => {
    if (selectedDocs.size === 0) {
      toast.error('Please select documents to process');
      return;
    }

    if (!confirm(`Process ${selectedDocs.size} selected document(s)?`)) {
      return;
    }

    setProcessing(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Process in batches of 5 to avoid overwhelming the server
      const docIds = Array.from(selectedDocs);
      
      for (let i = 0; i < docIds.length; i++) {
        const docId = docIds[i];
        
        try {
          const response = await fetch(`/api/knowledge-base/process?pageId=${docId}`, {
            method: 'POST',
          });

          const result = await response.json();

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }

          // Show progress
          if ((i + 1) % 5 === 0 || i === docIds.length - 1) {
            toast.loading(`Processing: ${i + 1}/${docIds.length}`, { id: 'bulk-process' });
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast.dismiss('bulk-process');
      
      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} document(s)`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to process ${errorCount} document(s)`);
      }

      setSelectedDocs(new Set());
      fetchDocuments();
    } catch (error) {
      console.error('Error bulk processing:', error);
      toast.error('Failed to process documents');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessPending = async () => {
    const pendingDocs = documents.filter(d => 
      d.processingStatus === 'pending' || d.processingStatus === 'failed'
    );

    if (pendingDocs.length === 0) {
      toast.error('No pending documents to process');
      return;
    }

    if (!confirm(`Process all ${pendingDocs.length} pending document(s)?`)) {
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
        fetchDocuments();
      } else {
        toast.error(result.error || 'Failed to start processing');
      }
    } catch (error) {
      console.error('Error processing pending:', error);
      toast.error('Failed to start processing');
    } finally {
      setProcessing(false);
    }
  };

  const getProcessingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} />
            <span>Completed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Loader size={12} className="animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} />
            <span>Failed</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
      default:
        return <span className="text-gray-500 text-xs">{status}</span>;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">
              View all crawled pages and their processing status
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedDocs.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedDocs.size} selected
                </span>
                <button
                  onClick={handleBulkProcess}
                  disabled={processing}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      <span>Process Selected</span>
                    </>
                  )}
                </button>
              </div>
            )}
            <button
              onClick={handleProcessPending}
              disabled={processing}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Activity size={18} />
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

        {/* Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Source
          </label>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Sources</option>
            {sources.map(source => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Documents Found
            </h3>
            <p className="text-gray-600">
              {filterSource 
                ? 'No documents found for this source' 
                : 'Start by crawling a website'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={documents.length > 0 && selectedDocs.size === documents.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Chunks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={() => toggleSelectDoc(doc.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 mb-1">
                            {doc.pageTitle || 'Untitled Page'}
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-md"
                          >
                            {doc.url}
                          </a>
                          {doc.errorMessage && (
                            <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                              <AlertCircle size={12} />
                              <span>{doc.errorMessage}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doc.sourceName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {doc.totalChunks}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getProcessingStatusBadge(doc.processingStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.lastProcessedAt
                          ? format(new Date(doc.lastProcessedAt), 'MMM dd, yyyy HH:mm')
                          : doc.lastCrawledAt
                          ? format(new Date(doc.lastCrawledAt), 'MMM dd, yyyy HH:mm')
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleReprocess(doc.id, doc.pageTitle || doc.url)}
                          className="text-green-600 hover:text-green-900"
                          title="Reprocess"
                          disabled={doc.processingStatus === 'processing'}
                        >
                          <RefreshCw 
                            size={18}
                            className={doc.processingStatus === 'processing' ? 'animate-spin' : ''}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
