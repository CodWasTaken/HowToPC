import { gpuSpecSchema } from "@howtopc/catalog";
import type { NormalizedProductObservation } from "../observation";
import { base, finite, rec } from "./shared";

export function mapGpu(raw: Record<string, any>): NormalizedProductObservation | null {
  const length = finite(raw.length), tdp = finite(raw.tdp), slotWidth = finite(raw.total_slot_width);
  if (length === null || length < 0 || tdp === null || tdp < 0 || slotWidth === null || slotWidth <= 0) return null;
  const sourceConnectors = rec(raw.power_connectors);
  let powerConnectors: Record<string, number> | undefined;
  if (sourceConnectors) {
    powerConnectors = {};
    const pcie8 = Math.max(0, finite(sourceConnectors.pcie_6_pin) ?? 0) + Math.max(0, finite(sourceConnectors.pcie_8_pin) ?? 0);
    const hpwr = Math.max(0, finite(sourceConnectors.pcie_12VHPWR) ?? finite(sourceConnectors.pcie_12vhpwr) ?? 0);
    const x6 = Math.max(0, finite(sourceConnectors.pcie_12V_2x6) ?? 0);
    if (pcie8) powerConnectors.PCIE_8 = pcie8;
    if (hpwr) powerConnectors["12VHPWR"] = hpwr;
    if (x6) powerConnectors["12V_2X6"] = x6;
  }
  const specs = { schemaVersion:1 as const, lengthMm:length, slotWidth, tdpWatts:tdp, ...(powerConnectors ? { powerConnectors } : {}) };
  if (!gpuSpecSchema.safeParse(specs).success) return null;
  return base("GPU", "GPU", raw, specs);
}
