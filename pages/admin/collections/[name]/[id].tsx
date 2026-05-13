import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import { DynamicForm } from '@/components/admin/DynamicForm';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditCollectionEntry() {
  const router = useRouter();
  const { name, id } = router.query;

  const [collectionType, setCollectionType] = useState<any>(null);
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (name && id) {
      fetchData();
    }
  }, [name, id]);

  const fetchData = async () => {
    try {
      const [typeRes, entryRes] = await Promise.all([
        fetch(`/api/collection-types/${name}`),
        fetch(`/api/collections/${name}/${id}`),
      ]);

      const typeData = await typeRes.json();
      const entryData = await entryRes.json();

      setCollectionType(typeData.data);
      
      // Format dates for HTML date inputs (YYYY-MM-DD)
      // Also handle JSON fields for media
      const formattedEntry = { ...entryData.data };
      const fields = (typeData.data.fields as any)?.fields || [];
      
      Object.keys(formattedEntry).forEach(key => {
        const value = formattedEntry[key];
        const field = fields.find((f: any) => f.name === key);
        
        // Handle media fields - ensure they're in the correct format
        if (field && field.type === 'media') {
          if (field.multiple) {
            // Multiple media - should be JSON string of array
            if (Array.isArray(value)) {
              formattedEntry[key] = JSON.stringify(value);
            } else if (typeof value === 'object' && value !== null) {
              formattedEntry[key] = JSON.stringify(value);
            } else if (typeof value === 'string') {
              // Already a string, keep as is
              formattedEntry[key] = value;
            }
          } else {
            // Single media - should be a URL string
            if (typeof value === 'string') {
              formattedEntry[key] = value;
            }
          }
        }
        // Handle date fields
        else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
          const date = new Date(value);
          // Check if it's a valid date and format it
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD for date inputs
            formattedEntry[key] = date.toISOString().split('T')[0];
          }
        }
      });
      
      console.log('[Edit Page] Formatted entry for form:', formattedEntry);
      setEntry(formattedEntry);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      console.log('[Edit Form] Original data:', data);
      
      const cleanedData: Record<string, any> = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        // Only include non-empty values
        // For arrays and objects (like JSON fields), check if they have content
        if (value !== '' && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      console.log('[Edit Form] Cleaned data:', cleanedData);
      
      const response = await fetch(`/api/collections/${name}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: cleanedData }),
      });

      if (response.ok) {
        alert('Entry updated successfully!');
        router.push(`/admin/collections/${name}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry');
    }
  };

  const handlePublish = async () => {
    try {
      // Extract only the field data (exclude metadata)
      const fieldNames = collectionType.fields.fields.map((f: any) => f.name);
      const fieldData: Record<string, any> = {};
      fieldNames.forEach((fieldName: string) => {
        if (entry[fieldName] !== undefined) {
          fieldData[fieldName] = entry[fieldName];
        }
      });

      const response = await fetch(`/api/collections/${name}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: fieldData, published: !entry.published }),
      });

      if (response.ok) {
        setEntry({ ...entry, published: !entry.published });
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8">Loading...</div>
      </Layout>
    );
  }

  if (!collectionType || !entry) {
    return (
      <Layout>
        <div className="p-8">Entry not found</div>
      </Layout>
    );
  }

  console.log("fieldsfields", collectionType.fields.fields);

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
            Edit {collectionType.displayName}
          </h1>
          <button
            onClick={handlePublish}
            className={`px-4 py-2 rounded-lg ${
              entry.published
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {entry.published ? 'Unpublish' : 'Publish'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <DynamicForm
            fields={collectionType.fields.fields}
            defaultValues={entry}
            onSubmit={handleSubmit}
            submitLabel="Update Entry"
          />
        </div>
      </div>
    </Layout>
  );
}
