export interface ToolBridge {
  getBuild(): unknown; searchComponents(input:any): unknown; inspectComponent(input:any): unknown;
  previewChange(input:any): unknown; applyChange(input:any): unknown; setGoals(input:any): unknown;
  setWorkloads(input:any): unknown; analyzeBuild(): unknown; optimizeBuild(): unknown; undoLastChange(): unknown;
}
export const TOOL_NAMES=["get_build","search_components","inspect_component","preview_build_change","apply_build_change","set_build_goals","set_workloads","analyze_build","optimize_build","undo_last_change"] as const;
const empty={type:"object",properties:{},additionalProperties:false};
const componentInput={type:"object",properties:{componentId:{type:"string"}},required:["componentId"],additionalProperties:false};
const changeInput={type:"object",properties:{componentId:{type:"string"},action:{type:"string",enum:["add","decrement","replace"]},quantity:{type:"integer",minimum:1,maximum:64}},required:["componentId","action"],additionalProperties:false};
const filterInput={type:"object",properties:{
  id:{type:"string"},control:{type:"string",enum:["ENUM","BOOLEAN","RANGE"]},
  values:{type:"array",items:{type:"string"}},value:{type:"boolean"},
  min:{type:"number"},max:{type:"number"},includeUnknown:{type:"boolean"},
},required:["id","control"],additionalProperties:false};
const searchInput={type:"object",properties:{
  query:{type:"string"},category:{type:"string"},filters:{type:"array",items:filterInput},
  compatibleOnly:{type:"boolean"},sort:{type:"string",enum:["RELEVANCE","NEWEST","NAME"]},
  limit:{type:"integer",minimum:1,maximum:100},offset:{type:"integer",minimum:0},
},additionalProperties:false};
export function createTools(b:ToolBridge){return [
 {name:"get_build",description:"Return the current HowToPC build, quantities, resource usage, and compatibility status.",inputSchema:empty,annotations:{readOnlyHint:true},execute:()=>b.getBuild()},
 {name:"search_components",description:"Search the public sourced PC catalog with facets, paging, and apply-now compatibility.",inputSchema:searchInput,annotations:{readOnlyHint:true},execute:(i:any)=>b.searchComponents(i)},
 {name:"inspect_component",description:"Inspect normalized public specifications for one component.",inputSchema:componentInput,annotations:{readOnlyHint:true},execute:(i:any)=>b.inspectComponent(i)},
 {name:"preview_build_change",description:"Preview add, decrement, or singleton replacement without committing it.",inputSchema:changeInput,annotations:{readOnlyHint:true},execute:(i:any)=>b.previewChange(i)},
 {name:"apply_build_change",description:"Apply a quantity-aware build change only when deterministic compatibility allows it.",inputSchema:changeInput,annotations:{readOnlyHint:false},execute:(i:any)=>b.applyChange(i)},
 {name:"set_build_goals",description:"Set optional build goals and notes.",inputSchema:{type:"object",properties:{notes:{type:"string"}},additionalProperties:false},annotations:{readOnlyHint:false},execute:(i:any)=>b.setGoals(i)},
 {name:"set_workloads",description:"Set workload labels for this build.",inputSchema:{type:"object",properties:{workloads:{type:"array",items:{type:"string"},maxItems:12}},required:["workloads"],additionalProperties:false},annotations:{readOnlyHint:false},execute:(i:any)=>b.setWorkloads(i)},
 {name:"analyze_build",description:"Run deterministic compatibility and resource analysis for the current build.",inputSchema:empty,annotations:{readOnlyHint:true},execute:()=>b.analyzeBuild()},
 {name:"optimize_build",description:"Report optimization availability for the current build.",inputSchema:empty,annotations:{readOnlyHint:true},execute:()=>b.optimizeBuild()},
 {name:"undo_last_change",description:"Undo the most recent committed agent build change.",inputSchema:empty,annotations:{readOnlyHint:false},execute:()=>b.undoLastChange()}
 ];}
