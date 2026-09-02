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

import type { AppliedMigration, Migration, MigrationRunnerPort, MigrationState } from '../migration.ts';
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
    }
  };

  return {
    async state() {
      return currentState();
    },

    async applied() {
      return applied();
    },

    async migrateToLatest() {
      const before = currentState();

      if (before.kind === 'checksum_mismatch') {
        throw new Error(
          `Die bereits gelaufene Migration ${before.version} unterscheidet sich von der mitgelieferten Datei. Es wird nichts migriert.`,
        );
      }
      if (before.kind === 'database_too_new') {
        throw new Error(
          `Der Bestand ist auf Stand ${before.database}, diese Fassung von Takt kennt nur ${before.known}. Bitte die neuere Fassung verwenden.`,
        );
      }

      const from = before.kind === 'current' ? before.version : before.from;
      const pending = migrations.filter((migration) => migration.version > from);

      if (pending.length === 0) {
        return { from, to: from, backup: null };
      }

      const backup = createBackup(conn, options, from);

      for (const migration of pending) {
        applyOne(migration, 'up', options.now());
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
          throw new Error(
            `Für die gelaufene Migration ${row.version} gibt es keine Datei. Der Rückweg ist nicht gangbar.`,
          );
        }
        applyOne(migration, 'down', options.now());
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
