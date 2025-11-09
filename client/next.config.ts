import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... your existing config
  turbopack: {
    root: './',  // Points to the client directory as the root
  },
};
export default nextConfig;
