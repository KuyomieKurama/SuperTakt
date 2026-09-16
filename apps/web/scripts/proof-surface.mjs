/** Prüft beständige Live-Regionen, Fehlerrollen, sichtbare CSS-Regeln und die Anrede in `apps/web/src`.
 * Bedingt eingebundene Komponenten, ganze Teilbäume und Funktionsrückgaben werden nicht vollständig erfasst. Tatsächliche Ansagen erfordern eine Vorlesehilfe. */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { readRequiredFile, readTreeSync, requireAtLeast, requireDirectory } from '../../../scripts/source-anchors.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const srcRoot = requireDirectory(
  path.join(appRoot, 'src'),
  'den Quellbaum, über den dieser Nachweis urteilt',
);

/* 0  Werkzeug                                                          */

let passed = 0;
let failed = 0;

const heading = (name) => {
  process.stdout.write(`\n${name}\n${'─'.repeat(name.length)}\n`);
};

const check = (name, fn) => {
  try {
    fn();
    passed += 1;
    process.stdout.write(`  ok    ${name}\n`);
  } catch (error) {
    failed += 1;
    process.stdout.write(`  FEHL  ${name}\n        ${String(error?.message ?? error)}\n`);
  }
};

/** Jede `.ts`/`.tsx`-Datei unter `apps/web/src`, in fester Reihenfolge. */
const collectSourceFiles = (dir) => {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectSourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) found.push(full);
  }
  return found;
};

/*
 * **Zuerst die Menge, dann das Urteil** (T-249-2, Bauart aus T-247-7).
 *
 * Jede Regel dieses Laufs ist eine Aussage über *alle* Quelldateien der
 * Oberfläche. Wäre die Menge leer — ein umgeräumter Baum, ein Tippfehler im
 * Anker —, wäre jede dieser Aussagen **leer wahr**, und der Lauf meldete grün,
 * ohne eine Zeile gelesen zu haben. Die Untergrenze steht deshalb vor der
 * ersten Prüfung und nicht in ihr.
 */
const sourceFilePaths = requireAtLeast(
  collectSourceFiles(srcRoot),
  60,
  'Quelldateien',
  srcRoot,
);

/**
 * Zerlegt Quelltext als TSX — ohne Programm und ohne Typprüfer.
 *
 * Alle vier Regeln sind Fragen an die **Gestalt** und nicht an den Typ. Ein
 * Programm zu bauen (wie `proof:foreign` es muß) kostete hier Zeit ohne
 * Gewinn und machte die Gegenproben in Abschnitt 5 umständlich: So reicht eine
 * Zeichenkette als Quelle.
 *
 * @param {string} name
 * @param {string} text
 */
const parse = (name, text) =>
  ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/** Die geparsten Dateien des Bestands, einmal gelesen. */
const sources = sourceFilePaths.map((file) => ({
  name: path.relative(srcRoot, file),
  text: readFileSync(file, 'utf8'),
}));
const parsedSources = sources.map(({ name, text }) => parse(name, text));

const positionOf = (node) => {
  const file = node.getSourceFile();
  const { line } = file.getLineAndCharacterOfPosition(node.getStart());
  return `${file.fileName}:${String(line + 1)}`;
};

const walk = (node, visit) => {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
};

/* 1  Regel A — die Live-Region entsteht nicht mit ihrem Inhalt         */

/**
 * Die Rollen, die eine Live-Region erklären.
 *
 * `marquee` und `timer` stehen mit dabei, obwohl Takt sie nicht benutzt: Der
 * Wächter soll die Klasse messen und nicht den heutigen Bestand. Wer eine von
 * ihnen einführt, bekommt dieselbe Prüfung geschenkt.
 */
const LIVE_ROLES = new Set(['alert', 'status', 'log', 'marquee', 'timer']);

/**
 * HTML-Elemente, die **von sich aus** eine Live-Region sind.
 *
 * `<output>` trägt die Rolle `status` implizit — `ExportDirectoryField` hat
 * genau deshalb eine Gruppe statt eines `output` (T-147). Ohne diese Zeile
 * wäre ein `<output>` für Regel A ein gewöhnliches Element.
 */
const IMPLICIT_LIVE_TAGS = new Set(['output']);

/** Der Name eines JSX-Attributs, oder `null` bei einer Ausbreitung. */
const attributeName = (attribute) =>
  ts.isJsxAttribute(attribute) && attribute.name !== undefined ? attribute.name.getText() : null;

/** Der Zeichenkettenwert eines Attributs, oder `null`. */
const attributeText = (attribute) => {
  const value = attribute.initializer;
  if (value === undefined) return null;
  if (ts.isStringLiteral(value)) return value.text;
  return null;
};

/** Der Tagname eines JSX-Knotens (`div`, `InlineMessage`). */
const tagNameOf = (opening) => opening.tagName.getText();

/** Ist der Tagname ein HTML-Element und kein eigener Baustein? */
const isHtmlTag = (name) => /^[a-z]/.test(name);

/**
 * Trägt dieser JSX-Knoten eine Live-Rolle, die **im Quelltext steht**?
 *
 * Ausdrücklich nur die im Quelltext sichtbare: Ein `role={…}` aus einer
 * Berechnung (`InlineMessage`) zählt hier mit, weil der Knoten dann in
 * **jedem** Zweig eine Rolle trägt; ein `aria-live="off"` zählt nicht, weil es
 * die Region gerade abschaltet.
 */
const declaresLiveRegion = (opening) => {
  if (IMPLICIT_LIVE_TAGS.has(tagNameOf(opening))) return true;
  for (const attribute of opening.attributes.properties) {
    const name = attributeName(attribute);
    if (name === null) continue;
    if (name === 'role') {
      const value = attributeText(attribute);
      if (value !== null && LIVE_ROLES.has(value)) return true;
      // `role={assertive ? "alert" : "status"}` — die Rolle steht in jedem
      // Zweig, der Knoten ist also in jedem Fall eine Region.
      if (value === null && attribute.initializer !== undefined) {
        const written = attribute.initializer.getText();
        if ([...LIVE_ROLES].some((role) => written.includes(`"${role}"`))) return true;
      }
    }
    if (name === 'aria-live') {
      const value = attributeText(attribute);
      if (value === null || value !== 'off') return true;
    }
  }
  return false;
};

/** Der JSX-Knoten zu einem Öffnungselement — das Element selbst oder sein Rumpf. */
const elementOf = (opening) =>
  ts.isJsxSelfClosingElement(opening) ? opening : opening.parent;

const CONDITIONAL_OPERATORS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
]);

/**
 * Entsteht dieser JSX-Knoten aus einem Bedingungsausdruck, **ohne** daß ein
 * umschließendes JSX-Element dazwischenliegt?
 *
 * Das umschließende JSX-Element ist die Abbruchbedingung und nicht eine
 * Bequemlichkeit: Liegt eines dazwischen, tauscht die Bedingung einen ganzen
 * Teilbaum, und die Region darin ist so beständig wie ihr Wirt. Ohne diesen
 * Halt meldete die Regel jeden Zweig „mit Hülle / ohne Hülle" — und ein
 * Wächter, der bei jedem zweiten Zweig anschlägt, wird gelockert.
 *
 * @returns {ts.Node | null} Der Bedingungsausdruck, oder `null`.
 */
const bornInsideCondition = (node) => {
  let current = node.parent;
  while (current !== undefined) {
    if (ts.isJsxElement(current) || ts.isJsxFragment(current)) return null;
    if (ts.isJsxAttribute(current)) return null;
    if (ts.isConditionalExpression(current)) return current;
    if (ts.isBinaryExpression(current) && CONDITIONAL_OPERATORS.has(current.operatorToken.kind)) return current;
    if (ts.isSourceFile(current)) return null;
    if (ts.isFunctionDeclaration(current) || ts.isFunctionExpression(current) || ts.isArrowFunction(current)) {
      return null;
    }
    current = current.parent;
  }
  return null;
};

/** Jeder JSX-Öffnungsknoten einer Quelle, mit seinem Tagnamen. */
const jsxOpenings = (file) => {
  const found = [];
  walk(file, (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) found.push(node);
  });
  return found;
};

/** Regel A über eine geparste Quelle. */
const findLiveRegionsBornWithContent = (file) => {
  const findings = [];
  for (const opening of jsxOpenings(file)) {
    if (!declaresLiveRegion(opening)) continue;
    const condition = bornInsideCondition(elementOf(opening));
    if (condition === null) continue;
    findings.push(
      `${positionOf(opening)} — <${tagNameOf(opening)}> ist eine Live-Region und entsteht im selben ` +
        `Ausdruck wie ihr Inhalt (${condition.getText().replace(/\s+/g, ' ').slice(0, 60)}…)`,
    );
  }
  return findings;
};

/* 2  Regel B — der Fehlertext ohne Ansage                              */

/**
 * Ein Klassenname, der eine Meldung beschriftet: `field__error`,
 * `tfield__error`, `attachment__failure`.
 *
 * Gemessen wird am **Wortende**, nicht am Vorkommen: `field__input--invalid`
 * beschriftet ein Eingabefeld und keine Meldung, und `errorId` ist ohnehin
 * kein Klassenname.
 */
const MESSAGE_CLASS = /(?:^|[_-])(?:error|failure)s?$/i;

/** Zerlegt einen Klassenausdruck in seine Wortteile. */
const klassenWorte = (text) => text.split(/\s+/).filter((part) => part.length > 0);

/**
 * Die Zeichenkettenkonstanten einer Datei, an ihren Namen gebunden.
 *
 * Gebraucht von {@link classTokensOf}: `const ABDUNKLUNG = "scrim"` und danach
 * `className={ABDUNKLUNG}` ist derselbe Klassenname wie das Literal an Ort und
 * Stelle — für den Baum, nicht für einen Lauf, der nur Literale liest (T-347
 * G-2). Zwei Erklärungen desselben Namens werden **beide** genommen; der Lauf
 * rät nicht, welche gemeint ist, und melden ist hier die sichere Richtung.
 *
 * @type {WeakMap<ts.SourceFile, Map<string, string[]>>}
 */
const stringKonstantenCache = new WeakMap();

const stringKonstantenOf = (file) => {
  const gemerkt = stringKonstantenCache.get(file);
  if (gemerkt !== undefined) return gemerkt;
  /** @type {Map<string, string[]>} */
  const gefunden = new Map();
  walk(file, (node) => {
    if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name)) return;
    const wert = node.initializer;
    if (wert === undefined) return;
    if (!ts.isStringLiteral(wert) && !ts.isNoSubstitutionTemplateLiteral(wert)) return;
    const bisher = gefunden.get(node.name.text);
    gefunden.set(node.name.text, bisher === undefined ? [wert.text] : [...bisher, wert.text]);
  });
  stringKonstantenCache.set(file, gefunden);
  return gefunden;
};

/**
 * Die Klassennamen eines Klassenausdrucks, soweit sie im Quelltext dastehen.
 *
 * Gelesen werden vier Bauarten, und die drei letzten sind seit T-346/T-347
 * dazugekommen:
 *
 *  - das Literal: `className="scrim"`, `className={cx("scrim", x)}`
 *  - **die Teile einer Vorlagenzeichenkette**: `` className={`scrim ${x}`} ``.
 *    `TemplateHead`, `TemplateMiddle` und `TemplateTail` sind keine
 *    `StringLiteral` — die Gestalt stand bereits im Baum
 *    (`PoolAdministration.tsx:142`) und war grün (T-346).
 *  - **der Bezeichner einer Zeichenkettenkonstanten** derselben Datei (T-347
 *    G-2).
 *
 * **Die Richtung ist Absicht.** Ein Wortteil, der an eine Einsetzung stößt
 * (`` `scrim${x}` `` ⇒ `scrim`), wird als eigener Name gezählt, obwohl im Baum
 * `scrimmage` landen könnte. Dieser Lauf meldet dann zuviel — dieselbe Wahl,
 * die zwölf Zeilen weiter unten schon für die Zwischenstufe eines Portals
 * getroffen ist. **Was er nicht kann:** einen Klassennamen, der erst zur
 * Laufzeit entsteht (aus einer Eigenschaft, aus einer Abbildung, aus einem
 * Aufruf). Darüber schweigt er, und dieser Satz ist die Grenze seiner Gattung.
 */
const klassenAusAusdruck = (ausdruck) => {
  const tokens = [];
  if (ts.isStringLiteral(ausdruck)) return klassenWorte(ausdruck.text);
  const konstanten = stringKonstantenOf(ausdruck.getSourceFile());
  walk(ausdruck, (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      tokens.push(...klassenWorte(node.text));
      return;
    }
    if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      tokens.push(...klassenWorte(node.text));
      return;
    }
    if (ts.isIdentifier(node)) {
      for (const wert of konstanten.get(node.text) ?? []) tokens.push(...klassenWorte(wert));
    }
  });
  return tokens;
};

/** Die Klassennamen eines JSX-Knotens, soweit sie als Zeichenkette dastehen. */
const classTokensOf = (opening) => {
  const tokens = [];
  for (const attribute of opening.attributes.properties) {
    if (attributeName(attribute) !== 'className') continue;
    const initializer = attribute.initializer;
    if (initializer === undefined) continue;
    tokens.push(...klassenAusAusdruck(initializer));
  }
  return tokens;
};

/** Steht dieser Knoten in einer Live-Region derselben Datei? */
const insideLiveRegion = (node) => {
  let current = node.parent;
  while (current !== undefined) {
    if (ts.isJsxElement(current) && declaresLiveRegion(current.openingElement)) return true;
    current = current.parent;
  }
  return false;
};

/**
 * Regel B über eine geparste Quelle.
 *
 * **Nur HTML-Knoten.** Ein `<InlineMessage className="tags-split__error">`
 * trägt seine Rolle in seiner eigenen Datei; sie hier ein zweites Mal zu
 * verlangen hieße, dieselbe Zusage an zwei Orten zu führen. Bausteine werden
 * dort gemessen, wo sie gebaut werden.
 */
const findMessagesWithoutAnnouncement = (file) => {
  const findings = [];
  for (const opening of jsxOpenings(file)) {
    const tag = tagNameOf(opening);
    if (!isHtmlTag(tag)) continue;
    if (!classTokensOf(opening).some((token) => MESSAGE_CLASS.test(token))) continue;
    if (declaresLiveRegion(opening)) continue;
    if (insideLiveRegion(elementOf(opening))) continue;
    findings.push(
      `${positionOf(opening)} — <${tag}> trägt einen Meldungsklassennamen, aber weder eine ` +
        `Live-Rolle noch eine Live-Region über sich`,
    );
  }
  return findings;
};

/* 3  Regel C — kein `display: none` auf einer leeren Live-Region       */

/** Die Klassennamen, die im Bestand eine Live-Region tragen. */
const liveRegionClasses = () => {
  const tokens = new Set();
  for (const file of parsedSources) {
    for (const opening of jsxOpenings(file)) {
      if (!declaresLiveRegion(opening)) continue;
      for (const token of classTokensOf(opening)) tokens.add(token);
    }
  }
  return tokens;
};

/** Erklärungen, die einen Knoten aus dem Baum der Vorlesehilfe nehmen. */
const HIDING_DECLARATION = /(?:^|[;{\s])(?:display\s*:\s*none|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden)\s*(?:;|$|})/i;

/**
 * Regel C über ein Stilblatt.
 *
 * Zerlegt wird grob und mit Absicht: Jeder Block `Wähler { Erklärungen }` wird
 * einzeln angesehen. Ein Stilblattzerleger wäre hier eine zweite Abhängigkeit
 * für eine Frage, die eine Zeichenkette beantwortet — und die Regel ist im
 * Zweifel **zu streng**, nie zu milde: Sie meldet auch einen Block, der die
 * Klasse nur mitführt.
 *
 * @param {string} name
 * @param {string} text
 * @param {ReadonlySet<string>} classes
 */
const findHiddenLiveRegions = (name, text, classes) => {
  const findings = [];
  const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '));
  const blocks = /([^{}]+)\{([^{}]*)\}/g;
  let match = blocks.exec(withoutComments);
  while (match !== null) {
    const selector = match[1];
    const body = match[2];
    if (HIDING_DECLARATION.test(body)) {
      for (const token of classes) {
        if (!new RegExp(`\\.${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(selector)) continue;
        const line = withoutComments.slice(0, match.index).split('\n').length;
        findings.push(
          `${name}:${String(line)} — \`${selector.trim().replace(/\s+/g, ' ')}\` nimmt die Live-Region ` +
            `\`.${token}\` aus dem Baum der Vorlesehilfe`,
        );
      }
    }
    match = blocks.exec(withoutComments);
  }
  return findings;
};

/* 4  Regel D — Takt siezt, auch hier (E-080, O-GW)                     */

/**
 * **Zeichengleich aus `apps/outlook-addin/scripts/proof-addin.mjs`** (T-190).
 *
 * Dieselbe Zusage darf nicht in zwei Schärfegraden geführt werden — genau das
 * war O-GW. Deshalb steht hier keine eigene, „bessere" Fassung, sondern die
 * vorhandene, Zeichen für Zeichen. Wo `apps/web` einen Fehltreffer erzeugt,
 * den das Add-in nicht kennt, steht er als **Satz** in
 * {@link ANREDE_AUSNAHMEN} und nicht als gelockerter Ausdruck.
 *
 * **Daß beide Ausdrücke an zwei Orten stehen, ist seit T-197 kein offener Rest
 * mehr, sondern eine gemessene Zusage.** Der Orchestrator hat gegen ein
 * gemeinsames Paket entschieden — es kostete eine `package.json`, eine Zeile
 * in der Hoheitstabelle und eine Hoheit, die es heute nicht gibt. Statt dessen
 * gilt E-086: Wo eine Regel an zwei Stellen steht, mißt ein Lauf sie
 * gegeneinander. Das tut **Regel E** in Abschnitt 5.
 *
 * **Die hintere Grenze schließt seit T-197 den Bindestrich ein** (`(?![\wäöüß-])`).
 * Gemessen über beide Bestände: im Add-in kostet es **null** Treffer, in
 * `apps/web` fallen genau zwei, und beide sind Ergänzungsbindestriche und keine
 * Anreden — „Leer-, **Lade-** und Fehlerzustand" (ein Kommentar) und „Im
 * **Prüf-** und Entwicklungsbetrieb ist das gewollt". Der zweite war einer der
 * geduldeten Sätze; sein eigener Ausnahmegrund hat genau dieses `(?!-)`
 * verlangt. Es ist deshalb **keine Lockerung, sondern eine Ausnahme weniger**.
 */
const ANREDE_DU_QUELLE = String.raw`(?<![\wäöüß])(?:du|dir|dich|dein(?:e|em|en|er|es)?)(?![\wäöüß-])`;
const ANREDE_DU = new RegExp(ANREDE_DU_QUELLE, 'i');
const ANREDE_DU_GLOBAL = new RegExp(ANREDE_DU_QUELLE, 'gi');

/** Ebenfalls zeichengleich aus `proof-addin.mjs` (O-GD, T-190). */
const IMPERATIV_STAMM = [
  'Öffn', 'Trag', 'Leg', 'Prüf', 'Wähl', 'Speicher', 'Klick', 'Drück', 'Schließ',
  'Setz', 'Änder', 'Lösch', 'Erstell', 'Wechsl', 'Hinterleg', 'Beacht', 'Kontrollier',
  'Lad', 'Zeig', 'Wiederhol', 'Entfern', 'Kopier', 'Markier', 'Bestätig', 'Aktivier',
  'Deaktivier', 'Ergänz', 'Beend', 'Hol', 'Schreib', 'Mach', 'Zieh', 'Füg', 'Meld',
];

/** Unregelmäßige Formen und die, bei denen nur die lange Fassung eindeutig ist. */
const IMPERATIV_WOERTLICH = [
  'Gib', 'Nimm', 'Übernimm', 'Sieh', 'Lies', 'Geh', 'Tu',
  'Starte', 'Sende', 'Buche', 'Warte', 'Tippe', 'Rufe',
];

const ANREDE_IMPERATIV_QUELLE = String.raw`(?<![\wäöüß])(?:(?:${IMPERATIV_STAMM.join('|')})e?|${IMPERATIV_WOERTLICH.join('|')})(?![\wäöüß-])`;
const ANREDE_IMPERATIV = new RegExp(ANREDE_IMPERATIV_QUELLE, 'i');
const ANREDE_IMPERATIV_GLOBAL = new RegExp(ANREDE_IMPERATIV_QUELLE, 'gi');

/**
 * Die zwei Sätze, die dieser Wächter heute duldet — **als Satz**, nicht als
 * Datei (dieselbe Bauart, die das Add-in bis T-199 unter `IMPERATIV_AUSNAHME`
 * geführt hat; dort ist sie mit dem umgestellten Satz entfallen).
 *
 * Es waren drei. „Im Prüf- und Entwicklungsbetrieb ist das gewollt" ist mit
 * T-197 entfallen, weil die hintere Grenze jetzt den Bindestrich einschließt —
 * die Ausnahme hat sich selbst aufgelöst, genau so, wie der Prüffall unter
 * dieser Liste es vorgesehen hat. Sie wurde **gelöscht und nicht angepaßt**.
 *
 * Eine Dateiausnahme machte jede künftige Anrede in derselben Datei
 * unsichtbar. Jeder dieser Sätze steht mit seinem Grund da, und der Prüffall
 * darunter verlangt, daß es ihn noch gibt: Wird er umgeschrieben, wird die
 * Ausnahme rot und gehört gelöscht, nicht angepaßt.
 */
const ANREDE_AUSNAHMEN = [
  {
    satz: 'Ich habe Outlook zur Hand und trage das neue Token gleich ein.',
    grund:
      '„trage" steht hier in der ersten Person: Der Benutzer bestätigt einen Satz über sich ' +
      'selbst, das Kreuz daneben ist seine Zusage. Es ist keine Aufforderung an ihn.',
  },
  {
    satz: 'Geöffnet wird nur auf Ihren Klick.',
    grund: '„Klick" ist hier ein Hauptwort mit besitzanzeigendem Fürwort davor, kein Imperativ.',
  },
];

/**
 * Was der Benutzer am Ende lesen kann.
 *
 * **Anders gemessen als im Add-in, und das mit Grund.** Dort ist es der
 * Quelltext ohne Kommentare — bei 31 Dateien trägt das. `apps/web` hat 119,
 * und darin heißt eine Bindung `dir` (für „directory") und eine andere `du`
 * wäre denkbar; über den rohen Quelltext gemessen meldete der Wächter
 * Bezeichner statt Sätze und wäre binnen einer Welle gelockert. Gemessen wird
 * deshalb, was der Zerleger als **Text** ausweist: Zeichenketten, Vorlagen und
 * JSX-Text. Das ist schärfer, nicht milder — der Bezeichner `dir` ist kein
 * sichtbarer Text, und die Regel sagt genau das.
 *
 * Ausgenommen sind Modulpfade: `import … from "./dir/x"` steht auf keinem
 * Bildschirm.
 *
 * **Die beiden Einstiegsseiten stehen daneben** — wie das Manifest im Add-in.
 * Ihr `<title>` erscheint in der Fensterleiste, ohne je durch ein Bündel zu
 * laufen. Gemessen wird ihr Text ohne Kommentare, ohne Skript- und Stilblöcke
 * und ohne Marken: Was zwischen den Marken steht, liest der Benutzer.
 */
const HTML_ENTRY_POINTS = readdirSync(appRoot)
  .filter((name) => name.endsWith('.html'))
  .sort();

const htmlText = (raw) =>
  raw
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');

const visibleTexts = () => {
  const entries = [];
  for (const name of HTML_ENTRY_POINTS) {
    entries.push({ datei: name, text: htmlText(readFileSync(path.join(appRoot, name), 'utf8')) });
  }
  for (const file of parsedSources) {
    const parts = [];
    walk(file, (node) => {
      if (ts.isJsxText(node)) {
        parts.push(node.text);
        return;
      }
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const parent = node.parent;
        if (
          parent !== undefined &&
          (ts.isImportDeclaration(parent) ||
            ts.isExportDeclaration(parent) ||
            ts.isImportTypeNode(parent) ||
            ts.isModuleDeclaration(parent))
        ) {
          return;
        }
        parts.push(node.text);
        return;
      }
      if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
        parts.push(node.text);
      }
    });
    entries.push({ datei: file.fileName, text: parts.join('\n') });
  }
  return entries;
};

/** Nimmt die geduldeten Sätze aus einem Text heraus. */
const withoutExceptions = (text) =>
  ANREDE_AUSNAHMEN.reduce((rest, { satz }) => rest.split(satz).join(' '), text);

/* 5  Regel E — dieselbe Regel steht in zwei Laeufen (E-086)            */

/**
 * Der Anredewaechter steht zweimal: hier und in
 * `apps/outlook-addin/scripts/proof-addin.mjs`. Ein gemeinsames Paket haette
 * eine `package.json`, eine Zeile in der Hoheitstabelle und eine Hoheit
 * gebraucht, die es heute nicht gibt; der Orchestrator hat deshalb nach E-086
 * entschieden: **Wo eine Regel an zwei Stellen steht, mißt ein Lauf sie
 * gegeneinander, statt sie zusammenzulegen.**
 *
 * **Die Aussage dieses Laufs ist Gleichheit** (E-086 Punkt 2). Anders als bei
 * den Anhaengen, wo die Huelle strenger sein darf, schadet hier jede Richtung:
 * Ist das Add-in milder, siezt Takt in der einen Haelfte des Erzeugnisses
 * schlechter als in der anderen; ist es strenger, fuehrt dieselbe Zusage zwei
 * Schaerfegrade — und genau das war O-GW.
 *
 * **Gemessen wird beides, die Form und die Wirkung:**
 *
 *  1. Die zwei `String.raw`-Muster **Zeichen fuer Zeichen**. Dort ist jedes
 *     Leerzeichen Teil des Ausdrucks; eine Umformatierung waere eine andere
 *     Regel.
 *  2. Die zwei Wortlisten als **Folge** — Woerter, Reihenfolge und Zahl
 *     (E-086 Punkt 4). Die Formatierung bleibt aussen vor: Ein Zeilenumbruch
 *     innerhalb einer Liste sagt nichts.
 *  3. Eine **Falltafel**, die der Lauf durch **beide** Seiten schickt (E-086
 *     Punkt 1). Sie faengt, was ein Textvergleich nicht faengt: zwei
 *     verschieden geschriebene Ausdruecke, die dasselbe meinen — und zwei
 *     gleich aussehende, die es nicht tun.
 *
 * Die Grenze dazu: Dieser Lauf liest die andere Datei, er schreibt sie nicht.
 * Bewegt sich die andere Haelfte, wird **dieser** Lauf rot und nennt die
 * Stelle; die Berichtigung gehoert dem, dem die Datei gehoert.
 */

/** Die zweite Fassung derselben Regel. Nur gelesen, nie geschrieben. */
const ADDIN_GUARD = path.resolve(appRoot, '..', 'outlook-addin', 'scripts', 'proof-addin.mjs');

/** Diese Datei selbst — gemessen wird der Quelltext, nicht der geladene Wert. */
const OWN_GUARD = fileURLToPath(import.meta.url);

/** Schneidet den Inhalt eines `String.raw`-Musters heraus, Zeichen fuer Zeichen. */
const rawTemplateOf = (source, name, where) => {
  const marker = `const ${name} = String.raw\``;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`${where}: ${name} steht dort nicht als String.raw-Muster`);
  const from = start + marker.length;
  const end = source.indexOf('`;', from);
  if (end === -1) throw new Error(`${where}: das Muster ${name} endet nicht`);
  return source.slice(from, end);
};

/** Liest die Woerter einer Wortliste in ihrer Reihenfolge. */
const wordListOf = (source, name, where) => {
  const marker = `const ${name} = [`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`${where}: die Wortliste ${name} steht dort nicht`);
  const end = source.indexOf('];', start);
  if (end === -1) throw new Error(`${where}: die Wortliste ${name} endet nicht`);
  return [...source.slice(start + marker.length, end).matchAll(/'([^']*)'/g)].map((hit) => hit[1]);
};

/**
 * Die vier Groessen einer Seite, aus ihrem **Quelltext** gelesen — und der
 * Imperativausdruck so zusammengesetzt, wie die Seite ihn wirklich faehrt.
 */
const guardOf = (source, where) => {
  const stamm = wordListOf(source, 'IMPERATIV_STAMM', where);
  const woertlich = wordListOf(source, 'IMPERATIV_WOERTLICH', where);
  const imperativTemplate = rawTemplateOf(source, 'ANREDE_IMPERATIV_QUELLE', where);
  const imperativ = imperativTemplate
    .split("${IMPERATIV_STAMM.join('|')}")
    .join(stamm.join('|'))
    .split("${IMPERATIV_WOERTLICH.join('|')}")
    .join(woertlich.join('|'));
  return {
    where,
    du: rawTemplateOf(source, 'ANREDE_DU_QUELLE', where),
    imperativTemplate,
    stamm,
    woertlich,
    imperativ,
  };
};

/**
 * Die Falltafel. Sie gehoert dem Lauf und nicht einer der beiden Seiten
 * (E-086 Punkt 1). Jede Zeichenkette geht durch **beide** Ausdruecke; die
 * Urteile muessen uebereinstimmen. Welches Urteil richtig ist, sagt diese
 * Tafel absichtlich nicht — das ist Sache von Regel D.
 */
const ANREDE_FALLTAFEL = [
  // Ohne Treffer: die hoefliche Form, das Partizip, das Hauptwort.
  'Öffnen Sie die Datei über die Schaltfläche.',
  'Tragen Sie Ihr Kürzel ein.',
  'Der Prüfbetrieb läuft weiter.',
  'Buchen Sie die Zeit auf den Call.',
  'Die Anwendung meldet den Fehlschlag.',
  // Mit Treffer: Imperativ, Anrede, beides zusammen.
  'Öffne die Datei.',
  'Trag dein Kürzel ein.',
  'Gib die Nummer ein.',
  'Übernimm den Vorschlag.',
  'Buche die Zeit auf den Call.',
  'Geöffnet wird nur auf Ihren Klick.',
  'const dir = readDirectory();',
  // Die zwei Faelle, an denen sich die hintere Grenze entscheidet. Sie
  // stehen hier, weil genau sie die zwei Seiten auseinandertreten lassen,
  // wenn eine von beiden `(?!-)` bekommt und die andere nicht.
  'Im Prüf- und Entwicklungsbetrieb ist das gewollt.',
  'Leer-, Lade- und Fehlerzustand.',
];

/** Faellt das Urteil beider Ausdruecke einer Seite ueber einen Satz. */
const verdictOf = (guard, satz) => ({
  du: new RegExp(guard.du, 'i').test(satz),
  imperativ: new RegExp(guard.imperativ, 'i').test(satz),
});

