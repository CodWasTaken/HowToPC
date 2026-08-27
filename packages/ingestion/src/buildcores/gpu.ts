import { gpuSpecSchema } from "@howtopc/catalog";
import { finite, integer, rec, reject, text, validate, type BuildCoresMappingResult } from "./common";

const GIB=1024**3;
function positiveCounts(value:unknown):Record<string,number> {
  const source=rec(value)??{},out:Record<string,number>={};
  for(const [key,raw] of Object.entries(source)){const count=integer(raw);if(count!==null&&count>0)out[key]=count;}
  return out;
}

export function mapGpu(raw:Record<string,any>):BuildCoresMappingResult {
  const length=finite(raw.length),slots=finite(raw.total_slot_width),tdp=finite(raw.tdp);
  if(length===null||length<=0||slots===null||slots<=0||tdp===null||tdp<0)
    return reject("MISSING_REQUIRED_FIELD","GPU length, slot width, and non-negative TDP are required");
  const sourceConnectors=rec(raw.power_connectors)??{},powerConnectors:Record<string,number>={};
  const add=(source:string,target:string)=>{const count=integer(sourceConnectors[source]);if(count!==null&&count>0)powerConnectors[target]=count;};
  add("pcie_6_pin","PCIE_6");add("pcie_8_pin","PCIE_8");add("pcie_12VHPWR","12VHPWR");add("pcie_12V_2x6","12V_2X6");
  const memory=finite(raw.memory),height=finite(raw.height),videoOutputs=positiveCounts(raw.video_outputs);
  const specs={schemaVersion:1 as const,lengthMm:length,...(height!==null&&height>0?{heightMm:height}:{}),slotWidth:slots,tdpWatts:tdp,powerConnectors,
    ...(text(raw.chipset_manufacturer)?{chipsetManufacturer:text(raw.chipset_manufacturer)!}:{}),...(text(raw.chipset)?{chipset:text(raw.chipset)!}:{}),
    ...(memory!==null&&memory>0?{vramBytes:memory*GIB}:{}),...(text(raw.memory_type)?{memoryType:text(raw.memory_type)!}:{}),
    ...(text(raw.interface)?{interface:text(raw.interface)!}:{}),...(Object.keys(videoOutputs).length?{videoOutputs}:{})};
  return validate(gpuSpecSchema,"GPU",raw,specs);
}