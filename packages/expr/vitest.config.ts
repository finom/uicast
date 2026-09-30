import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // The fuzz test sits in test/: Scorecard skips files under src/test/ when it looks for one.
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    benchmark: { include: ["src/**/*.bench.ts"] },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/test/**"],
    },
  },
});
