import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disabilita ESLint durante il build di produzione
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disabilita controlli TypeScript durante il build di produzione
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
