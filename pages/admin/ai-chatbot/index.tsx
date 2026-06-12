import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/admin/Layout';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Database,
  FileQuestion,
  Globe,
  FileText,
  FileUp,
  Sparkles,
  Search,
  MessageSquare,
  Zap,
  GitBranch,
  Code2,
  Variable,
  Webhook,
  Palette,
  Image as ImageIcon,
  MessageCircle,
  Type,
  Layout as LayoutIcon,
  MessagesSquare,
  HelpCircle,
  XCircle,
  ThumbsUp,
  Loader,
  Plus,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle as ErrorIcon,
  Clock,
  Activity,
  ExternalLink,
  AlertCircle,
  Upload,
  BarChart3,
} from 'lucide-react';

type SectionKey =
  | 'overview'
  | 'faq-management'
  | 'website-crawl'
  | 'pdf-upload'
  | 'docx-upload'
  | 'embeddings-training'
  | 'search-testing'
  | 'welcome-message'
  | 'quick-questions'
  | 'flow-designer'
  | 'conditions'
  | 'variables'
  | 'api-actions'
  | 'theme-colors'
  | 'theme-logo'
  | 'theme-icon'
  | 'theme-text'
  | 'theme-position'
  | 'theme-css'
  | 'analytics-conversations'
  | 'analytics-questions'
  | 'analytics-failed'
  | 'analytics-feedback';

interface KnowledgeStats {
  totalSources: number;
  totalDocuments: number;
  totalFaqs: number;
  totalChunks: number;
  embeddingStatus: string;
  lastTrainingDate: string | null;
}

interface KnowledgeSource {
  id: string;
  name: string;
  websiteUrl: string;
  status: string;
  totalPages: number;
  lastCrawlAt: Date | null;
  createdAt: Date;
}

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

