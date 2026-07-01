import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The @ui-fired/* packages ship raw TypeScript source; let Next transpile them.
  transpilePackages: ["@ui-fired/core", "@ui-fired/react", "@ui-fired/shadcn-catalog"],
  // Native module — keep it external so it isn't bundled into the server build.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
