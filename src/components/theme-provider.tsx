"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyPalette,
  DEFAULT_PALETTE,
  MODE_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
} from "@/lib/theme/apply";
import { isPaletteName, type PaletteName } from "@/lib/theme/palettes";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
  children: ReactNode;
  attribute?: "class";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /** Una de las ocho paletas del handoff. */
  palette: PaletteName;
  setPalette: (palette: PaletteName) => void;
};

const STORAGE_KEY = MODE_STORAGE_KEY;
const QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

function getStoredPalette(): PaletteName {
  if (typeof window === "undefined") return DEFAULT_PALETTE;

  try {
    const stored = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    if (isPaletteName(stored)) return stored;
  } catch {
    // localStorage can be unavailable in private or restricted contexts.
  }

  return DEFAULT_PALETTE;
}

function getStoredTheme(defaultTheme: Theme): Theme {
  if (typeof window === "undefined") return defaultTheme;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage can be unavailable in private or restricted contexts.
  }

  return defaultTheme;
}

function disableTransitionsTemporarily() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode("*,*::before,*::after{transition:none!important}"),
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    window.setTimeout(() => {
      style.parentNode?.removeChild(style);
    }, 1);
  };
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredTheme(defaultTheme),
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    getSystemTheme(),
  );
  const [palette, setPaletteState] = useState<PaletteName>(() =>
    getStoredPalette(),
  );

  const resolvedTheme: ResolvedTheme =
    theme === "system" && enableSystem
      ? systemTheme
      : theme === "dark"
        ? "dark"
        : "light";

  /**
   * Un solo punto de escritura para el tema: los diecinueve tokens de la
   * paleta y el modo salen juntos, porque `applyPalette` tambien alterna la
   * clase `dark` y `color-scheme`. Separarlos dejaba un fotograma con los
   * tokens de un modo y la clase del otro.
   */
  const applyTheme = useCallback(
    (nextPalette: PaletteName, nextMode: ResolvedTheme) => {
      const restoreTransitions = disableTransitionOnChange
        ? disableTransitionsTemporarily()
        : null;

      applyPalette(nextPalette, nextMode);
      restoreTransitions?.();
    },
    [disableTransitionOnChange],
  );

  useEffect(() => {
    applyTheme(palette, resolvedTheme);
  }, [applyTheme, palette, resolvedTheme]);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setSystemTheme(getSystemTheme());

    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage failures; the selected theme still applies in memory.
    }
  }, []);

  const setPalette = useCallback((next: PaletteName) => {
    setPaletteState(next);
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures; the selected palette still applies in memory.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      systemTheme,
      setTheme,
      palette,
      setPalette,
    }),
    [theme, resolvedTheme, systemTheme, setTheme, palette, setPalette],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "system" as Theme,
      resolvedTheme: "light" as ResolvedTheme,
      systemTheme: "light" as ResolvedTheme,
      setTheme: () => {},
      palette: DEFAULT_PALETTE,
      setPalette: () => {},
    };
  }

  return context;
}
