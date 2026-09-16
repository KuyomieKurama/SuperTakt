/** Die Eingabereihenfolge bleibt erhalten. Texte werden unverändert zusammengefügt; Buchungsbeziehungen kommen aus `export_run_entry`, niemals aus zurückgeparstem Text. */

import type { ExportNoteSeparator } from '@takt/domain/export';

/**
 * Trennzeichen zwischen zwei Leistungstexten.
 *
 * Der Wert ist an den Typ aus der Domäne gebunden. Steht dort eines Tages etwas
 * anderes, bricht diese Zeile beim Übersetzen — Vorschau und Datei können nicht
 * auseinanderlaufen (R-17).
 */
export const NOTE_SEPARATOR: ExportNoteSeparator = '; ';

/**
 * Randnormalisierung eines einzelnen Abschnitts (E-028).
 *
 * Weg fallen: umschließende Leerzeichen, ein abschließendes Semikolon, ein
 * abschließender Punkt. Damit entsteht beim Verbinden nie `";;"`, nie `".; "`
 * und nie `"; ; "`.
 *
 * Die Schleife läuft, bis nichts mehr abfällt: `"erledigt.;"` verliert erst das
 * Semikolon, dann den Punkt. Ein einzelner Durchlauf ließe je nach Reihenfolge
 * eines von beiden stehen.
 *
 * **Auslassungspunkte bleiben stehen.** `"kommt später..."` endet auf einem
 * Punkt, aber die drei Punkte sind Inhalt und keine Interpunktion am Rand;
 * E-028 verbietet Kürzung abseits der Randnormalisierung. Deshalb fällt ein
 * Punkt nur, wenn ihm kein zweiter vorausgeht.
 */
const normalizeSegment = (segment: string): string => {
  let text = segment.trim();

  for (;;) {
    if (text.endsWith(';')) {
      text = text.slice(0, -1).trimEnd();
      continue;
    }
    if (text.endsWith('.') && !text.endsWith('..')) {
      text = text.slice(0, -1).trimEnd();
      continue;
    }
    return text;
  }
};

/**
 * Verbindet die Leistungstexte einer Tagesgruppe zu einem Text (E-026).
 *
 * Erwartet die Texte in der Reihenfolge von `ExportGroup.entries`, also nach
 * Startzeit. Leere Abschnitte — auch solche aus lauter Leerzeichen — fallen
 * vollständig weg, damit keine leeren Stellen und keine doppelten Trenner
 * entstehen.
 *
 * Sind alle Abschnitte leer, ist das Ergebnis die leere Zeichenkette. **Kein
 * Platzhaltertext** (E-034): Etwas hineinzuschreiben, was niemand geleistet
 * hat, hieße erfundene Daten an den Kunden zu schicken. Ob die Gruppe damit
 * exportierbar ist, entscheidet diese Funktion nicht — das tut
 * `renderExportGroup`.
 */
export const mergeBookingNotes = (notes: readonly string[]): string =>
  notes
    .map(normalizeSegment)
    .filter((segment) => segment.length > 0)
    .join(NOTE_SEPARATOR);
