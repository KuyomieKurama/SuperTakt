/**
 * Takt — Nachweis, dass die eine Verbindung nach außen genau eine bleibt
 * (E-066 Punkt 4, A-18.3, A-18.9, A-V-1 bis A-V-7, A-V-16, R-19).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:release-safety
 *
 * ===========================================================================
 * Warum dieser Lauf existiert
 * ===========================================================================
 *
 * E-066 Punkt 1 erlaubt, dass der Zusammenbau im selben Prozess eine andere
 * Abholfunktion einsetzt — sonst wäre der Prüflauf gegen eine Nachbildung von
 * GitHub nicht zu bauen, ohne A-18.3 aufzuweichen. Diese Erlaubnis steht unter
 * einer **Bedingung**, und sie ist wörtlich aufgeschrieben:
 *
 *   „Es muss ein Nachweis messen, dass im ausgelieferten Zusammenbau **kein**
 *    Weg zu einer anderen Adresse führt. Ohne diesen Nachweis ist die Naht ein
 *    Schalter, den nur noch niemand gefunden hat."
 *
 * Dieser Lauf ist die Bedingung. Er misst vier Dinge über den ganzen
 * Quellbaum:
 *
 *   1. **Genau eine Adresse.** Die Abfrageadresse steht einmal, und jede andere
 *      Adresse auf github.com ist die Release-Seite an ihren zwei gemessenen
 *      Orten — keine dritte, keine zusammengesetzte, keine aus einem gelesenen
 *      Wert.
 *   2. **Kein Weg von einer Antwort zum Öffnen-Befehl.** Die Felder, in denen
 *      GitHub Adressen und fremden Text liefert, werden nirgends gelesen, und
 *      der Öffnen-Befehl nimmt nichts entgegen, was eine Adresse sein könnte.
 *      Das ist B-18.2, die schwerste Bedrohung dieses Vorhabens: Der Benutzer
 *      klickt „Installieren" in dem Augenblick, in dem er darauf eingestellt
 *      ist, eine **unsignierte** Datei zu holen und auszuführen.
 *   3. **Nirgends ein Herunterladen.** A-18.9 sagt es ohne Einschränkung:
 *      keine Datei, zu keinem Zeitpunkt, auch nicht nach einer Rückfrage.
 *   4. **Kein Rückweg vom Bestand in die Versionsprüfung** (T-285). Der
 *      Zeitpunkt der letzten Anfrage wird geschrieben und nicht gelesen. Wer
 *      ihn wieder liest, um eine Anfrage zu verhindern, legt den Neustart
 *      still — und der Neustart ist die einzige Selbsthilfe, die E-069 dem
 *      Benutzer läßt, wenn die Prüfung nicht greift.
 *
 * ===========================================================================
 * Warum der Lauf sich selbst mißt
 * ===========================================================================
 *
 * Ein Nachweis, der nur „grün" sagen kann, ist eine Behauptung. T-134 hat
 * genau daran den alten Zahlenvergleich scheitern lassen. Abschnitt 0 setzt
 * deshalb zu **jeder** Prüfung einen Verstoß in einen erfundenen Baum und
 * erwartet, dass sie rot wird. Bleibt eine Prüfung dabei grün, ist der Lauf
 * insgesamt rot — auch dann, wenn der echte Baum sauber ist.
 *
 * Dazu kommt die Gegenprobe an den Leser selbst: Ein Kommentar ist kein Code.
 * Diese Datei nennt `html_url`, `ProxyAgent` und `downloadAndInstall` in ihrer
 * eigenen Beschreibung, `version/source.ts` ebenso — ein Leser, der Kommentare
 * mitliest, wäre an seinem eigenen Text rot und müßte weichgeklopft werden,
 * bis er nichts mehr findet. Er entfernt sie deshalb, und Abschnitt 0 mißt,
 * daß er es richtig tut: Zeichenketten bleiben stehen, Kommentare fallen.
 *
 * ===========================================================================
 * Was dieser Lauf **nicht** prüft
 * ===========================================================================
 *
 * **a) Bauskripte.** `apps/desktop/scripts/**` lädt beim Bauen eine
 * Node-Binärdatei und prüft ihre Prüfsummen — das ist der Auslieferungsweg
 * (VG-7) und nicht das ausgelieferte Erzeugnis. A-18.9 spricht von dem, was
 * **Takt** tut, während es läuft. Die Lieferkette ist eine andere Frage mit
 * einem anderen Gegenmittel (5.10, `verify-node-checksums.mjs`).
 *
 * **b) Prüfdateien.** Die Ordner `test`, `tests` und `__tests__` dürfen
 * Adressen und Antwortfelder nennen — eine Nachbildung der GitHub-Antwort muß
 * `tag_name` schreiben können, sonst prüft sie nichts.
 *
 * **c) Verhalten.** Dieser Lauf liest Quelltext. Ob der Aufruf zur Laufzeit
 * tatsächlich eine Weiterleitung ablehnt, mißt ein Prüffall gegen einen
 * Prüfserver (T-140, TP-VER-25) und nicht ein regulärer Ausdruck.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

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

// ===========================================================================
// Der Baum
// ===========================================================================

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

const READ_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.js', '.mjs', '.rs', '.json', '.toml', '.html']);

/** Prüfdateien gehören nicht dazu (Begründung im Kopf, Punkt b). */
const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', 'target', 'test', 'tests', '__tests__']);

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
 * Sammelt den Baum — und bricht ab, wo er ihn nicht findet (T-249-1).
 *
 * Die beiden `continue` und das leere `catch`, die hier bis T-249-1 standen,
 * waren der stumme Ausgang: ein fehlender Quellordner, ein fehlendes Manifest,
 * und die Aussagen dieses Laufs wurden über ihnen leer und damit wahr. Jetzt
 * ist beides ein Abbruch mit Namen.
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
  process.stdout.write(`        ${bilanz.join(', ')}\n`);

  return files.map((full) => {
    const source = readFileSync(full, 'utf8');
    const path = relative(ROOT, full).split(sep).join('/');
    // In JSON und TOML gibt es keine Kommentare der obigen Bauart; sie laufen
    // trotzdem durch denselben Schritt, weil ein `//` in einer Adresse dort
    // genauso in einer Zeichenkette steht.
    return { path, source, code: stripComments(source) };
  });
}

