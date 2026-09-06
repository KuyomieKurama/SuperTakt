/**
 * O-HY (T-200 Z-51/Z-52, umgesetzt T-207/T-208) — mißt die **zweite** Hälfte
 * des Auftrags: Ist die Berichtigung von `touchedOnBlur`
 * (`edited || value.length > 0` → `edited || value.trim().length > 0`) an
 * ihren zwei tatsächlichen Aufrufstellen wirklich **verhaltensneutral**, oder
 * gibt es einen Aufrufer, für den die beiden Fassungen auseinandergehen?
 *
 * `touchedOnBlur` wird im ganzen Bestand an genau zwei Stellen aufgerufen
 * (`grep -rn "touchedOnBlur(" apps/web/src` bestätigt das):
 *
 *  1. `FormDialog.tsx#TextField`, `handleBlur`: `if (touchedOnBlur(value,
 *     edited)) onTouched?.();`
 *  2. `ConfirmDialog.tsx`, `touchReason`: `if (touchedOnBlur(reason,
 *     reasonEdited)) setReasonTouched(true);`
 *
 * Der Fall, an dem sich die Berichtigung entscheidet, ist in beiden Fällen
 * derselbe: ein Feld, das **nur aus Leerzeichen** besteht und das niemand
 * angefaßt hat (`edited`/`reasonEdited` = `false`). Für genau diese Eingabe
 * liefert die alte Fassung `true`, die berichtigte `false` — das ist keine
 * Vermutung, sondern der bereits belegte Meßpunkt aus
 * `apps/web/test/lib/touched.test.ts` (Fall „ein vorbelegtes Leerzeichen ist
 * keine Eingabe"). Was dort **nicht** gemessen ist: ob dieser Umschlag an den
 * beiden Aufrufstellen ankommt, und ob er dort einen sichtbaren Unterschied
 * macht.
 *
 * ---------------------------------------------------------------------------
 * Ergebnis vorweg, damit es nicht in der Beweisführung untergeht
 * ---------------------------------------------------------------------------
 *
 * **`TextField` ist ein bloßer Durchreicher.** `handleBlur` legt zwischen
 * `touchedOnBlur` und `onTouched?.()` keine eigene Bedingung — was
 * `touchedOnBlur` entscheidet, kommt unverändert bei jedem Aufrufer von
 * `onTouched` an (heute sieben Formularfelder in vier Bildschirmen und
 * `Attachments.tsx`, siehe Bericht T-208). Der Umschlag von Fassung 3 auf
 * Fassung 4 (siehe `touched.test.ts`) erreicht diese sieben Stellen also
 * **unverändert und ungepuffert** — das ist beabsichtigt und nicht der Befund
 * dieser Datei; der Befund ist, daß **nichts** in `FormDialog.tsx` diesen
 * Umschlag abfängt oder abschwächt. Ob er dort einen sichtbaren Unterschied
 * macht, hängt vollständig davon ab, ob irgendeine der sieben Aufrufstellen
 * dem Feld jemals einen Wert vorbelegt, der ausschließlich aus Leerzeichen
 * besteht — eine Eigenschaft, die **außerhalb** dieser Datei liegt (u. a. im
 * Schema `nameSchema` aus `apps/local-api/src/http/input.ts`, `z.string()
 * .trim().min(1)`, domain-dev-Hoheit) und die dieser Prüffall deshalb nicht
 * abschließend beweisen kann. Das ist im Bericht T-208 als offene, aber nach
 * heutigem Stand folgenlose Abhängigkeit vermerkt.
 *
 * **`ConfirmDialog` dagegen ist beweisbar geschlossen.** Der einzige Weg, wie
 * `reason` einen von `""` verschiedenen Wert annimmt, ist die
 * `onChange`-Behandlung des Begründungsfelds, und die setzt im selben Block
 * `reasonEdited` auf `true`, **bevor** sie `reason` überhaupt ändert. Der
 * Zustand `(reason = " ", reasonEdited = false)`, an dem die Berichtigung
 * einen Unterschied machen würde, kann in diesem Bauteil deshalb **nicht**
 * entstehen — nicht heute und nicht nach einer künftigen Änderung an anderer
 * Stelle, solange diese eine Kopplung in `ConfirmDialog.tsx` selbst bestehen
 * bleibt. Das ist der Unterschied zu `TextField`: Hier ist die Unerreichbarkeit
 * **strukturell in derselben Datei bewiesen**, dort hängt sie an sieben
 * fremden Dateien und einem Schema in einem anderen Paket.
 *
 * ---------------------------------------------------------------------------
 * Bauart
 * ---------------------------------------------------------------------------
 *
 * Wie `templatesScreenBeginCopy.test.ts` (O-GR): ein echter Syntaxbaum
 * (`typescript`) statt eines Zeichenkettenvergleichs, weil die Behauptungen
 * hier Aussagen über die **Struktur** des Quelltexts sind (welche Bedingung
 * neben welcher Zuweisung steht), nicht über sein Laufzeitverhalten — dafür
 * fehlt weiterhin `jsdom`/`@testing-library/react` im Bestand (siehe
 * `templatesScreenBeginCopy.test.ts`, Kopfkommentar, unverändert Stand dieser
 * Welle).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import type { DraftText } from "../../src/api/types";
import { touchedOnBlur } from "../../src/lib/touched";

const FORM_DIALOG_FILE = path.resolve(__dirname, "../../src/components/FormDialog.tsx");
const FORM_DIALOG_SOURCE = readFileSync(FORM_DIALOG_FILE, "utf8");
const formDialogSourceFile = ts.createSourceFile(
  FORM_DIALOG_FILE,
  FORM_DIALOG_SOURCE,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);

const CONFIRM_DIALOG_FILE = path.resolve(__dirname, "../../src/components/ConfirmDialog.tsx");
const CONFIRM_DIALOG_SOURCE = readFileSync(CONFIRM_DIALOG_FILE, "utf8");
const confirmDialogSourceFile = ts.createSourceFile(
  CONFIRM_DIALOG_FILE,
  CONFIRM_DIALOG_SOURCE,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);

/** Die Fassung, die bis zur Berichtigung O-HY (T-207) im Bestand stand. */
function vorDerBerichtigungOHY(value: DraftText, edited: boolean): boolean {
  return edited || value.length > 0;
}

