/**
 * Takt — der ausführbare Nachweis darüber, daß **am Zeilenende nichts gekürzt
 * wird** (T-302; A-19.23b, Auflage A-A-93, R-27).
 *
 * ===========================================================================
 * Die Frage, die R-27 offen hält
 * ===========================================================================
 *
 * R-27 heißt „Die Kürzung, die kein Wächter sieht", und der Eintrag endet mit
 * einer Frage statt mit einer Maßnahme:
 *
 *   > **Wie mißt man eine Zusage über die Darstellung?** Die zweite Bauart
 *   > desselben Fehlers, das Richtungszeichen, ist als Zeichen zu fangen. Die
 *   > Kürzung ist es nicht.
 *
 * Der Befund darunter ist der schwerste, den dieser Bestand über seine
 * Oberfläche hat: Die Rückfrage vor dem Öffnen einer Datei nennt den vollen
 * Pfad, und das ist seit A-19.18 die eine Sicherung zwischen einem fremden
 * Anhang und der Standardanwendung. Ein Deckel in der Darstellung nimmt ihr die
 * **Endung** — der Benutzer bestätigt `Rechnung…` und startet eine `.exe`.
 *
 * Und niemand sieht es:
 *
 *  - `visibleText` sieht es nicht. Es **behandelt** Zeichen; hier ist kein
 *    Zeichen falsch.
 *  - `proof:foreign` sieht es nicht. Es erkennt Anzeigestellen an ihrem
 *    **Typ**; ein CSS-Deckel hat keinen Typ.
 *  - `proof:surface` und `proof:locked` sehen es nicht. Sie messen **Text**;
 *    der Text ist in Ordnung.
 *  - Ein Prüffall in jsdom sieht es nicht. jsdom rechnet kein Layout: `.truncate`
 *    ändert dort weder `textContent` noch `scrollWidth`.
 *
 * ===========================================================================
 * Die Antwort dieses Laufs: zwei Mengen rechnen und ihren Schnitt messen
 * ===========================================================================
 *
 * Der Deckel hat keinen Typ — aber er hat einen **Namen**, und die Stelle, an
 * der er wirkt, hat einen. Daraus werden zwei Mengen, und beide entstehen bei
 * jedem Lauf neu, statt in einer Liste zu stehen:
 *
 *  **Menge D — die Deckel.** Gelesen aus den Stilblättern selbst. Jede Regel,
 *  die `text-overflow`, `-webkit-line-clamp`, `white-space: nowrap` oder
 *  `overflow: hidden` erklärt, ist ein Deckel; ihre Klassennamen sind die
 *  Menge. Niemand schreibt „truncate" in diesen Lauf. Wer morgen
 *  `.name-kurz { text-overflow: ellipsis }` erfindet, hat sie erweitert, ohne
 *  eine Zeile hier anzufassen.
 *
 *  **Menge A — die Anzeigestellen.** Gerechnet aus dem **Typ**. `UncappedText`
 *  (in `src/api/types.ts`) markiert jeden Wert, an dessen **Ende** eine
 *  Entscheidung hängt: der Dateiname, der aufgelöste Name, die Endung, der
 *  Anzeigename aus der E-Mail, der volle Pfad. Der Übersetzer führt die Marke
 *  durch Zuweisungen, Felder, Parameter und Rückgaben mit — genau die Bauart,
 *  mit der `proof:foreign` seit T-129 der abgeschriebenen Feldliste entkommen
 *  ist (E-063 Punkt 4). Gefunden wird jedes JSX-Element, das einen solchen Wert
 *  aufnimmt, **jedes Elternelement in derselben Datei** und — über einen
 *  Fixpunkt — **jede Aufrufstelle jedes Bausteins**, der einen solchen Wert
 *  anzeigt. Damit reicht die Messung über Dateigrenzen: Wer `<Attachments>` in
 *  eine Spalte mit `truncate` stellt, wird rot, obwohl in seiner Datei kein
 *  fremder Name vorkommt.
 *
 * **Der Schnitt beider Mengen muß leer sein.** Das ist der ganze Lauf.
 *
 * ===========================================================================
 * Warum das mehr ist als eine Mustersuche
 * ===========================================================================
 *
 * Die Messung, die A-A-93 vorschlägt, ist eine Suche nach `text-overflow` „in
 * Nachbarschaft der Anhangsanzeigen". „Nachbarschaft" ist dabei das Wort, an
 * dem sie zerbricht: Sie braucht eine Liste der Anhangsanzeigen, und diese
 * Liste ist abgeschrieben, sobald sie existiert. Ein neuer Baustein, der einen
 * Anhangsnamen zeigt, steht nicht darin — und der Lauf meldet grün, weil er
 * die Datei nicht kennt.
 *
 * Hier ist keine der beiden Mengen aufgezählt. Die eine steht im Stilblatt, die
 * andere im Typsystem, und beide sind an derselben Anforderung aufgespannt und
 * nicht an dem, was der Schreibende gerade kannte (E-099 Punkt 3).
 *
 * ===========================================================================
 * Was dieser Lauf **nicht** kann — ausgesprochen, nicht beruhigt
 * ===========================================================================
 *
 *  - **Er mißt Quelltext, keine Pixel.** Daß ein 200 Zeichen langer Name im
 *    ausgelieferten Bündel tatsächlich umbricht und seine Endung zeigt, mißt
 *    nur ein Browser. Das gehört dem e2e-tester; A-A-93 verlangt diesen
 *    Prüffall ausdrücklich, und dieser Lauf ersetzt ihn nicht. Er schließt die
 *    **Ursache** aus, jener mißt die **Wirkung**.
 *  - **Er sieht keine Stile von außerhalb dieses Bestands.** Käme eines Tages
 *    ein fremdes Stilblatt dazu, stünde seine Deckelmenge nicht in Menge D.
 *    Heute gibt es keines: `proof:surface` mißt die Stilblätter der beiden
 *    Einstiegsseiten zeichengleich.
 *  - **Er sieht keinen Stil, der zur Laufzeit entsteht.** Ein `style`-Attribut
 *    mit deckelnden Eigenschaften findet Abschnitt 2; ein zur Laufzeit
 *    zusammengesetzter Klassenname wird gemeldet, statt geraten (Abschnitt 2,
 *    „unlesbare Klassenangabe").
 *  - **Er urteilt nicht über die Kürzung in der Mitte.** Die ist erlaubt
 *    (A-A-93 wörtlich) und findet im Dienst statt, nicht hier.
 *
 * ===========================================================================
 * Wo dieser Lauf hängt — an genau einem Namen
 * ===========================================================================
 *
 * `pnpm --filter @takt/web proof:clamp`, und als **eigenes Glied** in
 * `proof:all` der Wurzel-`package.json`. Seit T-302 sind es dort
 * zweiundzwanzig Läufe statt einundzwanzig.
 *
 * **Er hängt an keinem zweiten Namen, und das ist eine Regel und keine
 * Ordnungsfrage.** Bis zur Freigabe von T-302 lief er behelfsweise als zweites
 * Glied von `proof:surface`, damit die Zusage überhaupt im Tor stand. Der
 * Behelf ist zurückgenommen: Ein Lauf, der zweimal fährt, schreibt seine
 * Bilanzzeile zweimal — und in einer Ausgabe, in der Zeilen gezählt werden,
 * ist eine doppelte Bilanz schlimmer als ein fehlender Lauf. Wer ihn wieder
 * irgendwo anhängt, hängt seine Zahlen mit an.
 *
 * Aufruf: `node apps/web/scripts/proof-clamp.mjs`
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { requireAtLeast, requireDirectory } from "../../../scripts/source-anchors.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const srcRoot = requireDirectory(
  path.join(appRoot, "src"),
  "den Quellbaum, über den dieser Nachweis urteilt",
);
const styleRoot = requireDirectory(
  path.join(srcRoot, "styles"),
  "die Stilblätter, aus denen die Menge der Deckel entsteht",
);

/* ==================================================================== */
/* 0  Werkzeug                                                          */
/* ==================================================================== */

