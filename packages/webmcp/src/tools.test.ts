import {describe,expect,test,vi} from "vitest";import {createTools,TOOL_NAMES} from "./index";
const f=vi.fn();const bridge={getBuild:f,searchComponents:f,inspectComponent:f,previewChange:f,applyChange:f,setGoals:f,setWorkloads:f,analyzeBuild:f,optimizeBuild:f,undoLastChange:f};
describe("WebMCP tools",()=>test("exposes the compact public tool set",()=>{const tools=createTools(bridge);expect(tools.map(t=>t.name)).toEqual([...TOOL_NAMES]);expect(tools.find(t=>t.name==="apply_build_change")?.annotations.readOnlyHint).toBe(false);}));
