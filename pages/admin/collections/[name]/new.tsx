import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import { DynamicForm } from '@/components/admin/DynamicForm';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCollectionEntry() {
  const router = useRouter();
  const { name } = router.query;

  const [collectionType, setCollectionType] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    }
  }, [name]);

  const handleSubmit = async (data: Record<string, any>) => {
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
      
      const response = await fetch(`/api/collections/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: cleanedData }),
      });

      if (response.ok) {
        router.push(`/admin/collections/${name}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Failed to create entry');
    }
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

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Create New {collectionType.displayName}
        </h1>

        <div className="bg-white rounded-lg shadow p-6">
          <DynamicForm
            fields={collectionType.fields.fields}
            onSubmit={handleSubmit}
            submitLabel="Create Entry"
          />
        </div>
      </div>
    </Layout>
  );
}