/*
 * Pfade in der Schreibweise des Übersetzers — dieselbe Regel und derselbe
 * Grund wie in `proof-foreign.mjs` (T-247): `ts.SourceFile.fileName` trägt
 * immer Schrägstriche, `path.join` unter Windows Rückstriche. Ein Vergleich
 * ohne diese beiden Funktionen urteilt dort über null Dateien und meldet grün.
 */
const slashed = (value) => path.resolve(value).split(path.sep).join("/");
const comparable = (value) =>
  ts.sys.useCaseSensitiveFileNames ? slashed(value) : slashed(value).toLowerCase();
const SRC_PREFIX = `${comparable(srcRoot)}/`;
const insideSrc = (fileName) => comparable(fileName).startsWith(SRC_PREFIX);
const sameFile = (left, right) => comparable(left) === comparable(right);
const displayPath = (fileName) => path.relative(appRoot, fileName).split(path.sep).join("/");

let passed = 0;
let failed = 0;

const heading = (name) => {
  process.stdout.write(`\n${name}\n${"─".repeat(name.length)}\n`);
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

/** Zeile und Spalte eines Knotens, für eine Fundstelle, die man anspringen kann. */
const where = (node) => {
  const file = node.getSourceFile();
  const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file));
  return `${displayPath(file.fileName)}:${line + 1}:${character + 1}`;
};

/* ==================================================================== */
/* 1  Menge D — die Deckel entstehen aus den Stilblättern                */
/* ==================================================================== */

/**
 * Die Eigenschaften, die am **Zeilenende** abschneiden.
 *
 * Jede einzeln, mit ihrem Grund — eine Liste ohne Gründe wird beim ersten
 * Aufräumen gekürzt:
 *
 *  - `text-overflow` — die offensichtliche. Auch `clip` zählt: Es schneidet
 *    ohne Auslassungszeichen ab und ist damit **schlimmer**, weil nichts mehr
 *    darauf hinweist, daß etwas fehlt.
 *  - `-webkit-line-clamp` — dieselbe Wirkung über mehrere Zeilen.
 *  - `white-space` mit `nowrap`/`pre` — allein noch keine Kürzung, aber die
 *    Bedingung dafür: Ohne Umbruch braucht es nur noch irgendein `overflow`
 *    eines Elternteils, und das ist nicht mehr in derselben Regel zu sehen.
 *  - `overflow`/`overflow-x` mit `hidden`/`clip` — die zweite Hälfte desselben
 *    Paares.
 *
 * Bewußt **nicht** darin: `max-width`, `width`, `flex-basis`. Eine Breite
 * allein kürzt nichts — sie läßt umbrechen. Wer sie mit aufnähme, machte den
 * Lauf unbrauchbar, und ein unbrauchbarer Lauf wird abgeschaltet.
 */
const CAPPING = [
  { property: "text-overflow", value: null },
  { property: "-webkit-line-clamp", value: null },
  { property: "white-space", value: /\b(nowrap|pre)\b/u },
  { property: "overflow", value: /\b(hidden|clip)\b/u },
  { property: "overflow-x", value: /\b(hidden|clip)\b/u },
];

/** Deckelt dieser Deklarationsblock am Zeilenende? Liefert die Gründe. */
const cappingReasons = (declarations) => {
  const reasons = [];
  for (const raw of declarations.split(";")) {
    const colon = raw.indexOf(":");
    if (colon === -1) continue;
    const property = raw.slice(0, colon).trim().toLowerCase();
    const value = raw.slice(colon + 1).trim().toLowerCase();
    for (const rule of CAPPING) {
      if (property !== rule.property) continue;
      if (rule.value === null || rule.value.test(value)) reasons.push(`${property}: ${value}`);
    }
  }
  return reasons;
};

