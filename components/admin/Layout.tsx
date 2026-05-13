import React, { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collectionTypes, setCollectionTypes] = useState([]);
  const [singleTypes, setSingleTypes] = useState([]);
  const [components, setComponents] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchContentTypes();
  }, []);

  const fetchContentTypes = async () => {
    try {
      const [collectionsRes, singlesRes, componentsRes] = await Promise.all([
        fetch('/api/collection-types'),
        fetch('/api/single-types'),
        fetch('/api/components'),
      ]);

      const collections = await collectionsRes.json();
      const singles = await singlesRes.json();
      const comps = await componentsRes.json();

      setCollectionTypes(collections.data || []);
      setSingleTypes(singles.data || []);
      setComponents(comps.data || []);
    } catch (error) {
      console.error('Error fetching content types:', error);
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-gray-900"></div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        collectionTypes={collectionTypes}
        singleTypes={singleTypes}
        components={components}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
