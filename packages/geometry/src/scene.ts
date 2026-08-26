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
    case "MEMORY": return [45, 135, 12];
    case "CPU": return [5, 40, 40];
    case "STORAGE": return String(s.formFactor).includes("M.2") ? [4, 22, 80] : [102, 26, 147];
    case "NETWORK": return [70, 20, 120];
    default: return [40, 40, 40];
  }
}
function placementFor(
  product: ReferenceProduct,
  boxSize: Vec3,
  caseDimensions: Vec3,
  board: SceneBox | undefined,
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
    case "MEMORY":
      return compactBoard
        ? [boardFace + boxSize[0] / 2, board.position[1] + 28, board.position[2] - 58]
        : [boardFace + boxSize[0] / 2, socketY, socketZ - 72];
    case "GPU":
      return [boardFace + 8 + boxSize[0] / 2, board.position[1] - 68, rear - boxSize[2] / 2];
    case "NETWORK":
      return [boardFace + 8 + boxSize[0] / 2, board.position[1] - 110, rear - boxSize[2] / 2];
    case "STORAGE": {
      const isM2 = String(specs(product).formFactor).includes("M.2");
      if (isM2) return compactBoard
        ? [boardFace + boxSize[0] / 2, board.position[1] - 58, board.position[2] + 28]
        : [boardFace + boxSize[0] / 2, board.position[1] - 28, board.position[2] - 24];
      return [0, floor + 45 + boxSize[1] / 2, -caseDepth / 2 + 85];
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

  const components = products
    .filter((product) => product.category !== "CASE")
    .map((product): SceneBox => {
      if (product.category === "MOTHERBOARD" && board) return board;
      const componentSize = sizeFor(product);
      return {
        id: product.id,
        label: product.displayName,
        category: product.category,
        size: componentSize,
        position: placementFor(product, componentSize, dimensions, board),
      };
    });

  return { caseBox, components };
}
