/**
 * Takt — der ausführbare Nachweis über fremden Text in der Oberfläche
 * (T-129, erweitert um Abschnitt 6 und die Reihen in T-133, um die zwei stillen
 * Ausgänge, den Übersetzer selbst und die Gegenproben in T-186).
 *
 * ===========================================================================
 * Warum es diese Datei gibt
 * ===========================================================================
 *
 * T-124 hat fremden Text an 175 Stellen durch `<Foreign>`, `quotedName` und
 * `foreignText` geführt — und im selben Bericht die Schwäche dieser Lösung
 * benannt (R3):
 *
 *   > Eine Behandlung an einem Baustein ist an der Aufrufstelle unsichtbar.
 *   > Wer einen neuen Anzeigebaustein baut, hat keinen Übersetzerfehler, der
 *   > ihn erinnert.
 *
 * Und es gibt keinen roten Test, der ihn erinnert. Für gewöhnliche Namen ist
 * `visibleText` die **Identität** und `quoteName` setzt dieselben
 * Anführungszeichen wie die Hand: Eine vergessene Stelle verhält sich in jedem
 * Test genau wie eine behandelte. Sie fällt erst auf, wenn jemand einen Titel
 * mit `U+202E` anlegt — und dann fällt sie dem Benutzer auf und nicht uns.
 *
 * Das ist genau die Bauart, die E-063 Punkt 5 messen will: nicht, ob zwei Wege
 * dasselbe Ergebnis liefern, sondern ob es einen zweiten Weg **gibt**.
 *
 * ===========================================================================
 * Wie hier „fremd" bestimmt wird — und warum nicht über eine Liste
 * ===========================================================================
 *
 * Der nächstliegende Weg wäre eine Liste von Feldnamen im Nachweis: `title`,
 * `note`, `name`, `callNumber`. Genau diese Bauart ist in T-117 fünf Wellen
 * lang schiefgegangen (E-063 Punkt 4): Eine abgeschriebene Aufzählung kann nur
 * hinterherhinken, und sie hinkt still.
 *
 * Deshalb steht die Herkunft **im Typ**. `apps/web/src/api/types.ts` führt seit
 * T-129 ein Vokabular — `ForeignText`, `DraftText`, `ServiceText`,
 * `TechnicalKey`, `FileSystemPath`, `ColorValue`, `PageCursor`, `SecretText` —
 * und **kein Feld dort heißt mehr bloß `string`**. `ForeignText` trägt eine
 * leere, freiwillige Marke (`__foreignText?: undefined`), die der Übersetzer
 * durch Zuweisungen, Zerlegungen, Felder, Parameter und Rückgaben mitführt.
 * Dieser Nachweis fragt den Übersetzer danach.
 *
 * Der Gewinn ist nicht die Bequemlichkeit, sondern die Richtung: Die Liste
 * wird nicht gepflegt, sie **entsteht** bei jedem Lauf aus der einen Datei, in
 * der die Antworten des Dienstes beschrieben sind. Ein neues Feld dort zwingt
 * zu einer Entscheidung (Abschnitt 1), statt stillschweigend als „nicht fremd"
 * zu gelten.
 *
 * ===========================================================================
 * Was dieser Nachweis sieht — und was nicht
 * ===========================================================================
 *
 * **Er sieht:**
 *
 *  - jeden fremden Wert, der als Inhalt in ein JSX-Element geht (`{wert}`);
 *  - jeden fremden Wert in einem Textattribut eines HTML-Elements
 *    (`title`, `aria-label`, `alt`, `placeholder`, …);
 *  - jeden fremden Wert, der an einen **Baustein** gereicht wird, der ihn
 *    nicht als fremd führt — das ist die Antwort auf T-124 R3: Nimmt ein
 *    Baustein fremden Text an, muss er es in seiner Signatur sagen
 *    (`readonly label: ForeignText`), und dann wird sein Inneres geprüft;
 *  - jeden fremden Wert, der in einen Satz eingebaut wird (Zeichenkette mit
 *    `${…}` oder `+`) — auch in `.ts`-Dateien, die gar kein JSX enthalten;
 *  - jede Stelle, an der die Herkunft unterwegs **verlorengeht**: ein fremder
 *    Wert, der in ein Feld — auch in **Kurzform** (`{ name }`) —, in eine
 *    getypte Bindung, in den **Rückgabewert** oder in den Parameter einer
 *    **eigenen** Funktion ohne Herkunftstyp geschrieben wird. Ohne diese
 *    Prüfung wäre das Grün der anderen hohl — man müsste den Wert nur einmal
 *    durch ein Zwischenmodell reichen, und der Nachweis wäre blind. Genau so
 *    lagen vier rohe Anzeigestellen in `ExportAudit.tsx`; die Kurzform und die
 *    Rückgabe kamen in T-133 dazu und fanden den Feldnamen einer Exportvorlage
 *    und die **zusammengeführte Leistung** einer Tagesgruppe;
 *  - seit T-133 auch die **Reihe**: `[name, ...namen].join(", ")` ergibt eine
 *    gewöhnliche Zeichenkette, und die Marke fällt an der Sammlung ab statt an
 *    der Naht. Trägt die Elementart die Marke, gilt das Zusammenfügen als
 *    fremder Wert und läuft durch dieselben Prüfungen wie er
 *    ({@link isForeignJoin});
 *  - seit T-133 die **Grenze zum Wert ohne Typ** (Abschnitt 6, O-AT): Aus einem
 *    `unknown` darf Text nur über eine erklärte Übergangsstelle fallen — eine
 *    Funktion, die `unknown` nimmt und fremden Text zurückgibt. Ein
 *    `typeof x === "string"` an einem `unknown` außerhalb davon ist ein Fund.
 *  - seit T-186 die zwei **stillen Ausgänge** aus A-A-39 (Abschnitt 7): eine
 *    Zusicherung `as`, die einem fremden Wert seine Marke nimmt, und die
 *    **Ablage in eine Reihe**, deren Elementart Text ohne Marke ist
 *    (`teile.push(todo.title)` mit `teile: string[]`). Beide bestanden bis
 *    dahin `pnpm typecheck` **und** diesen Lauf, während die Zeile daneben —
 *    `const titel: string = todo.title` — rot war.
 *  - seit T-186 die **Befunde des Übersetzers selbst** (Abschnitt 7, dritte
 *    Prüfung). Eine verschriebene Typeinfuhr macht jede Anzeigestelle ihrer
 *    Datei zu `any`; `any` trägt keine Marke, also findet dieser Lauf nichts
 *    und meldet grün. Eine Aussage über Typen in einem Programm mit Typfehlern
 *    ist keine.
 *  - **seine eigene Blindheit** (Abschnitt 8, A-A-39): drei eingesetzte
 *    Verletzungen in einer Quelle, die es auf der Platte nicht gibt. Bemerkt
 *    eine Prüfung ihre nicht, endet der Lauf rot — auch wenn der Bestand in
 *    Ordnung ist.
 *
 * **Er sieht nicht:**
 *
 *  - Text, den unser eigener Dienst geliefert hat und der fremde Namen bereits
 *    **eingebaut** enthält. `ApiError.message` ist `ServiceText`; steht darin
 *    ein Regelname, ist er hier nicht mehr als solcher erkennbar. Dasselbe gilt
 *    für fertige Sätze aus `@takt/domain` (`poolMovementSentence`) — die
 *    Behandlung gehört dort an die Quelle und nicht hier an das Ergebnis
 *    (T-124 offene Frage 2, unverändert offen).
 *  - `any` aus **fremden** Deklarationen. `import.meta.env[...]` ist `any`
 *    (Vite), und `app/connection.ts` liest daraus Grundadresse und
 *    Sitzungsnachweis. Beides ist keine Anzeige. Abschnitt 6 misst `unknown`,
 *    weil das die Grenze ist, die **wir** ziehen; im eigenen Quelltext kommt
 *    `any` nicht vor.
 *  - **Formzusicherungen** auf die Antwort des eigenen Dienstes
 *    (`parsed as Partial<ErrorEnvelope>`, `request<T>`). Sie behaupten die
 *    Gestalt aus `api/types.ts` und sind der Vertrag mit dem lokalen Dienst,
 *    keine fremde Eingabe.
 *  - Umwege über `String(x)` und `JSON.stringify`. Beide sind absichtliche
 *    Umgehungen und stehen als solche im Quelltext. Eine Bindung, die
 *    ausdrücklich `: string` heißt, findet Abschnitt 4; `as string` findet
 *    Abschnitt 6 (aus einem `unknown`, seit T-133) und Abschnitt 7 (aus einem
 *    fremden Wert, seit T-186).
 *  - einen fremden Wert als Argument einer **fremden** Funktion, deren
 *    Parameter Text ohne Marke ist. A-A-39 verlangt es; wörtlich gebaut ergibt
 *    es am heutigen Baum 27 Fundstellen, darunter `visibleText(…)` und
 *    `dropHiddenCharacters(…)` — also die Behandlung selbst. Die Begründung
 *    und die Zahl stehen bei Abschnitt 7.
 *  - Alles außerhalb von `apps/web/src`. Der Aufgabenbereich des Add-ins hat
 *    seinen eigenen Nachweis (`proof:addin`, Abschnitt 17).
 *  - Ob die Anzeige **richtig** behandelt. Dass `visibleText` die richtigen
 *    Zeichen kennt, ist Sache der Domäne und wird dort gemessen; hier steht
 *    nur, dass die Behandlung stattfindet.
 *
 * Und eine ehrliche Grenze zum Schluss: Dieser Nachweis prüft **den
 * Quelltext**, nicht den Bildschirm. Dass ein `<bdi>` im ausgelieferten Bündel
 * tatsächlich isoliert und dass ein `U+202E` die Leserichtung nicht mehr
 * dreht, ist im Browser gemessen (T-124 Abschnitt 5, E-062) und gehört dem
 * e2e-tester — nicht hierher.
 *
 * Aufruf: `node apps/web/scripts/proof-foreign.mjs`
 * Vorschlag für die Wurzel-`package.json` (gehört dem Orchestrator):
 *   "proof:foreign": "pnpm --filter @takt/web proof:foreign"
 */

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const srcRoot = path.join(appRoot, "src");
const typesFile = path.join(srcRoot, "api", "types.ts");

