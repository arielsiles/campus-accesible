// FR-605: Vitest configuration with coverage thresholds
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/index.ts",
        "src/**/*.d.ts",
      ],
      thresholds: {
        // FR-605: Per CLAUDE.md — >= 70% services, >= 50% global
        "src/services/**": {
          statements: 70,
          branches: 60,
          functions: 70,
          lines: 70,
        },
      },
    },
  },
});
