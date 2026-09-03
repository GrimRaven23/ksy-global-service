import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [],
  },
  poweredByHeader: false,
};

export default nextConfig;