// ===========================================================================
// Die Prüfungen — als Funktionen über eine Dateiliste
// ===========================================================================
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
 * **Fünf Gestalten** inzwischen, und jede fängt eine andere Gestalt desselben
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
 *
 * Die Gestalten 3 bis 5 messen **beide Richtungen**: Eine erlaubte Datei, die
 * verschwindet, und eine erlaubte Importquelle, die nicht mehr vorkommt, sind
 * Befunde. Ein Wächter, der seine eigene Menge nicht mehr findet, bewacht nichts
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
 *  - alles außerhalb des gelesenen Baums, und das ist mehr, als es klingt.
 *    Gelesen werden die acht `src`-Wurzeln aus `SOURCE_ROOTS` und die zehn
 *    Einzeldateien aus `EXTRA_FILES`. **Draußen** liegen: jeder `scripts/`-Baum
 *    (auch dieser Lauf selbst), `packages/ui-tokens/**`, `apps/web/public/**`
 *    (dort liegt mit `startup-appearance.js` ausgelieferter Laufzeitcode),
 *    `packages/storage/migrations/**` **ganz** — nicht nur die `.sql`-Dateien,
 *    auch eine `helper.ts` neben ihnen würde nicht gelesen —, dazu die
 *    Prüfordner und `dist/`;
 *  - ein Zugriff über einen **anderen Prozeß** auf dieselbe Datei. Das war nie
 *    Sache dieses Laufs und ist VG-3.
 *
 * Wer eine dieser Lücken schließen will, schließt sie nicht durch einen
 * sechsten Namen. Er schließt sie durch einen Prüffall am Verhalten: **ein
 * Programmstart fragt immer einmal**, gemessen an zwei nacheinander gebauten
 * Prüfern (T-287 Messung 2, TP-VER-11). Auch der trägt nur so weit, wie die
 * Nähte verdrahtet sind — eine neue **optionale** Option an
 * `createVersionChecker` bliebe dort ungesetzt und grün (T-289, 38.4).
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

function istTypescriptDatei(pfad) {
  return pfad.endsWith('.ts') || pfad.endsWith('.tsx') || pfad.endsWith('.mts');
}

function lesbarerBaum(quelltext, pfad) {
  return ts.createSourceFile(
    pfad,
    quelltext,
    ts.ScriptTarget.ES2022,
    true,
    pfad.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

/** Zusage 1: kein Erweiterungsblock im gelesenen Baum (T-296). */
function findeErweiterungsbloecke(files) {
  const findings = [];
  for (const file of files) {
    if (!istTypescriptDatei(file.path)) continue;
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

/** Zusage 2: der Portname steht genau einmal im gelesenen Baum (T-296). */
function findeZweiteDeklarationDesPorts(files, name) {
  const findings = [];
  for (const file of files) {
    if (file.path === VERSION_CHECKER_FILE) continue;
    if (!istTypescriptDatei(file.path)) continue;
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
        `${file.path}: deklariert \`${name}\` ein zweites Mal — die Gestalt des Ports wird an ${VERSION_CHECKER_FILE} gemessen, und welche der beiden Deklarationen der Prüfer einsetzt, entscheidet eine Importzeile, die dieser Leser nicht liest (T-296)`,
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
    name: 'kein Rückweg vom Bestand in die Versionsprüfung — fünf Gestalten gemessen, die Lücken daneben stehen bei \`checkNoStoreReadback\`',
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
 * Zeile in Abschnitt 0, die die `erwartet` gegenzählt: 68 → **73**.
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
      erwartet: /deklariert `VersionCheckStorePort` ein zweites Mal/,
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
  ],
};

// ===========================================================================

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

  check(
    `der Baum ist gelesen (${tree.length} Dateien aus ${SOURCE_ROOTS.length} Quellordnern)`,
    tree.length > 100,
    `nur ${tree.length}`,
  );
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

  // -------------------------------------------------------------------------
  section('1  Gegenproben: jede Prüfung wird von einem eingesetzten Verstoß rot');
  // -------------------------------------------------------------------------

  for (const definition of CHECKS) {
    const entry = COUNTER_PROOFS[definition.id];
    // Eine Prüfung darf mehr als einen Verstoß haben: `adressen` fünf, `felder`
    // vier, `oeffnen` drei, `download` einen, `ausgang` sechs, `optionen` drei,
    // `rueckweg` sechsundzwanzig — zusammen achtundvierzig. Wie viele es je
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
       */
      const getroffen =
        injection.erwartet !== undefined && findings.some((fund) => injection.erwartet.test(fund));
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

  // -------------------------------------------------------------------------
  section('2  Der Baum, wie er ist');
  // -------------------------------------------------------------------------

  for (const definition of CHECKS) {
    const findings = definition.run(tree);
    check(definition.name, findings.length === 0, findings.join(' | '));
  }

  // -------------------------------------------------------------------------
  section('3  Die beiden Adressen stehen dort, wo sie stehen sollen');
  // -------------------------------------------------------------------------

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
