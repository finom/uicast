import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The @ui-fired/* packages ship raw TypeScript source (consumed via the
  // monorepo workspace, no build step). Let Next transpile them like
  // first-party code — same mechanism a published/git-dep consumer uses.
  transpilePackages: ["@ui-fired/core", "@ui-fired/react", "@ui-fired/catalog"],
};

export default nextConfig;
