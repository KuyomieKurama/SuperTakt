/**
 * Takt — die einzige Datei, die `Office.*` anfasst.
 *
 * Alles, was der Aufgabenbereich sonst tut, arbeitet auf `MailFacts` — einem
 * einfachen Wert. Diese Trennung ist der Grund, warum Erkennung der
 * Call-Nummer, Duplikatabgleich, API-Aufrufe und Tokenbehandlung ohne Outlook
 * prüfbar sind: Sie sehen Outlook nie.
 *
 * Was hier **nicht** passiert:
 *
 *  - Kein Schreiben in die E-Mail. Das Add-in liest (`ReadItem` im Manifest).
 *  - Kein `roamingSettings` (E-019, B-2.8). Der Typ ist in `office-js.d.ts`
 *    nicht einmal deklariert.
 *  - Kein HTML. `CoercionType.Text` liefert Nur-Text; HTML aus einer fremden
 *    E-Mail hat im Aufgabenbereich nichts zu suchen (B-12.1).
 */

import { EMPTY_MAIL, type MailFacts } from './mail.ts';

export type HostState =
  /** Office ist bereit und eine E-Mail ist geöffnet. */
  | { readonly kind: 'ready'; readonly mail: MailFacts }
  /** Office ist bereit, aber es ist kein Element geöffnet (Empty-Zustand in S-12). */
  | { readonly kind: 'no_item' }
  /**
   * Kein Office. Das ist der Fall im Browser während der Entwicklung und in
   * jedem Nachweislauf — er ist ausdrücklich vorgesehen und kein Fehler.
   */
  | { readonly kind: 'no_host' };

/** Steht Office.js überhaupt zur Verfügung? */
export const hasOfficeHost = (): boolean =>
  typeof globalThis === 'object' &&
  'Office' in globalThis &&
  typeof (globalThis as { Office?: { onReady?: unknown } }).Office?.onReady === 'function';

/**
 * Liest den Nur-Text der geöffneten E-Mail.
 *
 * `body.getAsync` ist rückrufbasiert; die Verpackung in ein Versprechen ist
 * die einzige Umformung. Ein Fehlschlag ergibt einen **leeren Text** und keinen
 * Wurf: Ohne den Text funktioniert das Add-in weiter — Betreff und Titel stehen
 * ohnehin, und die Call-Nummer lässt sich von Hand eintragen. Ein Wurf hier
 * risse dagegen den ganzen Aufgabenbereich mit.
 */
const readBody = (item: Office.MessageRead): Promise<string> =>
  new Promise((resolve) => {
    try {
      item.body.getAsync(Office.CoercionType.Text, (result) => {
        resolve(
          result.status === Office.AsyncResultStatus.Succeeded && typeof result.value === 'string'
            ? result.value
            : '',
        );
      });
    } catch {
      resolve('');
    }
  });

/**
 * Wartet auf Office und liest die geöffnete E-Mail.
 *
 * Der Aufruf hat eine eigene Zeitgrenze. `Office.onReady` löst in einem
 * Steuerelement, das nicht von Outlook geladen wurde, nie aus — dann bliebe der
 * Aufgabenbereich ohne diese Grenze für immer im Ladezustand, und der Benutzer
 * sähe einen Platzhalter statt einer Erklärung.
 */
export const readHost = async (timeoutMs = 5000): Promise<HostState> => {
  if (!hasOfficeHost()) {
    return { kind: 'no_host' };
  }

  const ready = await Promise.race([
    Office.onReady().then(() => true),
    new Promise<false>((resolve) => {
      setTimeout(() => {
        resolve(false);
      }, timeoutMs);
    }),
  ]);

  if (!ready) {
    return { kind: 'no_host' };
  }

  const item = Office.context.mailbox?.item;
  if (item === undefined) {
    return { kind: 'no_item' };
  }

  const body = await readBody(item);

  const mail: MailFacts = {
    ...EMPTY_MAIL,
    subject: item.subject ?? '',
    body,
    senderName: item.from?.displayName ?? '',
    senderAddress: item.from?.emailAddress ?? '',
    receivedAt: item.dateTimeCreated instanceof Date ? item.dateTimeCreated.toISOString() : null,
  };

  return { kind: 'ready', mail };
};
