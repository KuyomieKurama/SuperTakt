import { themePreset } from "./themePresets";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { errorMessage, isServiceError } from "../../api/client";
import { updateSettings } from "./api";
import { useDensity, useDesignTheme, useMotionIntensity, useThemePreference, type Density, type DesignTheme, type ThemePreference } from "./theme";
import type { MotionIntensity } from '@takt/domain';
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { cacheAppearance, startupAppearance } from "./startupAppearance";
import { settingsTexts } from "./texts";
import { setLanguage, useLanguage, type Language } from "../../lib/language";

/**
 * Darstellung und Timerverhalten (A-21.4, A-22.1) sind unabhängig.
 * Die lokale Datenbank hält die Einstellungen. Ein Wechsel wirkt sofort und
 * wird bei einem Schreibfehler auf den vorherigen Zustand zurückgesetzt.
 */
interface PreferenceValues {
  readonly theme: ThemePreference;
  readonly designTheme: DesignTheme;
  readonly density: Density;
  readonly motionIntensity: MotionIntensity;
  readonly promptOnTimerStop: boolean;
  readonly idleDetectionEnabled: boolean;
  readonly idleKeepTimerRunning: boolean;
  readonly idleThresholdMinutes: number;
  /** A-28.1 — may the service ask GitHub for new versions? */
  readonly versionCheckEnabled: boolean;
  /** A-28.2 — lives in `lib/language.ts`; this context only stores and restores it. */
  readonly uiLanguage: Language;
}

export interface PreferencesApi extends PreferenceValues {
  readonly setTheme: (next: ThemePreference) => void;
  readonly setDesignTheme: (next: DesignTheme) => void;
  readonly setDensity: (next: Density) => void;
  readonly setMotionIntensity: (next: MotionIntensity) => void;
  readonly setPromptOnTimerStop: (next: boolean) => void;
  readonly setIdleKeepTimerRunning: (next: boolean) => void;
  readonly setIdleDetectionEnabled: (next: boolean) => void;
  readonly setIdleThresholdMinutes: (next: number) => void;
  readonly setVersionCheckEnabled: (next: boolean) => void;
  readonly setUiLanguage: (next: Language) => void;
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
  const [motionIntensity, setMotionIntensityLocal] = useMotionIntensity(initialAppearance.motionIntensity);
  const [promptOnTimerStop, setPromptOnTimerStopLocal] = useState(true);
  const [idleKeepTimerRunning, setIdleKeepTimerRunningLocal] = useState(true);
  const [idleDetectionEnabled, setIdleDetectionEnabledLocal] = useState(true);
  const [idleThresholdMinutes, setIdleThresholdMinutesLocal] = useState(5);
  const [versionCheckEnabled, setVersionCheckEnabledLocal] = useState(true);
  const uiLanguage = useLanguage();
  const [saving, setSaving] = useState(false);
  // Die Referenz sperrt auch weitere Ereignisse vor dem nächsten Rendern.
  const inFlight = useRef(false);

  const settings = structure.state.status === "ready" ? structure.state.value.settings : null;
  const storedTheme = settings?.theme;
  const storedDesign = settings?.designTheme;
  const storedDensity = settings?.density;
  const storedMotionIntensity = settings?.motionIntensity;
  const storedPrompt = settings?.promptOnTimerStop;
  const storedKeepRunning = settings?.idleKeepTimerRunning;
  const storedIdle = settings?.idleDetectionEnabled;
  const storedThreshold = settings?.idleThresholdMinutes;
  const storedVersionCheck = settings?.versionCheckEnabled;
  const storedLanguage = settings?.uiLanguage;

  const apply = useCallback((value: PreferenceValues, persistAppearance = true) => {
    if (persistAppearance) cacheAppearance(value);
    setThemeLocal(value.theme);
    setDesignThemeLocal(value.designTheme);
    setDensityLocal(value.density);
    setMotionIntensityLocal(value.motionIntensity);
    setPromptOnTimerStopLocal(value.promptOnTimerStop);
    setIdleDetectionEnabledLocal(value.idleDetectionEnabled);
    setIdleKeepTimerRunningLocal(value.idleKeepTimerRunning);
    setIdleThresholdMinutesLocal(value.idleThresholdMinutes);
    setVersionCheckEnabledLocal(value.versionCheckEnabled);
    setLanguage(value.uiLanguage);
  }, [setThemeLocal, setDesignThemeLocal, setDensityLocal, setMotionIntensityLocal]);

  useEffect(() => {
    if (storedTheme !== undefined && !inFlight.current) {
      apply({ theme: storedTheme, designTheme: storedDesign ?? "classic", density: storedDensity ?? "comfortable", motionIntensity: storedMotionIntensity ?? "subtle", promptOnTimerStop: storedPrompt ?? true, idleDetectionEnabled: storedIdle ?? true, idleKeepTimerRunning: storedKeepRunning ?? true, idleThresholdMinutes: storedThreshold ?? 5, versionCheckEnabled: storedVersionCheck ?? true, uiLanguage: storedLanguage ?? "de" });
    }
  }, [storedTheme, storedDesign, storedDensity, storedMotionIntensity, storedPrompt, storedIdle, storedKeepRunning, storedThreshold, storedVersionCheck, storedLanguage, apply]);

  const change = useCallback((patch: Partial<PreferenceValues>) => {
    if (inFlight.current) return;
    const previous = { theme, designTheme, density, motionIntensity, promptOnTimerStop, idleDetectionEnabled, idleKeepTimerRunning, idleThresholdMinutes, versionCheckEnabled, uiLanguage };
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
        toasts.failure(settingsTexts().settingNotSaved, errorMessage(cause), isServiceError(cause));
      })
      .finally(() => {
        inFlight.current = false;
        setSaving(false);
      });
  }, [theme, designTheme, density, motionIntensity, promptOnTimerStop, idleDetectionEnabled, idleKeepTimerRunning, idleThresholdMinutes, versionCheckEnabled, uiLanguage, apply, structure, toasts]);

  const api = useMemo<PreferencesApi>(() => ({
    theme, designTheme, density, motionIntensity, promptOnTimerStop, idleDetectionEnabled, idleKeepTimerRunning, idleThresholdMinutes, versionCheckEnabled, uiLanguage, saving,
    setTheme: (next) => change({ theme: next }),
    setDesignTheme: (next) => change({ designTheme: next }),
    setDensity: (next) => change({ density: next }),
    setMotionIntensity: (next) => change({ motionIntensity: next }),
    setPromptOnTimerStop: (next) => change({ promptOnTimerStop: next }),
    setIdleKeepTimerRunning: (next) => change({ idleKeepTimerRunning: next }),
    setIdleDetectionEnabled: (next) => change({ idleDetectionEnabled: next }),
    setIdleThresholdMinutes: (next) => change({ idleThresholdMinutes: next }),
    setVersionCheckEnabled: (next) => change({ versionCheckEnabled: next }),
    setUiLanguage: (next) => change({ uiLanguage: next }),
  }), [theme, designTheme, density, motionIntensity, promptOnTimerStop, idleDetectionEnabled, idleKeepTimerRunning, idleThresholdMinutes, versionCheckEnabled, uiLanguage, saving, change]);

  return <PreferencesContext.Provider value={api}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesApi {
  const value = useContext(PreferencesContext);
  if (value === null) throw new Error("usePreferences is only available inside PreferencesProvider.");
  return value;
}
