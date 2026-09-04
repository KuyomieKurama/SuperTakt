#!/usr/bin/env node
/**
 * Takt — Wächter über die Notiz-Trennung (A-7.2, R-06, R-18, E-017).
 *
 * Die Trennung zwischen dem internen Vermerk des Todos und der
 * abrechnungsrelevanten Leistung der Buchung ruht auf vier Schichten. Drei
 * davon trägt der Übersetzer:
 *
 *   1. `packages/domain/src/export.ts` kennt weder `Todo` noch `TodoNote` und
 *      importiert nur `kernel` und `rounding`. Der Exportmotor hat also keinen
 *      Typ, mit dem er den Vermerk überhaupt benennen könnte.
 *   2. Die `exports`-Tabelle von `@takt/domain` hat keinen Platzhalter. Ein
 *      Zugriff wie `@takt/domain/src/todo.ts` scheitert an der Auflösung, nicht
 *      an einer Vereinbarung.
 *   3. Die Datenbanksicht `v_export_candidate` führt die Spalte nicht.
 *
 * Die vierte Schicht — `packages/export` bindet die Domäne nicht als Ganzes ein,
 * sondern ausschließlich über `@takt/domain/export` — kann kein Paketmanager
 * erzwingen: npm und pnpm kennen Abhängigkeiten je Paket, nicht je Unterpfad.
 * Genau diese Lücke schließt dieses Skript. Es läuft in `pnpm check` und macht
 * aus der Vereinbarung eine Prüfung mit Exitcode.
 *
 * Bewusst ohne Fremdbibliothek und ohne TypeScript-Übersetzer: Der Wächter muss
 * auch dann laufen, wenn der Bauablauf gerade kaputt ist.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const domainRoot = path.join(repoRoot, 'packages', 'domain');
const exportRoot = path.join(repoRoot, 'packages', 'export');

/** @type {string[]} */
const violations = [];
/** @type {string[]} */
const performed = [];

const note = (text) => performed.push(text);
const fail = (text) => violations.push(text);

// ---------------------------------------------------------------------------
// Werkzeug
// ---------------------------------------------------------------------------

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

/** Alle Dateien unterhalb von `dir` mit einer der Endungen, ohne node_modules. */
async function collect(dir, extensions) {
  if (!(await exists(dir))) return [];
  const found = [];
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const parent = entry.parentPath ?? entry.path;
    if (parent.includes(`${path.sep}node_modules${path.sep}`)) continue;
    if (!extensions.some((ext) => entry.name.endsWith(ext))) continue;
    found.push(path.join(parent, entry.name));
  }
  return found;
}

/**
 * Alle Modulbezeichner einer Quelldatei — statisch, dynamisch und `require`.
 * Reicht für diesen Zweck: Wer die Grenze umgehen will, indem er den
 * Bezeichner zur Laufzeit zusammensetzt, tut das nicht aus Versehen, und
 * gegen Absicht schützt ohnehin nur das Review.
 */
function specifiers(source) {
  const patterns = [
    /(?:^|[\s;}])(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g,
    /(?:^|[\s;}])import\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  const out = new Set();
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1] !== undefined) out.add(match[1]);
    }
  }
  return [...out];
}

const relativeToRepo = (file) => path.relative(repoRoot, file).split(path.sep).join('/');

// ---------------------------------------------------------------------------
// Schicht 2 — die Einstiegspunkte von @takt/domain bleiben eng
// ---------------------------------------------------------------------------

const allowedEntryPoints = new Set(['.', './export', './package.json']);

async function checkDomainEntryPoints() {
  const manifest = JSON.parse(await readFile(path.join(domainRoot, 'package.json'), 'utf8'));
  const entries = Object.keys(manifest.exports ?? {});

  if (entries.length === 0) {
    fail('packages/domain/package.json hat keine exports-Tabelle. Ohne sie ist jede Datei des Pakets von außen erreichbar.');
    return;
  }

  for (const entry of entries) {
    if (entry.includes('*')) {
      fail(
        `packages/domain/package.json: Einstiegspunkt "${entry}" enthält einen Platzhalter. ` +
          'Damit wäre @takt/domain/src/todo.ts von außen erreichbar und die zweite Schicht der Notiz-Trennung offen.',
      );
    } else if (!allowedEntryPoints.has(entry)) {
      fail(
        `packages/domain/package.json: unerwarteter Einstiegspunkt "${entry}". ` +
          `Erlaubt sind ${[...allowedEntryPoints].join(', ')} — jeder weitere vergrößert die Fläche, die packages/export sehen kann.`,
      );
    }
  }

  if (!entries.includes('./export')) {
    fail('packages/domain/package.json: der eigene Einstiegspunkt "./export" fehlt. Ohne ihn müsste packages/export die Domäne als Ganzes einbinden.');
  }

  note(`Einstiegspunkte von @takt/domain geprüft: ${entries.join(', ')}`);
}

