import { referenceCatalog, type ReferenceProduct } from "@howtopc/catalog";

export interface BuildLine {
  productId: string;
  quantity: number;
}

const byId = new Map(referenceCatalog.map((product) => [product.id, product]));

export function expandBuildLines(lines: readonly BuildLine[]): ReferenceProduct[] {
  return lines.flatMap((line) => {
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new RangeError(`Invalid quantity for ${line.productId}: ${line.quantity}`);
    }
    const product = byId.get(line.productId);
    return product ? Array.from({ length: line.quantity }, () => product) : [];
  });
}
