import { type NextConfig } from 'next/types';

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['esbuild'],
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