/**
 * Takt — die Office.js-Fläche, die dieses Add-in wirklich benutzt.
 *
 * Handgeschrieben und bewusst klein statt `@types/office-js`. Zwei Gründe:
 *
 *  1. **B-10.7, Abhängigkeitsdisziplin.** Was die Laufzeitumgebung liefert,
 *     wird nicht durch ein Paket ersetzt. `@types/office-js` beschreibt die
 *     gesamte Office-Fläche über alle Anwendungen; gebraucht werden sechs
 *     Namen.
 *  2. **Diese Datei ist zugleich die Antwort auf die Frage „was fasst das
 *     Add-in in Outlook an?".** Sie ist vollständig: Was hier nicht steht, kann
 *     der Quelltext nicht aufrufen, ohne dass `tsc` es meldet. Das ist bei
 *     einer Sicherheitsprüfung mehr wert als Vollständigkeit gegenüber
 *     Microsoft.
 *
 * Belegt gegen die Dokumentation von Microsoft Learn (über Context7 abgerufen,
 * Stand dieser Aufgabe), Seiten:
 *
 *  - `docs/outlook/get-or-set-the-subject.md` — `Office.context.mailbox.item.subject`
 *    im Lesemodus unmittelbar am Element.
 *  - `docs/quickstarts/outlook-quickstart-vs.md` — `Office.onReady`,
 *    `item.itemId`, `item.subject`, `item.internetMessageId`,
 *    `item.from.displayName` / `item.from.emailAddress`.
 *  - `docs/outlook/outlook-on-send-addins.md` — `item.body.getAsync(coercionType,
 *    options, callback)` und die Gestalt des `AsyncResult`.
 *  - `docs/outlook/contextless.md` — `info.host === Office.HostType.Outlook`.
 *
 * **`Office.context.roamingSettings` steht hier absichtlich nicht.** Ein Typ,
 * den es nicht gibt, lässt sich nicht versehentlich benutzen (B-2.8, E-019).
 * Die Begründung steht in `src/settings/store.ts`.
 */

declare namespace Office {
  // Als Wert **und** Typ deklariert, nicht als `const enum`. Ein
  // umgebungsdeklariertes `const enum` laesst sich mit `verbatimModuleSyntax`
  // nicht lesen, und der Schalter steht in `tsconfig.base.json` aus gutem
  // Grund. Office.js liefert diese Werte zur Laufzeit als schlichte
  // Zeichenketten — genau so stehen sie hier.
  type HostType = 'Outlook';
  const HostType: { readonly Outlook: 'Outlook' };

  type CoercionType = 'text' | 'html';
  const CoercionType: { readonly Text: 'text'; readonly Html: 'html' };

  type AsyncResultStatus = 'succeeded' | 'failed';
  const AsyncResultStatus: { readonly Succeeded: 'succeeded'; readonly Failed: 'failed' };

  interface AsyncResult<T> {
    readonly status: AsyncResultStatus;
    readonly value: T;
    readonly error?: { readonly name: string; readonly message: string; readonly code: number };
  }

  interface OnReadyInfo {
    readonly host: HostType | null;
    readonly platform: string | null;
  }

  function onReady(callback?: (info: OnReadyInfo) => void): Promise<OnReadyInfo>;

  interface EmailAddressDetails {
    readonly displayName: string;
    readonly emailAddress: string;
  }

  interface Body {
    getAsync(
      coercionType: CoercionType,
      callback: (result: AsyncResult<string>) => void,
    ): void;
  }

  interface MessageRead {
    readonly itemId?: string;
    readonly itemType?: string;
    readonly subject?: string;
    readonly internetMessageId?: string;
    readonly from?: EmailAddressDetails;
    readonly dateTimeCreated?: Date;
    readonly body: Body;
  }

  interface Mailbox {
    readonly item?: MessageRead;
  }

  interface Context {
    readonly mailbox?: Mailbox;
  }

  const context: Context;
}
