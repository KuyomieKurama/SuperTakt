/**
 * Takt — Einstiegspunkt des lokalen Dienstes, **aus dem Quelltext gestartet**.
 *
 * Bewusst dünn: Alles Bauen steht in `composition.ts`, alles Starten in
 * `main.ts`. Diese Datei existiert, damit der Entwicklungsbetrieb und der
 * Nachweispfad einen festen Namen ansprechen können.
 *
 * ===========================================================================
 * Warum hier kein Auflösungshaken mehr steht
 * ===========================================================================
 *
 * Bis T-029 stand hier einer. `packages/domain` schrieb seine internen Importe
 * mit `.js`-Endung (`export * from './kernel.js'`) — die Schreibweise für
 * ausgegebenes JavaScript. Bündler bogen sie zurecht, **Node löst sie wörtlich
 * auf** und fand nichts: Die Datei heißt `kernel.ts`. Wer den Dienst aus dem
 * Quelltext startete — Entwicklungsbetrieb und jeder Prüfpfad —, brauchte
 * deshalb einen Haken, der `./x.js` auf `./x.ts` abbildete.
 *
 * Der Haken war nie der Fehler, sondern das Pflaster: Ein Modulbezeichner, der
 * auf eine Datei zeigt, die es im Arbeitsbereich nirgends gibt, ist eine
 * Unstimmigkeit, die jede Werkzeugkette einzeln geradebiegen muss — und jede
 * auf ihre Weise. `packages/storage` schrieb von Anfang an `.ts`,
 * `packages/export` seit T-028, `packages/domain` seit T-029. Damit gibt es im
 * ganzen Arbeitsbereich keinen `.js`-Bezeichner mehr, und der Haken hat nichts
 * mehr aufzulösen.
 *
 * Fällt der Fall je wieder an, gehört er dorthin, wo er entsteht: in die
 * Endung des Imports, nicht in einen Haken am Einstiegspunkt.
 */

import { main } from './main.ts';

await main();
