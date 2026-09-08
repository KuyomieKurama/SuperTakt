import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { errorMessage } from "../api/client";
import { updateSettings } from "../api/endpoints";
import { useDensity, useDesignTheme, useThemePreference, type Density, type DesignTheme, type ThemePreference } from "../lib/theme";
import { useStructure } from "./StructureContext";
import { useToasts } from "./ToastContext";

/**
 * Darstellung (A-21.4): Gestaltung, Farbmodus und Dichte sind unabhängig.
 * Die lokale Datenbank hält alle drei Werte. Ein Wechsel wirkt sofort und
 * wird bei einem Schreibfehler auf den vorherigen Zustand zurückgesetzt.
 */
interface Appearance {
  readonly theme: ThemePreference;
  readonly designTheme: DesignTheme;
  readonly density: Density;
}

export interface PreferencesApi extends Appearance {
  readonly setTheme: (next: ThemePreference) => void;
  readonly setDesignTheme: (next: DesignTheme) => void;
  readonly setDensity: (next: Density) => void;
  readonly saving: boolean;
}

const PreferencesContext = createContext<PreferencesApi | null>(null);

export function PreferencesProvider({ children }: { readonly children: ReactNode }) {
  const structure = useStructure();
  const toasts = useToasts();
  const [theme, setThemeLocal] = useThemePreference("system");
  const [designTheme, setDesignThemeLocal] = useDesignTheme("clear");
  const [density, setDensityLocal] = useDensity("comfortable");
  const [saving, setSaving] = useState(false);
  // The ref also guards two events in the same render, before controls disable.
  const inFlight = useRef(false);

  const settings = structure.state.status === "ready" ? structure.state.value.settings : null;
  const storedTheme = settings?.theme;
  const storedDesign = settings?.designTheme;
  const storedDensity = settings?.density;

  const apply = useCallback((value: Appearance) => {
    setThemeLocal(value.theme);
    setDesignThemeLocal(value.designTheme);
    setDensityLocal(value.density);
  }, [setThemeLocal, setDesignThemeLocal, setDensityLocal]);

  useEffect(() => {
    if (storedTheme !== undefined && !inFlight.current) {
      apply({ theme: storedTheme, designTheme: storedDesign ?? "clear", density: storedDensity ?? "comfortable" });
    }
  }, [storedTheme, storedDesign, storedDensity, apply]);

  const change = useCallback((patch: Partial<Appearance>) => {
    if (inFlight.current) return;
    const previous = { theme, designTheme, density };
    inFlight.current = true;
    setSaving(true);
    apply({ ...previous, ...patch });
    void updateSettings(patch)
      .then((saved) => {
        apply(saved);
        structure.reload();
      })
      .catch((cause: unknown) => {
        apply(previous);
        toasts.failure("Die Darstellung wurde nicht gespeichert", errorMessage(cause));
      })
      .finally(() => {
        inFlight.current = false;
        setSaving(false);
      });
  }, [theme, designTheme, density, apply, structure, toasts]);

  const api = useMemo<PreferencesApi>(() => ({
    theme, designTheme, density, saving,
    setTheme: (next) => change({ theme: next }),
    setDesignTheme: (next) => change({ designTheme: next }),
    setDensity: (next) => change({ density: next }),
  }), [theme, designTheme, density, saving, change]);

  return <PreferencesContext.Provider value={api}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesApi {
  const value = useContext(PreferencesContext);
  if (value === null) throw new Error("usePreferences ausserhalb von PreferencesProvider benutzt.");
  return value;
}
