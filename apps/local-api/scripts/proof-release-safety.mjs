/** Prüft feste Release-Adressen, abgeschlossene Datenflüsse und den unveränderten Anfrageweg; Gegenproben müssen Verstöße erkennen.
 * Alle Dateien unter `src` werden geprüft, auch dort liegende Tests. Bauskripte und getrennte Testprogramme bleiben außerhalb.
 * Adapter, Portliteral und Auskunft werden paketübergreifend auf identische Anweisungen geprüft. Laufzeitverhalten braucht eigene Tests. */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

/*
 * Der TypeScript-Compiler, und warum er hier steht (T-292).
 *
 * Drei Runden lang hat an dieser Stelle Text gegen TypeScript gespielt und
 * dreimal verloren: der Ausdruck `\{([^}]*)\}` brach am ersten `}` (T-289),
 * die gezählte Klammer brach am `}` **in einer Zeichenkette** (T-291), und
 * die Mitgliederregel `/(\w+)\s*\(/` sah überhaupt nur Methodensyntax — eine
 * Zeile im Hausstil der Nachbarschnittstelle (`readonly read: () => …`,
 * genau so steht `VersionCheckerOptions` in derselben Datei) machte den
 * ganzen Prüfsatz `rueckweg` still grün, Lauf 43/0. Jede Reparatur ließ die
 * nächste Schreibweise übrig; das ist kein Zufall, sondern die Bauart.
 *
 * Der sechste reguläre Ausdruck wäre derselbe Fehler ein viertes Mal. Gelesen
 * wird deshalb mit dem Compiler, und zwar genauso, wie es die Nachbarn tun:
 * `caller-scan.mjs` und `proof-route-policy.mjs` im selben Ordner,
 * `apps/web/scripts/proof-foreign.mjs` und `proof-surface.mjs` daneben.
 * Ein eigener Stil für dieselbe Sache wäre die nächste blinde zweite Fassung
 * (A-A-40).
 */
import ts from 'typescript';

import { arbeitsbereichWurzel, paketVerzeichnis, scheitern } from './source-resolve.mjs';

/*
 * Der Leser und die Regel liegen seit T-188 in `fetch-scan.mjs`, weil
 * `proof:callers` sie ebenfalls braucht und sie dort bis dahin in einer
 * **blinden** zweiten Fassung stand (A-A-40). Eine Regel, zwei Läufe, zwei
 * Gegenprobenreihen — E-086 Punkt 1.
 */
import { mentionsGlobalFetch, stripComments } from './fetch-scan.mjs';

/*
 * Erlaufen statt abgezählt (T-249-1): `../../..` waren drei Ebenen, weil dieser
 * Lauf heute in `apps/local-api/scripts` liegt. `ROOT` dient hier nur noch dazu,
 * die Pfade der Funde lesbar zu machen und die eine Wurzeldatei zu finden — die
 * Quellordner kommen über ihre Paketnamen.
 */
const ROOT = arbeitsbereichWurzel();

let passed = 0;
let failed = 0;
const failures = [];

function section(title) {
  process.stdout.write(`\n${title}\n${'-'.repeat(title.length)}\n`);
}

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    process.stdout.write(`  ok    ${name}\n`);
  } else {
    failed += 1;
    failures.push(name);
    process.stdout.write(`  FEHL  ${name}${detail === '' ? '' : ` — ${detail}`}\n`);
  }
}

// Der Baum

/**
 * Was gelesen wird. Ausgeschrieben und nicht „alles außer": Wer einen Ordner
 * hinzufügt, soll ihn hier eintragen und dabei merken, daß er ihn eintragen
 * mußte.
 *
 * Seit T-249-1 steht links der **Paketname** statt des Verzeichnisses, und
 * rechts eine **Untergrenze** (T-249-1). Beides hängt zusammen:
 *
 *  - Der Paketname überlebt den Umzug. `apps/web` heißt `@takt/web`, wo immer
 *    es liegt; `pnpm-workspace.yaml` sagt, wo Pakete stehen dürfen.
 *  - Die Untergrenze schließt den stummen Ausgang. Bis T-249-1 übersprang
 *    `collectTree` einen Quellordner, den es nicht gab, mit einem
 *    `continue` — und das war für diesen Lauf der gefährlichste Zustand
 *    überhaupt: Er urteilt darüber, daß **nirgends** im Baum eine zweite
 *    Adresse steht, daß **nirgends** heruntergeladen wird, daß `fetch`
 *    **nirgends** außerhalb einer Datei vorkommt. Jede dieser Aussagen wird
 *    über einem nicht gelesenen Ordner wahr. Der Prüfsatz „der Baum ist
 *    gelesen" zählte dabei weiter über 100 Dateien, weil die anderen sieben
 *    Ordner reichen — die Zahl war also da und half nichts.
 *
 * Die Zahlen sind bewußt rund die Hälfte des heutigen Standes (56, 129, 33, 3,
 * 11, 19, 24, 8). Sie sollen rot werden, wenn ein Ordner verschwindet oder
 * umbenannt wird, nicht wenn jemand aufräumt.
 */
const SOURCE_ROOTS = [
  { paket: '@takt/local-api', unterordner: 'src', mindestens: 25 },
  { paket: '@takt/web', unterordner: 'src', mindestens: 60 },
  { paket: '@takt/outlook-addin', unterordner: 'src', mindestens: 15 },
  { paket: '@takt/desktop', unterordner: 'src', mindestens: 2 },
  { paket: '@takt/desktop', unterordner: 'src-tauri/src', mindestens: 5 },
  { paket: '@takt/domain', unterordner: 'src', mindestens: 9 },
  { paket: '@takt/storage', unterordner: 'src', mindestens: 12 },
  { paket: '@takt/export', unterordner: 'src', mindestens: 4 },
];

/**
 * Einzelne Dateien außerhalb der Quellordner, die trotzdem zählen.
 *
 * `paket: null` heißt „im Wurzelverzeichnis des Arbeitsbereichs". Auch hier
 * gilt seit T-249-1: eine Datei, die nicht da ist, ist ein **Fehlschlag der
 * Messung** und kein leerer Fund. `tauri.conf.json` ist die Datei, gegen die
 * `proof:shell-surface` die CSP-Zusage zeichengleich mißt; sie stillschweigend
 * auszulassen hieße, über die Zusage zu urteilen, ohne sie gesehen zu haben.
 */
const EXTRA_FILES = [
  { paket: '@takt/desktop', pfad: 'src-tauri/tauri.conf.json' },
  { paket: '@takt/desktop', pfad: 'src-tauri/Cargo.toml' },
  { paket: '@takt/local-api', pfad: 'package.json' },
  { paket: '@takt/web', pfad: 'package.json' },
  { paket: '@takt/desktop', pfad: 'package.json' },
  { paket: '@takt/outlook-addin', pfad: 'package.json' },
  { paket: '@takt/domain', pfad: 'package.json' },
  { paket: '@takt/storage', pfad: 'package.json' },
  { paket: '@takt/export', pfad: 'package.json' },
  { paket: null, pfad: 'package.json' },
];

/**
 * Die Endungen des **gelaufenen** Baums — und warum die Liste seit T-327 nur
 * noch die halbe Menge bestimmt (Befund T-324 zu Zeile 1442).
 *
 * ===========================================================================
 * Die Liste war die sechste Gestalt derselben Niederlage
 * ===========================================================================
 *
 * Sie ist eine **handgeschriebene Aufzählung**, und `.cts` fehlte darin. Die
 * Folge war nicht der ungelesene Baum — die Programmhälfte von
 * {@link collectTree} filtert keine Endungen und hat die Datei längst
 * eingesammelt —, sondern der **blinde Leser**: `istTypescriptDatei` hing an
 * derselben Aufzählung, und beide Zusagen über den Baum kehrten daran um.
 *
 * Gemessen in T-327 an einer Kopie dieses Zweigs (`tsc` 5.9.3 dieses Vorhabens,
 * `apps/local-api/tsconfig.json`, unverändert):
 *
 *     apps/local-api/src/features/version/augment.cts
 *       export {};
 *       declare module './version.ts' {
 *         interface VersionCheckStorePort { read?(): Promise<string | null> }
 *       }
 *
 *   `--listFiles` nennt die Datei im Programm, `port.read?.()` übersetzt,
 *   **tsc gibt 0 zurück**, und dieser Lauf blieb bei **76/0 grün**.
 *
 * (Die Feinheit, die T-327 dabei gemessen hat und die in den Bericht gehört:
 * Mit einem **pflichtigen** `read()` bricht nicht dieser Lauf, sondern
 * `composition.ts` mit `TS2379` — der Store dort hat kein `read`. Die Gestalt,
 * die wirklich durchkommt, ist deshalb das **optionale** `read?()`. Ein
 * Wächter, dessen Gegenprobe nur die pflichtige Form kennt, mißt die Umgehung
 * nicht, die gebaut würde.)
 *
 * ===========================================================================
 * Was die Liste heute noch tut
 * ===========================================================================
 *
 * Sie bestimmt **ausschließlich die nicht-TypeScript-Hälfte** des Baums: Rust,
 * JSON, TOML, HTML. Die kann kein Übersetzungsprogramm liefern — der Compiler
 * übersetzt kein `.rs`. Für TypeScript ist seit T-327 das Programm die Menge
 * (sieben Programme, {@link PROGRAM_CONFIGS}), und die Frage „trägt diese Datei
 * TypeScript-Deklarationen" beantwortet der Compiler
 * ({@link traegtTypescript}) und keine Aufzählung mehr.
 *
 * `.cts` und `.cjs` stehen trotzdem hier. Eine `.cts` **außerhalb** jedes
 * Programms — in einer Quellwurzel, die keine Konfiguration einschließt — wäre
 * sonst wieder nur deshalb unsichtbar, weil eine Endung fehlt. Gemessen am
 * 2026-09-13: **336 gelaufene TypeScript-Dateien, davon 0 außerhalb aller
 * sieben Programme**; die Ergänzung ändert heute nichts und schließt eine
 * latente Lücke.
 */
const READ_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.mjs',
  '.cjs',
  '.rs',
  '.json',
  '.toml',
  '.html',
]);

/**
 * Was beim Ablaufen des Baums übersprungen wird — und was **seit T-320 nicht
 * mehr**.
 *
 * ===========================================================================
 * `test`, `tests` und `__tests__` standen hier und waren die fünfte gemessene
 * Umgehung dieses Wächters
 * ===========================================================================
 *
 * Sie wurden auf **jeder** Tiefe übersprungen, also auch unterhalb eines
 * Quellordners. `apps/local-api/tsconfig.json` hat `"include": ["src"]` und
 * keinen `exclude`; eine Datei unter `src/**` liegt damit im
 * Übersetzungsprogramm, auch wenn ein Verzeichnis auf dem Weg `test` heißt.
 * Gemessen (T-318, B-1):
 *
 *     src/features/version/test/augment.ts
 *       export {};
 *       declare module '../version.ts' {
 *         interface VersionCheckStorePort { read(): Promise<string | null> }
 *       }
 *
 * `port.read()` übersetzt, `tsc` gibt 0 zurück — und keine der beiden Zusagen
 * über den Baum sah die Datei, weil dieser Lauf sie nicht las. Die Klasse war
 * damit nicht geschlossen, sondern ein Verzeichnis tiefer gezogen.
 *
 * **Die drei Namen zu streichen kostet nichts:** Die sieben Prüfordner des
 * Bestands (`apps/{desktop,local-api,outlook-addin,web}/test`,
 * `packages/{domain,export,storage}/test`) sind sämtlich Geschwister von `src`
 * und liegen ohnehin außerhalb jedes `SOURCE_ROOTS`-Laufs — gemessen mit
 * `find … -type d -name test` (T-318, T-320). Sie waren hier wirkungslos und
 * öffneten dabei genau eine Tür.
 *
 * **Das allein wäre aber wieder eine Verzeichnisliste**, und die fünf
 * Niederlagen dieses Wächters kamen jede daher, daß er den Baum anders bestimmt
 * hat als der Compiler. Deshalb steht daneben {@link uebersetzungsprogramm}:
 * Die Menge wird nicht mehr nur gelaufen, sondern zusätzlich beim Compiler
 * **erfragt**.
 */
const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', 'target']);

function walk(directory, out) {
  for (const entry of readdirSync(directory)) {
    if (SKIP_DIRECTORIES.has(entry)) continue;
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
      continue;
    }
    const dot = entry.lastIndexOf('.');
    if (dot === -1 || !READ_EXTENSIONS.has(entry.slice(dot))) continue;
    out.push(full);
  }
}

/*
 * `stripComments` stand bis T-188 hier. Sie liegt jetzt in `fetch-scan.mjs`,
 * zusammen mit der Regel über das globale `fetch`: `proof:callers` braucht
 * beides und trug bis dahin eine eigene, blinde Fassung (A-A-40). Sie ist
 * dabei **längen- und zeilentreu** geworden — ein entfernter Kommentar
 * hinterläßt Leerzeichen statt gar nichts —, damit ein Befund die Zeile
 * nennen kann. Für die Prüfungen hier ändert das nichts: Sie fragen nach
 * Vorkommen, nicht nach Abständen.
 */

/**
 * Die **Übersetzungsprogramme**, beim Compiler erfragt (T-320, auf alle sieben
 * Pakete erweitert in T-327).
 *
 * ===========================================================================
 * Warum der Wächter den Baum nicht mehr allein bestimmt
 * ===========================================================================
 *
 * Dieser Lauf urteilt in Abwesenheiten: **nirgends** eine zweite Adresse,
 * **nirgends** ein Herunterladen, **nirgends** ein zweiter Erweiterungsblock.
 * Jede dieser Aussagen wird über einer nicht gelesenen Datei wahr. Fünfmal ist
 * er an genau dieser Stelle unterlegen, und jedes Mal, weil **seine** Menge an
 * dem aufgespannt war, was er zu lesen gewohnt ist, statt an dem, was der
 * Compiler sieht (E-099 Punkt 3; zuletzt T-318 B-1).
 *
 * Deshalb wird die Menge zweimal bestimmt und vereinigt:
 *
 *  1. **Gelaufen** über die acht Quellordner aus {@link SOURCE_ROOTS}. Das
 *     liefert, was kein Programm liefern kann: Rust, TOML, JSON, HTML.
 *  2. **Erfragt** über die Konfiguration **jedes** Pakets: `include`, `exclude`
 *     und `files` wertet `ts.parseJsonConfigFileContent` nach den Regeln des
 *     Compilers aus, und `ts.createProgram` legt die **transitive** Hülle
 *     darüber. Damit ist jede Datei erfaßt, die wirklich übersetzt wird — auch
 *     eine unter `src/**\/test/**`, auch eine, die nur über eine Importzeile
 *     aus einem Ordner hereinkommt, den keine Liste hier nennt.
 *
 * Was eine Deklarationszusammenführung bewirken kann, entscheidet sich genau in
 * dieser Menge: Zwei Deklarationen verschmelzen nur innerhalb **eines**
 * Programms. Wer sie messen will, muß das Programm fragen.
 *
 * ===========================================================================
 * Warum seit T-327 **sieben** Programme und nicht eines (Befund T-324 zu
 * Zeile 316)
 * ===========================================================================
 *
 * Bis T-327 wurde genau ein Programm gefragt — `@takt/local-api` —, und für
 * `apps/web`, `apps/desktop`, `apps/outlook-addin` und `packages/export`
 * bestimmte weiter eine **Verzeichnisliste** den Baum. Das ist die Bauart, an
 * der dieser Lauf fünfmal unterlegen ist, für vier von fünf Oberflächen.
 *
 * Gemessen am 2026-09-13 (eigenes Skript, `parseJsonConfigFileContent` +
 * `createProgram` je Paketkonfiguration, danach gegen den gelaufenen Baum
 * gehalten): **drei** Dateien lagen in einem Programm und wurden von diesem
 * Lauf nicht gelesen.
 *
 *  - `apps/web/vite.config.ts` — steht wörtlich in `"include"` des Pakets;
 *  - `apps/outlook-addin/vite.config.ts` — ebenso;
 *  - `apps/desktop/sidecar/entry.ts` — **von T-324 nicht genannt und die
 *    schwerste der drei**: der Einstiegspunkt, aus dem die ausgelieferte
 *    Sidecar-Binärdatei entsteht. Er ruft `main()` des Dienstes. Eine Adresse,
 *    ein `fetch` oder ein Öffnen-Befehl dort ist Laufzeitcode im Erzeugnis, und
 *    dieser Lauf hat ihn nie gesehen.
 *
 * Ein `define` oder ein `proxy` in einer der beiden Vite-Konfigurationen wandert
 * in das ausgelieferte Webbündel; das ist Laufzeitcode und nicht Lieferkette,
 * anders als `scripts/`. Alle drei sind jetzt **in der gelesenen Menge** und
 * stehen deshalb in keiner Lückenliste. Das war die Wahl zwischen „aufnehmen"
 * und „ausdrücklich als Lücke nennen"; aufnehmen kostet hier nichts, weil die
 * Konfigurationen die Dateien selbst einschließen.
 *
 * **Der Preis, gemessen:** die sieben Auflösungen kosten zusammen rund 2,3 s
 * (543 + 680 + 389 + 387 + 45 + 184 + 39 ms) statt der einen halben Sekunde.
 * Der ganze Lauf steigt damit von **1,6 s auf 4,6 s** (beide Zahlen am
 * 2026-09-13 gemessen, `time node …`). Das ist bezahlt: Eine Aussage über
 * „nirgends" kostet, sonst ist sie keine.
 *
 * ===========================================================================
 * Was weiterhin draußen bleibt, und zwar benannt
 * ===========================================================================
 *
 *  - **`node_modules/**`**, einschließlich `@types`. Eine Erweiterung von dort
 *    wirkt im selben Programm und wird hier nicht gefangen. Sie wird ausgelassen,
 *    weil jede zweite `.d.ts` eines Fremdpakets ein `declare module` trägt und
 *    Zusage 1 daran restlos untergehen würde; die Abwehr dagegen ist `pnpm audit`
 *    und die Sperrdatei, nicht dieser Lauf. Der Eintrag steht in der Liste bei
 *    `checkNoStoreReadback`.
 *  - **Die Prüfprogramme** (`tsconfig.test.json` je Paket). Sie sind nicht die
 *    Programme des Erzeugnisses, und eine Zusammenführung wirkt nur innerhalb
 *    **eines** Programms — was in einem Prüfordner steht, kann den
 *    ausgelieferten Stand nicht ändern. Das ist der Grund, warum die sieben
 *    Prüfordner **neben** den `src`-Wurzeln draußen bleiben dürfen; bis T-327
 *    stand dafür ein Ortsargument („sie sind Geschwister von `src`"), und ein
 *    Ort ist kein Grund.
 *  - Alles **außerhalb des Vorhabens** (ein Pfad, der aus `ROOT` hinausführt).
 *
 * ===========================================================================
 * Der stumme Ausgang ist zu — dieselbe Regel wie bei den Quellordnern
 * ===========================================================================
 *
 * Eine Konfiguration, die sich nicht lesen läßt, ein Programm ohne Dateien, ein
 * Programm ohne die Datei, um die es geht: **Abbruch mit Namen** und kein leerer
 * Fund. Ein Programm, das nicht gemessen werden konnte, ist der Zustand, in dem
 * jede Aussage über es wahr wird (T-249-1).
 *
 * Die Untergrenzen sind rund die Hälfte des heutigen Standes (121, 196, 124, 65,
 * 22, 47, 11 eigene Dateien, gemessen am 2026-09-13). Sie sollen rot werden,
 * wenn eine Auflösung zusammenbricht, nicht wenn jemand aufräumt.
 */
const PROGRAM_CONFIGS = [
  { paket: '@takt/local-api', pfad: 'tsconfig.json', mindestens: 60 },
  { paket: '@takt/web', pfad: 'tsconfig.json', mindestens: 95 },
  { paket: '@takt/desktop', pfad: 'tsconfig.json', mindestens: 60 },
  { paket: '@takt/outlook-addin', pfad: 'tsconfig.json', mindestens: 30 },
  { paket: '@takt/domain', pfad: 'tsconfig.json', mindestens: 11 },
  { paket: '@takt/storage', pfad: 'tsconfig.json', mindestens: 23 },
  { paket: '@takt/export', pfad: 'tsconfig.json', mindestens: 5 },
];

/**
 * Die Datei, die im Programm des Dienstes liegen **muß**, damit die Messung
 * etwas bedeutet.
 *
 * Sie trägt `VersionCheckStorePort`. Ein Programm ohne sie ist kein Programm
 * über die Versionsprüfung, und die beiden Zusagen über den Baum wären darüber
 * leer.
 */
const PROGRAM_REQUIRED_FILE = 'apps/local-api/src/features/version/version.ts';

/**
 * Die Art einer Datei — **vom Compiler bestimmt** und nicht aus der Endung
 * geraten (T-327, Befund T-324 zu Zeile 1442).
 *
 * `ts.getScriptKindFromFileName` ist derselbe Schritt, mit dem der Compiler
 * selbst entscheidet, wie er eine Datei liest: `.cts`, `.mts`, `.d.cts` und
 * `.d.ts` sind `TS`, `.tsx` ist `TSX`, `.json` ist `JSON`, `.rs` und `.toml`
 * sind `Unknown`. Eine handgeschriebene Aufzählung an dieser Stelle war die
 * sechste Gestalt derselben Niederlage; die Begründung steht bei
 * {@link READ_EXTENSIONS}.
 *
 * **Und sie ist `intern`** (Befund T-331 zu Zeile 486, gemessen): Sie steht in
 * `typescript@5.9.3/lib/typescript.d.ts` **nicht** — null Treffer —, sondern
 * gehört zur inneren Schnittstelle des Compilers. Diese Datei ist ein `.mjs`,
 * also fängt kein Typprüfer ihr Verschwinden ab; die Prüfung eine Zeile weiter
 * unten ist deshalb kein Beiwerk, sondern der **einzige** Schutz davor, daß
 * eine spätere Fassung von TypeScript diesen Leser stillschweigend blind macht.
 * Gemessen wurde gegen die Fassung des Vorhabens, **TypeScript 5.9.3**.
 *
 * **Kein stiller Rückfall.** Fehlt die Funktion in einer künftigen
 * TypeScript-Fassung, ist das ein Abbruch mit Namen und nicht eine Endungsliste
 * im `catch`. Eine Endungsliste als Rückfall wäre genau der Zustand, aus dem
 * dieser Umbau herausführt.
 */
function scriptArt(pfad) {
  if (typeof ts.getScriptKindFromFileName !== 'function') {
    scheitern(
      'Die Art einer Datei beim Compiler erfragen',
      `ts.getScriptKindFromFileName gibt es in TypeScript ${ts.version} nicht.`,
      'Eine handgeschriebene Endungsliste als Rückfall wäre die Lücke, die T-327 geschlossen',
      'hat (.cts fehlte darin, gemessen mit tsc und Exit 0).',
    );
  }
  return ts.getScriptKindFromFileName(pfad);
}

/**
 * Trägt diese Datei TypeScript-Deklarationen? Die Frage der beiden Zusagen über
 * den Baum — und die Antwort kommt vom Compiler.
 */
function traegtTypescript(pfad) {
  const art = scriptArt(pfad);
  return art === ts.ScriptKind.TS || art === ts.ScriptKind.TSX;
}

/**
 * Einmal aufgelöst, mehrfach gefragt.
 *
 * Die sieben `ts.createProgram` kosten zusammen rund 2,3 s; der Lauf fragt
 * dreimal (der Baum, und zwei Prüfsätze in Abschnitt 0). Ein Zwischenwert ist
 * hier kein Tempowunsch, sondern die Zusage, daß alle drei **dieselbe** Menge
 * sehen — zwei Auflösungen wären zwei Antworten auf dieselbe Frage, und das ist
 * in dieser Datei der wiederkehrende Fehler.
 */
let programmZwischenwert = null;

function uebersetzungsprogramm() {
  if (programmZwischenwert !== null) return programmZwischenwert;
  programmZwischenwert = aufloesenDerProgramme();
  return programmZwischenwert;
}

function aufloesenDerProgramme() {
  const vereinigt = new Map();
  for (const konfiguration of PROGRAM_CONFIGS) {
    for (const datei of aufloesenEinesProgramms(konfiguration)) {
      if (!vereinigt.has(datei.pfad)) vereinigt.set(datei.pfad, datei);
    }
  }
  if (![...vereinigt.keys()].includes(PROGRAM_REQUIRED_FILE)) {
    scheitern(
      'Übersetzungsprogramme messen',
      `${PROGRAM_REQUIRED_FILE} liegt in keinem der ${String(PROGRAM_CONFIGS.length)} aufgelösten Programme.`,
      'Dann ist das gemessene Programm nicht das der Versionsprüfung, und die beiden',
      'Zusagen über den Baum wären darüber leer.',
    );
  }
  return [...vereinigt.values()];
}

/** Die Bilanz je Programm, damit der Lauf sagt, was er aufgelöst hat. */
const programmBilanz = [];

function aufloesenEinesProgramms(konfiguration) {
  const name = `${konfiguration.paket}/${konfiguration.pfad}`;
  const configPath = join(paketVerzeichnis(konfiguration.paket), konfiguration.pfad);
  const gelesen = ts.readConfigFile(configPath, (pfad) => {
    try {
      return readFileSync(pfad, 'utf8');
    } catch {
      return undefined;
    }
  });
  if (gelesen.error !== undefined || gelesen.config === undefined) {
    scheitern(
      `Übersetzungsprogramm ${name} lesen`,
      `${configPath} ließ sich nicht als Konfiguration lesen.`,
      'Ohne die Konfiguration bestimmt wieder eine Verzeichnisliste den Baum — und genau',
      'daran ist dieser Lauf fünfmal unterlegen (T-320).',
    );
  }
  const parsed = ts.parseJsonConfigFileContent(gelesen.config, ts.sys, dirname(configPath));
  if (parsed.errors.length > 0) {
    scheitern(
      `Übersetzungsprogramm ${name} auflösen`,
      `${parsed.errors.length} Fehler beim Auswerten von include/exclude/files.`,
      'Eine halb aufgelöste Konfiguration nennt zu wenige Dateien, und zu wenige Dateien',
      'machen jede Abwesenheitsaussage wahr.',
    );
  }

  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const eigen = [];
  for (const file of program.getSourceFiles()) {
    const pfad = relative(ROOT, file.fileName).split(sep).join('/');
    // Außerhalb des Vorhabens (`../…`) und alles aus `node_modules` — beides
    // oben benannt und nicht stillschweigend.
    if (pfad === '' || pfad.startsWith('../')) continue;
    if (pfad.includes('node_modules/')) continue;
    eigen.push({ voll: file.fileName, pfad });
  }

  if (eigen.length < konfiguration.mindestens) {
    scheitern(
      `Übersetzungsprogramm ${name} messen`,
      `${eigen.length} eigene Datei(en) im Programm, verlangt sind mindestens ${konfiguration.mindestens}.`,
      'Ein Programm, das fast leer ist, ist nicht aufgelöst worden — und über einem nicht',
      'aufgelösten Programm ist jede Aussage dieses Laufs wahr.',
    );
  }
  programmBilanz.push(`${konfiguration.paket}: ${eigen.length}`);
  return eigen;
}

/**
 * Sammelt den Baum — und bricht ab, wo er ihn nicht findet (T-249-1).
 *
 * Die beiden `continue` und das leere `catch`, die hier bis T-249-1 standen,
 * waren der stumme Ausgang: ein fehlender Quellordner, ein fehlendes Manifest,
 * und die Aussagen dieses Laufs wurden über ihnen leer und damit wahr. Jetzt
 * ist beides ein Abbruch mit Namen.
 *
 * Seit T-320 kommt die zweite Hälfte dazu: die Dateien, die der Compiler
 * übersetzt ({@link uebersetzungsprogramm}). Vereinigt und einmal gezählt — ein
 * Pfad, den beide Wege nennen, wird einmal gelesen.
 */
function collectTree() {
  const files = [];
  const bilanz = [];
  for (const root of SOURCE_ROOTS) {
    const full = join(paketVerzeichnis(root.paket), root.unterordner);
    let istVerzeichnis = false;
    try {
      istVerzeichnis = statSync(full).isDirectory();
    } catch {
      istVerzeichnis = false;
    }
    if (!istVerzeichnis) {
      scheitern(
        `Quellordner ${root.paket}/${root.unterordner} lesen`,
        `${full} ist kein Verzeichnis.`,
        'Ein übersprungener Quellordner macht jede Aussage über ihn wahr — und dieser',
        'Lauf sagt „nirgends im Baum".',
      );
    }
    const found = [];
    walk(full, found);
    if (found.length < root.mindestens) {
      scheitern(
        `Quellordner ${root.paket}/${root.unterordner} lesen`,
        `${found.length} Datei(en) gefunden, verlangt sind mindestens ${root.mindestens}.`,
        `Endungen: ${[...READ_EXTENSIONS].join(' ')}`,
      );
    }
    bilanz.push(`${root.paket}/${root.unterordner}: ${found.length}`);
    for (const file of found) files.push(file);
  }
  for (const extra of EXTRA_FILES) {
    const full =
      extra.paket === null
        ? join(ROOT, extra.pfad)
        : join(paketVerzeichnis(extra.paket), extra.pfad);
    let istDatei = false;
    try {
      istDatei = statSync(full).isFile();
    } catch {
      istDatei = false;
    }
    if (!istDatei) {
      scheitern(
        `Einzeldatei ${extra.paket ?? '<Wurzel>'}/${extra.pfad} lesen`,
        `${full} ist keine Datei.`,
        'Eine ausgelassene Einzeldatei ist eine Datei, über die dieser Lauf schweigt,',
        'während er behauptet, den ganzen Baum gesehen zu haben.',
      );
    }
    files.push(full);
  }

  /*
   * **Und die zweite Hälfte: was der Compiler übersetzt** (T-320, alle sieben
   * Pakete seit T-327).
   *
   * Sie steht hier und nicht an einer eigenen Prüfung, weil sie den **Baum**
   * betrifft und damit alle sieben Prüfungen zugleich — nicht nur die beiden
   * Zusagen, an denen die Lücke gemessen wurde. Eine Adresse, ein `fetch` oder
   * ein Öffnen-Befehl in einer Datei, die übersetzt wird, ist derselbe Verstoß,
   * ganz gleich in welchem Verzeichnis er steht.
   */
  const programm = uebersetzungsprogramm();
  bilanz.push(`Programme (${programmBilanz.join(', ')}): ${programm.length} vereinigt`);
  for (const datei of programm) files.push(datei.voll);

  process.stdout.write(`        ${bilanz.join(', ')}\n`);

  // Einmal je Pfad. Beide Wege nennen heute dieselben Dateien des Dienstes;
  // zweimal gelesen wäre jeder Befund darin zweimal gemeldet.
  const gesehen = new Set();
  const tree = [];
  for (const full of files) {
    const path = relative(ROOT, full).split(sep).join('/');
    if (gesehen.has(path)) continue;
    gesehen.add(path);
    const source = readFileSync(full, 'utf8');
    // In JSON und TOML gibt es keine Kommentare der obigen Bauart; sie laufen
    // trotzdem durch denselben Schritt, weil ein `//` in einer Adresse dort
    // genauso in einer Zeichenkette steht.
    tree.push({ path, source, code: stripComments(source) });
  }
  return tree;
}

// Die Prüfungen — als Funktionen über eine Dateiliste
//
// Sie nehmen die Liste entgegen und geben Befunde zurück. Genau deshalb sind
// sie in Abschnitt 0 mit einem erfundenen Baum zu füttern, in dem ein Verstoß
// steckt — ohne eine Datei ins Vorhaben zu legen.

/** Die eine Abfrageadresse (A-V-1). */
const API_URL = 'https://api.github.com/repos/KuyomieKurama/SuperTakt/releases/latest';
const API_HOST = 'api.github.com';

/** Die Adresse der Release-Seite, ohne Fassung (A-V-16, A-V-18). */
const RELEASE_PREFIX = 'https://github.com/KuyomieKurama/SuperTakt/releases/tag/v';

/**
 * Wo die Abfrageadresse stehen darf: an genau einer Stelle.
 */
const API_URL_FILE = 'apps/local-api/src/features/version/source.ts';

/**
 * Wo die Adresse der Release-Seite stehen darf.
 *
 * Zwei Orte, und ihr Gleichlauf wird gemessen (`proof:shell-surface`): die
 * Hülle baut die Adresse, die Oberfläche zeigt sie als Text daneben (A-V-18).
 *
 * ---------------------------------------------------------------------------
 * Warum hier ein **fester Pfad** steht und keine Merkmalsauflösung
 * ---------------------------------------------------------------------------
 *
 * Anderswo im Bestand ist der feste Pfad seit T-249-1 der Fehler: Ein Lauf, der
 * seinen Gegenstand über einen Ort statt über ein Merkmal sucht, findet ihn
 * nach einem Umzug nicht mehr und wird still grün (`source-resolve.mjs`).
 *
 * **Hier ist es umgekehrt, und das ist kein Widerspruch, sondern der Kern der
 * Zusage.** Diese Aufstellung sagt nicht „wo liegt die Datei mit der Adresse",
 * sondern „**an wie vielen und welchen Orten darf die Adresse überhaupt
 * stehen**". Das Merkmal, über das aufgelöst würde, wäre die Adresse selbst —
 * die Menge käme dann aus dem Bestand, gegen den geurteilt werden soll, und
 * jede dritte Fundstelle wäre über Nacht ein erlaubter Ort. Die Aussage
 * „genau zwei" wäre tautologisch wahr (A-V-18, E-103 gegengelesen).
 *
 * Der Preis ist ein rotes Fenster nach jedem Umzug einer der beiden Dateien.
 * Es ist bezahlt und **gewollt**: Der Lauf verlangt, daß jemand die Bewegung
 * bemerkt und hier bestätigt. Ein Wächter über eine Obergrenze, der sich seine
 * Obergrenze selbst nachzieht, bewacht nichts.
 *
 * Zuletzt nachgezogen mit T-257 (`apps/web/src/lib/releasePage.ts` →
 * `apps/web/src/features/settings/releasePage.ts`, Inhalt sha256-gleich).
 */
const RELEASE_PREFIX_FILES = new Set([
  'apps/desktop/src-tauri/src/release.rs',
  'apps/web/src/features/settings/releasePage.ts',
]);

/** Jede Zeichenkette, die einen Wirt auf github.com nennt. */
const GITHUB_LITERAL = /["'`]([^"'`\n]*github\.com[^"'`\n]*)["'`]/g;

function checkAddresses(files) {
  const findings = [];
  let apiCount = 0;

  for (const file of files) {
    for (const match of file.code.matchAll(GITHUB_LITERAL)) {
      const literal = match[1];

      if (literal === API_URL) {
        apiCount += 1;
        if (file.path !== API_URL_FILE) {
          findings.push(`${file.path}: die Abfrageadresse steht außerhalb von ${API_URL_FILE}`);
        }
        continue;
      }
      if (literal.startsWith(RELEASE_PREFIX)) {
        if (!RELEASE_PREFIX_FILES.has(file.path)) {
          findings.push(`${file.path}: die Adresse der Release-Seite steht an einem fremden Ort`);
        }
        continue;
      }
      findings.push(`${file.path}: dritte Adresse auf github.com — ${literal.slice(0, 80)}`);
    }

    // Ein Wirt, der nur so **aussieht** wie die Adresse. Er stünde nicht in
    // einer Zeichenkette mit `github.com`, sondern zusammengesetzt.
    if (file.path !== API_URL_FILE && file.code.includes(API_HOST)) {
      findings.push(`${file.path}: nennt ${API_HOST} außerhalb der einen Stelle`);
    }
  }

  if (apiCount !== 1) {
    findings.push(`die Abfrageadresse kommt ${String(apiCount)}-mal vor, erwartet ist genau einmal`);
  }
  return findings;
}

/**
 * Felder der Antwort, die niemand liest (A-V-7).
 *
 * `html_url` ist der gefährlichste: Eine Adresse aus einer Antwort an einen
 * Öffnen-Befehl zu reichen wäre dieselbe Bauart wie eine offene Weiterleitung
 * — nur mit dem Browser des Benutzers als Ziel (B-18.2).
 */
const FORBIDDEN_FIELDS = [
  'html_url',
  'browser_download_url',
  'upload_url',
  'assets_url',
  'zipball_url',
  'tarball_url',
  'body_html',
  'tarball',
];

/**
 * Der eine Feldname, und warum er anders gemessen wird als die übrigen.
 *
 * `tag_name` ist nicht nur das Feld der GitHub-Antwort, sondern auch eine
 * **Spalte dieses Bestands** (`tag.name_key`, `ux_tag_name`) und Teil des
 * Fehlerschlüssels `tag_name_ambiguous`. Eine Suche nach der Teilzeichenkette
 * fände zwei Dutzend Stellen, die mit GitHub nichts zu tun haben — und ein
 * Nachweis, der ständig aus dem falschen Grund rot ist, wird abgeschaltet.
 *
 * Gemessen wird deshalb genau die Gestalt, in der man das Feld einer Antwort
 * liest, und keine andere:
 *
 *   * die **vollständige** Zeichenkette `'tag_name'` — der Zugriff über eine
 *     Klammer, wie ihn `version/source.ts` benutzt. `'ux_tag_name'` und
 *     `'tag_name_ambiguous'` sind andere Zeichenketten und fallen nicht
 *     darunter;
 *   * der **Punktzugriff** `.tag_name` — die naheliegende Schreibweise, mit
 *     der jemand `daten.tag_name` läse. Sie ist im ganzen Baum verboten, auch
 *     an der einen erlaubten Stelle: Dort steht bewußt der Klammerzugriff
 *     hinter einem `Object.hasOwn`, damit ein `tag_name` aus der
 *     Prototypenkette nicht durchkommt.
 */
const TAG_NAME_LITERAL = /["'`]tag_name["'`]/g;
const TAG_NAME_DOT = /\.tag_name\b/;

function checkResponseFields(files) {
  const findings = [];
  let tagNameCount = 0;

  for (const file of files) {
    for (const field of FORBIDDEN_FIELDS) {
      if (file.code.includes(field)) {
        findings.push(`${file.path}: liest oder nennt \`${field}\` im Code`);
      }
    }
    if (TAG_NAME_DOT.test(file.code)) {
      findings.push(`${file.path}: liest \`.tag_name\` als Feld eines Objekts`);
    }
    const hits = [...file.code.matchAll(TAG_NAME_LITERAL)].length;
    if (hits > 0) {
      tagNameCount += hits;
      if (file.path !== API_URL_FILE) {
        findings.push(`${file.path}: greift auf \`tag_name\` zu — das tut genau eine Stelle`);
      }
    }
  }

  if (tagNameCount !== 1) {
    findings.push(`\`tag_name\` wird ${String(tagNameCount)}-mal gelesen, erwartet ist genau einmal`);
  }
  return findings;
}

/**
 * Der Weg zum Öffnen-Befehl (A-V-16, E-064 Punkt 4).
 *
 * Der Befehl nimmt **die Fassungsbezeichnung** entgegen und nichts, was eine
 * Adresse sein könnte. Gemessen an der Nutzlast des Aufrufs aus der Oberfläche
 * und an der Signatur in der Hülle.
 */
const OPEN_COMMAND = 'takt_open_release';
const URLISH = /\b(url|href|link|uri|address|htmlUrl|downloadUrl)\b/i;

function checkOpenCommand(files) {
  const findings = [];

  for (const file of files) {
    // Die Nutzlast des Aufrufs: `invoke('takt_open_release', { … })`.
    for (const match of file.code.matchAll(
      new RegExp(`${OPEN_COMMAND}['"\`]?\\s*,\\s*\\{([^}]*)\\}`, 'g'),
    )) {
      const payload = match[1] ?? '';
      const keys = [...payload.matchAll(/([A-Za-z_$][\w$]*)\s*[:,}]|([A-Za-z_$][\w$]*)\s*$/g)]
        .map((entry) => entry[1] ?? entry[2])
        .filter((key) => key !== undefined);
      const strays = keys.filter((key) => key !== 'version');
      if (strays.length > 0) {
        findings.push(`${file.path}: ${OPEN_COMMAND} bekommt außer \`version\` noch ${strays.join('/')}`);
      }
    }

    // Die Signatur in der Hülle: genau ein Parameter, und er heißt `version`.
    for (const match of file.code.matchAll(new RegExp(`fn\\s+${OPEN_COMMAND}\\s*\\(([^)]*)\\)`, 'g'))) {
      const parameters = (match[1] ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      const suspicious = parameters.filter((entry) => URLISH.test(entry));
      if (suspicious.length > 0) {
        findings.push(`${file.path}: ${OPEN_COMMAND} nimmt etwas entgegen, das eine Adresse sein kann`);
      }
    }

    // Ein Anker mit einer Adresse auf github.com trüge den Webview selbst
    // dorthin — es gibt keinen Wächter, der das abfinge (A-V-18).
    if (/href\s*=\s*[{"'`][^\n]*github/i.test(file.code)) {
      findings.push(`${file.path}: ein \`href\` zeigt auf github.com`);
    }
  }

  return findings;
}

/**
 * Kein Herunterladen und kein Installieren, an keiner Stelle (A-18.9).
 *
 * Die Liste nennt beides: die Bauteile, mit denen man es täte, und die Namen,
 * unter denen es üblicherweise geschieht. Ein Paket, das es könnte, ist bereits
 * ein Befund — auch ungenutzt.
 */
const DOWNLOAD_MARKERS = [
  'tauri-plugin-updater',
  '@tauri-apps/plugin-updater',
  'plugin:updater',
  'downloadAndInstall',
  'checkUpdate',
  'installUpdate',
  'browser_download_url',
  'application/octet-stream',
];

/** Kein zweiter Netzweg und keine gedrehte Zertifikatsprüfung (A-V-4). */
const TRANSPORT_MARKERS = [
  'NODE_TLS_REJECT_UNAUTHORIZED',
  'NODE_USE_ENV_PROXY',
  'rejectUnauthorized',
  'ProxyAgent',
  'dispatcher:',
  'setGlobalDispatcher',
];

function checkNoDownload(files) {
  const findings = [];
  for (const file of files) {
    for (const marker of [...DOWNLOAD_MARKERS, ...TRANSPORT_MARKERS]) {
      if (file.code.includes(marker)) findings.push(`${file.path}: nennt \`${marker}\``);
    }
  }
  return findings;
}

/**
 * Genau ein Ausgang, und er liegt nicht in einem Anfragebehandler (A-V-10).
 *
 * `fetch(` im Dienst gibt es einmal. Und keine Routendatei kennt die
 * Abholfunktion — läge sie dort, wäre der Netzaufruf eine Anfrage weit von
 * jedem lokalen Prozess entfernt.
 */
/*
 * ===========================================================================
 * Wo die Regel steht, und was sie bis T-146 nicht sah (Befund T-143 S-1)
 * ===========================================================================
 *
 * `mentionsGlobalFetch` liegt seit T-188 in `fetch-scan.mjs`; dort steht auch
 * die ganze Herleitung. Kurz, damit dieser Lauf ohne Sprung lesbar bleibt:
 *
 * Bis T-146 stand hier `/(?<![\w.$-])fetch\b(?!\s*:)/` — ein Ausdruck mit
 * zwei Ausnahmen, und beide waren zu breit. Der Punkt in der Rückschau schloß
 * **jedes** `.fetch` aus, um `app.fetch` und `options.fetch` durchzulassen;
 * damit war `globalThis.fetch(u)` und `window.fetch(u)` blind. Die Vorausschau
 * auf `:` schloß jedes `fetch:` aus, um **einen** Eintrag in `main.ts`
 * durchzulassen; damit war auch `const { fetch: f } = globalThis` blind. Und
 * die Gegenprobe deckte die Lücke nicht ab: Sie benutzte `fetch(` — genau die
 * Schreibweise, die ohnehin erkannt wurde.
 *
 * Derselbe Ausdruck stand bis T-188 ein zweites Mal in `proof-callers.mjs`
 * und war dort **noch** blind, mit null Gegenproben (A-A-40). Deshalb liegt
 * die Regel jetzt einmal und wird von beiden Läufen geholt.
 */

function checkSingleExit(files) {
  const findings = [];
  const callers = files.filter(
    (file) => file.path.startsWith('apps/local-api/src/') && mentionsGlobalFetch(file.code),
  );
  for (const file of callers) {
    if (file.path !== API_URL_FILE) findings.push(`${file.path}: nennt \`fetch\` außerhalb der einen Stelle`);
  }
  if (callers.length !== 1) {
    findings.push(`\`fetch\` steht in ${String(callers.length)} Dateien des Dienstes, erwartet ist genau eine`);
  }

  for (const file of files.filter((entry) => entry.path.startsWith('apps/local-api/src/routes/'))) {
    if (file.code.includes('createGithubReleaseSource') || file.code.includes('version/source.ts')) {
      findings.push(`${file.path}: eine Routendatei kennt die Abholfunktion`);
    }
  }
  return findings;
}

/**
 * Die Zusagen des einen Aufrufs, im Quelltext ablesbar (A-V-3, A-V-5, A-V-6).
 *
 * Was der Aufruf zur Laufzeit tut, mißt ein Prüfserver. Was hier gemessen wird,
 * ist, daß die Zusagen überhaupt im Code stehen — und daß die drei Abkürzungen
 * nicht da sind, die die Obergrenze aushebeln.
 */
const REQUIRED_IN_SOURCE = ["redirect: 'error'", 'AbortSignal.timeout', 'getReader()'];
const FORBIDDEN_IN_SOURCE = ['.json()', '.text()', '.arrayBuffer()', 'content-length'];

function checkFetchOptions(files) {
  const findings = [];
  const source = files.find((file) => file.path === API_URL_FILE);
  if (source === undefined) {
    findings.push(`${API_URL_FILE} fehlt`);
    return findings;
  }
  for (const marker of REQUIRED_IN_SOURCE) {
    if (!source.code.includes(marker)) findings.push(`${API_URL_FILE}: \`${marker}\` fehlt`);
  }
  for (const marker of FORBIDDEN_IN_SOURCE) {
    if (source.code.includes(marker)) findings.push(`${API_URL_FILE}: nennt \`${marker}\``);
  }
  return findings;
}

/**
 * Wo der gemerkte Zeitpunkt der letzten Anfrage überhaupt gelesen werden darf
 * (T-285, A-V-11, Migration 0022).
 *
 * Zwei Orte: die Deklaration der Frage und der eine Adapter, der sie
 * beantwortet. **Kein Betriebspfad steht darin** — und genau das ist die
 * Zusage.
 *
 * ---------------------------------------------------------------------------
 * Warum dieser Lauf das bewacht und nicht ein Prüffall allein
 * ---------------------------------------------------------------------------
 *
 * Weil der Fehler, gegen den er steht, **wie eine Verbesserung aussieht**. In
 * T-279 war er eine: Der Bezugspunkt des harten Bodens wanderte in den Bestand,
 * damit zwanzig Starts nicht zwanzig Anfragen ergeben (T-276: rund 344 je
 * Stunde). Der Preis stand erst im Prüffall TP-VER-11 — ein Neustart bewirkte
 * bis zu eine Stunde lang nichts, und weil der Zeitpunkt **vor** der Anfrage
 * geschrieben wird, setzte ihn auch ein fehlgeschlagener Versuch: Start ohne
 * Netz um 9:00, Neustart um 9:10, keine Prüfung bis 10:00.
 *
 * Der Auftraggeber hat entschieden: **Ein Programmstart prüft immer einmal.**
 * Der nächste, der den Wert liest, um Anfragen zu sparen, baut T-279 nach —
 * ohne den Prüffall je gesehen zu haben. Ein Prüffall im Add-in-Takt einer
 * einzigen Datei fängt das nicht; dieser Lauf sieht den ganzen Baum.
 *
 * ---------------------------------------------------------------------------
 * Der Preis, und er ist derselbe wie bei RELEASE_PREFIX_FILES
 * ---------------------------------------------------------------------------
 *
 * Gemessen wird das **Vorkommen des Namens**, nicht der Aufruf. Ein Umzug der
 * beiden Dateien oder eine Umbenennung der Frage macht diesen Lauf rot, ohne
 * daß ein Fehler vorläge. Das ist bezahlt und gewollt: Der Lauf verlangt, daß
 * jemand die Bewegung bemerkt und hier bestätigt. Ein Wächter, der sich seine
 * erlaubte Menge selbst nachzieht, bewacht nichts (E-103 gegengelesen).
 */
const LAST_CHECK_READER_FILES = new Set([
  'packages/storage/src/ports.ts',
  'packages/storage/src/sqlite/repo-version-check.ts',
]);

/**
 * Wo der **Spaltenname** stehen darf (T-288, A-V-27).
 *
 * ---------------------------------------------------------------------------
 * Warum es diese zweite, gröbere Menge überhaupt gibt
 * ---------------------------------------------------------------------------
 *
 * Weil die Menge darüber die **Gestalt** von T-279 bewacht und nicht die Regel
 * aus E-106. `LAST_CHECK_READER_FILES` fängt einen Leser, der `lastCheckAt`
 * heißt — also einen, der durch den Port geht. Der security-checker hat in
 * T-287 (Messung 3) daneben vorbeigegriffen, und es kostete ihn eine Zeile:
 *
 *     conn.prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1').get()
 *
 * Eine Datei mit diesem Inhalt in `apps/local-api/src/features/version/`, und
 * dieser Lauf blieb **grün (35/0)**. Der Port ist umgangen, der Rückweg ist
 * offen, der Wächter sagt nichts.
 *
 * ---------------------------------------------------------------------------
 * Warum das mehr ist als Ordnungsliebe
 * ---------------------------------------------------------------------------
 *
 * Das Datenarchiv (A-20.4) ist **fremder Text** und ersetzt `app_setting`
 * vollständig. Gäbe es wieder einen Leser, machte ein präpariertes Archiv aus
 * einem hohen `last_version_check_at` einen **stillen Ausschalter** der
 * Versionsprüfung — und „still" ist hier kein Bild, sondern A-18.11: kein
 * Hinweis, keine Fehlerfläche, der Grund nur im Protokoll. Bei unsignierten
 * Erzeugnissen ist die Aktualisierungsmeldung der einzige Weg, auf dem eine
 * Sicherheitsbehebung den Benutzer überhaupt erreicht.
 *
 * ---------------------------------------------------------------------------
 * Die vier Dateien, und warum genau diese
 * ---------------------------------------------------------------------------
 *
 *  - der Adapter, der die Spalte schreibt (und für die Naht `recordCheck` auch
 *    liest — der einzige erlaubte Leseort überhaupt),
 *  - der Archivadapter, der sie als **Zeile des Archivs** führt (A-20.4),
 *  - die eingebetteten Migrationen, die den Text von 0022 tragen,
 *  - die Archivübersetzung, die ein älteres Archiv um das fehlende Feld ergänzt.
 *
 * Gemessen wird über `stripComments`: **Kommentare zählen nicht.** Vier weitere
 * Dateien nennen den Namen heute in Prosa (`composition.ts`, `version.ts`,
 * `main.ts`, `repo-data-archive.ts` im Kopf) — das ist erwünscht und bleibt
 * erlaubt, weil ein erklärter Name kein Zugriff ist.
 */
const LAST_CHECK_COLUMN = 'last_version_check_at';

const LAST_CHECK_COLUMN_FILES = new Set([
  'packages/storage/src/sqlite/repo-version-check.ts',
  'packages/storage/src/sqlite/repo-data-archive.ts',
  'packages/storage/src/sqlite/migrations.embedded.ts',
  'apps/local-api/src/features/data-transfer/data-transfer.ts',
]);

/** Wo der Prüfer steht, dessen Speicherport gemessen wird. */
const VERSION_CHECKER_FILE = 'apps/local-api/src/features/version/version.ts';

/**
 * Der Ordner des Prüfers. Was darin liegt, faßt keine Datenbank unmittelbar an
 * (Gestalt 4) und leiht sich auch keine (Gestalt 5).
 */
const VERSION_FEATURE_PREFIX = 'apps/local-api/src/features/version/';

/**
 * Womit man eine Datenbank **unmittelbar** anfaßt. Bewußt grob und bewußt kurz.
 *
 * Diese Liste steht nicht gegen einen bestimmten Spaltennamen, sondern gegen den
 * Griff selbst. Wer im Ordner des Prüfers `SELECT * FROM app_setting` schreibt,
 * hat die Spalte nicht genannt und den Rückweg trotzdem gebaut.
 *
 * Was sie **nicht** mißt, steht eine Gestalt weiter: den **geliehenen** Zugriff
 * über einen zweiten Port. Der trägt keine dieser fünf Marken und kostet eine
 * Zeile `import` — gemessen in T-289 (V1b: `DataArchivePort.readAll()`,
 * Schlüssel zusammengesetzt, der Wert entscheidet über die ausgehende Anfrage;
 * der Lauf blieb dabei bei 37/0 grün). Dagegen steht `VERSION_FEATURE_IMPORTS`.
 */
const DATABASE_MARKERS = ['prepare(', 'SELECT ', 'FROM app_setting', 'better-sqlite3', 'UnitOfWork'];

/**
 * Woher der Ordner des Prüfers importieren darf (A-V-28, Befund T-289-1).
 *
 * ---------------------------------------------------------------------------
 * Warum eine Importliste und nicht ein sechster Name
 * ---------------------------------------------------------------------------
 *
 * Die zu schützende Wirkung heißt: **Die Entscheidung, ob eine Anfrage
 * hinausgeht, hängt an keinem Wert aus dem Bestand** (E-106). Die fünf Marken
 * oben messen den *unmittelbaren* Griff. Der security-checker ist in T-289
 * dreimal daneben vorbeigekommen, am deutlichsten mit V1b — einer Datei
 * **innerhalb** dieses Ordners, die über `DataArchivePort.readAll()` an
 * `app_setting` kommt, den Schlüssel aus vier Stücken zusammensetzt und über
 * `jetzt − Date.parse(wert) >= bodenMs` entscheidet, ob eine Anfrage hinausgeht.
 * Kein `lastCheckAt`, kein Spaltenname, keine der fünf Marken:
 * `proof:release-safety` 37/0, `proof:layers` 36/0, `proof:callers` 74/0, alle
 * grün. Der Unterschied zwischen der geschriebenen Zusage und der gemessenen
 * war genau eine Zeile `import`.
 *
 * Deshalb wird hier die **Menge der Importquellen** festgenagelt und nicht ein
 * weiterer Name verboten. Ein zweiter Port muß sichtbar in diese Liste
 * eingetragen werden, und wer ihn einträgt, schreibt einen Satz daneben.
 *
 * ---------------------------------------------------------------------------
 * Beide Richtungen, dieselbe Lehre wie bei den Spaltendateien (T-249-1)
 * ---------------------------------------------------------------------------
 *
 * Eine Quelle, die hier steht und im Ordner nicht mehr vorkommt, ist ein
 * **Befund** und kein Schweigen: Sonst bliebe eine Erlaubnisliste stehen, die
 * ins Leere zeigt, und der nächste Eintrag käme unbemerkt dazu.
 *
 * Stand am 2026-09-11, an der Platte gemessen: **drei** Dateien im Ordner mit
 * **acht** Importzeilen aus **sieben** Quellen; `@takt/storage` kommt in keiner
 * vor. (Das Bedrohungsmodell nennt in A-V-28 sieben Zeilen aus sechs Quellen
 * und vier Dateien — die Aufzählung dort ist vollständig, die drei Zahlen sind
 * es nicht; nachgezählt in T-290.)
 */
const VERSION_FEATURE_IMPORTS = new Set([
  '@takt/domain',
  'hono',
  '../../http/guards.ts',
  '../../http/problem.ts',
  '../../logger.ts',
  './source.ts',
  './version.ts',
]);

/**
 * Die Importquellen einer Datei, absichtlich **weit** gefaßt.
 *
 * Gemessen wird gegen eine Erlaubnisliste; die sichere Richtung ist deshalb zu
 * viel und nicht zu wenig. Erfaßt werden `… from '…'` (auch über mehrere
 * Zeilen, weil nur die Stelle mit dem `from` gelesen wird), `import '…'`,
 * `import('…')` und `require('…')`. Der Aufrufer reicht **entkommentierten**
 * Code herein: Ein Import in einem Beispiel im Kommentar ist keiner.
 */
function importQuellen(code) {
  const quellen = new Set();
  for (const treffer of code.matchAll(/\bfrom\s*['"]([^'"\n]+)['"]/g)) quellen.add(treffer[1]);
  for (const treffer of code.matchAll(/\b(?:import|require)\s*\(?\s*['"]([^'"\n]+)['"]/g)) {
    quellen.add(treffer[1]);
  }
  return quellen;
}

/**
 * Der Name eines Schnittstellenmitglieds — oder die **Art** des Mitglieds.
 *
 * Ein Mitglied ohne einfachen Namen ist kein Grund zu schweigen: Eine
 * Indexsignatur (`[schluessel: string]: unknown`), eine Rufsignatur oder ein
 * berechneter Name sind allesamt Türen, durch die etwas Gelesenes zurückkäme.
 * Sie bekommen deshalb die Art als Namen und gelten damit als **fremd** — die
 * sichere Richtung, wenn der Leser etwas sieht, das er nicht benennen kann.
 */
function mitgliedsname(member) {
  const name = member.name;
  if (name !== undefined) {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
      return name.text;
    }
    if (ts.isComputedPropertyName(name)) return '<berechneter Name>';
  }
  return `<${ts.SyntaxKind[member.kind]}>`;
}

/**
 * Die Mitglieder einer Schnittstelle — **vom Compiler gelesen**, nicht geraten.
 *
 * Der dritte Anlauf an derselben Stelle, und diesmal ohne regulären Ausdruck.
 * Was die drei vorherigen Fassungen je übersahen, ist einzeln gemessen und
 * steht als Gegenprobe in `COUNTER_PROOFS.rueckweg`:
 *
 *   - `\{([^}]*)\}` (bis T-290): Abbruch am ersten `}`, also bei jedem
 *     Inline-Objekttyp in einer Signatur — Befund T-289.
 *   - gezählte Klammern (T-290): Abbruch am `}` **in einer Zeichenkette**, also
 *     bei `write(at: Date, mode: '}' | 'x')` — Befund T-291 zu Zeile 816.
 *   - `/(\w+)\s*\(/` als Mitgliederregel (bis T-292): sieht **nur**
 *     Methodensyntax. `readonly read: () => Promise<string | null>;` — die
 *     Schreibweise, in der `VersionCheckerOptions` in derselben Datei steht —
 *     war unsichtbar, und der ganze Prüfsatz lief 43/0 grün. Befund T-291 zu
 *     Zeile 1030.
 *
 * Der Compiler kennt Zeichenketten, Kommentare, Zeilenumbrüche, optionale und
 * `readonly`-Mitglieder von sich aus. Er ist hier kein schwereres Werkzeug,
 * sondern das einzige, das die Frage überhaupt beantworten kann.
 *
 * Gelesen wird der **ungekürzte** Quelltext und nicht `stripComments`: Der
 * Compiler wirft Kommentare selbst weg, und zwar richtig — eine auskommentierte
 * `read`-Zeile im Rumpf ist damit kein Befund, während ein `read` in einer
 * Zeichenkette daneben auch keiner wird.
 *
 * Angenommen werden `interface X { … }` **und** `type X = { … }`: Wer die
 * Schnittstelle in einen Alias umschreibt, soll denselben Wächter treffen und
 * nicht einen Meßfehlschlag. Ein Alias auf etwas anderes als ein Typliteral
 * (`Omit<…>`, eine Vereinigung) ist dagegen ein **Fehlschlag der Messung** — der
 * Leser kennt ihn nicht —, den der Aufrufer als Befund meldet und nicht als
 * leeren Fund. Dasselbe, wenn der Name gar nicht steht.
 *
 * ---------------------------------------------------------------------------
 * Zwei Wege an diesem Leser vorbei, die nicht die Schreibweise betrafen (T-294)
 * ---------------------------------------------------------------------------
 *
 * Mit T-292 ist die ganze Klasse der **Schreibweisen** geschlossen. Daneben lag
 * eine zweite Klasse — die **Auflösung** —, und der code-reviewer hat sie in
 * T-293 an zwei gebauten Ständen gemessen. Beide machten alle fünf Gestalten
 * grün, während der Rückweg gebaut dastand:
 *
 *  - **`extends`.** `interface VersionCheckStorePort extends VersionCheckReadPort`
 *    mit dem `read()` in der Basis — einmal mit einer Basis in derselben Datei,
 *    einmal mit einer aus `@takt/domain`, also aus einer der sieben **erlaubten**
 *    Importquellen, und mit `port.read()` daneben gerufen. `statement.members`
 *    trägt geerbte Mitglieder nicht. Einen Port in eine Lese- und eine
 *    Schreibhälfte zu zerlegen ist der naheliegendste aller Umbauten.
 *  - **Deklarationszusammenführung.** Zwei `interface` gleichen Namens sind
 *    gültiges TypeScript; die Schleife gab beim **ersten** Treffer zurück und
 *    sah das `read` im zweiten nicht.
 *
 * Was hier dagegen steht, ist **kein Auflösen**, sondern ein Zugeben: Der Leser
 * folgt der Basis nicht und führt nichts zusammen, er sagt, daß er nichts mehr
 * weiß. Dieselbe Regel, die diese Funktion bei berechneten Namen und bei nicht
 * aufgelösten Aliassen schon anwendet — und die sichere Richtung, weil ein
 * klügerer Leser die nächste Auflösungslücke gleich mitbrächte: die Basis einer
 * Basis, ein `extends` aus einem Paket, ein Mapped Type darüber.
 *
 * Der Rückgabewert ist deshalb seit T-294 kein `null` mehr, sondern **der
 * Grund**: `{ mitglieder }` oder `{ fehlschlag }`. Vier Meßfehlschläge, vier
 * Sätze, vier Gegenproben. Ein `null` für alle vier hätte vier Zweige hinter
 * einem Satz versteckt — genau die Bauart, gegen die dieser Lauf geschrieben
 * ist.
 */
function portMitglieder(quelltext, name, dateiname = 'port.ts') {
  const datei = ts.createSourceFile(dateiname, quelltext, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const deklarationen = datei.statements.filter(
    (statement) =>
      (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
      statement.name.text === name,
  );
  if (deklarationen.length === 0) {
    return {
      fehlschlag: `${name} steht nicht (mehr) als Schnittstelle oder Typliteral darin — der Leser hat nichts gemessen`,
    };
  }
  if (deklarationen.length > 1) {
    return {
      fehlschlag: `${name} ist ${String(deklarationen.length)}-mal deklariert — TypeScript führt das zusammen, dieser Leser tut es nicht und hat damit nichts gemessen (T-294)`,
    };
  }
  const [deklaration] = deklarationen;
  if (ts.isInterfaceDeclaration(deklaration)) {
    if (deklaration.heritageClauses !== undefined && deklaration.heritageClauses.length > 0) {
      return {
        fehlschlag: `${name} erbt über \`extends\` — die geerbte Hälfte steht nicht in dieser Deklaration, und der Leser folgt der Basis nicht (T-294)`,
      };
    }
    return { mitglieder: deklaration.members.map(mitgliedsname) };
  }
  if (!ts.isTypeLiteralNode(deklaration.type)) {
    return {
      fehlschlag: `${name} ist ein Alias auf ${ts.SyntaxKind[deklaration.type.kind]} und nicht auf ein Typliteral — der Leser löst ihn nicht auf`,
    };
  }
  return { mitglieder: deklaration.type.members.map(mitgliedsname) };
}

/**
 * Der Rückweg: gibt es einen Leser, und hat der Port der Versionsprüfung einen?
 *
 * **Sechs Gestalten** inzwischen, und jede fängt eine andere Gestalt desselben
 * Fehlers — vom Port nach außen, immer eine Umgehung weiter:
 *
 *   1. `lastCheckAt` außerhalb von Deklaration und Adapter — der Leser, der
 *      durch den Port geht, wo immer er entsteht.
 *   2. `read` am `VersionCheckStorePort` — die Gestalt, die in T-279 wirklich
 *      gebaut wurde, verdrahtet gegen einen Adapter, der auch anders heißen
 *      könnte. Sie wird seit T-292 vom **Compiler** gelesen (`portMitglieder`),
 *      weil dreimal hintereinander eine andere Schreibweise desselben `read`
 *      durchging; die Begründung steht dort.
 *   3. Der **Spaltenname** außerhalb der vier tragenden Dateien — der Zugriff,
 *      der den Port umgeht (T-288, A-V-27).
 *   4. **Irgendein** unmittelbarer Datenbankgriff im Ordner des Prüfers — der
 *      Zugriff, der auch den Namen umgeht.
 *   5. Die **Importmenge** des Ordners — der Zugriff, der sich einen zweiten
 *      Port borgt und deshalb weder Namen noch Marke trägt (T-290, A-V-28).
 *   6. Die **Entscheidungsfläche** — der Wert, der gar nicht in den Prüfer
 *      hineingeht, sondern von außen bestimmt, ob und wann er fragt. Er trägt
 *      keinen der fünf Namen, liegt außerhalb des Ordners und ist am
 *      2026-09-12 gemessen worden: `startDelayMs`/`intervalMs` aus
 *      `app_setting.locale`, gesetzt in `composition.ts`, alle fünf Gestalten
 *      grün (T-325 B-2, R-30, A-A-105). Sie hieß bis T-335 „die Verdrahtung"
 *      und war damit an dem aufgespannt, was der Schreiber kannte; drei
 *      Ausschalter derselben Wirkung kamen deshalb durch (T-331 Z-1, T-332 K-1
 *      und K-2, alle 106/0 grün). Seit T-335 ist sie an der **Anforderung**
 *      aufgespannt — „wer kann über die ausgehende Anfrage entscheiden" — und
 *      hat dafür sieben Sätze statt vier. Die Begründung steht bei
 *      {@link DECISION_MODULES}.
 *
 * Die Gestalten 3 bis 6 messen **beide Richtungen**: Eine erlaubte Datei, die
 * verschwindet, eine erlaubte Importquelle, die nicht mehr vorkommt, und ein
 * festgenagelter Schlüssel, den die Verdrahtung nicht mehr setzt, sind Befunde.
 * Ein Wächter, der seine eigene Menge nicht mehr findet, bewacht nichts
 * (T-249-1).
 *
 * ---------------------------------------------------------------------------
 * Was dieser Wächter NICHT fängt — und der Absatz gehört hierher (A-A-55)
 * ---------------------------------------------------------------------------
 *
 * Bis T-290 stand hier „gefangen sind **Irrtum und Bequemlichkeit**". Der Satz
 * trug nur, solange der Leser `lastCheckAt` hieß: V1b (T-289) ist der Form nach
 * Bequemlichkeit — ein Port, den es gibt, richtig benutzt — und ging trotzdem
 * durch, bis Gestalt 5 stand. Was gefangen ist, läßt sich deshalb nur an den
 * fünf Gestalten aufzählen und nicht an einer Haltung: der Leser durch den Port,
 * die Gestalt des Ports, der Spaltenname, der unmittelbare Griff im Ordner und
 * die Menge der Türen, die der Ordner überhaupt aufmacht.
 *
 * Nicht gefangen ist, und zwar nachweislich:
 *
 *  - ein zusammengesetzter Name, ein Bezeichner aus einer Variablen, ein
 *    `SELECT *` mit berechnetem Schlüssel **außerhalb** des Ordners des
 *    Prüfers — T-289 hat es zweimal gemessen (V2b: ein Helfer in
 *    `features/settings`, der Aufrufer im Ordner ohne jede Marke; V11:
 *    `SELECT *` in einer flachen Datei des Dienstes, Positionszugriff, Saatwert
 *    in den Prüfer). Beide brauchen **zwei** Dateien und eine neue Kante
 *    zwischen zwei Merkmalen;
 *  - ein Leser **innerhalb** einer der vier erlaubten Dateien — dort ist der
 *    Name frei, und der Archivadapter liest die Spalte ohnehin;
 *  - ein **erlaubter Nachbar**, der selbst einen Bestandszugriff bekommt.
 *    Gestalt 5 mißt die **Menge** der Quellen, nicht deren Inhalt:
 *    `../../http/guards.ts`, `../../http/problem.ts`, `../../logger.ts` und
 *    `@takt/domain` stehen in der Liste und werden nicht weiterverfolgt. Heute
 *    trägt keiner von ihnen eine der fünf Marken (T-290 nachgemessen), morgen
 *    ist das eine Zeile in einer fremden Datei;
 *  - alles außerhalb des gelesenen Baums, und das ist seit T-327 **weniger**,
 *    als es war. Gelesen werden die acht `src`-Wurzeln aus `SOURCE_ROOTS`, die
 *    zehn Einzeldateien aus `EXTRA_FILES` und die **sieben
 *    Übersetzungsprogramme aller Pakete** ({@link uebersetzungsprogramm}) —
 *    bis T-327 war es nur das des Dienstes, und für vier von fünf Oberflächen
 *    bestimmte damit weiter eine Verzeichnisliste den Baum (Befund T-324).
 *    Damit sind drei Dateien neu darin, die gemessen ungelesen waren:
 *    `apps/web/vite.config.ts`, `apps/outlook-addin/vite.config.ts` und
 *    `apps/desktop/sidecar/entry.ts` — die letzte ist der Einstiegspunkt der
 *    ausgelieferten Sidecar-Binärdatei und stand in keinem Bericht.
 *    **Draußen** liegen weiterhin: jeder `scripts/`-Baum (auch dieser Lauf
 *    selbst), `packages/ui-tokens/**`, `apps/web/public/**` (dort liegt mit
 *    `startup-appearance.js` ausgelieferter Laufzeitcode),
 *    `packages/storage/migrations/**` — die `.sql`-Dateien ganz, eine
 *    `helper.ts` neben ihnen nur dann, wenn der Dienst sie **importiert** —,
 *    `dist/`, und die sieben Prüfordner neben den `src`-Wurzeln samt ihren
 *    **Prüfprogrammen** (`tsconfig.test.json`). Das letzte ist seit T-327 mit
 *    einem Grund versehen und nicht mit einem Ort: Eine
 *    Deklarationszusammenführung wirkt nur innerhalb **eines** Programms, und
 *    ein Prüfprogramm ist nicht das Programm des Erzeugnisses;
 *  - **`node_modules/**`, einschließlich `@types/**`.** Eine
 *    Deklarationserweiterung von dort wirkt im selben Programm und würde hier
 *    nicht gefangen. Sie ist ausgelassen, weil jede zweite `.d.ts` eines
 *    Fremdpakets ein `declare module` trägt und Zusage 1 daran restlos
 *    unterginge; die Abwehr dagegen sind die Sperrdatei und `pnpm audit`. Der
 *    Eintrag stand bis T-320 in dieser Liste nicht und gehört hierher, weil er
 *    die einzige verbliebene Lücke **innerhalb** des Übersetzungsprogramms ist;
 *  - `src/**\/test/**` stand hier bis T-320 **nicht** und war die Lücke, an der
 *    dieser Lauf zum fünften Mal unterlegen ist (T-318 B-1). Sie ist zu — der
 *    Baum liest diese Dateien jetzt, und zwei Prüfsätze in Abschnitt 0 halten
 *    das fest;
 *  - ein Zugriff über einen **anderen Prozeß** auf dieselbe Datei. Das war nie
 *    Sache dieses Laufs und ist VG-3.
 *
 * ---------------------------------------------------------------------------
 * Die Lückenliste ist seit T-342 an der **Anforderung** aufgespannt
 * ---------------------------------------------------------------------------
 *
 * Die neun Punkte oben sind an den **Gestalten** aufgespannt — an dem, was
 * gemessen wird. Das genügt nicht, und der Beweis dafür sind drei Ausschalter
 * vom 2026-09-13, die alle drei mit `tsc` Exit 0 durchliefen, alle drei den Lauf
 * bei **130/0** ließen und von denen **keiner** in dieser Liste stand:
 *
 *  - **T-337 K-7** — vier Zeilen im Rumpf des `write`-Literals. 0 statt 1
 *    ausgehende Anfrage.
 *  - **T-336 Z-2** — `process.env` als erste Anweisung von `latest()`.
 *  - **T-336 Z-3** — dasselbe zwischen `remember` und `source.latest`.
 *
 * Die Ursache war **eine**, und sie ist dieselbe wie bei 6a vor T-335: Die
 * Liste zählte auf, was der Schreiber an den gebauten Gestalten vorbeikommen
 * sah, statt zu fragen, **wo die Anforderung Stellen hat**. Die Anforderung
 * lautet: „Die Entscheidung, ob eine Anfrage hinausgeht **und ob ihre Antwort
 * ankommt**, hängt an keinem Wert, der von außerhalb des Prozesses gesetzt
 * werden kann" (E-106, A-18, und die Zusage, die der Port zwei Zeilen über sich
 * selbst führt).
 *
 * An dieser Anforderung aufgespannt hat der Weg **fünf** Arten von Stellen, und
 * die Liste unten ist nach ihnen geordnet statt nach Gestalten. **Die Einteilung
 * trennt Stellen; gemessen werden aber Eigenschaften von Stellen** (T-347), und
 * deshalb steht an jeder Art dabei, **welche Eigenschaft** gemeint ist —
 * dieselbe Stelle kann für die eine Eigenschaft gelesen und für jede andere nur
 * durchlaufen sein. Der Rumpf von `latest()` ist das Beispiel: für seine
 * Einfuhren, seine freien Namen und seine gerechneten Zugriffe gelesen, für
 * alles übrige nicht.
 *
 *   (I)   **Stellen, die gelesen werden — und woraufhin.** Der Rumpf des
 *         Adaptermitglieds (6g-2), der Rumpf des Portliterals (6h), der
 *         Ausdruck der Auskunft (6j): **zeichengleich**, also auf jede
 *         Eigenschaft. Die beiden Entscheidungsmodule: auf ihre **Einfuhren**
 *         (Gestalt 5), ihre **freien Namen** (6i) und ihre **gerechneten
 *         Zugriffe** (6i-2) — und auf nichts sonst.
 *   (II)  **Stellen, die gezählt oder eingegrenzt werden.** Die Schlüssel des
 *         Aufrufobjekts (6b), der Start (6c), die Türen (6e/6f), die
 *         Warteliste im Rumpf der Anfrage (6g-1), die Einfuhrlisten (6a), die
 *         Datenbankmarken (6d, Gestalt 4), der Spaltenname (Gestalt 3), die
 *         Portgestalt (Gestalt 2), der Leser durch den Port (Gestalt 1).
 *   (III) **Stellen, die nur durchlaufen werden** — der Weg wird gegangen und
 *         nicht gelesen. **Hier sitzt die Klasse**, und hier saßen alle drei
 *         Ausschalter vom 2026-09-13. Was heute noch dazugehört, steht unten.
 *   (IV)  **Stellen außerhalb des gelesenen Baums.** Sie stehen in den neun
 *         Punkten oben und sind unverändert.
 *   (V)   **Stellen hinter einer festgenagelten Einfuhr** (T-347 K-9,
 *         A-A-118). Festgenagelt ist der **Name**, nicht das Verhalten
 *         dahinter. `checkVersion` und `versionCheckDelayWithJitter` kommen aus
 *         `@takt/domain`; der Pfad `packages/domain` kommt in diesem Lauf
 *         **kein einziges Mal** vor. Gemessen: Eine `checkVersion`, die jede
 *         Fassung abweist, und ein `versionCheckDelayWithJitter`, das
 *         mindestens 2³¹−1 ms zurückgibt, lassen `tsc` bei Exit 0 und diesen
 *         Lauf bei 145/0 — die Meldung käme nie an beziehungsweise nie wieder
 *         eine Anfrage hinaus.
 *
 * **Art (V) ist mit T-349 ausdrücklich benannt und nicht geschlossen**, und der
 * Grund ist eine Arbeitsteilung und keine Bequemlichkeit: Beide Gestalten
 * fangen die Einheitenprüfungen, mit **31** beziehungsweise **17** roten Fällen
 * (`packages/domain/test/version.test.ts`). Ein Zeichenvergleich über die
 * Rümpfe eines fremden Pakets wäre das falsche Werkzeug — er nagelte eine
 * Schreibweise fest, wo eine Prüfung das Verhalten mißt, und er bräche bei
 * jeder Umformulierung, ohne je eine Absicht zu fangen. Wer die Art schließen
 * will, schließt sie dort, wo sie gemessen wird: an den Einheitenprüfungen und
 * an ihrer Abdeckung.
 *
 * **Was heute zu (III) gehört** — gemessen, nicht vermutet:
 *
 *  - **Der Rumpf von `current()` selbst**, und mit ihm alles, was in
 *    `version.ts` **nach** der Anfrage geschieht. 6i liest, welche Namen das
 *    Modul aus der Laufzeit nimmt, und Gestalt 5, welche es einführt — aber
 *    **nicht**, was es mit seinen eigenen Werten tut. Ein Zustand, der im
 *    Prüfmodul selbst verworfen wird, ist von 6j nicht erreichbar: 6j mißt den
 *    **Ausdruck**, in dem `current()` gerufen wird, nicht seinen Rumpf.
 *  - **Der Weg von `versionState` bis zum Bildschirm.** 6j endet am Rand des
 *    Zusammenbaus. Die Route, die die Auskunft liest, die Antwortgestalt, der
 *    Abruf in der Oberfläche und der Dialog darüber sind von **keinem** Satz
 *    dieses Laufs erfaßt — und für das Schutzziel von A-18 („der Benutzer
 *    erfährt davon") zählt der ganze Weg. Das ist die ehrliche Antwort auf die
 *    Frage nach T-337 K-4: Dieser Lauf kann die **Stelle** messen, an der die
 *    Auskunft den Zusammenbau verläßt, und er tut es seit 6j. Die **Klasse**
 *    „die Meldung kommt nicht an" kann er nicht messen; dazu gehört ein
 *    zweiter Lauf, der den Weg bis zum Bildschirm mißt, oder ein Prüffall am
 *    Verhalten.
 *  - **Ein Name, den ein Modul selbst verdeckt.** 6i kennt keinen
 *    Gültigkeitsbereich: `const process = holen();` bindet den Namen und nimmt
 *    ihn damit aus der Messung. Was das eng hält, ist Gestalt 5 — `holen()`
 *    müßte aus einer der festgenagelten Quellen kommen.
 *  - **Die Rümpfe der übrigen Werte im Aufrufobjekt.** 6h liest die Rümpfe
 *    der **Portliterale**. `logger`, `now` und `source` kommen als Bezeichner
 *    herein (6b nagelt die Wertform fest), und wo ihr Wert entsteht, liest
 *    dieser Leser nicht — für `source` schließt das 6e/6f, für `now` und
 *    `logger` steht es unter „offen, und zwar benannt" bei
 *    {@link DECISION_MODULES}.
 *  - **Der Prüfer, der nicht gerufen, sondern umhüllt wird.** 6j mißt jeden
 *    **Aufruf** an seinem Bezeichner. Eine bloße Erwähnung — der Prüfer in ein
 *    zweites Objekt gespreizt und mit einem eigenen `current` versehen — trägt
 *    keinen Aufruf und wird von 6j nicht gesehen. Was das eng hält, ist 6c: Wer
 *    den Prüfer ersetzt, muß `start()` weiterhin genau einmal und unbedingt am
 *    festgenagelten Feld rufen.
 *  - **Der Rumpf einer Funktion aus einem anderen Paket.** Das ist Art (V), und
 *    sie steht oben mit ihren Zahlen. Sie gehört auch hierher: Der Weg geht
 *    durch sie hindurch, und dieser Lauf liest sie nicht.
 *  - **Ein fünfter Weg an den vier gemessenen Türen vorbei.** Gemessen sind
 *    Einfuhr, freier Name, Parameter und gerechneter Zugriff (6i, 6i-2). Daß es
 *    keinen weiteren gibt, ist **nicht** gemessen — zweimal behauptet, zweimal
 *    widerlegt (T-346, T-347 K-10c). Die Begründung steht bei
 *    {@link MODUL_LAUFZEITNAMEN}.
 *  - **Was ein Rumpf tut, nachdem die Anfrage ausging.** 6g-1 mißt seit T-349
 *    den **ganzen** Rumpf auf `await` — also darauf, daß dort nichts stillsteht.
 *    Es mißt nicht, was dort **gerechnet** wird; ein verworfenes Ergebnis bleibt
 *    Art (III), und dagegen hilft TP-VER-10 und nicht dieser Lauf.
 *  - **Ein fremder Aufruf, der synchron nicht zurückkehrt** (A-A-125, T-357
 *    R-4). Die Achse von 6g-1 war bis T-360 ausschließlich das `await`, und ein
 *    Riegel braucht keines: Ein Tag Leerlauf in `run()` war `tsc` Exit 0 und
 *    **154/0 grün**; dieselbe Schleife in `remember`, 150 ms statt einem Tag,
 *    drückt die ausgehenden Anfragen am Modul von **40 auf 3** und läßt das
 *    Protokoll **leer**. Seit T-360 mißt 6g-1 die **Schleife** — auf dem Weg und
 *    in allem, was von ihm aus synchron erreichbar ist (beide Gestalten sind
 *    damit rot). **Die Klasse ist damit nicht geschlossen**, und das ist der
 *    Punkt dieses Eintrags: Ein synchron blockierender Aufruf hat in diesem
 *    Modul keine Schleife, sondern einen **Namen**. Drei Namen auf diesem Weg
 *    kommen von außen — `now`, `logger` und der Rumpf eines fremden Pakets
 *    (Art (V)); für `store.write` nagelt 6g-2 die Anweisungen des einen
 *    Adapters zeichengleich fest, für die übrigen liest dieser Lauf nichts. Ein
 *    `conn.prepare(…).run(…)`, das auf eine Sperre wartet, ist von einem, das
 *    schreibt, in keinem Quelltext zu unterscheiden. Wer die Klasse schließen
 *    will, schließt sie an der Bauart — eine ausgehende Anfrage, die nicht
 *    hinter einem synchronen Rumpf hängt —, nicht an einer Liste von
 *    Schreibweisen.
 *  - **Das Verhalten.** Unverändert und unten ausgeführt.
 *
 * Wer eine dieser Lücken schließen will, schließt sie nicht durch einen
 * sechsten Namen. Er schließt sie durch einen Prüffall am Verhalten: **ein
 * Programmstart fragt immer einmal**, gemessen an zwei nacheinander gebauten
 * Prüfern (T-287 Messung 2, TP-VER-11). Auch der trägt nur so weit, wie die
 * Nähte verdrahtet sind — eine neue **optionale** Option an
 * `createVersionChecker` bliebe dort ungesetzt und grün (T-289, 38.4).
 *
 * **Genau diese optionale Option ist seit T-327 gemessen**, und zwar nicht am
 * Verhalten, sondern an der Verdrahtung: Gestalt 6 nagelt die Schlüssel des
 * Aufrufobjekts fest, und `startDelayMs` ist keiner davon. Der Satz oben bleibt
 * trotzdem stehen — er sagt, was ein Prüffall **nicht** kann, und das ist
 * unverändert wahr.
 */
function checkNoStoreReadback(files) {
  const ordner = files.filter((file) => file.path.startsWith(VERSION_FEATURE_PREFIX));
  const findings = [...findeLeserUeberDenPort(files), ...findeSpaltennameAmPortVorbei(files)];

  if (ordner.length === 0) {
    /*
     * Die Untergrenze der Gestalten 4 und 5, und dieselbe Regel wie bei den
     * Quellordnern: Ein nicht gelesener Ordner macht jede Aussage über ihn wahr.
     * Bis T-290 fehlte sie hier; daß ein Umzug des Ordners trotzdem rot wurde,
     * hing daran, daß zwei Dateien darin anderswo festgenagelt sind — also am
     * Zufall (Befund T-289 zu Zeile 810). Die beiden Gestalten laufen in diesem
     * Fall **nicht**: Sonst stünden hier sieben „Importquelle fehlt" statt der
     * einen Nachricht, die stimmt.
     */
    findings.push(
      `${VERSION_FEATURE_PREFIX}: der Ordner des Prüfers liegt nicht im gelesenen Baum — die Gestalten 4 und 5 messen nichts und wären über einem leeren Ordner grün (T-290)`,
    );
  } else {
    findings.push(
      ...findeDatenbankgriffImPrueferordner(ordner),
      ...findeFremdeImporteImPrueferordner(ordner),
    );
  }

  findings.push(...pruefeGestaltDesPorts(files));

  /*
   * Gestalt 6 — die **Entscheidungsfläche** (A-A-105, R-30). Sie steht hinter
   * den fünf anderen und nicht dazwischen: Die fünf messen den Weg vom Bestand
   * in den Prüfer, die sechste den Weg vom Bestand an die **Entscheidung**, ob
   * überhaupt gefragt wird — und seit T-342 bis dorthin, wo die Antwort den
   * Zusammenbau verläßt. Die Begründung steht bei {@link DECISION_MODULES}.
   *
   * Elf Sätze: 6a bis 6d seit T-327, 6e bis 6g seit T-335 (die **Tür**, durch
   * die ein Port hereinkommt, die **Warteliste** im Rumpf der Anfrage, der
   * Adapter dahinter), 6h bis 6j seit T-342, 6i-2 seit T-349. Die drei von
   * T-342 sind keine drei Namen, sondern die drei **Stellen**, die sieben Sätze
   * lang gegangen und nicht gelesen wurden: der Rumpf des Portliterals (6h),
   * der Rumpf der Entscheidungsmodule (6i) und der Ausdruck der Auskunft (6j).
   * 6i-2 ist die vierte Art, an etwas heranzukommen — der **gerechnete**
   * Zugriff (A-A-117).
   */
  findings.push(
    ...findeVerbraucherDerEntscheidungsmodule(files),
    ...pruefeAufrufobjekt(files),
    ...pruefeStartDesPruefers(files),
    ...findeDatenbankgriffInDerVerdrahtung(files),
    ...pruefeTuerenDesPorts(files),
    ...pruefeWartenImRumpfDerAnfrage(files),
    ...pruefeAdapterHinterDemPort(files),
    ...pruefeRumpfDerPortliterale(files),
    ...pruefeLaufzeitnamenDerEntscheidungsmodule(files),
    ...pruefeGerechneteZugriffeDerEntscheidungsmodule(files),
    ...pruefeAuskunftDerVerdrahtung(files),
  );
  return findings;
}

/** Gestalt 1: der Leser, der durch den Port geht — wo immer er entsteht (T-285). */
function findeLeserUeberDenPort(files) {
  const findings = [];
  for (const file of files) {
    if (!file.code.includes('lastCheckAt')) continue;
    if (LAST_CHECK_READER_FILES.has(file.path)) continue;
    findings.push(
      `${file.path}: liest den gemerkten Zeitpunkt (lastCheckAt) außerhalb von Deklaration und Adapter — der Boden gälte damit wieder über Prozeßgrenzen (T-285)`,
    );
  }
  return findings;
}

/**
 * Gestalt 3: der Spaltenname am Port vorbei (T-288, A-V-27).
 *
 * Beide Richtungen, und die zweite ist die Lehre aus T-249-1: Nur „keine fünfte
 * Datei" zu messen ließe zu, daß eine der vier **verschwindet** — ein Umzug des
 * Adapters, und der Lauf bliebe grün, während die erlaubte Menge ins Leere
 * zeigt. Seit T-290 hat auch diese Richtung ihre Gegenproben, beide Zweige
 * einzeln.
 */
function findeSpaltennameAmPortVorbei(files) {
  const findings = [];
  for (const file of files) {
    if (!file.code.includes(LAST_CHECK_COLUMN)) continue;
    if (LAST_CHECK_COLUMN_FILES.has(file.path)) continue;
    findings.push(
      `${file.path}: nennt die Spalte \`${LAST_CHECK_COLUMN}\` im Code und gehört nicht zu den vier tragenden Dateien — ein Zugriff am Port vorbei ist derselbe Rückweg (T-288, A-V-27)`,
    );
  }
  for (const erlaubt of LAST_CHECK_COLUMN_FILES) {
    const traeger = files.find((file) => file.path === erlaubt);
    if (traeger === undefined) {
      findings.push(
        `${erlaubt}: nicht im gelesenen Baum — die erlaubte Menge zeigt ins Leere und ist zu bestätigen, nicht nachzuziehen`,
      );
      continue;
    }
    if (!traeger.code.includes(LAST_CHECK_COLUMN)) {
      findings.push(
        `${erlaubt}: nennt \`${LAST_CHECK_COLUMN}\` nicht mehr — entweder ist die Spalte umgezogen oder der Archiv-Round-Trip verliert sie (A-20.4)`,
      );
    }
  }
  return findings;
}

/**
 * Gestalt 4: der Ordner des Prüfers faßt keine Datenbank **unmittelbar** an.
 *
 * Die erste der Gestalten, die nicht an einem Namen des Werts hängt. Sie mißt
 * den Griff; die Leitung dorthin mißt Gestalt 5.
 */
function findeDatenbankgriffImPrueferordner(ordner) {
  const findings = [];
  for (const file of ordner) {
    for (const marker of DATABASE_MARKERS) {
      if (!file.code.includes(marker)) continue;
      findings.push(
        `${file.path}: faßt mit \`${marker}\` eine Datenbank unmittelbar an — im Ordner des Prüfers ist das verboten; daß er sich auch keine leiht, mißt Gestalt 5 (T-288, A-V-27)`,
      );
    }
  }
  return findings;
}

/**
 * Gestalt 5: die Importmenge des Ordners, beide Richtungen (T-290, A-V-28).
 *
 * Die Begründung steht bei `VERSION_FEATURE_IMPORTS`; hier steht die Messung.
 *
 * Der Satz zum Befund ist seit T-292 nach Quelle **getrennt** (Befund T-291 zu
 * Zeile 1002). Eine Quelle, die mit `./` beginnt, kann den Ordner gar nicht
 * verlassen und ist deshalb nie ein geliehener Port; gemessen an einem reinen
 * Umzug im Merkmal (`source.ts` → `release-source.ts`) stand dort trotzdem „ein
 * zweiter Port ist der geliehene Rückweg", und der nächste Leser hätte einen
 * Rückweg gesucht, wo eine Umbenennung war. Rot bleibt beides — die
 * Erlaubnisliste ist zu bestätigen, nicht nachzuziehen —, aber der Satz nennt
 * jetzt, was wirklich vorliegt.
 */
function findeFremdeImporteImPrueferordner(ordner) {
  const findings = [];
  const gesehen = new Set();
  for (const file of ordner) {
    for (const quelle of importQuellen(file.code)) {
      gesehen.add(quelle);
      if (VERSION_FEATURE_IMPORTS.has(quelle)) continue;
      findings.push(
        quelle.startsWith('./')
          ? `${file.path}: importiert \`${quelle}\` — eine ordnerinterne Quelle, die nicht in der Erlaubnisliste steht; hier ist etwas umgezogen, und die Liste der ${VERSION_FEATURE_IMPORTS.size} Quellen ist zu bestätigen (T-290, A-V-28)`
          : `${file.path}: importiert \`${quelle}\` — der Ordner des Prüfers hat genau ${VERSION_FEATURE_IMPORTS.size} festgenagelte Importquellen, und ein zweiter Port ist der geliehene Rückweg (T-290, A-V-28)`,
      );
    }
  }
  for (const quelle of VERSION_FEATURE_IMPORTS) {
    if (gesehen.has(quelle)) continue;
    findings.push(
      `${VERSION_FEATURE_PREFIX}: die erlaubte Importquelle \`${quelle}\` kommt im Ordner nicht mehr vor — die Erlaubnisliste zeigt ins Leere und ist zu bestätigen, nicht nachzuziehen (T-290, A-V-28)`,
    );
  }
  return findings;
}

// Gestalt 6: die Verdrahtung (A-A-105, R-30)

/**
 * Wer das Prüfmodul überhaupt in die Hand bekommt — und mit welchen Namen
 * (A-A-105, Befund T-325 B-2).
 *
 * ===========================================================================
 * Warum es eine sechste Gestalt gibt, und warum sie kein sechster Name ist
 * ===========================================================================
 *
 * Die Gestalten 1 bis 5 hängen an einem **Bezeichner** oder an einem
 * **Ordner**: `lastCheckAt`, `last_version_check_at`, der Datenbankgriff im
 * Ordner des Prüfers, die Importmenge dieses Ordners, die Gestalt des Ports. Der
 * security-checker hat am 2026-09-12 gemessen, daß die **Bauart** damit nicht zu
 * ist (T-325 B-2, R-30, Bedrohungsmodell 41.6):
 *
 *     // apps/local-api/src/composition.ts — außerhalb des Prüferordners
 *     const zeile = database.connection
 *       .prepare('SELECT locale FROM app_setting WHERE id = 1').get();
 *     … startDelayMs / intervalMs auf rund 24 Tage
 *
 * `tsc` gab Exit 0, `proof:release-safety` **76/0**, `proof:route-policy` 48/0,
 * `proof:layers` 36/0. Kein Name, kein Ordner, keine der fünf Marken — und die
 * Versionsprüfung ist still abgeschaltet, im Sinn von A-18.11: kein Hinweis,
 * keine Fehlerfläche. Bei unsignierten Erzeugnissen ist die
 * Aktualisierungsmeldung der einzige Weg, auf dem eine Sicherheitsbehebung den
 * Benutzer überhaupt erreicht.
 *
 * Die Frage dieser Gestalt ist deshalb nicht „wie heißt der Wert", sondern:
 * **Welcher Wert entscheidet über die ausgehende Anfrage, und woher kommt er?**
 * Sieben Sätze, alle am **gelesenen Baum** und alle mit dem Compiler — vier seit
 * T-327, drei seit T-335, und die drei sind nicht drei Namen, sondern dieselbe
 * Frage an drei Stellen, an denen sie vorher nicht gestellt war:
 *
 *  - **6a** Wer das Prüfmodul einführt, und welche Namen daraus. Eine
 *    Erlaubnisliste je Datei, beide Richtungen.
 *  - **6b** Was im Aufrufobjekt von `createVersionChecker` steht: festgenagelte
 *    Schlüssel, festgenagelte Wertform. `startDelayMs` ist kein erlaubter
 *    Schlüssel, und damit ist der gemessene Ausschalter rot.
 *  - **6c** `start()` steht genau einmal, wird gerufen und nicht weitergereicht,
 *    und steht unbedingt im Rumpf der Startfunktion.
 *  - **6d** Keine der fünf Datenbankmarken in einer Datei, die den Prüfer
 *    verdrahtet. Allein trägt das nicht — der Weg über `unit.settings.load()`
 *    trägt keine Marke —, und es ist die zweite, unabhängige Zeile, an der der
 *    gemessene Ausschalter fällt.
 *  - **6e/6f** Die **Tür**, durch die ein Port hereinkommt: wie viele Mitglieder
 *    den Typ `ReleaseSourcePort` tragen (genau eines je Naht), und was an
 *    `compose(`/`main(` unter diesem Namen eingereicht wird (nur
 *    `<Bezeichner>.<Türname>`). Die Begründung steht bei
 *    {@link pruefeTuerenDesPorts}.
 *  - **6g** Die **Warteliste** im Rumpf der Anfrage und der Adapter dahinter.
 *    Im Rumpf steht seit T-349 genau ein `await` — die Anfrage selbst, und sie
 *    trägt eine Frist; jedes weitere ist ein Befund. Der Adapter, auf den das
 *    Portliteral zeigt, wird aus der Verdrahtung **hergeleitet**, wartet selbst
 *    nicht und ist zeichengleich. Die Begründung steht bei
 *    {@link CHECKER_AWAITED_BESIDES_REQUEST} und {@link ADAPTER_ANWEISUNGEN}.
 *  - **6h** Der **Rumpf des Portliterals** zwischen Prüfer und Adapter. Er war
 *    bis T-342 die einzige Stelle des Weges, die **gegangen** und nicht
 *    **gelesen** wurde — 6g-2 holt sich von dort den gerufenen Bezeichner und
 *    liest den Rumpf nicht. Die Begründung steht bei
 *    {@link PORTLITERAL_ANWEISUNGEN} (A-A-111, T-337 K-7).
 *  - **6i** Was die beiden Entscheidungsmodule **aus der Laufzeit** nehmen —
 *    und seit T-349 daneben (**6i-2**), was sie sich **rechnen**: eine Einfuhr
 *    ohne literalen Quellnamen, ein Griff nach `constructor`, ein Zugriff mit
 *    unlesbarem Schlüssel. Die Begründung steht bei
 *    {@link MODUL_LAUFZEITNAMEN} und
 *    {@link pruefeGerechneteZugriffeDerEntscheidungsmodule} (A-A-105f, A-A-117,
 *    T-336 Z-2/Z-3, T-346, T-347 K-10c).
 *  - **6j** Der Ausdruck, mit dem die **Auskunft** den Zusammenbau verläßt.
 *    Die Frage „wer entscheidet über die ausgehende Anfrage" war eine Zeile zu
 *    eng: Ein Ausschalter an der **Meldung** wirkt für den Benutzer genauso.
 *    Die Begründung steht bei {@link AUSKUNFT_ANWEISUNGEN} (A-A-110, T-337 K-4).
 *
 * ===========================================================================
 * Der Name kommt aus der Deklaration, nicht aus dieser Datei
 * ===========================================================================
 *
 * 6c braucht den Namen, unter dem der Prüfer weitergegeben wird. Er steht
 * **nicht** hier: Der Leser liest in der Verdrahtungsdatei das Mitglied, dessen
 * Typ der eingeführte `VersionChecker` ist, und nimmt dessen Namen
 * ({@link feldnameDesPruefers}). Wer das Feld umbenennt, wird nicht grün,
 * sondern mitgenommen. Findet der Leser kein solches Mitglied oder mehrere, sagt
 * er, daß er nichts weiß — dieselbe Regel wie bei `extends` und bei einem nicht
 * aufgelösten Alias.
 *
 * ===========================================================================
 * Was diese Gestalt **nicht** fängt, und der Absatz gehört hierher
 * ===========================================================================
 *
 * ---------------------------------------------------------------------------
 * Vorweg: warum dieser Absatz in T-335 neu geschrieben wurde
 * ---------------------------------------------------------------------------
 *
 * Er stand bis dahin mit vier Punkten da und war **unvollständig**, und zwar
 * nicht zufällig: Er zählte auf, was dem Schreiber an `version.ts` einfiel.
 * Zwei Prüfer haben am 2026-09-13 unabhängig voneinander dieselbe Grenze von
 * zwei Seiten gefunden — drei Ausschalter derselben Wirkung, alle mit `tsc`
 * Exit 0, alle **106/0 grün**:
 *
 *   - über den **Port** `source.ts`, außerhalb von `features/version/` gebaut
 *     und über den erlaubten Schlüssel hereingereicht (T-331 Z-1);
 *   - über eine **Wartezeit** im Speicheradapter, die die Verdrahtung
 *     zeichengleich läßt (T-332 K-1) — 0 statt 14 Anfragen, nicht eine
 *     Protokollzeile;
 *   - über den erlaubten Schlüssel `source` mit der erlaubten Wertform
 *     `Identifier` (T-332 K-2).
 *
 * Die Ursache war **eine**: Die Menge war an `version.ts` aufgespannt — an der
 * Datei, die man kennt — statt an der Anforderung „**wer kann über die
 * ausgehende Anfrage entscheiden**". Das ist E-099 Punkt 3, und es war in
 * diesem Bestand der sechste Fall derselben Klasse.
 *
 * Seit T-335 ist die Menge an der Frage aufgespannt und in sieben Sätzen
 * beantwortet: 6a (beide **Entscheidungsmodule**), 6b (Schlüssel und Wertform),
 * 6c (Start), 6d (Datenbankmarke), 6e/6f (die **Tür**, durch die ein Port
 * hereinkommt), 6g (die **Warteliste** vor der Anfrage und der Adapter
 * dahinter). Die Liste unten ist danach **kürzer** — und sie ist immer noch
 * nicht leer, und das ist der ehrliche Teil.
 *
 * ---------------------------------------------------------------------------
 * Offen, und zwar benannt
 * ---------------------------------------------------------------------------
 *
 *  - **Woher `now` und `logger` kommen.** Die Wertform ist festgenagelt (ein
 *    Bezeichner), der Weg dahinter nicht. Eine Uhr, die aus dem Bestand
 *    gestellt wird, verschiebt jeden Zeitstempel dieses Erzeugnisses und ist
 *    kein Schalter für die Versionsprüfung allein — gemessen ist das nicht.
 *  - **Ein Prüfer, der durch eine dritte Funktion wandert.** Übergibt die
 *    Startdatei den Prüfer an einen Nachbarn, liest dieser Leser dort nicht
 *    weiter. Was das eng hält, ist 6a: Wer den Prüfer **baut**, steht in einer
 *    Liste von einer Datei.
 *  - **Eine vierte Naht.** 6f kennt `compose` und `main`
 *    ({@link DECISION_SEAMS}). Wer eine dritte Fabrik baut, die einen Port
 *    entgegennimmt, schreibt sie dort hinein; der Leser findet sie nicht von
 *    selbst. Was das eng hält, ist 6a — der **Typ** kommt aus einem Modul mit
 *    einer Verbraucherliste, und wer ihn nicht einführt, baut strukturell
 *    (siehe den nächsten Punkt).
 *  - **Ein Port ohne Typnamen.** Strukturelle Typisierung braucht keinen
 *    Import: Ein Objekt mit `latest(signal)` **ist** der Port. 6a sieht das
 *    nicht; 6f sieht es, solange der Wert durch `compose`/`main` geht. Ginge er
 *    über einen vierten Weg, sähe ihn niemand.
 *  - **Der Adapter jenseits der einen Naht.** 6g verfolgt, worauf der Prüfer
 *    **vor** der Anfrage wartet — heute genau eine Naht, und deren Adapter ist
 *    zeichengleich festgenagelt. Was dieser Adapter seinerseits ruft, wird
 *    **nicht** weiterverfolgt. Heute ruft er `conn.prepare(...).run(...)` und
 *    sonst nichts; das steht im Zeichenvergleich, und der Vergleich ist der
 *    einzige Grund, warum der Satz hier stehen darf.
 *  - **Der Weg der Auskunft nach dem Zusammenbau.** 6j endet an der Stelle, an
 *    der `versionState` eingereicht wird. Route, Antwortgestalt, Abruf und
 *    Dialog liegen dahinter und werden von diesem Lauf nicht gemessen. Die
 *    ausführliche Fassung steht in der Lückenliste bei
 *    {@link checkNoStoreReadback}; sie ist die ehrliche Antwort auf T-337 K-4
 *    und lautet: die **Stelle** ist gemessen, die **Klasse** nicht.
 *  - **`node_modules/**`.** Wie bei Zusage 1 und aus demselben Grund.
 *  - **Das Verhalten.** Ob die erste Anfrage wirklich hinausgeht, mißt ein
 *    Prüffall gegen einen Prüfserver (TP-VER-11), nicht ein Leser von
 *    Quelltext. **Das bleibt der einzige vollständige Nachweis dieser Klasse.**
 *    Ein Leser von Quelltext kann nur zusagen, daß eine bestimmte Menge von
 *    Schreibweisen die Entscheidung nicht erreicht; daß **gar keine** sie
 *    erreicht, kann er nicht — dazwischen liegt jedesmal eine Gestalt, die
 *    noch niemand gebaut hat. Wer diese Klasse schließen will, mißt
 *    **Anfragen**, nicht Zeichen: ein Prüfer, dessen Speicher nie antwortet,
 *    und die Anfrage geht trotzdem hinaus.
 *
 * ===========================================================================
 * Der Preis, und er ist derselbe wie bei den übrigen Erlaubnislisten
 * ===========================================================================
 *
 * Drei Bewegungen machen diesen Lauf rot, ohne daß ein Fehler vorläge: ein
 * Umzug von `composition.ts` oder `main.ts`, eine Umbenennung des Feldes, und
 * ein **vierter** Leser des Prüfmoduls — auch einer, der nur den Typ
 * `VersionCheckState` braucht und mit der ausgehenden Anfrage nichts zu tun hat.
 * Der kostet eine Zeile in dieser Liste und einen Satz daneben.
 *
 * Das ist gewollt und nicht hingenommen: Eine Erlaubnisliste, die sich selbst
 * nachzieht, bewacht nichts (E-103 gegengelesen). Wer die Liste erweitert,
 * schreibt dazu, warum der neue Leser über die Anfrage nicht entscheiden kann.
 */
/**
 * Die **Entscheidungsmodule** — und warum es seit T-335 mehr als eines ist.
 *
 * Bis T-335 stand hier eine Liste über **ein** Modul: `features/version/version.ts`.
 * Die Menge war damit an der Datei aufgespannt, die der Schreiber im Blick
 * hatte, und nicht an der Anforderung. Zwei Prüfer haben am 2026-09-13
 * unabhängig voneinander dieselbe Grenze von zwei Seiten gemessen (T-331 Z-1,
 * T-332 K-2): Wer `features/version/source.ts` einführt — den Port, **hinter
 * dem die Anfrage steht** —, war von keiner der sechs Gestalten erfaßt. Beide
 * Ausschalter liefen mit `tsc` Exit 0 und **106/0** grün.
 *
 * Das ist E-099 Punkt 3, und es war in diesem Bestand der sechste Fall
 * derselben Klasse. Die Antwort ist deshalb nicht ein dritter Name, sondern
 * eine andere **Frage**: Nicht „wer faßt den Prüfer an", sondern „**wer kann
 * über die ausgehende Anfrage entscheiden**". Auf diese Frage antworten zwei
 * Module, und beide stehen hier:
 *
 *  - `version.ts` — wer den Prüfer baut, bestimmt Takt, Boden und Start.
 *  - `source.ts` — wer den Port baut oder ersetzt, bestimmt, **ob** überhaupt
 *    etwas hinausgeht. Ein Port, der `{ ok: false, reason: 'no_release' }`
 *    zurückgibt, ist derselbe Ausschalter wie ein Takt von 24 Tagen, nur eine
 *    Naht weiter links.
 *
 * `was` ist der Satzteil, mit dem das Modul im Befund erscheint. Er steht hier
 * und nicht im Leser, damit die Meldung „führt das Quellmodul ein" und die
 * Meldung „führt das Prüfmodul ein" **unterscheidbar** sind — die Zählvorschrift
 * bei {@link COUNTER_PROOFS} verlangt das.
 *
 * Der Preis ist derselbe wie zuvor, nur zweimal: Ein vierter Leser des
 * Prüfmoduls **oder** ein dritter des Quellmoduls kostet eine Zeile und einen
 * Satz daneben. Wer die Liste erweitert, schreibt dazu, warum der neue Leser
 * über die Anfrage nicht entscheiden kann.
 */
const DECISION_MODULES = new Map([
  [
    'apps/local-api/src/features/version/version.ts',
    {
      was: 'das Prüfmodul',
      dativ: 'dem Prüfmodul',
      verbraucher: new Map([
        ['apps/local-api/src/composition.ts', new Set(['createVersionChecker', 'VersionChecker'])],
        ['apps/local-api/src/main.ts', new Set(['VERSION_CHECK_START_DELAY_MS'])],
        ['apps/local-api/src/app.ts', new Set(['VersionCheckState'])],
      ]),
    },
  ],
  [
    'apps/local-api/src/features/version/source.ts',
    {
      was: 'das Quellmodul',
      dativ: 'dem Quellmodul',
      /*
       * Beide führen **nur den Typ** ein und keinen Erzeuger: `compose()` nimmt
       * den Port entgegen, `main()` reicht ihn weiter, und gebaut wird er
       * ausschließlich im Prüfmodul (`createGithubReleaseSource` steht in
       * `version.ts`s Einfuhrliste, nicht hier). Wer einen der beiden Namen um
       * `createGithubReleaseSource` erweitert, baut die Quelle außerhalb des
       * Ordners — und wird hier rot.
       */
      verbraucher: new Map([
        ['apps/local-api/src/composition.ts', new Set(['ReleaseSourcePort'])],
        ['apps/local-api/src/main.ts', new Set(['ReleaseSourcePort'])],
      ]),
    },
  ],
]);

/** Wo der Port steht, hinter dem die ausgehende Anfrage liegt. */
const RELEASE_SOURCE_FILE = 'apps/local-api/src/features/version/source.ts';

/** Der Typ, über den der Port durch die Nähte gereicht wird. */
const RELEASE_SOURCE_TYPE = 'ReleaseSourcePort';

/**
 * Die **Nähte**, an denen ein Port in den Zusammenbau eingereicht wird (6f).
 *
 * `compose()` nimmt ihn entgegen, `main()` reicht ihn weiter. Beide sind
 * Funktionen mit einem Optionsobjekt, und genau darin liegt die Tür: Ein Wert,
 * der hier ankommt, entscheidet über die ausgehende Anfrage, ohne je eine der
 * fünf Datenbankmarken oder einen der Namen aus {@link DECISION_MODULES} zu
 * berühren. Gemessen (T-331 Z-1): `releaseSource: quelleAusDemBestand(…)` in
 * `main.ts`, drei Dateien, `tsc` Exit 0, Lauf 106/0 grün.
 *
 * Was den Weg bis T-335 eng hielt, war **nicht** dieser Lauf, sondern daß
 * `apps/desktop/sidecar/entry.ts` und `apps/local-api/src/index.ts` `main()`
 * ohne Argument rufen. Das stand in keinem Nachweis. Jetzt steht es hier.
 *
 * **Der Wert ist die Datei, die die Naht deklariert**, und nicht nur ihr Name.
 * Ein Leser, der jedes `compose(` im Baum für diese Naht hielte, wäre zweimal
 * falsch: Er würde eine gleichnamige Hilfsfunktion der Oberfläche messen (und
 * an ihr rot werden, ohne daß etwas geschehen wäre), und er würde behaupten,
 * einen Namen zu bewachen, wo er eine Funktion bewachen soll. Gemessen wird
 * deshalb nur ein Aufruf, dessen Bezeichner **aus der deklarierenden Datei
 * eingeführt** ist — derselbe Weg, den auch der Compiler geht.
 */
const DECISION_SEAMS = new Map([
  ['compose', 'apps/local-api/src/composition.ts'],
  ['main', 'apps/local-api/src/main.ts'],
]);

/**
 * Worauf der Prüfer im Rumpf der ausgehenden Anfrage **außer der Anfrage
 * selbst** wartet (6g-1) — seit T-349 die **leere Menge** (A-A-106).
 *
 * ===========================================================================
 * Woher die Liste kommt, und warum sie heute leer ist
 * ===========================================================================
 *
 * Der Befund dahinter ist T-332 K-1, und er ist die stillste der gemessenen
 * Gestalten: `recordCheck` im Speicheradapter wartete vor dem `UPDATE` einen
 * aus `app_setting.locale` gelesenen „Mindestabstand" ab. `composition.ts` und
 * `main.ts` blieben dabei **zeichengleich**, keine der sechs Gestalten sah
 * etwas, der Lauf stand bei 106/0 — und am echten Prüfer gingen **0 statt 14**
 * Anfragen hinaus, ohne eine einzige Protokollzeile.
 *
 * Der Grund war eine Zeile in `version.ts`: `await remember(options.now())`
 * stand **vor** `await source.latest(...)`, und `remember` wartete auf
 * `store.write`. Ein **Wurf** von dort war behandelt; eine Zusage, die **nie
 * eintrifft**, nicht. Bis T-342 stand hier deshalb `new Set(['remember'])` —
 * die Lage festgenagelt, nicht behoben, mit dem ausdrücklichen Satz: „Dann
 * steht vor der Anfrage kein Warten mehr, und die Liste ist leer statt
 * einzeilig."
 *
 * **T-349 hat sie geleert, und zwar an der Fachstelle** (A-A-106): `remember`
 * ist synchron, das Schreiben wird angestoßen und nicht abgewartet, eine
 * `unref()`te Frist macht aus dem Schweigen eines Speichers **eine** Zeile im
 * Protokoll. Gemessen am Modul mit einem Speicher, dessen `write` nie eintrifft:
 * **10 statt 0** ausgehende Anfragen in 400 ms, Zustand `known`, genau eine
 * Zeile `version_check_state_write_timeout`.
 *
 * ===========================================================================
 * Was die leere Menge zusagt — und warum sie mehr ist als die einzeilige
 * ===========================================================================
 *
 * **Im Rumpf, in dem die ausgehende Anfrage steht, gibt es genau ein `await` —
 * die Anfrage selbst.** Jedes weitere ist ein Befund, gleich ob es lexikalisch
 * davor oder dahinter steht. Das „dahinter" ist seit T-349 mitgemessen und war
 * bis dahin eine Lücke: Ein `await`, das **nach** der Anfrage nie eintrifft,
 * hält `inFlight` genauso auf wahr, stellt genauso keinen Zeitgeber und ist
 * genauso still — derselbe Ausschalter, eine Zeile später.
 *
 * Die Anfrage selbst trägt ihre eigene Gesamtfrist (A-V-5,
 * `AbortSignal.timeout` in `source.ts`) und den `AbortController` aus `stop()`.
 * Sie ist das einzige fremde Versprechen auf diesem Weg, und sie ist das
 * einzige, das eine Frist hat.
 *
 * Die Zusage ist mit Absicht eine über den **Weg** und nicht über den Speicher:
 * Ein Wächter kann die Menge derer eng ziehen, die ein Versprechen geben
 * dürfen; solange der Weg auf eines wartet, ist jeder von ihnen ein
 * Ausschalter. Genau das war der Satz hinter R-30.
 *
 * ===========================================================================
 * Und seit T-360 gilt sie für den **Weg**, nicht für einen Rumpf
 * ===========================================================================
 *
 * Der Satz oben sagt „im Rumpf, in dem die ausgehende Anfrage steht". Genau
 * dieser Halbsatz war der nächste Ausgang, und er ist gemessen (T-356): Wer die
 * Anfrage in eine örtliche Hilfsfunktion schiebt — `return await
 * source.latest(…)`, tadellos —, verschiebt den gemessenen Rumpf mit und stellt
 * sein hängendes `await` in den, den der Zeitgeber ruft. `tsc` Exit 0, Lauf
 * **154/0 grün**, am Modul **0 statt 40** ausgehende Anfragen, Zustand
 * `unknown`, **0** Protokollzeilen (T-360 nachgestellt).
 *
 * Die Zusage heißt seither: **Vom `setTimeout`-Rückruf bis zu dem Rumpf, in dem
 * die Anfrage steht, wartet jedes Glied auf genau eines — das nächste Glied;
 * und das letzte auf die Anfrage.** Das ist dieselbe Aussage, an der Anforderung
 * aufgespannt statt an der Stelle, die der Autor im Kopf hatte (E-099 Punkt 3).
 *
 * ===========================================================================
 * Die Untergrenze steht jetzt **in** der Regel
 * ===========================================================================
 *
 * Solange die Menge einzeilig war, trug sie selbst die Untergrenze: Verschwand
 * `remember`, sprach die zweite Richtung. Eine leere Menge kann das nicht —
 * **eine leere Erlaubnisliste ist über jedem stummen Leser wahr.** An ihre
 * Stelle tritt die Frage, die der Leser ohnehin beantworten muß: **Steht die
 * Anfrage selbst unter einem `await`?** Findet er es nicht, hat er den Rumpf
 * nicht gelesen, und das ist ein Befund mit eigenem Satz. Die Gegenproben
 * setzen beide Richtungen ein — ein Warten davor, ein Warten dahinter, und den
 * Stand **vor** A-A-106 (`await remember(…)`), der damit für immer rot bleibt.
 *
 * Der Name der Konstanten ist mit T-349 gewandert: Bis dahin hieß sie
 * `CHECKER_AWAITED_BEFORE_REQUEST` („vor der Anfrage"), und der Bericht T-335,
 * die Auflage A-A-106 und das Board nennen sie so. Die Menge ist eine andere
 * geworden — im ganzen Rumpf statt nur davor —, und ein Name, der die alte
 * Menge nennt, wäre die vierte Art, eine Zusage stillschweigend zu überholen.
 */
const CHECKER_AWAITED_BESIDES_REQUEST = new Set();

/** Das Mitglied des Ports, über das die ausgehende Anfrage läuft. */
const RELEASE_SOURCE_MEMBER = 'latest';

/**
 * Die **Anweisungen** der Adaptermitglieder, auf die der Prüfer wartet —
 * zeichengleich, ohne Prosa (6g).
 *
 * ===========================================================================
 * Warum hier ausnahmsweise Zeichen stehen und nicht eine Regel
 * ===========================================================================
 *
 * Weil an dieser einen Stelle keine Regel trägt, und das ist ein Befund und
 * keine Bequemlichkeit. K-1 (T-332) wartet mit `await`; eine zweite Fassung
 * desselben Ausschalters wartet **ohne** `await` — `return new Promise<void>(()
 * => {})` ist eine Zusage, die nie eintrifft, und enthält weder `await` noch
 * `setTimeout` noch eine Datenbankmarke. Jede Liste verbotener Namen wäre der
 * nächste Name; das ist dieselbe Niederlage, die diesen Lauf sechsmal gekostet
 * hat.
 *
 * Deshalb steht hier die **Menge aller** Anweisungen dieses Mitglieds, und
 * nicht die Menge der verbotenen. Wer sie ändert, ändert sie sichtbar und
 * bestätigt sie hier — dieselbe Bauart, mit der `proof:shell-surface` die CSP
 * gegen `tauri.conf.json` hält.
 *
 * **Der Schlüssel ist hergeleitet und nicht geraten**: Der Leser nimmt das
 * Objektliteral, das die Verdrahtung unter `store` einsetzt, findet darin den
 * gerufenen Bezeichner, löst ihn in derselben Datei auf seinen Erzeuger auf und
 * sucht die Datei, die diesen Erzeuger **deklariert**. Wer den Adapter
 * umbenennt oder verschiebt, wird mitgenommen und nicht grün.
 *
 * Der Preis, und er ist neu: Eine Änderung an
 * `packages/storage/src/sqlite/repo-version-check.ts` macht **diesen** Lauf
 * rot. Das ist gewollt — es ist die einzige Datei des Bestands, deren
 * Anweisungen darüber entscheiden, ob die Versionsprüfung überhaupt fragt.
 * Prosa darf sich frei ändern; der Leser liest Anweisungen und keine Kommentare.
 */
const ADAPTER_ANWEISUNGEN = new Map([
  [
    'recordCheck',
    "async recordCheck ( at : Timestamp ) : Promise < void > { conn . prepare ( 'UPDATE app_setting SET last_version_check_at = ? WHERE id = 1' ) . run ( at ) ; }",
  ],
]);

/**
 * Die **Anweisungen der Portliterale** in der Verdrahtung — zeichengleich (6h,
 * A-A-111, T-337 K-7).
 *
 * ===========================================================================
 * Die Stelle, nicht die Schreibweise
 * ===========================================================================
 *
 * 6g nagelt den Adapter **hinter** dem Port fest und leitet ihn dazu aus der
 * Verdrahtung her: Aufrufobjekt → Portliteral → gerufener Bezeichner →
 * Erzeuger → Adapterdatei → Mitglied. Jeder dieser Schritte wurde **gegangen**,
 * und genau einer davon wurde dabei nicht **gelesen**: das Portliteral selbst.
 *
 * Der security-checker hat das am 2026-09-13 gemessen (T-337 K-7). Es ist
 * dieselbe Technik wie T-332 K-1, vier Zeilen weiter links:
 *
 *     store: {
 *       write: async (at: Date) => {
 *         await new Promise<void>(() => undefined);
 *         await versionCheckState.recordCheck(toTimestamp(at));
 *       },
 *     },
 *
 * `tsc` Exit 0, dieser Lauf **130/0 grün**, am zusammengebauten Dienst **0
 * statt 1** ausgehende Anfrage. Der Adapter blieb dabei zeichengleich — der
 * teuerste Prüfsatz dieses Laufs, der Vergleich über ein fremdes Paket, war
 * durch vier Zeilen Verdrahtung zu umgehen.
 *
 * **Die Lehre ist nicht, daß eine Schreibweise fehlte.** `await`, `new
 * Promise`, `setTimeout` — jede Liste verbotener Namen wäre der nächste Name.
 * Die Lehre ist, daß es eine **Stelle** gab, die als Literal geprüft, aber
 * nicht gelesen wurde, und an einer solchen Stelle kommt jede Schreibweise
 * durch. Deshalb steht hier dieselbe Bauart wie bei
 * {@link ADAPTER_ANWEISUNGEN}: die Menge **aller** Anweisungen, nicht die Menge
 * der verbotenen.
 *
 * Der Schlüssel ist `<Port>.<Stelle>` und damit hergeleitet: `store` ist der
 * Schlüssel des Aufrufobjekts (6b nagelt ihn fest), `write` das einzige
 * Mitglied des Ports (Gestalt 2 nagelt es fest). Beide Richtungen — eine
 * festgenagelte Stelle, die im Literal nicht mehr steht, ist ein Befund.
 *
 * Der Preis ist klein und benannt: Wer die Verdrahtung des Speicherports
 * ändert, bestätigt sie hier. Das sind vier Zeilen in einer Datei, die
 * ohnehin zeichengleich gegen {@link SAUBERES_AUFRUFOBJEKT} steht.
 */
const PORTLITERAL_ANWEISUNGEN = new Map([
  ['store.write', 'write : ( at : Date ) => versionCheckState . recordCheck ( toTimestamp ( at ) )'],
]);

/**
 * Was die **Entscheidungsmodule** aus der Laufzeit nehmen, statt es einzuführen
 * oder selbst zu erklären (6i).
 *
 * ===========================================================================
 * Warum diese Liste die Gestalt schließt, die keine Einfuhr braucht
 * ===========================================================================
 *
 * Der code-reviewer hat am 2026-09-13 zwei Ausschalter gebaut, die beide mit
 * `tsc` Exit 0 durchliefen und diesen Lauf bei **130/0** ließen (T-336 Z-2 und
 * Z-3):
 *
 *     // features/version/source.ts, erste Anweisung von `latest()`
 *     if (process.env['TAKT_SKIP_UPDATE_CHECK'] === '1') return { ok: false, reason: 'unreachable' };
 *
 *     // features/version/version.ts, zwischen `remember` und `source.latest`
 *     if (process.env['TAKT_SKIP_UPDATE_CHECK'] === '1') return;
 *
 * Beide liegen im **Rumpf** eines Entscheidungsmoduls. 6a bis 6h messen, wer
 * die Module baut, womit, wodurch ein Port hereinkommt, daß gestartet wird und
 * worauf vor der Anfrage gewartet wird — **keiner** von ihnen liest, was die
 * Module tun. Und beide widersprechen der Zusage, die der Port zwei Zeilen über
 * sich selbst führt (`source.ts`: „keine Route, keine Einstellung, **keine
 * Umgebungsvariable**, kein Argument, keine Datei daneben").
 *
 * ===========================================================================
 * Die Menge ist an der Anforderung aufgespannt und nicht an `process`
 * ===========================================================================
 *
 * `process.env` zu verbieten wäre der nächste Name — `globalThis`,
 * `process.argv`, `import.meta.env`, ein `require('node:fs')` daneben, und die
 * Niederlage wäre die siebte derselben Klasse. Gemessen wird deshalb die
 * **Tür**, nicht der Gast: Ein Modul kann über eine **Einfuhr** an etwas
 * herankommen, das es nicht selbst erklärt hat, oder über einen **freien
 * Namen**, den ihm die Laufzeit stellt. Die Einfuhren sind seit T-290
 * festgenagelt ({@link VERSION_FEATURE_IMPORTS}, Gestalt 5). Hier stehen die
 * freien Namen.
 *
 * ===========================================================================
 * Der Satz, der hier bis T-349 stand, war zu weit — zweimal gemessen
 * ===========================================================================
 *
 * Er lautete: „Zusammen ist das eine **geschlossene** Aussage über die beiden
 * Module … Was hineinkommt, steht entweder in der Einfuhrliste, in dieser
 * Liste, oder es ist ein Wert aus einem Parameter." Die ersten beiden Hälften
 * stimmen, der Schluß nicht:
 *
 *  - **T-347 K-10c**: `await import(teile.join(':'))` — kein Eintrag in einer
 *    Einfuhrliste, kein freier Name, kein Parameter. `tsc` Exit 0, dieser Lauf
 *    145/0 grün, am Modul gemessen **0 statt 1** ausgehende Anfrage.
 *  - **T-346 (1)**: `({}).constructor.constructor("return globalThis")()` —
 *    dasselbe über eine Kette, die dieser Leser als Feldnamen abtat.
 *
 * Beides ist seit T-349 **gemessen**, und zwar bei
 * {@link pruefeGerechneteZugriffeDerEntscheidungsmodule} (6i-2, A-A-117): der
 * **gerechnete Zugriff** als dritte Art neben Einfuhr und freiem Namen.
 *
 * **Was daraus zu sagen ist, und nicht mehr:** Vier Wege sind gemessen — die
 * Einfuhr (Gestalt 5), der freie Name (hier), der Parameter (6b, 6e, 6f) und
 * der gerechnete Zugriff (6i-2). Daß es keinen fünften gibt, sagt dieser Lauf
 * **nicht**; er hat es zweimal behauptet und zweimal unrecht behalten. Die
 * Aussage, die eine Schließung trüge, wäre eine über eine **Eigenschaft** statt
 * über eine Aufzählung — ein Kandidat steht bei 6i-2 —, und sie verlangte den
 * Typprüfer. Bis dahin gilt die ehrliche Grenze.
 *
 * Gelesen wird der **ungekürzte** Quelltext: Der Compiler wirft Kommentare
 * selbst weg, und ein `process` in einer Zeichenkette ist damit kein Befund,
 * während eines in einer auskommentierten Zeile auch keiner wird.
 *
 * **Beide Richtungen.** Ein Name, der hier steht und im Modul nicht mehr
 * vorkommt, ist ein Befund: Sonst bliebe die Liste stehen und zeigte ins Leere,
 * und der nächste Eintrag käme unbemerkt dazu (T-249-1).
 *
 * Der Preis, und er ist der größte der neuen drei: Wer in einem der beiden
 * Module einen bisher ungenutzten Laufzeitnamen benutzt — `structuredClone`,
 * `URL`, `queueMicrotask` —, macht diesen Lauf rot und trägt ihn hier ein. Das
 * ist gewollt. Jeder dieser Namen ist eine Tür, und eine Erlaubnisliste, die
 * sich selbst nachzieht, bewacht nichts (E-103).
 */
const MODUL_LAUFZEITNAMEN = new Map([
  [
    'apps/local-api/src/features/version/version.ts',
    new Set([
      'AbortController',
      'Date',
      'Infinity',
      'Math',
      'Number',
      'Promise',
      'ReturnType',
      /*
       * `Set` ist mit T-360 dazugekommen, und der Eintrag ist genau das Ritual,
       * das der Satz oben beschreibt: Der Lauf wurde rot (153/1, „nimmt `Set`
       * aus der Laufzeit"), bevor diese Zeile stand.
       *
       * Wofür: `stop()` räumt seit T-360 **jeden** Zeitgeber dieses Prüfers ab,
       * nicht nur den Takt — die schwebenden Fristen der angestoßenen
       * Schreibzugriffe stehen dafür in einer Menge (Befund T-356 zu
       * `version.ts:509`: nach `stop()` kam gemessen noch eine `info`-Zeile an).
       */
      'Set',
      'String',
      'clearTimeout',
      'setTimeout',
    ]),
  ],
  [
    'apps/local-api/src/features/version/source.ts',
    new Set([
      'AbortSignal',
      'Array',
      'JSON',
      'Object',
      'Promise',
      'Record',
      'Response',
      'TextDecoder',
      'Uint8Array',
      'fetch',
      'undefined',
    ]),
  ],
]);

/**
 * Der Ausdruck, mit dem die **Auskunft** den Zusammenbau verläßt — zeichengleich
 * (6j, A-A-110, T-337 K-4).
 *
 * ===========================================================================
 * Die Frage war eine Zeile zu eng
 * ===========================================================================
 *
 * Gestalt 6 ist seit T-335 an der Frage aufgespannt „**wer kann über die
 * ausgehende Anfrage entscheiden**". Der security-checker hat am 2026-09-13
 * gezeigt, daß diese Frage das Schutzziel nicht ganz trifft (T-337 K-4):
 *
 *     versionState: () =>
 *       database !== null && auskunftUnterdrueckt(database.connection)
 *         ? { state: 'unknown', latestVersion: null }
 *         : versionCheck.current(),
 *
 * `tsc` Exit 0, dieser Lauf **130/0 grün**, und die Anfrage geht hinaus wie
 * immer — **eine** wie ohne den Ausschalter. Abgeschaltet ist nicht die
 * Anfrage, sondern die **Auskunft**: Die Oberfläche erfährt nie, daß es eine
 * neuere Fassung gibt. A-18 verlangt aber nicht, daß gefragt wird, sondern daß
 * der Benutzer **erfährt** — bei unsignierten Erzeugnissen der einzige Weg, auf
 * dem eine Sicherheitsbehebung ihn erreicht (R-30).
 *
 * Gemessen wird deshalb dieselbe Bauart eine Naht weiter rechts: der Ausdruck,
 * in dem der Prüfer in der Verdrahtung **gelesen** wird. Der Bezeichner des
 * Prüfers ist hergeleitet (`const X = createVersionChecker(…)`), die Menge der
 * an ihm gerufenen Mitglieder ist festgenagelt, und der äußerste Ausdruck um
 * jeden dieser Aufrufe ist zeichengleich.
 *
 * Zwei unabhängige Zeilen, und sie sind es mit Absicht — dieselbe Aufteilung
 * wie bei {@link ADAPTER_ANWEISUNGEN}:
 *
 *  - Der Aufruf steht **unbedingt** ({@link bedingungUeber}). Das ist die Regel,
 *    und sie überlebt eine bestätigte Änderung am Zeichenvergleich.
 *  - Der äußerste Ausdruck ist **zeichengleich**. Das ist der Vergleich, und er
 *    fängt, was keine Regel fängt — ein fremder Aufruf **um** den Prüfer herum
 *    (`() => zwischenspeicher(versionCheck.current())`) steht unter keiner
 *    Bedingung.
 *
 * **Was das nicht schließt, steht bei {@link checkNoStoreReadback}** und ist
 * der ehrliche Teil: Dieser Satz mißt den Weg bis an den Rand des
 * Zusammenbaus. Er sagt nichts über `current()` selbst, nichts über die Route,
 * die ihn liest, und nichts über die Oberfläche, die ihn zeichnet.
 */
const AUSKUNFT_ANWEISUNGEN = new Map([['current', '( ) => versionCheck . current ( )']]);

/** Die Erlaubnisliste des Prüfmoduls — der Teil von {@link DECISION_MODULES}, den 6c und 6d brauchen. */
const VERSION_MODULE_CONSUMERS = DECISION_MODULES.get(
  'apps/local-api/src/features/version/version.ts',
).verbraucher;

/** Der Erzeuger des Prüfers, und der Typ, über den er weitergegeben wird. */
const CHECKER_FACTORY = 'createVersionChecker';
const CHECKER_TYPE = 'VersionChecker';

/** Die Datei, in der der Takt anläuft. Genau eine (A-V-10, `main.ts`). */
const CHECKER_START_FILE = 'apps/local-api/src/main.ts';

/** Was an der Verdrahtung am Prüfer gerufen werden darf. */
const CHECKER_MEMBERS = new Set(['start', 'stop']);

/**
 * Die Schlüssel des Aufrufobjekts, jeder mit seiner festgenagelten Wertform
 * (A-A-105a).
 *
 * **Es ist eine Obergrenze, und sie zieht sich nicht selbst nach** — dieselbe
 * Bauart wie {@link RELEASE_PREFIX_FILES}. Die Aussage ist nicht „wo steht der
 * Wert", sondern „**welche Werte dürfen die ausgehende Anfrage überhaupt
 * beeinflussen**". Jeder weitere Schlüssel ist einer, über den ein Wert aus dem
 * Bestand entscheidet, wann gefragt wird — `startDelayMs`, `intervalMs`,
 * `minIntervalMs` und `random` sind deshalb nicht darin, obwohl sie an
 * `VersionCheckerOptions` stehen. Sie gehören den Prüffällen, und die Prüfordner
 * liegen außerhalb des gelesenen Baums.
 *
 * Die Wertform steht daneben, weil ein erlaubter Schlüssel mit einem gerufenen
 * Wert dasselbe Loch wäre: `now: () => new Date(ausDemBestand())` ist ein
 * Ausschalter mit einem erlaubten Namen.
 */
const CHECKER_CALL_KEYS = new Map([
  ['logger', { formen: [ts.SyntaxKind.Identifier], satz: 'ein Bezeichner' }],
  ['now', { formen: [ts.SyntaxKind.Identifier], satz: 'ein Bezeichner' }],
  /*
   * **Nur noch ein Feld der Aufrufoptionen** (A-A-107, Befund T-332 B-2).
   *
   * Bis T-335 war `Identifier` daneben zugelassen — weiter, als der Bestand
   * jemals war: Gebaut ist `source: options.releaseSource`, und das ist ein
   * Feldzugriff. Die überzählige Form hat gemessen etwas gekostet: K-2 (T-332)
   * setzt `const releaseSource = options.releaseSource ?? releaseWindow(database);`
   * davor und reicht `source: releaseSource` ein — erlaubter Schlüssel,
   * erlaubte Wertform, `tsc` Exit 0, Lauf 106/0 grün, und die ausgehende
   * Anfrage stand still (0 statt 14).
   *
   * Der Unterschied zwischen den beiden Formen ist genau der, um den es geht:
   * Ein **Feld der Aufrufoptionen** kommt von außerhalb dieser Funktion und ist
   * durch 6f gemessen; ein **örtlicher Bezeichner** entsteht in derselben Datei
   * und kann alles sein. Die Verengung kostet heute nichts.
   */
  [
    'source',
    {
      formen: [ts.SyntaxKind.PropertyAccessExpression],
      satz: 'ein Feld der Aufrufoptionen',
    },
  ],
  ['store', { formen: [ts.SyntaxKind.ObjectLiteralExpression], satz: 'ein Objektliteral' }],
]);

/** Knoten, die eine Verzweigung über dem Aufruf bedeuten. */
const VERZWEIGENDE_ARTEN = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ConditionalExpression,
  ts.SyntaxKind.SwitchStatement,
  ts.SyntaxKind.CaseClause,
  ts.SyntaxKind.DefaultClause,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.TryStatement,
  ts.SyntaxKind.CatchClause,
]);

const FUNKTIONSARTEN = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor,
]);

/**
 * Wo die Pakete des Arbeitsbereichs liegen — projektrelativ, über ihren Namen.
 *
 * Gebraucht wird das für {@link aufgeloesteQuelle}: Eine **paketqualifizierte**
 * Quelle wie `@takt/local-api/src/main.ts` zeigt auf eine Datei des gelesenen
 * Baums, und sie muß denselben Pfad ergeben wie eine relative Quelle auf
 * dieselbe Datei. Die Menge ist die der Quellordner; ein fremdes Paket
 * (`hono`, `zod`) steht nicht darin und löst sich damit zu nichts auf.
 */
const PAKET_ORTE = new Map(
  [...new Set(SOURCE_ROOTS.map((eintrag) => eintrag.paket))].map((name) => [
    name,
    relative(ROOT, paketVerzeichnis(name)).split(sep).join('/'),
  ]),
);

/**
 * Ein Pfad relativ zum Vorhaben, aus einer Importquelle aufgelöst.
 *
 * Drei Schreibweisen werden versucht — mit Endung, ohne Endung, als Ordner mit
 * `index.ts` —, damit die Naht nicht an einer weggelassenen Endung vorbeigeht.
 *
 * ===========================================================================
 * Warum ein **Paketname** hier seit T-335 mitzählt (Befund beim Bauen)
 * ===========================================================================
 *
 * Bis T-335 stand hier: „Nur relative Quellen können ein Modul **innerhalb**
 * einer Anwendung erreichen; ein Paketname kann es nicht (`@takt/local-api` hat
 * keine `exports`-Tabelle auf dieses Modul, und `apps/desktop/sidecar/entry.ts`
 * zeigt ausdrücklich auf `src/main.ts`)."
 *
 * Der Satz war falsch, und sein eigener Beleg war das Gegenbeispiel.
 * `apps/local-api/package.json` hat **gar keine** `exports`-Tabelle — und ohne
 * `exports` ist in Node **jeder** Unterpfad eines Pakets einführbar. Genau das
 * tut `entry.ts`, und zwar im **ausgelieferten** Sidecar:
 *
 *     import { main } from '@takt/local-api/src/main.ts';
 *
 * Damit war 6a über einen Weg zu umgehen, den niemand verstecken mußte:
 * `import { createVersionChecker } from '@takt/local-api/src/features/version/version.ts'`
 * löste sich zu nichts auf, und der Leser sah die Datei nicht. Das ist dieselbe
 * Klasse wie die drei gemessenen Ausschalter — eine Menge, die an der
 * Schreibweise aufgespannt war, die der Schreiber im Kopf hatte.
 *
 * Seit T-335 werden beide Schreibweisen auf **denselben** projektrelativen Pfad
 * abgebildet. Was weiterhin nicht aufgelöst wird, ist eine Kette über eine
 * Wiederausfuhr (`import { compose } from './index.ts'`, wenn `index.ts` sie
 * weiterreicht) — der Leser folgt einer Datei und nicht einem Graphen.
 */
function aufgeloesteQuelle(vonPfad, quelle) {
  if (!quelle.startsWith('.')) {
    const stuecke = quelle.split('/');
    const paket = quelle.startsWith('@') ? stuecke.slice(0, 2).join('/') : stuecke[0];
    const ort = PAKET_ORTE.get(paket);
    const rest = quelle.slice(paket.length + 1);
    if (ort === undefined || rest === '') return [];
    const basis = `${ort}/${rest}`;
    return [basis, `${basis}.ts`, `${basis}/index.ts`, basis.replace(/\.js$/, '.ts')];
  }
  const teile = vonPfad.split('/').slice(0, -1);
  for (const stueck of quelle.split('/')) {
    if (stueck === '' || stueck === '.') continue;
    if (stueck === '..') {
      teile.pop();
      continue;
    }
    teile.push(stueck);
  }
  const basis = teile.join('/');
  return [basis, `${basis}.ts`, `${basis}/index.ts`, basis.replace(/\.js$/, '.ts')];
}

/** Führt diese Datei das genannte Modul ein — gleich wie? */
function fuehrtModulEin(file, modul) {
  for (const quelle of importQuellen(file.code)) {
    if (aufgeloesteQuelle(file.path, quelle).includes(modul)) return true;
  }
  return false;
}

/** Führt diese Datei das Prüfmodul ein — gleich wie? */
function fuehrtPruefmodulEin(file) {
  return fuehrtModulEin(file, VERSION_CHECKER_FILE);
}

/**
 * Die Namen, die eine Datei aus dem Prüfmodul einführt — **exportierter** Name
 * und lokaler Name getrennt.
 *
 * Der exportierte Name wird gegen die Erlaubnisliste gehalten: `import
 * { createVersionChecker as bauen }` führt weiterhin `createVersionChecker`
 * ein, und der Leser findet den Aufruf trotzdem, weil er den **lokalen** Namen
 * mitnimmt. Eine Namensraumeinfuhr (`import * as v`) trägt den Namen `*` und
 * steht in keiner Liste — sie ist damit rot und nicht still.
 */
function einfuhrenDesModuls(file, modul) {
  const exportiert = new Set();
  const lokal = new Map();
  const baum = lesbarerBaum(file.source, file.path);
  for (const anweisung of baum.statements) {
    if (!ts.isImportDeclaration(anweisung)) continue;
    if (!ts.isStringLiteral(anweisung.moduleSpecifier)) continue;
    if (!aufgeloesteQuelle(file.path, anweisung.moduleSpecifier.text).includes(modul)) {
      continue;
    }
    const klausel = anweisung.importClause;
    if (klausel === undefined) {
      exportiert.add('<Nebenwirkung>');
      continue;
    }
    if (klausel.name !== undefined) exportiert.add('default');
    const bindungen = klausel.namedBindings;
    if (bindungen === undefined) continue;
    if (ts.isNamespaceImport(bindungen)) {
      exportiert.add('*');
      continue;
    }
    for (const element of bindungen.elements) {
      const aussen = (element.propertyName ?? element.name).text;
      exportiert.add(aussen);
      if (!lokal.has(aussen)) lokal.set(aussen, new Set());
      lokal.get(aussen).add(element.name.text);
    }
  }
  return { exportiert, lokal, baum };
}

/** Die Einfuhren des Prüfmoduls — der Sonderfall, den 6b und 6c brauchen. */
function einfuhrenDesPruefmoduls(file) {
  return einfuhrenDesModuls(file, VERSION_CHECKER_FILE);
}

/**
 * 6a: die Einfuhrlisten der **Entscheidungsmodule**, beide Richtungen.
 *
 * Seit T-335 läuft der Leser über {@link DECISION_MODULES} und nicht mehr über
 * eine Datei. Die Schleife ist dieselbe; die **Menge**, über die sie läuft, ist
 * an der Anforderung aufgespannt und nicht am Modul, das der Schreiber kannte.
 */
function findeVerbraucherDerEntscheidungsmodule(files) {
  const findings = [];
  for (const [modul, { was, dativ, verbraucher }] of DECISION_MODULES) {
    /*
     * Die Untergrenze zuerst, und sie ist dieselbe wie überall: Über einem
     * Modul, das nicht im Baum liegt, führt niemand etwas ein — und jede
     * Aussage über seine Verbraucher wäre leer und damit wahr.
     */
    if (!files.some((file) => file.path === modul)) {
      findings.push(
        `${modul}: ${was} liegt nicht im gelesenen Baum — dann führt es niemand ein, und 6a mißt über diesem Modul nichts (A-A-105)`,
      );
      continue;
    }
    for (const file of files) {
      if (file.path === modul) continue;
      if (!traegtTypescript(file.path)) continue;
      if (file.path.startsWith(VERSION_FEATURE_PREFIX)) continue; // das messen Gestalt 4 und 5
      if (!fuehrtModulEin(file, modul)) continue;
      const erlaubt = verbraucher.get(file.path);
      if (erlaubt === undefined) {
        findings.push(
          `${file.path}: führt ${was} ein und steht nicht unter den ${verbraucher.size} festgenagelten Verbrauchern — wer über die ausgehende Anfrage entscheiden kann, steht in einer Liste (A-A-105)`,
        );
        continue;
      }
      for (const name of einfuhrenDesModuls(file, modul).exportiert) {
        if (erlaubt.has(name)) continue;
        findings.push(
          `${file.path}: führt \`${name}\` aus ${dativ} ein — nicht in der festgenagelten Menge dieser Datei (A-A-105a)`,
        );
      }
    }
    for (const [pfad, erlaubt] of verbraucher) {
      const traeger = files.find((file) => file.path === pfad);
      if (traeger === undefined) {
        findings.push(
          `${pfad}: die festgenagelte Verdrahtungsdatei liegt nicht im gelesenen Baum — über einer nicht gelesenen Datei ist jede Aussage über die Verdrahtung wahr`,
        );
        continue;
      }
      const eingefuehrt = einfuhrenDesModuls(traeger, modul).exportiert;
      for (const name of erlaubt) {
        if (eingefuehrt.has(name)) continue;
        findings.push(
          `${pfad}: die festgenagelte Einfuhr \`${name}\` kommt nicht mehr vor — die Liste ist zu bestätigen, nicht nachzuziehen`,
        );
      }
    }
  }
  return findings;
}

/**
 * Die Zweige einer Streuung, die dieser Leser versteht: ein Objektliteral oder
 * eine Bedingung über zwei Objektliteralen.
 *
 * Genau diese Form steht heute zweimal in `composition.ts`
 * (`...(options.releaseSource === undefined ? {} : { source: … })`), und sie ist
 * lesbar, weil beide Zweige ihre Schlüssel zeigen. Alles andere — eine
 * Streuung aus einer Variablen, aus einem Aufruf, aus einer Verkettung — ist ein
 * **Meßfehlschlag** und kein leerer Fund.
 */
function bedingteObjektzweige(ausdruck) {
  const ohneKlammern = (knoten) =>
    ts.isParenthesizedExpression(knoten) ? ohneKlammern(knoten.expression) : knoten;
  const kern = ohneKlammern(ausdruck);
  if (ts.isObjectLiteralExpression(kern)) return [kern];
  if (!ts.isConditionalExpression(kern)) return null;
  const zweige = [ohneKlammern(kern.whenTrue), ohneKlammern(kern.whenFalse)];
  return zweige.every((zweig) => ts.isObjectLiteralExpression(zweig)) ? zweige : null;
}

/** 6b: das Aufrufobjekt — festgenagelte Schlüssel, festgenagelte Wertform. */
function pruefeAufrufobjekt(files) {
  const findings = [];
  const gesehene = new Set();
  let aufrufe = 0;

  for (const file of files) {
    if (file.path === VERSION_CHECKER_FILE) continue;
    if (!traegtTypescript(file.path)) continue;
    if (!file.code.includes(CHECKER_FACTORY)) continue;
    const { lokal, baum } = einfuhrenDesPruefmoduls(file);
    const namen = lokal.get(CHECKER_FACTORY);
    if (namen === undefined) continue;

    const besuche = (knoten) => {
      if (ts.isCallExpression(knoten) && ts.isIdentifier(knoten.expression) && namen.has(knoten.expression.text)) {
        aufrufe += 1;
        const [argument] = knoten.arguments;
        if (knoten.arguments.length !== 1 || argument === undefined || !ts.isObjectLiteralExpression(argument)) {
          findings.push(
            `${file.path}: das Aufrufobjekt von \`${CHECKER_FACTORY}\` ist kein Objektliteral (${argument === undefined ? 'kein Argument' : ts.SyntaxKind[argument.kind]}) — die Schlüsselmenge steht dann woanders, und dieser Leser hat nichts gemessen`,
          );
        } else {
          findings.push(...pruefeSchluessel(file, argument, gesehene));
        }
      }
      ts.forEachChild(knoten, besuche);
    };
    ts.forEachChild(baum, besuche);
  }

  if (aufrufe !== 1) {
    findings.push(
      `der Prüfer wird im gelesenen Baum ${String(aufrufe)}-mal gebaut, erwartet ist genau einmal — zwei Prüfer sind zwei Takte, und welcher davon startet, liest dieser Leser nicht (A-A-105a)`,
    );
  }
  for (const name of CHECKER_CALL_KEYS.keys()) {
    if (gesehene.has(name)) continue;
    findings.push(
      `der festgenagelte Schlüssel \`${name}\` kommt in der Verdrahtung nicht mehr vor — die Liste ist zu bestätigen, nicht nachzuziehen (A-A-105a)`,
    );
  }
  return findings;
}

function pruefeSchluessel(file, objekt, gesehene) {
  const findings = [];
  const nimm = (eigenschaft) => {
    const istZuweisung = ts.isPropertyAssignment(eigenschaft);
    const istKurz = ts.isShorthandPropertyAssignment(eigenschaft);
    if (!istZuweisung && !istKurz) {
      findings.push(
        `${file.path}: das Aufrufobjekt trägt ein Mitglied, das dieser Leser nicht als einfache Zuweisung liest (${ts.SyntaxKind[eigenschaft.kind]})`,
      );
      return;
    }
    const name = eigenschaft.name;
    if (!ts.isIdentifier(name) && !ts.isStringLiteral(name)) {
      findings.push(
        `${file.path}: das Aufrufobjekt trägt ein Mitglied, das dieser Leser nicht als einfache Zuweisung liest (${ts.SyntaxKind[name.kind]})`,
      );
      return;
    }
    gesehene.add(name.text);
    const erlaubt = CHECKER_CALL_KEYS.get(name.text);
    if (erlaubt === undefined) {
      findings.push(
        `${file.path}: das Aufrufobjekt trägt den Schlüssel \`${name.text}\` — festgenagelt sind ${[...CHECKER_CALL_KEYS.keys()].join('/')}; über einen fremden Schlüssel entscheidet ein Wert aus dem Bestand, ob und wann die Anfrage hinausgeht (A-A-105a)`,
      );
      return;
    }
    const wert = istKurz ? name : eigenschaft.initializer;
    if (!erlaubt.formen.includes(wert.kind)) {
      findings.push(
        `${file.path}: der Schlüssel \`${name.text}\` trägt ${ts.SyntaxKind[wert.kind]} statt ${erlaubt.satz} — der Wert entsteht damit an der Verdrahtung und nicht vor ihr (A-A-105a)`,
      );
    }
  };

  for (const eigenschaft of objekt.properties) {
    if (ts.isSpreadAssignment(eigenschaft)) {
      const zweige = bedingteObjektzweige(eigenschaft.expression);
      if (zweige === null) {
        findings.push(
          `${file.path}: das Aufrufobjekt streut ${ts.SyntaxKind[eigenschaft.expression.kind]} ein — dieser Leser liest nur ein Objektliteral oder eine Bedingung über zweien und hat die Schlüsselmenge damit nicht gemessen`,
        );
        continue;
      }
      for (const zweig of zweige) for (const inneres of zweig.properties) nimm(inneres);
      continue;
    }
    nimm(eigenschaft);
  }
  return findings;
}

/**
 * Die Namen der Mitglieder, die in dieser Datei einen aus `modul` eingeführten
 * Typ tragen — **aus der Deklaration gelesen** und nicht in diesen Lauf
 * geschrieben.
 *
 * Wer das Feld umbenennt, wird nicht grün, sondern mitgenommen. Findet der
 * Leser kein solches Mitglied oder mehrere, sagt er, daß er nichts weiß —
 * dieselbe Regel wie bei `extends` und bei einem nicht aufgelösten Alias.
 */
function feldnamenMitTyp(datei, modul, typ) {
  const { lokal, baum } = einfuhrenDesModuls(datei, modul);
  const typnamen = lokal.get(typ) ?? new Set();
  const treffer = [];
  const mitglieder = (liste) => {
    for (const mitglied of liste) {
      if (!ts.isPropertySignature(mitglied) || mitglied.type === undefined) continue;
      if (!ts.isTypeReferenceNode(mitglied.type) || !ts.isIdentifier(mitglied.type.typeName)) continue;
      if (!typnamen.has(mitglied.type.typeName.text)) continue;
      if (ts.isIdentifier(mitglied.name)) treffer.push(mitglied.name.text);
    }
  };
  const besuche = (knoten) => {
    if (ts.isInterfaceDeclaration(knoten)) mitglieder(knoten.members);
    if (ts.isTypeLiteralNode(knoten)) mitglieder(knoten.members);
    ts.forEachChild(knoten, besuche);
  };
  ts.forEachChild(baum, besuche);
  return treffer;
}

/**
 * Der Name, unter dem der Prüfer weitergegeben wird — **aus der Deklaration
 * gelesen** und nicht in diesen Lauf geschrieben.
 */
function feldnameDesPruefers(verdrahtung) {
  return feldnamenMitTyp(verdrahtung, VERSION_CHECKER_FILE, CHECKER_TYPE);
}

/** Der Grund, warum ein Aufruf nicht unbedingt im Rumpf der Startfunktion steht. */
function bedingungUeber(knoten) {
  let ebenen = 0;
  let lauf = knoten.parent;
  while (lauf !== undefined && !ts.isSourceFile(lauf)) {
    if (VERZWEIGENDE_ARTEN.has(lauf.kind)) return `in einer Bedingung (${ts.SyntaxKind[lauf.kind]})`;
    if (
      ts.isBinaryExpression(lauf) &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(lauf.operatorToken.kind)
    ) {
      return `in einer Bedingung (${ts.SyntaxKind[lauf.operatorToken.kind]})`;
    }
    if (FUNKTIONSARTEN.has(lauf.kind)) {
      ebenen += 1;
      if (ebenen > 1) {
        return `in einer verschachtelten Funktion (${String(ebenen)} Ebenen) — ob die gerufen wird, liest dieser Leser nicht`;
      }
    }
    lauf = lauf.parent;
  }
  return null;
}

/** 6c: `start()` steht genau einmal, gerufen, und unbedingt. */
function pruefeStartDesPruefers(files) {
  const findings = [];
  const verdrahtungen = [...VERSION_MODULE_CONSUMERS.keys()]
    .map((pfad) => files.find((file) => file.path === pfad))
    .filter((file) => file !== undefined && file.code.includes(CHECKER_FACTORY));
  const [verdrahtung] = verdrahtungen;
  if (verdrahtung === undefined) {
    // Der Fehlschlag steht schon in 6a und 6b; hier wäre er der dritte Satz
    // über dieselbe Tatsache.
    return findings;
  }
  const felder = feldnameDesPruefers(verdrahtung);
  if (felder.length !== 1) {
    findings.push(
      `${verdrahtung.path}: ${String(felder.length)} Mitglied(er) tragen den Typ \`${CHECKER_TYPE}\` — dieser Leser weiß dann nicht, unter welchem Namen der Prüfer weitergegeben wird (A-A-105b)`,
    );
    return findings;
  }
  const [feld] = felder;

  const startdatei = files.find((file) => file.path === CHECKER_START_FILE);
  if (startdatei === undefined) {
    findings.push(
      `${CHECKER_START_FILE}: die Startdatei liegt nicht im gelesenen Baum — über ihr ist „\`start()\` steht genau einmal" leer und damit wahr`,
    );
    return findings;
  }

  const baum = lesbarerBaum(startdatei.source, startdatei.path);
  const lokaleNamen = new Set();
  const zugriffe = [];
  let erreicht = false;

  const besuche = (knoten) => {
    if (ts.isBindingElement(knoten) && ts.isObjectBindingPattern(knoten.parent)) {
      const aussen = knoten.propertyName ?? knoten.name;
      if (ts.isIdentifier(aussen) && aussen.text === feld) {
        erreicht = true;
        if (ts.isIdentifier(knoten.name)) lokaleNamen.add(knoten.name.text);
      }
    }
    if (ts.isPropertyAccessExpression(knoten)) {
      if (knoten.name.text === feld) {
        erreicht = true;
        if (ts.isPropertyAccessExpression(knoten.parent)) zugriffe.push(knoten.parent);
      } else if (ts.isIdentifier(knoten.expression) && lokaleNamen.has(knoten.expression.text)) {
        zugriffe.push(knoten);
      }
    }
    ts.forEachChild(knoten, besuche);
  };
  ts.forEachChild(baum, besuche);

  if (!erreicht) {
    findings.push(
      `${CHECKER_START_FILE}: nennt das Feld \`${feld}\` nicht — dann startet den Prüfer hier niemand, oder die Naht ist umgezogen und zu bestätigen (A-A-105b)`,
    );
    return findings;
  }

  const gezaehlt = new Map();
  for (const zugriff of zugriffe) {
    const name = zugriff.name.text;
    if (!CHECKER_MEMBERS.has(name)) {
      findings.push(
        `${CHECKER_START_FILE}: am Prüfer wird \`${name}\` gerufen — festgenagelt sind ${[...CHECKER_MEMBERS].join(' und ')} (A-A-105b)`,
      );
      continue;
    }
    if (!gezaehlt.has(name)) gezaehlt.set(name, []);
    gezaehlt.get(name).push(zugriff);
  }

  for (const name of CHECKER_MEMBERS) {
    const stellen = gezaehlt.get(name) ?? [];
    if (stellen.length !== 1) {
      findings.push(
        `${CHECKER_START_FILE}: \`${name}()\` steht ${String(stellen.length)}-mal, genau einmal ist die Zusage (A-A-105b)`,
      );
      continue;
    }
    if (name !== 'start') continue;
    const [stelle] = stellen;
    const ruf = stelle.parent;
    if (!ts.isCallExpression(ruf) || ruf.expression !== stelle) {
      findings.push(
        `${CHECKER_START_FILE}: \`start\` wird als Wert weitergereicht statt gerufen — wo es dann gerufen wird, liest dieser Leser nicht (A-A-105b)`,
      );
      continue;
    }
    if (stelle.questionDotToken !== undefined || ruf.questionDotToken !== undefined) {
      findings.push(
        `${CHECKER_START_FILE}: \`start()\` steht nicht unbedingt im Rumpf der Startfunktion — hinter einer Optionsverkettung (A-A-105b)`,
      );
      continue;
    }
    const grund = bedingungUeber(ruf);
    if (grund !== null) {
      findings.push(
        `${CHECKER_START_FILE}: \`start()\` steht nicht unbedingt im Rumpf der Startfunktion — ${grund} (A-A-105b)`,
      );
    }
  }
  return findings;
}

/** 6d: keine Datenbankmarke in einer Datei, die den Prüfer verdrahtet. */
function findeDatenbankgriffInDerVerdrahtung(files) {
  const findings = [];
  const orte = new Set([CHECKER_START_FILE]);
  for (const file of files) {
    if (!traegtTypescript(file.path)) continue;
    if (file.path === VERSION_CHECKER_FILE) continue;
    if (file.path.startsWith(VERSION_FEATURE_PREFIX)) continue;
    if (file.code.includes(CHECKER_FACTORY) && fuehrtPruefmodulEin(file)) orte.add(file.path);
  }
  for (const file of files) {
    if (!orte.has(file.path)) continue;
    for (const marker of DATABASE_MARKERS) {
      if (!file.code.includes(marker)) continue;
      findings.push(
        `${file.path}: verdrahtet den Prüfer und faßt mit \`${marker}\` eine Datenbank unmittelbar an — der Wert, der über die ausgehende Anfrage entscheidet, entstünde in derselben Datei (A-A-105c)`,
      );
    }
  }
  return findings;
}

// 6e und 6f: die Tür, durch die ein Port hereinkommt (T-335, A-A-105d)

/**
 * 6e und 6f zusammen, weil die zweite ohne die erste nichts wüßte.
 *
 * ===========================================================================
 * Die Frage
 * ===========================================================================
 *
 * 6a nagelt fest, **wer** das Quellmodul einführen darf. Das genügt nicht:
 * Strukturelle Typisierung braucht keinen Import. Ein Objekt mit einem
 * `latest(signal)` **ist** ein `ReleaseSourcePort`, auch wenn die Datei, die es
 * baut, den Namen nie schreibt — und `main.ts` darf den Typ einführen, es steht
 * in der Liste. Der Weg bliebe offen, und zwar genau der aus T-331 Z-1.
 *
 * Also wird die andere Hälfte gemessen: nicht wer den Typ **kennt**, sondern
 * wodurch ein Wert dieses Typs in den Zusammenbau **kommt**.
 *
 * ===========================================================================
 * 6e — wie viele Türen gibt es
 * ===========================================================================
 *
 * In jeder Datei, die `ReleaseSourcePort` einführt, trägt **genau ein**
 * Mitglied diesen Typ. Der Name dieses Mitglieds ist die Tür, und er kommt aus
 * der Deklaration ({@link feldnamenMitTyp}) und nicht aus dieser Datei — wer
 * `releaseSource` umbenennt, wird mitgenommen und nicht grün. Zwei Mitglieder
 * wären zwei Türen, null wäre ein Leser, der nichts weiß; beides ist ein
 * Befund und kein leerer Fund.
 *
 * ===========================================================================
 * 6f — was durch die Tür kommt
 * ===========================================================================
 *
 * An jedem Aufruf von `compose(` und `main(` im gelesenen Baum, dessen Argument
 * ein Objektliteral ist: Trägt es den Türnamen, dann trägt der Wert die Form
 * `<Bezeichner>.<Türname>` und nichts anderes. Ein **Aufruf** dort
 * (`releaseSource: quelleAusDemBestand(…)`, T-331 Z-1) ist ein Wert, der an der
 * Naht entsteht statt vor ihr; ein **örtlicher Bezeichner** ebenso.
 *
 * Und die Untergrenze, ohne die die Obergrenze nichts wäre: Der Türname kommt
 * an mindestens einer Naht vor. Eine Liste, die ins Leere zeigt, bewacht nichts
 * (T-249-1).
 *
 * ===========================================================================
 * Was 6f **nicht** mißt, und es gehört hierher
 * ===========================================================================
 *
 *  - **Woher `<Bezeichner>.<Türname>` seinerseits kommt.** Heute ist es das
 *    Optionsobjekt der umschließenden Funktion, und `apps/local-api/src/index.ts`
 *    wie `apps/desktop/sidecar/entry.ts` rufen `main()` **ohne Argument** —
 *    damit ist die Tür im Erzeugnis geschlossen. Daß sie es ist, mißt dieser
 *    Satz: Ein Objektliteral an einer dieser beiden Stellen mit dem Türnamen
 *    darin wird rot. Daß der **Aufrufer** des Aufrufers nichts einsetzt, mißt
 *    er nicht — dort ist kein Aufrufer mehr, sondern die Laufzeit.
 *  - **Eine Naht, die nicht `compose` oder `main` heißt.** Wer eine dritte
 *    Fabrik baut, die einen Port entgegennimmt, schreibt sie in
 *    {@link DECISION_SEAMS}. Der Leser findet sie nicht von selbst; was ihn eng
 *    hält, ist 6a — der Typ kommt aus einem Modul mit einer Verbraucherliste.
 */
function pruefeTuerenDesPorts(files) {
  const findings = [];
  const modul = RELEASE_SOURCE_FILE;
  if (!files.some((file) => file.path === modul)) {
    // 6a sagt das bereits mit seinem eigenen Satz; ein zweiter darüber wäre
    // derselbe Befund zweimal.
    return findings;
  }

  const tueren = new Set();
  for (const pfad of DECISION_MODULES.get(modul).verbraucher.keys()) {
    const datei = files.find((file) => file.path === pfad);
    if (datei === undefined) continue; // 6a hat den Satz dazu
    const namen = feldnamenMitTyp(datei, modul, RELEASE_SOURCE_TYPE);
    if (namen.length !== 1) {
      findings.push(
        `${pfad}: ${String(namen.length)} Mitglied(er) tragen den Typ \`${RELEASE_SOURCE_TYPE}\` — dieser Leser weiß dann nicht, durch welche Tür der Port hereinkommt (A-A-105d)`,
      );
      continue;
    }
    tueren.add(namen[0]);
  }
  if (tueren.size === 0) return findings;

  /*
   * Die Untergrenze der Nähte, und sie ist dieselbe wie überall: Eine Naht, die
   * ihre eigene Datei nicht mehr deklariert, ist umgezogen — und eine Liste,
   * die ins Leere zeigt, bewacht nichts (T-249-1).
   */
  for (const [naht, wo] of DECISION_SEAMS) {
    const traeger = files.find((file) => file.path === wo);
    if (traeger !== undefined && new RegExp(`export\\s+(async\\s+)?function\\s+${naht}\\b`).test(traeger.code)) {
      continue;
    }
    findings.push(
      `${wo}: die Naht \`${naht}\` wird hier nicht (mehr) deklariert — die Liste der Nähte ist zu bestätigen, nicht nachzuziehen (A-A-105d)`,
    );
  }

  let gesehen = 0;
  for (const file of files) {
    if (!traegtTypescript(file.path)) continue;
    if (![...DECISION_SEAMS.keys()].some((naht) => file.code.includes(`${naht}(`))) continue;
    /*
     * Welche **örtlichen** Namen zeigen auf eine Naht? Nur ein Bezeichner, der
     * aus der deklarierenden Datei eingeführt ist (oder in ihr selbst steht),
     * ist diese Naht. Ein gleichnamiger Nachbar ist ein gleichnamiger Nachbar.
     */
    const nahtnamen = new Map();
    for (const [naht, wo] of DECISION_SEAMS) {
      if (file.path === wo) nahtnamen.set(naht, naht);
      for (const oertlich of einfuhrenDesModuls(file, wo).lokal.get(naht) ?? []) {
        nahtnamen.set(oertlich, naht);
      }
    }
    if (nahtnamen.size === 0) continue;
    const baum = lesbarerBaum(file.source, file.path);
    const besuche = (knoten) => {
      if (ts.isCallExpression(knoten) && ts.isIdentifier(knoten.expression) && nahtnamen.has(knoten.expression.text)) {
        const [argument] = knoten.arguments;
        if (argument !== undefined && !ts.isObjectLiteralExpression(argument)) {
          /*
           * Ein Argument, das kein Objektliteral ist, heißt: Die Schlüsselmenge
           * steht woanders. Das ist ein **Meßfehlschlag** und kein leerer Fund
           * — dieselbe Regel wie beim Aufrufobjekt des Prüfers.
           */
          findings.push(
            `${file.path}: \`${nahtnamen.get(knoten.expression.text)}(\` bekommt ${ts.SyntaxKind[argument.kind]} statt eines Objektliterals — ob ein Port durch die Tür kommt, liest dieser Leser dann nicht (A-A-105d)`,
          );
        } else if (argument !== undefined) {
          /*
           * Die Streuung wird mitgelesen, und sie ist heute die **einzige**
           * Form, in der die Tür vorkommt: `...(options.releaseSource ===
           * undefined ? {} : { releaseSource: options.releaseSource })`. Wer sie
           * überspringt, mißt an der gebauten Stelle nichts — und genau das war
           * der erste Lauf dieser Gestalt (T-335, beim Bauen gefunden).
           */
          const nimm = (objekt) => {
            for (const eigenschaft of objekt.properties) {
              if (ts.isSpreadAssignment(eigenschaft)) {
                for (const zweig of bedingteObjektzweige(eigenschaft.expression) ?? []) nimm(zweig);
                continue;
              }
              const name = eigenschaft.name;
              if (name === undefined || (!ts.isIdentifier(name) && !ts.isStringLiteral(name))) continue;
              if (!tueren.has(name.text)) continue;
              gesehen += 1;
              const wert = ts.isShorthandPropertyAssignment(eigenschaft)
                ? name
                : ts.isPropertyAssignment(eigenschaft)
                  ? eigenschaft.initializer
                  : undefined;
              const passt =
                wert !== undefined &&
                ts.isPropertyAccessExpression(wert) &&
                ts.isIdentifier(wert.expression) &&
                wert.name.text === name.text;
              if (!passt) {
                findings.push(
                  `${file.path}: die Tür \`${name.text}\` an \`${nahtnamen.get(knoten.expression.text)}(\` trägt ${wert === undefined ? ts.SyntaxKind[eigenschaft.kind] : ts.SyntaxKind[wert.kind]} statt \`<Bezeichner>.${name.text}\` — der Port entstünde damit an der Naht und nicht vor ihr (A-A-105d)`,
                );
              }
            }
          };
          nimm(argument);
        }
      }
      ts.forEachChild(knoten, besuche);
    };
    ts.forEachChild(baum, besuche);
  }

  if (gesehen === 0) {
    findings.push(
      `die Tür \`${[...tueren].join('/')}\` kommt an keiner der Nähte ${[...DECISION_SEAMS.keys()].join('/')} mehr vor — die Liste ist zu bestätigen, nicht nachzuziehen (A-A-105d)`,
    );
  }
  return findings;
}

// 6g: die Warteliste und der Adapter dahinter (T-335, A-A-105e)

/**
 * Die Anweisungen eines Knotens, ohne Prosa und ohne Einrückung.
 *
 * Gelesen wird mit dem **Scanner** und nicht mit dem Drucker: Der Drucker
 * formatiert, und seine Ausgabe hängt an der Fassung von TypeScript; der
 * Scanner gibt Zeichen zurück, und ein Bezeichner bleibt ein Bezeichner. Was
 * herausfällt, sind Kommentare, Zeilenumbrüche und Leerraum — also genau das,
 * was sich ändern darf, ohne daß sich etwas ändert.
 */
function anweisungstext(text) {
  const scanner = ts.createScanner(ts.ScriptTarget.ES2022, false, ts.LanguageVariant.Standard, text);
  const teile = [];
  for (;;) {
    const art = scanner.scan();
    if (art === ts.SyntaxKind.EndOfFileToken) break;
    if (
      art === ts.SyntaxKind.SingleLineCommentTrivia ||
      art === ts.SyntaxKind.MultiLineCommentTrivia ||
      art === ts.SyntaxKind.WhitespaceTrivia ||
      art === ts.SyntaxKind.NewLineTrivia
    ) {
      continue;
    }
    teile.push(scanner.getTokenText());
  }
  return teile.join(' ');
}

/** Wie der Gewartete heißt — ein Aufruf, ein Feldaufruf, oder seine Art. */
function nameDesGewarteten(ausdruck) {
  if (ts.isCallExpression(ausdruck)) {
    if (ts.isIdentifier(ausdruck.expression)) return ausdruck.expression.text;
    if (ts.isPropertyAccessExpression(ausdruck.expression)) {
      const links = ausdruck.expression.expression;
      return `${ts.isIdentifier(links) ? links.text : '…'}.${ausdruck.expression.name.text}`;
    }
  }
  if (ts.isIdentifier(ausdruck)) return ausdruck.text;
  return `<${ts.SyntaxKind[ausdruck.kind]}>`;
}

/**
 * 6g-1: **Worauf der Prüfer im Rumpf der ausgehenden Anfrage wartet.**
 *
 * Die Begründung steht bei {@link CHECKER_AWAITED_BESIDES_REQUEST}. Gemessen
 * wird im Rumpf **derselben** Funktion, in der die Anfrage steht, und seit
 * T-349 im **ganzen** Rumpf statt nur lexikalisch davor.
 *
 * Der Satz, der bis T-349 hier stand — „was danach wartet, kann die Anfrage
 * nicht mehr verhindern" —, war richtig und zu kurz: Ein `await`, das nach der
 * Anfrage nie eintrifft, verhindert zwar diese eine Anfrage nicht, hält aber
 * `inFlight` auf wahr, stellt keinen Zeitgeber und beendet damit **jede
 * weitere**. Für einen Ausschalter ist das dasselbe Ergebnis, eine Zeile
 * später.
 *
 * Sechs Sätze, und die letzten drei sind seit T-360 dazugekommen (Befunde
 * T-356 und T-357 R-4):
 *
 *  - ein `await` im Rumpf, das nicht die Anfrage ist (Obergrenze);
 *  - ein festgenagelter Name, der nicht mehr vorkommt (die zweite Richtung —
 *    heute ist die Menge leer, und dieser Satz ist damit unerreichbar; er
 *    bleibt stehen, weil ein künftiger Eintrag ihn sofort wieder braucht);
 *  - die Anfrage selbst steht unter keinem `await` (**Untergrenze**). Ohne
 *    diesen dritten wäre der Leser über einer leeren Erlaubnisliste stumm und
 *    grün;
 *  - **der Weg dorthin ist nicht zu finden** (die zweite Untergrenze, T-360);
 *  - **ein Glied des Weges wartet** auf etwas, das nicht das nächste Glied ist;
 *  - **auf dem Weg steht eine Schleife** — der Riegel ohne `await` (A-A-125).
 *
 * Die drei neuen stehen hier und nicht in einem eigenen Leser, weil sie
 * dieselbe Anforderung messen wie die drei alten und dieselbe Herleitung
 * brauchen: welcher Aufruf die Anfrage ist und in welchem Rumpf er steht. Zwei
 * Leser mit derselben Herleitung sind die Bauart, an der `proof:callers` schon
 * einmal blind war (A-A-40).
 */
/**
 * Die Arten, mit denen ein Rumpf stehenbleibt, **ohne je zu warten** (A-A-125).
 *
 * Die Achse von 6g-1 ist das `await`. Ein Riegel braucht keines: `const bis =
 * Date.now() + 86_400_000; while (Date.now() < bis) {}` friert die
 * Ereignisschleife ein, und dieser Lauf war dagegen **154/0 grün** bei `tsc`
 * Exit 0 (T-357 R-4, in T-360 nachgestellt). In seiner leisen Fassung — derselbe
 * Riegel in `remember` statt in `run`, 150 ms statt einem Tag — sinken die
 * ausgehenden Anfragen am Modul gemessen von **40 auf 3**, und das Protokoll
 * bleibt **leer** (T-360, M-G3).
 *
 * Was diese fünf Arten fangen, ist die **Schleife**. Was sie nicht fangen,
 * steht in der Lückenliste bei {@link checkNoStoreReadback} und ist der Grund,
 * warum diese Menge keine Schließung der Klasse behauptet: Ein synchron
 * blockierender **fremder** Aufruf hat in diesem Modul keine Schleife, sondern
 * einen Namen — und wo dieser Name herkommt, messen andere Sätze (6a, 6i, 6g-2)
 * oder niemand (`now`, `logger`, der Rumpf eines fremden Pakets).
 */
const SCHLEIFEN_ARTEN = new Set([
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
]);

/**
 * Die örtlichen Funktionen einer Datei, über ihren Namen — Deklaration **und**
 * Bindung an einen Bezeichner.
 *
 * Beides, weil beides dasselbe ist, sobald jemand es ruft: `function run()` und
 * `const run = async () => {}` unterscheiden sich für den Weg zur Anfrage in
 * nichts. Ein Name, der **zweimal** gebunden ist, bekommt beide Knoten; welcher
 * gemeint ist, entscheidet dieser Leser nicht, sondern er geht beide — die
 * sichere Richtung ist hier „zuviel gemessen", nicht „die falsche Hälfte
 * gemessen".
 */
function oertlicheFunktionen(baum) {
  const namen = new Map();
  const merke = (name, knoten) => {
    const vorhanden = namen.get(name);
    if (vorhanden === undefined) namen.set(name, [knoten]);
    else vorhanden.push(knoten);
  };
  const geh = (knoten) => {
    if (ts.isFunctionDeclaration(knoten) && knoten.name !== undefined) {
      merke(knoten.name.text, knoten);
    } else if (
      ts.isVariableDeclaration(knoten) &&
      ts.isIdentifier(knoten.name) &&
      knoten.initializer !== undefined &&
      (ts.isArrowFunction(knoten.initializer) || ts.isFunctionExpression(knoten.initializer))
    ) {
      merke(knoten.name.text, knoten.initializer);
    }
    ts.forEachChild(knoten, geh);
  };
  ts.forEachChild(baum, geh);
  return namen;
}

/**
 * Welche örtlichen Namen ein Rumpf ruft, und mit welchen Aufrufen.
 *
 * Gelesen wird der **ganze** Rumpf, einschließlich verschachtelter Funktionen.
 * Das meldet mehr, als synchron durchlaufen wird — ein Aufruf in einem
 * Rückruf, der nie ausgelöst wird, zählt hier mit. Die Richtung ist Absicht und
 * dieselbe wie bei Regel G in `proof:surface`: Ein Weg, den es nicht gibt,
 * kostet eine Bestätigung; ein Weg, den dieser Leser nicht sieht, kostet die
 * Versionsprüfung.
 */
function oertlicheAufrufe(knoten, namen) {
  const treffer = new Map();
  const geh = (k) => {
    if (ts.isCallExpression(k) && ts.isIdentifier(k.expression) && namen.has(k.expression.text)) {
      const liste = treffer.get(k.expression.text);
      if (liste === undefined) treffer.set(k.expression.text, [k]);
      else liste.push(k);
    }
    ts.forEachChild(k, geh);
  };
  ts.forEachChild(knoten.body ?? knoten, geh);
  return treffer;
}

/** Die Rückrufe, die ein `setTimeout` in dieser Datei stellt — der geplante Eintritt. */
function zeitgeberRueckrufe(baum) {
  const rueckrufe = [];
  const geh = (knoten) => {
    if (
      ts.isCallExpression(knoten) &&
      ts.isIdentifier(knoten.expression) &&
      knoten.expression.text === 'setTimeout'
    ) {
      const [erstes] = knoten.arguments;
      if (erstes !== undefined && FUNKTIONSARTEN.has(erstes.kind)) rueckrufe.push(erstes);
    }
    ts.forEachChild(knoten, geh);
  };
  ts.forEachChild(baum, geh);
  return rueckrufe;
}

/**
 * Der kürzeste Weg von einem geplanten Eintritt zu dem Rumpf, in dem die
 * Anfrage steht — Glied für Glied, mit dem Aufruf, der jedes Glied trägt.
 *
 * Die Breitensuche gibt den **kürzesten** Weg; gäbe es zwei, wäre der zweite
 * eine zweite Bauart und nicht eine zweite Meinung. Heute ist er eingliedrig:
 * der Rückruf in `schedule` ruft `run`, und `run` trägt die Anfrage.
 */
function wegZuFunktion(baum, ziel) {
  const namen = oertlicheFunktionen(baum);
  const warteschlange = zeitgeberRueckrufe(baum).map((rueckruf) => [
    { name: '<Zeitgeberrückruf>', knoten: rueckruf, aufruf: null },
  ]);
  const gesehen = new Set(warteschlange.map((weg) => weg[0].knoten));
  while (warteschlange.length > 0) {
    const weg = warteschlange.shift();
    const letztes = weg[weg.length - 1];
    if (letztes.knoten === ziel) return weg;
    for (const [name, aufrufe] of oertlicheAufrufe(letztes.knoten, namen)) {
      for (const knoten of namen.get(name) ?? []) {
        if (gesehen.has(knoten)) continue;
        gesehen.add(knoten);
        warteschlange.push([...weg, { name, knoten, aufruf: aufrufe[0] }]);
      }
    }
  }
  return null;
}

/**
 * Jede örtliche Funktion, die von den Gliedern eines Weges aus gerufen wird —
 * mitsamt dem Weg selbst.
 *
 * Das ist die Menge, in der ein **synchroner** Riegel dieselbe Wirkung hat wie
 * einer im Eintritt: Was `run` ruft, läuft in derselben Runde der
 * Ereignisschleife. Gemessen (T-360): Der Riegel in `remember` ist von dem in
 * `run` am Ergebnis nicht zu unterscheiden — 3 statt 40 Anfragen, Protokoll
 * leer, Lauf grün.
 */
function synchronErreichbar(baum, weg) {
  const namen = oertlicheFunktionen(baum);
  const erreicht = new Map();
  const offen = weg.map((glied) => [glied.name, glied.knoten]);
  for (const [name, knoten] of offen) if (!erreicht.has(knoten)) erreicht.set(knoten, name);
  while (offen.length > 0) {
    const [, knoten] = offen.shift();
    for (const [name] of oertlicheAufrufe(knoten, namen)) {
      for (const ziel of namen.get(name) ?? []) {
        if (erreicht.has(ziel)) continue;
        erreicht.set(ziel, name);
        offen.push([name, ziel]);
      }
    }
  }
  return erreicht;
}

/** Die Schleifen im Rumpf eines Knotens — verschachtelte Funktionen mitgelesen. */
function schleifenIm(knoten) {
  const treffer = [];
  const geh = (k) => {
    if (SCHLEIFEN_ARTEN.has(k.kind)) treffer.push(k);
    ts.forEachChild(k, geh);
  };
  ts.forEachChild(knoten.body ?? knoten, geh);
  return treffer;
}

function pruefeWartenImRumpfDerAnfrage(files) {
  const findings = [];
  const datei = files.find((file) => file.path === VERSION_CHECKER_FILE);
  if (datei === undefined) return findings; // Gestalt 2 sagt das schon

  const baum = lesbarerBaum(datei.source, datei.path);
  const anfragen = [];
  const suche = (knoten) => {
    if (
      ts.isCallExpression(knoten) &&
      ts.isPropertyAccessExpression(knoten.expression) &&
      knoten.expression.name.text === RELEASE_SOURCE_MEMBER
    ) {
      anfragen.push(knoten);
    }
    ts.forEachChild(knoten, suche);
  };
  ts.forEachChild(baum, suche);

  if (anfragen.length !== 1) {
    findings.push(
      `${VERSION_CHECKER_FILE}: \`.${RELEASE_SOURCE_MEMBER}(\` steht ${String(anfragen.length)}-mal, genau einmal ist die Zusage — welcher Aufruf die ausgehende Anfrage ist, liest dieser Leser dann nicht (A-A-105e)`,
    );
    return findings;
  }
  const [anfrage] = anfragen;

  let rumpf = anfrage.parent;
  while (rumpf !== undefined && !FUNKTIONSARTEN.has(rumpf.kind)) rumpf = rumpf.parent;
  if (rumpf === undefined || rumpf.body === undefined) {
    findings.push(
      `${VERSION_CHECKER_FILE}: der Aufruf der Quelle steht in keinem Funktionsrumpf — dieser Leser hat die Warteliste nicht gemessen (A-A-105e)`,
    );
    return findings;
  }

  /*
   * `anfrageGewartet` ist die Untergrenze und wird deshalb an derselben
   * Durchquerung gewonnen wie die Obergrenze: Ein Leser, der die `await`-Stellen
   * dieses Rumpfes nicht findet, findet auch diese eine nicht — und meldet sich
   * dann, statt stumm grün zu sein.
   */
  let anfrageGewartet = false;
  const gewartet = new Set();
  const geh = (knoten) => {
    if (ts.isAwaitExpression(knoten)) {
      if (knoten.expression === anfrage) anfrageGewartet = true;
      else gewartet.add(nameDesGewarteten(knoten.expression));
    }
    ts.forEachChild(knoten, geh);
  };
  ts.forEachChild(rumpf.body, geh);

  const festgenagelt = [...CHECKER_AWAITED_BESIDES_REQUEST];
  const nachsatz =
    festgenagelt.length === 0
      ? 'auf dem Weg zur Anfrage und zurück wartet allein sie selbst, und sie trägt eine Frist (A-V-5)'
      : `festgenagelt ist ${festgenagelt.join('/')}`;
  for (const name of gewartet) {
    if (CHECKER_AWAITED_BESIDES_REQUEST.has(name)) continue;
    findings.push(
      `${VERSION_CHECKER_FILE}: der Prüfer wartet im Rumpf der ausgehenden Anfrage auf \`${name}\` — ${nachsatz}; eine Zusage, die nie eintrifft, ist stiller als jeder Fehlschlag (A-A-105e, A-A-106)`,
    );
  }
  for (const name of CHECKER_AWAITED_BESIDES_REQUEST) {
    if (gewartet.has(name)) continue;
    findings.push(
      `${VERSION_CHECKER_FILE}: das festgenagelte Warten auf \`${name}\` steht im Rumpf der Anfrage nicht mehr — die Liste ist zu bestätigen, nicht nachzuziehen (A-A-105e)`,
    );
  }
  if (!anfrageGewartet) {
    findings.push(
      `${VERSION_CHECKER_FILE}: die ausgehende Anfrage steht unter keinem \`await\` — dieser Leser mißt die Warteliste an ihr, und ohne sie mißt er nichts (A-A-105e, Untergrenze)`,
    );
  }

  /*
   * =========================================================================
   * Und dieselbe Frage am **Eintritt** statt am Rumpf (T-360, Befund T-356)
   * =========================================================================
   *
   * Alles oben mißt den Rumpf, **in dem** die Anfrage steht. Wer die Anfrage
   * eine Funktion tiefer schiebt, verschiebt diesen Rumpf mit — und stellt sein
   * hängendes `await` in den, den der Zeitgeber ruft. Gemessen (T-356, in T-360
   * nachgestellt): Anfrage in einer örtlichen Hilfsfunktion mit `return await
   * source.latest(…)`, `await new Promise<void>(() => {})` davor in `run()` —
   * `tsc` Exit 0, dieser Lauf **154/0 grün**, am Modul **0 statt 40**
   * ausgehenden Anfragen, Zustand `unknown`, **0** Protokollzeilen.
   *
   * Dieselbe Klasse wie T-332 K-1 und derselbe Fehler wie dort: Der Prüfsatz maß
   * die Stelle, die der Autor im Kopf hatte, statt die Anforderung. Die
   * Anforderung lautet nicht „in diesem Rumpf steht ein `await`", sondern
   * **„vom geplanten Eintritt bis zur Anfrage steht nichts still"**.
   *
   * Gemessen wird deshalb der **Weg**: vom Rückruf, den ein `setTimeout` stellt,
   * über jeden örtlichen Aufruf bis zu dem Rumpf, in dem die Anfrage steht. Auf
   * jedem Glied davor darf genau ein `await` stehen — das, welches das nächste
   * Glied trägt. Jedes weitere ist derselbe Ausschalter, eine Funktion höher.
   *
   * Die **Untergrenze** steht dabei in der Regel und nicht daneben: Findet
   * dieser Leser den Weg nicht, sagt er es. Ein Weg, den niemand findet, ist
   * über jedem stummen Leser wahr — dieselbe Lehre wie bei der leeren
   * Warteliste oben.
   */
  const weg = wegZuFunktion(baum, rumpf);
  if (weg === null) {
    findings.push(
      `${VERSION_CHECKER_FILE}: der Rumpf mit der ausgehenden Anfrage wird von keinem \`setTimeout\`-Rückruf aus erreicht — dieser Leser mißt den Weg vom geplanten Eintritt bis zur Anfrage, und ohne ihn mißt er nur einen Rumpf, den sich der Bestand aussuchen kann (A-A-105e, Befund T-356)`,
    );
    return findings;
  }
  for (let i = 0; i < weg.length - 1; i += 1) {
    const glied = weg[i];
    const traeger = weg[i + 1].aufruf;
    const gehWeg = (knoten) => {
      /*
       * **Nicht in eine verschachtelte Funktion hinein.** Was dort wartet,
       * hält dieses Glied nicht auf — es sei denn, dieses Glied wartet auf den
       * Aufruf, und dann steht das `await` hier. Ist die verschachtelte
       * Funktion selbst ein Glied des Weges, kommt sie in der nächsten Runde
       * dran; ist sie es nicht, gehört ihr Warten ihr.
       */
      if (knoten !== glied.knoten && FUNKTIONSARTEN.has(knoten.kind)) return;
      if (ts.isAwaitExpression(knoten) && knoten.expression !== traeger) {
        findings.push(
          `${VERSION_CHECKER_FILE}: auf dem Weg vom Zeitgeber zur Anfrage wartet \`${glied.name}\` auf \`${nameDesGewarteten(knoten.expression)}\` — gewartet wird auf diesem Weg allein auf die Anfrage selbst, und sie trägt eine Frist (A-V-5); eine Zusage, die nie eintrifft, hält \`inFlight\` auf wahr und beendet jede weitere Prüfung (A-A-105e, A-A-106, Befund T-356)`,
        );
      }
      ts.forEachChild(knoten, gehWeg);
    };
    ts.forEachChild(glied.knoten.body ?? glied.knoten, gehWeg);
  }

  /*
   * =========================================================================
   * Der fünfte Weg, soweit er hier zu messen ist (A-A-125, T-357 R-4)
   * =========================================================================
   *
   * Die Achse aller Sätze darüber ist das `await`. Ein Riegel braucht keines.
   * Gemessen ist beides: ein Tag Leerlauf in `run()` — **154/0 grün**, `tsc`
   * Exit 0 — und dieselbe Schleife in `remember`, also eine Funktion weiter
   * unten, mit 150 ms statt einem Tag: **3 statt 40** ausgehende Anfragen,
   * Protokoll **leer**, Lauf grün.
   *
   * Gemessen wird deshalb nicht nur der Weg, sondern alles, was von ihm aus
   * **synchron** erreichbar ist: Was `run` ruft, läuft in derselben Runde der
   * Ereignisschleife, und ein Riegel dort ist von einem im Eintritt am Ergebnis
   * nicht zu unterscheiden.
   *
   * **Was das schließt und was nicht**, steht in der Lückenliste bei
   * {@link checkNoStoreReadback}: Diese Menge fängt die **Schleife**. Ein
   * fremder Aufruf, der synchron nicht zurückkehrt, hat hier keine Schleife,
   * sondern einen Namen — und für drei der Namen auf diesem Weg (`now`,
   * `logger`, der Rumpf eines fremden Pakets) liest dieser Lauf nichts.
   */
  const erreichbar = synchronErreichbar(baum, weg);
  for (const [knoten, name] of erreichbar) {
    for (const schleife of schleifenIm(knoten)) {
      findings.push(
        `${VERSION_CHECKER_FILE}: auf dem Weg zur ausgehenden Anfrage steht in \`${name}\` eine Schleife (\`${ts.SyntaxKind[schleife.kind]}\`) — ein Riegel braucht kein \`await\`, und ein Rumpf, der synchron nicht zurückkehrt, hält die Ereignisschleife an, ohne eine Zeile zu schreiben (A-A-125, T-357 R-4)`,
      );
    }
  }
  return findings;
}

/**
 * 6g-2: **Der Adapter hinter dem Port, auf den gewartet wird.**
 *
 * Die Begründung steht bei {@link ADAPTER_ANWEISUNGEN}, einschließlich der
 * unbequemen Hälfte: An dieser einen Stelle trägt keine Regel, und deshalb
 * stehen dort Zeichen.
 *
 * Die **Herleitung** dagegen ist keine Zeichenkette. Der Leser geht den Weg,
 * den auch der Prozeß geht: Aufrufobjekt des Prüfers → der Port, der als
 * Objektliteral eingesetzt wird → der Bezeichner, der darin gerufen wird → sein
 * Erzeuger in derselben Datei → die Datei, die diesen Erzeuger **deklariert** →
 * das gerufene Mitglied darin. Jeder Schritt, der nicht aufgeht, ist ein
 * **Meßfehlschlag** mit eigenem Satz und kein leerer Fund.
 *
 * Zwei unabhängige Zeilen am Mitglied selbst, und sie sind es mit Absicht:
 *
 *  - Es **wartet nicht** (kein `await`). Das ist die Regel, und sie überlebt
 *    eine bestätigte Änderung an den Anweisungen.
 *  - Seine Anweisungen sind **zeichengleich**. Das ist der Zeichenvergleich,
 *    und er fängt, was keine Regel fängt — ein `return new Promise<void>(() =>
 *    {})` wartet ohne `await`.
 *
 * Eine sorglose Fortschreibung der einen Zeile macht die andere nicht mit.
 */
/**
 * Die Verdrahtung und die Portliterale darin — **einmal** gelesen, von 6g, 6h
 * und 6j benutzt (T-342).
 *
 * Der Weg bis hierher war in 6g-2 aufgeschrieben und wurde dort auch gegangen;
 * seit 6h und 6j denselben Einstieg brauchen, steht er an einer Stelle. Eine
 * zweite Abschrift wäre die Bauart, an der `proof:callers` schon einmal blind
 * war (A-A-40): eine Regel, zwei Fassungen, und die zweite altert still.
 *
 * `null` heißt **nicht** „nichts gefunden", sondern „6a und 6b sagen den Satz
 * dazu schon". Ein zweiter Satz über dieselbe Tatsache verstieße gegen die
 * Zählvorschrift bei {@link COUNTER_PROOFS}.
 */
function verdrahtungMitPortliteralen(files) {
  const verdrahtung = [...VERSION_MODULE_CONSUMERS.keys()]
    .map((pfad) => files.find((file) => file.path === pfad))
    .find((file) => file !== undefined && file.code.includes(CHECKER_FACTORY));
  if (verdrahtung === undefined) return null;

  const { lokal, baum } = einfuhrenDesPruefmoduls(verdrahtung);
  const namen = lokal.get(CHECKER_FACTORY);
  if (namen === undefined) return null;

  /* Die Ports: jede Eigenschaft des Aufrufobjekts, deren Wert ein Objektliteral ist. */
  const ports = new Map();
  const nimm = (objekt) => {
    for (const eigenschaft of objekt.properties) {
      if (ts.isSpreadAssignment(eigenschaft)) {
        for (const zweig of bedingteObjektzweige(eigenschaft.expression) ?? []) nimm(zweig);
        continue;
      }
      if (!ts.isPropertyAssignment(eigenschaft) || !ts.isIdentifier(eigenschaft.name)) continue;
      if (ts.isObjectLiteralExpression(eigenschaft.initializer)) {
        ports.set(eigenschaft.name.text, eigenschaft.initializer);
      }
    }
  };
  const besuche = (knoten) => {
    if (ts.isCallExpression(knoten) && ts.isIdentifier(knoten.expression) && namen.has(knoten.expression.text)) {
      const [argument] = knoten.arguments;
      if (argument !== undefined && ts.isObjectLiteralExpression(argument)) nimm(argument);
    }
    ts.forEachChild(knoten, besuche);
  };
  ts.forEachChild(baum, besuche);

  return { verdrahtung, baum, namen, ports };
}

function pruefeAdapterHinterDemPort(files) {
  const findings = [];
  const gefunden = verdrahtungMitPortliteralen(files);
  if (gefunden === null) return findings; // 6a und 6b sagen das schon
  const { verdrahtung, baum, ports } = gefunden;

  const gemessen = new Set();
  for (const [schluessel, literal] of ports) {
    /* Welcher Bezeichner wird darin gerufen, und mit welchem Mitglied? */
    const rufe = [];
    const geh = (knoten) => {
      if (
        ts.isCallExpression(knoten) &&
        ts.isPropertyAccessExpression(knoten.expression) &&
        ts.isIdentifier(knoten.expression.expression)
      ) {
        rufe.push([knoten.expression.expression.text, knoten.expression.name.text]);
      }
      ts.forEachChild(knoten, geh);
    };
    ts.forEachChild(literal, geh);
    if (rufe.length === 0) {
      findings.push(
        `${verdrahtung.path}: der Port \`${schluessel}\` setzt ein Objektliteral ein, in dem kein Adapter gerufen wird — der Weg zur ausgehenden Anfrage ist damit nicht gemessen (A-A-105e)`,
      );
      continue;
    }

    for (const [bezeichner, mitglied] of rufe) {
      /* Der Erzeuger: `const X = …erzeuger(…)` in derselben Datei. */
      let erzeuger;
      const finde = (knoten) => {
        if (
          ts.isVariableDeclaration(knoten) &&
          ts.isIdentifier(knoten.name) &&
          knoten.name.text === bezeichner &&
          knoten.initializer !== undefined
        ) {
          const suche2 = (k) => {
            if (erzeuger === undefined && ts.isCallExpression(k) && ts.isIdentifier(k.expression)) {
              erzeuger = k.expression.text;
            }
            ts.forEachChild(k, suche2);
          };
          suche2(knoten.initializer);
        }
        ts.forEachChild(knoten, finde);
      };
      ts.forEachChild(baum, finde);
      if (erzeuger === undefined) {
        findings.push(
          `${verdrahtung.path}: \`${bezeichner}\` hinter dem Port \`${schluessel}\` läßt sich in dieser Datei nicht auf einen Erzeuger auflösen — dieser Leser hat den Adapter nicht gefunden (A-A-105e)`,
        );
        continue;
      }

      /* Die Datei, die den Erzeuger **deklariert** — eine Wiederausfuhr ist keine Deklaration. */
      const traeger = files.filter(
        (file) =>
          traegtTypescript(file.path) &&
          new RegExp(`export\\s+(async\\s+)?function\\s+${erzeuger}\\b`).test(file.code),
      );
      if (traeger.length !== 1) {
        findings.push(
          `\`${erzeuger}\` wird von ${String(traeger.length)} Datei(en) des gelesenen Baums deklariert, erwartet ist genau eine — welcher Adapter am Weg zur Anfrage liegt, liest dieser Leser dann nicht (A-A-105e)`,
        );
        continue;
      }
      const [adapter] = traeger;

      /* Das gerufene Mitglied darin. */
      const abaum = lesbarerBaum(adapter.source, adapter.path);
      const stellen = [];
      const suche3 = (knoten) => {
        if (
          (ts.isMethodDeclaration(knoten) || ts.isPropertyAssignment(knoten)) &&
          ts.isIdentifier(knoten.name) &&
          knoten.name.text === mitglied
        ) {
          stellen.push(knoten);
        }
        ts.forEachChild(knoten, suche3);
      };
      ts.forEachChild(abaum, suche3);
      if (stellen.length !== 1) {
        findings.push(
          `${adapter.path}: das Mitglied \`${mitglied}\` steht ${String(stellen.length)}-mal, genau einmal ist die Zusage — die Anweisungen am Weg zur Anfrage sind damit nicht gemessen (A-A-105e)`,
        );
        continue;
      }
      const [stelle] = stellen;
      gemessen.add(mitglied);

      let wartet = false;
      const suche4 = (knoten) => {
        if (ts.isAwaitExpression(knoten)) wartet = true;
        ts.forEachChild(knoten, suche4);
      };
      ts.forEachChild(stelle, suche4);
      if (wartet) {
        findings.push(
          `${adapter.path}: \`${mitglied}\` wartet (\`await\`) — auf dem Weg zur ausgehenden Anfrage wird auf nichts gewartet, das nicht die Anfrage ist (A-A-105e, A-A-106, T-332 K-1)`,
        );
      }

      const erwartet = ADAPTER_ANWEISUNGEN.get(mitglied);
      const ist = anweisungstext(stelle.getText());
      if (erwartet === undefined) {
        findings.push(
          `${adapter.path}: \`${mitglied}\` liegt am Weg zur ausgehenden Anfrage und steht nicht unter den ${ADAPTER_ANWEISUNGEN.size} festgenagelten Adaptermitgliedern — gemessen: ${ist} (A-A-105e)`,
        );
      } else if (ist !== erwartet) {
        findings.push(
          `${adapter.path}: die Anweisungen von \`${mitglied}\` sind nicht mehr zeichengleich — gemessen: ${ist} (A-A-105e; zu bestätigen bei \`ADAPTER_ANWEISUNGEN\` in apps/local-api/scripts/proof-release-safety.mjs)`,
        );
      }
    }
  }

  for (const mitglied of ADAPTER_ANWEISUNGEN.keys()) {
    if (gemessen.has(mitglied)) continue;
    findings.push(
      `das festgenagelte Adaptermitglied \`${mitglied}\` wird von der Verdrahtung nicht mehr gerufen — die Liste ist zu bestätigen, nicht nachzuziehen (A-A-105e)`,
    );
  }
  return findings;
}

// 6h, 6i, 6j: die drei Stellen, die gegangen und nicht gelesen wurden
// (T-342, A-A-110, A-A-111, Befunde T-336 Z-2/Z-3 und T-337 K-4/K-7)

/**
 * 6h: **Der Rumpf der Portliterale in der Verdrahtung** (A-A-111).
 *
 * Die Begründung steht bei {@link PORTLITERAL_ANWEISUNGEN}. Drei Zeilen je
 * Stelle, und sie sind **unabhängig**, dieselbe Aufteilung wie bei 6g-2:
 *
 *  - Sie **wartet nicht** (kein `await`) — das ist die Regel.
 *  - Ihr Rumpf ist **ein einziger Ausdruck** und kein Block. Wer dort
 *    Anweisungen unterbringen will, braucht einen Block; das ist die zweite
 *    Regel, und sie fängt die Gestalt aus T-337 K-7 auch dann, wenn das
 *    Warten ohne `await` geschrieben ist.
 *  - Ihre Anweisungen sind **zeichengleich** — das ist der Vergleich, und er
 *    fängt, was keine Regel fängt: ein `new Promise<void>(() => undefined)` ist
 *    ein einziger Ausdruck und wartet ohne `await`.
 */
function pruefeRumpfDerPortliterale(files) {
  const findings = [];
  const gefunden = verdrahtungMitPortliteralen(files);
  if (gefunden === null) return findings; // 6a und 6b sagen das schon
  const { verdrahtung, ports } = gefunden;

  const gemessen = new Set();
  for (const [schluessel, literal] of ports) {
    for (const eigenschaft of literal.properties) {
      if (!ts.isPropertyAssignment(eigenschaft) || !ts.isIdentifier(eigenschaft.name)) {
        findings.push(
          `${verdrahtung.path}: der Port \`${schluessel}\` trägt eine Stelle der Art ${ts.SyntaxKind[eigenschaft.kind]} — dieser Leser liest ihren Rumpf nicht, und der Weg zum Adapter ist dort ungemessen (A-A-111)`,
        );
        continue;
      }
      const stelle = `${schluessel}.${eigenschaft.name.text}`;
      const erwartet = PORTLITERAL_ANWEISUNGEN.get(stelle);
      const ist = anweisungstext(eigenschaft.getText());
      if (erwartet === undefined) {
        findings.push(
          `${verdrahtung.path}: die Stelle \`${stelle}\` liegt im Portliteral am Weg zur ausgehenden Anfrage und steht nicht unter den ${String(PORTLITERAL_ANWEISUNGEN.size)} festgenagelten — gemessen: ${ist} (A-A-111)`,
        );
        continue;
      }
      gemessen.add(stelle);

      let wartet = false;
      const suche = (knoten) => {
        if (ts.isAwaitExpression(knoten)) wartet = true;
        ts.forEachChild(knoten, suche);
      };
      ts.forEachChild(eigenschaft, suche);
      if (wartet) {
        findings.push(
          `${verdrahtung.path}: \`${stelle}\` wartet (\`await\`) — zwischen dem Prüfer und dem festgenagelten Adapter wird auf nichts gewartet, das nicht die Anfrage ist (A-A-111, T-337 K-7)`,
        );
      }

      const wert = eigenschaft.initializer;
      const istAusdruck =
        (ts.isArrowFunction(wert) && !ts.isBlock(wert.body)) ||
        ts.isIdentifier(wert) ||
        ts.isPropertyAccessExpression(wert);
      if (!istAusdruck) {
        findings.push(
          `${verdrahtung.path}: der Rumpf von \`${stelle}\` ist kein einziger Ausdruck (${ts.SyntaxKind[wert.kind]}) — dort ließe sich etwas vor den Adapter setzen, ohne daß eine Regel es sieht (A-A-111)`,
        );
      }

      if (ist !== erwartet) {
        findings.push(
          `${verdrahtung.path}: die Anweisungen von \`${stelle}\` sind nicht mehr zeichengleich — gemessen: ${ist} (A-A-111; zu bestätigen bei \`PORTLITERAL_ANWEISUNGEN\` in apps/local-api/scripts/proof-release-safety.mjs)`,
        );
      }
    }
  }

  for (const stelle of PORTLITERAL_ANWEISUNGEN.keys()) {
    if (gemessen.has(stelle)) continue;
    findings.push(
      `die festgenagelte Stelle \`${stelle}\` steht im Portliteral der Verdrahtung nicht mehr — die Liste ist zu bestätigen, nicht nachzuziehen (A-A-111)`,
    );
  }
  return findings;
}

/**
 * Die **freien Namen** einer Datei: was sie benutzt, ohne es einzuführen oder
 * selbst zu erklären.
 *
 * Gebunden ist, was die Datei deklariert — Einfuhren, Variablen, Parameter,
 * Zerlegungen, Funktionen, Klassen, Schnittstellen, Typaliasse, Aufzählungen,
 * Typparameter, die Fangvariable. Alles andere kommt aus der Laufzeit.
 *
 * **Nicht** gezählt werden Namen in Namensstellung: die rechte Seite eines
 * Feldzugriffs (`x.process`), der Schlüssel einer Eigenschaft, der Name eines
 * Mitglieds, die rechte Seite eines qualifizierten Typnamens und die Marke
 * einer Sprunganweisung. Sie kommen nicht aus der Laufzeit, sondern aus einem
 * Wert, den ein anderer Satz mißt.
 *
 * `import.meta` ist kein Bezeichner, sondern eine eigene Knotenart, und
 * deshalb steht sie hier ausdrücklich: Sie ist die zweite Tür derselben Klasse
 * (`import.meta.env`), und ein Leser, der nur Bezeichner sammelt, sähe sie
 * nicht.
 *
 * Der Leser folgt **keiner** Auflösung — er kennt keinen Gültigkeitsbereich und
 * unterscheidet nicht, ob ein gebundener Name die Laufzeit **verdeckt**. Ein
 * `const process = …` in derselben Datei bindet den Namen und nähme ihn damit
 * aus der Messung; dieser Fall steht in der Lückenliste bei
 * {@link checkNoStoreReadback} und ist der Preis dafür, daß der Leser sagt, was
 * er weiß, statt zu raten. Der teure Weg wäre ein Programm mit Typprüfer; er
 * kostet in diesem Lauf mehr, als er hier trägt.
 */
function freieLaufzeitnamen(quelltext, pfad) {
  const datei = lesbarerBaum(quelltext, pfad);
  const gebunden = new Set();
  const benutzt = new Set();

  const binde = (name) => {
    if (name === undefined) return;
    if (ts.isIdentifier(name)) {
      gebunden.add(name.text);
      return;
    }
    if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) binde(element.name);
      }
    }
  };

  const sammleBindungen = (knoten) => {
    if (ts.isImportDeclaration(knoten) && knoten.importClause !== undefined) {
      if (knoten.importClause.name !== undefined) gebunden.add(knoten.importClause.name.text);
      const gebundene = knoten.importClause.namedBindings;
      if (gebundene !== undefined) {
        if (ts.isNamespaceImport(gebundene)) gebunden.add(gebundene.name.text);
        else for (const element of gebundene.elements) gebunden.add(element.name.text);
      }
    }
    if (ts.isVariableDeclaration(knoten) || ts.isParameter(knoten) || ts.isBindingElement(knoten)) {
      binde(knoten.name);
    }
    if ((ts.isFunctionDeclaration(knoten) || ts.isClassDeclaration(knoten)) && knoten.name !== undefined) {
      gebunden.add(knoten.name.text);
    }
    if (ts.isInterfaceDeclaration(knoten) || ts.isTypeAliasDeclaration(knoten) || ts.isEnumDeclaration(knoten)) {
      gebunden.add(knoten.name.text);
    }
    if (ts.isTypeParameterDeclaration(knoten)) gebunden.add(knoten.name.text);
    if (ts.isCatchClause(knoten) && knoten.variableDeclaration !== undefined) {
      binde(knoten.variableDeclaration.name);
    }
    ts.forEachChild(knoten, sammleBindungen);
  };
  sammleBindungen(datei);

  const sammleNutzung = (knoten) => {
    if (ts.isIdentifier(knoten)) {
      const eltern = knoten.parent;
      const inNamensstellung =
        eltern !== undefined &&
        ((ts.isPropertyAccessExpression(eltern) && eltern.name === knoten) ||
          (ts.isQualifiedName(eltern) && eltern.right === knoten) ||
          (ts.isPropertyAssignment(eltern) && eltern.name === knoten) ||
          (ts.isPropertySignature(eltern) && eltern.name === knoten) ||
          (ts.isMethodDeclaration(eltern) && eltern.name === knoten) ||
          (ts.isMethodSignature(eltern) && eltern.name === knoten) ||
          (ts.isEnumMember(eltern) && eltern.name === knoten) ||
          (ts.isBindingElement(eltern) && eltern.propertyName === knoten) ||
          ts.isImportSpecifier(eltern) ||
          ts.isExportSpecifier(eltern) ||
          (ts.isLabeledStatement(eltern) && eltern.label === knoten));
      if (!inNamensstellung) benutzt.add(knoten.text);
    }
    if (ts.isMetaProperty(knoten)) {
      benutzt.add(`${ts.tokenToString(knoten.keywordToken)}.${knoten.name.text}`);
    }
    ts.forEachChild(knoten, sammleNutzung);
  };
  sammleNutzung(datei);

  return [...benutzt].filter((name) => !gebunden.has(name)).sort();
}

/**
 * 6i: **Was die Entscheidungsmodule aus der Laufzeit nehmen.**
 *
 * Die Begründung steht bei {@link MODUL_LAUFZEITNAMEN}. Beide Richtungen, und
 * die Meldung nennt den gemessenen Namen — wer ihn bestätigt, soll ihn nicht
 * suchen müssen.
 */
function pruefeLaufzeitnamenDerEntscheidungsmodule(files) {
  const findings = [];
  for (const [modul, { was }] of DECISION_MODULES) {
    const datei = files.find((file) => file.path === modul);
    // Daß das Modul nicht im Baum liegt, sagt 6a mit seinem eigenen Satz.
    if (datei === undefined) continue;
    const festgenagelt = MODUL_LAUFZEITNAMEN.get(modul);
    if (festgenagelt === undefined) {
      findings.push(
        `${modul}: ${was} steht nicht unter den ${String(MODUL_LAUFZEITNAMEN.size)} Modulen mit festgenagelten Laufzeitnamen — dann ist sein Rumpf ungemessen (A-A-105f)`,
      );
      continue;
    }
    const frei = freieLaufzeitnamen(datei.source, datei.path);
    for (const name of frei) {
      if (festgenagelt.has(name)) continue;
      findings.push(
        `${modul}: ${was} nimmt \`${name}\` aus der Laufzeit, ohne es einzuführen oder selbst zu erklären — festgenagelt sind ${String(festgenagelt.size)} Namen, und jeder weitere ist eine Tür an allen Einfuhrlisten vorbei (A-A-105f, T-336 Z-2/Z-3)`,
      );
    }
    for (const name of festgenagelt) {
      if (frei.includes(name)) continue;
      findings.push(
        `${modul}: der festgenagelte Laufzeitname \`${name}\` kommt nicht mehr vor — die Liste ist zu bestätigen, nicht nachzuziehen (A-A-105f)`,
      );
    }
  }
  return findings;
}

/**
 * Die **lesbaren** Schlüssel, mit denen die Entscheidungsmodule auf ein Feld
 * zugreifen — für 6i-2 (A-A-117, T-349).
 *
 * Heute steht in den beiden Modulen genau ein Zugriff mit eckigen Klammern:
 * `(parsed as Record<string, unknown>)[TAG_FIELD]` in `source.ts`, und
 * `TAG_FIELD` ist dort als `const TAG_FIELD = 'tag_name'` erklärt. `version.ts`
 * hat keinen.
 *
 * **Beide Richtungen, und die zweite ist hier die Untergrenze.** Ein Schlüssel,
 * der dazukommt, ist ein Befund; ein festgenagelter, der nicht mehr vorkommt,
 * ebenso. Das zweite ist der Grund, warum diese Liste überhaupt existiert: Die
 * beiden anderen Sätze von 6i-2 — die gerechnete Einfuhr und der Griff nach
 * `constructor` — verbieten etwas, das heute **nirgends** steht, und sind
 * damit über einem stummen Leser wahr. Verliert dieser Leser seine Augen, fällt
 * `tag_name` aus der Messung, und der Lauf sagt es.
 */
const MODUL_ZUGRIFFSSCHLUESSEL = new Map([
  ['apps/local-api/src/features/version/version.ts', new Set()],
  ['apps/local-api/src/features/version/source.ts', new Set(['tag_name'])],
]);

/** Die Schlüssel, die ein Zugriff in den Entscheidungsmodulen nie tragen darf. */
const VERBOTENE_ZUGRIFFSSCHLUESSEL = new Set(['constructor', '__proto__', 'prototype']);

/**
 * Die Zeichenkette hinter einem Schlüssel — oder `null`, wenn dieser Leser sie
 * nicht lesen kann.
 *
 * Gelesen werden zwei Formen: das Literal selbst und ein Bezeichner, den
 * **dasselbe Modul** als Zeichenkettenliteral erklärt. Alles andere — ein
 * Aufruf, eine Verkettung, ein Schablonenliteral mit Einsetzung, ein Wert aus
 * einem Parameter — ist ausdrücklich `null` und damit ein Befund. Ein Leser,
 * der rät, wäre schlimmer als einer, der meldet.
 */
function schluesseltext(knoten, literale) {
  if (ts.isStringLiteral(knoten) || ts.isNoSubstitutionTemplateLiteral(knoten)) return knoten.text;
  if (ts.isNumericLiteral(knoten)) return knoten.text;
  if (ts.isIdentifier(knoten)) return literale.get(knoten.text) ?? null;
  return null;
}

/** Die Bezeichner eines Moduls, die auf ein Zeichenkettenliteral festgelegt sind. */
function literaleBezeichner(baum) {
  const literale = new Map();
  const geh = (knoten) => {
    if (
      ts.isVariableDeclaration(knoten) &&
      ts.isIdentifier(knoten.name) &&
      knoten.initializer !== undefined &&
      (ts.isStringLiteral(knoten.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(knoten.initializer))
    ) {
      literale.set(knoten.name.text, knoten.initializer.text);
    }
    ts.forEachChild(knoten, geh);
  };
  ts.forEachChild(baum, geh);
  return literale;
}

/**
 * 6i-2: **Was die Entscheidungsmodule sich rechnen** (A-A-117, T-346, T-347).
 *
 * ===========================================================================
 * Die dritte Tür, und der Satz, der sie nicht kannte
 * ===========================================================================
 *
 * 6i führte bis T-349 den Satz: „Ein Modul kann auf genau zwei Wegen an etwas
 * herankommen, das es nicht selbst erklärt hat — über eine **Einfuhr** oder
 * über einen **freien Namen** … Zusammen ist das eine **geschlossene**
 * Aussage." Zwei unabhängige Messungen haben ihn widerlegt, beide mit `tsc`
 * Exit 0 und beide bei 145/0 grün:
 *
 *  - **T-347 K-10c**: `await import(teile.join(':'))`. Der Quellname steht in
 *    keiner Einfuhrliste, weil er zur Übersetzungszeit nicht dasteht; ein
 *    freier Name ist es nicht, weil `import` ein Schlüsselwort ist und `teile`
 *    gebunden. Am Modul gemessen: **0 statt 1** ausgehende Anfrage.
 *  - **T-346 (1)**: `({}).constructor.constructor("return globalThis")()`.
 *    Freie Namen `[]`, Einfuhrquellen `[]` — `Object.constructor` ist
 *    `Function`, und der Aufruf liefert `any`.
 *
 * Beide Male war der **Lauf** richtig und die **Zusage** zu weit. Der dritte
 * Weg heißt: Das Modul **rechnet** sich den Zugang aus, statt ihn zu nennen.
 * Diese Gestalt mißt genau das, und zwar an der Eigenschaft „der Leser kann den
 * Namen lesen" und nicht an einer Liste bekannter Schreibweisen:
 *
 *  1. eine Einfuhr als Aufruf, deren Quellname **kein Zeichenkettenliteral**
 *     ist;
 *  2. ein Griff nach `constructor` — als Feld oder als lesbarer Schlüssel;
 *  3. ein Zugriff mit eckigen Klammern, dessen Schlüssel dieser Leser **nicht
 *     lesen** kann, und jeder lesbare Schlüssel, der nicht festgenagelt ist
 *     ({@link MODUL_ZUGRIFFSSCHLUESSEL}).
 *
 * ===========================================================================
 * Was damit **nicht** zugesagt ist — und der Satz gehört hierher
 * ===========================================================================
 *
 * **Die Menge der Türen ist damit nicht geschlossen.** Vier Wege sind gemessen
 * — die Einfuhr (Gestalt 5), der freie Name (6i), der Parameter (6b, 6e, 6f)
 * und der gerechnete Zugriff (hier) —, und „vier gemessen" ist etwas anderes
 * als „es gibt keinen fünften". Wer den Satz von 6i wiederhaben will, braucht
 * eine Eigenschaft, die über den Quelltext entscheidbar ist und die ganze
 * Klasse trägt; die Kandidaten, die dafür in Frage kommen (etwa: kein Ausdruck
 * dieser beiden Module hat den Typ `any`), verlangen den Typprüfer und sind
 * hier **nicht** gebaut. Bis dahin steht die ehrliche Grenze, und sie ist mehr
 * wert als eine achte Gestalt.
 *
 * Ausdrücklich **nicht** hier gemessen, weil anderswo gemessen: `require(…)`
 * und `eval(…)` sind freie Namen und fallen 6i zu; `import.meta` ist über
 * `ts.isMetaProperty` in {@link freieLaufzeitnamen} erfaßt; eine Einfuhr mit
 * literalem Quellnamen liest {@link importQuellen} und hält sie gegen
 * {@link VERSION_FEATURE_IMPORTS}.
 */
function pruefeGerechneteZugriffeDerEntscheidungsmodule(files) {
  const findings = [];
  for (const [modul, { was }] of DECISION_MODULES) {
    const datei = files.find((file) => file.path === modul);
    // Daß das Modul nicht im Baum liegt, sagt 6a mit seinem eigenen Satz.
    if (datei === undefined) continue;
    const festgenagelt = MODUL_ZUGRIFFSSCHLUESSEL.get(modul);
    if (festgenagelt === undefined) {
      findings.push(
        `${modul}: ${was} steht nicht unter den ${String(MODUL_ZUGRIFFSSCHLUESSEL.size)} Modulen mit festgenagelten Zugriffsschlüsseln — dann ist sein gerechneter Zugriff ungemessen (A-A-117)`,
      );
      continue;
    }

    const baum = lesbarerBaum(datei.source, datei.path);
    const literale = literaleBezeichner(baum);
    const gesehen = new Set();

    const geh = (knoten) => {
      if (ts.isCallExpression(knoten) && knoten.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const [quelle] = knoten.arguments;
        if (quelle === undefined || !ts.isStringLiteral(quelle)) {
          findings.push(
            `${modul}: ${was} führt mit einem **gerechneten** Quellnamen ein — eine Einfuhr ohne Zeichenkettenliteral steht in keiner Einfuhrliste und ist kein freier Name (A-A-117, T-347 K-10c)`,
          );
        }
      }
      if (ts.isPropertyAccessExpression(knoten) && knoten.name.text === 'constructor') {
        findings.push(
          `${modul}: ${was} greift auf \`constructor\` zu — über \`({}).constructor.constructor(…)()\` steht die ganze Laufzeit offen, ohne daß ein freier Name oder eine Einfuhr es zeigte (A-A-117, T-346)`,
        );
      }
      if (ts.isElementAccessExpression(knoten)) {
        const schluessel = schluesseltext(knoten.argumentExpression, literale);
        if (schluessel === null) {
          findings.push(
            `${modul}: ${was} greift mit einem Schlüssel zu, den dieser Leser nicht lesen kann (\`${knoten.argumentExpression.getText().slice(0, 40)}\`) — ein gerechneter Schlüssel ist derselbe Weg wie \`[…]['constructor']\` (A-A-117)`,
          );
        } else if (VERBOTENE_ZUGRIFFSSCHLUESSEL.has(schluessel)) {
          findings.push(
            `${modul}: ${was} greift mit dem Schlüssel \`${schluessel}\` zu — an der Kette zur Laufzeit ändert die Schreibweise nichts (A-A-117, T-346)`,
          );
        } else {
          gesehen.add(schluessel);
          if (!festgenagelt.has(schluessel)) {
            findings.push(
              `${modul}: ${was} greift mit dem Schlüssel \`${schluessel}\` zu und steht nicht unter den ${String(festgenagelt.size)} festgenagelten — jeder Zugriff dieser Module ist aufgeschrieben (A-A-117)`,
            );
          }
        }
      }
      ts.forEachChild(knoten, geh);
    };
    ts.forEachChild(baum, geh);

    for (const schluessel of festgenagelt) {
      if (gesehen.has(schluessel)) continue;
      findings.push(
        `${modul}: der festgenagelte Zugriffsschlüssel \`${schluessel}\` kommt nicht mehr vor — die Liste ist zu bestätigen, nicht nachzuziehen, und sie ist die Untergrenze dieses Lesers (A-A-117)`,
      );
    }
  }
  return findings;
}

/** Der äußerste Ausdruck, in dem ein Knoten steht — die Klammer um ihn herum. */
function aeussersterAusdruck(knoten) {
  let lauf = knoten;
  while (lauf.parent !== undefined && ts.isExpression(lauf.parent)) lauf = lauf.parent;
  return lauf;
}

/**
 * Steht der Knoten unter einer **Verzweigung** — und zwar ohne die Frage nach
 * der Verschachtelungstiefe.
 *
 * {@link bedingungUeber} zählt zusätzlich die Funktionsebenen und meldet ab der
 * zweiten. Für 6c ist das richtig: `start()` soll unbedingt im Rumpf der
 * Startfunktion stehen, und eine Funktion darum herum ist genau die Gestalt,
 * die den Start still macht. Für 6j wäre es falsch: Die Auskunft **ist** ein
 * Abschluß im Rumpf von `compose`, und die zweite Ebene ist ihre Bauform, nicht
 * ihr Fehler. Zwei Fragen, zwei Leser — und der Unterschied steht hier, damit
 * niemand den einen für den anderen hält.
 */
function verzweigungUeber(knoten) {
  let lauf = knoten.parent;
  while (lauf !== undefined && !ts.isSourceFile(lauf)) {
    if (VERZWEIGENDE_ARTEN.has(lauf.kind)) return `in einer Bedingung (${ts.SyntaxKind[lauf.kind]})`;
    if (
      ts.isBinaryExpression(lauf) &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(lauf.operatorToken.kind)
    ) {
      return `in einer Bedingung (${ts.SyntaxKind[lauf.operatorToken.kind]})`;
    }
    lauf = lauf.parent;
  }
  return null;
}

/**
 * 6j: **Der Ausdruck, mit dem die Auskunft den Zusammenbau verläßt** (A-A-110).
 *
 * Die Begründung steht bei {@link AUSKUNFT_ANWEISUNGEN}. Der Bezeichner des
 * Prüfers ist **hergeleitet** und nicht geraten: Gesucht wird die Deklaration,
 * deren Wert ein Aufruf des Erzeugers ist. Findet der Leser keine oder mehrere,
 * sagt er, daß er nichts weiß — dieselbe Regel wie bei `extends`, bei einem
 * nicht aufgelösten Alias und bei einem Adapter, der von zwei Dateien
 * deklariert wird.
 */
function pruefeAuskunftDerVerdrahtung(files) {
  const findings = [];
  const gefunden = verdrahtungMitPortliteralen(files);
  if (gefunden === null) return findings; // 6a und 6b sagen das schon
  const { verdrahtung, baum, namen } = gefunden;

  const bezeichner = [];
  const finde = (knoten) => {
    if (
      ts.isVariableDeclaration(knoten) &&
      ts.isIdentifier(knoten.name) &&
      knoten.initializer !== undefined &&
      ts.isCallExpression(knoten.initializer) &&
      ts.isIdentifier(knoten.initializer.expression) &&
      namen.has(knoten.initializer.expression.text)
    ) {
      bezeichner.push(knoten.name.text);
    }
    ts.forEachChild(knoten, finde);
  };
  ts.forEachChild(baum, finde);
  if (bezeichner.length !== 1) {
    findings.push(
      `${verdrahtung.path}: der Prüfer läßt sich hier auf ${String(bezeichner.length)} Bezeichner auflösen, erwartet ist genau einer — welcher Ausdruck die Auskunft trägt, liest dieser Leser dann nicht (A-A-110)`,
    );
    return findings;
  }
  const [pruefer] = bezeichner;

  const gemessen = new Set();
  const stellen = [];
  const geh = (knoten) => {
    if (
      ts.isCallExpression(knoten) &&
      ts.isPropertyAccessExpression(knoten.expression) &&
      ts.isIdentifier(knoten.expression.expression) &&
      knoten.expression.expression.text === pruefer
    ) {
      stellen.push([knoten.expression.name.text, knoten]);
    }
    ts.forEachChild(knoten, geh);
  };
  ts.forEachChild(baum, geh);

  for (const [mitglied, ruf] of stellen) {
    const erwartet = AUSKUNFT_ANWEISUNGEN.get(mitglied);
    const ist = anweisungstext(aeussersterAusdruck(ruf).getText());
    if (erwartet === undefined) {
      findings.push(
        `${verdrahtung.path}: die Verdrahtung ruft \`${pruefer}.${mitglied}()\` und das Mitglied steht nicht unter den ${String(AUSKUNFT_ANWEISUNGEN.size)} festgenagelten — gemessen: ${ist} (A-A-110)`,
      );
      continue;
    }
    gemessen.add(mitglied);

    const grund = verzweigungUeber(ruf);
    if (grund !== null) {
      findings.push(
        `${verdrahtung.path}: die Auskunft \`${pruefer}.${mitglied}()\` steht ${grund} — eine Meldung, die den Benutzer nicht erreicht, schaltet die Prüfung ebenso ab wie eine Anfrage, die nicht hinausgeht (A-A-110, T-337 K-4)`,
      );
    }
    if (ist !== erwartet) {
      findings.push(
        `${verdrahtung.path}: der Ausdruck um die Auskunft \`${pruefer}.${mitglied}()\` ist nicht mehr zeichengleich — gemessen: ${ist} (A-A-110; zu bestätigen bei \`AUSKUNFT_ANWEISUNGEN\` in apps/local-api/scripts/proof-release-safety.mjs)`,
      );
    }
  }

  for (const mitglied of AUSKUNFT_ANWEISUNGEN.keys()) {
    if (gemessen.has(mitglied)) continue;
    findings.push(
      `das festgenagelte Auskunftsmitglied \`${mitglied}\` wird von der Verdrahtung nicht mehr gerufen — die Liste ist zu bestätigen, nicht nachzuziehen (A-A-110)`,
    );
  }
  return findings;
}

/**
 * Die beiden Zusagen, ohne die das Lesen **einer** Deklaration nichts wert wäre
 * (T-296, Befund T-295 zu Zeile 899).
 *
 * ---------------------------------------------------------------------------
 * Die dritte Tür, und warum sie die letzte ihrer Klasse ist
 * ---------------------------------------------------------------------------
 *
 * Es gibt in TypeScript genau **zwei** Wege, einer Schnittstelle ein Mitglied zu
 * geben, das nicht in ihrer Deklaration steht: `extends` und die
 * **Deklarationszusammenführung**. `extends` ist seit T-294 zu. Die
 * Zusammenführung war es nur halb: `portMitglieder` liest die **obersten
 * Anweisungen einer Datei**, und zwei davon fallen seit T-294 in den Zweig „ist
 * N-mal deklariert". Alles andere sah der Leser nicht. Der code-reviewer hat in
 * T-295 drei Stände gebaut, die **68/0 grün** blieben, während `port.read()`
 * gegen `tsc` mit Exit 0 durchlief:
 *
 *   - `declare module './version.ts' { interface VersionCheckStorePort { read… } }`
 *     **in** `version.ts`, die Deklaration darüber unberührt;
 *   - dasselbe als `declare global`;
 *   - dasselbe in einer **zweiten Datei** `features/version/erweiterung.ts`,
 *     sechs Zeilen, **ohne einen einzigen Import** — `apps/local-api/tsconfig.json`
 *     zieht sie über `"include": ["src"]` trotzdem ins Programm, und Gestalt 5
 *     fängt sie nicht, weil `declare module` keine Importanweisung ist.
 *
 * (Eine Berichtigung an der dritten Bauart, in T-296 gegen `tsc` gemessen: Die
 * Datei braucht **eine** Zeile `export {};`, sonst ist sie ein Skript und die
 * Erweiterung scheitert an `TS2436`. Ein Import ist das nicht, und die Zeile
 * macht die Tür keinen Spalt schmaler.)
 *
 * ---------------------------------------------------------------------------
 * Warum hier zwei Zusagen stehen und nicht ein klügerer Leser
 * ---------------------------------------------------------------------------
 *
 * Dieselbe Regel wie bei `extends`: **nicht klüger werden, sondern zugeben, wenn
 * der Leser nichts mehr weiß.** Eine Zusammenführung nachzubilden hieße, den
 * Modulgraphen des ganzen Bestands aufzulösen — und die nächste Runde brächte
 * die nächste Auflösungslücke mit. Statt dessen zwei Aussagen über den
 * **gelesenen Baum**, die heute leer sind und deshalb nichts kosten:
 *
 *   1. **Kein Erweiterungsblock.** Ein `declare module '<Zeichenkette>'` oder ein
 *      `declare global` — irgendwo, in irgendeiner gelesenen TypeScript-Datei —
 *      ist ein **Meßfehlschlag**. Nicht nur für diesen Port: Ein solcher Block
 *      kann **jede** Schnittstelle dieses Bestands um Mitglieder ergänzen, und
 *      kein Leser, der Deklarationen liest, sieht es. Heute kommt er **nullmal**
 *      vor. Absichtlich **nicht** getroffen ist die Namensform
 *      `declare namespace Office { … }` (`apps/outlook-addin/src/office/office-js.d.ts`):
 *      Ein Block mit einem **Bezeichner** statt einer Zeichenkette erweitert
 *      kein Modul, sondern legt einen eigenen Deklarationsraum an, und er kann
 *      eine Schnittstelle außerhalb seiner selbst nicht erreichen. Genau diese
 *      Unterscheidung ist der Grund, warum hier der Compiler fragt und kein
 *      Textlauf: `ts.isStringLiteral(knoten.name)` gegen
 *      `NodeFlags.GlobalAugmentation` steht nicht in einem regulären Ausdruck.
 *   2. **Der Portname steht genau einmal im Baum.** Zwei Module führt TypeScript
 *      **nicht** zusammen — aber dieser Leser mißt die Gestalt des Ports an
 *      **einer** festgenagelten Datei, und welche der beiden Deklarationen der
 *      Prüfer wirklich einsetzt, entscheidet eine Importzeile, die er nicht
 *      liest. Auch das ist ein Meßfehlschlag und kein Verstoß.
 *
 * **Damit ist das Lesen der obersten Anweisungen wieder tragfähig, und das ist
 * ein Argument und keine Hoffnung:** Eine Deklaration, die mit der obersten
 * zusammengeführt wird, steht entweder ebenfalls oben (Zweig „N-mal
 * deklariert") oder in einem Erweiterungsblock (Zusage 1). Eine Deklaration, die
 * in einem Block, einer Funktion oder einer Namensform mit Bezeichner steckt,
 * wird **nicht** zusammengeführt — sie in den Zweig „N-mal deklariert" zu ziehen
 * wäre ein falscher Satz über einen Zustand, den TypeScript anders sieht.
 *
 * Beides ist in T-296 gegen `tsc` gemessen und nicht erinnert. Eine zweite
 * Deklaration **im Rumpf einer Funktion** und eine **in einem `namespace` mit
 * Bezeichner** enden beide bei
 * `TS2339: Property 'read' does not exist on type 'VersionCheckStorePort'` —
 * also genau dort, wo der Bestand auch ohne sie endet. Der code-reviewer hatte
 * für diese Stelle eine rekursive Sammlung über `forEachChild` vorgeschlagen;
 * sie hätte beide Fälle als „ist 2-mal deklariert" gemeldet und damit einen
 * Satz behauptet, den TypeScript nicht trägt. Die beiden Zusagen darüber sind
 * die engere Antwort auf dieselbe Frage: Sie treffen **alles**, was wirklich
 * zusammengeführt wird, und nichts sonst.
 *
 * Der Vorfilter über `declare|module|namespace|global` ist **vollständig** und
 * nicht geraten: Jeder `ModuleDeclaration`-Knoten wird als `module X`,
 * `namespace X` oder `global` geschrieben, ein anderes Schlüsselwort gibt es
 * dafür nicht. Er darf also nur zu viel auswählen, nie zu wenig; die
 * Entscheidung trifft danach der Compiler. Heute bleiben von rund 320
 * TypeScript-Dateien **sieben** übrig.
 */
const ERWEITERUNGS_WORTE = /\b(?:declare|module|namespace|global)\b/;

/*
 * Hier stand bis T-327 `istTypescriptDatei` — eine Aufzählung von drei
 * Endungen, in der `.cts` fehlte. Sie ist durch {@link traegtTypescript}
 * ersetzt, das die Frage dem Compiler stellt; die Begründung und die Messung
 * stehen bei {@link READ_EXTENSIONS} und {@link scriptArt}.
 */

function lesbarerBaum(quelltext, pfad) {
  /*
   * Auch die **Art** kommt vom Compiler und nicht aus `endsWith('.tsx')`: Ein
   * `.tsx` als `TS` gelesen bricht am ersten Element, und ein `.cts` als `TSX`
   * gelesen bricht an einer Typzusicherung. Eine falsch geratene Art ist ein
   * Leser, der nichts findet — also grün.
   */
  const art = scriptArt(pfad);
  return ts.createSourceFile(
    pfad,
    quelltext,
    ts.ScriptTarget.ES2022,
    true,
    art === ts.ScriptKind.TSX ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

/** Zusage 1: kein Erweiterungsblock im gelesenen Baum (T-296). */
function findeErweiterungsbloecke(files) {
  const findings = [];
  for (const file of files) {
    if (!traegtTypescript(file.path)) continue;
    if (!ERWEITERUNGS_WORTE.test(file.code)) continue;
    const formen = [];
    const besuche = (knoten) => {
      if (ts.isModuleDeclaration(knoten)) {
        if (ts.isStringLiteral(knoten.name)) formen.push(`declare module '${knoten.name.text}'`);
        else if ((knoten.flags & ts.NodeFlags.GlobalAugmentation) !== 0) formen.push('declare global');
      }
      ts.forEachChild(knoten, besuche);
    };
    ts.forEachChild(lesbarerBaum(file.source, file.path), besuche);
    for (const form of formen) {
      findings.push(
        `${file.path}: \`${form}\` erweitert fremde Deklarationen — ein solcher Block gibt jeder Schnittstelle dieses Bestands Mitglieder, die in ihrer eigenen Deklaration nicht stehen, und dieser Leser liest Deklarationen; er hat damit nichts gemessen (T-296)`,
      );
    }
  }
  return findings;
}

/**
 * Zusage 2: der Portname steht genau einmal im gelesenen Baum (T-296).
 *
 * ---------------------------------------------------------------------------
 * Der Befundsatz sagt seit T-320 nur noch, was gemessen ist (Befund T-318 zu
 * Zeile 1261)
 * ---------------------------------------------------------------------------
 *
 * Gesammelt wird **rekursiv** über `ts.forEachChild`, und das ist Absicht: Die
 * laute Richtung ist hier die billige. Getroffen wird damit aber auch eine
 * Deklaration im Rumpf einer Funktion oder in einem `namespace` mit Bezeichner
 * — und die führt TypeScript **nicht** mit der obersten zusammen (T-296 und
 * T-318 haben es beide mit `tsc` 5.9.3 gemessen: `TS2339`).
 *
 * Bis T-320 stand im Satz trotzdem „welche der beiden Deklarationen der Prüfer
 * einsetzt, entscheidet eine Importzeile". Für einen Funktionsrumpf ist das
 * schlicht falsch — jene Deklaration ist nicht importierbar. Es war genau der
 * Satz, den T-296 an `portMitglieder` zu Recht nicht schreiben wollte.
 *
 * Der Satz nennt jetzt die **Tatsache** (der Name steht ein zweites Mal im
 * Baum) und den **Grund**, warum das reicht (dieser Leser mißt die Gestalt an
 * genau einer Datei, und er weiß nicht, welche der beiden gilt) — ohne über die
 * Zusammenführung eine Aussage zu treffen, die er nicht gemessen hat.
 */
function findeZweiteDeklarationDesPorts(files, name) {
  const findings = [];
  for (const file of files) {
    if (file.path === VERSION_CHECKER_FILE) continue;
    if (!traegtTypescript(file.path)) continue;
    // Der Vorfilter liest den **gekürzten** Quelltext: Der Name in einem
    // Kommentar ist keine Deklaration, und die Entscheidung trifft ohnehin der
    // Compiler am ungekürzten.
    if (!file.code.includes(name)) continue;
    let getroffen = false;
    const besuche = (knoten) => {
      if (
        (ts.isInterfaceDeclaration(knoten) || ts.isTypeAliasDeclaration(knoten)) &&
        knoten.name.text === name
      ) {
        getroffen = true;
      }
      ts.forEachChild(knoten, besuche);
    };
    ts.forEachChild(lesbarerBaum(file.source, file.path), besuche);
    if (getroffen) {
      findings.push(
        `${file.path}: \`${name}\` steht hier ein zweites Mal im Baum — die Gestalt des Ports wird an ${VERSION_CHECKER_FILE} gemessen, und dieser Leser kann nicht sagen, welche der beiden Deklarationen für einen Aufrufer gilt (T-296, Satz auf das Gemessene gekürzt in T-320)`,
      );
    }
  }
  return findings;
}

/** Gestalt 2: der Port kann `write` und sonst nichts (T-285, Gestalt aus T-279). */
function pruefeGestaltDesPorts(files) {
  const checker = files.find((file) => file.path === VERSION_CHECKER_FILE);
  if (checker === undefined) {
    // Dieselbe Regel wie bei den Quellordnern: eine nicht gelesene Datei ist ein
    // Fehlschlag der Messung und kein leerer Fund.
    return [`${VERSION_CHECKER_FILE}: nicht im gelesenen Baum`];
  }

  /*
   * Die beiden Zusagen über den Baum stehen **vor** dem Lesen, und sie kehren
   * unmittelbar zurück: Solange eine von ihnen rot ist, ist jede Aussage über
   * die Mitglieder des Ports eine Aussage über eine Deklaration, die nicht
   * allein steht. Dieselbe Reihenfolge wie bei der nicht gelesenen Datei
   * darüber — erst die Frage, ob gemessen werden kann, dann die Messung.
   */
  const erweiterungen = findeErweiterungsbloecke(files);
  if (erweiterungen.length > 0) return erweiterungen;
  const zweite = findeZweiteDeklarationDesPorts(files, 'VersionCheckStorePort');
  if (zweite.length > 0) return zweite;

  const gelesen = portMitglieder(checker.source, 'VersionCheckStorePort', VERSION_CHECKER_FILE);
  if (gelesen.mitglieder === undefined) {
    /*
     * Der Meßfehlschlag trägt seit T-294 seinen Grund (vier Sätze, vier
     * Gegenproben): Name nicht gefunden, mehrfach deklariert, `extends`, Alias
     * ohne Typliteral. Ein gemeinsamer Satz hätte den Leser hier vier Zweige
     * gekostet, die niemand einzeln drehen kann.
     */
    return [`${VERSION_CHECKER_FILE}: ${gelesen.fehlschlag}`];
  }
  const members = gelesen.mitglieder;

  /*
   * Die Untergrenze dieses Lesers, und sie fehlte bis T-292 (Befund T-291).
   *
   * Eine leere Mitgliederliste ist der Zustand, in dem „kennt außer `write`
   * nichts" wahr ist, **weil nichts gesehen wurde**. „Nichts gefunden" und
   * „nichts gesehen" sind hier deshalb zwei verschiedene Sätze, und der zweite
   * ist rot. Dieselbe Regel wie bei den Quellordnern, den vier Spaltendateien
   * und der Importliste — nur eine Ebene tiefer.
   *
   * **Was sie nicht ist** (berichtigt in T-294, Befund T-293): Sie ist nicht der
   * gemeinsame Nenner der drei Ausfälle von T-289 bis T-291. Am nachgebauten
   * Leser aus T-290 gemessen fand der in allen drei Fällen genau **ein**
   * Mitglied — `write` —, nie null; die Untergrenze hätte keinen der drei
   * gefangen. Sie fügt auch keine Erkennung hinzu: Bei einer leeren Liste
   * greift ohnehin `!members.includes('write')` zwei Zeilen weiter unten. Was
   * die drei Ausfälle gemeinsam hatten, war etwas anderes — der Leser fand das
   * eine Mitglied, das er sehen wollte, und übersah das zweite. Dagegen hilft
   * der Compiler, nicht diese Untergrenze.
   *
   * Sie bleibt trotzdem — und der Grund ist kleiner als der, der hier bis T-296
   * stand (Befund T-295 zu Zeile 1176). Gemessen (T-295, M2: Untergrenze
   * abgeschaltet) ist sie gegen **keinen** Leser der Unterschied zwischen grün
   * und rot, auch gegen keinen künftigen: Eine leere Mitgliederliste ist ohne
   * sie ebenso rot, nur eben mit dem Satz „kennt kein `write` mehr".
   *
   * Was sie leistet, ist genau dieser **Satz**. Ohne sie bekäme ein **blinder**
   * Leser gemeldet, der Port habe sein `write` verloren — der Satz, der seit
   * T-294 dem eigenen Zweig (u) gehört —, und der nächste suchte ein verlorenes
   * `write`, wo ein blinder Leser ist. Sie verhindert, daß zwei verschiedene
   * Befunde denselben Satz tragen; das ist die Zählvorschrift von
   * `COUNTER_PROOFS`, auf diesen Leser selbst angewandt.
   */
  if (members.length === 0) {
    return [
      `${VERSION_CHECKER_FILE}: VersionCheckStorePort hat kein einziges gelesenes Mitglied — „kennt außer \`write\` nichts" wäre hier nicht gemessen, sondern leer (T-292)`,
    ];
  }

  const findings = [];
  const fremd = members.filter((name) => name !== 'write');
  if (fremd.length > 0) {
    findings.push(
      `${VERSION_CHECKER_FILE}: VersionCheckStorePort kennt außer \`write\` noch ${fremd.join('/')} — der Prüfer schreibt, er liest nicht (T-285)`,
    );
  }
  if (!members.includes('write')) {
    findings.push(
      `${VERSION_CHECKER_FILE}: VersionCheckStorePort kennt kein \`write\` mehr — dann wird der Zeitpunkt nirgends gemerkt`,
    );
  }
  return findings;
}

const CHECKS = [
  { id: 'adressen', name: 'genau eine Abfrageadresse, und keine dritte auf github.com', run: checkAddresses },
  { id: 'felder', name: 'aus der Antwort wird ein Feld gelesen, und `html_url` gehört nicht dazu', run: checkResponseFields },
  { id: 'oeffnen', name: 'kein Weg von einer Antwort zum Öffnen-Befehl', run: checkOpenCommand },
  { id: 'download', name: 'nirgends ein Herunterladen, kein Installieren, kein zweiter Netzweg', run: checkNoDownload },
  { id: 'ausgang', name: 'genau ein Ausgang, und keiner in einer Routendatei', run: checkSingleExit },
  { id: 'optionen', name: 'die Zusagen des Aufrufs stehen im Quelltext', run: checkFetchOptions },
  {
    id: 'rueckweg',
    name: 'kein Rückweg vom Bestand in die Versionsprüfung — sechs Gestalten, die sechste in elf Sätzen und an der Anforderung aufgespannt; die Lückenliste daneben ebenso, bei \`checkNoStoreReadback\`',
    run: checkNoStoreReadback,
  },
];

/**
 * Zu jeder Prüfung mindestens ein Verstoß, der sie rot machen **muß**.
 *
 * Der Verstoß ist jeweils der, den jemand versehentlich bauen würde: die
 * Adresse ein zweites Mal, `html_url` „weil es praktisch ist", die Adresse an
 * den Öffnen-Befehl gereicht, ein Aktualisierungs-Zusatz, der Netzaufruf in
 * einer Route, `response.json()` statt des Lesestroms.
 *
 * ===========================================================================
 * Warum „ausgang" **vier** Gegenproben hat und nicht eine (Befund T-143 S-1)
 * ===========================================================================
 *
 * Weil eine Gegenprobe, die die Lücke des Nachweises nicht trifft, keine ist.
 *
 * Bis T-146 stand hier für „ausgang" genau ein Verstoß, und er benutzte
 * `fetch(` — die eine Schreibweise, die der alte Ausdruck ohnehin erkannte.
 * Die drei, die er **nicht** erkannte (`globalThis.fetch`, `window.fetch`,
 * eine Zerlegung), standen in keiner Gegenprobe. Der Wächter war blind, und
 * sein Wächter sah dieselbe Stelle nicht.
 *
 * Deshalb steht jetzt jede der vier Schreibweisen als eigener Verstoß da. Sie
 * sind nicht Vollständigkeit um ihrer selbst willen: Es sind genau die vier,
 * die T-143 gegen den alten Ausdruck gemessen hat.
 *
 * ===========================================================================
 * Die Zählvorschrift, seit T-294 (Antwort des code-reviewers in T-293)
 * ===========================================================================
 *
 * **Ein Eintrag in `CHECKS` bekommt so viele Gegenproben, wie seine
 * `run`-Funktion unterscheidbare Befundsätze kennt.** Nicht so viele, wie er
 * eingesetzte Dateien braucht: Mehrere Einträge dürfen dieselbe Datei
 * einsetzen, weil `erwartet` immer nur **einen** Zweig festnagelt (die
 * Herleitung steht bei `adressen` und `optionen` weiter unten).
 *
 * Dazu gehören zwei Sätze, die bis T-296 **unter den Ausnahmen** standen und
 * dort als Erlaubnis zu lesen waren, es zu lassen (Befunde T-295 zu den Zeilen
 * 1262 und 1992). Sie gehören in die Regel, weil die Vorschrift ohne sie ihre
 * eigene Lücke segnet:
 *
 *  - **Ein Zweig, dessen Befundsatz sich nicht von dem eines anderen Zweigs
 *    unterscheiden läßt, ist kein gezählter Zweig, sondern ein zu trennender
 *    Satz.** Ohne diesen Halbsatz hätte die Vorschrift, auf den Stand von T-292
 *    angewandt, für die **vier** Meßfehlschläge hinter **einem** Satz genau
 *    **eine** Gegenprobe verlangt. Gemessen ist die Lücke drei bis vier wert:
 *    Kollabiert man die vier Sätze wieder auf einen der vorhandenen, werden
 *    drei Gegenproben rot (65/3), auf einen neutralen Satz vier (64/4) —
 *    Mutation R3, in T-294 und T-295 in beiden Bauarten gefahren. Die
 *    Vorschrift ist damit nicht nur eine Zählregel für Gegenproben, sondern
 *    eine **Formregel für Befundsätze**: Sie greift in den Leser hinein.
 *  - **Jede Gegenprobe trägt ein `erwartet`, und ein Befundsatz gilt als
 *    gedeckt genau dann, wenn mindestens ein `erwartet` ihn nennt.** Nicht,
 *    wenn irgendeine Zeile bei ihm rot wird — das ist eine Nebenwirkung und
 *    keine Messung (der Fall (v), siehe unten). Gemessen an R4: 67/1 mit dem
 *    `erwartet`, **68/0 ohne es**. Abschnitt 0 zählt deshalb gegen, daß keine
 *    Gegenprobe ohne `erwartet` dasteht.
 *
 * Gezählt wird über die `erwartet` und nicht über die roten Zeilen. Mehr
 * Einträge als Sätze sind erlaubt, aber nicht gratis: Sie brauchen den Grund,
 * daß eine **plausible schwächere Umsetzung** dieser Prüfung sie trennen würde
 * — so bei den vier Schreibweisen von `fetch` (T-143 hat sie gegen den alten
 * Ausdruck gemessen), den fünf Schreibweisen von `read` und den drei
 * Erweiterungsblöcken aus T-296. Wo dieser Grund fehlt, ist der Eintrag Ballast
 * und die Liste wächst gegen ihren eigenen Zweck (E-107).
 *
 * Angewandt hat die Vorschrift in T-294 **siebzehn** Einträge ergeben — elf in
 * den sechs Prüfungen daneben, sechs an Gestalt 2 des Rückwegs —, dazu ein
 * `erwartet` an den sieben Einträgen, die keines hatten. 51 → 68. In T-296 kamen
 * **vier** Einträge für die dritte Tür der Auflösungsklasse dazu und **eine**
 * Zeile in Abschnitt 0, die die `erwartet` gegenzählt: 68 → **73**. T-320 kam
 * auf **76** (die Gegenprobe (α) und die beiden Sätze über den Baum).
 *
 * In T-327 sind es **dreiundzwanzig** Einträge geworden — einer für die `.cts`
 * (β) und zweiundzwanzig für die sechste Gestalt —, dazu sieben Zeilen in
 * Abschnitt 0 über die Art einer Datei: 76 → **106**. Die Zahl der Einträge mit
 * eingesetztem Verstoß steigt dabei von 49 auf 72; der **Umbau** des Baums
 * (sieben Programme statt einem, die Art vom Compiler statt aus einer Liste)
 * hat davon **null** beigetragen und auch keinen einzigen neuen Befund am
 * echten Baum erzeugt. Die beiden Zahlen sind getrennt gemessen und stehen im
 * Bericht zu T-327.
 *
 * In T-335 sind **vierundzwanzig** dazugekommen, alle an Gestalt 6, und ohne
 * eine einzige neue Zeile in Abschnitt 0: 106 → **130**, `erwartet` 72 → 96.
 * Sie gehören zu der Menge, die dort neu gezogen wurde — 6a über **beide**
 * Entscheidungsmodule, 6e/6f über die Tür, 6g über die Warteliste und den
 * Adapter dahinter, und einer für die Verengung der Wertform von `source`
 * (A-A-107). Der Nullpunkt ist gemessen und nicht übernommen: derselbe Baum,
 * der alte Leser, 106/0.
 *
 * **Und die andere Richtung ist mitgemessen** (T-335, acht Mutationen). Jede
 * der neuen Zeilen einzeln abgeschaltet macht genau die Gegenproben rot, die zu
 * ihr gehören, und keine fremde: 6a ohne das Quellmodul 126/4, 6e/6f
 * abgeschaltet 124/6, 6g-1 abgeschaltet 126/4, 6g-2 abgeschaltet 122/8,
 * A-A-107 zurückgenommen 129/1, der `await`-Zweig am Adapter 129/1, der
 * Zeichenvergleich am Adapter 129/1, und die Auflösung zurück auf „nur
 * relative Quellen" (der Stand vor T-335) 128/2. Die letzten beiden sind die interessanten:
 * Sie sind **unabhängig**, und deshalb überlebt die Messung von T-332 K-1 eine
 * bestätigte Fortschreibung der einen wie der anderen.
 *
 * In T-342 sind **vierzehn** dazugekommen — fünf an 6h, vier an 6i, fünf an
 * 6j —, dazu **eine** Zeile in Abschnitt 0: 130 → **145**, `erwartet` 96 →
 * **110**. Der Nullpunkt ist gemessen und nicht übernommen: derselbe Baum, der
 * alte Leser, 130/0, und zwar zweimal — im Arbeitsbaum und in der Meßkopie.
 *
 * **Die eine Zeile in Abschnitt 0 ist die Ausnahme und steht hier deshalb
 * ausdrücklich.** Die Differenz „Gesamtzahl minus `erwartet`" war von T-327 bis
 * T-335 unverändert **34**; seit T-342 ist sie **35**. Der Grund ist genau
 * diese Zeile: 6i hat einen Satz („ein Entscheidungsmodul steht nicht unter den
 * Modulen mit festgenagelten Laufzeitnamen"), der über eine eingesetzte Datei
 * **nicht** erreichbar ist, weil beide Listen in diesem Lauf stehen und nicht
 * im Baum. Eine Gegenprobe dafür wäre keine; die Zeile in Abschnitt 0 ist es.
 * Wer die Differenz als Prüfgröße benutzt, rechnet ab hier mit 35.
 *
 * **Und die andere Richtung ist zweimal mitgemessen** (T-342).
 *
 * *Am Bestand*, vier Mutationen: Jede der drei Gestalten, die am 2026-09-13 mit
 * `tsc` Exit 0 und 130/0 durchkamen, ist einzeln in eine Meßkopie gesetzt
 * worden und wird einzeln rot — K-7 im Portliteral **144/1** an drei Sätzen von
 * 6h, Z-2 im Quellmodul **144/1** an 6i, Z-3 im Prüfmodul **144/1** an 6i —,
 * dazu K-4 an der Auskunft **144/1** an zwei Sätzen von 6j. Alle vier mit `tsc`
 * Exit 0, und kein fremder Prüfsatz fällt dabei mit.
 *
 * *Am Leser*, drei Mutationen: Jede der drei neuen Zeilen einzeln abgeschaltet
 * macht genau die Gegenproben rot, die zu ihr gehören, und keine fremde — 6h
 * abgeschaltet **140/5**, 6i abgeschaltet **141/4**, 6j abgeschaltet
 * **140/5**. Fünf plus vier plus fünf ist vierzehn, und das ist die Zahl der
 * neuen Einträge; die Zuordnung geht damit auf.
 *
 * In T-349 sind **neun** dazugekommen (145 → **154**, nachgerechnet und
 * bestätigt in T-356 Abschnitt B-4); in T-360 sind es **vier**, alle an 6g-1:
 * 154 → **158**, Einträge (und damit `erwartet`) 118 → **122**. Der Nullpunkt
 * ist gemessen und nicht übernommen — derselbe Baum, der alte Leser, **154/0**.
 *
 * Die Differenz „Gesamtzahl minus Einträge" bleibt dabei bei **36**: T-349 hat
 * sie mit seiner einen Zeile in Abschnitt 0 von 35 auf 36 gehoben, T-360 fügt
 * dort keine hinzu. Beide neuen Sätze sind über eine eingesetzte Datei
 * erreichbar, und deshalb sind es Gegenproben und keine Zeilen in Abschnitt 0.
 *
 * **Und beide Richtungen wieder zweimal gemessen** (T-360).
 *
 * *Am Bestand*, drei Gestalten, jede einzeln in `version.ts` gesetzt und
 * zeichengleich zurückgeschrieben (`md5` vor und nach jedem Lauf gleich): die
 * Anfrage eine Funktion tiefer mit hängendem `await` in `run()` (Befund T-356),
 * ein synchroner Riegel in `run()` (T-357 R-4) und derselbe Riegel in
 * `remember`. Alle drei mit `tsc` Exit 0, alle drei **vorher 154/0 grün** und
 * **nachher 153/1 rot**, und kein fremder Prüfsatz fällt dabei mit. Am Modul
 * gemessen: 0 statt 40 Anfragen (erste Gestalt) und 3 statt 40 (dritte), beide
 * mit **leerem** Protokoll.
 *
 * *Am Leser*, drei Mutationen: die Weg-Regel abgeschaltet **157/1**, die
 * Untergrenze „kein Weg gefunden" abgeschaltet **157/1**, die Schleifen-Regel
 * abgeschaltet **156/2**. Eins plus eins plus zwei ist vier, und das ist die
 * Zahl der neuen Einträge; jede Mutation macht genau ihre eigenen Gegenproben
 * rot und keine fremde.
 *
 * Drei Stellen, an denen sie **nicht** mechanisch durchläuft, und sie sind im
 * Bericht zu T-294 benannt:
 *
 *  - **Ein Satz aus einer Liste.** `download` erzeugt einen Satz für vierzehn
 *    Marken, `optionen` je einen für sieben. Nach dem Wortlaut wäre das je eine
 *    Gegenprobe — und das **teilweise** Leeren der Listen bleibt damit
 *    ungemessen (gemessen in T-292, Risiko 4). Hier zählt die Vorschrift zu
 *    wenig; der Ausgleich wären 21 Einträge und gehört in eine eigene
 *    Entscheidung.
 *  - **Zwei Zweige, ein Satz.** `extends` und die Deklarationszusammenführung
 *    waren beide „Meßfehlschlag" und hätten sich einen Satz geteilt. Das ist
 *    seit T-296 **keine Ausnahme mehr, sondern der erste Satz der Regel**: Die
 *    Vorschrift zwingt hier nicht zu zwei Gegenproben, sondern zu **zwei
 *    Sätzen** — deshalb gibt `portMitglieder` seit T-294 den Grund zurück und
 *    nicht `null`. Der Eintrag steht hier nur noch als Verweis, damit der
 *    Fall auffindbar bleibt.
 *  - **Ein Satz, der als Nebenwirkung fällt.** „`version.ts` nicht im gelesenen
 *    Baum" wurde vom Eintrag „der Ordner ist weg" ausgelöst, dessen `erwartet`
 *    auf einen anderen Satz zeigt. Gezählt war er damit, gemessen nicht. Auch
 *    die Folgerung daraus steht seit T-296 oben in der Regel: gezählt wird über
 *    die `erwartet`, nicht über die roten Zeilen.
 */
/**
 * Das Aufrufobjekt, wie es heute in `composition.ts` steht — zeichengleich bis
 * auf die Namen der Werte.
 *
 * Es ist der **Nullpunkt** der Gegenproben zu Gestalt 6: Jeder Eintrag ändert
 * daran genau eine Sache, und was rot wird, ist damit dieser Sache zuzuordnen
 * und keiner Nebenwirkung.
 */
const SAUBERES_AUFRUFOBJEKT =
  `{\n    logger,\n    now: clock,\n` +
  `    ...(options.releaseSource === undefined ? {} : { source: options.releaseSource }),\n` +
  `    ...(store === null ? {} : { store: { write } }),\n  }`;

/** Ein Stumpf der Verdrahtungsdatei: eine Einfuhr, ein Feld, ein Aufruf. */
function verdrahtungsStumpf(aufrufobjekt, zusatzImport = '', feldTyp = 'VersionChecker', rumpfVorne = '') {
  return (
    `import { createVersionChecker, type VersionChecker } from './features/version/version.ts';\n` +
    zusatzImport +
    `export interface Composition {\n  readonly versionCheck: ${feldTyp};\n}\n` +
    `export function compose(options: CompositionOptions): Composition {\n` +
    rumpfVorne +
    `  const versionCheck = createVersionChecker(${aufrufobjekt});\n` +
    `  return { versionCheck };\n` +
    `}\n`
  );
}

/**
 * Ein Stumpf des **Prüfmoduls** — für die Gegenproben zu 6g-1 (T-335).
 *
 * Er trägt den Port, damit Gestalt 2 nicht mit ihrem eigenen Satz dazwischen
 * spricht, und nur Importquellen aus {@link VERSION_FEATURE_IMPORTS}. Was er
 * sonst noch rot macht, ist gleichgültig: Jede Gegenprobe nagelt mit `erwartet`
 * fest, woran sie rot wird.
 */
function prueferStumpf(rumpf, { inFunktion = true, zeitgeber = true, zusatz = '' } = {}) {
  return (
    `import type { Logger } from '../../logger.ts';\n` +
    `import { createGithubReleaseSource } from './source.ts';\n` +
    `export interface VersionCheckStorePort {\n  write(at: Date): Promise<void>;\n}\n` +
    (inFunktion ? `async function run(): Promise<void> {\n${rumpf}}\n` : rumpf) +
    zusatz +
    /*
     * **Der geplante Eintritt gehört seit T-360 in den Stumpf** (Befund T-356).
     *
     * 6g-1 mißt seither nicht nur den Rumpf mit der Anfrage, sondern den Weg
     * vom `setTimeout`-Rückruf bis dorthin. Ohne diese drei Zeilen fände keine
     * Gegenprobe einen Weg, und der Satz über den Weg wäre in jeder von ihnen
     * derselbe — die Gegenproben führen dann ihren eigenen Meßfehlschlag
     * spazieren statt der Lücke, die sie messen sollen.
     *
     * `zeitgeber: false` ist genau **eine** Gegenprobe wert: die Untergrenze,
     * die sagt, daß dieser Leser den Weg nicht findet.
     */
    (inFunktion && zeitgeber
      ? `export function plane(): void {\n  setTimeout(() => {\n    void run();\n  }, 10);\n}\n`
      : '')
  );
}

/** Ein Stumpf des Speicheradapters — für die Gegenproben zu 6g-2 (T-335). */
function adapterStumpf(rumpf) {
  return (
    `import type { Timestamp } from '@takt/domain';\n` +
    `import { type SqlConnection } from './database.ts';\n` +
    `import type { VersionCheckStatePort } from '../ports.ts';\n` +
    `export function createVersionCheckStatePort(conn: SqlConnection): VersionCheckStatePort {\n` +
    `  return {\n` +
    `    async lastCheckAt(): Promise<Timestamp | null> {\n` +
    `      const row = conn.prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1').get();\n` +
    `      const value = row?.['last_version_check_at'];\n` +
    `      return typeof value === 'string' ? (value as Timestamp) : null;\n` +
    `    },\n` +
    rumpf +
    `  };\n}\n`
  );
}

/** Das Objektliteral, mit dem die Verdrahtung den Speicheradapter einsetzt. */
const ADAPTER_AUFRUFOBJEKT = (mitglied) =>
  `{\n    logger,\n    now: clock,\n` +
  `    source: options.releaseSource,\n` +
  `    store: { write: (at: Date) => versionCheckState.${mitglied}(toTimestamp(at)) },\n  }`;

/**
 * Dasselbe mit **frei gesetzten Stellen** im Portliteral — für 6h (T-342).
 *
 * `ADAPTER_AUFRUFOBJEKT('recordCheck')` ist der Nullpunkt dieser Reihe: Sein
 * Portliteral steht zeichengleich unter {@link PORTLITERAL_ANWEISUNGEN}, und
 * jede Gegenprobe unten ändert daran genau eine Sache.
 */
const PORTLITERAL_AUFRUFOBJEKT = (stellen) =>
  `{\n    logger,\n    now: clock,\n` +
  `    source: options.releaseSource,\n` +
  `    store: { ${stellen} },\n  }`;

/** Die eine Stelle, wie sie heute im Portliteral steht. */
const SAUBERE_PORTSTELLE = 'write: (at: Date) => versionCheckState.recordCheck(toTimestamp(at))';

/** Was eine Verdrahtungsgegenprobe braucht, damit nur 6h oder 6j spricht. */
const VERDRAHTUNG_ZUSATZ =
  `import type { ReleaseSourcePort } from './features/version/source.ts';\nvoid ({} as ReleaseSourcePort);\n`;
const VERDRAHTUNG_ADAPTER = `  const versionCheckState = createVersionCheckStatePort(database.connection);\n`;

/** Die Auskunft, wie sie heute in `composition.ts` steht — für 6j (T-342). */
const AUSKUNFT = (ausdruck) => `  void { versionState: ${ausdruck} };\n`;

/**
 * Ein Stumpf des **Prüfmoduls**, der **alle** festgenagelten Laufzeitnamen
 * nennt — für die Gegenproben zu 6i (T-342).
 *
 * Die Vollständigkeit ist der Zweck: Fehlte einer der zehn Namen, spräche die
 * Untergrenze von 6i in jeder Gegenprobe mit, und keine wäre mehr ihrer Sache
 * zuzuordnen. Genau dafür gibt es die Gegenprobe „ein festgenagelter
 * Laufzeitname kommt nicht mehr vor", und sie nimmt **einen** heraus.
 */
const PRUEFMODUL_LAUFZEITSTUMPF = (rumpf) =>
  `import type { Logger } from '../../logger.ts';\n` +
  `import { createGithubReleaseSource } from './source.ts';\n` +
  `export interface VersionCheckStorePort {\n  write(at: Date): Promise<void>;\n}\n` +
  `export type Takt = ReturnType<typeof setTimeout>;\n` +
  `export function lauf(): void {\n` +
  `  void [AbortController, Infinity, Math, Number, String, clearTimeout, createGithubReleaseSource];\n` +
  `  void ({} as Logger);\n` +
  rumpf +
  `}\n`;

/**
 * Dasselbe für das **Quellmodul** — elf Namen, und alle stehen darin.
 *
 * `weggelassen` nimmt genau einen davon wieder heraus; das ist die Gegenprobe
 * zur Untergrenze und der einzige Grund, warum der Parameter existiert.
 */
const QUELLMODUL_LAUFZEITSTUMPF = (rumpf, weggelassen = []) =>
  `export type ReleaseLookup = { readonly ok: boolean };\n` +
  `export type Alle = Record<string, never>;\n` +
  `export interface ReleaseSourcePort {\n  latest(signal: AbortSignal): Promise<ReleaseLookup>;\n}\n` +
  `export function createGithubReleaseSource(): ReleaseSourcePort {\n` +
  `  void [${['Array', 'JSON', 'Object', 'Response', 'TextDecoder', 'Uint8Array', 'fetch', 'undefined']
    .filter((name) => !weggelassen.includes(name))
    .join(', ')}];\n` +
  `  return {\n    async latest(signal: AbortSignal): Promise<ReleaseLookup> {\n` +
  rumpf +
  `    },\n  };\n}\n`;

/**
 * Ein Stumpf der Startdatei.
 *
 * `pruefer: false` läßt die Zerlegung weg — das ist die Lage „niemand nennt den
 * Prüfer hier", und sie ist etwas anderes als „er wird nicht gestartet".
 */
function startStumpf(rumpf, { pruefer = true } = {}) {
  return (
    `import { VERSION_CHECK_START_DELAY_MS } from './features/version/version.ts';\n` +
    `export async function main(composed: Composition): Promise<void> {\n` +
    `  void VERSION_CHECK_START_DELAY_MS;\n` +
    (pruefer ? `  const { versionCheck } = composed;\n` : '') +
    rumpf +
    (pruefer ? `  const shutdown = (): void => {\n    versionCheck.stop();\n  };\n  void shutdown;\n` : '') +
    `}\n`
  );
}

const COUNTER_PROOFS = {
  /*
   * ==========================================================================
   * Zwei Einträge auf **einer** eingesetzten Datei — und warum das kein
   * Doppel ist (Befund T-291 zu Zeile 1084)
   * ==========================================================================
   *
   * `checkAddresses` wird von dieser einen Zeile aus **zwei unabhängigen
   * Zweigen** rot: „dritte Adresse auf github.com" (die Zeichenkette ist weder
   * die Abfrageadresse noch die Release-Seite) und „nennt api.github.com
   * außerhalb der einen Stelle" (der Wirt steht im Text). Bis T-292 stand hier
   * ein Eintrag ohne `erwartet`, und damit war **einer der beiden** ungemessen:
   * Gemessen (T-291) ließ sich der Zweig „dritte Adresse" — die Hälfte, die im
   * Namen der Prüfung steht — ersatzlos entfernen, ohne daß der Lauf es merkte;
   * der zweite Zweig trug allein.
   *
   * Ein Eintrag kann mit `erwartet` immer nur **einen** Zweig festnageln. Wer
   * beide behalten will, schreibt beide hin. Deshalb dieselbe Datei zweimal,
   * mit je einem `erwartet`: Streicht jemand einen der beiden Zweige, wird
   * genau die zugehörige Gegenprobe rot, und es steht dran, welcher.
   */
  adressen: [
    {
      name: 'die Zeichenkette ist eine dritte Adresse auf github.com',
      path: 'apps/web/src/lib/eingesetzt.ts',
      source: `export const ZWEITE = "https://api.github.com/repos/jemand/anderes/releases/latest";\n`,
      erwartet: /dritte Adresse auf github\.com/,
    },
    {
      name: 'dieselbe Zeile nennt außerdem den Wirt außerhalb der einen Stelle',
      path: 'apps/web/src/lib/eingesetzt.ts',
      source: `export const ZWEITE = "https://api.github.com/repos/jemand/anderes/releases/latest";\n`,
      erwartet: /nennt api\.github\.com außerhalb der einen Stelle/,
    },
    /*
     * Die drei Zweige, die bis T-294 **gar keine** Gegenprobe hatten.
     *
     * `checkAddresses` ist die Prüfung mit den meisten Zweigen und hatte die
     * dünnste Deckung: zwei von fünf. Die drei hier sind nicht ausgedacht,
     * sondern am Quelltext abgezählt (T-293) — und der erste ist der Zweig, der
     * den Namen der Prüfung trägt: „die Abfrageadresse steht **einmal**".
     */
    {
      name: 'die Abfrageadresse selbst, aber an einem zweiten Ort',
      path: 'apps/web/src/lib/eingesetzt.ts',
      source: `export const ABFRAGE = "https://api.github.com/repos/KuyomieKurama/SuperTakt/releases/latest";\n`,
      erwartet: /die Abfrageadresse steht außerhalb von/,
    },
    {
      name: 'die Adresse der Release-Seite an einem dritten Ort',
      path: 'apps/web/src/features/board/eingesetzt.ts',
      source: `export const SEITE = "https://github.com/KuyomieKurama/SuperTakt/releases/tag/v1.2.3";\n`,
      erwartet: /die Adresse der Release-Seite steht an einem fremden Ort/,
    },
    {
      /*
       * Die Untergrenze, und deshalb als **Wegnahme** und nicht als Einsetzung:
       * Ein zweites Vorkommen zählt ohnehin schon die Zeile darüber mit. Was
       * hier gemessen wird, ist die andere Richtung — die Adresse ist **weg**,
       * und `apiCount !== 1` ist der einzige Zweig, der das noch sagen kann.
       */
      name: 'Untergrenze: die Abfrageadresse steht nirgends mehr',
      entfernt: [API_URL_FILE],
      erwartet: /die Abfrageadresse kommt 0-mal vor/,
    },
  ],
  /*
   * `felder` hatte einen Verstoß für vier Zweige, und drei davon messen den
   * Namen, der diesem Lauf am meisten Mühe macht: `tag_name` (T-293).
   */
  felder: [
    {
      name: '`html_url` aus der Antwort gelesen',
      path: 'apps/web/src/lib/eingesetzt.ts',
      source: `export const verweis = (release: any) => release.html_url;\n`,
      erwartet: /liest oder nennt `html_url`/,
    },
    {
      name: '`.tag_name` als Punktzugriff — die naheliegende Schreibweise',
      path: 'apps/web/src/lib/eingesetzt.ts',
      source: `export const fassung = (release: any) => release.tag_name;\n`,
      erwartet: /liest `\.tag_name` als Feld eines Objekts/,
    },
    {
      name: '`tag_name` als Zeichenkette an einer zweiten Stelle',
      path: 'apps/web/src/lib/eingesetzt.ts',
      source: `export const fassung = (daten: Record<string, unknown>) => daten['tag_name'];\n`,
      erwartet: /greift auf `tag_name` zu/,
    },
    {
      /*
       * Dieselbe Untergrenze wie bei `adressen`, und sie ist hier mehr als
       * Symmetrie: Wird `tag_name` nirgends mehr gelesen, liest die
       * Versionsprüfung die Fassung nicht mehr — sie ist dann still kaputt, und
       * genau still ist sie nach A-18.11 ohnehin schon.
       */
      name: 'Untergrenze: `tag_name` wird nirgends mehr gelesen',
      entfernt: [API_URL_FILE],
      erwartet: /`tag_name` wird 0-mal gelesen/,
    },
  ],
  oeffnen: [
    {
      name: 'eine Adresse in der Nutzlast des Öffnen-Befehls',
      path: 'apps/desktop/src/eingesetzt.ts',
      source: `await invoke('takt_open_release', { version, url: release.htmlUrl });\n`,
      erwartet: /bekommt außer `version` noch/,
    },
    {
      /*
       * Die andere Seite derselben Naht, und sie ist die schwerere: Die Hülle
       * baut die Adresse selbst (E-064 Punkt 4). Ein zweiter Parameter dort ist
       * der Punkt, an dem eine fremde Zeichenkette in den Browser des Benutzers
       * käme — B-18.2, wörtlich.
       */
      name: 'die Signatur in der Hülle nimmt eine Adresse entgegen',
      path: 'apps/desktop/src-tauri/src/eingesetzt.rs',
      source:
        `#[tauri::command]\n` +
        `pub fn takt_open_release(version: String, url: String) -> Result<(), String> {\n` +
        `    let _ = (version, url);\n` +
        `    Ok(())\n` +
        `}\n`,
      erwartet: /nimmt etwas entgegen, das eine Adresse sein kann/,
    },
    {
      name: 'ein Anker, der den Webview selbst nach github.com trüge',
      path: 'apps/web/src/features/settings/eingesetzt.tsx',
      source: `export const Hinweis = () => <a href="https://github.com/KuyomieKurama/SuperTakt/releases">Fassungen</a>;\n`,
      erwartet: /ein `href` zeigt auf github\.com/,
    },
  ],
  /*
   * `download` hat **einen** Zweig für vierzehn Marken, und das ist die Stelle,
   * an der die Zählvorschrift aus T-293 bewußt nicht angewandt wird: Nicht die
   * Marke ist der Zweig, sondern der Satz. Was damit ungemessen bleibt — das
   * **teilweise** Leeren der Liste —, steht als Risiko im Bericht zu T-294 und
   * gehört in eine eigene Entscheidung, nicht in eine stillschweigende.
   */
  download: {
    name: 'ein Aktualisierungs-Zusatz, der herunterlädt und installiert',
    path: 'apps/desktop/src/eingesetzt.ts',
    source: `import { downloadAndInstall } from '@tauri-apps/plugin-updater';\n`,
    erwartet: /nennt `downloadAndInstall`/,
  },
  ausgang: [
    /*
     * Die vier Schreibweisen tragen seit T-294 ihr `erwartet`, und der Grund ist
     * derselbe wie bei `adressen`: Jede der vier setzt **zwei** Zweige auf
     * einmal in Gang — „nennt `fetch` außerhalb der einen Stelle" und „steht in
     * 2 Dateien statt einer". Ohne `erwartet` hätte die Zählung allein alle vier
     * getragen, und der Zweig, den T-143 S-1 gemessen hat, wäre still
     * abzuschaffen gewesen.
     */
    {
      name: 'nacktes `fetch(`',
      path: 'apps/local-api/src/routes/eingesetzt.ts',
      source: `export const laden = () => fetch('https://beispiel.invalid/x');\n`,
      erwartet: /nennt `fetch` außerhalb der einen Stelle/,
    },
    {
      name: '`globalThis.fetch(` — die Lücke aus T-143 S-1',
      path: 'apps/local-api/src/routes/eingesetzt.ts',
      source: `export const laden = () => globalThis.fetch('https://beispiel.invalid/x');\n`,
      erwartet: /nennt `fetch` außerhalb der einen Stelle/,
    },
    {
      name: '`window.fetch(`',
      path: 'apps/local-api/src/routes/eingesetzt.ts',
      source: `export const laden = () => window.fetch('https://beispiel.invalid/x');\n`,
      erwartet: /nennt `fetch` außerhalb der einen Stelle/,
    },
    {
      name: 'eine Zerlegung: `const { fetch: holen } = globalThis`',
      path: 'apps/local-api/src/routes/eingesetzt.ts',
      source: `const { fetch: holen } = globalThis;\nexport const laden = () => holen('https://beispiel.invalid/x');\n`,
      erwartet: /nennt `fetch` außerhalb der einen Stelle/,
    },
    {
      /*
       * Die Untergrenze der Zählung, und sie ist keine Formsache: Verschwindet
       * der eine Ausgang, dann fragt niemand mehr — die Versionsprüfung ist
       * still aus, und still ist sie nach A-18.11 im Fehlerfall ohnehin. Der
       * Lauf urteilt über „genau ein Ausgang"; eine Null ist davon so weit
       * entfernt wie eine Zwei.
       */
      name: 'Untergrenze: der eine Ausgang liegt nicht mehr im Baum',
      entfernt: [API_URL_FILE],
      erwartet: /`fetch` steht in 0 Dateien des Dienstes/,
    },
    {
      /*
       * Der dritte Zweig dieser Prüfung, bis T-294 ohne Gegenprobe: Der
       * Netzaufruf **in** einer Routendatei wäre eine Anfrage weit von jedem
       * lokalen Prozeß entfernt (A-V-10). Er trägt kein `fetch` und fällt
       * deshalb durch die vier Schreibweisen oben.
       */
      name: 'eine Routendatei kennt die Abholfunktion',
      path: 'apps/local-api/src/routes/eingesetzt.ts',
      source:
        `import { createGithubReleaseSource } from '../features/version/source.ts';\n` +
        `export const quelle = createGithubReleaseSource;\n`,
      erwartet: /eine Routendatei kennt die Abholfunktion/,
    },
  ],
  /*
   * ==========================================================================
   * Dieselbe Bauart bei `optionen`, und hier war die Hälfte des Wächters
   * ungemessen (Befund T-291 zu Zeile 1122)
   * ==========================================================================
   *
   * `checkFetchOptions` mißt zwei Listen gegen **dieselbe** Datei: drei Marken,
   * die dastehen müssen (`REQUIRED_IN_SOURCE`), und vier, die nicht dastehen
   * dürfen (`FORBIDDEN_IN_SOURCE`). Die eine eingesetzte Zeile
   * `const daten = await response.json();` verletzt beide auf einmal — sie läßt
   * alle drei Zusagen aus **und** nennt `.json()` — und ergibt vier Befunde aus
   * vier Zweigen.
   *
   * Bis T-292 stand dafür ein Eintrag ohne `erwartet`. Gemessen (T-291): Setzt
   * man `FORBIDDEN_IN_SOURCE = []`, sieht der Wächter `.json()`, `.text()`,
   * `.arrayBuffer()` und `content-length` in der einen ausgehenden Datei nicht
   * mehr — und der Lauf bleibt bei 43/0. Die verbotene Hälfte war nie gemessen;
   * die drei fehlenden Zusagen trugen die Gegenprobe allein.
   *
   * Auch hier: zwei Einträge auf derselben Zeile, je ein `erwartet`, je ein
   * Zweig. **Was damit noch nicht gemessen ist** und ausdrücklich offen bleibt
   * (eigener Auftrag, T-291): das teilweise Leeren der Listen. Wer
   * `FORBIDDEN_IN_SOURCE` auf `['.json()']` kürzt, verliert drei Marken, ohne
   * daß eine Gegenprobe anschlägt — dafür bräuchte jede Marke ihren eigenen
   * Eintrag, so wie `ausgang` seine vier Schreibweisen einzeln hat.
   */
  optionen: [
    {
      name: 'die Zeile nennt `.json()` — eine der vier verbotenen Abkürzungen',
      path: API_URL_FILE,
      // Dieselbe Datei, aber ohne ihre Zusagen: der Verstoß ist die Auslassung.
      source: `const daten = await response.json();\n`,
      erwartet: /nennt `\.json\(\)`/,
    },
    {
      name: 'dieselbe Zeile läßt die drei Zusagen des Aufrufs aus',
      path: API_URL_FILE,
      source: `const daten = await response.json();\n`,
      erwartet: /`redirect: 'error'` fehlt/,
    },
    {
      /*
       * Der dritte Zweig, und er ist der gefährlichste dieser Prüfung: Findet
       * `checkFetchOptions` die eine ausgehende Datei nicht, gibt sie **einen**
       * Befund zurück und liest die beiden Listen gar nicht mehr. Ein Umzug von
       * `source.ts` machte damit bis T-294 aus sieben gemessenen Marken einen
       * Satz, den keine Gegenprobe je erreicht hat — die Prüfung wäre rot, aber
       * über sich selbst und nicht über die Datei.
       */
      name: 'Untergrenze: die eine ausgehende Datei liegt nicht mehr im Baum',
      entfernt: [API_URL_FILE],
      erwartet: /source\.ts fehlt/,
    },
  ],
  /*
   * ==========================================================================
   * 22 Verstöße für den Rückweg — fünf Gestalten, und zu jeder ihre Grenze
   * ==========================================================================
   *
   * Vier davon sind die Obergrenzen der Gestalten 1 bis 4: der Leser über den
   * Port, `read` am Port, der Spaltenname am Port vorbei, der rohe `SELECT *`.
   * Die dritte ist **wörtlich die Meßdatei**, mit der der security-checker
   * diesen Lauf in T-287 ausgehebelt hat (damals grün).
   *
   * Sechs sind in T-290 dazugekommen, und jede schließt eine Lücke, die
   * gemessen wurde und nicht vermutet ist:
   *
   *  - (e) `read` hinter einem **Inline-Objekttyp**. Der alte Rumpf-Ausdruck
   *    brach am ersten `}` und urteilte bei dieser Signatur grün — die Gestalt
   *    aus T-279 war unter einer Option unsichtbar (Befund T-289 zu Zeile 828).
   *  - (f) der **geliehene Port** — V1b aus T-289, die Gestalt, mit der der
   *    security-checker bei 37/0 an allen vier Gestalten vorbeikam.
   *  - (g) bis (j) die **Untergrenzen**. Sie standen seit T-288 im Code und
   *    wirkten, aber kein Verstoß erreichte sie je; das ist genau der Fehler,
   *    gegen den T-143 S-1 geschrieben wurde: Eine Gegenprobe, die die Lücke
   *    nicht trifft, ist keine. Jetzt trifft jeder Zweig einzeln.
   *
   * Fünf sind in T-292 dazugekommen, und alle fünf liegen an Gestalt 2 — dort,
   * wo dieser Wächter dreimal hintereinander gerissen ist:
   *
   *  - (k) `read` als **Eigenschaft** (`readonly read: () => …`) und (l) ein
   *    `}` **in einer Zeichenkette** der Signatur. Beide machten den Lauf bei
   *    43/0 grün (Befunde T-291 zu 1030 und 816), obwohl der Rückweg gebaut
   *    dastand. Sie sind seit T-292 rot, weil der Compiler liest.
   *  - (m) eine Signatur über mehrere Zeilen — **kein eigener Zweig**, sondern
   *    ein Merkposten gegen den vierten Anlauf mit einem regulären Ausdruck.
   *    Das gehört dazugesagt: Sie ist heute rot und war es auch unter dem Leser
   *    aus T-290; keine der gefahrenen Mutationen dreht sie allein.
   *  - (n) der **Typalias**. `portMitglieder` nimmt seit T-292 auch
   *    `type X = { … }` an, damit ein Umschreiben denselben Wächter trifft und
   *    nicht einen Meßfehlschlag — und ein Zweig, den dieser Lauf neu anlegt,
   *    braucht seine eigene Gegenprobe, sonst ist er genau das, was hier
   *    dreimal schiefging.
   *  - (o) die **Untergrenze der Gestalt 2**: kein einziges gelesenes Mitglied.
   *    Sie fehlte bis T-292 vollständig. **Nicht** aber, wie hier bis T-294
   *    stand, weil sie der gemeinsame Nenner der drei Ausfälle wäre: Gemessen
   *    am nachgebauten Leser aus T-290 fand der jedesmal genau ein Mitglied
   *    (`write`), nie null (T-293). Sie ist auch gegen **keinen** Leser der
   *    Unterschied zwischen grün und rot (T-295, M2) — was sie leistet, ist,
   *    daß ein **blinder** Leser nicht den Satz bekommt, der seit T-294 dem
   *    Zweig (u) gehört („kennt kein `write` mehr"). „Nichts gefunden" und
   *    „nichts gesehen" sind zwei Sätze, und zwei Befunde dürfen sich keinen
   *    teilen.
   *  - (p) die **ordnerinterne** Quelle außerhalb der Erlaubnisliste. Der
   *    Befundsatz der Gestalt 5 ist in T-292 nach Quelle getrennt worden
   *    (Befund T-291 zu Zeile 1002); ein neuer Zweig ohne Gegenprobe wäre in
   *    dieser Datei der schlechteste aller Beiträge.
   *
   * Sechs sind in T-294 dazugekommen, und sie liegen wieder alle an Gestalt 2 —
   * diesmal aber nicht an der Schreibweise, sondern an der **Auflösung** und an
   * den Sätzen, die `pruefeGestaltDesPorts` außer „kennt außer `write` noch …"
   * noch kennt:
   *
   *  - (q) `read` über **`extends`** geerbt und (r) **zwei `interface`** gleichen
   *    Namens. Beide machten in T-293 alle fünf Gestalten grün, mit `port.read()`
   *    daneben gerufen — die dritte Runde derselben Klasse, nur eine Ebene
   *    neben der Schreibweise.
   *  - (s) der Alias auf eine **Verschneidung**, (t) der **umbenannte** Port und
   *    (v) die Datei mit dem Port **nicht im Baum**: drei Meßfehlschläge, die es
   *    schon gab und die kein Verstoß je erreicht hat. (v) fiel bisher als
   *    Nebenwirkung des weggenommenen Ordners, dessen `erwartet` auf einen
   *    anderen Satz zeigt — gezählt, aber nicht gemessen.
   *  - (u) der Port **ohne `write`**. Der Prüfsatz heißt „kann `write` und sonst
   *    nichts"; gegengeprobt war bis T-294 nur das „sonst nichts".
   *
   * Vier sind in T-296 dazugekommen, und sie schließen die **dritte und letzte**
   * Tür derselben Klasse — die Deklarationszusammenführung über eine Datei- oder
   * Blockgrenze hinweg. Mit ihr hat der code-reviewer in T-295 drei Stände bei
   * **68/0 grün** gehalten, während `tsc` `port.read()` mit Exit 0 übersetzte:
   *
   *  - (w) der Portname in einer **zweiten gelesenen Datei**;
   *  - (x) ein `declare module './version.ts'` in einer zusätzlichen Datei **ohne
   *    einen einzigen Import** (ZZ-F — Gestalt 5 sieht sie deshalb nicht);
   *  - (y) derselbe Block **in** der Datei des Ports (ZZ-D);
   *  - (z) `declare global` ebendort (ZZ-E).
   *
   * Warum (x), (y) und (z) sich einen Befundsatz teilen und trotzdem drei
   * Einträge sind, steht bei ihnen: Jede plausible schwächere Umsetzung dieses
   * Wächters trennt sie, und zwar jede anders.
   *
   * Einer ist in T-320 dazugekommen, und er ist die **fünfte** gemessene
   * Niederlage derselben Klasse:
   *
   *  - (α) ZZ-F′: dieselbe Erweiterung wie (x), aber unter `src/**\/test/**`.
   *    Sie lag im Übersetzungsprogramm und außerhalb des gelesenen Baums, weil
   *    `SKIP_DIRECTORIES` drei Verzeichnisnamen auf **jeder** Tiefe übersprang
   *    (T-318 B-1). Der Eintrag mißt das Erkennen; daß der Baum die Datei
   *    überhaupt liefert, messen zwei eigene Prüfsätze in Abschnitt 0. Die
   *    Lehre daraus steht bei {@link uebersetzungsprogramm} und ist die von
   *    E-099 Punkt 3: **Wer eine Abwesenheit zusichert, spannt seine Menge an
   *    der Anforderung auf** — hier also an dem, was der Compiler übersetzt,
   *    nicht an einer Verzeichnisliste.
   *
   * Zwei Dinge an der Form, beide Absicht:
   *
   *  - `erwartet` nagelt fest, **woran** die Gegenprobe rot wird. Ohne das wäre
   *    (j) — der Ordner ist weg — auch dann grün gemeldet, wenn nur die alte
   *    Prüfung auf `VERSION_CHECKER_FILE` anschlägt; die Gegenprobe maß dann
   *    einen Zufall und nicht ihre Gestalt.
   *  - Die Verstöße, die `version.ts` **ersetzen** ((b), (e), (k) bis (o); (p)
   *    nicht, der legt eine eigene Datei daneben),
   *    tragen deren zwei ordnerinterne Importzeilen mit. Ohne sie schlüge die
   *    Untergrenze von Gestalt 5 an, und der Verstoß wäre aus dem falschen
   *    Grund rot. Wer sie streicht, bricht die Gegenprobe, ohne daß sie rot
   *    wird — deshalb dieser Satz hier.
   */
  rueckweg: [
    {
      name: 'ein Leser irgendwo im Baum',
      path: 'apps/local-api/src/features/version/eingesetzt.ts',
      source: `const zuletzt = await versionCheckState.lastCheckAt();\n`,
      erwartet: /liest den gemerkten Zeitpunkt/,
    },
    {
      name: '`read` am Port des Prüfers — die Gestalt aus T-279',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {\n` +
        `  read(): Promise<string | null>;\n` +
        `  write(at: Date): Promise<void>;\n` +
        `}\n`,
      erwartet: /VersionCheckStorePort kennt außer/,
    },
    {
      name: 'roher `SELECT last_version_check_at` am Port vorbei — die Meßdatei aus T-287',
      path: 'apps/local-api/src/features/version/eingesetzt.ts',
      source:
        `export const zuletzt = (conn: Datenbank) =>\n` +
        `  conn.prepare('SELECT last_version_check_at FROM app_setting WHERE id = 1').get();\n`,
      erwartet: /nennt die Spalte/,
    },
    {
      name: '`SELECT *` ohne den Spaltennamen — der Zugriff, der auch den Namen umgeht',
      path: 'apps/local-api/src/features/version/eingesetzt.ts',
      source:
        `export const zeile = (conn: Datenbank) =>\n` +
        `  conn.prepare('SELECT * FROM app_setting WHERE id = 1').get();\n`,
      erwartet: /faßt mit/,
    },
    {
      name: '`read` hinter einem Inline-Objekttyp — die Lücke des alten Rumpf-Ausdrucks (T-289)',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {\n` +
        `  write(at: Date, opts: { force: boolean }): Promise<void>;\n` +
        `  read(): Promise<string | null>;\n` +
        `}\n`,
      erwartet: /VersionCheckStorePort kennt außer/,
    },
    /*
     * ------------------------------------------------------------------------
     * Vier Schreibweisen desselben `read` — die Reihe, die T-292 nachgezogen hat
     * ------------------------------------------------------------------------
     *
     * Sie sind nicht Vollständigkeit um ihrer selbst willen, sondern genau die
     * Schreibweisen, an denen die drei vorherigen Leser gemessen gescheitert
     * sind (T-291, Signaturtafel D bis H). Eine davon — `readonly read: () =>
     * …` — ist die Schreibweise, in der `VersionCheckerOptions` **in derselben
     * Datei** steht; sie ist damit nicht exotisch, sondern der Hausstil.
     *
     * Seit T-292 liest der Compiler, und alle vier sind rot. Sie bleiben
     * stehen, damit ein vierter Anlauf mit einem regulären Ausdruck an
     * derselben Stelle nicht wieder grün ist: Wer `portMitglieder` zurückbaut,
     * bekommt hier vier rote Zeilen und in jeder steht, was er übersieht.
     */
    {
      name: '`read` als **Eigenschaft**, im Hausstil von `VersionCheckerOptions` (T-291)',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {\n` +
        `  write(at: Date): Promise<void>;\n` +
        `  readonly read: () => Promise<string | null>;\n` +
        `}\n`,
      erwartet: /VersionCheckStorePort kennt außer/,
    },
    {
      name: 'ein `}` in einer **Zeichenkette** der Signatur — die Lücke der Klammerzählung (T-291)',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {\n` +
        `  write(at: Date, mode: '}' | 'x'): Promise<void>;\n` +
        `  read(): Promise<string | null>;\n` +
        `}\n`,
      erwartet: /VersionCheckStorePort kennt außer/,
    },
    {
      name: 'eine Signatur über mehrere Zeilen — Merkposten, kein eigener Zweig',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {\n` +
        `  write(\n` +
        `    at: Date,\n` +
        `    opts?: { force: boolean },\n` +
        `  ): Promise<void>;\n` +
        `  read(\n` +
        `  ): Promise<string | null>;\n` +
        `}\n`,
      erwartet: /VersionCheckStorePort kennt außer/,
    },
    {
      name: 'der Port als **Typalias** statt als Schnittstelle',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export type VersionCheckStorePort = {\n` +
        `  write(at: Date): Promise<void>;\n` +
        `  read(): Promise<string | null>;\n` +
        `};\n`,
      erwartet: /VersionCheckStorePort kennt außer/,
    },
    {
      name: 'Untergrenze Gestalt 2: der Port hat gar keine gelesenen Mitglieder',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {}\n`,
      erwartet: /kein einziges gelesenes Mitglied/,
    },
    /*
     * ------------------------------------------------------------------------
     * Sechs Sätze der Gestalt 2, die bis T-294 keine Gegenprobe hatten
     * ------------------------------------------------------------------------
     *
     * Die vier Schreibweisen darüber messen **einen** Satz („kennt außer `write`
     * noch …") aus vier Richtungen. `pruefeGestaltDesPorts` kennt daneben sieben
     * weitere Sätze, und sechs davon erreichte kein Verstoß — darunter die
     * beiden, mit denen der code-reviewer in T-293 alle fünf Gestalten grün
     * gemacht hat, und „der Port kennt kein `write` mehr", also die Hälfte des
     * Prüfsatzes, die das Merken überhaupt trägt.
     *
     * Gezählt wird hier nach der Vorschrift aus T-293: **so viele Gegenproben,
     * wie die Prüfung unterscheidbare Befundsätze kennt.** Sie zwingt dazu, den
     * Meßfehlschlag in vier Sätze zu zerlegen (`portMitglieder`), statt ihn
     * hinter einem `null` zu sammeln — sonst wären vier Zweige eine Gegenprobe,
     * und drei davon dürften still verschwinden.
     */
    {
      name: '`read` über `extends` geerbt — der Port in zwei Hälften zerlegt (T-293)',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `interface VersionCheckReadPort {\n` +
        `  read(): Promise<string | null>;\n` +
        `}\n` +
        `export interface VersionCheckStorePort extends VersionCheckReadPort {\n` +
        `  write(at: Date): Promise<void>;\n` +
        `}\n`,
      erwartet: /erbt über `extends`/,
    },
    /*
     * Die zweite Bauart des code-reviewers stellt die Basis nicht daneben,
     * sondern holt sie aus `@takt/domain` — einer der **sieben erlaubten**
     * Importquellen. Sie ist derselbe Zweig (`heritageClauses`) und steht
     * deshalb nicht als eigener Eintrag da; was sie zusätzlich zeigt, ist, daß
     * Gestalt 5 hier nichts auffängt: Die Menge der Quellen bleibt erlaubt, und
     * der geerbte Rückweg käme durch die Vordertür.
     */
    {
      name: 'zwei `interface` gleichen Namens — TypeScript führt sie zusammen (T-293)',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {\n` +
        `  write(at: Date): Promise<void>;\n` +
        `}\n` +
        `export interface VersionCheckStorePort {\n` +
        `  read(): Promise<string | null>;\n` +
        `}\n`,
      erwartet: /ist 2-mal deklariert/,
    },
    {
      /*
       * Ein Alias auf eine **Verschneidung** ist das, was `extends` für die
       * Schnittstelle ist — dieselbe Zerlegung, andere Schreibweise. Der Leser
       * löst sie nicht auf und sagt es.
       */
      name: 'der Port als Alias auf eine Verschneidung statt auf ein Typliteral',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `interface VersionCheckReadPort {\n` +
        `  read(): Promise<string | null>;\n` +
        `}\n` +
        `export type VersionCheckStorePort = VersionCheckReadPort & {\n` +
        `  write(at: Date): Promise<void>;\n` +
        `};\n`,
      erwartet: /ist ein Alias auf IntersectionType/,
    },
    {
      name: 'der Port heißt anders — der Leser findet den Namen nicht mehr',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckWriterPort {\n` +
        `  write(at: Date): Promise<void>;\n` +
        `}\n`,
      erwartet: /steht nicht \(mehr\) als Schnittstelle oder Typliteral darin/,
    },
    {
      /*
       * Die andere Richtung der Gestalt 2, und sie ist keine Formsache: Ohne
       * `write` merkt sich niemand den Zeitpunkt der ausgehenden Anfrage. Der
       * Prüfsatz heißt „der Port kann `write` und sonst nichts" — bis T-294 war
       * nur das „sonst nichts" gegengeprobt.
       */
      name: 'der Port kann nur noch lesen — `write` ist weg',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {\n` +
        `  read(): Promise<string | null>;\n` +
        `}\n`,
      erwartet: /kennt kein `write` mehr/,
    },
    {
      /*
       * Die Untergrenze der Gestalt 2, eine Ebene über der leeren
       * Mitgliederliste: Die Datei mit dem Port liegt gar nicht im gelesenen
       * Baum. Sie wurde bisher nur als **Nebenwirkung** des weggenommenen
       * Ordners ausgelöst (Eintrag darunter), dessen `erwartet` auf einen
       * anderen Satz zeigt — die Gegenprobe maß also einen Zufall.
       */
      name: 'Untergrenze Gestalt 2: die Datei mit dem Port liegt nicht im Baum',
      entfernt: [VERSION_CHECKER_FILE],
      erwartet: /version\.ts: nicht im gelesenen Baum/,
    },
    /*
     * ------------------------------------------------------------------------
     * Vier Einträge für die **dritte** Tür derselben Klasse (T-295, T-296)
     * ------------------------------------------------------------------------
     *
     * `extends` ist seit T-294 zu. Der zweite und letzte Weg, einer
     * Schnittstelle ein Mitglied zu geben, das nicht in ihrer Deklaration steht,
     * ist die **Deklarationszusammenführung** — und die war nur für zwei
     * oberste Anweisungen **derselben** Datei zu, weil `datei.statements` nichts
     * anderes sieht. Der code-reviewer hat in T-295 drei Stände gebaut, die alle
     * **68/0 grün** blieben, während `port.read()` gegen `tsc` mit **Exit 0**
     * durchlief; der stärkste davon ist eine **zusätzliche Datei ohne einen
     * einzigen Import** (ZZ-F) — Gestalt 5 fängt sie deshalb nicht, und
     * `apps/local-api/tsconfig.json` nimmt sie über `"include": ["src"]`
     * trotzdem ins Programm.
     *
     * Warum das vier Einträge sind und nicht einer: Die beiden Sätze (die
     * Erweiterung und die zweite Deklaration) sind zwei; die drei Erweiterungen
     * teilen sich ihren Satz und ihr `erwartet` wie die vier Schreibweisen von
     * `fetch` (T-143 S-1) — weil jede **plausible schwächere Umsetzung** dieses
     * Wächters sie trennt, und zwar jede anders:
     *
     *   - ein Textlauf über `version.ts` nach `declare module` fängt nur (y);
     *   - ein Compilerlauf über `version.ts` allein fängt (y) und (z), nicht (x);
     *   - ein Textlauf über den Baum nach `declare module` fängt (x) und (y),
     *     nicht (z).
     *
     * Wer eine davon streicht, bekommt genau eine rote Zeile und daneben den
     * Namen der Bauart, die sie gemessen hat.
     */
    {
      /*
       * (w) Der Name steht ein zweites Mal im Baum. Das führt TypeScript nicht
       * zusammen — zwei Module, zwei Deklarationsräume —, und genau deshalb ist
       * es ein **Meßfehlschlag** und kein Verstoß: Dieser Leser mißt die Gestalt
       * des Ports an genau einer Datei. Welche der beiden Deklarationen der
       * Prüfer wirklich einsetzt, entscheidet eine Importzeile, die er nicht
       * liest.
       */
      name: 'eine zweite gelesene Datei deklariert denselben Portnamen',
      path: 'apps/local-api/src/features/version/zweiter-port.ts',
      source:
        `export interface VersionCheckStorePort {\n` +
        `  read(): Promise<string | null>;\n` +
        `  write(at: Date): Promise<void>;\n` +
        `}\n`,
      erwartet: /`VersionCheckStorePort` steht hier ein zweites Mal im Baum/,
    },
    {
      /*
       * (x) ZZ-F, der Stand des code-reviewers — mit einer Berichtigung, die in
       * T-296 gegen `tsc` gemessen ist und die Sache nicht schwächer macht:
       * Eine Datei, die **nur** den Block enthält, ist ein Skript und keine
       * Modulerweiterung; TypeScript lehnt sie mit
       * `TS2436: Ambient module declaration cannot specify relative module name`
       * ab. Es braucht **eine** Zeile `export {};`, damit die Datei ein Modul
       * ist — und das ist kein Import. Damit gemessen (eigener `tsc`-Lauf,
       * `moduleResolution: bundler`, `allowImportingTsExtensions`):
       *
       *   mit dieser Datei    → Exit 0, `port.read()` übersetzt
       *   ohne sie            → `TS2339: Property 'read' does not exist on type
       *                          'VersionCheckStorePort'`
       *
       * Sechs Zeilen, kein Import, `version.ts` unberührt — und Gestalt 5 sieht
       * nichts, weil `export {};` keine Importquelle ist.
       */
      name: 'eine zweite Datei erweitert den Port über `declare module` — ohne einen einzigen Import (T-295, ZZ-F)',
      path: 'apps/local-api/src/features/version/erweiterung.ts',
      source:
        `export {};\n` +
        `declare module './version.ts' {\n` +
        `  interface VersionCheckStorePort {\n` +
        `    read(): Promise<string | null>;\n` +
        `  }\n` +
        `}\n`,
      erwartet: /erweitert fremde Deklarationen/,
    },
    {
      /*
       * (α) ZZ-F′ — **dieselbe Erweiterung, ein Verzeichnis tiefer**, und das
       * war die fünfte gemessene Niederlage dieses Laufs (T-318 B-1, gebaut in
       * T-320).
       *
       * `SKIP_DIRECTORIES` übersprang `test`, `tests` und `__tests__` auf jeder
       * Tiefe. `apps/local-api/tsconfig.json` hat `"include": ["src"]` und
       * keinen `exclude` — die Datei lag damit **im Übersetzungsprogramm** und
       * **außerhalb des gelesenen Baums**. Zusage 1 sah sie nicht, Zusage 2
       * nicht, Gestalt 5 nicht (kein Import). Gemessen mit `tsc`: `port.read()`
       * übersetzt, Exit 0.
       *
       * **Was dieser Eintrag mißt und was nicht — und der Unterschied gehört
       * dazugesagt.** Er setzt die Datei unmittelbar in den erfundenen Baum;
       * er beweist damit, daß Zusage 1 sie **erkennt**, wenn sie sie bekommt.
       * Daß `collectTree` sie **liefert**, mißt er nicht — das messen zwei
       * eigene Prüfsätze in Abschnitt 0 („keine Prüfordnernamen in
       * `SKIP_DIRECTORIES`" und „jede Datei des Übersetzungsprogramms liegt im
       * gelesenen Baum"). Beide Hälften sind nötig, und keine trägt allein:
       * Genau die zweite fehlte in T-296, und deshalb war die Klasse nicht zu.
       */
      name: 'die Erweiterung liegt unter `src/**/test/**` — im Übersetzungsprogramm, bis T-320 außerhalb des gelesenen Baums (T-318, ZZ-F′)',
      path: 'apps/local-api/src/features/version/test/augment.ts',
      source:
        `export {};\n` +
        `declare module '../version.ts' {\n` +
        `  interface VersionCheckStorePort {\n` +
        `    read(): Promise<string | null>;\n` +
        `  }\n` +
        `}\n`,
      erwartet: /erweitert fremde Deklarationen/,
    },
    {
      /*
       * (y) ZZ-D: derselbe Block **in** der Datei des Ports, die Deklaration
       * darüber unberührt. Er ist der Grund, warum `portMitglieder` weiterhin
       * nur oberste Anweisungen liest und das trotzdem trägt — die Begründung
       * steht dort.
       */
      name: 'die Datei des Ports erweitert sich selbst über `declare module` (T-295, ZZ-D)',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {\n` +
        `  write(at: Date): Promise<void>;\n` +
        `}\n` +
        `declare module './version.ts' {\n` +
        `  interface VersionCheckStorePort {\n` +
        `    read(): Promise<string | null>;\n` +
        `  }\n` +
        `}\n`,
      erwartet: /erweitert fremde Deklarationen/,
    },
    {
      /*
       * (z) ZZ-E: `declare global`. Der Block trifft den heutigen Port nicht —
       * er steht in einem Modul und nicht im globalen Raum —, und er steht
       * trotzdem hier: Gemessen wird die **Fläche**, nicht der eine Port. Ein
       * `declare global` im gelesenen Baum kann jede globale Schnittstelle
       * dieses Bestands um Mitglieder ergänzen, und dieser Leser sähe es nie.
       */
      name: 'die Datei des Ports öffnet den globalen Raum (`declare global`) (T-295, ZZ-E)',
      path: VERSION_CHECKER_FILE,
      source:
        `import type { Logger } from '../../logger.ts';\n` +
        `import { createGithubReleaseSource } from './source.ts';\n` +
        `export interface VersionCheckStorePort {\n` +
        `  write(at: Date): Promise<void>;\n` +
        `}\n` +
        `declare global {\n` +
        `  interface VersionCheckStorePort {\n` +
        `    read(): Promise<string | null>;\n` +
        `  }\n` +
        `}\n`,
      erwartet: /erweitert fremde Deklarationen/,
    },
    {
      name: 'ein **geliehener** Port: `DataArchivePort` im Ordner des Prüfers — V1b aus T-289',
      path: 'apps/local-api/src/features/version/eingesetzt.ts',
      source:
        `import type { DataArchivePort } from '@takt/storage';\n` +
        `const schluessel = ['last', 'version', 'check', 'at'].join('_');\n` +
        `export const darfFragen = async (archiv: DataArchivePort, bodenMs: number) => {\n` +
        `  const zeilen = await archiv.readAll();\n` +
        `  const wert = zeilen.appSetting?.[schluessel];\n` +
        `  return wert === undefined || Date.now() - Date.parse(String(wert)) >= bodenMs;\n` +
        `};\n`,
      erwartet: /importiert `@takt\/storage`/,
    },
    {
      name: 'eine **ordnerinterne** Quelle außerhalb der Liste — ein Umzug, kein geliehener Port',
      path: 'apps/local-api/src/features/version/eingesetzt.ts',
      source: `import { lesen } from './release-source.ts';\nexport const holen = () => lesen();\n`,
      erwartet: /eine ordnerinterne Quelle/,
    },
    {
      name: 'Untergrenze Gestalt 5: eine erlaubte Importquelle kommt im Ordner nicht mehr vor',
      path: 'apps/local-api/src/features/version/routes.ts',
      source: `export const versionRoutes = () => undefined;\n`,
      erwartet: /kommt im Ordner nicht mehr vor/,
    },
    {
      name: 'Untergrenze Gestalt 3: eine tragende Datei verliert die Spalte',
      path: 'packages/storage/src/sqlite/repo-data-archive.ts',
      source: `// die Spalte ist weg, und der Round-Trip verliert sie still\n`,
      erwartet: /der Archiv-Round-Trip verliert sie/,
    },
    {
      name: 'Untergrenze Gestalt 3: eine tragende Datei liegt nicht mehr im Baum',
      entfernt: ['packages/storage/src/sqlite/repo-version-check.ts'],
      erwartet: /repo-version-check\.ts: nicht im gelesenen Baum/,
    },
    {
      name: 'Untergrenze Gestalt 4 und 5: der Ordner des Prüfers liegt nicht im gelesenen Baum',
      entfernt: (pfad) => pfad.startsWith(VERSION_FEATURE_PREFIX),
      erwartet: /der Ordner des Prüfers liegt nicht im gelesenen Baum/,
    },
    {
      /*
       * (β) **Dieselbe Erweiterung in einer `.cts`** — die sechste gemessene
       * Umgehung dieses Laufs (T-324, gebaut in T-327).
       *
       * Sie steht neben (α) und nicht statt ihr, und der Grund ist die
       * Zählvorschrift: Mehr Einträge als Sätze brauchen den Grund, daß eine
       * **plausible schwächere Umsetzung** sie trennen würde. Hier ist die
       * schwächere Umsetzung nicht plausibel, sondern **gemessen** — bis T-327
       * entschied `istTypescriptDatei` über eine handgeschriebene Aufzählung
       * (`.ts`, `.tsx`, `.mts`), und (α) blieb dabei grün, während (β)
       * unsichtbar war. Genau wie bei den vier Schreibweisen von `fetch`
       * (T-143) und den drei Erweiterungsblöcken (T-296).
       *
       * Das `read?` ist **optional**, und das ist kein Detail: Mit einem
       * pflichtigen `read()` bricht `composition.ts` an `TS2379`, weil der
       * dort gebaute Store keines hat — die Umgehung, die wirklich gebaut
       * würde, ist deshalb die optionale. Gemessen in T-327 an einer Kopie des
       * Zweigs: `tsc -p apps/local-api/tsconfig.json --noEmit` gibt **0**
       * zurück, die Datei liegt im Programm, und dieser Lauf blieb bei
       * **76/0** grün.
       */
      name: 'die Erweiterung liegt in einer `.cts` — im Programm, bis T-327 für beide Zusagen unsichtbar (T-324, β)',
      path: 'apps/local-api/src/features/version/augment.cts',
      source:
        `export {};\n` +
        `declare module './version.ts' {\n` +
        `  interface VersionCheckStorePort {\n` +
        `    read?(): Promise<string | null>;\n` +
        `  }\n` +
        `}\n`,
      erwartet: /erweitert fremde Deklarationen/,
    },

    /*
     * =======================================================================
     * Gestalt 6 — die Verdrahtung (A-A-105, R-30, gebaut in T-327)
     * =======================================================================
     *
     * Zwanzig Sätze, zweiundzwanzig Einträge. Die beiden Mehrfachen sind
     * begründet: `start()` steht auf drei unterscheidbaren Gründen nicht
     * unbedingt im Rumpf (Bedingung, verschachtelte Funktion,
     * Optionsverkettung), und jeder davon ist eine eigene plausible
     * Umsetzung derselben Abschaltung.
     *
     * Die beiden Stümpfe unten sind absichtlich klein: Ein Eintrag soll **einen**
     * Zweig festnageln, nicht einen halben Zusammenbau nachbauen. Was in ihnen
     * fehlt, ist deshalb kein Versehen — der Stumpf für den fehlenden Schlüssel
     * hat bewußt nur zwei.
     */
    {
      name: 'ein zweiter Ort führt das Prüfmodul ein — wer den Prüfer in die Hand bekommt, ist die Verdrahtung',
      path: 'apps/local-api/src/features/settings/nachbar.ts',
      source:
        `import { createVersionChecker } from '../version/version.ts';\n` +
        `export const derNachbar = createVersionChecker;\n`,
      erwartet: /führt das Prüfmodul ein und steht nicht unter den/,
    },
    {
      name: 'die Verdrahtungsdatei führt einen Namen mehr ein, als für sie festgenagelt ist',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        SAUBERES_AUFRUFOBJEKT,
        `import { VERSION_CHECK_START_DELAY_MS } from './features/version/version.ts';\n`,
      ),
      erwartet: /führt `VERSION_CHECK_START_DELAY_MS` aus dem Prüfmodul ein/,
    },
    {
      name: 'Untergrenze 6a: eine festgenagelte Einfuhr kommt nicht mehr vor',
      path: 'apps/local-api/src/composition.ts',
      source:
        `import { createVersionChecker } from './features/version/version.ts';\n` +
        `export interface Composition {\n  readonly versionCheck: unknown;\n}\n` +
        `export function compose(options: CompositionOptions): Composition {\n` +
        `  const versionCheck = createVersionChecker(${SAUBERES_AUFRUFOBJEKT});\n` +
        `  return { versionCheck };\n` +
        `}\n`,
      erwartet: /die festgenagelte Einfuhr `VersionChecker` kommt nicht mehr vor/,
    },
    {
      name: 'Untergrenze 6a: eine festgenagelte Verdrahtungsdatei liegt nicht im Baum',
      entfernt: ['apps/local-api/src/app.ts'],
      erwartet: /die festgenagelte Verdrahtungsdatei liegt nicht im gelesenen Baum/,
    },
    {
      /*
       * **Der gemessene Ausschalter aus T-325 B-2**, und zwar in seiner
       * schärferen Gestalt: Der lesende Teil liegt in einer **anderen** Datei,
       * die Verdrahtung trägt keine einzige Datenbankmarke. Damit ist 6d grün
       * und 6b rot — genau der Punkt, an dem der security-checker sagt, (c)
       * trage allein nicht.
       */
      name: 'ein fremder Schlüssel im Aufrufobjekt: `startDelayMs` aus dem Bestand — der Ausschalter aus T-325 B-2',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        `{\n    logger,\n    now: clock,\n    startDelayMs: abschaltung(database),\n` +
          `    ...(options.releaseSource === undefined ? {} : { source: options.releaseSource }),\n` +
          `    ...(store === null ? {} : { store: { write } }),\n  }`,
        `import { abschaltung } from './features/settings/tempo.ts';\n`,
      ),
      erwartet: /trägt den Schlüssel `startDelayMs`/,
    },
    {
      name: 'ein erlaubter Schlüssel mit gerufenem Wert: `now` als Pfeilfunktion über einen gelesenen Zeitpunkt',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        `{\n    logger,\n    now: () => new Date(gelesenerZeitpunkt(database)),\n` +
          `    ...(options.releaseSource === undefined ? {} : { source: options.releaseSource }),\n` +
          `    ...(store === null ? {} : { store: { write } }),\n  }`,
      ),
      erwartet: /der Schlüssel `now` trägt ArrowFunction/,
    },
    {
      name: 'das Aufrufobjekt ist gar keines — die Schlüsselmenge steht in einer Variablen',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf('optionenAusDemBestand'),
      erwartet: /ist kein Objektliteral \(Identifier\)/,
    },
    {
      name: 'eine Streuung, die dieser Leser nicht liest — `...optionenAusDemBestand`',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        `{\n    logger,\n    now: clock,\n    ...optionenAusDemBestand,\n` +
          `    ...(options.releaseSource === undefined ? {} : { source: options.releaseSource }),\n` +
          `    ...(store === null ? {} : { store: { write } }),\n  }`,
      ),
      erwartet: /streut Identifier ein/,
    },
    {
      name: 'ein berechneter Schlüssel — der Name entsteht erst zur Laufzeit',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        `{\n    logger,\n    now: clock,\n    [schluessel]: 24 * 24 * 3_600_000,\n` +
          `    ...(options.releaseSource === undefined ? {} : { source: options.releaseSource }),\n` +
          `    ...(store === null ? {} : { store: { write } }),\n  }`,
      ),
      erwartet: /nicht als einfache Zuweisung liest \(ComputedPropertyName\)/,
    },
    {
      name: 'der Prüfer wird zweimal gebaut — zwei Takte, und welcher startet, ist eine Zeile weiter',
      path: 'apps/local-api/src/composition.ts',
      source:
        verdrahtungsStumpf(SAUBERES_AUFRUFOBJEKT) +
        `export const zweiter = createVersionChecker(${SAUBERES_AUFRUFOBJEKT});\n`,
      erwartet: /wird im gelesenen Baum 2-mal gebaut/,
    },
    {
      name: 'Untergrenze 6b: ein festgenagelter Schlüssel wird nicht mehr gesetzt',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf('{\n    logger,\n    now: clock,\n  }'),
      erwartet: /der festgenagelte Schlüssel `store` kommt in der Verdrahtung nicht mehr vor/,
    },
    {
      name: 'der Name des Prüferfeldes ist aus der Deklaration nicht mehr zu lesen',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(SAUBERES_AUFRUFOBJEKT, '', 'unknown'),
      erwartet: /Mitglied\(er\) tragen den Typ `VersionChecker`/,
    },
    {
      name: 'Untergrenze 6c: die Startdatei liegt nicht im gelesenen Baum',
      entfernt: [CHECKER_START_FILE],
      erwartet: /die Startdatei liegt nicht im gelesenen Baum/,
    },
    {
      name: 'die Startdatei nennt den Prüfer nicht mehr — niemand startet ihn',
      path: CHECKER_START_FILE,
      source: startStumpf('  logger.info("bereit");\n', { pruefer: false }),
      erwartet: /nennt das Feld `versionCheck` nicht/,
    },
    {
      name: '`start()` steht zweimal',
      path: CHECKER_START_FILE,
      source: startStumpf('  versionCheck.start();\n  versionCheck.start();\n'),
      erwartet: /`start\(\)` steht 2-mal/,
    },
    {
      name: '`start` wird als Wert weitergereicht statt gerufen',
      path: CHECKER_START_FILE,
      source: startStumpf('  const los = versionCheck.start;\n  void los;\n'),
      erwartet: /wird als Wert weitergereicht statt gerufen/,
    },
    {
      name: '`start()` steht in einer Bedingung — der Ausschalter, der wie eine Einstellung aussieht',
      path: CHECKER_START_FILE,
      source: startStumpf('  if (einstellungen.pruefen) {\n    versionCheck.start();\n  }\n'),
      erwartet: /in einer Bedingung \(IfStatement\)/,
    },
    {
      name: '`start()` steht in einer verschachtelten Funktion — gerufen wird sie anderswo',
      path: CHECKER_START_FILE,
      source: startStumpf('  const los = (): void => {\n    versionCheck.start();\n  };\n  void los;\n'),
      erwartet: /in einer verschachtelten Funktion/,
    },
    {
      name: '`start()` hinter einer Optionsverkettung — fehlt der Prüfer, geschieht still nichts',
      path: CHECKER_START_FILE,
      source: startStumpf('  versionCheck?.start();\n'),
      erwartet: /hinter einer Optionsverkettung/,
    },
    {
      name: 'an der Verdrahtung wird ein drittes Mitglied gerufen',
      path: CHECKER_START_FILE,
      source: startStumpf('  versionCheck.start();\n  void versionCheck.current();\n'),
      erwartet: /am Prüfer wird `current` gerufen/,
    },
    {
      name: '`stop()` steht zweimal — der zweite hebt den ersten Start auf',
      path: CHECKER_START_FILE,
      source: startStumpf('  versionCheck.start();\n  versionCheck.stop();\n'),
      erwartet: /`stop\(\)` steht 2-mal/,
    },
    {
      /*
       * Die **zweite, unabhängige** Zeile am gemessenen Ausschalter: Hier steht
       * der Lesegriff in der Verdrahtungsdatei selbst, und das Aufrufobjekt ist
       * sauber. 6b bliebe grün, 6d wird rot. Zusammen mit dem Eintrag zu
       * `startDelayMs` ist der Ausschalter aus T-325 B-2 damit von beiden
       * Seiten gemessen — und keine der beiden Seiten trägt allein.
       */
      name: 'die Verdrahtungsdatei faßt selbst eine Datenbank an — der Griff aus T-325 B-2',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        SAUBERES_AUFRUFOBJEKT,
        '',
        'VersionChecker',
        `  const zeile = database.connection.prepare('SELECT locale FROM app_setting WHERE id = 1').get();\n` +
          `  void zeile;\n`,
      ),
      erwartet: /verdrahtet den Prüfer und faßt mit/,
    },
    /*
     * ------------------------------------------------------------------------
     * Zwanzig Einträge für die neu gezogene Menge (T-335)
     * ------------------------------------------------------------------------
     *
     * Sie gehören zu den drei Sätzen, mit denen Gestalt 6 seit T-335 an der
     * **Anforderung** aufgespannt ist statt an `version.ts`: 6a über beide
     * Entscheidungsmodule, 6e/6f über die Tür, 6g über die Warteliste und den
     * Adapter dahinter. Die Zählvorschrift oben verlangt je unterscheidbarem
     * Befundsatz einen Eintrag; das sind hier zwanzig.
     *
     * Die drei **gemessenen** Gestalten (T-331 Z-1, T-332 K-1 und K-2) sind
     * darunter nicht einzeln aufgeführt, und das ist Absicht: Jede von ihnen
     * fällt über **zwei oder drei** dieser Zweige, und die Zweige sind hier
     * einzeln gemessen. Ihre zweiseitige Messung steht im Bericht zu T-335.
     */
    {
      name: 'Untergrenze 6a: das Quellmodul liegt nicht im gelesenen Baum',
      entfernt: ['apps/local-api/src/features/version/source.ts'],
      erwartet: /das Quellmodul liegt nicht im gelesenen Baum/,
    },
    {
      name: 'ein fremder Verbraucher des Quellmoduls — der Ausschalter aus T-331 Z-1',
      path: 'apps/local-api/src/features/settings/quelle.ts',
      source:
        `import type { ReleaseSourcePort } from '../version/source.ts';\n` +
        `export const quelle = (echte: ReleaseSourcePort): ReleaseSourcePort => echte;\n`,
      erwartet: /führt das Quellmodul ein und steht nicht unter den/,
    },
    {
      /*
       * Die beiden Einträge mit dem **Paketnamen** teilen ihren Satz mit den
       * beiden darüber und daneben. Nach der Zählvorschrift brauchen sie dafür
       * einen Grund, und er ist der stärkste, den es gibt: Die plausible
       * schwächere Umsetzung, die sie trennt, ist **die, die bis T-335 hier
       * stand** — `aufgeloesteQuelle` löste nur relative Quellen auf, und
       * `@takt/local-api/src/features/version/version.ts` ging still durch,
       * während `apps/desktop/sidecar/entry.ts` im ausgelieferten Sidecar genau
       * so einführt. Ohne diese zwei Einträge wäre die Behebung eine Behauptung.
       */
      name: 'ein fremder Verbraucher, der das Prüfmodul über den **Paketnamen** einführt',
      path: 'apps/local-api/src/eingesetzt.ts',
      source:
        `import { createVersionChecker } from '@takt/local-api/src/features/version/version.ts';\n` +
        `export const bauen = createVersionChecker;\n`,
      erwartet: /führt das Prüfmodul ein und steht nicht unter den/,
    },
    {
      name: 'die Naht im ausgelieferten Sidecar bekommt einen Port — über den Paketnamen eingeführt',
      path: 'apps/desktop/sidecar/entry.ts',
      source:
        `import { main } from '@takt/local-api/src/main.ts';\n` +
        `void main({ releaseSource: quelleAusDemBestand(store) });\n`,
      erwartet: /die Tür `releaseSource` an `main\(` trägt CallExpression/,
    },
    {
      name: 'ein erlaubter Verbraucher führt einen Namen mehr aus dem Quellmodul ein',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        SAUBERES_AUFRUFOBJEKT,
        `import { createGithubReleaseSource, type ReleaseSourcePort } from './features/version/source.ts';\n` +
          `void createGithubReleaseSource;\nvoid ({} as ReleaseSourcePort);\n`,
      ),
      erwartet: /führt `createGithubReleaseSource` aus dem Quellmodul ein/,
    },
    {
      name: 'Untergrenze 6a: die festgenagelte Einfuhr aus dem Quellmodul kommt nicht mehr vor',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(SAUBERES_AUFRUFOBJEKT),
      erwartet: /die festgenagelte Einfuhr `ReleaseSourcePort` kommt nicht mehr vor/,
    },
    {
      /*
       * A-A-107 (T-332 B-2), und der Eintrag ist der Grund, warum die
       * Verengung nicht bloß im Quelltext steht: Ohne ihn ließe sich
       * `Identifier` in {@link CHECKER_CALL_KEYS} wieder danebenschreiben, und
       * kein Prüfsatz würde es merken. Der Satz „der Schlüssel X trägt Y" ist
       * über `now` gedeckt; **diese Wertform** ist es erst hier.
       */
      name: 'A-A-107: der Schlüssel `source` trägt einen örtlichen Bezeichner — der Ausschalter aus T-332 K-2',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        `{\n    logger,\n    now: clock,\n    source: releaseSource,\n` +
          `    ...(store === null ? {} : { store: { write } }),\n  }`,
        `import type { ReleaseSourcePort } from './features/version/source.ts';\nvoid ({} as ReleaseSourcePort);\n`,
      ),
      erwartet: /der Schlüssel `source` trägt Identifier statt ein Feld der Aufrufoptionen/,
    },
    {
      name: '6e: zwei Mitglieder tragen den Typ des Ports — zwei Türen sind keine',
      path: 'apps/local-api/src/composition.ts',
      source:
        `import type { ReleaseSourcePort } from './features/version/source.ts';\n` +
        verdrahtungsStumpf(SAUBERES_AUFRUFOBJEKT) +
        `export interface CompositionOptions {\n` +
        `  readonly releaseSource?: ReleaseSourcePort;\n` +
        `  readonly zweiteQuelle?: ReleaseSourcePort;\n}\n`,
      erwartet: /2 Mitglied\(er\) tragen den Typ `ReleaseSourcePort`/,
    },
    {
      name: '6f: die Naht bekommt kein Objektliteral — die Schlüsselmenge steht dann woanders',
      path: 'apps/local-api/src/eingesetzt.ts',
      source:
        `import { compose } from './composition.ts';\n` +
        `export const gebaut = compose(optionen);\n`,
      erwartet: /`compose\(` bekommt Identifier statt eines Objektliterals/,
    },
    {
      name: '6f: die Tür trägt einen Aufruf — der Ausschalter aus T-331 Z-1, an der Naht gemessen',
      path: 'apps/local-api/src/eingesetzt.ts',
      source:
        `import { compose } from './composition.ts';\n` +
        `export const gebaut = compose({ releaseSource: quelleAusDemBestand(store) });\n`,
      erwartet: /die Tür `releaseSource` an `compose\(` trägt CallExpression/,
    },
    {
      name: 'Untergrenze 6f: die deklarierende Datei einer Naht deklariert sie nicht mehr',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(SAUBERES_AUFRUFOBJEKT).replace(
        'export function compose(',
        'function zusammenbau(',
      ),
      erwartet: /die Naht `compose` wird hier nicht \(mehr\) deklariert/,
    },
    {
      name: 'Untergrenze 6f: die Tür kommt an keiner Naht mehr vor',
      path: CHECKER_START_FILE,
      source: startStumpf(`  versionCheck.start();\n`),
      erwartet: /kommt an keiner der Nähte compose\/main mehr vor/,
    },
    {
      name: '6g: der Aufruf der Quelle steht nicht genau einmal',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(`  await remember(options.now());\n  void 0;\n`),
      erwartet: /`\.latest\(` steht 0-mal/,
    },
    {
      name: '6g: der Aufruf der Quelle steht in keinem Funktionsrumpf',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(`export const offen = source.latest(control.signal);\n`, { inFunktion: false }),
      erwartet: /der Aufruf der Quelle steht in keinem Funktionsrumpf/,
    },
    {
      name: '6g: der Prüfer wartet **vor** der Anfrage auf etwas Zweites',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(
        `  await drossel(store);\n` +
          `  const lookup = await source.latest(control.signal);\n  void lookup;\n`,
      ),
      erwartet: /wartet im Rumpf der ausgehenden Anfrage auf `drossel`/,
    },
    /*
     * Zwei Einträge auf **einem** Befundsatz, und diesmal mit Absicht (T-349).
     *
     * Der obige setzt einen **fremden** Namen ein und mißt damit die Regel; der
     * untere setzt genau den Namen ein, der bis T-349 dort stand, und mißt
     * damit den **Rückfall**. Nimmt jemand die Behebung von A-A-106 zurück —
     * aus Versehen, bei einem Rückbau, in einem Zweig —, ist es dieser Eintrag,
     * der es sagt, und sein Name sagt auch gleich, was zurückgefallen ist. Eine
     * Zusage, die einmal gebaut war, soll nicht an einer Gegenprobe hängen, die
     * über einen erfundenen Namen spricht.
     */
    {
      name: '6g: der Stand **vor** A-A-106 — `await remember(…)` vor der Anfrage',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(
        `  await remember(options.now());\n` +
          `  const lookup = await source.latest(control.signal);\n  void lookup;\n`,
      ),
      erwartet: /wartet im Rumpf der ausgehenden Anfrage auf `remember`/,
    },
    /*
     * Die Hälfte, die bis T-349 fehlte: **hinter** der Anfrage. Sie verhindert
     * diese eine Anfrage nicht — sie hält `inFlight` auf wahr und beendet jede
     * weitere. Für einen Ausschalter ist das dasselbe Ergebnis, eine Zeile
     * später, und der Leser, der nur nach vorn sah, war dafür blind.
     */
    {
      name: '6g: der Prüfer wartet **nach** der Anfrage auf etwas Zweites',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(
        `  const lookup = await source.latest(control.signal);\n` +
          `  await nachtrag(lookup);\n  void lookup;\n`,
      ),
      erwartet: /wartet im Rumpf der ausgehenden Anfrage auf `nachtrag`/,
    },
    /*
     * Die Untergrenze, und sie steht seit T-349 **in** der Regel statt in der
     * Erlaubnisliste: Eine leere Liste ist über jedem stummen Leser wahr. Findet
     * dieser Leser das `await` an der Anfrage selbst nicht, hat er den Rumpf
     * nicht gelesen — und sagt es.
     */
    {
      name: 'Untergrenze 6g: die Anfrage selbst steht unter keinem `await`',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(`  const lookup = source.latest(control.signal);\n  void lookup;\n`),
      erwartet: /die ausgehende Anfrage steht unter keinem `await`/,
    },
    /*
     * =======================================================================
     * Vier Einträge für den **Weg** statt für den Rumpf (T-360, Befund T-356)
     * =======================================================================
     *
     * Der erste ist der gemessene Ausgang: Die Anfrage steht in einer örtlichen
     * Hilfsfunktion, der Rumpf um sie herum ist tadellos — und das hängende
     * `await` steht in dem Rumpf, den der Zeitgeber ruft. Vor T-360 war das
     * `tsc` Exit 0, **154/0 grün** und am Modul **0 statt 40** ausgehende
     * Anfragen.
     *
     * Der zweite ist seine Untergrenze und der Grund, warum der Stumpf seit
     * T-360 einen Zeitgeber trägt: Ein Leser, der den Weg nicht findet, ist
     * über jeder Aussage über ihn wahr.
     *
     * Die letzten beiden messen dieselbe Regel an **zwei** Stellen, und das ist
     * nach der Zählvorschrift kein Doppel: Eine plausible schwächere Umsetzung
     * — sie liest nur die Glieder des Weges und nicht, was von ihnen aus
     * synchron erreichbar ist — trennt sie. Genau diese schwächere Fassung wäre
     * gegen die **leise** Gestalt aus T-357 blind, und die ist die gefährliche:
     * 3 statt 40 Anfragen bei leerem Protokoll, statt eines eingefrorenen
     * Dienstes.
     */
    {
      name: '6g-1: die Anfrage eine Funktion tiefer, das Warten im Eintritt — der Ausgang aus T-356',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(
        `  async function hole(): ReturnType<typeof source.latest> {\n` +
          `    return await source.latest(control.signal);\n` +
          `  }\n` +
          `  await new Promise<void>(() => {});\n` +
          `  const lookup = await hole();\n  void lookup;\n`,
      ),
      erwartet: /auf dem Weg vom Zeitgeber zur Anfrage wartet `run` auf/,
    },
    {
      name: 'Untergrenze 6g-1: kein Zeitgeber führt zu dem Rumpf mit der Anfrage',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(`  const lookup = await source.latest(control.signal);\n  void lookup;\n`, {
        zeitgeber: false,
      }),
      erwartet: /wird von keinem `setTimeout`-Rückruf aus erreicht/,
    },
    {
      name: '6g-1: ein synchroner Riegel im Eintritt — der fünfte Weg aus T-357 (R-4)',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(
        `  const bis = Date.now() + 86_400_000;\n` +
          `  while (Date.now() < bis) {}\n` +
          `  const lookup = await source.latest(control.signal);\n  void lookup;\n`,
      ),
      erwartet: /steht in `run` eine Schleife/,
    },
    {
      name: '6g-1: derselbe Riegel eine Funktion tiefer — die leise Fassung aus T-357',
      path: VERSION_CHECKER_FILE,
      source: prueferStumpf(
        `  merke();\n  const lookup = await source.latest(control.signal);\n  void lookup;\n`,
        {
          zusatz:
            `function merke(): void {\n` +
            `  const bis = Date.now() + 86_400_000;\n` +
            `  while (Date.now() < bis) {}\n}\n`,
        },
      ),
      erwartet: /steht in `merke` eine Schleife/,
    },
    {
      name: '6i-2: eine Einfuhr mit gerechnetem Quellnamen — die dritte Tür aus T-347 K-10c',
      path: VERSION_CHECKER_FILE,
      source: PRUEFMODUL_LAUFZEITSTUMPF(
        `  const teile = ['node', 'process'];\n  void import(teile.join(':'));\n`,
      ),
      erwartet: /führt mit einem \*\*gerechneten\*\* Quellnamen ein/,
    },
    {
      name: '6i-2: der Griff nach `constructor` — die Kette aus T-346',
      path: VERSION_CHECKER_FILE,
      source: PRUEFMODUL_LAUFZEITSTUMPF(`  void ({}).constructor;\n`),
      erwartet: /greift auf `constructor` zu/,
    },
    {
      name: '6i-2: dieselbe Kette in eckigen Klammern',
      path: VERSION_CHECKER_FILE,
      source: PRUEFMODUL_LAUFZEITSTUMPF(
        `  void ({} as Record<string, unknown>)['constructor'];\n`,
      ),
      erwartet: /greift mit dem Schlüssel `constructor` zu/,
    },
    {
      name: '6i-2: ein Schlüssel, den dieser Leser nicht lesen kann',
      path: VERSION_CHECKER_FILE,
      source: PRUEFMODUL_LAUFZEITSTUMPF(
        `  const feld = String(Math.round(Number('1')));\n` +
          `  void ({} as Record<string, unknown>)[feld];\n`,
      ),
      erwartet: /greift mit einem Schlüssel zu, den dieser Leser nicht lesen kann/,
    },
    {
      name: '6i-2: ein lesbarer Schlüssel, der nicht festgenagelt ist',
      path: VERSION_CHECKER_FILE,
      source: PRUEFMODUL_LAUFZEITSTUMPF(`  void ({} as Record<string, unknown>)['locale'];\n`),
      erwartet: /greift mit dem Schlüssel `locale` zu und steht nicht unter den/,
    },
    {
      name: 'Untergrenze 6i-2: der festgenagelte Zugriffsschlüssel kommt nicht mehr vor',
      path: RELEASE_SOURCE_FILE,
      source: QUELLMODUL_LAUFZEITSTUMPF(`      void signal;\n      return { ok: true };\n`),
      erwartet: /der festgenagelte Zugriffsschlüssel `tag_name` kommt nicht mehr vor/,
    },
    {
      name: '6g: der Port setzt ein Objektliteral ein, in dem kein Adapter gerufen wird',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(SAUBERES_AUFRUFOBJEKT),
      erwartet: /der Port `store` setzt ein Objektliteral ein, in dem kein Adapter gerufen wird/,
    },
    {
      name: '6g: der Bezeichner hinter dem Port läßt sich nicht auf einen Erzeuger auflösen',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(ADAPTER_AUFRUFOBJEKT('recordCheck')),
      erwartet: /`versionCheckState` hinter dem Port `store` läßt sich in dieser Datei nicht auf einen Erzeuger auflösen/,
    },
    {
      name: '6g: zwei Dateien deklarieren den Erzeuger des Adapters',
      path: 'packages/storage/src/sqlite/zweiter-adapter.ts',
      source:
        `import { type SqlConnection } from './database.ts';\n` +
        `export function createVersionCheckStatePort(conn: SqlConnection): unknown {\n` +
        `  void conn;\n  return {};\n}\n`,
      erwartet: /wird von 2 Datei\(en\) des gelesenen Baums deklariert/,
    },
    {
      name: '6g: das gerufene Mitglied steht im Adapter zweimal',
      path: 'packages/storage/src/sqlite/repo-version-check.ts',
      source: adapterStumpf(
        `    async recordCheck(at: Timestamp): Promise<void> {\n      void at;\n    },\n` +
          `    async recordCheck(at: Timestamp): Promise<void> {\n      void at;\n    },\n`,
      ),
      erwartet: /das Mitglied `recordCheck` steht 2-mal/,
    },
    {
      name: '6g: der Adapter wartet — der Ausschalter aus T-332 K-1',
      path: 'packages/storage/src/sqlite/repo-version-check.ts',
      source: adapterStumpf(
        `    async recordCheck(at: Timestamp): Promise<void> {\n` +
          `      await mindestabstand(conn);\n` +
          `      conn.prepare('UPDATE app_setting SET last_version_check_at = ? WHERE id = 1').run(at);\n` +
          `    },\n`,
      ),
      erwartet: /`recordCheck` wartet \(`await`\)/,
    },
    {
      name: '6g: die Verdrahtung ruft ein Adaptermitglied, das nicht festgenagelt ist',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        ADAPTER_AUFRUFOBJEKT('lastCheckAt'),
        `import type { ReleaseSourcePort } from './features/version/source.ts';\nvoid ({} as ReleaseSourcePort);\n`,
        'VersionChecker',
        `  const versionCheckState = createVersionCheckStatePort(database.connection);\n`,
      ),
      erwartet: /`lastCheckAt` liegt am Weg zur ausgehenden Anfrage und steht nicht unter den/,
    },
    {
      name: '6g: die Anweisungen des Adapters sind nicht mehr zeichengleich — und zwar ohne `await`',
      path: 'packages/storage/src/sqlite/repo-version-check.ts',
      source: adapterStumpf(
        `    async recordCheck(at: Timestamp): Promise<void> {\n` +
          `      void at;\n` +
          `      return new Promise<void>(() => undefined);\n` +
          `    },\n`,
      ),
      erwartet: /die Anweisungen von `recordCheck` sind nicht mehr zeichengleich/,
    },
    {
      name: 'Untergrenze 6g: das festgenagelte Adaptermitglied wird nicht mehr gerufen',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        ADAPTER_AUFRUFOBJEKT('lastCheckAt'),
        `import type { ReleaseSourcePort } from './features/version/source.ts';\nvoid ({} as ReleaseSourcePort);\n`,
        'VersionChecker',
        `  const versionCheckState = createVersionCheckStatePort(database.connection);\n`,
      ),
      erwartet: /das festgenagelte Adaptermitglied `recordCheck` wird von der Verdrahtung nicht mehr gerufen/,
    },
    /*
     * ---------------------------------------------------------------------
     * 6h, 6i und 6j — die drei Stellen aus T-342
     * ---------------------------------------------------------------------
     *
     * Vierzehn Einträge, und die Zählvorschrift oben verlangt sie einzeln:
     * Jeder nagelt einen **eigenen Satz** fest, und für jeden gibt es eine
     * plausible schwächere Umsetzung, die ihn allein trüge. Die beiden
     * `process`-Einträge stehen getrennt, weil genau das der Fehler von 6a vor
     * T-335 war — eine Menge, die an **einem** der beiden Entscheidungsmodule
     * aufgespannt ist, sieht am anderen nichts.
     */
    {
      name: '6h: der Rumpf des Portliterals wartet — der Ausschalter aus T-337 K-7',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        PORTLITERAL_AUFRUFOBJEKT(
          'write: async (at: Date) => { await drossel(); await versionCheckState.recordCheck(toTimestamp(at)); }',
        ),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER + AUSKUNFT('() => versionCheck.current()'),
      ),
      erwartet: /`store\.write` wartet \(`await`\)/,
    },
    {
      name: '6h: der Rumpf des Portliterals ist ein Block statt eines Ausdrucks',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        PORTLITERAL_AUFRUFOBJEKT(
          'write: (at: Date) => { drossel(); return versionCheckState.recordCheck(toTimestamp(at)); }',
        ),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER + AUSKUNFT('() => versionCheck.current()'),
      ),
      erwartet: /der Rumpf von `store\.write` ist kein einziger Ausdruck/,
    },
    {
      name: '6h: die Anweisungen des Portliterals sind nicht mehr zeichengleich — und zwar ohne `await` und als Ausdruck',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        PORTLITERAL_AUFRUFOBJEKT(
          'write: (at: Date) => drossel(versionCheckState.recordCheck(toTimestamp(at)))',
        ),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER + AUSKUNFT('() => versionCheck.current()'),
      ),
      erwartet: /die Anweisungen von `store\.write` sind nicht mehr zeichengleich/,
    },
    {
      name: '6h: das Portliteral trägt eine Stelle, die nicht festgenagelt ist',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        PORTLITERAL_AUFRUFOBJEKT(`${SAUBERE_PORTSTELLE}, lies: () => versionCheckState.lastCheckAt()`),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER + AUSKUNFT('() => versionCheck.current()'),
      ),
      erwartet: /die Stelle `store\.lies` liegt im Portliteral am Weg zur ausgehenden Anfrage/,
    },
    {
      name: 'Untergrenze 6h: die festgenagelte Stelle steht im Portliteral nicht mehr',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        PORTLITERAL_AUFRUFOBJEKT('schreibe: (at: Date) => versionCheckState.recordCheck(toTimestamp(at))'),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER + AUSKUNFT('() => versionCheck.current()'),
      ),
      erwartet: /die festgenagelte Stelle `store\.write` steht im Portliteral der Verdrahtung nicht mehr/,
    },
    {
      name: '6i: das Quellmodul nimmt einen Namen aus der Laufzeit — der Ausschalter aus T-336 Z-2',
      path: RELEASE_SOURCE_FILE,
      source: QUELLMODUL_LAUFZEITSTUMPF(
        `      if (process.env['TAKT_SKIP_UPDATE_CHECK'] === '1') return { ok: false };\n      void signal;\n      return { ok: true };\n`,
      ),
      erwartet: /das Quellmodul nimmt `process` aus der Laufzeit/,
    },
    {
      name: '6i: das Prüfmodul nimmt einen Namen aus der Laufzeit — der Ausschalter aus T-336 Z-3',
      path: VERSION_CHECKER_FILE,
      source: PRUEFMODUL_LAUFZEITSTUMPF(`  if (process.env['TAKT_SKIP_UPDATE_CHECK'] === '1') return;\n`),
      erwartet: /das Prüfmodul nimmt `process` aus der Laufzeit/,
    },
    {
      name: '6i: ein Entscheidungsmodul nimmt `import.meta` — die zweite Tür derselben Klasse',
      path: VERSION_CHECKER_FILE,
      source: PRUEFMODUL_LAUFZEITSTUMPF(`  void import.meta.url;\n`),
      erwartet: /nimmt `import\.meta` aus der Laufzeit/,
    },
    {
      name: 'Untergrenze 6i: ein festgenagelter Laufzeitname kommt nicht mehr vor',
      path: RELEASE_SOURCE_FILE,
      source: QUELLMODUL_LAUFZEITSTUMPF(`      void signal;\n      return { ok: true };\n`, ['fetch']),
      erwartet: /der festgenagelte Laufzeitname `fetch` kommt nicht mehr vor/,
    },
    {
      name: '6j: die Auskunft steht unter einer Bedingung — der Ausschalter aus T-337 K-4',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        ADAPTER_AUFRUFOBJEKT('recordCheck'),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER +
          AUSKUNFT("() => (verbergen ? { state: 'unknown', latestVersion: null } : versionCheck.current())"),
      ),
      erwartet: /die Auskunft `versionCheck\.current\(\)` steht in einer Bedingung/,
    },
    {
      name: '6j: der Ausdruck um die Auskunft ist nicht mehr zeichengleich — und zwar ohne Bedingung',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        ADAPTER_AUFRUFOBJEKT('recordCheck'),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER + AUSKUNFT('() => zwischenspeicher(versionCheck.current())'),
      ),
      erwartet: /der Ausdruck um die Auskunft `versionCheck\.current\(\)` ist nicht mehr zeichengleich/,
    },
    {
      name: '6j: die Verdrahtung ruft ein Mitglied des Prüfers, das nicht festgenagelt ist',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        ADAPTER_AUFRUFOBJEKT('recordCheck'),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER + AUSKUNFT('() => versionCheck.current()') + `  void versionCheck.zustand();\n`,
      ),
      erwartet: /ruft `versionCheck\.zustand\(\)` und das Mitglied steht nicht unter den/,
    },
    {
      name: 'Untergrenze 6j: das festgenagelte Auskunftsmitglied wird nicht mehr gerufen',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        ADAPTER_AUFRUFOBJEKT('recordCheck'),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER,
      ),
      erwartet: /das festgenagelte Auskunftsmitglied `current` wird von der Verdrahtung nicht mehr gerufen/,
    },
    {
      name: '6j: der Prüfer läßt sich nicht auf genau einen Bezeichner auflösen',
      path: 'apps/local-api/src/composition.ts',
      source: verdrahtungsStumpf(
        ADAPTER_AUFRUFOBJEKT('recordCheck'),
        VERDRAHTUNG_ZUSATZ,
        'VersionChecker',
        VERDRAHTUNG_ADAPTER +
          AUSKUNFT('() => versionCheck.current()') +
          `  const zweiterPruefer = createVersionChecker({ logger, now: clock });\n  void zweiterPruefer;\n`,
      ),
      erwartet: /der Prüfer läßt sich hier auf 2 Bezeichner auflösen/,
    },
  ],
};

try {
  const tree = collectTree();

  section('0  Der Leser liest Code und nicht Prosa — sonst wäre alles Folgende wertlos');

  {
    const probe = stripComments(
      [
        '// html_url steht hier in einem Kommentar',
        '/* und downloadAndInstall in einem zweiten */',
        'const adresse = "https://api.github.com/x"; // mit Nachsatz',
        'const rust = r#"https://github.com/x"#;',
        'const vorlage = `a//b`;',
      ].join('\n'),
    );
    check('ein Zeilenkommentar fällt weg', !probe.includes('html_url'), probe);
    check('ein Blockkommentar fällt weg', !probe.includes('downloadAndInstall'), probe);
    check(
      'eine Adresse in einer Zeichenkette bleibt stehen — die beiden Schrägstriche sind kein Kommentar',
      probe.includes('https://api.github.com/x'),
      probe,
    );
    check('eine rohe Zeichenkette aus Rust bleibt stehen', probe.includes('https://github.com/x'), probe);
    check('eine Vorlagenzeichenkette bleibt stehen', probe.includes('`a//b`'), probe);
    check('der Nachsatz hinter der Zuweisung fällt weg', !probe.includes('mit Nachsatz'), probe);
  }

  /*
   * Und die Angabe, auf der die Zählvorschrift steht: **jede** Gegenprobe nagelt
   * fest, woran sie rot wird (T-296).
   *
   * Diese Zeile mißt keinen Quelltext, sondern diese Datei — und das ist ihr
   * Zweck. Eine Gegenprobe ohne `erwartet` ist grün, sobald **irgendein**
   * Befund fällt, auch der des Nachbarzweigs; sie bezeugt dann eine Deckung,
   * die sie nicht hat, und die Zählung „so viele Gegenproben wie Befundsätze"
   * zählt einen Satz mit, den nie ein Verstoß erreicht hat. Gemessen ist der
   * Unterschied an R4: 67/1 mit `erwartet`, 68/0 ohne es.
   */
  {
    const eintraege = CHECKS.flatMap((definition) => {
      const eintrag = COUNTER_PROOFS[definition.id];
      return (Array.isArray(eintrag) ? eintrag : [eintrag]).map((injection) => ({
        id: definition.id,
        injection,
      }));
    });
    const ohne = eintraege
      .filter(({ injection }) => !(injection.erwartet instanceof RegExp))
      .map(({ id, injection }) => `${id}: ${injection.name ?? '<ohne Namen>'}`);
    check(
      `jede Gegenprobe nagelt fest, woran sie rot wird (${eintraege.length} Einträge, ${eintraege.length - ohne.length} mit \`erwartet\`)`,
      ohne.length === 0,
      `ohne \`erwartet\`: ${ohne.join(' | ')}`,
    );
  }

  /*
   * Und dieselbe Frage an den Leser selbst: Hat **jedes** Entscheidungsmodul
   * eine festgenagelte Laufzeitnamenliste (T-342)?
   *
   * 6i meldet es mit einem eigenen Satz, wenn eines fehlt — aber dieser Satz
   * ist über eine eingesetzte Datei **nicht** erreichbar: Beide Listen stehen
   * in diesem Lauf und nicht im Baum. Ohne diese Zeile wäre ein drittes
   * Entscheidungsmodul, das jemand in {@link DECISION_MODULES} einträgt und
   * hier vergißt, an seinem Rumpf ungemessen — und der Lauf bliebe grün. Das
   * ist genau die Bauart, gegen die Abschnitt 0 geschrieben ist, nur an einer
   * Liste statt an einem Ausdruck.
   *
   * Sie zählt deshalb als **neue Zeile in Abschnitt 0** und nicht als
   * Gegenprobe; die Herleitung der Gesamtzahl bei {@link COUNTER_PROOFS} sagt
   * es ausdrücklich.
   */
  {
    const ohneListe = [...DECISION_MODULES.keys()].filter((modul) => !MODUL_LAUFZEITNAMEN.has(modul));
    const verwaist = [...MODUL_LAUFZEITNAMEN.keys()].filter((modul) => !DECISION_MODULES.has(modul));
    check(
      `jedes Entscheidungsmodul hat eine festgenagelte Laufzeitnamenliste, und keine zeigt ins Leere (${String(DECISION_MODULES.size)})`,
      ohneListe.length === 0 && verwaist.length === 0,
      `ohne Liste: ${ohneListe.join(', ') || '—'}; ohne Modul: ${verwaist.join(', ') || '—'}`,
    );
  }

  /*
   * Dieselbe Frage an die zweite Liste, die dieser Lauf über die
   * Entscheidungsmodule führt (T-349): Hat jedes eine festgenagelte
   * **Zugriffsschlüsselliste**?
   *
   * Der Satz „steht nicht unter den Modulen mit festgenagelten
   * Zugriffsschlüsseln" ist über eine eingesetzte Datei ebensowenig erreichbar
   * wie sein Zwilling bei 6i — beide Listen stehen in diesem Lauf und nicht im
   * Baum. Ohne diese Zeile wäre ein drittes Entscheidungsmodul an seinen
   * eckigen Klammern ungemessen, und der Lauf bliebe grün.
   */
  {
    const ohneListe = [...DECISION_MODULES.keys()].filter(
      (modul) => !MODUL_ZUGRIFFSSCHLUESSEL.has(modul),
    );
    const verwaist = [...MODUL_ZUGRIFFSSCHLUESSEL.keys()].filter(
      (modul) => !DECISION_MODULES.has(modul),
    );
    check(
      `jedes Entscheidungsmodul hat eine festgenagelte Zugriffsschlüsselliste, und keine zeigt ins Leere (${String(DECISION_MODULES.size)})`,
      ohneListe.length === 0 && verwaist.length === 0,
      `ohne Liste: ${ohneListe.join(', ') || '—'}; ohne Modul: ${verwaist.join(', ') || '—'}`,
    );
  }

  check(
    `der Baum ist gelesen (${tree.length} Dateien aus ${SOURCE_ROOTS.length} Quellordnern und ${PROGRAM_CONFIGS.length} Übersetzungsprogrammen)`,
    tree.length > 100,
    `nur ${tree.length}`,
  );

  /*
   * =========================================================================
   * Die Art einer Datei kommt vom Compiler (T-327)
   * =========================================================================
   *
   * Diese vier Zeilen messen keinen Quelltext, sondern den **Leser**: Sie
   * nageln fest, daß `.cts` und `.d.cts` als TypeScript gelten und `.json` und
   * `.rs` nicht. Wer {@link traegtTypescript} wieder auf eine Endungsliste
   * zurückbaut, wird hier rot — und eine solche Liste war die sechste Gestalt
   * derselben Niederlage (T-324, gemessen mit `tsc` und Exit 0).
   */
  for (const [pfad, erwartet] of [
    ['a/b.ts', true],
    ['a/b.tsx', true],
    ['a/b.mts', true],
    ['a/b.cts', true],
    ['a/b.d.cts', true],
    ['a/b.json', false],
    ['a/b.rs', false],
  ]) {
    check(
      `die Art von \`${pfad}\` kommt vom Compiler und heißt ${erwartet ? 'TypeScript' : 'nicht TypeScript'}`,
      traegtTypescript(pfad) === erwartet,
      `${ts.ScriptKind[scriptArt(pfad)]} gemessen`,
    );
  }

  /*
   * =========================================================================
   * Und die beiden Sätze über den **Baum selbst** (T-320)
   * =========================================================================
   *
   * Die Gegenprobe (α) setzt die Erweiterung unmittelbar in den erfundenen Baum
   * und mißt damit, daß Zusage 1 sie **erkennt**. Sie mißt nicht, daß
   * `collectTree` sie **liefert** — und genau diese Hälfte fehlte in T-296, als
   * die Klasse für geschlossen erklärt wurde. Die beiden Sätze hier sind die
   * fehlende Hälfte.
   */
  {
    const pruefordner = ['test', 'tests', '__tests__'].filter((name) => SKIP_DIRECTORIES.has(name));
    check(
      'kein Prüfordnername in `SKIP_DIRECTORIES` — er überspränge auch `src/**/test/**`, und das liegt im Übersetzungsprogramm (T-318, ZZ-F′)',
      pruefordner.length === 0,
      `übersprungen: ${pruefordner.join(' ')}`,
    );
  }
  {
    /*
     * Der tragende Satz: **Was der Compiler übersetzt, hat dieser Lauf
     * gelesen.**
     *
     * Er ist heute durch die Bauart von `collectTree` erfüllt und nicht durch
     * einen Zufall — und er steht trotzdem da. Der Tag, an dem jemand die
     * Vereinigung wieder filtert (ein Ordnername, eine Endung, eine
     * Bequemlichkeit), ist der Tag, an dem dieser Satz die Messung ist und nicht
     * mehr die Beschreibung. Fünfmal ist dieser Wächter an genau dieser Naht
     * unterlegen; ein Prüfsatz, der beim sechsten Mal rot wird, kostet drei
     * Zeilen.
     */
    const gelesen = new Set(tree.map((file) => file.path));
    const fehlend = uebersetzungsprogramm()
      .map((datei) => datei.pfad)
      .filter((pfad) => !gelesen.has(pfad));
    check(
      `jede Datei der ${PROGRAM_CONFIGS.length} Übersetzungsprogramme liegt im gelesenen Baum (${uebersetzungsprogramm().length})`,
      fehlend.length === 0,
      `nicht gelesen: ${fehlend.slice(0, 5).join(' ')}${fehlend.length > 5 ? ` … (+${fehlend.length - 5})` : ''}`,
    );
  }
  check(
    'die eine Stelle mit der Adresse liegt vor',
    tree.some((file) => file.path === API_URL_FILE),
    API_URL_FILE,
  );
  /*
   * Und dieselbe Frage für die beiden Orte der Release-Adresse (T-249-1).
   *
   * Bis T-249-1 fehlte sie, und die Lücke war fein: Die Zählung unten prüft,
   * daß die Adresse an **zwei** Orten steht und an keinem dritten. Läge einer
   * der beiden Orte außerhalb des gelesenen Baums, zählte sie eins — und der
   * Prüfsatz wäre rot, aber mit der falschen Begründung („eine Abschrift zu
   * wenig" statt „eine Datei nicht gesehen"). Hier steht die richtige.
   */
  {
    const fehlend = [...RELEASE_PREFIX_FILES].filter(
      (pfad) => !tree.some((file) => file.path === pfad),
    );
    check(
      `die zwei erlaubten Orte der Release-Adresse liegen im gelesenen Baum (${RELEASE_PREFIX_FILES.size})`,
      fehlend.length === 0,
      `nicht gelesen: ${fehlend.join(', ')}`,
    );
  }

  section('1  Gegenproben: jede Prüfung wird von einem eingesetzten Verstoß rot');

  for (const definition of CHECKS) {
    const entry = COUNTER_PROOFS[definition.id];
    // Eine Prüfung darf mehr als einen Verstoß haben: `adressen` fünf, `felder`
    // vier, `oeffnen` drei, `download` einen, `ausgang` sechs, `optionen` drei,
    // `rueckweg` einhundert — zusammen einhundertzweiundzwanzig. Wie viele es je
    // Prüfung sein müssen, sagt die Zählvorschrift bei COUNTER_PROOFS.
    const injections = Array.isArray(entry) ? entry : [entry];
    for (const injection of injections) {
      /*
       * Ein Verstoß kann seit T-290 dreierlei sein, und die dritte Form ist die
       * neue: eine Datei **einsetzen** (`path` + `source`), eine oder mehrere
       * Dateien aus dem Baum **nehmen** (`entfernt`, Liste oder Prüfregel), oder
       * beides. Ohne das Wegnehmen ist eine Untergrenze nicht gegenzuprobieren:
       * „die erlaubte Datei liegt nicht mehr im Baum" läßt sich nicht einsetzen.
       */
      const raus =
        typeof injection.entfernt === 'function'
          ? injection.entfernt
          : (pfad) => (injection.entfernt ?? []).includes(pfad);
      const dirty = tree.filter((file) => file.path !== injection.path && !raus(file.path));
      if (injection.path !== undefined) {
        dirty.push({
          path: injection.path,
          source: injection.source,
          code: stripComments(injection.source),
        });
      }
      const findings = definition.run(dirty);
      const label =
        injection.name === undefined
          ? `„${definition.name}" wird rot, wenn man den Verstoß einsetzt`
          : `„${definition.name}" wird rot bei: ${injection.name}`;
      /*
       * `erwartet` ist seit T-296 **Pflicht** und war bis dahin „freiwillig"
       * (Befund T-295 zu Zeile 1992). Der Unterschied ist gemessen, nicht
       * gemeint: Die Mutation R4 — der Zweig „kennt kein `write` mehr" aus
       * `pruefeGestaltDesPorts` entfernt — ist **67/1** mit dem `erwartet` an
       * der Gegenprobe (u) und **68/0 ohne es**. Ohne `erwartet` trägt der
       * eingesetzte Verstoß sich selbst über den Nachbarsatz „kennt außer
       * `write` noch read", und die Gegenprobe bezeugt eine Lücke, die sie nie
       * erreicht hat — T-143 S-1, dieselbe Bauart, eine Ebene höher. Die ganze
       * Zählvorschrift bei `COUNTER_PROOFS` steht auf dieser Angabe; sie darf
       * deshalb nicht freiwillig sein.
       *
       * Ein fehlendes `erwartet` ist hier **nicht getroffen** und nicht etwa
       * „irgendein Befund reicht". Es wird damit zweimal rot: hier und in
       * Abschnitt 0, der alle Einträge gegenzählt. Die stille Richtung wäre die
       * falsche.
       *
       * **Gefragt wird mit `instanceof RegExp` und nicht mit `!== undefined`**
       * (T-318, T-320). Beide Fassungen standen drei Zeilen auseinander — die
       * strenge in Abschnitt 0, die lose hier. Ein versehentliches
       * `erwartet: 'text'` wäre damit mitten im Lauf ein **Wurf** gewesen
       * (`injection.erwartet.test is not a function`) statt eines roten
       * Prüfsatzes. Ein Wächter, der abstürzt, statt rot zu werden, gibt dem
       * Leser die falsche Auskunft: kein Ergebnis sieht aus wie ein Werkzeug-
       * und nicht wie ein Bestandsproblem.
       */
      const getroffen =
        injection.erwartet instanceof RegExp &&
        findings.some((fund) => injection.erwartet.test(fund));
      check(
        label,
        getroffen,
        findings.length === 0
          ? 'der eingesetzte Verstoß blieb unbemerkt'
          : `kein Befund trifft die gemessene Lücke — gefunden wurde: ${findings.join(' | ')}`,
      );
    }
  }

  /*
   * Und die andere Richtung: Die drei Nicht-Ausgänge dürfen **nicht** rot
   * machen. Ohne diese zweite Richtung wäre ein Ausdruck, der auf jedes Vorkommen von
   * `fetch` anspringt, ebenfalls grün in Abschnitt 1 — und rot in Abschnitt 2,
   * an einer Stelle, die niemand geändert hat.
   */
  for (const [name, code] of [
    ['`app.fetch` in einem Objektliteral', 'const server = { fetch: app.fetch };'],
    ['`app.fetch` als Wert', 'const handler = app.fetch;'],
    ['`options.fetch` als Port', 'const call = options.fetch ?? undefined;'],
    ['`sec-fetch-site` als Kopfzeile', "const v = c.req.header('sec-fetch-site');"],
    ['`fetch_context_not_allowed` als Schlüssel', "return { reason: 'fetch_context_not_allowed' };"],
  ]) {
    check(`kein Ausgang, und wird auch nicht dafür gehalten: ${name}`, !mentionsGlobalFetch(code), code);
  }

  section('2  Der Baum, wie er ist');

  for (const definition of CHECKS) {
    const findings = definition.run(tree);
    check(definition.name, findings.length === 0, findings.join(' | '));
  }

  section('3  Die beiden Adressen stehen dort, wo sie stehen sollen');

  {
    const source = tree.find((file) => file.path === API_URL_FILE);
    check(
      'die Abfrageadresse zeigt auf api.github.com und auf `releases/latest`',
      source !== undefined && source.code.includes(API_URL),
      'nicht gefunden',
    );
    /*
     * Die fehlende Untergrenze, gefunden bei der Gegenprobe zu T-249-1.
     *
     * Hier stand `holders.length <= RELEASE_PREFIX_FILES.size` — eine
     * **Obergrenze** unter einer Überschrift, die „an den zwei gemessenen
     * Orten" sagt. Gemessen wurde damit nur, daß keine dritte Abschrift
     * dazukommt; daß eine der beiden **fehlt**, ging durch. Die Gegenprobe hat
     * es sichtbar gemacht: Mit einem nicht gelesenen `apps/web/src` schrieb
     * dieser Lauf wörtlich
     *
     *     ok    die Adresse der Release-Seite steht an den zwei gemessenen Orten (1)
     *
     * — Überschrift „zwei", Zahl „eins", Urteil „ok". Das ist dieselbe Blindheit
     * wie bei `proof:foreign` und `proof:addin` 18f, nur in einer Klammer statt
     * in einer Dateiliste.
     *
     * Jetzt beide Richtungen: genau so viele wie erlaubt, und jede an ihrem
     * Ort. Der Prüfsatz wird dadurch nicht milder, sondern erst so scharf, wie
     * er sich immer gelesen hat.
     */
    const holders = tree.filter((file) => file.code.includes(RELEASE_PREFIX));
    check(
      `die Adresse der Release-Seite steht an den zwei gemessenen Orten (${holders.length})`,
      holders.length === RELEASE_PREFIX_FILES.size &&
        holders.every((file) => RELEASE_PREFIX_FILES.has(file.path)),
      holders.length === 0
        ? 'an keinem einzigen Ort gefunden'
        : `gefunden an: ${holders.map((file) => file.path).join(', ')}`,
    );
    check(
      'und sie trägt das führende `v` am Ende — die Fassung wird ohne `v` eingesetzt',
      RELEASE_PREFIX.endsWith('/v'),
      RELEASE_PREFIX,
    );
  }
} catch (fehler) {
  /*
   * Der Abbruch bekommt seinen Namen, bevor die Bilanz gedruckt wird (Befund
   * T-291 zu Zeile 1431).
   *
   * Gemessen endete eine abgestürzte Kopie dieses Laufs auf `stdout` mit „26
   * bestanden, 0 fehlgeschlagen", während der Stapel auf `stderr` stand. Das
   * Tor urteilt am Rückgabewert und war nie in Gefahr; ein Mensch liest die
   * letzte Zeile. In einer Datei, deren These „ein Nachweis, der nur grün sagen
   * kann, ist eine Behauptung" lautet, ist eine grüne Schlußzeile über einem
   * Abbruch derselbe Fehler eine Etage höher.
   */
  process.stdout.write(`\nABGEBROCHEN: ${fehler instanceof Error ? fehler.message : String(fehler)}\n`);
  process.stdout.write('Die Bilanz unten ist damit unvollständig — sie zählt nur, was vor dem Abbruch lief.\n');
  throw fehler;
} finally {
  process.stdout.write(`\n${passed} bestanden, ${failed} fehlgeschlagen\n`);
  if (failed > 0) {
    process.stdout.write(`\nFehlgeschlagen:\n${failures.map((name) => `  - ${name}`).join('\n')}\n`);
  }
}

process.exit(failed === 0 ? 0 : 1);