export default function AIChatbotPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [loading, setLoading] = useState(false);
  
  // Knowledge Base State
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    if (!authLoading && !hasPermission('settings.manage')) {
      router.push('/admin/403');
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (activeSection === 'overview') {
      fetchOverviewStats();
    } else if (activeSection === 'website-crawl') {
      fetchSources();
    } else if (activeSection === 'pdf-upload' || activeSection === 'docx-upload') {
      fetchDocuments();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'website-crawl') {
      const interval = setInterval(fetchSources, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSection]);

  const fetchOverviewStats = async () => {
    setLoading(true);
    try {
      const sourcesRes = await fetch('/api/knowledge-base');
      const sourcesData = await sourcesRes.json();
      
      const docsRes = await fetch('/api/knowledge-base/documents');
      const docsData = await docsRes.json();

      if (sourcesData.success && docsData.success) {
        const sources = sourcesData.data;
        const docs = docsData.data;
        
        const totalChunks = docs.reduce((sum: number, doc: Document) => sum + doc.totalChunks, 0);
        
        setStats({
          totalSources: sources.length,
          totalDocuments: docs.length,
          totalFaqs: 0,
          totalChunks: totalChunks,
          embeddingStatus: totalChunks > 0 ? 'Ready' : 'Not Configured',
          lastTrainingDate: docs.length > 0 ? docs[0].lastProcessedAt : null,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch overview stats');
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

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/knowledge-base/documents');
      const result = await response.json();
      if (result.success) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const response = await fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' });
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
    if (!confirm(`Start re-crawling "${name}"?`)) return;
    try {
      const response = await fetch(`/api/knowledge-base/${id}/crawl`, { method: 'POST' });
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
    const statusConfig = {
      completed: { icon: CheckCircle, text: 'Completed', className: 'bg-green-100 text-green-800', spin: false },
      crawling: { icon: Loader, text: 'Crawling', className: 'bg-blue-100 text-blue-800', spin: true },
      processing: { icon: Loader, text: 'Processing', className: 'bg-blue-100 text-blue-800', spin: true },
      failed: { icon: ErrorIcon, text: 'Failed', className: 'bg-red-100 text-red-800', spin: false },
      pending: { icon: Clock, text: 'Pending', className: 'bg-gray-100 text-gray-800', spin: false },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <span className="text-gray-500">{status}</span>;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon size={14} className={config.spin ? 'animate-spin' : ''} />
        <span>{config.text}</span>
      </span>
    );
  };

  const navigationSections = [
    {
      title: 'Knowledge Base',
      items: [
        { key: 'overview', label: 'Overview', icon: <Database size={18} /> },
        { key: 'faq-management', label: 'FAQ Management', icon: <FileQuestion size={18} /> },
        { key: 'website-crawl', label: 'Website Crawl', icon: <Globe size={18} /> },
        { key: 'pdf-upload', label: 'PDF Upload', icon: <FileText size={18} /> },
        { key: 'docx-upload', label: 'DOCX Upload', icon: <FileUp size={18} /> },
        { key: 'embeddings-training', label: 'Embeddings & Training', icon: <Sparkles size={18} /> },
        { key: 'search-testing', label: 'Search Testing', icon: <Search size={18} /> },
      ],
    },
    {
      title: 'Workflow Builder',
      items: [
        { key: 'welcome-message', label: 'Welcome Message', icon: <MessageSquare size={18} /> },
        { key: 'quick-questions', label: 'Quick Questions', icon: <Zap size={18} /> },
        { key: 'flow-designer', label: 'Flow Designer', icon: <GitBranch size={18} /> },
        { key: 'conditions', label: 'Conditions', icon: <Code2 size={18} /> },
        { key: 'variables', label: 'Variables', icon: <Variable size={18} /> },
        { key: 'api-actions', label: 'API Actions', icon: <Webhook size={18} /> },
      ],
    },
    {
      title: 'Theme Settings',
      items: [
        { key: 'theme-colors', label: 'Colors', icon: <Palette size={18} /> },
        { key: 'theme-logo', label: 'Logo', icon: <ImageIcon size={18} /> },
        { key: 'theme-icon', label: 'Chat Icon', icon: <MessageCircle size={18} /> },
        { key: 'theme-text', label: 'Welcome Text', icon: <Type size={18} /> },
        { key: 'theme-position', label: 'Widget Position', icon: <LayoutIcon size={18} /> },
        { key: 'theme-css', label: 'Custom CSS', icon: <Code2 size={18} /> },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { key: 'analytics-conversations', label: 'Conversations', icon: <MessagesSquare size={18} /> },
        { key: 'analytics-questions', label: 'Popular Questions', icon: <HelpCircle size={18} /> },
        { key: 'analytics-failed', label: 'Failed Searches', icon: <XCircle size={18} /> },
        { key: 'analytics-feedback', label: 'User Feedback', icon: <ThumbsUp size={18} /> },
      ],
    },
  ];

  if (authLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="flex h-[calc(100vh-4rem)]">
          <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-lg font-bold text-gray-900">AI Chatbot</h1>
              <p className="text-xs text-gray-500 mt-1">Manage your AI assistant</p>
            </div>
            
            <nav className="p-2 space-y-6">
              {navigationSections.map((section) => (
                <div key={section.title}>
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setActiveSection(item.key as SectionKey)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition ${
                          activeSection === item.key
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
              {activeSection === 'overview' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Knowledge Base Overview</h2>
                  <p className="text-gray-500 text-sm mb-6">View comprehensive statistics about your AI knowledge base</p>
                  
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader className="animate-spin text-blue-600" size={32} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500">Total Knowledge Sources</h3>
                          <Globe className="text-blue-600" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalSources || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Active crawl sources</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500">Total Documents</h3>
                          <FileText className="text-green-600" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalDocuments || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Indexed pages</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500">Total FAQs</h3>
                          <FileQuestion className="text-purple-600" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalFaqs || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Curated Q&A</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500">Total Chunks</h3>
                          <Database className="text-orange-600" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats?.totalChunks || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Vector embeddings</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500">Embedding Status</h3>
                          <Activity className={`${stats?.embeddingStatus === 'Ready' ? 'text-green-600' : 'text-gray-400'}`} size={24} />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{stats?.embeddingStatus || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 mt-1">AI training status</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-500">Last Training Date</h3>
                          <Clock className="text-indigo-600" size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {stats?.lastTrainingDate ? format(new Date(stats.lastTrainingDate), 'MMM dd, yyyy') : 'Never'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {stats?.lastTrainingDate ? format(new Date(stats.lastTrainingDate), 'HH:mm') : 'No training yet'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div><p className="text-2xl font-bold text-gray-900">0</p><p className="text-sm text-gray-500">Total Searches</p></div>
                      <div><p className="text-2xl font-bold text-gray-900">0</p><p className="text-sm text-gray-500">Successful Matches</p></div>
                      <div><p className="text-2xl font-bold text-gray-900">0%</p><p className="text-sm text-gray-500">Success Rate</p></div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'faq-management' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">FAQ Management</h2>
                      <p className="text-gray-500 text-sm">Manage frequently asked questions for your chatbot</p>
                    </div>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Plus size={20} />
                      <span>Add FAQ</span>
                    </button>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <FileQuestion className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-gray-600">FAQ management feature will be available soon</p>
                  </div>
                </div>
              )}

              {activeSection === 'website-crawl' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Website Crawl</h2>
                      <p className="text-gray-500 text-sm">Crawl and index website content for your AI chatbot</p>
                    </div>
                    <button 
                      onClick={() => router.push('/admin/knowledge-base/new')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={20} />
                      <span>Add Website</span>
                    </button>
                  </div>
                  
                  {sources.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                      <Globe className="mx-auto text-gray-400 mb-4" size={48} />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Websites Yet</h3>
                      <p className="text-gray-600 mb-6">Start by adding a website to crawl and index</p>
                      <button 
                        onClick={() => router.push('/admin/knowledge-base/new')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus size={20} />
                        <span>Add Website</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Website URL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pages</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Crawl</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
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
                                {source.lastCrawlAt ? format(new Date(source.lastCrawlAt), 'MMM dd, yyyy HH:mm') : 'Never'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => router.push(`/admin/knowledge-base/${source.id}`)} className="text-blue-600 hover:text-blue-900" title="View"><Eye size={18} /></button>
                                  <button onClick={() => handleReCrawl(source.id, source.name)} className="text-green-600 hover:text-green-900" title="Re-crawl" disabled={source.status === 'crawling'}><RefreshCw size={18} className={source.status === 'crawling' ? 'animate-spin' : ''} /></button>
                                  <button onClick={() => handleDeleteSource(source.id, source.name)} className="text-red-600 hover:text-red-900" title="Delete" disabled={source.status === 'crawling'}><Trash2 size={18} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {(activeSection === 'pdf-upload' || activeSection === 'docx-upload' || activeSection === 'embeddings-training' || activeSection === 'search-testing') && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {activeSection === 'pdf-upload' && 'PDF Upload'}
                    {activeSection === 'docx-upload' && 'DOCX Upload'}
                    {activeSection === 'embeddings-training' && 'Embeddings & Training'}
                    {activeSection === 'search-testing' && 'Search Testing'}
                  </h2>
                  <p className="text-gray-500 text-sm mb-6">
                    {activeSection === 'pdf-upload' && 'Upload and process PDF documents'}
                    {activeSection === 'docx-upload' && 'Upload and process DOCX documents'}
                    {activeSection === 'embeddings-training' && 'Manage embedding generation and training'}
                    {activeSection === 'search-testing' && 'Test semantic search and AI responses'}
                  </p>

                  {activeSection === 'search-testing' ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                          <div>
                            <h3 className="font-semibold text-blue-900 mb-1">Use Existing Search Test Page</h3>
                            <p className="text-sm text-blue-800 mb-3">
                              The full search testing interface is available on the dedicated page.
                            </p>
                            <Link
                              href="/admin/knowledge-base/search-test"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <ExternalLink size={16} />
                              Open Search Test Page
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeSection === 'embeddings-training' ? (
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button onClick={() => router.push('/admin/knowledge-base/processing')} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Sparkles size={20} />Generate Embeddings</button>
                          <button onClick={() => router.push('/admin/knowledge-base/documents')} className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Activity size={20} />View Processing Jobs</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                      <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
                      <p className="text-gray-600">This feature will be available soon</p>
                    </div>
                  )}
                </div>
              )}

              {(activeSection.startsWith('welcome-message') || activeSection.startsWith('quick-') || activeSection.startsWith('flow-') || activeSection === 'conditions' || activeSection === 'variables' || activeSection === 'api-actions') && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {activeSection === 'welcome-message' && 'Welcome Message'}
                    {activeSection === 'quick-questions' && 'Quick Questions'}
                    {activeSection === 'flow-designer' && 'Flow Designer'}
                    {activeSection === 'conditions' && 'Conditions'}
                    {activeSection === 'variables' && 'Variables'}
                    {activeSection === 'api-actions' && 'API Actions'}
                  </h2>
                  <p className="text-gray-500 text-sm mb-6">Workflow builder features</p>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <GitBranch className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Workflow Builder Coming Soon</h3>
                    <p className="text-gray-600">Advanced workflow features will be available in the next release</p>
                  </div>
                </div>
              )}

              {activeSection.startsWith('theme-') && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Theme Settings</h2>
                  <p className="text-gray-500 text-sm mb-6">Customize chatbot appearance</p>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Palette className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Theme Settings Coming Soon</h3>
                    <p className="text-gray-600">Chatbot theme customization will be available soon</p>
                  </div>
                </div>
              )}

              {activeSection.startsWith('analytics-') && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Analytics</h2>
                  <p className="text-gray-500 text-sm mb-6">Track chatbot performance and user interactions</p>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                    <p className="text-gray-600">Detailed analytics and reporting will be available soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
