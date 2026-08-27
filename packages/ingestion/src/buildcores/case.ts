import { caseSpecSchema } from "@howtopc/catalog";
import { finite, integer, motherboardFormFactor, psuFormFactor, rec, reject, text, validate, type BuildCoresMappingResult } from "./common";

export function mapCase(raw:Record<string,any>):BuildCoresMappingResult {
  const supported=Array.isArray(raw.supported_motherboard_form_factors)
    ? raw.supported_motherboard_form_factors.map(motherboardFormFactor).filter((value):value is "MINI_ITX"|"MATX"|"ATX"|"EATX"=>value!==null)
    : [];
  const maxGpu=finite(raw.max_video_card_length),maxCooler=finite(raw.max_cpu_cooler_height);
  if(!supported.length||maxGpu===null||maxGpu<=0||maxCooler===null||maxCooler<=0)
    return reject("MISSING_REQUIRED_FIELD","Case motherboard support, GPU clearance, and cooler clearance are required");
  const psuForms=Array.isArray(raw.supported_power_supply_form_factors)
    ? [...new Set(raw.supported_power_supply_form_factors.map(psuFormFactor).filter((value):value is "ATX"|"SFX"|"SFX_L"=>value!==null))]
    : [];
  const dimensions=rec(raw.dimensions_mm),width=finite(dimensions?.width),height=finite(dimensions?.height),depth=finite(dimensions?.depth);
  const dimensionsMm={
    ...(width!==null&&width>0?{width}:{}),...(height!==null&&height>0?{height}:{}),...(depth!==null&&depth>0?{depth}:{}),
  };
  const bays25=integer(raw.internal_2_5_bays),bays35=integer(raw.internal_3_5_bays),expansionSlots=integer(raw.expansion_slots),sidePanel=text(raw.side_panel);
  const specs={schemaVersion:1 as const,supportedMotherboardFormFactors:[...new Set(supported)],maxGpuLengthMm:maxGpu,maxCpuCoolerHeightMm:maxCooler,
    ...(psuForms.length?{psuFormFactors:psuForms}:{}),...(bays25!==null&&bays25>=0?{internal25Bays:bays25}:{}),
    ...(bays35!==null&&bays35>=0?{internal35Bays:bays35}:{}),...(expansionSlots!==null&&expansionSlots>=0?{expansionSlots}:{}),
    ...(sidePanel?{sidePanel}:{}),...(Object.keys(dimensionsMm).length?{dimensionsMm}:{}),
  };
  return validate(caseSpecSchema,"CASE",raw,specs);
}