/**
 * Die Blattregeln eines Stilblatts: Wähler und Deklarationen.
 *
 * Kein vollständiger Zerleger — er muß genau zwei Dinge können: Kommentare
 * überspringen (in einem Kommentar steht in diesem Bestand reichlich CSS als
 * Erklärung) und Verschachtelung in `@media` aushalten. Gesammelt werden nur
 * **Blätter**, also Blöcke ohne weiteren Block darin; ein `@media` selbst
 * erklärt nichts.
 */
const leafRules = (source) => {
  const text = source.replace(/\/\*[\s\S]*?\*\//gu, " ");
  const rules = [];
  let selectorStart = 0;
  const stack = [];
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === "{") {
      stack.push({ selector: text.slice(selectorStart, index).trim(), start: index + 1, leaf: true });
      if (stack.length > 1) stack[stack.length - 2].leaf = false;
      selectorStart = index + 1;
    } else if (character === "}") {
      const frame = stack.pop();
      if (frame !== undefined && frame.leaf) {
        rules.push({ selector: frame.selector, declarations: text.slice(frame.start, index) });
      }
      selectorStart = index + 1;
    }
  }
  return rules;
};

/**
 * Die Klassennamen, die eine Regel **an ihrem Gegenstand** trägt.
 *
 * Nicht jede Klasse in einem Wähler bekommt seine Deklarationen.
 * `.screen:has(> .board) > .board { overflow-y: hidden }` erklärt etwas über
 * `.board`; über `.screen` erklärt es nur eine Bedingung. Wer alle Klassen
 * eines Wählers nimmt, macht aus jeder Bedingung eine Eigenschaft und meldet
 * Befunde, die es nicht gibt — gemessen: genau dieser Wähler hat im ersten Lauf
 * `.screen` zum Deckel erklärt und damit die ganze Detailansicht.
 *
 * Deshalb zwei Schnitte, und beide sind nötig:
 *
 *  1. Die Argumente von `:has()`, `:is()`, `:where()`, `:not()` und jeder
 *     anderen Pseudoklasse mit Klammern fallen weg. Sie beschreiben **andere**
 *     Elemente.
 *  2. Von dem, was übrigbleibt, zählt nur der **letzte** zusammenhängende Teil,
 *     also alles hinter dem letzten Kombinator (Leerzeichen, `>`, `+`, `~`).
 *     Das ist der Gegenstand der Regel.
 *
 * Wählerlisten werden vorher an den Kommas zerlegt.
 */
const classesIn = (selector) => {
  /* Klammerinhalte weg — verschachtelt, deshalb in Runden statt mit einem Muster. */
  let stripped = selector;
  for (let round = 0; round < 8; round += 1) {
    const next = stripped.replace(/\([^()]*\)/gu, "");
    if (next === stripped) break;
    stripped = next;
  }
  const names = [];
  for (const part of stripped.split(",")) {
    const pieces = part.trim().split(/[\s>+~]+/u).filter((piece) => piece.length > 0);
    const subject = pieces[pieces.length - 1];
    if (subject === undefined) continue;
    for (const match of subject.matchAll(/\.(-?[_a-zA-Z][\w-]*)/gu)) names.push(match[1]);
  }
  return names;
};

const styleSheets = fs
  .readdirSync(styleRoot)
  .filter((name) => name.endsWith(".css"))
  .map((name) => path.join(styleRoot, name));

requireAtLeast(styleSheets, 5, "Stilblätter", styleRoot);

/**
 * Menge D, gerechnet — wahlweise mit einem überlagerten Stilblatt für die
 * Gegenproben in Abschnitt 6.
 */
const buildCapSet = (overlay = null) => {
  /** Klassenname → die Gründe, aus denen er deckelt. */
  const caps = new Map();
  /** Wähler ohne Klasse, die deckeln — für die Ausgabe, nicht für das Urteil. */
  const anonymous = [];
  for (const sheet of styleSheets) {
    const source =
      overlay !== null && sameFile(overlay.path, sheet)
        ? overlay.source
        : fs.readFileSync(sheet, "utf8");
    for (const rule of leafRules(source)) {
      const reasons = cappingReasons(rule.declarations);
      if (reasons.length === 0) continue;
      const names = classesIn(rule.selector);
      if (names.length === 0) {
        anonymous.push({ selector: rule.selector, sheet: displayPath(sheet) });
        continue;
      }
      for (const name of names) {
        const found = caps.get(name) ?? new Set();
        for (const reason of reasons) found.add(reason);
        caps.set(name, found);
      }
    }
  }
  if (overlay !== null && overlay.extraSheet !== undefined) {
    for (const rule of leafRules(overlay.extraSheet)) {
      const reasons = cappingReasons(rule.declarations);
      if (reasons.length === 0) continue;
      for (const name of classesIn(rule.selector)) {
        const found = caps.get(name) ?? new Set();
        for (const reason of reasons) found.add(reason);
        caps.set(name, found);
      }
    }
  }
  return { caps, anonymous };
};

const { caps: CAP_CLASSES, anonymous: CAP_ANONYMOUS } = buildCapSet();

heading("1  Die Menge der Deckel entsteht aus den Stilblättern");

check("die Stilblätter sind gelesen und tragen Deckel", () => {
  assert.ok(
    CAP_CLASSES.size > 0,
    `Kein einziger Deckel in ${styleSheets.length} Stilblättern gefunden. ` +
      "Entweder zerlegt dieser Lauf nicht mehr, was er zerlegen soll, oder die " +
      "Stilblätter liegen woanders — in beiden Fällen ist jedes Grün danach hohl.",
  );
});

