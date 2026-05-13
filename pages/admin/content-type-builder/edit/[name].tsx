import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import { useRouter } from 'next/router';
import { Plus, Trash2, Edit, ArrowLeft, Save } from 'lucide-react';
import { Field } from '@/lib/types';
import { FieldTypeSelector } from '@/components/admin/FieldTypeSelector';
import { AddFieldModal } from '@/components/admin/AddFieldModal';
import { AddRelationModal } from '@/components/admin/AddRelationModal';
import { MigrationModal } from '@/components/admin/MigrationModal';
import Link from 'next/link';

export default function EditCollectionType() {
  const router = useRouter();
  const { name } = router.query;

  const [collectionType, setCollectionType] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState('');

  const [migrationStatus, setMigrationStatus] = useState<{
    isOpen: boolean;
    status: 'migrating' | 'success' | 'error';
    message?: string;
    error?: string;
  }>({
    isOpen: false,
    status: 'migrating',
  });

  useEffect(() => {
    if (name) {
      fetchCollectionType();
    }
  }, [name]);

  const fetchCollectionType = async () => {
    try {
      const response = await fetch(`/api/collection-types/${name}`);
      const data = await response.json();
      
      if (data.data) {
        setCollectionType(data.data);
        setFields(data.data.fields?.fields || []);
      }
    } catch (error) {
      console.error('Error fetching collection type:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFieldType = (fieldType: string) => {
    setSelectedFieldType(fieldType);
    setShowFieldSelector(false);
    
    // Show relation modal for relation type, otherwise show regular field modal
    if (fieldType === 'relation') {
      setShowRelationModal(true);
    } else {
      setShowAddFieldModal(true);
    }
  };

  const handleAddField = (field: Field) => {
    setFields([...fields, field]);
    setShowAddFieldModal(false);
    setShowRelationModal(false);
  };

  const handleRemoveField = (index: number) => {
    if (confirm('Are you sure you want to remove this field? This will update the database schema.')) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    setIsSaving(true);
    setMigrationStatus({
      isOpen: true,
      status: 'migrating',
      message: 'Updating database schema...',
    });

    try {
      const response = await fetch(`/api/collection-types/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: collectionType.displayName,
          description: collectionType.description,
          fields: { fields },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMigrationStatus({
          isOpen: true,
          status: 'success',
          message: result.message || 'Schema updated successfully!',
        });

        // If requiresRestart is true, keep modal open for user to read instructions
        // Otherwise, auto-redirect after 3 seconds
        if (!result.requiresRestart) {
          setTimeout(() => {
            router.push('/admin/content-type-builder/collection-types');
          }, 3000);
        }
      } else {
        setMigrationStatus({
          isOpen: true,
          status: 'error',
          message: 'Failed to update schema',
          error: result.error || 'Unknown error occurred',
        });
      }
    } catch (error: any) {
      setMigrationStatus({
        isOpen: true,
        status: 'error',
        message: 'Failed to update schema',
        error: error.message || 'Network error occurred',
      });
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
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/content-type-builder/collection-types"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Collection Types</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {collectionType.displayName}
              </h1>
              <p className="text-gray-600 mt-1">
                Edit schema for {collectionType.name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFieldSelector(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                <span>Add Field</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Fields List */}
        <div className="bg-white rounded-lg shadow">
          {fields.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">No fields yet</p>
              <button
                onClick={() => setShowFieldSelector(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                <span>Add First Field</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${
                      field.type === 'relation' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {field.type === 'relation' ? (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      ) : (
                        <span className="text-green-600 font-bold text-sm">
                          {field.type.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {field.displayName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {field.name} • {field.type}
                        {field.type === 'relation' && field.relation && (
                          <> • {field.relation.type} with {field.relation.targetCollectionDisplay}</>
                        )}
                        {field.required && ' • Required'}
                        {field.unique && ' • Unique'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRemoveField(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FieldTypeSelector
        isOpen={showFieldSelector}
        onClose={() => setShowFieldSelector(false)}
        onSelectFieldType={handleSelectFieldType}
        collectionName={collectionType.displayName}
      />

      <AddFieldModal
        isOpen={showAddFieldModal}
        onClose={() => setShowAddFieldModal(false)}
        onSubmit={handleAddField}
        fieldType={selectedFieldType}
        collectionName={collectionType.displayName}
        existingFieldNames={fields.map(f => f.name.toLowerCase())}
      />

      <AddRelationModal
        isOpen={showRelationModal}
        onClose={() => setShowRelationModal(false)}
        onSubmit={handleAddField}
        currentCollectionName={collectionType.name}
        currentCollectionDisplayName={collectionType.displayName}
        existingFieldNames={fields.map(f => f.name.toLowerCase())}
      />

      <MigrationModal
        isOpen={migrationStatus.isOpen}
        status={migrationStatus.status}
        message={migrationStatus.message}
        error={migrationStatus.error}
        onClose={() => {
          setMigrationStatus({ ...migrationStatus, isOpen: false });
          // Redirect to collection types list after closing
          if (migrationStatus.status === 'success') {
            router.push('/admin/content-type-builder/collection-types');
          }
        }}
      />
    </Layout>
  );
}
