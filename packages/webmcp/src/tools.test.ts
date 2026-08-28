import { describe, expect, test, vi } from "vitest";
import { createTools, TOOL_NAMES } from "./index";

const f = vi.fn();
const bridge = {
  getState:f, catalogSearch:f, inspectProduct:f,
  addProduct:f, removeProduct:f, replaceProduct:f,
  compatibilityReport:f, resourceUsage:f,
  geometryDiagnostics:f, findCompatible:f,
};

const expectedNames = [
  "builder_get_state",
  "catalog_search",
  "catalog_inspect_product",
  "builder_add_product",
  "builder_remove_product",
  "builder_replace_product",
  "builder_compatibility_report",
  "builder_resource_usage",
  "builder_geometry_diagnostics",
  "builder_find_compatible",
] as const;

describe("WebMCP production tools", () => {
  test("exposes the approved ten-tool contract", () => {
    const tools = createTools(bridge);
    expect(TOOL_NAMES).toEqual(expectedNames);
    expect(tools.map((tool) => tool.name)).toEqual(expectedNames);
    expect(tools.every((tool) => Boolean(tool.title))).toBe(true);
  });
  test("marks reads and mutations accurately", () => {
    const tools = createTools(bridge);
    const byName = new Map(tools.map((tool) => [tool.name, tool]));
    for (const name of [
      "builder_add_product",
      "builder_remove_product",
      "builder_replace_product",
    ]) expect(byName.get(name)?.annotations.readOnlyHint).toBe(false);
    for (const name of expectedNames.filter((name) => !name.match(/builder_(add|remove|replace)_product/))) {
      expect(byName.get(name)?.annotations.readOnlyHint).toBe(true);
    }
    for (const name of [
      "builder_get_state","catalog_search","catalog_inspect_product",
      "builder_add_product","builder_remove_product","builder_replace_product",
      "builder_geometry_diagnostics","builder_find_compatible",
    ]) expect(byName.get(name)?.annotations.untrustedContentHint).toBe(true);
    expect(byName.get("builder_compatibility_report")?.annotations.untrustedContentHint).toBe(false);
    expect(byName.get("builder_resource_usage")?.annotations.untrustedContentHint).toBe(false);
  });

  test("keeps mutations single-step and product-id based", () => {
    const tools = createTools(bridge);
    for (const name of ["builder_add_product", "builder_remove_product", "builder_replace_product"] as const) {
      const schema = tools.find((tool) => tool.name === name)?.inputSchema as any;
      expect(schema.required).toEqual(["productId"]);
      expect(Object.keys(schema.properties)).toEqual(["productId"]);
      expect(schema.properties.productId).toMatchObject({ type: "string", minLength: 1 });
    }
  });
  test("offers bounded catalog discovery schemas without build-state inputs", () => {
    const tools = createTools(bridge);
    const search = tools.find((tool) => tool.name === "catalog_search")?.inputSchema as any;
    const compatible = tools.find((tool) => tool.name === "builder_find_compatible")?.inputSchema as any;
    expect(Object.keys(search.properties)).toEqual(expect.arrayContaining([
      "query", "category", "filters", "sort", "limit", "offset",
    ]));
    expect(search.properties).not.toHaveProperty("buildLines");
    expect(search.properties.limit).toMatchObject({ type: "integer", minimum: 1, maximum: 100 });
    expect(compatible.properties).not.toHaveProperty("compatibleOnly");
    expect(compatible.properties).not.toHaveProperty("buildLines");
  });
});