check("`truncate` ist als Deckel erkannt — die Gegenprobe an einem bekannten Fall", () => {
  /*
    Kein Urteil über `.truncate`: Die Klasse ist richtig und wird an sechzehn
    Stellen gebraucht, an denen kein Dateiname steht. Sie ist hier der
    **Prüfstein** für den Zerleger. Fände er sie nicht, fände er auch den
    nächsten Deckel nicht, und niemand merkte es.
  */
  assert.ok(
    CAP_CLASSES.has("truncate"),
    "`.truncate` steht in `styles/base.css` mit `text-overflow: ellipsis` und " +
      "ist hier nicht als Deckel erkannt. Der Zerleger liest die Blattregeln nicht.",
  );
});

/* ==================================================================== */
/* 2  Menge A — die Anzeigestellen entstehen aus dem Typ                 */
/* ==================================================================== */

const configFile = path.join(appRoot, "tsconfig.json");
const rawConfig = ts.readConfigFile(configFile, ts.sys.readFile);
if (rawConfig.error !== undefined) {
  throw new Error(`tsconfig.json nicht lesbar: ${String(rawConfig.error.messageText)}`);
}
const parsedConfig = ts.parseJsonConfigFileContent(
  rawConfig.config,
  ts.sys,
  appRoot,
  undefined,
  configFile,
);

/**
 * Ein Programm aus **derselben** Konfiguration — wahlweise mit einer Quelle,
 * die es auf der Platte nicht gibt.
 *
 * Der Preis dafür, daß die Gegenproben in Abschnitt 6 echte Verletzungen
 * messen, ohne `src` anzufassen. Ein Nachweis, der seine eigene Verletzung in
 * den Bestand schreiben müßte, hinterließe sie in einem abgebrochenen Lauf.
 */
const buildProgram = (overlay = null) => {
  if (overlay === null) return ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
  const target = slashed(overlay.path);
  const host = ts.createCompilerHost(parsedConfig.options, true);
  const readOriginal = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreate) =>
    sameFile(name, target)
      ? ts.createSourceFile(name, overlay.source, languageVersion, true)
      : readOriginal(name, languageVersion, onError, shouldCreate);
  host.fileExists = (name) => sameFile(name, target) || ts.sys.fileExists(name);
  host.readFile = (name) => (sameFile(name, target) ? overlay.source : ts.sys.readFile(name));
  return ts.createProgram([...parsedConfig.fileNames, target], parsedConfig.options, host);
};

/** Die Marke aus `src/api/types.ts`. Sie steht dort und nicht hier. */
const UNCAPPED_MARK = "__uncappedText";

/**
 * Der Befund über **eine** Menge von Quelldateien.
 *
 * Gebündelt an einem Programm aus demselben Grund wie `lensFor` in
 * `proof-foreign.mjs`: Die Gegenproben brauchen dieselben Fragen an einem
 * zweiten Programm, und eine zweite Abschrift der Fragen wäre in genau dem
 * Lauf falsch, der das Abschreiben von Wissen für den Ursprung allen Übels
 * hält.
 *
 * @param {ts.Program} program
 * @param {Map<string, Set<string>>} caps
 */
