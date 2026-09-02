/**
 * Takt — Kennungen (UUIDv7).
 *
 * Zufällig genug, um nicht erraten zu werden, und nach Erzeugungszeit
 * sortierbar. Das zweite ist hier kein Schmuck: Die Sortierschlüssel des
 * Exports hängen an Zeitstempel plus Kennung, jede Blätterung setzt die
 * Kennung als eindeutigen zweiten Schlüssel hinter `updated_at`, und der
 * Trigger aus Migration 0006 entscheidet damit, welche Protokollzeile die
 * jüngste ist (siehe unten). Eine rein zufällige Kennung (UUIDv4) machte alle
 * drei Reihenfolgen willkürlich.
 *
 * Aufbau nach RFC 9562, Abschnitt 5.7, mit dem Zähler aus Abschnitt 6.2
 * („Method 1: Fixed-Length Dedicated Counter Bits"):
 *
 * ```
 *   48 Bit  Unix-Zeit in Millisekunden, big endian
 *    4 Bit  Version (7)
 *   12 Bit  Zähler innerhalb derselben Millisekunde
 *    2 Bit  Variante (10)
 *   62 Bit  Zufall
 * ```
 *
 * ===========================================================================
 * Warum ein Zähler, und was ohne ihn passiert ist (T-041)
 * ===========================================================================
 *
 * Bis T-041 standen in den zwölf Bit hinter der Version **Zufallsbits**. Damit
 * war „nach Erzeugungszeit sortierbar" nur zwischen Millisekunden wahr;
 * innerhalb einer Millisekunde war die Reihenfolge zweier Kennungen ein
 * Münzwurf. Der Kopf dieser Datei hat das trotzdem als Eigenschaft
 * versprochen, und an einer Stelle wurde darauf gebaut:
 *
 * `trg_time_entry_exported_needs_provenance` (Migration 0006) sucht die
 * **jüngste** Protokollzeile einer Buchung mit
 * `ORDER BY occurred_at DESC, id DESC`. `occurred_at` hat Sekundenauflösung
 * (`Timestamp` schneidet Millisekunden ab), also entschied regelmäßig die
 * Kennung — und damit der Zufall. Gemessen: In vierzig Durchläufen schlug
 * „nicht abrechnen" neunmal fehl, weil der Trigger die ältere Zeile für die
 * jüngste hielt. Die bereits geschriebene Protokollzeile blieb dabei stehen:
 * ein Protokoll, das „nicht abgerechnet" bezeugt, und eine Buchung, die weiter
 * offen ist und in den nächsten Export läuft (R-10).
 *
 * Der Zähler macht die Zusage wahr, statt sie zurückzunehmen. Er läuft je
 * Millisekunde von einem zufälligen Startwert aufwärts — zufällig, damit aus
 * zwei Kennungen nicht ablesbar ist, wie viele dazwischen vergeben wurden, und
 * mit Luft nach oben, damit ein Überlauf nicht im Betrieb eintritt.
 *
 * Läuft er dennoch über oder springt die Uhr zurück, wird die **Zeit**
 * fortgeschrieben statt der Zähler zurückgesetzt (RFC 9562, 6.2, „clock
 * rollback"): Eine Kennung, die um wenige Millisekunden in der Zukunft liegt,
 * ist harmlos; eine, die kleiner ist als ihre Vorgängerin, bricht genau die
 * Eigenschaft, für die es diesen Zähler gibt.
 *
 * Der Zufall kommt aus `node:crypto` und nicht aus `Math.random`. Kennungen
 * stehen in Adressen und in Exportdateien; ein vorhersagbarer Generator wäre
 * eine unnötige Angriffsfläche. Die 62 unteren Bit bleiben vollständig
 * zufällig — der Zähler nimmt nur die zwölf, die ohnehin unter der Zeit
 * stehen, und ändert an der Unratbarkeit nichts Nennenswertes.
 */

import { randomBytes } from 'node:crypto';

/** Erzeugt Kennungen. Eigener Typ, damit ein Prüfpfad feste Werte einsetzen kann. */
export interface IdSource {
  next(): string;
}

export function createIdSource(): IdSource {
  return { next: uuidv7 };
}

/** Höchster Wert der zwölf Zählerbit. */
const COUNTER_MAX = 0x0fff;

/**
 * Startwert des Zählers innerhalb einer neuen Millisekunde.
 *
 * Nicht bei null, sondern zufällig im unteren Viertel: Der Anfangswert soll
 * nicht verraten, dass eine Millisekunde neu begonnen hat, und es sollen
 * trotzdem gut dreitausend Schritte bleiben, bevor die Zeit fortgeschrieben
 * werden muss.
 */
const freshCounter = (): number => randomBytes(2).readUInt16BE(0) & 0x03ff;

let lastMillis = -1;
let counter = 0;

export function uuidv7(): string {
  const bytes = randomBytes(16);

  const now = Date.now();
  if (now > lastMillis) {
    lastMillis = now;
    counter = freshCounter();
  } else {
    // Dieselbe Millisekunde — oder die Uhr ist zurückgesprungen. Beide Fälle
    // werden gleich behandelt: weiterzählen auf der zuletzt benutzten Zeit.
    counter += 1;
    if (counter > COUNTER_MAX) {
      lastMillis += 1;
      counter = freshCounter();
    }
  }
  const millis = lastMillis;

  // 48 Bit Zeit. `Number` reicht bis 2^53, die Millisekunden liegen weit
  // darunter — bis zum Jahr 10889 in 48 Bit.
  bytes[0] = Math.floor(millis / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(millis / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(millis / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(millis / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(millis / 2 ** 8) & 0xff;
  bytes[5] = millis & 0xff;

  // Version 7 in den oberen vier Bit von Byte 6, darunter die zwölf
  // Zählerbit — sie ersetzen den Zufall, der dort stand.
  bytes[6] = 0x70 | ((counter >>> 8) & 0x0f);
  bytes[7] = counter & 0xff;
  // Variante 10xx in den oberen zwei Bit von Byte 8.
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
