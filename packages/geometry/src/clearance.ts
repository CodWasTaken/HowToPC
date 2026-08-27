import type { ReferenceProduct } from "@howtopc/catalog";

export type ClearanceStatus = "PASS" | "FAIL" | "UNKNOWN";

export interface ClearanceMeasurement {
  id: "gpu-length" | "cooler-height";
  label: string;
  requiredMm: number;
  availableMm: number;
  remainingMm: number;
  status: ClearanceStatus;
}

const specs = (product: ReferenceProduct) => product.specs as Record<string, unknown>;

function measurement(
  id: ClearanceMeasurement["id"],
  label: string,
  requiredMm: number,
  availableMm: number,
): ClearanceMeasurement {
  const remainingMm = availableMm - requiredMm;
  return { id, label, requiredMm, availableMm, remainingMm, status: remainingMm >= 0 ? "PASS" : "FAIL" };
}

function longestGpuLength(products: readonly ReferenceProduct[]): number | null {
  const lengths = products
    .filter((product) => product.category === "GPU")
    .map((product) => Number(specs(product).lengthMm))
    .filter(Number.isFinite);
  return lengths.length ? Math.max(...lengths) : null;
}

export function measureClearances(products: readonly ReferenceProduct[]): ClearanceMeasurement[] {
  const pcCase = products.find((product) => product.category === "CASE");
  if (!pcCase) return [];
  const caseSpecs = specs(pcCase);
  const results: ClearanceMeasurement[] = [];

  const gpuLength = longestGpuLength(products);
  const maxGpuLength = Number(caseSpecs.maxGpuLengthMm);
  if (gpuLength !== null && Number.isFinite(maxGpuLength)) {
    results.push(measurement("gpu-length", "GPU length", gpuLength, maxGpuLength));
  }

  const cooler = products.find((product) => product.category === "COOLER");
  if (cooler && specs(cooler).type === "AIR") {
    const required = Number(specs(cooler).heightMm);
    const available = Number(caseSpecs.maxCpuCoolerHeightMm);
    if (Number.isFinite(required) && Number.isFinite(available)) {
      results.push(measurement("cooler-height", "CPU cooler height", required, available));
    }
  }

  return results;
}
