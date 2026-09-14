/**
 * Takt — die einzige Datei, die `Office.*` anfasst.
 *
 * Alles, was der Aufgabenbereich sonst tut, arbeitet auf einfachen Werten.
 * Dadurch bleiben Erkennung, Duplikatabgleich und API-Aufrufe ohne Outlook
 * prüfbar.
 */

import type { AttachmentFact, MailCapabilities } from '../attachments/model.ts';
import type { AttachmentContentValue, CollectPorts } from '../attachments/collect.ts';
import type { MailAddress, RebuildFields } from '../attachments/eml.ts';
import { EMPTY_MAIL, type MailFacts } from './mail.ts';

/**
 * Der Zugang zu den Anhängen der geöffneten Nachricht (A-19.22 bis A-19.31).
 *
 * Er steht **hier** und nicht in `attachments/`, weil diese Datei die einzige
 * bleibt, die `Office.*` anfasst. Alles unter `attachments/` arbeitet auf
 * einfachen Werten und diesen Ports — deshalb sind Plan, Nachbau und
 * Sammellauf ohne laufendes Outlook prüfbar.
 */
export interface MailAttachmentAccess {
  readonly facts: readonly AttachmentFact[];
  readonly capabilities: MailCapabilities;
  readonly ports: CollectPorts;
}

export type HostState =
  /** Office ist bereit und eine E-Mail ist geöffnet. */
  | {
      readonly kind: 'ready';
      readonly mail: MailFacts;
      /** `null`, wenn Office kein Element hergibt — im Browser etwa. */
      readonly attachments: MailAttachmentAccess | null;
    }
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

/**
 * Der Nachrichtentext — **oder `null`, wenn Outlook ihn nicht hergegeben hat**
 * (T-310 Befund 3, A-19.22, A-19.31).
 *
 * Bis T-310 lieferte diese Funktion bei **jedem** Fehlschlag `''`. Der Wert
 * ging über {@link RebuildFields} in den Nachbau, und dessen Vorspann behauptet
 * wörtlich: „Sie enthält Absender, Empfänger, Betreff, Versanddatum und
 * Nachrichtentext." Eine nicht lesbare Nachricht ergab damit eine `.eml` ohne
 * Text, die sagte, sie habe welchen — in einem Vorgang, aus dem eine Rechnung
 * wird, eine falsche Auskunft über ein Beweisstück.
 *
 * `null` ist deshalb ein eigener Wert und nicht eine leere Zeichenkette: Eine
 * E-Mail **ohne** Text ist etwas anderes als eine, deren Text nicht zu
 * bekommen war. Das Erste ist eine Tatsache über die Nachricht, das Zweite ein
 * Ausfall — und nur das Zweite lehnt der Nachbau ab (`rebuild_rejected`).
 */
const readBody = (item: Office.MessageRead): Promise<string | null> =>
  new Promise((resolve) => {
    try {
      item.body.getAsync(Office.CoercionType.Text, (result) => {
        resolve(
          result.status === Office.AsyncResultStatus.Succeeded && typeof result.value === 'string'
            ? result.value
            : null,
        );
      });
    } catch {
      resolve(null);
    }
  });

/**
 * Die Fähigkeitsprüfung **zur Laufzeit** (A-A-94, A-19.31).
 *
 * Das Manifest fordert `Mailbox 1.1` und wird nicht angehoben. Stünde dort
 * 1.14 — die Fassung, die `getAsFileAsync` braucht —, verweigerte ein großer
 * Teil der Outlook-Fassungen die Installation, und dann gäbe es keinen
 * Aufgabenbereich, kein Todo und keinen Satz, der sagt, was fehlt. Der
 * Nachbau, der genau für diesen Fall gebaut ist, käme nie zum Zug.
 *
 * Ein Wirt ohne `Office.context.requirements` gilt als „kann es nicht".
 */
const supportsSet = (version: string): boolean => {
  try {
    return Office.context.requirements?.isSetSupported('Mailbox', version) === true;
  } catch {
    return false;
  }
};

const addressOf = (details: Office.EmailAddressDetails | undefined): MailAddress | null =>
  details === undefined
    ? null
    : { displayName: details.displayName ?? '', address: details.emailAddress ?? '' };

const addressList = (
  list: readonly Office.EmailAddressDetails[] | undefined,
): readonly MailAddress[] =>
  (list ?? []).map((entry) => ({
    displayName: entry.displayName ?? '',
    address: entry.emailAddress ?? '',
  }));

