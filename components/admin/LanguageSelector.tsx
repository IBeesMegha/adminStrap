import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string | null;
  flag: string | null;
  isDefault: boolean;
  isActive: boolean;
}

interface LanguageSelectorProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  translationGroupId?: string;
  availableTranslations?: string[];
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLang,
  onLanguageChange,
  translationGroupId,
  availableTranslations = [],
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const res = await fetch('/api/languages?active=true');
      const data = await res.json();

      if (res.ok) {
        setLanguages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === currentLang);

  if (loading || languages.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Globe size={18} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLanguage?.flag} {currentLanguage?.name || currentLang.toUpperCase()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
                Select Language
              </div>
              {languages.map((lang) => {
                const hasTranslation = availableTranslations.includes(lang.code);
                const isCurrent = lang.code === currentLang;

                return (
                  <button
                    key={lang.id}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                      isCurrent
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{lang.flag || '🏳️'}</span>
                      <span className="font-medium">{lang.name}</span>
                      {lang.nativeName && lang.nativeName !== lang.name && (
                        <span className="text-gray-500">({lang.nativeName})</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {lang.isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          Default
                        </span>
                      )}
                      {hasTranslation && !isCurrent && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          ✓
                        </span>
                      )}
                      {!hasTranslation && !isCurrent && translationGroupId && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                          New
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
