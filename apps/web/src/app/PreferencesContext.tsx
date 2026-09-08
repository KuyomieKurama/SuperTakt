import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { errorMessage } from "../api/client";
import { updateSettings } from "../api/endpoints";
import { useDensity, useDesignTheme, useThemePreference, type Density, type DesignTheme, type ThemePreference } from "../lib/theme";
import { useStructure } from "./StructureContext";
import { useToasts } from "./ToastContext";

/**
 * Darstellung und Timerverhalten (A-21.4, A-22.1) sind unabhängig.
 * Die lokale Datenbank hält die Einstellungen. Ein Wechsel wirkt sofort und
 * wird bei einem Schreibfehler auf den vorherigen Zustand zurückgesetzt.
 */
interface PreferenceValues {
  readonly theme: ThemePreference;
  readonly designTheme: DesignTheme;
  readonly density: Density;
  readonly promptOnTimerStop: boolean;
  readonly idleDetectionEnabled: boolean;
  readonly idleThresholdMinutes: number;
}

export interface PreferencesApi extends PreferenceValues {
  readonly setTheme: (next: ThemePreference) => void;
  readonly setDesignTheme: (next: DesignTheme) => void;
  readonly setDensity: (next: Density) => void;
  readonly setPromptOnTimerStop: (next: boolean) => void;
  readonly setIdleDetectionEnabled: (next: boolean) => void;
  readonly setIdleThresholdMinutes: (next: number) => void;
  readonly saving: boolean;
}

const PreferencesContext = createContext<PreferencesApi | null>(null);

export function PreferencesProvider({ children }: { readonly children: ReactNode }) {
  const structure = useStructure();
  const toasts = useToasts();
  const [theme, setThemeLocal] = useThemePreference("system");
  const [designTheme, setDesignThemeLocal] = useDesignTheme("clear");
  const [density, setDensityLocal] = useDensity("comfortable");
  const [promptOnTimerStop, setPromptOnTimerStopLocal] = useState(true);
  const [idleDetectionEnabled, setIdleDetectionEnabledLocal] = useState(true);
  const [idleThresholdMinutes, setIdleThresholdMinutesLocal] = useState(5);
  const [saving, setSaving] = useState(false);
  // The ref also guards two events in the same render, before controls disable.
  const inFlight = useRef(false);

  const settings = structure.state.status === "ready" ? structure.state.value.settings : null;
  const storedTheme = settings?.theme;
  const storedDesign = settings?.designTheme;
  const storedDensity = settings?.density;
  const storedPrompt = settings?.promptOnTimerStop;
  const storedIdle = settings?.idleDetectionEnabled;
  const storedThreshold = settings?.idleThresholdMinutes;

  const apply = useCallback((value: PreferenceValues) => {
    setThemeLocal(value.theme);
    setDesignThemeLocal(value.designTheme);
    setDensityLocal(value.density);
    setPromptOnTimerStopLocal(value.promptOnTimerStop);
    setIdleDetectionEnabledLocal(value.idleDetectionEnabled);
    setIdleThresholdMinutesLocal(value.idleThresholdMinutes);
  }, [setThemeLocal, setDesignThemeLocal, setDensityLocal]);

  useEffect(() => {
    if (storedTheme !== undefined && !inFlight.current) {
      apply({ theme: storedTheme, designTheme: storedDesign ?? "clear", density: storedDensity ?? "comfortable", promptOnTimerStop: storedPrompt ?? true, idleDetectionEnabled: storedIdle ?? true, idleThresholdMinutes: storedThreshold ?? 5 });
    }
  }, [storedTheme, storedDesign, storedDensity, storedPrompt, storedIdle, storedThreshold, apply]);

  const change = useCallback((patch: Partial<PreferenceValues>) => {
    if (inFlight.current) return;
    const previous = { theme, designTheme, density, promptOnTimerStop, idleDetectionEnabled, idleThresholdMinutes };
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
        toasts.failure("Die Einstellung wurde nicht gespeichert", errorMessage(cause));
      })
      .finally(() => {
        inFlight.current = false;
        setSaving(false);
      });
  }, [theme, designTheme, density, promptOnTimerStop, idleDetectionEnabled, idleThresholdMinutes, apply, structure, toasts]);

  const api = useMemo<PreferencesApi>(() => ({
    theme, designTheme, density, promptOnTimerStop, idleDetectionEnabled, idleThresholdMinutes, saving,
    setTheme: (next) => change({ theme: next }),
    setDesignTheme: (next) => change({ designTheme: next }),
    setDensity: (next) => change({ density: next }),
    setPromptOnTimerStop: (next) => change({ promptOnTimerStop: next }),
    setIdleDetectionEnabled: (next) => change({ idleDetectionEnabled: next }),
    setIdleThresholdMinutes: (next) => change({ idleThresholdMinutes: next }),
  }), [theme, designTheme, density, promptOnTimerStop, idleDetectionEnabled, idleThresholdMinutes, saving, change]);

  return <PreferencesContext.Provider value={api}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesApi {
  const value = useContext(PreferencesContext);
  if (value === null) throw new Error("usePreferences ausserhalb von PreferencesProvider benutzt.");
  return value;
}
