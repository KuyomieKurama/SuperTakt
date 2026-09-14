/**
 * SuperTakt — was von der Nutzlast angekommen ist und was nicht (A-19.29,
 * A-19.33, T-310 Befund 1 und 2).
 *
 * ===========================================================================
 * Der Befund, aus dem diese Datei entstanden ist
 * ===========================================================================
 *
 * Bis T-310 glich der Aufgabenbereich Nutzlast und Abweisungsliste über den
 * **Anzeigenamen** ab: `payload.filter((e) => !refused.has(e.displayName))`.
 * Das ist an zwei Stellen falsch, und beide sind von außen auslösbar:
 *
 *  1. **Der Dienst kürzt den Anzeigenamen auf 255 Zeichen**
 *     (`shortenEmailDisplayName`), das Routenschema lässt 1020 durch. Bei
 *     einem längeren Namen traf `refused.has(…)` nie: Die abgewiesene Datei
 *     stand in `attached` **und** in `missing`, und die Zeile meldete „3 von 4
 *     Anhängen hängen daran" für eine E-Mail, von der drei angekommen sind.
 *  2. **Zwei Anhänge dürfen denselben Namen tragen.** Ein `Set` über die Namen
 *     entfernte dann **beide**, wenn einer abgewiesen wurde.
 *
 * Eine Zahl, die der Benutzer nachzählen kann, muss stimmen; sie ist die
 * einzige Auskunft, die er über den Erfolg hat.
 *
 * ===========================================================================
 * Wie hier abgeglichen wird
 * ===========================================================================
 *
 * **Die Zahl kommt aus der Antwort, die Namen aus dem Abgleich.** `stored` ist
 * eine Aussage über den Bestand und wird nicht nachgerechnet (T-310 Befund 2).
 * Der Abgleich hier beantwortet die andere Frage: **welche** Nutzlast steht
 * hinter dieser Zahl.
 *
 * Abgeglichen wird als **Multimenge über den gekürzten Namen**, in der
 * Reihenfolge, in der der Dienst arbeitet (Nachricht, Dateien, Verweise):
 * Jede Abweisung verbraucht **genau einen** Eintrag desselben Namens. Damit
 * ist die Anzahl der Übriggebliebenen exakt `payload.length −
 * rejected.length`, also genau `stored` — und zwei gleichnamige Anhänge, von
 * denen einer durchfällt, sind ein Fall und kein Rätsel.
 *
 * Gekürzt wird mit **derselben Funktion, die der Dienst benutzt**
 * (`shortenEmailDisplayName` aus `@takt/domain`) und nicht mit einer zweiten,
 * hier geschriebenen: Zwei Kürzungen wären zwei Wahrheiten über denselben
 * Namen, und der Abgleich hinge an ihrer Gleichheit.
 *
 * **Was bleibt:** Tragen zwei Einträge **verschiedener Art** denselben
 * gekürzten Namen — eine Datei und ein Cloud-Verweis etwa —, ist nicht
 * bestimmbar, welcher von beiden durchgefallen ist. Die Zahl stimmt dann
 * weiterhin; der Zusatz hinter dem Namen („(als Verweis)") kann den falschen
 * der beiden treffen. Der Weg dahin — der Dienst müsste die Stelle im
 * Umschlag zurückgeben statt eines Namens — steht in T-307 Befund 2 und
 * liegt in `features/`, also nicht in dieser Hoheit.
 */

import { shortenEmailDisplayName } from '@takt/domain';

import {
  MESSAGE_DISPLAY_NAME,
  displaySkipReason,
  type AttachmentPayload,
  type MissingAttachment,
} from './model.ts';

/** Ein Eintrag der Abweisungsliste, wie er über die Leitung kommt. */
export interface WireRejection {
  readonly displayName: string;
  readonly reason: string;
  readonly bytes: number | null;
}

export interface Reconciled {
  /** Die Nutzlasten, die der Dienst **nicht** abgewiesen hat. */
  readonly attached: readonly AttachmentPayload[];
  /** Die Abweisungen des Dienstes als fehlende Anhänge (A-19.29). */
  readonly missing: readonly MissingAttachment[];
}

