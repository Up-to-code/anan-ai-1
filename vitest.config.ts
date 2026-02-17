import { defineConfig } from "vitest/config";

/**
 * Unit test workflow: run from repo root.
 * - npm run test / npm run test:once — all unit tests
 * - npm run test:debug — with Node inspector (--inspect-brk)
 * - npm run test:coverage — with coverage
 *
 * Convex tests use convex-test and import.meta.glob (see convex/import-meta.d.ts).
 */
export default defineConfig({
  test: {
    include: [
      "convex/**/*.test.{ts,tsx}",
      "admin/convex/**/*.test.{ts,tsx}",
      "web/__tests__/**/*.test.{ts,tsx}",
    ],
    environment: "node",
    globals: false,
    testTimeout: 30_000,
    hookTimeout: 10_000,
  },
});
