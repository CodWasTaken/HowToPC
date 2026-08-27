import { cpuSpecSchema } from "@howtopc/catalog";
import { finite, integer, normalizeSocket, rec, reject, text, validate, type BuildCoresMappingResult } from "./common";

export function mapCpu(raw:Record<string,any>):BuildCoresMappingResult {
  const specifications=rec(raw.specifications),socket=normalizeSocket(raw.socket),tdp=finite(specifications?.tdp);
  if(!specifications||!socket||tdp===null||tdp<0)return reject("MISSING_REQUIRED_FIELD","CPU socket and non-negative TDP are required");
  const cores=rec(raw.cores),igpu=text(rec(specifications.integratedGraphics)?.model);
  const totalCores=integer(cores?.total),threads=integer(cores?.threads),family=text(raw.series);
  const specs={
    schemaVersion:1 as const,socket,tdpWatts:tdp,
    ...(igpu?{integratedGraphics:igpu.toLowerCase()!=="none"}:{}),
    ...(family?{family}:{}),
    ...(totalCores!==null&&totalCores>0?{cores:totalCores}:{}),
    ...(threads!==null&&threads>0?{threads}:{}),
  };
  return validate(cpuSpecSchema,"CPU",raw,specs);
}