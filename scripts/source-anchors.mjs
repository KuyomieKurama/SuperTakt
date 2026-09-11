/**
 * Takt — Ankerpunkte im Quellbaum statt fester Pfade (T-249-4).
 *
 * ===========================================================================
 * Warum diese Datei in der Wurzel liegt und nur einmal
 * ===========================================================================
 *
 * In T-249-1 und T-249-2 entstand dieselbe Idee **viermal**: einmal unter
 * `apps/web/scripts`, einmal unter `apps/desktop/scripts` (zeichengleich zur
 * ersten), einmal als `apps/local-api/scripts/source-resolve.mjs` und einmal
 * als „Landkarte" im Nachweis des Aufgabenbereichs. Vier Abschriften einer
 * Regel ohne Wächter, der sie zusammenhält — genau die Bauart, die E-063
 * Punkt 4 verurteilt und die am 2026-09-10 schon einmal zugeschlagen hat: Die
 * Regel über den Ablageort des Anwendungsdatenverzeichnisses stand an fünf
 * Stellen, und drei davon vergaßen eine Plattform.
 *
 * Deshalb **eine** Fassung, und zwar hier. `scripts/` in der Wurzel ist
 * absichtlich **kein Arbeitsbereichspaket**: Der Arbeitsbereich umfaßt
 * `apps/*` und `packages/*`, dieser Ordner liegt daneben. Keine
 * `package.json`, kein Eintrag in `pnpm-workspace.yaml`, keine
 * Abhängigkeitskante — eingebunden wird über einen relativen Pfad. Der
 * Grenzwächter (`pnpm boundaries`) prüft ausschließlich `packages/domain` und
 * sieht Bauskripte nicht an; das ist gemessen, nicht vermutet.
 *
 * Diese Datei enthält **Bausteine, keine Fachlichkeit.** Wer einen Helfer
 * braucht, den nur ein einziger Lauf kennt — den Einstiegspunkt des lokalen
 * Dienstes, das Migrationsverzeichnis, den Quellbaum eines bestimmten Pakets —,
 * baut ihn dort, wo er gebraucht wird, und setzt ihn auf diese Bausteine auf.
 * Eine gemeinsame Datei, die alles aufnimmt, was irgendwo gebraucht wird, ist
 * der Sammelordner, den der Auftraggeber ausgeschlossen hat.
 *
 * ---------------------------------------------------------------------------
 * Warum es diese Datei überhaupt gibt
 * ---------------------------------------------------------------------------
 *
 * `apps/web/src` wird featureweise umgebaut: `features/board`, `features/todos`,
 * `features/timer`, … dazu `shared/` und ein schlankes `app/`. Die Ordner
 * `screens/`, `components/`, `lib/` und `api/` verschwinden dabei als Ordner.
 * **Jeder Nachweis, der eine Quelldatei über ihren heutigen Pfad liest, urteilt
 * danach über eine Datei, die es nicht mehr gibt** — und die entscheidende
 * Frage ist nicht, ob er das merkt, sondern **wie** er es merkt.
 *
 * Die Lage ist gemessen und nicht befürchtet. In T-247-7 verglich
 * `proof:foreign` unter Windows Pfade aus `ts.SourceFile.fileName`
 * (Schrägstriche) mit Pfaden aus `node:path` (Rückstriche). Der Vergleich traf
 * nie, der Lauf urteilte über **129 Dateien, ohne eine gesehen zu haben**, und
 * ohne die Zählwächter wäre er **grün** gewesen. Ein Umzug erzeugt dieselbe
 * Lage — nur auf jedem Betriebssystem gleichzeitig.
 *
 * ===========================================================================
 * Die Regel, die diese Datei durchsetzt
 * ===========================================================================
 *
 * **Nicht gefunden ist ein Fehlschlag der Messung, nie ein bestandener
 * Prüfsatz.** Ein fehlendes Verzeichnis, eine leere Datei und ein fehlendes
 * Merkmal enden hier als Abbruch mit einem Satz, der den gesuchten Gegenstand
 * **beim Namen nennt** — nicht als `ENOENT` aus dem Inneren von `node:fs`, und
 * erst recht nicht als leere Fundliste, die eine Prüfung leer wahr macht.
 *
 * Drei Zusagen, die ein Aufrufer daraus ableiten darf:
 *
 *  - {@link readTreeSync} liest **rekursiv**. Ein Umzug von `styles/foo.css`
 *    nach `features/board/foo.css` ändert die Menge nicht, und eine neue Ebene
 *    lässt keine Datei stillschweigend hinausfallen.
 *  - {@link locateSingleSource} sucht über ein **Merkmal** (Dateiname oder
 *    Inhalt), nicht über einen Pfad, und besteht auf **genau einem** Treffer.
 *    Zwei Treffer sind so wenig eine Antwort wie keiner: Bei zweien wüsste der
 *    Aufrufer nicht, über welche der beiden Dateien er gerade urteilt.
 *  - {@link locateWorkspacePackage} sucht über den **Paketnamen** und liest die
 *    erlaubten Orte aus `pnpm-workspace.yaml`, statt sie abzuschreiben.
 *
 * ---------------------------------------------------------------------------
 * Warum hier geworfen und nicht beendet wird
 * ---------------------------------------------------------------------------
 *
 * `source-resolve.mjs` beendete den Prozeß mit einer Zeile `FEHL` und
 * Rückgabewert 1, weil seine Auflösungen auf der obersten Ebene eines Laufs
 * stehen und eine Stapelspur dort wie ein Absturz des Werkzeugs aussähe. Das
 * ist richtig — aber es ist die Entscheidung des **Laufs**, nicht die des
 * Bausteins. Ein Baustein, der `process.exit` ruft, läßt sich nicht
 * gegenprüfen: Eine Prüfung, die den Abbruch messen will, stürbe mit ihm.
 * Deshalb wirft diese Datei {@link MissingSourceError}, und ein Lauf, der die
 * knappe Ausgabe will, fängt ihn ab:
 *
 * ```js
 * try { … } catch (fehler) {
 *   if (!(fehler instanceof MissingSourceError)) throw fehler;
 *   scheitern('Quelldatei auflösen', fehler.message);
 * }
 * ```
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Ein Abbruch dieser Datei — immer mit dem gesuchten Gegenstand im Satz.
 *
 * Eigene Klasse, damit ein Aufrufer sie von einem `ENOENT` unterscheiden kann;
 * die Unterscheidung ist der ganze Punkt: `ENOENT` sagt, dass eine Zeichenkette
 * ins Leere zeigte, dieser Fehler sagt, **was** gesucht wurde und **wo**.
 */
