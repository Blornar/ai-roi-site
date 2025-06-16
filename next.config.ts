import type { NextConfig } from 'next';

const repoName = '/ai-roi-site';      //  change if you rename the repo

const nextConfig: NextConfig = {
  output: 'export',
  basePath: repoName,
  assetPrefix: repoName + '/',
};

export default nextConfig;