// ---------------------------------------------------------------------------
// Schicht 1 — die Exportfläche selbst kennt den Vermerk nicht
// ---------------------------------------------------------------------------

// Die Endungen sind die der Dateien, die wirklich dort liegen (T-029). Die
// Liste ist absichtlich abschließend und nennt **eine** Schreibweise: Stünden
// hier zusätzlich die `.js`-Formen, wäre der Wächter gegenüber einer
// zurückgedrehten Datei blind und die Fläche dieser Datei wieder verhandelbar.
const allowedExportSurfaceImports = new Set(['./kernel.ts', './rounding.ts']);

/**
 * Die Typbehauptungen aus `export.ts`, die die Grenze an den Übersetzer binden.
 * Sie sind die eigentliche Sicherung; dieses Skript prüft nur, dass niemand sie
 * entfernt hat. Ein Verbot der Zeichenkette „TodoNote" wäre hier falsch — genau
 * diese Behauptungen müssen den Namen nennen, um ihn zu sperren.
 *
 * Die letzten drei sind mit E-033 dazugekommen (T-011): kein Quellenpfad heißt
 * schlicht „Notiz", `booking.*` bleibt fort, und die Gruppenquellen sind
 * abschließend aufgezählt.
 */
const requiredAssertions = [
  'NoteBoundaryIsSealed',
  'TodoSourcesAreCovered',
  'ExportCandidateHasNoTodoNote',
  'ExportGroupHasNoTodoNote',
  'NoSourceIsCalledPlainNote',
  'BookingSourcesAreGone',
  'GroupSourcesAreCovered',
];

async function checkExportSurface() {
  const file = path.join(domainRoot, 'src', 'export.ts');
  if (!(await exists(file))) {
    fail('packages/domain/src/export.ts fehlt. Das ist die Exportgrenze; ohne sie gibt es keine Notiz-Trennung.');
    return;
  }

  const source = await readFile(file, 'utf8');

  for (const specifier of specifiers(source)) {
    if (!allowedExportSurfaceImports.has(specifier)) {
      fail(
        `packages/domain/src/export.ts importiert "${specifier}". ` +
          `Erlaubt sind ausschließlich ${[...allowedExportSurfaceImports].join(' und ')}; alles andere kann den internen Vermerk wieder erreichbar machen.`,
      );
    }
  }

  let present = 0;
  for (const assertion of requiredAssertions) {
    if (new RegExp(`export type ${assertion}\\b`).test(source)) {
      present += 1;
    } else {
      fail(
        `packages/domain/src/export.ts: die Typbehauptung "${assertion}" fehlt. ` +
          'Sie bindet die Notiz-Trennung an den Übersetzer; ohne sie fällt der Bruch erst in der Abrechnung auf (R-06).',
      );
    }
  }

  note(
    `Exportfläche packages/domain/src/export.ts geprüft: importiert nur ${[...allowedExportSurfaceImports].join(' und ')}, ` +
      `${present} von ${requiredAssertions.length} Typbehauptungen vorhanden.`,
  );
}

// ---------------------------------------------------------------------------
// Schicht 4 — packages/export sieht nur @takt/domain/export
// ---------------------------------------------------------------------------

const forbiddenForExportPackage = [
  { prefix: '@takt/storage', reason: 'Der Exportmotor darf die Speicherung nicht kennen; er bekommt fertige ExportGroup-Werte übergeben.' },
];

/**
 * Untergrenzen — ein Nachweis, der über nichts läuft, meldet nicht grün
 * (R-3 S-1, T-089).
 *
 * `collect` gibt eine leere Liste zurück, wenn es das Verzeichnis nicht gibt.
 * Die beiden Schichten darunter meldeten ihre Zahl bisher als Fließtext und
 * **prüften sie nicht**: Eine Umbenennung von `packages/export/src`, ein Umzug
 * der Pakete oder ein Fehler in `collect` ergäbe „0 Quelldatei(en) geprüft",
 * Exitcode 0 und die Schlußzeile „Notiz-Trennung: alle Schichten unverletzt."
 * Ein Wächter, der das sagt, ohne hingesehen zu haben, ist schlimmer als
 * keiner — er ersetzt das Nachsehen.
 *
 * Die Zahlen sind bewußt weit unter dem Bestand (8 und 298 zum Zeitpunkt von
 * T-089): Sie sollen den **Wegfall** fangen, nicht das Wachstum bremsen.
 * Dieselbe Bauart benutzt `proof:route-policy` mit `routes.length >= 60`.
 */
const MIN_EXPORT_SOURCES = 1;
const MIN_DEEP_IMPORT_SOURCES = 50;