/* ==================================================================== */
/* 0  Werkzeug                                                          */
/* ==================================================================== */

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

/*
 * Das Programm entsteht aus **der** `tsconfig.json` der Oberfläche und nicht
 * aus einer eigenen Schalterliste. Ein Nachweis mit eigenen Übersetzerschaltern
 * wäre eine zweite Fassung der Übersetzung — dieselbe Sackgasse eine Ebene
 * höher.
 */
const configFile = path.join(appRoot, "tsconfig.json");
const rawConfig = ts.readConfigFile(configFile, ts.sys.readFile);
if (rawConfig.error !== undefined) {
  throw new Error(`tsconfig.json nicht lesbar: ${String(rawConfig.error.messageText)}`);
}
const parsedConfig = ts.parseJsonConfigFileContent(rawConfig.config, ts.sys, appRoot);

/**
 * Ein Programm aus **derselben** Konfiguration — wahlweise mit einer Datei, die
 * es auf der Platte nicht gibt.
 *
 * Die Überlagerung ist der Preis dafür, dass die Gegenproben in Abschnitt 8
 * echte Verletzungen messen können, ohne `apps/web/src` anzufassen (A-A-39).
 * Ein Nachweis, der seine eigene Verletzung in den Bestand schreiben müsste,
 * wäre in einem abgebrochenen Lauf ein Fund, den niemand bestellt hat.
 *
 * @param {{ path: string, source: string } | null} overlay
 * @returns {ts.Program}
 */
const buildProgram = (overlay = null) => {
  if (overlay === null) return ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
  const target = path.resolve(overlay.path);
  const host = ts.createCompilerHost(parsedConfig.options, true);
  const readOriginal = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreate) =>
    path.resolve(name) === target
      ? ts.createSourceFile(name, overlay.source, languageVersion, true)
      : readOriginal(name, languageVersion, onError, shouldCreate);
  host.fileExists = (name) => path.resolve(name) === target || ts.sys.fileExists(name);
  host.readFile = (name) => (path.resolve(name) === target ? overlay.source : ts.sys.readFile(name));
  return ts.createProgram([...parsedConfig.fileNames, target], parsedConfig.options, host);
};

/** Die Marken der beiden Herkunftstypen. Sie stehen in `api/types.ts`. */
const FOREIGN_MARK = "__foreignText";
const DRAFT_MARK = "__draftText";

/** Trägt der Typ (oder einer seiner Bestandteile) diese Marke? */
const carries = (type, mark) => {
  if (type === undefined || type === null) return false;
  if (type.isUnion() || type.isIntersection()) return type.types.some((part) => carries(part, mark));
  return type.getProperty(mark) !== undefined;
};

const isForeign = (type) => carries(type, FOREIGN_MARK);
const isDraft = (type) => carries(type, DRAFT_MARK);

/**
 * Die Fragen, die einen **Typprüfer** brauchen — gebündelt an einem Programm.
 *
 * Bis T-186 standen sie unmittelbar am einen Programm dieses Laufs. Das ging,
 * solange es nur eines gab; die Gegenproben in Abschnitt 8 brauchen dieselben
 * Fragen an einem **zweiten** (Abschnitt 0, {@link buildProgram}). Die
 * Alternative wäre eine zweite Abschrift von „kommt aus diesem Ausdruck fremder
 * Text" gewesen — in genau der Datei, die das Abschreiben von Herkunftswissen
 * für den Ursprung allen Übels hält.
 *
 * @param {ts.Program} program
 */
const lensFor = (program) => {
  const checker = program.getTypeChecker();

  /** Die Quelldateien der Oberfläche — ohne Deklarationen und ohne `vite.config.ts`. */
  const sourceFiles = program
    .getSourceFiles()
    .filter((file) => !file.isDeclarationFile && file.fileName.startsWith(srcRoot + path.sep));

  /**
   * Trägt die **Elementart** einer Sammlung die Marke? (T-133)
   *
   * `readonly ForeignText[]` ist eine Reihe fremden Textes; die Marke sitzt am
   * Glied und nicht an der Reihe. Wer danach fragt, kann `join` verfolgen.
   */
  const elementIsForeign = (type) => {
    if (type === undefined || type === null) return false;
    if (type.isUnion() || type.isIntersection()) return type.types.some(elementIsForeign);
    const args = checker.getTypeArguments?.(type);
    if (args?.[0] !== undefined && isForeign(args[0])) return true;
    const index = checker.getIndexTypeOfType?.(type, ts.IndexKind.Number);
    return index !== undefined && isForeign(index);
  };

  /**
   * Fügt dieser Ausdruck eine **Reihe** fremden Textes zusammen? (T-133)
   *
   * Der Weg, den die Abschnitte 2 bis 4 sonst nicht sehen:
   * `[view.column.name, ...columns].join(", ")` liefert eine gewöhnliche
   * Zeichenkette, und die Marke fällt an der **Sammlung** ab, nicht an der Naht.
   * Für jede Prüfung, die nach dem Typ des eingesetzten Ausdrucks fragt, ist der
   * Satz danach unverdächtig — obwohl er drei fremde Namen trägt. Gefunden in
   * genau dieser Gestalt in `BoardScreen` (Ansage der Mehrfachvorkommen) und in
   * `describeDeviations` (Reihenfolge der Exportfelder).
   */
  const isForeignJoin = (node) =>
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.getText() === "join" &&
    elementIsForeign(checker.getTypeAtLocation(node.expression.expression));

  /**
   * Kommt aus diesem Ausdruck fremder Text — unmittelbar oder aus einer Reihe?
   *
   * Die eine Frage, die die Abschnitte 2 bis 4 und 7 stellen. Sie steht hier und
   * nicht viermal dort, damit ein weiterer Träger an **einer** Stelle dazukommt.
   */
  const yieldsForeign = (node) =>
    node !== undefined && (isForeign(checker.getTypeAtLocation(node)) || isForeignJoin(node));

  return { program, checker, sourceFiles, elementIsForeign, isForeignJoin, yieldsForeign };
};

const lens = lensFor(buildProgram());
const { program, checker, sourceFiles, elementIsForeign, isForeignJoin, yieldsForeign } = lens;

/**
 * Sagt dieser Typ „ich nehme fremden Text an"? Auch als **Reihe** davon.
 *
 * `TagPath` nimmt `readonly ForeignText[]` — der Ordnerpfad ist fremd, Glied für
 * Glied. Die Marke sitzt dann am Element und nicht an der Reihe; ohne diese
 * Zeile hielte der Nachweis die erklärte Übergabe für eine rohe.
 */
const declaresForeign = (type) => {
  if (type === undefined || type === null) return false;
  if (isForeign(type)) return true;
  if (checker.isArrayLikeType?.(type) === true || checker.isArrayType?.(type) === true) {
    const element = checker.getTypeArguments?.(type)?.[0];
    if (element !== undefined) return isForeign(element);
  }
  const index = checker.getIndexTypeOfType?.(type, ts.IndexKind.Number);
  return index !== undefined && isForeign(index);
};

