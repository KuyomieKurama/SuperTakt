/**
 * Takt — was ein Feld an sein Bedienelement weitergibt (V-03 aus T-154, T-158).
 *
 * ## Warum das hier steht und nicht in `Primitives.tsx`
 *
 * Bis T-158 erzeugte `Field` die Kennungen `…-hint` und `…-error`, und **kein
 * einziges** Eingabefeld des Aufgabenbereichs verwies darauf. Für einen
 * sehenden Benutzer stand der Hinweis da; für einen Benutzer mit Vorlesehilfe
 * stand er nicht da. Am Fristfeld war das nicht eine Feinheit, sondern der
 * ganze Punkt: Die Frist ist das einzige Feld dieses Bereichs, das weder
 * vorbelegt noch aus der E-Mail erkannt wird (E-074 Punkt 4), und diese
 * **Abwesenheit** wird nirgends sonst ausgesprochen.
 *
 * Die Entscheidung, *welche* Kennungen an das Bedienelement gehen, ist damit
 * eine Regel und keine Anordnung von Kästen. Sie steht deshalb in einer Datei
 * ohne JSX — der Nachweispfad (`proof:addin`, Abschnitt 19) kann sie laden und
 * über alle vier Fälle messen, ohne den Aufgabenbereich zu zeichnen. Eine
 * Zusicherung, die niemand ausführt, ist eine Behauptung.
 *
 * ## Die drei Regeln
 *
 *  1. **Beides, wenn beides dasteht.** `aria-describedby` führt Hinweis **und**
 *     Fehler, in dieser Reihenfolge — dieselbe wie im Formular der
 *     Hauptanwendung (`FormDialog.tsx#TextField`) und dieselbe wie im
 *     sichtbaren Aufbau. Ein Fehler ersetzt die Erklärung nicht; er tritt
 *     daneben (SC 1.3.1, SC 3.3.2).
 *  2. **Der Hinweis bleibt stehen, wenn ein Fehler entsteht.** Bis T-158 fiel
 *     er weg (`hint !== undefined && error === undefined`) — genau in dem
 *     Augenblick, in dem der Benutzer mit dem Feld ringt, verlor er den Satz,
 *     der sagt, was das Feld überhaupt ist.
 *  3. **Die Kennung des Bedienelements kommt von hier.** `id` steht in
 *     {@link FieldAria} und nicht an der Aufrufstelle. Zwei Orte für dieselbe
 *     Zeichenkette sind zwei Orte, an denen sie auseinanderlaufen kann — und
 *     ein `label for="tags"` ohne `id="tags"` ist eine Beschriftung, die
 *     niemanden beschriftet.
 */

/**
 * Was an das Bedienelement gespreizt wird.
 *
 * Absichtlich genau die Attribute, die ein `input`, `textarea` oder `select`
 * ohnehin trägt: Die Aufrufstelle schreibt `{...aria}` und muss nichts
 * auswählen. Was sie nicht spreizt, fehlt sichtbar — und der Nachweis in
 * Abschnitt 19 sucht danach.
 */
export interface FieldAria {
  readonly id: string;
  readonly 'aria-describedby'?: string;
  /**
   * Nur `true` oder gar nicht.
   *
   * `aria-invalid="false"` an jedem Feld wäre nicht falsch, aber es ist eine
   * Aussage über jedes Feld zu jedem Zeitpunkt — und die Vorgabe eines Feldes
   * ohne dieses Attribut ist bereits „gültig".
   */
  readonly 'aria-invalid'?: true;
}

/** Alles, was `Field` zum Zeichnen braucht — als Entscheidung, nicht als JSX. */
export interface FieldParts {
  readonly aria: FieldAria;
  readonly hintId: string;
  readonly errorId: string;
  /** Steht der Hinweis da? Seit T-158 auch dann, wenn ein Fehler daneben steht. */
  readonly showHint: boolean;
  readonly showError: boolean;
  /** Klassenname der Feldhülle. Die Farbe des Rahmens hängt daran. */
  readonly className: string;
}

export const fieldHintId = (htmlFor: string): string => `${htmlFor}-hint`;
export const fieldErrorId = (htmlFor: string): string => `${htmlFor}-error`;

/**
 * Die Beschreibung eines Feldes aus seinen zwei Texten.
 *
 * `hint` und `error` werden als *vorhanden oder nicht* gelesen; der Wortlaut
 * spielt hier keine Rolle. Ein leerer Text ist dabei kein Text: `error=""`
 * ließe eine Meldefläche ohne Meldung entstehen und `aria-invalid` an einem
 * Feld, zu dem niemand sagen kann, was falsch ist.
 */
export function fieldParts(
  htmlFor: string,
  hint: string | undefined,
  error: string | undefined,
): FieldParts {
  const hintId = fieldHintId(htmlFor);
  const errorId = fieldErrorId(htmlFor);
  const showHint = hint !== undefined && hint.length > 0;
  const showError = error !== undefined && error.length > 0;

  const described = [showHint ? hintId : null, showError ? errorId : null].filter(
    (part): part is string => part !== null,
  );

  return {
    aria: {
      id: htmlFor,
      ...(described.length === 0 ? {} : { 'aria-describedby': described.join(' ') }),
      ...(showError ? { 'aria-invalid': true as const } : {}),
    },
    hintId,
    errorId,
    showHint,
    showError,
    className: showError ? 'field field--invalid' : 'field',
  };
}

/**
 * Eine eigene Beschreibung an eine fremde anhängen.
 *
 * Der Tag-Auswähler bringt seine eigene Zeile mit (die Trefferzahl) und
 * bekommt zusätzlich den Hinweis des Feldes. Beides gehört an dasselbe
 * Suchfeld, und die Reihenfolge ist dieselbe wie oben: erst das Allgemeine des
 * Feldes, dann das Besondere des Bausteins.
 */
export const withDescription = (aria: FieldAria, id: string): FieldAria => ({
  ...aria,
  'aria-describedby': aria['aria-describedby'] === undefined ? id : `${aria['aria-describedby']} ${id}`,
});
