import { createTools,type ToolBridge } from "./tools";
type ModelContext={registerTool(tool:unknown,options?:{signal?:AbortSignal}):Promise<void>|void};
export function getModelContext():ModelContext|null {
 if(typeof document==="undefined") return null;
 return ((document as Document & {modelContext?:ModelContext}).modelContext)??null;
}
export async function registerHowToPcTools(bridge:ToolBridge){
 const context=getModelContext(); if(!context)return null;
 const controller=new AbortController();
 await Promise.all(createTools(bridge).map(tool=>context.registerTool(tool,{signal:controller.signal})));
 return controller;
}
