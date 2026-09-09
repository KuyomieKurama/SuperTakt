/**
 * Takt — die Office.js-Fläche, die dieses Add-in wirklich benutzt.
 *
 * Handgeschrieben und bewusst klein statt `@types/office-js`: Diese Datei ist
 * zugleich die Antwort auf die Frage, welche Outlook-APIs das Add-in anfasst.
 */

declare namespace Office {
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

  interface UserProfile {
    readonly accountType?: string;
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
    readonly userProfile?: UserProfile;
    convertToRestId(itemId: string, restVersion: string): string;
  }

  interface Context {
    readonly mailbox?: Mailbox;
  }

  namespace MailboxEnums {
    const RestVersion: { readonly v2_0: 'v2.0' };
  }

  const context: Context;
}
