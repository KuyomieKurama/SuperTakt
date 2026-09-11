/**
 * SuperTakt — der ausführbare Nachweis über die **Sperrliste der
 * Hauptanwendung** (T-267).
 *
 * Aufruf:  pnpm --filter @takt/web proof:locked
 *
 * ===========================================================================
 * Warum es diese Datei gibt
 * ===========================================================================
 *
 * `docs/design/textbestand.md` führt in Abschnitt 5 eine **Sperrliste**: Sätze,
 * die kein Textdurchgang kürzen oder umschreiben darf, weil sie als einzige
 * eine fachliche Grenze, eine Folge oder eine Abwesenheit aussprechen. Für den
 * Aufgabenbereich hält `proof:addin` Abschnitt 20 seit T-199 die Einträge, die
 * allein tragen. **Für die Hauptanwendung hielt sie niemand.**
 *
 * Was daraus geworden ist, ist gemessen und nicht befürchtet: PR #8 hat drei
 * gesperrte Sätze gekürzt (SP-03, SP-05, SP-16), kein Lauf wurde rot, und
 * gemerkt hat es fünf Monate später ein Mensch, der die Liste von Hand am
 * Gegenstand nachgeschlagen hat. SP-16 hat dabei den Satz verloren, der dem
 * Benutzer sagt, daß **die Anwendung** sein „Erledigt" aufgehoben hat und
 * nicht er selbst — der Pflichtablauf „Timer auf erledigtem Todo" (A-2.5,
 * I-05) hat also seine Auskunft verloren, während alle Läufe grün blieben.
 *
 * ===========================================================================
 * Die Bauart — und warum sie so und nicht anders ist
 * ===========================================================================
 *
 *  1. **Die Menge wird an der Anforderung aufgespannt** (E-102, E-103). Die
 *     Einträge kommen aus der Tabelle in `docs/design/textbestand.md`, Zeile
 *     für Zeile gelesen. Eine zweite Liste im Skript wäre eine **Abschrift**,
 *     und eine Abschrift läuft von ihrer Vorlage weg: Der Lauf mäße dann sich
 *     selbst. Der Preis dieser Entscheidung steht in Abschnitt 3 — das Papier
 *     ist Prosa und nicht Datei, und was sich daraus nicht auflösen läßt, sagt
 *     dieser Lauf **laut**, statt es zu übergehen.
 *  2. **Untergrenze vor dem Urteil** (T-247-7). Null Einträge oder null
 *     Quelldateien sind ein **Fehlschlag der Messung** und kein bestandener
 *     Prüfsatz. Vier Wächter dieses Bestands sind an genau dieser Stelle
 *     aufgefallen; einer urteilte über 129 Dateien, ohne eine gelesen zu haben.
 *  3. **Beide Richtungen** (E-103). Rot wird ein Eintrag, dessen **Satz** es
 *     nicht mehr gibt — und ebenso ein Eintrag, dessen **Fundort** es nicht
 *     mehr gibt. Die zweite Richtung ist die teurere Hälfte: Ein Eintrag, der
 *     auf eine Datei zeigt, die es nicht mehr gibt, ist keine Zusage mehr,
 *     sondern eine Behauptung über einen Ort.
 *  4. **Gegenprobe je Eintrag.** Eine plausible Kürzung an genau einem Satz
 *     muß **genau einen** Befund ergeben und ihn benennen. Ein Sucher, der bei
 *     jeder Änderung alles meldet, wird beim ersten Fehlalarm gelockert — und
 *     mißt danach nichts mehr.
 *
 * ===========================================================================
 * Was dieser Lauf **nicht** mißt, und warum
 * ===========================================================================
 *
 *  - **Zeilennummern.** Die Sperrliste nennt Fundorte als `Datei.tsx:504`. Die
 *    Zeile wandert bei jeder Einfügung darüber; sie zu messen hieße, den Lauf
 *    bei jedem zweiten Auftrag rot zu machen und ihn danach abzuschalten.
 *    Gemessen wird die **Datei**, und gefunden wird der Satz im ganzen
 *    Quellbaum — wo er tatsächlich steht, sagt der Bericht am Ende.
 *  - **Den Wortlaut außerhalb von `apps/web`.** SP-22 liegt im
 *    Benutzerhandbuch und gehört documenter. Von dort wird geprüft, **daß es
 *    die Datei gibt**, und sonst nichts: Ein Wächter, der über fremde Hoheit
 *    urteilt, urteilt über eine Zusage, die er nicht halten kann.
 *  - **Ob der Satz das Richtige sagt.** Das ist Sache des spec-ux-reviewers
 *    und von E-078; dieser Lauf hält nur fest, daß er dasteht.
 *  - **Den Bildschirm.** Gelesen wird Quelltext. Daß der Satz auch sichtbar
 *    wird, mißt `visual-qa`.
 *
 * ===========================================================================
 * Zwei Nachsichten, benannt statt versteckt
 * ===========================================================================
 *
 *  - **Die Marke.** Das Papier schreibt durchweg „Takt", die Oberfläche seit
 *    A-21 „SuperTakt". Beide Seiten werden vor dem Vergleich auf „Takt"
 *    gebracht. Ohne diese Nachsicht wären acht Einträge rot, und zwar für eine
 *    Umbenennung, die die Spezifikation **verlangt**. Der Lauf zählt sie und
 *    nennt sie am Ende, damit die Liste nachgezogen werden kann.
 *  - **Anführungszeichen.** Das Papier setzt „…" mit geradem Schlußzeichen,
 *    die Oberfläche „…“ mit typographischem. Beide werden auf `"` gebracht.
 *
 * Was **keine** Nachsicht ist: Wortlaut, Wortstellung, Satzzeichen und Länge.
 * Die Kürzung, die diesen Lauf ausgelöst hat, wäre an jeder dieser Eigenschaften
 * aufgefallen.
 */

