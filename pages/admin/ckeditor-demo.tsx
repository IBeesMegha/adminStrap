'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import dynamic from 'next/dynamic';

const CKEditorField = dynamic(
  () => import('@/components/admin/CKEditorField').then(mod => ({ default: mod.CKEditorField })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
        <span className="text-gray-500">Loading CKEditor...</span>
      </div>
    )
  }
);

export default function CKEditorDemoPage() {
  const [content, setContent] = useState<string>('');
  const [isPreview, setIsPreview] = useState(false);

  const handleChange = (value: string) => {
    setContent(value);
  };

  const handleClear = () => {
    setContent('');
  };

  const plainTextLength = content.replace(/<[^>]*>/g, '').length;

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CKEditor 5 Demo</h1>
          <p className="text-gray-600">
            Modern modular CKEditor 5 implementation with Next.js
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={() => setIsPreview(false)}
            className={`px-4 py-2 rounded transition-colors font-medium ${
              !isPreview
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`px-4 py-2 rounded transition-colors font-medium ${
              isPreview
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Preview HTML
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors font-medium ml-auto"
          >
            Clear Content
          </button>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Character count: {plainTextLength}
        </div>

        <div className="bg-white rounded-lg shadow">
          {isPreview ? (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[500px]">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono overflow-x-auto">
                {content || 'No content'}
              </pre>
            </div>
          ) : (
            <CKEditorField
              value={content}
              onChange={handleChange}
              placeholder="Start typing your content here..."
              minHeight={500}
            />
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Features Included:</h3>
          <ul className="text-sm text-blue-800 grid grid-cols-2 md:grid-cols-4 gap-2">
            <li>Essentials</li>
            <li>Heading</li>
            <li>Bold, Italic, Underline</li>
            <li>Strikethrough</li>
            <li>Code & CodeBlock</li>
            <li>Links & AutoLink</li>
            <li>BlockQuote</li>
            <li>Lists (Bulleted, Numbered, Todo)</li>
            <li>Indent/Outdent</li>
            <li>Images (Toolbar, Caption, Style, Resize)</li>
            <li>Tables (Properties, Cell Properties)</li>
            <li>Special Characters</li>
            <li>Horizontal Line</li>
            <li>Page Break</li>
            <li>Undo/Redo</li>
            <li>Source Editing</li>
            <li>Show Blocks</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}