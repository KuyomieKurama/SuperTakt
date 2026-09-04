/**
 * Takt — der Migrationsläufer (E-003, ecc:database-migrations).
 *
 * ---------------------------------------------------------------------------
 * Das Verfahren
 * ---------------------------------------------------------------------------
 *
 * Zwei Dateien je Migration, gleiche Nummer: `NNNN_name.up.sql` und
 * `NNNN_name.down.sql`. Beide Richtungen laufen **jeweils in genau einer
 * Transaktion**. SQLite führt auch DDL transaktional aus, anders als etwa
 * MySQL: Bricht eine Migration in der Mitte ab, bleibt kein halb angelegtes
 * Schema zurück.
 *
 * `schema_migration` hält je gelaufene Migration Nummer, Namen, Prüfsumme und
 * Zeitpunkt. Die Prüfsumme ist der SHA-256 der **Vorwärtsdatei**. Sie erkennt
 * den Fall, der sonst still bleibt: Jemand ändert eine bereits gelaufene
 * Migration, und auf seinem Rechner läuft dann ein anderes Schema als auf dem
 * des Kunden. Der Läufer weigert sich dann zu arbeiten, statt zu raten.
 *
 * ---------------------------------------------------------------------------
 * Die Sicherungskopie ist der eigentliche Rückweg
 * ---------------------------------------------------------------------------
 *
 * `migrateToLatest` legt vorher eine Kopie der Datei an. Das ist wichtiger als
 * die Rückwärtsrichtung: Eine Rückwärtsmigration kann Spalten und damit Daten
 * verlieren — `0003_timer_heartbeat.down.sql` wirft die Tabelle mit den
 * Lebenszeichen weg —, eine Kopie nicht. Die Rückwärtsrichtung ist Werkzeug
 * für Entwicklung und für einen fehlgeschlagenen Aktualisierungslauf, nicht die
 * Rettung eines benutzten Bestands.
 *
 * Kopiert wird mit `VACUUM INTO`. Ein `copyFile` auf eine geöffnete Datenbank
 * im WAL-Modus liefert eine Datei ohne den Inhalt des Journals — also eine
 * Sicherung ohne die zuletzt geschriebenen Buchungen. `VACUUM INTO` schreibt
 * einen in sich stimmigen Bestand.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import type {
  AppliedMigration,
  Migration,
  MigrationFailureReason,
  MigrationRunnerPort,
  MigrationState,
} from '../migration.ts';
import {
  errorCodeOf,
  isBusyResultCode,
  migrationFailure,
  migrationFailureReason,
  sqliteResultCodeOf,
} from '../migration.ts';
import type { Timestamp } from '@takt/domain';

import { integer, secureDatabaseFiles, text, type SqlConnection } from './database.ts';

/** Tabelle des Läufers. Sie ist nicht Teil einer Migration — sie trägt sie. */
const SCHEMA_MIGRATION = `
CREATE TABLE IF NOT EXISTS schema_migration (
  version     INTEGER NOT NULL PRIMARY KEY,
  name        TEXT    NOT NULL,
  checksum    TEXT    NOT NULL,
  applied_at  TEXT    NOT NULL
);`;

const FILE_PATTERN = /^(\d{4})_([a-z0-9_]+)\.(up|down)\.sql$/;

/**
 * Anforderung einer Migration, für ihre Dauer ohne Fremdschlüsselprüfung zu
 * laufen. Siehe `applyOne`.
 *
 * Absichtlich eine ganze Kommentarzeile und kein loses Wort: So steht die
 * Ausnahme sichtbar im Kopf der Datei, die sie braucht, und lässt sich mit
 * `grep` über alle Migrationen finden.
 */
const FOREIGN_KEYS_OFF = /^--\s*takt:\s*foreign_keys\s*=\s*off\s*$/m;

/**
 * Liest die Migrationen aus einem Verzeichnis.
 *
 * Eine Vorwärtsdatei ohne Rückwärtsdatei ist ein Fehler und kein Sonderfall:
 * Eine Migration ohne Rückweg ist eine Einbahnstraße, die erst auffällt, wenn
 * man sie braucht.
 *
 * **Nur für den Betrieb aus dem Quelltext.** In der ausgelieferten Anwendung
 * gibt es dieses Verzeichnis nicht (T-053); dort trägt `migrationsFromFiles`
 * mit dem eingebetteten Abbild. Siehe `open.ts`.
 */
