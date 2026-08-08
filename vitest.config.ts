import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    exclude: process.env.RUN_DB_TESTS
      ? ["**/node_modules/**"]
      : ["**/node_modules/**", "**/*.integration.test.ts"],
  },
});
