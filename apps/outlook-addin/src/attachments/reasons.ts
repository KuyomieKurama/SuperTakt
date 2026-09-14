/**
 * SuperTakt — die Sätze hinter einem nicht übernommenen Anhang
 * (A-19.29, A-19.30, A-19.31, Entwurf 6.2).
 *
 * ---------------------------------------------------------------------------
 * Warum die Liste geschlossen ist
 * ---------------------------------------------------------------------------
 *
 * Ein Grund kommt von Outlook, aus dem Netz oder aus dem Dienst — also aus
 * fremder Hand. Ihn durchzureichen hieße, in einer Fläche, die sonst nur
 * eigene Sätze zeigt, einen fremden zu zeigen. Deshalb übersetzt diese Datei
 * jede Kennung in einen Satz, den wir geschrieben haben, und es gibt keinen
 * Zweig für „sonstiges".
 *
 * ---------------------------------------------------------------------------
 * Die Zahlen stehen in den Sätzen, aber nicht in dieser Datei
 * ---------------------------------------------------------------------------
 *
 * „Die Grenze liegt bei 25 MB je Datei" nennt eine Zahl — und die Zahl kommt
 * als {@link TakeoverLimits} herein, also aus `packages/domain` (T-304). Eine
 * ausgeschriebene 25 hier wäre eine zweite Wahrheit über eine Grenze, die ein
 * anderer durchsetzt, und sie stünde falsch da, sobald jemand die echte
 * ändert.
 *
 * ---------------------------------------------------------------------------
 * Ein Satz je Kennung, und keine Kennung ohne Satz
 * ---------------------------------------------------------------------------
 *
 * `SkipReason` ist seit T-309/T-310 **dieselbe** Liste wie die der Domäne:
 * `too_many` und `total_too_large` reisen jetzt selbst über die Leitung, und
 * `connection` ist gestrichen. Die Regel, die dahintersteht, ist an
 * `SkipReason` in `model.ts` ausgeschrieben; hier leistet sie der `switch` —
 * ein Zweig je Kennung, kein Sammelzweig, und ein `never` als Wache. Kommt in
 * der Domäne ein Grund dazu, wird diese Datei rot und nicht erst der
 * Benutzer, der eine leere Zeile liest.
 */

import type { MissingAttachment, SkipReason, TakeoverLimits } from './model.ts';
import { formatBytes } from './size.ts';

/**
 * Der Zusatz, der **nur bei `outlook_too_old`** eine Zeile tiefer steht.
 *
 * Er nennt die Fassung, die fehlt. Sie im selben Satz zu nennen machte aus
 * einer Auskunft eine Fehlermeldung mit Versionsnummer; getrennt liest sich
 * zuerst, was ist, und dann, was nötig wäre.
 */
export const OUTLOOK_REQUIREMENT_HINT = 'Nötig ist Outlook mit Mailbox-Anforderungssatz 1.8.';

/**
 * Der Satzteil hinter dem Namen.
 *
 * Er beginnt klein und ohne Namen, weil er hinter einem Gedankenstrich an
 * einen Anzeigenamen tritt: `Video.mp4 — zu groß (31,4 MB). …`
 */