import assert from 'node:assert/strict';
import path from 'node:path';

import {
  displayPath,
  readRequiredFile,
  readTreeSync,
  requireAtLeast,
  workspaceRoot,
} from '../../../scripts/source-anchors.mjs';

/* ==================================================================== */
/* 0  Werkzeug                                                          */
/* ==================================================================== */

let passed = 0;
let failed = 0;

/** @param {string} name */
const heading = (name) => {
  process.stdout.write(`\n${name}\n${'─'.repeat(name.length)}\n`);
};

/**
 * @param {string} name
 * @param {() => void} fn
 */
const check = (name, fn) => {
  try {
    fn();
    passed += 1;
    process.stdout.write(`  ok    ${name}\n`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`  FEHL  ${name}\n        ${message.replace(/\n/g, '\n        ')}\n`);
  }
};

const repoRoot = workspaceRoot();
const webRoot = path.join(repoRoot, 'apps', 'web');
const srcRoot = path.join(webRoot, 'src');
const paperPath = path.join(repoRoot, 'docs', 'design', 'textbestand.md');

/* ==================================================================== */
/* 1  Die Menge: die Sperrliste, gelesen an der Anforderung             */
/* ==================================================================== */

heading('1  Die Sperrliste — gelesen, nicht abgeschrieben');

const paper = readRequiredFile(
  paperPath,
  'die Sperrliste, über die dieser Lauf urteilt (Abschnitt 5)',
);

/**
 * Die Zeilen des Abschnitts 5 — von seiner Überschrift bis zur nächsten.
 *
 * Der Schnitt ist nötig und nicht Zierat: Weiter unten im selben Papier steht
 * die **Kürzungsliste**, und eine ihrer Zeilen beginnt ebenfalls mit „SP-09".
 * Ohne den Schnitt zöge der Lauf einen Vorschlag in die Menge der Zusagen.
 *
 * @param {string} text
 * @returns {readonly string[]}
 */
const sectionLines = (text) => {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+5\.\s+Die Sperrliste\s*$/.test(line));
  if (start < 0) {
    throw new Error(
      `In ${displayPath(repoRoot, paperPath)} steht keine Überschrift „## 5. Die Sperrliste".\n` +
        'Ohne sie weiß dieser Lauf nicht, welche Tabelle die Zusagen trägt — und eine\n' +
        'Tabelle zu raten wäre schlimmer als keine zu lesen.',
    );
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^#{2,6}\s/.test(line));
  return end < 0 ? rest : rest.slice(0, end);
};

/** Ohne Auszeichnung: `**fett**` und Code-Klammern stören den Wortlaut. */
const withoutMarkup = (cell) => cell.replace(/\*\*/g, '').replace(/`/g, '');

/**
 * Die Zitate einer Tabellenzelle, verschachtelungsfest.
 *
 * Deutsche Anführungszeichen haben ein eigenes Zeichen zum Öffnen (`„`) und
 * eines zum Schließen; das Papier benutzt dafür das gerade `"`. Weil beide
 * Zeichen verschieden sind, läßt sich die Tiefe zählen, und ein Zitat im Zitat
 * („Installieren", „http") beendet das äußere nicht. Genau daran scheitert ein
 * naives `/„([^"]*)"/` — es schnitte SP-12 mitten im Satz ab und meldete
 * danach eine Kürzung, die keine ist.
 *
 * @param {string} cell
 * @returns {readonly string[]}
 */
const quotations = (cell) => {
  const text = withoutMarkup(cell);
  /** @type {string[]} */
  const found = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '„') {
      if (depth === 0) start = index + 1;
      depth += 1;
    } else if (char === '"' || char === '“' || char === '”') {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0) found.push(text.slice(start, index));
    }
  }
  return found;
};

