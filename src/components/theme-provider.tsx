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
  storeThemeCookies,
  THEME_PREFERENCE_COOKIE,
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
  /**
   * Preferencia y modo que el SERVIDOR ya leyo de las cookies. Son la unica
   * forma de que el primer render del cliente coincida con el del servidor:
   * antes el estado inicial se sacaba de `localStorage`, que el servidor no
   * ve, y eso producia las dos cosas a la vez —el destello de tema y el
   * desajuste de `aria-pressed`—.
   */
  initialTheme?: Theme;
  initialMode?: ResolvedTheme;
  initialPalette?: PaletteName;
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
  initialTheme,
  initialMode,
  initialPalette,
}: ThemeProviderProps) {
  /*
    El estado arranca de lo que el servidor ya rindio. Leer `localStorage`
    aqui —como se hacia— da el valor correcto pero SOLO en el cliente, y
    entonces el primer render del cliente no puede coincidir con el HTML del
    servidor. Las cookies mueven ese dato al servidor y el desajuste
    desaparece por construccion, no por un parche.
  */
  const [theme, setThemeState] = useState<Theme>(
    () => initialTheme ?? defaultTheme,
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(
    () => initialMode ?? "dark",
  );
  const [palette, setPaletteState] = useState<PaletteName>(
    () => initialPalette ?? DEFAULT_PALETTE,
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
    // El modo resuelto se guarda tambien aqui y no solo en `setTheme`: con la
    // preferencia en "system" lo decide el sistema operativo, y si cambia
    // mientras la pantalla esta abierta la cookie tiene que seguirlo.
    storeThemeCookies(theme, resolvedTheme, palette);
  }, [applyTheme, palette, resolvedTheme, theme]);

  /*
    Adopcion unica para quien ya tenia el tema en `localStorage` y todavia no
    en cookie. Esa persona ve UNA carga con el tema por defecto; a partir de
    ahi la cookie existe y el servidor ya lo rinde bien.

    Se adopta dentro de `requestAnimationFrame` y no en el cuerpo del efecto
    por dos razones: un `setState` sincrono ahi encadena un render extra y lo
    prohibe `react-hooks/set-state-in-effect`, y esperar un fotograma deja
    que el pintado inicial coincida con el HTML del servidor, que es
    justamente lo que se vino a arreglar.
  */
  useEffect(() => {
    if (document.cookie.includes(`${THEME_PREFERENCE_COOKIE}=`)) return;

    const id = window.requestAnimationFrame(() => {
      const guardado = getStoredTheme(defaultTheme);
      const paletaGuardada = getStoredPalette();
      if (guardado !== theme) setThemeState(guardado);
      if (paletaGuardada !== palette) setPaletteState(paletaGuardada);
    });

    return () => window.cancelAnimationFrame(id);
    // Solo al montar: es una migracion, no un sincronizador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
