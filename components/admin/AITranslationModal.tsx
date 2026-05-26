import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Field } from '@/lib/types';
import toast from 'react-hot-toast';

interface AITranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
  translationGroupId: string;
  sourceEntryId: string;
  sourceLang: string;
  targetLang: string;
  fields: Field[];
  onTranslationComplete: (translatedData: Record<string, any>) => void;
}

interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string | null;
  flag: string | null;
}

export const AITranslationModal: React.FC<AITranslationModalProps> = ({
  isOpen,
  onClose,
  collectionName,
  translationGroupId,
  sourceEntryId,
  sourceLang,
  targetLang,
  fields,
  onTranslationComplete,
}) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<LanguageInfo | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<LanguageInfo | null>(null);

  // Get translatable fields (exclude system fields, IDs, relations, media, etc.)
  const translatableFields = fields.filter(field => {
    // Only include fields marked as translatable
    if ('translatable' in field && field.translatable === false) {
      return false;
    }

    // Exclude system fields
    if (['id', 'createdAt', 'updatedAt', 'published', 'publishedAt', 'lang', 'translationGroupId', 'translationStatus'].includes(field.name)) {
      return false;
    }

    // Exclude relation fields
    if (field.type === 'relation') {
      return false;
    }

    // Exclude media fields
    if (field.type === 'media') {
      return false;
    }

    // Exclude component and dynamic zone fields (for now)
    if (field.type === 'component' || field.type === 'dynamiczone') {
      return false;
    }

    // Include text-based fields
    if (['string', 'text', 'richtext', 'richtext-ckeditor', 'email'].includes(field.type)) {
      return true;
    }

    return false;
  });

  // Fetch language information
  useEffect(() => {
    if (isOpen) {
      fetchLanguageInfo();
      // Auto-select all translatable fields by default
      setSelectedFields(new Set(translatableFields.map(f => f.name)));
    }
  }, [isOpen, sourceLang, targetLang]);

  const fetchLanguageInfo = async () => {
    try {
      const res = await fetch('/api/languages');
      const data = await res.json();

      if (res.ok) {
        const languages = data.data;
        setSourceLanguage(languages.find((l: LanguageInfo) => l.code === sourceLang) || null);
        setTargetLanguage(languages.find((l: LanguageInfo) => l.code === targetLang) || null);
      }
    } catch (error) {
      console.error('Failed to fetch language info:', error);
    }
  };

  const toggleField = (fieldName: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldName)) {
      newSelected.delete(fieldName);
    } else {
      newSelected.add(fieldName);
    }
    setSelectedFields(newSelected);
  };

  const toggleAll = () => {
    if (selectedFields.size === translatableFields.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(translatableFields.map(f => f.name)));
    }
  };

  const handleGenerate = async () => {
    if (selectedFields.size === 0) {
      toast.error('Please select at least one field to translate');
      return;
    }

    setIsTranslating(true);
    const toastId = toast.loading('Generating AI translation...');

    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionName,
          translationGroupId,
          sourceEntryId,
          sourceLang,
          targetLang,
          fields: Array.from(selectedFields),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Translation generated successfully!', { id: toastId });
        onTranslationComplete(data.data.translatedContent);
        onClose();
      } else {
        toast.error(data.error || 'Failed to generate translation', { id: toastId });
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error('Failed to generate translation', { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={!isTranslating ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Generate AI Translation
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Powered by Groq (Llama 3.3 70B)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isTranslating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Language Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{sourceLanguage?.flag || '🌐'}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Translate From</div>
                  <div className="text-lg font-bold text-gray-900">
                    {sourceLanguage?.name || sourceLang.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-2xl">{targetLanguage?.flag || '🌐'}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Translate To</div>
                  <div className="text-lg font-bold text-gray-900">
                    {targetLanguage?.name || targetLang.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Select Fields to Translate
              </h3>
              <button
                onClick={toggleAll}
                disabled={isTranslating}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                {selectedFields.size === translatableFields.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {translatableFields.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No translatable fields found. Make sure your content type has text-based fields.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {translatableFields.map(field => (
                  <label
                    key={field.name}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition ${
                      selectedFields.has(field.name)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.has(field.name)}
                      onChange={() => toggleField(field.name)}
                      disabled={isTranslating}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {field.displayName}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {field.type}
                        </span>
                      </div>
                      {field.required && (
                        <span className="text-xs text-red-600 mt-0.5">Required</span>
                      )}
                    </div>
                    {selectedFields.has(field.name) && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 ml-2" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">How it works:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• AI will translate selected fields from the source language</li>
              <li>• Translated content will auto-fill into the form</li>
              <li>• You can review and edit before saving</li>
              <li>• HTML formatting and structure will be preserved</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isTranslating}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isTranslating || selectedFields.size === 0}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Translation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
