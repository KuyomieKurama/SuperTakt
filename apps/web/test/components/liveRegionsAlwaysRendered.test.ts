/**
 * Vier Meldeflächen, die laut Kommentar seit „O-GQ, T-191" immer im Baum
 * stehen sollen (dieselbe Bauart wie O-FX aus T-186, Bericht
 * `.claude/team/reports/T-186-frontend-dev.md`, Abschnitt 7.2 (c) und N10):
 * eine Vorlesehilfe meldet nur eine **Änderung** an einer Region, die sie
 * schon kennt — ein `role="alert"`/`role="status"`-Knoten, der erst
 * **zusammen** mit seinem Text entsteht, bleibt beim ersten Auftreten stumm.
 *
 * Gemessen wird hier an der Quelle (dieselbe Bauart wie
 * `templatesScreenBeginCopy.test.ts` und `proof-foreign.mjs`): ein echter
 * Syntaxbaum statt eines Zeichenkettenvergleichs, aus demselben Grund wie
 * dort — keine gerenderte Komponente ohne `jsdom`/`@testing-library/react`,
 * beide fehlen `apps/web` (siehe Kopfkommentar der genannten Datei).
 *
 * Die Regel, listenfrei (Vorschlag N10 aus T-186, hier auf vier benannte
 * Flächen angewandt statt als allgemeiner Wächter über den ganzen Baum —
 * letzteres ist Umfang für `apps/web/scripts/proof-foreign.mjs` und damit
 * frontend-dev, nicht diese Aufgabe):
 *
 * > Das Element, das `role="alert"` oder `role="status"` trägt, darf nicht
 * > selbst der Zweig eines bedingten Ausdrucks sein, der über sein
 * > Entstehen entscheidet. Bedingt sein darf nur, was **in** ihm steht.
 *
 * ---------------------------------------------------------------------------
 * Gegen welchen Stand gemessen
 * ---------------------------------------------------------------------------
 *
 * Alle vier Dateien lagen zum Zeitpunkt dieses Prüffalls bereits in der von
 * frontend-dev überarbeiteten Fassung vor (`git status`: alle vier als
 * geändert, nicht mehr in Arbeit an dieser Stelle — parallel entstehen in
 * derselben Welle vier **andere** Bausteine, s. u.). Vor dieser Überarbeitung
 * (`git show HEAD:<Pfad>`) hätte jeder der vier Fälle unten die Probe nicht
 * bestanden:
 *
 *  - `SettingsScreen.tsx` und `ExportDirectorySection.tsx`: die ganze
 *    `<p role="status">…</p>` stand im wahren Zweig von `{blocked ? (…) :
 *    null}` — sie entstand erst mit dem ersten Satz.
 *  - `ExportDirectoryField.tsx` und `TemplateFields.tsx`: der bedingt
 *    erzeugte Absatz trug in `HEAD` **gar keine Rolle**; die Rolle liegt seit
 *    der Überarbeitung auf einem neuen, unbedingten Behälter außen herum.
 *
 * Jeder der vier Fälle unten ist also nicht nur eine Bauartprobe, sondern
 * eine echte Regression gegen den commiteten Stand.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

type JsxNode = ts.JsxElement | ts.JsxSelfClosingElement;

function parse(relativePath: string): { sourceFile: ts.SourceFile; text: string } {
  const filePath = path.resolve(__dirname, relativePath);
  const text = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return { sourceFile, text };
}

function attribute(attrs: ts.JsxAttributes, name: string, sourceFile: ts.SourceFile): string | undefined {
  for (const prop of attrs.properties) {
    if (ts.isJsxAttribute(prop) && prop.name.getText(sourceFile) === name) {
      const init = prop.initializer;
      if (init !== undefined && ts.isStringLiteral(init)) return init.text;
    }
  }
  return undefined;
}

/** Findet jedes JSX-Element, dessen `role` und (falls angegeben) `className` passen. */
function findByRole(
  sourceFile: ts.SourceFile,
  role: string,
  className?: string,
): JsxNode[] {
  const matches: JsxNode[] = [];
  const opening = (node: JsxNode): ts.JsxOpeningElement | ts.JsxSelfClosingElement =>
    ts.isJsxElement(node) ? node.openingElement : node;

  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const jsxNode = node as JsxNode;
      const attrs = opening(jsxNode).attributes;
      const roleValue = attribute(attrs, "role", sourceFile);
      const classValue = attribute(attrs, "className", sourceFile);
      if (roleValue === role && (className === undefined || classValue === className)) {
        matches.push(jsxNode);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return matches;
}

/**
 * Ist `node` selbst der Zweig eines bedingten Ausdrucks, der über sein
 * Entstehen entscheidet? Klammerausdrücke (`(<p>…</p>)` in einer Ternäre)
 * werden dabei übersprungen — sie ändern nichts an der Bedingtheit.
 */
function isExistenceConditional(node: ts.Node): boolean {
  let current: ts.Node = node;
  let parent = current.parent;
  while (parent !== undefined && ts.isParenthesizedExpression(parent)) {
    current = parent;
    parent = parent.parent;
  }
  if (parent === undefined) return false;
  if (ts.isConditionalExpression(parent)) {
    return parent.whenTrue === current || parent.whenFalse === current;
  }
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    return parent.right === current;
  }
  return false;
}

describe("Meldeflächen stehen unbedingt im Baum (O-GQ, T-191)", () => {
  it("SettingsScreen.tsx — die Meldefläche des Exportordners", () => {
    const { sourceFile } = parse("../../src/screens/SettingsScreen.tsx");
    const matches = findByRole(sourceFile, "status", "field__error");

    expect(matches).toHaveLength(1);
    expect(isExistenceConditional(matches[0]!)).toBe(false);
  });

  it("ExportDirectorySection.tsx — dieselbe Fläche auf der Musterseite", () => {
    const { sourceFile } = parse("../../src/showcase/ExportDirectorySection.tsx");
    const matches = findByRole(sourceFile, "status", "field__error");

    expect(matches).toHaveLength(1);
    expect(isExistenceConditional(matches[0]!)).toBe(false);
  });

  it("ExportDirectoryField.tsx — der Behälter trägt die Rolle, nicht der bedingte Absatz darin", () => {
    const { sourceFile } = parse("../../src/components/ExportDirectoryField.tsx");
    const matches = findByRole(sourceFile, "alert", "field__live");

    expect(matches).toHaveLength(1);
    expect(isExistenceConditional(matches[0]!)).toBe(false);
  });

  it("TemplateFields.tsx — derselbe Griff, ohne eigene Klasse am Behälter", () => {
    const { sourceFile } = parse("../../src/screens/TemplateFields.tsx");
    const matches = findByRole(sourceFile, "alert");

    expect(matches).toHaveLength(1);
    expect(isExistenceConditional(matches[0]!)).toBe(false);
  });
});
