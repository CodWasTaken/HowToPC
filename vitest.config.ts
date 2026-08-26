import { defineConfig } from "vitest/config";

const project = (name: string, root: string) => ({
  test: { name, root, environment: "node", include: ["**/*.test.ts"] },
});

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      project("domain", "./packages/domain"),
      project("db", "./packages/db"),
      project("catalog", "./packages/catalog"),
      project("compatibility", "./packages/compatibility"),
      project("geometry", "./packages/geometry"),
      project("webmcp", "./packages/webmcp"),
      project("web", "./apps/web"),
      project("shared", "./packages/shared")
    ]
  }
});
