import { storageSpecSchema } from "@howtopc/catalog";
import { finite, reject, text, validate, type BuildCoresMappingResult } from "./common";

const GB=1000**3,MB=1000**2;
function storageType(value:unknown):"SSD"|"HDD"|"SSHD"|undefined {
  return value==="SSD"||value==="HDD"||value==="SSHD"?value:undefined;
}
function storageInterface(raw:Record<string,any>):"SATA"|"NVME"|"SAS"|null {
  const source=text(raw.interface);
  if(raw.nvme===true&&source&&/pcie/i.test(source))return "NVME";
  if(source&&/sas/i.test(source))return "SAS";
  if(source&&/sata/i.test(source))return "SATA";
  return null;
}
function pcieGeneration(value:unknown):number|undefined {
  const match=text(value)?.match(/pcie\s*(\d+(?:\.\d+)?)/i);
  return match?Number(match[1]):undefined;
}

export function mapStorage(raw:Record<string,any>):BuildCoresMappingResult {
  const capacity=finite(raw.capacity),formFactor=text(raw.form_factor),sourceInterface=text(raw.interface),iface=storageInterface(raw);
  if(!sourceInterface||!iface)return reject(sourceInterface?"AMBIGUOUS_VALUE":"MISSING_REQUIRED_FIELD",sourceInterface?`Unsupported storage interface: ${sourceInterface}`:"Storage interface is required");
  if(capacity===null||capacity<=0||!formFactor)return reject("MISSING_REQUIRED_FIELD","Storage capacity and form factor are required");
  if(iface==="NVME"&&!/^M\.2-/i.test(formFactor))return reject("AMBIGUOUS_VALUE","Non-M.2 NVMe storage cannot be represented as M.2 capacity");
  if(iface==="SATA"&&(/^M\.2-/i.test(formFactor)||/^mSATA$/i.test(formFactor)))return reject("AMBIGUOUS_VALUE","M.2/mSATA storage cannot be represented as a SATA bay");  const sourceType=raw.storage_type??raw.type,type=storageType(sourceType);
  if(sourceType!==undefined&&sourceType!==null&&!type)return reject("AMBIGUOUS_VALUE",`Unsupported storage type: ${String(sourceType)}`);
  const cache=finite(raw.cache),generation=iface==="NVME"?pcieGeneration(raw.interface):undefined;
  const specs={
    schemaVersion:1 as const,interface:iface,formFactor,capacityBytes:capacity*GB,
    ...(type?{storageType:type}:{}),...(generation?{pcieGeneration:generation}:{}),
    ...(cache!==null&&cache>=0?{cacheBytes:cache*MB}:{}),
  };
  return validate(storageSpecSchema,"STORAGE",raw,specs);
}