/**
 * Takt — die **Frist** im Aufgabenbereich (A-19.21, E-074, T-149).
 *
 * ===========================================================================
 * Was diese Datei ist — und was sie ausdrücklich nicht ist
 * ===========================================================================
 *
 * Sie übersetzt zwischen einem Eingabefeld und dem, was `POST /addin/todos`
 * annimmt. Sie ist **keine** Prüfung im Sinne einer Kontrolle: Die Grenze
 * liegt an der Tür des Dienstes, und sie liegt dort auch dann, wenn diese
 * Datei etwas anderes sagt. Was hier steht, ist der Hinweis für den Benutzer,
 * bevor er auf „Todo anlegen" drückt — dieselbe Rolle wie
 * `callNumberProblem` in `TaskPane.tsx` und aus demselben Grund
 * ausgeschrieben: Der Aufgabenbereich läuft in einem Browsersteuerelement,
 * und ein Browsersteuerelement ist kein Riegel.
 *
 * ===========================================================================
 * Die Regel wird gerufen, nicht nachgebaut
 * ===========================================================================
 *
 * `isCalendarDay` und `DUE_DATE_MESSAGE` kommen aus `@takt/domain`
 * (`due-date.ts`, T-146) — derselben Fassung, die `dueDateSchema` in
 * `apps/local-api/src/http/input.ts` an zod bindet und die damit an der
 * Add-in-Tür entscheidet.
 *
 * Eine eigene `/^\d{4}-\d{2}-\d{2}$/` hier wäre die Sorte Abschrift, die
 * T-122, T-128 und T-134 in drei Wellen aufgeräumt haben, und sie wäre nicht
 * einmal gleichwertig: Sie nähme `2026-02-30` an, das Feld ließe den Knopf
 * frei, und der Dienst antwortete mit 422 auf einen Wert, an dem nichts zu
 * sehen ist. Genau diese Sackgasse hat T-114 an der Titellänge gekostet.
 *
 * Dass ein `import type`/`import` aus `@takt/domain` im Add-in zulässig ist,
 * ist seit T-028 entschieden und in `api/types.ts` ausgeschrieben: Das Add-in
 * bindet die **Domäne** ein, nicht den Dienst und nicht die Speicherung.
 *
 * ===========================================================================
 * Kein Muster über der E-Mail (E-074 Punkt 4)
 * ===========================================================================
 *
 * Es gibt in dieser Datei nichts, was einen Betreff oder einen Textkörper
 * liest. Die Frist ist das einzige Feld des Aufgabenbereichs, das **weder**
 * vorbelegt **noch** erkannt wird — der Titel kommt aus dem Betreff, die
 * Call-Nummer aus einem konfigurierbaren Ausdruck über dem Text, der Vermerk
 * auf Knopfdruck aus der Nachricht. Die Frist tippt der Benutzer.
 *
 * Der Grund ist nicht Aufwand: „bis Freitag" in einer fremden E-Mail ist eine
 * Behauptung des Absenders über den Kalender des Empfängers, und eine
 * Anwendung, die daraus einen Tag rechnet, macht sie zur Tatsache. Wer die
 * Frist aus der Mail übernehmen will, liest sie und tippt sie.
 *
 * Rein: gleiche Eingabe, gleiche Ausgabe, kein Zugriff auf Office, Netz oder
 * Speicher.
 */

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
