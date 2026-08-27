import { rec, reject, type BuildCoresMappingResult } from "./buildcores/common";
import { mapCpu } from "./buildcores/cpu";
import { mapMotherboard } from "./buildcores/motherboard";
import { mapMemory } from "./buildcores/memory";
import { mapGpu } from "./buildcores/gpu";
import { mapStorage } from "./buildcores/storage";
import { mapPsu } from "./buildcores/psu";
import { mapCase } from "./buildcores/case";
import { mapCooler } from "./buildcores/cooler";
import { mapFan } from "./buildcores/fan";
import { mapNetwork } from "./buildcores/network";
import type { NormalizedProductObservation } from "./observation";

const mappers:Record<string,(raw:Record<string,any>)=>BuildCoresMappingResult>={CPU:mapCpu,Motherboard:mapMotherboard,RAM:mapMemory,GPU:mapGpu,Storage:mapStorage,PSU:mapPsu,PCCase:mapCase,CPUCooler:mapCooler,CaseFan:mapFan,NetworkCard:mapNetwork};
export type { BuildCoresMappingResult, BuildCoresRejectionReason } from "./buildcores/common";
export function mapBuildCoresProductDetailed(category:string,value:unknown):BuildCoresMappingResult {const raw=rec(value);if(!raw)return reject("INVALID_RECORD","BuildCores record must be an object");const mapper=mappers[category];if(!mapper)return reject("UNSUPPORTED_CATEGORY",`Unsupported BuildCores category: ${category}`);return mapper(raw);}
export function mapBuildCoresProduct(category:string,value:unknown):NormalizedProductObservation|null {const result=mapBuildCoresProductDetailed(category,value);return result.ok?result.observation:null;}