export class MissingSourceError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "MissingSourceError";
  }
}

/**
 * Ein Pfad für die Ausgabe — relativ und mit Schrägstrichen, damit ein Befund
 * unter Windows zeichengleich so heißt wie unter Linux (T-247).
 *
 * @param {string} from
 * @param {string} target
 * @returns {string}
 */
export const displayPath = (from, target) =>
  path.relative(from, target).split(path.sep).join("/");

/**
 * Ein Verzeichnis, das dieser Lauf braucht — oder ein Abbruch mit Grund.
 *
 * @param {string} dir Absoluter Pfad.
 * @param {string} purpose Wofür der Lauf es braucht, in einem Halbsatz.
 * @returns {string} Derselbe Pfad, damit sich der Aufruf einsetzen lässt.
 */
export const requireDirectory = (dir, purpose) => {
  let stats;
  try {
    stats = statSync(dir);
  } catch {
    throw new MissingSourceError(
      `${dir}\n        gibt es nicht. Dieser Lauf braucht das Verzeichnis für ${purpose}.\n` +
        "        Ein Verzeichnis, das nicht da ist, ist kein bestandener Prüfsatz — es ist\n" +
        "        ein Fehlschlag der Messung. Wurde der Quellbaum umgeräumt, gehört dieser\n" +
        "        Anker mit.",
    );
  }
  if (!stats.isDirectory()) {
    throw new MissingSourceError(
      `${dir}\n        ist kein Verzeichnis. Dieser Lauf braucht es für ${purpose}.`,
    );
  }
  return dir;
};

