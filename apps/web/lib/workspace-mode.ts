export type WorkspaceMode = "WIDE" | "DRAWERS" | "TABS";

export function workspaceMode(width: number): WorkspaceMode {
  if (width >= 1400) return "WIDE";
  if (width >= 900) return "DRAWERS";
  return "TABS";
}
