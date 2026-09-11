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
import path from 'node:path';

import {
  MissingSourceError,
  displayPath,
  locateWorkspacePackage,
  readTreeSync,
  requireDirectory,
  workspaceRoot,
} from '../../../scripts/source-anchors.mjs';

/*
 * ===========================================================================
 * Auflösung statt fester Pfade (T-249-1, gemeinsame Fassung seit T-249-5)
 * ===========================================================================
 *
 * Bis T-249-1 stand hier:
 *
 *     const repoRoot   = fileURLToPath(new URL('../../../', import.meta.url));
 *     const domainRoot = path.join(repoRoot, 'packages', 'domain');
 *     const exportRoot = path.join(repoRoot, 'packages', 'export');
 *
 * Drei Zählungen und keine Auflösung. Für **diesen** Lauf ist das schwerer als
 * anderswo: Er urteilt über Grenzen, die nicht überschritten werden — „kein
 * Tiefenzugriff", „kein verbotener Import". Solche Sätze werden über einer
 * leeren Menge wahr. Die beiden Untergrenzen weiter unten
 * (`MIN_EXPORT_SOURCES`, `MIN_DEEP_IMPORT_SOURCES`) sind genau deshalb schon
 * vorher eingezogen worden; was fehlte, war die andere Hälfte: daß der Lauf
 * überhaupt am richtigen Ort sucht.
 *
 * `@takt/domain` löst sich selbst über seine Ausfuhrtabelle auf
 * (`"./package.json"`). `@takt/export` kann es nicht — die Domäne hängt
 * absichtlich von niemandem ab, und ein Eintrag in ihren `dependencies`, nur
 * damit ein Wächter ein Verzeichnis findet, wäre genau die Grenzverletzung,
 * gegen die dieser Wächter geschrieben ist. Also über den Arbeitsbereich:
 * `pnpm-workspace.yaml` sagt, wo Pakete liegen dürfen, `package.json` sagt, wie
 * sie heißen.
 *
 * T-249-1 hatte den Leser dafür **abgeschrieben** — aus
 * `apps/local-api/scripts/source-resolve.mjs`, und der Kommentar sagte es selbst
 * („Das ist bewußt und ungern"). Seit T-249-4 steht er einmal im Bestand, in
 * `scripts/source-anchors.mjs` in der Wurzel, und seit T-249-5 bindet dieser
 * Wächter ihn ein statt ihn zu wiederholen. Der Ordner ist absichtlich **kein**
 * Arbeitsbereichspaket: keine `package.json`, kein Eintrag in
 * `pnpm-workspace.yaml`, keine Abhängigkeitskante — eingebunden über einen
 * relativen Pfad. Damit bleibt auch die Zusage aus Schicht 2 unberührt: Die
 * Domäne bekommt keine Abhängigkeit, nur weil ihr Wächter ein Verzeichnis
 * finden muß.
 *
 * Was hierbleibt, ist die **Ausgabe**: Die gemeinsame Fassung wirft
 * `MissingSourceError`, statt den Prozeß zu beenden — ein Baustein, der
 * `process.exit` ruft, läßt sich nicht gegenprüfen. Wie ein Fehlschlag aussieht,
 * entscheidet der Lauf, und dieser Lauf schreibt `FEHLER:` nach `stderr`.
 */

function bail(lines) {
  process.stderr.write(`FEHLER: ${lines.join('\n        ')}\n`);
  process.exit(1);
}

/**
 * Ein Wurf der gemeinsamen Bausteine wird zur `FEHLER`-Zeile dieses Wächters.
 *
 * Die Meldungen dort sind auf genau diese Ausgabe hin gesetzt: erste Zeile ohne
 * Einzug, Folgezeilen mit acht Leerzeichen. Sie gehen deshalb als **eine** Zeile
 * weiter. Ein Fehler, der kein `MissingSourceError` ist, fliegt durch — er ist
 * dann kein Fehlschlag der Auflösung, und ihn hier zu schlucken hieße, eine
 * fremde Ursache als gemessenen Befund auszugeben.
 */
