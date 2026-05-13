import React, { useState, useEffect } from 'react';
import { Field } from '@/lib/types';
import { MediaAsset } from '@/lib/media';
import { MediaLibraryModal } from './MediaLibraryModal';
import { ManageMediaModal } from './ManageMediaModal';
import { ComponentFieldRenderer } from './ComponentFieldRenderer';
import { DynamicZoneFieldRenderer } from './DynamicZoneFieldRenderer';
import { MediaFieldController } from './MediaFieldController';
import { Image as ImageIcon, Plus, X, Link as LinkIcon, Edit, Trash2, Settings } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Controller } from 'react-hook-form';

const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">Loading editor...</div>
});
import 'react-quill/dist/quill.snow.css';

interface FormFieldProps {
  field: Field;
  register: any;
  error?: any;
  setValue: any;
  watch: any;
  control: any;
}

export const FormField: React.FC<FormFieldProps> = ({
  field,
  register,
  error,
  setValue,
  watch,
  control,
}) => {
  const value = watch(field.name);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | MediaAsset[] | null>(null);
  const [relationOptions, setRelationOptions] = useState<any[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);

  // Initialize selectedMedia from existing form value
  useEffect(() => {
    if (field.type === 'media' && value && !selectedMedia) {
      if (field.multiple) {
        // Multiple media - parse JSON array of URLs
        try {
          const urls = typeof value === 'string' ? JSON.parse(value) : value;
          if (Array.isArray(urls)) {
            // Create mock MediaAsset objects from URLs
            const mockAssets: MediaAsset[] = urls.map((url, index) => ({
              id: `temp-${index}`,
              name: url.split('/').pop() || 'image',
              url,
              mime: 'image/jpeg',
              size: 0,
              ext: url.split('.').pop() || 'jpg',
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
            setSelectedMedia(mockAssets);
          }
        } catch (e) {
          console.error('Failed to parse media URLs:', e);
        }
      } else {
        // Single media - create mock MediaAsset from URL
        if (typeof value === 'string' && value.trim()) {
          const mockAsset: MediaAsset = {
            id: 'temp-single',
            name: value.split('/').pop() || 'image',
            url: value,
            mime: 'image/jpeg',
            size: 0,
            ext: value.split('.').pop() || 'jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setSelectedMedia(mockAsset);
        }
      }
    }
  }, [value, field.type, field.multiple, selectedMedia]);

  // Fetch relation options for relation fields
  useEffect(() => {
    if (field.type === 'relation' && field.relation) {
      fetchRelationOptions();
    }
  }, [field.type, field.relation]);

  const fetchRelationOptions = async () => {
    if (!field.relation) return;
    
    setLoadingRelations(true);
    console.log(`[FormField] Fetching relation options from: /api/collections/${field.relation.targetCollection}`);
    try {
      const response = await fetch(`/api/collections/${field.relation.targetCollection}`);
      const result = await response.json();
      console.log(`[FormField] Relation options response:`, result);
      if (result.data) {
        setRelationOptions(result.data);
        console.log(`[FormField] Loaded ${result.data.length} options for ${field.name}`);
      }
    } catch (error) {
      console.error('Error fetching relation options:', error);
    } finally {
      setLoadingRelations(false);
    }
  };

  const handleMediaSelect = (media: MediaAsset | MediaAsset[]) => {
    setSelectedMedia(media);
    if (Array.isArray(media)) {
      // Multiple media - store as JSON array of URLs
      setValue(field.name, JSON.stringify(media.map(m => m.url)));
    } else {
      // Single media - store URL as string
      setValue(field.name, media.url);
    }
  };

  const handleManageMediaSave = (media: MediaAsset[]) => {
    setSelectedMedia(media);
    setValue(field.name, JSON.stringify(media.map(m => m.url)));
  };

  const removeMedia = (index?: number) => {
    if (field.multiple && Array.isArray(selectedMedia) && index !== undefined) {
      const updated = selectedMedia.filter((_, i) => i !== index);
      setSelectedMedia(updated);
      setValue(field.name, JSON.stringify(updated.map(m => m.url)));
    } else {
      setSelectedMedia(null);
      setValue(field.name, '');
    }
  };

  console.log("relationOptions11",relationOptions)

  const renderField = () => {
    switch (field.type) {
      case 'string':
      case 'email':
        return (
          <input
            type={field.type === 'email' ? 'email' : 'text'}
            {...register(field.name)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
          />
        );

      case 'text':
        return (
          <textarea
            {...register(field.name)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
          />
        );

      case 'richtext':
        return (
          <div className="border border-gray-300 rounded-lg">
            {typeof window !== 'undefined' && (
              <ReactQuill
                theme="snow"
                value={value || ''}
                onChange={(content) => setValue(field.name, content)}
                className="bg-white"
              />
            )}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            {...register(field.name, { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...register(field.name)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {field.displayName}
            </span>
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            {...register(field.name)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'json':
        return (
          <textarea
            {...register(field.name)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder='{"key": "value"}'
          />
        );

      case 'media':
        // Handle both single and multiple media using Controller
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <MediaFieldController
                fieldName={field.name}
                multiple={field.multiple}
                value={controllerField.value || (field.multiple ? '[]' : '')}
                onChange={controllerField.onChange}
              />
            )}
          />
        );

      case 'component':
        return (
          <ComponentFieldRenderer
            field={field}
            value={value}
            onChange={(newValue) => setValue(field.name, newValue)}
            error={error}
          />
        );

      case 'dynamiczone':
        return (
          <DynamicZoneFieldRenderer
            field={field}
            value={value}
            onChange={(newValue) => setValue(field.name, newValue)}
            error={error}
          />
        );

      case 'relation':
        if (!field.relation) return null;
        
        const isMultiple = field.relation.type === 'oneToMany' || field.relation.type === 'manyToMany';
        
        // For manyToOne and oneToOne relations, we need to save to the FK column
        // Convert field name to camelCase and append 'Id'
        const sanitizeFieldName = (name: string): string => {
          // Convert kebab-case or snake_case to camelCase
          return name
            .replace(/[-_]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
            .replace(/^(.)/, (char) => char.toLowerCase());
        };
        
        const fieldNameToRegister = (field.relation.type === 'manyToOne' || field.relation.type === 'oneToOne') 
          ? `${sanitizeFieldName(field.name)}Id`  // Use FK column name (e.g., prodCategoryId)
          : field.name;                            // Use virtual field name (will be filtered out by backend)
        
        console.log(`[FormField] Relation field config:`, {
          originalName: field.name,
          sanitizedName: sanitizeFieldName(field.name),
          registeringAs: fieldNameToRegister,
          relationType: field.relation.type,
          currentValue: value,
          optionsCount: relationOptions.length
        });
        
        // Use setValue to manually set the value when dropdown changes
        const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const selectedValue = e.target.value;
          console.log(`[FormField] Dropdown changed:`, {
            field: fieldNameToRegister,
            value: selectedValue
          });
          setValue(fieldNameToRegister, selectedValue);
        };
        
        return (
          <div className="space-y-2">
            {loadingRelations ? (
              <div className="text-sm text-gray-500">Loading {field.relation.targetCollectionDisplay}...</div>
            ) : (
              <>
                {isMultiple ? (
                  <select
                    {...register(fieldNameToRegister)}
                    multiple
                    size={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {relationOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name || option.title || option.displayName || option.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    {...register(fieldNameToRegister)}
                    onChange={handleSelectChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select {field.relation.targetCollectionDisplay}</option>
                    {relationOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name || option.title || option.displayName || option.id}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500">
                  {isMultiple 
                    ? `Hold Ctrl/Cmd to select multiple ${field.relation.targetCollectionDisplay}` 
                    : `Select a ${field.relation.targetCollectionDisplay} to relate to`}
                </p>
              </>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            {...register(field.name)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== 'boolean' && field.type !== 'component' && field.type !== 'dynamiczone' && (
        <label className="block text-sm font-medium text-gray-700">
          {field.displayName}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderField()}
      {error && field.type !== 'component' && field.type !== 'dynamiczone' && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};
