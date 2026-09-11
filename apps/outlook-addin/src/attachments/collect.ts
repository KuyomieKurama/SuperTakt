/**
 * SuperTakt — der Sammellauf: **erst sammeln, dann anlegen**
 * (A-19.22 bis A-19.31, Entwurf 5.3, F-02/T-297-14).
 *
 * ---------------------------------------------------------------------------
 * Warum in dieser Reihenfolge
 * ---------------------------------------------------------------------------
 *
 * Wer erst anlegt und dann anhängt, erzeugt mit jedem Abbruch und jedem
 * Fehlschlag ein Todo mit halben Anhängen — und jeder Anhang, der danach noch
 * dazukommt, ist ein Anhang an einem **vorhandenen** Todo, also genau die Tür,
 * die A-19.19 und E-108 zuhalten. Erst sammeln heißt: Bis zum letzten Schritt
 * existiert nichts, und der Abbruch hinterlässt nichts.
 *
 * Deshalb hält dieser Lauf die Bytes im Aufgabenbereich und gibt sie in
 * **einem** Anlegeruf weiter (F-02, vom security-checker entschieden). Der
 * andere Weg — Datei für Datei zum Dienst, der Anlegeruf verweist darauf —
 * öffnete eine zweite Tür unter `/addin`, die eine Kennung entgegennimmt und
 * eine Datei ablegt.
 *
 * ---------------------------------------------------------------------------
 * Drei Dinge, die aus der Vorlage ausdrücklich **nicht** übernommen sind
 * ---------------------------------------------------------------------------
 *
 *  1. **Ihr Häkchen.** Bei uns ist die Übernahme automatisch (E-108).
 *  2. **Ihre stille Degradierung.** Fehlt die Fähigkeit, fällt hier nichts
 *     weg — es steht dabei (A-19.31). `catch {}` ohne Meldung gibt es in
 *     dieser Datei nicht; jeder Fehlschlag wird ein Eintrag mit Namen und
 *     Grund.
 *  3. **Ihre ungeprüfte Übernahme von Cloud-Anhängen.** Die Vorlage nimmt
 *     `content.content` als Pfad, wie er kommt. Hier geht jede Adresse durch
 *     `normalizeAttachmentLink` und damit gegen eine Positivliste am
 *     **zerlegten** Schema.
 */

import { normalizeAttachmentLink } from '@takt/domain';

import { normalizeBase64, base64ByteLength, utf8ToBase64 } from './base64.ts';
import { buildRebuiltEml, type RebuildFields } from './eml.ts';
import type {
  AttachmentPayload,
  Collected,
  MissingAttachment,
  SkipReason,
  TakeoverLimits,
} from './model.ts';
import { MESSAGE_DISPLAY_NAME } from './model.ts';
import type { PlannedEntry, TakeoverPlan } from './plan.ts';

/** Was `getAttachmentContentAsync` zurückgibt, auf die zwei Felder reduziert. */
export interface AttachmentContentValue {
  readonly format: string;
  readonly content: string;
}

/**
 * Die Outlook-Seite als **Ports**.
 *
 * `null` heißt „diese Outlook-Fassung kann es nicht" und ist damit die
 * Laufzeitprüfung aus A-A-94 in Typform: Wer die Fähigkeit nicht hat, bekommt
 * keine Funktion, die er versehentlich rufen könnte.
 */
export interface CollectPorts {
  /** `getAsFileAsync` — `null`, wenn Mailbox 1.14 fehlt. */
  readonly messageAsFile: (() => Promise<string>) | null;
  /** `getAttachmentContentAsync` — `null`, wenn Mailbox 1.8 fehlt. */
  readonly attachmentContent: ((id: string) => Promise<AttachmentContentValue>) | null;
  /** Die Felder für den Nachbau (A-19.22a). */
  readonly rebuildFields: () => RebuildFields;
}

/** Der Zustand einer Zeile während des Laufs (Entwurf 6.1). */
export type EntryState = 'pending' | 'running' | 'taken' | 'missing';

export interface EntryProgress {
  readonly state: EntryState;
  readonly reason: SkipReason | null;
}

export interface CollectOptions {
  readonly signal: AbortSignal;
  /**
   * Der Deckel je Anhang (Entwurf 6.1, D-04).
   *
   * Ohne ihn ist ein hängender Abruf eine Sackgasse, aus der nur „Abbrechen"
   * führt — und den findet nicht jeder.
   */
  readonly timeoutMs: number;
  readonly onProgress: (progress: readonly EntryProgress[]) => void;
}

