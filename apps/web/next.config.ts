import type { NextConfig } from "next";

// GitHub Pages project sites live under /<repo>; the deploy workflow sets
// BASE_PATH accordingly ("" for an org/user *.github.io site or custom domain).
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Static export → deployed as plain assets (GitHub Pages / any static host)
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
