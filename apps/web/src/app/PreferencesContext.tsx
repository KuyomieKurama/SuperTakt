import { themePreset } from "../lib/themePresets";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { errorMessage } from "../api/client";
import { updateSettings } from "../api/endpoints";
import { useDensity, useDesignTheme, useThemePreference, type Density, type DesignTheme, type ThemePreference } from "../lib/theme";
import { useStructure } from "./StructureContext";
import { useToasts } from "./ToastContext";
import { cacheAppearance, startupAppearance } from "../lib/startupAppearance";

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
  readonly idleKeepTimerRunning: boolean;
  readonly idleThresholdMinutes: number;
}

export interface PreferencesApi extends PreferenceValues {
  readonly setTheme: (next: ThemePreference) => void;
  readonly setDesignTheme: (next: DesignTheme) => void;
  readonly setDensity: (next: Density) => void;
  readonly setPromptOnTimerStop: (next: boolean) => void;
  readonly setIdleKeepTimerRunning: (next: boolean) => void;
  readonly setIdleDetectionEnabled: (next: boolean) => void;
  readonly setIdleThresholdMinutes: (next: number) => void;
  readonly saving: boolean;
}

const PreferencesContext = createContext<PreferencesApi | null>(null);

export function PreferencesProvider({ children }: { readonly children: ReactNode }) {
  const structure = useStructure();
  const toasts = useToasts();
  const [initialAppearance] = useState(startupAppearance);
  const [designTheme, setDesignThemeLocal] = useDesignTheme(initialAppearance.designTheme);
  const [theme, setThemeLocal] = useThemePreference(initialAppearance.theme, themePreset(designTheme).mode);
  const [density, setDensityLocal] = useDensity(initialAppearance.density);
  const [promptOnTimerStop, setPromptOnTimerStopLocal] = useState(true);
  const [idleKeepTimerRunning, setIdleKeepTimerRunningLocal] = useState(true);
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
  const storedKeepRunning = settings?.idleKeepTimerRunning;
  const storedIdle = settings?.idleDetectionEnabled;
  const storedThreshold = settings?.idleThresholdMinutes;

  const apply = useCallback((value: PreferenceValues, persistAppearance = true) => {
    if (persistAppearance) cacheAppearance(value);
    setThemeLocal(value.theme);
    setDesignThemeLocal(value.designTheme);
    setDensityLocal(value.density);
    setPromptOnTimerStopLocal(value.promptOnTimerStop);
    setIdleDetectionEnabledLocal(value.idleDetectionEnabled);
    setIdleKeepTimerRunningLocal(value.idleKeepTimerRunning);
    setIdleThresholdMinutesLocal(value.idleThresholdMinutes);
  }, [setThemeLocal, setDesignThemeLocal, setDensityLocal]);

  useEffect(() => {
    if (storedTheme !== undefined && !inFlight.current) {
      apply({ theme: storedTheme, designTheme: storedDesign ?? "classic", density: storedDensity ?? "comfortable", promptOnTimerStop: storedPrompt ?? true, idleDetectionEnabled: storedIdle ?? true, idleKeepTimerRunning: storedKeepRunning ?? true, idleThresholdMinutes: storedThreshold ?? 5 });
    }
  }, [storedTheme, storedDesign, storedDensity, storedPrompt, storedIdle, storedKeepRunning, storedThreshold, apply]);

  const change = useCallback((patch: Partial<PreferenceValues>) => {
    if (inFlight.current) return;
    const previous = { theme, designTheme, density, promptOnTimerStop, idleDetectionEnabled, idleKeepTimerRunning, idleThresholdMinutes };
    inFlight.current = true;
    setSaving(true);
    apply({ ...previous, ...patch }, false);
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
  }, [theme, designTheme, density, promptOnTimerStop, idleDetectionEnabled, idleKeepTimerRunning, idleThresholdMinutes, apply, structure, toasts]);

  const api = useMemo<PreferencesApi>(() => ({
    theme, designTheme, density, promptOnTimerStop, idleDetectionEnabled, idleKeepTimerRunning, idleThresholdMinutes, saving,
    setTheme: (next) => change({ theme: next }),
    setDesignTheme: (next) => change({ designTheme: next }),
    setDensity: (next) => change({ density: next }),
    setPromptOnTimerStop: (next) => change({ promptOnTimerStop: next }),
    setIdleKeepTimerRunning: (next) => change({ idleKeepTimerRunning: next }),
    setIdleDetectionEnabled: (next) => change({ idleDetectionEnabled: next }),
    setIdleThresholdMinutes: (next) => change({ idleThresholdMinutes: next }),
  }), [theme, designTheme, density, promptOnTimerStop, idleDetectionEnabled, idleKeepTimerRunning, idleThresholdMinutes, saving, change]);

  return <PreferencesContext.Provider value={api}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesApi {
  const value = useContext(PreferencesContext);
  if (value === null) throw new Error("usePreferences ausserhalb von PreferencesProvider benutzt.");
  return value;
}
