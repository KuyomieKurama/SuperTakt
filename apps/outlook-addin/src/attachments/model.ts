/**
 * SuperTakt — was der Aufgabenbereich aus einer E-Mail an Anhängen übernimmt
 * (A-19.22 bis A-19.33, E-108, E-109).
 *
 * Reine Werte ohne jede Office-Abhängigkeit. Alles, was diese Datei
 * beschreibt, lässt sich ohne laufendes Outlook planen, sammeln und prüfen —
 * dieselbe Aufteilung wie bei `office/mail.ts` und aus demselben Grund.
 *
 * **Zwei Dinge kommen aus `@takt/domain` und werden hier nicht nachgebaut**
 * (T-304): die drei Grenzen aus A-A-81 und die Liste der Fehlgründe aus
 * A-19.29. Beides sind Fachregeln; sie liegen dort, wo dieser Bestand
 * Fachregeln hinlegt, und der Aufgabenbereich liest sie.
 */

import {
  MAX_EMAIL_ATTACHMENT_BYTES,
  MAX_EMAIL_ATTACHMENT_COUNT,
  MAX_EMAIL_ATTACHMENT_TOTAL_BYTES,
  type EmailAttachmentFailureReason,
} from '@takt/domain';

/**
 * Ein Anhang, wie Outlook ihn **ankündigt** (`Office.AttachmentDetails`).
 *
 * Alle fünf Angaben stehen synchron zur Verfügung, ohne eine einzige
 * Netzanfrage. Deshalb kann die Vorschau vor dem Klick stehen, und deshalb
 * steht eine zu große Datei dort mit Größe und Grenze (Entwurf 4.3).
 *
 * `size` ist eine **Ankündigung und keine Grenze** (A-A-81). Sie taugt für die
 * Vorschau; gezählt wird beim Lesen.
 */
export interface AttachmentFact {
  /** Bei Cloud-Anhängen ist dies laut Schnittstelle eine **Adresse** (A-19.25). */
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly isInline: boolean;
  /** `file`, `cloud`, `item` — die Zeichenkette aus `MailboxEnums.AttachmentType`. */
  readonly attachmentType: string;
}

/**
 * Die drei Grenzen aus A-A-81 — **aus `@takt/domain` gelesen, nicht gesetzt**.
 *
 * ---------------------------------------------------------------------------
 * Warum aus der Domäne und nicht aus der Antwort des Dienstes (T-304)
 * ---------------------------------------------------------------------------
 *
 * In T-300 kamen sie aus `GET /addin/context`. Die Überlegung dahinter war
 * richtig — eine ausgeschriebene 25 im Add-in wäre die zweite Wahrheit über
 * eine Grenze, die ein anderer durchsetzt — und die Antwort darauf ist
 * trotzdem eine andere: Die Zahlen sind eine **Fachregel** und liegen deshalb
 * dort, wo dieser Bestand Fachregeln hinlegt. Sie stehen in
 * `packages/domain/src/email-attachment.ts` als `MAX_EMAIL_ATTACHMENT_BYTES`,
 * `…_TOTAL_BYTES` und `…_COUNT`, und der Aufgabenbereich führt `@takt/domain`
 * ohnehin — dieselbe Bauart wie `MAX_TITLE_CHARACTERS` seit T-128 und
 * `CALL_NUMBER_MAX_LENGTH` seit T-101.
 *
 * Eine Zahl über zwei Wege zu verteilen — einmal im Paket, einmal über die
 * Leitung — wäre genau die Gelegenheit, sie verschieden zu ändern.
 *
 * ---------------------------------------------------------------------------
 * Und was der Dienst statt dessen sagt
 * ---------------------------------------------------------------------------
 *
 * **Daß** er Anhänge annimmt, und sonst nichts
 * (`AddinContextDto.emailAttachments.accepted`). Das kann der Aufgabenbereich
 * aus keinem Paket lesen: Add-in und Dienst werden getrennt installiert und
 * können auseinanderlaufen. Fehlt die Auskunft, bietet der Aufgabenbereich die
 * Übernahme gar nicht an — kein Satz verspricht dann etwas, was hinterher
 * nicht geschieht (E-100 Punkt 3).
 *
 * Der Typ bleibt, obwohl die Werte jetzt aus einer Konstante kommen: Er ist
 * das, was Vorschau, Sammellauf und Satzbau entgegennehmen, und damit die
 * Stelle, an der eine Prüfung eine andere Grenze einsetzen kann, ohne die
 * Fachregel zu verbiegen.
 */
export interface TakeoverLimits {
  readonly maxBytesPerFile: number;
  readonly maxBytesTotal: number;
  readonly maxCount: number;
}

/** Siehe {@link TakeoverLimits}. Gelesen, nicht nachgebaut. */
export const TAKEOVER_LIMITS: TakeoverLimits = Object.freeze({
  maxBytesPerFile: MAX_EMAIL_ATTACHMENT_BYTES,
  maxBytesTotal: MAX_EMAIL_ATTACHMENT_TOTAL_BYTES,
  maxCount: MAX_EMAIL_ATTACHMENT_COUNT,
});

