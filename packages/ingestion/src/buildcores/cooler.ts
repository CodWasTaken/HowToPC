import { coolerSpecSchema } from "@howtopc/catalog";
import type { NormalizedProductObservation } from "../observation";
import { base, finite, normalizeSocket } from "./shared";

export function mapCooler(raw: Record<string, any>): NormalizedProductObservation | null {
  if (typeof raw.water_cooled !== "boolean") return null;
  const sockets = Array.isArray(raw.cpu_sockets)
    ? raw.cpu_sockets.map(normalizeSocket).filter((value): value is string => Boolean(value)) : [];
  if (!sockets.length) return null;
  const height = finite(raw.height), radiator = finite(raw.radiator_size);
  const specs = {
    schemaVersion:1 as const,
    type:raw.water_cooled ? "AIO" as const : "AIR" as const,
    supportedSockets:[...new Set(sockets)],
    ...(height && height > 0 ? { heightMm:height } : {}),
    ...(raw.water_cooled && radiator && radiator > 0 && Number.isInteger(radiator) ? { radiatorSizeMm:radiator } : {}),
  };
  if (!coolerSpecSchema.safeParse(specs).success) return null;
  return base("COOLER", "CPUCooler", raw, specs);
}