/**
 * Vergleicht zwei Seiten und liefert die Befunde als Saetze. Leer heisst
 * gleich — in der Form **und** in der Wirkung.
 */
const compareGuards = (links, rechts) => {
  const findings = [];
  const nennen = (was, a, b) =>
    `${was}: ${links.where} hat „${a}“, ${rechts.where} hat „${b}“`;

  if (links.du !== rechts.du) findings.push(nennen('ANREDE_DU_QUELLE', links.du, rechts.du));
  if (links.imperativTemplate !== rechts.imperativTemplate) {
    findings.push(nennen('ANREDE_IMPERATIV_QUELLE', links.imperativTemplate, rechts.imperativTemplate));
  }
  for (const name of ['stamm', 'woertlich']) {
    const a = links[name];
    const b = rechts[name];
    if (a.length !== b.length) {
      findings.push(
        `${name === 'stamm' ? 'IMPERATIV_STAMM' : 'IMPERATIV_WOERTLICH'}: ` +
          `${links.where} fuehrt ${String(a.length)} Woerter, ${rechts.where} ${String(b.length)}`,
      );
      continue;
    }
    const abweichung = a.findIndex((wort, i) => wort !== b[i]);
    if (abweichung !== -1) {
      findings.push(
        nennen(
          `${name === 'stamm' ? 'IMPERATIV_STAMM' : 'IMPERATIV_WOERTLICH'} an Stelle ${String(abweichung + 1)}`,
          a[abweichung],
          b[abweichung],
        ),
      );
    }
  }
  for (const satz of ANREDE_FALLTAFEL) {
    const a = verdictOf(links, satz);
    const b = verdictOf(rechts, satz);
    for (const teil of ['du', 'imperativ']) {
      if (a[teil] !== b[teil]) {
        findings.push(
          `Falltafel (${teil}) „${satz}“: ${links.where} sagt ${a[teil] ? 'Treffer' : 'kein Treffer'}, ` +
            `${rechts.where} sagt ${b[teil] ? 'Treffer' : 'kein Treffer'}`,
        );
      }
    }
  }
  return findings;
};

/**
 * Eine erfundene Seite fuer die Gegenproben. Sie traegt dieselbe Bauart wie
 * die zwei echten Dateien und kommt ohne sie aus — sonst maesse die
 * Gegenprobe den Zustand des Baumes und nicht die Regel.
 */
const kunstWaechter = ({
  grenze = String.raw`(?![\wäöüß-])`,
  stamm = "'Trag', 'Prüf'",
  woertlich = "'Gib'",
} = {}) =>
  [
    'const IMPERATIV_STAMM = [',
    `  ${stamm},`,
    '];',
    'const IMPERATIV_WOERTLICH = [',
    `  ${woertlich},`,
    '];',
    'const ANREDE_DU_QUELLE = String.raw`(?<![\\wäöüß])(?:du|dir)' + grenze + '`;',
    'const ANREDE_IMPERATIV_QUELLE = String.raw`(?<![\\wäöüß])' +
      "(?:(?:${IMPERATIV_STAMM.join('|')})e?|${IMPERATIV_WOERTLICH.join('|')})" +
      grenze +
      '`;',
  ].join('\n');

/* 6  Regel F — jedes direkte Kind von `.app` trägt eine Rasterzuordnung */

/**
 * ## Warum diese Regel und nicht nur die Berichtigung von T-214 (O-JH)
 *
 * `.app` ist ein Raster mit **benannten** Flächen. Ein Kind, das keine
 * Zuordnung trägt, verschwindet nicht — es wird **selbst platziert**, und zwar
 * lautlos: CSS Grid setzt es in die nächste freie Zelle. Genau das ist T-214
 * passiert. Die Sitzungsleiste war das einzige selbstplatzierte Kind, landete
 * ohne Hüllenmeldung in Zeile 1 / Spalte 1 — der Spur der Seitenleiste, **240
 * px breit** — und verkleinerte den Inhaltsbereich um ihre eigene Höhe, **ohne
 * die Fläche zu nutzen**: 240 × 153,5 px auf einem Fenster von 1280 px, und
 * 111 px, die nach der Berichtigung zurückkamen.
 *
 * Behoben war danach der **Fehler**, nicht die **Fehlerklasse**. Und die Klasse
 * hat zwei Wellen lang niemand gesehen, **weil die Fläche auf der Musterseite
 * fehlt**: `designsystem.html` zeigt Bausteine, nie die Hülle. Ein Blick fängt
 * das also nicht — nur ein Lauf.
 *
 * ## Was die Regel verlangt
 *
 * Jedes direkte Kind von `.app` muß **eine** dieser zwei Zusagen tragen:
 *
 *  1. eine **Rasterzuordnung** (`grid-area`, `grid-row`, `grid-column`, oder
 *     eine der `-start`-Formen) in einer Regel, die entweder bloß auf seiner
 *     Klasse steht (`.app__sidebar`) oder unter `.app` verankert ist
 *     (`.app > .updatebar`); oder
 *  2. eine Herausnahme **aus dem Fluß** (`position: fixed` oder `absolute`) —
 *     dann ist der Knoten kein Rasterelement, und die Frage stellt sich nicht.
 *     Das ist der Weg von `.skip-link`.
 *
 * Und einen dritten Ausgang gibt es seit T-334, der **keine** Zusage ist,
 * sondern eine Abwesenheit: Was durch `createPortal(…, document.body)` geht,
 * ist gar kein Kind von `.app` — die Frage nach der Rasterfläche stellt sich
 * dann nicht mehr, weil es das Raster verlassen hat. So hängt seitdem jede
 * Abdunklung (`.scrim`, A-A-108): Sie ist `position: fixed`, aber „fest" heißt
 * „am umschließenden Block", und in den Gestaltungen `glass` und
 * `liquid-glass` wird jede `.card` durch `backdrop-filter` zu einem solchen.
 * Das Portal ist die einzige Bauart, die das strukturell ausschließt.
 *
 * **Nur `document.body`.** Ein Portal an ein anderes Ziel ist ein Befund und
 * kein Freibrief: Dort könnte wieder ein Vorfahr mit `transform` oder
 * `backdrop-filter` stehen, und der Lauf soll nicht raten.
 *
 * Eine Regel wie `.irgendwas .updatebar { grid-area: … }` zählt **nicht**: Sie
 * greift unter `.app` nicht, und ein Wächter, der sie zählte, wäre grün an
 * einer Stelle, an der der Browser selbst platziert.
 *
 * ## Wie der Sammler zum Kind kommt
 *
 * Nicht jedes Kind ist ein HTML-Knoten. `{shell === null ? null :
 * <ShellStatus …/>}` ist ein Baustein, und **genau darin lag T-214** — die
 * Leiste stand hinter zwei Bausteinen. Der Sammler löst deshalb auf: Bedingung
 * in ihre Zweige, Bruchstück in seine Kinder, Baustein in die Wurzeln seiner
 * `return`-Ausdrücke, und das über beliebig viele Ebenen. Am Ende steht eine
 * Liste **konkreter** HTML-Knoten mit ihren Klassen.
 *
 * ## Was der Sammler ausdrücklich nicht darf: schweigen
 *
 * Trifft er auf etwas, das er nicht lesen kann — einen Baustein, den er in
 * `apps/web/src` nicht findet; einen Ausdruck, dessen Bauart er nicht kennt;
 * einen Kreis —, dann ist das ein **Befund** und kein stilles Weiter. Ein
 * Wächter, der über einen Wirt urteilt, den er nicht gelesen hat, urteilt über
 * nichts (E-094 Punkt 3). Dasselbe gilt für die Ernte: **null** Wirte, **null**
 * Kinder oder **null** aufgelöste Knoten sind rot, nie `ok`.
 *
 * ## Welchen Weg diese Regel ausläßt — und wer ihn geht (E-094 Punkt 2)
 *
 * Drei Wege, alle drei benannt:
 *
 *  1. **Den gerenderten.** Dieser Lauf liest Quelltext. Ob der Browser den
 *     Knoten wirklich in die genannte Fläche setzt, mißt er nicht. Diesen Weg
 *     geht `visual-qa` am laufenden Fenster — und genau der hat T-214 gefunden,
 *     nachdem zwei Wellen lang niemand hinsah. Der Lauf ersetzt ihn nicht, er
 *     macht ihn entbehrlich für die **Klasse**.
 *  2. **Den zur Laufzeit gebauten Klassennamen.** `cx("shellnotes", className)`
 *     wird mit den Zeichenketten gelesen, die dastehen; ein Name, der erst aus
 *     einer Bindung entsteht, bleibt ungelesen. Er wäre allerdings auch für
 *     jeden Leser unsichtbar — dieselbe Grenze, dieselbe Person.
 *  3. **Die Kaskade.** Der Lauf fragt, ob **irgendeine** greifende Regel eine
 *     Zuordnung erklärt; er rechnet keine Spezifität aus und sieht nicht, ob
 *     eine spätere Regel sie mit `grid-area: auto` zurücknimmt. Das ist eine
 *     bewußte Untergrenze: Wer die Kaskade nachbaut, baut einen zweiten
 *     Browser.
 */

/** Die Klasse, die die Hülle trägt. Alles Weitere hängt an ihr. */
const SHELL_CLASS = 'app';

/**
 * Fremde Bausteine, die **kein eigenes DOM-Element** zeichnen und ihre Kinder
 * durchreichen. Jeder Eintrag mit seinem Grund — und keiner darf ungenutzt
 * herumstehen: Der Prüffall unter dieser Tafel verlangt, daß der Sammler jeden
 * von ihnen wirklich passiert. Wird einer überflüssig, wird der Lauf rot und
 * der Eintrag gehört gelöscht, nicht behalten.
 *
 * Ohne diese Tafel bliebe der Sammler bei `Dialog.Root` stehen und meldete
 * einen unlesbaren Wirt — richtig, aber unbrauchbar: Der Dialog **ist** ein
 * direktes Kind von `.app`, und seine Abdunklung liegt fest im Fenster.
 */
const DURCHREICHER = Object.freeze([
  {
    name: 'Dialog.Root',
    grund:
      'Die Wurzel von `@ark-ui/react`s Dialog ist ein Zusammenhang, kein Element. Was im ' +
      'Baum landet, ist das erste eigene Kind darin — bei `DialogSurface` die Abdunklung.',
  },
]);

/**
 * Die geschweifte Klammer in JSX — `{fehler ? … : null}`.
 *
 * Von Hand und nicht ueber `ts.isJsxExpressionContainer`: Die Kurzform steht in
 * dieser TypeScript-Fassung nicht in der oeffentlichen Schnittstelle, und der
 * Knoten heisst dort `JsxExpression`. Ein `ts.isJsx…`, das es nicht gibt, ist
 * `undefined` — der Aufruf wuerde werfen statt still zu schweigen, aber
 * verlassen kann man sich darauf nicht.
 */
const istJsxKlammer = (node) => node.kind === ts.SyntaxKind.JsxExpression;

/** Ist dieser Ausdruck ein Nichts, das nichts in den Baum legt? */
const rendersNothing = (node) =>
  node.kind === ts.SyntaxKind.NullKeyword ||
  node.kind === ts.SyntaxKind.FalseKeyword ||
  node.kind === ts.SyntaxKind.TrueKeyword ||
  (ts.isIdentifier(node) && node.text === 'undefined');

/** Steckt in diesem Teilbaum irgendwo JSX? */
const containsJsx = (node) => {
  let found = false;
  walk(node, (child) => {
    if (
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child) ||
      ts.isJsxFragment(child)
    ) {
      found = true;
    }
  });
  return found;
};

/**
 * Die Rückgabeausdrücke einer Bausteinfunktion — **ihre eigenen**, nicht die
 * ihrer verschachtelten Funktionen. Ein `return` innerhalb einer Rückrufliste
 * (`items.map(() => <li/>)`) gehört nicht zur Wurzel dieses Bausteins.
 */
const returnedExpressions = (fn) => {
  const body = fn.body;
  if (body === undefined) return [];
  if (!ts.isBlock(body)) return [body];
  const found = [];
  const descend = (node) => {
    ts.forEachChild(node, (child) => {
      if (
        ts.isFunctionDeclaration(child) ||
        ts.isFunctionExpression(child) ||
        ts.isArrowFunction(child) ||
        ts.isClassDeclaration(child)
      ) {
        return;
      }
      if (ts.isReturnStatement(child)) {
        if (child.expression !== undefined) found.push(child.expression);
        return;
      }
      descend(child);
    });
  };
  descend(body);
  return found;
};

/**
 * Sucht die Erklärung eines Bausteins in den übergebenen Quellen.
 *
 * Zwei Erklärungen desselben Namens sind ein Befund und keine Auswahl: Der
 * Lauf soll nicht raten, welche von beiden an dieser Stelle steht.
 *
 * @returns {{ fn: ts.Node } | { fehler: string }}
 */
const componentDeclaration = (name, quellen) => {
  const treffer = [];
  for (const file of quellen) {
    walk(file, (node) => {
      if (ts.isFunctionDeclaration(node) && node.name !== undefined && node.name.text === name) {
        treffer.push({ fn: node, datei: file.fileName });
        return;
      }
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === name &&
        node.initializer !== undefined &&
        (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
      ) {
        treffer.push({ fn: node.initializer, datei: file.fileName });
      }
    });
  }
  if (treffer.length === 0) {
    return {
      fehler:
        `der Baustein <${name}> ist unter apps/web/src nicht zu finden — dieser Lauf urteilt ` +
        'nicht über einen Wirt, den er nicht gelesen hat',
    };
  }
  if (treffer.length > 1) {
    return {
      fehler:
        `der Baustein <${name}> ist ${String(treffer.length)}-mal erklärt ` +
        `(${treffer.map((t) => t.datei).join(', ')}) — der Lauf soll nicht raten, welcher gemeint ist`,
    };
  }
  return { fn: treffer[0].fn };
};

/**
 * Der Name der aufgerufenen Funktion — `createElement(…)` und
 * `React.createElement(…)` heißen beide `createElement`.
 *
 * **Für `createPortal` ist dieser Vergleich seit T-348 nicht mehr genug**;
 * dort steht {@link portalRufOf}, das den Namen gegen seine Einfuhr auflöst
 * (A-A-112). Der Name allein trägt nur noch, wo ein zu **weites** Urteil die
 * sichere Richtung ist — bei der Ernte der Abdunklungen.
 */
const callee = (node) => {
  const ausdruck = node.expression;
  if (ts.isIdentifier(ausdruck)) return ausdruck.text;
  if (ts.isPropertyAccessExpression(ausdruck)) return ausdruck.name.text;
  return null;
};

/** Ist dieser Ausdruck wörtlich `document.body`? */
const zielIstDokumentkoerper = (node) =>
  ts.isPropertyAccessExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === 'document' &&
  node.name.text === 'body';

/* 5a  Der Name `createPortal` — gegen seine Einfuhr aufgelöst (A-A-112) */

/**
 * ## Warum hier eine Einfuhr gelesen wird und nicht ein Name verglichen
 *
 * Regel F und Regel G entschieden bis T-348 über `callee(node) ===
 * 'createPortal'` und nie darüber, **woher** dieser Name kommt. Vier Zeilen
 * genügten (T-347 G-4/G-7):
 *
 * ```
 * const createPortal = (knoten, _ziel) => knoten;
 * ```
 *
 * Danach hängt eine Abdunklung wieder an ihrer Karte — und die Schlußzeile des
 * Laufs meldete `Flächen mit der Klasse scrim: 2, davon 2 in einem
 * createPortal(…, document.body)`, mit Datei und Zeile. Dieselben vier Zeilen
 * nahmen ein beliebiges direktes Kind von `.app` aus Regel F heraus.
 *
 * **Das ist keine fehlende Zusage, sondern eine falsche** — und eine falsche
 * wird zitiert. Deshalb steht sie als **A-A-112** vor allen anderen Auflagen
 * des Abschnitts 44 im Bedrohungsmodell.
 *
 * ## Was aufgelöst wird
 *
 *  - `createPortal(…)` gilt, wenn der Name in derselben Datei als **benannte
 *    Einfuhr** `createPortal` aus `react-dom` gebunden ist.
 *  - `ReactDOM.createPortal(…)` gilt, wenn `ReactDOM` in derselben Datei eine
 *    **Vorgabe-** oder **Namensraumeinfuhr** aus `react-dom` ist.
 *
 * ## Was ausdrücklich nicht gilt, und warum das die sichere Richtung ist
 *
 * `import { createPortal as portal } from 'react-dom'` und danach `portal(…)`
 * wird **nicht** als Portal gelesen: Der Name am Aufruf ist dann `portal`, und
 * beide Regeln melden die Stelle als eine, die dieser Lauf nicht lesen kann.
 * Das ist eine Falschmeldung in der teuren Richtung — sie kostet einen roten
 * Lauf und eine Zeile hier, während die Gegenrichtung eine Zusage kostet.
 */
const PORTAL_MODUL = 'react-dom';
const PORTAL_NAME = 'createPortal';

/**
 * Die Einfuhren einer Datei, an ihre **örtlichen** Namen gebunden.
 *
 * @type {WeakMap<ts.SourceFile, Map<string, { modul: string; art: 'benannt' | 'vorgabe' | 'namensraum'; importiert: string }>>}
 */
const einfuhrenCache = new WeakMap();

const einfuhrenOf = (file) => {
  const gemerkt = einfuhrenCache.get(file);
  if (gemerkt !== undefined) return gemerkt;
  const gefunden = new Map();
  walk(file, (node) => {
    if (!ts.isImportDeclaration(node)) return;
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;
    const modul = node.moduleSpecifier.text;
    const klausel = node.importClause;
    if (klausel === undefined) return;
    if (klausel.name !== undefined) {
      gefunden.set(klausel.name.text, { modul, art: 'vorgabe', importiert: 'default' });
    }
    const bindungen = klausel.namedBindings;
    if (bindungen === undefined) return;
    if (ts.isNamespaceImport(bindungen)) {
      gefunden.set(bindungen.name.text, { modul, art: 'namensraum', importiert: '*' });
      return;
    }
    for (const element of bindungen.elements) {
      gefunden.set(element.name.text, {
        modul,
        art: 'benannt',
        importiert: (element.propertyName ?? element.name).text,
      });
    }
  });
  einfuhrenCache.set(file, gefunden);
  return gefunden;
};

/**
 * Die Namen, die eine Datei **selbst** erklärt — Veränderliche, Funktionen,
 * Klassen, Übergaben.
 *
 * Sie stehen vor jeder Einfuhr: Wer `const createPortal = …` schreibt, meint
 * seinen eigenen Namen, und im Bestand wäre beides nebeneinander ohnehin ein
 * Übersetzungsfehler. Für die Gegenproben ist dieser Vorrang der Unterschied
 * zwischen einer gemessenen und einer behaupteten Regel.
 *
 * @type {WeakMap<ts.SourceFile, Set<string>>}
 */
const oertlicheNamenCache = new WeakMap();

const oertlicheNamenOf = (file) => {
  const gemerkt = oertlicheNamenCache.get(file);
  if (gemerkt !== undefined) return gemerkt;
  const gefunden = new Set();
  walk(file, (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) gefunden.add(node.name.text);
    if (ts.isFunctionDeclaration(node) && node.name !== undefined) gefunden.add(node.name.text);
    if (ts.isClassDeclaration(node) && node.name !== undefined) gefunden.add(node.name.text);
    if (ts.isParameter(node) && ts.isIdentifier(node.name)) gefunden.add(node.name.text);
  });
  oertlicheNamenCache.set(file, gefunden);
  return gefunden;
};

/**
 * Ruft dieser Ausdruck `createPortal` auf — und ist es **das aus `react-dom`**?
 *
 * @returns {{ ruf: false } | { ruf: true; echt: true } | { ruf: true; echt: false; grund: string }}
 */
const portalRufOf = (node) => {
  if (!ts.isCallExpression(node)) return { ruf: false };
  const ausdruck = node.expression;
  const datei = node.getSourceFile();
  const einfuhren = einfuhrenOf(datei);
  const oertlich = oertlicheNamenOf(datei);
  if (ts.isIdentifier(ausdruck) && ausdruck.text === PORTAL_NAME) {
    const einfuhr = einfuhren.get(PORTAL_NAME);
    if (
      !oertlich.has(PORTAL_NAME) &&
      einfuhr !== undefined &&
      einfuhr.modul === PORTAL_MODUL &&
      einfuhr.art === 'benannt' &&
      einfuhr.importiert === PORTAL_NAME
    ) {
      return { ruf: true, echt: true };
    }
    return {
      ruf: true,
      echt: false,
      grund: oertlich.has(PORTAL_NAME)
        ? `der Name \`${PORTAL_NAME}\` ist in dieser Datei selbst erklärt — ein eigener Name, der ` +
          'nichts portaliert, hängt die Fläche wieder an ihre Karte (A-A-112)'
        : `der Name \`${PORTAL_NAME}\` ist in dieser Datei nicht als \`import { ${PORTAL_NAME} } from ` +
          `'${PORTAL_MODUL}'\` gebunden${einfuhr === undefined ? ' (gar keine Einfuhr dieses Namens)' : ` (er kommt aus '${einfuhr.modul}')`} — ` +
          'dieser Lauf urteilt nicht über ein Portal, das er nicht gelesen hat (A-A-112)',
    };
  }
  if (ts.isPropertyAccessExpression(ausdruck) && ausdruck.name.text === PORTAL_NAME) {
    if (!ts.isIdentifier(ausdruck.expression)) {
      return {
        ruf: true,
        echt: false,
        grund:
          `\`${ausdruck.getText().replace(/\s+/g, ' ').slice(0, 40)}\` — dieser Lauf löst den Träger ` +
          `von \`${PORTAL_NAME}\` nicht auf und behauptet deshalb nichts über ihn (A-A-112)`,
      };
    }
    const einfuhr = einfuhren.get(ausdruck.expression.text);
    if (
      !oertlich.has(ausdruck.expression.text) &&
      einfuhr !== undefined &&
      einfuhr.modul === PORTAL_MODUL &&
      (einfuhr.art === 'vorgabe' || einfuhr.art === 'namensraum')
    ) {
      return { ruf: true, echt: true };
    }
    return {
      ruf: true,
      echt: false,
      grund:
        `\`${ausdruck.expression.text}\` ist in dieser Datei keine Einfuhr aus '${PORTAL_MODUL}'` +
        `${einfuhr === undefined ? '' : ` (er kommt aus '${einfuhr.modul}')`} — ` +
        `\`${ausdruck.expression.text}.${PORTAL_NAME}\` ist damit nicht das Portal von React (A-A-112)`,
    };
  }
  return { ruf: false };
};

/**
 * Löst einen JSX-Ausdruck in die **konkreten HTML-Knoten** auf, die daraus im
 * Baum landen können.
 *
 * @param {ts.Node} node
 * @param {ReadonlyArray<ts.SourceFile>} quellen
 * @param {{ traeger: Array<{ tag: string; klassen: string[]; weg: string }>; befunde: string[]; durchgereicht: Set<string>; pfad: string[]; portale: number }} ernte
 * @param {string} weg Wie der Sammler hierher kam — steht im Befund.
 */
const resolveIntoElements = (node, quellen, ernte, weg) => {
  if (ts.isParenthesizedExpression(node)) {
    resolveIntoElements(node.expression, quellen, ernte, weg);
    return;
  }
  if (istJsxKlammer(node)) {
    // `{/* nur ein Kommentar */}` hat keinen Ausdruck.
    if (node.expression === undefined) return;
    resolveIntoElements(node.expression, quellen, ernte, weg);
    return;
  }
  if (ts.isJsxText(node)) {
    if (node.text.trim().length === 0) return;
    ernte.befunde.push(
      `${weg}: roher Text als Kind von .${SHELL_CLASS} — ein anonymes Rasterelement, das keine ` +
        'Zuordnung tragen kann',
    );
    return;
  }
  if (rendersNothing(node)) return;
  if (ts.isJsxFragment(node)) {
    for (const child of node.children) resolveIntoElements(child, quellen, ernte, weg);
    return;
  }
  if (ts.isConditionalExpression(node)) {
    resolveIntoElements(node.whenTrue, quellen, ernte, weg);
    resolveIntoElements(node.whenFalse, quellen, ernte, weg);
    return;
  }
  if (ts.isBinaryExpression(node) && CONDITIONAL_OPERATORS.has(node.operatorToken.kind)) {
    /*
     * Nur die rechte Seite wird gezeichnet — bei `&&` immer, bei `||` und `??`
     * jedenfalls dann, wenn links kein JSX steht. Steht dort welches, sagt der
     * Lauf es, statt die Hälfte stillschweigend zu überspringen.
     */
    if (containsJsx(node.left)) {
      ernte.befunde.push(
        `${weg}: links von \`${node.operatorToken.getText()}\` steht JSX — diesen Zweig liest der ` +
          'Sammler nicht, und er tut nicht so, als hätte er es',
      );
    }
    resolveIntoElements(node.right, quellen, ernte, weg);
    return;
  }
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const tag = tagNameOf(opening);
    if (isHtmlTag(tag)) {
      ernte.traeger.push({ tag, klassen: classTokensOf(opening), weg: `${weg} → <${tag}>` });
      return;
    }
    const durchreicher = DURCHREICHER.find((eintrag) => eintrag.name === tag);
    if (durchreicher !== undefined) {
      ernte.durchgereicht.add(tag);
      if (!ts.isJsxElement(node)) {
        ernte.befunde.push(`${weg}: <${tag}> reicht durch, hat hier aber keine Kinder`);
        return;
      }
      for (const child of node.children) {
        resolveIntoElements(child, quellen, ernte, `${weg} → <${tag}>`);
      }
      return;
    }
    if (ernte.pfad.includes(tag)) {
      ernte.befunde.push(`${weg}: <${tag}> zeichnet sich selbst als Wurzel — der Sammler dreht im Kreis`);
      return;
    }
    const erklaerung = componentDeclaration(tag, quellen);
    if ('fehler' in erklaerung) {
      ernte.befunde.push(`${weg}: ${erklaerung.fehler}`);
      return;
    }
    ernte.pfad.push(tag);
    for (const rueckgabe of returnedExpressions(erklaerung.fn)) {
      resolveIntoElements(rueckgabe, quellen, ernte, `${weg} → <${tag}>`);
    }
    ernte.pfad.pop();
    return;
  }
  const portalRuf = portalRufOf(node);
  if (portalRuf.ruf) {
    /*
     * Ein Portal verläßt die Hülle. Gelesen wird **das Ziel** und nicht der
     * Inhalt: Geht er an den Dokumentkörper, ist er kein Rasterelement von
     * `.app` mehr und diese Regel hat über ihn nichts zu sagen. Jedes andere
     * Ziel — und jede andere Zahl von Argumenten — ist ein Befund, denn dort
     * kann wieder ein umschließender Block stehen (A-A-108).
     *
     * **Zuerst aber der Name selbst** (A-A-112): Ein eigener `createPortal`
     * nähme sonst ein beliebiges Kind aus dieser Regel heraus, und der Lauf
     * zählte es als „durch ein Portal am Dokumentkörper" (T-347 G-7).
     */
    if (!portalRuf.echt) {
      ernte.befunde.push(`${weg}: ${portalRuf.grund}`);
      return;
    }
    const ziel = node.arguments[1];
    if (node.arguments.length === 2 && ziel !== undefined && zielIstDokumentkoerper(ziel)) {
      ernte.portale += 1;
      return;
    }
    ernte.befunde.push(
      `${weg}: \`createPortal\` mit einem Ziel, das dieser Lauf nicht als den Dokumentkörper ` +
        `liest — \`${node.getText().replace(/\s+/g, ' ').slice(0, 60)}\``,
    );
    return;
  }
  ernte.befunde.push(
    `${weg}: einen Ausdruck dieser Bauart (${ts.SyntaxKind[node.kind]}) liest der Sammler nicht — ` +
      `\`${node.getText().replace(/\s+/g, ' ').slice(0, 60)}\``,
  );
};

/**
 * Die Rasterzusagen der Stilblätter.
 *
 * Gezählt wird nur, was **unter `.app`** greift: eine bloße Klassenregel
 * (`.app__sidebar { … }`) oder eine unter `.app` verankerte
 * (`.app > .updatebar { … }`). `.woanders .updatebar` zählt nicht.
 *
 * @param {ReadonlyArray<{ name: string; text: string }>} blaetter
 */