/**
 * Was dieses Outlook kann — **zur Laufzeit gemessen, nicht im Manifest
 * gefordert** (A-A-94, A-19.31).
 *
 * `MinVersion` im Manifest bleibt auf dem niedrigsten Wert, der das Add-in
 * trägt. Stünde dort 1.14, verweigerte ein großer Teil der Outlook-Fassungen
 * die Installation — und der Nachbau, der genau für diesen Fall gebaut ist,
 * käme nie zum Zug.
 */
export interface MailCapabilities {
  /** `Mailbox 1.8` — `getAttachmentContentAsync`, also die Dateianhänge. */
  readonly canReadAttachments: boolean;
  /** `Mailbox 1.14` — `getAsFileAsync`, also die Nachricht im Original. */
  readonly canReadMessageFile: boolean;
}

/**
 * Was **über die Leitung** geht — die Liste der Domäne, und es gibt keine
 * zweite (A-19.29, T-301, T-304).
 *
 * Acht Kennungen, aufgezählt in `packages/domain/src/email-attachment.ts`. Der
 * Dienst stellt drei davon fest (`too_large`, `rejected`, `not_a_web_address`)
 * und meldet sie in der Antwort auf den Anlegeruf; der Aufgabenbereich
 * übersetzt sie hier in Sätze.
 *
 * Bis T-300 stand hier eine eigene Aufzählung von zehn Werten. Sie deckte sich
 * an drei Stellen nicht mit der der Domäne, und der Orchestrator hat
 * entschieden: **`packages/domain` ist die Quelle**, der Aufgabenbereich bildet
 * darauf ab und führt keine eigene. Zwei Namen für dieselbe Sache sind kein
 * Feinschliff — der Grund wandert über die Leitung und steht am Ende in einem
 * Satz, den ein Mensch liest.
 */
export type WireSkipReason = EmailAttachmentFailureReason;

/**
 * Was **auf dem Bildschirm** steht (Entwurf 6.2, A-19.29).
 *
 * Die acht der Domäne **plus zwei**, und die zwei sind eine ausdrückliche
 * Entscheidung des ux-designers (T-303) und keine Nachlässigkeit:
 *
 *  - `too_many` — die 26. Datei ist zu **viel**, nicht zu groß.
 *  - `total_too_large` — die Summe ist gerissen, die einzelne Datei nicht.
 *
 * Beide Fälle stehen **vor dem Klick** fest und **reisen nie über die
 * Leitung**: Der Plan aus `plan.ts` erkennt sie an den angekündigten Größen,
 * lange bevor irgendetwas gesendet ist. Ein `rejected` („SuperTakt hat die
 * Datei nicht angenommen") wäre in der Vorschau schlicht unwahr — SuperTakt
 * hat sie nie gesehen.
 *
 * **Die Regel dahinter, und sie gilt allgemein:** Die Gründe über die Leitung
 * dürfen gröber sein als die auf dem Bildschirm, solange jede Kennung der
 * Leitung auf **genau einen** Satz fällt und keine auf zwei. Deshalb ist diese
 * Menge eine echte Obermenge der Leitungsmenge und nicht eine zweite daneben:
 * Kommt in der Domäne ein Grund dazu, wird der Übersetzer in `reasons.ts` ohne
 * Satz dafür **rot** (`never`), und nicht erst der Benutzer, der eine leere
 * Zeile liest.
 *
 * **Freitext aus fremden Fehlermeldungen ist verboten** (AB-3). Was Outlook
 * meldet, ist Text aus fremder Hand in einer Fläche, die sonst nur eigene
 * Sätze zeigt.
 *
 * **`mailbox_closed` gibt es nicht** — weder hier noch in der Domäne. Er stand
 * für den EWS-Weg, den es seit E-109 nicht mehr gibt; gibt Outlook die
 * Nachricht nicht her, fehlt sie nicht, sondern wird nachgebaut (A-19.22a).
 */
export type SkipReason = WireSkipReason | 'too_many' | 'total_too_large';

/**
 * Die zwei Kennungen, die **nur** auf dem Bildschirm vorkommen.
 *
 * Sie stehen hier als Wert und nicht nur als Typ, damit der Nachweislauf die
 * Aussage „diese beiden reisen nicht" gegen die Aufzählung der Domäne halten
 * kann, statt sie in einem Satz zu behaupten.
 */
export const DISPLAY_ONLY_SKIP_REASONS: readonly SkipReason[] = Object.freeze([
  'too_many',
  'total_too_large',
]);

