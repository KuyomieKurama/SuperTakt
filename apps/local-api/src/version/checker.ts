/**
 * Takt — die Versionsprüfung läuft **nach der Uhr**, nicht auf Zuruf
 * (E-069, A-V-10, A-V-11, A-V-12, A-18.2, A-18.11).
 *
 * ===========================================================================
 * Warum der naheliegende Entwurf ausgeschlossen ist
 * ===========================================================================
 *
 * Er wäre: Die Oberfläche fragt eine Route, die Route fragt GitHub. Zwei Zeilen
 * weniger — und ein Weg, auf dem ein **fremder** Prozess Takt zum Senden bringt.
 *
 * Der Dienst ist für jeden Prozess auf diesem Rechner erreichbar (R-02, VG-1).
 * Ein Prozess mit dem Sitzungsgeheimnis — und ein Prozess im Benutzerkonto kommt
 * an eine Datei, die die Hülle gelesen hat — könnte die Route in einer Schleife
 * aufrufen. Drei Folgen, alle unerwünscht: Takt wird zum Anfragegenerator; das
 * Lebenszeichen aus R-19 Punkt 3 wird von einem Dritten getaktet statt von
 * Takt; und die 60 Anfragen je Stunde und Quelladresse, die GitHub nicht
 * angemeldeten Aufrufern zugesteht, sind in Sekunden verbraucht.
 *
 * Deshalb: **Der Dienst prüft von sich aus.** Das Ergebnis liegt hier im
 * Arbeitsspeicher. Die Route gibt genau dieses Ergebnis heraus und löst **nie**
 * eine Anfrage aus — auch nicht, wenn noch keines vorliegt; dann lautet die
 * Antwort „noch nichts geprüft", und das ist eine gültige Antwort und kein
 * Fehler.
 *
 * ===========================================================================
 * Der Takt, und warum er nach einem Fehlschlag stehen bleibt
 * ===========================================================================
 *
 * Eine Anfrage je Start, danach höchstens eine je 24 Stunden, mit einem harten
 * Boden von 60 Minuten zwischen zwei Anfragen desselben Laufs (A-V-11). Nach
 * einem Fehlschlag wird der Zeitgeber **nicht** neu gestellt: „kein
 * wiederholtes Nachfragen im selben Lauf" steht wörtlich in A-18.11. Das ist
 * strenger, als man es von selbst bauen würde, und es ist die Anforderung —
 * ein Wiederholungsversuch gegen eine erschöpfte Anfragebegrenzung (T-136-5)
 * ist ohnehin genau die Antwort, die das Problem vergrößert.
 *
 * ===========================================================================
 * Warum die erste Anfrage nicht in derselben Millisekunde steht
 * ===========================================================================
 *
 * `START_DELAY_MS` schiebt sie um wenige Sekunden hinter das Hochfahren. Zwei
 * Gründe, und der zweite ist der wichtigere:
 *
 *  1. Der Start ist der volle Augenblick: Migration, Rechteprüfung, Aufräumen
 *    liegengebliebener Exportdateien, Aufgabenbereich. Eine ausgehende
 *    Verbindung dazwischen konkurriert um dieselbe Ereignisschleife.
 *  2. Ein Dienst, der gleich wieder endet — ein Prüflauf, eine Messung, ein
 *    abgebrochener Start —, sendet damit **gar nichts**. Jede Anfrage ist ein
 *    Lebenszeichen (R-19 Punkt 3), und ein Lauf, der keine Sitzung war, soll
 *    keines abgeben. Der Zeitgeber ist `unref()`t; endet der Prozess vorher,
 *    verfällt er, statt gefahren zu werden.
 *
 * „Beim Start" (A-18.2) bleibt damit gewahrt: Es ist dieselbe Startfolge, nur
 * nicht ihr erster Handgriff.
 *
 * ===========================================================================
 * Anhalten
 * ===========================================================================
 *
 * Zeitgeber `unref()`t, laufender Aufruf an einem `AbortController`, den
 * `stop()` auslöst (A-V-12). Sonst hielte ein Netzaufruf, der auf eine Antwort
 * wartet, die Ereignisschleife über die Abschaltfrist hinaus — genau der Weg zu
 * einem verwaisten Sidecar (17.2, B-1.6 Punkt 3).
 */

import type { Logger } from '../logger.ts';
import { createGithubReleaseSource, type ReleaseLookupFailure, type ReleaseSourcePort } from './source.ts';

/** Abstand zwischen zwei Anfragen im Regelfall (A-V-11). */
export const VERSION_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1_000;

/**
 * Harter Boden zwischen zwei ausgehenden Anfragen desselben Laufs (A-V-11).
 *
 * Er schützt gegen einen Zeitgeber, der aus irgendeinem Grund öfter feuert —
 * eine zurückgestellte Systemuhr, ein Ruhezustand, ein künftiger zweiter
 * Auslöser, an den heute niemand denkt. Der Takt oben ist die Absicht, dieser
 * Wert ist die Zusage.
 */
