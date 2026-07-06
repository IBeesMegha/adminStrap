import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/admin/Layout';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  Save,
  Loader,
  Palette,
  Image as ImageIcon,
  MessageCircle,
  Layout as LayoutIcon,
  Type,
  Code2,
  MessageSquare,
  Eye,
  Smartphone,
  Monitor,
  Copy,
  Check,
  Upload,
  X,
  MoveRight,
  MoveLeft,
  ChevronDown,
} from 'lucide-react';

interface WidgetConfig {
  id?: string;
  title: string;
  welcomeText: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  bgColor: string;
  position: string;
  marginX: number;
  marginY: number;
  width: number;
  height: number;
  borderRadius: number;
  showLogo: boolean;
  logoUrl: string;
  logoWidth: number;
  showAvatar: boolean;
  avatarUrl: string;
  avatarStyle: string;
  bubbleStyle: string;
  fontSize: string;
  headerBgColor: string;
  headerTextColor: string;
  userMsgBgColor: string;
  userMsgTextColor: string;
  botMsgBgColor: string;
  botMsgTextColor: string;
  inputBgColor: string;
  inputBorderColor: string;
  sendButtonColor: string;
  sendIconColor: string;
  customCss: string;
  embedActive: boolean;
}

const defaultConfig: WidgetConfig = {
  title: 'AI Chat Assistant',
  welcomeText: 'Hi! How can I help you today?',
  primaryColor: '#2563eb',
  secondaryColor: '#1e293b',
  textColor: '#ffffff',
  bgColor: '#ffffff',
  position: 'right',
  marginX: 20,
  marginY: 20,
  width: 380,
  height: 600,
  borderRadius: 16,
  showLogo: true,
  logoUrl: '',
  logoWidth: 40,
  showAvatar: true,
  avatarUrl: '',
  avatarStyle: 'rounded',
  bubbleStyle: 'rounded',
  fontSize: '14px',
  headerBgColor: '#2563eb',
  headerTextColor: '#ffffff',
  userMsgBgColor: '#2563eb',
  userMsgTextColor: '#ffffff',
  botMsgBgColor: '#f3f4f6',
  botMsgTextColor: '#111827',
  inputBgColor: '#ffffff',
  inputBorderColor: '#e5e7eb',
  sendButtonColor: '#2563eb',
  sendIconColor: '#ffffff',
  customCss: '',
  embedActive: true,
};

type SectionKey = 'general' | 'appearance' | 'chat' | 'embed';

