/**
 * Takt — Zählung fehlgeschlagener Nachweise (B-2.6).
 *
 * Ein 256-Bit-Token ist nicht erratbar. Diese Datei ist deshalb nicht in erster
 * Linie eine Bremse, sondern **die einzige Stelle, an der ein Angriff nach
 * B-1.1 überhaupt sichtbar wird**. Ohne Zählung merkt niemand, dass es jemand
 * versucht.
 *
 * Festgehalten werden Zeitpunkt und Anzahl. **Nicht** der geratene Wert — er
 * ist der Versuch eines Geheimnisses und gehört nirgendwohin.
 *
 * Rein: Zustand hinein, Zustand und Entscheidung heraus. Keine Uhr, kein
 * `setTimeout` — die Zeit kommt als Argument.
 */

export interface ThrottleState {
  /** Zeitpunkte der Fehlversuche innerhalb des laufenden Fensters. */
  readonly failures: readonly number[];
  /** Anzahl aller Fehlversuche seit dem Start. Wird nie zurückgesetzt. */
  readonly totalFailures: number;
  /** Zeitpunkt des letzten Fehlversuchs, `null` wenn es keinen gab. */
  readonly lastFailureAt: number | null;
}

export interface ThrottleConfig {
  readonly windowMs: number;
  readonly threshold: number;
  readonly maxDelayMs: number;
}

export interface ThrottleDecision {
  readonly state: ThrottleState;
  /**
   * Wartezeit, mit der die **fehlgeschlagene** Antwort verzögert wird.
   *
   * Sie hängt allein an der Anzahl der Fehlversuche, nicht daran, warum der
   * Nachweis scheiterte. Damit ist sie kein Zeitkanal auf das Token.
   *
   * Nach oben gedeckelt: Eine unbegrenzt wachsende Verzögerung wäre eine
   * Selbstlähmung — ein Angreifer könnte mit ein paar Anfragen alle
   * Verbindungen des Dienstes binden.
   */
  readonly delayMs: number;
  /** Wahr, sobald die Schwelle im Fenster überschritten ist. */
  readonly alarm: boolean;
}

export const EMPTY_THROTTLE: ThrottleState = Object.freeze({
  failures: Object.freeze([]),
  totalFailures: 0,
  lastFailureAt: null,
});

export function recordFailure(
  state: ThrottleState,
  now: number,
  config: ThrottleConfig,
): ThrottleDecision {
  const cutoff = now - config.windowMs;
  const failures = [...state.failures.filter((at) => at > cutoff), now];
  const next: ThrottleState = {
    failures,
    totalFailures: state.totalFailures + 1,
    lastFailureAt: now,
  };

  const over = failures.length - config.threshold;
  if (over <= 0) {
    return { state: next, delayMs: 0, alarm: false };
  }

  // Ansteigend, aber gedeckelt: 100 ms je Überschreitung.
  const delayMs = Math.min(over * 100, config.maxDelayMs);
  return { state: next, delayMs, alarm: true };
}

/** Erfolgreicher Nachweis. Leert das Fenster, behält aber die Gesamtzahl. */
export function recordSuccess(state: ThrottleState): ThrottleState {
  return {
    failures: Object.freeze([]),
    totalFailures: state.totalFailures,
    lastFailureAt: state.lastFailureAt,
  };
}
