import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import nextra from "nextra";

const here = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = join(here, "..", "..");

const withNextra = nextra({ search: { codeblocks: false } });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  // Nextra aliases the MDX import source to a Turbopack builtin Next 16 lacks. The root is the workspace top so the
  // hoisted `next` resolves; the alias is root-relative because an absolute path is misread as server-relative.
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      "next-mdx-import-source-file": "./src/mdx-components.tsx",
    },
  },
  // The tsconfig paths point @uicast/* at src/, so Next transpiles them as first-party code.
  transpilePackages: [
    "@uicast/expr",
    "@uicast/core",
    "@uicast/react",
    "@uicast/shadcn-catalog",
  ],
};

export default withNextra(nextConfig);
