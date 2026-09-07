import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite subir el audio por server action (default: 1MB).
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
