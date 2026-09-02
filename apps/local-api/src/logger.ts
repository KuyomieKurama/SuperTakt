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

export interface Logger {
  request(entry: RequestLogEntry): void;
  lifecycle(level: LogLevel, message: string): void;
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

    lifecycle(level: LogLevel, message: string): void {
      emit(level, { message });
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
