import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const src = (path: string) => resolve(import.meta.dirname, path);

// The tsconfig `paths`, which Vitest does not read.
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: src("src/$1") },
      { find: /^@uicast\/expr\/internal$/, replacement: src("../packages/expr/src/internal.ts") },
      { find: /^@uicast\/expr$/, replacement: src("../packages/expr/src/index.ts") },
      { find: /^@uicast\/core\/prompt$/, replacement: src("../packages/core/src/prompt/index.ts") },
      { find: /^@uicast\/core\/internal$/, replacement: src("../packages/core/src/internal.ts") },
      { find: /^@uicast\/core$/, replacement: src("../packages/core/src/index.ts") },
      { find: /^@uicast\/react$/, replacement: src("../packages/react/src/index.ts") },
      { find: /^@uicast\/shadcn-catalog$/, replacement: src("../packages/shadcn-catalog/src/index.ts") },
      {
        find: /^@uicast\/shadcn-catalog\/(\w+)\/(defs|impls)$/,
        replacement: src("../packages/shadcn-catalog/src/$1/$2.ts"),
      },
    ],
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
