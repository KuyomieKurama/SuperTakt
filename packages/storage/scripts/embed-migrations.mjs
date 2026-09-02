/**
 * Takt — die Migrationsdateien in ein Modul schreiben (T-053).
 *
 * ===========================================================================
 * Warum es diesen Erzeuger gibt
 * ===========================================================================
 *
 * `packages/storage/migrations/*.sql` sind Dateien auf der Festplatte. Im
 * Entwicklungsbetrieb liegen sie neben dem Quelltext und lassen sich lesen. In
 * der ausgelieferten Anwendung gibt es sie **nicht**: Der Sidecar ist eine
 * einzige Binärdatei (Node-SEA), in der nur steht, was der Bündler mit
 * hineingenommen hat — und der nimmt JavaScript, kein SQL.
 *
 * Bis T-053 fiel das niemandem auf, weil jeder Prüfpfad aus dem Quelltext lief.
 * Die gebündelte Fassung scheiterte beim ersten Öffnen der Datenbank, noch vor
 * dem Lauschen: `new URL('../../migrations/', import.meta.url)` — und
 * `import.meta.url` ist im CommonJS-Bündel leer.
 *
 * Dieses Skript schreibt den **wörtlichen** Inhalt jeder Migrationsdatei in
 * `src/sqlite/migrations.embedded.ts`. Damit wandert das SQL durch den Bündler
 * in die Binärdatei.
 *
 * ---------------------------------------------------------------------------
 * Warum wörtlich und nicht „aufbereitet"
 * ---------------------------------------------------------------------------
 *
 * `schema_migration.checksum` ist der SHA-256 über den Inhalt der
 * Vorwärtsdatei. Änderte dieses Skript auch nur ein Leerzeichen, wäre die
 * Prüfsumme der eingebetteten Fassung eine andere als die der Datei — und jeder
 * Bestand, der einmal aus dem Quelltext migriert wurde, würde von der
 * gebündelten Fassung als „nachträglich verändert" abgewiesen. Deshalb
 * `JSON.stringify`: Es bildet jedes Zeichen ab, auch Zeilenenden, und braucht
 * keine Sonderbehandlung für Rückwärtsanführungszeichen oder `${`.
 *
 * ---------------------------------------------------------------------------
 * Wie ein Abweichen auffällt
 * ---------------------------------------------------------------------------
 *
 * Gar nicht — jedenfalls nicht hier. Der Abgleich sitzt in `open.ts`: Sobald
 * das Verzeichnis vorhanden ist (Entwicklung, jeder Prüfpfad, jeder Test),
 * wird gelesen **und** gegen das eingebettete Abbild gehalten. Wer eine
 * Migration hinzufügt und diesen Erzeuger vergisst, bekommt beim nächsten
 * `openDatabase` einen Fehler mit genau dem Befehl, der ihn behebt.
 *
 * Aufruf: `pnpm --filter @takt/storage migrations:embed`
 * Prüfung ohne Schreiben: `... migrations:embed --check`
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(here, '..');
const migrationsDir = join(packageDir, 'migrations');
const outFile = join(packageDir, 'src', 'sqlite', 'migrations.embedded.ts');

/** Dasselbe Muster wie im Läufer. Was hier nicht passt, gilt dort auch nicht. */
const FILE_PATTERN = /^(\d{4})_([a-z0-9_]+)\.(up|down)\.sql$/;

const names = readdirSync(migrationsDir).filter((name) => FILE_PATTERN.test(name)).sort();

if (names.length === 0) {
  process.stderr.write(`FEHLER: In ${migrationsDir} liegt keine Migrationsdatei.\n`);
  process.exit(1);
}

const entries = names.map((name) => [name, readFileSync(join(migrationsDir, name), 'utf8')]);

const body = entries.map(([name, content]) => `  ${JSON.stringify(name)}: ${JSON.stringify(content)},`).join('\n');

const header = `/**
 * Takt — die Migrationsdateien, eingebettet (T-053).
 *
 * **Erzeugt. Nicht von Hand ändern.**
 *
 * Quelle sind die Dateien in \`packages/storage/migrations/\`. Erzeuger ist
 * \`packages/storage/scripts/embed-migrations.mjs\`; nach jeder neuen oder
 * geänderten Migration:
 *
 *     pnpm --filter @takt/storage migrations:embed
 *
 * Warum es diese Datei gibt, steht im Kopf des Erzeugers und in
 * \`src/sqlite/open.ts\`: Ein Node-SEA hat kein Verzeichnis mit SQL-Dateien.
 * Was nicht durch den Bündler geht, ist in der ausgelieferten Anwendung nicht
 * vorhanden.
 *
 * Der Inhalt ist **wörtlich**, Zeichen für Zeichen. \`schema_migration.checksum\`
 * ist der SHA-256 darüber; jede Abweichung wäre eine andere Prüfsumme und damit
 * ein Bestand, den die gebündelte Fassung nicht mehr annimmt.
 *
 * ${entries.length} Datei(en).
 */

export const EMBEDDED_MIGRATION_FILES: Readonly<Record<string, string>> = Object.freeze({
`;

const text = `${header}${body}\n});\n`;

const check = process.argv.includes('--check');

if (check) {
  const current = (() => {
    try {
      return readFileSync(outFile, 'utf8');
    } catch {
      return null;
    }
  })();
  if (current !== text) {
    process.stderr.write(
      'FEHLER: src/sqlite/migrations.embedded.ts ist nicht auf dem Stand der Dateien in migrations/.\n' +
        'Behebung: pnpm --filter @takt/storage migrations:embed\n',
    );
    process.exit(1);
  }
  process.stdout.write(`migrations.embedded.ts ist aktuell (${entries.length} Datei(en)).\n`);
} else {
  writeFileSync(outFile, text, 'utf8');
  process.stdout.write(`Geschrieben: src/sqlite/migrations.embedded.ts (${entries.length} Datei(en)).\n`);
}