type Settled<T> =
  | { readonly kind: 'ok'; readonly value: T }
  | { readonly kind: 'failed' }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'cancelled' };

/**
 * Ein Versprechen gegen Abbruch und Zeitdeckel.
 *
 * Nach einem Abbruch ändert **kein** später eintreffender Rückläufer noch
 * etwas (AK-08): `finish` läuft genau einmal, und der Aufrufer sieht danach
 * nur noch `cancelled`.
 */
const settle = <T>(work: Promise<T>, timeoutMs: number, signal: AbortSignal): Promise<Settled<T>> =>
  new Promise<Settled<T>>((resolve) => {
    if (signal.aborted) {
      resolve({ kind: 'cancelled' });
      return;
    }

    let done = false;
    const finish = (result: Settled<T>): void => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      resolve(result);
    };
    const onAbort = (): void => {
      finish({ kind: 'cancelled' });
    };
    const timer = setTimeout(() => {
      finish({ kind: 'timeout' });
    }, timeoutMs);

    signal.addEventListener('abort', onAbort);
    work.then(
      (value) => {
        finish({ kind: 'ok', value });
      },
      () => {
        finish({ kind: 'failed' });
      },
    );
  });

/** Der Inhalt eines Anhangs, in eine Nutzlast übersetzt — oder ein Grund. */
type Translated =
  | { readonly ok: true; readonly payload: AttachmentPayload; readonly bytes: number }
  | { readonly ok: false; readonly reason: SkipReason; readonly bytes: number | null };

const translateContent = (
  value: AttachmentContentValue,
  displayName: string,
): Translated => {
  const format = value.format.toLowerCase();

  if (format === 'url') {
    const checked = normalizeAttachmentLink(value.content);
    return checked.ok
      ? { ok: true, payload: { kind: 'link', displayName, url: checked.url }, bytes: 0 }
      : { ok: false, reason: 'not_a_web_address', bytes: null };
  }

  /*
   * `eml` und `iCalendar` kommen als **Text** und nicht als Base64 — so
   * beschreibt es `AttachmentContentFormat`. Sie hier zu kodieren ändert das
   * Dateiformat nicht (A-19.23): Es ist derselbe Inhalt, nur auf dem Weg zum
   * Dienst in derselben Form wie jede andere Datei.
   */
  if (format === 'eml' || format === 'icalendar') {
    const encoded = utf8ToBase64(value.content);
    return {
      ok: true,
      payload: { kind: 'file', displayName, contentBase64: encoded },
      bytes: base64ByteLength(encoded),
    };
  }

  if (format !== 'base64') return { ok: false, reason: 'not_released', bytes: null };

  const normalized = normalizeBase64(value.content);
  if (normalized === null) return { ok: false, reason: 'not_released', bytes: null };

  return {
    ok: true,
    payload: { kind: 'file', displayName, contentBase64: normalized },
    bytes: base64ByteLength(normalized),
  };
};

/**
 * Der Sammellauf.
 *
 * Ein gescheiterter Anhang bricht die übrigen **nicht** ab (A-19.29); ein
 * Abbruch durch den Benutzer dagegen beendet den ganzen Lauf sofort, und es
 * wird kein Anlegeruf gestellt.
 */