const inspect = (program, caps) => {
  const checker = program.getTypeChecker();
  const sourceFiles = program
    .getSourceFiles()
    .filter((file) => !file.isDeclarationFile && insideSrc(file.fileName));

  const carries = (type) => {
    if (type === undefined || type === null) return false;
    if (type.isUnion() || type.isIntersection()) return type.types.some(carries);
    return type.getProperty(UNCAPPED_MARK) !== undefined;
  };
  const isUncapped = (node) =>
    node !== undefined && node !== null && carries(checker.getTypeAtLocation(node));

  /* ---------------------------------------------------------------- */
  /* 2a  Klassenangaben lesen — und sagen, wenn sie nicht zu lesen sind */
  /* ---------------------------------------------------------------- */

  /**
   * Die Klassennamen eines `className`-Ausdrucks.
   *
   * Rückgabe: `{ names, patterns, unreadable }`.
   *
   *  - `names` — was fest dasteht.
   *  - `patterns` — was zur Laufzeit entsteht, aber einen festen Anfang hat
   *    (`` `attachment--${kind}` ``). Darüber läßt sich noch etwas sagen: Wenn
   *    **kein** Deckel diesem Muster genügen kann, ist die Angabe harmlos.
   *  - `unreadable` — was gar nichts festhält. Eine Anzeigestelle mit einer
   *    solchen Angabe wird **gemeldet**, nicht geraten: Ein Lauf, der über eine
   *    Stelle schweigt, die er nicht lesen kann, ist der Fehler, den `proof:surface`
   *    Regel F schon einmal abgestellt hat.
   */
  const readClasses = (expression) => {
    const names = [];
    const patterns = [];
    const unreadable = [];

    const fromText = (text) => {
      for (const part of text.split(/\s+/u)) if (part.length > 0) names.push(part);
    };

    const visit = (node) => {
      if (node === undefined) return;
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        fromText(node.text);
        return;
      }
      if (ts.isJsxExpression(node)) {
        visit(node.expression);
        return;
      }
      if (ts.isParenthesizedExpression(node)) {
        visit(node.expression);
        return;
      }
      if (ts.isTemplateExpression(node)) {
        /*
          Fester Anfang, offener Rest. `` `attachment--${kind}` `` kann nur
          Klassen erzeugen, die mit `attachment--` anfangen — das genügt für
          ein Urteil, ohne den Wert zu kennen.
        */
        patterns.push(node.head.text);
        for (const span of node.templateSpans) {
          if (span.literal.text.trim().length > 0) fromText(span.literal.text);
        }
        return;
      }
      if (ts.isBinaryExpression(node)) {
        /* `bedingung && "klasse"` — die Klasse steht rechts. */
        if (
          node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          node.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
          visit(node.right);
          if (node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) visit(node.left);
          return;
        }
        if (node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
          visit(node.left);
          visit(node.right);
          return;
        }
        unreadable.push(node);
        return;
      }
      if (ts.isConditionalExpression(node)) {
        visit(node.whenTrue);
        visit(node.whenFalse);
        return;
      }
      if (ts.isCallExpression(node)) {
        /* `cx(...)`, `clsx(...)` und jede andere Sammelfunktion: die Glieder. */
        for (const argument of node.arguments) visit(argument);
        return;
      }
      if (node.kind === ts.SyntaxKind.NullKeyword || node.kind === ts.SyntaxKind.UndefinedKeyword) {
        return;
      }
      if (ts.isIdentifier(node) && node.text === "undefined") return;
      if (ts.isLiteralExpression(node)) return;
      unreadable.push(node);
    };

    visit(expression);
    return { names, patterns, unreadable };
  };

  /** Deckelt diese Klassenangabe? Liefert die Gründe. */
  const capsOf = ({ names, patterns }) => {
    const hits = [];
    for (const name of names) {
      const reasons = caps.get(name);
      if (reasons !== undefined) hits.push(`.${name} (${[...reasons].join("; ")})`);
    }
    for (const prefix of patterns) {
      if (prefix.length === 0) continue;
      for (const [name, reasons] of caps) {
        if (name.startsWith(prefix)) {
          hits.push(`.${name} über \`${prefix}…\` (${[...reasons].join("; ")})`);
        }
      }
    }
    return hits;
  };

  /* ---------------------------------------------------------------- */
  /* 2b  Der Fixpunkt: wer einen ungedeckelten Namen zeigt, trägt ihn   */
  /* ---------------------------------------------------------------- */

  /** Die Deklaration, auf die ein JSX-Bezeichner zeigt — Einfuhr aufgelöst. */
  const declarationOfTag = (tagName) => {
    let symbol = checker.getSymbolAtLocation(tagName);
    if (symbol === undefined) return null;
    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
      try {
        symbol = checker.getAliasedSymbol(symbol);
      } catch {
        return null;
      }
    }
    const declaration = symbol.declarations?.[0];
    return declaration === undefined ? null : declaration;
  };

  /** Die umschließende Funktions- oder Klassendeklaration eines Knotens. */
  const enclosingDeclaration = (node) => {
    for (let current = node.parent; current !== undefined; current = current.parent) {
      if (
        ts.isFunctionDeclaration(current) ||
        ts.isFunctionExpression(current) ||
        ts.isArrowFunction(current) ||
        ts.isClassDeclaration(current)
      ) {
        return current;
      }
    }
    return null;
  };

  /**
   * Die Deklaration, die ein Baustein aus Sicht von {@link declarationOfTag}
   * hat. `export function Foo()` ist die Funktion selbst, `const Foo = () => …`
   * die Variablendeklaration — beide müssen auf denselben Schlüssel fallen.
   */
  const keyOf = (declaration) => {
    let node = declaration;
    if (
      (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
      node.parent !== undefined &&
      ts.isVariableDeclaration(node.parent)
    ) {
      node = node.parent;
    }
    const file = node.getSourceFile();
    return `${comparable(file.fileName)}#${node.getStart(file)}`;
  };

  /** Alle JSX-Elemente einer Datei, mit ihrem öffnenden Teil. */
  const jsxElementsOf = (file) => {
    const found = [];
    const walk = (node) => {
      if (ts.isJsxElement(node)) found.push({ node, opening: node.openingElement });
      else if (ts.isJsxSelfClosingElement(node)) found.push({ node, opening: node });
      ts.forEachChild(node, walk);
    };
    walk(file);
    return found;
  };

  /**
   * Die unmittelbaren Anzeigestellen: JSX-Elemente, die einen markierten Wert
   * als Kind oder als Attributwert aufnehmen.
   */
  const directSites = [];
  /** Markierte Werte, die in einen Baustein gehen, der sie nicht als solche führt. */
  const lostMarks = [];
  /** Kürzungen im Quelltext, die das **Ende** wegnehmen. */
  const cuts = [];

  for (const file of sourceFiles) {
    const walk = (node) => {
      /* --- der markierte Wert als Kind eines Elements --------------- */
      if (ts.isJsxExpression(node) && isUncapped(node.expression)) {
        const parent = node.parent;
        if (parent !== undefined && (ts.isJsxElement(parent) || ts.isJsxFragment(parent))) {
          directSites.push({ node: parent, value: node });
        }
      }

      /* --- der markierte Wert als Attributwert ---------------------- */
      if (ts.isJsxAttribute(node) && node.initializer !== undefined) {
        const value = ts.isJsxExpression(node.initializer)
          ? node.initializer.expression
          : node.initializer;
        if (isUncapped(value)) {
          const opening = node.parent.parent;
          directSites.push({ node: opening, value: node });
          /*
            Geht der Wert an einen **Baustein** dieses Bestands, muß dessen
            Parameter die Marke tragen. Sonst endet die Verfolgung an seiner
            Grenze, und was er innen tut, ist ungemessen. Bei einem gewöhnlichen
            HTML-Element (Kleinbuchstabe) gibt es keinen Parameter, den man
            fragen könnte — dort zählt die Klassenangabe, und die wird gemessen.
          */
          const tag = ts.isJsxSelfClosingElement(opening)
            ? opening.tagName
            : opening.tagName;
          const isComponent = /^[A-Z]/u.test(tag.getText());
          if (isComponent) {
            /*
              Gefragt wird der **Erwartungstyp** an der Übergabestelle, also der
              Typ, den der Baustein deklariert hat — nicht der Typ des Wertes.
              Der Wert trägt die Marke ja gerade; die Frage ist, ob sie drüben
              ankommt.
            */
            const declared = checker.getContextualType(value);
            if (!carries(declared)) {
              lostMarks.push({ node, tag: tag.getText() });
            }
          }
        }
      }

      /* --- eine Kürzung, die das Ende wegnimmt ---------------------- */
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        isUncapped(node.expression.expression)
      ) {
        const method = node.expression.name.getText();
        /*
          **Ein Schnitt, der das Ende behält, ist erlaubt.** `slice(k)` wirft
          den Anfang weg — genau das tut `extensionOf`, und es ist der Grund,
          warum die Endung überhaupt abgesetzt dastehen kann. Ein zweites
          Argument dagegen nimmt das Ende weg, und `substr(a, n)` ebenso.
          Das ist die Regel aus A-A-93 wörtlich: in der Mitte ja, am Ende nie.
        */
        const dropsTail =
          ((method === "slice" || method === "substring") && node.arguments.length >= 2) ||
          (method === "substr" && node.arguments.length >= 2);
        if (dropsTail) cuts.push({ node, method });
      }

      ts.forEachChild(node, walk);
    };
    walk(file);
  }

  /* --- Fixpunkt: Bausteine, die eine Anzeigestelle enthalten -------- */
  const carrierKeys = new Set();
  const allSites = new Map();
  const remember = (element, reason) => {
    const file = element.getSourceFile();
    const key = `${comparable(file.fileName)}#${element.getStart(file)}`;
    if (!allSites.has(key)) allSites.set(key, { element, reasons: new Set() });
    allSites.get(key).reasons.add(reason);
  };

  for (const site of directSites) remember(site.node, "trägt den Wert unmittelbar");

  let grew = true;
  let rounds = 0;
  while (grew) {
    grew = false;
    rounds += 1;
    /* Wer eine Anzeigestelle in sich trägt, ist selbst ein Träger. */
    for (const { element } of allSites.values()) {
      const declaration = enclosingDeclaration(element);
      if (declaration === null) continue;
      const key = keyOf(declaration);
      if (carrierKeys.has(key)) continue;
      carrierKeys.add(key);
      grew = true;
    }
    /* Und jede Aufrufstelle eines Trägers ist wieder eine Anzeigestelle. */
    for (const file of sourceFiles) {
      for (const { node, opening } of jsxElementsOf(file)) {
        const tag = opening.tagName;
        if (!/^[A-Z]/u.test(tag.getText())) continue;
        const declaration = declarationOfTag(tag);
        if (declaration === null) continue;
        if (!carrierKeys.has(keyOf(declaration))) continue;
        const fileOfNode = node.getSourceFile();
        const key = `${comparable(fileOfNode.fileName)}#${node.getStart(fileOfNode)}`;
        if (allSites.has(key)) continue;
        remember(node, `zeigt \`${tag.getText()}\``);
        grew = true;
      }
    }
    if (rounds > 20) break;
  }

  /* --- Klassen sammeln: die Stelle selbst und jedes Elternelement --- */
  const findings = [];
  const unreadable = [];
  let inspectedElements = 0;

  const classAttributeOf = (element) => {
    const opening = ts.isJsxElement(element) ? element.openingElement : element;
    if (opening.attributes === undefined) return null;
    for (const attribute of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attribute)) continue;
      const name = attribute.name.getText();
      if (name !== "className" && name !== "class") continue;
      return attribute.initializer ?? null;
    }
    return null;
  };

  const styleAttributeOf = (element) => {
    const opening = ts.isJsxElement(element) ? element.openingElement : element;
    if (opening.attributes === undefined) return null;
    for (const attribute of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attribute)) continue;
      if (attribute.name.getText() !== "style") continue;
      return attribute.initializer ?? null;
    }
    return null;
  };

  for (const { element, reasons } of allSites.values()) {
    /* Die Stelle und jedes Elternelement in derselben Datei. */
    for (
      let current = element;
      current !== undefined && !ts.isSourceFile(current);
      current = current.parent
    ) {
      if (!ts.isJsxElement(current) && !ts.isJsxSelfClosingElement(current)) continue;
      inspectedElements += 1;

      const classAttribute = classAttributeOf(current);
      if (classAttribute !== null) {
        const read = readClasses(classAttribute);
        const hits = capsOf(read);
        for (const hit of hits) {
          findings.push({
            at: where(current),
            detail: `${hit} — ${[...reasons].join(", ")}`,
          });
        }
        for (const node of read.unreadable) {
          unreadable.push({ at: where(node), text: node.getText().slice(0, 80) });
        }
      }

      const styleAttribute = styleAttributeOf(current);
      if (styleAttribute !== null) {
        const text = styleAttribute.getText();
        for (const rule of CAPPING) {
          const camel = rule.property.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
          const pattern = new RegExp(`\\b(${rule.property}|${camel})\\b`, "u");
          if (!pattern.test(text)) continue;
          if (rule.value !== null && !rule.value.test(text.toLowerCase())) continue;
          findings.push({
            at: where(current),
            detail: `\`style\` erklärt ${rule.property}`,
          });
        }
      }
    }
  }

  return {
    sourceFiles,
    sites: allSites,
    carriers: carrierKeys,
    findings,
    unreadable,
    lostMarks,
    cuts,
    inspectedElements,
  };
};

