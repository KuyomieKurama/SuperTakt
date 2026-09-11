/**
 * Takt — Einstellungen und Standard-Tags (A-9.1, A-9.2, E-011, R-11, R-13).
 *
 * Zwei Dinge stehen im Rumpf von `GET /settings` und sind **keine**
 * Einstellungen: der Windows-Benutzername und der Ort des Bestands. Beide sind
 * Auskunft — sie kommen von der Hülle beziehungsweise aus dem Zusammenbau und
 * sind über keine Route änderbar (B-8.1, E-018). Warum sie trotzdem hier
 * herauskommen, steht an ihren Feldern in {@link SettingsView}.
 */

import type {
  AppSettings,
  DefaultTag,
  DesignTheme,
  Density,
  ExportDirectoryTrait,
  ExportTemplateId,
  LocationTrait,
  RoundingMode,
  TagId,
  Theme,
  Timestamp,
} from '@takt/domain';
import { checkVersion, err, taktError } from '@takt/domain';
import type { UnitOfWork } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from '../../context.ts';

export interface SettingsView {
  readonly settings: AppSettings;
  /** Zustand des Exportordners **jetzt**, nicht beim Einstellen (R-11). */
  readonly exportDirectoryState:
    | 'ok'
    | 'not_set'
    | 'missing'
    | 'not_writable'
    | 'not_a_directory'
    | 'unreachable';
  /**
   * Was am eingestellten Ordner belegbar ist (T-039).
   *
   * Leer, solange nichts belegt ist — auch bei `missing` und `not_a_directory`,
   * wo der Grund die ganze Auskunft ist. Die Oberfläche warnt daneben weiter aus
   * dem Pfad heraus; diese Liste ist der Beleg, nicht die Warnung.
   */
  readonly exportDirectoryTraits: readonly ExportDirectoryTrait[];
  readonly defaultTags: readonly DefaultTag[];
  /**
   * Unter welchem Namen abgerechnet wird (E-010, E-042, T-042).
   *
   * Er stand bis T-041 **nur** in `ExportRun.windowsUser`, also erst nach dem
   * ersten Export. Genau davor will man ihn aber wissen: E-042 hat einen
   * abgesicherten Kanal gebaut, damit der Name nicht manipulierbar ist — wenn
   * ihn niemand vorher nachsehen kann, ist die halbe Wirkung dahin.
   *
   * Er ist **keine Einstellung** und steht deshalb neben `settings` und nicht
   * darin: Er kommt von der Hülle über `stdin` und ist über keine Route
   * änderbar (B-8.1).
   */
  readonly windowsUser: string;
  /**
   * Wo der Bestand liegt (E-018, R-13). `null` bei einem Bestand im
   * Arbeitsspeicher.
   *
   * Auskunft, keine Einstellung. Nach allem, was über Synchronisierungsordner
   * entschieden wurde, soll man nachsehen können, wo die Datei tatsächlich
   * liegt, statt es aus der Anwendung heraus zu vermuten.
   *
   * **Warum das kein Verstoß gegen B-2.4 ist.** Dort steht, dass ein Dateipfad
   * nicht in eine **Fehlermeldung** gehört: Sie geht auch an einen Aufrufer,
   * der sie nicht bekommen soll, und sie verrät Innenleben zu einem Zeitpunkt,
   * zu dem der Aufrufer nichts damit anfangen kann. Hier ist es umgekehrt —
   * eine ausdrücklich erfragte Auskunft, hinter dem Sitzungsgeheimnis, das
   * ausschließlich die Hülle hat. Das Add-in-Token erreicht `/settings` nicht
   * (`access/route-policy.ts`), und derselbe Rumpf führt mit
   * `settings.exportDirectory` bereits einen Pfad desselben Rechners.
   */
  readonly databasePath: string | null;
  /**
   * Was am **Ort des Bestands** belegbar ist (T-132, O-C).
   *
   * Derselbe Vorrat wie bei {@link exportDirectoryTraits} und aus demselben
   * Grund — nur wiegt er hier schwerer. Der Exportordner enthält, was exportiert
   * wurde; der Bestand enthält alles, einschließlich der internen Vermerke
   * (A-7.2). Liegt er in einem Synchronisierungsordner oder auf einem
   * Netzdateisystem, verlässt die Kundendatenbank den Rechner — genau der
   * Schaden, gegen den E-018 die Ablage unter `%LOCALAPPDATA%` gesetzt hat, und
   * bei WAL-Dateien obendrein ein Weg, den Bestand zu beschädigen (R-13,
   * B-5.3).
   *
   * Bis T-132 lieferte `GET /settings` dazu **nur den Pfad**: Der Benutzer
   * musste ihn ansehen und raten. Der Exportordner bekam seit T-039 einen
   * Beleg, der Bestand keinen — obwohl an ihm mehr hängt.
   *
   * Leer, wenn nichts belegbar ist, und **leer heißt nicht „unbedenklich"**:
   * Ein zugeordnetes Netzlaufwerk unter Windows ist von hier aus nicht
   * erkennbar (siehe `access/export-directory.ts`).
   */
  readonly databaseTraits: readonly LocationTrait[];
  /**
   * Wie viele Dateien des Bestands weiter liegen als `0600` (B-7.2, T-132/O-C).
   *
   * Eine Zahl und keine Pfadliste. `null` heißt „nicht messbar" — unter Windows,
   * wo die geerbte ACL die Grenze trägt, und bei einem Bestand im
   * Arbeitsspeicher. `null` ist nicht `0`.
   *
   * Der Dienst meldet dieselbe Zahl beim Start ins Protokoll und merkt sie als
   * Vorfall vor. Hier steht sie, damit sie auch dann sichtbar ist, wenn niemand
   * das Startprotokoll gelesen hat — und weil sie sich im Betrieb ändern kann:
   * SQLite legt `-wal` und `-shm` wiederholt neu an.
   */
  readonly databaseFilesTooPermissive: number | null;
}

