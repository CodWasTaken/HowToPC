import { describe, expect, test, vi } from "vitest";
import { createTools, TOOL_NAMES } from "./index";

const f = vi.fn();
const bridge = { getBuild:f,searchComponents:f,inspectComponent:f,previewChange:f,applyChange:f,setGoals:f,setWorkloads:f,analyzeBuild:f,optimizeBuild:f,undoLastChange:f };

describe("WebMCP tools", () => {
  test("exposes the compact public tool set", () => {
    const tools = createTools(bridge);
    expect(tools.map((tool) => tool.name)).toEqual([...TOOL_NAMES]);
    expect(tools.find((tool) => tool.name === "apply_build_change")?.annotations.readOnlyHint).toBe(false);
  });

  test("build changes carry explicit quantity-aware actions", () => {
    const tool = createTools(bridge).find((item) => item.name === "apply_build_change")!;
    const schema = tool.inputSchema as any;
    expect(schema.required).toEqual(["componentId", "action"]);
    expect(schema.properties.action.enum).toEqual(["add", "decrement", "replace"]);
    expect(schema.properties.quantity).toMatchObject({ type: "integer", minimum: 1, maximum: 64 });
  });
});


test("search components exposes public facet and paging inputs read-only",()=>{
  const tool=createTools(bridge).find((item)=>item.name==="search_components")!;
  const schema=tool.inputSchema as any;
  expect(Object.keys(schema.properties)).toEqual(expect.arrayContaining([
    "query","category","filters","compatibleOnly","sort","limit","offset",
  ]));
  expect(schema.properties.filters).toMatchObject({type:"array"});
  expect(schema.properties.limit).toMatchObject({type:"integer",minimum:1,maximum:100});
  expect(schema.properties.offset).toMatchObject({type:"integer",minimum:0});
  expect(tool.annotations.readOnlyHint).toBe(true);
});