const gridAssignments = (blaetter) => {
  const platziert = new Set();
  const ausserhalb = new Set();
  const PLACEMENT = /(?:^|[;{\s])grid-(?:area|row|column|row-start|column-start|row-end|column-end)\s*:/i;
  const OUT_OF_FLOW = /(?:^|[;{\s])position\s*:\s*(?:fixed|absolute)\s*(?:;|$|})/i;
  for (const { text } of blaetter) {
    const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '));
    const blocks = /([^{}]+)\{([^{}]*)\}/g;
    let match = blocks.exec(withoutComments);
    while (match !== null) {
      const body = match[2];
      const setzt = PLACEMENT.test(body);
      const fliegt = OUT_OF_FLOW.test(body);
      if (setzt || fliegt) {
        for (const einzeln of match[1].split(',')) {
          const teile = einzeln.trim().split(/\s*[>+~]\s*|\s+/).filter((teil) => teil.length > 0);
          if (teile.length === 0) continue;
          const verankert =
            teile.length === 1 || /\.app(?![\w-])/.test(teile[0]) || teile[0] === `.${SHELL_CLASS}`;
          if (!verankert) continue;
          for (const treffer of teile[teile.length - 1].matchAll(/\.([\w-]+)/g)) {
            if (setzt) platziert.add(treffer[1]);
            if (fliegt) ausserhalb.add(treffer[1]);
          }
        }
      }
      match = blocks.exec(withoutComments);
    }
  }
  return { platziert, ausserhalb };
};

/**
 * Regel F über einen Bestand — den echten oder einen erfundenen.
 *
 * **Beides geht durch dieselbe Funktion.** Die Gegenproben in Abschnitt 8
 * reichen eine Kunstquelle **statt** des Bestandes hinein und nicht **neben**
 * ihn: Sonst prüften sie das Sieb und nie die Ernte (E-094 Punkt 1).
 *
 * @param {{ quellen: ReadonlyArray<ts.SourceFile>; blaetter: ReadonlyArray<{ name: string; text: string }> }} bestand
 */
const findChildrenWithoutGridArea = ({ quellen, blaetter }) => {
  /** @type {{ traeger: Array<{ tag: string; klassen: string[]; weg: string }>; befunde: string[]; durchgereicht: Set<string>; pfad: string[]; portale: number }} */
  const ernte = { traeger: [], befunde: [], durchgereicht: new Set(), pfad: [], portale: 0 };
  let wirte = 0;
  let kinder = 0;

  for (const file of quellen) {
    for (const opening of jsxOpenings(file)) {
      if (!classTokensOf(opening).includes(SHELL_CLASS)) continue;
      wirte += 1;
      const element = elementOf(opening);
      if (!ts.isJsxElement(element)) {
        ernte.befunde.push(`${positionOf(opening)} — .${SHELL_CLASS} hat keine Kinder`);
        continue;
      }
      for (const child of element.children) {
        if (ts.isJsxText(child) && child.text.trim().length === 0) continue;
        if (istJsxKlammer(child) && child.expression === undefined) continue;
        kinder += 1;
        resolveIntoElements(child, quellen, ernte, `${positionOf(opening)} Kind ${String(kinder)}`);
      }
    }
  }

  const { platziert, ausserhalb } = gridAssignments(blaetter);
  for (const traeger of ernte.traeger) {
    if (traeger.klassen.some((klasse) => platziert.has(klasse))) continue;
    if (traeger.klassen.some((klasse) => ausserhalb.has(klasse))) continue;
    ernte.befunde.push(
      `${traeger.weg} — trägt weder eine Rasterzuordnung noch eine Herausnahme aus dem Fluß ` +
        `(Klassen: ${traeger.klassen.length === 0 ? 'keine' : traeger.klassen.join(', ')}). ` +
        'CSS Grid setzt diesen Knoten selbst — lautlos und in die falsche Zelle (T-214)',
    );
  }

  return {
    befunde: ernte.befunde,
    traeger: ernte.traeger,
    wirte,
    kinder,
    durchgereicht: ernte.durchgereicht,
    portale: ernte.portale,
    platziert,
    ausserhalb,
  };
};

/**
 * Die Einfuhr, die jede Kunstquelle trägt.
 *
 * Seit A-A-112 ist ein `createPortal` ohne diese Zeile **kein** Portal, und
 * eine Gegenprobe ohne sie mäße die falsche Hälfte: Sie wäre grün, weil der
 * Name nicht aufgelöst wird, und nicht, weil die Regel greift.
 */
const KUNST_EINFUHR = `import { ${PORTAL_NAME} } from "${PORTAL_MODUL}";\n`;

/**
 * Ein erfundener Bestand für die Gegenproben: eine Hülle, ein Stilblatt.
 * Er kommt ohne den echten Baum aus — sonst mäße die Gegenprobe den Zustand
 * des Bestandes und nicht die Regel.
 */
const kunstHuelle = (kinder, css) => ({
  quellen: [
    parse(
      'kunst.tsx',
      `${KUNST_EINFUHR}const App = () => (\n  <div className="app">\n${kinder}\n  </div>\n);\n`,
    ),
  ],
  blaetter: [{ name: 'kunst.css', text: css }],
});

/** Das Stilblatt, das jede richtige Bauart der Gegenproben trägt. */
const KUNST_CSS = [
  '.app { display: grid; }',
  '.app__side { grid-area: side; }',
  '.app > .leiste { grid-area: leiste; }',
  '.abdunklung { position: fixed; inset: 0; }',
  '.woanders .fremd { grid-area: fremd; }',
].join('\n');

/* 7  Regel G — jede gezeichnete Abdunklung hängt am Dokumentkörper     */

/**
 * ## Warum diese Regel neben Regel F steht und nicht in ihr
 *
 * Regel F beantwortet die Frage „**jedes Kind von `.app`** trägt eine Fläche".
 * Der Portalzweig darin ist ein **Ausgang** aus dieser Frage: Was das Raster
 * verläßt, muß keine Rasterfläche tragen. Das ist richtig und bleibt.
 *
 * **Was es nicht ist: eine Zusage über die Abdunklungen.** A-A-108 schreibt sein
 * Kriterium an der **Anforderung** auf — *jede Bestätigungsfläche hängt am
 * Fenster*. Gebaut war in T-334 eine Zusage über **Portale**: Regel F läuft nur
 * die direkten Kinder von `.app` ab, hält am ersten HTML-Knoten an, und die
 * Zusage daneben zählte `portale > 0`, eine **Untergrenze**. Eine `.scrim`, die
 * tief im Baum einer Karte gezeichnet wird, sieht Regel F nie — sie kommt gar
 * nicht dort vorbei.
 *
 * Vier Gestalten haben das gemessen, jede mit `tsc` Exit 0 und jede bei
 * **28 bestanden, 0 fehlgeschlagen** (T-336 M-A1/M-A2, T-337 K-8, R-32):
 *
 *   `<Scrim>` → `<div className="scrim">` in `AttachmentOpenDialog.tsx:348`
 *       Portalzahl bleibt 3 — die Datei war nie erreicht
 *   dasselbe in `ShellStatus.tsx:763`
 *       Portalzahl 3 → 1, und `> 0` hält trotzdem
 *   dasselbe in `DialogSurface.tsx:371`
 *       trägt fünf Dialoge und rührt die Portalzahl ebensowenig an
 *   ein rohes `<div className="scrim">` im Rumpf von `Attachments.tsx`
 *       genau der Ort aus R-31: unter `glass` hängt die Fläche wieder an der Karte
 *
 * Es ist die Klasse aus E-099 Punkt 3, gefunden an der Stelle, an der sie
 * behoben werden sollte: **Wer eine Abwesenheit zusichert, spannt seine Menge an
 * der Anforderung auf, nicht an dem Fall, den er gerade in der Hand hat.**
 *
 * ## Was diese Regel verlangt (A-A-109)
 *
 * Jedes JSX-Element, dessen Klassenliste den Namen `scrim` enthält, steht
 * **lexikalisch** im ersten Argument eines `createPortal(…, document.body)`.
 *
 * Warum die Klasse und nicht der Baustein: Der Baustein ist eine Verabredung,
 * die Klasse ist das, was im Baum landet. `.scrim` ist `position: fixed; inset:
 * 0` (`components.css`) — und „fest" heißt „am umschließenden Block", nicht „am
 * Fenster". Jede Mal-Eigenschaft eines Vorfahren macht aus einer `.card` einen
 * solchen Block; in `glass` und `liquid-glass` trägt jede Karte
 * `backdrop-filter`. Zugesichert wird deshalb **strukturell** (E-116), und die
 * Struktur ist hier eine Stelle im Quelltext, keine Eigenschaft im Stilblatt.
 *
 * ## Was sie ausdrücklich **nicht** kann, und das steht hier statt in einem Bericht
 *
 *  - **Sie folgt keiner Zwischenstufe.** `createPortal(<Innen />, document.body)`
 *    mit der Abdunklung in `Innen` wird **gemeldet**, obwohl sie am Körper
 *    hinge. Das ist die sichere Richtung: Der Lauf sagt „das sehe ich nicht",
 *    statt es zu behaupten. Wer eine solche Bauart braucht, zieht die Klasse in
 *    den Portalaufruf oder begründet die Ausnahme hier.
 *  - **Sie urteilt über eine Stelle im Quelltext, nicht über eine Wirkung.**
 *    Daß aus der Stelle eine Verankerung folgt, hängt an zwei Eigenschaften,
 *    die anderswo gemessen werden: daß `createPortal` das echte ist
 *    ({@link portalRufOf}, A-A-112) und daß die Klasse im Stilblatt überhaupt
 *    beansprucht, am Fenster zu hängen ({@link fensterfesteKlassen}).
 * ## Die Selbstauskunft über A-25.6 — nachgezogen, nachdem sie gemessen wurde
 *
 * T-348 schrieb hier, sein Lauf trage von den fünf Teilsätzen zwei. T-357 hat
 * das **in beide Richtungen** nachgemessen und die Auskunft in zwei von fünf
 * Zeilen als **zu weit** gefunden — nirgends als zu eng (45.2). Die Auskunft
 * steht deshalb neu, und sie steht hier und nicht in einem Bericht:
 *
 * | Teilsatz von A-25.6 | dieser Lauf |
 * |---|---|
 * | 1. hängt am Fenster, **in jeder Gestaltung** | **ja**, seit T-359 auch je Gestaltung, über die Eigenschaft statt über eine Schreibweise, und einschließlich der Stilangabe am Element. Was bleibt, steht unter „Wo diese Menge endet" |
 * | 2. ist vollständig sichtbar | **nein.** Kein Satz dieses Laufs mißt Größe oder Lage auf dem Schirm; das kann nur der Augenschein (T-353) |
 * | 3. rollt nicht weg | **mittelbar**, und die Grenze ist schärfer als T-348 vermutet hat: Der umschließende Block am Körper ist heute wirkungslos (N-7) und wird trotzdem gemessen; die Gefahr saß an der Palette (N-6b) und wird seit T-359 je Gestaltung gerechnet |
 * | 4. fängt den Tastaturfokus | **nein** |
 * | 5. Abbrechen ist nie Zustimmung | **ja**, seit T-359 an der Handlung statt an drei Schreibweisen — siehe Regel H |
 *
 * ## Woher die Menge kommt — seit T-348 aus dem Stilblatt (T-347 G-5, G-8)
 *
 * Bis dahin stand hier ein fester Name: `scrim`. Zwei Gestalten haben das
 * gemessen und blieben grün: dieselbe Abdunklung unter dem zweiten Namen
 * `rueckfrage-flaeche` **samt `position: fixed; inset: 0`** (G-5), und
 * `.scrim { position: static }` — das Portal blieb stehen, die Eigenschaft
 * fiel, und der Lauf meldete weiter „1 von 1 verankert" (G-8).
 *
 * **Die Menge wird deshalb an der Eigenschaft aufgespannt und nicht am Namen:**
 * Jede Klasse, deren Regel im Stilblatt `position: fixed` **und** eine
 * Ausdehnung über die ganze Fläche erklärt, beansprucht, am Fenster zu hängen.
 * Genau dieser Anspruch ist es, den ein umschließender Block bricht. Heute
 * trifft das **eine** Klasse — `.scrim` —; `.skip-link`, `.toast-layer` und
 * `.idle-reminder` sind fest, aber nicht flächendeckend und hängen an einer
 * Ecke. Sie tragen keine Bestätigung und stehen deshalb unter dieser Regel
 * nicht; daß `.idle-reminder` heute trotzdem richtig liegt, ist eine
 * Eigenschaft der Providerreihenfolge und keine zugesicherte (T-347 1.1c).
 *
 * ## Wo diese Menge endet — die vierte Runde, und diesmal die Grenze dazu
 *
 * Viermal ist diese Zusage zu eng gewesen: erst am **Namen** `scrim`, dann an
 * der **Portalzahl**, dann an **einer Schreibweise** der Eigenschaft. Jedes Mal
 * war die Richtung richtig, und jedes Mal hat die nächste Prüfung mit fünf
 * Zeilen eine zweite Abdunklung an eine Karte gehängt. Wer nur die gemessenen
 * Gestalten nachträgt, hat die nächste vor sich (T-356). Deshalb steht hier
 * nicht nur, woran die Menge **hängt**, sondern auch, was sie **nicht faßt**.
 *
 * Sie hängt seit T-359 an der **gerechneten Erklärung**: Eine Klasse ist in der
 * Menge, wenn aus den Erklärungen der Stilblätter — `!important` abgetrennt,
 * `var()` aufgelöst, Kurz- und Logikformen auf die vier physischen Kanten
 * gebracht, über alle Regeln derselben Gestaltung vereinigt — `position: fixed`
 * und eine Achse-für-Achse volle Ausdehnung folgt. Nicht daran, wie das
 * geschrieben ist. Dazu die Stilangabe **am** Element, nach derselben Rechnung.
 *
 * **Was sie trotzdem nicht sieht, und zwar still** — das ist die teure
 * Richtung, deshalb steht sie zuerst:
 *
 *  1. **Ein Klassenname, der erst zur Laufzeit entsteht.** {@link
 *     klassenAusAusdruck} liest Zeichenketten, den Kopf und das Ende einer
 *     Vorlagenzeichenkette und eine Konstante **derselben** Datei. Ein Name aus
 *     einer Abbildung (`namen[art]`), aus einer Eigenschaft (`props.variant`)
 *     oder aus einer fremden Datei bleibt ungelesen.
 *  2. **Ein Stilblatt außerhalb von `apps/web/src`.** Ein eingefügtes
 *     `<style>`, ein Blatt aus einem fremden Paket, eine zur Laufzeit erzeugte
 *     Regel. Die Menge wird über die eigenen Blätter aufgespannt.
 *  3. **Eine Lage, die zur Laufzeit gesetzt wird** — `knoten.style.position =
 *     "fixed"` in einem Effekt. Weder Stilblatt noch Stilangabe am Element.
 *  4. **Eine fremde Fläche.** Ein Baustein aus einem fremden Paket, der seine
 *     eigene feste Abdunklung zeichnet; weder ihre Klasse noch ihr Blatt stehen
 *     in diesem Bestand.
 *
 * **Was sie meldet statt zu schweigen** — diese Gattung ist keine Lücke, denn
 * der Lauf wird rot und sagt, was er nicht lesen konnte: eine Zwischenstufe im
 * Portal, eine Stilangabe, die kein Objektliteral ist, ein Wert, der sich nicht
 * auf eine Konstante bringen läßt (A-A-119), eine Gestaltung, die die
 * Fensterfestigkeit widerruft (A-A-120), und eine Lage, die dieselbe Gestaltung
 * mehrfach verschieden erklärt.
 *
 * ## Und die Grenze, die keine fünfte Runde schließt
 *
 * **Über den Quelltext ist der erste Teilsatz von A-25.6 grundsätzlich nicht
 * vollständig zuzusichern.** „Hängt am Fenster" ist keine Eigenschaft des
 * Textes, sondern des gerechneten Kastens — in neunzehn Gestaltungen, zwei
 * Farbmodi und jeder Fenstergröße. Zwischen der Eigenschaft im Blatt und dem
 * Kasten auf dem Schirm liegt die Kaskade, und dieser Leser ist keine: Er kennt
 * weder Spezifität noch Ursprung. Jede Menge über den Quelltext ist damit eine
 * **Näherung von unten** an eine Frage über die Ausgabe. Die vier stillen
 * Punkte oben sind Beispiele dafür, keine Liste, die sich abarbeiten ließe.
 *
 * Was statt dessen trägt, steht im Bestand als Vorbild: **der Augenschein.**
 * T-353 hat in `glass` gemessen und damit zwei Teilsätze von A-25.6
 * geschlossen, die kein Lauf zusichern konnte; T-357 hat mit demselben Mittel
 * 980 × 11 998 bei (265, −523) und (0, 820) gemessen und damit **diese** Runde
 * ausgelöst. Die tragfähige Aufteilung ist deshalb: **dieser Lauf für die
 * Bauart** — die Stelle im Quelltext, die Eigenschaft im Blatt, der Absageweg —
 * und **eine Messung im Browser für die Wirkung**, über die Gestaltungen und
 * die Modi, wie T-337 sie für den Kontrast fährt. Eine ehrliche Grenze ist
 * mehr wert als eine fünfte Runde; was hier fehlt, ist eine Messung und kein
 * schärferer Ausdruck.
 */

/**
 * Der Klassenname, an dem die eine gebaute Abdunklung zu erkennen ist.
 *
 * Er ist **nicht mehr die Menge**, sondern ihre Untergrenze: Die Ernte
 * verlangt, daß er in der aus dem Stilblatt gelesenen Menge vorkommt. Fällt
 * `position: fixed` aus `.scrim`, fällt er aus der Menge — und der Lauf wird
 * rot, statt still über eine kleinere Menge zu urteilen (T-347 G-8).
 */
const SCRIM_CLASS = 'scrim';

/* -------------------------------------------------------------------- *
 * 7.1  Der Stilblattleser — die Eigenschaft, nicht ihre Schreibweise
 * -------------------------------------------------------------------- */

/**
 * ## Die vierte Runde an derselben Zusage, und woran die Menge diesmal hängt
 *
 * Erst hing sie am **Namen** `scrim` (bis T-341), dann an der **Portalzahl**
 * (bis T-334), dann an **einer Schreibweise der Eigenschaft** (T-348). Jedes
 * Mal war die Richtung richtig und die Menge zu eng, und jedes Mal hat die
 * nächste Prüfung mit fünf Zeilen CSS eine zweite Abdunklung an eine Karte
 * gehängt, ohne daß eine Zeile rot wurde — vierzehn gemessene Gestalten, alle
 * bei `tsc` Exit 0 und alle bei 45/0 grün (T-356 Punkt 2, T-357 45.1).
 *
 * Der Ausdruck davor las `position\s*:\s*fixed\s*(?:;|$|})` **je Block**. Er
 * brach an `!important`, an `var(--x)`, an zwei Regeln statt einer und an
 * `width`/`height` statt vier Kanten — vier Schreibweisen **derselben**
 * Eigenschaft.
 *
 * **Diesmal hängt die Menge an der gerechneten Erklärung.** Zwischen dem Text
 * eines Stilblatts und der Frage „beansprucht diese Klasse, am Fenster zu
 * hängen?" steht jetzt ein Leser, der
 *
 *  1. Kommentare, `@media`/`@supports`/`@container`/`@layer` und `@keyframes`
 *     auseinanderhält, statt über sie hinwegzugreifen,
 *  2. `!important` vom Wert abtrennt, statt an ihm zu scheitern,
 *  3. `var(--x)` gegen die im selben Bestand erklärten Werte auflöst — und
 *     einen `position`-Wert, den er **nicht** auflösen kann, als **Befund**
 *     meldet statt ihn zu übergehen (A-A-119, dieselbe Richtung wie A-A-113),
 *  4. die Erklärungen **je Klasse über alle Regeln** vereinigt, statt zu
 *     verlangen, daß Lage und Ausdehnung in einem Block stehen,
 *  5. die Kurzschreibweisen (`inset`, `inset-block`, `inset-inline`) und die
 *     logischen Namen auf die vier physischen Kanten abbildet,
 *  6. volle Ausdehnung auch über `width`/`height` liest — `100vw`, `100dvh`
 *     und `100%` sind dieselbe Fläche in anderen Worten,
 *  7. und **je Gestaltung** urteilt: Was eine Palette oder eine Medienabfrage
 *     an Lage oder Ausdehnung widerruft, wird gegen die Grundregel gerechnet
 *     und gemeldet (A-A-120).
 *
 * ## Was der Leser ausdrücklich nicht ist
 *
 * Er ist **keine Kaskade**. Er kennt weder Spezifität noch Ursprung und rechnet
 * nicht aus, welche Regel gewinnt; er vereinigt über die Gestaltungen und läßt
 * innerhalb **einer** Gestaltung die letzte Erklärung gelten. Das ist die
 * sichere Richtung: Eine Klasse kommt eher in die geprüfte Menge als heraus,
 * und ein Widerruf ist eher ein Befund als ein Schweigen. Die Grenzen dieser
 * Gattung stehen im Kopf von Regel G — nicht in einem Bericht.
 */

/** Kommentare raus, Zeilen und Spalten behalten. */
const ohneCssKommentare = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, (treffer) => treffer.replace(/[^\n]/g, ' '));

/**
 * Teilt an den Zeichen, die **außerhalb** von Klammern und Zeichenketten
 * stehen.
 *
 * Ohne diese Unterscheidung zerfiele `:is(.card, .filterbar)` in zwei
 * Selektoren und `min(560px, calc(100vw - 40px))` in zwei Werte — beide stehen
 * heute im Bestand.
 *
 * @param {string} text
 * @param {RegExp} trenner
 */
const teileAussen = (text, trenner) => {
  /** @type {string[]} */
  const teile = [];
  let tiefe = 0;
  /** @type {string | null} */
  let zeichenkette = null;
  let laufend = '';
  const schliesse = () => {
    if (laufend.trim().length > 0) teile.push(laufend.trim());
    laufend = '';
  };
  for (const zeichen of text) {
    if (zeichenkette !== null) {
      laufend += zeichen;
      if (zeichen === zeichenkette) zeichenkette = null;
      continue;
    }
    if (zeichen === '"' || zeichen === "'") {
      zeichenkette = zeichen;
      laufend += zeichen;
      continue;
    }
    if (zeichen === '(' || zeichen === '[') tiefe += 1;
    if (zeichen === ')' || zeichen === ']') tiefe -= 1;
    if (tiefe === 0 && trenner.test(zeichen)) {
      schliesse();
      continue;
    }
    laufend += zeichen;
  }
  schliesse();
  return teile;
};

const kommaTeile = (text) => teileAussen(text, /,/);
const verbindungenOf = (selektor) => teileAussen(selektor, /[\s>+~]/);
const werteTeile = (wert) => teileAussen(wert, /\s/);

/**
 * Die **letzte** Verbindung eines Selektors — sie benennt das Element, das die
 * Regel erklärt. `.a .b { … }` erklärt `.b`, nicht `.a`.
 */
const letzteVerbindung = (selektor) => {
  const teile = verbindungenOf(selektor);
  return teile.length === 0 ? '' : teile[teile.length - 1];
};

/**
 * Die Klassen, die eine Verbindung **benennt**.
 *
 * `:is(…)` und `:where(…)` werden betreten — `:is(.card, .filterbar)` erklärt
 * beide, und genau so steht es in `theme-palettes.css`. `:not(…)` und `:has(…)`
 * werden übersprungen: Sie benennen, was das Element **nicht** ist oder was
 * **darunter** steht, und keines von beidem ist das Element, das die Regel
 * erklärt. Ohne diese Unterscheidung hielte der Leser `body:has(.scrim)
 * .toast-layer` für eine Erklärung über `.scrim` — die Regel steht heute im
 * Bestand (`app.css:849`).
 *
 * @returns {Set<string>}
 */
