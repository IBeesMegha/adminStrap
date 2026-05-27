import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import { DynamicForm } from '@/components/admin/DynamicForm';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Globe, Plus } from 'lucide-react';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string | null;
  flag: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export default function SingleTypeEdit() {
  const router = useRouter();
  const { name } = router.query;

  const [singleType, setSingleType] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLang, setCurrentLang] = useState<string>('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [availableTranslations, setAvailableTranslations] = useState<string[]>([]);

  useEffect(() => {
    if (name) {
      fetchLanguages();
    }
  }, [name]);

  useEffect(() => {
    if (name && currentLang) {
      fetchSingleType();
    }
  }, [name, currentLang]);

  const fetchLanguages = async () => {
    try {
      const res = await fetch('/api/languages?active=true');
      const data = await res.json();

      if (res.ok && data.data.length > 0) {
        setLanguages(data.data);
        // Set default language as current
        const defaultLang = data.data.find((l: Language) => l.isDefault);
        if (defaultLang) {
          setCurrentLang(defaultLang.code);
        } else {
          setCurrentLang(data.data[0].code);
        }
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      // Fallback to 'en' if languages fetch fails
      setCurrentLang('en');
    }
  };

  const fetchSingleType = async () => {
    try {
      console.log('[SingleTypeEdit] Fetching single type:', name, 'lang:', currentLang);
      // Request fields explicitly for admin UI with language parameter
      const response = await fetch(`/api/single-types/${name}?includeFields=true&lang=${currentLang}`);
      console.log('[SingleTypeEdit] Response status:', response.status);
      const data = await response.json();
      console.log('[SingleTypeEdit] Response data:', data);
      
      if (response.ok && data.data) {
        setSingleType(data.data);
        
        // Fetch available translations
        if (data.data.translationGroupId) {
          fetchAvailableTranslations(data.data.translationGroupId);
        }
      } else {
        console.error('[SingleTypeEdit] Failed to fetch:', data);
        setSingleType(null);
      }
    } catch (error) {
      console.error('[SingleTypeEdit] Error fetching single type:', error);
      setSingleType(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTranslations = async (translationGroupId: string) => {
    try {
      const response = await fetch(`/api/single-types/${name}/translations/${translationGroupId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTranslations(data.data.availableLanguages || []);
      }
    } catch (error) {
      console.error('Failed to fetch translations:', error);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    setIsLangDropdownOpen(false);
    setLoading(true);
  };

  const handleCreateTranslation = async (langCode: string) => {
    if (!singleType) return;

    const toastId = toast.loading(`Creating ${langCode.toUpperCase()} translation...`);

    try {
      const response = await fetch(`/api/single-types/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: singleType.displayName,
          description: singleType.description,
          fields: singleType.fields,
          data: {}, // Empty data for new translation
          lang: langCode,
          translationGroupId: singleType.translationGroupId,
        }),
      });

      if (response.ok) {
        toast.success(`${langCode.toUpperCase()} translation created!`, { id: toastId });
        setCurrentLang(langCode);
        setIsLangDropdownOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create translation', { id: toastId });
      }
    } catch (error) {
      console.error('Error creating translation:', error);
      toast.error('Failed to create translation', { id: toastId });
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSaving(true);
    const toastId = toast.loading('Saving...');
    
    try {
      const response = await fetch(`/api/single-types/${name}?lang=${currentLang}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        toast.success('Single type updated successfully!', { id: toastId });
        fetchSingleType();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update single type', { id: toastId });
      }
    } catch (error) {
      console.error('Error updating single type:', error);
      toast.error('Failed to update single type', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8">Loading...</div>
      </Layout>
    );
  }

  if (!singleType) {
    return (
      <Layout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Single type not found
            </h2>
            <p className="text-red-700 mb-4">
              The single type "{name}" could not be found for language "{currentLang}". Please check:
            </p>
            <ul className="list-disc list-inside text-red-700 space-y-1 mb-4">
              <li>The single type exists in the database</li>
              <li>The name is spelled correctly</li>
              <li>A translation exists for the selected language</li>
              <li>The API is running properly</li>
            </ul>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/content-type-builder/single-types')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Back to Single Types
              </button>
              {languages.length > 0 && (
                <button
                  onClick={() => {
                    const defaultLang = languages.find(l => l.isDefault);
                    if (defaultLang) {
                      setCurrentLang(defaultLang.code);
                      setLoading(true);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Default Language
                </button>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const currentLanguage = languages.find(lang => lang.code === currentLang);

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {singleType.displayName}
            </h1>
            {singleType.description && (
              <p className="text-gray-600 mt-2">{singleType.description}</p>
            )}
          </div>

          {/* Language Selector */}
          {languages.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Globe size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {currentLanguage?.flag} {currentLanguage?.name || currentLang.toUpperCase()}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isLangDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
                        Select Language
                      </div>
                      {languages.map((lang) => {
                        const isCurrent = lang.code === currentLang;
                        const hasTranslation = availableTranslations.includes(lang.code);

                        return (
                          <div key={lang.id} className="flex items-center justify-between">
                            <button
                              onClick={() => hasTranslation ? handleLanguageChange(lang.code) : null}
                              disabled={!hasTranslation}
                              className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                                isCurrent
                                  ? 'bg-blue-50 text-blue-700'
                                  : hasTranslation
                                  ? 'text-gray-700 hover:bg-gray-50'
                                  : 'text-gray-400 cursor-not-allowed'
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
                                {!hasTranslation && (
                                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                    Missing
                                  </span>
                                )}
                                {isCurrent && (
                                  <span className="text-blue-600">✓</span>
                                )}
                              </div>
                            </button>
                            {!hasTranslation && (
                              <button
                                onClick={() => handleCreateTranslation(lang.code)}
                                className="ml-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                title={`Create ${lang.name} translation`}
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Language Info Banner */}
        {currentLanguage && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-center space-x-2">
              <Globe size={18} className="text-blue-600" />
              <span className="text-sm text-blue-900">
                Editing <strong>{currentLanguage.name}</strong> version
              </span>
            </div>
            <span className="text-xs text-blue-700">
              Changes will only affect the {currentLanguage.name} content
            </span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {singleType.fields && singleType.fields.fields && singleType.fields.fields.length > 0 ? (
            <DynamicForm
              fields={singleType.fields.fields}
              defaultValues={singleType.data || {}}
              onSubmit={handleSubmit}
              submitLabel="Save"
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No fields defined for this single type.</p>
              <button
                onClick={() => router.push(`/admin/content-type-builder?type=single&edit=${name}`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Fields
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
