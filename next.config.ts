import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    instantNavigationDevToolsToggle: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
