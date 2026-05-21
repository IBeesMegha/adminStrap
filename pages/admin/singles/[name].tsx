import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import { DynamicForm } from '@/components/admin/DynamicForm';
import { useRouter } from 'next/router';

export default function SingleTypeEdit() {
  const router = useRouter();
  const { name } = router.query;

  const [singleType, setSingleType] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (name) {
      fetchSingleType();
    }
  }, [name]);

  const fetchSingleType = async () => {
    try {
      console.log('[SingleTypeEdit] Fetching single type:', name);
      // Request fields explicitly for admin UI
      const response = await fetch(`/api/single-types/${name}?includeFields=true`);
      console.log('[SingleTypeEdit] Response status:', response.status);
      const data = await response.json();
      console.log('[SingleTypeEdit] Response data:', data);
      
      if (response.ok && data.data) {
        setSingleType(data.data);
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

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const response = await fetch(`/api/single-types/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        alert('Single type updated successfully!');
        fetchSingleType();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating single type:', error);
      alert('Failed to update single type');
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
              The single type "{name}" could not be found. Please check:
            </p>
            <ul className="list-disc list-inside text-red-700 space-y-1 mb-4">
              <li>The single type exists in the database</li>
              <li>The name is spelled correctly</li>
              <li>The API is running properly</li>
            </ul>
            <button
              onClick={() => router.push('/admin/content-type-builder/single-types')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Single Types
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {singleType.displayName}
        </h1>
        {singleType.description && (
          <p className="text-gray-600 mb-8">{singleType.description}</p>
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
