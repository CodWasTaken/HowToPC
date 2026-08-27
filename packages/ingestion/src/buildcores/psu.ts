import { psuSpecSchema } from "@howtopc/catalog";
import { finite, integer, psuFormFactor, rec, reject, text, validate, type BuildCoresMappingResult } from "./common";

function efficiency(value:unknown):"STANDARD"|"BRONZE"|"SILVER"|"GOLD"|"PLATINUM"|"TITANIUM"|undefined {
  const normalized=text(value)?.toLowerCase(); if(!normalized)return;
  if(normalized==="80+"||normalized.includes("standard")||normalized.includes("white"))return "STANDARD";
  if(normalized.includes("bronze"))return "BRONZE"; if(normalized.includes("silver"))return "SILVER";
  if(normalized.includes("gold"))return "GOLD"; if(normalized.includes("platinum"))return "PLATINUM";
  if(normalized.includes("titanium"))return "TITANIUM";
}
function modularity(value:unknown):"FIXED"|"SEMI"|"FULL"|undefined {
  if(value==="Non-Modular")return "FIXED"; if(value==="Semi-Modular")return "SEMI"; if(value==="Full")return "FULL";
}

export function mapPsu(raw:Record<string,any>):BuildCoresMappingResult {
  const wattage=finite(raw.wattage),formFactor=psuFormFactor(raw.form_factor),sourceForm=text(raw.form_factor);
  if(sourceForm&&!formFactor)return reject("AMBIGUOUS_VALUE",`Unsupported PSU form factor: ${sourceForm}`);
  if(wattage===null||wattage<=0||!formFactor)return reject("MISSING_REQUIRED_FIELD","PSU wattage and supported form factor are required");
  const sourceConnectors=rec(raw.connectors)??{},connectors:Record<string,number>={};
  const add=(source:string,target:string)=>{const count=integer(sourceConnectors[source]);if(count!==null&&count>0)connectors[target]=count;};
  add("atx_24_pin","ATX_24");add("eps_8_pin","EPS_8");add("pcie_6_plus_2_pin","PCIE_8");add("pcie_12vhpwr","12VHPWR");
  const rating=efficiency(raw.efficiency_rating),modular=modularity(raw.modular),length=finite(raw.length);  const specs={schemaVersion:1 as const,formFactor,wattage,connectors,
    ...(rating?{efficiencyRating:rating}:{}),...(modular?{modularity:modular}:{}),
    ...(length!==null&&length>0?{lengthMm:length}:{}),...(typeof raw.fanless==="boolean"?{fanless:raw.fanless}:{})};
  return validate(psuSpecSchema,"PSU",raw,specs);
}