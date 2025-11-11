import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... your existing config
  turbopack: {
    root: './',  // Points to the client directory as the root
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
export default nextConfig;
