import { describe, expect, test } from "vitest";
import { referenceCatalog, type ReferenceProduct } from "@howtopc/catalog";
import { evaluateBuild } from "./index";

const byId = new Map(referenceCatalog.map((product) => [product.id, product]));
const pick = (id: string) => {
  const product = byId.get(id);
  if (!product) throw new Error(`Missing test product ${id}`);
  return product;
};
const build = (ids: string[]) => ids.map(pick);
const am5Core = ["cpu-am5-7600", "mb-b650-atx", "case-atx-340", "psu-atx-750", "cooler-air-158"];

describe("MVP compatibility rules", () => {
  test("accepts a coherent AM5 build", () => {
    expect(evaluateBuild(build([...am5Core, "ram-ddr5-32", "gpu-mid-300", "ssd-nvme-2tb"])).status).toBe("COMPATIBLE");
  });

  test("enforces DIMM slot capacity across repeated memory kits", () => {
    const full = evaluateBuild(build([...am5Core, "ram-ddr5-32", "ram-ddr5-32"]));
    expect(full.results.find((result) => result.ruleId === "memory-slot-capacity")?.status).toBe("COMPATIBLE");
    const overflow = evaluateBuild(build([...am5Core, "ram-ddr5-32", "ram-ddr5-32", "ram-ddr5-32"]));
    expect(overflow.results.find((result) => result.ruleId === "memory-slot-capacity")?.status).toBe("INCOMPATIBLE");
  });

  test("warns when compatible DDR5 kits are mixed", () => {
    const baseRam = pick("ram-ddr5-32");
    const slowerRam: ReferenceProduct = {
      ...baseRam,
      id: "ram-ddr5-32-slower-test",
      revisionId: "ram-ddr5-32-slower-test-r1",
      displayName: "32GB DDR5-5200 test kit",
      specs: { ...(baseRam.specs as Record<string, unknown>), speedMt: 5200 },
    };
    const report = evaluateBuild([...build(am5Core), baseRam, slowerRam]);
    expect(report.results.find((result) => result.ruleId === "mixed-memory")?.status).toBe("WARNING");
    expect(report.status).toBe("WARNING");
  });

  test("enforces M.2 capacity across repeated storage", () => {
    const report = evaluateBuild(build([
      ...am5Core, "ram-ddr5-32",
      "ssd-nvme-2tb", "ssd-nvme-2tb", "ssd-nvme-2tb", "ssd-nvme-2tb",
    ]));
    expect(report.results.find((result) => result.ruleId === "storage-interface-capacity")?.status).toBe("INCOMPATIBLE");
  });

  test("aggregates multi-GPU PSU demand and connectors", () => {
    const report = evaluateBuild(build([
      "cpu-am5-7600", "mb-b650-atx", "ram-ddr5-32",
      "gpu-value-270", "gpu-value-270", "case-atx-340",
      "psu-chieftec-gps-400aa", "cooler-air-158",
    ]));
    const power = report.results.find((result) => result.ruleId === "psu-power-headroom");
    const connectors = report.results.find((result) => result.ruleId === "gpu-psu-connectors");
    expect(power?.status).toBe("INCOMPATIBLE");
    expect(power?.message).toContain("525W");
    expect(connectors?.status).toBe("INCOMPATIBLE");
  });

  test("returns UNKNOWN for multi-GPU builds when GPU slot topology is unknown", () => {
    const report = evaluateBuild(build([
      "cpu-intel-i5-3470", "buildcores-a750515d-6abd-4126-9830-e2700b884aed",
      "ram-kingston-kvr16n11k2-16", "gpu-value-270", "gpu-value-270",
      "case-atx-340", "psu-atx-750", "cooler-intel-e97379-003",
    ]));
    expect(report.results.find((result) => result.ruleId === "gpu-slot-capacity")?.status).toBe("UNKNOWN");
    expect(report.status).toBe("UNKNOWN");
  });

  test("returns UNKNOWN when case PSU form-factor support is not known", () => {
    const baseCase = pick("case-atx-340");
    const unknownCase: ReferenceProduct = {
      ...baseCase,
      id:"case-unknown-psu-test", revisionId:"case-unknown-psu-test-r1",
      specs:Object.fromEntries(Object.entries(baseCase.specs).filter(([key]) => key !== "psuFormFactors")),
    };
    const report = evaluateBuild([...build(["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","psu-atx-750","cooler-air-158"]), unknownCase]);
    expect(report.results.find((result) => result.ruleId === "psu-case-form-factor")?.status).toBe("UNKNOWN");
    expect(report.status).toBe("UNKNOWN");
  });

  test("returns UNKNOWN when GPU connector requirements are not known", () => {
    const baseGpu = pick("gpu-mid-300");
    const unknownGpu: ReferenceProduct = {
      ...baseGpu,
      id:"gpu-unknown-connectors-test", revisionId:"gpu-unknown-connectors-test-r1",
      specs:Object.fromEntries(Object.entries(baseGpu.specs).filter(([key]) => key !== "powerConnectors")),
    };
    const report = evaluateBuild([...build([...am5Core, "ram-ddr5-32"]), unknownGpu]);
    expect(report.results.find((result) => result.ruleId === "gpu-psu-connectors")?.status).toBe("UNKNOWN");
    expect(report.status).toBe("UNKNOWN");
  });

  test("explains key hard failures", () => {
    const report = evaluateBuild(build(["cpu-am4-5600", "mb-b650-itx", "ram-ddr4-32", "gpu-long-345", "case-itx-320", "psu-atx-750", "cooler-air-158"]));
    expect(report.status).toBe("INCOMPATIBLE");
    expect(report.results.filter((result) => result.status === "INCOMPATIBLE").length).toBeGreaterThanOrEqual(4);
  });
});
