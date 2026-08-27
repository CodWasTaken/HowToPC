import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { deriveMountTopology } from "./topology";

const pick = (...ids: string[]) => referenceCatalog.filter((product) => ids.includes(product.id));
const count = (topology: ReturnType<typeof deriveMountTopology>, kind: string) => topology.slots.filter((slot) => slot.kind === kind).length;

describe("parametric mount topology", () => {
  test("derives ATX board capacities without inventing exact coordinates", () => {
    const topology = deriveMountTopology(pick("mb-b650-atx", "case-atx-340"));
    expect(count(topology, "BOARD")).toBe(1);
    expect(count(topology, "CPU")).toBe(1);
    expect(count(topology, "PSU")).toBe(1);
    expect(count(topology, "DIMM")).toBe(4);
    expect(count(topology, "M2")).toBe(3);
    expect(count(topology, "PCIE")).toBe(3);
  });

  test("derives compact Mini-ITX capacities", () => {
    const topology = deriveMountTopology(pick("mb-b650-itx", "case-itx-320"));
    expect(count(topology, "DIMM")).toBe(2);
    expect(count(topology, "M2")).toBe(2);
    expect(count(topology, "PCIE")).toBe(1);
  });

  test("adds parametric drive mounts only for installed SATA drives", () => {
    const topology = deriveMountTopology(pick("mb-b650-atx", "case-atx-340", "hdd-sata-8tb", "hdd-wd5000aakx"));
    expect(count(topology, "SATA_25") + count(topology, "SATA_35")).toBe(2);
    expect(topology.notes.some((note) => note.includes("drive bay"))).toBe(true);
  });
});
