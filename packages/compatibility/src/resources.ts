import type { ReferenceProduct } from "@howtopc/catalog";
import { expandBuildLines, type BuildLine } from "./build-lines";

export interface ResourceCounter {
  used: number;
  available: number | null;
}

export interface ResourceUsage {
  dimm: ResourceCounter;
  memoryBytes: ResourceCounter;
  m2: ResourceCounter;
  sata: ResourceCounter;
  gpuPcie: ResourceCounter;
  generalPcie: ResourceCounter;
}

const specs = (product: ReferenceProduct) => product.specs as Record<string, any>;
const capacity = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;

export function calculateResourceUsage(lines: readonly BuildLine[]): ResourceUsage {
  const products = expandBuildLines(lines);
  const board = products.find((product) => product.category === "MOTHERBOARD");
  const boardSpecs = board ? specs(board) : {};
  let dimmUsed = 0, memoryUsed = 0, m2Used = 0, sataUsed = 0, gpuUsed = 0, pcieUsed = 0;
  for (const product of products) {
    const productSpecs = specs(product);
    if (product.category === "MEMORY") {
      const modules = Number(productSpecs.modules ?? 0);
      dimmUsed += modules;
      memoryUsed += modules * Number(productSpecs.moduleCapacityBytes ?? 0);
    }
    if (product.category === "STORAGE" && productSpecs.interface === "NVME") m2Used += 1;
    if (product.category === "STORAGE" && productSpecs.interface === "SATA") sataUsed += 1;
    if (product.category === "GPU") { gpuUsed += 1; pcieUsed += 1; }
    if (product.category === "NETWORK" && productSpecs.interface === "PCIE") pcieUsed += 1;
    if (product.category === "HBA") pcieUsed += 1;
  }
  return {
    dimm: { used: dimmUsed, available: capacity(boardSpecs.dimmSlots) },
    memoryBytes: { used: memoryUsed, available: capacity(boardSpecs.maxMemoryBytes) },
    m2: { used: m2Used, available: capacity(boardSpecs.m2Slots) },
    sata: { used: sataUsed, available: capacity(boardSpecs.sataPorts) },
    gpuPcie: { used: gpuUsed, available: capacity(boardSpecs.gpuPcieSlots) },
    generalPcie: { used: pcieUsed, available: capacity(boardSpecs.pcieSlots) },
  };
}
