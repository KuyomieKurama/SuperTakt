/**
 * Takt — Migrationsverfahren (E-003, ecc:database-migrations).
 *
 * Die Typen des Verfahrens **und** die Gestalt seines Fehlschlags. Der Läufer
 * steht in `sqlite/migration-runner.ts`; das Verfahren ist in
 * docs/datenmodell.md Abschnitt 8 beschrieben und in
 * `packages/storage/migrations/*.sql` abgelegt.
 *
 * ---------------------------------------------------------------------------
 * Warum der Fehlschlag hier steht und nicht beim Läufer (T-132)
 * ---------------------------------------------------------------------------
 *
 * Weil er zur **Zusage des Ports** gehört. Ein Aufrufer, der migrieren lässt,
 * muss den Ausgang unterscheiden können, ohne eine Meldung zu lesen — sonst
 * bleibt ihm nur, den Text zu zergliedern, und dann hängt sein Verhalten an
 * einer Formulierung. `apps/local-api/src/main.ts` hat bis T-132 die andere
 * Antwort gegeben: `catch {}` ohne Bindung, und übrig blieb eine Meldung, die
 * die Folge nannte und nicht die Ursache.
 *
 * Der Grund ist deshalb ein **Wert** mit benannten Feldern, und er trägt
 * ausschließlich Zahlen und Schlüssel aus geschlossenen Vorräten. Kein
 * Dateipfad, kein Benutzername, kein Inhalt des Bestands — B-2.4 verbietet den
 * Pfad in einer Meldung, nicht den Grund.
 */

import type { Timestamp } from '@takt/domain';

/**
 * Eine Migration besteht aus zwei SQL-Dateien mit gleicher Nummer:
 * `NNNN_name.up.sql` und `NNNN_name.down.sql`.
 *
 * Beide Richtungen laufen jeweils in genau einer Transaktion. SQLite führt
 * auch DDL transaktional aus, anders als etwa MySQL: bricht eine Migration in
 * der Mitte ab, bleibt kein halb angelegtes Schema zurück.
 */
export interface Migration {
  readonly version: number;
  readonly name: string;
  readonly up: string;
  readonly down: string;
  /** SHA-256 über `up`. Erkennt nachträglich geänderte, bereits gelaufene Dateien. */
  readonly checksum: string;
}

/** Zeile in `schema_migration`. */
export interface AppliedMigration {
  readonly version: number;
  readonly name: string;
  readonly checksum: string;
  readonly appliedAt: Timestamp;
}

export type MigrationState =
  | { readonly kind: 'current'; readonly version: number }
  | { readonly kind: 'pending'; readonly from: number; readonly to: number; readonly count: number }
  /**
   * Der Bestand ist neuer als die mitgelieferten Migrationen. Das passiert,
   * wenn eine ältere Fassung von Takt eine bereits migrierte Datei öffnet. Die
   * Anwendung startet dann nicht und fordert die neuere Fassung an, statt auf
   * einem Schema zu arbeiten, das sie nicht kennt.
   */
  | { readonly kind: 'database_too_new'; readonly database: number; readonly known: number }
  /** Eine bereits gelaufene Migrationsdatei wurde nachträglich verändert. */
  | { readonly kind: 'checksum_mismatch'; readonly version: number };

// ---------------------------------------------------------------------------
// Der Fehlschlag, unterscheidbar (T-132)
// ---------------------------------------------------------------------------

