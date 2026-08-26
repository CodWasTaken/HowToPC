export interface ToolBridge {
  getBuild(): unknown; searchComponents(input:any): unknown; inspectComponent(input:any): unknown;
  previewChange(input:any): unknown; applyChange(input:any): unknown; setGoals(input:any): unknown;
  setWorkloads(input:any): unknown; analyzeBuild(): unknown; optimizeBuild(): unknown; undoLastChange(): unknown;
}
export const TOOL_NAMES=["get_build","search_components","inspect_component","preview_build_change","apply_build_change","set_build_goals","set_workloads","analyze_build","optimize_build","undo_last_change"] as const;
const empty={type:"object",properties:{},additionalProperties:false};
const componentInput={type:"object",properties:{componentId:{type:"string"}},required:["componentId"],additionalProperties:false};
export function createTools(b:ToolBridge){return [
 {name:"get_build",description:"Return the current HowToPC build and compatibility status.",inputSchema:empty,annotations:{readOnlyHint:true},execute:()=>b.getBuild()},
 {name:"search_components",description:"Search the curated PC component catalog.",inputSchema:{type:"object",properties:{query:{type:"string"},category:{type:"string"}},additionalProperties:false},annotations:{readOnlyHint:true},execute:(i:any)=>b.searchComponents(i)},
 {name:"inspect_component",description:"Inspect normalized specifications for one component.",inputSchema:componentInput,annotations:{readOnlyHint:true},execute:(i:any)=>b.inspectComponent(i)},
 {name:"preview_build_change",description:"Preview a component replacement without committing it.",inputSchema:componentInput,annotations:{readOnlyHint:true},execute:(i:any)=>b.previewChange(i)},
 {name:"apply_build_change",description:"Apply a replacement only when deterministic compatibility allows it.",inputSchema:componentInput,annotations:{readOnlyHint:false},execute:(i:any)=>b.applyChange(i)},
 {name:"set_build_goals",description:"Set optional maximum budget and notes.",inputSchema:{type:"object",properties:{maxBudgetEur:{type:"number",minimum:0},notes:{type:"string"}},additionalProperties:false},annotations:{readOnlyHint:false},execute:(i:any)=>b.setGoals(i)},
 {name:"set_workloads",description:"Set workload labels for this build.",inputSchema:{type:"object",properties:{workloads:{type:"array",items:{type:"string"},maxItems:12}},required:["workloads"],additionalProperties:false},annotations:{readOnlyHint:false},execute:(i:any)=>b.setWorkloads(i)},
 {name:"analyze_build",description:"Run deterministic compatibility analysis for the current build.",inputSchema:empty,annotations:{readOnlyHint:true},execute:()=>b.analyzeBuild()},
 {name:"optimize_build",description:"Find the largest cheaper compatible single-part substitution.",inputSchema:empty,annotations:{readOnlyHint:true},execute:()=>b.optimizeBuild()},
 {name:"undo_last_change",description:"Undo the most recent committed agent build change.",inputSchema:empty,annotations:{readOnlyHint:false},execute:()=>b.undoLastChange()}
 ];}