/**
 * Eine Datei, die dieser Lauf braucht — gelesen, oder ein Abbruch mit Grund.
 *
 * **Leer zählt als fehlend.** Eine Datei ohne Inhalt beantwortet jede Frage
 * nach einem Merkmal mit „nein", und dieses „nein" sähe aus wie ein Befund.
 *
 * @param {string} file Absoluter Pfad.
 * @param {string} purpose Wofür der Lauf sie braucht, in einem Halbsatz.
 * @returns {string} Der Inhalt.
 */
export const readRequiredFile = (file, purpose) => {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    throw new MissingSourceError(
      `${file}\n        gibt es nicht. Dieser Lauf braucht die Datei für ${purpose}.\n` +
        "        Ist sie umgezogen, gehört dieser Anker mit; ist sie gefallen, fällt die\n" +
        "        Prüfung, die sich auf sie beruft.",
    );
  }
  if (text.trim() === "") {
    throw new MissingSourceError(
      `${file}\n        ist leer. Dieser Lauf braucht sie für ${purpose}, und eine leere Datei\n` +
        "        beantwortet jede Frage nach einem Merkmal mit „nein\" — das sähe aus wie ein\n" +
        "        Befund und wäre keiner.",
    );
  }
  return text;
};

/**
 * Jede Datei unter `root`, die `accept` annimmt — **rekursiv**, in fester
 * Reihenfolge.
 *
 * Die Rekursion ist die halbe Antwort auf die Umstrukturierung: Ein Lauf, der
 * `readdirSync(styleRoot)` **eine** Ebene liest, verliert bei der ersten
 * Unterebene stillschweigend Dateien und bleibt dabei grün.
 *
 * @param {string} root Absoluter Pfad des Wurzelverzeichnisses.
 * @param {(name: string) => boolean} accept Prüft den **Dateinamen**.
 * @param {string} purpose Wofür der Lauf den Baum braucht.
 * @param {(name: string) => boolean} [enter] Prüft **Ordnernamen**; liefert sie
 *   `false`, wird der Ordner nicht betreten. Fehlt sie, wird alles betreten.
 * @returns {readonly { readonly path: string, readonly name: string }[]}
 *   `path` absolut, `name` relativ zu `root` mit Schrägstrichen.
 */
export const readTreeSync = (root, accept, purpose, enter) => {
  requireDirectory(root, purpose);
  /** @type {{ path: string, name: string }[]} */
  const found = [];
  /** @param {string} dir */
  const descend = (dir) => {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (enter === undefined || enter(entry.name)) descend(full);
      } else if (accept(entry.name)) {
        found.push({ path: full, name: displayPath(root, full) });
      }
    }
  };
  descend(root);
  return found;
};

/**
 * Die Untergrenze einer Menge, mit Namen.
 *
 * Die Bauart stammt aus T-247-7 und ist dort gemessen: Eine Prüfung, die über
 * eine Menge urteilt, muss zuerst sagen, dass die Menge nicht leer ist —
 * **bevor** sie über sie urteilt. Sonst ist „nichts gefunden" von „nichts zu
 * finden" nicht zu unterscheiden, und das ist die schlimmste Sorte grün.
 *
 * @template T
 * @param {readonly T[]} items
 * @param {number} atLeast
 * @param {string} what Was gezählt wurde, im Plural.
 * @param {string} where Wo gesucht wurde.
 * @returns {readonly T[]} Dieselbe Menge.
 */
export const requireAtLeast = (items, atLeast, what, where) => {
  if (items.length < atLeast) {
    throw new MissingSourceError(
      `Nur ${String(items.length)} ${what} unter ${where} — erwartet werden mindestens ` +
        `${String(atLeast)}.\n` +
        "        Über diese Menge urteilt der Lauf. Ist sie zu klein, urteilt er über\n" +
        "        Dateien, die er nicht gelesen hat; das Ergebnis wäre grün und hohl.",
    );
  }
  return items;
};

