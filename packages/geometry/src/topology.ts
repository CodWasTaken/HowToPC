import type { ReferenceProduct } from "@howtopc/catalog";
import { sizeForProduct } from "./instances";
import type { Vec3 } from "./scene";

export type MountKind = "CPU" | "DIMM" | "PCIE" | "M2" | "SATA_25" | "SATA_35" | "PSU" | "BOARD";
export interface MountSlot { id: string; kind: MountKind; position: Vec3; capacityUnits: number; gpuCapable?: boolean }
export interface MountTopology { caseSize: Vec3; slots: readonly MountSlot[]; notes: readonly string[] }

const specs = (product: ReferenceProduct) => product.specs as Record<string, any>;

export function parametricCaseSize(pcCase?: ReferenceProduct): Vec3 {
  if (!pcCase) return [230, 470, 430];
  const supported = (specs(pcCase).supportedMotherboardFormFactors as string[] | undefined) ?? [];
  const compact = supported.length > 0 && supported.every((ff) => ff === "MINI_ITX");
  const maxGpu = Number(specs(pcCase).maxGpuLengthMm ?? (compact ? 330 : 360));
  return compact
    ? [185, 340, Math.max(360, maxGpu + 30)]
    : [230, 470, Math.max(430, maxGpu + 70)];
}

function boardCenter(caseSize: Vec3, board: ReferenceProduct): Vec3 {
  const boardSize = sizeForProduct(board);
  const [caseWidth, caseHeight, caseDepth] = caseSize;
  const floor = -caseHeight / 2;
  const rear = caseDepth / 2;
  const trayInset = caseWidth < 200 ? 20 : 25;
  const bottomClearance = caseHeight < 400 ? 85 : 105;
  return [
    -caseWidth / 2 + trayInset + boardSize[0] / 2,
    floor + bottomClearance + boardSize[1] / 2,
    rear - boardSize[2] / 2,
  ];
}

function evenlySpaced(count: number, min: number, max: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(min + max) / 2];
  return Array.from({ length: count }, (_, index) => min + (max - min) * (index / (count - 1)));
}

export function deriveMountTopology(products: readonly ReferenceProduct[]): MountTopology {
  const pcCase = products.find((product) => product.category === "CASE");
  const board = products.find((product) => product.category === "MOTHERBOARD");
  const caseSize = parametricCaseSize(pcCase);
  const slots: MountSlot[] = [];
  const notes: string[] = ["Mount coordinates are standardized parametric positions, not manufacturer CAD coordinates."];

  if (board) {
    const boardSize = sizeForProduct(board);
    const center = boardCenter(caseSize, board);
    const boardFace = center[0] + boardSize[0] / 2;
    slots.push({ id: "board-1", kind: "BOARD", position: center, capacityUnits: 1 });
    const socketY = center[1] + boardSize[1] * 0.32;
    slots.push({ id: "cpu-1", kind: "CPU", position: [boardFace + 2.5, socketY, center[2] + boardSize[2] * 0.18], capacityUnits: 1 });

    const dimmCount = Math.max(0, Number(specs(board).dimmSlots ?? 0));
    const dimmZs = evenlySpaced(dimmCount, center[2] - boardSize[2] * 0.38, center[2] - boardSize[2] * 0.22);
    for (let index = 0; index < dimmCount; index += 1) {
      slots.push({ id: `dimm-${index + 1}`, kind: "DIMM", position: [boardFace, socketY, dimmZs[index]], capacityUnits: 1 });
    }

    const m2Count = Math.max(0, Number(specs(board).m2Slots ?? 0));
    const m2Ys = evenlySpaced(m2Count, center[1] - boardSize[1] * 0.28, center[1] + boardSize[1] * 0.10);
    for (let index = 0; index < m2Count; index += 1) {
      slots.push({ id: `m2-${index + 1}`, kind: "M2", position: [boardFace + 2, m2Ys[index], center[2] + boardSize[2] * 0.26], capacityUnits: 1 });
    }

    const pcieCount = Math.max(0, Number(specs(board).pcieSlots ?? 0));
    const pcieYs = evenlySpaced(pcieCount, center[1] - boardSize[1] * 0.48, center[1] - boardSize[1] * 0.02);
    const knownGpuSlots = specs(board).gpuPcieSlots;
    const gpuCount = Number.isFinite(Number(knownGpuSlots)) ? Math.min(pcieCount, Math.max(0, Number(knownGpuSlots))) : null;
    const gpuIndices = gpuCount === null ? new Set<number>() : new Set(evenlySpaced(gpuCount, 0, Math.max(0, pcieCount - 1)).map((value) => Math.round(value)));
    for (let index = 0; index < pcieCount; index += 1) {
      slots.push({
        id: `pcie-${index + 1}`, kind: "PCIE", position: [boardFace + 10, pcieYs[index], caseSize[2] / 2], capacityUnits: 1,
        ...(gpuCount === null ? {} : { gpuCapable: gpuIndices.has(index) }),
      });
    }
  }

  const floor = -caseSize[1] / 2;
  const rear = caseSize[2] / 2;
  slots.push({ id: "psu-1", kind: "PSU", position: [0, floor + 43, rear - 70], capacityUnits: 1 });

  const caseSpecs=pcCase?specs(pcCase):{};
  const bayCounts:[MountKind,string,unknown][]=[
    ["SATA_25","2.5-inch",caseSpecs.internal25Bays],
    ["SATA_35","3.5-inch",caseSpecs.internal35Bays],
  ];
  let bayIndex=0;
  for(const [kind,label,rawCount] of bayCounts){
    if(typeof rawCount!=="number"||!Number.isFinite(rawCount)||rawCount<0){
      notes.push(`${label} drive-bay capacity is unknown; the preview will not invent mounts.`);
      continue;
    }
    for(let index=0;index<Math.floor(rawCount);index+=1){
      const row=Math.floor(bayIndex/2),column=bayIndex%2;
      const z=column===0 ? -caseSize[2]/2+85 : caseSize[2]/2-85;
      slots.push({id:`drive-${kind.toLowerCase()}-${index+1}`,kind,position:[0,floor+60+row*110,z],capacityUnits:1});
      bayIndex+=1;
    }
  }

  return { caseSize, slots, notes };
}
