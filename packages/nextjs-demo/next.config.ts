import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Inside the monorepo the @uicast/* packages are consumed as source (the
  // tsconfig paths point at src/, not the built dist/); let Next transpile them.
  transpilePackages: [
    "@uicast/expr",
    "@uicast/core",
    "@uicast/react",
    "@uicast/shadcn-catalog",
    "@uicast/streamdown",
  ],
};

export default nextConfig;
