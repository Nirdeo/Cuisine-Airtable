import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // This enables the standalone output mode, which is optimized for Docker deployments
  // It creates a minimal server-side bundle that doesn't require the entire node_modules directory
};

export default nextConfig;
