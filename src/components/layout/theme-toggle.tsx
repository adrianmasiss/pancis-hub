"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <div className="theme-segment" role="group" aria-label="Apariencia">
      <button
        type="button"
        aria-label="Modo claro"
        aria-pressed={resolvedTheme === "light"}
        onClick={() => setTheme("light")}
      >
        <Sun className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Modo oscuro"
        aria-pressed={resolvedTheme === "dark"}
        onClick={() => setTheme("dark")}
      >
        <Moon className="size-4" />
      </button>
    </div>
  );
}
