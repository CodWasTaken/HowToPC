import { motherboardSpecSchema } from "@howtopc/catalog";
import { finite, integer, memoryType, motherboardFormFactor, normalizeSocket, rec, reject, text, validate, type BuildCoresMappingResult } from "./common";

const GIB=1024**3;
function ethernetSpeedMbps(raw:unknown):number|undefined {
  if(!Array.isArray(raw))return;
  let max=0;
  for(const item of raw){
    const speed=text(rec(item)?.speed); if(!speed)continue;
    const value=parseFloat(speed); if(!Number.isFinite(value))continue;
    max=Math.max(max,/gb/i.test(speed)?value*1000:value);
  }
  return max||undefined;
}

function storageM2Slots(raw:unknown):number|null {
  if(!Array.isArray(raw))return null;
  let count=0;
  for(const slot of raw){
    const key=text(rec(slot)?.key); if(!key)return null;
    if(key==="M"||key==="B"||key==="B+M")count+=1;
  }
  return count;
}
export function mapMotherboard(raw:Record<string,any>):BuildCoresMappingResult {
  const memory=rec(raw.memory),storage=rec(raw.storage_devices),socket=normalizeSocket(raw.socket);
  const formFactor=motherboardFormFactor(raw.form_factor),type=memoryType(memory?.ram_type);
  if(text(raw.form_factor)&&!formFactor)return reject("AMBIGUOUS_VALUE",`Unsupported motherboard form factor: ${text(raw.form_factor)}`);
  if(text(memory?.ram_type)&&!type)return reject("AMBIGUOUS_VALUE",`Unsupported motherboard memory type: ${text(memory?.ram_type)}`);
  const maxMemory=finite(memory?.max),dimmSlots=integer(memory?.slots);
  if(!memory||!storage||!socket||!formFactor||!type||maxMemory===null||maxMemory<=0||dimmSlots===null||dimmSlots<1)
    return reject("MISSING_REQUIRED_FIELD","Motherboard socket, form factor, memory, and storage fields are required");
  if(!Array.isArray(raw.pcie_slots))return reject("MISSING_REQUIRED_FIELD","Motherboard PCIe slot topology is required");
  let pcieSlots=0;
  for(const slot of raw.pcie_slots){const quantity=integer(rec(slot)?.quantity);if(quantity===null||quantity<0)return reject("MISSING_REQUIRED_FIELD","Motherboard PCIe slot quantities must be known");pcieSlots+=quantity;}
  const m2Slots=storageM2Slots(raw.m2_slots);
  if(m2Slots===null)return reject("MISSING_REQUIRED_FIELD","Motherboard M.2 slot keys must be known to count storage-capable slots");
  const sata6=integer(storage.sata_6_gb_s),sata3=integer(storage.sata_3_gb_s);
  if(sata6===null||sata3===null||sata6<0||sata3<0)return reject("MISSING_REQUIRED_FIELD","Motherboard SATA port counts must be known");
  const wirelessText=text(raw.wireless_networking);
  const wireless=wirelessText? !/^none$/i.test(wirelessText):undefined;
  const ethernet=ethernetSpeedMbps(raw.onboard_ethernet);
  const specs={schemaVersion:1 as const,socket,formFactor,memoryType:type,dimmSlots,maxMemoryBytes:maxMemory*GIB,pcieSlots,m2Slots,sataPorts:sata6+sata3,
    ...(text(raw.chipset)?{chipset:text(raw.chipset)!}:{}),...(wireless!==undefined?{wireless}:{}),
    ...(ethernet?{ethernetSpeedMbps:ethernet}:{}),...(typeof raw.ecc_support==="boolean"?{eccSupport:raw.ecc_support}:{})};
  return validate(motherboardSpecSchema,"MOTHERBOARD",raw,specs);
}