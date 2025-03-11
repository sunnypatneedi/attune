/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure externals for both Webpack and Turbopack
  experimental: {
    turbo: {
      resolveAlias: {
        fs: 'node:fs',
        path: 'node:path',
        crypto: 'node:crypto'
      }
    }
  },
  serverExternalPackages: ['sql.js'],
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
