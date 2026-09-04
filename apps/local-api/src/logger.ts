/**
 * Takt — Protokollausgabe des lokalen Dienstes (B-2.4, B-12.2).
 *
 * ## Warum das keine gewöhnliche Ausgabefunktion ist
 *
 * Ein Dienst, der Anfragen protokolliert, protokolliert Notizen, Call-Nummern
 * und womöglich Tokens. Die Protokolldatei hat selten die Rechte der Datenbank
 * und liegt oft länger. Deshalb ist die Ausgabe hier **strukturell** begrenzt,
 * nicht durch Disziplin:
 *
 * - `logRequest` nimmt ein festes Feldbündel entgegen. Es gibt keinen
 *   Parameter, in den ein Kopfzeilenwert, ein Rumpf oder ein Ausnahmeobjekt
 *   hineinpasst. `console.log(req)` und `console.log(err)` kommen im ganzen
 *   Dienst nicht vor.
 * - Der Pfad wird **ohne Abfrageparameter** ausgegeben. Eine Adresse mit
 *   `?token=…` würde das Geheimnis sonst genau dorthin tragen, wovor B-2.4
 *   warnt.
 * - Jede Zeile läuft vor der Ausgabe durch `redactSecrets`. Das ist die letzte
 *   Linie, nicht die erste.
 *
 * ## Wohin
 *
 * Nach `stderr`. `stdin` gehört dem Startgeheimnis, `stdout` bleibt frei für
 * einen späteren Nachrichtenkanal zur Hülle. Eine eigene Protokolldatei mit
 * Umlauf und den Rechten aus B-7.2 ist noch nicht gebaut — sie gehört zur
 * Betriebsschicht des Dienstes und ist im Bericht zu T-011 als offener Punkt
 * benannt.
 */

import { redactSecrets } from './access/token.ts';

export type LogLevel = 'info' | 'warn' | 'error';

/** Die einzigen Felder, die je einer Anfrage ausgegeben werden. */
export interface RequestLogEntry {
  readonly method: string;
  /** Pfad **ohne** Abfrageparameter. */
  readonly path: string;
  readonly status: number;
  readonly durationMs: number;
  /**
   * Warum die Anfrage so ausging. Ein technischer Schlüssel aus dem
   * Fehlerkatalog, nie ein Wert aus der Anfrage.
   */
  readonly outcome: string;
}

/**
 * Der Zeichenvorrat eines Grundes (T-132).
 *
 * Ein Schlüssel aus Kleinbuchstaben, gefolgt von höchstens acht Paaren
 * `name=wert`. Kein Schrägstrich, kein Rückstrich, kein Punkt, kein Doppelpunkt,
 * kein Großbuchstabe, kein Zeichen außerhalb von ASCII.
 *
 * **Das ist die Zusage und nicht die Sorgfalt.** Ein Pfad enthält zwangsläufig
 * einen Trenner, ein Windows-Benutzername in aller Regel einen Großbuchstaben,
 * ein Inhalt des Bestands Leerzeichen und Satzzeichen. Was hier durchkommt,
 * kann keines von beidem sein — auch dann nicht, wenn eine spätere Aufrufstelle
 * unbedacht etwas übergibt. Was nicht durchkommt, wird zu `unclassified`: eine
 * Zeile, die sagt „hier war ein Grund, und er hatte die falsche Gestalt", ist
 * besser als eine, die ihn ausschreibt (B-2.4).
 */
const REASON_SHAPE = /^[a-z][a-z0-9_]{0,47}(?: [a-z][a-z0-9_]{0,31}=[a-z0-9_]{1,32}){0,8}$/;

/** Was statt eines Grundes in falscher Gestalt erscheint. */
export const UNCLASSIFIED_REASON = 'unclassified';

export interface Logger {
  request(entry: RequestLogEntry): void;
  /**
   * Eine Zeile über den Lebenslauf des Dienstes.
   *
   * `message` ist der deutsche Satz für den Menschen: was los ist und was zu
   * tun ist. `reason` ist der **technische Grund** für den, der die Zeile
   * später auswertet — dieselbe Rolle wie `outcome` bei einer Anfrage: ein
   * Schlüssel aus einem geschlossenen Vorrat, ergänzt um Zahlen, nie ein Wert
   * aus der Umgebung.
   */
  lifecycle(level: LogLevel, message: string, reason?: string): void;
}

export function createLogger(write: (line: string) => void = defaultWrite): Logger {
  function emit(level: LogLevel, fields: Record<string, string | number>): void {
    const line = JSON.stringify({ ts: new Date().toISOString(), level, ...fields });
    write(redactSecrets(line));
  }

  return {
    request(entry: RequestLogEntry): void {
      emit(entry.status >= 500 ? 'error' : entry.status >= 400 ? 'warn' : 'info', {
        method: entry.method,
        path: stripQuery(entry.path),
        status: entry.status,
        durationMs: Math.round(entry.durationMs),
        outcome: entry.outcome,
      });
    },

    lifecycle(level: LogLevel, message: string, reason?: string): void {
      if (reason === undefined) {
        emit(level, { message });
        return;
      }
      emit(level, { message, reason: REASON_SHAPE.test(reason) ? reason : UNCLASSIFIED_REASON });
    },
  };
}

/**
 * Schneidet Abfrage und Bruchstück ab.
 *
 * Doppelt gemoppelt — der Aufrufer übergibt bereits `c.req.path` — und genau so
 * gewollt: Wer hier künftig `c.req.url` einsetzt, verliert dadurch nichts.
 */
function stripQuery(path: string): string {
  const cut = path.search(/[?#]/);
  return cut === -1 ? path : path.slice(0, cut);
}

function defaultWrite(line: string): void {
  process.stderr.write(`${line}\n`);
}
