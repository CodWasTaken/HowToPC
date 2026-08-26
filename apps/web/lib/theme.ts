export type Theme = "dark" | "light";

export function normalizeTheme(value: string | null | undefined): Theme {
  return value === "light" ? "light" : "dark";
}

export function toggleTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