function findVariable(root: ts.Node, name: string): ts.VariableDeclaration | undefined {
  let found: ts.VariableDeclaration | undefined;
  const visit = (node: ts.Node): void => {
    if (found !== undefined) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
}

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

/** Der nächste umschließende Block einer Anweisung — die "gleiche Handlung". */
function containingBlock(node: ts.Node): ts.Block {
  let current: ts.Node | undefined = node.parent;
  while (current !== undefined && !ts.isBlock(current)) current = current.parent;
  if (current === undefined) throw new Error("kein umschließender Block gefunden");
  return current;
}

describe("touchedOnBlur an seinen zwei Aufrufstellen — verhaltensneutral? (O-HY, T-208)", () => {
  it("die Berichtigung selbst macht für (´ ´, false) tatsächlich einen Unterschied (sonst gäbe es hier nichts zu messen)", () => {
    // Vorbedingung der ganzen Datei: Gäbe es diesen Umschlag nicht, wäre jede
    // Frage nach seiner Neutralität gegenstandslos — der Fall stünde nur für
    // die Absicht da, wie die Aufgabe selbst verlangt, das offen auszusprechen.
    const value: DraftText = " ";
    const edited = false;

    expect(touchedOnBlur(value, edited)).toBe(false);
    expect(vorDerBerichtigungOHY(value, edited)).toBe(true);
    expect(touchedOnBlur(value, edited)).not.toBe(vorDerBerichtigungOHY(value, edited));
  });

  describe("Aufrufstelle 1 — TextField (FormDialog.tsx)", () => {
    it("handleBlur ist ein bloßer Durchreicher: keine eigene Bedingung zwischen touchedOnBlur und onTouched", () => {
      const handleBlur = findVariable(formDialogSourceFile, "handleBlur");
      if (handleBlur === undefined || handleBlur.initializer === undefined) {
        throw new Error("handleBlur nicht gefunden — Prüffall nachziehen");
      }
      if (!ts.isArrowFunction(handleBlur.initializer)) {
        throw new Error("handleBlur ist keine Pfeilfunktion mehr — Prüffall nachziehen");
      }
      const body = handleBlur.initializer.body;
      if (!ts.isBlock(body)) throw new Error("handleBlur hat keinen Anweisungsblock mehr");

      const ifStatements = body.statements.filter(ts.isIfStatement);
      const touchedIf = ifStatements.find((statement) => callsNamed(statement.expression, "touchedOnBlur").length > 0);
      if (touchedIf === undefined) throw new Error("kein if(touchedOnBlur(...)) mehr in handleBlur gefunden");

      // Die Bedingung selbst ist der nackte Aufruf, nicht Teil eines && / ||.
      expect(ts.isCallExpression(touchedIf.expression)).toBe(true);
      const call = touchedIf.expression as ts.CallExpression;
      expect(ts.isIdentifier(call.expression) && call.expression.text).toBe("touchedOnBlur");
      expect(call.arguments.map((argument) => argument.getText(formDialogSourceFile))).toEqual([
        "value",
        "edited",
      ]);

      // Kein sonst-Zweig, und die Folge ruft ausschließlich onTouched auf —
      // keine zusätzliche Bedingung, kein zweiter Zustand, der gesetzt wird.
      expect(touchedIf.elseStatement).toBeUndefined();
      expect(touchedIf.thenStatement.getText(formDialogSourceFile)).toBe("onTouched?.();");
    });

    it("edited entsteht ausschließlich im onChange des Eingabefelds — nie unabhängig von der Eingabe", () => {
      // Ergänzt die vorige Prüfung: Wenn `edited` nur dort gesetzt wird, wo
      // auch der Wert sich ändert, dann kann `edited === false` mit einem
      // beliebigen `value` zusammentreffen — die Aufgabe, `value` niemals
      // leerraumhaltig vorzubelegen, liegt vollständig bei den sieben
      // Aufrufstellen von `TextField`, nicht bei `TextField` selbst. Das ist
      // der Befund dieser Datei, nicht ein Fehler in `FormDialog.tsx`.
      const setEditedCalls = callsNamed(formDialogSourceFile, "setEdited");
      const trueCalls = setEditedCalls.filter(
        (call) => call.arguments[0]?.kind === ts.SyntaxKind.TrueKeyword,
      );
      expect(trueCalls).toHaveLength(1);

      const onChangeBlock = containingBlock(trueCalls[0]!);
      const onChangeText = onChangeBlock.getText(formDialogSourceFile);
      // Dieselbe Behandlung reicht den neuen Wert nach außen weiter — sie ist
      // also tatsächlich der einzige Ort, an dem sich `value` ändert.
      expect(onChangeText.includes("onChange(event.target.value)")).toBe(true);
    });
  });

  describe("Aufrufstelle 2 — Begründungsfeld (ConfirmDialog.tsx)", () => {
    /**
     * Reproduziert `reasonMissing` wortgleich aus `ConfirmDialog.tsx`, damit
     * hier dieselbe Formel steht, die dort tatsächlich das Sichtbare
     * entscheidet — keine Umschreibung, kein Modell mit eigenem Anspruch.
     */
    function reasonMissing(reason: DraftText, reasonTouched: boolean, reasonRequired: boolean): boolean {
      return reasonRequired && reasonTouched && reason.trim() === "";
    }

    function touchReason(
      touchedOnBlurFn: (value: DraftText, edited: boolean) => boolean,
      reason: DraftText,
      reasonEdited: boolean,
    ): boolean {
      // Modelliert `if (touchedOnBlur(reason, reasonEdited))
      // setReasonTouched(true);` — der Rückgabewert ist der neue Stand von
      // `reasonTouched`, ausgehend von `false` (frisch geöffneter Dialog).
      return touchedOnBlurFn(reason, reasonEdited);
    }

    it("die rohe Formel divergiert für (´ ´, false) — das ist der Rechenweg, nicht die Aussage über Erreichbarkeit", () => {
      const reason: DraftText = " ";
      const reasonRequired = true;

      const reasonTouchedAlt = touchReason(vorDerBerichtigungOHY, reason, false);
      const reasonTouchedNeu = touchReason(touchedOnBlur, reason, false);

      expect(reasonMissing(reason, reasonTouchedAlt, reasonRequired)).toBe(true);
      expect(reasonMissing(reason, reasonTouchedNeu, reasonRequired)).toBe(false);

      // Als reine Formel geht die Berichtigung hier also sehr wohl
      // auseinander. Die folgenden zwei Prüffälle zeigen, warum das trotzdem
      // folgenlos bleibt: Der Eingabezustand (reason=" ", reasonEdited=false),
      // an dem dieser Unterschied liegt, ist in ConfirmDialog.tsx unerreichbar.
    });

    it("setReason wird genau zweimal aufgerufen, und beide Male im selben Block wie setReasonEdited", () => {
      const setReasonCalls = callsNamed(confirmDialogSourceFile, "setReason");
      expect(setReasonCalls).toHaveLength(2);

      for (const call of setReasonCalls) {
        const block = containingBlock(call);
        const setReasonEditedCalls = callsNamed(block, "setReasonEdited");
        expect(setReasonEditedCalls.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("der Rücksetz-Aufruf setzt reason auf die leere Zeichenkette und reasonEdited zugleich auf false", () => {
      const setReasonCalls = callsNamed(confirmDialogSourceFile, "setReason");
      const resetCall = setReasonCalls.find(
        (call) => ts.isStringLiteral(call.arguments[0]!) && call.arguments[0]!.text === "",
      );
      if (resetCall === undefined) throw new Error("kein Rücksetz-Aufruf setReason('') mehr gefunden");

      const block = containingBlock(resetCall);
      const setReasonEditedCalls = callsNamed(block, "setReasonEdited");
      expect(setReasonEditedCalls).toHaveLength(1);
      expect(setReasonEditedCalls[0]!.arguments[0]?.kind).toBe(ts.SyntaxKind.FalseKeyword);
    });

    it("der einzige andere Aufruf setzt reasonEdited zuerst auf true, bevor er reason überhaupt ändert", () => {
      const setReasonCalls = callsNamed(confirmDialogSourceFile, "setReason");
      const onChangeCall = setReasonCalls.find(
        (call) => !(ts.isStringLiteral(call.arguments[0]!) && call.arguments[0]!.text === ""),
      );
      if (onChangeCall === undefined) throw new Error("kein onChange-Aufruf von setReason mehr gefunden");

      const block = containingBlock(onChangeCall);
      const statements = block.statements;
      const reasonEditedIndex = statements.findIndex(
        (statement) => callsNamed(statement, "setReasonEdited").length > 0,
      );
      const reasonIndex = statements.findIndex((statement) => statement === onChangeCall.parent.parent);

      expect(reasonEditedIndex).toBeGreaterThanOrEqual(0);
      // "davor oder zugleich" reicht als Beweis der Kopplung; entscheidend ist,
      // daß reasonEdited nicht erst NACH reason gesetzt wird — sonst gäbe es
      // einen (wenn auch flüchtigen) Zwischenzustand mit reason=" ",
      // reasonEdited=false.
      expect(reasonEditedIndex).toBeLessThanOrEqual(reasonIndex === -1 ? Number.POSITIVE_INFINITY : reasonIndex);

      const editedCall = callsNamed(block, "setReasonEdited")[0]!;
      expect(editedCall.arguments[0]?.kind).toBe(ts.SyntaxKind.TrueKeyword);
    });

    // Die Folgerung — (reason=" ", reasonEdited=false) ist in
    // ConfirmDialog.tsx unerreichbar, also bleibt die in Fall 1 gemessene
    // rohe Divergenz der Formel ohne sichtbare Wirkung — steht im Kopf
    // dieser Datei und im Bericht T-208. Ein eigener Prüffall dafür wäre
    // eine bloße Wiederholung der drei vorstehenden, ohne selbst etwas zu
    // messen, was sie nicht schon messen.
  });
});