const klassenDerVerbindung = (verbindung) => {
  const gefunden = new Set();
  const lies = (text) => {
    let i = 0;
    while (i < text.length) {
      if (text[i] === '.') {
        const name = /^[\w-]+/.exec(text.slice(i + 1));
        if (name === null) {
          i += 1;
          continue;
        }
        gefunden.add(name[0]);
        i += name[0].length + 1;
        continue;
      }
      if (text[i] === '[') {
        let tiefe = 1;
        let j = i + 1;
        while (j < text.length && tiefe > 0) {
          if (text[j] === '[') tiefe += 1;
          if (text[j] === ']') tiefe -= 1;
          j += 1;
        }
        i = j;
        continue;
      }
      const funktional = /^::?(?:[\w-]+)\(/.exec(text.slice(i));
      if (funktional !== null) {
        const start = i + funktional[0].length;
        let tiefe = 1;
        let j = start;
        while (j < text.length && tiefe > 0) {
          if (text[j] === '(') tiefe += 1;
          if (text[j] === ')') tiefe -= 1;
          j += 1;
        }
        if (/^::?(?:is|where|matches|any)\($/i.test(funktional[0])) {
          for (const teil of kommaTeile(text.slice(start, j - 1))) lies(letzteVerbindung(teil));
        }
        i = j;
        continue;
      }
      i += 1;
    }
  };
  lies(verbindung);
  return gefunden;
};

/** Benennt diese Verbindung den Dokumentkörper oder die Wurzel? */
const istKoerperVerbindung = (verbindung) => {
  const typ = /^[\w-]+/.exec(verbindung);
  if (typ !== null && /^(?:html|body)$/i.test(typ[0])) return true;
  return /(?:^|[^\w-]):root(?![\w-])/.test(verbindung);
};

/** At-Regeln, deren Inneres unter einer **Bedingung** dieselben Selektoren trägt. */
const BEDINGUNGSGRUPPEN = /^@(?:media|supports|container|layer|scope|document)\b/i;
/** At-Regeln, deren Inneres **keine** Selektoren trägt — `from`/`to`/`0%` sind keine. */
const STUMME_GRUPPEN = /^@(?:[-\w]*keyframes|font-face|property|counter-style|page|font-feature-values|viewport)\b/i;

/** Verbindet die Selektoren einer Regel mit denen ihrer Elternregel (CSS-Verschachtelung). */
const selektorListe = (kopf, eltern) => {
  const teile = kommaTeile(kopf);
  if (eltern.length === 0) return teile;
  const zusammen = [];
  for (const aussen of eltern) {
    for (const innen of teile) {
      zusammen.push(innen.includes('&') ? innen.replaceAll('&', aussen) : `${aussen} ${innen}`);
    }
  }
  return zusammen;
};

/**
 * Ein Stilblatt in **Erklärungen** zerlegt — Eigenschaft, Wert, Wichtigkeit,
 * Selektor, Bedingungen und Ort.
 *
 * @param {ReadonlyArray<{ name: string; text: string }>} blaetter
 * @returns {Array<{ eigenschaft: string; wert: string; wichtig: boolean; selektor: string; bedingungen: readonly string[]; wo: string }>}
 */
const cssErklaerungen = (blaetter) => {
  const erklaerungen = [];
  for (const { name, text } of blaetter) {
    const quelle = ohneCssKommentare(text);
    const rahmen = [{ selektoren: [], bedingungen: [], stumm: false }];
    const spitze = () => rahmen[rahmen.length - 1];
    let puffer = '';
    let pufferZeile = 1;
    let zeile = 1;
    const erklaere = () => {
      const roh = puffer.trim();
      puffer = '';
      if (roh.length === 0 || roh.startsWith('@')) return;
      const ort = spitze();
      if (ort.stumm || ort.selektoren.length === 0) return;
      const doppelpunkt = roh.indexOf(':');
      if (doppelpunkt <= 0) return;
      const eigenschaft = roh.slice(0, doppelpunkt).trim().toLowerCase();
      let wert = roh.slice(doppelpunkt + 1).trim();
      const wichtig = /!\s*important$/i.test(wert);
      if (wichtig) wert = wert.replace(/!\s*important$/i, '').trim();
      for (const selektor of ort.selektoren) {
        erklaerungen.push({
          eigenschaft,
          wert,
          wichtig,
          selektor,
          bedingungen: ort.bedingungen,
          wo: `${name}:${String(pufferZeile)}`,
        });
      }
    };
    for (let i = 0; i < quelle.length; i += 1) {
      const zeichen = quelle[i];
      if (zeichen === '\n') zeile += 1;
      if (zeichen === '{') {
        const kopf = puffer.trim();
        puffer = '';
        pufferZeile = zeile;
        const eltern = spitze();
        if (eltern.stumm || STUMME_GRUPPEN.test(kopf)) {
          rahmen.push({ selektoren: [], bedingungen: eltern.bedingungen, stumm: true });
        } else if (kopf.startsWith('@')) {
          const bedingt = BEDINGUNGSGRUPPEN.test(kopf);
          rahmen.push({
            selektoren: bedingt ? eltern.selektoren : [],
            bedingungen: bedingt ? [...eltern.bedingungen, kopf.replace(/\s+/g, ' ')] : eltern.bedingungen,
            stumm: !bedingt,
          });
        } else {
          rahmen.push({
            selektoren: selektorListe(kopf, eltern.selektoren),
            bedingungen: eltern.bedingungen,
            stumm: false,
          });
        }
        continue;
      }
      if (zeichen === '}') {
        erklaere();
        pufferZeile = zeile;
        if (rahmen.length > 1) rahmen.pop();
        continue;
      }
      if (zeichen === ';') {
        erklaere();
        pufferZeile = zeile;
        continue;
      }
      if (puffer.length === 0 && /\s/.test(zeichen)) {
        pufferZeile = zeile;
        continue;
      }
      puffer += zeichen;
    }
  }
  return erklaerungen;
};

/**
 * Die im Bestand erklärten Variablen.
 *
 * Erklärt derselbe Name **verschiedene** Werte — in diesem Bestand die Regel
 * und nicht die Ausnahme, jede der neunzehn Paletten schreibt `--bg-canvas`
 * neu —, ist er hier **nicht auflösbar**. Das ist die teure Richtung und die
 * richtige: Ein Wert, der von der Gestaltung abhängt, ist kein Wert, über den
 * ein Lauf urteilen darf; er wird gemeldet und nicht geraten.
 *
 * @returns {Map<string, string | null>}
 */
const cssVariablen = (erklaerungen) => {
  const werte = new Map();
  for (const { eigenschaft, wert } of erklaerungen) {
    if (!eigenschaft.startsWith('--')) continue;
    if (!werte.has(eigenschaft)) {
      werte.set(eigenschaft, wert);
      continue;
    }
    if (werte.get(eigenschaft) !== wert) werte.set(eigenschaft, null);
  }
  return werte;
};

/**
 * Löst `var(--x[, Rückfall])` gegen die erklärten Werte auf.
 *
 * @returns {string | null} `null`, wenn dieser Lauf den Wert nicht lesen kann.
 */
const aufloesen = (wert, variablen) => {
  let ergebnis = wert;
  for (let runde = 0; runde < 32; runde += 1) {
    const start = ergebnis.indexOf('var(');
    if (start < 0) return ergebnis.trim();
    let tiefe = 1;
    let j = start + 4;
    while (j < ergebnis.length && tiefe > 0) {
      if (ergebnis[j] === '(') tiefe += 1;
      if (ergebnis[j] === ')') tiefe -= 1;
      j += 1;
    }
    if (tiefe > 0) return null;
    const teile = kommaTeile(ergebnis.slice(start + 4, j - 1));
    const name = teile[0] ?? '';
    if (!name.startsWith('--')) return null;
    if (variablen.get(name) === null) return null;
    const eingesetzt = variablen.get(name) ?? (teile.length > 1 ? teile.slice(1).join(',') : undefined);
    if (eingesetzt === undefined) return null;
    ergebnis = `${ergebnis.slice(0, start)}${eingesetzt}${ergebnis.slice(j)}`;
  }
  return null;
};

/** Die logischen Namen auf die physischen — waagerechte Schreibrichtung. */
const PHYSISCHE_NAMEN = new Map([
  ['inset-block-start', 'top'],
  ['inset-block-end', 'bottom'],
  ['inset-inline-start', 'left'],
  ['inset-inline-end', 'right'],
  ['inline-size', 'width'],
  ['block-size', 'height'],
]);

/** Jede Eigenschaft, aus der eine volle Ausdehnung folgen kann. */
const AUSDEHNUNG = new Set([
  'inset',
  'inset-block',
  'inset-inline',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  ...PHYSISCHE_NAMEN.keys(),
]);

/**
 * Eine Erklärung in ihre physischen Langformen zerlegt.
 *
 * `inset: 0` sind vier Kanten, `inset-block: 0` sind zwei, `inset-inline-end`
 * ist `right`. Ohne diesen Schritt wäre dieselbe Fläche in einer anderen
 * Schreibweise wieder unsichtbar — genau N-4 aus T-357.
 *
 * @returns {Array<[string, string]>}
 */
const langformen = (eigenschaft, wert) => {
  const teile = werteTeile(wert);
  if (eigenschaft === 'inset') {
    const [a, b = a, c = a, d = b] = teile;
    if (a === undefined) return [];
    return [
      ['top', a],
      ['right', b],
      ['bottom', c],
      ['left', d],
    ];
  }
  if (eigenschaft === 'inset-block') {
    const [a, b = a] = teile;
    if (a === undefined) return [];
    return [
      ['top', a],
      ['bottom', b],
    ];
  }
  if (eigenschaft === 'inset-inline') {
    const [a, b = a] = teile;
    if (a === undefined) return [];
    return [
      ['left', a],
      ['right', b],
    ];
  }
  return [[PHYSISCHE_NAMEN.get(eigenschaft) ?? eigenschaft, wert.trim()]];
};

const NULLWERT = /^0(?:[a-z]+|%)?$/i;
const VOLLE_BREITE = /^100(?:%|[dsl]?v[wi])$/i;
const VOLLE_HOEHE = /^100(?:%|[dsl]?v[hb])$/i;

/**
 * Deckt diese Erklärungsmenge die ganze Fläche?
 *
 * Gerechnet wird waagerecht und senkrecht getrennt, und jede Achse ist voll,
 * wenn **beide** Kanten auf null stehen **oder** eine Kante auf null steht und
 * die Ausdehnung das Fenster füllt. Damit sind `inset: 0`, die vier einzelnen
 * Kanten und `top/left: 0; width: 100vw; height: 100vh` dieselbe Aussage —
 * was sie auf dem Schirm auch sind.
 *
 * @param {Map<string, string | null>} werte
 */
const volleAusdehnung = (werte) => {
  const istNull = (name) => {
    const wert = werte.get(name);
    return wert !== undefined && wert !== null && NULLWERT.test(wert);
  };
  const passt = (name, muster) => {
    const wert = werte.get(name);
    return wert !== undefined && wert !== null && muster.test(wert);
  };
  const waagerecht =
    (istNull('left') && istNull('right')) ||
    ((istNull('left') || istNull('right')) && passt('width', VOLLE_BREITE));
  const senkrecht =
    (istNull('top') && istNull('bottom')) ||
    ((istNull('top') || istNull('bottom')) && passt('height', VOLLE_HOEHE));
  return waagerecht && senkrecht;
};

/**
 * Die Klassen, die im Stilblatt beanspruchen, **am Fenster** zu hängen — und
 * die Stellen, an denen dieser Anspruch nicht **gelesen** oder in einer
 * Gestaltung wieder **widerrufen** wird.
 *
 * Drei Gattungen von Befunden, und alle drei sind Auflagen aus Abschnitt 45:
 *
 *  - **unlesbar** (A-A-119): ein `position`-Wert, der keine Konstante ist, und
 *    eine Ausdehnung, die sich an einer festen Klasse nicht auflösen läßt.
 *    Ein Lauf, der so etwas übergeht, schweigt über die Gestalt, die er nicht
 *    kennt — dieselbe Richtung, die A-A-113 für den Absageweg verlangt.
 *  - **widerrufen** (A-A-120): eine Palette oder eine Medienabfrage, die Lage
 *    oder Ausdehnung so ändert, daß die Fläche dort **nicht mehr** am Fenster
 *    hängt. Gemessen im Browser: `.scrim { position: static }` unter einem
 *    Palettenselektor legt die Fläche bei (0, 820) **unter** das Fenster, und
 *    der Lauf meldete davor weiter „1, davon 1 verankert".
 *  - **nur in einer Gestaltung fest**: eine Klasse, die ihre Fensterfestigkeit
 *    erst aus einer Palette bezieht. Dann ist die Grundregel die Ausnahme, und
 *    das gehört gelesen, nicht gefolgert.
 *
 * @param {ReadonlyArray<{ name: string; text: string }>} blaetter
 * @returns {{ klassen: Set<string>; befunde: string[] }}
 */
const fensterfesteKlassen = (blaetter) => {
  const erklaerungen = cssErklaerungen(blaetter);
  const variablen = cssVariablen(erklaerungen);
  /** @type {Map<string, Array<(typeof erklaerungen)[number]>>} */
  const jeKlasse = new Map();
  /** @type {string[]} */
  const befunde = [];

  for (const erklaerung of erklaerungen) {
    const istLage = erklaerung.eigenschaft === 'position';
    if (!istLage && !AUSDEHNUNG.has(erklaerung.eigenschaft)) continue;
    if (istLage && aufloesen(erklaerung.wert, variablen) === null) {
      befunde.push(
        `${erklaerung.wo} — \`${erklaerung.selektor}\` erklärt \`position: ${erklaerung.wert}\`, und ` +
          'dieser Lauf kann daraus keine Konstante rechnen. Eine Lage, die erst zur Laufzeit ' +
          'entsteht, kann `fixed` sein: Sie wird gemeldet und nicht übergangen (A-A-119)',
      );
    }
    for (const klasse of klassenDerVerbindung(letzteVerbindung(erklaerung.selektor))) {
      const bisher = jeKlasse.get(klasse) ?? [];
      bisher.push(erklaerung);
      jeKlasse.set(klasse, bisher);
    }
  }

  /**
   * Eine Gestaltung durchgerechnet: die letzte Erklärung gilt, Kurzformen sind
   * aufgelöst, `!important` ist längst abgetrennt.
   */
  const rechne = (menge, eigenerTeil = menge) => {
    /** @type {Map<string, string | null>} */
    const werte = new Map();
    /** @type {string | null | undefined} */
    let lage;
    /** @type {Array<{ wo: string; eigenschaft: string; wert: string }>} */
    const unlesbar = [];
    /** Jede Lage, die in dieser Gestaltung erklärt wird — in Lesereihenfolge. */
    /** @type {Array<{ wo: string; wert: string | null }>} */
    const lagen = [];
    for (const erklaerung of menge) {
      if (erklaerung.eigenschaft === 'position') {
        const aufgeloest = aufloesen(erklaerung.wert, variablen);
        lage = aufgeloest === null ? null : aufgeloest.toLowerCase();
        if (eigenerTeil.includes(erklaerung)) lagen.push({ wo: erklaerung.wo, wert: lage });
        continue;
      }
      for (const [name, roh] of langformen(erklaerung.eigenschaft, erklaerung.wert)) {
        const aufgeloest = aufloesen(roh, variablen);
        werte.set(name, aufgeloest === null ? null : aufgeloest.toLowerCase());
        if (aufgeloest === null) {
          unlesbar.push({ wo: erklaerung.wo, eigenschaft: erklaerung.eigenschaft, wert: erklaerung.wert });
        }
      }
    }
    /*
     * **Die wohlwollende Lesart — und wozu sie gut ist.**
     *
     * Ein unlesbarer Wert ist nur dann ein Befund, wenn er die Fläche
     * **fensterfest machen könnte**. Setzt man jeden unlesbaren Wert so, wie er
     * der vollen Ausdehnung am besten dient — Kanten auf null, Ausdehnung auf
     * das ganze Fenster — und deckt die Fläche dann *immer noch* nicht, dann
     * kann kein Wert der Welt das ändern, und Schweigen ist richtig.
     *
     * Das ist kein Zugeständnis, sondern die Grenze zwischen „ich kann es nicht
     * lesen" und „es ist gleichgültig, was dort steht". Ohne sie meldete dieser
     * Lauf `.skip-link { position: fixed; top: var(--space-2); left:
     * var(--space-2) }` aus `base.css:300` — eine Marke an der Ecke, ohne
     * `right`, ohne `bottom`, ohne `width`, ohne `height`. Sie kann die Fläche
     * nie decken, gleich welchen Abstand die Palette setzt. Ein Wächter mit
     * falschen Treffern wird abgeschaltet.
     */
    const wohlwollend = new Map(werte);
    for (const [name, wert] of werte) {
      if (wert !== null) continue;
      wohlwollend.set(name, name === 'width' ? '100vw' : name === 'height' ? '100vh' : '0');
    }
    /*
     * **Wo die Lesereihenfolge über die Menge entscheidet.**
     *
     * Dieser Leser ist keine Kaskade: Er kennt weder Spezifität noch Ursprung
     * und läßt innerhalb einer Gestaltung schlicht die **letzte gelesene**
     * Erklärung gelten. Solange dieselbe Gestaltung `position` nur einmal
     * erklärt, ist das dasselbe Ergebnis wie im Browser. Erklärt **dieselbe
     * Gestaltung** sie zweimal verschieden — zwei Stilblätter, derselbe
     * Selektor, dieselben Bedingungen —, hängt das
     * Ergebnis an der Reihenfolge, in der {@link readTreeSync} die Dateien
     * liefert, und nicht an der Kaskade. Dann kann eine fensterfeste Klasse
     * still aus der Menge fallen.
     *
     * Eine spätere Regel mit **anderem** Selektor ist ausdrücklich kein Fall
     * davon: Daß eine Palette die Grundregel überschreibt, ist der Sinn einer
     * Palette und wird als Widerruf gemessen (A-A-120), nicht als
     * Uneindeutigkeit. Gemessen wird deshalb je Gestaltung über **ihre
     * eigenen** Erklärungen.
     *
     * Das ist die einzige Stelle, an der dieser Leser **still** falsch liegen
     * kann. Sie wird deshalb gemeldet statt beschrieben.
     */
    const verschiedene = new Set(lagen.map(({ wert }) => String(wert)));
    const uneindeutig =
      verschiedene.size > 1 && (verschiedene.has('fixed') || verschiedene.has('null')) ? lagen : [];
    return {
      lage,
      werte,
      unlesbar,
      uneindeutig,
      fensterfest: lage === 'fixed' && volleAusdehnung(werte),
      koennteFest: (lage === 'fixed' || lage === null) && volleAusdehnung(wohlwollend),
    };
  };

  const klassen = new Set();
  for (const [klasse, eigene] of [...jeKlasse].sort((a, b) => a[0].localeCompare(b[0]))) {
    const istGrund = (erklaerung) =>
      erklaerung.bedingungen.length === 0 && erklaerung.selektor.trim() === `.${klasse}`;
    const grund = rechne(eigene.filter(istGrund));
    /** @type {Map<string, Array<(typeof eigene)[number]>>} */
    const gestaltungen = new Map();
    for (const erklaerung of eigene) {
      if (istGrund(erklaerung)) continue;
      const schluessel = `${erklaerung.bedingungen.join(' ')} | ${erklaerung.selektor.trim()}`;
      gestaltungen.set(schluessel, [...(gestaltungen.get(schluessel) ?? []), erklaerung]);
    }
    const gerechnet = [...gestaltungen].map(([schluessel, menge]) => ({
      schluessel,
      menge,
      ergebnis: rechne([...eigene.filter(istGrund), ...menge], menge),
    }));
    /*
     * **Das Unlesbare zuerst — und ausdrücklich vor der Menge** (A-A-119).
     *
     * Eine Klasse, deren Lage `fixed` heißt und deren Ausdehnung dieser Lauf
     * nicht auf eine Konstante bringt, ist **nicht** beweisbar fensterfest. Sie
     * fiele damit aus der Menge, und das ist die alte Fehlerklasse in neuer
     * Gestalt: Der Lauf urteilte still über weniger, statt zu sagen, was er
     * nicht lesen konnte. Gemeldet wird deshalb, sobald die Lage `fixed` heißt
     * **oder** selbst unlesbar ist — unabhängig davon, ob die Klasse es am Ende
     * in die Menge schafft.
     */
    for (const { schluessel, ergebnis } of [
      { schluessel: 'die Grundregel', ergebnis: grund },
      ...gerechnet,
    ]) {
      if (ergebnis.uneindeutig.length > 0) {
        befunde.push(
          `${ergebnis.uneindeutig[0]?.wo ?? '?'} — \`.${klasse}\` erklärt in \`${schluessel}\` die Lage ` +
            `mehrfach verschieden (${ergebnis.uneindeutig.map((l) => `${l.wo}: ${String(l.wert)}`).join(', ')}). ` +
            'Dieser Lauf ist keine Kaskade: Welche gilt, entscheidet hier die Lesereihenfolge der ' +
            'Stilblätter und nicht die Spezifität — und damit fiele eine fensterfeste Klasse still ' +
            'aus der Menge (A-A-119)',
        );
      }
      if (ergebnis.fensterfest || !ergebnis.koennteFest) continue;
      for (const stelle of ergebnis.unlesbar) {
        befunde.push(
          `${stelle.wo} — \`.${klasse}\` steht in \`${schluessel}\` auf \`position: ` +
            `${String(ergebnis.lage)}\`, und \`${stelle.eigenschaft}: ${stelle.wert}\` läßt sich hier ` +
            'nicht auf eine Konstante bringen. Eine Ausdehnung, die dieser Lauf nicht rechnen kann, ' +
            'wird gemeldet und nicht stillschweigend für zu klein gehalten (A-A-119)',
        );
      }
    }

    const irgendwoFest = grund.fensterfest || gerechnet.some(({ ergebnis }) => ergebnis.fensterfest);
    if (!irgendwoFest) continue;
    klassen.add(klasse);

    if (!grund.fensterfest) {
      const erste = gerechnet.find(({ ergebnis }) => ergebnis.fensterfest);
      befunde.push(
        `${erste?.menge[0]?.wo ?? '?'} — \`.${klasse}\` hängt **nur** in der Gestaltung ` +
          `\`${erste?.schluessel ?? '?'}\` am Fenster; die Grundregel tut es nicht. Eine ` +
          'Bestätigungsfläche, deren Verankerung die Ausnahme ist, ist keine verankerte Fläche (A-A-120)',
      );
    }
    for (const { schluessel, menge, ergebnis } of gerechnet) {
      const beruehrt = menge.some(
        (erklaerung) => erklaerung.eigenschaft === 'position' || AUSDEHNUNG.has(erklaerung.eigenschaft),
      );
      if (!beruehrt || ergebnis.fensterfest) continue;
      befunde.push(
        `${menge[0]?.wo ?? '?'} — \`${schluessel}\` widerruft die Fensterfestigkeit von \`.${klasse}\` ` +
          `(gerechnet: position \`${String(ergebnis.lage)}\`, Ausdehnung ` +
          `${[...ergebnis.werte].map(([n, w]) => `${n}: ${String(w)}`).join(', ') || 'keine'}). ` +
          '„In jeder Gestaltung" wird je Gestaltung gemessen — im Browser lag die Fläche danach ' +
          'bei (0, 820), unter dem Fenster (A-A-120)',
      );
    }
    for (const stelle of grund.fensterfest ? grund.unlesbar : []) {
      befunde.push(
        `${stelle.wo} — \`.${klasse}\` ist fensterfest, und \`${stelle.eigenschaft}: ${stelle.wert}\` ` +
          'läßt sich hier nicht auf eine Konstante bringen. Eine Ausdehnung, die dieser Lauf nicht ' +
          'rechnen kann, wird gemeldet und nicht für voll genommen (A-A-119)',
      );
    }
  }
  return { klassen, befunde };
};

/**
 * Eigenschaften, die auf `html`, `body` oder `:root` einen **umschließenden
 * Block** erzeugen — und damit die eine Voraussetzung brechen, auf der Regel G
 * ruht.
 *
 * Regel G urteilt über eine **Stelle im Quelltext**: die Fläche steht im
 * gezeichneten Argument eines `createPortal(…, document.body)`. Daraus folgt
 * eine Verankerung am Fenster nur, solange zwischen Fläche und Fenster nichts
 * steht — und zwischen ihnen stehen nach dem Portal genau zwei Elemente,
 * `<body>` und `<html>`. Trägt eines davon `transform`, `filter`,
 * `backdrop-filter`, `perspective`, `contain: paint` oder `container-type`,
 * ist der umschließende Block dieses Element und nicht mehr das Fenster.
 *
 * T-357 hat das gemessen (N-7) und **wirkungslos** gefunden — der Körperkasten
 * ist heute so groß wie das Fenster. Wirkungslos ist nicht dasselbe wie
 * unmöglich: Sobald der Körper über das Fenster hinausreicht, ist es dieselbe
 * Gestalt wie R-31, nur eine Ebene höher. Deshalb steht die Voraussetzung hier
 * als Messung und nicht als Satz in einem Bericht.
 */
const KOERPER_BLOCKBILDNER = new Map([
  ['transform', (wert) => wert !== 'none'],
  ['translate', (wert) => wert !== 'none'],
  ['rotate', (wert) => wert !== 'none'],
  ['scale', (wert) => wert !== 'none'],
  ['perspective', (wert) => wert !== 'none'],
  ['filter', (wert) => wert !== 'none'],
  ['backdrop-filter', (wert) => wert !== 'none'],
  ['will-change', (wert) => /transform|translate|rotate|scale|perspective|filter|contain/i.test(wert)],
  ['contain', (wert) => /\b(?:paint|layout|strict|content)\b/i.test(wert)],
  ['container-type', (wert) => wert !== 'normal'],
  ['content-visibility', (wert) => wert !== 'visible'],
]);

/**
 * **Die Zahl `koerperErklaerungen` ist kein Schmuck.**
 *
 * Heute trägt kein `body` und kein `:root` dieses Bestandes eine der elf
 * Eigenschaften oben — die Zusage darunter ist also über einer **leeren** Menge
 * wahr. Genau diese Gestalt ist in diesem Bestand dreimal durchgekommen (E-099,
 * E-111, AK-01). Gezählt wird deshalb, wie viele Erklärungen dieser Leser auf
 * Körper und Wurzel überhaupt **findet**: Fällt die Zahl auf null, liest er die
 * Verbindung nicht mehr, und die Zusage wäre leer wahr aus dem falschen Grund.
 *
 * @param {ReadonlyArray<{ name: string; text: string }>} blaetter
 * @returns {{ erklaerungen: number; koerperErklaerungen: number; befunde: string[] }}
 */
const koerperBlockBefunde = (blaetter) => {
  const erklaerungen = cssErklaerungen(blaetter);
  const variablen = cssVariablen(erklaerungen);
  /** @type {string[]} */
  const befunde = [];
  let gelesen = 0;
  let aufKoerper = 0;
  for (const erklaerung of erklaerungen) {
    if (istKoerperVerbindung(letzteVerbindung(erklaerung.selektor))) aufKoerper += 1;
    const pruefe = KOERPER_BLOCKBILDNER.get(erklaerung.eigenschaft);
    if (pruefe === undefined) continue;
    if (!istKoerperVerbindung(letzteVerbindung(erklaerung.selektor))) continue;
    gelesen += 1;
    const aufgeloest = aufloesen(erklaerung.wert, variablen);
    const wert = aufgeloest === null ? erklaerung.wert : aufgeloest.toLowerCase();
    if (aufgeloest !== null && !pruefe(wert)) continue;
    befunde.push(
      `${erklaerung.wo} — \`${erklaerung.selektor}\` erklärt \`${erklaerung.eigenschaft}: ` +
        `${erklaerung.wert}\`. Damit ist der umschließende Block jeder festen Fläche der ` +
        'Dokumentkörper und nicht mehr das Fenster — das Portal aus Regel G verankert dann nichts ' +
        'mehr (A-A-120, T-357 N-7)',
    );
  }
  return { erklaerungen: gelesen, koerperErklaerungen: aufKoerper, befunde };
};

/**
 * Steht dieser Knoten lexikalisch im **gezeichneten** Argument eines
 * `createPortal(…, document.body)`?
 *
 * Der Aufstieg vergleicht bei jedem `createPortal` den Zweig, aus dem er kommt,
 * mit `arguments[0]`. Ohne diesen Vergleich zählte auch ein Knoten als
 * verankert, der im **Ziel** stünde — dort zeichnet niemand, aber ein Wächter,
 * der den Unterschied nicht kennt, hat ihn nicht gemessen.
 */
const portalAnkerOf = (node) => {
  const auspacken = (n) => (n !== undefined && ts.isParenthesizedExpression(n) ? auspacken(n.expression) : n);
  let zweig = node;
  let current = node.parent;
  while (current !== undefined) {
    const portalRuf = portalRufOf(current);
    if (portalRuf.ruf) {
      /*
       * **Der Name zuerst** (A-A-112). Ein eigener `createPortal` in derselben
       * Datei machte aus dieser Zeile sonst eine falsche Zusage: „1 von 1
       * verankert", während die Fläche an ihrer Karte hängt (T-347 G-4).
       *
       * Hier wird **abgebrochen und nicht weitergestiegen**, obwohl ein echtes
       * Portal darüber stehen könnte. Das ist dieselbe Wahl wie bei der
       * Zwischenstufe zwölf Zeilen tiefer: Der Lauf meldet lieber zuviel, als
       * über einen Aufstieg zu urteilen, den er nicht gelesen hat.
       */
      if (!portalRuf.echt) return { verankert: false, grund: portalRuf.grund };
      if (auspacken(current.arguments[0]) !== auspacken(zweig)) {
        return {
          verankert: false,
          grund:
            'steht in einem `createPortal`, aber nicht in dem Baum, den es zeichnet — ' +
            'das zweite Argument ist das Ziel und kein Ort zum Zeichnen',
        };
      }
      if (current.arguments.length !== 2) {
        return {
          verankert: false,
          grund:
            `steht in einem \`createPortal\` mit ${String(current.arguments.length)} statt zwei ` +
            'Argumenten — ohne Ziel weiß dieser Lauf nicht, woran die Fläche hängt',
        };
      }
      const ziel = current.arguments[1];
      if (ziel === undefined || !zielIstDokumentkoerper(ziel)) {
        return {
          verankert: false,
          grund:
            '`createPortal` mit einem Ziel, das dieser Lauf nicht als den Dokumentkörper liest — ' +
            `\`${ziel === undefined ? '' : ziel.getText().replace(/\s+/g, ' ').slice(0, 40)}\`; ` +
            'dort kann wieder ein Vorfahr mit `backdrop-filter` stehen',
        };
      }
      return { verankert: true, grund: '' };
    }
    zweig = current;
    current = current.parent;
  }
  return {
    verankert: false,
    grund:
      'steht in keinem `createPortal(…, document.body)` — in `glass` und `liquid-glass` hängt sie ' +
      'damit an der nächsten `.card` mit `backdrop-filter` statt am Fenster (R-31, E-116)',
  };
};

/**
 * Eine Fläche, die **ohne JSX** entsteht: `createElement("div", { className:
 * "scrim" }, …)`.
 *
 * T-347 G-3: Dieselbe Abdunklung, in der Schreibweise, in die jeder Übersetzer
 * das JSX ohnehin übersetzt — und Regel G sah sie nicht, weil sie nur
 * `jsxOpenings` erntete. Gelesen wird der **Name** `createElement`, ohne ihn
 * gegen eine Einfuhr aufzulösen: Hier ist ein zu weites Urteil die sichere
 * Richtung, denn es vergrößert die geprüfte Menge und verkleinert sie nicht.
 *
 * @returns {{ tag: string; klassen: string[]; stil: ts.Expression | undefined } | null}
 */
const elementAusAufruf = (node) => {
  if (!ts.isCallExpression(node) || callee(node) !== 'createElement') return null;
  const [tagArgument, eigenschaften] = node.arguments;
  if (tagArgument === undefined || !ts.isStringLiteral(tagArgument)) return null;
  if (eigenschaften === undefined || !ts.isObjectLiteralExpression(eigenschaften)) return null;
  const klassen = [];
  /** @type {ts.Expression | undefined} */
  let stil;
  for (const eigenschaft of eigenschaften.properties) {
    if (!ts.isPropertyAssignment(eigenschaft)) continue;
    const name = ts.isIdentifier(eigenschaft.name) || ts.isStringLiteral(eigenschaft.name)
      ? eigenschaft.name.text
      : null;
    if (name === 'style') {
      stil = eigenschaft.initializer;
      continue;
    }
    if (name !== 'className') continue;
    klassen.push(...klassenAusAusdruck(eigenschaft.initializer));
  }
  if (klassen.length === 0 && stil === undefined) return null;
  return { tag: tagArgument.text, klassen, stil };
};

/* -------------------------------------------------------------------- *
 * 7.2  Die Stilangabe **am** Element (A-A-121, T-357 N-5)
 * -------------------------------------------------------------------- */

/**
 * ## Warum die Ernte von Regel G nicht am Stilblatt endet
 *
 * `style={{ position: "fixed", inset: 0 }}` ist dieselbe Fläche wie `.scrim`,
 * nur ohne Stilblatt. T-357 hat sie eingesetzt (N-5): `tsc` Exit 0, der Lauf
 * 45/0 grün, die Menge unverändert — weil Regel G ihre Flächen ausschließlich
 * an Klassennamen erntete und die Klassennamen ausschließlich aus dem
 * Stilblatt kamen. Eine Fläche ohne Klasse fiel durch beide Siebe.
 *
 * A-A-121 läßt zwei Wege: bauen oder als **Grenze der Ernte** benennen.
 * Gebaut ist der erste.
 *
 * ## Was gelesen wird
 *
 * Ein Objektliteral unmittelbar am Element — in JSX wie in `createElement`.
 * Die Namen werden von der Höckerschreibweise auf die CSS-Namen gebracht
 * (`insetBlockStart` → `inset-block-start`), Zahlen werden gelesen, wie React
 * sie schreibt (`0` → `0px`, `100` → `100px`).
 *
 * ## Was ausdrücklich gemeldet statt geraten wird
 *
 * Ein `position`, dessen Wert **keine** Zeichenkettenkonstante ist — eine
 * Veränderliche, ein Aufruf, eine Verbreitung. Er kann `fixed` sein, und ein
 * Lauf, der darüber schweigt, hat wieder eine Aussage über eine Schreibweise
 * gemacht (A-A-119, dieselbe Richtung).
 *
 * **Gemeldet wird aber nur, was fensterfest sein *könnte*** ({@link
 * koennteFensterfest}): Lage unlesbar **oder** `fixed`, **und** Ausdehnung
 * unlesbar **oder** voll. Sonst wäre `style={{ width: size, height: size }}`
 * ein Befund — die Zeile steht heute in `Primitives.tsx`, und sie hat mit
 * Bestätigungsflächen nichts zu tun. Ein Wächter mit falschen Treffern wird
 * abgeschaltet.
 *
 * ## Warum eine Liste und nicht ein Objekt
 *
 * Ein Objektliteral ist **nicht** eine Gestaltung, sobald eine Verbreitung
 * darin steht: `{ width, height, ...(x ? {} : { borderRadius: r }) }` —
 * zeichengleich aus `Primitives.tsx` — sind zwei. Gerechnet wird deshalb über
 * die Eigenschaften **in ihrer Reihenfolge**, und eine Verbreitung
 * vervielfacht die laufende Liste um die Gestaltungen dessen, was sie
 * verbreitet. Der letzte Schlüssel gewinnt, wie in JavaScript:
 * `{ ...rest, position: "relative" }` ist lesbar, `{ position: "relative",
 * ...rest }` ist es nicht.
 *
 * @param {ts.ObjectLiteralExpression} objekt
 * @returns {Array<{ werte: Map<string, string>; lageUnlesbar: string[]; ausdehnungUnlesbar: string[] }>}
 */
const stilAmElement = (objekt) => {
  /** Eine leere Gestaltung — nichts gesetzt, nichts unlesbar. */
  const leere = () => ({ werte: new Map(), lageUnlesbar: [], ausdehnungUnlesbar: [] });
  /** Legt eine Gestaltung **über** eine andere; der spätere Schlüssel gewinnt. */
  const ueber = (unten, oben) => {
    const werte = new Map(unten.werte);
    let lageUnlesbar = [...unten.lageUnlesbar];
    let ausdehnungUnlesbar = [...unten.ausdehnungUnlesbar];
    if (oben.werte.has('position')) lageUnlesbar = [];
    if ([...oben.werte.keys()].some((name) => AUSDEHNUNG.has(name))) ausdehnungUnlesbar = [];
    for (const [name, wert] of oben.werte) werte.set(name, wert);
    return {
      werte,
      lageUnlesbar: [...lageUnlesbar, ...oben.lageUnlesbar],
      ausdehnungUnlesbar: [...ausdehnungUnlesbar, ...oben.ausdehnungUnlesbar],
    };
  };
  let gestaltungen = [leere()];
  for (const eigenschaft of objekt.properties) {
    /*
     * **Die Verbreitung.** Was sie verbreitet, wird gelesen wie eine
     * Stilangabe für sich — ist es lesbar, ist die Verbreitung kein Befund;
     * ist es ein Dreiweg, sind es zwei Gestaltungen; ist es ein Name, ist es
     * unlesbar und wird gemeldet.
     */
    if (ts.isSpreadAssignment(eigenschaft)) {
      const innen = stilGestalten(eigenschaft.expression);
      gestaltungen =
        innen.length === 0
          ? gestaltungen
          : gestaltungen.flatMap((unten) => innen.map((oben) => ueber(unten, oben)));
      continue;
    }
    /*
     * **Die Kurzform** `{ width, height }` ist ein benanntes Paar mit einem
     * Namen als Wert — lesbar im Namen, unlesbar im Wert. Sie als „keine
     * benannte Angabe" zu führen war der Fehler, der `Primitives.tsx:271`
     * gemeldet hat.
     */
    const rohName = ts.isShorthandPropertyAssignment(eigenschaft)
      ? eigenschaft.name.text
      : ts.isPropertyAssignment(eigenschaft) &&
          (ts.isIdentifier(eigenschaft.name) || ts.isStringLiteral(eigenschaft.name))
        ? eigenschaft.name.text
        : null;
    if (rohName === null) {
      const unbekannt = leere();
      unbekannt.lageUnlesbar.push('eine Angabe, deren Name dieser Lauf nicht liest');
      unbekannt.ausdehnungUnlesbar.push('eine Angabe, deren Name dieser Lauf nicht liest');
      gestaltungen = gestaltungen.map((unten) => ueber(unten, unbekannt));
      continue;
    }
    const name = rohName.startsWith('--')
      ? rohName
      : rohName.replace(/[A-Z]/g, (buchstabe) => `-${buchstabe.toLowerCase()}`);
    if (name !== 'position' && !AUSDEHNUNG.has(name)) continue;
    const wert = ts.isPropertyAssignment(eigenschaft) ? eigenschaft.initializer : undefined;
    const einzeln = leere();
    if (wert !== undefined && (ts.isStringLiteral(wert) || ts.isNoSubstitutionTemplateLiteral(wert))) {
      einzeln.werte.set(name, wert.text.trim().toLowerCase());
    } else if (wert !== undefined && ts.isNumericLiteral(wert)) {
      einzeln.werte.set(name, wert.text === '0' ? '0' : `${wert.text}px`);
    } else {
      const gestalt =
        wert === undefined
          ? `\`${name}\` steht als Kurzform und zeigt auf einen Namen`
          : `\`${name}\` steht als \`${wert.getText().replace(/\s+/g, ' ').slice(0, 48)}\``;
      if (name === 'position') einzeln.lageUnlesbar.push(gestalt);
      else einzeln.ausdehnungUnlesbar.push(gestalt);
      /*
       * Ein unlesbarer Wert **löscht** den lesbaren davor: `{ position:
       * "relative", position: x }` ist `x`. Das trägt {@link ueber} nicht, weil
       * dort nur gesetzte Werte gewinnen — hier steht es ausdrücklich.
       */
      gestaltungen = gestaltungen.map((g) => {
        const kopie = { werte: new Map(g.werte), lageUnlesbar: [...g.lageUnlesbar], ausdehnungUnlesbar: [...g.ausdehnungUnlesbar] };
        kopie.werte.delete(name);
        return kopie;
      });
    }
    gestaltungen = gestaltungen.map((unten) => ueber(unten, einzeln));
  }
  return gestaltungen;
};

/**
 * Die **Gestaltungen** einer Stilangabe — ein Dreiweg ist zwei, nicht eine.
 *
 * `style={x ? { … } : { … }}` steht heute in `showcase/FoundationsSection.tsx`
 * und ist zweimal dieselbe Fläche in zwei Zuständen. Wer das als „kein Objekt,
 * das dieser Lauf liest" meldet, hat einen Wächter mit falschen Treffern
 * gebaut. Wer es schweigend übergeht, hat wieder über eine Schreibweise
 * geurteilt. Gelesen wird deshalb **jeder Zweig für sich**, und die Fläche gilt
 * als fensterfest, wenn **ein** Zweig es ist.
 *
 * Ein Zweig, der gar keine Stilangabe ist (`undefined`, `null`, `false`), ist
 * keine Gestaltung und kein Befund. Alles übrige — ein Name, ein Aufruf, eine
 * Abbildung — ist unlesbar **für Lage und Ausdehnung zugleich** und wird
 * gemeldet, sobald es fensterfest sein könnte (A-A-119).
 *
 * @param {ts.Expression | undefined} ausdruck
 * @returns {Array<{ werte: Map<string, string>; lageUnlesbar: string[]; ausdehnungUnlesbar: string[] }>}
 */
const stilGestalten = (ausdruck) => {
  if (ausdruck === undefined) return [];
  if (ts.isParenthesizedExpression(ausdruck) || ts.isAsExpression(ausdruck)) {
    return stilGestalten(ausdruck.expression);
  }
  if (
    ausdruck.kind === ts.SyntaxKind.NullKeyword ||
    ausdruck.kind === ts.SyntaxKind.FalseKeyword ||
    (ts.isIdentifier(ausdruck) && ausdruck.text === 'undefined')
  ) {
    return [];
  }
  if (ts.isObjectLiteralExpression(ausdruck)) return stilAmElement(ausdruck);
  if (ts.isConditionalExpression(ausdruck)) {
    return [...stilGestalten(ausdruck.whenTrue), ...stilGestalten(ausdruck.whenFalse)];
  }
  if (ts.isBinaryExpression(ausdruck)) {
    const art = ausdruck.operatorToken.kind;
    if (art === ts.SyntaxKind.AmpersandAmpersandToken) return stilGestalten(ausdruck.right);
    if (art === ts.SyntaxKind.QuestionQuestionToken || art === ts.SyntaxKind.BarBarToken) {
      return [...stilGestalten(ausdruck.left), ...stilGestalten(ausdruck.right)];
    }
  }
  const gestalt =
    `die Stilangabe steht als \`${ausdruck.getText().replace(/\s+/g, ' ').slice(0, 48)}\` und ist ` +
    'an dieser Stelle kein Objekt, das dieser Lauf rechnen kann';
  return [{ werte: new Map(), lageUnlesbar: [gestalt], ausdehnungUnlesbar: [gestalt] }];
};

/** Die vier physischen Kanten einer Gestaltung, Kurzformen aufgelöst. */
const physischeKanten = (stil) => {
  /** @type {Map<string, string | null>} */
  const physisch = new Map();
  for (const [name, wert] of stil.werte) {
    if (!AUSDEHNUNG.has(name)) continue;
    for (const [lang, roh] of langformen(name, wert)) physisch.set(lang, roh);
  }
  return physisch;
};

/** Beansprucht diese Stilangabe am Element, am Fenster zu hängen? */
const stilIstFensterfest = (stil) =>
  stil !== null && stil.werte.get('position') === 'fixed' && volleAusdehnung(physischeKanten(stil));

/**
 * **Könnte** diese Stilangabe am Fenster hängen?
 *
 * Die Frage, an der die Befunde aus A-A-119 hängen. Sie ist ausdrücklich nicht
 * „ist unlesbar" — `style={{ width: size, height: size }}` ist unlesbar und
 * kann trotzdem niemals fensterfest sein, weil keine Lage darin steht. Gemeldet
 * wird die Möglichkeit und nicht die Unlesbarkeit:
 *
 *  - die Lage ist unlesbar **oder** heißt `fixed`, **und**
 *  - die Ausdehnung ist unlesbar **oder** deckt die Fläche.
 */
const koennteFensterfest = (stil) => {
  if (stil === null) return false;
  const lage = stil.werte.get('position');
  if (stil.lageUnlesbar.length === 0 && lage !== 'fixed') return false;
  return stil.ausdehnungUnlesbar.length > 0 || volleAusdehnung(physischeKanten(stil));
};

/** Die Stilangaben eines JSX-Elements — eine je Gestaltung. */
const jsxStilOf = (opening) => {
  for (const attribute of opening.attributes.properties) {
    if (attributeName(attribute) !== 'style') continue;
    const initializer = attribute.initializer;
    if (initializer === undefined || !ts.isJsxExpression(initializer)) continue;
    return stilGestalten(initializer.expression);
  }
  return [];
};

/**
 * Regel G über einen Bestand — den echten oder einen erfundenen.
 *
 * **Beides geht durch dieselbe Funktion**, wie bei Regel F: Die Gegenproben
 * reichen eine Kunstquelle **statt** des Bestandes hinein und nicht **neben**
 * ihn (E-094 Punkt 1).
 *
 * @param {ReadonlyArray<ts.SourceFile>} quellen
 * @param {ReadonlySet<string>} klassen Die Menge aus dem Stilblatt.
 */
const findScrimsWithoutPortal = (quellen, klassen) => {
  /** @type {Array<{ wo: string; tag: string; klasse: string; verankert: boolean }>} */
  const flaechen = [];
  /** @type {string[]} */
  const befunde = [];
  const urteile = (knoten, tag, gefundene) => {
    const wo = positionOf(knoten);
    const anker = portalAnkerOf(knoten);
    flaechen.push({ wo, tag, klasse: gefundene, verankert: anker.verankert });
    if (anker.verankert) return;
    befunde.push(
      `${wo} — <${tag}> trägt ${gefundene} und ${anker.grund}. ` +
        'Eine Bestätigungsfläche hängt am Fenster, nie an dem, was sie bestätigt (A-A-109)',
    );
  };
  /** @param {ReadonlyArray<{ werte: Map<string, string>; lageUnlesbar: string[]; ausdehnungUnlesbar: string[] }>} gestaltungen */
  const melde = (knoten, tag, gestaltungen) => {
    for (const stil of gestaltungen) {
      /*
       * **Nur was fensterfest sein könnte.** Eine unlesbare Angabe, aus der
       * keine fensterfeste Fläche werden kann, ist kein Befund — sonst meldete
       * dieser Lauf jede Zeile `style={{ width: size }}` im Bestand, und ein
       * Wächter mit falschen Treffern wird abgeschaltet.
       *
       * Ist sie **sicher** fensterfest, urteilt {@link urteile} darüber als
       * Fläche; die Unlesbarkeit daneben wäre dann eine zweite Meldung zur
       * selben Sache.
       */
      if (!koennteFensterfest(stil) || stilIstFensterfest(stil)) continue;
      for (const satz of [...stil.lageUnlesbar, ...stil.ausdehnungUnlesbar]) {
        befunde.push(
          `${positionOf(knoten)} — die Stilangabe an <${tag}> ist an dieser Stelle nicht lesbar: ${satz}. ` +
            'Eine Lage, die erst zur Laufzeit entsteht, kann `fixed` sein — sie wird gemeldet und ' +
            'nicht übergangen (A-A-119, A-A-121)',
        );
      }
    }
  };
  /** Eine Fläche ist fensterfest, wenn **eine** ihrer Gestaltungen es ist. */
  const irgendwoFensterfest = (gestaltungen) => gestaltungen.some(stilIstFensterfest);
  const behandle = (knoten, tag, klassenAmKnoten, gestaltungen) => {
    melde(knoten, tag, gestaltungen);
    const gefundene = klassenAmKnoten.find((token) => klassen.has(token));
    if (gefundene !== undefined) {
      urteile(knoten, tag, `die Klasse \`${gefundene}\``);
      return;
    }
    if (irgendwoFensterfest(gestaltungen)) {
      urteile(knoten, tag, 'eine fensterfeste Stilangabe am Element');
    }
  };
  for (const file of quellen) {
    walk(file, (node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        behandle(node, tagNameOf(node), classTokensOf(node), jsxStilOf(node));
        return;
      }
      const ohneJsx = elementAusAufruf(node);
      if (ohneJsx === null) return;
      behandle(node, ohneJsx.tag, ohneJsx.klassen, stilGestalten(ohneJsx.stil));
    });
  }
  return { flaechen, befunde };
};

/**
 * Eine Kunstquelle für die Gegenproben — ohne den echten Baum.
 *
 * Die Einfuhr steht **immer** davor: Ohne sie wäre jedes `createPortal` darin
 * seit A-A-112 keines mehr, und die Hälfte „meldet die richtige Bauart nicht"
 * wäre grün aus dem falschen Grund. Wer die Gestalt mit dem **eigenen**
 * `createPortal` prüfen will, erklärt ihn in der Quelle — die örtliche
 * Erklärung verdeckt die Einfuhr, genau wie im Bestand.
 */
const kunstQuelle = (quelltext) => [parse('kunst.tsx', `${KUNST_EINFUHR}${quelltext}`)];

/** Die Menge, gegen die die Gegenproben von Regel G messen. */
const KUNST_ABDUNKLUNGEN = new Set([SCRIM_CLASS]);

/* 7a Regel H — Abbrechen ist nie Zustimmung (A-25.6, T-347 G-6)        */

/**
 * ## Der fünfte Teilsatz, und warum er eine eigene Regel braucht
 *
 * A-25.6 hat fünf Teilsätze: eine Bestätigungsfläche *hängt am Fenster*, ist
 * *vollständig sichtbar*, *rollt nicht weg*, *fängt den Tastaturfokus* — und
 * *Abbrechen ist nie Zustimmung*. Regel G trägt den ersten. Der letzte ist
 * keine Frage der Fläche, sondern des **Weges**, und T-347 hat ihn mit einer
 * Zeile gebrochen: `onDismiss` rief `onConfirm`, `Escape` wurde zur Zustimmung,
 * und der Lauf blieb 34/0 grün (G-6).
 *
 * ## Die Menge, an der **Handlung** aufgespannt — seit T-359 (A-A-122)
 *
 * Ein **Absageweg** ist, was der Benutzer auslöst, um *nicht* zu bestätigen.
 * T-348 hat davon drei **Schreibweisen** geerntet: die drei Attributnamen
 * `onDismiss`/`onCancel`/`onClose` und den Zweig hinter `x === "Escape"`.
 * T-357 hat mit vier Gestalten gemessen, daß das die halbe Handlung ist —
 * jede bei `tsc` Exit 0 und 45/0 grün, die Zahl der Absagewege unverändert 91:
 *
 *   `if (event.key !== "Escape") return; onConfirm();`   (H-1) — gar kein Weg
 *   `switch (event.key) { case "Escape": onConfirm(); }` (H-2) — gar kein Weg
 *   derselbe Weg unter dem Namen `onRequestClose`        (H-3) — 92 Wege, Befund ungesehen
 *   `["Escape", "Esc"].includes(event.key)`              (H-4) — gar kein Weg
 *
 * Geerntet wird deshalb an der Handlung:
 *
 *  - **jedes** JSX-Attribut, dessen Name ein Rückruf ist und auf ein Schließen,
 *    Abbrechen, Verwerfen oder Ablehnen deutet ({@link istAbsageAttribut}) —
 *    nicht drei aufgeschriebene Namen;
 *  - **jeder** Rumpf, den die Taste `Escape` erreicht ({@link escapeZweige}),
 *    gleich ob über `===`, `!==` mit Wächterklausel, `!`, `switch`/`case`,
 *    einen Listenvergleich oder eine örtliche Zwischenveränderliche. Bei einer
 *    Verneinung ist der Weg der **Gegenzweig**: Hinter `if (key !== "Escape")
 *    return;` steht der Rest des Rumpfes, und genau dort stand H-1.
 *
 * Ein **Zustimmungsrückruf** ist ein Name aus {@link ZUSTIMMUNG_NAMEN}. Die
 * Menge ist an der Benennung aufgespannt und nicht an einer Datei: Wer eine
 * neue Bestätigung baut, trifft sie, ohne hier etwas einzutragen.
 *
 * ## Wie weit gelesen wird
 *
 * Erreichbar heißt: unmittelbar genannt, oder über eine **örtliche** Funktion
 * derselben Datei. Der Aufrufgraph ist grob — er nimmt aus dem Rumpf einer
 * Funktion **jeden** Bezeichner, nicht nur den gerufenen. Das meldet zuviel und
 * nie zuwenig, und genau in diese Richtung darf ein Wächter irren.
 *
 * **Was er nicht kann**, und beides ist eine Grenze der Ernte, nicht der
 * Auflösung:
 *
 *  - Ein Rückruf, der über eine **fremde Datei**, über eine Abbildung oder über
 *    einen Zustandshaken zurückkommt.
 *  - Ein Absageweg, den **die Taste nicht benennt** und den kein Attributname
 *    verrät: ein Klick auf die Abdunklung, der über einen Vergleich von
 *    `event.target` läuft, oder ein Rückruf, der `onQuit` heißt. Wer einen
 *    solchen Namen einführt, trägt ihn in {@link ABSAGE_WORT} nach.
 */
const ZUSTIMMUNG_NAMEN = /^on(?:Confirm|Accept|Apply)$/;

/** Die Wörter, an denen ein Rückruf als Absageweg zu erkennen ist. */
const ABSAGE_WORT = /(?:dismiss|cancel|close|abort|reject|deny|escape|backdrop|outside)/i;

/**
 * Ist dieser Attributname ein Absageweg?
 *
 * Verlangt wird die Gestalt eines Rückrufs (`on` + Großbuchstabe) **und** ein
 * Wort, das auf ein Schließen deutet — `onRequestClose` und `onCloseRequest`
 * treffen beide, `closeOnEscape` (ein Schalter, kein Rückruf) keines.
 */
const istAbsageAttribut = (name) => /^on[A-Z][A-Za-z]*$/.test(name) && ABSAGE_WORT.test(name.slice(2));

/** Die Tastennamen, die eine Absage auslösen. */
const ABSAGE_TASTEN = new Set(['Escape', 'Esc']);

/** Ist diese Anweisung ein Sprung — und der Rest des Rumpfes damit der Gegenzweig? */
const istSprung = (anweisung) => {
  if (anweisung === undefined) return false;
  if (ts.isBlock(anweisung)) return anweisung.statements.some(istSprung);
  return (
    ts.isReturnStatement(anweisung) ||
    ts.isBreakStatement(anweisung) ||
    ts.isContinueStatement(anweisung) ||
    ts.isThrowStatement(anweisung)
  );
};

/** Die Anweisungen **hinter** dieser im selben Block. */
const geschwisterNach = (anweisung) => {
  const eltern = anweisung.parent;
  if (
    eltern === undefined ||
    !(ts.isBlock(eltern) || ts.isSourceFile(eltern) || ts.isCaseClause(eltern) || ts.isDefaultClause(eltern))
  ) {
    return [];
  }
  const liste = [...eltern.statements];
  const index = liste.indexOf(anweisung);
  return index < 0 ? [] : liste.slice(index + 1);
};

/**
 * Der Rumpf, den ein Zweig erreicht — gerechnet, nicht geraten.
 *
 * @param {ts.Node} traeger Der Knoten, in dessen Bedingung die Taste steht.
 * @param {boolean} negiert
 * @returns {{ knoten: ts.Node[]; wie: string } | null}
 */
const zweigVon = (traeger, negiert) => {
  if (ts.isIfStatement(traeger)) {
    if (!negiert) return { knoten: [traeger.thenStatement], wie: 'der Zweig hinter `Escape`' };
    if (traeger.elseStatement !== undefined) {
      return { knoten: [traeger.elseStatement], wie: 'der Gegenzweig einer Wächterklausel auf `Escape`' };
    }
    if (!istSprung(traeger.thenStatement)) return null;
    const rest = geschwisterNach(traeger);
    return rest.length === 0
      ? null
      : { knoten: rest, wie: 'der Rumpf hinter einer Wächterklausel auf `Escape`' };
  }
  if (ts.isConditionalExpression(traeger)) {
    return negiert
      ? { knoten: [traeger.whenFalse], wie: 'der Gegenzweig eines Dreiwegs auf `Escape`' }
      : { knoten: [traeger.whenTrue], wie: 'der Zweig hinter `Escape`' };
  }
  if (ts.isCaseClause(traeger)) {
    if (negiert) return null;
    const klauseln = [...traeger.parent.clauses];
    /** @type {ts.Node[]} */
    const gesammelt = [];
    for (let i = klauseln.indexOf(traeger); i >= 0 && i < klauseln.length; i += 1) {
      gesammelt.push(...klauseln[i].statements);
      if (klauseln[i].statements.length > 0) break;
    }
    return gesammelt.length === 0 ? null : { knoten: gesammelt, wie: 'der Fall `Escape` in einem `switch`' };
  }
  return null;
};

/**
 * Von einem Tastennamen zu dem Rumpf, den er erreicht.
 *
 * Der Aufstieg trägt **die Verneinung mit**: `!==`, `!=` und `!` drehen den
 * Zweig um, und ein umgedrehter Zweig hinter einem Sprung ist der Rest des
 * Rumpfes. Ohne diese Buchführung wäre `if (key !== "Escape") return;` gar
 * kein Absageweg — H-1, gemessen bei 45/0 grün.
 *
 * Eine Zwischenveränderliche wird **eine** Stufe weit verfolgt:
 * `const abbruch = key === "Escape";` und danach `if (abbruch)`.
 *
 * @param {ts.StringLiteral} literal
 * @param {number} tiefe
 * @returns {{ knoten: ts.Node[]; wie: string } | null}
 */
const zweigZurTaste = (literal, tiefe = 0) => {
  let kind = literal;
  let eltern = literal.parent;
  let negiert = false;
  while (eltern !== undefined) {
    if (ts.isParenthesizedExpression(eltern) || ts.isAsExpression(eltern)) {
      kind = eltern;
      eltern = eltern.parent;
      continue;
    }
    if (ts.isPrefixUnaryExpression(eltern) && eltern.operator === ts.SyntaxKind.ExclamationToken) {
      negiert = !negiert;
      kind = eltern;
      eltern = eltern.parent;
      continue;
    }
    if (ts.isBinaryExpression(eltern)) {
      const art = eltern.operatorToken.kind;
      if (
        art === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        art === ts.SyntaxKind.ExclamationEqualsToken
      ) {
        negiert = !negiert;
      }
      kind = eltern;
      eltern = eltern.parent;
      continue;
    }
    if (
      ts.isCallExpression(eltern) ||
      ts.isPropertyAccessExpression(eltern) ||
      ts.isElementAccessExpression(eltern) ||
      ts.isArrayLiteralExpression(eltern)
    ) {
      kind = eltern;
      eltern = eltern.parent;
      continue;
    }
    if (
      (ts.isIfStatement(eltern) || ts.isConditionalExpression(eltern) || ts.isCaseClause(eltern)) &&
      (ts.isCaseClause(eltern) ? eltern.expression : ts.isIfStatement(eltern) ? eltern.expression : eltern.condition) ===
        kind
    ) {
      return zweigVon(eltern, negiert);
    }
    /*
     * Eine Stufe über eine örtliche Veränderliche — `const abbruch = key ===
     * "Escape"` und danach `if (abbruch)`. Mehr nicht: Ein Wächter, der einem
     * Namen beliebig weit folgt, mißt am Ende den Aufrufgraphen und nicht mehr
     * den Absageweg.
     */
    if (tiefe < 1 && ts.isVariableDeclaration(eltern) && ts.isIdentifier(eltern.name)) {
      const name = eltern.name.text;
      const gesucht = [];
      walk(eltern.getSourceFile(), (knoten) => {
        if (ts.isIdentifier(knoten) && knoten.text === name && knoten !== eltern.name) gesucht.push(knoten);
      });
      for (const stelle of gesucht) {
        const weiter = zweigZurTaste(/** @type {ts.StringLiteral} */ (stelle), tiefe + 1);
        if (weiter !== null) return weiter;
      }
      return null;
    }
    return null;
  }
  return null;
};

/**
 * Jeder Rumpf einer Datei, den die Taste `Escape` erreicht — einmal je Rumpf,
 * gleich wie viele Schreibweisen auf ihn zeigen.
 *
 * @param {ts.SourceFile} file
 */
const escapeZweige = (file) => {
  /** @type {Map<string, { knoten: ts.Node[]; wie: string }>} */
  const zweige = new Map();
  walk(file, (node) => {
    if (!ts.isStringLiteral(node) || !ABSAGE_TASTEN.has(node.text)) return;
    const gefunden = zweigZurTaste(node);
    if (gefunden === null || gefunden.knoten.length === 0) return;
    const erster = gefunden.knoten[0];
    zweige.set(`${String(erster.pos)}:${String(erster.end)}`, gefunden);
  });
  return [...zweige.values()];
};

/** Jeder Bezeichner, der in diesem Teilbaum vorkommt. */
const bezeichnerIn = (node) => {
  const namen = new Set();
  walk(node, (kind) => {
    if (ts.isIdentifier(kind)) namen.add(kind.text);
  });
  return namen;
};

/**
 * Die örtlichen Funktionen einer Datei, auf die Bezeichner ihres Rumpfes
 * abgebildet.
 *
 * @type {WeakMap<ts.SourceFile, Map<string, Set<string>>>}
 */
const oertlicheRuempfeCache = new WeakMap();

const oertlicheRuempfeOf = (file) => {
  const gemerkt = oertlicheRuempfeCache.get(file);
  if (gemerkt !== undefined) return gemerkt;
  const gefunden = new Map();
  const merke = (name, rumpf) => {
    const bisher = gefunden.get(name) ?? new Set();
    for (const bezeichner of bezeichnerIn(rumpf)) bisher.add(bezeichner);
    gefunden.set(name, bisher);
  };
  walk(file, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name !== undefined && node.body !== undefined) {
      merke(node.name.text, node.body);
      return;
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined
    ) {
      merke(node.name.text, node.initializer);
    }
  });
  oertlicheRuempfeCache.set(file, gefunden);
  return gefunden;
};

