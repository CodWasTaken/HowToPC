export const COMPATIBILITY_STATUSES = [
  "COMPATIBLE",
  "INCOMPATIBLE",
  "WARNING",
  "UNKNOWN"
] as const;

export type CompatibilityStatus = (typeof COMPATIBILITY_STATUSES)[number];
