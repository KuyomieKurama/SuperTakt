/**
 * UUIDv7 mit monotonem Zähler nach RFC 9562: Protokollreihenfolgen benötigen auch innerhalb
 * derselben Millisekunde geordnete Kennungen.
 * Bei Überlauf oder rückwärts laufender Uhr die logische Zeit erhöhen; Zufallsbits aus
 * `node:crypto` beziehen.
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