export function loadMigrations(directory: string): readonly Migration[] {
  const files = readdirSync(directory).filter((name) => FILE_PATTERN.test(name));
  const contents: Record<string, string> = {};
  for (const file of files) {
    contents[file] = readFileSync(join(directory, file), 'utf8');
  }
  return migrationsFromFiles(contents);
}

/**
 * Baut die Migrationen aus Dateinamen und Inhalt — ohne Dateisystem (T-053).
 *
 * Dies ist die eine Stelle, an der aus Text eine `Migration` wird. Beide Wege
 * gehen hindurch: das Verzeichnis im Entwicklungsbetrieb und das eingebettete
 * Abbild in der Binärdatei. Zwei Aufbauwege wären zwei Prüfsummenverfahren,
 * und eines davon fiele irgendwann auseinander.
 *
 * Zeilenenden werden auf `\n` vereinheitlicht, bevor die Prüfsumme entsteht.
 * Sonst hinge sie an der Auscheckeinstellung des Rechners: Dieselbe Migration
 * ergäbe unter Windows mit `core.autocrlf=true` eine andere Prüfsumme als im
 * eingebetteten Abbild — und die gebündelte Anwendung wiese den Bestand des
 * Entwicklers als „nachträglich verändert" ab.
 */
export function migrationsFromFiles(files: Readonly<Record<string, string>>): readonly Migration[] {
  const byVersion = new Map<number, { name: string; up?: string; down?: string }>();

  for (const [file, raw] of Object.entries(files)) {
    const match = FILE_PATTERN.exec(file);
    if (match === null) continue;
    const version = Number(match[1]);
    const name = match[2] ?? '';
    const direction = match[3];

    const entry = byVersion.get(version) ?? { name };
    const content = raw.replace(/\r\n/g, '\n');
    if (direction === 'up') entry.up = content;
    else entry.down = content;
    byVersion.set(version, entry);
  }

  const migrations: Migration[] = [];
  for (const [version, entry] of [...byVersion.entries()].sort((a, b) => a[0] - b[0])) {
    if (entry.up === undefined) {
      throw new Error(`Migration ${version} hat keine Vorwärtsdatei.`);
    }
    if (entry.down === undefined) {
      throw new Error(
        `Migration ${version} hat keine Rückwärtsdatei. Eine Migration ohne Rückweg ist eine Einbahnstraße, die erst auffällt, wenn man sie braucht.`,
      );
    }
    migrations.push({
      version,
      name: entry.name,
      up: entry.up,
      down: entry.down,
      checksum: createHash('sha256').update(entry.up, 'utf8').digest('hex'),
    });
  }

  return migrations;
}

export interface MigrationRunnerOptions {
  /** Pfad der Datenbankdatei; `null` für eine Datenbank im Arbeitsspeicher. */
  readonly databasePath: string | null;
  readonly now: () => Timestamp;
  /** Ort der Sicherungskopien. Ohne Angabe neben der Datenbankdatei. */
  readonly backupDirectory?: string;
}

/**
 * Die Meldung eines Wurfs, ohne über seine Gestalt zu raten.
 *
 * Sie bleibt **im Wurf** und geht nie in eine Protokollzeile — siehe
 * `migrationFailure` in `../migration.ts`.
 */
const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unbekannter Fehler der Speicherung.';

/**
 * Ordnet einen Wurf ein, ohne seine Meldung zu benutzen (T-132).
 *
 * `busy` bekommt einen eigenen Zweig, weil er die einzige Störung ist, auf die
 * ein Benutzer selbst etwas tun kann: einen zweiten Takt beenden und es noch
 * einmal versuchen. Alles Übrige ist `fallback` mit Schlüssel und Zahl — und
 * genau diese Zahl ist es, die die Frage beantwortet, die T-132 ausgelöst hat.
 */
