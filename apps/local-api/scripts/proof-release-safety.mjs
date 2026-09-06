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
 * Dieser Lauf ist die Bedingung. Er misst drei Dinge über den ganzen
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
import { fileURLToPath } from 'node:url';

/*
 * Der Leser und die Regel liegen seit T-188 in `fetch-scan.mjs`, weil
 * `proof:callers` sie ebenfalls braucht und sie dort bis dahin in einer
 * **blinden** zweiten Fassung stand (A-A-40). Eine Regel, zwei Läufe, zwei
 * Gegenprobenreihen — E-086 Punkt 1.
 */
import { mentionsGlobalFetch, stripComments } from './fetch-scan.mjs';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

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
 */
const SOURCE_ROOTS = [
  'apps/local-api/src',
  'apps/web/src',
  'apps/outlook-addin/src',
  'apps/desktop/src',
  'apps/desktop/src-tauri/src',
  'packages/domain/src',
  'packages/storage/src',
  'packages/export/src',
];

/** Einzelne Dateien außerhalb der Quellordner, die trotzdem zählen. */
const EXTRA_FILES = [
  'apps/desktop/src-tauri/tauri.conf.json',
  'apps/desktop/src-tauri/Cargo.toml',
  'apps/local-api/package.json',
  'apps/web/package.json',
  'apps/desktop/package.json',
  'apps/outlook-addin/package.json',
  'packages/domain/package.json',
  'packages/storage/package.json',
  'packages/export/package.json',
  'package.json',
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

function collectTree() {
  const files = [];
  for (const root of SOURCE_ROOTS) {
    const full = join(ROOT, root);
    try {
      if (!statSync(full).isDirectory()) continue;
    } catch {
      continue; // Ein Ordner, den es (noch) nicht gibt, ist kein Befund dieses Laufs.
    }
    const found = [];
    walk(full, found);
    for (const file of found) files.push(file);
  }
  for (const extra of EXTRA_FILES) {
    const full = join(ROOT, extra);
    try {
      if (statSync(full).isFile()) files.push(full);
    } catch {
      /* nicht vorhanden */
    }
  }

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
const API_URL_FILE = 'apps/local-api/src/version/source.ts';

/**
 * Wo die Adresse der Release-Seite stehen darf.
 *
 * Zwei Orte, und ihr Gleichlauf wird gemessen (`proof:shell-surface`): die
 * Hülle baut die Adresse, die Oberfläche zeigt sie als Text daneben (A-V-18).
 */
const RELEASE_PREFIX_FILES = new Set([
  'apps/desktop/src-tauri/src/release.rs',
  'apps/web/src/lib/releasePage.ts',
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

const CHECKS = [
  { id: 'adressen', name: 'genau eine Abfrageadresse, und keine dritte auf github.com', run: checkAddresses },
  { id: 'felder', name: 'aus der Antwort wird ein Feld gelesen, und `html_url` gehört nicht dazu', run: checkResponseFields },
  { id: 'oeffnen', name: 'kein Weg von einer Antwort zum Öffnen-Befehl', run: checkOpenCommand },
  { id: 'download', name: 'nirgends ein Herunterladen, kein Installieren, kein zweiter Netzweg', run: checkNoDownload },
  { id: 'ausgang', name: 'genau ein Ausgang, und keiner in einer Routendatei', run: checkSingleExit },
  { id: 'optionen', name: 'die Zusagen des Aufrufs stehen im Quelltext', run: checkFetchOptions },
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
 */
const COUNTER_PROOFS = {
  adressen: {
    path: 'apps/web/src/lib/eingesetzt.ts',
    source: `export const ZWEITE = "https://api.github.com/repos/jemand/anderes/releases/latest";\n`,
  },
  felder: {
    path: 'apps/web/src/lib/eingesetzt.ts',
    source: `export const verweis = (release: any) => release.html_url;\n`,
  },
  oeffnen: {
    path: 'apps/desktop/src/eingesetzt.ts',
    source: `await invoke('takt_open_release', { version, url: release.htmlUrl });\n`,
  },
  download: {
    path: 'apps/desktop/src/eingesetzt.ts',
    source: `import { downloadAndInstall } from '@tauri-apps/plugin-updater';\n`,
  },
  ausgang: [
    {
      name: 'nacktes `fetch(`',
      path: 'apps/local-api/src/routes/eingesetzt.ts',
      source: `export const laden = () => fetch('https://beispiel.invalid/x');\n`,
    },
    {
      name: '`globalThis.fetch(` — die Lücke aus T-143 S-1',
      path: 'apps/local-api/src/routes/eingesetzt.ts',
      source: `export const laden = () => globalThis.fetch('https://beispiel.invalid/x');\n`,
    },
    {
      name: '`window.fetch(`',
      path: 'apps/local-api/src/routes/eingesetzt.ts',
      source: `export const laden = () => window.fetch('https://beispiel.invalid/x');\n`,
    },
    {
      name: 'eine Zerlegung: `const { fetch: holen } = globalThis`',
      path: 'apps/local-api/src/routes/eingesetzt.ts',
      source: `const { fetch: holen } = globalThis;\nexport const laden = () => holen('https://beispiel.invalid/x');\n`,
    },
  ],
  optionen: {
    path: API_URL_FILE,
    // Dieselbe Datei, aber ohne ihre Zusagen: der Verstoß ist die Auslassung.
    source: `const daten = await response.json();\n`,
  },
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

  // -------------------------------------------------------------------------
  section('1  Gegenproben: jede Prüfung wird von einem eingesetzten Verstoß rot');
  // -------------------------------------------------------------------------

  for (const definition of CHECKS) {
    const entry = COUNTER_PROOFS[definition.id];
    // Eine Prüfung darf mehr als einen Verstoß haben. `ausgang` hat vier, und
    // die Begründung steht bei COUNTER_PROOFS.
    const injections = Array.isArray(entry) ? entry : [entry];
    for (const injection of injections) {
      const dirty = [
        ...tree.filter((file) => file.path !== injection.path),
        { path: injection.path, source: injection.source, code: stripComments(injection.source) },
      ];
      const findings = definition.run(dirty);
      const label =
        injection.name === undefined
          ? `„${definition.name}" wird rot, wenn man den Verstoß einsetzt`
          : `„${definition.name}" wird rot bei: ${injection.name}`;
      check(label, findings.length > 0, 'der eingesetzte Verstoß blieb unbemerkt');
    }
  }

  /*
   * Und die andere Richtung: Die drei Nicht-Ausgänge dürfen **nicht** rot
   * machen. Ohne diese Hälfte wäre ein Ausdruck, der auf jedes Vorkommen von
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
    const holders = tree.filter((file) => file.code.includes(RELEASE_PREFIX));
    check(
      `die Adresse der Release-Seite steht an den zwei gemessenen Orten (${holders.length})`,
      holders.length <= RELEASE_PREFIX_FILES.size &&
        holders.every((file) => RELEASE_PREFIX_FILES.has(file.path)),
      holders.map((file) => file.path).join(', '),
    );
    check(
      'und sie trägt das führende `v` am Ende — die Fassung wird ohne `v` eingesetzt',
      RELEASE_PREFIX.endsWith('/v'),
      RELEASE_PREFIX,
    );
  }
} finally {
  process.stdout.write(`\n${passed} bestanden, ${failed} fehlgeschlagen\n`);
  if (failed > 0) {
    process.stdout.write(`\nFehlgeschlagen:\n${failures.map((name) => `  - ${name}`).join('\n')}\n`);
  }
}

process.exit(failed === 0 ? 0 : 1);
