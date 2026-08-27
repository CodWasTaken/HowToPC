import { describe, expect, test } from "vitest";
import { referenceCatalog } from "@howtopc/catalog";
import { evaluateBuild } from "@howtopc/compatibility";
import { actionableResults, partRowTitle, presentBuildStatus } from "./presentation";

const product = (id: string) => {
  const found = referenceCatalog.find((item) => item.id === id);
  if (!found) throw new Error(`Missing ${id}`);
  return found;
};

describe("configurator presentation", () => {
  test("presents missing prerequisites as INCOMPLETE", () => {
    expect(presentBuildStatus(evaluateBuild([]))).toBe("INCOMPLETE");
  });

  test("keeps known conflicts and blocking unknowns distinct", () => {
    const conflict = evaluateBuild([product("cpu-am5-7600"), product("mb-asus-p8h61-m-lx3-r2")]);
    expect(presentBuildStatus(conflict)).toBe("INCOMPATIBLE");
  });
  test("returns only actionable compatibility results by default", () => {
    const report = evaluateBuild([
      product("cpu-am5-7600"), product("mb-b650-atx"),
      product("ram-ddr5-32"), product("case-atx-340"),
      product("psu-atx-750"), product("cooler-air-158"),
    ]);
    expect(actionableResults(report).every((result) => result.status !== "COMPATIBLE")).toBe(true);
  });

  test("preserves the complete hardware identity for accessible row text", () => {
    const long = {
      ...product("cpu-am5-7600"),
      displayName: "Extremely Long Processor Model Name With Full Manufacturer Variant Information",
    };
    expect(partRowTitle(long)).toContain(long.displayName);
    expect(partRowTitle(long)).toContain(long.manufacturer);
  });
});
