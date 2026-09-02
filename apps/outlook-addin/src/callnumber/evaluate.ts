/**
 * Takt — Auswertung mit harter Zeitgrenze (B-4.1 Punkt 1).
 *
 * Der Kern des Gegenmittels und die Stelle, die ohne Outlook prüfbar sein muss.
 * Deshalb kennt diese Datei **keinen** Web Worker: Sie bekommt eine
 * `spawnChannel`-Funktion und arbeitet gegen die schmalste Schnittstelle, die
 * sowohl ein Browser-`Worker` als auch ein `node:worker_threads`-Worker
 * erfüllen kann. Der Nachweispfad setzt dort einen Node-Worker ein und weist
 * damit **denselben** Abbruchmechanismus nach, den das Add-in im Browser
 * benutzt.
 *
 * Der Ablauf ist bewusst „ein Worker je Auswertung":
 *
 *  1. Kanal öffnen und auf seine Bereitschaftsmeldung warten.
 *  2. **Danach** die Uhr starten und die Anfrage schicken.
 *  3. Antwort **oder** Zeitgrenze — was zuerst kommt.
 *  4. In **beiden** Fällen `terminate()`.
 *
 * Schritt 1 und 2 sind getrennt, damit die Zeitgrenze aus B-4.1 die
 * **Auswertung** misst und nicht den Start eines Workers — siehe
 * `STARTUP_TIMEOUT_MS`.
 *
 * Ein wiederverwendeter Worker wäre sparsamer und wäre falsch: Nach einem
 * Abbruch ist er fort, und ein Worker, der nach einer Zeitüberschreitung noch
 * rechnet, verbraucht bis zum Schließen von Outlook einen Kern. Die Kosten
 * einer Worker-Erzeugung fallen bei einer Auswertung je geöffneter E-Mail nicht
 * ins Gewicht.
 */

import type { EvaluateRequest, EvaluateResponse } from './protocol.ts';

/**
 * Das Wenigste, was ein Auswertungskanal können muss.
 *
 * `onMessage` und `onError` werden **einmal** gesetzt, nicht abonniert — der
 * Kanal lebt genau eine Auswertung lang.
 */
export interface EvaluationChannel {
  post(request: EvaluateRequest): void;
  onMessage(handler: (response: EvaluateResponse) => void): void;
  onError(handler: (message: string) => void): void;
  terminate(): void;
}

export type SpawnChannel = () => EvaluationChannel;

export type EvaluationOutcome =
  | { readonly kind: 'match'; readonly group: string | null }
  | { readonly kind: 'no_match' }
  /** Die Zeitgrenze ist abgelaufen; der Worker wurde beendet (B-4.1). */
  | { readonly kind: 'timeout' }
  /** Der Ausdruck war zur Laufzeit ungültig (B-4.2 Punkt 2). */
  | { readonly kind: 'invalid'; readonly message: string }
  /** Kein Worker verfügbar oder der Kanal ist gestorben. */
  | { readonly kind: 'unavailable'; readonly message: string };

export type Evaluator = (source: string, text: string) => Promise<EvaluationOutcome>;

/**
 * Zeitgrenze aus B-4.1 Punkt 1.
 *
 * 100 Millisekunden. Ein Muster, das für eine E-Mail länger braucht, ist keins,
 * das man beim Tippen bemerkt hätte — es ist eins, das exponentiell wächst. Die
 * Grenze ist großzügig: Ein gutartiger Ausdruck über 20 000 Zeichen liegt um
 * Größenordnungen darunter.
 */
export const EVALUATION_TIMEOUT_MS = 100;

/**
 * Wartezeit auf die Bereitschaft des Workers — **getrennt** von der Zeitgrenze
 * der Auswertung.
 *
 * Das Laden eines Moduls in einem frisch erzeugten Worker kann auf einem
 * ausgelasteten Rechner leicht über hundert Millisekunden dauern. Läge es in
 * derselben Frist, meldete das Add-in „Erkennung abgebrochen" für ein
 * einwandfreies Muster, und zwar bevorzugt dann, wenn der Rechner ohnehin
 * langsam ist. Der Fehler wäre selten, nicht reproduzierbar und würde den
 * Ausdruck des Benutzers verdächtigen.
 *
 * Diese Frist ist großzügig, weil sie **kein** Gegenmittel ist: Ein Worker, der
 * nie bereit wird, rechnet auch nichts. Das Gegenmittel aus B-4.1 ist die
 * Frist darunter, und die bleibt bei 100 Millisekunden.
 */
