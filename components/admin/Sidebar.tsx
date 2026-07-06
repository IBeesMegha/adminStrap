import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Database,
  FileText,
  Component as ComponentIcon,
  Plus,
  Settings,
  Home,
  Image as ImageIcon,
  Users,
  Shield,
  Globe,
  Brain,
  Palette,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  collectionTypes: any[];
  singleTypes: any[];
  components: any[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collectionTypes,
  singleTypes,
  components,
}) => {
  const router = useRouter();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [contentManagerOpen, setContentManagerOpen] = React.useState(true);
  const [collectionTypesOpen, setCollectionTypesOpen] = React.useState(true);
  const [singleTypesOpen, setSingleTypesOpen] = React.useState(true);
  const [contentTypeBuilderOpen, setContentTypeBuilderOpen] = React.useState(false);
  const [aiAgentsOpen, setAiAgentsOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const isActive = (path: string) => router.pathname === path;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    
    if (router.pathname.startsWith('/admin/collections/')) {
      setContentManagerOpen(true);
      setCollectionTypesOpen(true);
    }
    if (router.pathname.startsWith('/admin/singles/')) {
      setContentManagerOpen(true);
      setSingleTypesOpen(true);
    }
    if (router.pathname.startsWith('/admin/content-type-builder')) {
      setContentTypeBuilderOpen(true);
    }
    if (router.pathname.startsWith('/admin/knowledge-base')) {
      setAiAgentsOpen(true);
    }
    if (router.pathname.startsWith('/admin/settings')) {
      setSettingsOpen(true);
    }
  }, [router.pathname, mounted]);

  const textColor = 'var(--sidebar-text-color, #f3f4f6)';
  const textMuted = { color: 'var(--sidebar-text-muted, #9ca3af)' };

  return (
    <div className="w-64 h-screen overflow-y-auto flex-shrink-0" style={{ backgroundColor: 'var(--sidebar-background-color)' }}>
      <div className="p-6">
        <h1 className="text-2xl font-bold" style={{ color: textColor }}>CMS Admin</h1>
      </div>

      <nav className="px-4 space-y-6">
        {hasPermission('dashboard.read') && (
          <div>
            <Link
              href="/admin"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                isActive('/admin')
                  ? 'text-white'
                  : 'hover:bg-white/10'
              }`}
              style={{ color: isActive('/admin') ? '#fff' : textMuted.color }}
            >
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </div>
        )}

        {hasPermission('media.read') && (
          <div>
            <Link
              href="/admin/media-library"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                isActive('/admin/media-library')
                  ? 'text-white'
                  : 'hover:bg-white/10'
              }`}
              style={{ color: isActive('/admin/media-library') ? '#fff' : textMuted.color }}
            >
              <ImageIcon size={20} />
              <span>Media Library</span>
            </Link>
          </div>
        )}

        {hasPermission('content.read') && (
          <div>
            <button
              onClick={() => setContentManagerOpen(!contentManagerOpen)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 rounded-lg transition"
              style={{ color: textMuted.color }}
            >
              <div className="flex items-center space-x-3">
                <Database size={20} />
                <span className="font-medium">Content Manager</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${
                  contentManagerOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {contentManagerOpen && (
              <div className="mt-2 space-y-2">
                <div>
                  <button
                    onClick={() => setCollectionTypesOpen(!collectionTypesOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 ml-6 text-sm hover:text-white"
                    style={{ color: textMuted.color }}
                  >
                    <span className="uppercase font-semibold">Collection Types</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${
                        collectionTypesOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {collectionTypesOpen && (
                    <div className="ml-12 space-y-1">
                      {collectionTypes.map((ct) => (
                        <Link
                          key={ct.id}
                          href={`/admin/collections/${ct.name}`}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                            router.query.name === ct.name && router.pathname.startsWith('/admin/collections/')
                              ? 'bg-white/10 text-white'
                              : 'hover:bg-white/10'
                          }`}
                          style={{ color: (router.query.name === ct.name && router.pathname.startsWith('/admin/collections/')) ? '#fff' : textMuted.color }}
                        >
                          <Database size={16} />
                          <span className="text-sm">{ct.displayName}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => setSingleTypesOpen(!singleTypesOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 ml-6 text-sm hover:text-white"
                    style={{ color: textMuted.color }}
                  >
                    <span className="uppercase font-semibold">Single Types</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${
                        singleTypesOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {singleTypesOpen && (
                    <div className="ml-12 space-y-1">
                      {singleTypes.map((st) => (
                        <Link
                          key={st.id}
                          href={`/admin/singles/${st.name}`}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                            router.query.name === st.name && router.pathname.startsWith('/admin/singles/')
                              ? 'bg-white/10 text-white'
                              : 'hover:bg-white/10'
                          }`}
                          style={{ color: (router.query.name === st.name && router.pathname.startsWith('/admin/singles/')) ? '#fff' : textMuted.color }}
                        >
                          <FileText size={16} />
                          <span className="text-sm">{st.displayName}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {hasPermission('schema.manage') && (
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={() => setContentTypeBuilderOpen(!contentTypeBuilderOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition hover:bg-white/10 ${
                router.pathname.startsWith('/admin/content-type-builder') ? 'text-white' : ''
              }`}
              style={{ color: router.pathname.startsWith('/admin/content-type-builder') ? '#fff' : textMuted.color }}
            >
              <div className="flex items-center space-x-3">
                <Settings size={20} />
                <span>Content-Type Builder</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${
                  contentTypeBuilderOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {contentTypeBuilderOpen && (
              <div className="ml-8 mt-2 space-y-1">
                <Link
                  href="/admin/content-type-builder/collection-types"
                  className={`block px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                    router.pathname === '/admin/content-type-builder/collection-types' ||
                    router.pathname.startsWith('/admin/content-type-builder/edit/')
                      ? 'bg-white/10 text-white'
                      : ''
                  }`}
                  style={{ color: (router.pathname === '/admin/content-type-builder/collection-types' || router.pathname.startsWith('/admin/content-type-builder/edit/')) ? '#fff' : textMuted.color }}
                >
                  Collection Types
                </Link>

                <Link
                  href="/admin/content-type-builder/single-types"
                  className={`block px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                    router.pathname === '/admin/content-type-builder/single-types'
                      ? 'bg-white/10 text-white'
                      : ''
                  }`}
                  style={{ color: router.pathname === '/admin/content-type-builder/single-types' ? '#fff' : textMuted.color }}
                >
                  Single Types
                </Link>

                <Link
                  href="/admin/content-type-builder/components"
                  className={`block px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                    router.pathname === '/admin/content-type-builder/components'
                      ? 'bg-white/10 text-white'
                      : ''
                  }`}
                  style={{ color: router.pathname === '/admin/content-type-builder/components' ? '#fff' : textMuted.color }}
                >
                  Components
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={() => setAiAgentsOpen(!aiAgentsOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition hover:bg-white/10 ${
              router.pathname.startsWith('/admin/knowledge-base') ? 'text-white' : ''
            }`}
            style={{ color: router.pathname.startsWith('/admin/knowledge-base') ? '#fff' : textMuted.color }}
          >
            <div className="flex items-center space-x-3">
              <Brain size={20} />
              <span>AI Agents</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${
                aiAgentsOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {aiAgentsOpen && (
            <div className="ml-8 mt-2 space-y-1">
              <Link
                href="/admin/ai-chatbot"
                className={`block px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                  router.pathname === '/admin/ai-chatbot'
                    ? 'bg-white/10 text-white'
                    : ''
                }`}
                style={{ color: router.pathname === '/admin/ai-chatbot' ? '#fff' : textMuted.color }}
              >
                AI Chatbot
              </Link>
              <Link
                href="/admin/workflow-builder"
                className={`block px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                  router.pathname === '/admin/workflow-builder'
                    ? 'bg-white/10 text-white'
                    : ''
                }`}
                style={{ color: router.pathname === '/admin/workflow-builder' ? '#fff' : textMuted.color }}
              >
                Workflow Builder
              </Link>
              <Link
                href="/admin/knowledge-base"
                className={`block px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                  router.pathname === '/admin/knowledge-base'
                    ? 'bg-white/10 text-white'
                    : ''
                }`}
                style={{ color: router.pathname === '/admin/knowledge-base' ? '#fff' : textMuted.color }}
              >
                Knowledge Base (Legacy)
              </Link>
              <Link
                href="/admin/chat-history"
                className={`block px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                  router.pathname === '/admin/chat-history'
                    ? 'bg-white/10 text-white'
                    : ''
                }`}
                style={{ color: router.pathname === '/admin/chat-history' ? '#fff' : textMuted.color }}
              >
                Chat History
              </Link>
              <Link
                href="/admin/widget"
                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                  router.pathname === '/admin/widget'
                    ? 'bg-white/10 text-white'
                    : ''
                }`}
                style={{ color: router.pathname === '/admin/widget' ? '#fff' : textMuted.color }}
              >
                <MessageSquare size={16} />
                <span>Widget</span>
              </Link>
            </div>
          )}
        </div>

        {hasAnyPermission(['settings.manage', 'users.read', 'roles.read']) && (
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition hover:bg-white/10 ${
                router.pathname.startsWith('/admin/settings') ? 'text-white' : ''
              }`}
              style={{ color: router.pathname.startsWith('/admin/settings') ? '#fff' : textMuted.color }}
            >
              <div className="flex items-center space-x-3">
                <Settings size={20} />
                <span>Settings</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${
                  settingsOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {settingsOpen && (
              <div className="ml-8 mt-2 space-y-1">
                {hasPermission('users.read') && (
                  <Link
                    href="/admin/settings/users"
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                      router.pathname === '/admin/settings/users' ? 'bg-white/10 text-white' : ''
                    }`}
                    style={{ color: router.pathname === '/admin/settings/users' ? '#fff' : textMuted.color }}
                  >
                    <Users size={16} />
                    <span>Users</span>
                  </Link>
                )}

                {hasPermission('roles.read') && (
                  <Link
                    href="/admin/settings/roles"
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                      router.pathname === '/admin/settings/roles' ? 'bg-white/10 text-white' : ''
                    }`}
                    style={{ color: router.pathname === '/admin/settings/roles' ? '#fff' : textMuted.color }}
                  >
                    <Shield size={16} />
                    <span>Roles & Permissions</span>
                  </Link>
                )}

                {hasPermission('settings.manage') && (
                  <Link
                    href="/admin/settings/internationalization"
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                      router.pathname === '/admin/settings/internationalization' ? 'bg-white/10 text-white' : ''
                    }`}
                    style={{ color: router.pathname === '/admin/settings/internationalization' ? '#fff' : textMuted.color }}
                  >
                    <Globe size={16} />
                    <span>Internationalization</span>
                  </Link>
                )}

                {hasPermission('settings.manage') && (
                  <Link
                    href="/admin/settings/theme"
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition hover:bg-white/10 ${
                      router.pathname === '/admin/settings/theme' ? 'bg-white/10 text-white' : ''
                    }`}
                    style={{ color: router.pathname === '/admin/settings/theme' ? '#fff' : textMuted.color }}
                  >
                    <Palette size={16} />
                    <span>Theme Settings</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
};
