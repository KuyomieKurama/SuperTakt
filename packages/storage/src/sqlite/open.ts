/**
 * Takt — Datenbank öffnen, migrieren, Ports bauen.
 *
 * Die eine Stelle, an der aus einem Dateipfad eine benutzbare Speicherung
 * wird. Der Dienst ruft sie im Zusammenbau auf (architektur.md 1.3) und
 * bekommt genau drei Dinge zurück: die Transaktionsklammer, den
 * Migrationsläufer und das Schließen.
 *
 * **Der Pfad kommt nie aus einer Anfrage.** Er wird aus dem
 * Anwendungsdatenverzeichnis gebildet (E-018), und der Sidecar kennt kein
 * Argument, mit dem man ihn verstellen könnte (B-1.6 Punkt 1).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Migration, MigrationRunnerPort, TransactionPort } from '../index.ts';
import type { Timestamp } from '@takt/domain';

import { openConnection, type SqlConnection } from './database.ts';
import { createMigrationRunner, loadMigrations, migrationsFromFiles } from './migration-runner.ts';
import { EMBEDDED_MIGRATION_FILES } from './migrations.embedded.ts';
import { createTransactionPort } from './unit-of-work.ts';
import { createIdSource, type IdSource } from './ids.ts';

export interface OpenOptions {
  /** Dateipfad oder `':memory:'` für einen Bestand im Arbeitsspeicher. */
  readonly location: string;
  readonly now: () => Timestamp;
  readonly ids?: IdSource;
  /** Zeitzone für die Tagesgruppierung (E-025). Ohne Angabe die des Rechners. */
  readonly timeZone?: string;
  /**
   * Ort der Migrationsdateien. Ohne Angabe die **eingebetteten** (T-053).
   *
   * Ein Verzeichnis anzugeben ist der Weg der Tests. Der Dienst gibt keines an:
   * In der ausgelieferten Binärdatei gäbe es keines, das er meinen könnte.
   */
  readonly migrationsDirectory?: string;
}

export interface OpenedDatabase {
  readonly transactions: TransactionPort;
  readonly migrations: MigrationRunnerPort;
  readonly connection: SqlConnection;
  close(): void;
}

/**
 * Das Migrationsverzeichnis neben dem Quelltext — **oder `null`** (T-053).
 *
 * ===========================================================================
 * Warum diese Funktion einen Rückgabewert „gibt es nicht" braucht
 * ===========================================================================
 *
 * `import.meta.url` beantwortet die Frage „wo liegt die Datei, die gerade
 * läuft". Im Entwicklungsbetrieb ist das eine `file:`-Adresse. Im gebündelten
 * Sidecar gibt es keine solche Datei: esbuild übersetzt nach CommonJS und
 * ersetzt `import.meta` durch ein leeres Objekt, `import.meta.url` ist dort
 * `undefined`. `new URL('../../migrations/', undefined)` wirft dann
 * `TypeError: Invalid URL` — und zwar in `compose()`, also **vor** dem
 * Lauschen: Die ausgelieferte Anwendung startete gar nicht (T-053).
 *
 * Der Fehler war nicht die URL, sondern die Annahme dahinter. Ein Bündel weiß
 * nicht, wo sein Quelltext lag, und ein Verzeichnis mit SQL-Dateien gibt es
 * daneben ohnehin nicht. Deshalb ist „nicht auflösbar" hier ein normaler
 * Zustand mit einem Wert und kein Wurf.
 */
function migrationsDirectoryBesideSource(): string | null {
  // `import.meta.url` ist im CommonJS-Bündel `undefined`. Der Typ sagt
  // `string`, die Laufzeit nicht — deshalb die Prüfung und nicht nur `try`.
  const base: string | undefined = import.meta.url;
  if (typeof base !== 'string' || base === '') return null;
  try {
    return fileURLToPath(new URL('../../migrations/', base));
  } catch {
    return null;
  }
}

/**
 * Das mitgelieferte Migrationsverzeichnis, relativ zu dieser Datei.
 *
 * **Nur aus dem Quelltext benutzbar.** In der gebündelten Anwendung gibt es
 * kein solches Verzeichnis; dort trägt `EMBEDDED_MIGRATION_FILES`. Wer diese
 * Funktion im Erzeugnis aufruft, bekommt einen Fehler mit dem Grund und nicht
 * ein „Invalid URL", über das niemand nachdenken kann.
 */