export async function loadSettings(context: AppContext): Promise<SettingsView> {
  const settings = await context.transactions.inTransaction((unit) => unit.settings.load());
  const defaultTags = await context.transactions.inTransaction((unit) => unit.defaultTags.list());
  const check = await context.files.checkExportDirectory(settings.exportDirectory);
  // Nach einer Zeitgrenze wird das Dateisystem nicht noch einmal gefragt: Es
  // liefe in dieselbe Wand. Was aus Pfad und Umgebung folgt, bleibt trotzdem —
  // und ist dort die eigentliche Erklärung.
  const traits = await context.directories.describeLocation(settings.exportDirectory, {
    mayAskFileSystem: check.ok || check.reason !== 'unreachable',
  });

  // Der Ort des Bestands wird **immer** gefragt: Er ist offen, also antwortet
  // er auch. Die Zeitgrenze oben gilt dem Exportordner, der eine abgehängte
  // Freigabe sein kann; für den Bestand gäbe es keinen Grund, sie zu erben.
  const databasePath = context.system.databasePath();
  const databaseTraits = await context.directories.describeLocation(databasePath, {
    mayAskFileSystem: true,
  });

  return {
    settings,
    exportDirectoryState: check.ok ? 'ok' : check.reason,
    exportDirectoryTraits: traits,
    defaultTags,
    windowsUser: context.system.windowsUser(),
    databasePath,
    databaseTraits,
    databaseFilesTooPermissive: context.system.databaseFilesTooPermissive(),
  };
}

export interface SettingsUpdate {
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
  /**
   * Die übersprungene Fassung (A-18.10). `null` setzt sie zurück.
   *
   * Sie kommt als **Benutzereingabe** herein (T-136-4) und wird unten an ihrer
   * Tür geprüft, nicht erst in der Datenbank.
   */
  readonly skippedVersion?: string | null;
}

/**
 * Einstellungen ändern.
 *
 * Ein gesetzter Exportordner wird sofort geprüft und bei einem Fehlschlag
 * **abgewiesen**, statt gespeichert und später zu überraschen. Geprüft wird
 * trotzdem bei jedem Lauf erneut (R-11) — der Ordner kann danach verschwinden.
 */