/**
 * Erreicht dieser Ausdruck einen Zustimmungsrückruf?
 *
 * @returns {string | null} Der erreichte Name, oder `null`.
 */
const erreichteZustimmung = (ausdruck) => {
  const ruempfe = oertlicheRuempfeOf(ausdruck.getSourceFile());
  const offen = [...bezeichnerIn(ausdruck)];
  const gesehen = new Set();
  while (offen.length > 0) {
    const name = offen.pop();
    if (name === undefined || gesehen.has(name)) continue;
    gesehen.add(name);
    if (ZUSTIMMUNG_NAMEN.test(name)) return name;
    for (const weiter of ruempfe.get(name) ?? []) {
      if (!gesehen.has(weiter)) offen.push(weiter);
    }
  }
  return null;
};

/**
 * Regel H über einen Bestand — den echten oder einen erfundenen.
 *
 * @param {ReadonlyArray<ts.SourceFile>} quellen
 */
const findDismissThatConfirms = (quellen) => {
  /** @type {Array<{ wo: string; art: string }>} */
  const wege = [];
  /** @type {string[]} */
  const befunde = [];
  /**
   * Ein Absageweg — ein Ort, an dem der Benutzer *nicht* bestätigt hat.
   *
   * Der Weg ist **ein** Weg, auch wenn er aus mehreren Anweisungen besteht:
   * Hinter `if (key !== "Escape") return;` steht der ganze Rest des Rumpfes,
   * und das ist eine Handlung und nicht drei. Gezählt wird deshalb einmal je
   * Weg; gemeldet wird beim ersten Knoten, der eine Zustimmung erreicht.
   *
   * @param {ReadonlyArray<ts.Node>} knoten
   */
  const urteile = (knoten, art, wie) => {
    const erster = knoten[0];
    if (erster === undefined) return;
    const wo = positionOf(erster);
    wege.push({ wo, art });
    for (const teil of knoten) {
      const erreicht = erreichteZustimmung(teil);
      if (erreicht === null) continue;
      befunde.push(
        `${wo} — ${wie} erreicht \`${erreicht}\`. Abbrechen ist nie Zustimmung: Wer wegklickt oder ` +
          'Escape drückt, hat nicht bestätigt (A-25.6, A-A-113, A-A-122)',
      );
      return;
    }
  };
  for (const file of quellen) {
    /*
     * **Der erste Weg: der Rückruf, dessen Name auf ein Schließen deutet.**
     *
     * Gelesen wird die Gestalt (`on` + Großbuchstabe) und das Wort, nicht eine
     * Liste von drei Namen: `onRequestClose` war H-3 und hob die Zahl der Wege
     * von 91 auf 92, ohne daß der Befund darin gesehen wurde.
     */
    walk(file, (node) => {
      if (!ts.isJsxAttribute(node) || !ts.isIdentifier(node.name)) return;
      if (!istAbsageAttribut(node.name.text)) return;
      const wert = node.initializer;
      if (wert !== undefined) urteile([wert], node.name.text, `der Absageweg \`${node.name.text}\``);
    });
    /*
     * **Der zweite Weg: die Taste.** Gerechnet wird der Rumpf, den sie
     * erreicht — über `===`, über `!==` mit Wächterklausel, über `!`, über
     * `switch`/`case`, über einen Listenvergleich und über eine örtliche
     * Zwischenveränderliche. Das ist die Handlung; die Schreibweise davor ist
     * es nicht (A-A-122).
     */
    for (const { knoten, wie } of escapeZweige(file)) urteile(knoten, 'Escape', wie);
  }
  return { wege, befunde };
};

/* 8  Die Prüfungen über den Bestand                                    */

process.stdout.write(
  `Takt — die Bauart der Oberfläche (T-191)\n` +
    `${String(sources.length)} Quelldateien unter apps/web/src\n`,
);

heading('A  Eine Live-Region entsteht nicht zusammen mit ihrem Inhalt (B-5, O-GQ)');

check('kein `role="alert"`/`role="status"`/`aria-live`, das aus seiner eigenen Bedingung entsteht', () => {
  const findings = parsedSources.flatMap(findLiveRegionsBornWithContent);
  assert.deepEqual(
    findings,
    [],
    `Eine Region, die eine Vorlesehilfe erst mit ihrer Meldung kennenlernt, sagt nichts an:\n        ${findings.join('\n        ')}`,
  );
});

heading('B  Ein Fehlertext steht in einer Live-Region (SC 4.1.3, O-GQ)');

check('jeder HTML-Knoten mit einem Meldungsklassennamen ist eine Live-Region oder steht in einer', () => {
  const findings = parsedSources.flatMap(findMessagesWithoutAnnouncement);
  assert.deepEqual(
    findings,
    [],
    `Ein Fehlertext ohne Rolle erscheint stumm:\n        ${findings.join('\n        ')}`,
  );
});

heading('C  Das Stilblatt nimmt keine leere Live-Region aus dem Baum (O-GQ)');

/*
 * **Die Stilblätter werden im ganzen Quellbaum gesucht, nicht in `src/styles`**
 * (T-249-2).
 *
 * Bis dahin stand hier `readdirSync(styleRoot)` auf `apps/web/src/styles` —
 * ein fester Ordnername **und** eine einzige Ebene. Beides bricht am
 * featureweisen Umbau: Zieht `components.css` nach `features/board/`, findet
 * der Lauf es nicht mehr; legt jemand `styles/kanban/spalte.css` an, verliert
 * er es stillschweigend, ohne dass irgendetwas rot wird. Ein Stilblatt, das
 * eine Live-Region verbirgt, wäre dann unsichtbar — genau die Fläche, die
 * dieser Abschnitt bewacht.
 *
 * Gelesen wird deshalb rekursiv ab `src`, und die Menge trägt ihre eigene
 * Untergrenze: Ohne ein einziges Stilblatt ist die Prüfung darunter leer wahr.
 */
const styleFiles = requireAtLeast(
  readTreeSync(srcRoot, (name) => name.endsWith('.css'), 'die Stilblätter der Oberfläche').map(
    (entry) => ({ name: entry.name, text: readFileSync(entry.path, 'utf8') }),
  ),
  1,
  'Stilblätter',
  srcRoot,
);

check('kein `display: none` und kein `visibility: hidden` auf einer Live-Region', () => {
  const classes = liveRegionClasses();
  assert.ok(classes.size > 0, 'keine einzige Live-Region gefunden — dann mißt diese Regel nichts');
  const findings = styleFiles.flatMap((sheet) =>
    findHiddenLiveRegions(sheet.name, sheet.text, classes),
  );
  assert.deepEqual(
    findings,
    [],
    `Ein verborgenes Element steht nicht im Baum der Vorlesehilfe:\n        ${findings.join('\n        ')}`,
  );
});

heading('D  Takt siezt, auch in der Oberfläche (E-080, O-GW)');

check('kein „du", „dir", „dich", „dein" in einem sichtbaren Text', () => {
  const treffer = [];
  for (const { datei, text } of visibleTexts()) {
    const fund = withoutExceptions(text).match(ANREDE_DU_GLOBAL);
    if (fund !== null) treffer.push(`${datei}: ${[...new Set(fund)].join(', ')}`);
  }
  assert.deepEqual(treffer, [], `E-080 Punkt 1: Takt siezt, überall:\n        ${treffer.join('\n        ')}`);
});