export const reasonSentence = (
  reason: SkipReason,
  bytes: number | null,
  limits: TakeoverLimits,
): string => {
  switch (reason) {
    case 'too_large':
      return bytes === null
        ? `zu groß. Die Grenze liegt bei ${formatBytes(limits.maxBytesPerFile)} je Datei.`
        : `zu groß (${formatBytes(bytes)}). Die Grenze liegt bei ${formatBytes(limits.maxBytesPerFile)} je Datei.`;
    /*
     * Die beiden Sätze laufen **parallel zu `too_large`**: erst der Zustand,
     * dann die Regel. Sie nennen die Grenze beim Namen, weil der Benutzer sonst
     * dreimal „nicht übernommen" untereinander läse — für drei verschiedene
     * Ursachen, von denen jede eine andere Handlung nahelegt (Entwurf 6.2).
     *
     * **Ein `rejected` wäre hier unwahr.** Beide Fälle stehen vor dem Klick
     * fest; SuperTakt hat die Datei nie gesehen, kann sie also auch nicht
     * abgelehnt haben.
     */
    case 'total_too_large':
      return `über der Gesamtgrenze. Zusammen dürfen die Dateien einer E-Mail ${formatBytes(limits.maxBytesTotal)} nicht überschreiten.`;
    case 'too_many':
      return `über der Anzahlgrenze. Je E-Mail werden höchstens ${String(limits.maxCount)} Dateien übernommen.`;
    case 'not_released':
      return 'Outlook hat die Datei nicht herausgegeben.';
    case 'timeout':
      return 'Zeitüberschreitung beim Laden.';
    case 'rejected':
      return 'SuperTakt hat die Datei nicht angenommen.';
    /*
     * **`connection` ist gestrichen** (T-308 F-7, T-309, T-310).
     *
     * Der Satz lautete „Die Verbindung zu SuperTakt ist abgerissen." und
     * hatte keinen Fall: Der Aufgabenbereich sammelt vollständig lokal und
     * schickt genau einmal — reißt dieser Ruf, gibt es kein Todo, und der
     * Fall ist die Fehlerfläche (Z5) und nicht die Ergebnisliste (Z4).
     * Dasselbe Urteil wie bei `mailbox_closed` und aus demselben Satz: Ein
     * Grund, der nicht eintreten kann, ist ein Satz, der das Gegenteil des
     * Bestands behauptet.
     */
    case 'not_a_web_address':
      return 'Der Ablageort ist keine Webadresse.';
    /*
     * Die beiden letzten beginnen **klein**, wie alle anderen auch: Sie treten
     * hinter einen Gedankenstrich an einen Anzeigenamen und sind kein eigener
     * Satz. Bis T-304 standen sie groß da und lasen sich dadurch wie eine
     * Fehlermeldung neben der Zeile statt als ihre Fortsetzung (Entwurf 6.2,
     * zweite Fassung).
     */
    case 'outlook_too_old':
      return 'dieses Outlook gibt Anhänge nicht heraus.';
    case 'rebuild_rejected':
      return 'sie ließ sich nicht als Datei nachbauen.';
    default:
      return unreachable(reason);
  }
};

/**
 * Der Fangzweig, den der Übersetzer prüft.
 *
 * Kommt eine Kennung dazu, ohne dass hier ein Satz entsteht, wird `never`
 * verletzt und `pnpm typecheck` rot — und nicht erst der Benutzer, der eine
 * leere Zeile liest.
 */
const unreachable = (value: never): never => {
  throw new Error(`Kein Satz für diesen Grund: ${String(value)}`);
};

/**
 * Die Kurzform für die Fortschrittsliste (Entwurf 6.1).
 *
 * Dort steht `⊘ Video.mp4 — zu groß, übersprungen`: kein ganzer Satz, keine
 * Zahl, keine Grenze. Die vollständige Auskunft steht im Ergebnis, und sie
 * steht dort **noch einmal** — die laufende Liste ist weg, sobald sie fertig
 * ist.
 */
export const shortReason = (reason: SkipReason): string => {
  switch (reason) {
    case 'too_large':
      return 'zu groß, übersprungen';
    /*
     * **Sie tragen die Grenze auch in der Kurzform beim Namen** (Entwurf 6.2,
     * zweite Fassung). Bis T-304 stand hier zweimal „übersprungen" — und mit
     * `too_large` daneben dreimal derselbe Halbsatz für drei verschiedene
     * Ursachen. Wer die laufende Liste liest, liest sie gerade deshalb, weil er
     * wissen will, **welche**.
     */
    case 'total_too_large':
      return 'Gesamtgrenze, übersprungen';
    case 'too_many':
      return 'Anzahlgrenze, übersprungen';
    case 'not_released':
      return 'nicht herausgegeben';
    case 'timeout':
      return 'Zeitüberschreitung';
    case 'rejected':
      return 'nicht angenommen';
    // `connection` ist gestrichen — siehe `reasonSentence`.
    case 'not_a_web_address':
      return 'keine Webadresse';
    case 'outlook_too_old':
      return 'nicht übernommen';
    case 'rebuild_rejected':
      return 'nicht nachgebaut';
    default:
      return unreachable(reason);
  }
};

/**
 * Der vollständige Eintrag der Ergebnisliste, ohne den Namen.
 *
 * Nimmt bewusst nur die zwei Felder, die den Satz tragen, und nicht den ganzen
 * {@link MissingAttachment}: Dieselbe Zeile entsteht in der **Vorschau** aus
 * einem Planeintrag, der noch kein fehlender Anhang ist. Ein breiterer Typ
 * zwänge dort zu einem erfundenen Wert.
 */
export const describeMissing = (
  missing: Pick<MissingAttachment, 'reason' | 'bytes'>,
  limits: TakeoverLimits,
): string => reasonSentence(missing.reason, missing.bytes, limits);
