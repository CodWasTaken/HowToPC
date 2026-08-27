import { coolerSpecSchema } from "@howtopc/catalog";
import { finite, integer, normalizeSocket, reject, validate, type BuildCoresMappingResult } from "./common";

export function mapCooler(raw:Record<string,any>):BuildCoresMappingResult {
  const sockets=Array.isArray(raw.cpu_sockets)?raw.cpu_sockets.map(normalizeSocket).filter((value):value is string=>value!==null):[];
  if(!sockets.length)return reject("MISSING_REQUIRED_FIELD","CPU cooler socket support is required");
  if(typeof raw.water_cooled!=="boolean")return reject("MISSING_REQUIRED_FIELD","CPU cooler air-vs-liquid type must be known");
  const height=finite(raw.height),radiator=integer(raw.radiator_size),fanSize=finite(raw.fan_size),fanQuantity=integer(raw.fan_quantity);
  const minRpm=finite(raw.min_fan_rpm),maxRpm=finite(raw.max_fan_rpm),minNoise=finite(raw.min_noise_level),maxNoise=finite(raw.max_noise_level);
  const specs={schemaVersion:1 as const,type:raw.water_cooled?"AIO" as const:"AIR" as const,supportedSockets:[...new Set(sockets)],
    ...(height!==null&&height>0?{heightMm:height}:{}),...(radiator!==null&&radiator>0?{radiatorSizeMm:radiator}:{}),
    ...(fanSize!==null&&fanSize>0?{fanSizeMm:fanSize}:{}),...(fanQuantity!==null&&fanQuantity>0?{fanQuantity}:{}),
    ...(minRpm!==null&&minRpm>=0?{minRpm}:{}),...(maxRpm!==null&&maxRpm>0?{maxRpm}:{}),
    ...(minNoise!==null&&minNoise>=0?{minNoiseDb:minNoise}:{}),...(maxNoise!==null&&maxNoise>=0?{maxNoiseDb:maxNoise}:{}),
    ...(typeof raw.fanless==="boolean"?{fanless:raw.fanless}:{})};
  return validate(coolerSpecSchema,"COOLER",raw,specs);
}