/** Ein Zitat zerfällt an jeder Auslassung in seine belegten Teile. */
const ELLIPSIS = '…';

/**
 * Kürzer als das gilt nicht als Anker.
 *
 * Ein Bruchstück wie „und" käme in jeder Datei vor; es beantwortete die Frage
 * „steht der Satz noch da" mit Ja, ohne sie gestellt zu haben. Solche Teile
 * werden **gezählt und genannt**, nicht stillschweigend übergangen.
 */
const MIN_ANCHOR = 12;

/**
 * Vergleichsform beider Seiten.
 *
 * Was hier zusammenfällt, steht im Kopf dieser Datei unter „Nachsichten": die
 * Marke (A-21) und die Sorte Anführungszeichen. Alles andere bleibt, wie es
 * ist — insbesondere Wortwahl, Reihenfolge und Satzzeichen.
 *
 * @param {string} text
 */
const comparable = (text) =>
  text
    .replace(/„|“|”|«|»/g, '"')
    .replace(/‘|’|‚/g, "'")
    .replace(/SuperTakt/g, 'Takt')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Ein Eintrag der Sperrliste, so wie das Papier ihn hergibt.
 *
 * @typedef {object} LockedEntry
 * @property {string} id           `SP-16`
 * @property {readonly string[]} files    Dateibezüge aus der Ortsspalte, ohne Zeilenangabe.
 * @property {readonly string[]} symbols  Bezeichner aus der Ortsspalte (`reactivationTitle`).
 * @property {readonly string[]} anchors  Belegte Textteile, vergleichsfertig.
 * @property {readonly string[]} tooShort Teile unter {@link MIN_ANCHOR}.
 * @property {string} row          Die ganze Zeile, für den Befund.
 * @property {string} wording      Die gelesene Wortlautspalte, roh — für die Marke.
 */

/**
 * Liest die Tabelle des Abschnitts 5.
 *
 * @param {string} text
 * @returns {readonly LockedEntry[]}
 */
const readLockedList = (text) => {
  /** @type {LockedEntry[]} */
  const entries = [];
  for (const row of sectionLines(text)) {
    if (!/^\|\s*\*{0,2}SP-\d+/.test(row)) continue;
    const cells = row.split('|').slice(1, -1).map((cell) => cell.trim());
    /*
     * Fünf Spalten sind der Regelfall (Nr., Ort, Wortlaut, Prüfpunkt, Warum);
     * vier sind der Fall, in dem ein Eintrag **keinen** eigenen Wortlaut hat,
     * weil seine Zusage an einer Bauart hängt und nicht an einem Satz — SP-06
     * (die Bauart von `refusal`) und SP-11 (fünf Meldungen) stehen so da.
     * Alles andere ist ein Zerleger, der die Tabelle nicht mehr versteht.
     */
    if (cells.length !== 5 && cells.length !== 4) {
      throw new Error(
        `Die Zeile „${row.slice(0, 60)}…" hat ${String(cells.length)} Spalten statt 4 oder 5.\n` +
          'Der Leser dieser Tabelle rechnet mit Nr., Ort, [Wortlaut,] Prüfpunkt, Warum.',
      );
    }
    const [numberCell, placeCell] = cells;
    const wordingCell = cells.length === 5 ? cells[2] : '';
    const id = withoutMarkup(numberCell ?? '').trim();

    const spans = [...(placeCell ?? '').matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? '');
    /** @type {string[]} */
    const files = [];
    /** @type {string[]} */
    const symbols = [];
    for (const span of spans) {
      const head = span.split(',')[0]?.trim() ?? '';
      if (head.startsWith(':')) continue; /* `:429-432` — Zeilen der Datei davor. */
      const withoutLines = head.replace(/:[0-9-]+$/, '');
      if (/\.[a-z0-9]{1,4}$/i.test(withoutLines)) files.push(withoutLines);
      else symbols.push(head);
    }

    /*
     * Der Wortlaut steht in Spalte 3. Nur wenn dort **kein** Zitat steht,
     * wird die Ortsspalte gelesen: SP-18 trägt seinen Satz dort, weil er zu
     * zwei Dateien gehört. Die Spalten 4 und 5 werden nie gelesen — sie
     * begründen die Sperre und zitieren dabei fremde Wörter („Erledigt",
     * „Installieren"), die kein Anker sind.
     */
    const source = quotations(wordingCell ?? '').length > 0 ? (wordingCell ?? '') : (placeCell ?? '');
    /** @type {string[]} */
    const anchors = [];
    /** @type {string[]} */
    const tooShort = [];
    for (const quotation of quotations(source)) {
      for (const piece of quotation.split(ELLIPSIS)) {
        const value = comparable(piece);
        if (value.length === 0) continue;
        if (value.length >= MIN_ANCHOR) anchors.push(value);
        else tooShort.push(value);
      }
    }

    entries.push({ id, files, symbols, anchors, tooShort, row, wording: withoutMarkup(source) });
  }
  return entries;
};

