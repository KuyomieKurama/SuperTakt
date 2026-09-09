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
  /** `office.js` hat `window.Office` nicht bereitgestellt. */
  | { readonly kind: 'office_js_unavailable' }
  /** `office.js` ist da, aber der Office-Wirt hat `onReady` nicht rechtzeitig beantwortet. */
  | { readonly kind: 'office_not_ready' };

/** Steht Office.js überhaupt zur Verfügung? */
export const hasOfficeHost = (): boolean =>
  typeof globalThis === 'object' &&
  'Office' in globalThis &&
  typeof (globalThis as { Office?: { onReady?: unknown } }).Office?.onReady === 'function';

/**
 * Wartet auf die Office-Initialisierung über die Callback-Form von `onReady`.
 *
 * Microsoft unterstützt Callback und Promise offiziell. Für den klassischen
 * Outlook-Client verwenden wir bewusst den Callback: Genau diese Form läuft
 * auch in der bereits eingesetzten SP-OutlookBridge zuverlässig, während die
 * Promise-Form in klassischem Outlook auf realen Installationen hängen bleiben
 * kann, obwohl `Office` und `Office.onReady` schon vorhanden sind.
 *
 * Der Rückgabewert von `Office.onReady(...)` wird daher absichtlich nicht
 * abgewartet. Entscheidend ist ausschließlich, dass der von Office aufgerufene
 * Callback eintrifft. Die Zeitgrenze bleibt als Notausgang bestehen.
 */
function waitForOfficeReady(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ready);
    };
    const timer = setTimeout(() => {
      finish(false);
    }, timeoutMs);

    try {
      void Office.onReady(() => {
        finish(true);
      });
    } catch {
      finish(false);
    }
  });
}

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
 * Die beiden Fehler vor dem eigentlichen Lesen bleiben absichtlich getrennt:
 * Fehlt `Office.onReady` vollständig, konnte `office.js` nicht bereitgestellt
 * werden. Existiert es, antwortet aber nicht rechtzeitig, ist Office.js geladen
 * und der Office-Wirt hängt bei der Initialisierung. Beides als „kein Outlook“
 * auszugeben war diagnostisch falsch — insbesondere dann, wenn der Benutzer den
 * Aufgabenbereich sichtbar in Outlook geöffnet hat.
 *
 * 15 Sekunden sind eine Fehlergrenze, kein Ladeziel. Der erste WebView2-Start
 * kann deutlich langsamer sein als ein warmer Start.
 */
export const readHost = async (timeoutMs = 15_000): Promise<HostState> => {
  if (!hasOfficeHost()) {
    return { kind: 'office_js_unavailable' };
  }

  const ready = await waitForOfficeReady(timeoutMs);

  if (!ready) {
    return { kind: 'office_not_ready' };
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
