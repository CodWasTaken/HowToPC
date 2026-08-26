"use client";

import { useEffect, useState } from "react";
import { normalizeTheme, toggleTheme, type Theme } from "@/lib/theme";

const STORAGE_KEY = "howtopc-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  function toggle() {
    const next = toggleTheme(theme);
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return <button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? "Light" : "Dark"}</button>;
}
