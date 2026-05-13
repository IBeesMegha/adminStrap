import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/admin/Layout';
import { Database, FileText, Component } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    collections: 0,
    singles: 0,
    components: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [collectionsRes, singlesRes, componentsRes] = await Promise.all([
        fetch('/api/collection-types'),
        fetch('/api/single-types'),
        fetch('/api/components'),
      ]);

      const collections = await collectionsRes.json();
      const singles = await singlesRes.json();
      const components = await componentsRes.json();

      setStats({
        collections: collections.data?.length || 0,
        singles: singles.data?.length || 0,
        components: components.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collection Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.collections}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Single Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.singles}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Components</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.components}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Component className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Getting Started
          </h2>
          <div className="space-y-3 text-gray-700">
            <p>
              Welcome to your CMS admin panel! Here's how to get started:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                Use the <strong>Content-Type Builder</strong> to create
                Collection Types, Single Types, or Components
              </li>
              <li>
                Define fields for your content types (text, number, richtext,
                etc.)
              </li>
              <li>
                Navigate to your content types in the sidebar to create and
                manage entries
              </li>
              <li>
                Components can be reused across different content types
              </li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}
