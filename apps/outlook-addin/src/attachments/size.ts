/**
 * SuperTakt — Größenangaben im Aufgabenbereich (Entwurf 4.2).
 *
 * `340 KB`, `1,2 MB`, `31,4 MB`, und unter einem Kilobyte `< 1 KB`. Komma als
 * Dezimaltrennzeichen, weil die Oberfläche deutsch ist.
 *
 * Die Grenze zwischen Kilo- und Megabyte ist die einzige Stelle mit einer
 * Nachkommastelle: `1,2 MB` unterscheidet sich von `1,9 MB` um eine halbe
 * Wartezeit, `340 KB` von `341 KB` um nichts.
 */

const KIBI = 1024;
const MEBI = 1024 * 1024;

/** Eine Nachkommastelle, Komma statt Punkt. */
const withComma = (value: number): string => value.toFixed(1).replace('.', ',');

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return '< 1 KB';
  if (bytes < KIBI) return '< 1 KB';
  if (bytes < MEBI) return `${String(Math.round(bytes / KIBI))} KB`;
  return `${withComma(bytes / MEBI)} MB`;
};