function resolveOrBail(title, work) {
  try {
    return work();
  } catch (error) {
    if (!(error instanceof MissingSourceError)) throw error;
    bail([title, error.message]);
  }
}

const repoRoot = resolveOrBail('Wurzel des Arbeitsbereichs auflösen', () => workspaceRoot());

const domainRoot = resolveOrBail('Paket @takt/domain auflösen', () =>
  locateWorkspacePackage(repoRoot, '@takt/domain'),
);
const exportRoot = resolveOrBail('Paket @takt/export auflösen', () =>
  locateWorkspacePackage(repoRoot, '@takt/export'),
);

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

/* Relativ und mit Schrägstrichen, damit ein Befund unter Windows zeichengleich
 * so heißt wie unter Linux (T-247). Seit T-249-5 über den gemeinsamen Baustein
 * statt über eine eigene Zeile mit `path.sep`. */
const relativeToRepo = (file) => displayPath(repoRoot, file);

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

/**
 * Wohin `"./export"` in der Ausfuhrtabelle zeigt — die Tabelle **ist** hier die
 * Auflösung (T-249-1).
 *
 * Bis T-249-1 stand `path.join(domainRoot, 'src', 'export.ts')` hier, also eine
 * zweite Abschrift dessen, was `package.json` ohnehin sagt. Das ist genau die
 * Doppelung, gegen die Schicht 2 zwanzig Zeilen weiter oben prüft: Zieht die
 * Datei um und wird die Tabelle nachgezogen, zeigte die Abschrift ins Leere,
 * und dieser Wächter meldete „Exportgrenze fehlt" für eine Grenze, die steht.
 * Umgekehrt — Datei bleibt, Tabelle wandert — sähe er gar nichts.
 */
async function exportFlaechePfad() {
  const manifest = JSON.parse(await readFile(path.join(domainRoot, 'package.json'), 'utf8'));
  const eintrag = (manifest.exports ?? {})['./export'];
  if (typeof eintrag !== 'string') {
    return null;
  }
  return path.join(domainRoot, eintrag);
}