function classify(
  error: unknown,
  fallback: (code: string | null, sqlite: number | null) => MigrationFailureReason,
): MigrationFailureReason {
  const sqlite = sqliteResultCodeOf(error);
  if (isBusyResultCode(sqlite)) return { kind: 'database_busy', sqlite };
  return fallback(errorCodeOf(error), sqlite);
}

/**
 * Reicht einen bereits eingeordneten Wurf durch und ordnet jeden anderen ein.
 *
 * Ohne diese Prüfung bekäme ein `checksum_mismatch`, der durch eine äußere
 * Klammer läuft, dort ein zweites Mal einen Grund — den unspezifischeren.
 */
function failWith(
  error: unknown,
  fallback: (code: string | null, sqlite: number | null) => MigrationFailureReason,
): Error {
  const known = migrationFailureReason(error);
  if (known !== null) return error as Error;
  return migrationFailure(classify(error, fallback), messageOf(error), error);
}

export function createMigrationRunner(
  conn: SqlConnection,
  migrations: readonly Migration[],
  options: MigrationRunnerOptions,
): MigrationRunnerPort {
  conn.exec(SCHEMA_MIGRATION);

  const applied = (): readonly AppliedMigration[] =>
    conn
      .prepare('SELECT version, name, checksum, applied_at FROM schema_migration ORDER BY version')
      .all()
      .map((row) => ({
        version: integer(row, 'version'),
        name: text(row, 'name'),
        checksum: text(row, 'checksum'),
        appliedAt: text(row, 'applied_at') as Timestamp,
      }));

  const highestKnown = (): number =>
    migrations.reduce((max, migration) => Math.max(max, migration.version), 0);

  const currentState = (): MigrationState => {
    const rows = applied();
    const current = rows.reduce((max, row) => Math.max(max, row.version), 0);
    const known = highestKnown();

    // Die Reihenfolge dieser beiden Prüfungen ist eine fachliche Entscheidung,
    // keine Formsache (T-029, Befund aus T-027).
    //
    // Ein Bestand, der über die höchste bekannte Fassung hinausgeht, hat
    // zwangsläufig Zeilen, zu denen es hier keine Datei gibt — die Prüfsummen-
    // schleife darunter fände also `migration === undefined` und meldete
    // „geändert". Stand sie zuerst, bekam jeder, der eine neuere Datei mit
    // einem älteren Takt öffnet, die Meldung, seine Datei sei nachträglich
    // verändert worden. Die schickt jemanden zur Datensicherung; richtig wäre
    // der Weg zum Aktualisieren gewesen. Der Zustand `database_too_new` war
    // damit unerreichbar.
    //
    // Deshalb steht die Fassungsprüfung vorn: Sie ist die *speziellere* und
    // die harmlosere Erklärung derselben Beobachtung. Erst wenn der Bestand
    // nicht neuer ist, ist eine unbekannte oder abweichende Zeile tatsächlich
    // eine nachträglich geänderte Migration.
    if (current > known) {
      return { kind: 'database_too_new', database: current, known };
    }

    for (const row of rows) {
      const migration = migrations.find((entry) => entry.version === row.version);
      // Eine gelaufene Migration, die es nicht mehr gibt, ist derselbe Befund
      // wie eine geänderte: Der Bestand entstand unter einem Schema, das diese
      // Fassung nicht kennt.
      if (migration === undefined || migration.checksum !== row.checksum) {
        return { kind: 'checksum_mismatch', version: row.version };
      }
    }

    const pending = migrations.filter((migration) => migration.version > current);
    if (pending.length === 0) {
      return { kind: 'current', version: current };
    }
    return { kind: 'pending', from: current, to: known, count: pending.length };
  };

  /**
   * Eine Migration in **einer** Transaktion.
   *
   * `PRAGMA foreign_keys` wirkt nicht innerhalb einer offenen Transaktion und
   * wird deshalb davor gesetzt — genau so, wie die Kopfkommentare der
   * Migrationsdateien es voraussetzen.
   *
   * ---------------------------------------------------------------------
   * Zwei Zusätze aus T-029
   * ---------------------------------------------------------------------
   *
   * **Die Gegenprobe auf Fremdschlüssel.** datenmodell.md 8.2 beschreibt sie
   * seit T-008a als Teil des Verfahrens („nicht leer ⇒ Abbruch"), der Läufer
   * führte sie aber nie aus. Sie steht jetzt hier und nicht in den einzelnen
   * Dateien: Eine Prüfung, an die sich jede Migration selbst erinnern muss,
   * ist keine.
   *
   * **Der Schalter für einen Tabellenumbau.** SQLite kennt kein ALTER TABLE
   * für einen CHECK; eine Tabelle mit Kindern lässt sich aber nur umbauen,
   * wenn die Fremdschlüsselprüfung während des Umbaus ruht — sonst scheitert
   * das DROP an ihrem eigenen ON DELETE RESTRICT, und ein RENAME zieht die
   * REFERENCES-Klauseln der Kinder mit. Das ist genau das Verfahren, das die
   * SQLite-Dokumentation für solche Änderungen vorschreibt.
   *
   * Eine Migration fordert es mit einer Zeile an:
   *
   *     -- takt: foreign_keys=off
   *
   * Sie schaltet damit **nicht** die Prüfung ab, sondern verschiebt sie: Die
   * Gegenprobe oben läuft trotzdem und noch vor dem Festschreiben. Der
   * Schalter ist ausdrücklich und steht in der Datei, die ihn braucht — nicht
   * als Voreinstellung für alle.
   *
   * **Beide Schalter stellt das `finally` wieder her**, `foreign_keys` und
   * `legacy_alter_table` (R-3a H-4). Ein Pragma ist eine Einstellung der
   * Verbindung und nicht Teil der Transaktion; `ROLLBACK` nimmt es nicht
   * zurück. Eine Migration, die mittendrin wirft, hinterließe sonst eine
   * Verbindung mit einer Einstellung, die niemand mehr gesetzt hat.
   */
  const applyOne = (migration: Migration, direction: 'up' | 'down', now: Timestamp): void => {
    const sql = direction === 'up' ? migration.up : migration.down;
    const withoutForeignKeys = FOREIGN_KEYS_OFF.test(sql);

    conn.exec(withoutForeignKeys ? 'PRAGMA foreign_keys = OFF;' : 'PRAGMA foreign_keys = ON;');
    conn.exec('BEGIN IMMEDIATE;');
    try {
      conn.exec(sql);
      assertNoDanglingReferences(conn, migration, direction);
      if (direction === 'up') {
        conn
          .prepare(
            'INSERT INTO schema_migration (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)',
          )
          .run(migration.version, migration.name, migration.checksum, now);
      } else {
        conn.prepare('DELETE FROM schema_migration WHERE version = ?').run(migration.version);
      }
      conn.exec('COMMIT;');
    } catch (error) {
      try {
        conn.exec('ROLLBACK;');
      } catch {
        /* Die Transaktion war bereits beendet. */
      }
      throw error;
    } finally {
      // Der Schalter gilt für **eine** Migration. Bliebe er stehen, liefe der
      // ganze Dienst danach ohne Fremdschlüsselprüfung — der teuerste
      // denkbare Nebeneffekt einer Migration.
      if (withoutForeignKeys) conn.exec('PRAGMA foreign_keys = ON;');

      /*
       * Dasselbe für `legacy_alter_table` (R-3a H-4).
       *
       * Sechs Migrationsdateien schalten ihn selbst ein und in ihrer letzten
       * Zeile wieder aus, weil ein `RENAME` sonst die REFERENCES-Klauseln der
       * Nachbartabellen nachzieht. Wirft eine Migration **mittendrin**, wird
       * diese letzte Zeile nie ausgeführt: `ROLLBACK` nimmt die Daten zurück,
       * aber kein Pragma — es ist eine Einstellung der Verbindung und nicht
       * Teil der Transaktion. Die Verbindung behielte `legacy_alter_table = ON`,
       * und ein späteres `RENAME` verhielte sich anders als gedacht.
       *
       * Heute folgenlos, weil ein Fehlschlag den Start beendet. Die Begründung
       * für `foreign_keys` gilt trotzdem Wort für Wort, und eine Unsymmetrie,
       * die nur wegen eines Umstands außerhalb dieser Datei nicht schadet, ist
       * keine Bauart, sondern ein Zufall.
       *
       * **Ohne Bedingung** und anders als oben: Der Läufer schaltet diesen
       * Schalter nie selbst ein, also gibt es keinen Vermerk in der Datei, an
       * dem er es festmachen könnte. `OFF` ist die Vorgabe von SQLite; ihn nach
       * jeder Migration wiederherzustellen kostet ein Pragma und kann keinen
       * Fall verfehlen, den ein Textvergleich übersehen hätte.
       */
      conn.exec('PRAGMA legacy_alter_table = OFF;');
    }
  };

  /**
   * Den Stand lesen — und einen Fehlschlag dabei als solchen kennzeichnen
   * (T-132).
   *
   * `currentState()` sieht harmlos aus, führt aber eine Abfrage aus. Genau
   * dieser Aufruf ist der erste, der einen belegten oder beschädigten Bestand
   * bemerkt, und bis T-132 verschwand sein Grund im `catch {}` des Dienstes.
   */
  const readState = (): MigrationState => {
    try {
      return currentState();
    } catch (error) {
      throw failWith(error, (code, sqlite) => ({ kind: 'state_unreadable', code, sqlite }));
    }
  };

  return {
    async state() {
      return readState();
    },

    async applied() {
      try {
        return applied();
      } catch (error) {
        throw failWith(error, (code, sqlite) => ({ kind: 'state_unreadable', code, sqlite }));
      }
    },

    async migrateToLatest() {
      const before = readState();

      if (before.kind === 'checksum_mismatch') {
        throw migrationFailure(
          { kind: 'checksum_mismatch', version: before.version },
          `Die bereits gelaufene Migration ${before.version} unterscheidet sich von der mitgelieferten Datei. Es wird nichts migriert.`,
        );
      }
      if (before.kind === 'database_too_new') {
        throw migrationFailure(
          { kind: 'database_too_new', database: before.database, known: before.known },
          `Der Bestand ist auf Stand ${before.database}, diese Fassung von Takt kennt nur ${before.known}. Bitte die neuere Fassung verwenden.`,
        );
      }

      const from = before.kind === 'current' ? before.version : before.from;
      const pending = migrations.filter((migration) => migration.version > from);

      if (pending.length === 0) {
        return { from, to: from, backup: null };
      }

      // Die Sicherungskopie ist der eigentliche Rückweg (siehe Kopf). Scheitert
      // sie, wird **nicht** migriert — und der Grund dafür ist ein anderer als
      // der einer gescheiterten Migration: Hier ist der Bestand unversehrt und
      // ungeändert, dort steht eine zurückgenommene Transaktion dahinter.
      let backup: string | null;
      try {
        backup = createBackup(conn, options, from);
      } catch (error) {
        throw failWith(error, (code, sqlite) => ({ kind: 'backup_failed', from, code, sqlite }));
      }

      for (const migration of pending) {
        try {
          applyOne(migration, 'up', options.now());
        } catch (error) {
          throw failWith(error, (code, sqlite) => ({
            kind: 'migration_failed',
            version: migration.version,
            direction: 'up',
            code,
            sqlite,
          }));
        }
      }

      return { from, to: highestKnown(), backup };
    },

    async migrateDownTo(targetVersion) {
      const rows = [...applied()].sort((a, b) => b.version - a.version);
      const from = rows.reduce((max, row) => Math.max(max, row.version), 0);

      for (const row of rows) {
        if (row.version <= targetVersion) break;
        const migration = migrations.find((entry) => entry.version === row.version);
        if (migration === undefined) {
          throw migrationFailure(
            { kind: 'no_way_back', version: row.version },
            `Für die gelaufene Migration ${row.version} gibt es keine Datei. Der Rückweg ist nicht gangbar.`,
          );
        }
        try {
          applyOne(migration, 'down', options.now());
        } catch (error) {
          throw failWith(error, (code, sqlite) => ({
            kind: 'migration_failed',
            version: migration.version,
            direction: 'down',
            code,
            sqlite,
          }));
        }
      }

      const after = applied().reduce((max, row) => Math.max(max, row.version), 0);
      return { from, to: after };
    },
  };
}