export function defaultMigrationsDirectory(): string {
  const directory = migrationsDirectoryBesideSource();
  if (directory === null) {
    throw new Error(
      'Das Migrationsverzeichnis liegt nur neben dem Quelltext. In der gebündelten Anwendung gibt es keines; dort sind die Migrationen eingebettet.',
    );
  }
  return directory;
}

/**
 * Die mitgelieferten Migrationen — eingebettet, und im Quelltextbetrieb
 * gegengeprüft (T-053).
 *
 * ---------------------------------------------------------------------------
 * Die Gegenprobe ist der eigentliche Punkt
 * ---------------------------------------------------------------------------
 *
 * Ein eingebettetes Abbild von Dateien ist eine Kopie, und jede Kopie läuft
 * auseinander. Wer `0015_...sql` anlegt und den Erzeuger vergisst, baute sonst
 * eine Binärdatei mit vierzehn Migrationen und einer Oberfläche, die fünfzehn
 * erwartet — und das fiele erst beim Kunden auf.
 *
 * Deshalb: Ist das Verzeichnis vorhanden (Entwicklung, jeder Test, jeder
 * Nachweispfad), wird es gelesen **und** gegen das Abbild gehalten. Der
 * Abgleich läuft also genau dort, wo sich das Abbild überhaupt ändern kann.
 * In der Binärdatei fehlt das Verzeichnis; dort gibt es nichts abzugleichen
 * und nichts zu lesen.
 */
function bundledMigrations(): readonly Migration[] {
  const directory = migrationsDirectoryBesideSource();
  if (directory === null || !existsSync(directory)) {
    return migrationsFromFiles(EMBEDDED_MIGRATION_FILES);
  }

  const onDisk: Record<string, string> = {};
  for (const file of readdirSync(directory)) {
    if (!file.endsWith('.sql')) continue;
    onDisk[file] = readFileSync(join(directory, file), 'utf8').replace(/\r\n/g, '\n');
  }

  const drift = describeDrift(onDisk, EMBEDDED_MIGRATION_FILES);
  if (drift !== null) {
    throw new Error(
      `Die eingebetteten Migrationen weichen von packages/storage/migrations ab (${drift}). ` +
        'Ohne Abgleich enthielte die ausgelieferte Binärdatei einen anderen Stand als der Quelltext. ' +
        'Behebung: pnpm --filter @takt/storage migrations:embed',
    );
  }

  return loadMigrations(directory);
}

/** Erste Abweichung zwischen zwei Dateisammlungen, oder `null`. */
function describeDrift(
  onDisk: Readonly<Record<string, string>>,
  embedded: Readonly<Record<string, string>>,
): string | null {
  const names = [...new Set([...Object.keys(onDisk), ...Object.keys(embedded)])].sort();
  for (const name of names) {
    const left = onDisk[name];
    const right = embedded[name]?.replace(/\r\n/g, '\n');
    if (left === undefined) return `${name} fehlt im Verzeichnis`;
    if (right === undefined) return `${name} fehlt im Abbild`;
    if (left !== right) return `${name} unterscheidet sich`;
  }
  return null;
}

export function openDatabase(options: OpenOptions): OpenedDatabase {
  const connection = openConnection(options.location);
  const ids = options.ids ?? createIdSource();

  const migrations = createMigrationRunner(
    connection,
    // Ein ausdrücklich genanntes Verzeichnis gewinnt — das ist der Weg der
    // Tests. Ohne Angabe die mitgelieferten: eingebettet, im Quelltextbetrieb
    // gegen das Verzeichnis geprüft (T-053).
    options.migrationsDirectory === undefined
      ? bundledMigrations()
      : loadMigrations(options.migrationsDirectory),
    {
      databasePath: options.location === ':memory:' ? null : options.location,
      now: options.now,
    },
  );

  const transactions = createTransactionPort(connection, {
    ids,
    ...(options.timeZone === undefined ? {} : { timeZone: options.timeZone }),
  });

  return {
    transactions,
    migrations,
    connection,
    close: () => connection.close(),
  };
}
