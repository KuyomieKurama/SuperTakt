/**
 * Regel P-8 — wann ein Pflichtfeld beim Verlassen als „berührt" gilt
 * (`apps/web/src/lib/touched.ts`, O-GS).
 *
 * Die Regel wirkt seit T-186 an zwei Stellen (`FormDialog.tsx#TextField`,
 * Prop `onTouched`, und dem Begründungsfeld in `ConfirmDialog.tsx`) und war
 * bis zu diesem Prüffall an keiner gemessen — der Fund, den T-186 selbst
 * gemeldet hat (Bericht, Abschnitt „Nächster Schritt" Punkt 2, und N9 Punkt
 * 2 im Nachtrag).
 *
 * Geprüft wird die **Regel**, nicht die heutige Schreibweise: jeder Fall
 * unten sagt, was ein Benutzer getan hat (aufgemacht / getippt / gelöscht /
 * verlassen), nicht wie `touchedOnBlur` das intern verrechnet.
 *
 * ---------------------------------------------------------------------------
 * Vier Fassungen der Regel, und wonach sich „vor T-186 grün" richtet
 * ---------------------------------------------------------------------------
 *
 * 1. **Vor T-186** (der behobene Befund O-FY): kein `touchedOnBlur`, jedes
 *    Verlassen eines Feldes setzte `touched` bedingungslos — unabhängig von
 *    Wert oder Eingabe. Modelliert unten als `wieVorT186`, eine Funktion, die
 *    immer `true` liefert.
 * 2. **Erste T-186-Fassung** (Bericht, Abschnitt 2): verglich den *Wert* mit
 *    dem Wert beim Öffnen — `value !== valueAtOpen || value.length > 0`.
 * 3. **Die Schärfung im Nachtrag** (Bericht, Abschnitt N2, vom Orchestrator
 *    entschieden): fragt nicht mehr den Wert, sondern ob der Benutzer
 *    getippt hat — `edited || value.length > 0`. Das war die Fassung, die
 *    bis zur Berichtigung O-HY (T-207/T-208) im Bestand stand. Modelliert
 *    unten als `vorDerBerichtigungOHY`.
 * 4. **Die Berichtigung O-HY** (T-200 Z-51, umgesetzt T-207): `trim()` auf
 *    der zweiten Hälfte — `edited || value.trim().length > 0`. Das ist die
 *    Fassung, die heute im Bestand steht (`touched.ts`) und hier gegen
 *    `touchedOnBlur` selbst geprüft wird.
 *
 * Ein Fall, der bereits unter Fassung 1 grün gewesen wäre, mißt die
 * Behebung von O-FY nicht — er steht trotzdem hier, weil er zeigt, daß die
 * Behebung die **erreichbaren** Meldungen nicht mitgenommen hat. Das wird
 * bei jedem Fall unten ausgeschrieben, nicht nur behauptet.
 *
 * ---------------------------------------------------------------------------
 * Die zwei letzten Fälle: Z-52, aus einem Fall werden zwei (O-HY, T-208)
 * ---------------------------------------------------------------------------
 *
 * Der bis T-207 hier stehende fünfte Fall hieß „ein Leerzeichen ist eine
 * Eingabe, kein leerer Wert" und setzte dabei `edited = false` — der Titel
 * behauptete eine getippte Eingabe, die Daten bauten das genaue Gegenteil:
 * ein **vorbelegtes** Feld, das niemand berührt hat (spec-ux-reviewer, T-200
 * Abschnitt 2.3, Z-52). Gemessen war damit nicht der im Titel behauptete
 * Fall, sondern der einzige Zustand, in dem die alte Fassung von
 * `touchedOnBlur` an ihrer schwächsten Stelle unbemerkt blieb.
 *
 * Aus dem einen Fall werden deshalb zwei, wie in Z-52 vorgeschlagen:
 *
 *  - **„ein getipptes Leerzeichen ist eine Eingabe"** (`edited = true`) — der
 *    Fall, den der alte Titel tatsächlich beschrieb, unverändert grün unter
 *    jeder der vier Fassungen oben (die erste Hälfte trägt ihn allein).
 *  - **„ein vorbelegtes Leerzeichen ist keine"** (`edited = false`) — der
 *    Fall, an dem sich die Berichtigung O-HY entscheidet: Unter Fassung 3
 *    (vor der Berichtigung) liefert `touchedOnBlur(" ", false)` **`true`**
 *    (`" ".length > 0`); unter Fassung 4 (die Berichtigung, heute im
 *    Bestand) liefert dieselbe Eingabe **`false`** (`" ".trim().length`
 *    ist `0`). Von den sechs Fällen dieser Datei (die vier unveränderten aus
 *    T-193, plus diese zwei aus der Aufteilung des fünften) ist das der
 *    einzige, an dem die Berichtigung überhaupt einen Unterschied macht —
 *    jeder Rot-vor-Grün-Beleg dazu steht im Bericht T-208, nicht hier, weil
 *    eine Mutation von Produktivcode nicht in eine Prüfdatei gehört.
 */
