import { referenceCatalog, type ReferenceProduct } from "@howtopc/catalog";
import { expandBuildLines, type BuildLine } from "./build-lines";
import { evaluateBuild } from "./engine";
import type { CompatibilityReport } from "./rule";
import { decideMutation, type MutationDecision } from "./mutation-decision";

const byId = new Map(referenceCatalog.map((product) => [product.id, product]));
const repeatableCategories = new Set<string>(["MEMORY", "GPU", "STORAGE", "FAN", "NETWORK", "HBA"]);

export interface QuantityMutationResult {
  committed: boolean;
  lines: BuildLine[];
  candidateLines: BuildLine[];
  report: CompatibilityReport;
  decision: MutationDecision;
}

export function isRepeatableCategory(category: string): boolean {
  return repeatableCategories.has(category);
}

function productFor(productId: string): ReferenceProduct {
  const product = byId.get(productId);
  if (!product) throw new Error(`Unknown reference product: ${productId}`);
  return product;
}

const cloneLines = (lines: readonly BuildLine[]) => lines.map((line) => ({ ...line }));

function incrementCandidate(lines: readonly BuildLine[], productId: string): BuildLine[] {
  let found = false;
  const candidate = lines.map((line) => {
    if (line.productId !== productId) return { ...line };
    found = true;
    return { ...line, quantity: line.quantity + 1 };
  });
  if (!found) candidate.push({ productId, quantity: 1 });
  return candidate;
}

function singletonCandidate(lines: readonly BuildLine[], product: ReferenceProduct): BuildLine[] {
  const candidate: BuildLine[] = [];
  let inserted = false;
  for (const line of lines) {
    const existing = byId.get(line.productId);
    if (existing?.category === product.category) {
      if (!inserted) candidate.push({ productId: product.id, quantity: 1 });
      inserted = true;
    } else {
      candidate.push({ ...line });
    }
  }
  if (!inserted) candidate.push({ productId: product.id, quantity: 1 });
  return candidate;
}

function previewCandidate(lines: readonly BuildLine[], candidateLines: BuildLine[]): QuantityMutationResult {
  const report = evaluateBuild(expandBuildLines(candidateLines));
  const decision = decideMutation(report);
  return { committed: decision.allowed, lines: cloneLines(lines), candidateLines, report, decision };
}

export function previewAdd(lines: readonly BuildLine[], productId: string): QuantityMutationResult {
  const product = productFor(productId);
  const candidateLines = isRepeatableCategory(product.category)
    ? incrementCandidate(lines, productId)
    : singletonCandidate(lines, product);
  return previewCandidate(lines, candidateLines);
}

export function addOne(lines: readonly BuildLine[], productId: string): QuantityMutationResult {
  const preview = previewAdd(lines, productId);
  return { ...preview, lines: preview.committed ? cloneLines(preview.candidateLines) : cloneLines(lines) };
}

export function replaceSingleton(lines: readonly BuildLine[], productId: string): QuantityMutationResult {
  const product = productFor(productId);
  if (isRepeatableCategory(product.category)) throw new Error(`${product.category} is repeatable, not singleton.`);
  const preview = previewCandidate(lines, singletonCandidate(lines, product));
  return { ...preview, lines: preview.committed ? cloneLines(preview.candidateLines) : cloneLines(lines) };
}

export function removeOne(lines: readonly BuildLine[], productId: string): QuantityMutationResult {
  const index = lines.findIndex((line) => line.productId === productId);
  if (index < 0) {
    const report = evaluateBuild(expandBuildLines(lines));
    return { committed: false, lines: cloneLines(lines), candidateLines: cloneLines(lines), report, decision: decideMutation(report) };
  }
  const candidateLines = cloneLines(lines);
  const line = candidateLines[index];
  if (line.quantity > 1) line.quantity -= 1;
  else candidateLines.splice(index, 1);
  const report = evaluateBuild(expandBuildLines(candidateLines));
  return {
    committed: true,
    lines: cloneLines(candidateLines),
    candidateLines: cloneLines(candidateLines),
    report,
    decision: { allowed: true, state: "ALLOWED" },
  };
}

export function maxSafeQuantity(lines: readonly BuildLine[], productId: string): number {
  const product = productFor(productId);
  if (!isRepeatableCategory(product.category)) return previewAdd(lines, productId).committed ? 1 : 0;

  let working = cloneLines(lines);
  let quantity = working.find((line) => line.productId === productId)?.quantity ?? 0;
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const preview = previewAdd(working, productId);
    if (!preview.committed) break;
    working = cloneLines(preview.candidateLines);
    quantity = working.find((line) => line.productId === productId)?.quantity ?? quantity;
    if (quantity >= 64) break;
  }
  return quantity;
}
