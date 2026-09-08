import { useCallback, useEffect, useState } from "react";
import type { DesignTheme, Density } from "@takt/domain";
import { themePreset } from "./themePresets";
import type { ThemeSetting } from "./labels";

/**
 * Vom Benutzer waehlbare Darstellung. `system` folgt der
 * Betriebssystemeinstellung.
 *
 * Die Wertemenge steht in `labels.ts`, weil sie aus dem Datenmodell stammt
 * (`app_setting.theme`) und dort auch ihre Beschriftungen hat (E-041). Zwei
 * Aufzaehlungen fuer dieselbe Spalte wuerden auseinanderlaufen.
 */
export type ThemePreference = ThemeSetting;

/** Zeilendichte der Tabellen und Listen. */
export type { Density, DesignTheme };

const THEME_ATTRIBUTE = "data-theme";
const DENSITY_ATTRIBUTE = "data-density";

function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") {
    root.removeAttribute(THEME_ATTRIBUTE);
    return;
  }
  root.setAttribute(THEME_ATTRIBUTE, preference);
}

function applyDensity(density: Density): void {
  document.documentElement.setAttribute(DENSITY_ATTRIBUTE, density);
}

/**
 * Haelt die Darstellungseinstellung und schreibt sie an das Wurzelelement.
 * Bewusst ohne Speicherung: die dauerhafte Ablage gehoert zu den
 * Anwendungseinstellungen (S-09) und laeuft ueber den lokalen Dienst.
 */
export function useThemePreference(
  initial: ThemePreference = "system",
  forcedMode: "auto" | "light" | "dark" = "auto",
): readonly [ThemePreference, (next: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(initial);

  useEffect(() => {
    applyTheme(forcedMode === "auto" ? preference : forcedMode);
  }, [preference, forcedMode]);

  const set = useCallback((next: ThemePreference) => {
    setPreference(next);
  }, []);

  return [preference, set] as const;
}

/** Haelt die Zeilendichte und schreibt sie an das Wurzelelement. */
export function useDensity(
  initial: Density = "comfortable",
): readonly [Density, (next: Density) => void] {
  const [density, setDensity] = useState<Density>(initial);

  useEffect(() => {
    applyDensity(density);
  }, [density]);

  const set = useCallback((next: Density) => {
    setDensity(next);
  }, []);

  return [density, set] as const;
}

/** Gestaltung und Farbmodus belegen getrennte Attribute und können kombiniert werden. */
export function useDesignTheme(initial: DesignTheme = "classic") {
  const [designTheme, setDesignTheme] = useState<DesignTheme>(initial);
  useEffect(() => {
    document.documentElement.setAttribute("data-design-theme", themePreset(designTheme).value);
  }, [designTheme]);
  return [designTheme, setDesignTheme] as const;
}

/** Meldet, ob der Benutzer reduzierte Bewegung angefordert hat. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent): void => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