import { describe, expect, it } from "vitest";
import type { DraftText } from "../../src/api/types";
import { touchedOnBlur } from "../../src/lib/touched";

/** Fassung 1 — der Zustand, den O-FY behoben hat: jedes Verlassen zählt. */
function wieVorT186(_value: DraftText, _edited: boolean): boolean {
  return true;
}

/** Fassung 2 — die erste T-186-Fassung, vor der Schärfung im Nachtrag. */
function ersteT186Fassung(value: DraftText, valueAtOpen: DraftText): boolean {
  return value !== valueAtOpen || value.length > 0;
}

/**
 * Fassung 3 — die Schärfung aus dem T-186-Nachtrag, **vor** der Berichtigung
 * O-HY (T-200 Z-51, umgesetzt T-207): die zweite Hälfte fragt die
 * ungeschnittene Länge. Das war der Stand des Bestands, gegen den T-193
 * gemessen hat, und der Stand, den dieser Prüffall (Z-52, unten) rot machen
 * würde, gäbe es ihn heute noch.
 */
function vorDerBerichtigungOHY(value: DraftText, edited: boolean): boolean {
  return edited || value.length > 0;
}

describe("touchedOnBlur — Regel P-8 (O-GS)", () => {
  it("Öffnen, Tabulator hindurch, kein Zeichen getippt → nicht angefaßt (O-FY, der behobene Befund)", () => {
    const value: DraftText = "";
    const edited = false;

    expect(touchedOnBlur(value, edited)).toBe(false);

    // Der Nachweis, daß dieser Fall die Behebung wirklich mißt: vor T-186
    // hätte dasselbe Verlassen unbedingt "touched" gesetzt — genau der Tadel
    // vor dem ersten Zeichen aus Befund O-FY.
    expect(wieVorT186(value, edited)).toBe(true);
  });

  it("etwas getippt, dann verlassen → angefaßt", () => {
    const value: DraftText = "Kunden Nord";
    const edited = true;

    expect(touchedOnBlur(value, edited)).toBe(true);

    // Dieser Fall wäre auch vor T-186 grün gewesen (die Meldung war immer
    // erreichbar, sobald jemand tippte) — er mißt für sich allein nicht die
    // Behebung, sondern daß sie den erreichbaren Weg nicht verbaut hat.
    expect(wieVorT186(value, edited)).toBe(true);
  });

  it("getippt und wieder gelöscht, ohne zwischendurch zu verlassen → angefaßt (Schärfung im Nachtrag)", () => {
    // Zustand nach "a" tippen und wieder löschen, ohne das Feld je zu
    // verlassen: der Wert ist wieder der vom Öffnen ("") — der Benutzer hat
    // das Feld aber berührt. Der Orchestrator hat das ausdrücklich als
    // "angefaßt" entschieden (T-193): wer tippt und löscht, hat das Feld
    // berührt.
    const valueAtOpen: DraftText = "";
    const value: DraftText = "";
    const edited = true;

    expect(touchedOnBlur(value, edited)).toBe(true);

    // Wäre auch vor T-186 grün gewesen (jedes Verlassen zählte) — dieser
    // Fall mißt also nicht O-FY. Er mißt die **Schärfung**: die erste
    // T-186-Fassung verglich den Wert mit dem Öffnungswert und wäre hier
    // ROT gewesen (Wert unverändert gegenüber dem Öffnen, also "false" statt
    // des geforderten "true"). Ohne diese Zeile hier stünde die Schärfung
    // ungemessen da wie zuvor die ganze Regel.
    expect(wieVorT186(value, edited)).toBe(true);
    expect(ersteT186Fassung(value, valueAtOpen)).toBe(false);
  });

  it("vorbelegtes Feld (Bearbeiten), unverändert verlassen → angefaßt, aber stumm — P-8s zweite Hälfte", () => {
    // Wörtlich P-8: "... nur, wenn der Wert sich seit dem Öffnen geändert hat
    // ODER nicht leer ist." Ein vorbelegtes, unverändertes Feld ist nicht
    // leer — es gilt als angefaßt. `touched.ts` sagt das selbst so ("Es gilt
    // als berührt — und bleibt trotzdem stumm, weil die Meldung darüber
    // einen leeren Wert verlangt").
    //
    // Nicht identisch mit der Kurzfassung "nicht angefaßt" aus dem
    // Arbeitsauftrag zu dieser Aufgabe (T-193): Der Auftrag beschreibt damit
    // die sichtbare Folge (keine Meldung erscheint), nicht den Rückgabewert
    // dieser Funktion. Beide Lesarten führen zum selben Verhalten am Feld,
    // weil die Meldung zusätzlich einen leeren Wert verlangt — aber nur eine
    // davon ist das, was `touchedOnBlur` tatsächlich zurückgibt. Gemessen
    // ist hier die Funktion, wörtlich nach P-8 und dem Kopfkommentar der
    // Datei; die Abweichung von der Kurzfassung im Auftrag steht im Bericht.
    const value: DraftText = "Kunden Nord";
    const edited = false;

    expect(touchedOnBlur(value, edited)).toBe(true);

    // Auch dieser Fall wäre vor T-186 grün gewesen — er sichert eine
    // Verhaltensregel, die es schon vor T-186 gab (jedes Verlassen setzte
    // touched), nicht eine Behebung dieser Aufgabe.
    expect(wieVorT186(value, edited)).toBe(true);
  });

  it("ein getipptes Leerzeichen ist eine Eingabe (Z-52, erster der zwei Fälle)", () => {
    // Wer ein Leerzeichen tippt, löst ein `onChange` aus — `edited` ist wahr,
    // und die Regel ist schon über ihre erste Hälfte entschieden, bevor die
    // zweite (`trim()` oder nicht) überhaupt gefragt wird. Deshalb bleibt
    // dieser Fall unter jeder der vier Fassungen oben identisch grün: Weder
    // O-FY noch die Schärfung noch die Berichtigung O-HY ändern ihn.
    const value: DraftText = " ";
    const edited = true;

    expect(touchedOnBlur(value, edited)).toBe(true);

    expect(wieVorT186(value, edited)).toBe(true);
    expect(vorDerBerichtigungOHY(value, edited)).toBe(true);
  });

  it("ein vorbelegtes Leerzeichen ist keine Eingabe (Z-52, zweiter Fall — hier entscheidet sich die Berichtigung O-HY)", () => {
    // Der Gegenfall zu oben, und der einzige der fünf Grenzfälle dieser
    // Datei, an dem die Berichtigung O-HY (T-200 Z-51, umgesetzt T-207)
    // überhaupt etwas ändert: ein Feld, das schon beim Öffnen nur aus
    // Leerzeichen besteht und das niemand angefaßt hat. Kein `onChange`, also
    // `edited = false` — die erste Hälfte der Regel trägt hier nichts, die
    // Entscheidung liegt allein bei der zweiten.
    const value: DraftText = " ";
    const edited = false;

    expect(touchedOnBlur(value, edited)).toBe(false);

    // Wie schon Fall 1 dieser Datei wäre auch das vor T-186 rot gewesen
    // (jedes Verlassen zählte bedingungslos).
    expect(wieVorT186(value, edited)).toBe(true);

    // Und hier liegt der eigentliche Meßpunkt dieses Falls: Die Fassung vor
    // der Berichtigung O-HY (Z-51) liefert für dieselbe Eingabe **`true`**
    // — `" ".length > 0` ist wahr, `trim()` fehlt. Gegen diese Fassung wäre
    // die obige Erwartung `false` rot gewesen (`expected true to be false`).
    // Der tatsächliche Rot-vor-Grün-Lauf dazu (Mutation von `touched.ts`,
    // mit Prüfsumme vor/nach Wiederherstellung belegt) steht im Bericht
    // T-208, nicht hier — eine Prüfdatei mutiert kein Produktivcode.
    expect(vorDerBerichtigungOHY(value, edited)).toBe(true);
  });
});