/** Ist der Typ Text? Auch als Bestandteil einer Vereinigung oder Verschneidung. */
const isTextType = (type) => {
  if (type === undefined || type === null) return false;
  if (type.isUnion() || type.isIntersection()) return type.types.some(isTextType);
  return (type.flags & ts.TypeFlags.StringLike) !== 0;
};

const where = (node) => {
  const file = node.getSourceFile();
  const { line } = file.getLineAndCharacterOfPosition(node.getStart());
  return `${path.relative(srcRoot, file.fileName)}:${String(line + 1)}`;
};

const shortText = (node) => node.getText().replace(/\s+/g, " ").slice(0, 64);

/**
 * Der **Gipfel** einer Kette: `entry.note` in `entry.note.length === 0` ist
 * keine Anzeige, `entry.note.trim()` schon.
 *
 * Von einem fremden Wert aus wird nach oben gestiegen, solange er das Objekt
 * eines Zugriffs oder der Empfänger eines Aufrufs ist. Was am Ende dasteht, ist
 * das, was auf dem Bildschirm landet. Ist es keine Zeichenkette mehr — eine
 * Länge, ein Vergleich, ein `includes` —, dann wird der fremde Wert benutzt und
 * nicht gezeigt.
 */
const summit = (node) => {
  let top = node;
  for (;;) {
    const parent = top.parent;
    if (parent === undefined) return top;
    const climbs =
      ((ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
        parent.expression === top) ||
      (ts.isCallExpression(parent) && parent.expression === top) ||
      ((ts.isNonNullExpression(parent) || ts.isParenthesizedExpression(parent)) &&
        parent.expression === top);
    if (!climbs) return top;
    top = parent;
  }
};

/**
 * Nimmt der Parameter, in den dieses Argument geht, fremden Text an?
 *
 * Das ist die Frage nach der **Senke**: `foreignText(todo.title)` ist in
 * Ordnung, weil `foreignText` in seiner Signatur `ForeignText` verlangt und
 * `string` zurückgibt. Der Nachweis kennt dabei keinen einzigen Funktionsnamen
 * — er liest die Signatur. Wer eine vierte Behandlung baut und sie richtig
 * deklariert, wird ohne Änderung an dieser Datei anerkannt; wer `quotedName`
 * auf `string` verbreitert, macht diesen Nachweis rot und nicht grün.
 */
const parameterTakesForeign = (call, argument) => {
  const signature = checker.getResolvedSignature(call);
  if (signature === undefined) return false;
  const index = call.arguments.indexOf(argument);
  if (index < 0) return false;
  const parameters = signature.parameters;
  const symbol = parameters[index] ?? parameters[parameters.length - 1];
  if (symbol === undefined) return false;
  return isForeign(checker.getTypeOfSymbolAtLocation(symbol, call));
};

/* ==================================================================== */
/* 1  Die Herkunft steht an einem Ort                                   */
/* ==================================================================== */

heading("1  Die Herkunft steht an einem Ort und wird nicht abgeschrieben");

/** Die erlaubten Namen für Text in `api/types.ts`. */
const VOCABULARY = new Set([
  "Id",
  "Timestamp",
  "CalendarDay",
  "ForeignText",
  "DraftText",
  "ServiceText",
  "TechnicalKey",
  "FileSystemPath",
  "ColorValue",
  "PageCursor",
  "SecretText",
  // Bytes, die der Dienst bereits kodiert ausliefert (das Vorschaubild eines
  // Bildanhangs, A-19.13). Kein Anzeigetext: Der Wert geht in ein `src` und nie
  // in einen Satz. Er heißt bewusst nicht `ForeignText` — dieser Nachweis
  // forderte an jeder Verwendung eine Behandlung ein, die es für Bytes nicht
  // gibt — und nicht `string`, dann wäre er unsichtbar.
  "EncodedBytes",
  "ExportSourcePath",
  "ExportTransformation",
  "ExportConditionOperator",
  "ExportValue",
]);

const typesSource = program.getSourceFile(typesFile);
assert.ok(typesSource !== undefined, "api/types.ts liegt nicht im Programm");

check("kein Feld der Dienstantworten heißt bloß `string`", () => {
  /*
   * Die zweite Hälfte des Nachweises, und die wichtigere: Abschnitt 2 kann nur
   * finden, was als fremd bekannt ist. Ein neues Feld `readonly subject:
   * string` wäre für ihn unsichtbar — und niemand würde rot.
   *
   * Deshalb ist ein nacktes `string` in dieser Datei verboten. Wer ein Feld
   * anlegt, wählt einen Namen aus dem Vokabular und **entscheidet damit**.
   * Erlaubt bleibt `string` nur als Schlüsseltyp (`Record<string, …>`) und in
   * den Aliasdefinitionen des Vokabulars selbst.
   */
  const bare = [];
  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.StringKeyword) {
      let ok = false;
      for (let p = node.parent; p !== undefined && !ts.isSourceFile(p); p = p.parent) {
        if (ts.isTypeAliasDeclaration(p) && VOCABULARY.has(p.name.getText())) ok = true;
        if (ts.isIndexSignatureDeclaration(p)) ok = true;
        if (
          ts.isTypeReferenceNode(p) &&
          p.typeName.getText() === "Record" &&
          p.typeArguments?.[0] !== undefined &&
          (p.typeArguments[0] === node || p.typeArguments[0].pos <= node.pos)
        ) {
          if (p.typeArguments[0] === node) ok = true;
        }
      }
      if (!ok) bare.push(where(node));
    }
    ts.forEachChild(node, visit);
  };
  visit(typesSource);
  assert.deepEqual(bare, [], `nacktes \`string\` in api/types.ts: ${bare.join(", ")}`);
});

check("`ForeignText` und `DraftText` tragen ihre Marke, die übrigen Namen nicht", () => {
  /*
   * Der Wächter über den Wächter. Nähme jemand die Marke aus `ForeignText`
   * heraus, gingen alle Prüfungen darunter auf einen Schlag grün — und zwar
   * lautlos. Das ist die schlimmste Sorte grün.
   */
  const alias = (name) => {
    const decl = typesSource.statements.find(
      (s) => ts.isTypeAliasDeclaration(s) && s.name.getText() === name,
    );
    assert.ok(decl !== undefined, `${name} gibt es nicht mehr`);
    return checker.getTypeAtLocation(decl.type);
  };

  assert.equal(isForeign(alias("ForeignText")), true, "ForeignText hat seine Marke verloren");
  assert.equal(isTextType(alias("ForeignText")), true, "ForeignText ist kein Text mehr");
  assert.equal(isDraft(alias("DraftText")), true, "DraftText hat seine Marke verloren");
  assert.equal(isForeign(alias("DraftText")), false, "DraftText gilt als fremd");

  for (const name of ["ServiceText", "TechnicalKey", "FileSystemPath", "ColorValue"]) {
    assert.equal(isForeign(alias(name)), false, `${name} gilt als fremd`);
    assert.equal(isDraft(alias(name)), false, `${name} gilt als Entwurf`);
  }
});

check("die Klasse ist nicht leer und nicht alles", () => {
  /*
   * Kein Abbild der Liste, sondern eine **Anforderung** an sie — dieselbe
   * Bauart wie `ANGENOMMENE_ZEICHEN` in `proof:addin` Abschnitt 16. Wäre kein
   * Feld mehr fremd, wäre jede Schleife darunter grün; wäre jedes fremd, wäre
   * der Nachweis unbenutzbar und würde abgeschaltet.
   */
  const property = (interfaceName, propertyName) => {
    const decl = typesSource.statements.find(
      (s) => ts.isInterfaceDeclaration(s) && s.name.getText() === interfaceName,
    );
    assert.ok(decl !== undefined, `${interfaceName} gibt es nicht mehr`);
    const member = decl.members.find((m) => m.name?.getText() === propertyName);
    assert.ok(member !== undefined, `${interfaceName}.${propertyName} gibt es nicht mehr`);
    return checker.getTypeAtLocation(member.type);
  };

  assert.equal(isForeign(property("Todo", "title")), true, "der Titel eines Todos gilt als eigen");
  assert.equal(isForeign(property("TimeEntry", "note")), true, "die Leistung gilt als eigen");
  assert.equal(isForeign(property("Tag", "name")), true, "ein Tagname gilt als eigen");
  assert.equal(isForeign(property("ApiError", "code")), false, "ein technischer Schlüssel gilt als fremd");
  assert.equal(isForeign(property("ApiError", "message")), false, "unser eigener Meldungstext gilt als fremd");
});

