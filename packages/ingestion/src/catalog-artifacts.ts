import type { ReferenceProduct } from "@howtopc/catalog";
import type { ProductCategory } from "@howtopc/domain";
import { mapBuildCoresProductDetailed } from "./buildcores";
import type { BuildCoresRejectionReason } from "./buildcores/common";
import { toCatalogSeedProduct } from "./materialize";

export const BUILDCORES_SOURCE_CATEGORIES=[
  "CPU","Motherboard","RAM","GPU","Storage","PSU","PCCase","CPUCooler","CaseFan","NetworkCard",
] as const;
export type BuildCoresSourceCategory=typeof BUILDCORES_SOURCE_CATEGORIES[number];

export const GENERATED_CATALOG_CATEGORIES=[
  "CPU","MOTHERBOARD","MEMORY","GPU","STORAGE","PSU","CASE","COOLER","FAN","NETWORK",
] as const satisfies readonly ProductCategory[];
export type GeneratedCatalogCategory=typeof GENERATED_CATALOG_CATEGORIES[number];

export interface BuildCoresCatalogInputRecord {
  sourceCategory:BuildCoresSourceCategory;
  raw:unknown;
}
export interface GenerateCatalogArtifactsOptions { sourceCommit:string; }

type FacetFieldKind="ENUM"|"NUMBER"|"ENUM_KEYS";
interface FacetFieldDefinition { path:string; kind:FacetFieldKind; }
export type FacetSummaryEntry=
  | {kind:"ENUM";known:number;values:(string|boolean)[]}
  | {kind:"NUMBER";known:number;min:number|null;max:number|null};
const fields=(...definitions:[string,FacetFieldKind][]):FacetFieldDefinition[]=>definitions.map(([path,kind])=>({path,kind}));
const FACET_FIELDS:Record<GeneratedCatalogCategory,FacetFieldDefinition[]>={
  CPU:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.socket","ENUM"],["specs.family","ENUM"],
    ["specs.cores","NUMBER"],["specs.threads","NUMBER"],["specs.integratedGraphics","ENUM"],
    ["specs.tdpWatts","NUMBER"],["specs.unlocked","ENUM"],
  ),
  MOTHERBOARD:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.socket","ENUM"],["specs.chipset","ENUM"],
    ["specs.formFactor","ENUM"],["specs.memoryType","ENUM"],["specs.dimmSlots","NUMBER"],
    ["specs.maxMemoryBytes","NUMBER"],["specs.pcieSlots","NUMBER"],["specs.m2Slots","NUMBER"],
    ["specs.sataPorts","NUMBER"],["specs.wireless","ENUM"],["specs.ethernetSpeedMbps","NUMBER"],
    ["specs.eccSupport","ENUM"],
  ),
  MEMORY:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.type","ENUM"],["specs.modules","NUMBER"],
    ["specs.moduleCapacityBytes","NUMBER"],["specs.speedMt","NUMBER"],["specs.ecc","ENUM"],
    ["specs.formFactor","ENUM"],["specs.casLatency","NUMBER"],["specs.timings","ENUM"],
  ),  GPU:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.chipsetManufacturer","ENUM"],
    ["specs.chipset","ENUM"],["specs.vramBytes","NUMBER"],["specs.memoryType","ENUM"],
    ["specs.lengthMm","NUMBER"],["specs.slotWidth","NUMBER"],["specs.tdpWatts","NUMBER"],
    ["specs.interface","ENUM"],["specs.powerConnectors","ENUM_KEYS"],["specs.videoOutputs","ENUM_KEYS"],
  ),
  STORAGE:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.storageType","ENUM"],["specs.interface","ENUM"],
    ["specs.formFactor","ENUM"],["specs.capacityBytes","NUMBER"],["specs.pcieGeneration","NUMBER"],
    ["specs.sequentialReadMbps","NUMBER"],["specs.sequentialWriteMbps","NUMBER"],["specs.enduranceTbw","NUMBER"],
    ["specs.rpm","NUMBER"],["specs.cacheBytes","NUMBER"],
  ),
  PSU:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.wattage","NUMBER"],["specs.formFactor","ENUM"],
    ["specs.efficiencyRating","ENUM"],["specs.modularity","ENUM"],["specs.connectors","ENUM_KEYS"],
    ["specs.lengthMm","NUMBER"],["specs.fanless","ENUM"],
  ),
  CASE:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.supportedMotherboardFormFactors","ENUM"],
    ["specs.maxGpuLengthMm","NUMBER"],["specs.maxCpuCoolerHeightMm","NUMBER"],["specs.psuFormFactors","ENUM"],
    ["specs.internal25Bays","NUMBER"],["specs.internal35Bays","NUMBER"],["specs.expansionSlots","NUMBER"],
    ["specs.sidePanel","ENUM"],
  ),  COOLER:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.type","ENUM"],["specs.supportedSockets","ENUM"],
    ["specs.heightMm","NUMBER"],["specs.radiatorSizeMm","NUMBER"],["specs.fanSizeMm","NUMBER"],
    ["specs.fanQuantity","NUMBER"],["specs.minRpm","NUMBER"],["specs.maxRpm","NUMBER"],
    ["specs.minNoiseDb","NUMBER"],["specs.maxNoiseDb","NUMBER"],["specs.fanless","ENUM"],
  ),
  FAN:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.sizeMm","NUMBER"],["specs.connector","ENUM"],
    ["specs.quantity","NUMBER"],["specs.minAirflowCfm","NUMBER"],["specs.maxAirflowCfm","NUMBER"],
    ["specs.minNoiseDb","NUMBER"],["specs.maxNoiseDb","NUMBER"],["specs.staticPressureMmH2o","NUMBER"],
    ["specs.pwm","ENUM"],["specs.flowDirection","ENUM"],
  ),
  NETWORK:fields(
    ["manufacturer","ENUM"],["releaseYear","NUMBER"],["specs.interface","ENUM"],["specs.speedMbps","NUMBER"],
    ["specs.ports","NUMBER"],["specs.wireless","ENUM"],["specs.standard","ENUM"],
  ),
};

