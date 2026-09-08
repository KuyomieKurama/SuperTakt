/**
 * TemplatesScreen.beginCopy — Meßfall zu O-GR (gemeldet in
 * `.claude/team/reports/T-186-frontend-dev.md`, Risiko 5 / Board-Eintrag
 * O-GR): frontend-dev hat die zwei wortgleich duplizierten Einstiege des
 * Kopierdialogs ("Kopieren" in der Vorlagenliste, "Kopie anlegen" am
 * Editor der Standardvorlage) zu einer gemeinsamen Funktion `beginCopy`
 * zusammengelegt und die Zusammenlegung "verhaltensgleich" genannt, ohne sie
 * zu messen.
 *
 * ---------------------------------------------------------------------------
 * Warum hier keine gerenderte Komponente steht
 * ---------------------------------------------------------------------------
 *
 * `beginCopy` ist eine private Closure von `TemplatesScreen` und wird nicht
 * exportiert; sie ließe sich nur beobachten, indem man die Komponente
 * rendert und beide Bedienelemente anklickt. Dafür fehlt in `apps/web` die
 * Grundlage: weder `jsdom` noch `@testing-library/react` stehen im Bestand
 * (geprüft gegen `node_modules/.pnpm`, Stand dieser Welle), und die
 * Voreinstellung „Node" in der Wurzel-`vitest.config.ts` bestätigt es — ein
 * Test, der eine Browserumgebung braucht, müßte sie einzeln über einen
 * Kopfkommentar anfordern, den es hier absichtlich nicht gibt: die fehlende
 * Abhängigkeit ließe den Lauf mit einem Ladefehler abbrechen, nicht mit einem
 * roten Fall. Beides zu ergänzen wäre eine `package.json`-Änderung — Hoheit
 * des Orchestrators, nicht von unit-tester (CLAUDE.md, Abschnitt
 * „Verzeichnisse und Hoheit").
 *
 * Gemessen wird deshalb an der Quelle, mit derselben Bauart, die
 * `apps/web/scripts/proof-foreign.mjs` für Herkunftsfragen benutzt: ein
 * echter Syntaxbaum statt eines Zeichenkettenvergleichs. Das ist keine
 * Verlegenheitslösung — die Behauptung, die geprüft wird ("beide Einstiege
 * verhalten sich gleich"), ist eine Aussage über die **Struktur** des
 * Quelltexts: Zwei Aufrufe **derselben** Funktion mit demselben Argument
 * erzeugen zwangsläufig dasselbe Ergebnis, ganz gleich, ob das Argument
 * `template` oder `shown` heißt. Was zu messen bleibt, ist genau das, was
 * eine Zusammenlegung brechen kann: daß wirklich nur noch eine Funktion
 * existiert, daß beide Aufrufer sie tatsächlich benutzen (und nicht daneben
 * ihre eigene Fassung), und daß diese eine Funktion alle drei Zustände
 * setzt, die vor T-186 an beiden Stellen einzeln gesetzt wurden.
 *
 * ---------------------------------------------------------------------------
 * Rot vor Grün
 * ---------------------------------------------------------------------------
 *
 * Vor T-186 (`git show HEAD:apps/web/src/screens/TemplatesScreen.tsx`, zum
 * Zeitpunkt dieses Prüffalls noch der Stand ohne die Zusammenlegung) gibt es
 * keine Funktion namens `beginCopy`, und die Rechnung
 * `` `Kopie von ${dropHiddenCharacters(…)}` `` steht wörtlich **zweimal** in
 * der Datei — einmal je Einstieg, mit `setCopyDialog`, aber ohne
 * `setCopyNameTouched` (der Zustand existierte dort noch nicht). Jeder der
 * vier Fälle unten wäre an dieser Fassung rot: „gibt es als Funktion" findet
 * nichts, die beiden Aufruf-Fälle finden `onCopy={(template) => …}` statt
 * `onCopy={beginCopy}`, und die Zähl-Probe findet zwei Fundstellen statt
 * einer.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const FILE = path.resolve(__dirname, "../../src/screens/TemplatesScreen.tsx");
const SOURCE = readFileSync(FILE, "utf8");
const sourceFile = ts.createSourceFile(FILE, SOURCE, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

type Fn = ts.ArrowFunction | ts.FunctionExpression;

function findNamedFunction(name: string): Fn | undefined {
  let found: Fn | undefined;
  const visit = (node: ts.Node): void => {
    if (found !== undefined) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name &&
      node.initializer !== undefined &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) {
      found = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

/** Alle Aufrufe `name(...)` unterhalb von `root`, gleich wie sie formatiert sind. */
function callsNamed(root: ts.Node, name: string): ts.CallExpression[] {
  const calls: ts.CallExpression[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) {
      calls.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return calls;
}

function firstParameterName(fn: Fn): string {
  const parameter = fn.parameters[0];
  if (parameter === undefined || !ts.isIdentifier(parameter.name)) {
    throw new Error("beginCopy hat kein einfaches erstes Argument mehr — Prüffall nachziehen");
  }
  return parameter.name.text;
}

describe("TemplatesScreen.beginCopy — die Zusammenlegung der zwei Kopier-Einstiege (O-GR)", () => {
  it("gibt es als eine Funktion im Modul", () => {
    expect(findNamedFunction("beginCopy")).toBeDefined();
  });

  it("setzt Namensvorschlag, Berührt-Zustand und Dialog — alle drei in dieser einen Funktion", () => {
    const fn = findNamedFunction("beginCopy");
    if (fn === undefined) throw new Error("beginCopy nicht gefunden");
    const argument = firstParameterName(fn);

    const nameCalls = callsNamed(fn.body, "setCopyName");
    const touchedCalls = callsNamed(fn.body, "setCopyNameTouched");
    const dialogCalls = callsNamed(fn.body, "setCopyDialog");

    expect(nameCalls).toHaveLength(1);
    expect(touchedCalls).toHaveLength(1);
    expect(dialogCalls).toHaveLength(1);

    // Der Namensvorschlag hängt am selben Parameter, den die Funktion
    // entgegennimmt — unabhängig davon, ob der Aufrufer ihn "template" oder
    // "shown" nennt.
    const nameArgument = nameCalls[0]!.arguments[0];
    expect(nameArgument).toBeDefined();
    expect(ts.isTemplateExpression(nameArgument!) || ts.isNoSubstitutionTemplateLiteral(nameArgument!)).toBe(
      true,
    );
    const dropCalls = callsNamed(nameArgument!, "dropHiddenCharacters");
    expect(dropCalls).toHaveLength(1);
    const nameSource = dropCalls[0]!.arguments[0]!.getText(sourceFile);
    expect(nameSource).toBe(`${argument}.name`);

    // "Berührt" wird beim Öffnen zurückgesetzt — nie auf einen anderen Wert.
    const touchedArgument = touchedCalls[0]!.arguments[0];
    expect(touchedArgument).toBeDefined();
    expect(touchedArgument!.kind).toBe(ts.SyntaxKind.FalseKeyword);

    // Der Dialog öffnet sich für genau das Objekt, das übergeben wurde.
    const dialogArgument = dialogCalls[0]!.arguments[0];
    expect(dialogArgument).toBeDefined();
    expect(ts.isIdentifier(dialogArgument!) && dialogArgument!.text).toBe(argument);
  });

  it("der Kopf-Einstieg (Vorlagenliste) ruft beginCopy auf, statt seine eigene Fassung zu behalten", () => {
    let onCopyAttribute: ts.JsxAttribute | undefined;
    const visit = (node: ts.Node): void => {
      if (onCopyAttribute !== undefined) return;
      if (ts.isJsxAttribute(node) && node.name.getText(sourceFile) === "onCopy") {
        onCopyAttribute = node;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    expect(onCopyAttribute).toBeDefined();
    const initializer = onCopyAttribute!.initializer;
    expect(initializer !== undefined && ts.isJsxExpression(initializer)).toBe(true);
    const expression = (initializer as ts.JsxExpression).expression;
    expect(expression !== undefined && ts.isIdentifier(expression) && expression.text).toBe("beginCopy");
  });

  it("der zweite Einstieg (Knopf „Kopie anlegen“ am Editor) ruft dieselbe Funktion auf", () => {
    const calls = callsNamed(sourceFile, "beginCopy");
    // Ein Aufruf ist die Übergabe an `onCopy` selbst nicht (das ist eine
    // Kennung, kein Aufruf) — hier zählt nur der Knopf im Editor.
    expect(calls).toHaveLength(1);
    expect(calls[0]!.arguments[0]?.getText(sourceFile)).toBe("shown");
  });

  it("der Vorschlagstext „Kopie von …“ steht nur an einer Stelle in der Datei", () => {
    const hits = SOURCE.split("Kopie von ${dropHiddenCharacters").length - 1;
    expect(hits).toBe(1);
  });
});
