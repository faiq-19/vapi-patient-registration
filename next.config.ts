import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/patients", destination: "/api/patients" },
      { source: "/patients/:path*", destination: "/api/patients/:path*" },
    ];
  },
};

export default nextConfig;