/*
 * **Zuerst die Menge, dann das Urteil.** Zehn ist keine Zählung der Liste,
 * sondern eine Plausibilitätsgrenze: Heute stehen 22 Einträge dort. Fällt die
 * Menge unter zehn, ist entweder der Leser kaputt oder die Liste ist
 * ausgeräumt worden — und beides gehört angesehen, nicht durchgewinkt.
 */
const lockedEntries = requireAtLeast(
  readLockedList(paper),
  10,
  'Einträge der Sperrliste',
  displayPath(repoRoot, paperPath),
);

/** Die Quelldateien der Oberfläche — der Bestand, über den geurteilt wird. */
const sourceFiles = requireAtLeast(
  readTreeSync(
    srcRoot,
    (name) => /\.(tsx?|css)$/.test(name),
    'den Quellbaum der Oberfläche',
    (name) => name !== 'node_modules',
  ),
  60,
  'Quelldateien',
  displayPath(repoRoot, srcRoot),
);

/**
 * Datei → vergleichsfertiger Inhalt. Über **diese** Abbildung läuft jede
 * Prüfung, und die Gegenprobe reicht eine geänderte Kopie durch denselben
 * Sucher, ohne eine Datei anzufassen.
 *
 * @type {ReadonlyMap<string, string>}
 */
const corpus = new Map(
  sourceFiles.map((file) => [file.name, comparable(readRequiredFile(file.path, 'eine Quelldatei'))]),
);

const corpusSize = [...corpus.values()].reduce((sum, text) => sum + text.length, 0);

check('die Sperrliste ist gelesen, der Quellbaum auch — beide sind nicht leer', () => {
  assert.ok(lockedEntries.length >= 10, 'zu wenige Einträge');
  assert.ok(corpus.size >= 60, 'zu wenige Quelldateien');
  assert.ok(
    corpusSize > 200_000,
    `der gelesene Quelltext ist mit ${String(corpusSize)} Zeichen zu klein — dann urteilt ` +
      'dieser Lauf über Dateien, die er nicht gelesen hat',
  );
  const withoutAnchor = lockedEntries.filter(
    (entry) => entry.anchors.length === 0 && entry.symbols.length === 0,
  );
  assert.ok(
    withoutAnchor.length < lockedEntries.length / 2,
    'über die Hälfte der Einträge hat weder Satzteil noch Bezeichner — dann liest der ' +
      'Zerleger die Tabelle nicht mehr richtig',
  );
});

/* ==================================================================== */
/* 2  Richtung 1: gibt es den Fundort noch?                             */
/* ==================================================================== */

heading('2  Der Fundort (E-103, zweite Richtung)');

/**
 * Ein Dateibezug der Sperrliste, aufgelöst gegen den heutigen Baum.
 *
 * Aufgelöst wird über den **Dateinamen**, nicht über den Pfad: Die
 * Umstrukturierung hat `screens/TodoListScreen.tsx` nach
 * `features/todos/TodoListScreen.tsx` bewegt, und ein Wächter, der daran rot
 * wird, mißt Ordnernamen statt Zusagen. Verschwindet der Name selbst, wird er
 * rot — dann ist der Ort wirklich weg.
 *
 * @param {string} reference
 * @returns {{ kind: 'web', name: string } | { kind: 'foreign', name: string } | { kind: 'missing', reason: string } | { kind: 'ambiguous', reason: string }}
 */