export const VERSION_CHECK_MIN_INTERVAL_MS = 60 * 60 * 1_000;

/** Abstand der ersten Anfrage zum Start (Begründung im Kopf dieser Datei). */
export const VERSION_CHECK_START_DELAY_MS = 10_000;

/**
 * Was der Dienst über die zuletzt veröffentlichte Fassung weiß.
 *
 * Zwei Zustände, nie leer, nie mehrdeutig. `unknown` ist ausdrücklich **kein**
 * Fehlerzustand: „noch nichts geprüft", „nicht erreichbar", „unerwartete
 * Antwort" und „keine Veröffentlichung" sehen von außen gleich aus, und genau
 * das verlangt A-18.11 — kein Hinweis, keine Fehlerfläche. Der Grund steht im
 * Protokoll und geht **nicht** über die Leitung.
 *
 * Was hier **nicht** steht (A-V-14): die installierte Fassung (sie liegt in der
 * Hülle, E-069), ein Verweis, eine Fassungsbeschreibung, ein Name, ein
 * Zeitpunkt. Aus der Antwort von GitHub verlässt genau eine geprüfte
 * Fassungsbezeichnung den Dienst.
 */
export type VersionCheckState =
  | { readonly state: 'unknown' }
  | { readonly state: 'known'; readonly latestVersion: string };

export interface VersionChecker {
  /** Das zuletzt ermittelte Ergebnis. Löst **nie** eine Anfrage aus (A-V-10). */
  current(): VersionCheckState;
  /** Startet den Takt. Ohne diesen Aufruf geht keine einzige Anfrage hinaus. */
  start(): void;
  /** Bricht einen laufenden Aufruf ab und räumt den Zeitgeber weg (A-V-12). */
  stop(): void;
}

export interface VersionCheckerOptions {
  readonly logger: Logger;
  /** Die Uhr als Port, damit der Boden ohne Zeitmanipulation prüfbar ist. */
  readonly now: () => Date;
  /**
   * Woher die Fassung kommt. Ohne Angabe: die feste Adresse (A-V-1).
   *
   * Der Prüflauf setzt hier seine eigene Abholfunktion ein — die Naht aus
   * E-066 Punkt 1. Sie liegt **im Prozess** und ist von außen nicht
   * erreichbar.
   */
  readonly source?: ReleaseSourcePort;
  readonly startDelayMs?: number;
  readonly intervalMs?: number;
  readonly minIntervalMs?: number;
}

/**
 * Baut den Prüfer. **Er tut nichts, bis `start()` gerufen wird.**
 *
 * Das ist die Eigenschaft, an der die Nachweispfade und die Einheitentests
 * hängen: `compose()` baut den Dienst, und dabei geht keine Verbindung nach
 * außen. Wer eine Anfrage will, muss sie ausdrücklich anstoßen — und das tut
 * genau eine Stelle, nämlich `main.ts`.
 */
export function createVersionChecker(options: VersionCheckerOptions): VersionChecker {
  const source = options.source ?? createGithubReleaseSource();
  const startDelayMs = options.startDelayMs ?? VERSION_CHECK_START_DELAY_MS;
  const intervalMs = options.intervalMs ?? VERSION_CHECK_INTERVAL_MS;
  const minIntervalMs = options.minIntervalMs ?? VERSION_CHECK_MIN_INTERVAL_MS;

  let state: VersionCheckState = { state: 'unknown' };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let stopped = false;
  let lastRequestAt: number | null = null;
  const control = new AbortController();

  function schedule(delayMs: number): void {
    if (stopped) return;
    if (timer !== null) clearTimeout(timer);
    // `unref()`: Eine anstehende Prüfung hält die Ereignisschleife nicht am
    // Leben. Ist der Dienst fertig, endet er, ohne auf sie zu warten.
    timer = setTimeout(() => {
      timer = null;
      void run();
    }, delayMs);
    timer.unref();
  }

  async function run(): Promise<void> {
    if (stopped || inFlight) return;

    // Der harte Boden. Er ist kein zweites Mal derselbe Takt: Er greift auch
    // dann, wenn der Zeitgeber aus einem Grund früher feuert, den hier niemand
    // vorhergesehen hat.
    const elapsed = lastRequestAt === null ? Infinity : options.now().getTime() - lastRequestAt;
    if (elapsed < minIntervalMs) {
      schedule(minIntervalMs - elapsed);
      return;
    }

    inFlight = true;
    lastRequestAt = options.now().getTime();
    try {
      const lookup = await source.latest(control.signal);
      if (stopped) return;

      if (lookup.ok) {
        state = { state: 'known', latestVersion: lookup.version };
        schedule(intervalMs);
        return;
      }

      // Ein Fehlschlag ist still: kein Hinweis, keine Fehlerfläche, **kein
      // zweiter Versuch im selben Lauf** (A-18.11). Der Zeitgeber bleibt
      // stehen; die Oberfläche sieht weiterhin „noch nichts geprüft".
      if (lookup.reason !== 'aborted') {
        report(options.logger, lookup.reason, lookup.statusCode);
      }
    } catch {
      /*
       * Der Port sagt zu, nicht zu werfen. Diese Klammer ist der Boden
       * darunter: Ein Wurf aus einer künftigen Abholfunktion soll die
       * Versionsprüfung beenden und nicht den Dienst. Es wird ausdrücklich
       * **nichts** aus dem Wurf gelesen — kein `message`, kein Stapel; die
       * Zeile im Protokoll trägt denselben geschlossenen Schlüsselvorrat wie
       * jeder andere Fehlschlag.
       */
      if (!stopped) report(options.logger, 'unreachable');
    } finally {
      inFlight = false;
    }
  }

  return {
    current: () => state,

    start(): void {
      if (stopped) return;
      schedule(startDelayMs);
    },

    stop(): void {
      stopped = true;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      // Bricht einen laufenden `fetch` samt Lesen des Rumpfes ab. Ohne ihn
      // hielte eine Antwort, auf die noch gewartet wird, das Anhalten auf.
      control.abort();
    },
  };
}

