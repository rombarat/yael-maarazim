import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (local database) ships WebAssembly that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  // The demo reset route reads the seed files at runtime.
  outputFileTracingIncludes: { "/api/cron/reset-demo": ["./seed/**/*"] },
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
