import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@ui-fired\/core\/prompt$/,
        replacement: resolve(__dirname, "../core/src/prompt/index.ts"),
      },
      {
        find: /^@ui-fired\/core$/,
        replacement: resolve(__dirname, "../core/src/index.ts"),
      },
      {
        find: /^@ui-fired\/react$/,
        replacement: resolve(__dirname, "./src/index.ts"),
      },
      {
        find: /^@ui-fired\/react\/(.*)$/,
        replacement: resolve(__dirname, "./src/$1"),
      },
    ],
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/index.ts"],
    },
  },
});