const report = inspect(buildProgram(), CAP_CLASSES);

heading("2  Die Menge der Anzeigestellen entsteht aus dem Typ");

check("das Programm ist geladen und trägt die Oberfläche", () => {
  requireAtLeast(report.sourceFiles, 60, "Quelldateien im Programm", srcRoot);
});

check("es gibt Werte mit der Marke, und sie stehen auf dem Bildschirm", () => {
  /*
    Die Blindheitsprobe, und sie steht **vor** dem Urteil (T-249-4, dieselbe
    Bauart wie in `proof:foreign`). Wäre die Menge leer — eine verschriebene
    Marke, eine verschobene Datei, ein Übersetzerfehler —, wären alle Aussagen
    danach leer wahr, und der Lauf meldete grün, ohne eine Anzeige gelesen zu
    haben. Das ist die schlimmste Sorte grün.
  */
  assert.ok(
    report.sites.size >= 8,
    `Nur ${report.sites.size} Anzeigestellen für \`UncappedText\` gefunden. ` +
      "Erwartet werden mindestens acht (Anhangsliste, Rückfrage, Musterseite). " +
      "Eine leere oder fast leere Menge heißt: Dieser Lauf mißt nichts.",
  );
});

check("das Programm, über das hier geurteilt wird, übersetzt fehlerfrei", () => {
  /*
    Ein Typfehler macht die betroffene Datei zu `any`, und `any` trägt keine
    Marke. Der Lauf fände dort nichts und meldete grün — eine Aussage über
    Typen in einem Programm mit Typfehlern ist keine (T-186).
  */
  const program = buildProgram();
  const diagnostics = [
    ...program.getSemanticDiagnostics(),
    ...program.getSyntacticDiagnostics(),
  ].filter((diagnostic) => diagnostic.file === undefined || insideSrc(diagnostic.file.fileName));
  assert.equal(
    diagnostics.length,
    0,
    `Der Übersetzer meldet ${diagnostics.length} Befunde: ` +
      diagnostics
        .slice(0, 3)
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "))
        .join(" | "),
  );
});

