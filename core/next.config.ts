import { type NextConfig } from 'next/types';

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['esbuild'],
  turbopack: {
    // Empty turbopack config to silence the warning
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle esbuild as external for server builds
      config.externals = config.externals || [];
      config.externals.push('esbuild');
    }
    return config;
  },
};

export default config;