import { psuSpecSchema } from "@howtopc/catalog";
import type { NormalizedProductObservation } from "../observation";
import { base, finite, rec, text } from "./shared";

function psuFormFactor(value: unknown): "ATX" | "SFX" | "SFX_L" | null {
  const ff = text(value)?.toUpperCase();
  if (ff === "ATX") return "ATX";
  if (ff === "SFX") return "SFX";
  if (ff === "SFX-L") return "SFX_L";
  return null;
}

export function mapPsu(raw: Record<string, any>): NormalizedProductObservation | null {
  const wattage = finite(raw.wattage), formFactor = psuFormFactor(raw.form_factor), source = rec(raw.connectors);
  if (!wattage || wattage <= 0 || !formFactor) return null;
  let connectors: Record<string, number> | undefined;
  if (source) {
    connectors = {};
    const eps = Math.max(0, finite(source.eps_8_pin) ?? 0), pcie = Math.max(0, finite(source.pcie_6_plus_2_pin) ?? 0), hpwr = Math.max(0, finite(source.pcie_12vhpwr) ?? 0);
    if (eps) connectors.EPS_8 = eps;
    if (pcie) connectors.PCIE_8 = pcie;
    if (hpwr) connectors["12VHPWR"] = hpwr;
  }
  const specs = { schemaVersion:1 as const, formFactor, wattage, ...(connectors ? { connectors } : {}) };
  if (!psuSpecSchema.safeParse(specs).success) return null;
  return base("PSU", "PSU", raw, specs);
}
