import { describe, expect, test } from "vitest";
import { workspaceMode } from "./workspace-mode";

describe("workspace responsive mode", () => {
  test("uses wide, drawer, and tab layouts at the approved breakpoints", () => {
    expect(workspaceMode(1920)).toBe("WIDE");
    expect(workspaceMode(1400)).toBe("WIDE");
    expect(workspaceMode(1366)).toBe("DRAWERS");
    expect(workspaceMode(900)).toBe("DRAWERS");
    expect(workspaceMode(899)).toBe("TABS");
    expect(workspaceMode(390)).toBe("TABS");
  });
});
