import {
  facetDefinitionsForCategory,
  type FacetSelection,
  type ProductCategory,
} from "@howtopc/catalog";
import type { BuildLine } from "@howtopc/compatibility";
import type {
  CatalogSearchRequest,
  CatalogSort,
} from "../../../../lib/catalog-search-contract";
import { searchCatalog } from "../../../../lib/server/catalog-search";

export const runtime="nodejs";

const categories=new Set<ProductCategory>([
  "CPU","GPU","MOTHERBOARD","MEMORY","CASE","PSU",
  "COOLER","FAN","STORAGE","NETWORK","HBA",
]);
const sorts=new Set<CatalogSort>(["RELEVANCE","NEWEST","NAME"]);

class ValidationError extends Error {}
function fail(message:string):never { throw new ValidationError(message); }
const isRecord=(value:unknown):value is Record<string,unknown>=>
  value!==null&&typeof value==="object"&&!Array.isArray(value);

function exactKeys(value:Record<string,unknown>,allowed:readonly string[]):void {
  const allow=new Set(allowed);
  const extra=Object.keys(value).find((key)=>!allow.has(key));
  if(extra)fail(`Unexpected field: ${extra}`);
}

function parseIncludeUnknown(value:unknown):boolean|undefined {
  if(value===undefined)return undefined;
  if(typeof value!=="boolean")fail("includeUnknown must be boolean.");
  return value;
}

function parseFacet(value:unknown):FacetSelection {
  if(!isRecord(value))fail("Each filter must be an object.");
  const id=value.id;
  const control=value.control;
  if(typeof id!=="string"||!id.trim())fail("Facet id must be non-empty.");
  if(control==="ENUM"){
    exactKeys(value,["id","control","values","includeUnknown"]);
    if(!Array.isArray(value.values)||!value.values.every((item)=>typeof item==="string")){
      fail(`ENUM facet ${id} requires string values.`);
    }
    return {id,control,values:value.values,includeUnknown:parseIncludeUnknown(value.includeUnknown)};
  }
  if(control==="BOOLEAN"){
    exactKeys(value,["id","control","value","includeUnknown"]);
    if(typeof value.value!=="boolean")fail(`BOOLEAN facet ${id} requires a boolean value.`);
    return {id,control,value:value.value,includeUnknown:parseIncludeUnknown(value.includeUnknown)};
  }
  if(control==="RANGE"){
    exactKeys(value,["id","control","min","max","includeUnknown"]);
    const min=value.min,max=value.max;
    if(min!==undefined&&(typeof min!=="number"||!Number.isFinite(min)))fail(`RANGE facet ${id} has invalid min.`);
    if(max!==undefined&&(typeof max!=="number"||!Number.isFinite(max)))fail(`RANGE facet ${id} has invalid max.`);
    if(typeof min==="number"&&typeof max==="number"&&min>max)fail(`RANGE facet ${id} has min above max.`);
    return {id,control,min:min as number|undefined,max:max as number|undefined,includeUnknown:parseIncludeUnknown(value.includeUnknown)};
  }
  return fail(`Unsupported facet control for ${id}.`);
}

function parseBuildLines(value:unknown):BuildLine[] {
  if(!Array.isArray(value))fail("buildLines must be an array.");
  return value.map((entry)=>{
    if(!isRecord(entry))fail("Each build line must be an object.");
    exactKeys(entry,["productId","quantity"]);
    if(typeof entry.productId!=="string"||!entry.productId.trim())fail("productId must be non-empty.");
    if(!Number.isSafeInteger(entry.quantity)||Number(entry.quantity)<=0)fail(`Invalid quantity for ${entry.productId}.`);
    return {productId:entry.productId,quantity:Number(entry.quantity)};
  });
}

export function parseCatalogSearchRequest(value:unknown):CatalogSearchRequest {
  if(!isRecord(value))fail("Request body must be an object.");
  exactKeys(value,[
    "query","category","filters","compatibleOnly","sort","limit","offset","buildLines",
  ]);
  if(value.query!==undefined&&typeof value.query!=="string")fail("query must be a string.");
  const category=value.category;
  if(category!==undefined&&(typeof category!=="string"||!categories.has(category as ProductCategory))){
    fail("Invalid catalog category.");
  }
  if(!Array.isArray(value.filters))fail("filters must be an array.");
  const filters=value.filters.map(parseFacet);
  if(filters.length>0&&category===undefined)fail("Facet filters require a category.");
  if(typeof value.compatibleOnly!=="boolean")fail("compatibleOnly must be boolean.");
  if(typeof value.sort!=="string"||!sorts.has(value.sort as CatalogSort))fail("Invalid sort mode.");
  if(!Number.isSafeInteger(value.limit)||Number(value.limit)<=0)fail("limit must be a positive integer.");
  if(!Number.isSafeInteger(value.offset)||Number(value.offset)<0)fail("offset must be a non-negative integer.");
  const buildLines=parseBuildLines(value.buildLines);
  const typedCategory=category as ProductCategory|undefined;
  if(typedCategory){
    const definitions=new Map(
      facetDefinitionsForCategory(typedCategory).map((definition)=>[definition.id,definition]),
    );
    for(const filter of filters){
      const definition=definitions.get(filter.id);
      if(!definition)fail(`Unknown facet for ${typedCategory}: ${filter.id}`);
      if(definition.control!==filter.control)fail(`Facet control mismatch for ${filter.id}.`);
    }
  }
  return {
    query:value.query as string|undefined,
    category:typedCategory,
    filters,
    compatibleOnly:value.compatibleOnly,
    sort:value.sort as CatalogSort,
    limit:Number(value.limit),
    offset:Number(value.offset),
    buildLines,
  };
}

export async function POST(request:Request):Promise<Response> {
  try{
    const input=parseCatalogSearchRequest(await request.json());
    return Response.json(await searchCatalog(input));
  }catch(error){
    if(error instanceof ValidationError||error instanceof TypeError||
      (error instanceof Error&&error.message.startsWith("Unknown catalog product:"))){
      return Response.json({error:error.message},{status:400});
    }
    return Response.json({error:"Catalog search failed."},{status:500});
  }
}
