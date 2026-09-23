import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@uicast\/core\/prompt$/,
        replacement: resolve(import.meta.dirname, "./src/prompt/index.ts"),
      },
      {
        find: /^@uicast\/expr\/internal$/,
        replacement: resolve(import.meta.dirname, "../expr/src/internal.ts"),
      },
      {
        find: /^@uicast\/expr$/,
        replacement: resolve(import.meta.dirname, "../expr/src/index.ts"),
      },
      {
        find: /^@uicast\/core$/,
        replacement: resolve(import.meta.dirname, "./src/index.ts"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}"],
    },
  },
});
