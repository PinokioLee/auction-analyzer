import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/analyze",
        destination: "/dashboard/calculator",
        permanent: true,
      },
      {
        source: "/analyze/result",
        destination: "/dashboard/calculator/result",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
