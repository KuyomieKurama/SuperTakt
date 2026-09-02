/**
 * Takt — Zusammenführung der Leistungstexte einer Tagesgruppe
 * (E-020, E-026, E-028, A-7.4).
 *
 * Seit E-020 entsteht eine Exportzeile je Todo und Kalendertag. Damit müssen
 * die Leistungstexte mehrerer Buchungen zu einem Text werden.
 *
 * **Diese Funktion sortiert nicht.** Die Reihenfolge steht bereits fest:
 * `groupExportCandidates` in `packages/domain/src/export.ts` sortiert die
 * Buchungen einer Gruppe nach Startzeit, und diese Reihenfolge ist zugleich die
 * Reihenfolge der Textabschnitte. Ein zweites Sortieren hier wäre eine zweite
 * Stelle, an der sich die Reihenfolge ändern könnte.
 *
 * **Es wird nie zurückgeparst** (E-028). Wer wissen will, welche Buchungen in
 * einer Exportzeile stecken, fragt `export_run_entry`; die Beziehung steht in
 * der Datenbank, nicht im Text. Sobald man aufhört, den Text parsen zu wollen,
 * ist ein Semikolon mitten im Text kein Problem mehr — und genau deshalb bleibt
 * er unverändert: kein Escaping, kein Ersetzen, keine Kürzung. `\;` oder `;;`
 * stünde wörtlich auf einer Kundenrechnung, und ein Komma statt des Semikolons
 * hieße, Kundendaten still umzuschreiben.
 */

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
