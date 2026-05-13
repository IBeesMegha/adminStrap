/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static optimization for admin pages that need database
  experimental: {
    // This helps with build performance
  },
  // Skip static generation for dynamic pages
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

module.exports = nextConfig;