const resolveFile = (reference) => {
  const normalized = reference.replace(/\\/g, '/');
  const base = normalized.split('/').pop() ?? normalized;

  if (normalized.includes('/') && !normalized.startsWith('lib/') && !normalized.startsWith('src/')) {
    /* Ein Pfad aus einem anderen Bestandsteil — `docs/benutzerhandbuch.md`. */
    const outside = sourceFiles.length > 0 ? path.join(repoRoot, normalized) : '';
    try {
      readRequiredFile(outside, 'einen Fundort außerhalb der Oberfläche');
      return { kind: 'foreign', name: normalized };
    } catch {
      return { kind: 'missing', reason: `${normalized} gibt es im Bestand nicht mehr` };
    }
  }

  const hits = sourceFiles.filter((file) => file.name.endsWith(`/${base}`) || file.name === base);
  const only = hits[0];
  if (hits.length === 1 && only !== undefined) return { kind: 'web', name: only.name };
  if (hits.length === 0) {
    return { kind: 'missing', reason: `${base} gibt es unter apps/web/src nicht mehr` };
  }
  return {
    kind: 'ambiguous',
    reason: `${base} steht ${String(hits.length)}-mal: ${hits.map((hit) => hit.name).join(', ')}`,
  };
};

/** Auflösung je Eintrag, einmal gerechnet. */
const resolved = lockedEntries.map((entry) => ({
  entry,
  places: entry.files.map((file) => ({ reference: file, result: resolveFile(file) })),
}));

check('jeder Fundort der Sperrliste steht noch im Bestand', () => {
  /** @type {string[]} */
  const findings = [];
  for (const { entry, places } of resolved) {
    for (const place of places) {
      if (place.result.kind === 'missing' || place.result.kind === 'ambiguous') {
        findings.push(`${entry.id}: ${place.result.reason}`);
      }
    }
  }
  assert.deepEqual(
    findings,
    [],
    'ein Eintrag zeigt auf einen Ort, den es nicht mehr gibt. Ein gesperrter Satz ohne ' +
      'Fundort ist keine Zusage mehr, sondern eine Behauptung über eine Datei.\n' +
      `Die Liste steht in ${displayPath(repoRoot, paperPath)}, Abschnitt 5.`,
  );
});

check('jeder Eintrag nennt mindestens einen Ort', () => {
  const findings = resolved
    .filter(({ entry, places }) => places.length === 0 && entry.symbols.length === 0)
    .map(({ entry }) => `${entry.id}: keine Datei und kein Bezeichner in der Ortsspalte`);
  assert.deepEqual(findings, [], 'ein Eintrag ohne Ort ist von hier aus nicht meßbar');
});

/* ==================================================================== */
/* 3  Richtung 2: steht der Satz noch da?                               */
/* ==================================================================== */

heading('3  Der Wortlaut (E-103, erste Richtung)');

/**
 * Ein Anker, dessen Zitat im Zitat als Platzhalter gelesen wird.
 *
 * SP-16 zitiert `„Timer gestartet. „X" ist wieder offen."` — das `X` steht für
 * den Titel des Todos und ist im Quelltext ein Einschub (`${quotedName(…)}`).
 * Wörtlich gesucht fände ihn niemand. Deshalb der zweite, weichere Versuch:
 * innere Zitate werden zu einer Lücke von höchstens 120 Zeichen. Er wird erst
 * unternommen, wenn der wörtliche fehlschlägt, und er wird **gezählt und
 * genannt** — eine Nachsicht, die niemand sieht, ist eine Lücke.
 *
 * @param {string} anchor
 * @returns {RegExp | null}
 */
const patternOf = (anchor) => {
  const parts = anchor.split(/"[^"]*"/);
  if (parts.length < 2) return null;
  if (parts.every((part) => part.trim().length < MIN_ANCHOR)) return null;
  const escaped = parts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('.{0,120}'));
};

/*
 * Die Einträge, die dieser Lauf am Wortlaut mißt — alles unter `apps/web`,
 * das ein Zitat trägt.
 *
 * Draußen bleiben zwei Sorten, und beide werden in Abschnitt 5 genannt statt
 * verschwiegen: Einträge **ohne** Zitat (SP-06, SP-11 — ihre Zusage hängt an
 * einer Bauart) und Einträge in **fremder** Hoheit (SP-22 liegt im
 * Benutzerhandbuch). Über die zweite Sorte zu urteilen hieße, eine Zusage zu
 * halten, die dieser Lauf nicht halten kann.
 */
const measurable = resolved.filter(
  ({ entry, places }) =>
    entry.anchors.length > 0 && !places.some((place) => place.result.kind === 'foreign'),
);

const foreignEntries = resolved.filter(({ places }) =>
  places.some((place) => place.result.kind === 'foreign'),
);

