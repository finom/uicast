import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@uicast\/expr\/internal$/, replacement: resolve(import.meta.dirname, "../expr/src/internal.ts") },
      { find: /^@uicast\/expr$/, replacement: resolve(import.meta.dirname, "../expr/src/index.ts") },
      { find: /^@uicast\/expr-passthrough$/, replacement: resolve(import.meta.dirname, "./src/index.ts") },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    benchmark: { include: ["src/**/*.bench.ts"] },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/test/**"],
    },
  },
});