const REJECTION_REASONS:BuildCoresRejectionReason[]=[
  "INVALID_RECORD","MISSING_IDENTITY","MISSING_REQUIRED_FIELD","AMBIGUOUS_VALUE",
  "SCHEMA_VALIDATION_FAILED","UNSUPPORTED_CATEGORY",
];
const generatedCategorySet=new Set<string>(GENERATED_CATALOG_CATEGORIES);
export interface ImportReport {
  sourceCommit:string;
  totals:{total:number;accepted:number;rejected:number};
  rejectionReasons:Partial<Record<BuildCoresRejectionReason,number>>;
  sourceCategories:Record<BuildCoresSourceCategory,{total:number;accepted:number;rejected:number;rejectionReasons:Partial<Record<BuildCoresRejectionReason,number>>}>;
  acceptedByCanonicalCategory:Record<GeneratedCatalogCategory,number>;
  facetCoverage:Record<GeneratedCatalogCategory,Record<string,{known:number;missing:number}>>;
}
export interface CatalogArtifacts {
  shards:Record<GeneratedCatalogCategory,ReferenceProduct[]>;
  idIndex:Record<string,GeneratedCatalogCategory>;
  importReport:ImportReport;
  facetSummary:Record<GeneratedCatalogCategory,Record<string,FacetSummaryEntry>>;
}

function orderedRecord<K extends string,V>(keys:readonly K[],factory:(key:K)=>V):Record<K,V> {
  return Object.fromEntries(keys.map((key)=>[key,factory(key)])) as Record<K,V>;
}
function compareText(a:string,b:string):number { return a===b?0:a<b?-1:1; }
function compareProducts(a:ReferenceProduct,b:ReferenceProduct):number {
  return compareText(a.manufacturer,b.manufacturer)||compareText(a.displayName,b.displayName)||compareText(a.id,b.id);
}
function valueAt(product:ReferenceProduct,path:string):unknown {
  if(path==="manufacturer")return product.manufacturer;
  if(path==="releaseYear")return product.releaseYear;
  let value:unknown=product;
  for(const part of path.split(".")){
    if(!value||typeof value!=="object"||Array.isArray(value))return undefined;
    value=(value as Record<string,unknown>)[part];
  }
  return value;
}
function enumValues(value:unknown,kind:FacetFieldKind):(string|boolean)[] {
  if(kind==="ENUM_KEYS"){
    if(!value||typeof value!=="object"||Array.isArray(value))return [];
    return Object.entries(value as Record<string,unknown>)
      .filter(([,entry])=>typeof entry!=="number"||entry>0)
      .map(([key])=>key);
  }
  const values=Array.isArray(value)?value:[value];
  return values.filter((entry):entry is string|boolean=>typeof entry==="string"||typeof entry==="boolean");
}
function sortEnumValues(values:(string|boolean)[]):(string|boolean)[] {
  const unique=new Map<string,string|boolean>();
  for(const value of values)unique.set(`${typeof value}:${String(value)}`,value);
  return [...unique.values()].sort((a,b)=>compareText(`${typeof a}:${String(a)}`,`${typeof b}:${String(b)}`));
}
function summarizeFacet(products:readonly ReferenceProduct[],definition:FacetFieldDefinition):FacetSummaryEntry {
  if(definition.kind==="NUMBER"){
    const values=products.map((product)=>valueAt(product,definition.path))
      .filter((value):value is number=>typeof value==="number"&&Number.isFinite(value));
    return {kind:"NUMBER",known:values.length,min:values.length?Math.min(...values):null,max:values.length?Math.max(...values):null};
  }
  let known=0; const values:(string|boolean)[]=[];
  for(const product of products){const extracted=enumValues(valueAt(product,definition.path),definition.kind);if(extracted.length){known+=1;values.push(...extracted);}}
  return {kind:"ENUM",known,values:sortEnumValues(values)};
}
function isGeneratedCategory(category:ProductCategory):category is GeneratedCatalogCategory {
  return generatedCategorySet.has(category);
}function zeroRejectionReasons():Record<BuildCoresRejectionReason,number> {
  return Object.fromEntries(REJECTION_REASONS.map((reason)=>[reason,0])) as Record<BuildCoresRejectionReason,number>;
}
function compactRejectionReasons(counts:Record<BuildCoresRejectionReason,number>):Partial<Record<BuildCoresRejectionReason,number>> {
  const result:Partial<Record<BuildCoresRejectionReason,number>>={};
  for(const reason of REJECTION_REASONS){if(counts[reason]>0)result[reason]=counts[reason];}
  return result;
}

