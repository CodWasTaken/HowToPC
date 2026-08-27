import type { PhysicalInstance } from "./instances";
import type { MountSlot, MountTopology } from "./topology";
import type { Vec3 } from "./scene";

export interface MountAssignment { instanceId: string; mountId: string; position: Vec3 }
export interface PlacementIssue {
  instanceId: string;
  code: "NO_MOUNT" | "TOPOLOGY_UNKNOWN" | "MOUNT_OCCUPIED";
  message: string;
}

const specs = (instance: PhysicalInstance) => instance.product.specs as Record<string, any>;

export function allocateMounts(instances: readonly PhysicalInstance[], topology: MountTopology) {
  const assignments: MountAssignment[] = [];
  const issues: PlacementIssue[] = [];
  const used = new Set<string>();
  const byKind = (kind: MountSlot["kind"]) => topology.slots.filter((slot) => slot.kind === kind);
  const free = (slots: readonly MountSlot[]) => slots.find((slot) => !used.has(slot.id));

  const assign = (instance: PhysicalInstance, slot: MountSlot, position: Vec3 = slot.position, mountId = slot.id) => {
    if (used.has(mountId)) {
      issues.push({ instanceId: instance.id, code: "MOUNT_OCCUPIED", message: `${mountId} is already occupied.` });
      return;
    }
    used.add(mountId);
    assignments.push({ instanceId: instance.id, mountId, position });
  };
  const noMount = (instance: PhysicalInstance, kind: string) =>
    issues.push({ instanceId: instance.id, code: "NO_MOUNT", message: `No free ${kind} mount is available.` });

  const gpuInstances = instances.filter((instance) => instance.category === "GPU");
  let unknownGpuAssigned = false;

  for (const instance of instances) {
    if (instance.category === "MOTHERBOARD") {
      const slot = free(byKind("BOARD"));
      slot ? assign(instance, slot) : noMount(instance, "motherboard");
      continue;
    }
    if (instance.category === "CPU") {
      const slot = free(byKind("CPU"));
      slot ? assign(instance, slot) : noMount(instance, "CPU");
      continue;
    }
    if (instance.category === "PSU") {
      const slot = free(byKind("PSU"));
      if (!slot) noMount(instance, "PSU");
      else {
        const [caseWidth, caseHeight, caseDepth] = topology.caseSize;
        void caseWidth;
        assign(instance, slot, [0, -caseHeight / 2 + instance.size[1] / 2, caseDepth / 2 - instance.size[2] / 2]);
      }
      continue;
    }
    if (instance.category === "COOLER") {
      const cpu = byKind("CPU")[0];
      if (!cpu) noMount(instance, "CPU cooler");
      else assign(instance, cpu, [cpu.position[0] + 2.5 + instance.size[0] / 2, cpu.position[1], cpu.position[2]], `${cpu.id}:cooler`);
      continue;
    }
    if (instance.category === "MEMORY") {
      const slot = free(byKind("DIMM"));
      slot ? assign(instance, slot) : noMount(instance, "DIMM");
      continue;
    }
    if (instance.category === "STORAGE") {
      const isM2 = String(specs(instance).formFactor).includes("M.2") || String(specs(instance).interface) === "NVME";
      if (isM2) {
        const slot = free(byKind("M2"));
        slot ? assign(instance, slot) : noMount(instance, "M.2");
      } else {
        const kind = String(specs(instance).formFactor).includes("2.5") ? "SATA_25" : "SATA_35";
        const slot = free(byKind(kind));
        slot ? assign(instance, slot) : noMount(instance, kind === "SATA_25" ? "2.5-inch drive" : "3.5-inch drive");
      }
      continue;
    }
    if (instance.category === "GPU") {
      const allPcie = byKind("PCIE");
      const knownGpuSlots = allPcie.filter((slot) => slot.gpuCapable === true);
      let slot = free(knownGpuSlots);
      if (!slot && knownGpuSlots.length === 0 && gpuInstances.length === 1) {
        slot = free(allPcie);
        if (slot) {
          issues.push({ instanceId: instance.id, code: "TOPOLOGY_UNKNOWN", message: "Exact GPU-capable slot topology is unknown; using the first general PCIe mount for the parametric preview." });
          unknownGpuAssigned = true;
        }
      }
      if (!slot && knownGpuSlots.length === 0 && gpuInstances.length > 1) {
        if (!unknownGpuAssigned) {
          slot = free(allPcie);
          unknownGpuAssigned = Boolean(slot);
        }
        if (!slot) {
          issues.push({ instanceId: instance.id, code: "TOPOLOGY_UNKNOWN", message: "Multiple GPU placement cannot be verified because GPU-capable slot topology is unknown." });
          continue;
        }
      }
      if (!slot) { noMount(instance, "GPU-capable PCIe"); continue; }
      assign(instance, slot, [slot.position[0] + instance.size[0] / 2, slot.position[1], slot.position[2] - instance.size[2] / 2]);
      continue;
    }
    if (instance.category === "NETWORK" || instance.category === "HBA") {
      const slot = free(byKind("PCIE"));
      if (!slot) noMount(instance, "PCIe");
      else assign(instance, slot, [slot.position[0] + instance.size[0] / 2, slot.position[1], slot.position[2] - instance.size[2] / 2]);
      continue;
    }

    noMount(instance, instance.category.toLowerCase());
  }

  return { assignments, issues };
}