async function checkExportPackage() {
  if (!(await exists(exportRoot))) {
    fail(
      'packages/export gibt es nicht. Das Paket existiert seit T-007; fehlt es, ist die vierte Schicht ' +
        'der Notiz-Trennung nicht geprüft, und dieser Lauf hätte sie stillschweigend übersprungen.',
    );
    return;
  }

  const manifestPath = path.join(exportRoot, 'package.json');
  if (await exists(manifestPath)) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const declared = {
      ...(manifest.dependencies ?? {}),
      ...(manifest.devDependencies ?? {}),
      ...(manifest.peerDependencies ?? {}),
      ...(manifest.optionalDependencies ?? {}),
    };
    for (const name of Object.keys(declared)) {
      if (name === '@takt/storage' || name.startsWith('@takt/storage/')) {
        fail('packages/export/package.json führt @takt/storage als Abhängigkeit. Der Exportmotor darf die Speicherung nicht kennen.');
      }
    }
    note('packages/export/package.json auf verbotene Abhängigkeiten geprüft.');
  }

  const sources = await collect(path.join(exportRoot, 'src'), ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs']);
  for (const file of sources) {
    const source = await readFile(file, 'utf8');
    const where = relativeToRepo(file);

    for (const specifier of specifiers(source)) {
      if (specifier === '@takt/domain') {
        fail(
          `${where} importiert @takt/domain als Ganzes. ` +
            'Erlaubt ist ausschließlich @takt/domain/export — über den Wurzeleinstieg wären Todo und TodoNote erreichbar (R-06).',
        );
        continue;
      }
      if (specifier.startsWith('@takt/domain/') && specifier !== '@takt/domain/export') {
        fail(`${where} importiert "${specifier}". Der Exportmotor sieht ausschließlich @takt/domain/export.`);
        continue;
      }
      for (const { prefix, reason } of forbiddenForExportPackage) {
        if (specifier === prefix || specifier.startsWith(`${prefix}/`)) {
          fail(`${where} importiert "${specifier}". ${reason}`);
        }
      }
      if (specifier.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), specifier);
        if (!resolved.startsWith(exportRoot + path.sep)) {
          fail(
            `${where} greift über einen relativen Pfad aus packages/export heraus ("${specifier}"). ` +
              'Damit ließe sich die Paketgrenze umgehen.',
          );
        }
      }
    }
  }

  if (sources.length < MIN_EXPORT_SOURCES) {
    fail(
      `packages/export/src: ${sources.length} Quelldatei(en) gefunden, erwartet mindestens ` +
        `${MIN_EXPORT_SOURCES}. Über null Dateien zu laufen und „unverletzt" zu melden ist keine Prüfung.`,
    );
    return;
  }

  note(`packages/export: ${sources.length} Quelldatei(en) auf Importe geprüft.`);
}

// ---------------------------------------------------------------------------
// Zusatz — niemand greift an der exports-Tabelle vorbei in die Domäne
// ---------------------------------------------------------------------------

async function checkDeepImports() {
  const roots = [path.join(repoRoot, 'packages'), path.join(repoRoot, 'apps')];
  let checked = 0;

  for (const root of roots) {
    for (const file of await collect(root, ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs'])) {
      if (file.startsWith(domainRoot + path.sep)) continue;
      checked += 1;
      const source = await readFile(file, 'utf8');
      for (const specifier of specifiers(source)) {
        if (specifier.startsWith('@takt/domain/src') || specifier.startsWith('@takt/storage/src')) {
          fail(
            `${relativeToRepo(file)} importiert "${specifier}" und umgeht damit die exports-Tabelle des Pakets.`,
          );
        }
      }
    }
  }

  if (checked < MIN_DEEP_IMPORT_SOURCES) {
    fail(
      `${checked} Quelldatei(en) außerhalb der Domäne gefunden, erwartet mindestens ` +
        `${MIN_DEEP_IMPORT_SOURCES}. So wenige gibt es in diesem Baum nicht — gesucht wurde am falschen Ort.`,
    );
    return;
  }

  note(`${checked} Quelldatei(en) außerhalb der Domäne auf Tiefenzugriffe geprüft.`);
}

// ---------------------------------------------------------------------------

await checkDomainEntryPoints();
await checkExportSurface();
await checkExportPackage();
await checkDeepImports();

for (const line of performed) {
  process.stdout.write(`  ok  ${line}\n`);
}

if (violations.length > 0) {
  process.stderr.write('\nGrenze der Notiz-Trennung verletzt (A-7.2, R-06):\n\n');
  for (const line of violations) {
    process.stderr.write(`  - ${line}\n`);
  }
  process.stderr.write('\n');
  process.exit(1);
}

process.stdout.write('\nNotiz-Trennung: alle Schichten unverletzt.\n');
