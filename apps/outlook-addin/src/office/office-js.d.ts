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

  /**
   * Ein Anhang, wie Outlook ihn ankündigt — `Mailbox 1.1`.
   *
   * Die **Liste** gibt es seit 1.1 und damit in jeder Fassung, die dieses
   * Add-in trägt. Erst der **Inhalt** braucht 1.8. Genau diese Trennung ist
   * der Grund, warum die Vorschau vor dem Klick stehen kann, obwohl die
   * Übernahme scheitern mag (A-19.31, Entwurf 2).
   *
   * `id` trägt bei `attachmentType === 'cloud'` im Lesemodus eine **Adresse**
   * und keine Exchange-Kennung. Sie ist Text aus fremder Hand und geht durch
   * `normalizeAttachmentLink`.
   */
  interface AttachmentDetails {
    readonly id: string;
    readonly name: string;
    readonly size: number;
    readonly isInline: boolean;
    readonly attachmentType: string;
  }

  /** Der Inhalt eines Anhangs — `Mailbox 1.8`, `getAttachmentContentAsync`. */
  interface AttachmentContent {
    readonly content: string;
    /** `base64`, `url`, `eml` oder `iCalendar`. */
    readonly format: string;
  }

  interface AsyncContextOptions {
    readonly asyncContext?: unknown;
  }

  interface MessageRead {
    readonly itemId?: string;
    readonly itemType?: string;
    readonly subject?: string;
    readonly internetMessageId?: string;
    readonly from?: EmailAddressDetails;
    readonly sender?: EmailAddressDetails;
    readonly to?: readonly EmailAddressDetails[];
    readonly cc?: readonly EmailAddressDetails[];
    readonly dateTimeCreated?: Date;
    readonly attachments?: readonly AttachmentDetails[];
    readonly body: Body;
    /**
     * Die geöffnete Nachricht als **EML/MIME in Base64** — `Mailbox 1.14`,
     * Mindestrecht **read item** (E-109).
     *
     * Der Grund, warum das Manifest bei `ReadItem` bleiben kann und weder EWS
     * noch `ReadWriteMailbox` gebraucht werden. Die Angabe stammt aus der
     * Beschreibung der Schnittstelle (`@types/office-js`,
     * `Office.MessageRead.getAsFileAsync`), nicht aus einer Erinnerung.
     */
    getAsFileAsync?(callback: (result: AsyncResult<string>) => void): void;
    /** Der Inhalt eines Anhangs — `Mailbox 1.8`, Mindestrecht **read item**. */
    getAttachmentContentAsync?(
      attachmentId: string,
      callback: (result: AsyncResult<AttachmentContent>) => void,
    ): void;
  }

  /** `Office.context.requirements` — die Fähigkeitsprüfung **zur Laufzeit**. */
  interface RequirementSetSupport {
    isSetSupported(name: string, minVersion?: string): boolean;
  }

  interface Mailbox {
    readonly item?: MessageRead;
    readonly userProfile?: UserProfile;
    convertToRestId(itemId: string, restVersion: string): string;
    /** `Mailbox 1.5` — nur vorhanden, wenn der Bereich angeheftet werden kann. */
    addHandlerAsync?(
      eventType: unknown,
      handler: () => void,
      callback?: (result: AsyncResult<void>) => void,
    ): void;
  }

  /**
   * Die Ereigniskennungen von Office.
   *
   * Bewusst **ohne** ausgeschriebenen Wert: In `office.js` ist `EventType` ein
   * `declare enum`, dessen Belegung die Laufzeit vergibt. Eine hier
   * abgeschriebene Zeichenkette wäre eine zweite Wahrheit über einen Wert, den
   * wir nicht setzen — und sie könnte falsch sein, ohne dass es jemand merkt.
   */
  const EventType: { readonly ItemChanged: unknown };

  interface Context {
    readonly mailbox?: Mailbox;
    readonly requirements?: RequirementSetSupport;
  }

  namespace MailboxEnums {
    const RestVersion: { readonly v2_0: 'v2.0' };
  }

  const context: Context;
}
