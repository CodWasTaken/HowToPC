import type { Vec3 } from "./scene";

export interface CollidableBox { id: string; position: Vec3; size: Vec3 }
export interface Collision { aId: string; bId: string; overlapMm: Vec3; message: string }

export function collisionPairKey(aId: string, bId: string): string {
  return aId < bId ? `${aId}::${bId}` : `${bId}::${aId}`;
}

function overlapVector(a: CollidableBox, b: CollidableBox): Vec3 {
  return [0, 1, 2].map((axis) =>
    (a.size[axis] + b.size[axis]) / 2 - Math.abs(a.position[axis] - b.position[axis]),
  ) as unknown as Vec3;
}

export function boxesOverlap(a: CollidableBox, b: CollidableBox): boolean {
  return overlapVector(a, b).every((value) => value > 0);
}

export function detectCollisions(
  boxes: readonly CollidableBox[],
  allowedPairs: ReadonlySet<string> = new Set(),
): Collision[] {
  const collisions: Collision[] = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i], b = boxes[j];
      if (allowedPairs.has(collisionPairKey(a.id, b.id))) continue;
      const overlapMm = overlapVector(a, b);
      if (!overlapMm.every((value) => value > 0)) continue;
      collisions.push({
        aId: a.id,
        bId: b.id,
        overlapMm,
        message: `${a.id} overlaps ${b.id} by ${overlapMm.map((value) => value.toFixed(1)).join(" × ")} mm.`,
      });
    }
  }
  return collisions;
}
