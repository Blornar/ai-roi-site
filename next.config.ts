import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**  👇  THIS line turns on “next export” mode  */
  output: 'export',

  // If you’ll host under a sub-path, uncomment both lines
  // basePath: '/ai-roi-site',
  // assetPrefix: '/ai-roi-site/',
};

export default nextConfig;
//this is a comment