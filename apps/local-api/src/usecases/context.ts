/**
 * Takt — was die Anwendungsfälle brauchen (ecc:hexagonal-architecture).
 *
 * ---------------------------------------------------------------------------
 * Wo die Anwendungsfälle liegen und warum
 * ---------------------------------------------------------------------------
 *
 * Nach dem Schnitt aus architektur.md 1.1 gibt es drei Ringe: die Domäne
 * (`packages/domain`, kennt weder HTTP noch SQL), die Ports und ihre Adapter
 * (`packages/storage`), und den eingehenden Adapter (`apps/local-api`). Die
 * Anwendungsfälle sitzen zwischen Domäne und eingehendem Adapter: Sie
 * orchestrieren, entscheiden aber nichts Fachliches selbst.
 *
 * Sie liegen hier und nicht in einem eigenen Paket, weil ein neues Paket im
 * Arbeitsbereich registriert werden muss und der Dienst der einzige Aufrufer
 * ist. Die Grenze wird stattdessen im Quelltext gehalten: **Kein Modul unter
 * `usecases/` bindet `hono` ein.** Ein Anwendungsfall bekommt Werte und liefert
 * Werte; er kennt weder Anfrage noch Antwort noch Statuscode. Wer das ändert,
 * sieht es an einem neuen Import in einem Verzeichnis, in dem sonst keiner
 * steht.
 *
 * Umgekehrt gilt: Die Routen enthalten keine Fachregel. Sie lesen die Anfrage,
 * prüfen ihre Gestalt, rufen einen Anwendungsfall und übersetzen dessen
 * Ergebnis in einen Statuscode.
 */

import type {
  AttachmentBlobPort,
  ClockPort,
  DirectoryInsightPort,
  FilePort,
  SystemPort,
  TransactionPort,
  UnitOfWork,
} from '@takt/storage';
import type { Result, TaktError, Timestamp } from '@takt/domain';

import type { ExportFaultInjection } from './export.ts';

/**
 * Der gemeinsame Zusammenhang aller Anwendungsfälle.
 *
 * Er wird im Zusammenbau einmal gebildet (architektur.md 1.3). Es gibt keinen
 * Dienstsucher und keine globale Variable: Wer wissen will, was ein
 * Anwendungsfall anspricht, liest seine Signatur.
 */
export interface AppContext {
  readonly transactions: TransactionPort;
  readonly clock: ClockPort;
  readonly files: FilePort;
  /**
   * Was für ein Ordner der Exportordner ist (T-039).
   *
   * Getrennt von `files`, weil es eine andere Frage ist: `files` entscheidet, ob
   * geschrieben werden darf, `directories` sagt, worin geschrieben würde. Der
   * Befund hängt nicht am Ausgang der Prüfung — ein Systemverzeichnis bleibt
   * eines, ob es beschreibbar ist oder nicht.
   */
  readonly directories: DirectoryInsightPort;
  /**
   * Die **Bytes** eines Bildanhangs (E-071 Punkt 2 und 3).
   *
   * Getrennt von `files`, weil es der entgegengesetzte Ordner ist: `files`
   * schreibt in einen Ordner, den der **Benutzer** einstellt, und seine ganze
   * Aufgabe ist, nicht daneben zu schreiben (R-11). Dieser Port schreibt in
   * einen, den **niemand** einstellen kann — das Anwendungsdatenverzeichnis,
   * neben dem Bestand, unter denselben Rechten (E-018, A-A-17). Zwei Ordner
   * mit zwei entgegengesetzten Regeln in einem Port wären die Gelegenheit, den
   * einen für den anderen zu halten.
   */
  readonly attachmentBlobs: AttachmentBlobPort;
  /**
   * Der Windows-Benutzername (E-010, E-042).
   *
   * Er kommt über die zweite `stdin`-Zeile von der Hülle und wird von hier bis
   * in `export_run.windows_user` und `export_audit.actor` durchgereicht. Auf
   * dem ganzen Weg gibt es **keine** Stelle, an der ein Aufrufer ihn setzen
   * könnte: Kein Anwendungsfall nimmt ihn als Argument entgegen, keine Route
   * liest ihn aus einem Rumpf. Das ist die Umsetzung von B-8.1 — wer Takt mit
   * gesetzter Umgebungsvariable startet, ändert nichts an dem Namen, der in
   * der Abrechnung steht.
   */
  readonly system: SystemPort;
  /**
   * Für den Prüfpfad: ein Haken mitten im Exportlauf (siehe `export.ts`).
   *
   * Im Betrieb `undefined`. Er wird ausschließlich im Zusammenbau gesetzt und
   * ist über keine Anfrage, keinen Kopfzeilenwert und keine Umgebungsvariable
   * erreichbar. Er steht im Erzeugnis, weil sich A-8.8 sonst nicht
   * **nachweisen** lässt, sondern nur behaupten.
   */
  readonly exportFaults?: ExportFaultInjection;
}

/** Ergebnis eines Anwendungsfalls. Fachliche Fehlschläge sind Werte, keine Würfe. */
export type UseCaseResult<T> = Result<T, TaktError>;

/** Kurzform für „lies etwas in einer Transaktion". */
export function read<T>(context: AppContext, work: (unit: UnitOfWork) => Promise<T>): Promise<T> {
  return context.transactions.inTransaction(work);
}

/** Der Zeitpunkt, mit dem ein Anwendungsfall arbeitet. Einmal gelesen, überall derselbe. */
export function now(context: AppContext): Timestamp {
  return context.clock.now();
}
