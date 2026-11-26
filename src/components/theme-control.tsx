"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "system" | "light" | "dark";
const STORAGE_KEY = "studyroom:theme";
const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark" || value === "system";
function readPreference(): Theme {
  try { const saved = localStorage.getItem(STORAGE_KEY); return isTheme(saved) ? saved : "system"; }
  catch { return "system"; }
}
function applyTheme(preference: Theme) {
  const resolved = preference === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#171b1d" : "#f5f4f0");
}

export function ThemeControl() {
  const [preference, setPreference] = useState<Theme>(readPreference);
  useEffect(() => {
    applyTheme(preference);
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange() { if (preference === "system") applyTheme("system"); }
    function onStorage(event: StorageEvent) { if (event.key === STORAGE_KEY || event.key === null) setPreference(readPreference()); }
    system.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => { system.removeEventListener("change", onSystemChange); window.removeEventListener("storage", onStorage); };
  }, [preference]);

  const Icon = preference === "dark" ? Moon : preference === "light" ? Sun : Monitor;
  return <label className="theme-control" title="Choose a color theme"><Icon size={16} aria-hidden="true" /><select aria-label="Color theme" value={preference} onChange={event => {
    const next = event.target.value;
    if (!isTheme(next)) return;
    applyTheme(next); setPreference(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Keep the choice for this tab when storage is unavailable. */ }
  }}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}
