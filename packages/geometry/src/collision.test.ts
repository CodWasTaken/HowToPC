import { describe, expect, test } from "vitest";
import { boxesOverlap, collisionPairKey, detectCollisions } from "./collision";

const box = (id: string, position: readonly [number, number, number], size: readonly [number, number, number] = [10, 10, 10]) => ({
  id, label: id, category: "TEST", position, size,
});

describe("AABB collision diagnostics", () => {
  test("distinguishes separated, touching, and intersecting boxes", () => {
    const origin = box("a", [0, 0, 0]);
    expect(boxesOverlap(origin, box("far", [20, 0, 0]))).toBe(false);
    expect(boxesOverlap(origin, box("touching", [10, 0, 0]))).toBe(false);
    expect(boxesOverlap(origin, box("intersecting", [9, 0, 0]))).toBe(true);
  });

  test("suppresses only explicitly allowed instance pairs", () => {
    const cpu = box("cpu", [0, 0, 0]);
    const cooler = box("cooler", [2, 0, 0]);
    expect(detectCollisions([cpu, cooler], new Set())).toHaveLength(1);
    expect(detectCollisions([cpu, cooler], new Set([collisionPairKey("cpu", "cooler")]))).toEqual([]);
  });

  test("reports a cooler and DIMM overlap with positive overlap dimensions", () => {
    const collisions = detectCollisions([
      box("cooler", [0, 0, 0], [100, 120, 120]),
      box("dimm", [45, 0, 0], [8, 45, 135]),
    ], new Set());
    expect(collisions).toHaveLength(1);
    expect(collisions[0].overlapMm.every((value) => value > 0)).toBe(true);
  });
});