check("die drei Behandlungen nehmen fremden Text an und geben gewöhnlichen zurück", () => {
  /*
   * Gelesen wird die **Signatur**, nicht der Rumpf und nicht der Name. Damit
   * ist die Menge der Behandlungen keine Liste in dieser Datei, sondern eine
   * Eigenschaft des Quelltextes: Alles, was `ForeignText` verlangt, gilt als
   * Behandlung. Verbreitert jemand `quotedName` auf `string`, verliert die
   * Funktion diese Eigenschaft und Abschnitt 2 meldet ihre 103 Aufrufstellen.
   */
  const parameterType = (file, exportName) => {
    const source = program.getSourceFile(path.join(srcRoot, file));
    assert.ok(source !== undefined, `${file} gibt es nicht`);
    const symbol = checker.getSymbolAtLocation(source);
    assert.ok(symbol !== undefined, `${file} führt keine Ausfuhren`);
    const found = checker
      .getExportsOfModule(symbol)
      .find((entry) => entry.getName() === exportName);
    assert.ok(found !== undefined, `${file} führt ${exportName} nicht mehr`);
    const type = checker.getTypeOfSymbolAtLocation(found, found.valueDeclaration ?? source);
    const signature = type.getCallSignatures()[0];
    assert.ok(signature !== undefined, `${exportName} ist keine Funktion mehr`);
    return {
      erster: checker.getTypeOfSymbolAtLocation(signature.parameters[0], source),
      rueckgabe: signature.getReturnType(),
    };
  };

  for (const name of ["quotedName", "foreignText"]) {
    const { erster, rueckgabe } = parameterType("lib/foreign.ts", name);
    assert.equal(isForeign(erster), true, `${name} nimmt keinen fremden Text mehr an`);
    assert.equal(isForeign(rueckgabe), false, `${name} gibt fremden Text zurück`);
  }

  // Und der Baustein: seine Eigenschaft `value` ist dieselbe Senke als Attribut.
  const source = program.getSourceFile(path.join(srcRoot, "components", "Foreign.tsx"));
  assert.ok(source !== undefined, "components/Foreign.tsx gibt es nicht");
  const foreignComponent = checker
    .getExportsOfModule(checker.getSymbolAtLocation(source))
    .find((entry) => entry.getName() === "Foreign");
  assert.ok(foreignComponent !== undefined, "der Baustein Foreign wird nicht mehr ausgeführt");
  const signature = checker
    .getTypeOfSymbolAtLocation(foreignComponent, foreignComponent.valueDeclaration ?? source)
    .getCallSignatures()[0];
  const props = checker.getTypeOfSymbolAtLocation(signature.parameters[0], source);
  const value = props.getProperty("value");
  assert.ok(value !== undefined, "Foreign hat keine Eigenschaft `value` mehr");
  assert.equal(
    isForeign(checker.getTypeOfSymbolAtLocation(value, source)),
    true,
    "Foreign nimmt keinen fremden Text mehr an",
  );
});

/* ==================================================================== */
/* 2  Kein fremder Wert steht roh in der Anzeige                        */
/* ==================================================================== */

heading("2  Kein fremder Wert steht roh in der Anzeige");

/**
 * Attribute eines HTML-Elements, die als Text bei einem Menschen ankommen.
 *
 * Die Liste ist bewusst kurz und bewusst genannt: Sie ist **keine** Aufzählung
 * fremder Werte (die kommt aus den Typen), sondern eine Aussage darüber, was
 * der Browser vorliest oder anzeigt. `aria-labelledby` steht nicht darin — es
 * trägt Kennungen, keinen Text. `href` und `id` ebenfalls nicht: Sie sind zu
 * prüfen, aber nach anderen Regeln als der Zeichenklasse für Namen.
 */
const TEXT_ATTRIBUTES = new Set([
  "title",
  "alt",
  "placeholder",
  "aria-label",
  "aria-placeholder",
  "aria-description",
  "aria-roledescription",
  "aria-valuetext",
]);

/** Eigenschaften, die React selbst verbraucht. Sie erscheinen nie auf dem Bildschirm. */
const REACT_INTERNAL = new Set(["key", "ref"]);

const rawInDisplay = [];
const rawInSentence = [];
/** Wie oft ein fremder Wert ordentlich in eine Senke gelaufen ist. */
let treatedCount = 0;

/**
 * Sucht in einem Ausdruck nach fremden Werten, die **nicht** durch eine Senke
 * gehen.
 *
 * Vier Wege werden dabei nicht weiterverfolgt, und jeder aus einem Grund:
 *
 *  - **Funktionen** (`onClick={() => start(todo.title)}`): Was ein Baustein
 *    später aufruft, ist keine Anzeige. Das JSX in ihrem Rumpf wird trotzdem
 *    geprüft — der Durchlauf über die Datei besucht jedes JSX-Element, gleich
 *    wie tief es liegt.
 *  - **Die Bedingung** einer Fallunterscheidung und die linke Seite von `&&`:
 *    Sie entscheiden, was gezeigt wird, und werden nicht selbst gezeigt.
 *  - **Behandelte Argumente**: das eigentliche Ziel.
 *  - **Ketten, die keinen Text mehr ergeben** (`note.length === 0`): siehe
 *    {@link summit}.
 */
const scanExpression = (node, kind, note) => {
  if (node === undefined) return;

  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return; // Der Durchlauf über die Datei besucht es ohnehin.
  }
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return;

  if (ts.isConditionalExpression(node)) {
    scanExpression(node.whenTrue, kind, note);
    scanExpression(node.whenFalse, kind, note);
    return;
  }
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
  ) {
    scanExpression(node.right, kind, note);
    return;
  }
  /*
   * Die zusammengefügte Reihe wird wie ein Atom behandelt und **vor** dem
   * Zweig für Aufrufe geprüft: Sie **ist** ein Aufruf, und ohne diese Zeile
   * liefe der Durchlauf in ihre Argumente statt in sie selbst (T-133).
   */
  if (isForeignJoin(node)) {
    rawInDisplay.push(`${where(node)}  ${kind}  ${shortText(node)}${note}`);
    return;
  }

  if (ts.isCallExpression(node)) {
    for (const argument of node.arguments) {
      if (parameterTakesForeign(node, argument)) {
        if (isForeign(checker.getTypeAtLocation(argument))) treatedCount += 1;
        continue;
      }
      scanExpression(argument, kind, note);
    }
    scanExpression(node.expression, kind, note);
    return;
  }

  const isAtom =
    ts.isIdentifier(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node);
  if (isAtom && isForeign(checker.getTypeAtLocation(node))) {
    const top = summit(node);
    if (isTextType(checker.getTypeAtLocation(top))) {
      rawInDisplay.push(`${where(node)}  ${kind}  ${shortText(top)}${note}`);
    }
    return;
  }

  ts.forEachChild(node, (child) => {
    scanExpression(child, kind, note);
  });
};

const scanJsx = (node) => {
  const children = ts.isJsxElement(node)
    ? node.children
    : ts.isJsxFragment(node)
      ? node.children
      : [];
  for (const child of children) {
    if (ts.isJsxExpression(child) && child.expression !== undefined) {
      scanExpression(child.expression, "Inhalt", "");
    }
  }

  const opening = ts.isJsxSelfClosingElement(node)
    ? node
    : ts.isJsxElement(node)
      ? node.openingElement
      : undefined;
  if (opening === undefined) return;

  const tag = opening.tagName.getText();
  const intrinsic = /^[a-z]/.test(tag);

  for (const attribute of opening.attributes.properties) {
    if (!ts.isJsxAttribute(attribute)) continue;
    const name = attribute.name.getText();
    if (REACT_INTERNAL.has(name)) continue;
    const initializer = attribute.initializer;
    if (initializer === undefined || !ts.isJsxExpression(initializer)) continue;
    const value = initializer.expression;
    if (value === undefined) continue;

    if (intrinsic) {
      if (TEXT_ATTRIBUTES.has(name)) scanExpression(value, "Attribut", ` (<${tag} ${name}>)`);
      continue;
    }

    /*
     * Ein **Baustein**. Hier steht die Antwort auf T-124 R3, und sie ist eine
     * Zeile: Wer fremden Text annimmt, sagt es in seiner Signatur. Führt die
     * Eigenschaft `ForeignText`, ist die Übergabe in Ordnung — und das Innere
     * des Bausteins wird geprüft, weil der Wert dort weiterhin fremd ist.
     * Führt sie `string`, ist an der Aufrufstelle nicht zu sehen, was mit dem
     * Wert geschieht; genau das soll nicht mehr vorkommen.
     */
    if (declaresForeign(checker.getContextualType(value))) {
      treatedCount += 1;
      continue;
    }
    scanExpression(value, "Baustein", ` (<${tag} ${name}>)`);
  }
};

