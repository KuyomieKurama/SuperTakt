/**
 * Takt — die einzige Datei, die `Office.*` anfasst.
 *
 * Alles, was der Aufgabenbereich sonst tut, arbeitet auf einfachen Werten.
 * Dadurch bleiben Erkennung, Duplikatabgleich und API-Aufrufe ohne Outlook
 * prüfbar.
 */

import { EMPTY_MAIL, type MailFacts } from './mail.ts';

export type HostState =
  /** Office ist bereit und eine E-Mail ist geöffnet. */
  | { readonly kind: 'ready'; readonly mail: MailFacts; readonly webLink: string | null }
  /** Office ist bereit, aber es ist kein Element geöffnet. */
  | { readonly kind: 'no_item' }
  /** `office.js` hat `window.Office` nicht bereitgestellt. */
  | { readonly kind: 'office_js_unavailable' }
  /** `office.js` ist da, aber der Office-Wirt hat `onReady` nicht rechtzeitig beantwortet. */
  | { readonly kind: 'office_not_ready' };

export const hasOfficeHost = (): boolean =>
  typeof globalThis === 'object' &&
  'Office' in globalThis &&
  typeof (globalThis as { Office?: { onReady?: unknown } }).Office?.onReady === 'function';

/**
 * Wartet auf die Office-Initialisierung über die Callback-Form von `onReady`.
 * Diese Form ist im klassischen Outlook zuverlässiger als das Abwarten des
 * zurückgegebenen Promise und entspricht der eingesetzten SP-OutlookBridge.
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

/** Outlook-Web-Link wie in SP-OutlookBridge. */
function outlookWebLink(item: Office.MessageRead): string | null {
  const mailbox = Office.context.mailbox;
  const itemId = item.itemId;
  if (mailbox === undefined || itemId === undefined || itemId.length === 0) return null;

  try {
    const restId = mailbox.convertToRestId(itemId, Office.MailboxEnums.RestVersion.v2_0);
    if (restId.length === 0) return null;
    const accountType = (mailbox.userProfile?.accountType ?? '').toLowerCase();
    const base = accountType.includes('consumer')
      ? 'https://outlook.live.com/mail/0/deeplink/read/'
      : 'https://outlook.office.com/mail/deeplink/read/';
    return `${base}${encodeURIComponent(restId)}`;
  } catch {
    // Der Link ist Zusatznutzen. Eine E-Mail ohne konvertierbare ID bleibt
    // vollständig lesbar; nur „an vorhandenes Todo anhängen“ ist dann nicht
    // möglich.
    return null;
  }
}

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

  return { kind: 'ready', mail, webLink: outlookWebLink(item) };
};