check('kein Imperativ ohne Fürwort in einem sichtbaren Text', () => {
  const treffer = [];
  for (const { datei, text } of visibleTexts()) {
    const fund = withoutExceptions(text).match(ANREDE_IMPERATIV_GLOBAL);
    if (fund !== null) treffer.push(`${datei}: ${[...new Set(fund)].join(', ')}`);
  }
  assert.deepEqual(
    treffer,
    [],
    `E-080 Punkt 1: Takt siezt, auch ohne Fürwort:\n        ${treffer.join('\n        ')}`,
  );
});

check('die geduldeten Sätze stehen noch da — sonst sind die Ausnahmen fällig', () => {
  /*
   * Die Ausnahmen lösen sich selbst auf. Verschwindet einer der Sätze
   * aus der Oberfläche, schlägt dieser Prüffall fehl — und die Ausnahme
   * gehört dann gelöscht, nicht angepaßt. Ohne diese Hälfte bliebe eine
   * geduldete Zeichenkette stehen, die nichts mehr deckt, und der nächste
   * Leser hielte sie für eine Regel.
   */
  const alle = visibleTexts();
  for (const { satz } of ANREDE_AUSNAHMEN) {
    assert.ok(
      ANREDE_DU.test(satz) || ANREDE_IMPERATIV.test(satz),
      `der Wächter sieht den geduldeten Satz nicht mehr — dann deckt die Ausnahme nichts: „${satz}"`,
    );
    const mitSatz = alle.filter(({ text }) => text.includes(satz));
    assert.equal(
      mitSatz.length,
      1,
      `der geduldete Satz steht ${String(mitSatz.length)}-mal in der Oberfläche statt einmal: „${satz}"`,
    );
  }
});

heading('E  Derselbe Anredewaechter in zwei Laeufen, gegeneinander gemessen (E-086)');

check('beide Laeufe tragen denselben Ausdruck, dieselben Wortlisten und dasselbe Urteil', () => {
  /*
   * **Beide Hälften werden fail-closed geholt** (T-249-2). Zieht der zweite
   * Lauf um, ist das kein `ENOENT` aus dem Inneren von `node:fs`, sondern ein
   * Satz, der sagt, welche Datei gesucht wurde und wofür — E-086 misst zwei
   * Fassungen derselben Regel gegeneinander, und eine Fassung, die nicht
   * gelesen werden konnte, ist keine gemessene Fassung.
   */
  const findings = compareGuards(
    guardOf(
      readRequiredFile(OWN_GUARD, 'die eine Hälfte des Anredewächters (dieser Lauf selbst)'),
      path.basename(OWN_GUARD),
    ),
    guardOf(
      readRequiredFile(ADDIN_GUARD, 'die zweite Hälfte des Anredewächters im Aufgabenbereich'),
      path.basename(ADDIN_GUARD),
    ),
  );
  assert.deepEqual(
    findings,
    [],
    'E-086: dieselbe Regel steht in zwei Laeufen und ist auseinandergelaufen. Solange das so ' +
      'bleibt, siezt Takt in der einen Haelfte des Erzeugnisses schaerfer als in der anderen — ' +
      'das ist O-GW, nur andersherum. Die Berichtigung gehoert der Datei, in der die Abweichung ' +
      'steht; dieser Lauf liest sie nur und schreibt sie nie.\n        ' +
      findings.join('\n        '),
  );
});

check('die Falltafel ist nicht stumpf — sie faellt beide Urteile', () => {
  /*
   * Eine Tafel, die nur Treffer enthaelt, misst die halbe Regel. Gemessen
   * wird deshalb an der eigenen Seite, dass jedes der vier Urteile
   * (Anrede/Imperativ, Treffer/kein Treffer) mindestens einmal vorkommt.
   */
  const eigen = guardOf(readFileSync(OWN_GUARD, 'utf8'), path.basename(OWN_GUARD));
  const urteile = ANREDE_FALLTAFEL.map((satz) => verdictOf(eigen, satz));
  for (const teil of ['du', 'imperativ']) {
    assert.ok(
      urteile.some((urteil) => urteil[teil]) && urteile.some((urteil) => !urteil[teil]),
      `die Falltafel faellt fuer „${teil}" nur ein einziges Urteil — dann misst sie nichts`,
    );
  }
});

heading('F  Jedes direkte Kind von `.app` trägt eine Rasterzuordnung (T-214, O-JH)');

const rasterErnte = findChildrenWithoutGridArea({
  quellen: parsedSources,
  blaetter: styleFiles,
});

check('die Ernte steht vor der Zusage: eine Hülle, Kinder, aufgelöste Knoten (E-094 Punkt 3)', () => {
  /*
   * Zuerst die Menge, dann das Urteil. Fände der Sammler kein `.app`, keine
   * Kinder oder keinen einzigen konkreten Knoten, wäre die Regel darunter
   * leer wahr — und der Lauf grün, gerade weil er nichts gemessen hat.
   */
  assert.equal(rasterErnte.wirte, 1, `.${SHELL_CLASS} steht ${String(rasterErnte.wirte)}-mal statt einmal`);
  assert.ok(rasterErnte.kinder > 0, 'null direkte Kinder gefunden — das darf kein `ok` sein');
  assert.ok(
    rasterErnte.traeger.length > 0,
    'null konkrete Knoten aufgelöst — dann urteilt die Regel darunter über nichts',
  );
  assert.ok(
    rasterErnte.platziert.size > 0,
    'null Rasterzuordnungen in den Stilblättern gefunden — dann mißt der Sammler die Stilblätter nicht',
  );
});

check('kein selbstplatziertes Kind — jedes trägt eine Fläche oder liegt außerhalb des Flusses', () => {
  assert.deepEqual(
    rasterErnte.befunde,
    [],
    'Ein Kind ohne Zuordnung setzt CSS Grid selbst, und zwar lautlos (T-214: 240 px breit in der ' +
      `Spur der Seitenleiste):\n        ${rasterErnte.befunde.join('\n        ')}`,
  );
});

check('der Portalzweig von Regel F wird wirklich begangen — sonst mißt er nichts', () => {
  /*
   * Dieselbe Bauart wie die Falltafel darunter: Der Ausgang löst sich selbst
   * auf. Findet der Sammler kein einziges Portal mehr, liest der Zweig nicht
   * mehr, was er lesen soll — das ist rot, nicht `ok`.
   *
   * **Und es ist ausdrücklich keine Zusage über die Abdunklungen.** Diese Zeile
   * war bis T-341 als solche geführt (`portale > 0`) und hat vier Rückkehr-
   * gestalten durchgelassen; sie mißt die Menge dieses Zweiges und sonst nichts.
   * Die Zusage steht bei Regel G.
   */
  assert.ok(
    rasterErnte.portale > 0,
    'kein einziges `createPortal(…, document.body)` unter .app erreicht — dann ist der Zweig ' +
      'in Regel F toter Text',
  );
});

check('jeder Durchreicher wird wirklich passiert — sonst gehört er gelöscht', () => {
  /*
   * Dieselbe Bauart wie die geduldeten Sätze bei Regel D: Die Tafel löst sich
   * selbst auf. Ein Eintrag, den der Sammler nie erreicht, macht keinen
   * Bestand sicherer — er macht nur eine künftige Wurzel unsichtbar.
   */
  for (const { name } of DURCHREICHER) {
    assert.ok(
      rasterErnte.durchgereicht.has(name),
      `der Durchreicher <${name}> steht in der Tafel, wird aber nirgends passiert`,
    );
  }
});

heading('G  Jede gezeichnete Abdunklung hängt am Dokumentkörper (A-A-109, A-A-112, R-32, E-116)');

const stilErklaerungen = cssErklaerungen(styleFiles);
const fensterfesteErnte = fensterfesteKlassen(styleFiles);
const abdunklungsKlassen = fensterfesteErnte.klassen;
const koerperBlock = koerperBlockBefunde(styleFiles);
const scrimErnte = findScrimsWithoutPortal(parsedSources, abdunklungsKlassen);

check('der Stilblattleser liest wirklich — die Menge steht vor dem Urteil (E-094 Punkt 3)', () => {
  /*
   * **Die unterste Stufe von Regel G, und seit T-359 die verletzlichste.**
   *
   * Bis dahin stand zwischen den Stilblättern und der Frage „beansprucht diese
   * Klasse, am Fenster zu hängen?" ein regulärer Ausdruck; ein Tippfehler darin
   * hätte die Menge geleert und den Lauf grün gelassen. Jetzt steht dort ein
   * Zerleger mit Rahmen, Bedingungsgruppen, Verschachtelung und
   * Variablenauflösung — mehr Code, mehr Stellen, an denen er stumm werden
   * kann. Ein Zerleger, der nichts mehr zerlegt, liefert eine leere Menge, und
   * über der leeren Menge ist jede Zusage darunter wahr.
   *
   * Deshalb misst diese Zeile die **Ausbeute** und nicht die Regel: Werden aus
   * sieben Stilblättern keine Erklärungen mehr, ist das rot, bevor irgendeine
   * Aussage über Abdunklungen fällt.
   */
  assert.ok(
    stilErklaerungen.length > 500,
    `aus ${String(styleFiles.length)} Stilblättern nur ${String(stilErklaerungen.length)} Erklärungen ` +
      'gelesen — dann urteilt der Rest dieser Regel über eine Menge, die der Zerleger verloren hat',
  );
  assert.ok(
    stilErklaerungen.some((e) => e.eigenschaft === 'position'),
    'nicht eine einzige `position`-Erklärung im ganzen Bestand — der Zerleger liest die Eigenschaft ' +
      'nicht mehr, an der diese Regel ihre Menge aufspannt',
  );
  assert.ok(
    stilErklaerungen.some((e) => e.bedingungen.length > 0),
    'nicht eine einzige Erklärung unter einer `@media`/`@supports`-Bedingung — dann kennt der ' +
      'Zerleger die Gestaltungen nicht, je Gestaltung zu messen wäre eine leere Zusage (A-A-120)',
  );
});

check('die Menge kommt aus dem Stilblatt — und `scrim` steht darin (T-347 G-5, G-8)', () => {
  /*
   * **Die Menge steht vor der Ernte.** Bis T-348 stand hier ein fester Name;
   * zwei Gestalten haben ihn ausgehebelt, ohne daß eine Zeile rot wurde: eine
   * zweite Abdunklung unter einem zweiten Klassennamen (G-5) und
   * `.scrim { position: static }` (G-8) — das Portal blieb, die Eigenschaft
   * fiel, und der Lauf meldete weiter „1 von 1 verankert".
   *
   * Beide Fälle sind mit **einer** Zeile zu: Die geprüfte Menge wird aus den
   * Stilblättern gelesen, und `scrim` muß darin **vorkommen**. Verliert die
   * Klasse ihre Fensterfestigkeit, fällt sie aus der Menge — und dieser
   * Prüffall wird rot, statt daß die Regel still über weniger urteilt.
   */
  assert.ok(
    abdunklungsKlassen.size > 0,
    `keine einzige Klasse mit \`position: fixed\` und voller Ausdehnung in ${String(styleFiles.length)} ` +
      'Stilblättern gefunden — dann spannt diese Regel ihre Menge über nichts auf',
  );
  assert.ok(
    abdunklungsKlassen.has(SCRIM_CLASS),
    `\`.${SCRIM_CLASS}\` beansprucht im Stilblatt nicht mehr, am Fenster zu hängen ` +
      `(gefunden: ${[...abdunklungsKlassen].sort().join(', ')}). Ein Portal ohne ` +
      '`position: fixed` verankert nichts — die Zusage dieser Regel wäre dann eine über einen Ort ' +
      'im Quelltext und nicht über eine Fläche (A-25.6, T-347 G-8)',
  );
});

check('keine Gestaltung widerruft die Fensterfestigkeit — je Palette gemessen (A-A-120)', () => {
  /*
   * **Die falsche Zusage, die T-357 als N-6b gemessen hat.**
   *
   * Bis T-359 entstand die Menge aus der **Vereinigung** aller sieben
   * Stilblätter. Eine Palette, die die Eigenschaft später widerrief, nahm die
   * Klasse nicht heraus — die Grundregel stand ja weiter in `components.css`.
   * Im Browser lag die Abdunklung unter `:root[data-design-theme="glass"]
   * .scrim { position: static }` bei **(0, 820)**, also unter dem Fenster, der
   * Knopf bei y = 874; der Lauf meldete dazu „1, davon 1 verankert". Das ist
   * eine **falsche** Zusage, nicht eine fehlende — die Gattung, die T-347 als
   * die schwerste benannt hat.
   *
   * „In jeder Gestaltung" wird deshalb **je Gestaltung** gerechnet: je Palette,
   * je Medienabfrage, je `@supports`. Und was dieser Lauf an Lage oder
   * Ausdehnung nicht auf eine Konstante bringt, steht in derselben Liste
   * (A-A-119) — melden statt übergehen.
   */
  assert.deepEqual(
    fensterfesteErnte.befunde,
    [],
    'Eine Bestätigungsfläche hängt in **jeder** Gestaltung am Fenster, oder sie hängt nicht am ' +
      `Fenster:\n        ${fensterfesteErnte.befunde.join('\n        ')}`,
  );
});

check('zwischen Abdunklung und Fenster steht kein umschließender Block (A-A-120, T-357 N-7)', () => {
  /*
   * Die Voraussetzung, auf der Regel G ruht, als Messung statt als Satz.
   *
   * Regel G urteilt über eine **Stelle im Quelltext** — die Fläche steht im
   * gezeichneten Argument eines `createPortal(…, document.body)`. Daraus folgt
   * eine Verankerung am Fenster nur, solange zwischen Fläche und Fenster nichts
   * steht, und dort stehen genau zwei Elemente: `<body>` und `<html>`. Trägt
   * eines davon `transform`, `filter`, `backdrop-filter`, `contain: paint` oder
   * `container-type`, ist der umschließende Block dieses Element, und das
   * Portal verankert nichts mehr.
   *
   * T-357 hat diesen Weg gemessen und **heute wirkungslos** gefunden: Der
   * Körperkasten ist so groß wie das Fenster. Wirkungslos ist nicht dasselbe
   * wie unmöglich — sobald der Körper darüber hinausreicht, ist es R-31 eine
   * Ebene höher. Deshalb steht die Voraussetzung hier und nicht in einem
   * Bericht.
   */
  assert.ok(
    koerperBlock.koerperErklaerungen > 0,
    'dieser Leser findet auf `body`, `html` und `:root` keine einzige Erklärung — dann liest er die ' +
      'Verbindung nicht mehr, und die Zusage darunter wäre leer wahr aus dem falschen Grund',
  );
  assert.deepEqual(
    koerperBlock.befunde,
    [],
    'Der umschließende Block jeder festen Fläche wäre dann der Dokumentkörper und nicht mehr das ' +
      `Fenster:\n        ${koerperBlock.befunde.join('\n        ')}`,
  );
});

check('die Ernte steht vor der Zusage: es gibt überhaupt eine Abdunklung (E-094 Punkt 3)', () => {
  /*
   * Zuerst die Menge, dann das Urteil — und die Menge ist **die eigene**, nicht
   * die von Regel F geborgte (T-339: „Jede Zusicherung zählt ihre eigene
   * Menge"). Fände dieser Lauf keine einzige Fläche mit der Klasse, wäre die
   * Regel darunter leer wahr: Ein umbenannter Klassenname, eine verschobene
   * Datei, ein Tippfehler — und der Lauf meldete grün, gerade weil er nichts
   * gemessen hat. Genau diese Gestalt ist in diesem Bestand dreimal vorgekommen
   * (E-099, E-111, AK-01 in T-326).
   */
  assert.ok(
    scrimErnte.flaechen.length > 0,
    `keine einzige Fläche mit einer der Klassen ${[...abdunklungsKlassen].sort().join(', ')} in ` +
      `${String(parsedSources.length)} Quelldateien gefunden — dann urteilt die Regel darunter über nichts`,
  );
});

check('jede Fläche mit der Klasse `scrim` steht in einem `createPortal(…, document.body)`', () => {
  assert.deepEqual(
    scrimErnte.befunde,
    [],
    'Eine Abdunklung, die nicht am Dokumentkörper hängt, hängt am nächsten umschließenden Block — ' +
      'gemessen in `glass`: 958 × 666 bei (297, −36333), beide Knöpfe unerreichbar (R-31):\n        ' +
      scrimErnte.befunde.join('\n        '),
  );
});

heading('H  Abbrechen ist nie Zustimmung (A-25.6, A-A-113, T-347 G-6)');

const absageErnte = findDismissThatConfirms(parsedSources);

check('die Ernte steht vor der Zusage: es gibt Absagewege und Zustimmungsrückrufe', () => {
  /*
   * Dieselbe Bauart wie bei F und G. Fände dieser Lauf keinen Absageweg, wäre
   * die Regel darunter leer wahr — und ein umbenanntes Attribut machte sie
   * lautlos wertlos.
   */
  assert.ok(
    absageErnte.wege.length > 0,
    `kein einziger Absageweg (ein Rückruf nach ${String(ABSAGE_WORT)}, oder die Taste Escape) in ` +
      `${String(parsedSources.length)} Quelldateien — dann urteilt die Regel darunter über nichts`,
  );
  const zustimmungen = new Set();
  for (const file of parsedSources) {
    for (const name of bezeichnerIn(file)) {
      if (ZUSTIMMUNG_NAMEN.test(name)) zustimmungen.add(name);
    }
  }
  assert.ok(
    zustimmungen.size > 0,
    `kein einziger Zustimmungsrückruf (${String(ZUSTIMMUNG_NAMEN)}) im Bestand — dann kann kein ` +
      'Absageweg einen erreichen, und diese Regel mißt eine leere Menge',
  );
});

check('kein Absageweg erreicht einen Zustimmungsrückruf', () => {
  assert.deepEqual(
    absageErnte.befunde,
    [],
    'A-25.6 Teilsatz 5: Eine Fläche, die beim Wegklicken oder bei `Escape` bestätigt, ist keine ' +
      `Bestätigung (T-347 G-6 war damit 34/0 grün):\n        ${absageErnte.befunde.join('\n        ')}`,
  );
});

/* 9  Die Gegenproben — jede Regel gegen eine eingesetzte Verletzung    */

/*
 * Ein Wächter, der nie rot war, ist eine Behauptung über einen Wächter. Jede
 * der fünf Regeln fährt deshalb gegen eine Quelle, die es auf der Platte nicht
 * gibt — **in beide Richtungen**: Sie muß die Verletzung finden, und sie darf
 * die richtige Bauart nicht melden. Nur die zweite Hälfte macht eine Lockerung
 * teuer.
 */

/*
 * **Ohne Buchstabe, und das ist Absicht.** Die Buchstaben A bis H benennen je
 * eine Regel über den Bestand; die Gegenproben sind keine achte Regel, sondern
 * dieselben acht gegen eine eingesetzte Verletzung. Bis T-359 stand hier ein
 * zweites „H" neben dem von Regel H — zwei Abschnitte unter demselben Namen in
 * derselben Ausgabe.
 */
heading('Gegenproben — jede Regel gegen eine eingesetzte Verletzung');

/** Wie viele Prüfungen vor den Gegenproben liefen — damit die Schlußzeile zählt statt behauptet. */
const beforeCounterProbes = passed + failed;

const ruleA = (source) => findLiveRegionsBornWithContent(parse('kunst.tsx', source));
const ruleB = (source) => findMessagesWithoutAnnouncement(parse('kunst.tsx', source));

check('Regel A findet die Bauart, die T-186 und T-191 von Hand gefunden haben', () => {
  for (const [beschreibung, quelle] of [
    ['der Dreiweg', 'const V = () => <div>{fehler ? <p role="alert">{fehler}</p> : null}</div>;'],
    ['das Und', 'const V = () => <div>{fehler && <p role="status">{fehler}</p>}</div>;'],
    ['das Oder', 'const V = () => <div>{leer || <p role="log">{fehler}</p>}</div>;'],
    ['ohne Rolle, mit `aria-live`', 'const V = () => <div>{fehler ? <p aria-live="polite">{fehler}</p> : null}</div>;'],
    ['ein `<output>`', 'const V = () => <div>{wert ? <output>{wert}</output> : null}</div>;'],
    ['der umgekehrte Zweig', 'const V = () => <div>{fehler === null ? null : <p role="alert">{fehler}</p>}</div>;'],
  ]) {
    assert.equal(ruleA(quelle).length, 1, `Regel A sieht die Verletzung nicht: ${beschreibung}`);
  }
});

check('Regel A meldet die richtige Bauart nicht', () => {
  for (const [beschreibung, quelle] of [
    [
      'die Region steht, der Inhalt kommt später',
      'const V = () => <div><div role="alert">{fehler === null ? null : <p>{fehler}</p>}</div></div>;',
    ],
    [
      'die Rolle am Absatz selbst, der Satz darin bedingt',
      'const V = () => <div><p role="status">{blockiert ? "Satz." : null}</p></div>;',
    ],
    [
      'ein ganzer Teilbaum wird getauscht',
      'const V = () => <div>{ohneHuelle ? <TextField /> : <div className="field"><div role="alert">{p}</div></div>}</div>;',
    ],
    ['ein `aria-live="off"`', 'const V = () => <div>{laeuft ? <span aria-live="off">{t}</span> : null}</div>;'],
    ['ein gewöhnlicher Knoten', 'const V = () => <div>{fehler ? <p className="hint">{fehler}</p> : null}</div>;'],
  ]) {
    assert.deepEqual(ruleA(quelle), [], `Regel A meldet die richtige Bauart: ${beschreibung}`);
  }
});

check('Regel B findet den Fehlertext ohne Rolle', () => {
  for (const [beschreibung, quelle] of [
    ['der nackte Absatz', 'const V = () => <div><p className="field__error">{fehler}</p></div>;'],
    ['über `cx`', 'const V = () => <div><p className={cx("tfield__error", eng && "x")}>{fehler}</p></div>;'],
    ['als Fehlschlag', 'const V = () => <div><span className="attachment__failure">{grund}</span></div>;'],
  ]) {
    assert.equal(ruleB(quelle).length, 1, `Regel B sieht die Verletzung nicht: ${beschreibung}`);
  }
});

check('Regel B meldet weder eine angesagte Meldung noch einen Baustein', () => {
  for (const [beschreibung, quelle] of [
    [
      'in einer Live-Region',
      'const V = () => <div><div role="alert"><p className="field__error">{fehler}</p></div></div>;',
    ],
    ['mit eigener Rolle', 'const V = () => <div><p className="field__error" role="status">{fehler}</p></div>;'],
    ['ein Baustein mit eigener Rolle', 'const V = () => <div><InlineMessage className="tags-split__error" /></div>;'],
    ['ein Eingabefeld', 'const V = () => <div><input className="field__input--invalid" /></div>;'],
  ]) {
    assert.deepEqual(ruleB(quelle), [], `Regel B meldet die richtige Bauart: ${beschreibung}`);
  }
});

check('Regel C findet das verborgene leere Meldefeld', () => {
  const klassen = new Set(['dirfield__announce', 'field__live']);
  for (const [beschreibung, quelle] of [
    ['`display: none` auf `:empty`', '.dirfield__announce:empty {\n  display: none;\n}\n'],
    ['`visibility: hidden`', '.field__live:empty {\n  visibility: hidden;\n}\n'],
    ['ohne `:empty`', '.field__live {\n  color: red;\n  display: none;\n}\n'],
  ]) {
    assert.equal(
      findHiddenLiveRegions('kunst.css', quelle, klassen).length,
      1,
      `Regel C sieht die Verletzung nicht: ${beschreibung}`,
    );
  }
});

check('Regel C meldet den richtigen Rückzug nicht', () => {
  const klassen = new Set(['dirfield__announce', 'field__live']);
  for (const [beschreibung, quelle] of [
    ['der zurückgenommene Abstand', '.dirfield__announce:empty {\n  margin-block-start: -4px;\n}\n'],
    ['eine andere Klasse', '.tpl-item__badges:empty {\n  display: none;\n}\n'],
    ['ein Namensteil, keine Klasse', '.field__live-wrapper:empty {\n  display: none;\n}\n'],
  ]) {
    assert.deepEqual(
      findHiddenLiveRegions('kunst.css', quelle, klassen),
      [],
      `Regel C meldet den richtigen Rückzug: ${beschreibung}`,
    );
  }
});

check('Regel D erkennt eine Anrede überhaupt', () => {
  for (const satz of [
    'Das Token findest du in Takt.',
    'Trage es dir dort ein.',
    'Öffne die Einstellungen und trage den Ordner ein.',
    'Gib die Call-Nummer ein.',
    'Wähle einen anderen Ordner.',
  ]) {
    assert.ok(
      ANREDE_DU.test(satz) || ANREDE_IMPERATIV.test(satz),
      `der Wächter sieht die Anrede nicht: „${satz}"`,
    );
  }
});

check('Regel D meldet kein Hauptwort und keinen Bezeichner', () => {
  /*
   * Die teurere Hälfte: Ein Wächter, der jedes Hauptwort meldet, wird beim
   * ersten Fehltreffer gelockert, und dann mißt er wieder nichts. Diese Sätze
   * stehen so oder so ähnlich in der Oberfläche.
   */
  for (const satz of [
    'Der Durchlauf endet.',
    'Kein Tag passt zu dieser Suche.',
    'Die Buchung ist offen.',
    'Der Start der Anwendung ist gescheitert.',
    'Zwei Versuche sind offen.',
    'Der Satz steht an dieser Stelle.',
    'Diese Anzeige braucht keine Direktive.',
    'Das Verzeichnis wird geprüft.',
  ]) {
    assert.equal(ANREDE_DU.test(satz), false, `der Wächter meldet ein Hauptwort: „${satz}"`);
    assert.equal(ANREDE_IMPERATIV.test(satz), false, `der Wächter meldet ein Hauptwort: „${satz}"`);
  }
});

check('Regel D mißt Text und keine Bezeichner', () => {
  /*
   * Der Grund, warum hier der Zerleger und nicht der rohe Quelltext gemessen
   * wird ({@link visibleTexts}). Ohne diese Gegenprobe wäre die Umstellung auf
   * den Zerleger eine Behauptung — und die naheliegende „Verbesserung", doch
   * wieder über den Dateitext zu messen, fiele niemandem auf.
   */
  const quelle = parse(
    'kunst.tsx',
    'const dir = readDirectory();\nconst V = () => <p title="Ein Verzeichnis">{dir}</p>;\n',
  );
  const parts = [];
  walk(quelle, (node) => {
    if (ts.isJsxText(node) || ts.isStringLiteral(node)) parts.push(node.text);
  });
  assert.equal(ANREDE_DU.test(parts.join('\n')), false, 'der Bezeichner `dir` steht im gemessenen Text');
  assert.equal(ANREDE_DU.test('const dir = readDirectory();'), true, 'die Gegenprobe mißt am falschen Text');
});

check('Regel E meldet zwei zeichengleiche Seiten nicht', () => {
  const gleich = kunstWaechter();
  assert.deepEqual(
    compareGuards(guardOf(gleich, 'links'), guardOf(gleich, 'rechts')),
    [],
    'Regel E meldet zwei Seiten, die Zeichen fuer Zeichen dieselben sind',
  );
});

check('Regel E findet eine eingesetzte Abweichung auf jeder der beiden Seiten', () => {
  /*
   * E-086 Punkt 3: in **beide** Richtungen. Eine Abweichung nur links zu
   * messen liesse einen Lauf durch, der die fremde Datei gar nicht liest.
   */
  const eng = kunstWaechter();
  const weit = kunstWaechter({ grenze: String.raw`(?![\wäöüß])` });
  for (const [beschreibung, links, rechts] of [
    ['die hintere Grenze fehlt links', weit, eng],
    ['die hintere Grenze fehlt rechts', eng, weit],
    ['ein Wort weniger links', kunstWaechter({ stamm: "'Trag'" }), eng],
    ['ein Wort weniger rechts', eng, kunstWaechter({ stamm: "'Trag'" })],
    ['dieselben Woerter, andere Reihenfolge', eng, kunstWaechter({ stamm: "'Prüf', 'Trag'" })],
    ['ein anderes Wort in der zweiten Liste', eng, kunstWaechter({ woertlich: "'Nimm'" })],
  ]) {
    const findings = compareGuards(guardOf(links, 'links'), guardOf(rechts, 'rechts'));
    assert.ok(findings.length > 0, `Regel E sieht die Abweichung nicht: ${beschreibung}`);
  }
});

