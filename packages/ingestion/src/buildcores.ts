import { cpuSpecSchema, memorySpecSchema, motherboardSpecSchema } from "@howtopc/catalog";
import type { ProductCategory, ProductIdentifier } from "@howtopc/domain";
import type { NormalizedProductObservation } from "./observation";
import { mapGpu } from "./buildcores/gpu";
import { mapStorage } from "./buildcores/storage";
import { mapPsu } from "./buildcores/psu";
import { mapCase } from "./buildcores/case";
import { mapCooler } from "./buildcores/cooler";
import { mapFan } from "./buildcores/fan";

const GIB = 1024 ** 3;
const rec = (value: unknown): Record<string, any> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;
const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;
const finite = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;

function normalizeSocket(value: unknown): string | null {
  const socket = text(value);
  if (!socket) return null;
  return socket.replace(/^LGA\s+(\d+)$/i, "LGA$1");
}

function memoryType(value: unknown): "DDR3" | "DDR4" | "DDR5" | null {
  return value === "DDR3" || value === "DDR4" || value === "DDR5" ? value : null;
}

function formFactor(value: unknown): "MINI_ITX" | "MATX" | "ATX" | "EATX" | null {
  const normalized = text(value)?.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
  if (normalized === "mini itx") return "MINI_ITX";
  if (normalized === "micro atx") return "MATX";
  if (normalized === "atx") return "ATX";
  if (normalized === "eatx" || normalized === "extended atx") return "EATX";
  return null;
}

function identifiers(raw: Record<string, any>): ProductIdentifier[] {
  const id = text(raw.opendb_id);
  const result: ProductIdentifier[] = id ? [{ type:"SOURCE_ID", value:id, sourceId:"buildcores-opendb" }] : [];
  const parts = Array.isArray(rec(raw.metadata)?.part_numbers) ? rec(raw.metadata)!.part_numbers : [];
  for (const part of parts) { const value = text(part); if (value) result.push({ type:"MPN", value, sourceId:"buildcores-opendb" }); }
  return result;
}

function base(category: ProductCategory, raw: Record<string, any>, specs: Record<string, unknown>): NormalizedProductObservation | null {
  const id = text(raw.opendb_id), metadata = rec(raw.metadata), name = text(metadata?.name), manufacturer = text(metadata?.manufacturer);
  if (!id || !name || !manufacturer) return null;
  return {
    providerId:"buildcores-opendb",
    sourceRecordId:id,
    sourceRecordUrl:`https://github.com/buildcores/buildcores-open-db/blob/main/open-db/${category === "MEMORY" ? "RAM" : category === "MOTHERBOARD" ? "Motherboard" : category}/${id}.json`,
    manufacturer,
    displayName:name,
    category,
    identifiers:identifiers(raw),
    specs,
    manufacturerUrl:text(rec(raw.general_product_information)?.manufacturer_url) ?? undefined,
  };
}

function mapCpu(raw: Record<string, any>): NormalizedProductObservation | null {
  const specsRaw = rec(raw.specifications), socket = normalizeSocket(raw.socket), tdp = finite(specsRaw?.tdp);
  if (!specsRaw || !socket || tdp === null || tdp < 0) return null;
  const igpuModel = text(rec(specsRaw.integratedGraphics)?.model);
  const specs = { schemaVersion:1 as const, socket, tdpWatts:tdp, ...(igpuModel ? { integratedGraphics:igpuModel.toLowerCase() !== "none" } : {}) };
  if (!cpuSpecSchema.safeParse(specs).success) return null;
  return base("CPU", raw, specs);
}

function mapRam(raw: Record<string, any>): NormalizedProductObservation | null {
  const modules = rec(raw.modules), type = memoryType(raw.ram_type), count = finite(modules?.quantity), capacity = finite(modules?.capacity_gb), speed = finite(raw.speed);
  const ecc = raw.ecc === "ECC" ? true : raw.ecc === "Non-ECC" ? false : null;
  if (!type || !count || !capacity || ecc === null || !Number.isInteger(count)) return null;
  const specs = { schemaVersion:1 as const, type, modules:count, moduleCapacityBytes:capacity * GIB, ...(speed && speed > 0 ? { speedMt:speed } : {}), ecc };
  if (!memorySpecSchema.safeParse(specs).success) return null;
  return base("MEMORY", raw, specs);
}

function mapMotherboard(raw: Record<string, any>): NormalizedProductObservation | null {
  const memory = rec(raw.memory), storage = rec(raw.storage_devices), socket = normalizeSocket(raw.socket), ff = formFactor(raw.form_factor), type = memoryType(memory?.ram_type);
  const max = finite(memory?.max), slots = finite(memory?.slots);
  if (!memory || !storage || !socket || !ff || !type || !max || !slots || !Number.isInteger(slots)) return null;
  const pcieSlots = Array.isArray(raw.pcie_slots) ? raw.pcie_slots.reduce((sum:number, slot:unknown) => sum + Math.max(0, finite(rec(slot)?.quantity) ?? 0), 0) : 0;
  const m2Slots = Array.isArray(raw.m2_slots) ? raw.m2_slots.length : 0;
  const sataPorts = Math.max(0, finite(storage.sata_6_gb_s) ?? 0) + Math.max(0, finite(storage.sata_3_gb_s) ?? 0);
  const specs = { schemaVersion:1 as const, socket, formFactor:ff, memoryType:type, dimmSlots:slots, maxMemoryBytes:max * GIB, pcieSlots, m2Slots, sataPorts };
  if (!motherboardSpecSchema.safeParse(specs).success) return null;
  return base("MOTHERBOARD", raw, specs);
}

export function mapBuildCoresProduct(category: string, value: unknown): NormalizedProductObservation | null {
  const raw = rec(value);
  if (!raw) return null;
  if (category === "CPU") return mapCpu(raw);
  if (category === "RAM") return mapRam(raw);
  if (category === "Motherboard") return mapMotherboard(raw);
  if (category === "GPU") return mapGpu(raw);
  if (category === "Storage") return mapStorage(raw);
  if (category === "PSU") return mapPsu(raw);
  if (category === "PCCase") return mapCase(raw);
  if (category === "CPUCooler") return mapCooler(raw);
  if (category === "CaseFan") return mapFan(raw);
  return null;
}
