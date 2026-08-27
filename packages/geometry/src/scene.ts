import type { ReferenceProduct } from "@howtopc/catalog";

export type Vec3 = readonly [number, number, number];
export interface SceneBox {
  id: string;
  label: string;
  category: string;
  size: Vec3;
  position: Vec3;
}
export interface ParametricScene {
  caseBox: SceneBox;
  components: readonly SceneBox[];
}

const specs = (product: ReferenceProduct) => product.specs as Record<string, any>;

function caseSize(pcCase: ReferenceProduct): Vec3 {
  const compact = (specs(pcCase).supportedMotherboardFormFactors as string[])
    .every((ff) => ff === "MINI_ITX");
  return compact
    ? [185, 340, Math.max(360, Number(specs(pcCase).maxGpuLengthMm) + 30)]
    : [230, 470, Math.max(430, Number(specs(pcCase).maxGpuLengthMm) + 70)];
}
function boardSize(formFactor: string): Vec3 {
  if (formFactor === "MINI_ITX") return [8, 170, 170];
  if (formFactor === "MATX") return [8, 244, 244];
  if (formFactor === "EATX") return [8, 330, 305];
  return [8, 305, 244];
}

function sizeFor(product: ReferenceProduct): Vec3 {
  const s = specs(product);
  switch (product.category) {
    case "MOTHERBOARD": return boardSize(String(s.formFactor));
    case "GPU": return [Number(s.heightMm ?? 120), Math.max(20, Number(s.slotWidth) * 20.32), Number(s.lengthMm)];
    case "PSU": return s.formFactor === "SFX" ? [125, 64, 100] : [150, 86, 140];
    case "COOLER": return s.type === "AIO" ? [30, Number(s.radiatorSizeMm ?? 240), 120] : [Number(s.heightMm ?? 100), 120, 120];
    case "MEMORY": return [45, 135, 8];
    case "CPU": return [5, 40, 40];
    case "STORAGE": return String(s.formFactor).includes("M.2") ? [4, 22, 80] : [102, 26, 147];
    case "NETWORK": return [70, 20, 120];
    case "HBA": return [70, 20, 120];
    default: return [40, 40, 40];
  }
}
function placementFor(
  product: ReferenceProduct,
  boxSize: Vec3,
  caseDimensions: Vec3,
  board: SceneBox | undefined,
  instanceIndex = 0,
  instanceCount = 1,
): Vec3 {
  const [caseWidth, caseHeight, caseDepth] = caseDimensions;
  const rear = caseDepth / 2;
  const floor = -caseHeight / 2;

  if (product.category === "MOTHERBOARD") {
    const trayInset = caseWidth < 200 ? 20 : 25;
    const x = -caseWidth / 2 + trayInset + boxSize[0] / 2;
    const bottomClearance = caseHeight < 400 ? 85 : 105;
    const y = floor + bottomClearance + boxSize[1] / 2;
    const z = rear - boxSize[2] / 2;
    return [x, y, z];
  }

  if (product.category === "PSU") {
    return [0, floor + boxSize[1] / 2, rear - boxSize[2] / 2];
  }

  if (!board) return [0, 0, 0];
  const boardFace = board.position[0] + board.size[0] / 2;
  const compactBoard = board.size[1] <= 180 && board.size[2] <= 180;
  const socketY = board.position[1] + Math.min(52, board.size[1] * 0.18);
  const socketZ = board.position[2] + Math.min(45, board.size[2] * 0.2);

  switch (product.category) {
    case "CPU":
      return [boardFace + boxSize[0] / 2, socketY, socketZ];
    case "COOLER":
      return [boardFace + 5 + boxSize[0] / 2, socketY, socketZ];
    case "MEMORY": {
      const baseZ = compactBoard ? board.position[2] - 58 : socketZ - 72;
      const z = baseZ + ((instanceCount - 1) / 2 - instanceIndex) * 12;
      return [boardFace + boxSize[0] / 2, compactBoard ? board.position[1] + 28 : socketY, z];
    }
    case "GPU":
      return [boardFace + 8 + boxSize[0] / 2, board.position[1] - 68 - instanceIndex * (boxSize[1] + 12), rear - boxSize[2] / 2];
    case "NETWORK":
    case "HBA":
      return [boardFace + 8 + boxSize[0] / 2, board.position[1] - 110 - instanceIndex * (boxSize[1] + 10), rear - boxSize[2] / 2];
    case "STORAGE": {
      const isM2 = String(specs(product).formFactor).includes("M.2");
      if (isM2) return compactBoard
        ? [boardFace + boxSize[0] / 2, board.position[1] - 58 + instanceIndex * (boxSize[1] + 4), board.position[2] + 28]
        : [boardFace + boxSize[0] / 2, board.position[1] - 28 - instanceIndex * (boxSize[1] + 8), board.position[2] - 24];
      return [0, floor + 45 + boxSize[1] / 2 + instanceIndex * (boxSize[1] + 8), -caseDepth / 2 + 85];
    }
    default:
      return [0, 0, 0];
  }
}

