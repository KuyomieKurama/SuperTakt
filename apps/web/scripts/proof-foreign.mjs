/**
 * Takt — der ausführbare Nachweis über fremden Text in der Oberfläche (T-129).
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
 *    Wert, der in ein Feld, in eine getypte Bindung oder in den Parameter einer
 *    **eigenen** Funktion ohne Herkunftstyp geschrieben wird. Ohne diese
 *    Prüfung wäre das Grün der anderen hohl — man müsste den Wert nur einmal
 *    durch ein Zwischenmodell reichen, und der Nachweis wäre blind. Genau so
 *    lagen vier rohe Anzeigestellen in `ExportAudit.tsx`.
 *
 * **Er sieht nicht:**
 *
 *  - Text, den unser eigener Dienst geliefert hat und der fremde Namen bereits
 *    **eingebaut** enthält. `ApiError.message` ist `ServiceText`; steht darin
 *    ein Regelname, ist er hier nicht mehr als solcher erkennbar. Dasselbe gilt
 *    für fertige Sätze aus `@takt/domain` (`poolMovementSentence`) — die
 *    Behandlung gehört dort an die Quelle und nicht hier an das Ergebnis
 *    (T-124 offene Frage 2, unverändert offen).
 *  - Werte, die über eine `unknown`-Grenze laufen. `ExportTemplate.definition`
 *    ist `unknown` und wird in `lib/exportTemplateModel.ts` ausgepackt; was
 *    dabei herauskommt, hat keine Herkunft mehr. Die Feldnamen einer Vorlage
 *    sind damit für diesen Nachweis nicht fremd.
 *  - Umwege über `String(x)`, `JSON.stringify`, `as string` oder eine
 *    Bindung, die ausdrücklich `: string` heißt. Die ersten drei sind
 *    absichtliche Umgehungen und stehen als solche im Quelltext; die letzte
 *    findet Abschnitt 4.
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
const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const checker = program.getTypeChecker();

/** Die Quelldateien der Oberfläche — ohne Deklarationen und ohne `vite.config.ts`. */
const sourceFiles = program
  .getSourceFiles()
  .filter((file) => !file.isDeclarationFile && file.fileName.startsWith(srcRoot + path.sep));

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
      if (!isForeign(checker.getTypeAtLocation(part))) continue;
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
          if (!isForeign(checker.getTypeAtLocation(argument))) return;
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
      if (isForeign(checker.getTypeAtLocation(node.initializer))) {
        const target = checker.getContextualType(node.initializer);
        if (target !== undefined && isTextType(target) && !isForeign(target) && !isDraft(target)) {
          lostOrigin.push(`${where(node)}  ${shortText(node)}`);
        }
      }
    }
    if (ts.isVariableDeclaration(node) && node.type !== undefined && node.initializer !== undefined) {
      if (isForeign(checker.getTypeAtLocation(node.initializer))) {
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

process.stdout.write(
  `\n${"═".repeat(58)}\n${String(passed)} bestanden, ${String(failed)} fehlgeschlagen.\n` +
    `${String(sourceFiles.length)} Quelldateien, ${String(treatedCount)} behandelte Übergaben, ` +
    `${String(inputCount)} Eingabefelder.\n`,
);
process.exit(failed === 0 ? 0 : 1);
