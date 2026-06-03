import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      // Bare barrel (`@ui-fired/core`) must precede the subpath rule so it
      // resolves to the package index, not `src/` + empty capture.
      {
        find: /^@ui-fired\/core$/,
        replacement: resolve(__dirname, "./src/index.ts"),
      },
      {
        find: /^@ui-fired\/core\/(.*)$/,
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
