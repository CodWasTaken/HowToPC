export interface ToolBridge {
  getState(): unknown;
  catalogSearch(input:any,signal?:AbortSignal): unknown;
  inspectProduct(input:any,signal?:AbortSignal): unknown;
  addProduct(input:any,signal?:AbortSignal): unknown;
  removeProduct(input:any): unknown;
  replaceProduct(input:any,signal?:AbortSignal): unknown;
  compatibilityReport(): unknown;
  resourceUsage(): unknown;
  geometryDiagnostics(): unknown;
  findCompatible(input:any,signal?:AbortSignal): unknown;
}

export const TOOL_NAMES=[
  "builder_get_state","catalog_search","catalog_inspect_product",
  "builder_add_product","builder_remove_product","builder_replace_product",
  "builder_compatibility_report","builder_resource_usage",
  "builder_geometry_diagnostics","builder_find_compatible",
] as const;

const empty={type:"object",properties:{},additionalProperties:false};
const productInput={
  type:"object",
  properties:{productId:{type:"string",minLength:1,maxLength:200,description:"Canonical public catalog product ID."}},
  required:["productId"],additionalProperties:false,
};
const categories=["CPU","MOTHERBOARD","MEMORY","GPU","CASE","PSU","COOLER","STORAGE","NETWORK","FAN"];
const filterInput={type:"object",properties:{
  id:{type:"string",minLength:1,maxLength:100,description:"Facet ID returned by catalog search."},
  control:{type:"string",enum:["ENUM","BOOLEAN","RANGE"]},
  values:{type:"array",items:{type:"string",maxLength:120},maxItems:32},
  value:{type:"boolean"},min:{type:"number"},max:{type:"number"},includeUnknown:{type:"boolean"},
},required:["id","control"],additionalProperties:false};
const searchProperties={
  query:{type:"string",maxLength:200,description:"Optional product-name/manufacturer search text."},
  category:{type:"string",enum:categories,description:"Optional public hardware category."},
  filters:{type:"array",items:filterInput,maxItems:24,description:"Facets returned by a previous catalog search."},
  sort:{type:"string",enum:["RELEVANCE","NEWEST","NAME"]},
  limit:{type:"integer",minimum:1,maximum:100,default:12},
  offset:{type:"integer",minimum:0,default:0},
};
const searchInput={type:"object",properties:searchProperties,additionalProperties:false};
const compatibleInput={
  type:"object",properties:searchProperties,additionalProperties:false,
};
const ro={readOnlyHint:true,untrustedContentHint:false};
const catalogRo={readOnlyHint:true,untrustedContentHint:true};
const mut={readOnlyHint:false,untrustedContentHint:true};
export function createTools(b:ToolBridge){return [
  {name:"builder_get_state",title:"Get current PC build",description:"Read the exact current HowToPC build shared with the visible UI. Use this before planning changes or after a human edits the build.",inputSchema:empty,annotations:catalogRo,execute:()=>b.getState()},
  {name:"catalog_search",title:"Search hardware catalog",description:"Search the real public sourced hardware catalog with category facets and pagination. Use for discovery; compatibility state is reported against the current build.",inputSchema:searchInput,annotations:catalogRo,execute:(i:any,o?:{signal?:AbortSignal})=>b.catalogSearch(i,o?.signal)},
  {name:"catalog_inspect_product",title:"Inspect catalog product",description:"Inspect canonical specifications and provenance for one public catalog product ID before using it in a build.",inputSchema:productInput,annotations:catalogRo,execute:(i:any,o?:{signal?:AbortSignal})=>b.inspectProduct(i,o?.signal)},
  {name:"builder_add_product",title:"Add product to build",description:"Add one unit of a public catalog product, or increment a repeatable product, using the same deterministic compatibility rules as the UI. The change is not committed when safety is incompatible or unknown.",inputSchema:productInput,annotations:mut,execute:(i:any,o?:{signal?:AbortSignal})=>b.addProduct(i,o?.signal)},
  {name:"builder_remove_product",title:"Remove product from build",description:"Remove one unit of a product already in the current build. Repeatable products decrement by one; singleton products are removed.",inputSchema:productInput,annotations:mut,execute:(i:any)=>b.removeProduct(i)},
  {name:"builder_replace_product",title:"Replace singleton product",description:"Replace the existing singleton product in the same category with one public catalog product, using deterministic compatibility checks before commit.",inputSchema:productInput,annotations:mut,execute:(i:any,o?:{signal?:AbortSignal})=>b.replaceProduct(i,o?.signal)},
  {name:"builder_compatibility_report",title:"Check build compatibility",description:"Return the deterministic compatibility report for the exact current build, including compatible, incompatible, unknown, and incomplete findings.",inputSchema:empty,annotations:ro,execute:()=>b.compatibilityReport()},
  {name:"builder_resource_usage",title:"Inspect build resources",description:"Return current DIMM, memory, M.2, SATA, GPU PCIe, and general PCIe usage with known capacities where available.",inputSchema:empty,annotations:ro,execute:()=>b.resourceUsage()},
  {name:"builder_geometry_diagnostics",title:"Inspect twin geometry",description:"Return parametric digital-twin clearances, placement issues, collisions, and topology notes for the current build. Unknown topology stays explicit rather than guessed.",inputSchema:empty,annotations:catalogRo,execute:()=>b.geometryDiagnostics()},
  {name:"builder_find_compatible",title:"Find compatible hardware",description:"Search the entire public catalog for products that can be safely applied to the exact current build. Results with unknown or incompatible apply state are excluded.",inputSchema:compatibleInput,annotations:catalogRo,execute:(i:any,o?:{signal?:AbortSignal})=>b.findCompatible(i,o?.signal)},
];}
