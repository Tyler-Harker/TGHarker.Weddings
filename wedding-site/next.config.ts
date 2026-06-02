import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build for the Docker image (see Dockerfile).
  output: "standalone",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
