import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Globe,
  CheckCircle,
  XCircle,
  Loader,
  Clock,
  Search,
  MessageSquare,
  Send,
  RefreshCw,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface KnowledgePage {
  id: string;
  url: string;
  pageTitle: string | null;
  textContent: string;
  contentLength: number;
  crawlStatus: string;
  lastCrawledAt: Date | null;
}

interface KnowledgeSource {
  id: string;
  name: string;
  websiteUrl: string;
  status: string;
  totalPages: number;
  lastCrawlAt: Date | null;
  errorMessage: string | null;
  pages: KnowledgePage[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
}

export default function KnowledgeSourceDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [source, setSource] = useState<KnowledgeSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pages' | 'chat'>('pages');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    if (id) {
      fetchSource();

      // Poll for status updates every 5 seconds
      const interval = setInterval(fetchSource, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const fetchSource = async () => {
    try {
      const response = await fetch(`/api/knowledge-base/${id}`);
      const result = await response.json();

      if (result.success) {
        setSource(result.data);
        if (!editedName) {
          setEditedName(result.data.name);
        }
      } else {
        toast.error('Failed to load knowledge source');
      }
    } catch (error) {
      console.error('Error fetching source:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReCrawl = async () => {
    if (!confirm('Start re-crawling this website?')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base/${id}/crawl`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Crawling started');
        fetchSource();
      } else {
        toast.error(result.error || 'Failed to start crawling');
      }
    } catch (error) {
      console.error('Error starting crawl:', error);
      toast.error('Failed to start crawling');
    }
  };

  const handleSaveName = async () => {
    try {
      const response = await fetch(`/api/knowledge-base/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editedName }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Name updated successfully');
        setIsEditingName(false);
        fetchSource();
      } else {
        toast.error(result.error || 'Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
    };

    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch(`/api/knowledge-base/${id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: chatInput }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: result.data.answer,
          sources: result.data.sources,
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        toast.error(result.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setChatLoading(false);
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

  const filteredPages = source?.pages.filter((page) => {
    const query = searchQuery.toLowerCase();
    return (
      page.url.toLowerCase().includes(query) ||
      page.pageTitle?.toLowerCase().includes(query) ||
      page.textContent.toLowerCase().includes(query)
    );
  });

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

  if (!source) {
    return (
      <Layout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Knowledge source not found</p>
          </div>
        </div>
      </Layout>
    );
  }

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

          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 text-green-600 hover:text-green-800"
                  >
                    <Save size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setEditedName(source.name);
                    }}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{source.name}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              )}

              <a
                href={source.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <Globe size={16} />
                <span>{source.websiteUrl}</span>
              </a>
            </div>

            <button
              onClick={handleReCrawl}
              disabled={source.status === 'crawling'}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={18}
                className={source.status === 'crawling' ? 'animate-spin' : ''}
              />
              <span>Re-Crawl</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div>{getStatusBadge(source.status)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="text-sm text-gray-600 mb-1">Total Pages</div>
            <div className="text-2xl font-bold text-gray-900">{source.totalPages}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="text-sm text-gray-600 mb-1">Last Crawl</div>
            <div className="text-sm text-gray-900">
              {source.lastCrawlAt
                ? format(new Date(source.lastCrawlAt), 'MMM dd, yyyy HH:mm')
                : 'Never'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="text-sm text-gray-600 mb-1">Crawled Pages</div>
            <div className="text-2xl font-bold text-gray-900">{source.pages.length}</div>
          </div>
        </div>

        {/* Error Message */}
        {source.errorMessage && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{source.errorMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pages')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pages ({source.pages.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare size={16} />
              <span>Chat</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'pages' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages by URL, title, or content..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Pages Table */}
            {filteredPages && filteredPages.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Content Length
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPages.map((page) => (
                      <tr key={page.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline max-w-md truncate block"
                          >
                            {page.url}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {page.pageTitle || 'Untitled'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {page.contentLength.toLocaleString()} chars
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {page.crawlStatus === 'crawled' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={12} />
                              <span>Crawled</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">{page.crawlStatus}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {page.lastCrawledAt
                            ? format(new Date(page.lastCrawledAt), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500">No pages found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {source.pages.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Content Available
                </h3>
                <p className="text-gray-600 mb-6">
                  Please crawl the website first to enable chat functionality
                </p>
                <button
                  onClick={handleReCrawl}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw size={18} />
                  <span>Start Crawling</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-[600px]">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <MessageSquare className="mx-auto mb-4" size={48} />
                      <p>Start a conversation by asking a question below</p>
                      <p className="text-sm mt-2">
                        Example: "What services do you offer?" or "Tell me about your products"
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-3xl rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-300">
                              <p className="text-xs font-semibold mb-2">Sources:</p>
                              <div className="space-y-2">
                                {message.sources.map((source, idx) => (
                                  <div key={idx} className="text-xs">
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline font-medium"
                                    >
                                      {source.title}
                                    </a>
                                    <p className="text-gray-600 mt-1">{source.snippet}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <Loader className="animate-spin text-gray-600" size={20} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChat();
                        }
                      }}
                      placeholder="Ask a question about the website content..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={handleChat}
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