export default function WidgetPage() {
  const router = useRouter();
  const { hasPermission, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('general');
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMessages, setPreviewMessages] = useState<{ role: string; content: string }[]>([]);
  const [previewInput, setPreviewInput] = useState('');

  useEffect(() => {
    if (!authLoading && !hasPermission('settings.manage')) {
      router.push('/admin/403');
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/widget');
      const result = await res.json();
      if (result.success && result.data) {
        setConfig({ ...defaultConfig, ...result.data });
      }
    } catch (error) {
      console.error('Error fetching widget config:', error);
      toast.error('Failed to load widget settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/widget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Widget settings saved');
        if (result.data) setConfig({ ...defaultConfig, ...result.data });
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving widget config:', error);
      toast.error('Failed to save widget settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof WidgetConfig>(field: K, value: WidgetConfig[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedCode = `<!-- AI Chat Widget -->
<div id="ai-chat-widget"></div>
<script src="${origin}/api/widget/embed.js" defer></script>`;

  const embedCodeMin = `<script src="${origin}/api/widget/embed.js" defer></script><div id="ai-chat-widget"></div>`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        updateField('logoUrl', ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        updateField('avatarUrl', ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePreviewSend = () => {
    if (!previewInput.trim()) return;
    setPreviewMessages(prev => [...prev, { role: 'user', content: previewInput }]);
    setPreviewInput('');
    setTimeout(() => {
      setPreviewMessages(prev => [...prev, { role: 'assistant', content: 'This is a preview response. Connect your knowledge base for real answers.' }]);
    }, 500);
  };

  const sections = [
    { key: 'general' as SectionKey, label: 'General', icon: <MessageSquare size={18} /> },
    { key: 'appearance' as SectionKey, label: 'Appearance', icon: <Palette size={18} /> },
    { key: 'chat' as SectionKey, label: 'Chat Settings', icon: <MessageCircle size={18} /> },
    { key: 'embed' as SectionKey, label: 'Embed Script', icon: <Code2 size={18} /> },
  ];

  if (authLoading || loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="flex h-[calc(100vh-4rem)]">
          <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-lg font-bold text-gray-900">Widget Settings</h1>
              <p className="text-xs text-gray-500 mt-1">Customize your chat widget</p>
            </div>
            <nav className="p-2 space-y-1">
              {sections.map(section => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition ${
                    activeSection === section.key
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {activeSection === 'general' && 'General Settings'}
                    {activeSection === 'appearance' && 'Appearance'}
                    {activeSection === 'chat' && 'Chat Settings'}
                    {activeSection === 'embed' && 'Embed Script'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {activeSection === 'general' && 'Configure basic widget information'}
                    {activeSection === 'appearance' && 'Customize colors, logo, position and size'}
                    {activeSection === 'chat' && 'Configure chat bubble appearance and behavior'}
                    {activeSection === 'embed' && 'Copy the embed code to add to your website'}
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                  Save
                </button>
              </div>

              {activeSection === 'general' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Widget Title</label>
                        <input
                          type="text"
                          value={config.title}
                          onChange={e => updateField('title', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
                        <textarea
                          value={config.welcomeText}
                          onChange={e => updateField('welcomeText', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.embedActive}
                            onChange={e => updateField('embedActive', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ms-3 text-sm font-medium text-gray-700">Widget Active</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.showLogo}
                            onChange={e => updateField('showLogo', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ms-3 text-sm font-medium text-gray-700">Show Logo</span>
                        </label>
                      </div>
                      {config.showLogo && (
                        <>
                          <div className="flex items-center gap-4">
                            {config.logoUrl && (
                              <div className="relative">
                                <img src={config.logoUrl} alt="Logo" className="w-16 h-16 object-contain border rounded-lg" />
                                <button
                                  onClick={() => updateField('logoUrl', '')}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                              <Upload size={18} />
                              <span className="text-sm">{config.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Width (px)</label>
                            <input
                              type="number"
                              value={config.logoWidth}
                              onChange={e => updateField('logoWidth', parseInt(e.target.value) || 40)}
                              min={16}
                              max={120}
                              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Avatar</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.showAvatar}
                            onChange={e => updateField('showAvatar', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ms-3 text-sm font-medium text-gray-700">Show Avatar</span>
                        </label>
                      </div>
                      {config.showAvatar && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Preset Avatars</label>
                            <div className="flex flex-wrap gap-3 mb-4">
                              {[
                                { color: 'Orange', bg: '#fb923c', value: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='og' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ffa726'/%3E%3Cstop offset='100%25' style='stop-color:%23fb8c00'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='60' cy='80' rx='25' ry='30' fill='url(%23og)' transform='rotate(-20 60 80)'/%3E%3Cellipse cx='140' cy='80' rx='25' ry='30' fill='url(%23og)' transform='rotate(20 140 80)'/%3E%3Crect x='20' y='30' width='15' height='8' rx='4' fill='%23fb8c00' transform='rotate(-25 27 34)'/%3E%3Crect x='165' y='30' width='15' height='8' rx='4' fill='%23fb8c00' transform='rotate(25 173 34)'/%3E%3Ccircle cx='20' cy='25' r='6' fill='%23ffa726'/%3E%3Ccircle cx='180' cy='25' r='6' fill='%23ffa726'/%3E%3Crect x='50' y='50' width='100' height='110' rx='20' fill='%23fff'/%3E%3Crect x='55' y='55' width='90' height='100' rx='18' fill='url(%23og)'/%3E%3Crect x='70' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='105' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='75' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Crect x='110' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Cpath d='M 75 135 Q 100 150 125 135' stroke='%23fff' stroke-width='6' fill='none' stroke-linecap='round'/%3E%3Crect x='85' y='165' width='30' height='25' rx='5' fill='%23fff'/%3E%3Ctext x='100' y='182' text-anchor='middle' fill='%23fb8c00' font-size='18' font-weight='bold'%3E%E2%96%A1%3C/text%3E%3C/svg%3E" },
                                { color: 'Blue', bg: '#3b82f6', value: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2342a5f5'/%3E%3Cstop offset='100%25' style='stop-color:%231e88e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='60' cy='80' rx='25' ry='30' fill='url(%23bg)' transform='rotate(-20 60 80)'/%3E%3Cellipse cx='140' cy='80' rx='25' ry='30' fill='url(%23bg)' transform='rotate(20 140 80)'/%3E%3Crect x='20' y='30' width='15' height='8' rx='4' fill='%231e88e5' transform='rotate(-25 27 34)'/%3E%3Crect x='165' y='30' width='15' height='8' rx='4' fill='%231e88e5' transform='rotate(25 173 34)'/%3E%3Ccircle cx='20' cy='25' r='6' fill='%2342a5f5'/%3E%3Ccircle cx='180' cy='25' r='6' fill='%2342a5f5'/%3E%3Crect x='50' y='50' width='100' height='110' rx='20' fill='%23fff'/%3E%3Crect x='55' y='55' width='90' height='100' rx='18' fill='url(%23bg)'/%3E%3Crect x='70' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='105' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='75' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Crect x='110' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Cpath d='M 75 135 Q 100 150 125 135' stroke='%23fff' stroke-width='6' fill='none' stroke-linecap='round'/%3E%3Crect x='85' y='165' width='30' height='25' rx='5' fill='%23fff'/%3E%3Ctext x='100' y='182' text-anchor='middle' fill='%231e88e5' font-size='18' font-weight='bold'%3E%E2%96%A1%3C/text%3E%3C/svg%3E" },
                                { color: 'Green', bg: '#10b981', value: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='gg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2366bb6a'/%3E%3Cstop offset='100%25' style='stop-color:%2343a047'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='60' cy='80' rx='25' ry='30' fill='url(%23gg)' transform='rotate(-20 60 80)'/%3E%3Cellipse cx='140' cy='80' rx='25' ry='30' fill='url(%23gg)' transform='rotate(20 140 80)'/%3E%3Crect x='20' y='30' width='15' height='8' rx='4' fill='%2343a047' transform='rotate(-25 27 34)'/%3E%3Crect x='165' y='30' width='15' height='8' rx='4' fill='%2343a047' transform='rotate(25 173 34)'/%3E%3Ccircle cx='20' cy='25' r='6' fill='%2366bb6a'/%3E%3Ccircle cx='180' cy='25' r='6' fill='%2366bb6a'/%3E%3Crect x='50' y='50' width='100' height='110' rx='20' fill='%23fff'/%3E%3Crect x='55' y='55' width='90' height='100' rx='18' fill='url(%23gg)'/%3E%3Crect x='70' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='105' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='75' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Crect x='110' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Cpath d='M 75 135 Q 100 150 125 135' stroke='%23fff' stroke-width='6' fill='none' stroke-linecap='round'/%3E%3Crect x='85' y='165' width='30' height='25' rx='5' fill='%23fff'/%3E%3Ctext x='100' y='182' text-anchor='middle' fill='%2343a047' font-size='18' font-weight='bold'%3E%E2%96%A1%3C/text%3E%3C/svg%3E" },
                                { color: 'Red', bg: '#ef4444', value: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='rg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ef5350'/%3E%3Cstop offset='100%25' style='stop-color:%23e53935'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='60' cy='80' rx='25' ry='30' fill='url(%23rg)' transform='rotate(-20 60 80)'/%3E%3Cellipse cx='140' cy='80' rx='25' ry='30' fill='url(%23rg)' transform='rotate(20 140 80)'/%3E%3Crect x='20' y='30' width='15' height='8' rx='4' fill='%23e53935' transform='rotate(-25 27 34)'/%3E%3Crect x='165' y='30' width='15' height='8' rx='4' fill='%23e53935' transform='rotate(25 173 34)'/%3E%3Ccircle cx='20' cy='25' r='6' fill='%23ef5350'/%3E%3Ccircle cx='180' cy='25' r='6' fill='%23ef5350'/%3E%3Crect x='50' y='50' width='100' height='110' rx='20' fill='%23fff'/%3E%3Crect x='55' y='55' width='90' height='100' rx='18' fill='url(%23rg)'/%3E%3Crect x='70' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='105' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='75' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Crect x='110' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Cpath d='M 75 135 Q 100 150 125 135' stroke='%23fff' stroke-width='6' fill='none' stroke-linecap='round'/%3E%3Crect x='85' y='165' width='30' height='25' rx='5' fill='%23fff'/%3E%3Ctext x='100' y='182' text-anchor='middle' fill='%23e53935' font-size='18' font-weight='bold'%3E%E2%96%A1%3C/text%3E%3C/svg%3E" },
                                { color: 'Purple', bg: '#8b5cf6', value: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='pg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ab47bc'/%3E%3Cstop offset='100%25' style='stop-color:%238e24aa'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='60' cy='80' rx='25' ry='30' fill='url(%23pg)' transform='rotate(-20 60 80)'/%3E%3Cellipse cx='140' cy='80' rx='25' ry='30' fill='url(%23pg)' transform='rotate(20 140 80)'/%3E%3Crect x='20' y='30' width='15' height='8' rx='4' fill='%238e24aa' transform='rotate(-25 27 34)'/%3E%3Crect x='165' y='30' width='15' height='8' rx='4' fill='%238e24aa' transform='rotate(25 173 34)'/%3E%3Ccircle cx='20' cy='25' r='6' fill='%23ab47bc'/%3E%3Ccircle cx='180' cy='25' r='6' fill='%23ab47bc'/%3E%3Crect x='50' y='50' width='100' height='110' rx='20' fill='%23fff'/%3E%3Crect x='55' y='55' width='90' height='100' rx='18' fill='url(%23pg)'/%3E%3Crect x='70' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='105' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='75' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Crect x='110' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Cpath d='M 75 135 Q 100 150 125 135' stroke='%23fff' stroke-width='6' fill='none' stroke-linecap='round'/%3E%3Crect x='85' y='165' width='30' height='25' rx='5' fill='%23fff'/%3E%3Ctext x='100' y='182' text-anchor='middle' fill='%238e24aa' font-size='18' font-weight='bold'%3E%E2%96%A1%3C/text%3E%3C/svg%3E" },
                                { color: 'Pink', bg: '#dd22b2ff', value: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='pk' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ec407a'/%3E%3Cstop offset='100%25' style='stop-color:%23d81b60'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='60' cy='80' rx='25' ry='30' fill='url(%23pk)' transform='rotate(-20 60 80)'/%3E%3Cellipse cx='140' cy='80' rx='25' ry='30' fill='url(%23pk)' transform='rotate(20 140 80)'/%3E%3Crect x='20' y='30' width='15' height='8' rx='4' fill='%23d81b60' transform='rotate(-25 27 34)'/%3E%3Crect x='165' y='30' width='15' height='8' rx='4' fill='%23d81b60' transform='rotate(25 173 34)'/%3E%3Ccircle cx='20' cy='25' r='6' fill='%23ec407a'/%3E%3Ccircle cx='180' cy='25' r='6' fill='%23ec407a'/%3E%3Crect x='50' y='50' width='100' height='110' rx='20' fill='%23fff'/%3E%3Crect x='55' y='55' width='90' height='100' rx='18' fill='url(%23pk)'/%3E%3Crect x='70' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='105' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='75' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Crect x='110' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Cpath d='M 75 135 Q 100 150 125 135' stroke='%23fff' stroke-width='6' fill='none' stroke-linecap='round'/%3E%3Crect x='85' y='165' width='30' height='25' rx='5' fill='%23fff'/%3E%3Ctext x='100' y='182' text-anchor='middle' fill='%23d81b60' font-size='18' font-weight='bold'%3E%E2%96%A1%3C/text%3E%3C/svg%3E" },
                              ].map((avatar) => (
                                <button
                                  key={avatar.color}
                                  onClick={() => updateField('avatarUrl', avatar.value)}
                                  className={`relative group`}
                                  title={`${avatar.color} Bot`}
                                >
                                  <div className={`w-16 h-16 rounded-full border-2 transition ${
                                    config.avatarUrl === avatar.value
                                      ? 'border-blue-500 ring-2 ring-blue-200'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`} >
                                    <img src={avatar.value} alt={avatar.color} className="w-full h-full rounded-full" />
                                  </div>
                                  {config.avatarUrl === avatar.value && (
                                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5">
                                      <Check size={12} />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Custom Avatar</label>
                            <div className="flex items-center gap-4">
                              {config.avatarUrl && !config.avatarUrl.startsWith('data:image/svg') && (
                                <div className="relative">
                                  <img src={config.avatarUrl} alt="Avatar" className={`w-16 h-16 object-cover border ${
                                    config.avatarStyle === 'rounded' ? 'rounded-full' : 'rounded-lg'
                                  }`} />
                                  <button
                                    onClick={() => updateField('avatarUrl', '')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )}
                              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                <Upload size={18} />
                                <span className="text-sm">Upload Custom Image</span>
                                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                              </label>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar Style</label>
                            <select
                              value={config.avatarStyle}
                              onChange={e => updateField('avatarStyle', e.target.value)}
                              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="rounded">Rounded Circle</option>
                              <option value="square">Rounded Square</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Colors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ColorInput label="Primary Color" value={config.primaryColor} onChange={v => updateField('primaryColor', v)} />
                      <ColorInput label="Secondary Color" value={config.secondaryColor} onChange={v => updateField('secondaryColor', v)} />
                      <ColorInput label="Text Color" value={config.textColor} onChange={v => updateField('textColor', v)} />
                      <ColorInput label="Background Color" value={config.bgColor} onChange={v => updateField('bgColor', v)} />
                      <ColorInput label="Header Background" value={config.headerBgColor} onChange={v => updateField('headerBgColor', v)} />
                      <ColorInput label="Header Text Color" value={config.headerTextColor} onChange={v => updateField('headerTextColor', v)} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Position & Size</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Widget Position</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => updateField('position', 'left')}
                            className={`flex items-center gap-2 px-6 py-3 border-2 rounded-lg transition ${
                              config.position === 'left'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <MoveLeft size={20} />
                            Left
                          </button>
                          <button
                            onClick={() => updateField('position', 'right')}
                            className={`flex items-center gap-2 px-6 py-3 border-2 rounded-lg transition ${
                              config.position === 'right'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <MoveRight size={20} />
                            Right
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Margin X (px)</label>
                          <input
                            type="number"
                            value={config.marginX}
                            onChange={e => updateField('marginX', parseInt(e.target.value) || 20)}
                            min={0}
                            max={100}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Margin Y (px)</label>
                          <input
                            type="number"
                            value={config.marginY}
                            onChange={e => updateField('marginY', parseInt(e.target.value) || 20)}
                            min={0}
                            max={100}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Width (px)</label>
                          <input
                            type="number"
                            value={config.width}
                            onChange={e => updateField('width', parseInt(e.target.value) || 380)}
                            min={280}
                            max={600}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Height (px)</label>
                          <input
                            type="number"
                            value={config.height}
                            onChange={e => updateField('height', parseInt(e.target.value) || 600)}
                            min={400}
                            max={900}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius (px)</label>
                          <input
                            type="number"
                            value={config.borderRadius}
                            onChange={e => updateField('borderRadius', parseInt(e.target.value) || 16)}
                            min={0}
                            max={40}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom CSS</h3>
                    <textarea
                      value={config.customCss || ''}
                      onChange={e => updateField('customCss', e.target.value)}
                      rows={6}
                      placeholder="/* Add custom CSS overrides here */"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {activeSection === 'chat' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Colors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ColorInput label="User Message Background" value={config.userMsgBgColor} onChange={v => updateField('userMsgBgColor', v)} />
                      <ColorInput label="User Message Text" value={config.userMsgTextColor} onChange={v => updateField('userMsgTextColor', v)} />
                      <ColorInput label="Bot Message Background" value={config.botMsgBgColor} onChange={v => updateField('botMsgBgColor', v)} />
                      <ColorInput label="Bot Message Text" value={config.botMsgTextColor} onChange={v => updateField('botMsgTextColor', v)} />
                      <ColorInput label="Send Button Color" value={config.sendButtonColor} onChange={v => updateField('sendButtonColor', v)} />
                      <ColorInput label="Send Icon Color" value={config.sendIconColor} onChange={v => updateField('sendIconColor', v)} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Input Field</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ColorInput label="Input Background" value={config.inputBgColor} onChange={v => updateField('inputBgColor', v)} />
                      <ColorInput label="Input Border" value={config.inputBorderColor} onChange={v => updateField('inputBorderColor', v)} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bubble & Font</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bubble Style</label>
                        <select
                          value={config.bubbleStyle}
                          onChange={e => updateField('bubbleStyle', e.target.value)}
                          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="rounded">Rounded</option>
                          <option value="square">Square</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                        <select
                          value={config.fontSize}
                          onChange={e => updateField('fontSize', e.target.value)}
                          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="12px">Small (12px)</option>
                          <option value="14px">Normal (14px)</option>
                          <option value="16px">Large (16px)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'embed' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Embed Code</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add this code to your website's HTML, just before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag.
                    </p>

                    <div className="mb-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      <Eye size={20} />
                      <span>Make sure you have set up your knowledge base and AI chatbot before embedding.</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Embed Code</label>
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">{embedCode}</pre>
                          <button
                            onClick={() => handleCopy(embedCode)}
                            className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                          >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minified Embed Code</label>
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap break-all">{embedCodeMin}</pre>
                          <button
                            onClick={() => handleCopy(embedCodeMin)}
                            className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                          >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Installation Instructions</h3>
                    <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
                      <li>Copy the embed code above</li>
                      <li>Open your website's HTML file</li>
                      <li>Paste the code just before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag</li>
                      <li>Save and publish your website</li>
                      <li>The chat widget will appear on your site</li>
                    </ol>
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      <strong>Note:</strong> The widget will connect to this server. Make sure your server is publicly accessible if you want the widget to work on a live website.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-80 border-l border-gray-200 bg-white flex-shrink-0 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {previewOpen ? 'Collapse' : 'Expand'}
              </button>
            </div>

            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: previewOpen ? 500 : 400 }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="bg-white shadow-xl flex flex-col overflow-hidden"
                  style={{
                    width: Math.min(config.width, 300),
                    height: previewOpen ? Math.min(config.height, 460) : Math.min(config.height, 360),
                    borderRadius: config.borderRadius,
                  }}
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                    style={{ backgroundColor: config.headerBgColor, color: config.headerTextColor }}
                  >
                    {config.showLogo && config.logoUrl && (
                      <img src={config.logoUrl} alt="" style={{ width: config.logoWidth, height: config.logoWidth }} className="object-contain" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{config.title}</p>
                    </div>
                    {config.showAvatar && config.avatarUrl && (
                      <img src={config.avatarUrl} alt="" className={`w-8 h-8 object-cover ${
                        config.avatarStyle === 'rounded' ? 'rounded-full' : 'rounded-lg'
                      }`} />
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ backgroundColor: config.bgColor }}>
                    <div className="flex items-start gap-2">
                      {config.showAvatar && config.avatarUrl && (
                        <img src={config.avatarUrl} alt="" className={`w-6 h-6 object-cover flex-shrink-0 ${
                          config.avatarStyle === 'rounded' ? 'rounded-full' : 'rounded-lg'
                        }`} />
                      )}
                      <div
                        className="px-3 py-2 text-sm max-w-[80%]"
                        style={{
                          backgroundColor: config.botMsgBgColor,
                          color: config.botMsgTextColor,
                          borderRadius: config.bubbleStyle === 'rounded' ? '12px 12px 12px 4px' : '4px',
                          fontSize: config.fontSize,
                        }}
                      >
                        {config.welcomeText}
                      </div>
                    </div>
                    {previewMessages.map((msg, i) => (
                      <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.role === 'assistant' && config.showAvatar && config.avatarUrl && (
                          <img src={config.avatarUrl} alt="" className={`w-6 h-6 object-cover flex-shrink-0 ${
                            config.avatarStyle === 'rounded' ? 'rounded-full' : 'rounded-lg'
                          }`} />
                        )}
                        <div
                          className="px-3 py-2 text-sm max-w-[80%]"
                          style={{
                            backgroundColor: msg.role === 'user' ? config.userMsgBgColor : config.botMsgBgColor,
                            color: msg.role === 'user' ? config.userMsgTextColor : config.botMsgTextColor,
                            borderRadius: config.bubbleStyle === 'rounded'
                              ? msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px'
                              : '4px',
                            fontSize: config.fontSize,
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex items-center gap-2 p-3 border-t flex-shrink-0"
                    style={{ backgroundColor: config.inputBgColor, borderColor: config.inputBorderColor }}
                  >
                    <input
                      type="text"
                      value={previewInput}
                      onChange={e => setPreviewInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePreviewSend()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none"
                      style={{ borderColor: config.inputBorderColor, fontSize: config.fontSize }}
                    />
                    <button
                      onClick={handlePreviewSend}
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: config.sendButtonColor, color: config.sendIconColor }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Monitor size={14} />
                <span>Desktop</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone size={14} />
                <span>Responsive on mobile</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 p-1 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      </div>
    </div>
  );
}
