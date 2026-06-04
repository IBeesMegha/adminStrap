import React, { useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import Link from 'next/link';
import { Search, Loader, ExternalLink, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SearchResult {
  chunkId: string;
  chunkText: string;
  similarity: number;
  pageTitle: string | null;
  pageUrl: string;
  sourceName: string;
  sourceId: string;
  pageId: string;
}

export default function SearchTestPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const [perfectMatch, setPerfectMatch] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setSearching(true);
    setSearchPerformed(false);

    try {
      const response = await fetch('/api/knowledge-base/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResults(result.results || []);
        setTotalMatches(result.totalMatches || 0);
        setPerfectMatch(result.perfectMatch || false);
        setSearchPerformed(true);
        
        if (result.results.length === 0) {
          toast('No results found', { icon: '🔍' });
        } else if (result.perfectMatch) {
          toast.success('🎯 Perfect match found!');
        } else {
          toast.success(`Found ${result.results.length} results`);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Testing</h1>
            <p className="text-gray-600">
              Test semantic search quality and retrieval accuracy
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
              <h3 className="font-semibold text-blue-900 mb-1">About This Tool</h3>
              <p className="text-sm text-blue-800">
                This page allows you to test the semantic search functionality. 
                Enter a natural language query and see which content chunks are retrieved 
                with their similarity scores. This helps you validate the quality of your 
                embeddings and search results before integrating with chat features.
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
        {searchPerformed && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Perfect Match Banner */}
            {perfectMatch && results.length > 0 && (
              <div className="px-6 py-4 bg-green-50 border-b border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="text-green-600 text-2xl">🎯</div>
                  <div>
                    <h3 className="font-semibold text-green-900">Perfect Match Found!</h3>
                    <p className="text-sm text-green-700">
                      Showing only exact matches (98%+ similarity). Other results filtered out.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Search Results
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {results.length} of {totalMatches} matches
                  {!perfectMatch && results.length < totalMatches && (
                    <span className="ml-2 text-xs text-gray-500">
                      (filtered to high-quality results)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-600">
                  Try a different query or check if your knowledge base has been processed
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {results.map((result, index) => (
                  <div key={result.chunkId} className="p-6 hover:bg-gray-50">
                    {/* Result Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-bold text-gray-400">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">
                            {result.pageTitle || 'Untitled Page'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {result.sourceName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getSimilarityColor(
                            result.similarity
                          )}`}
                        >
                          {(result.similarity * 100).toFixed(1)}% match
                        </span>
                      </div>
                    </div>

                    {/* Chunk Content */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {result.chunkText.length > 500
                          ? result.chunkText.substring(0, 500) + '...'
                          : result.chunkText}
                      </p>
                    </div>

                    {/* Result Footer */}
                    <div className="flex items-center justify-between text-xs">
                      <a
                        href={result.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink size={12} />
                        <span className="truncate max-w-md">{result.pageUrl}</span>
                      </a>
                      <div className="text-gray-500">
                        Chunk ID: {result.chunkId.substring(0, 8)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchPerformed && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Search className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Enter a search query above
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Test your knowledge base by entering natural language queries. 
              The system will find the most relevant content chunks using semantic search.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
