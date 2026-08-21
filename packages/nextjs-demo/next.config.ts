import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The @uicast/* packages ship raw TypeScript source; let Next transpile them.
  transpilePackages: [
    "uicast",
    "@uicast/react",
    "@uicast/shadcn-catalog",
    "@uicast/streamdown",
  ],
  // Native module — keep it external so it isn't bundled into the server build.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
