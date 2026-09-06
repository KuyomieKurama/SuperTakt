/**
 * Takt — der ausführbare Nachweis über die **Bauart** der Oberfläche (T-191).
 *
 * Aufruf:  pnpm --filter @takt/web proof:surface
 *
 * ===========================================================================
 * Warum es diese Datei gibt
 * ===========================================================================
 *
 * Zwei Zusagen der Oberfläche sind an keinem einzelnen Ort zu Hause, und genau
 * deshalb sind sie beide mehrfach gebrochen worden, ohne daß ein Lauf rot
 * wurde:
 *
 *  1. **Eine Meldefläche steht immer im Baum, auch leer** (B-5 aus T-116). Ein
 *     `role="alert"`, das erst zusammen mit seinem Inhalt entsteht, wird von
 *     vielen Vorlesehilfen übergangen: Sie melden Änderungen an einer Region,
 *     die sie in diesem Augenblick noch nicht kennen — und eine Meldung, die
 *     **während** einer stehenden Fläche entsteht, bleibt stumm (SC 4.1.3).
 *     Behoben in `ConfirmDialog` (T-118), in `TextField` (T-162, O-DA), im
 *     Aufgabenbereich des Add-ins (T-158) und in `NoteField` (T-186, O-FX) —
 *     und **danach viermal von Hand wiedergefunden** (T-191, O-GQ). Dieser
 *     Lauf hat beim ersten Durchgang **fünf weitere** genannt, die niemand
 *     aufgeschrieben hatte, dazu eine sechste im Stilblatt. Das ist keine
 *     Sorgfaltsfrage mehr, das war eine fehlende Messung.
 *  2. **Takt siezt** (E-080). Der Wächter dafür steht seit T-190 im Add-in und
 *     kennt dort beide Formen — das Fürwort und den Imperativ ohne Fürwort.
 *     `apps/web` war gegen keine von beiden gemessen (O-GW). Dieselbe Zusage
 *     in zwei Schärfegraden ist eine halbe Zusage.
 *
 * ===========================================================================
 * Warum ein eigener Lauf und nicht `proof:foreign`
 * ===========================================================================
 *
 * `proof:foreign` beantwortet **eine** Frage — kommt fremder Text ungebändigt
 * auf den Schirm — und beantwortet sie über den Typprüfer. Die zwei Fragen
 * hier haben mit fremdem Text nichts zu tun; sie in dieselbe Datei zu legen
 * hieße, einen Lauf zu führen, dessen Name nicht mehr sagt, was er mißt. Der
 * Bestand hält es überall so: ein Lauf, ein Gegenstand.
 *
 * **Der Preis steht dazu, damit ihn niemand übersieht:** Dieser Lauf ist erst
 * dann Teil von `pnpm check`, wenn `proof:surface` in der Wurzel-`package.json`
 * steht und in `proof:all` aufgenommen ist. Beides gehört dem Orchestrator.
 * Bis dahin ist er ein Wächter, den man von Hand ruft — und das ist genau die
 * Sorte Zusage, die dieser Lauf sonst mißt.
 *
 * ===========================================================================
 * Was dieser Nachweis sieht — und was nicht
 * ===========================================================================
 *
 * **Er sieht** (jede Regel mit ihren Gegenproben in Abschnitt 7):
 *
 *  - **Regel A** — ein Knoten, der eine Live-Rolle **im Quelltext trägt**
 *    (`role="alert"`, `role="status"`, `role="log"`, ein `aria-live`, oder ein
 *    `<output>`), und der aus einem Bedingungsausdruck entsteht, ohne daß ein
 *    umschließendes JSX-Element dazwischenliegt. Das ist die Bauart des
 *    Befundes, nicht seine Stelle: `{x ? <p role="alert">{x}</p> : null}`.
 *  - **Regel B** — ein HTML-Knoten, dessen Klassenname auf `error` oder
 *    `failure` endet, der weder selbst eine Live-Rolle trägt noch in einer
 *    steht. Das ist die zweite Hälfte von O-GQ: `TemplateFields` hatte gar
 *    keine Rolle, und Regel A allein hätte darüber geschwiegen.
 *  - **Regel C** — ein Stilblatt, das einer Live-Region `display: none` oder
 *    `visibility: hidden` gibt, solange sie leer ist. Das hebt Regel A wieder
 *    auf, nur eine Ebene tiefer: Ein Element mit `display: none` steht nicht
 *    im Baum der Vorlesehilfe, die Region entsteht für sie also doch erst mit
 *    ihrer ersten Meldung. Gefunden in genau dieser Gestalt an
 *    `.dirfield__announce` (T-191).
 *  - **Regel D** — die Anrede „du" und der Imperativ ohne Fürwort in jedem
 *    sichtbaren Text der Oberfläche (E-080). Beide Ausdrücke sind
 *    **zeichengleich** aus `apps/outlook-addin/scripts/proof-addin.mjs`
 *    übernommen; siehe {@link ANREDE_DU_QUELLE}.
 *  - **Regel E** — dieselbe Zusage, gegen den anderen Lauf gemessen (E-086).
 *    Der Anredewächter steht in zwei Dateien; Regel E hält sie zeichengleich
 *    und schickt außerdem eine Falltafel durch **beide** Seiten. Bewegt sich
 *    eine Hälfte allein, wird dieser Lauf rot und sagt, welche.
 *
 * **Er sieht nicht:**
 *
 *  - Einen **Baustein**, der die Live-Rolle in sich trägt und selbst bedingt
 *    erscheint — `{fehler === null ? null : <InlineMessage …/>}`. Regel A mißt
 *    die Bauart dort, wo die Rolle **steht**; an der Aufrufstelle steht sie
 *    nicht. Das ist eine echte Lücke und keine Nachlässigkeit: Sie zu
 *    schließen hieße, jeder der heute bedingten Meldungen einen dauerhaften
 *    Wirt zu geben, und das ist eine Produktentscheidung und keine Zeile. Die
 *    gemessene Zahl steht im Bericht zu T-191.
 *  - Den **Tausch eines ganzen Teilbaums**: `{x ? <div><p role="alert">…</p>
 *    </div> : null}`. Dort liegt ein umschließendes JSX-Element zwischen
 *    Bedingung und Region, und genau daran hört Regel A auf — sonst meldete
 *    sie jeden Zweig, der eine Fläche gegen eine andere tauscht (der Zweig
 *    „mit Hülle / ohne Hülle" in `ExportDirectoryField` ist so einer).
 *  - Eine Region, die eine **Funktion** bedingt zurückgibt (`if (x === null)
 *    return null;`). Das ist dieselbe Klasse wie der Baustein oben.
 *  - Ob die Region das **Richtige** sagt. Wortlaut, Höflichkeit und Länge sind
 *    Sache von E-078 und der Textdurchgänge, nicht dieses Laufs.
 *  - Alles außerhalb von `apps/web/src`. Das Add-in hat seinen eigenen Lauf
 *    (`proof:addin`), die Hülle ihren (`proof:shell-surface`).
 *
 * Und die ehrliche Grenze zum Schluß: Dieser Lauf liest **den Quelltext**,
 * nicht den Bildschirm. Daß eine Vorlesehilfe die Änderung tatsächlich
 * ansagt, mißt er nicht und kann er nicht messen.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const srcRoot = path.join(appRoot, 'src');
const styleRoot = path.join(srcRoot, 'styles');

/* ==================================================================== */
/* 0  Werkzeug                                                          */
/* ==================================================================== */

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