check("jede Klassenangabe an einer Anzeigestelle ist lesbar", () => {
  assert.equal(
    report.unreadable.length,
    0,
    "Eine Klassenangabe an einer Anzeigestelle entsteht erst zur Laufzeit und " +
      "ist damit nicht zu beurteilen. Sie gehört fest hingeschrieben — dieser " +
      "Lauf rät nicht:\n" +
      report.unreadable.map((entry) => `        ${entry.at}: ${entry.text}`).join("\n"),
  );
});

/* ==================================================================== */
/* 3  Der Schnitt beider Mengen ist leer                                 */
/* ==================================================================== */

heading("3  Der Schnitt ist leer — kein Deckel über einem fremden Namen");

check("keine Anzeigestelle und kein Elternelement trägt einen Deckel", () => {
  assert.equal(
    report.findings.length,
    0,
    `${report.findings.length} Deckel über einem Wert, dessen Ende zählt ` +
      "(A-19.23b, A-A-93):\n" +
      report.findings.map((entry) => `        ${entry.at}: ${entry.detail}`).join("\n"),
  );
});

check("kein markierter Wert verliert seine Marke an der Grenze eines Bausteins", () => {
  /*
    Ohne diese Prüfung wäre das Grün der vorigen hohl: Man müßte den Namen nur
    an einen Baustein reichen, dessen Parameter `ForeignText` heißt, und die
    Verfolgung endete an seiner Tür — was er innen mit einer engen Spalte tut,
    sähe niemand. Dieselbe Lücke hat `proof:foreign` in T-133 an der Kurzform
    und am Rückgabewert geschlossen.
  */
  assert.equal(
    report.lostMarks.length,
    0,
    `${report.lostMarks.length} Übergaben an einen Baustein, der den Wert nicht ` +
      "als `UncappedText` führt:\n" +
      report.lostMarks
        .map((entry) => `        ${where(entry.node)}: <${entry.tag} ${entry.node.name.getText()}={…}>`)
        .join("\n"),
  );
});

check("aus keinem markierten Wert wird das Ende herausgeschnitten", () => {
  assert.equal(
    report.cuts.length,
    0,
    `${report.cuts.length} Kürzungen, die das Ende wegnehmen (erlaubt ist nur, ` +
      "was den Anfang wegnimmt — die Endung steht hinten):\n" +
      report.cuts.map((entry) => `        ${where(entry.node)}: .${entry.method}(…)`).join("\n"),
  );
});

/* ==================================================================== */
/* 4  Der Träger selbst deckelt nicht                                    */
/* ==================================================================== */

heading("4  `.foreign-name` — die Klasse, die das Umbrechen zusichert");

const foreignNameRules = styleSheets.flatMap((sheet) =>
  leafRules(fs.readFileSync(sheet, "utf8"))
    .filter((rule) => classesIn(rule.selector).includes("foreign-name"))
    .map((rule) => ({ ...rule, sheet: displayPath(sheet) })),
);

check("es gibt sie, und zwar genau einmal", () => {
  assert.equal(
    foreignNameRules.length,
    1,
    `\`.foreign-name\` steht ${foreignNameRules.length}-mal in den Stilblättern. ` +
      "Zwei Regeln über dieselbe Zusage sind zwei Wahrheiten, und die zweite " +
      "gewinnt nach Reihenfolge statt nach Absicht.",
  );
});

check("sie sichert den Umbruch zu", () => {
  const declarations = foreignNameRules.map((rule) => rule.declarations).join(";");
  assert.match(
    declarations,
    /overflow-wrap\s*:\s*anywhere/u,
    "`.foreign-name` erklärt kein `overflow-wrap: anywhere`. Ohne sie sprengt " +
      "ein langer Name das Layout — und der nächste, der das sieht, greift zu " +
      "`.truncate`.",
  );
});

check("sie deckelt nicht", () => {
  const reasons = foreignNameRules.flatMap((rule) => cappingReasons(rule.declarations));
  assert.deepEqual(
    reasons,
    [],
    `\`.foreign-name\` deckelt selbst: ${reasons.join("; ")}. Das ist die Klasse, ` +
      "die das Gegenteil zusichert.",
  );
});

/* ==================================================================== */
/* 5  Gegenproben — jede eingesetzte Verletzung muß auffallen             */
/* ==================================================================== */

heading("5  Gegenprobe — ein absichtlich gesetzter Deckel macht den Lauf rot");

