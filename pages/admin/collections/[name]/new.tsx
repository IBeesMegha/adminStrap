import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import { DynamicForm } from '@/components/admin/DynamicForm';
import { LanguageSelector } from '@/components/admin/LanguageSelector';
import { AITranslationModal } from '@/components/admin/AITranslationModal';
import { useRouter } from 'next/router';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewCollectionEntry() {
  const router = useRouter();
  const { name, lang: queryLang, translationGroupId: queryTranslationGroupId } = router.query;

  const [collectionType, setCollectionType] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<{ field: string; message: string } | null>(null);
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [translationGroupId, setTranslationGroupId] = useState<string>('');
  const [availableTranslations, setAvailableTranslations] = useState<string[]>([]);
  const [defaultLang, setDefaultLang] = useState<string>('en');
  const [sourceEntryId, setSourceEntryId] = useState<string>('');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [formMethods, setFormMethods] = useState<any>(null);

  const fetchCollectionType = async () => {
    try {
      const response = await fetch(`/api/collection-types/${name}`);
      const data = await response.json();
      setCollectionType(data.data);
    } catch (error) {
      console.error('Error fetching collection type:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (name) {
      fetchCollectionType();
      fetchDefaultLanguage();
    }
    
    // Set language and translation group from query params
    if (queryLang && typeof queryLang === 'string') {
      setCurrentLang(queryLang);
    }
    if (queryTranslationGroupId && typeof queryTranslationGroupId === 'string') {
      setTranslationGroupId(queryTranslationGroupId);
      fetchAvailableTranslations(queryTranslationGroupId);
    }
  }, [name, queryLang, queryTranslationGroupId]);

  const fetchAvailableTranslations = async (groupId: string) => {
    try {
      const res = await fetch(`/api/collections/${name}/translations/${groupId}`);
      const data = await res.json();
      if (res.ok) {
        setAvailableTranslations(data.data.availableLanguages || []);
        
        // Find the source entry (default language entry)
        const defaultLanguage = await getDefaultLang();
        const sourceEntry = data.data.translations.find(
          (t: any) => t.lang === defaultLanguage
        );
        if (sourceEntry) {
          setSourceEntryId(sourceEntry.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch translations:', err);
    }
  };

  useEffect(() => {
    // Set language and translation group from query params
    if (queryLang && typeof queryLang === 'string') {
      setCurrentLang(queryLang);
    } else {
      // If no query lang, use default language
      if (defaultLang) {
        setCurrentLang(defaultLang);
      }
    }
    
    if (queryTranslationGroupId && typeof queryTranslationGroupId === 'string') {
      setTranslationGroupId(queryTranslationGroupId);
      fetchAvailableTranslations(queryTranslationGroupId);
    }
  }, [queryLang, queryTranslationGroupId, defaultLang]);

  const fetchDefaultLanguage = async () => {
    try {
      const res = await fetch('/api/languages');
      const data = await res.json();
      if (res.ok) {
        const defaultLanguage = data.data.find((l: any) => l.isDefault);
        if (defaultLanguage) {
          setDefaultLang(defaultLanguage.code);
        }
      }
    } catch (error) {
      console.error('Failed to fetch default language:', error);
    }
  };

  const getDefaultLang = async (): Promise<string> => {
    try {
      const res = await fetch('/api/languages');
      const data = await res.json();
      if (res.ok) {
        const defaultLanguage = data.data.find((l: any) => l.isDefault);
        return defaultLanguage?.code || 'en';
      }
    } catch (error) {
      console.error('Failed to fetch default language:', error);
    }
    return 'en';
  };

  const handleLanguageChange = async (newLang: string) => {
    if (newLang === currentLang) return;

    // Check if we're creating a translation
    if (translationGroupId && availableTranslations.includes(newLang)) {
      // Navigate to existing translation
      try {
        const res = await fetch(
          `/api/collections/${name}/translations/${translationGroupId}`
        );
        const data = await res.json();
        
        if (res.ok) {
          const translation = data.data.translations.find(
            (t: any) => t.lang === newLang
          );
          
          if (translation) {
            router.push(`/admin/collections/${name}/${translation.id}`);
          }
        }
      } catch (error) {
        console.error('Failed to load translation:', error);
        toast.error('Failed to load translation');
      }
    } else {
      // Just change the language for new entry
      setCurrentLang(newLang);
      toast.success(`Language changed to ${newLang.toUpperCase()}`);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    const toastId = toast.loading('Creating entry...');
    setServerError(null); // Clear previous errors
    
    try {
      // Remove empty strings and convert them to undefined (will be filtered out)
      const cleanedData: Record<string, any> = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        // Only include non-empty values
        if (value !== '' && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      console.log('[Create Form] Original data:', data);
      console.log('[Create Form] Cleaned data:', cleanedData);
      console.log('[Create Form] Language:', currentLang);
      console.log('[Create Form] Translation Group ID:', translationGroupId);
      
      const response = await fetch(`/api/collections/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: cleanedData,
          lang: currentLang,
          translationGroupId: translationGroupId || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Entry created successfully!', { id: toastId });
        router.push(`/admin/collections/${name}`);
      } else {
        const error = await response.json();
        const errorMessage = error.error || 'Failed to create entry';
        
        // Check if error is about a unique field
        const uniqueFieldMatch = errorMessage.match(/This (.+?) already exists/);
        if (uniqueFieldMatch) {
          const fieldDisplayName = uniqueFieldMatch[1];
          // Find the field by display name
          const field = collectionType?.fields?.fields?.find(
            (f: any) => f.displayName === fieldDisplayName
          );
          
          if (field) {
            setServerError({
              field: field.name,
              message: errorMessage
            });
            toast.error('Please fix the errors below', { id: toastId });
            return;
          }
        }
        
        toast.error(errorMessage, { id: toastId });
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.error('Failed to create entry', { id: toastId });
    }
  };

  const handleAITranslation = (translatedData: Record<string, any>) => {
    // Auto-fill the form with translated data
    if (formMethods) {
      Object.keys(translatedData).forEach(fieldName => {
        formMethods.setValue(fieldName, translatedData[fieldName], {
          shouldValidate: false,
          shouldDirty: true,
        });
      });
      toast.success('Translation applied! Review and save when ready.');
    }
  };

  // Check if AI translation button should be shown
  const shouldShowAIButton = () => {
    // Must have translation group (creating a translation)
    if (!translationGroupId) return false;
    
    // Current language must not be the default language
    if (currentLang === defaultLang) return false;
    
    // Source entry must exist
    if (!sourceEntryId) return false;
    
    return true;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8">Loading...</div>
      </Layout>
    );
  }

  if (!collectionType) {
    return (
      <Layout>
        <div className="p-8">Collection type not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <Link
          href={`/admin/collections/${name}`}
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to {collectionType.displayName}</span>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New {collectionType.displayName}
          </h1>
          <div className="flex items-center space-x-4">
            <LanguageSelector
              currentLang={currentLang}
              onLanguageChange={handleLanguageChange}
              translationGroupId={translationGroupId}
              availableTranslations={availableTranslations}
            />
            {shouldShowAIButton() && (
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
              >
                <Sparkles size={18} />
                <span>AI Generate Translation</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <DynamicForm
            fields={collectionType.fields.fields}
            onSubmit={handleSubmit}
            submitLabel="Create Entry"
            collectionName={name as string}
            serverError={serverError}
            onFormMethodsReady={setFormMethods}
          />
        </div>

        {/* AI Translation Modal */}
        <AITranslationModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          collectionName={name as string}
          translationGroupId={translationGroupId}
          sourceEntryId={sourceEntryId}
          sourceLang={defaultLang}
          targetLang={currentLang}
          fields={collectionType.fields.fields}
          onTranslationComplete={handleAITranslation}
        />
      </div>
    </Layout>
  );
}