/**
 * Gegenprobe nach jeder Migration, vor dem Festschreiben (datenmodell.md 8.2).
 *
 * `PRAGMA foreign_key_check` prüft den **ganzen** Bestand, nicht nur die
 * geänderten Zeilen. Auf einer lokalen Datei ist das schnell, und es ist die
 * einzige Prüfung, die einen Umbau mit ruhender Fremdschlüsselprüfung noch
 * abfangen kann: Ein Verweis ins Leere fällt sonst erst Wochen später auf,
 * beim ersten Zugriff auf die betroffene Zeile.
 *
 * Schlägt sie an, wirft sie — der Aufrufer nimmt die Transaktion zurück.
 */
function assertNoDanglingReferences(
  conn: SqlConnection,
  migration: Migration,
  direction: 'up' | 'down',
): void {
  const row = conn.prepare('SELECT count(*) AS n FROM pragma_foreign_key_check').get();
  const violations = row === undefined ? 0 : integer(row, 'n');
  if (violations > 0) {
    throw new Error(
      `Migration ${migration.version} (${direction}) hinterlässt ${violations} Verweis(e) ins Leere. Es wird nichts festgeschrieben.`,
    );
  }
}

/**
 * Sicherungskopie vor dem Migrieren.
 *
 * Ohne Dateipfad — also im Arbeitsspeicher — gibt es nichts zu sichern; das
 * ist der Prüfpfad, und dort ist `null` die richtige Antwort.
 */
