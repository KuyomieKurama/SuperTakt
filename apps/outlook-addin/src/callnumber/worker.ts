/**
 * Takt — der Auswertungs-Worker (B-4.1 Punkt 1).
 *
 * Er tut genau eine Sache: eine Zeichenkette gegen ein Muster prüfen und das
 * Ergebnis zurückschicken. Kein Netz, kein Speicher, kein DOM, kein Zugriff auf
 * Office. Bleibt er in einer Auswertung hängen, beendet ihn der Aufgabenbereich
 * nach der Zeitgrenze — und verliert dabei nichts, weil hier nichts liegt.
 */

import type { EvaluateRequest } from './protocol.ts';
import { runPattern } from './run.ts';

self.addEventListener('message', (event: MessageEvent<EvaluateRequest>) => {
  self.postMessage(runPattern(event.data));
});

// Erst nach dieser Zeile läuft die Zeitgrenze aus B-4.1. Sie soll die
// Auswertung messen, nicht das Laden dieses Moduls.
self.postMessage({ kind: 'ready' });