/** Ein Anhang, der **nicht** übernommen wurde — mit Namen und Grund (A-19.29). */
export interface MissingAttachment {
  /** Fremder Text. Geht durch `Foreign`, wird nie am Ende gekürzt (A-A-93). */
  readonly displayName: string;
  readonly reason: SkipReason;
  /** Die gemessene oder angekündigte Größe, wo sie zum Grund gehört. */
  readonly bytes: number | null;
  /**
   * Ist das die E-Mail selbst?
   *
   * Als Feld und nicht als Vergleich des Anzeigenamens: Die Überschrift von
   * Z4 lautet anders, wenn ausgerechnet die E-Mail fehlt, und eine Überschrift
   * an einer Zeichenkette festzumachen, die sich ändern darf, ist genau die
   * Art Abschrift, die still altert.
   */
  readonly isMessage: boolean;
}

/**
 * Was der Aufgabenbereich an den **Anlegeruf** reicht (F-02, T-297-14).
 *
 * Die Bytes bleiben im Aufgabenbereich, bis das Todo entsteht; ein einziger
 * Ruf trägt alles. Der andere Weg — Datei für Datei zum Dienst — öffnete eine
 * zweite Tür unter `/addin`, die eine Kennung entgegennimmt und eine Datei
 * ablegt, und das ist zeichengleich die Tür, die A-A-82 zuhält.
 *
 * **Der Name auf der Platte steht hier nicht.** Er entsteht im Dienst
 * (A-A-78); von hier geht ausschließlich der **Anzeigename** mit, und der ist
 * fremder Text.
 */
export type AttachmentPayload =
  | {
      /** Die E-Mail selbst (A-19.22). Genau einer je Anlegeruf. */
      readonly kind: 'message';
      readonly displayName: string;
      /** EML/MIME in Base64 — im Original von Outlook, sonst nachgebaut. */
      readonly contentBase64: string;
      /** `true` heißt: nachgebaut, nicht das Original (A-19.22b, A-A-97). */
      readonly rebuilt: boolean;
    }
  | {
      /** Ein Dateianhang derselben E-Mail (A-19.23). */
      readonly kind: 'file';
      readonly displayName: string;
      readonly contentBase64: string;
    }
  | {
      /** Ein Cloud-Anhang, als **Verweis** (A-19.25). */
      readonly kind: 'link';
      readonly displayName: string;
      /** Die **Normalform** aus `normalizeAttachmentLink` (A-A-13). */
      readonly url: string;
    };

/**
 * Der **Umschlag**, in dem die Nutzlast reist (A-19.22 bis A-19.33, A-A-85).
 *
 * Der Absender steht am Umschlag und nicht am einzelnen Anhang: Er gehört der
 * **Nachricht**. Am Eintrag stünde er zwanzigmal, und zwei Anhänge derselben
 * E-Mail könnten zwei verschiedene Herkünfte behaupten — die Rückfrage vor dem
 * Öffnen läse Wochen später eine davon vor.
 *
 * Er ist **fremder Text** und wird als solcher behandelt: Der Dienst kürzt ihn
 * auf 640 Zeichen und legt ihn als Eigenschaft an jeden Anhang dieses Laufs.
 *
 * **Keine Todo-Kennung, in keinem Feld.** Dieser Umschlag fährt im Rumpf des
 * Anlegerufs, und was er trägt, hängt an dem Todo, das derselbe Ruf anlegt
 * (A-A-82, E-108).
 */
export interface EmailAttachmentEnvelope {
  /** Der Absender der E-Mail, fremder Text. `null`, wenn Outlook keinen hergab. */
  readonly sender: string | null;
  readonly items: readonly AttachmentPayload[];
}

/** Das Ergebnis eines vollständigen Sammellaufs. */
export interface Collected {
  readonly payload: readonly AttachmentPayload[];
  readonly missing: readonly MissingAttachment[];
  /** Der Lauf wurde abgebrochen; es ist kein Anlegeruf zu stellen (Z6). */
  readonly cancelled: boolean;
}

/**
 * Der Anzeigename der E-Mail selbst.
 *
 * **Absichtlich kein fremder Text.** Aus dem Betreff einen Dateinamen zu
 * bauen hieße, eine Zeichenkette von Akteur A-06 in einen Namen zu heben, der
 * später in einer Rückfrage vor dem Öffnen steht. Die Kennzeichnung des
 * Nachbaus hängt an der **Eigenschaft** `rebuilt` und nicht an diesem Namen
 * (A-A-97) — ein Name, der die Kennzeichnung trüge, ließe sich umbenennen.
 */
export const MESSAGE_DISPLAY_NAME = 'Nachricht.eml';

/**
 * Was an die Stelle eines fehlenden Namens tritt.
 *
 * Outlook gibt einen Anhang ohne Namen her; ihn stillschweigend fallen zu
 * lassen wäre ein stiller Ausfall (A-19.31), und ihm einen Namen anzudichten
 * wäre eine Behauptung über fremdes Material. Also eine Beschriftung, die
 * sagt, was der Fall ist.
 */
export const UNNAMED_DISPLAY_NAME = '(ohne Namen)';