/** Eine Rückrufform von Office als Versprechen — Fehlschlag heißt Ablehnung. */
const promised = <T>(
  run: (callback: (result: Office.AsyncResult<T>) => void) => void,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    try {
      run((result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) resolve(result.value);
        else reject(new Error('Office hat den Aufruf nicht beantwortet.'));
      });
    } catch {
      reject(new Error('Office hat den Aufruf nicht angenommen.'));
    }
  });

/**
 * Die Anhänge der geöffneten Nachricht, als Tatsachen und als Ports.
 *
 * **Die Ports sind `null`, wenn die Fähigkeit fehlt** — und nicht eine
 * Funktion, die dann fehlschlägt. Ein Zweig, den es nicht gibt, kann nicht
 * still durchlaufen; das ist die Bauform gegen die stille Degradierung der
 * Vorlage (A-19.31).
 */
const readAttachmentAccess = (
  item: Office.MessageRead,
  body: string | null,
): MailAttachmentAccess => {
  const canReadAttachments =
    supportsSet('1.8') && typeof item.getAttachmentContentAsync === 'function';
  const canReadMessageFile = supportsSet('1.14') && typeof item.getAsFileAsync === 'function';

  const facts: readonly AttachmentFact[] = (item.attachments ?? []).map((entry) => ({
    id: entry.id,
    name: entry.name,
    size: entry.size,
    isInline: entry.isInline,
    attachmentType: entry.attachmentType,
  }));

  const rebuildFields = (): RebuildFields => ({
    subject: item.subject ?? '',
    from: addressOf(item.from ?? item.sender),
    to: addressList(item.to),
    cc: addressList(item.cc),
    sentAt: item.dateTimeCreated instanceof Date ? item.dateTimeCreated : null,
    body,
  });

  const ports: CollectPorts = {
    messageAsFile: canReadMessageFile
      ? () => promised<string>((callback) => item.getAsFileAsync?.(callback))
      : null,
    attachmentContent: canReadAttachments
      ? (id: string) =>
          promised<AttachmentContentValue>((callback) =>
            item.getAttachmentContentAsync?.(id, callback),
          )
      : null,
    rebuildFields,
  };

  return { facts, capabilities: { canReadAttachments, canReadMessageFile }, ports };
};

/**
 * Meldet einen Wechsel der geöffneten Nachricht (Entwurf 6.6, D-06, AK-09).
 *
 * Ohne diese Meldung liefe eine begonnene Übernahme auf der **alten**
 * Nachricht weiter, während das Formular schon die neue zeigt — und es
 * entstünde ein Todo, dessen Titel aus der einen und dessen Anhänge aus der
 * anderen E-Mail stammen. Das ist erst in SuperTakt sichtbar und dort nicht
 * mehr erklärbar.
 *
 * Das Ereignis gibt es seit `Mailbox 1.5` und nur an einem angehefteten
 * Aufgabenbereich. Fehlt es, wird nichts behauptet: Zurück kommt eine leere
 * Abmeldung, und der Aufgabenbereich verhält sich wie bisher.
 */
export const onItemChanged = (handler: () => void): (() => void) => {
  if (!hasOfficeHost()) return () => undefined;

  const mailbox = Office.context.mailbox;
  if (mailbox === undefined || typeof mailbox.addHandlerAsync !== 'function') {
    return () => undefined;
  }

  let live = true;
  try {
    mailbox.addHandlerAsync(Office.EventType.ItemChanged, () => {
      if (live) handler();
    });
  } catch {
    return () => undefined;
  }

  return () => {
    live = false;
  };
};

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

  /*
   * Für das **Formular** ist ein nicht gelesener Text dasselbe wie keiner: Die
   * Call-Nummern-Erkennung sucht dann nur im Betreff, und „Inhalt der E-Mail
   * übernehmen" trägt nichts ein. Keiner der beiden Fälle behauptet etwas.
   * Für den **Nachbau** ist der Unterschied entscheidend — siehe
   * {@link readBody} —, und dorthin geht der Wert unverändert.
   */
  const mail: MailFacts = {
    ...EMPTY_MAIL,
    subject: item.subject ?? '',
    body: body ?? '',
    senderName: item.from?.displayName ?? '',
    senderAddress: item.from?.emailAddress ?? '',
    receivedAt: item.dateTimeCreated instanceof Date ? item.dateTimeCreated.toISOString() : null,
  };

  return { kind: 'ready', mail, attachments: readAttachmentAccess(item, body) };
};
