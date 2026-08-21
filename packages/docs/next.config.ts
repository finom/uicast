import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import nextra from "nextra";

const here = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = join(here, "..", "..");

// Themed docs are App Router `page.mdx` files under app/(docs); the sidebar order
// comes from app/_meta.tsx (at the app root — Nextra keeps route groups out of page
// routes but not out of `_meta` paths). The interactive demo keeps its own React
// routes under /demo. Static export + unoptimized images + Nextra search mirror the
// vovk.dev setup.
const withNextra = nextra({ search: { codeblocks: false } });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  // Nextra points the MDX import source at Next's `@vercel/turbopack-next/mdx-import-source`
  // builtin, which Next 16 can't provide here. Pin the Turbopack root to the workspace
  // top (so the hoisted `next` package resolves) and override the alias with a
  // root-relative path to this package's `mdx-components` (a leading-slash/absolute path
  // gets misread as "server relative"). Nextra spreads `resolveAlias` after its own
  // defaults, so this key wins.
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      "next-mdx-import-source-file": "./src/mdx-components.tsx",
    },
  },
  // The @uicast/* packages ship raw TypeScript source (consumed via the
  // monorepo workspace, no build step). Let Next transpile them like
  // first-party code — same mechanism a published/git-dep consumer uses.
  transpilePackages: ["uicast", "@uicast/react", "@uicast/shadcn-catalog"],
};

export default withNextra(nextConfig);
