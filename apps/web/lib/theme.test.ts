import { describe, expect, test } from "vitest";
import * as theme from "./theme";

describe("theme preference", () => {
  test("defaults to dark and only accepts explicit saved themes", () => {
    const normalize = (theme as any).normalizeTheme;
    const toggle = (theme as any).toggleTheme;
    expect(normalize).toBeDefined();
    expect(normalize?.(undefined)).toBe("dark");
    expect(normalize?.("light")).toBe("light");
    expect(normalize?.("system")).toBe("dark");
    expect(toggle?.("dark")).toBe("light");
    expect(toggle?.("light")).toBe("dark");
  });
});
