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

export function measureClearances(products: readonly ReferenceProduct[]): ClearanceMeasurement[] {
  const pcCase = products.find((product) => product.category === "CASE");
  if (!pcCase) return [];
  const caseSpecs = specs(pcCase);
  const results: ClearanceMeasurement[] = [];

  const gpu = products.find((product) => product.category === "GPU");
  if (gpu) {
    const required = Number(specs(gpu).lengthMm);
    const available = Number(caseSpecs.maxGpuLengthMm);
    if (Number.isFinite(required) && Number.isFinite(available)) {
      results.push(measurement("gpu-length", "GPU length", required, available));
    }
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
