import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@uicast\/expr\/internal$/,
        replacement: resolve(import.meta.dirname, "../expr/src/internal.ts"),
      },
      {
        find: /^@uicast\/expr$/,
        replacement: resolve(import.meta.dirname, "../expr/src/index.ts"),
      },
      {
        find: /^@uicast\/core\/prompt$/,
        replacement: resolve(import.meta.dirname, "../core/src/prompt/index.ts"),
      },
      {
        find: /^@uicast\/core\/internal$/,
        replacement: resolve(import.meta.dirname, "../core/src/internal.ts"),
      },
      {
        find: /^@uicast\/core$/,
        replacement: resolve(import.meta.dirname, "../core/src/index.ts"),
      },
      {
        find: /^@uicast\/react$/,
        replacement: resolve(import.meta.dirname, "../react/src/index.ts"),
      },
    ],
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
