import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (local database) ships WebAssembly that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  // These routes read the seed files (and the schema) at runtime.
  outputFileTracingIncludes: {
    "/api/cron/reset-demo": ["./seed/**/*"],
    "/api/setup": ["./seed/**/*", "./db/schema.sql"],
    "/api/add-new": ["./seed/**/*"],
  },
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
