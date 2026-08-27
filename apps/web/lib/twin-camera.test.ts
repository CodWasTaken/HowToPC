import { describe, expect, test } from "vitest";
import { cameraPoseForView } from "./twin-camera";

const caseSize = [230, 470, 430] as const;

describe("digital twin camera poses", () => {
  test("maps named views to distinct world-axis directions", () => {
    const iso = cameraPoseForView("ISO", caseSize);
    const front = cameraPoseForView("FRONT", caseSize);
    const side = cameraPoseForView("SIDE", caseSize);
    const top = cameraPoseForView("TOP", caseSize);
    expect(new Set([iso.position.join(","), front.position.join(","), side.position.join(","), top.position.join(",")]).size).toBe(4);
    expect(front.position[2]).toBeLessThan(0);
    expect(side.position[0]).toBeGreaterThan(0);
    expect(top.position[1]).toBeGreaterThan(0);
  });

  test("fits larger cases from farther away", () => {
    const small = cameraPoseForView("ISO", [185, 340, 360]);
    const large = cameraPoseForView("ISO", [330, 650, 650]);
    const magnitude = (value: readonly number[]) => Math.hypot(...value);
    expect(magnitude(large.position)).toBeGreaterThan(magnitude(small.position));
  });
});