/* ==================================================================== */
/* Der Arbeitsbereich — Wurzel und Pakete                               */
/* ==================================================================== */

/** @type {string | null} */
let cachedWorkspaceRoot = null;

/**
 * Die Wurzel des Arbeitsbereichs — **erlaufen** statt gezählt.
 *
 * Bisher stand dafür `new URL('../../../', import.meta.url)` in den Läufen —
 * drei Ebenen, weil das aufrufende Verzeichnis heute `apps/local-api/scripts`
 * heißt. Zieht ein Nachweis eine Ebene tiefer oder höher, zeigt die Zählung
 * stillschweigend auf ein anderes Verzeichnis, und was dort gesucht wird,
 * liefert entweder nichts oder zu viel. `pnpm-workspace.yaml` ist die Marke,
 * die nicht mitzählt.
 *
 * @param {string} [startDir] Woher nach oben gesucht wird. Vorgabe ist das
 *   Verzeichnis dieser Datei; ein Aufrufer braucht das nur zu setzen, wenn er
 *   die Wurzel eines **anderen** Baums sucht (etwa in einem Prüffall).
 * @returns {string} Absoluter Pfad der Wurzel.
 */
export const workspaceRoot = (startDir) => {
  if (startDir === undefined && cachedWorkspaceRoot !== null) return cachedWorkspaceRoot;
  const start = startDir ?? fileURLToPath(new URL(".", import.meta.url));
  let current = path.resolve(start);
  for (;;) {
    try {
      if (statSync(path.join(current, "pnpm-workspace.yaml")).isFile()) {
        if (startDir === undefined) cachedWorkspaceRoot = current;
        return current;
      }
    } catch {
      /* weiter nach oben */
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new MissingSourceError(
        `Von ${start}\n        aus nach oben gesucht — keine pnpm-workspace.yaml gefunden.\n` +
          "        Ohne die Wurzel des Arbeitsbereichs greift jede weitere Auflösung ins\n" +
          "        Leere, und „nichts gefunden\" sähe aus wie „nichts zu beanstanden\".",
      );
    }
    current = parent;
  }
};

/**
 * Die Muster aus `packages:` in `pnpm-workspace.yaml`.
 *
 * Kein YAML-Leser für vier Zeilen: Die Liste ist eine Folge von `  - '…'` bis
 * zur nächsten Zeile ohne Einzug. Ausschlüsse (`!`) werden übergangen — sie
 * nehmen im Bestand Testordner aus, und ein Testordner ist ohnehin kein Paket
 * mit eigenem Namen in `package.json`.
 *
 * @param {string} repoRoot
 * @returns {readonly string[]}
 */
const workspacePatterns = (repoRoot) => {
  const manifest = path.join(repoRoot, "pnpm-workspace.yaml");
  const text = readRequiredFile(manifest, "die erlaubten Orte der Arbeitsbereichspakete");
  /** @type {string[]} */
  const patterns = [];
  let inside = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inside = true;
      continue;
    }
    if (!inside) continue;
    const hit = /^\s+-\s*['"]?([^'"#\s]+)['"]?\s*$/.exec(line);
    if (hit === null) break;
    const pattern = hit[1];
    if (pattern === undefined || pattern.startsWith("!")) continue;
    patterns.push(pattern);
  }
  if (patterns.length === 0) {
    throw new MissingSourceError(
      `${manifest}\n        nennt unter „packages:\" kein einziges Muster.\n` +
        "        Ohne Muster wüsste diese Auflösung nicht, wo Pakete liegen dürfen — und\n" +
        "        eine leere Paketliste ließe jede Aussage über sie leer wahr werden.",
    );
  }
  return patterns;
};

/** @type {Map<string, Map<string, string>>} */
const cachedPackages = new Map();