export async function updateSettings(
  context: AppContext,
  input: SettingsUpdate,
): Promise<UseCaseResult<AppSettings>> {
  if (input.exportDirectory !== undefined && input.exportDirectory !== null) {
    const check = await context.files.checkExportDirectory(input.exportDirectory);
    if (!check.ok) {
      // `unreachable` bekommt einen eigenen Satz, weil es einen anderen
      // Handgriff verlangt: Bei „gibt es nicht" wählt man einen anderen Ordner,
      // bei „antwortet nicht" verbindet man das Laufwerk neu oder wartet. Der
      // Fehlerschlüssel bleibt derselbe — kein Aufrufer verzweigt darauf, und
      // ein neuer Schlüssel wäre eine Änderung ohne Empfänger.
      if (check.reason === 'unreachable') {
        return err(
          taktError(
            'export_directory_missing',
            `Der Ordner hat innerhalb von ${Math.round(check.waitedMs / 1000)} Sekunden nicht geantwortet. Er wurde nicht gespeichert.`,
          ),
        );
      }
      return err(
        taktError(
          check.reason === 'not_writable' ? 'export_directory_not_writable' : 'export_directory_missing',
          check.reason === 'not_writable'
            ? 'In diesen Ordner kann nicht geschrieben werden.'
            : 'Diesen Ordner gibt es nicht oder er ist kein Ordner.',
        ),
      );
    }
  }

  /*
   * A-18.10, T-136-4 — die Tür der übersprungenen Fassung.
   *
   * Der Wert ist Benutzereingabe: Jeder Prozess mit dem Sitzungsgeheimnis kann
   * ihn setzen (VG-6, R-02). Geprüft wird deshalb **hier**, mit derselben Form
   * wie die Antwort von GitHub — `checkVersion` aus `packages/domain`, ohne
   * zweite Meinung und ohne eigenen regulären Ausdruck.
   *
   * Was dabei zusätzlich geschieht und gewollt ist: `checkVersion` gibt die
   * Bezeichnung **ohne** führendes `v` zurück. Gespeichert wird also `1.2.3`,
   * gleich ob `1.2.3` oder `v1.2.3` hereinkam — sonst stünde in derselben
   * Spalte je nach Aufrufer zweierlei, und die Gleichheitsprüfung fände das
   * eine nicht neben dem anderen.
   *
   * `null` ist ein Wert und keine fehlende Angabe: Er setzt „nichts
   * übersprungen" zurück und wird nicht geprüft.
   */
  let skippedVersion: string | null | undefined = input.skippedVersion;
  if (typeof skippedVersion === 'string') {
    const version = checkVersion(skippedVersion);
    if (!version.ok) {
      // Der abgewiesene Wert steht **nicht** in der Meldung. Er kann genau die
      // Zeichen tragen, um die es geht; eine Meldung, die sie wiedergibt, ist
      // derselbe fremde Text an einer neuen Stelle (B-2.4, B-18.2).
      return err(
        taktError('validation_error', 'Das ist keine Fassungsbezeichnung. Die Einstellung wurde nicht geändert.'),
      );
    }
    skippedVersion = version.version.value;
  }

  const timestamp = now(context);
  return context.transactions.inTransaction((unit) =>
    unit.settings.update({
      ...input,
      ...(skippedVersion === undefined ? {} : { skippedVersion }),
      now: timestamp,
    }),
  );
}

/** Standard-Tags lesen und setzen (A-9.1, A-9.2). */
export function listDefaultTags(context: AppContext): Promise<readonly DefaultTag[]> {
  return context.transactions.inTransaction((unit) => unit.defaultTags.list());
}

export function setDefaultTags(
  context: AppContext,
  tagIds: readonly TagId[],
): Promise<readonly DefaultTag[]> {
  const timestamp: Timestamp = now(context);
  return context.transactions.inTransaction((unit: UnitOfWork) =>
    unit.defaultTags.set(tagIds, timestamp),
  );
}
