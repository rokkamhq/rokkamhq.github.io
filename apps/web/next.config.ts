import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export → deployed as plain assets on Cloudflare Pages (rokkam.pages.dev / rokkam.in)
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