for (const file of sourceFiles) {
  const walk = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      scanJsx(node);
    }
    ts.forEachChild(node, walk);
  };
  walk(file);
}

check("kein fremder Wert steht roh im JSX", () => {
  const found = [...new Set(rawInDisplay)].sort();
  assert.deepEqual(found, [], `roh angezeigt:\n        ${found.join("\n        ")}`);
});

check("und der Durchlauf ist nicht leer gelaufen", () => {
  /*
   * Ein Nachweis, der nichts findet, weil er nichts sieht, ist schlimmer als
   * keiner. Diese Zeile misst, dass fremde Werte tatsächlich durch Senken
   * gelaufen sind — sie wird rot, wenn die Marke verschwindet, wenn das
   * Programm keine Dateien mehr lädt oder wenn jemand `tsconfig.json` so
   * ändert, dass `src` nicht mehr darin liegt.
   */
  assert.ok(sourceFiles.length > 60, `nur ${String(sourceFiles.length)} Quelldateien geladen`);
  assert.ok(treatedCount > 80, `nur ${String(treatedCount)} behandelte Übergaben gesehen`);
});

/* ==================================================================== */
/* 3  Kein fremder Wert wird roh in einen Satz eingebaut                */
/* ==================================================================== */

heading("3  Kein fremder Wert wird roh in einen Satz eingebaut");

/*
 * Der Weg, den Abschnitt 2 nicht sieht: `Timer für ${todo.title} starten`.
 * Der fertige Satz ist eine gewöhnliche Zeichenkette — die Marke ist an der
 * Nahtstelle verloren —, und er geht als `aria-label` oder als Rumpf einer
 * Meldung an einen Menschen. Das ist genau die Stelle, an der ein
 * Richtungszeichen am meisten wiegt: Der fremde Name sitzt **mitten** in
 * unserem Satz.
 *
 * Geprüft wird auch in `.ts`-Dateien: `lib/errorText.ts`, `lib/movement.ts` und
 * `app/TimerContext.tsx` bauen Sätze ohne ein einziges JSX-Element.
 */
const isInsideReactInternalAttribute = (node) => {
  for (let p = node.parent; p !== undefined; p = p.parent) {
    if (ts.isJsxAttribute(p)) return REACT_INTERNAL.has(p.name.getText());
    if (ts.isJsxElement(p) || ts.isJsxSelfClosingElement(p)) return false;
  }
  return false;
};

for (const file of sourceFiles) {
  const walk = (node) => {
    const parts = ts.isTemplateSpan(node)
      ? [node.expression]
      : ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken
        ? [node.left, node.right]
        : [];
    for (const part of parts) {
      if (!yieldsForeign(part)) continue;
      if (isInsideReactInternalAttribute(part)) continue; // `key` erscheint nie.
      rawInSentence.push(`${where(part)}  ${shortText(part)}`);
    }
    ts.forEachChild(node, walk);
  };
  walk(file);
}

check("kein fremder Wert steht roh in einer zusammengesetzten Zeichenkette", () => {
  const found = [...new Set(rawInSentence)].sort();
  assert.deepEqual(found, [], `roh in einem Satz:\n        ${found.join("\n        ")}`);
});

/*
 * Eine eigene Zählung, unabhängig davon, welche Prüfung eine Reihe zuerst
 * anfasst: Wird sie ordentlich behandelt, sieht `scanExpression` sie gar nicht
 * erst, weil die Übergabe schon vorher als Senke anerkannt ist.
 */
let foreignJoins = 0;
for (const file of sourceFiles) {
  const walk = (node) => {
    if (isForeignJoin(node)) foreignJoins += 1;
    ts.forEachChild(node, walk);
  };
  walk(file);
}

check("und die Prüfung hat auch Reihen fremden Textes gesehen", () => {
  /*
   * Die Gegenprobe zu {@link isForeignJoin}: Sähe der Durchlauf keine einzige
   * zusammengefügte Reihe mehr, wären die Prüfungen darüber wieder blind für
   * den Weg, den T-133 gefunden hat — und zwar lautlos. Dieselbe Bauart wie
   * „der Durchlauf ist nicht leer gelaufen" eine Prüfung weiter oben.
   */
  assert.ok(foreignJoins > 2, `nur ${String(foreignJoins)} Reihen fremden Textes gesehen`);
});

/* ==================================================================== */
/* 4  Die Herkunft geht unterwegs nicht verloren                        */
/* ==================================================================== */

heading("4  Die Herkunft geht unterwegs nicht verloren");

/*
 * Ohne diesen Abschnitt wäre das Grün der beiden davor hohl.
 *
 * `app/exportAudit.ts` baute aus einer Antwort des Dienstes ein Zeilenmodell
 * mit `readonly reason: string`. Von dort an war der Wert für jeden Nachweis
 * gewöhnlicher Text — und `components/ExportAudit.tsx` zeigte ihn roh an, samt
 * Titel, Call-Nummer und dem Namen dessen, der die Buchung zurückgesetzt hat.
 * Vier Anzeigestellen, unsichtbar hinter **einer** Zuweisung.
 *
 * Zwei Ziele sind erlaubt, und beide sagen etwas:
 *
 *  - `ForeignText` — die Herkunft bleibt erhalten und wird weiter verfolgt.
 *  - `DraftText`   — sie geht **absichtlich** verloren, weil der Wert ab hier
 *    der Entwurf des Benutzers in einem Eingabefeld ist (E-063 Punkt 1). Das
 *    ist der einzige zulässige Ausstieg, und er steht sichtbar im Typ.
 *
 * Gemessen wird an drei Stellen, an denen ein Wert **abgelegt oder übergeben**
 * wird: in einem Feld eines Objekts, in einer ausdrücklich getypten Bindung und
 * als Argument an eine Funktion **dieser Oberfläche**.
 *
 * Fremde Funktionen bleiben außen vor, und das ist kein Versehen:
 * `todo.title.toLowerCase().includes(suche)` verliert die Marke ebenfalls — dort
 * wird aber nichts angezeigt, sondern verglichen. Nur was wir selbst
 * geschrieben haben, können wir auch selbst deklarieren.
 */
