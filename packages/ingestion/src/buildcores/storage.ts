import { storageSpecSchema } from "@howtopc/catalog";
import type { NormalizedProductObservation } from "../observation";
import { base, finite, GB, text } from "./shared";

function storageInterface(raw: Record<string, any>): "SATA" | "NVME" | "SAS" | null {
  if (raw.nvme === true) return "NVME";
  const value = text(raw.interface)?.toUpperCase();
  if (!value) return null;
  if (value.includes("SAS")) return "SAS";
  if (value.includes("SATA") || value.includes("MSATA")) return "SATA";
  return null;
}

export function mapStorage(raw: Record<string, any>): NormalizedProductObservation | null {
  const capacity = finite(raw.capacity), formFactor = text(raw.form_factor), interfaceType = storageInterface(raw);
  if (!capacity || capacity <= 0 || !formFactor || !interfaceType) return null;
  const specs = { schemaVersion:1 as const, interface:interfaceType, formFactor, capacityBytes:capacity * GB };
  if (!storageSpecSchema.safeParse(specs).success) return null;
  return base("STORAGE", "Storage", raw, specs);
}
