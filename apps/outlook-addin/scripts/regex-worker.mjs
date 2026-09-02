/**
 * Takt — Auswertungs-Worker für den Nachweispfad (`node:worker_threads`).
 *
 * Das Gegenstück zu `src/callnumber/worker.ts` auf der Node-Seite. Er ruft
 * **dieselbe** Funktion `runPattern` auf, und der Aufgabenbereich benutzt
 * **denselben** `createTimedEvaluator`. Damit wird der harte Abbruch aus B-4.1
 * an dieser Stelle tatsächlich ausgeführt und nicht nur behauptet.
 *
 * Was hier nicht nachgewiesen wird — und das steht so auch im Bericht: dass ein
 * Browser-`Worker` sich in Outlook genauso beenden lässt. Das ist eine Zusage
 * der Laufzeitumgebung, kein Verhalten dieses Quelltextes.
 */

import { parentPort } from 'node:worker_threads';

import { runPattern } from '../src/callnumber/run.ts';

parentPort.on('message', (request) => {
  parentPort.postMessage(runPattern(request));
});

// Dieselbe Bereitschaftsmeldung wie im Web Worker. Ohne sie liefe die
// Zeitgrenze über den Start eines Node-Workers, und der Nachweis wäre auf einem
// ausgelasteten Rechner sporadisch rot — genau der Fehler, den er finden soll.
parentPort.postMessage({ kind: 'ready' });
