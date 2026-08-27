import type { ProductCategory, ProductIdentifier } from "@howtopc/domain";
import type { NormalizedProductObservation } from "../observation";

export type BuildCoresRejectionReason =
  | "INVALID_RECORD" | "MISSING_IDENTITY" | "MISSING_REQUIRED_FIELD"
  | "AMBIGUOUS_VALUE" | "SCHEMA_VALIDATION_FAILED" | "UNSUPPORTED_CATEGORY";
export type BuildCoresMappingResult =
  | { ok:true; observation:NormalizedProductObservation }
  | { ok:false; reason:BuildCoresRejectionReason; detail:string };
export type MemoryGeneration = "DDR1"|"DDR2"|"DDR3"|"DDR4"|"DDR5";

export const reject = (reason:BuildCoresRejectionReason, detail:string):BuildCoresMappingResult => ({ok:false,reason,detail});
export const rec = (value:unknown):Record<string,any>|null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string,any> : null;
export const text = (value:unknown):string|null => typeof value === "string" && value.trim() ? value.trim() : null;
export const finite = (value:unknown):number|null => typeof value === "number" && Number.isFinite(value) ? value : null;
export const integer = (value:unknown):number|null => { const n=finite(value); return n!==null && Number.isInteger(n) ? n : null; };
export const normalizeSocket = (value:unknown):string|null => text(value)?.replace(/^LGA\s+(\d+)$/i,"LGA$1") ?? null;
export const memoryType = (value:unknown):MemoryGeneration|null =>
  value === "DDR1" || value === "DDR2" || value === "DDR3" || value === "DDR4" || value === "DDR5" ? value : null;
export const sourcedReleaseYear = (value:unknown):number|undefined => {
  const year=integer(value); return year!==null && year>=1970 && year<=2100 ? year : undefined;
};
export function motherboardFormFactor(value:unknown):"MINI_ITX"|"MATX"|"ATX"|"EATX"|null {
  const n=text(value)?.toLowerCase().replace(/[-_]/g," ").replace(/\s+/g," ");
  if(n==="mini itx")return "MINI_ITX";
  if(n==="micro atx")return "MATX";
  if(n==="atx")return "ATX";
  if(n==="eatx"||n==="extended atx")return "EATX";
  return null;
}

export function psuFormFactor(value:unknown):"ATX"|"SFX"|"SFX_L"|null {
  const raw=text(value); if(!raw)return null;
  if(raw.toUpperCase()==="ATX/EPS")return "ATX";
  const n=raw.toUpperCase().replace(/[- ]/g,"_");
  return n==="ATX"||n==="SFX"||n==="SFX_L" ? n : null;
}

export function identifiers(raw:Record<string,any>):ProductIdentifier[] {
  const id=text(raw.opendb_id);
  const out:ProductIdentifier[]=id?[{type:"SOURCE_ID",value:id,sourceId:"buildcores-opendb"}]:[];
  const metadata=rec(raw.metadata);
  const parts=Array.isArray(metadata?.part_numbers)?metadata.part_numbers:[];
  for(const part of parts){const value=text(part);if(value)out.push({type:"MPN",value,sourceId:"buildcores-opendb"});}
  return out;
}
const sourceFolder:Record<ProductCategory,string>={
  CPU:"CPU",GPU:"GPU",MOTHERBOARD:"Motherboard",MEMORY:"RAM",CASE:"PCCase",PSU:"PSU",
  COOLER:"CPUCooler",FAN:"CaseFan",STORAGE:"Storage",NETWORK:"NetworkCard",HBA:"HBA",
};

export function base(category:ProductCategory,raw:Record<string,any>,specs:Record<string,unknown>):BuildCoresMappingResult {
  const id=text(raw.opendb_id),meta=rec(raw.metadata),name=text(meta?.name),manufacturer=text(meta?.manufacturer);
  if(!id||!name||!manufacturer)return reject("MISSING_IDENTITY","opendb_id, metadata.name, and metadata.manufacturer are required");
  return {ok:true,observation:{
    providerId:"buildcores-opendb",sourceRecordId:id,
    sourceRecordUrl:`https://github.com/buildcores/buildcores-open-db/blob/main/open-db/${sourceFolder[category]}/${id}.json`,
    manufacturer,displayName:name,category,identifiers:identifiers(raw),specs,
    manufacturerUrl:text(rec(raw.general_product_information)?.manufacturer_url)??undefined,
    series:text(meta?.series)??undefined,variant:text(meta?.variant)??undefined,
    releaseYear:sourcedReleaseYear(meta?.releaseYear),
  }};
}

export function validate(schema:{safeParse:(value:unknown)=>{success:boolean}},category:ProductCategory,raw:Record<string,any>,specs:Record<string,unknown>):BuildCoresMappingResult {
  if(!schema.safeParse(specs).success)return reject("SCHEMA_VALIDATION_FAILED",`${category} specs failed canonical schema validation`);
  return base(category,raw,specs);
}