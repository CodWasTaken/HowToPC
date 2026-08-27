import { fanSpecSchema } from "@howtopc/catalog";
import type { NormalizedProductObservation } from "../observation";
import { base, finite, text } from "./shared";

function fanConnector(raw: Record<string, any>): "PWM_4" | "DC_3" | undefined {
  const connector = text(raw.connector)?.toLowerCase();
  if (raw.pwm === true && connector?.includes("4-pin pwm")) return "PWM_4";
  if (raw.pwm === false && connector?.includes("3-pin")) return "DC_3";
  return undefined;
}

export function mapFan(raw: Record<string, any>): NormalizedProductObservation | null {
  const size = finite(raw.size);
  if (!size || size <= 0 || !Number.isInteger(size)) return null;
  const connector = fanConnector(raw);
  const specs = { schemaVersion:1 as const, sizeMm:size, ...(connector ? { connector } : {}) };
  if (!fanSpecSchema.safeParse(specs).success) return null;
  return base("FAN", "CaseFan", raw, specs);
}
