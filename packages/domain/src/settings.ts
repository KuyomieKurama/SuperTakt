import { DESIGN_THEMES } from './design-themes.generated.ts';
/**
 * Takt — Einstellungen (A-9, E-009, E-011). Tabelle `app_setting`.
 */

import type { ExportTemplateId, Timestamp } from './kernel.ts';
import type { RoundingMode } from './rounding.ts';

/** `system` ist eine ausdrückliche Wahl und kein fehlender Wert. */
export type Theme = 'system' | 'light' | 'dark';

/** Gestaltung unabhängig vom Farbmodus (A-21.4). */
export { DESIGN_THEMES } from './design-themes.generated.ts';
export type DesignTheme = (typeof DESIGN_THEMES)[number];
export type Density = 'comfortable' | 'compact';

/** Das Add-in-Token liegt außerhalb der Datenbank in einer eigenen Datei. */
export interface AppSettings {
  /**
   * Zielordner für Exportdateien (E-011). `null` bedeutet: noch nicht gewählt,
   * Export nicht möglich. Der Pfad ist Benutzereingabe und wird bei jedem Lauf
   * neu geprüft, nicht nur beim Setzen (R-11).
   */
  readonly exportDirectory: string | null;
  readonly activeExportTemplateId: ExportTemplateId | null;
  /** Umschaltbar; der verwendete Modus wird je Exportlauf mitgeschrieben (E-008). */
  readonly roundingMode: RoundingMode;
  readonly locale: string;
  readonly theme: Theme;
  readonly designTheme: DesignTheme;
  readonly density: Density;
  readonly promptOnTimerStop: boolean;
  readonly idleDetectionEnabled: boolean;
  readonly idleKeepTimerRunning: boolean;
  readonly idleThresholdMinutes: number;
  /**
   * Überspringt dauerhaft genau eine Fassung. Den gespeicherten Fremdwert beim Lesen und Schreiben
   * prüfen; ungültig bedeutet „nichts übersprungen“.
   * Dieser Wert darf niemals in eine URL eingehen.
   */
  readonly skippedVersion: string | null;
  readonly updatedAt: Timestamp;
}

/** Änderung an den Einstellungen. Nicht gesetzte Felder bleiben unverändert. */
export interface AppSettingsUpdate {
  readonly exportDirectory?: string | null;
  readonly activeExportTemplateId?: ExportTemplateId | null;
  readonly roundingMode?: RoundingMode;
  readonly locale?: string;
  readonly theme?: Theme;
  readonly designTheme?: DesignTheme;
  readonly density?: Density;
  readonly promptOnTimerStop?: boolean;
  readonly idleDetectionEnabled?: boolean;
  readonly idleKeepTimerRunning?: boolean;
  readonly idleThresholdMinutes?: number;
  /** `null` setzt „nichts übersprungen" zurück. Nicht gesetzt heißt unverändert. */
  readonly skippedVersion?: string | null;
  readonly now: Timestamp;
}

/**
 * Nur belegte Merkmale liefern. Eine fehlende Angabe ist keine Entwarnung; Pfadheuristiken der
 * Oberfläche bleiben davon getrennt.
 */
export type LocationTrait = 'unc' | 'network' | 'sync_folder' | 'system_dir';

/**
 * Kompatibilitätsalias für dieselben Standortmerkmale, unabhängig vom Verwendungszweck des
 * Ordners.
 */
export type ExportDirectoryTrait = LocationTrait;

/**
 * Vor jedem Schreiben erneut prüfen. `unreachable` bedeutet fehlende Antwort, nicht nachgewiesene
 * Abwesenheit.
 */
export type ExportDirectoryCheck =
  | { readonly ok: true; readonly resolvedPath: string }
  | { readonly ok: false; readonly reason: 'not_set' | 'missing' | 'not_writable' | 'not_a_directory' }
  | {
      readonly ok: false;
      readonly reason: 'unreachable';
      /** Wie lange gewartet wurde, bevor abgebrochen wurde. Für die Meldung. */
      readonly waitedMs: number;
    };
