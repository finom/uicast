import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const src = (path: string) => resolve(import.meta.dirname, path);

// The tsconfig `paths`, which Vitest does not read.
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: src("src/$1") },
      { find: /^@uicast\/expr\/internal$/, replacement: src("../expr/src/internal.ts") },
      { find: /^@uicast\/expr$/, replacement: src("../expr/src/index.ts") },
      { find: /^@uicast\/core\/prompt$/, replacement: src("../core/src/prompt/index.ts") },
      { find: /^@uicast\/core\/internal$/, replacement: src("../core/src/internal.ts") },
      { find: /^@uicast\/core$/, replacement: src("../core/src/index.ts") },
      { find: /^@uicast\/react$/, replacement: src("../react/src/index.ts") },
      { find: /^@uicast\/shadcn-catalog$/, replacement: src("../shadcn-catalog/src/index.ts") },
      { find: /^@uicast\/shadcn-catalog\/(\w+)\/(defs|impls)$/, replacement: src("../shadcn-catalog/src/$1/$2.ts") },
    ],
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
