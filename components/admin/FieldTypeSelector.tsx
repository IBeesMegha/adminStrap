import React from 'react';
import { X, Type, AlignLeft, FileText, Hash, ToggleLeft, Calendar, Mail, Code, Link, Image, List, Component as ComponentIcon, Layers } from 'lucide-react';

interface FieldTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFieldType: (fieldType: string) => void;
  collectionName: string;
}

const fieldTypes = [
  {
    category: 'DEFAULT',
    fields: [
      { type: 'text', icon: Type, label: 'Text', description: 'Small or long text like title or description' },
      { type: 'richtext', icon: FileText, label: 'Rich text (Blocks)', description: 'The new JSON-based rich text editor' },
      { type: 'number', icon: Hash, label: 'Number', description: 'Numbers (integer, float, decimal)' },
      { type: 'date', icon: Calendar, label: 'Date', description: 'A date picker with hours, minutes and seconds' },
      { type: 'boolean', icon: ToggleLeft, label: 'Boolean', description: 'Yes or no, 1 or 0, true or false' },
      { type: 'email', icon: Mail, label: 'Email', description: 'Email field with validations format' },
      { type: 'password', icon: Code, label: 'Password', description: 'Password field with encryption' },
      { type: 'media', icon: Image, label: 'Media', description: 'Files like images, videos, etc' },
      { type: 'relation', icon: Link, label: 'Relation', description: 'Refers to a Collection Type' },
      { type: 'enumeration', icon: List, label: 'Enumeration', description: 'List of values, then pick one' },
      { type: 'json', icon: Code, label: 'JSON', description: 'Data in JSON format' },
      { type: 'uid', icon: Hash, label: 'UID', description: 'Unique identifier' },
    ]
  },
  {
    category: 'CUSTOM',
    fields: [
      { type: 'richtext-markdown', icon: FileText, label: 'Rich text (Markdown)', description: 'The classic rich text editor' },
      { type: 'component', icon: ComponentIcon, label: 'Component', description: 'Group of fields that you can repeat or reuse' },
      { type: 'dynamic-zone', icon: Layers, label: 'Dynamic zone', description: 'Dynamically pick components when editing content' },
    ]
  }
];

export const FieldTypeSelector: React.FC<FieldTypeSelectorProps> = ({
  isOpen,
  onClose,
  onSelectFieldType,
  collectionName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
              CT
            </div>
            <h2 className="text-xl font-semibold">{collectionName}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex px-6">
            <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              DEFAULT
            </button>
            <button className="px-4 py-3 text-sm font-medium text-gray-500">
              CUSTOM
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <h3 className="text-lg font-medium mb-4">Select a field for your collection type</h3>

          {fieldTypes.map((category) => (
            <div key={category.category} className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                {category.fields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <button
                      key={field.type}
                      onClick={() => onSelectFieldType(field.type)}
                      className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <Icon size={20} className="text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">{field.label}</h4>
                        <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
