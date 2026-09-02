/**
 * Takt — Erkennung der Call-Nummer aus einer E-Mail (A-10.8, B-4.1 bis B-4.4).
 *
 * Der ganze Ablauf in einer Funktion, damit er an einer Stelle nachlesbar ist:
 *
 * ```
 *   Muster prüfen           checkPattern     ← auch hier, nicht nur beim Speichern (B-4.2 Punkt 2)
 *        ↓
 *   Betreff auswerten       Worker + 100 ms  ← B-4.1 Punkt 1
 *        ↓ (kein Treffer)
 *   Text auswerten          Worker + 100 ms, höchstens 20 000 Zeichen (Punkt 2)
 *        ↓
 *   Treffer plausibilisieren checkCallNumber ← B-4.3 Punkt 3
 *        ↓
 *   Ergebnis mit Herkunft   → S-12 zeigt es an und lässt es ändern (Punkt 5)
 * ```
 *
 * Betreff zuerst, und das ist keine Reihenfolgefrage der Bequemlichkeit: Eine
 * Ticketnummer steht fast immer im Betreff, der Betreff ist kurz, und ein
 * Treffer dort spart die Auswertung über den langen Text vollständig.
 */

import { checkCallNumber, type CallNumberRejection } from '@takt/domain';
import { checkPattern } from './pattern.ts';
import type { Evaluator } from './evaluate.ts';

/** Woraus der Wert stammt. S-12 schreibt es dazu, damit es nachvollziehbar ist. */
export type DetectionOrigin = 'subject' | 'body';

export type Detection =
  | { readonly kind: 'match'; readonly value: string; readonly origin: DetectionOrigin }
  /** Der Ausdruck hat nichts gefunden. Der Normalfall bei einer E-Mail ohne Vorgang. */
  | { readonly kind: 'no_match' }
  /**
   * Etwas wurde gefunden, hält aber der Plausibilisierung nicht stand
   * (B-4.3 Punkt 3). Der Rohwert wird **mitgegeben**, damit S-12 zeigen kann,
   * was der Ausdruck geliefert hat — aber er wird nicht übernommen.
   */
  | {
      readonly kind: 'implausible';
      readonly raw: string;
      readonly reason: CallNumberRejection;
      readonly origin: DetectionOrigin;
    }
  /** Das Muster aus den Einstellungen taugt nicht (B-4.2). Führt zu S-13. */
  | { readonly kind: 'pattern_invalid'; readonly message: string }
  /** Die Zeitgrenze ist abgelaufen, der Worker wurde beendet (B-4.1). */
  | { readonly kind: 'timeout' }
  /** Kein Worker verfügbar. Es wird **nicht** ersatzweise im Hauptfaden gerechnet. */
  | { readonly kind: 'unavailable'; readonly message: string };

export interface MailText {
  readonly subject: string;
  readonly body: string;
}

/**
 * Erkennt die Call-Nummer.
 *
 * `evaluate` ist ein Port. Im Add-in ist es der Worker mit Zeitgrenze; im
 * Nachweispfad eine Attrappe oder ein Node-Worker. Diese Funktion selbst führt
 * **nie** einen Benutzerausdruck aus — sie ruft nur `checkPattern`, und das
 * wertet nichts auf einem Text aus.
 */
export const detectCallNumber = async (
  pattern: unknown,
  mail: MailText,
  evaluate: Evaluator,
): Promise<Detection> => {
  const checked = checkPattern(pattern);
  if (!checked.ok) {
    return { kind: 'pattern_invalid', message: checked.message };
  }

  const places: readonly (readonly [DetectionOrigin, string])[] = [
    ['subject', mail.subject],
    ['body', mail.body],
  ];

  for (const [origin, text] of places) {
    if (text.length === 0) continue;

    const outcome = await evaluate(checked.source, text);

    if (outcome.kind === 'timeout') {
      return { kind: 'timeout' };
    }
    if (outcome.kind === 'unavailable') {
      return { kind: 'unavailable', message: outcome.message };
    }
    if (outcome.kind === 'invalid') {
      return { kind: 'pattern_invalid', message: `Der Ausdruck ist nicht gültig: ${outcome.message}` };
    }
    if (outcome.kind === 'no_match') {
      continue;
    }

    const raw = outcome.group;
    if (raw === null) {
      // Muster ohne Erfassungsgruppe, das an `checkPattern` vorbeigekommen ist.
      // Kein Treffer, keine Ausnahme.
      continue;
    }

    const plausible = checkCallNumber(raw);
    if (plausible.ok) {
      return { kind: 'match', value: plausible.value, origin };
    }

    return { kind: 'implausible', raw, reason: plausible.reason, origin };
  }

  return { kind: 'no_match' };
};
