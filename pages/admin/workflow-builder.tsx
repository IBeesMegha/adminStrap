import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/admin/Layout';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Zap,
  Variable,
  GitBranch,
  Save,
  Eye,
  Trash2,
  Edit,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';

type SectionKey = 'welcome-message' | 'quick-questions' | 'variables' | 'conditions';

interface QuickQuestion {
  id: string;
  text: string;
  enabled: boolean;
  order: number;
}

interface Variable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'boolean';
  required: boolean;
  defaultValue?: string;
}

interface Condition {
  id: string;
  name: string;
  variableId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string;
  action: string;
  enabled: boolean;
}

interface WelcomeMessageSettings {
  enabled: boolean;
  message: string;
}

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>('welcome-message');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Welcome Message State
  const [welcomeMessage, setWelcomeMessage] = useState<WelcomeMessageSettings>({
    enabled: true,
    message: 'Hello! How can I help you today?',
  });
  const [previewMessage, setPreviewMessage] = useState('');

  // Quick Questions State
  const [quickQuestions, setQuickQuestions] = useState<QuickQuestion[]>([
    { id: '1', text: 'Track My Order', enabled: true, order: 1 },
    { id: '2', text: 'Return Product', enabled: true, order: 2 },
    { id: '3', text: 'Contact Support', enabled: true, order: 3 },
    { id: '4', text: 'Talk to AI', enabled: true, order: 4 },
  ]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draggedQuestion, setDraggedQuestion] = useState<QuickQuestion | null>(null);

  // Variables State
  const [variables, setVariables] = useState<Variable[]>([
    { id: '1', name: 'name', type: 'text', required: true },
    { id: '2', name: 'email', type: 'email', required: true },
    { id: '3', name: 'phone_number', type: 'phone', required: false },
    { id: '4', name: 'order_number', type: 'text', required: false },
  ]);
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVariable, setNewVariable] = useState<Partial<Variable>>({
    name: '',
    type: 'text',
    required: false,
  });

  // Conditions State
  const [conditions, setConditions] = useState<Condition[]>([
    {
      id: '1',
      name: 'Check Order Number',
      variableId: '4',
      operator: 'is_empty',
      value: '',
      action: 'Ask for Order Number',
      enabled: true,
    },
  ]);
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [newCondition, setNewCondition] = useState<Partial<Condition>>({
    name: '',
    variableId: '',
    operator: 'equals',
    value: '',
    action: '',
    enabled: true,
  });

  useEffect(() => {
    if (!authLoading && !hasPermission('settings.manage')) {
      router.push('/admin/403');
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    fetchWorkflowData();
  }, []);

  const fetchWorkflowData = async () => {
    setLoading(true);
    try {
      // Fetch all workflow settings
      const [welcomeRes, questionsRes, variablesRes, conditionsRes] = await Promise.all([
        fetch('/api/workflow-builder/welcome-message'),
        fetch('/api/workflow-builder/quick-questions'),
        fetch('/api/workflow-builder/variables'),
        fetch('/api/workflow-builder/conditions'),
      ]);

      const [welcomeData, questionsData, variablesData, conditionsData] = await Promise.all([
        welcomeRes.json(),
        questionsRes.json(),
        variablesRes.json(),
        conditionsRes.json(),
      ]);

      if (welcomeData.success) {
        setWelcomeMessage(welcomeData.data);
      }
      if (questionsData.success) {
        setQuickQuestions(questionsData.data);
      }
      if (variablesData.success) {
        setVariables(variablesData.data);
      }
      if (conditionsData.success) {
        setConditions(conditionsData.data);
      }
    } catch (error) {
      console.error('Error fetching workflow data:', error);
      toast.error('Failed to load workflow settings');
    } finally {
      setLoading(false);
    }
  };

  // Welcome Message Functions
  const handleSaveWelcomeMessage = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/workflow-builder/welcome-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(welcomeMessage),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Welcome message saved');
      } else {
        toast.error(result.error || 'Failed to save welcome message');
      }
    } catch (error) {
      console.error('Error saving welcome message:', error);
      toast.error('Failed to save welcome message');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewMessage = () => {
    setPreviewMessage(welcomeMessage.message);
    setTimeout(() => setPreviewMessage(''), 3000);
  };

  // Quick Questions Functions
  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) {
      toast.error('Question text cannot be empty');
      return;
    }
    const newQuestion: QuickQuestion = {
      id: Date.now().toString(),
      text: newQuestionText,
      enabled: true,
      order: quickQuestions.length + 1,
    };
    setQuickQuestions([...quickQuestions, newQuestion]);
    setNewQuestionText('');
    setIsAddingQuestion(false);
    toast.success('Question added');
  };

  const handleEditQuestion = (id: string, newText: string) => {
    setQuickQuestions(
      quickQuestions.map((q) => (q.id === id ? { ...q, text: newText } : q))
    );
    setEditingQuestionId(null);
    toast.success('Question updated');
  };

  const handleDeleteQuestion = (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    setQuickQuestions(quickQuestions.filter((q) => q.id !== id));
    toast.success('Question deleted');
  };

  const handleToggleQuestion = (id: string) => {
    setQuickQuestions(
      quickQuestions.map((q) => (q.id === id ? { ...q, enabled: !q.enabled } : q))
    );
  };

  const handleDragStart = (question: QuickQuestion) => {
    setDraggedQuestion(question);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetQuestion: QuickQuestion) => {
    if (!draggedQuestion || draggedQuestion.id === targetQuestion.id) return;

    const newQuestions = [...quickQuestions];
    const draggedIndex = newQuestions.findIndex((q) => q.id === draggedQuestion.id);
    const targetIndex = newQuestions.findIndex((q) => q.id === targetQuestion.id);

    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(targetIndex, 0, draggedQuestion);

    setQuickQuestions(
      newQuestions.map((q, idx) => ({ ...q, order: idx + 1 }))
    );
    setDraggedQuestion(null);
  };

  const handleSaveQuickQuestions = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/workflow-builder/quick-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickQuestions),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Quick questions saved');
      } else {
        toast.error(result.error || 'Failed to save quick questions');
      }
    } catch (error) {
      console.error('Error saving quick questions:', error);
      toast.error('Failed to save quick questions');
    } finally {
      setSaving(false);
    }
  };

  // Variables Functions
  const handleAddVariable = () => {
    if (!newVariable.name?.trim()) {
      toast.error('Variable name cannot be empty');
      return;
    }
    const variable: Variable = {
      id: Date.now().toString(),
      name: newVariable.name,
      type: newVariable.type || 'text',
      required: newVariable.required || false,
      defaultValue: newVariable.defaultValue,
    };
    setVariables([...variables, variable]);
    setNewVariable({ name: '', type: 'text', required: false });
    setIsAddingVariable(false);
    toast.success('Variable added');
  };

  const handleDeleteVariable = (id: string) => {
    if (!confirm('Are you sure you want to delete this variable?')) return;
    setVariables(variables.filter((v) => v.id !== id));
    toast.success('Variable deleted');
  };

  const handleSaveVariables = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/workflow-builder/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Variables saved');
      } else {
        toast.error(result.error || 'Failed to save variables');
      }
    } catch (error) {
      console.error('Error saving variables:', error);
      toast.error('Failed to save variables');
    } finally {
      setSaving(false);
    }
  };

  // Conditions Functions
  const handleAddCondition = () => {
    if (!newCondition.name?.trim() || !newCondition.variableId || !newCondition.action?.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    const condition: Condition = {
      id: Date.now().toString(),
      name: newCondition.name,
      variableId: newCondition.variableId,
      operator: newCondition.operator || 'equals',
      value: newCondition.value || '',
      action: newCondition.action,
      enabled: newCondition.enabled !== false,
    };
    setConditions([...conditions, condition]);
    setNewCondition({ name: '', variableId: '', operator: 'equals', value: '', action: '', enabled: true });
    setIsAddingCondition(false);
    toast.success('Condition added');
  };

  const handleDeleteCondition = (id: string) => {
    if (!confirm('Are you sure you want to delete this condition?')) return;
    setConditions(conditions.filter((c) => c.id !== id));
    toast.success('Condition deleted');
  };

  const handleToggleCondition = (id: string) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleSaveConditions = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/workflow-builder/conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conditions),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Conditions saved');
      } else {
        toast.error(result.error || 'Failed to save conditions');
      }
    } catch (error) {
      console.error('Error saving conditions:', error);
      toast.error('Failed to save conditions');
    } finally {
      setSaving(false);
    }
  };

  const navigationSections = [
    {
      title: 'Workflow Builder',
      items: [
        { key: 'welcome-message', label: 'Welcome Message', icon: <MessageSquare size={18} /> },
        { key: 'quick-questions', label: 'Quick Questions', icon: <Zap size={18} /> },
        { key: 'variables', label: 'Variables', icon: <Variable size={18} /> },
        { key: 'conditions', label: 'Conditions', icon: <GitBranch size={18} /> },
      ],
    },
  ];

  if (authLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-lg font-bold text-gray-900">Workflow Builder</h1>
              <p className="text-xs text-gray-500 mt-1">Configure chatbot workflows</p>
            </div>

            <nav className="p-2 space-y-6">
              {navigationSections.map((section) => (
                <div key={section.title}>
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setActiveSection(item.key as SectionKey)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition ${
                          activeSection === item.key
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
              
              {/* Welcome Message Section */}
              {activeSection === 'welcome-message' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Message</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Configure the greeting message shown when users first open the chatbot
                  </p>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Enable Welcome Screen</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Show a welcome message when users open the chatbot
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setWelcomeMessage({ ...welcomeMessage, enabled: !welcomeMessage.enabled })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          welcomeMessage.enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            welcomeMessage.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Message Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Welcome Message
                      </label>
                      <textarea
                        value={welcomeMessage.message}
                        onChange={(e) =>
                          setWelcomeMessage({ ...welcomeMessage, message: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Enter your welcome message..."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This message will be displayed when users first interact with the chatbot
                      </p>
                    </div>

                    {/* Preview Button */}
                    <div className="flex gap-3">
                      <button
                        onClick={handlePreviewMessage}
                        className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Eye size={18} />
                        <span>Preview Message</span>
                      </button>
                      <button
                        onClick={handleSaveWelcomeMessage}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save size={18} />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>

                    {/* Preview Alert */}
                    {previewMessage && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                          <div>
                            <p className="font-medium text-blue-900">Preview</p>
                            <p className="text-blue-800 mt-1 whitespace-pre-wrap">{previewMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Questions Section */}
              {activeSection === 'quick-questions' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick Questions</h2>
                      <p className="text-gray-500 text-sm">
                        Add predefined questions as clickable buttons for quick user access
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddingQuestion(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={20} />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {/* Add Question Form */}
                  {isAddingQuestion && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Question</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Text
                          </label>
                          <input
                            type="text"
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Track My Order"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleAddQuestion}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add Question
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingQuestion(false);
                              setNewQuestionText('');
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions List */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600">
                        <AlertCircle size={16} className="inline mr-1" />
                        Drag and drop questions to reorder them
                      </p>
                    </div>
                    {quickQuestions.length === 0 ? (
                      <div className="p-12 text-center">
                        <Zap className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quick Questions Yet</h3>
                        <p className="text-gray-600 mb-6">Add your first quick question to get started</p>
                        <button
                          onClick={() => setIsAddingQuestion(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus size={20} />
                          Add Question
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {quickQuestions.map((question) => (
                          <div
                            key={question.id}
                            draggable
                            onDragStart={() => handleDragStart(question)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(question)}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-move"
                          >
                            <GripVertical className="text-gray-400 flex-shrink-0" size={20} />
                            <div className="flex-1">
                              {editingQuestionId === question.id ? (
                                <input
                                  type="text"
                                  defaultValue={question.text}
                                  onBlur={(e) => handleEditQuestion(question.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditQuestion(question.id, e.currentTarget.value);
                                    }
                                  }}
                                  autoFocus
                                  className="w-full px-3 py-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <p className="text-gray-900 font-medium">{question.text}</p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                setEditingQuestionId(
                                  editingQuestionId === question.id ? null : question.id
                                )
                              }
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleQuestion(question.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                question.enabled
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                            >
                              {question.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveQuickQuestions}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} />
                      <span>{saving ? 'Saving...' : 'Save Quick Questions'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Variables Section */}
              {activeSection === 'variables' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Variables</h2>
                      <p className="text-gray-500 text-sm">
                        Create custom variables to collect and store user information
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddingVariable(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={20} />
                      <span>Add Variable</span>
                    </button>
                  </div>

                  {/* Add Variable Form */}
                  {isAddingVariable && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Variable</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Variable Name
                          </label>
                          <input
                            type="text"
                            value={newVariable.name || ''}
                            onChange={(e) =>
                              setNewVariable({ ...newVariable, name: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., email, phone_number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Variable Type
                          </label>
                          <select
                            value={newVariable.type || 'text'}
                            onChange={(e) =>
                              setNewVariable({
                                ...newVariable,
                                type: e.target.value as Variable['type'],
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="boolean">Boolean</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newVariable.required || false}
                              onChange={(e) =>
                                setNewVariable({ ...newVariable, required: e.target.checked })
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Mark as required
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAddVariable}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add Variable
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingVariable(false);
                            setNewVariable({ name: '', type: 'text', required: false });
                          }}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Variables Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {variables.length === 0 ? (
                      <div className="p-12 text-center">
                        <Variable className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Variables Yet</h3>
                        <p className="text-gray-600 mb-6">
                          Create custom variables to collect user information
                        </p>
                        <button
                          onClick={() => setIsAddingVariable(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus size={20} />
                          Add Variable
                        </button>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Variable Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Required
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {variables.map((variable) => (
                            <tr key={variable.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                  {variable.name}
                                </code>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                  {variable.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {variable.required ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <Check size={12} />
                                    Required
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Optional
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => handleDeleteVariable(variable.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveVariables}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} />
                      <span>{saving ? 'Saving...' : 'Save Variables'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Conditions Section */}
              {activeSection === 'conditions' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Conditions</h2>
                      <p className="text-gray-500 text-sm">
                        Create If/Else rules to control chatbot behavior based on variables
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddingCondition(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={20} />
                      <span>Add Condition</span>
                    </button>
                  </div>

                  {/* Add Condition Form */}
                  {isAddingCondition && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Condition</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Condition Name
                          </label>
                          <input
                            type="text"
                            value={newCondition.name || ''}
                            onChange={(e) =>
                              setNewCondition({ ...newCondition, name: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Check Order Number"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Variable
                            </label>
                            <select
                              value={newCondition.variableId || ''}
                              onChange={(e) =>
                                setNewCondition({ ...newCondition, variableId: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select Variable</option>
                              {variables.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Operator
                            </label>
                            <select
                              value={newCondition.operator || 'equals'}
                              onChange={(e) =>
                                setNewCondition({
                                  ...newCondition,
                                  operator: e.target.value as Condition['operator'],
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="equals">Equals</option>
                              <option value="not_equals">Not Equals</option>
                              <option value="contains">Contains</option>
                              <option value="greater_than">Greater Than</option>
                              <option value="less_than">Less Than</option>
                              <option value="is_empty">Is Empty</option>
                              <option value="is_not_empty">Is Not Empty</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Value
                            </label>
                            <input
                              type="text"
                              value={newCondition.value || ''}
                              onChange={(e) =>
                                setNewCondition({ ...newCondition, value: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Comparison value"
                              disabled={
                                newCondition.operator === 'is_empty' ||
                                newCondition.operator === 'is_not_empty'
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Action (If condition is true)
                          </label>
                          <input
                            type="text"
                            value={newCondition.action || ''}
                            onChange={(e) =>
                              setNewCondition({ ...newCondition, action: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Ask for Order Number, Continue Workflow"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAddCondition}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add Condition
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingCondition(false);
                            setNewCondition({
                              name: '',
                              variableId: '',
                              operator: 'equals',
                              value: '',
                              action: '',
                              enabled: true,
                            });
                          }}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Conditions List */}
                  <div className="space-y-4">
                    {conditions.length === 0 ? (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <GitBranch className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Conditions Yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Create conditional logic to control chatbot behavior
                        </p>
                        <button
                          onClick={() => setIsAddingCondition(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus size={20} />
                          Add Condition
                        </button>
                      </div>
                    ) : (
                      conditions.map((condition) => {
                        const variable = variables.find((v) => v.id === condition.variableId);
                        return (
                          <div
                            key={condition.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <GitBranch
                                  className={condition.enabled ? 'text-blue-600' : 'text-gray-400'}
                                  size={24}
                                />
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {condition.name}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {condition.enabled ? 'Active' : 'Inactive'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleCondition(condition.id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    condition.enabled
                                      ? 'text-green-600 hover:bg-green-50'
                                      : 'text-gray-400 hover:bg-gray-100'
                                  }`}
                                >
                                  {condition.enabled ? (
                                    <ToggleRight size={20} />
                                  ) : (
                                    <ToggleLeft size={20} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteCondition(condition.id)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center gap-2 flex-wrap text-sm">
                                <span className="font-medium text-gray-700">IF</span>
                                <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                                  {variable?.name || 'Unknown Variable'}
                                </code>
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                                  {condition.operator.replace('_', ' ').toUpperCase()}
                                </span>
                                {condition.operator !== 'is_empty' &&
                                  condition.operator !== 'is_not_empty' && (
                                    <code className="bg-gray-200 text-gray-800 px-2 py-1 rounded font-mono">
                                      "{condition.value}"
                                    </code>
                                  )}
                              </div>
                              <div className="flex items-center gap-2 mt-3 text-sm">
                                <span className="font-medium text-gray-700">THEN</span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {condition.action}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveConditions}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} />
                      <span>{saving ? 'Saving...' : 'Save Conditions'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