/**
 * Der Satz für den Menschen und der Schlüssel für den, der die Zeile später
 * auswertet — dieselbe Bauart wie die Startabbrüche aus T-132.
 *
 * Rein und ohne laufenden Dienst prüfbar: ein Schlüssel herein, ein Satz und
 * ein Grund heraus. In keiner der beiden Hälften steht ein Pfad, ein
 * Geheimnis, eine Adresse oder eine fremde Zeichenkette; alle Texte sind
 * Konstanten, und der Grund ist ein Schlüssel aus einem geschlossenen Vorrat,
 * höchstens ergänzt um eine Zahl (A-V-20).
 */
export function describeVersionCheckFailure(
  reason: ReleaseLookupFailure,
  statusCode?: number,
): { readonly sentence: string; readonly key: string } {
  switch (reason) {
    case 'timeout':
      return {
        sentence:
          'Die Versionsprüfung hat innerhalb der Frist keine Antwort bekommen. Takt läuft unverändert weiter.',
        key: 'version_check_timeout',
      };
    case 'redirect':
      return {
        sentence:
          'Die Versionsprüfung wurde auf eine andere Adresse verwiesen. Takt folgt dem nicht und läuft unverändert weiter.',
        key: 'version_check_redirect',
      };
    case 'status':
      return {
        sentence:
          'Die Versionsprüfung hat eine unerwartete Antwort bekommen. Takt läuft unverändert weiter.',
        key: isHttpStatus(statusCode)
          ? `version_check_status code=${String(statusCode)}`
          : 'version_check_status',
      };
    case 'no_release':
      return {
        sentence: 'Es liegt keine veröffentlichte Fassung vor. Takt läuft unverändert weiter.',
        key: 'version_check_no_release',
      };
    case 'too_large':
      return {
        sentence:
          'Die Antwort der Versionsprüfung war größer als zulässig und wurde verworfen. Takt läuft unverändert weiter.',
        key: 'version_check_too_large',
      };
    case 'malformed':
      return {
        sentence:
          'Die Antwort der Versionsprüfung war nicht auswertbar. Takt läuft unverändert weiter.',
        key: 'version_check_malformed',
      };
    case 'aborted':
      return {
        sentence: 'Die Versionsprüfung wurde beim Anhalten des Dienstes abgebrochen.',
        key: 'version_check_aborted',
      };
    case 'unreachable':
    default:
      return {
        sentence: 'Die Versionsprüfung konnte GitHub nicht erreichen. Takt läuft unverändert weiter.',
        key: 'version_check_unreachable',
      };
  }
}

/**
 * Ein Statuscode und nichts sonst.
 *
 * Ganzzahlig und zwischen 100 und 599 — was das nicht erfüllt, kommt nicht in
 * die Protokollzeile. Damit kann aus diesem Feld weder ein Text noch eine
 * Länge werden, die jemand nicht erwartet hat.
 */
function isHttpStatus(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 599;
}

function report(logger: Logger, reason: ReleaseLookupFailure, statusCode?: number): void {
  const described = describeVersionCheckFailure(reason, statusCode);
  // `info` und nicht `warn`: Ein folgenloser Fehlschlag ist keine Störung des
  // Betriebs, und `proof:access` Abschnitt 0e misst, dass im Normalfall keine
  // Warnung erscheint.
  logger.lifecycle('info', described.sentence, described.key);
}