/**
 * Warum eine Migration nicht gelaufen ist.
 *
 * Jeder Zweig trägt genau das, was den Fall vom Nachbarn unterscheidet, und
 * sonst nichts. `version`, `database`, `known` und `from` sind Fassungsnummern;
 * `code` ist der Fehlerschlüssel der Laufzeit (`ERR_SQLITE_ERROR`, `ENOSPC`,
 * `EACCES` …) aus einem geschlossenen Zeichenvorrat; `sqlite` ist das
 * Ergebniskennzeichen von SQLite als Zahl (5 belegt, 11 beschädigt, 26 keine
 * Datenbank, 10 Ein-/Ausgabe).
 *
 * **Kein Feld kann einen Pfad tragen.** Zahlen sind Zahlen, und `code` wird
 * von {@link errorCodeOf} auf Großbuchstaben, Ziffern und Unterstrich begrenzt,
 * bevor es hier ankommt. Das ist der Unterschied zwischen „den Grund nennen"
 * und „die Meldung durchreichen", und er ist der Grund, aus dem der Wurf
 * ursprünglich weggeworfen wurde.
 */
export type MigrationFailureReason =
  /** Eine bereits gelaufene Migration unterscheidet sich von der mitgelieferten Datei. */
  | { readonly kind: 'checksum_mismatch'; readonly version: number }
  /** Der Bestand ist neuer, als diese Fassung kennt. */
  | { readonly kind: 'database_too_new'; readonly database: number; readonly known: number }
  /** Der Bestand ist belegt — ein zweiter Zugriff hält ihn (SQLITE_BUSY, SQLITE_LOCKED). */
  | { readonly kind: 'database_busy'; readonly sqlite: number | null }
  /**
   * Der Stand ließ sich nicht lesen. Kein Schreibvorgang hat stattgefunden.
   *
   * Getrennt von `unknown`, weil die Stelle den Unterschied macht: Wer beim
   * **Lesen** scheitert, hat einen unversehrten Bestand vor sich; wer beim
   * Anwenden scheitert, hat eine zurückgenommene Transaktion.
   */
  | { readonly kind: 'state_unreadable'; readonly code: string | null; readonly sqlite: number | null }
  /** Die Sicherungskopie vor der Migration ließ sich nicht anlegen. Es wurde nichts migriert. */
  | {
      readonly kind: 'backup_failed';
      readonly from: number;
      readonly code: string | null;
      readonly sqlite: number | null;
    }
  /** Eine einzelne Migration ist gescheitert. Ihre Transaktion ist zurückgenommen. */
  | {
      readonly kind: 'migration_failed';
      readonly version: number;
      readonly direction: 'up' | 'down';
      readonly code: string | null;
      readonly sqlite: number | null;
    }
  /** Rückwärts: zu einer gelaufenen Migration gibt es keine Datei mehr. */
  | { readonly kind: 'no_way_back'; readonly version: number }
  /**
   * Die eingebetteten Migrationen weichen vom Verzeichnis ab (T-053).
   *
   * Kein Fehlschlag des Läufers, sondern einer beim Öffnen — er kommt hier
   * unter, weil er dieselbe Frage betrifft: Welche Migrationen gelten?
   */
  | { readonly kind: 'embedded_drift' }
  /** Etwas anderes. `code` und `sqlite` sind alles, was ohne Text sagbar ist. */
  | { readonly kind: 'unknown'; readonly code: string | null; readonly sqlite: number | null };

/** Erkennungszeichen an einem Wurf des Läufers. Ein Symbol, damit es kein Feldname trifft. */
const REASON = Symbol.for('takt.storage.migration-failure');

/**
 * Ein Wurf mit angehängtem Grund.
 *
 * Die **Meldung bleibt die des zugrunde liegenden Fehlers**, wo es einen gibt.
 * Das ist Absicht: Prüffälle, die auf `RAISE(ABORT, 'rollback_0006_…')` messen,
 * messen weiter darauf, und wer den Wurf im Debugger ansieht, sieht, was SQLite
 * gesagt hat. Nach außen geht davon nichts — der Dienst protokolliert den
 * **Grund** und nie die Meldung (B-2.4).
 */
export function migrationFailure(
  reason: MigrationFailureReason,
  message: string,
  cause?: unknown,
): Error {
  const error = cause === undefined ? new Error(message) : new Error(message, { cause });
  Object.defineProperty(error, REASON, { value: reason, enumerable: false });
  return error;
}

