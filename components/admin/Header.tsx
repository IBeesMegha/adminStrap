import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Search, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface SearchResult {
  type: 'collection' | 'single' | 'component';
  name: string;
  displayName: string;
  url: string;
}

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const [collectionsRes, singlesRes, componentsRes] = await Promise.all([
          fetch('/api/collection-types'),
          fetch('/api/single-types'),
          fetch('/api/components'),
        ]);

        const collections = await collectionsRes.json();
        const singles = await singlesRes.json();
        const components = await componentsRes.json();

        const results: SearchResult[] = [];

        // Search in collections
        collections.data?.forEach((item: any) => {
          if (
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.displayName.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            results.push({
              type: 'collection',
              name: item.name,
              displayName: item.displayName,
              url: `/admin/collections/${item.name}`,
            });
          }
        });

        // Search in single types
        singles.data?.forEach((item: any) => {
          if (
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.displayName.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            results.push({
              type: 'single',
              name: item.name,
              displayName: item.displayName,
              url: `/admin/singles/${item.name}`,
            });
          }
        });

        // Search in components
        components.data?.forEach((item: any) => {
          if (
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.displayName.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            results.push({
              type: 'component',
              name: item.name,
              displayName: item.displayName,
              url: `/admin/component-entries/${item.name}`,
            });
          }
        });

        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearchResultClick = (url: string) => {
    router.push(url);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'collection':
        return '📚';
      case 'single':
        return '📄';
      case 'component':
        return '🧩';
      default:
        return '📦';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'collection':
        return 'bg-blue-100 text-blue-800';
      case 'single':
        return 'bg-green-100 text-green-800';
      case 'component':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search content types, collections, singles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.name}-${index}`}
                      onClick={() => handleSearchResultClick(result.url)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getTypeIcon(result.type)}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {result.displayName}
                          </p>
                          <p className="text-xs text-gray-500">{result.name}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(
                          result.type
                        )}`}
                      >
                        {result.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-6 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No results found for &quot;{searchQuery}&quot;</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Menu */}
        <div className="ml-6 relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user?.name || 'Admin User'}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                showProfileMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.email || 'admin@example.com'}
                </p>
              </div>

              <button
                onClick={() => {
                  router.push('/admin/profile');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                <User className="h-4 w-4 text-gray-500" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  router.push('/admin/settings');
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-500" />
                <span>Settings</span>
              </button>

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