const sourceFilePaths = collectSourceFiles(srcRoot);

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

/* ==================================================================== */
/* 1  Regel A — die Live-Region entsteht nicht mit ihrem Inhalt         */
/* ==================================================================== */

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

/* ==================================================================== */
/* 2  Regel B — der Fehlertext ohne Ansage                              */
/* ==================================================================== */

/**
 * Ein Klassenname, der eine Meldung beschriftet: `field__error`,
 * `tfield__error`, `attachment__failure`.
 *
 * Gemessen wird am **Wortende**, nicht am Vorkommen: `field__input--invalid`
 * beschriftet ein Eingabefeld und keine Meldung, und `errorId` ist ohnehin
 * kein Klassenname.
 */
const MESSAGE_CLASS = /(?:^|[_-])(?:error|failure)s?$/i;

/** Die Klassennamen eines JSX-Knotens, soweit sie als Zeichenkette dastehen. */
const classTokensOf = (opening) => {
  const tokens = [];
  for (const attribute of opening.attributes.properties) {
    if (attributeName(attribute) !== 'className') continue;
    const initializer = attribute.initializer;
    if (initializer === undefined) continue;
    if (ts.isStringLiteral(initializer)) {
      tokens.push(...initializer.text.split(/\s+/).filter((part) => part.length > 0));
      continue;
    }
    // `className={cx("tfield__error", …)}` — jede Zeichenkette darin zählt.
    walk(initializer, (node) => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        tokens.push(...node.text.split(/\s+/).filter((part) => part.length > 0));
      }
    });
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

/* ==================================================================== */
/* 3  Regel C — kein `display: none` auf einer leeren Live-Region       */
/* ==================================================================== */

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

/* ==================================================================== */
/* 4  Regel D — Takt siezt, auch hier (E-080, O-GW)                     */
/* ==================================================================== */

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

/* ==================================================================== */
/* 5  Regel E — dieselbe Regel steht in zwei Laeufen (E-086)            */
/* ==================================================================== */

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

/* ==================================================================== */
/* 6  Die Prüfungen über den Bestand                                    */
/* ==================================================================== */

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

const styleFiles = readdirSync(styleRoot)
  .filter((name) => name.endsWith('.css'))
  .sort();

check('kein `display: none` und kein `visibility: hidden` auf einer Live-Region', () => {
  const classes = liveRegionClasses();
  assert.ok(classes.size > 0, 'keine einzige Live-Region gefunden — dann mißt diese Regel nichts');
  const findings = styleFiles.flatMap((name) =>
    findHiddenLiveRegions(name, readFileSync(path.join(styleRoot, name), 'utf8'), classes),
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
  const findings = compareGuards(
    guardOf(readFileSync(OWN_GUARD, 'utf8'), path.basename(OWN_GUARD)),
    guardOf(readFileSync(ADDIN_GUARD, 'utf8'), path.basename(ADDIN_GUARD)),
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

/* ==================================================================== */
/* 7  Die Gegenproben — jede Regel gegen eine eingesetzte Verletzung    */
/* ==================================================================== */

/*
 * Ein Wächter, der nie rot war, ist eine Behauptung über einen Wächter. Jede
 * der vier Regeln fährt deshalb gegen eine Quelle, die es auf der Platte nicht
 * gibt — **in beide Richtungen**: Sie muß die Verletzung finden, und sie darf
 * die richtige Bauart nicht melden. Nur die zweite Hälfte macht eine Lockerung
 * teuer.
 */

heading('F  Gegenproben — jede Regel gegen eine eingesetzte Verletzung');

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

/* ==================================================================== */
/* 8  Ergebnis                                                          */
/* ==================================================================== */

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
    `${String(ANREDE_AUSNAHMEN.length)} geduldete Sätze.\n`,
);