export function buildParametricScene(products: readonly ReferenceProduct[]): ParametricScene {
  const pcCase = products.find((p) => p.category === "CASE");
  if (!pcCase) throw new Error("A case is required for the digital twin.");
  const dimensions = caseSize(pcCase);
  const caseBox: SceneBox = { id: pcCase.id, label: pcCase.displayName, category: "CASE", size: dimensions, position: [0, 0, 0] };
  const motherboardProduct = products.find((p) => p.category === "MOTHERBOARD");
  const board = motherboardProduct
    ? { id: motherboardProduct.id, label: motherboardProduct.displayName, category: "MOTHERBOARD", size: sizeFor(motherboardProduct), position: [0, 0, 0] as Vec3 }
    : undefined;
  if (board && motherboardProduct) board.position = placementFor(motherboardProduct, board.size, dimensions, undefined);

  const nonCase = products.filter((product) => product.category !== "CASE");
  const totalMemoryModules = nonCase
    .filter((product) => product.category === "MEMORY")
    .reduce((sum, product) => sum + Math.max(1, Number(specs(product).modules ?? 1)), 0);
  const totalGpus = nonCase.filter((product) => product.category === "GPU").length;
  const totalM2 = nonCase.filter((product) => product.category === "STORAGE" && String(specs(product).formFactor).includes("M.2")).length;
  const totalSata = nonCase.filter((product) => product.category === "STORAGE" && !String(specs(product).formFactor).includes("M.2")).length;
  const productTotals = new Map<string, number>();
  for (const product of nonCase) productTotals.set(product.id, (productTotals.get(product.id) ?? 0) + 1);

  const components: SceneBox[] = [];
  const seen = new Map<string, number>();
  let memoryIndex = 0, gpuIndex = 0, m2Index = 0, sataIndex = 0, expansionIndex = 0;
  for (const product of nonCase) {
    if (product.category === "MOTHERBOARD" && board) { components.push(board); continue; }
    const componentSize = sizeFor(product);
    if (product.category === "MEMORY") {
      const modules = Math.max(1, Number(specs(product).modules ?? 1));
      for (let moduleIndex = 0; moduleIndex < modules; moduleIndex += 1) {
        const index = memoryIndex++;
        components.push({
          id: `${product.id}#dimm-${index + 1}`,
          label: `${product.displayName} · DIMM ${moduleIndex + 1}/${modules}`,
          category: product.category,
          size: componentSize,
          position: placementFor(product, componentSize, dimensions, board, index, totalMemoryModules),
        });
      }
      continue;
    }

    let index = 0, count = 1;
    if (product.category === "GPU") { index = gpuIndex++; count = totalGpus; }
    else if (product.category === "STORAGE" && String(specs(product).formFactor).includes("M.2")) { index = m2Index++; count = totalM2; }
    else if (product.category === "STORAGE") { index = sataIndex++; count = totalSata; }
    else if (product.category === "NETWORK" || product.category === "HBA") { index = totalGpus + expansionIndex++; }
    const occurrence = (seen.get(product.id) ?? 0) + 1;
    seen.set(product.id, occurrence);
    const id = (productTotals.get(product.id) ?? 1) > 1 ? `${product.id}#${occurrence}` : product.id;
    components.push({ id, label: product.displayName, category: product.category, size: componentSize, position: placementFor(product, componentSize, dimensions, board, index, count) });
  }

  return { caseBox, components };
}
