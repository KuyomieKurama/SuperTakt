import { useSyncExternalStore } from "react";

/**
 * The language of the main UI (A-28.2): German by default, English on request.
 *
 * Every bundle of UI texts is a pair `{ de, en }` of two objects with the same
 * shape; `pickTexts` returns the one for the current language. The English
 * object is typed as `typeof de`, so a missing or extra key is a type error.
 *
 * The stored value is `uiLanguage` in the Bestand (`GET/PATCH /settings`);
 * `PreferencesProvider` writes it and calls `setLanguage` once the settings
 * are loaded. Before that the UI starts in German.
 */
export type Language = "de" | "en";

export interface TextBundle<Texts> {
  readonly de: Texts;
  readonly en: Texts;
}

/** Display locale for `Intl` (E-123 point 1: English uses `en-GB`). */
export const LOCALE_OF: Readonly<Record<Language, string>> = {
  de: "de-DE",
  en: "en-GB",
};

let currentLanguage: Language = "de";
const listeners = new Set<() => void>();

export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Switches the language at once, without reload (welle-18-fluss.md 2.2).
 * `<html lang>` follows in the same step (WCAG 3.1.1).
 */
export function setLanguage(next: Language): void {
  if (next === currentLanguage) return;
  currentLanguage = next;
  document.documentElement.lang = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The current language, re-rendering the caller when it changes. `App` calls
 * it at the root, so the whole tree renders again in the new language.
 */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage, getLanguage);
}

export function pickTexts<Texts>(bundle: TextBundle<Texts>): Texts {
  return bundle[currentLanguage];
}

/** The `Intl` locale of the current language. */
export function currentLocale(): string {
  return LOCALE_OF[currentLanguage];
}