/** Der angehängte Grund, oder `null`, wenn der Wurf keiner des Läufers ist. */
export function migrationFailureReason(error: unknown): MigrationFailureReason | null {
  if (typeof error !== 'object' || error === null) return null;
  const value = (error as Record<symbol, unknown>)[REASON];
  return value === undefined ? null : (value as MigrationFailureReason);
}

/**
 * Der Fehlerschlüssel einer Laufzeitstörung — **nur, wenn er einer sein kann**.
 *
 * Node vergibt `ENOENT`, `EACCES`, `ENOSPC`, `ERR_SQLITE_ERROR`: Großbuchstaben,
 * Ziffern, Unterstrich, höchstens 32 Zeichen. Alles andere wird `null`. Diese
 * Prüfung ist kein Geschmack, sondern die Zusage, dass aus diesem Feld kein
 * Pfad und kein Name werden kann — auch dann nicht, wenn eine Bibliothek eines
 * Tages etwas anderes in `code` schreibt.
 */
export function errorCodeOf(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const code = (error as { code?: unknown }).code;
  if (typeof code !== 'string') return null;
  return /^[A-Z][A-Z0-9_]{0,31}$/.test(code) ? code : null;
}

/**
 * Das Ergebniskennzeichen von SQLite als Zahl, wie `node:sqlite` es an
 * `errcode` hängt — oder `null`.
 */
export function sqliteResultCodeOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null;
  const value = (error as { errcode?: unknown }).errcode;
  return typeof value === 'number' && Number.isSafeInteger(value) ? value : null;
}

/**
 * Ist das der Fall „der Bestand ist belegt"?
 *
 * SQLITE_BUSY (5) und SQLITE_LOCKED (6), einschließlich ihrer erweiterten
 * Formen: Die erweiterten Kennzeichen tragen den Grundwert im niederwertigen
 * Byte (`SQLITE_BUSY_SNAPSHOT` = 517, `SQLITE_BUSY_RECOVERY` = 261).
 */
export function isBusyResultCode(code: number | null): boolean {
  if (code === null) return false;
  const primary = code & 0xff;
  return primary === 5 || primary === 6;
}

export interface MigrationRunnerPort {
  state(): Promise<MigrationState>;
  applied(): Promise<readonly AppliedMigration[]>;

  /**
   * Migriert vorwärts bis zur höchsten bekannten Version.
   *
   * Legt zuvor eine Sicherungskopie der Datenbankdatei an. Das ist der
   * eigentliche Rückweg auf einem benutzten Bestand: eine Rückwärtsmigration
   * kann Spalten und damit Daten verlieren, eine Sicherungskopie nicht.
   */
  migrateToLatest(): Promise<{
    readonly from: number;
    readonly to: number;
    readonly backup: string | null;
  }>;

  /**
   * Migriert rückwärts auf eine Zielversion.
   *
   * Werkzeug für Entwicklung und für einen fehlgeschlagenen Aktualisierungslauf.
   * Datenmigrationen brechen ausdrücklich ab, wenn Benutzerdaten auf die von
   * ihnen angelegten Zeilen verweisen, statt sie mitzureißen.
   */
  migrateDownTo(targetVersion: number): Promise<{ readonly from: number; readonly to: number }>;
}

/**
 * Einstellungen der Verbindung, die der Adapter bei jedem Öffnen setzt.
 *
 * `foreign_keys` muss je Verbindung gesetzt werden — SQLite merkt es sich nicht
 * in der Datei — und wirkt nicht innerhalb einer offenen Transaktion. Der
 * Läufer setzt es deshalb vor `BEGIN`.
 */
export interface ConnectionSettings {
  readonly journalMode: 'WAL';
  readonly foreignKeys: true;
  /** `FULL` statt des schnelleren `NORMAL`: hier hängt eine Abrechnung dran. */
  readonly synchronous: 'FULL';
  readonly busyTimeoutMs: number;
}
