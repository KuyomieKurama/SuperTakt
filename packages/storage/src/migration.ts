/**
 * Takt — Migrationsverfahren (E-003, ecc:database-migrations).
 *
 * Nur Typen. Der Läufer entsteht in T-009; das Verfahren ist in
 * docs/datenmodell.md beschrieben und in
 * `packages/storage/migrations/*.sql` bereits abgelegt.
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