/** Eine Quelle, die es auf der Platte nicht gibt, mit genau einer Verletzung. */
const overlayPath = path.join(srcRoot, "features", "todos", "__clamp_probe.tsx");

const probe = (body) => `import type { UncappedText } from "../../api/types";
import { cx } from "../../lib/cx";
import { Foreign } from "../../shared/ui/Foreign";
import { ForeignName } from "../../shared/ui/ForeignName";

export function ClampProbe({ name }: { readonly name: UncappedText }) {
${body}
}
`;

const probes = [
  {
    title: "ein Deckel unmittelbar an der Anzeigestelle",
    source: probe(`  return <ForeignName className="truncate" value={name} />;`),
    expect: (result) => result.findings.length > 0,
  },
  {
    title: "ein Deckel an einem Elternelement, zwei Ebenen höher",
    source: probe(`  return (
    <div className="truncate">
      <span>
        <ForeignName value={name} />
      </span>
    </div>
  );`),
    expect: (result) => result.findings.length > 0,
  },
  {
    title: "ein Deckel, der erst über `cx` dazukommt",
    source: probe(`  return <ForeignName className={cx("attachment__label", "truncate")} value={name} />;`),
    expect: (result) => result.findings.length > 0,
  },
  {
    title: "ein Deckel im `style`-Attribut, an keiner Klasse zu erkennen",
    source: probe(`  return (
    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
      <ForeignName value={name} />
    </span>
  );`),
    expect: (result) => result.findings.length > 0,
  },
  {
    title: "der markierte Wert geht an einen Baustein, der ihn nicht so führt",
    source: probe(`  return <Foreign value={name} />;`),
    expect: (result) => result.lostMarks.length > 0,
  },
  {
    title: "eine Kürzung im Quelltext, die das Ende wegnimmt",
    source: probe(`  return <ForeignName value={name.slice(0, 20)} />;`),
    expect: (result) => result.cuts.length > 0,
  },
  {
    title: "eine Klassenangabe, die erst zur Laufzeit entsteht",
    source: `import type { UncappedText } from "../../api/types";
import { ForeignName } from "../../shared/ui/ForeignName";

export function ClampProbe({ name, extra }: { readonly name: UncappedText; readonly extra: string }) {
  return <ForeignName className={extra} value={name} />;
}
`,
    expect: (result) => result.unreadable.length > 0,
  },
];

for (const entry of probes) {
  check(`Gegenprobe: ${entry.title}`, () => {
    const result = inspect(buildProgram({ path: overlayPath, source: entry.source }), CAP_CLASSES);
    assert.ok(
      entry.expect(result),
      "Diese Verletzung ist eingesetzt und wurde **nicht** gefunden. " +
        `Befunde: ${result.findings.length} Deckel, ${result.lostMarks.length} verlorene Marken, ` +
        `${result.cuts.length} Kürzungen, ${result.unreadable.length} unlesbare Angaben.`,
    );
  });
}

check("Gegenprobe: eine neu erfundene Deckelklasse wird mitgezählt", () => {
  /*
    Die zweite Richtung, und die wichtigere: Menge D darf nicht an dem hängen,
    was heute existiert. Eine Klasse, die es in keinem Stilblatt gibt, wird
    dazugelegt — und sofort als Deckel erkannt, ohne daß eine Zeile dieses Laufs
    sie kennt.
  */
  const { caps } = buildCapSet({
    path: "",
    source: "",
    extraSheet: ".name-kurz { max-width: 8rem; overflow: hidden; text-overflow: ellipsis; }",
  });
  assert.ok(
    caps.has("name-kurz"),
    "Eine dazugelegte Regel mit `text-overflow` ist nicht in der Deckelmenge " +
      "gelandet. Dann ist die Menge aufgezählt und nicht gerechnet.",
  );
});

check("Gegenprobe: ohne Deckelmenge findet der Lauf nichts — und das darf nicht grün heißen", () => {
  /*
    Die dritte Richtung: Wäre Menge D leer, fände Abschnitt 3 nie etwas, und
    der Lauf meldete grün über einen Bestand voller Deckel. Abschnitt 1 fängt
    das ab; hier steht der Beweis, daß es ohne ihn wirklich still bliebe.
  */
  const result = inspect(buildProgram({ path: overlayPath, source: probes[0].source }), new Map());
  assert.equal(
    result.findings.length,
    0,
    "Mit leerer Deckelmenge meldet der Lauf trotzdem etwas — dann kommt das " +
      "Urteil nicht aus den Stilblättern, sondern von woanders her.",
  );
});

/* ==================================================================== */
/* Ausgabe                                                              */
/* ==================================================================== */

process.stdout.write(`\n${"═".repeat(58)}\n`);
process.stdout.write(`${passed} bestanden, ${failed} fehlgeschlagen.\n`);
process.stdout.write(
  `${CAP_CLASSES.size} deckelnde Klassen aus ${styleSheets.length} Stilblättern` +
    `${CAP_ANONYMOUS.length > 0 ? ` (und ${CAP_ANONYMOUS.length} Regeln ohne Klasse)` : ""}; ` +
    `${report.sites.size} Anzeigestellen für fremde Namen in ${report.carriers.size} Bausteinen, ` +
    `${report.inspectedElements} geprüfte Elemente einschließlich ihrer Elternelemente.\n`,
);
process.stdout.write(
  `Darunter ${probes.length + 2} Gegenproben: je eine eingesetzte Verletzung, ` +
    "eine erfundene Deckelklasse und der Beweis, daß ohne Deckelmenge nichts gefunden wird.\n",
);
process.stdout.write(
  "Gemessen ist der Quelltext. Daß ein 200 Zeichen langer Name im Browser " +
    "umbricht und seine Endung zeigt, mißt der e2e-Prüffall aus A-A-93 — nicht dieser Lauf.\n",
);

process.exit(failed === 0 ? 0 : 1);