/**
 * Alle Pakete des Arbeitsbereichs als „Name → Verzeichnis".
 *
 * Die Orte kommen aus `pnpm-workspace.yaml` und nicht aus einer abgeschriebenen
 * Liste `['apps', 'packages']`. Der Unterschied ist genau der aus dem Ablageort
 * des Anwendungsdatenverzeichnisses: Eine abgeschriebene Regel vergißt einen
 * Fall, sobald die Quelle einen dazubekommt, und meldet dabei nichts.
 *
 * Unterstützt genau die Musterformen, die der Bestand benutzt: ein Verzeichnis
 * mit einem `*` am Ende (`apps/*`) oder ein fester Pfad. Eine Musterform, die
 * hier nicht steht, wird **nicht geraten**, sondern gemeldet.
 *
 * @param {string} repoRoot
 * @returns {ReadonlyMap<string, string>}
 */
const workspacePackages = (repoRoot) => {
  const known = cachedPackages.get(repoRoot);
  if (known !== undefined) return known;

  /** @type {Map<string, string>} */
  const found = new Map();
  for (const pattern of workspacePatterns(repoRoot)) {
    /** @type {string[]} */
    const candidates = [];
    if (pattern.endsWith("/*")) {
      const parent = path.join(repoRoot, pattern.slice(0, -2));
      let entries;
      try {
        entries = readdirSync(parent, { withFileTypes: true });
      } catch {
        continue; // Ein Muster ohne Verzeichnis ist kein Befund dieses Lesers.
      }
      for (const entry of entries) {
        if (entry.isDirectory()) candidates.push(path.join(parent, entry.name));
      }
    } else if (!pattern.includes("*")) {
      candidates.push(path.join(repoRoot, pattern));
    } else {
      throw new MissingSourceError(
        `Unbekannte Musterform „${pattern}\" in ${path.join(repoRoot, "pnpm-workspace.yaml")}.\n` +
          "        Dieser Leser kennt „verzeichnis/*\" und feste Pfade; geraten wird nicht.\n" +
          "        Ein geratenes Muster fände zu wenig Pakete, und zu wenig sähe aus wie\n" +
          "        keins.",
      );
    }
    for (const dir of candidates) {
      let parsed;
      try {
        parsed = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
      } catch {
        continue; // Kein Paket oder unlesbar — dann ist es nicht das gesuchte.
      }
      if (typeof parsed?.name !== "string") continue;
      const twin = found.get(parsed.name);
      if (twin !== undefined && twin !== dir) {
        throw new MissingSourceError(
          `Das Arbeitsbereichspaket ${parsed.name} liegt zweimal im Bestand:\n        ` +
            `${displayPath(repoRoot, twin)}\n        ${displayPath(repoRoot, dir)}\n` +
            "        Zwei Treffer sind so wenig eine Antwort wie keiner: Ein Lauf wüsste\n" +
            "        nicht, über welches der beiden Pakete er gerade urteilt.",
        );
      }
      found.set(parsed.name, dir);
    }
  }
  if (found.size < 2) {
    throw new MissingSourceError(
      `Nur ${String(found.size)} Arbeitsbereichspaket(e) unter ${repoRoot} gefunden — ` +
        "erwartet werden mindestens 2.\n" +
        "        Eine leere Paketliste ließe jede weitere Auflösung ins Leere greifen und\n" +
        "        jeden Zähler darüber beruhigend aussehen.",
    );
  }
  cachedPackages.set(repoRoot, found);
  return found;
};

/**
 * Der Ordner des Arbeitsbereichspakets mit diesem Namen — gesucht über den
 * Namen in `package.json`, nicht über einen Pfad.
 *
 * ---------------------------------------------------------------------------
 * Warum das eine eigene Funktion ist und nicht drei `join`-Aufrufe
 * ---------------------------------------------------------------------------
 *
 * `build-sidecar.mjs` zählt, wie viele Dateien jedes Arbeitsbereichspakets im
 * Bündel stecken, und unterscheidet dabei zwei Nullen: „null Dateien, weil das
 * Paket zur Laufzeit nur Typen liefert" ist in Ordnung, „null Dateien, weil
 * der Ordner nicht gefunden wurde" ist ein Fehlschlag der Messung. Ein fester
 * Pfad kann diese beiden Nullen nicht auseinanderhalten — er liefert für beide
 * dieselbe Zahl und dieselbe beruhigende Zeile.
 *
 * Dieselbe Familie wie der Windows-Trennzeichenfehler aus T-098, den
 * `paths.mjs` beantwortet: Ein Vergleich, der **nie** trifft, meldet
 * zeichengleich dasselbe wie ein Bestand ohne Treffer.
 *
 * Die eigentliche Umkehr gegenüber dem festen Pfad: Nicht „das Verzeichnis
 * `apps/web`", sondern „das Paket `@takt/web`, wo immer es liegen darf".
 *
 * @param {string} repoRoot Wurzel des Bestands, absolut. {@link workspaceRoot}
 *   liefert sie, wenn der Aufrufer sie nicht ohnehin schon kennt.
 * @param {string} packageName Der Name aus `package.json`, z. B. `@takt/domain`.
 * @returns {string} Absoluter Pfad des Paketordners.
 */