async function checkExportSurface() {
  const file = await exportFlaechePfad();
  if (file === null) {
    fail(
      'packages/domain/package.json nennt für "./export" keinen Dateipfad. Ohne ihn weiß dieser ' +
        'Lauf nicht, welche Datei die Exportgrenze ist — und würde sie stillschweigend nicht prüfen.',
    );
    return;
  }
  if (!(await exists(file))) {
    fail(
      `${relativeToRepo(file)} fehlt, obwohl die exports-Tabelle von @takt/domain darauf zeigt. ` +
        'Das ist die Exportgrenze; ohne sie gibt es keine Notiz-Trennung.',
    );
    return;
  }

  const source = await readFile(file, 'utf8');

  for (const specifier of specifiers(source)) {
    if (!allowedExportSurfaceImports.has(specifier)) {
      fail(
        `${relativeToRepo(file)} importiert "${specifier}". ` +
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
        `${relativeToRepo(file)}: die Typbehauptung "${assertion}" fehlt. ` +
          'Sie bindet die Notiz-Trennung an den Übersetzer; ohne sie fällt der Bruch erst in der Abrechnung auf (R-06).',
      );
    }
  }

  note(
    `Exportfläche ${relativeToRepo(file)} geprüft: importiert nur ${[...allowedExportSurfaceImports].join(' und ')}, ` +
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

/**
 * Was beim Suchen nach Paketen nicht betreten wird.
 *
 * Bauergebnisse tragen **veraltete Abschriften** der Quelldateien; eine davon zu
 * durchsuchen hieße, eine Kopie zu messen statt der Quelle (dieselbe Falle wie
 * in E-087). `target` steht mit darin, weil der Rust-Baum darunter groß ist und
 * kein Paket enthält.
 */
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git', 'dist', 'target', 'coverage', 'build']);

/**
 * Die durchsuchten Wurzeln — **jedes Paket dieses Baums**, dazu die gemeinsamen
 * Bauskripte in der Wurzel.
 *
 * Drei Fassungen hatte diese Liste. Bis T-249-1 waren es die zwei Verzeichnisse
 * `apps/` und `packages/` — eine abgeschriebene Regel, die ein drittes
 * Verzeichnis stillschweigend übergangen hätte. T-249-1 machte daraus die Pakete
 * aus `pnpm-workspace.yaml`, und das war besser, aber immer noch die falsche
 * Frage: Die Muster dort sagen, **wo ein Paket liegen darf**; dieser Wächter
 * fragt, **wo Quelltext liegt**. Fallen die beiden auseinander, soll er zu viel
 * lesen und nicht zu wenig — für einen Wächter ist die Richtung nicht
 * gleichgültig.
 *
 * Gesucht wird deshalb nach `package.json` im Baum. Der Wurzelmanifest fällt
 * heraus: Er ist der Arbeitsbereich selbst, und von ihm aus zu sammeln zöge
 * `tests/` und `docs/` mit hinein — beides Mengen, über die dieser Wächter nicht
 * urteilt.
 *
 * Und `scripts/` in der Wurzel kommt ausdrücklich dazu (T-249-5). Der Ordner ist
 * absichtlich kein Arbeitsbereichspaket und hat kein `package.json`; ohne diese
 * Zeile läge er außerhalb jeder Grenzprüfung. Heute führt die eine Datei darin
 * nur `node:fs`, `node:path` und `node:url` ein — aber niemand hält das morgen
 * fest, und eine Lücke, die man kennt, ist keine Lücke mehr, sondern eine
 * Entscheidung. Gegenprobe gefahren: eine Datei in `scripts/` mit
 * `@takt/domain/src/rounding.ts` wird jetzt genannt und der Lauf rot; vor dieser
 * Zeile wäre sie ungesehen durchgegangen.
 *
 * Daß der Ordner **da** ist, sichert schon die Einbindung oben — fehlt er, endet
 * dieser Lauf mit `ERR_MODULE_NOT_FOUND` und Rückgabewert 1, ehe ein Prüfsatz
 * läuft (gemessen). `requireDirectory` fängt den Rest: einen Ordner, den es
 * gäbe, der aber keiner ist. Vor allem aber steht die Bedingung damit **im
 * Code** und nicht in diesem Absatz — `collect` gäbe für ein fehlendes
 * Verzeichnis eine leere Liste zurück, und eine Datei weniger fiele in einer Zahl
 * über vierhundert niemandem auf.
 */
const deepImportRoots = resolveOrBail('Die durchsuchten Wurzeln auflösen', () => [
  ...readTreeSync(
    repoRoot,
    (name) => name === 'package.json',
    'die Suche nach allen Paketen des Bestands',
    (name) => !SKIPPED_DIRECTORIES.has(name),
  )
    .map((entry) => path.dirname(entry.path))
    .filter((directory) => directory !== repoRoot),
  requireDirectory(
    path.join(repoRoot, 'scripts'),
    'die Prüfung der gemeinsamen Bauskripte auf Tiefenzugriffe',
  ),
]);

async function checkDeepImports() {
  /*
   * Jede Datei genau einmal. Heute überschneidet sich keine der Wurzeln mit
   * einer anderen; läge morgen ein Paket **in** einem Paket, zählte der Lauf
   * dessen Dateien zweimal, und die gemeldete Zahl wäre keine Zahl von Dateien
   * mehr, sondern eine von Besuchen.
   */
  const seen = new Set();
  let checked = 0;

  for (const root of deepImportRoots) {
    for (const file of await collect(root, ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs'])) {
      if (file.startsWith(domainRoot + path.sep)) continue;
      if (seen.has(file)) continue;
      seen.add(file);
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
