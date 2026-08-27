import { memorySpecSchema } from "@howtopc/catalog";
import { finite, integer, memoryType, rec, reject, text, validate, type BuildCoresMappingResult } from "./common";

const GIB=1024**3;
function memoryFormFactor(value:unknown):"DIMM"|"SO_DIMM"|undefined {
  const form=text(value); if(!form)return;
  if(/SO[- ]?DIMM/i.test(form))return "SO_DIMM";
  if(/DIMM/i.test(form))return "DIMM";
}

export function mapMemory(raw:Record<string,any>):BuildCoresMappingResult {
  const modules=rec(raw.modules),type=memoryType(raw.ram_type),count=integer(modules?.quantity),capacity=finite(modules?.capacity_gb);
  if(text(raw.ram_type)&&!type)return reject("AMBIGUOUS_VALUE",`Unsupported RAM generation: ${text(raw.ram_type)}`);
  if(raw.ecc!==undefined&&raw.ecc!==null&&raw.ecc!=="ECC"&&raw.ecc!=="Non-ECC")return reject("AMBIGUOUS_VALUE",`Unsupported RAM ECC value: ${String(raw.ecc)}`);
  const ecc=raw.ecc==="ECC"?true:raw.ecc==="Non-ECC"?false:null;
  if(!type||count===null||count<1||capacity===null||capacity<=0||ecc===null)
    return reject("MISSING_REQUIRED_FIELD","RAM generation, module count/capacity, and ECC state are required");
  const speed=integer(raw.speed),formFactor=memoryFormFactor(raw.form_factor),casLatency=finite(raw.cas_latency),timings=text(raw.timings);
  const specs={schemaVersion:1 as const,type,modules:count,moduleCapacityBytes:capacity*GIB,
    ...(speed!==null&&speed>0?{speedMt:speed}:{}),ecc,...(formFactor?{formFactor}:{}),
    ...(casLatency!==null&&casLatency>0?{casLatency}:{}),...(timings?{timings}:{})};
  return validate(memorySpecSchema,"MEMORY",raw,specs);
}