function createBackup(
  conn: SqlConnection,
  options: MigrationRunnerOptions,
  fromVersion: number,
): string | null {
  if (options.databasePath === null) return null;

  // Ein Bestand auf Fassung 0 ist eine leere Datei. Eine Sicherungskopie davon
  // sichert nichts und legt bei jeder Neuinstallation eine Datei ab, die
  // niemand je wieder ansieht.
  if (fromVersion === 0) return null;

  const directory = options.backupDirectory ?? dirnameOf(options.databasePath);
  if (!existsSync(directory)) return null;

  const stamp = options.now().replace(/[:-]/g, '').replace('T', '-').replace('Z', '');
  const base = baseNameOf(options.databasePath).replace(/\.db$/i, '');

  // `VACUUM INTO` weigert sich, eine vorhandene Datei zu überschreiben — und
  // das ist richtig: Die vorhandene Datei könnte die einzige Sicherung eines
  // früheren Laufs sein. Der Zeitstempel ist sekundengenau, zwei Migrationen
  // in derselben Sekunde sind also möglich. Statt zu überschreiben oder
  // abzubrechen, bekommt die zweite einen Zähler.
  let target = join(directory, `${base}-vor-migration-${fromVersion}-${stamp}.db`);
  let counter = 2;
  while (existsSync(target)) {
    target = join(directory, `${base}-vor-migration-${fromVersion}-${stamp}-${counter}.db`);
    counter += 1;
  }

  // `VACUUM INTO` schreibt einen in sich stimmigen Bestand, auch wenn das
  // WAL-Journal gerade Inhalt hat — anders als ein `copyFile`, das eine
  // Sicherung ohne die zuletzt geschriebenen Buchungen ergäbe. Der Zielpfad ist
  // kein Wert aus einer Anfrage, sondern aus dem Anwendungsdatenverzeichnis
  // (B-1.6).
  conn.prepare('VACUUM INTO ?').run(target);

  // Die Sicherung ist eine vollständige zweite Kundendatenbank und erbt sonst
  // den weiten Vorgabemodus von SQLite (B-7.2, S-03 aus T-023). Sie liegt zwar
  // im Anwendungsdatenverzeichnis mit `0700`, aber genau diese Datei ist die,
  // die jemand herauskopiert — sie heißt „vor-migration" und sieht aus wie
  // etwas, das man aufhebt.
  secureDatabaseFiles(target);
  return target;
}

function baseNameOf(path: string): string {
  const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return index < 0 ? path : path.slice(index + 1);
}

function dirnameOf(path: string): string {
  const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return index <= 0 ? '.' : path.slice(0, index);
}