/**
 * Wie ein Anker gesucht wird — und wo er heute steht.
 *
 * **Die Entscheidung fällt einmal**, gegen den wirklichen Bestand, und sie
 * gilt danach für jede Suche einschließlich der Gegenproben. Anders wäre die
 * Nachsicht beweglich: Ein Anker, der wörtlich dasteht, würde nach einer
 * Kürzung plötzlich über das Muster gefunden — und die Kürzung bliebe
 * unbemerkt. Genau das ist bei SP-18 passiert, dessen Satz zwei Regelnamen in
 * Anführungszeichen enthält.
 *
 * `match` ist der Text, der heute wirklich dasteht (bei einem Muster also der
 * Einschub eingeschlossen). Die Gegenprobe kürzt **ihn**, nicht das Zitat aus
 * dem Papier.
 *
 * @typedef {object} AnchorMode
 * @property {'literal' | 'pattern' | 'missing'} kind
 * @property {readonly string[]} names Dateien, in denen er steht.
 * @property {string} match Der heute vorhandene Text.
 */

/**
 * @param {string} anchor
 * @returns {AnchorMode}
 */
const modeOf = (anchor) => {
  const literal = [...corpus.entries()].filter(([, text]) => text.includes(anchor)).map(([name]) => name);
  if (literal.length > 0) return { kind: 'literal', names: literal, match: anchor };
  const pattern = patternOf(anchor);
  if (pattern !== null) {
    /** @type {string[]} */
    const names = [];
    let match = '';
    for (const [name, text] of corpus) {
      const hit = pattern.exec(text);
      if (hit !== null) {
        names.push(name);
        if (match === '') match = hit[0];
      }
    }
    if (names.length > 0) return { kind: 'pattern', names, match };
  }
  return { kind: 'missing', names: [], match: anchor };
};

/** @type {ReadonlyMap<string, AnchorMode>} */
const anchorModes = new Map(
  measurable.flatMap(({ entry }) => entry.anchors.map((anchor) => [anchor, modeOf(anchor)])),
);

/**
 * Der Sucher, den beide Hälften benutzen: welcher gesperrte Satz fehlt?
 *
 * `texts` ist die Abbildung Datei → Inhalt und wird **übergeben** statt
 * gelesen, damit die Gegenprobe eine eingesetzte Kürzung durchschicken kann.
 *
 * @param {ReadonlyMap<string, string>} texts
 * @returns {readonly string[]} Befunde, je Eintrag und Anker einer.
 */
const missingAnchors = (texts) => {
  /** @type {string[]} */
  const findings = [];
  for (const { entry } of measurable) {
    for (const anchor of entry.anchors) {
      const mode = anchorModes.get(anchor);
      const pattern = mode?.kind === 'pattern' ? patternOf(anchor) : null;
      let found = false;
      for (const text of texts.values()) {
        if (pattern === null ? text.includes(anchor) : pattern.test(text)) {
          found = true;
          break;
        }
      }
      if (!found) findings.push(`${entry.id}: „${anchor}"`);
    }
  }
  return findings;
};

check('jeder gesperrte Satz steht noch in der Oberfläche', () => {
  assert.ok(
    measurable.length >= 8,
    `nur ${String(measurable.length)} Einträge sind am Wortlaut meßbar — dann liest der ` +
      'Zerleger die Wortlautspalte nicht mehr',
  );
  assert.deepEqual(
    missingAnchors(corpus),
    [],
    'ein gesperrter Satz ist gekürzt, umgeschrieben oder gefallen. Er fällt nur mit der\n' +
      `Zustimmung des Prüfers, der ihn verlangt hat (E-078 Punkt 3); die Liste steht in\n` +
      `${displayPath(repoRoot, paperPath)}, Abschnitt 5.`,
  );
});

/**
 * Wo ein benannter Bezeichner steht — `reactivationTitle`, `NoShellNotice`,
 * `status-admin__blocked`.
 *
 * Gesucht wird im **ganzen** Quellbaum und nicht nur in der genannten Datei.
 * Der Grund ist derselbe wie beim Satz: Ein Umzug soll den Träger mitnehmen
 * dürfen. Steht der Bezeichner woanders als im Papier angegeben, sagt das
 * Abschnitt 5; steht er nirgends mehr, ist der Träger der Zusage gefallen und
 * dieser Lauf wird rot.
 *
 * @param {string} symbol
 * @returns {readonly string[]}
 */
const symbolPlaces = (symbol) =>
  [...corpus.entries()].filter(([, text]) => text.includes(symbol)).map(([name]) => name);

check('jeder benannte Bezeichner steht noch in der Oberfläche', () => {
  /** @type {string[]} */
  const findings = [];
  for (const { entry, places } of resolved) {
    if (entry.symbols.length === 0) continue;
    if (places.some((place) => place.result.kind === 'foreign')) continue;
    for (const symbol of entry.symbols) {
      if (symbolPlaces(symbol).length === 0) {
        findings.push(`${entry.id}: „${symbol}" steht unter apps/web/src nicht mehr`);
      }
    }
  }
  assert.deepEqual(
    findings,
    [],
    'ein Eintrag nennt einen Bezeichner, den es nicht mehr gibt — der Träger der Zusage ' +
      'ist umbenannt oder gefallen',
  );
});

