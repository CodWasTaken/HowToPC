import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { buildParametricScene } from "./index";

const ids = [
  "cpu-am5-7600", "mb-b650-atx", "ram-ddr5-32", "gpu-mid-300",
  "case-atx-340", "psu-atx-750", "cooler-air-158", "ssd-nvme-2tb",
];
const products = referenceCatalog.filter((p) => ids.includes(p.id));

function byCategory(category: string) {
  const scene = buildParametricScene(products);
  const box = scene.components.find((item) => item.category === category);
  if (!box) throw new Error(`Missing ${category}`);
  return { scene, box };
}

describe("parametric digital twin", () => {
  test("uses X width, Y vertical, Z depth for motherboard and GPU", () => {
    const board = byCategory("MOTHERBOARD").box;
    const gpu = byCategory("GPU").box;
    expect(board.size).toEqual([8, 305, 244]);
    expect(gpu.size).toEqual([120, 50.8, 300]);
  });

  test("anchors different PSU sizes to the same rear and floor planes", () => {
    const atxScene = buildParametricScene(products);
    const sfxProducts = products.filter((p) => p.category !== "PSU").concat(
      referenceCatalog.filter((p) => p.id === "psu-sfx-750"),
    );
    const sfxScene = buildParametricScene(sfxProducts);
    const atx = atxScene.components.find((p) => p.category === "PSU")!;
    const sfx = sfxScene.components.find((p) => p.category === "PSU")!;
    const rear = atxScene.caseBox.size[2] / 2;
    const floor = -atxScene.caseBox.size[1] / 2;
    expect(atx.position[2] + atx.size[2] / 2).toBeCloseTo(rear);
    expect(sfx.position[2] + sfx.size[2] / 2).toBeCloseTo(rear);
    expect(atx.position[1] - atx.size[1] / 2).toBeCloseTo(floor);
    expect(sfx.position[1] - sfx.size[1] / 2).toBeCloseTo(floor);
  });

  test("keeps motherboard-attached parts on the component side of the tray", () => {
    const scene = buildParametricScene(products);
    const board = scene.components.find((p) => p.category === "MOTHERBOARD")!;
    const boardFace = board.position[0] + board.size[0] / 2;
    for (const category of ["CPU", "MEMORY", "COOLER", "GPU", "STORAGE"]) {
      const part = scene.components.find((p) => p.category === category)!;
      expect(part.position[0] - part.size[0] / 2).toBeGreaterThanOrEqual(boardFace - 0.01);
    }
  });
});
