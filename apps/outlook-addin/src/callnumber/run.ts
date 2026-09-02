/**
 * Takt — die einzige Stelle, an der ein Benutzerausdruck tatsächlich läuft.
 *
 * Diese Datei wird **ausschließlich innerhalb eines Workers** aufgerufen —
 * im Browser von `worker.ts`, im Nachweispfad von einem `node:worker_threads`-
 * Worker. Nie im Faden, der die Oberfläche zeichnet.
 *
 * Der Grund steht in B-4.1: Ein laufender regulärer Ausdruck ist in JavaScript
 * **nicht unterbrechbar**. Weder `setTimeout` noch eine Zeitmessung im selben
 * Faden helfen, weil der Faden steht. Der einzige Weg, eine Auswertung
 * wirklich abzubrechen, ist `terminate()` auf dem Worker — und das setzt
 * voraus, dass die Auswertung dort und nirgendwo sonst stattfindet.
 *
 * Wer diese Datei aus einer Oberflächendatei importiert, hebt das Gegenmittel
 * auf. Der Nachweis in `scripts/proof-addin.mjs` prüft deshalb, dass sie außer
 * von den beiden Workern von niemandem importiert wird.
 */

import type { EvaluateRequest, EvaluateResponse } from './protocol.ts';

export const runPattern = (request: EvaluateRequest): EvaluateResponse => {
  let expression: RegExp;

  try {
    // Je Aufruf neu übersetzt und ohne `g` (B-4.4): kein `lastIndex`, der
    // zwischen zwei E-Mails hängen bleibt.
    expression = new RegExp(request.source);
  } catch (error) {
    return {
      id: request.id,
      kind: 'invalid',
      message: error instanceof Error ? error.message : 'unbekannter Fehler',
    };
  }

  const found = expression.exec(request.text);
  if (found === null) {
    return { id: request.id, kind: 'no_match' };
  }

  // **Gruppe 1, nicht der Gesamttreffer** (B-4.3 Punkt 1). Ein Muster ohne
  // Erfassungsgruppe kommt an dieser Stelle gar nicht mehr an; `checkPattern`
  // hat es abgelehnt. Kommt es doch — etwa aus einer alten Einstellung —, ist
  // der Wert `undefined` und wird zu `null`, also zu „nicht erkannt".
  return { id: request.id, kind: 'match', group: found[1] ?? null };
};