check('Regel F findet das Kind ohne Rasterzuordnung — auch hinter zwei Bausteinen (T-214)', () => {
  /*
   * Der letzte Fall ist der von T-214, Zeichen für Zeichen nachgestellt: Die
   * Leiste steht nicht als `<div>` unter `.app`, sondern hinter einer
   * Bedingung **und** einem Baustein. Ein Sammler, der nur die unmittelbaren
   * HTML-Kinder ansähe, bliebe hier grün — und genau das war zwei Wellen lang
   * der Fall.
   */
  for (const [beschreibung, kinder] of [
    ['der nackte Knoten', '    <div className="leiste-ohne" />'],
    ['ganz ohne Klasse', '    <div />'],
    ['hinter einer Bedingung', '    {offen ? <div className="leiste-ohne" /> : null}'],
    [
      'hinter einem Baustein',
      '    <Leiste />\n  </div>\n);\nconst Leiste = () => <div className="leiste-ohne" />;\nconst Rest = () => (\n  <div>',
    ],
    [
      'hinter Bedingung und Baustein — der Fall T-214',
      '    {shell === null ? null : <Hinweis />}\n  </div>\n);\n' +
        'function Hinweis() {\n  if (leer) return null;\n  return <div className="leiste-ohne" />;\n}\nconst Rest = () => (\n  <div>',
    ],
    [
      'in einem Bruchstück',
      '    <Gruppe />\n  </div>\n);\nconst Gruppe = () => (\n  <>\n    <div className="app__side" />\n    <div className="leiste-ohne" />\n  </>\n);\nconst Rest = () => (\n  <div>',
    ],
    [
      'nur unter einem fremden Vorfahren platziert',
      '    <div className="fremd" />',
    ],
  ]) {
    const { befunde } = findChildrenWithoutGridArea(kunstHuelle(kinder, KUNST_CSS));
    assert.equal(befunde.length, 1, `Regel F sieht die Verletzung nicht: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('Regel F meldet die richtige Bauart nicht', () => {
  /*
   * Die teurere Hälfte. Ohne sie wäre die Regel mit einer Zeile zu erfüllen,
   * die alles meldet — und würde binnen einer Welle gelockert.
   */
  for (const [beschreibung, kinder] of [
    ['die bloße Klassenregel', '    <div className="app__side" />'],
    ['die unter `.app` verankerte Regel', '    <div className="leiste" />'],
    ['aus dem Fluß genommen', '    <div className="abdunklung" />'],
    ['zwei Klassen, eine trägt', '    <div className="etwas leiste" />'],
    ['hinter einer Bedingung, aber zugeordnet', '    {offen ? <div className="leiste" /> : null}'],
    ['beide Zweige zugeordnet', '    {offen ? <div className="leiste" /> : <div className="app__side" />}'],
    ['ein `null`-Zweig', '    {offen ? null : <div className="leiste" />}'],
    ['ein Kommentar zwischen den Kindern', '    {/* ein Wort dazu */}\n    <div className="leiste" />'],
    [
      'ein Baustein mit zugeordneter Wurzel',
      '    <Leiste />\n  </div>\n);\nconst Leiste = () => <div className="leiste" />;\nconst Rest = () => (\n  <div>',
    ],
    [
      'ein Durchreicher zwischen Baustein und Knoten',
      '    <Dialog.Root>\n      <div className="abdunklung" />\n    </Dialog.Root>',
    ],
    [
      'ein Portal an den Dokumentkörper — es verläßt das Raster (A-A-108)',
      '    <Abdunklung />\n  </div>\n);\nconst Abdunklung = () =>\n  createPortal(<div className="ohne-zuordnung" />, document.body);\nconst Rest = () => (\n  <div>',
    ],
  ]) {
    const { befunde } = findChildrenWithoutGridArea(kunstHuelle(kinder, KUNST_CSS));
    assert.deepEqual(befunde, [], `Regel F meldet die richtige Bauart: ${beschreibung}`);
  }
});

check('Regel F schweigt nicht über das, was sie nicht lesen kann', () => {
  /*
   * Der Kern von E-094 Punkt 3, auf den Sammler angewandt: Ein Wirt, den der
   * Lauf nicht findet, ist ein Befund und kein stilles Weiter. Ohne diese
   * Gegenprobe wäre der Sammler an jedem unbekannten Baustein still grün —
   * die bequemste aller Lockerungen.
   */
  for (const [beschreibung, kinder] of [
    ['ein Baustein ohne Erklärung', '    <Fremd />'],
    [
      'zwei Erklärungen desselben Namens',
      '    <Leiste />\n  </div>\n);\nconst Leiste = () => <div className="leiste" />;\nfunction Leiste() {\n  return <div className="leiste" />;\n}\nconst Rest = () => (\n  <div>',
    ],
    ['ein Aufruf statt eines Knotens', '    {baueLeiste()}'],
    ['JSX links vom `||`', '    {<div className="leiste" /> || null}'],
    ['roher Text', '    Ein Wort'],
    [
      'ein Baustein, der sich selbst als Wurzel zeichnet',
      '    <Leiste />\n  </div>\n);\nfunction Leiste() {\n  return <Leiste />;\n}\nconst Rest = () => (\n  <div>',
    ],
    [
      'ein Portal an ein anderes Ziel als den Dokumentkörper',
      '    <Abdunklung />\n  </div>\n);\nconst Abdunklung = () =>\n  createPortal(<div className="ohne-zuordnung" />, wirt.current);\nconst Rest = () => (\n  <div>',
    ],
    [
      'ein Portal ohne Ziel',
      '    <Abdunklung />\n  </div>\n);\nconst Abdunklung = () =>\n  createPortal(<div className="ohne-zuordnung" />);\nconst Rest = () => (\n  <div>',
    ],
  ]) {
    const { befunde } = findChildrenWithoutGridArea(kunstHuelle(kinder, KUNST_CSS));
    assert.ok(befunde.length > 0, `Regel F schweigt über: ${beschreibung}`);
  }
});

check('Regel F glaubt dem Namen `createPortal` nicht mehr — A-A-112 (T-347 G-7)', () => {
  /*
   * **Dieselben vier Zeilen wie bei Regel G, und dieselbe Behebung.** Ein
   * eigener `createPortal` nahm ein beliebiges direktes Kind von `.app` aus
   * dieser Regel heraus: Der Lauf blieb grün und meldete in seiner Schlußzeile
   * „7 direkte Kinder … 4 durch ein Portal am Dokumentkörper" — der Portalzähler
   * stieg von 3 auf 4, während gar nichts portaliert wurde.
   *
   * Gemessen wird an **beiden** Zahlen: Der Befund muß stehen, **und** der
   * Zähler darf nicht steigen. Ohne die zweite Hälfte bliebe die Falschzählung
   * in der Schlußzeile, auch wenn der Lauf rot wäre.
   */
  const kunst = (kinder) => ({
    quellen: [parse('kunst.tsx', `const App = () => (\n  <div className="app">\n${kinder}\n  </div>\n);\n`)],
    blaetter: [{ name: 'kunst.css', text: KUNST_CSS }],
  });
  for (const [beschreibung, kinder] of [
    [
      'ein eigener `createPortal` als Veränderliche',
      '    <Fremdband />\n  </div>\n);\nconst createPortal = (knoten, _ziel) => knoten;\n' +
        'const Fremdband = () =>\n  createPortal(<div className="ohne-zuordnung" />, document.body);\nconst Rest = () => (\n  <div>',
    ],
    [
      'derselbe Name als Funktionserklärung',
      '    <Fremdband />\n  </div>\n);\nfunction createPortal(knoten, _ziel) {\n  return knoten;\n}\n' +
        'const Fremdband = () =>\n  createPortal(<div className="ohne-zuordnung" />, document.body);\nconst Rest = () => (\n  <div>',
    ],
  ]) {
    const ernte = findChildrenWithoutGridArea(kunst(kinder));
    assert.equal(ernte.befunde.length, 1, `Regel F glaubt dem Namen: ${beschreibung}\n${ernte.befunde.join('\n')}`);
    assert.equal(ernte.portale, 0, `der Portalzähler steigt an einem fremden Namen: ${beschreibung}`);
  }
  /*
   * Die teurere Hälfte: Mit der Einfuhr ist es wieder ein Portal, der Zähler
   * steigt, und der Befund bleibt aus.
   */
  const echt = findChildrenWithoutGridArea(
    kunstHuelle(
      '    <Abdunklung />\n  </div>\n);\nconst Abdunklung = () =>\n  createPortal(<div className="ohne-zuordnung" />, document.body);\nconst Rest = () => (\n  <div>',
      KUNST_CSS,
    ),
  );
  assert.deepEqual(echt.befunde, [], 'Regel F meldet das echte Portal');
  assert.equal(echt.portale, 1, 'der Portalzähler zählt das echte Portal nicht');
});

check('Regel F ist rot, wenn der Sammler nichts erntet (E-094 Punkt 3)', () => {
  /*
   * Die Kehrseite: Ein Sammler, der nichts findet, meldet keine Befunde — und
   * ohne diese Probe hieße das `ok`. Gemessen wird deshalb an den **Zählern**,
   * durch dieselbe Funktion wie der Bestand.
   */
  const ohneHuelle = findChildrenWithoutGridArea({
    quellen: [parse('kunst.tsx', 'const V = () => <div className="etwas" />;\n')],
    blaetter: [{ name: 'kunst.css', text: KUNST_CSS }],
  });
  assert.equal(ohneHuelle.wirte, 0, 'die Kunstquelle trägt eine Hülle, die sie nicht tragen sollte');
  assert.deepEqual(ohneHuelle.befunde, [], 'ohne Hülle gibt es nichts zu melden — und genau das ist die Gefahr');

  const leereHuelle = findChildrenWithoutGridArea(kunstHuelle('', KUNST_CSS));
  assert.equal(leereHuelle.wirte, 1, 'die leere Hülle wird nicht gefunden');
  assert.equal(leereHuelle.kinder, 0, 'die leere Hülle hat Kinder');
  assert.deepEqual(leereHuelle.befunde, [], 'eine leere Hülle meldet nichts — die Zähler tragen das Urteil');

  const ohneBlatt = findChildrenWithoutGridArea({
    quellen: kunstHuelle('    <div className="leiste" />', KUNST_CSS).quellen,
    blaetter: [],
  });
  assert.equal(ohneBlatt.platziert.size, 0, 'ohne Stilblatt findet der Sammler eine Zuordnung');
  assert.equal(ohneBlatt.befunde.length, 1, 'ohne Stilblatt bleibt das zugeordnete Kind unbeanstandet');
});

check('die Falltafel traegt und nicht nur der Textvergleich', () => {
  /*
   * Der Textvergleich allein wuerde die hintere Grenze schon melden. Diese
   * Gegenprobe verlangt, dass **auch** die Falltafel anschlaegt — sonst
   * bliebe sie stehen, ohne je etwas gefunden zu haben, und der naechste
   * Leser hielte sie fuer eine Messung.
   */
  const findings = compareGuards(
    guardOf(kunstWaechter(), 'links'),
    guardOf(kunstWaechter({ grenze: String.raw`(?![\wäöüß])` }), 'rechts'),
  );
  assert.ok(
    findings.some((satz) => satz.startsWith('Falltafel')),
    'die Falltafel meldet nichts, obwohl beide Seiten verschieden urteilen',
  );
});

check('Regel G findet die vier Rückkehrgestalten, die 28/0 grün waren (R-32)', () => {
  /*
   * Die ersten vier Fälle sind die gemessenen Mutationen aus T-336 und T-337,
   * zeichengleich in ihrer Bauart nachgestellt: der Baustein durch ein rohes
   * `<div>` ersetzt (einmal mit `cx`, wie der Baustein selbst schreibt), und
   * die Abdunklung frei im Rumpf einer Kartenansicht. Die drei danach sind die
   * halben Portale — ein falsches Ziel, ein fehlendes Ziel, und die Fläche im
   * **Ziel** statt im gezeichneten Baum.
   */
  for (const [beschreibung, quelle] of [
    ['das rohe <div> statt <Scrim> (M-A1)', 'const V = () => <div className="scrim" role="alertdialog">{kind}</div>;'],
    [
      'dasselbe mit `cx`, wie der Baustein es schreibt (M-A2)',
      'const V = () => <div className={cx("scrim", className)}>{kind}</div>;',
    ],
    [
      'im Rumpf einer Karte, wo R-31 gemessen wurde (K-8)',
      'const Anhaenge = () => (\n  <div className="card">\n    <div className="scrim">{frage}</div>\n  </div>\n);',
    ],
    [
      'hinter einer Bedingung, wie jeder Dialog sie trägt',
      'const V = () => <div>{offen ? <div className="scrim">{kind}</div> : null}</div>;',
    ],
    [
      'ein Portal an ein anderes Ziel',
      'const V = () => createPortal(<div className="scrim">{kind}</div>, wirt.current);',
    ],
    ['ein Portal ohne Ziel', 'const V = () => createPortal(<div className="scrim">{kind}</div>);'],
    [
      'die Fläche steht im **Ziel** statt im gezeichneten Baum',
      'const V = () => createPortal(inhalt, <div className="scrim" />);',
    ],
  ]) {
    const { befunde, flaechen } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.equal(flaechen.length, 1, `die Kunstquelle trägt keine einzige Fläche: ${beschreibung}`);
    assert.equal(befunde.length, 1, `Regel G sieht die Verletzung nicht: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('Regel G meldet die richtige Bauart nicht', () => {
  /*
   * Die zweite Hälfte, und erst sie macht eine Lockerung teuer: Die Bauart, die
   * `Scrim` heute hat — mit `cx`, mit Kindern, mit `ReactDOM.` davor und mit
   * einem Komma am Ende — darf **nicht** gemeldet werden. Ein Wächter, der alles
   * meldet, wird beim ersten roten Lauf entschärft.
   */
  for (const [beschreibung, quelle] of [
    [
      'der heutige Baustein, zeichengleich',
      'export function Scrim({ className, children }) {\n  return createPortal(\n' +
        '    <div className={cx("scrim", className)} onKeyDown={onKeyDown}>\n      {children}\n    </div>,\n' +
        '    document.body,\n  );\n}',
    ],
    [
      'mit `ReactDOM.` davor — die Vorgabeeinfuhr desselben Moduls',
      'import ReactDOM from "react-dom";\n' +
        'const V = () => ReactDOM.createPortal(<div className="scrim">{kind}</div>, document.body);',
    ],
    [
      'über einen Namensraum desselben Moduls',
      'import * as ReactDom from "react-dom";\n' +
        'const V = () => ReactDom.createPortal(<div className="scrim">{kind}</div>, document.body);',
    ],
    [
      'die Abdunklung tief im gezeichneten Baum',
      'const V = () =>\n  createPortal(\n    <div className="portalwurzel">\n      <div className="scrim">{kind}</div>\n    </div>,\n    document.body,\n  );',
    ],
    [
      'in Klammern gesetzt',
      'const V = () => createPortal((<div className="scrim">{kind}</div>), document.body);',
    ],
  ]) {
    const { befunde, flaechen } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.equal(flaechen.length, 1, `die Kunstquelle trägt keine einzige Fläche: ${beschreibung}`);
    assert.deepEqual(befunde, [], `Regel G meldet die richtige Bauart: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('Regel G unterscheidet den Namen und nicht bloß das Vorkommen', () => {
  /*
   * `scrim--blocking` ist der **Zusatz**, den ein Aufrufer an `Scrim` reicht,
   * und `scrimmage` ist gar nichts. Würde die Regel auf ein Vorkommen prüfen
   * statt auf den Wortlaut des Klassennamens, meldete sie beide — und wäre
   * damit in der einen Richtung falsch, in der sie es sich nicht leisten kann:
   * Ein Wächter mit falschen Treffern wird abgeschaltet.
   */
  for (const quelle of [
    'const V = () => <div className="scrim--blocking">{kind}</div>;',
    'const V = () => <div className="scrimmage">{kind}</div>;',
    'const V = () => <div className="unterscrim">{kind}</div>;',
  ]) {
    const { flaechen } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.equal(flaechen.length, 0, `Regel G hält \`${quelle}\` für eine Abdunklung`);
  }
});

check('Regel G ist rot, wenn der Sammler nichts erntet (E-094 Punkt 3)', () => {
  /*
   * Die Kehrseite, und dieselbe Bauart wie bei Regel F: Eine Quelle ohne jede
   * Abdunklung meldet keine Befunde — ohne diese Probe hieße das `ok`. Gemessen
   * wird am **Zähler**, durch dieselbe Funktion wie der Bestand.
   */
  const leer = findScrimsWithoutPortal(kunstQuelle('const V = () => <div className="etwas" />;\n'), KUNST_ABDUNKLUNGEN);
  assert.equal(leer.flaechen.length, 0, 'die Kunstquelle trägt eine Abdunklung, die sie nicht tragen sollte');
  assert.deepEqual(leer.befunde, [], 'ohne Abdunklung gibt es nichts zu melden — und genau das ist die Gefahr');
});

check('Regel G glaubt dem Namen `createPortal` nicht mehr — A-A-112, beide Richtungen', () => {
  /*
   * **Die schwerste Bauart, und die einzige, die eine *falsche* Zusage war.**
   * Vier Zeilen mit einem eigenen `createPortal` brachten den Lauf dazu,
   * „2, davon 2 verankert" zu melden, während die Fläche an ihrer Karte hing
   * (T-347 G-4). Ein Lauf, der eine Verankerung behauptet, die es nicht gibt,
   * wird zitiert — deshalb steht A-A-112 vor allen anderen Auflagen.
   *
   * Gemessen wird **beidseitig**: Die vier Gestalten unten müssen rot sein, und
   * die Bauart des Bestandes darf es nicht — letzteres trägt der Prüffall
   * „meldet die richtige Bauart nicht" drei Zeilen weiter oben, der seit T-348
   * die Einfuhr wirklich führt.
   */
  for (const [beschreibung, quelle] of [
    [
      'ein eigener `createPortal`, der nichts portaliert (G-4)',
      'const createPortal = (knoten, _ziel) => knoten;\n' +
        'const V = () => createPortal(<div className="scrim">{kind}</div>, document.body);',
    ],
    [
      'derselbe eigene Name als Funktionserklärung',
      'function createPortal(knoten, _ziel) {\n  return knoten;\n}\n' +
        'const V = () => createPortal(<div className="scrim">{kind}</div>, document.body);',
    ],
    [
      'ein `createPortal` aus einem anderen Modul',
      'import { createPortal } from "./eigenes-portal";\n' +
        'const V = () => createPortal(<div className="scrim">{kind}</div>, document.body);',
    ],
    [
      'ein fremder Träger vor dem Punkt',
      'const Eigen = { createPortal: (knoten) => knoten };\n' +
        'const V = () => Eigen.createPortal(<div className="scrim">{kind}</div>, document.body);',
    ],
  ]) {
    /*
     * **Ohne die Einfuhr von {@link kunstQuelle}**: Die ersten beiden Gestalten
     * erklären den Namen selbst, und nebeneinander wären beide ein
     * Übersetzungsfehler. Gemessen wird deshalb die Quelle, wie sie im Bestand
     * stünde.
     */
    const { befunde, flaechen } = findScrimsWithoutPortal(
      [parse('kunst.tsx', quelle)],
      KUNST_ABDUNKLUNGEN,
    );
    assert.equal(flaechen.length, 1, `die Kunstquelle trägt keine einzige Fläche: ${beschreibung}`);
    assert.equal(befunde.length, 1, `Regel G glaubt dem Namen: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('Regel G liest den Kopf einer Vorlagenzeichenkette und eine Konstante (T-346, G-1, G-2)', () => {
  /*
   * Die erste Gestalt **stand schon im Baum** (`PoolAdministration.tsx:142`,
   * mit einem anderen Klassennamen) — sie ist keine erfundene. Die zweite ist
   * die Zwischenstufe darunter: ein Name, der auf eine Zeichenkette zeigt.
   *
   * Beide Richtungen stehen darunter: Ein Wortteil, der `scrim` **nicht** ist,
   * darf nicht gemeldet werden, sonst wäre die Erweiterung eine Einladung zur
   * Lockerung.
   */
  for (const [beschreibung, quelle] of [
    ['der Kopf einer Vorlagenzeichenkette (G-1)', 'const V = () => <div className={`scrim ${zusatz}`}>{kind}</div>;'],
    ['das Ende einer Vorlagenzeichenkette', 'const V = () => <div className={`${zusatz} scrim`}>{kind}</div>;'],
    ['die Mitte einer Vorlagenzeichenkette', 'const V = () => <div className={`${a} scrim ${b}`}>{kind}</div>;'],
    [
      'eine Zeichenkettenkonstante derselben Datei (G-2)',
      'const ABDUNKLUNG = "scrim";\nconst V = () => <div className={ABDUNKLUNG}>{kind}</div>;',
    ],
    [
      'dieselbe Konstante in einer Vorlagenzeichenkette',
      'const ABDUNKLUNG = "scrim";\nconst V = () => <div className={`${ABDUNKLUNG} weit`}>{kind}</div>;',
    ],
  ]) {
    const { befunde, flaechen } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.equal(flaechen.length, 1, `die Kunstquelle trägt keine einzige Fläche: ${beschreibung}`);
    assert.equal(befunde.length, 1, `Regel G sieht die Verletzung nicht: ${beschreibung}\n${befunde.join('\n')}`);
  }
  for (const [beschreibung, quelle] of [
    ['ein anderer Name im Kopf', 'const V = () => <div className={`scrimmage ${zusatz}`}>{kind}</div>;'],
    [
      'eine Konstante mit einem anderen Wert',
      'const ABDUNKLUNG = "dialog";\nconst V = () => <div className={ABDUNKLUNG}>{kind}</div>;',
    ],
    [
      'im Portal, mit Vorlagenzeichenkette',
      'const V = () => createPortal(<div className={`scrim ${zusatz}`}>{kind}</div>, document.body);',
    ],
  ]) {
    const { befunde } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.deepEqual(befunde, [], `Regel G meldet die richtige Bauart: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('Regel G sieht die Abdunklung auch ohne JSX (T-347 G-3)', () => {
  /*
   * `createElement` ist die Schreibweise, in die jeder Übersetzer das JSX
   * ohnehin überführt. Ein Wächter, der nur `jsxOpenings` erntet, mißt eine
   * Schreibweise und nicht den Baum.
   */
  for (const [beschreibung, quelle] of [
    [
      'der nackte Aufruf',
      'const V = () => createElement("div", { className: "scrim" }, kind);',
    ],
    [
      'mit `React.` davor',
      'const V = () => React.createElement("div", { className: "scrim" }, kind);',
    ],
    [
      'die Klasse über `cx`',
      'const V = () => createElement("div", { className: cx("scrim", zusatz) }, kind);',
    ],
  ]) {
    const { befunde, flaechen } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.equal(flaechen.length, 1, `die Kunstquelle trägt keine einzige Fläche: ${beschreibung}`);
    assert.equal(befunde.length, 1, `Regel G sieht die Verletzung nicht: ${beschreibung}\n${befunde.join('\n')}`);
  }
  for (const [beschreibung, quelle] of [
    [
      'derselbe Aufruf im Portal',
      'const V = () =>\n  createPortal(createElement("div", { className: "scrim" }, kind), document.body);',
    ],
    ['ohne Klassenangabe', 'const V = () => createElement("div", { id: "scrim" }, kind);'],
    ['ein Baustein statt eines Tags', 'const V = () => createElement(Scrim, { className: "scrim" }, kind);'],
  ]) {
    const { befunde } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.deepEqual(befunde, [], `Regel G meldet die richtige Bauart: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('die Menge trifft die Eigenschaft in jeder Schreibweise — N-1 bis N-4 (A-A-119)', () => {
  /*
   * **Die vier Gestalten, an denen die dritte Runde gescheitert ist.** Jede ist
   * dieselbe zweite Abdunklung, jede war bei `tsc` Exit 0 und `proof:surface`
   * 45/0 grün, und jede hing im Browser an ihrer Karte statt am Fenster —
   * 980 × 11 998 bei (265, −523), der Knopf bei y = 5481 (T-357 45.1a).
   *
   * Gemessen wird **einzeln**: Wer die vier zusammen in ein Stilblatt schriebe,
   * bekäme dieselbe Zusage schon von einer einzigen gelesenen Schreibweise.
   */
  const menge = (css) => [...fensterfesteKlassen([{ name: 'kunst.css', text: css }]).klassen].sort();
  for (const [beschreibung, css] of [
    [
      'N-1 — `!important` an Lage und Ausdehnung',
      '.rueckfrage-flaeche { position: fixed !important; inset: 0 !important; }',
    ],
    [
      'N-1b — `!important` nur an der Ausdehnung, mit Leerzeichen davor',
      '.rueckfrage-flaeche { position: fixed; inset: 0 ! important; }',
    ],
    [
      'N-2 — die Lage aus einer Variablen',
      ':root { --feste-lage: fixed; }\n.rueckfrage-flaeche { position: var(--feste-lage); inset: 0; }',
    ],
    [
      'N-2b — die Lage aus dem Rückfallwert einer unerklärten Variablen',
      '.rueckfrage-flaeche { position: var(--gibt-es-nicht, fixed); inset: 0; }',
    ],
    [
      'N-3 — Lage und Ausdehnung in zwei Regeln desselben Selektors',
      '.rueckfrage-flaeche { position: fixed; }\n.andere { color: red; }\n.rueckfrage-flaeche { inset: 0; }',
    ],
    [
      'N-4 — die Ausdehnung über `width`/`height` statt über vier Kanten',
      '.rueckfrage-flaeche { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; }',
    ],
    [
      'N-4b — dieselbe Ausdehnung in den neuen Einheiten',
      '.rueckfrage-flaeche { position: fixed; inset-block-start: 0; inset-inline-start: 0; width: 100dvw; height: 100dvh; }',
    ],
    [
      'N-4c — dieselbe Ausdehnung über Prozente',
      '.rueckfrage-flaeche { position: fixed; top: 0; left: 0; width: 100%; height: 100%; }',
    ],
    [
      'N-4d — die logischen Kurzformen',
      '.rueckfrage-flaeche { position: fixed; inset-block: 0; inset-inline: 0; }',
    ],
    [
      'N-4e — die logischen Langformen einzeln',
      '.rueckfrage-flaeche {\n  position: fixed;\n  inset-block-start: 0;\n  inset-block-end: 0;\n' +
        '  inset-inline-start: 0;\n  inset-inline-end: 0;\n}',
    ],
    [
      'die Eigenschaft über CSS-Verschachtelung',
      '.wirt {\n  color: red;\n  & .rueckfrage-flaeche { position: fixed; inset: 0; }\n}',
    ],
  ]) {
    assert.deepEqual(
      menge(css),
      ['rueckfrage-flaeche'],
      `die Menge sieht die Eigenschaft in dieser Schreibweise nicht: ${beschreibung}`,
    );
  }

  /*
   * Und die Gegenrichtung, die eine Lockerung teuer macht: Was **nicht**
   * beansprucht, am Fenster zu hängen, gehört nicht in die Menge. Ein Wächter,
   * der jede feste Fläche für eine Bestätigungsfläche hält, meldet die
   * Sprungmarke, die Meldungsschicht und die Inaktivitätsfrage mit.
   */
  for (const [beschreibung, css] of [
    ['nur eine Achse voll', '.a { position: fixed; top: 0; bottom: 0; left: 0; width: 12rem; }'],
    ['die Ausdehnung halb', '.a { position: fixed; top: 0; left: 0; width: 50vw; height: 50vh; }'],
    ['fest, aber an einer Ecke', '.a { position: fixed; inset-block-end: 0; inset-inline-end: 0; }'],
    ['volle Ausdehnung ohne `fixed`, auch mit `!important`', '.a { position: absolute !important; inset: 0 !important; }'],
    ['`sticky` ist nicht `fixed`', '.a { position: sticky; inset: 0; }'],
    ['eine Kante ungleich null', '.a { position: fixed; top: 1px; right: 0; bottom: 0; left: 0; }'],
    ['in einem Kommentar, über zwei Zeilen', '/* .a {\n  position: fixed;\n  inset: 0;\n} */\n.b { color: red; }'],
    ['in einer Bildfolge', '@keyframes puls {\n  from { position: fixed; inset: 0; }\n  to { opacity: 1; }\n}'],
    ['in einer Schriftart-Regel', '@font-face { font-family: x; position: fixed; inset: 0; }'],
    ['die Klasse steht in `:not()`', ':not(.a) { position: fixed; inset: 0; }'],
    ['eine Klasse, die nur in `:has()` steht', 'div:has(.a) { position: fixed; inset: 0; }'],
    ['die Klasse ist ein Vorfahr und nicht das Element', '.a div { position: fixed; inset: 0; }'],
    ['die Eigenschaft steht auf dem Körper und nicht auf einer Klasse', 'body { position: fixed; inset: 0; }'],
  ]) {
    assert.deepEqual(menge(css), [], `die Menge nimmt auf, was nicht hineingehört: ${beschreibung}`);
  }
  assert.deepEqual(
    menge('.b:has(.a) { position: fixed; inset: 0; }').concat(menge('.a .b { position: fixed; inset: 0; }')),
    ['b', 'b'],
    'aus `:has()` und aus einem Vorfahren zählt jeweils nur das Element, das die Regel erklärt',
  );
  /*
   * `:is()` und `:where()` benennen **jede** Klasse darin — so schreiben die
   * Paletten dieses Bestandes ihre Selektoren, und eine davon zu übergehen wäre
   * wieder eine Menge über eine Schreibweise.
   */
  assert.deepEqual(
    menge(':is(.rueckfrage-flaeche, .andere) { position: fixed; inset: 0; }'),
    ['andere', 'rueckfrage-flaeche'],
    'aus einer `:is()`-Liste zählt jede genannte Klasse',
  );
  assert.deepEqual(
    menge(':where(.rueckfrage-flaeche) { position: fixed; inset: 0; }'),
    ['rueckfrage-flaeche'],
    '`:where()` benennt dasselbe Element wie `:is()`',
  );
});

check('eine Gestaltung, die die Fensterfestigkeit widerruft, ist ein Befund — N-6, N-6b (A-A-120)', () => {
  /*
   * **Die falsche Zusage, nicht die fehlende.** Unter
   * `:root[data-design-theme="glass"] .scrim { position: static }` lag die
   * Abdunklung im Browser bei (0, 820) — unter dem Fenster, der Knopf bei
   * y = 874 —, und der Lauf meldete weiter „1, davon 1 verankert". Gemessen
   * wird deshalb **je Gestaltung** und nicht über die Vereinigung der Blätter.
   */
  const gelesen = (css) => fensterfesteKlassen([{ name: 'kunst.css', text: css }]);
  const grundregel = '.scrim { position: fixed; inset: 0; }\n';
  for (const [beschreibung, css] of [
    ['N-6 — eine Palette setzt `absolute`', ':root[data-design-theme="glass"] .scrim { position: absolute; }'],
    ['N-6b — eine Palette setzt `static`', ':root[data-design-theme="glass"] .scrim { position: static; }'],
    ['dieselbe Palette über `:is()`', ':root:is([data-design-theme="glass"]) .scrim { position: static; }'],
    ['eine Medienabfrage nimmt die Ausdehnung zurück', '@media (min-width: 60rem) {\n  .scrim { inset: auto; }\n}'],
    ['eine Medienabfrage nimmt eine einzelne Kante zurück', '@media (min-width: 60rem) {\n  .scrim { bottom: 4rem; }\n}'],
    ['eine `@supports`-Gruppe setzt `absolute`', '@supports (backdrop-filter: blur(1px)) {\n  .scrim { position: absolute; }\n}'],
    ['eine Schicht setzt `static`', '@layer palette {\n  .scrim { position: static; }\n}'],
    ['der Widerruf trägt `!important`', ':root[data-design-theme="glass"] .scrim { position: static !important; }'],
  ]) {
    const { klassen, befunde } = gelesen(`${grundregel}${css}`);
    assert.ok(klassen.has('scrim'), `die Grundregel fällt mit aus der Menge: ${beschreibung}`);
    assert.equal(
      befunde.length,
      1,
      `der Widerruf bleibt ungesehen: ${beschreibung}\n${befunde.join('\n')}`,
    );
  }

  /*
   * Die zweite Hälfte. Eine Palette, die die Eigenschaft **nicht** anrührt oder
   * sie ausdrücklich bestätigt, ist kein Befund — sonst wäre jede der neunzehn
   * Gestaltungen dieses Bestandes eine Meldung.
   */
  for (const [beschreibung, css] of [
    ['eine Palette färbt nur', ':root[data-design-theme="glass"] .scrim { background: #0008; }'],
    ['eine Palette bestätigt die Lage', ':root[data-design-theme="glass"] .scrim { position: fixed; }'],
    ['eine Palette schreibt dieselbe Ausdehnung anders', ':root[data-design-theme="glass"] .scrim { top: 0; right: 0; bottom: 0; left: 0; }'],
    ['eine Medienabfrage ändert nur die Deckkraft', '@media (min-width: 60rem) {\n  .scrim { opacity: 0.8; }\n}'],
    ['eine Bildfolge nennt denselben Namen', '@keyframes scrim-ein {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}'],
    ['eine Regel über einen Nachfahren der Abdunklung', '.scrim .karte { position: static; }'],
  ]) {
    const { klassen, befunde } = gelesen(`${grundregel}${css}`);
    assert.ok(klassen.has('scrim'), `die Grundregel fällt aus der Menge: ${beschreibung}`);
    assert.deepEqual(befunde, [], `die Regel meldet die richtige Bauart: ${beschreibung}\n${befunde.join('\n')}`);
  }

  /*
   * Und der Fall, in dem die Verankerung **die Ausnahme** ist: Steht die
   * Fensterfestigkeit nur in einer Palette, ist die Grundregel die Lücke.
   */
  const nurInEiner = gelesen(
    '.scrim { position: absolute; inset: 0; }\n:root[data-design-theme="glass"] .scrim { position: fixed; }',
  );
  assert.ok(nurInEiner.klassen.has('scrim'), 'eine nur in einer Gestaltung feste Fläche fällt ganz heraus');
  assert.ok(
    nurInEiner.befunde.some((satz) => satz.includes('**nur** in der Gestaltung')),
    `eine Verankerung, die die Ausnahme ist, bleibt ungesehen:\n${nurInEiner.befunde.join('\n')}`,
  );
});

check('ein unlesbarer Wert wird gemeldet, wenn er die Fläche decken könnte — A-A-119', () => {
  /*
   * **Melden statt übergehen, aber nicht melden, was gleichgültig ist.**
   *
   * Ein Wert, den dieser Lauf nicht auf eine Konstante bringt, kann `0` sein —
   * und dann deckt die Fläche das Fenster. Er wird deshalb gemeldet. Er wird
   * **nicht** gemeldet, wenn selbst die wohlwollendste Lesart die Fläche nicht
   * deckt: `.skip-link { position: fixed; top: var(--space-2); left:
   * var(--space-2) }` aus `base.css:300` hat weder `right` noch `bottom` noch
   * `width` noch `height` und kann das Fenster nie füllen, gleich welchen
   * Abstand eine Palette setzt.
   */
  const befunde = (css) => fensterfesteKlassen([{ name: 'kunst.css', text: css }]).befunde;
  for (const [beschreibung, css] of [
    [
      'die Ausdehnung hängt an einer Variablen, die jede Palette anders setzt',
      ':root { --rand: 0; }\n:root[data-design-theme="glass"] { --rand: 2rem; }\n' +
        '.a { position: fixed; inset: var(--rand); }',
    ],
    [
      'die Lage hängt an einer solchen Variablen',
      ':root { --lage: fixed; }\n:root[data-design-theme="glass"] { --lage: static; }\n' +
        '.a { position: var(--lage); inset: 0; }',
    ],
    [
      'die Ausdehnung steht als Rechnung',
      '.a { position: fixed; top: 0; left: 0; width: calc(100vw - var(--rand)); height: 100vh; }\n' +
        ':root { --rand: 0; }\n:root[data-design-theme="glass"] { --rand: 1px; }',
    ],
  ]) {
    assert.ok(
      befunde(css).length > 0,
      `ein unlesbarer Wert wird stillschweigend übergangen: ${beschreibung}`,
    );
  }
  /*
   * **Und die eine Stelle, an der dieser Leser still falsch liegen könnte.**
   *
   * Er ist keine Kaskade. Erklärt **dieselbe** Gestaltung die Lage zweimal
   * verschieden, entscheidet die Lesereihenfolge der Stilblätter statt der
   * Spezifität — und eine fensterfeste Klasse fiele lautlos aus der Menge. Das
   * ist ein Befund und keine Fußnote.
   */
  for (const [beschreibung, css] of [
    [
      'dieselbe Klasse, zweimal verschieden fest',
      '.a { position: fixed; inset: 0; }\n.a { position: absolute; }',
    ],
    [
      'dieselbe Gestaltung, zweimal verschieden',
      '.a { position: absolute; inset: 0; }\n@media (min-width: 60rem) {\n  .a { position: fixed; }\n}\n' +
        '@media (min-width: 60rem) {\n  .a { position: static; }\n}',
    ],
  ]) {
    assert.ok(
      befunde(css).some((satz) => satz.includes('mehrfach verschieden')),
      `die Lesereihenfolge entscheidet still über die Menge: ${beschreibung}`,
    );
  }
  for (const [beschreibung, css] of [
    [
      'dieselbe Klasse, zweimal derselbe Wert',
      '.a { position: fixed; inset: 0; }\n.a { position: fixed; }',
    ],
    [
      'eine Palette überschreibt die Grundregel — das ist ein Widerruf, keine Uneindeutigkeit',
      '.a { position: fixed; inset: 0; }\n:root[data-design-theme="glass"] .a { position: fixed; }',
    ],
  ]) {
    assert.ok(
      !befunde(css).some((satz) => satz.includes('mehrfach verschieden')),
      `die Regel hält eine eindeutige Lage für uneindeutig: ${beschreibung}\n${befunde(css).join('\n')}`,
    );
  }

  for (const [beschreibung, css] of [
    [
      'die Sprungmarke an der Ecke, zeichengleich aus `base.css:300`',
      ':root { --space-2: 0.5rem; }\n:root[data-design-theme="glass"] { --space-2: 0.75rem; }\n' +
        '.skip-link { position: fixed; top: var(--space-2); left: var(--space-2); }',
    ],
    [
      'eine Variable, die im ganzen Bestand denselben Wert hat',
      ':root { --null: 0; }\n.a { position: fixed; inset: var(--null); }',
    ],
    [
      'ein unlesbarer Wert ohne jede Lage',
      ':root { --x: 0; }\n:root[data-design-theme="glass"] { --x: 1px; }\n.a { inset: var(--x); }',
    ],
    [
      'ein unlesbarer Wert an einer Eigenschaft, die keine Ausdehnung ist',
      ':root { --f: #fff; }\n:root[data-design-theme="glass"] { --f: #000; }\n' +
        '.a { position: fixed; inset: 0; background: var(--f); }',
    ],
  ]) {
    assert.deepEqual(
      befunde(css),
      [],
      `ein gleichgültiger Wert wird gemeldet: ${beschreibung}\n${befunde(css).join('\n')}`,
    );
  }
});

check('ein umschließender Block am Dokumentkörper ist ein Befund — N-7 (A-A-120)', () => {
  /*
   * Die Voraussetzung von Regel G, beidseitig gemessen. Heute ist dieser Weg
   * **wirkungslos**, weil der Körperkasten so groß ist wie das Fenster (T-357
   * N-7) — er ist es in dem Augenblick nicht mehr, in dem der Körper darüber
   * hinausreicht. Eine Voraussetzung, die niemand mißt, ist eine Annahme.
   */
  const befunde = (css) => koerperBlockBefunde([{ name: 'kunst.css', text: css }]).befunde;
  for (const [beschreibung, css] of [
    ['N-7 — `backdrop-filter` auf dem Körper', 'body { backdrop-filter: blur(2px); }'],
    ['`transform` auf dem Körper', 'body { transform: translateZ(0); }'],
    ['`filter` auf der Wurzel', 'html { filter: saturate(1.1); }'],
    ['`contain: paint` über `:root`', ':root { contain: paint; }'],
    ['`container-type` auf dem Körper', 'body { container-type: inline-size; }'],
    ['`will-change: transform` auf dem Körper', 'body { will-change: transform; }'],
    ['unter einer Palette', ':root[data-design-theme="glass"] body { backdrop-filter: blur(2px); }'],
    ['in einer Medienabfrage', '@media (min-width: 60rem) {\n  body { transform: none translateZ(0); }\n}'],
  ]) {
    assert.equal(befunde(css).length, 1, `der umschließende Block am Körper bleibt ungesehen: ${beschreibung}`);
  }
  for (const [beschreibung, css] of [
    ['die ausdrückliche Abwesenheit', 'body { transform: none; }'],
    ['`filter: none`', 'body { filter: none; }'],
    ['`contain: layout` ist keiner — aber `paint` schon', 'body { contain: size; }'],
    ['dieselbe Eigenschaft auf einer Karte', '.card { backdrop-filter: blur(12px); }'],
    ['eine harmlose Eigenschaft auf dem Körper', 'body { background: #fff; }'],
    ['ein Nachfahre des Körpers', 'body .karte { transform: translateZ(0); }'],
  ]) {
    assert.deepEqual(befunde(css), [], `die Regel meldet die richtige Bauart: ${beschreibung}\n${befunde(css).join('\n')}`);
  }
});

check('Regel G erntet die Stilangabe am Element — N-5 (A-A-121)', () => {
  /*
   * `style={{ position: "fixed", inset: 0 }}` ist dieselbe Fläche wie `.scrim`,
   * nur ohne Stilblatt — und fiel durch beide Siebe: keine Klasse, also kein
   * Klassenname, also keine Ernte. Gemessen wird gegen **dieselbe** Menge wie
   * der Bestand; die Fläche kommt hier ausdrücklich **nicht** über einen Namen
   * herein.
   */
  for (const [beschreibung, quelle] of [
    ['N-5 — Lage und Ausdehnung am Element', 'const V = () => <div style={{ position: "fixed", inset: 0 }}>{kind}</div>;'],
    [
      'dieselbe Fläche über vier Kanten',
      'const V = () => <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0 }}>{kind}</div>;',
    ],
    [
      'dieselbe Fläche über die Höckerschreibweise der logischen Namen',
      'const V = () => <div style={{ position: "fixed", insetBlock: 0, insetInline: 0 }}>{kind}</div>;',
    ],
    [
      'dieselbe Fläche über `width`/`height`',
      'const V = () => <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}>{kind}</div>;',
    ],
    [
      'in einem Dreiweg, und nur ein Zweig ist fensterfest',
      'const V = () => <div style={offen ? { position: "fixed", inset: 0 } : { position: "static" }}>{kind}</div>;',
    ],
    [
      'ohne JSX, über `createElement`',
      'const V = () => createElement("div", { style: { position: "fixed", inset: 0 } }, kind);',
    ],
    [
      'im Rumpf einer Karte, wo R-31 gemessen wurde',
      'const V = () => (\n  <div className="card">\n    <div style={{ position: "fixed", inset: 0 }}>{frage}</div>\n  </div>\n);',
    ],
  ]) {
    const { befunde, flaechen } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.equal(flaechen.length, 1, `die Kunstquelle trägt keine einzige Fläche: ${beschreibung}`);
    assert.equal(befunde.length, 1, `Regel G sieht die Verletzung nicht: ${beschreibung}\n${befunde.join('\n')}`);
  }

  /*
   * Und die Unlesbarkeit als Befund — aber nur, wo sie fensterfest sein könnte.
   * Die Zeilen darunter stehen zeichengleich so in `Primitives.tsx` und in
   * `showcase/FoundationsSection.tsx`; meldete der Lauf sie, wäre er in einer
   * Welle abgeschaltet.
   */
  for (const [beschreibung, quelle] of [
    ['die Lage steht als Name', 'const V = () => <div style={{ position: lage, inset: 0 }}>{kind}</div>;'],
    ['die Lage steht als Dreiweg im Wert', 'const V = () => <div style={{ position: offen ? "fixed" : "static", inset: 0 }}>{kind}</div>;'],
    ['die ganze Stilangabe steht als Name', 'const V = () => <div style={stil}>{kind}</div>;'],
    [
      'die Ausdehnung kommt aus einer Verbreitung',
      'const V = () => <div style={{ position: "fixed", ...rest }}>{kind}</div>;',
    ],
  ]) {
    const { befunde } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.ok(befunde.length > 0, `eine unlesbare Stilangabe wird übergangen: ${beschreibung}`);
  }
  for (const [beschreibung, quelle] of [
    [
      'dieselbe Fläche im Portal',
      'const V = () =>\n  createPortal(<div style={{ position: "fixed", inset: 0 }}>{kind}</div>, document.body);',
    ],
    ['der Platzhalter aus `Primitives.tsx`, zeichengleich', 'const V = ({ width, height, radius }) => (\n  <span\n    className="skeleton"\n    style={{ width, height, ...(radius === undefined ? {} : { borderRadius: radius }) }}\n  />\n);'],
    [
      'die Farbfelder aus `FoundationsSection.tsx`, zeichengleich',
      'const V = ({ item }) => (\n  <div\n    style={\n      item.on === undefined\n        ? { backgroundColor: `var(${item.token})` }\n        : { backgroundColor: `var(${item.on})`, display: "flex" }\n    }\n  />\n);',
    ],
    ['eine feste Fläche an einer Ecke', 'const V = () => <div style={{ position: "fixed", top: 8, left: 8 }}>{kind}</div>;'],
    ['volle Ausdehnung ohne `fixed`', 'const V = () => <div style={{ position: "absolute", inset: 0 }}>{kind}</div>;'],
    ['nur eine Ausdehnung, ohne jede Lage', 'const V = () => <div style={{ inset: 0, width: "100vw" }}>{kind}</div>;'],
    ['eine Stilangabe, die es gar nicht gibt', 'const V = () => <div style={undefined}>{kind}</div>;'],
    ['eine Stilangabe hinter einem Und', 'const V = () => <div style={offen && { color: farbe }}>{kind}</div>;'],
  ]) {
    const { befunde } = findScrimsWithoutPortal(kunstQuelle(quelle), KUNST_ABDUNKLUNGEN);
    assert.deepEqual(befunde, [], `Regel G meldet die richtige Bauart: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('Regel H findet die Zustimmung im Absageweg (T-347 G-6)', () => {
  /*
   * Die erste Gestalt ist die gemessene: eine Zeile in `ConfirmDialog.tsx`,
   * `tsc` Exit 0, der Lauf 34/0 grün. Die übrigen sind dieselbe Sache über
   * einen Umweg — und der Umweg ist der Fall, an dem ein Wächter sonst scheitert.
   */
  for (const [beschreibung, quelle] of [
    [
      'unmittelbar (G-6)',
      'const V = ({ onConfirm, onCancel }) => <Dialog onDismiss={onConfirm} onCancel={onCancel} />;',
    ],
    [
      'in einer Pfeilfunktion',
      'const V = ({ onConfirm }) => <Dialog onDismiss={() => onConfirm(grund)} />;',
    ],
    [
      'über eine örtliche Funktion',
      'const V = ({ onConfirm }) => {\n  const schliessen = () => onConfirm("");\n' +
        '  return <Dialog onDismiss={schliessen} />;\n};',
    ],
    [
      'über zwei Stufen',
      'const V = ({ onConfirm }) => {\n  const innen = () => onConfirm("");\n' +
        '  const aussen = () => innen();\n  return <Dialog onClose={aussen} />;\n};',
    ],
    [
      'im Zweig hinter `Escape`',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    if (event.key === "Escape") {\n      onConfirm("");\n    }\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
  ]) {
    const { befunde, wege } = findDismissThatConfirms(kunstQuelle(quelle));
    assert.ok(wege.length > 0, `die Kunstquelle trägt keinen Absageweg: ${beschreibung}`);
    assert.equal(befunde.length, 1, `Regel H sieht die Verletzung nicht: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('Regel H meldet die richtige Bauart nicht', () => {
  /*
   * Die teurere Hälfte, und sie ist hier zeichengleich der Bestand: So stehen
   * `ConfirmDialog` und `AttachmentOpenDialog` heute. Ein Wächter, der sie
   * meldete, würde in derselben Welle abgeschaltet.
   */
  for (const [beschreibung, quelle] of [
    [
      'der heutige `ConfirmDialog`',
      'const V = ({ onConfirm, onCancel }) => {\n  const senden = () => onConfirm(grund);\n' +
        '  return (\n    <DialogSurface role="alertdialog" onDismiss={onCancel}>\n' +
        '      <Button onClick={senden}>Weiter</Button>\n    </DialogSurface>\n  );\n};',
    ],
    [
      'der Escape-Zweig, der absagt',
      'const V = ({ onCancel }) => {\n  const taste = (event) => {\n' +
        '    if (event.key === "Escape") {\n      if (!busy) onCancel();\n    }\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'ein `onClose`, das nur einen Zustand zurücksetzt',
      'const V = () => <BookingFormDialog onClose={() => setManualFor(null)} />;',
    ],
    [
      'die Zustimmung an ihrem eigenen Knopf',
      'const V = ({ onConfirm, onCancel }) => (\n  <div>\n    <Button onClick={onConfirm}>Ja</Button>\n' +
        '    <Dialog onDismiss={onCancel} />\n  </div>\n);',
    ],
  ]) {
    const { befunde } = findDismissThatConfirms(kunstQuelle(quelle));
    assert.deepEqual(befunde, [], `Regel H meldet die richtige Bauart: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('Regel H erntet die Handlung und nicht drei Schreibweisen — H-1 bis H-4 (A-A-122)', () => {
  /*
   * **Die vier Gestalten aus T-357 45.1c**, jede bei `tsc` Exit 0 und
   * `proof:surface` 45/0 grün, drei davon ohne daß die Zahl der Absagewege sich
   * auch nur bewegte. Es ist dieselbe Taste, derselbe Rumpf, dieselbe Datei —
   * die Lücke lag nicht in der Erreichbarkeit, sondern eine Stufe davor, in der
   * **Ernte**.
   *
   * Gemessen wird **einzeln und beidseitig**: Jede Gestalt muß genau einen
   * Absageweg und genau einen Befund geben.
   */
  for (const [beschreibung, quelle] of [
    [
      'H-1 — die Wächterklausel mit `!==`, dahinter der Rest des Rumpfes',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    if (event.key !== "Escape") return;\n    onConfirm("");\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'H-1b — dieselbe Klausel mit geschweiften Klammern',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    if (event.key !== "Escape") {\n      return;\n    }\n    onConfirm("");\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'H-1c — dieselbe Klausel mit einem Gegenzweig statt eines Sprungs',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    if (event.key !== "Escape") {\n      merke();\n    } else {\n      onConfirm("");\n    }\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'H-2 — der `switch`-Fall',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    switch (event.key) {\n      case "Escape":\n        onConfirm("");\n        break;\n' +
        '      default:\n        break;\n    }\n  };\n  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'H-2b — derselbe Fall, durchgefallen aus einem leeren Fall darüber',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    switch (event.key) {\n      case "Escape":\n      case "Esc":\n        onConfirm("");\n' +
        '        break;\n    }\n  };\n  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'H-4 — der Listenvergleich',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    if (["Escape", "Esc"].includes(event.key)) {\n      onConfirm("");\n    }\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'H-4b — derselbe Vergleich verneint, mit Wächterklausel',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    if (!["Escape"].includes(event.key)) return;\n    onConfirm("");\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'die Verneinung über `!` statt über `!==`',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    if (!(event.key === "Escape")) return;\n    onConfirm("");\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'über eine örtliche Zwischenveränderliche',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    const abbruch = event.key === "Escape";\n    if (abbruch) {\n      onConfirm("");\n    }\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'in einem Dreiweg statt in einem `if`',
      'const V = ({ onConfirm }) => {\n  const taste = (event) =>\n' +
        '    event.key === "Escape" ? onConfirm("") : merke();\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'derselbe Dreiweg verneint',
      'const V = ({ onConfirm }) => {\n  const taste = (event) =>\n' +
        '    event.key !== "Escape" ? merke() : onConfirm("");\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'die Taste heißt `Esc`, wie ältere Browser sie melden',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    if (event.key === "Esc") {\n      onConfirm("");\n    }\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
  ]) {
    const { befunde, wege } = findDismissThatConfirms(kunstQuelle(quelle));
    assert.equal(wege.length, 1, `die Kunstquelle trägt keinen einzigen Absageweg: ${beschreibung}`);
    assert.equal(befunde.length, 1, `Regel H sieht die Verletzung nicht: ${beschreibung}\n${befunde.join('\n')}`);
  }

  /*
   * **H-3 — der Attributname.** Er hob die Zahl der Absagewege von 91 auf 92
   * und blieb trotzdem ungesehen, weil die Ernte an drei aufgeschriebenen Namen
   * hing. Geerntet wird jetzt die **Gestalt** eines Rückrufs und ein Wort, das
   * auf ein Schließen deutet.
   */
  for (const name of [
    'onRequestClose',
    'onCloseRequest',
    'onDismiss',
    'onCancel',
    'onClose',
    'onAbort',
    'onReject',
    'onDeny',
    'onEscape',
    'onBackdropClick',
    'onClickOutside',
  ]) {
    const quelle = `const V = ({ onConfirm }) => <Dialog ${name}={onConfirm} />;`;
    const { befunde, wege } = findDismissThatConfirms(kunstQuelle(quelle));
    assert.equal(wege.length, 1, `\`${name}\` gilt nicht als Absageweg`);
    assert.equal(befunde.length, 1, `\`${name}\` erreicht \`onConfirm\`, und Regel H schweigt`);
  }

  /*
   * Und die teurere Hälfte. Ein Name, der **kein** Rückruf ist, und eine Taste,
   * die **nicht** absagt, dürfen keinen Weg erzeugen — sonst mißt diese Regel
   * am Ende jeden Rumpf des Bestandes und wird abgeschaltet.
   */
  for (const [beschreibung, quelle] of [
    ['ein Schalter, kein Rückruf', 'const V = () => <Dialog closeOnEscape={onConfirm} />;'],
    ['ein Wort ohne Rückrufgestalt', 'const V = () => <Dialog dismissLabel={onConfirm} />;'],
    ['ein Rückruf ohne Absagewort', 'const V = () => <Dialog onSubmit={onConfirm} />;'],
    [
      'eine andere Taste',
      'const V = ({ onConfirm }) => {\n  const taste = (event) => {\n' +
        '    if (event.key === "Enter") {\n      onConfirm("");\n    }\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'das Wort `Escape` in einem Text',
      'const V = () => <p>Mit Escape schließen Sie die Rückfrage.</p>;',
    ],
  ]) {
    const { wege } = findDismissThatConfirms(kunstQuelle(quelle));
    assert.equal(wege.length, 0, `Regel H erfindet einen Absageweg: ${beschreibung}`);
  }

  /*
   * Und dieselben neuen Gestalten, wenn sie **richtig** absagen: kein Befund.
   * Ohne diese Hälfte wäre die Erweiterung eine Einladung, sie wieder
   * zurückzunehmen.
   */
  for (const [beschreibung, quelle] of [
    [
      'die Wächterklausel, die absagt',
      'const V = ({ onCancel }) => {\n  const taste = (event) => {\n' +
        '    if (event.key !== "Escape") return;\n    onCancel();\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'der `switch`-Fall, der absagt',
      'const V = ({ onCancel }) => {\n  const taste = (event) => {\n' +
        '    switch (event.key) {\n      case "Escape":\n        onCancel();\n        break;\n    }\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    [
      'der Listenvergleich, der nur einen Zustand zurücksetzt',
      'const V = () => {\n  const taste = (event) => {\n' +
        '    if (["Escape", "Esc"].includes(event.key)) {\n      setOffen(false);\n    }\n  };\n' +
        '  return <div onKeyDown={taste} />;\n};',
    ],
    ['`onRequestClose`, das absagt', 'const V = ({ onCancel }) => <Dialog onRequestClose={onCancel} />;'],
  ]) {
    const { befunde, wege } = findDismissThatConfirms(kunstQuelle(quelle));
    assert.equal(wege.length, 1, `die Kunstquelle trägt keinen Absageweg: ${beschreibung}`);
    assert.deepEqual(befunde, [], `Regel H meldet die richtige Bauart: ${beschreibung}\n${befunde.join('\n')}`);
  }
});

check('Regel H ist rot, wenn der Sammler nichts erntet (E-094 Punkt 3)', () => {
  const leer = findDismissThatConfirms(kunstQuelle('const V = () => <div className="etwas" />;\n'));
  assert.equal(leer.wege.length, 0, 'die Kunstquelle trägt einen Absageweg, den sie nicht tragen sollte');
  assert.deepEqual(leer.befunde, [], 'ohne Absageweg gibt es nichts zu melden — und genau das ist die Gefahr');
});

check('die Menge aus dem Stilblatt trifft die Eigenschaft und nicht den Namen (T-347 G-5, G-8)', () => {
  /*
   * Die Gegenprobe zu der einen Zeile, die G-5 und G-8 zugleich schließt.
   * Gemessen wird **an der Mengenfunktion**, durch dieselbe wie der Bestand:
   *
   *  - eine zweite Abdunklung unter einem zweiten Namen ist **darin** (G-5),
   *  - eine Klasse ohne volle Ausdehnung ist **nicht** darin — das sind
   *    `.skip-link`, `.toast-layer` und `.idle-reminder` des Bestandes,
   *  - `position: static` nimmt die Klasse heraus (G-8), und genau daran wird
   *    die Ernte oben rot.
   */
  const menge = (css) => [...fensterfesteKlassen([{ name: 'kunst.css', text: css }]).klassen].sort();
  assert.deepEqual(menge('.scrim { position: fixed; inset: 0; }'), ['scrim']);
  assert.deepEqual(
    menge('.rueckfrage-flaeche {\n  position: fixed;\n  inset: 0;\n  background: #000;\n}'),
    ['rueckfrage-flaeche'],
    'eine zweite Abdunklung unter einem zweiten Namen fällt aus der Menge (G-5)',
  );
  assert.deepEqual(
    menge('.a { position: fixed; top: 0; right: 0; bottom: 0; left: 0; }'),
    ['a'],
    'die vier einzelnen Kanten sind dieselbe Ausdehnung wie `inset: 0`',
  );
  assert.deepEqual(
    menge('.scrim { position: static; inset: 0; }'),
    [],
    '`position: static` beansprucht nicht mehr, am Fenster zu hängen (G-8)',
  );
  for (const [beschreibung, css] of [
    ['die Sprungmarke an ihrer Ecke', '.skip-link { position: fixed; top: 8px; left: 8px; }'],
    ['die Meldungsschicht an ihrer Ecke', '.toast-layer { position: fixed; inset-block-end: 0; inset-inline-end: 0; }'],
    ['nur zwei Kanten auf null', '.b { position: fixed; top: 0; left: 0; }'],
    ['fest ohne jede Kante', '.c { position: fixed; }'],
    ['volle Ausdehnung ohne `fixed`', '.d { position: absolute; inset: 0; }'],
    ['in einem Kommentar', '/* .e { position: fixed; inset: 0; } */\n.f { color: red; }'],
  ]) {
    assert.deepEqual(menge(css), [], `die Menge nimmt auf, was nicht hineingehört: ${beschreibung}`);
  }
  assert.deepEqual(
    menge('.wirt .innen { position: fixed; inset: 0; }'),
    ['innen'],
    'aus einem zusammengesetzten Selektor zählt die letzte Verbindung',
  );
});

/* 10  Ergebnis                                                         */

process.stdout.write(`\n${'═'.repeat(58)}\n`);
if (failed > 0) {
  process.stdout.write(`${String(passed)} bestanden, ${String(failed)} fehlgeschlagen.\n`);
  process.exit(1);
}

const liveClasses = [...liveRegionClasses()].sort();
process.stdout.write(
  `${String(passed)} bestanden, 0 fehlgeschlagen.\n` +
    `Darunter ${String(passed - beforeCounterProbes)} Gegenproben: je Regel eine eingesetzte ` +
    `Verletzung und eine Bauart, die nicht gemeldet werden darf.\n` +
    `${String(sources.length)} Quelldateien, ${String(HTML_ENTRY_POINTS.length)} Einstiegsseiten, ` +
    `${String(styleFiles.length)} Stilblätter, ` +
    `${String(liveClasses.length)} benannte Live-Regionen, ` +
    `${String(ANREDE_AUSNAHMEN.length)} geduldete Sätze.\n` +
    /*
     * Die Ernte von Regel F steht in der Ausgabe und nicht in einem Bericht:
     * Wer die Zahl der Kinder liest, sieht sofort, wenn der Sammler eines
     * verloren hat — ohne daß dafür jemand den Lauf öffnen muß.
     */
    `Unter .${SHELL_CLASS}: ${String(rasterErnte.kinder)} direkte Kinder, aufgelöst zu ` +
    `${String(rasterErnte.traeger.length)} Knoten ` +
    `(${rasterErnte.traeger.map((t) => `<${t.tag}>${t.klassen.length === 0 ? '' : `.${t.klassen[0]}`}`).join(', ')}); ` +
    `${String(rasterErnte.platziert.size)} Klassen mit Rasterzuordnung, ` +
    `${String(rasterErnte.ausserhalb.size)} außerhalb des Flusses, ` +
    `${String(rasterErnte.portale)} durch ein Portal am Dokumentkörper.\n` +
    /*
     * Und die Ernte von Regel G daneben, aus demselben Grund: Wer die Zahl der
     * Abdunklungen liest, sieht sofort, wenn eine dazugekommen ist — oder wenn
     * die Menge auf null gefallen ist, weil jemand den Klassennamen umbenannt
     * hat. Die Zahl ist die Zusage; ohne sie wäre „alle sind verankert" auch
     * über der leeren Menge wahr.
     */
    `${String(stilErklaerungen.length)} Erklärungen aus den Stilblättern gerechnet ` +
    `(${String(koerperBlock.koerperErklaerungen)} davon auf Körper oder Wurzel, ${String(koerperBlock.erklaerungen)} mit einer blockbildenden Eigenschaft). ` +
    `Fensterfeste Klassen: ${[...abdunklungsKlassen].sort().map((k) => `.${k}`).join(', ')}. ` +
    `Flächen darunter: ${String(scrimErnte.flaechen.length)}, ` +
    `davon ${String(scrimErnte.flaechen.filter((f) => f.verankert).length)} in einem ` +
    `\`createPortal(…, document.body)\` aus \`${PORTAL_MODUL}\` ` +
    `(${scrimErnte.flaechen.map((f) => f.wo).join(', ')}).\n` +
    /*
     * Und die Ernte von Regel H aus demselben Grund: Fällt die Zahl der
     * Absagewege, hat jemand ein Attribut umbenannt — und die Zusage „keiner
     * bestätigt" wäre wieder über der leeren Menge wahr.
     */
    `Absagewege: ${String(absageErnte.wege.length)} (${String(absageErnte.wege.filter((w) => w.art === 'Escape').length)} ` +
    `über die Taste ${[...ABSAGE_TASTEN].join('/')}, ${String(absageErnte.wege.filter((w) => w.art !== 'Escape').length)} über ` +
    `${String(new Set(absageErnte.wege.filter((w) => w.art !== 'Escape').map((w) => w.art)).size)} Rückrufnamen nach ` +
    `${String(ABSAGE_WORT)}), keiner erreicht einen Zustimmungsrückruf.\n`,
);