export const collectAttachments = async (
  plan: TakeoverPlan,
  limits: TakeoverLimits,
  ports: CollectPorts,
  options: CollectOptions,
): Promise<Collected> => {
  const payload: AttachmentPayload[] = [];
  const missing: MissingAttachment[] = [];
  const progress: EntryProgress[] = plan.entries.map((entry) => ({
    state: entry.kind === 'skipped' ? 'missing' : 'pending',
    reason: entry.kind === 'skipped' ? entry.reason : null,
  }));

  let usedBytes = 0;

  const report = (): void => {
    options.onProgress([...progress]);
  };
  const mark = (index: number, state: EntryState, reason: SkipReason | null): void => {
    progress[index] = { state, reason };
    report();
  };

  for (const [index, entry] of plan.entries.entries()) {
    if (options.signal.aborted) return { payload: [], missing: [], cancelled: true };

    if (entry.kind === 'skipped') {
      missing.push({
        displayName: entry.displayName,
        reason: entry.reason,
        bytes: entry.bytes,
        isMessage: false,
      });
      continue;
    }

    if (entry.kind === 'link') {
      payload.push({ kind: 'link', displayName: entry.displayName, url: entry.url });
      mark(index, 'taken', null);
      continue;
    }

    mark(index, 'running', null);

    const outcome: Translated =
      entry.kind === 'message'
        ? await takeMessage(ports, limits, options)
        : await takeFile(entry, ports, limits, options);

    if (options.signal.aborted) return { payload: [], missing: [], cancelled: true };

    if (!outcome.ok) {
      missing.push({
        displayName: entry.displayName,
        reason: outcome.reason,
        bytes: outcome.bytes,
        isMessage: entry.kind === 'message',
      });
      mark(index, 'missing', outcome.reason);
      continue;
    }

    if (usedBytes + outcome.bytes > limits.maxBytesTotal) {
      missing.push({
        displayName: entry.displayName,
        reason: 'total_too_large',
        bytes: outcome.bytes,
        isMessage: entry.kind === 'message',
      });
      mark(index, 'missing', 'total_too_large');
      continue;
    }

    usedBytes += outcome.bytes;
    payload.push(outcome.payload);
    mark(index, 'taken', null);
  }

  return { payload, missing, cancelled: false };
};

/**
 * Die E-Mail selbst — im Original, sonst nachgebaut (A-19.22a).
 *
 * Ein Fehlschlag von `getAsFileAsync` ist hier **kein** fehlender Anhang: Er
 * ist der Fall, für den der Nachbau gebaut ist. Fehlen kann die E-Mail nur
 * noch, wenn der Nachbau an seiner eigenen Formprüfung scheitert (A-A-96).
 */
const takeMessage = async (
  ports: CollectPorts,
  limits: TakeoverLimits,
  options: CollectOptions,
): Promise<Translated> => {
  if (ports.messageAsFile !== null) {
    const result = await settle(ports.messageAsFile(), options.timeoutMs, options.signal);
    if (result.kind === 'cancelled') return { ok: false, reason: 'rejected', bytes: null };

    if (result.kind === 'ok') {
      const normalized = normalizeBase64(result.value);
      if (normalized !== null) {
        const bytes = base64ByteLength(normalized);
        if (bytes > limits.maxBytesPerFile) return { ok: false, reason: 'too_large', bytes };
        return {
          ok: true,
          bytes,
          payload: {
            kind: 'message',
            displayName: MESSAGE_DISPLAY_NAME,
            contentBase64: normalized,
            rebuilt: false,
          },
        };
      }
    }
  }

  const rebuilt = buildRebuiltEml(ports.rebuildFields());
  if (!rebuilt.ok) return { ok: false, reason: 'rebuild_rejected', bytes: null };

  const bytes = base64ByteLength(rebuilt.base64);
  if (bytes > limits.maxBytesPerFile) return { ok: false, reason: 'too_large', bytes };

  return {
    ok: true,
    bytes,
    payload: {
      kind: 'message',
      displayName: MESSAGE_DISPLAY_NAME,
      contentBase64: rebuilt.base64,
      rebuilt: true,
    },
  };
};

/** Ein Dateianhang — gezählt beim Lesen und nicht aus der Ankündigung (A-A-81). */
const takeFile = async (
  entry: Extract<PlannedEntry, { kind: 'file' }>,
  ports: CollectPorts,
  limits: TakeoverLimits,
  options: CollectOptions,
): Promise<Translated> => {
  if (ports.attachmentContent === null) {
    return { ok: false, reason: 'outlook_too_old', bytes: entry.bytes };
  }

  const result = await settle(
    ports.attachmentContent(entry.id),
    options.timeoutMs,
    options.signal,
  );

  if (result.kind === 'cancelled') return { ok: false, reason: 'rejected', bytes: null };
  if (result.kind === 'timeout') return { ok: false, reason: 'timeout', bytes: null };
  if (result.kind === 'failed') return { ok: false, reason: 'not_released', bytes: null };

  const translated = translateContent(result.value, entry.displayName);
  if (!translated.ok) return translated;
  if (translated.bytes > limits.maxBytesPerFile) {
    return { ok: false, reason: 'too_large', bytes: translated.bytes };
  }
  return translated;
};