type MutableSourceStats={
  total:number;accepted:number;rejected:number;
  rejectionReasons:Record<BuildCoresRejectionReason,number>;
};

export function generateCatalogArtifacts(
  records:readonly BuildCoresCatalogInputRecord[],
  options:GenerateCatalogArtifactsOptions,
):CatalogArtifacts {
  const shards=orderedRecord(GENERATED_CATALOG_CATEGORIES,()=>[] as ReferenceProduct[]);
  const sourceStats=orderedRecord<BuildCoresSourceCategory,MutableSourceStats>(BUILDCORES_SOURCE_CATEGORIES,()=>({
    total:0,accepted:0,rejected:0,rejectionReasons:zeroRejectionReasons(),
  }));
  const acceptedByCanonicalCategory=orderedRecord(GENERATED_CATALOG_CATEGORIES,()=>0);
  const rejectionReasons=zeroRejectionReasons();
  const totals={total:0,accepted:0,rejected:0};
  const seenIds=new Set<string>();
  for(const record of records){
    const source=sourceStats[record.sourceCategory];
    source.total+=1;totals.total+=1;
    const mapped=mapBuildCoresProductDetailed(record.sourceCategory,record.raw);
    if(!mapped.ok){
      source.rejected+=1;totals.rejected+=1;
      source.rejectionReasons[mapped.reason]+=1;
      rejectionReasons[mapped.reason]+=1;
      continue;
    }
    if(!isGeneratedCategory(mapped.observation.category)){
      throw new Error(`Unsupported generated catalog category: ${mapped.observation.category}`);
    }
    const product=toCatalogSeedProduct(mapped.observation);
    if(seenIds.has(product.id))throw new Error(`Duplicate catalog product id: ${product.id}`);
    seenIds.add(product.id);
    shards[mapped.observation.category].push(product);
    source.accepted+=1;totals.accepted+=1;
    acceptedByCanonicalCategory[mapped.observation.category]+=1;
  }

  for(const category of GENERATED_CATALOG_CATEGORIES)shards[category].sort(compareProducts);
  const idEntries=GENERATED_CATALOG_CATEGORIES.flatMap((category)=>
    shards[category].map((product)=>[product.id,category] as const),
  ).sort(([left],[right])=>compareText(left,right));
  const idIndex=Object.fromEntries(idEntries) as Record<string,GeneratedCatalogCategory>;
  const facetSummary=orderedRecord(GENERATED_CATALOG_CATEGORIES,(category)=>
    Object.fromEntries(FACET_FIELDS[category].map((definition)=>[
      definition.path,summarizeFacet(shards[category],definition),
    ])),
  ) as Record<GeneratedCatalogCategory,Record<string,FacetSummaryEntry>>;
  const facetCoverage=orderedRecord(GENERATED_CATALOG_CATEGORIES,(category)=>
    Object.fromEntries(FACET_FIELDS[category].map((definition)=>{
      const known=facetSummary[category][definition.path].known;
      return [definition.path,{known,missing:shards[category].length-known}];
    })),
  ) as ImportReport["facetCoverage"];
  const sourceCategories=orderedRecord(BUILDCORES_SOURCE_CATEGORIES,(category)=>({
    total:sourceStats[category].total,
    accepted:sourceStats[category].accepted,
    rejected:sourceStats[category].rejected,
    rejectionReasons:compactRejectionReasons(sourceStats[category].rejectionReasons),
  }));

  return {
    shards,idIndex,
    importReport:{
      sourceCommit:options.sourceCommit,totals,
      rejectionReasons:compactRejectionReasons(rejectionReasons),
      sourceCategories,acceptedByCanonicalCategory,facetCoverage,
    },
    facetSummary,
  };
}
