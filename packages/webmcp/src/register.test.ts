import { afterEach, describe, expect, test, vi } from "vitest";
import { registerHowToPcTools, TOOL_NAMES, type ToolBridge } from "./index";

const f=vi.fn();
const bridge:ToolBridge={
  getState:f,catalogSearch:f,inspectProduct:f,
  addProduct:f,removeProduct:f,replaceProduct:f,
  compatibilityReport:f,resourceUsage:f,
  geometryDiagnostics:f,findCompatible:f,
};

function installContext(registerTool:(tool:any,options?:{signal?:AbortSignal})=>unknown) {
  Object.defineProperty(globalThis,"document",{
    configurable:true,value:{modelContext:{registerTool}},
  });
}

afterEach(()=>{
  Reflect.deleteProperty(globalThis,"document");
  vi.clearAllMocks();
});

describe("WebMCP registration",()=>{
  test("registers the complete tool set under one abort lifecycle",async()=>{
    const seen:string[]=[];
    let signal:AbortSignal|undefined;
    installContext((tool,options)=>{seen.push(tool.name);signal=options?.signal;});
    const controller=await registerHowToPcTools(bridge);
    expect(seen).toEqual([...TOOL_NAMES]);
    expect(signal?.aborted).toBe(false);
    controller?.abort();
    expect(signal?.aborted).toBe(true);
  });
  test("aborts partial registration when any tool is rejected",async()=>{
    let signal:AbortSignal|undefined;
    installContext((tool,options)=>{
      signal=options?.signal;
      if(tool.name==="builder_remove_product")return Promise.reject(new Error("duplicate"));
    });
    await expect(registerHowToPcTools(bridge)).rejects.toThrow("duplicate");
    expect(signal?.aborted).toBe(true);
  });
});