export const locateWorkspacePackage = (repoRoot, packageName) => {
  const packages = workspacePackages(repoRoot);
  const dir = packages.get(packageName);
  if (dir !== undefined) return dir;
  throw new MissingSourceError(
    `Das Arbeitsbereichspaket ${packageName} liegt unter keinem Muster aus ` +
      "pnpm-workspace.yaml.\n" +
      `        Bekannt sind: ${[...packages.keys()].sort().join(", ")}\n` +
      "        Gesucht wird über den Paketnamen und nicht über einen Pfad. Findet die Suche\n" +
      "        nichts, kann ein Zähler „null Dateien\" nicht mehr von „Paket nicht gefunden\"\n" +
      "        unterscheiden — und schriebe eine beruhigende Zeile, ohne gesucht zu haben.",
  );
};

/* ==================================================================== */
/* Quelldateien über ein Merkmal                                        */
/* ==================================================================== */

/**
 * **Genau eine** Datei unter `root`, die das Merkmal trägt — oder ein Abbruch.
 *
 * Das ist die Auflösung statt des Pfades: Gesucht wird über eine Eigenschaft,
 * die ein Umzug mitnimmt, und nicht über einen Ordnernamen, den er streicht.
 *
 * @param {object} query
 * @param {string} query.root Wurzel der Suche, absolut.
 * @param {(name: string) => boolean} query.accept Kandidaten nach Dateinamen.
 * @param {(text: string, name: string) => boolean} [query.carries] Zusätzlich
 *   das Merkmal im Inhalt. Fehlt es, entscheidet der Dateiname allein.
 * @param {(name: string) => boolean} [query.enter] Welche Ordner betreten
 *   werden. Fehlt sie, wird alles betreten.
 * @param {string} query.description Der gesuchte Gegenstand, für den Befund.
 * @returns {{ readonly path: string, readonly name: string, readonly text: string }}
 */
export const locateSingleSource = ({ root, accept, carries, enter, description }) => {
  const candidates = readTreeSync(root, accept, `die Suche nach ${description}`, enter);
  const hits = [];
  for (const candidate of candidates) {
    const text = readFileSync(candidate.path, "utf8");
    if (carries === undefined || carries(text, candidate.name)) {
      hits.push({ ...candidate, text });
    }
  }
  const only = hits[0];
  if (hits.length === 1 && only !== undefined) return only;
  if (hits.length === 0) {
    throw new MissingSourceError(
      `${description} steht unter ${root} nicht mehr (${String(candidates.length)} Kandidaten ` +
        "nach Dateinamen gelesen).\n" +
        "        Gesucht wird über ein Merkmal und nicht über einen Pfad, damit ein Umzug\n" +
        "        die Datei mitnimmt. Findet die Suche nichts, ist der Gegenstand entweder\n" +
        "        gefallen oder sein Merkmal — und dann misst die Prüfung darüber nichts.",
    );
  }
  throw new MissingSourceError(
    `${description} steht unter ${root} ${String(hits.length)}-mal:\n        ` +
      hits.map((hit) => hit.name).join("\n        ") +
      "\n        Zwei Treffer sind so wenig eine Antwort wie keiner: Der Lauf wüsste nicht,\n" +
      "        über welche der beiden Dateien er gerade urteilt.",
  );
};
