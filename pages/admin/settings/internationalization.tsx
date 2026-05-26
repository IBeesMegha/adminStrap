import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/admin/Layout';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string | null;
  flag: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InternationalizationPage() {
  const router = useRouter();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/languages');
      const data = await res.json();

      if (res.ok) {
        setLanguages(data.data);
      } else {
        setError(data.error || 'Failed to fetch languages');
      }
    } catch (err) {
      setError('Failed to fetch languages');
    } finally {
      setLoading(false);
    }
  };

  const seedLanguages = async () => {
    try {
      setError('');
      setSuccess('');
      const res = await fetch('/api/languages/seed', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Languages seeded successfully');
        fetchLanguages();
      } else {
        setError(data.error || 'Failed to seed languages');
      }
    } catch (err) {
      setError('Failed to seed languages');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/languages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Language status updated');
        fetchLanguages();
      } else {
        setError(data.error || 'Failed to update language');
      }
    } catch (err) {
      setError('Failed to update language');
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/languages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Default language updated');
        fetchLanguages();
      } else {
        setError(data.error || 'Failed to set default language');
      }
    } catch (err) {
      setError('Failed to set default language');
    }
  };

  const deleteLanguage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this language?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const res = await fetch(`/api/languages/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Language deleted successfully');
        fetchLanguages();
      } else {
        setError(data.error || 'Failed to delete language');
      }
    } catch (err) {
      setError('Failed to delete language');
    }
  };

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lang.nativeName && lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Internationalization</h1>
            <p className="text-gray-600 mt-2">
              Manage languages for multilingual content
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
              {success}
            </div>
          )}

          <div className="mb-6 flex justify-between items-center">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {languages.length === 0 && !loading && (
              <button
                onClick={seedLanguages}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Seed Default Languages
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading languages...</p>
            </div>
          ) : filteredLanguages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {searchQuery ? 'No languages found matching your search' : 'No languages configured'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Native Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Default
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLanguages.map((language) => (
                    <tr key={language.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-2xl">
                        {language.flag || '🏳️'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-gray-900">
                          {language.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{language.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {language.nativeName || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(language.id, language.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            language.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {language.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {language.isDefault ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => setAsDefault(language.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Set as default
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => deleteLanguage(language.id)}
                          disabled={language.isDefault}
                          className={`text-red-600 hover:text-red-800 ${
                            language.isDefault ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
