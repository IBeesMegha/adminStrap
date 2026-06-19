/**
 * Example: How to integrate ImageGallery with RAG Search Results
 * 
 * This file shows how to use the ImageGallery component in a chatbot or search interface
 */

import React, { useState } from 'react';
import ImageGallery, { ImageData } from '@/components/ai/ImageGallery';

interface SearchResult {
  success: boolean;
  source: 'rag' | 'faq';
  answer: string;
  images?: ImageData[];
  supportingChunks?: any[];
  totalRetrieved?: number;
  totalAfterRerank?: number;
}

const ChatbotResponseExample: React.FC = () => {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/knowledge-base/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          sourceId: undefined, // or specify a source ID
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="inline-block animate-spin">⏳</div> Searching knowledge base...
        </div>
      )}

      {/* Result Display */}
      {result && !loading && (
        <>
          {/* AI Answer */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Answer</h3>
            <div className="prose prose-sm rounded-lg border border-gray-200 bg-blue-50 p-4 text-gray-800">
              {result.answer}
            </div>
          </div>

          {/* Images Gallery */}
          {result.images && result.images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Related Images</h3>
                <span className="text-xs text-gray-500">
                  {result.images.length} image{result.images.length > 1 ? 's' : ''} found
                </span>
              </div>
              <ImageGallery
                images={result.images}
                maxImages={6}
                onImageClick={(image) => {
                  console.log('Image clicked:', image);
                }}
              />
            </div>
          )}

          {/* Source Information */}
          <div className="space-y-2 border-t border-gray-200 pt-4 text-xs text-gray-500">
            <div>
              <strong>Source:</strong> {result.source.toUpperCase()}
            </div>
            {result.totalRetrieved !== undefined && (
              <div>
                <strong>Chunks Retrieved:</strong> {result.totalRetrieved}
              </div>
            )}
            {result.totalAfterRerank !== undefined && (
              <div>
                <strong>Chunks Used:</strong> {result.totalAfterRerank}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Minimal Integration Example
 * 
 * Add this to your existing chatbot component:
 */
const MinimalIntegrationExample = () => {
  return (
    <div>
      {/* Your existing answer display */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p>This is the AI-generated answer...</p>
      </div>

      {/* Add the ImageGallery component for displaying images */}
      {/* 
        <ImageGallery
          images={searchResult.images}
          maxImages={6}
          className="mt-4"
        />
      */}
    </div>
  );
};

export { ChatbotResponseExample, MinimalIntegrationExample };
