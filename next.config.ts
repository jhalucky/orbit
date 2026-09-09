import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  async rewrites() {
    return [
      {
        source: "/orbit-api/:path*",
        destination: `${process.env.ORBIT_API_URL ?? "http://127.0.0.1:8000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
