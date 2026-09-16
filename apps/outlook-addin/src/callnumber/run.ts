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
    // zwischen zwei E-Mails hängen bleibt. Die Erkennung ist bewusst immer
    // case-insensitiv: Ein Vorgang `TCK-123` soll auch aus `tck-123`, `Tck-123`
    // oder einer anders geschriebenen Betreffzeile erkannt werden, ohne dass
    // jedes gespeicherte Muster seine eigene `(?i)`-Variante führen müsste.
    expression = new RegExp(request.source, 'i');
  } catch (error) {
    return {
      id: request.id,
      kind: 'invalid',
      message: error instanceof Error ? error.message : 'unbekannter Fehler',
    };
  }

  if (expression.test('')) {
    return { id: request.id, kind: 'invalid', message: 'Dieser Ausdruck trifft auch auf leeren Text zu und wurde nicht gespeichert.' };
  }
  const found = expression.exec(request.text);
  if (found === null) {
    return { id: request.id, kind: 'no_match' };
  }

  return { id: request.id, kind: 'match', group: found[1] ?? found[0] ?? null };
};
