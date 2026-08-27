import type { ReferenceProduct } from "@howtopc/catalog";
import type { BuildProducts, CompatibilityRuleResult } from "./rule";
import { calculateResourceUsageForProducts } from "./resources";

const first = (products: BuildProducts, category: string) => products.find((product) => product.category === category);
const specs = (product: ReferenceProduct) => product.specs as Record<string, any>;
const involved = (products: readonly ReferenceProduct[]) => products.map((product) => product.id);

function compareRule(
  ruleId: string,
  a: ReferenceProduct | undefined,
  b: ReferenceProduct | undefined,
  compatible: (a: Record<string, any>, b: Record<string, any>) => boolean,
  ok: string,
  fail: string,
): CompatibilityRuleResult | undefined {
  if (!a || !b) return undefined;
  const passes = compatible(specs(a), specs(b));
  return { ruleId, status: passes ? "COMPATIBLE" : "INCOMPATIBLE", message: passes ? ok : fail, involvedIds: [a.id, b.id] };
}

export function evaluateMvpRules(products: BuildProducts): CompatibilityRuleResult[] {
  const cpu = first(products, "CPU"), board = first(products, "MOTHERBOARD"), pcCase = first(products, "CASE");
  const psu = first(products, "PSU"), cooler = first(products, "COOLER");
  const memories = products.filter((product) => product.category === "MEMORY");
  const gpus = products.filter((product) => product.category === "GPU");
  const storage = products.filter((product) => product.category === "STORAGE");
  const results: CompatibilityRuleResult[] = [];

  const required = ["CPU", "MOTHERBOARD", "MEMORY", "CASE", "PSU", "COOLER"];
  const missing = required.filter((category) => !first(products, category));
  if (missing.length) results.push({ ruleId: "required-build-components", status: "UNKNOWN", message: `Build is incomplete: missing ${missing.join(", ")}.`, involvedIds: [] });

  const pairs = [
    compareRule("cpu-motherboard-socket", cpu, board, (c, b) => c.socket === b.socket, "CPU socket matches motherboard.", "CPU socket does not match motherboard."),
    compareRule("motherboard-case-form-factor", board, pcCase, (b, c) => (c.supportedMotherboardFormFactors as string[]).includes(b.formFactor), "Motherboard form factor fits case.", "Motherboard form factor is not supported by case."),
    compareRule("cooler-cpu-socket", cooler, cpu, (c, p) => (c.supportedSockets as string[]).includes(p.socket), "Cooler supports CPU socket.", "Cooler does not support CPU socket."),
  ];
  for (const result of pairs) if (result) results.push(result);

  if (psu && pcCase) {
    const supported = specs(pcCase).psuFormFactors;
    if (!Array.isArray(supported)) {
      results.push({ ruleId:"psu-case-form-factor", status:"UNKNOWN", message:"Case PSU form-factor support is unknown.", involvedIds:[psu.id, pcCase.id] });
    } else {
      const fits = supported.includes(specs(psu).formFactor);
      results.push({ ruleId:"psu-case-form-factor", status:fits ? "COMPATIBLE" : "INCOMPATIBLE", message:fits ? "PSU form factor fits case." : "PSU form factor is not supported by case.", involvedIds:[psu.id, pcCase.id] });
    }
  }

  if (board && memories.length) {
    const fits = memories.every((memory) => specs(memory).type === specs(board).memoryType);
    results.push({ ruleId: "memory-motherboard", status: fits ? "COMPATIBLE" : "INCOMPATIBLE", message: fits ? "Memory generation matches motherboard." : "One or more memory kits do not match the motherboard generation.", involvedIds: [board.id, ...involved(memories)] });
  }

  if (pcCase && gpus.length) {
    const fits = gpus.every((gpu) => Number(specs(gpu).lengthMm ?? 0) <= Number(specs(pcCase).maxGpuLengthMm ?? 0));
    results.push({ ruleId: "gpu-case-length", status: fits ? "COMPATIBLE" : "INCOMPATIBLE", message: fits ? "GPU length fits case clearance." : "One or more GPUs exceed the case GPU clearance.", involvedIds: [pcCase.id, ...involved(gpus)] });
  }

  if (cooler && pcCase && specs(cooler).type === "AIR" && specs(cooler).heightMm) {
    const fits = Number(specs(cooler).heightMm) <= Number(specs(pcCase).maxCpuCoolerHeightMm);
    results.push({ ruleId: "cooler-case-height", status: fits ? "COMPATIBLE" : "INCOMPATIBLE", message: fits ? "CPU cooler height fits case." : "CPU cooler is taller than case clearance.", involvedIds: [cooler.id, pcCase.id] });
  }

  const usage = calculateResourceUsageForProducts(products);
  if (board && memories.length) {
    const dimmFits = usage.dimm.available !== null && usage.dimm.used <= usage.dimm.available;
    results.push({ ruleId: "memory-slot-capacity", status: dimmFits ? "COMPATIBLE" : "INCOMPATIBLE", message: dimmFits ? `Memory uses ${usage.dimm.used}/${usage.dimm.available} DIMM slots.` : `Memory requires ${usage.dimm.used} DIMM slots but motherboard has ${usage.dimm.available ?? 0}.`, involvedIds: [board.id, ...involved(memories)] });
    const memoryFits = usage.memoryBytes.available !== null && usage.memoryBytes.used <= usage.memoryBytes.available;
    results.push({ ruleId: "memory-total-capacity", status: memoryFits ? "COMPATIBLE" : "INCOMPATIBLE", message: memoryFits ? "Installed memory is within motherboard capacity." : "Installed memory exceeds motherboard maximum capacity.", involvedIds: [board.id, ...involved(memories)] });

    const sameGeneration = memories.every((memory) => specs(memory).type === specs(memories[0]).type);
    const distinctKits = new Set(memories.map((memory) => memory.id)).size > 1;
    if (sameGeneration && distinctKits) {
      results.push({ ruleId: "mixed-memory", status: "WARNING", message: "Mixed memory kits may run at a common lower speed or require manual tuning.", involvedIds: involved(memories) });
    }
  }

  if (board && storage.length) {
    const fits = usage.m2.available !== null && usage.sata.available !== null && usage.m2.used <= usage.m2.available && usage.sata.used <= usage.sata.available;
    results.push({ ruleId: "storage-interface-capacity", status: fits ? "COMPATIBLE" : "INCOMPATIBLE", message: fits ? "Storage devices fit available motherboard interfaces." : "Storage devices exceed motherboard M.2 or SATA interface capacity.", involvedIds: [board.id, ...involved(storage)] });
  }

  if (board && gpus.length > 1) {
    const available = usage.gpuPcie.available;
    const status = available === null ? "UNKNOWN" : usage.gpuPcie.used <= available ? "COMPATIBLE" : "INCOMPATIBLE";
    const message = available === null
      ? "GPU-capable PCIe slot topology is unknown for this motherboard."
      : usage.gpuPcie.used <= available
        ? `GPUs use ${usage.gpuPcie.used}/${available} known GPU-capable slots.`
        : `GPUs require ${usage.gpuPcie.used} slots but only ${available} GPU-capable slots are known.`;
    results.push({ ruleId: "gpu-slot-capacity", status, message, involvedIds: [board.id, ...involved(gpus)] });
  }

  if (board && usage.generalPcie.used > 0 && usage.generalPcie.available !== null) {
    const fits = usage.generalPcie.used <= usage.generalPcie.available;
    results.push({ ruleId: "pcie-slot-capacity", status: fits ? "COMPATIBLE" : "INCOMPATIBLE", message: fits ? `Expansion cards use ${usage.generalPcie.used}/${usage.generalPcie.available} PCIe slots.` : `Expansion cards require ${usage.generalPcie.used} PCIe slots but motherboard exposes ${usage.generalPcie.available}.`, involvedIds: [board.id, ...involved(products.filter((product) => ["GPU", "NETWORK", "HBA"].includes(product.category)))] });
  }

  if (psu && (cpu || gpus.length)) {
    const demand = (cpu ? Number(specs(cpu).tdpWatts ?? 0) : 0) + gpus.reduce((sum, gpu) => sum + Number(specs(gpu).tdpWatts ?? 0), 0) + 100;
    const supply = Number(specs(psu).wattage ?? 0);
    const status = supply < demand ? "INCOMPATIBLE" : supply < demand * 1.2 ? "WARNING" : "COMPATIBLE";
    results.push({ ruleId: "psu-power-headroom", status, message: status === "INCOMPATIBLE" ? `Estimated ${demand}W demand exceeds ${supply}W PSU.` : status === "WARNING" ? `PSU has limited headroom above estimated ${demand}W demand.` : `PSU has reasonable headroom above estimated ${demand}W demand.`, involvedIds: [psu.id, ...(cpu ? [cpu.id] : []), ...involved(gpus)] });
  }

  if (psu && gpus.length) {
    const gpuConnectorSets = gpus.map((gpu) => specs(gpu).powerConnectors as Record<string, number> | undefined);
    const available = specs(psu).connectors as Record<string, number> | undefined;
    if (!available || gpuConnectorSets.some((connectors) => connectors === undefined)) {
      results.push({ ruleId:"gpu-psu-connectors", status:"UNKNOWN", message:"GPU or PSU connector requirements are unknown.", involvedIds:[psu.id, ...involved(gpus)] });
    } else {
      const required: Record<string, number> = {};
      for (const connectors of gpuConnectorSets) {
        for (const [kind, count] of Object.entries(connectors!)) required[kind] = (required[kind] ?? 0) + count;
      }
      const fits = Object.entries(required).every(([kind, count]) => (available[kind] ?? 0) >= count);
      results.push({ ruleId:"gpu-psu-connectors", status:fits ? "COMPATIBLE" : "INCOMPATIBLE", message:fits ? "PSU has the native GPU power connectors required." : "PSU lacks enough native GPU power connectors for all installed GPUs.", involvedIds:[psu.id, ...involved(gpus)] });
    }
  }

  return results;
}