/**
 * Die Reihenfolge, in der der Dienst die Einträge behandelt — und damit die,
 * in der er seine Abweisungen meldet: die Nachricht, dann die Dateien, dann
 * die Verweise (`toEmailIntake` in `routes/addin/service.ts`).
 *
 * Sie ist der Grund, warum hier nach dieser Ordnung verbraucht wird und nicht
 * nach der Reihenfolge des Einsammelns: Bei zwei gleichnamigen Einträgen
 * derselben Art trifft die k-te Abweisung dann denselben Eintrag, den auch der
 * Dienst gemeint hat.
 */
const SERVICE_ORDER: Readonly<Record<AttachmentPayload['kind'], number>> = Object.freeze({
  message: 0,
  file: 1,
  link: 2,
});

/**
 * Wie der Eintrag in der Fehlliste heißt.
 *
 * Für die Nachricht steht dort **„die E-Mail"** und nicht `Nachricht.eml`: Der
 * Benutzer hat keinen Dateinamen gewählt, und die Sätze ringsum sprechen von
 * der E-Mail. Dieselbe Regel wie in der Liste der angekommenen Anhänge.
 */
const missingName = (item: AttachmentPayload): string =>
  item.kind === 'message' ? 'die E-Mail' : item.displayName;

/**
 * Nutzlast und Abweisungsliste gegeneinander.
 *
 * `rejected === null` heißt: Der Dienst hat über die Anhänge **gar nichts**
 * gesagt. Dann ist auch keiner angekommen — jeder mitgeschickte Eintrag gilt
 * als abgewiesen, mit dem Grund, der in diesem Fall sicher stimmt. Ein
 * stillschweigendes „dann werden sie schon dranhängen" wäre der stille Ausfall
 * aus A-19.31.
 */
export const reconcileAttachments = (
  payload: readonly AttachmentPayload[],
  rejected: readonly WireRejection[] | null,
): Reconciled => {
  if (rejected === null) {
    return {
      attached: [],
      missing: payload.map((item) => ({
        displayName: missingName(item),
        reason: 'rejected',
        bytes: null,
        isMessage: item.kind === 'message',
      })),
    };
  }

  /** Die Stellen im Umschlag, nach der Ordnung des Dienstes, je gekürztem Namen. */
  const byName = new Map<string, number[]>();
  const order = payload
    .map((item, index) => ({ item, index }))
    .sort((left, right) => SERVICE_ORDER[left.item.kind] - SERVICE_ORDER[right.item.kind]);

  for (const { item, index } of order) {
    const key = shortenEmailDisplayName(
      item.kind === 'message' ? MESSAGE_DISPLAY_NAME : item.displayName,
    );
    const slots = byName.get(key);
    if (slots === undefined) byName.set(key, [index]);
    else slots.push(index);
  }

  const refused = new Set<number>();
  const missing: MissingAttachment[] = [];

  for (const entry of rejected) {
    const slots = byName.get(entry.displayName);
    const index = slots?.shift();
    const item = index === undefined ? null : (payload[index] ?? null);
    if (index !== undefined) refused.add(index);

    missing.push({
      /*
       * Der Name aus der **Antwort** ist der gekürzte; ist der Eintrag
       * gefunden, steht sein eigener Name da — er ist der vollständige und
       * derselbe, den die Vorschau gezeigt hat. Ist er es nicht, bleibt
       * der Name des Dienstes stehen: Einen Eintrag zu verschweigen, weil er
       * sich nicht zuordnen ließ, wäre der stille Ausfall.
       */
      displayName: item === null ? entry.displayName : missingName(item),
      reason: displaySkipReason(entry.reason),
      bytes: entry.bytes,
      isMessage: item === null ? entry.displayName === MESSAGE_DISPLAY_NAME : item.kind === 'message',
    });
  }

  return {
    attached: payload.filter((_, index) => !refused.has(index)),
    missing,
  };
};
