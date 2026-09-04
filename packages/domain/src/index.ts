/**
 * Takt — Domäne, öffentliche Fläche.
 *
 * `packages/domain` kennt weder HTTP noch SQL (CLAUDE.md, E-001) und importiert
 * keine Fremdbibliothek. T-001 liefert nur Typen; die Umsetzung folgt in T-009.
 *
 * Bezeichner sind englisch und an den Tabellennamen ausgerichtet (E-015, R-16),
 * Kommentare und Anzeigetexte bleiben deutsch.
 *
 * Für den Exportmotor gibt es einen zweiten, engeren Einstiegspunkt:
 * `@takt/domain/export` zeigt allein auf export.ts und gibt weder `Todo` noch
 * `TodoNote` heraus. Siehe R-06.
 *
 * Die internen Importe schreiben die Endung `.ts` — die Endung der Datei, die
 * dort wirklich liegt (T-029). Die Alternative `./kernel.js` ist die
 * Schreibweise für ausgegebenes JavaScript; sie zeigt auf eine Datei, die es in
 * diesem Arbeitsbereich nirgends gibt. Bündler bogen sie zurecht, Node nicht —
 * jeder Lauf aus dem Quelltext brauchte deshalb einen Auflösungshaken. Der ist
 * mit dieser Schreibweise entfallen. Sie gilt in `packages/storage` und
 * `packages/export` genauso.
 */

// Module mit Laufzeitanteil (T-009): Typen und Werte.
export * from './kernel.ts';
export * from './rounding.ts';
export * from './call-number.ts';
export * from './characters.ts';
export * from './enumeration.ts';
export * from './tag.ts';
export * from './board.ts';
export * from './pool-movement.ts';
export * from './tag-name.ts';
export * from './time-entry.ts';
export * from './export.ts';

// Reine Typmodule. `export type *` haelt fest, dass hier kein Wert entsteht --
// wer hier etwas Ausfuehrbares ergaenzt, sieht sofort, dass er die Absicht der
// Datei aendert.
export type * from './todo.ts';
export type * from './settings.ts';
