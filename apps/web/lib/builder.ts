import { referenceCatalog, referencePricePln, type ReferenceProduct } from "@howtopc/catalog";
import {
  addOne,
  calculateResourceUsage,
  evaluateBuild,
  expandBuildLines,
  isRepeatableCategory,
  maxSafeQuantity,
  previewAdd,
  removeOne,
  replaceSingleton,
  type BuildLine,
  type CompatibilityReport,
  type QuantityMutationResult,
  type ResourceUsage,
} from "@howtopc/compatibility";

const byId = new Map(referenceCatalog.map((product) => [product.id, product]));
export const initialBuildIds = ["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","gpu-mid-300","case-atx-340","psu-atx-750","cooler-air-158","ssd-nvme-2tb"] as const;
export const budgetHomelabIds = ["cpu-intel-i5-3470","mb-asus-p8h61-m-lx3-r2","ram-kingston-kvr16n11k2-16","case-silentiumpc-brutus-m10","psu-chieftec-gps-400aa","cooler-intel-e97379-003","hdd-wd5000aakx"] as const;

export type BuilderInput = readonly BuildLine[] | readonly string[];
export const linesFromIds = (ids: readonly string[]): BuildLine[] => {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([productId, quantity]) => ({ productId, quantity }));
};
function normalizeLines(input: BuilderInput): BuildLine[] {
  if (input.length === 0) return [];
  return typeof input[0] === "string"
    ? linesFromIds(input as readonly string[])
    : (input as readonly BuildLine[]).map((line) => ({ ...line }));
}

export interface BuilderSnapshot {
  lines: BuildLine[];
  ids: string[];
  products: ReferenceProduct[];
  report: CompatibilityReport;
  resourceUsage: ResourceUsage;
  totalPricePln: number;
}

export function productsFor(input: BuilderInput): ReferenceProduct[] {
  return expandBuildLines(normalizeLines(input));
}

export function snapshot(input: BuilderInput): BuilderSnapshot {
  const lines = normalizeLines(input);
  const products = expandBuildLines(lines);
  const ids = products.map((product) => product.id);
  const totalPricePln = lines.reduce((sum, line) => sum + (referencePricePln(line.productId) ?? 0) * line.quantity, 0);
  return { lines, ids, products, report: evaluateBuild(products), resourceUsage: calculateResourceUsage(lines), totalPricePln };
}
export function createInitialBuild(): BuilderSnapshot {
  return snapshot(initialBuildIds);
}

export function createBudgetHomelabBuild(): BuilderSnapshot {
  return snapshot(budgetHomelabIds);
}

function wrapMutation(result: QuantityMutationResult) {
  const built = snapshot(result.lines);
  const candidate = snapshot(result.candidateLines);
  return {
    ...result,
    snapshot: built,
    candidate,
    revisionLines: built.lines,
    candidateLines: candidate.lines,
    revisionIds: built.ids,
    candidateIds: candidate.ids,
  };
}

export function previewPart(input: BuilderInput, productId: string) {
  return wrapMutation(previewAdd(normalizeLines(input), productId));
}

export function addPart(input: BuilderInput, productId: string) {
  return wrapMutation(addOne(normalizeLines(input), productId));
}

export function replacePart(input: BuilderInput, productId: string) {
  return addPart(input, productId);
}
export function removePart(input: BuilderInput, productId: string): BuilderSnapshot {
  const lines = normalizeLines(input);
  const next = lines.flatMap((line) => {
    if (line.productId !== productId) return [{ ...line }];
    return line.quantity > 1 ? [{ ...line, quantity: line.quantity - 1 }] : [];
  });
  return snapshot(next);
}

export function partQuantity(input: BuilderInput, productId: string): number {
  return normalizeLines(input).find((line) => line.productId === productId)?.quantity ?? 0;
}

export function maxPartQuantity(input: BuilderInput, productId: string): number {
  return maxSafeQuantity(normalizeLines(input), productId);
}

export function isRepeatableProduct(productId: string): boolean {
  const product = byId.get(productId);
  return product ? isRepeatableCategory(product.category) : false;
}

export function decrementPart(input: BuilderInput, productId: string) {
  return wrapMutation(removeOne(normalizeLines(input), productId));
}

export function replaceSingletonPart(input: BuilderInput, productId: string) {
  return wrapMutation(replaceSingleton(normalizeLines(input), productId));
}