const lostOrigin = [];
const undeclaredArguments = [];
for (const file of sourceFiles) {
  const walk = (node) => {
    if (ts.isCallExpression(node)) {
      /*
       * `reactivationTitle(todo.title)` — die Funktion baut daraus einen Satz.
       * Nimmt sie `string`, ist an der Aufrufstelle wieder nicht zu sehen, was
       * mit dem Wert geschieht, und Abschnitt 3 kann in ihrem Rumpf nichts mehr
       * finden. Dieselbe Regel wie beim Baustein, nur ohne JSX.
       */
      const signature = checker.getResolvedSignature(node);
      const declaration = signature?.declaration;
      const own =
        declaration !== undefined &&
        declaration.getSourceFile().fileName.startsWith(srcRoot + path.sep);
      if (signature !== undefined && own) {
        node.arguments.forEach((argument, index) => {
          if (!yieldsForeign(argument)) return;
          const parameters = signature.parameters;
          const symbol = parameters[index] ?? parameters[parameters.length - 1];
          if (symbol === undefined) return;
          const parameterType = checker.getTypeOfSymbolAtLocation(symbol, node);
          if (isTextType(parameterType) && !isForeign(parameterType) && !isDraft(parameterType)) {
            undeclaredArguments.push(
              `${where(argument)}  ${shortText(node.expression)}(… ${shortText(argument)} …)`,
            );
          }
        });
      }
    }
    if (ts.isPropertyAssignment(node) && node.initializer !== undefined) {
      if (yieldsForeign(node.initializer)) {
        const target = checker.getContextualType(node.initializer);
        if (target !== undefined && isTextType(target) && !isForeign(target) && !isDraft(target)) {
          lostOrigin.push(`${where(node)}  ${shortText(node)}`);
        }
      }
    }
    /*
     * **Die Kurzform zählt genauso** (T-133). `fields.push({ name, source })`
     * ist keine `PropertyAssignment`, und bis T-133 lief sie an dieser Prüfung
     * vorbei: Ein Feld `readonly name: string` nahm dort fremden Text
     * entgegen, ohne dass irgendetwas rot wurde. Gemessen in Gegenprobe J —
     * sie blieb grün, obwohl der Feldname eines Exportfeldes seine Herkunft
     * verlor.
     *
     * Der Zieltyp steht nicht am Bezeichner, sondern an der Eigenschaft des
     * Objekts, in dem er liegt; deshalb der Umweg über die Gestalt des
     * umgebenden Literals.
     */
    if (ts.isShorthandPropertyAssignment(node)) {
      if (yieldsForeign(node.name)) {
        const literal = node.parent;
        const shape = ts.isObjectLiteralExpression(literal)
          ? checker.getContextualType(literal)
          : undefined;
        const property = shape?.getProperty(node.name.getText());
        const target =
          property === undefined
            ? undefined
            : checker.getTypeOfSymbolAtLocation(property, node);
        if (target !== undefined && isTextType(target) && !isForeign(target) && !isDraft(target)) {
          lostOrigin.push(`${where(node)}  { ${shortText(node)} }`);
        }
      }
    }
    /*
     * **Und die Rückgabe** (T-133). Derselbe Verlust, nur an der anderen Seite
     * einer Funktion: `previewNote(entries): string` fügte die Leistungstexte
     * einer Tagesgruppe zusammen und gab sie als gewöhnlichen Text zurück —
     * von dort an war die zusammengeführte Leistung für jede Prüfung
     * unverdächtig, und `ExportGroups.tsx` zeigte sie roh, im Absatz **und**
     * im `title`. Gefunden erst, als die Reihe (siehe {@link isForeignJoin})
     * als fremder Wert galt.
     */
    if (ts.isReturnStatement(node) && node.expression !== undefined) {
      if (yieldsForeign(node.expression)) {
        const target = checker.getContextualType(node.expression);
        if (target !== undefined && isTextType(target) && !isForeign(target) && !isDraft(target)) {
          lostOrigin.push(`${where(node)}  ${shortText(node)}`);
        }
      }
    }
    if (ts.isVariableDeclaration(node) && node.type !== undefined && node.initializer !== undefined) {
      if (yieldsForeign(node.initializer)) {
        const target = checker.getTypeFromTypeNode(node.type);
        if (isTextType(target) && !isForeign(target) && !isDraft(target)) {
          lostOrigin.push(`${where(node)}  ${shortText(node)}`);
        }
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(file);
}

check("keine eigene Funktion nimmt fremden Text an, ohne es zu sagen", () => {
  const found = [...new Set(undeclaredArguments)].sort();
  assert.deepEqual(found, [], `Herkunft am Parameter verloren:\n        ${found.join("\n        ")}`);
});

check("kein fremder Wert wird in ein Feld ohne Herkunft geschrieben", () => {
  const found = [...new Set(lostOrigin)].sort();
  assert.deepEqual(found, [], `Herkunft verloren:\n        ${found.join("\n        ")}`);
});

/* ==================================================================== */
/* 5  Eingabefelder bleiben unbehandelt                                 */
/* ==================================================================== */

heading("5  Eingabefelder bleiben unbehandelt (E-063 Punkt 1)");

/*
 * Die Gegenrichtung, und sie ist kein Zierrat: Eine Regel, die nur in eine
 * Richtung gemessen wird, lädt dazu ein, sie überall anzuwenden — und dann
 * stünde ein `U+FFFD` im Eingabefeld eines Benutzers, der ein Zeichen löschen
 * müsste, das er nie geschrieben hat. Beim Speichern ginge der veränderte Text
 * in die Datenbank.
 *
 * Dieselbe Prüfung steht im Add-in (`proof:addin` Abschnitt 17, „der Vorschlag
 * lässt fallen, die Anzeige markiert") — dort für die andere Hälfte derselben
 * Entscheidung.
 */
const treatedInputs = [];
let inputCount = 0;
const TREATMENTS = /\b(?:foreignText|quotedName|visibleText)\s*\(|<Foreign\b/;

for (const file of sourceFiles) {
  const walk = (node) => {
    const opening = ts.isJsxSelfClosingElement(node)
      ? node
      : ts.isJsxElement(node)
        ? node.openingElement
        : undefined;
    if (opening !== undefined) {
      const tag = opening.tagName.getText();
      if (tag === "input" || tag === "textarea") {
        inputCount += 1;
        for (const attribute of opening.attributes.properties) {
          if (!ts.isJsxAttribute(attribute)) continue;
          const name = attribute.name.getText();
          if (name !== "value" && name !== "defaultValue") continue;
          const text = attribute.getText();
          if (TREATMENTS.test(text)) treatedInputs.push(`${where(attribute)}  ${shortText(attribute)}`);
        }
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(file);
}

check("kein Eingabefeld zeigt behandelten Text", () => {
  assert.ok(inputCount > 5, `nur ${String(inputCount)} Eingabefelder gefunden — sieht die Prüfung noch etwas?`);
  assert.deepEqual(treatedInputs, [], `behandeltes Eingabefeld: ${treatedInputs.join(", ")}`);
});

/* ==================================================================== */
/* 6  Die Grenze zum Wert ohne Typ                                      */
/* ==================================================================== */

heading("6  Was aus einem Wert ohne Typ als Text herausfällt, trägt eine Herkunft");

/*
 * ---------------------------------------------------------------------------
 * Der letzte Rest Anzeigefläche, den die Abschnitte 1 bis 5 nicht erreichen
 * ---------------------------------------------------------------------------
 *
 * T-129 hat ihn selbst benannt (Risiko R1, offene Frage 3), und der Auftrag
 * O-AT hat ihn beauftragt: `ExportTemplate.definition` ist `unknown`. Das ist
 * richtig so — das Vorlagenformat gehört dem Motor in `packages/export`, nicht
 * der Schnittstelle. Nur packt `lib/exportTemplateModel.ts` daraus **Feldnamen**
 * aus, die ein Benutzer geschrieben hat, und die Oberfläche zeigt sie: im
 * Editor, in der Abweichungsliste, in den Beschriftungen der Umordnungsknöpfe
 * und in der Vorschau der Exportzeile — also in der Ansicht, an der jemand
 * prüft, was er gleich abrechnet.
 *
 * Ein `typeof x === "string"` an dieser Stelle macht daraus **gewöhnlichen**
 * Text. Die Herkunft, die Abschnitt 1 in den Typ gehoben hat, entsteht dort gar
 * nicht erst; die Abschnitte 2 bis 4 können nur finden, was als fremd bekannt
 * ist. Genau das misst E-063 Punkt 5: nicht „liefern zwei Wege dasselbe?",
 * sondern „gibt es den zweiten Weg?"
 *
 * ---------------------------------------------------------------------------
 * Wie gemessen wird — an der Signatur, nicht am Namen
 * ---------------------------------------------------------------------------
 *
 * Eine **Übergangsstelle** ist alles, was `unknown` annimmt und fremden Text
 * zurückgibt. Dieser Abschnitt kennt keinen Funktionsnamen, genau wie
 * Abschnitt 1 keine Behandlung beim Namen kennt: Wer eine zweite baut und sie
 * so deklariert, wird ohne Änderung an dieser Datei anerkannt. Wer die
 * vorhandene auf `string` verbreitert, macht diesen Abschnitt rot.
 *
 * ---------------------------------------------------------------------------
 * Was dieser Abschnitt ausdrücklich **nicht** sieht
 * ---------------------------------------------------------------------------
 *
 *  - **`any` aus fremden Deklarationen.** `import.meta.env[...]` ist `any`, und
 *    aus ihm werden Grundadresse und Sitzungsnachweis gelesen
 *    (`app/connection.ts`). Beides ist keine Anzeige, und die Deklaration
 *    gehört Vite. Gemessen wird `unknown`, weil das die Grenze ist, die **wir**
 *    ziehen. Im eigenen Quelltext kommt `any` nicht vor.
 *  - **Formzusicherungen** (`parsed as Partial<ErrorEnvelope>`, `request<T>`).
 *    Sie behaupten die Gestalt einer Antwort des **eigenen** Dienstes; das ist
 *    der Vertrag aus `api/types.ts` und keine fremde Eingabe. Sie stehen
 *    sichtbar im Quelltext und sind eine Handlung, kein Versehen.
 */

/** Übergangsstellen: nehmen `unknown`, geben fremden Text. */
const crossings = [];
for (const file of sourceFiles) {
  const walk = (node) => {
    const isFunctionLike =
      ts.isFunctionDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node) ||
      ts.isMethodDeclaration(node);
    if (isFunctionLike) {
      const signature = checker.getSignatureFromDeclaration(node);
      const first = signature?.parameters[0];
      if (signature !== undefined && first !== undefined) {
        const parameter = checker.getTypeOfSymbolAtLocation(first, node);
        if (
          (parameter.flags & ts.TypeFlags.Unknown) !== 0 &&
          isForeign(signature.getReturnType())
        ) {
          crossings.push(node);
        }
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(file);
}

/** Liegt dieser Knoten im Rumpf einer Übergangsstelle? */
const insideCrossing = (node) => {
  for (let p = node.parent; p !== undefined; p = p.parent) {
    if (crossings.includes(p)) return true;
  }
  return false;
};

check("es gibt eine erklärte Übergangsstelle vom Wert ohne Typ zu fremdem Text", () => {
  /*
   * Der Wächter über den Wächter, dieselbe Bauart wie in Abschnitt 1: Nähme
   * jemand der Übergangsstelle ihren Rückgabetyp, ginge die Prüfung darunter
   * auf einen Schlag grün — und zwar lautlos, weil sie dann keine einzige
   * Stelle mehr zu vergleichen hätte.
   */
  assert.ok(
    crossings.length > 0,
    "keine Funktion nimmt `unknown` und gibt fremden Text zurück — wo wird `definition` jetzt ausgepackt?",
  );
  for (const crossing of crossings) {
    const signature = checker.getSignatureFromDeclaration(crossing);
    const returned = signature.getReturnType();
    assert.equal(isTextType(returned), true, `${where(crossing)} gibt keinen Text zurück`);
    assert.equal(isDraft(returned), false, `${where(crossing)} macht aus einem Wert ohne Typ einen Entwurf`);
  }
});

const rawFromUnknown = [];
for (const file of sourceFiles) {
  const walk = (node) => {
    if (
      ts.isBinaryExpression(node) &&
      (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken)
    ) {
      const probe = ts.isTypeOfExpression(node.left)
        ? { test: node.left, other: node.right }
        : ts.isTypeOfExpression(node.right)
          ? { test: node.right, other: node.left }
          : null;
      if (
        probe !== null &&
        ts.isStringLiteral(probe.other) &&
        probe.other.text === "string" &&
        (checker.getTypeAtLocation(probe.test.expression).flags & ts.TypeFlags.Unknown) !== 0 &&
        !insideCrossing(node)
      ) {
        rawFromUnknown.push(`${where(node)}  ${shortText(node)}`);
      }
    }

    /*
     * Die zweite Gestalt derselben Handlung: `x as string`. Eine Zusicherung
     * auf einen **Objekttyp** bleibt außen vor — sie behauptet eine Gestalt,
     * und der Zugriff darauf liefert wieder `unknown`, das durch diese Prüfung
     * muss.
     */
    if (ts.isAsExpression(node) && !insideCrossing(node)) {
      const from = checker.getTypeAtLocation(node.expression);
      const to = checker.getTypeFromTypeNode(node.type);
      if ((from.flags & ts.TypeFlags.Unknown) !== 0 && isTextType(to)) {
        rawFromUnknown.push(`${where(node)}  ${shortText(node)}`);
      }
    }

    ts.forEachChild(node, walk);
  };
  walk(file);
}

check("kein anderer Weg macht aus einem Wert ohne Typ Text", () => {
  const found = [...new Set(rawFromUnknown)].sort();
  assert.deepEqual(
    found,
    [],
    `Text ohne Herkunft aus einem Wert ohne Typ:\n        ${found.join("\n        ")}`,
  );
});

/** Wie oft eine Übergangsstelle tatsächlich gerufen wird. */
let crossingCalls = 0;
for (const file of sourceFiles) {
  const walk = (node) => {
    if (ts.isCallExpression(node)) {
      const declaration = checker.getResolvedSignature(node)?.declaration;
      if (declaration !== undefined && crossings.includes(declaration)) crossingCalls += 1;
    }
    ts.forEachChild(node, walk);
  };
  walk(file);
}

check("und sie wird auch benutzt", () => {
  /*
   * Ohne diese Zeile wäre die Prüfung darüber am billigsten dadurch zu
   * befriedigen, dass niemand mehr auspackt — und dann stünde die Vorlage gar
   * nicht mehr da. Gezählt werden die Aufrufe, nicht die Zeilen.
   */
  assert.ok(crossingCalls > 3, `nur ${String(crossingCalls)} Aufrufe der Übergangsstelle gesehen`);
});

/* ==================================================================== */
/* 7  Zwei stille Ausgaenge und der Uebersetzer selbst                  */
/* ==================================================================== */

heading("7  Zwei stille Ausgänge, und der Übersetzer wird selbst gefragt");

/*
 * ---------------------------------------------------------------------------
 * Was T-183 an diesem Lauf gemessen hat (A-A-39)
 * ---------------------------------------------------------------------------
 *
 * Der Kopf dieser Datei sagte bis T-186, eine Bindung, die ausdrücklich
 * `: string` heißt, finde Abschnitt 4. Das stimmt — und **daneben** standen
 * zwei Wege, die dasselbe tun und die niemand sah:
 *
 *   const titel: string = todo.title;   // rot, seit T-129
 *   const titel = todo.title as string; // grün
 *   teile.push(todo.title);             // grün, `teile: string[]`
 *
 * Beide bestehen `pnpm typecheck`, weil die Marke `__foreignText?: undefined`
 * **freiwillig** ist: `ForeignText` ist `string` zuweisbar und umgekehrt. Genau
 * darauf beruht die ganze Bauart — und genau deshalb muss der Verlust hier
 * gemessen werden statt vom Übersetzer erwartet.
 *
 * Und der dritte Befund war der billigste: Eine **verschriebene Typeinfuhr**
 * macht jede Anzeigestelle ihrer Datei zu `any`; `isForeign` an einem `any`
 * ist falsch, der Lauf bleibt grün und meldet 14 bestandene Prüfungen, während
 * `tsc` `TS2307` sagt. Eine Aussage über Typen in einem Programm mit
 * Typfehlern ist keine.
 *
 * ---------------------------------------------------------------------------
 * Was hier **nicht** steht, und warum es gemessen ist
 * ---------------------------------------------------------------------------
 *
 * A-A-39 nennt auch „ein fremder Wert als Argument einer Funktion, deren
 * Parameter Text ohne Marke ist, **auch wenn die Funktion nicht die eigene
 * ist**". Wörtlich gebaut ergibt das am heutigen Baum **27** Fundstellen, und
 * keine davon ist eine Anzeige: `RUNS_WHEN_OPENED.includes(…)`,
 * `a.name.localeCompare(b.name)`, `byName.has(…)`, `setName(…)` an einem
 * Zustandssetzer, und — die Pointe — `visibleText(…)` und
 * `dropHiddenCharacters(…)`, also die **Behandlung selbst**, die aus
 * `@takt/domain` kommt und dort `string` nimmt.
 *
 * Ein Wächter, der die Behandlung als Verlust meldet, ist kein Wächter. Die
 * Frage „speichert dieser Aufruf oder fragt er nur" beantwortet kein Typ; sie
 * bräuchte ein Modell der Senken, und das ist ein Umbau und keine Prüfung.
 * Gebaut ist deshalb der Teil, der ohne Modell auskommt und den A-A-39 als
 * Gegenprobe nennt: die **Ablage in eine Sammlung**, deren Elementart Text
 * ohne Marke ist. Der Rest steht als offener Punkt im Bericht T-186 — mit der
 * Zahl daneben, nicht als Vermutung.
 */

/**
 * Die zwei stillen Ausgänge, an einem beliebigen Programm gemessen.
 *
 * Als Funktion und nicht als Schleife im Dateirumpf, weil Abschnitt 8 dieselbe
 * Messung an einer **überlagerten** Quelle braucht. Eine Prüfung, die sich nur
 * am Bestand ausführen lässt, kann ihre eigene Blindheit nicht bemerken.
 *
 * @param {ReturnType<typeof lensFor>} lens
 */
const scanSilentExits = (lens) => {
  const assertions = [];
  const stores = [];
  for (const file of lens.sourceFiles) {
    const walk = (node) => {
      /*
       * **Die Zusicherung.** `todo.title as string` sagt dem Übersetzer, er
       * solle die Marke vergessen — und er tut es wortlos. Abschnitt 6 kennt
       * dieselbe Gestalt bereits, aber nur aus einem `unknown`; von einem
       * fremden Wert aus war sie unbewacht.
       *
       * Ein Ziel **mit** Marke ist keine Zusicherung, sondern eine Erklärung
       * (`x as ForeignText`), und `DraftText` ist der eine erlaubte Ausstieg
       * (E-063 Punkt 1) — dieselben zwei Ziele wie in Abschnitt 4.
       */
      if (ts.isAsExpression(node) && lens.yieldsForeign(node.expression)) {
        const to = lens.checker.getTypeFromTypeNode(node.type);
        if (isTextType(to) && !isForeign(to) && !isDraft(to)) {
          assertions.push(`${where(node)}  ${shortText(node)}`);
        }
      }

      /*
       * **Die Ablage in eine Sammlung.** `teile.push(todo.title)` mit
       * `teile: string[]`: Der Wert liegt danach in einer Reihe gewöhnlichen
       * Textes, und ab dort ist er für jede Prüfung unverdächtig — dieselbe
       * Wirkung wie ein Feld ohne Herkunft, nur eine Klammer weiter.
       *
       * Gefragt wird die **Elementart des Empfängers**, nicht der Name der
       * Methode: Eine Liste von Methodennamen wäre die abgeschriebene
       * Aufzählung, die E-063 Punkt 4 verboten hat.
       *
       * Ausgenommen ist, was eine **Frage** stellt statt abzulegen — erkennbar
       * daran, dass die Antwort ein Wahrheitswert ist (`includes`, `some`).
       * Das ist eine Heuristik und steht als solche da; `indexOf` fiele
       * darunter, käme es vor. Sammlungen mit Schlüssel (`Map`, `Set`) sind
       * **nicht** erfasst: Dort steht die Elementart am Schlüssel wie am Wert,
       * und die sechs heutigen Treffer wären zu je einer eigenen Entscheidung
       * geworden (Bericht T-186).
       */
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const receiver = lens.checker.getTypeAtLocation(node.expression.expression);
        const isArray =
          lens.checker.isArrayType?.(receiver) === true ||
          lens.checker.isArrayLikeType?.(receiver) === true;
        const element =
          lens.checker.getTypeArguments?.(receiver)?.[0] ??
          lens.checker.getIndexTypeOfType?.(receiver, ts.IndexKind.Number);
        const answersAQuestion =
          (lens.checker.getTypeAtLocation(node).flags & ts.TypeFlags.BooleanLike) !== 0;
        if (
          isArray &&
          !answersAQuestion &&
          element !== undefined &&
          isTextType(element) &&
          !isForeign(element) &&
          !isDraft(element)
        ) {
          for (const argument of node.arguments) {
            if (lens.yieldsForeign(argument)) {
              stores.push(`${where(argument)}  ${shortText(node)}`);
            }
          }
        }
      }

      ts.forEachChild(node, walk);
    };
    walk(file);
  }
  return { assertions, stores };
};

/**
 * Was der Übersetzer selbst zu diesem Programm sagt.
 *
 * Dieselbe Regel wie A-A-33, eine Sprache weiter: Wo ein Wächter etwas
 * voraussetzt, misst er die Voraussetzung.
 *
 * @param {ts.Program} program
 */
const compilerFindings = (program) =>
  ts.getPreEmitDiagnostics(program).map((finding) => {
    const text = ts.flattenDiagnosticMessageText(finding.messageText, " ");
    if (finding.file === undefined || finding.start === undefined) return `TS${String(finding.code)}: ${text}`;
    const { line } = finding.file.getLineAndCharacterOfPosition(finding.start);
    const name = path.relative(appRoot, finding.file.fileName);
    return `${name}:${String(line + 1)}  TS${String(finding.code)}: ${text}`;
  });

const silentExits = scanSilentExits(lens);

check("keine Zusicherung nimmt einem fremden Wert seine Herkunft", () => {
  const found = [...new Set(silentExits.assertions)].sort();
  assert.deepEqual(found, [], `Herkunft an einer Zusicherung verloren:\n        ${found.join("\n        ")}`);
});

check("kein fremder Wert wird in eine Reihe ohne Herkunft abgelegt", () => {
  const found = [...new Set(silentExits.stores)].sort();
  assert.deepEqual(found, [], `Herkunft an einer Sammlung verloren:\n        ${found.join("\n        ")}`);
});

check("und das Programm, über das hier geurteilt wird, übersetzt fehlerfrei", () => {
  const found = compilerFindings(program);
  assert.deepEqual(
    found,
    [],
    `Der Übersetzer meldet ${String(found.length)} Befund(e). Jede Aussage dieses Laufs\n` +
      `        über Typen ist damit hinfällig — eine verschriebene Typeinfuhr genügt,\n` +
      `        um eine ganze Datei zu \`any\` zu machen, und \`any\` trägt keine Marke:\n        ` +
      found.slice(0, 10).join("\n        "),
  );
});

/* ==================================================================== */
/* 8  Die Gegenprobe                                                    */
/* ==================================================================== */

heading("8  Gegenprobe — jede eingesetzte Verletzung muss auffallen");

/*
 * Drei Verletzungen, drei Programme, keine Zeile im Bestand.
 *
 * Die Kunstquelle liegt unter einem Pfad, den es nicht gibt; sie entsteht im
 * Arbeitsspeicher und wird über einen `CompilerHost` untergeschoben
 * ({@link buildProgram}). Dieselbe Bauart wie in `proof:callers` und
 * `proof-release-safety.mjs` — und aus demselben Grund: Ein Wächter, der seine
 * eigene Blindheit nicht messen kann, sagt nur, dass er nichts gefunden hat.
 *
 * Warum je ein eigenes Programm und nicht eines mit drei Verstößen: Die dritte
 * Quelle **übersetzt nicht**. In einem gemeinsamen Programm stünde neben jedem
 * Fund ein Typfehler, und dann wäre nicht mehr zu unterscheiden, ob die Prüfung
 * den Verstoß gesehen hat oder ihn geraten hat.
 */
const COUNTER_PROOF_PATH = path.join(srcRoot, "lib", "eingesetzt.ts");

const COUNTER_PROOFS = [
  {
    title: "`todo.title as string` — die Zusicherung",
    source:
      'import type { Todo } from "../api/types";\n' +
      "export const titelVon = (todo: Todo) => todo.title as string;\n",
    findings: (lens) => scanSilentExits(lens).assertions,
  },
  {
    title: "`teile.push(todo.title)` in ein `string[]` — die Ablage",
    source:
      'import type { Todo } from "../api/types";\n' +
      "export function teileVon(todo: Todo): readonly string[] {\n" +
      "  const teile: string[] = [];\n" +
      "  teile.push(todo.title);\n" +
      "  return teile;\n" +
      "}\n",
    findings: (lens) => scanSilentExits(lens).stores,
  },
  {
    title: "eine verschriebene Typeinfuhr — der Lauf urteilt sonst über `any`",
    source:
      'import type { Todo } from "../api/typen";\n' +
      "export const titelVon = (todo: Todo) => todo.title;\n",
    findings: (lens) => compilerFindings(lens.program),
  },
];

for (const probe of COUNTER_PROOFS) {
  check(`Gegenprobe: ${probe.title}`, () => {
    const found = probe.findings(
      lensFor(buildProgram({ path: COUNTER_PROOF_PATH, source: probe.source })),
    );
    /*
      Nicht `found.length > 0`, sondern **diese** Quelle: Ein Fund aus dem
      Bestand wäre kein Beleg dafür, dass die Prüfung die eingesetzte Verletzung
      sieht — er wäre der Beleg dafür, dass der Bestand rot ist. Heute sind alle
      drei Reihen am Bestand leer; morgen vielleicht nicht.
    */
    const mine = found.filter((finding) => finding.includes("eingesetzt.ts"));
    assert.ok(
      mine.length > 0,
      `blind — die eingesetzte Verletzung ist unbemerkt geblieben (${String(found.length)} andere\n` +
        "        Fund(e)). Die Prüfung darüber bewacht damit nichts, auch wenn der\n" +
        "        Bestand grün ist.",
    );
  });
}

/* ==================================================================== */

process.stdout.write(
  `\n${"═".repeat(58)}\n${String(passed)} bestanden, ${String(failed)} fehlgeschlagen.\n` +
    `Darunter ${String(COUNTER_PROOFS.length)} Gegenproben: eine eingesetzte Verletzung je Prüfung ` +
    `aus Abschnitt 7.\n` +
    `${String(sourceFiles.length)} Quelldateien, ${String(treatedCount)} behandelte Übergaben, ` +
    `${String(inputCount)} Eingabefelder, ${String(foreignJoins)} Reihen, ` +
    `${String(crossings.length)} Übergangsstellen mit ${String(crossingCalls)} Aufrufen.\n`,
);
process.exit(failed === 0 ? 0 : 1);
