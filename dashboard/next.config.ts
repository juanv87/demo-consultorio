import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/demo-consultorio",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