export const STARTUP_TIMEOUT_MS = 5_000;

/**
 * Eingabelänge aus B-4.1 Punkt 2.
 *
 * Signaturen, Zitatverläufe und HTML-Ballast tragen nichts zur Call-Nummer bei
 * und vervielfachen die Laufzeit. Zuerst wird ohnehin der Betreff geprüft.
 */
export const MAX_SCANNED_CHARACTERS = 20_000;

export interface TimedEvaluatorOptions {
  readonly spawn: SpawnChannel;
  readonly timeoutMs?: number;
  readonly startupTimeoutMs?: number;
  /** Einhängbare Uhr für den Nachweispfad. Vorgabe ist `setTimeout`. */
  readonly schedule?: (callback: () => void, ms: number) => { cancel: () => void };
}

const defaultSchedule = (callback: () => void, ms: number): { cancel: () => void } => {
  const handle = setTimeout(callback, ms);
  return {
    cancel: () => {
      clearTimeout(handle);
    },
  };
};

export const createTimedEvaluator = (options: TimedEvaluatorOptions): Evaluator => {
  const timeoutMs = options.timeoutMs ?? EVALUATION_TIMEOUT_MS;
  const startupTimeoutMs = options.startupTimeoutMs ?? STARTUP_TIMEOUT_MS;
  const schedule = options.schedule ?? defaultSchedule;
  let nextId = 0;

  return (source, text) =>
    new Promise<EvaluationOutcome>((resolve) => {
      nextId += 1;
      const id = nextId;

      let channel: EvaluationChannel;
      try {
        channel = options.spawn();
      } catch (error) {
        resolve({
          kind: 'unavailable',
          message: error instanceof Error ? error.message : 'Kein Auswertungskanal verfügbar.',
        });
        return;
      }

      let settled = false;
      let timer = { cancel: () => undefined as void };

      const finish = (outcome: EvaluationOutcome): void => {
        if (settled) return;
        settled = true;
        timer.cancel();
        // Auch im Erfolgsfall beenden. Ein Worker, den niemand mehr braucht,
        // ist ein Worker, der noch läuft.
        try {
          channel.terminate();
        } catch {
          // Ein Kanal, der sich nicht beenden lässt, ist bereits fort.
        }
        resolve(outcome);
      };

      // Erste Frist: Bereitschaft. Sie ist keine Sicherheitsmaßnahme, sondern
      // verhindert, dass ein toter Kanal ewig offen bleibt.
      timer = schedule(() => {
        finish({
          kind: 'unavailable',
          message: 'Der Auswertungsfaden ist nicht rechtzeitig bereit geworden.',
        });
      }, startupTimeoutMs);

      channel.onMessage((response) => {
        if (response.kind === 'ready') {
          // **Hier** beginnt die Zeitgrenze aus B-4.1 — und nicht früher.
          timer.cancel();
          timer = schedule(() => {
            finish({ kind: 'timeout' });
          }, timeoutMs);

          try {
            // B-4.1 Punkt 2: Der Text wird vor dem Senden gekürzt, nicht erst
            // im Worker. Was nicht hinübergeht, kann drüben auch nicht
            // durchsucht werden.
            channel.post({ id, source, text: text.slice(0, MAX_SCANNED_CHARACTERS) });
          } catch (error) {
            finish({
              kind: 'unavailable',
              message:
                error instanceof Error ? error.message : 'Der Auswertungskanal nimmt nichts an.',
            });
          }
          return;
        }

        if (response.id !== id) return;
        if (response.kind === 'invalid') {
          finish({ kind: 'invalid', message: response.message });
          return;
        }
        if (response.kind === 'no_match') {
          finish({ kind: 'no_match' });
          return;
        }
        finish({ kind: 'match', group: response.group });
      });

      channel.onError((message) => {
        finish({ kind: 'unavailable', message });
      });
    });
};