check('Gegenprobe: ein erfundener Bezeichner wird nicht gefunden', () => {
  /*
   * Ohne sie stünde die Prüfung darüber auf der Annahme, `includes` finde
   * nicht alles. Ein Bezeichner wie `body` ist kurz und käme fast überall vor;
   * gemessen wird deshalb, daß der Sucher überhaupt Nein sagen kann.
   */
  assert.deepEqual(symbolPlaces('reactivationTitleFort'), [], 'der Sucher findet Erfundenes');
  assert.ok(symbolPlaces('reactivationTitle').length > 0, 'der Sucher findet Vorhandenes nicht');
});

/* ==================================================================== */
/* 4  Gegenprobe — was dieser Lauf findet, wenn etwas fehlt             */
/* ==================================================================== */

heading('4  Gegenprobe (eine eingesetzte Kürzung je Eintrag)');

/**
 * Eine plausible Kürzung: die vordere Hälfte des Satzes bleibt stehen.
 *
 * Sie ist nicht erfunden. Genau diese Sorte hat SP-05 getroffen — aus „Keine
 * Frist gesetzt. Dieses Todo ist deshalb weder überfällig noch heute fällig …"
 * wurde „Keine Frist gesetzt." — und SP-03, dessen zwei Sätze zu einem
 * Halbsatz zusammengezogen worden waren.
 *
 * @param {string} anchor
 */
const shortened = (anchor) => anchor.slice(0, Math.max(MIN_ANCHOR - 4, Math.ceil(anchor.length / 2)));

check('jede eingesetzte Kürzung ergibt genau einen Befund — und nennt ihn', () => {
  assert.ok(measurable.length > 0, 'ohne meßbare Einträge prüft diese Gegenprobe nichts');
  for (const { entry } of measurable) {
    const anchor = [...entry.anchors].sort((a, b) => b.length - a.length)[0];
    if (anchor === undefined) continue;
    const mode = anchorModes.get(anchor);
    assert.ok(mode !== undefined && mode.kind !== 'missing', `${entry.id}: „${anchor}" steht nicht da`);

    /*
     * Gekürzt wird der Text, der **wirklich dasteht** — bei einem Muster also
     * mitsamt seinem Einschub. Das Zitat aus dem Papier zu kürzen träfe bei
     * SP-16 eine Zeichenkette, die es im Quelltext gar nicht gibt.
     */
    const copy = new Map(corpus);
    for (const [name, text] of copy) {
      if (text.includes(mode.match)) copy.set(name, text.split(mode.match).join(shortened(mode.match)));
    }
    assert.notDeepEqual(
      [...copy.values()],
      [...corpus.values()],
      `${entry.id}: die Kürzung ließ sich nicht einsetzen — dann greift der Sucher daneben`,
    );

    assert.deepEqual(
      missingAnchors(copy),
      [`${entry.id}: „${anchor}"`],
      `${entry.id}: die eingesetzte Kürzung bleibt unbemerkt oder meldet zu viel`,
    );
  }
});

check('ein leerer Bestand ist rot und nicht grün (Untergrenze)', () => {
  /*
   * Der grünste Sucher ist der, der nichts liest. Diese Gegenprobe hält fest,
   * daß eine leere Menge **jeden** Eintrag meldet — und nicht keinen.
   */
  const findings = missingAnchors(new Map());
  assert.ok(
    findings.length >= measurable.length,
    `über einen leeren Bestand meldet der Sucher nur ${String(findings.length)} Befunde — ` +
      'dann urteilt er über etwas, das er nicht gelesen hat',
  );
});

check('ein gestrichener Fundort wird rot', () => {
  const withFile = resolved.find(({ places }) => places.some((place) => place.result.kind === 'web'));
  assert.ok(withFile !== undefined, 'kein Eintrag zeigt auf eine Datei der Oberfläche');
  const reference = withFile.entry.files[0] ?? '';
  const invented = reference.replace(/([^/]+)(\.[a-z]+)$/i, '$1Fort$2');
  assert.notEqual(invented, reference, 'der Testfall ließ sich nicht bauen');
  assert.equal(
    resolveFile(invented).kind,
    'missing',
    'ein Fundort, den es nicht gibt, gilt dem Auflöser als vorhanden — dann mißt die ' +
      'zweite Richtung nichts',
  );
});

/* ==================================================================== */
/* 5  Bericht — was aufgelöst wurde und was nachzuziehen ist            */
/* ==================================================================== */

