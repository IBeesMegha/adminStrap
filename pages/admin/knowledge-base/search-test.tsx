import React, { useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import Link from 'next/link';
import { Search, Loader, ExternalLink, AlertCircle, MessageSquare, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SupportingChunk {
  id: string;
  chunkText: string;
  similarity: number;
  sectionHeading: string | null;
  pageTitle: string | null;
  pageUrl: string;
  sourceName: string;
  sourceId: string;
  pageId: string;
}

interface RAGResponse {
  answer: string;
  supportingChunks: SupportingChunk[];
  totalRetrieved: number;
  totalAfterRerank: number;
  source?: 'faq' | 'rag';
  faqQuestion?: string;
  faqId?: string;
  relevanceScore?: number;
}

export default function SearchTestPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [ragResponse, setRagResponse] = useState<RAGResponse | null>(null);
  const [showChunks, setShowChunks] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setSearching(true);
    setSearchPerformed(false);
    setRagResponse(null);

    try {
      const response = await fetch('/api/knowledge-base/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setRagResponse({
          answer: result.answer,
          supportingChunks: result.supportingChunks || [],
          totalRetrieved: result.totalRetrieved || 0,
          totalAfterRerank: result.totalAfterRerank || 0,
          source: result.source || 'rag',
          faqQuestion: result.faqQuestion,
          faqId: result.faqId,
          relevanceScore: result.relevanceScore,
        });
        setSearchPerformed(true);

        if (result.source === 'faq') {
          toast.success('Answer from FAQ (instant match!)');
        } else if (!result.supportingChunks || result.supportingChunks.length === 0) {
          toast('No relevant information found', { icon: '🔍' });
        } else {
          toast.success('Answer generated from knowledge base');
        }
      } else {
        toast.error(result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'text-green-600 bg-green-100';
    if (similarity >= 0.8) return 'text-blue-600 bg-blue-100';
    if (similarity >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hybrid FAQ + RAG Search Test</h1>
            <p className="text-gray-600">
              Test FAQ matching and AI-powered answer generation
            </p>
          </div>
          <Link
            href="/admin/knowledge-base"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Sources
          </Link>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">About Hybrid Search</h3>
              <p className="text-sm text-blue-800">
                <strong>Step 1:</strong> Checks FAQs first for instant keyword matches (⚡ fast). <br />
                <strong>Step 2:</strong> If no FAQ match, uses full RAG pipeline: vector search →
                reranking → context building → LLM answer generation.
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSearch}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What products do you offer?"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={searching}
              />
              <button
                type="submit"
                disabled={searching}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {searchPerformed && ragResponse && (
          <div className="space-y-6">
            {/* FAQ Badge (if answer is from FAQ) */}
            {ragResponse.source === 'faq' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-900">⚡ Instant Answer from FAQ</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Relevance: {ragResponse.relevanceScore}
                      </span>
                    </div>
                    <p className="text-sm text-green-800 mb-1">
                      <strong>Matched Question:</strong> {ragResponse.faqQuestion}
                    </p>
                    <p className="text-xs text-green-600">
                      This answer was retrieved instantly from your FAQ database without using AI generation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Answer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`px-6 py-4 border-b border-gray-200 ${
                ragResponse.source === 'faq' 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <MessageSquare className={ragResponse.source === 'faq' ? 'text-green-600' : 'text-blue-600'} size={22} />
                  <h2 className="text-xl font-bold text-gray-900">
                    {ragResponse.source === 'faq' ? 'FAQ Answer' : 'AI Generated Answer'}
                  </h2>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {ragResponse.source === 'faq' ? (
                    `FAQ ID: ${ragResponse.faqId?.substring(0, 8)}`
                  ) : (
                    `Retrieved from ${ragResponse.totalAfterRerank} chunks (searched ${ragResponse.totalRetrieved} total)`
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="prose prose-blue max-w-none text-gray-800 text-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {ragResponse.answer}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Supporting Chunks Toggle */}
            {ragResponse.source === 'rag' && ragResponse.supportingChunks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setShowChunks(!showChunks)}
                  className="w-full px-6 py-4 border-b border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="text-gray-600" size={20} />
                    <h2 className="text-xl font-bold text-gray-900">
                      Supporting Sources ({ragResponse.supportingChunks.length})
                    </h2>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${showChunks ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showChunks && (
                  <div className="divide-y divide-gray-200">
                    {ragResponse.supportingChunks.map((chunk, index) => (
                      <div key={chunk.id} className="p-6 hover:bg-gray-50">
                        {/* Result Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-bold text-gray-400">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 mb-1">
                                {chunk.pageTitle || 'Untitled Page'}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-600">
                                  {chunk.sourceName}
                                </span>
                                {chunk.sectionHeading && (
                                  <span className="text-xs text-gray-400">
                                    · {chunk.sectionHeading}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getSimilarityColor(
                              chunk.similarity
                            )}`}
                          >
                            {(chunk.similarity * 100).toFixed(1)}% match
                          </span>
                        </div>

                        {/* Chunk Content */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {chunk.chunkText.length > 500
                              ? chunk.chunkText.substring(0, 500) + '...'
                              : chunk.chunkText}
                          </p>
                        </div>

                        {/* Result Footer */}
                        <div className="flex items-center justify-between text-xs">
                          <a
                            href={chunk.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <ExternalLink size={12} />
                            <span className="truncate max-w-md">{chunk.pageUrl}</span>
                          </a>
                          <div className="text-gray-500">
                            Chunk ID: {chunk.id.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchPerformed && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <MessageSquare className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Enter a search query above
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask any question about your knowledge base content.
              The system will retrieve relevant information and generate
              a complete answer using AI.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
