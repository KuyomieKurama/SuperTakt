/** Die Frist wird von Hand eingegeben. Die Domänenprüfung unterstützt die Eingabe; der Dienst prüft unabhängig davon erneut. */

import { DUE_DATE_MESSAGE, isCalendarDay } from '@takt/domain';

/**
 * Was im Fristfeld steht, in den drei Fällen, die es gibt.
 *
 * Drei Ausgänge und **kein** `string | null` mit einem Fehler daneben: „ohne
 * Frist" und „unbrauchbare Eingabe" sind verschiedene Dinge, und beide sind
 * ein Ergebnis. Wer sie in einem Wert zusammenfasst, muss die Unterscheidung
 * an jeder Aufrufstelle neu treffen — und die naheliegende Behandlung eines
 * unbrauchbaren Werts ist dann „wie leer", also stillschweigend verwerfen.
 * Ein Todo, dessen Frist der Benutzer eingetragen hat und das ohne sie
 * entsteht, ist der teurere Fehler.
 */
export type DueDateEntry =
  | { readonly kind: 'none' }
  | { readonly kind: 'day'; readonly day: string }
  | { readonly kind: 'invalid'; readonly message: string };

/**
 * Liest den Feldinhalt.
 *
 * **Ohne `trim`.** Das ist Absicht und nicht Nachlässigkeit: `dueDateSchema`
 * an der Tür trimmt ebenfalls nicht, und die Hauptanwendung schickt den
 * Feldinhalt ebenso ungeschnitten (`TodoFormDialog.tsx`). Ein Add-in, das
 * `" 2026-09-30 "` stillschweigend zurechtschneidet, nähme eine Eingabe an,
 * die über den anderen Weg abgewiesen wird — derselbe Befund C-03, nur an
 * zwei Leerzeichen. Ein solcher Wert bekommt hier denselben Satz wie an der
 * Tür.
 *
 * Die **leere** Zeichenkette ist der einzige Weg zu `none`. Ein `type="date"`
 * liefert von sich aus entweder `JJJJ-MM-TT` oder genau diese leere
 * Zeichenkette; wo das Feld auf ein Textfeld zurückfällt, entscheidet dieselbe
 * Zeile.
 */
export function readDueDate(raw: string): DueDateEntry {
  if (raw.length === 0) return { kind: 'none' };
  if (isCalendarDay(raw)) return { kind: 'day', day: raw };

  /*
   * Der Satz kommt aus der Domäne und wird hier nicht formuliert.
   *
   * Er nennt die Form, die Bandbreite der Jahre und den Umstand, dass eine
   * Uhrzeit nicht dazugehört — und er nennt den **abgewiesenen Wert nicht**.
   * Das ist an dieser Stelle keine Feinheit: Der Aufgabenbereich zeigt Text
   * aus einer fremden E-Mail, und eine Fehlermeldung, die eine Eingabe
   * wörtlich wiedergibt, ist der bequemste Weg, ein Richtungszeichen in einen
   * deutschen Satz zu setzen (T-119).
   */
  return { kind: 'invalid', message: DUE_DATE_MESSAGE };
}

/**
 * Was für `POST /addin/todos` daraus wird.
 *
 * `null` für „ohne Frist" **und** für eine unbrauchbare Eingabe — und das ist
 * kein stilles Verwerfen, sondern die zweite Hälfte einer Arbeitsteilung: Der
 * Aufgabenbereich lässt gar nicht erst absenden, solange
 * {@link readDueDate} `invalid` sagt (derselbe Riegel wie bei der
 * Call-Nummer). Diese Funktion beantwortet nur noch die Frage „was steht im
 * Rumpf", und für einen Fall, den es beim Absenden nicht gibt, ist `null` die
 * einzige Antwort, die keine neue Bedeutung erfindet.
 */
export function dueDateForRequest(entry: DueDateEntry): string | null {
  return entry.kind === 'day' ? entry.day : null;
}
