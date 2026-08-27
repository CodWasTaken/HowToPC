import { caseSpecSchema } from "@howtopc/catalog";
import type { NormalizedProductObservation } from "../observation";
import { base, finite, motherboardFormFactor, text } from "./shared";

const psuFormFactor = (value: unknown): "ATX" | "SFX" | "SFX_L" | null => {
  const ff = text(value)?.toUpperCase();
  if (ff === "ATX") return "ATX";
  if (ff === "SFX") return "SFX";
  if (ff === "SFX-L") return "SFX_L";
  return null;
};

export function mapCase(raw: Record<string, any>): NormalizedProductObservation | null {
  const boards = Array.isArray(raw.supported_motherboard_form_factors)
    ? raw.supported_motherboard_form_factors.map(motherboardFormFactor).filter((value): value is NonNullable<typeof value> => Boolean(value)) : [];
  const maxGpuLengthMm = finite(raw.max_video_card_length), maxCpuCoolerHeightMm = finite(raw.max_cpu_cooler_height);
  if (!boards.length || !maxGpuLengthMm || maxGpuLengthMm <= 0 || !maxCpuCoolerHeightMm || maxCpuCoolerHeightMm <= 0) return null;
  const psus = Array.isArray(raw.supported_power_supply_form_factors)
    ? raw.supported_power_supply_form_factors.map(psuFormFactor).filter((value): value is NonNullable<typeof value> => Boolean(value)) : [];
  const specs = { schemaVersion:1 as const, supportedMotherboardFormFactors:[...new Set(boards)], maxGpuLengthMm, maxCpuCoolerHeightMm, ...(psus.length ? { psuFormFactors:[...new Set(psus)] } : {}) };
  if (!caseSpecSchema.safeParse(specs).success) return null;
  return base("CASE", "PCCase", raw, specs);
}
