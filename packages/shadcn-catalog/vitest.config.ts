import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@uicast\/core\/prompt$/,
        replacement: resolve(__dirname, "../core/src/prompt/index.ts"),
      },
      {
        find: /^@uicast\/core\/internal$/,
        replacement: resolve(__dirname, "../core/src/internal.ts"),
      },
      {
        find: /^@uicast\/core$/,
        replacement: resolve(__dirname, "../core/src/index.ts"),
      },
      {
        find: /^@uicast\/react$/,
        replacement: resolve(__dirname, "../react/src/index.ts"),
      },
    ],
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
