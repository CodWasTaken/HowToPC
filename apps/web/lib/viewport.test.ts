import { describe, expect, test } from "vitest";
import * as viewport from "./viewport";

describe("digital twin hover readout", () => {
  test("formats a compact engineering label for the hovered scene part", () => {
    const format = (viewport as any).formatHoverLabel;
    expect(format).toBeDefined();
    expect(format?.({ category: "GPU", label: "1440p GPU 300mm" })).toBe("GPU · 1440p GPU 300mm");
  });
});

test("requires a case before rendering the mechanical scene", () => {
  const canRender = (viewport as any).canRenderTwin;
  expect(canRender).toBeDefined();
  expect(canRender?.([{ category: "CPU" }])).toBe(false);
  expect(canRender?.([{ category: "CASE" }])).toBe(true);
});
