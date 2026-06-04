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

  // Handle client-side mounting
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-expand sections based on current route
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

  return (
    <div className="w-64 bg-gray-900 text-white h-screen overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold">CMS Admin</h1>
      </div>

      <nav className="px-4 space-y-6">
        {/* Dashboard */}
        {hasPermission('dashboard.read') && (
          <div>
            <Link
              href="/admin"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                isActive('/admin')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </div>
        )}

        {/* Media Library */}
        {hasPermission('media.read') && (
          <div>
            <Link
              href="/admin/media-library"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                isActive('/admin/media-library')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <ImageIcon size={20} />
              <span>Media Library</span>
            </Link>
          </div>
        )}

        {/* Content Manager */}
        {hasPermission('content.read') && (
          <div>
            <button
              onClick={() => setContentManagerOpen(!contentManagerOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition"
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
                {/* Collection Types Dropdown */}
                <div>
                  <button
                    onClick={() => setCollectionTypesOpen(!collectionTypesOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 ml-6 text-sm text-gray-400 hover:text-gray-300"
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
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <Database size={16} />
                          <span className="text-sm">{ct.displayName}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Single Types Dropdown */}
                <div>
                  <button
                    onClick={() => setSingleTypesOpen(!singleTypesOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 ml-6 text-sm text-gray-400 hover:text-gray-300"
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
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
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

        {/* Content Type Builder */}
        {hasPermission('schema.manage') && (
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={() => setContentTypeBuilderOpen(!contentTypeBuilderOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                router.pathname.startsWith('/admin/content-type-builder')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
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
                  className={`block px-3 py-2 text-sm rounded-lg transition ${
                    router.pathname === '/admin/content-type-builder/collection-types' ||
                    router.pathname.startsWith('/admin/content-type-builder/edit/')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  Collection Types
                </Link>

                <Link
                  href="/admin/content-type-builder/single-types"
                  className={`block px-3 py-2 text-sm rounded-lg transition ${
                    router.pathname === '/admin/content-type-builder/single-types'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  Single Types
                </Link>

                <Link
                  href="/admin/content-type-builder/components"
                  className={`block px-3 py-2 text-sm rounded-lg transition ${
                    router.pathname === '/admin/content-type-builder/components'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  Components
                </Link>
              </div>
            )}
          </div>
        )}

        {/* AI Agents */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={() => setAiAgentsOpen(!aiAgentsOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
              router.pathname.startsWith('/admin/knowledge-base')
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
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
                href="/admin/knowledge-base"
                className={`block px-3 py-2 text-sm rounded-lg transition ${
                  router.pathname === '/admin/knowledge-base'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                Knowledge Base
              </Link>
            </div>
          )}
        </div>

        {/* Settings */}
        {hasAnyPermission(['settings.manage', 'users.read', 'roles.read']) && (
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                router.pathname.startsWith('/admin/settings')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
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
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition ${
                      router.pathname === '/admin/settings/users'
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Users size={16} />
                    <span>Users</span>
                  </Link>
                )}

                {hasPermission('roles.read') && (
                  <Link
                    href="/admin/settings/roles"
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition ${
                      router.pathname === '/admin/settings/roles'
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Shield size={16} />
                    <span>Roles & Permissions</span>
                  </Link>
                )}

                {hasPermission('settings.manage') && (
                  <Link
                    href="/admin/settings/internationalization"
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition ${
                      router.pathname === '/admin/settings/internationalization'
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Globe size={16} />
                    <span>Internationalization</span>
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