heading('5  Was nachzuziehen ist (fremde Hoheit: ui-designer)');

/*
 * Nicht rot, aber laut. `docs/design/textbestand.md` gehört ui-designer und
 * ux-designer; dieser Lauf trägt dort nichts ein. Was er kann, ist die Liste
 * derer nennen, deren Angaben nicht mehr auf den Baum passen — Datei bewegt,
 * Marke umbenannt, Satzteil zu kurz zum Ankern. Wer die Liste nachzieht,
 * findet hier, was zu tun ist.
 */

/** @type {string[]} */
const followUp = [];

for (const { entry, places } of measurable) {
  const named = new Set(
    places.flatMap((place) => (place.result.kind === 'web' ? [place.result.name] : [])),
  );
  for (const anchor of entry.anchors) {
    const where = anchorModes.get(anchor);
    if (where === undefined || where.names.length === 0) continue;
    const outside = where.names.filter((name) => !named.has(name));
    if (named.size > 0 && outside.length === where.names.length) {
      followUp.push(
        `${entry.id}: Ort im Papier ${[...named].join(', ')} — Satz steht in ${where.names.join(', ')}`,
      );
    }
    if (where.kind === 'pattern') {
      followUp.push(`${entry.id}: nur über Muster gefunden (Platzhalter im Zitat) — „${anchor}"`);
    }
  }
}

for (const { entry, places } of resolved) {
  const named = new Set(
    places.flatMap((place) => (place.result.kind === 'web' ? [place.result.name] : [])),
  );
  for (const symbol of entry.symbols) {
    const where = symbolPlaces(symbol);
    if (where.length === 0 || named.size === 0) continue;
    if (!where.some((name) => named.has(name))) {
      followUp.push(
        `${entry.id}: Bezeichner „${symbol}" steht in ${where.join(', ')}, im Papier unter ${[...named].join(', ')}`,
      );
    }
  }
  if (entry.tooShort.length > 0) {
    followUp.push(`${entry.id}: zu kurz zum Ankern — ${entry.tooShort.map((part) => `„${part}"`).join(', ')}`);
  }
  if (entry.anchors.length === 0 && entry.symbols.length > 0) {
    followUp.push(`${entry.id}: kein Zitat in der Wortlautspalte — gemessen wird nur der Ort`);
  }
}

const brandEntries = lockedEntries.filter(
  (entry) => /(?<!Super)Takt/.test(entry.wording) && entry.anchors.length > 0,
);

const followUpLines = [...new Set(followUp)].sort((a, b) => a.localeCompare(b));

if (followUpLines.length === 0) {
  process.stdout.write('  (nichts)\n');
} else {
  for (const line of followUpLines) process.stdout.write(`  ·  ${line}\n`);
}
if (brandEntries.length > 0) {
  process.stdout.write(
    `  ·  Marke: ${String(brandEntries.length)} Einträge schreiben „Takt", die Oberfläche seit A-21 ` +
      `„SuperTakt" (${brandEntries.map((entry) => entry.id).join(', ')})\n`,
  );
}
for (const { entry, places } of foreignEntries) {
  process.stdout.write(
    `  ·  ${entry.id}: fremde Hoheit — ${places
      .map((place) => (place.result.kind === 'foreign' ? place.result.name : ''))
      .filter((name) => name.length > 0)
      .join(', ')} liegt außerhalb von apps/web; gemessen wird nur, daß es die Datei gibt\n`,
  );
}

/* ==================================================================== */

const anchorCount = lockedEntries.reduce((sum, entry) => sum + entry.anchors.length, 0);
const placeCount = resolved.reduce((sum, item) => sum + item.places.length, 0);
const symbolCount = lockedEntries.reduce((sum, entry) => sum + entry.symbols.length, 0);

process.stdout.write(
  `\n${'═'.repeat(58)}\n${String(passed)} bestanden, ${String(failed)} fehlgeschlagen.\n`,
);
process.stdout.write(
  `${String(lockedEntries.length)} Einträge der Sperrliste, ${String(measurable.length)} davon am ` +
    `Wortlaut gemessen; ${String(anchorCount)} Satzteile, ${String(placeCount)} Fundorte, ` +
    `${String(symbolCount)} Bezeichner gegen ${String(corpus.size)} Quelldateien ` +
    `(${String(corpusSize)} Zeichen).\n`,
);
process.stdout.write(
  `Darunter ${String(measurable.length)} Gegenproben: je Eintrag eine eingesetzte Kürzung, ` +
    'dazu die leere Menge und der gestrichene Fundort.\n',
);

process.exit(failed === 0 ? 0 : 1);
