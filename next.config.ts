import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.xlap.top',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.xlap.top',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
