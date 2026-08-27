import type { ReferenceProduct } from "@howtopc/catalog";
import type { Vec3 } from "./scene";

export interface PhysicalInstance {
  id: string;
  productId: string;
  label: string;
  category: string;
  size: Vec3;
  product: ReferenceProduct;
}

const specs = (product: ReferenceProduct) => product.specs as Record<string, any>;

function boardSize(formFactor: string): Vec3 {
  if (formFactor === "MINI_ITX") return [8, 170, 170];
  if (formFactor === "MATX") return [8, 244, 244];
  if (formFactor === "EATX") return [8, 330, 305];
  return [8, 305, 244];
}

export function sizeForProduct(product: ReferenceProduct): Vec3 {
  const s = specs(product);
  switch (product.category) {
    case "MOTHERBOARD": return boardSize(String(s.formFactor));
    case "GPU": return [Number(s.heightMm ?? 120), Math.max(20.32, Number(s.slotWidth ?? 1) * 20.32), Number(s.lengthMm ?? 250)];
    case "PSU": return s.formFactor === "SFX" ? [125, 64, 100] : [150, 86, 140];
    case "COOLER": return s.type === "AIO" ? [30, Number(s.radiatorSizeMm ?? 240), 120] : [Number(s.heightMm ?? 100), 120, 120];
    case "MEMORY": return [45, 135, 8];
    case "CPU": return [5, 40, 40];
    case "STORAGE": return String(s.formFactor).includes("M.2") ? [4, 22, 80] : [102, 26, 147];
    case "NETWORK":
    case "HBA": return [20, 70, 120];
    case "FAN": return [Number(s.thicknessMm ?? 25), Number(s.sizeMm ?? 120), Number(s.sizeMm ?? 120)];
    default: return [40, 40, 40];
  }
}

export function expandPhysicalInstances(products: readonly ReferenceProduct[]): PhysicalInstance[] {
  const totals = new Map<string, number>();
  for (const product of products) totals.set(product.id, (totals.get(product.id) ?? 0) + 1);
  const seen = new Map<string, number>();
  const instances: PhysicalInstance[] = [];

  for (const product of products) {
    const occurrence = (seen.get(product.id) ?? 0) + 1;
    seen.set(product.id, occurrence);
    const duplicate = (totals.get(product.id) ?? 1) > 1;
    const baseId = duplicate ? `${product.id}#${occurrence}` : product.id;
    const size = sizeForProduct(product);
    if (product.category === "MEMORY") {
      const modules = Math.max(1, Number(specs(product).modules ?? 1));
      for (let moduleIndex = 0; moduleIndex < modules; moduleIndex += 1) {
        instances.push({
          id: `${baseId}#dimm-${moduleIndex + 1}`,
          productId: product.id,
          label: `${product.displayName} · DIMM ${moduleIndex + 1}/${modules}`,
          category: product.category,
          size,
          product,
        });
      }
      continue;
    }
    instances.push({ id: baseId, productId: product.id, label: product.displayName, category: product.category, size, product });
  }
  return instances;
}
