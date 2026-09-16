/**
 * Jede Abweisung verbraucht genau einen Eintrag mit demselben gekürzten Namen
 * (A-19.29). Die Kürzung kommt wie im Dienst aus der Domäne. Die Erfolgszahl
 * kommt weiterhin aus der Antwort, nicht aus diesem Namensabgleich.
 * Bei gleichem gekürztem Namen und verschiedener Art bleibt die Zuordnung mehrdeutig.
 */

import { shortenEmailDisplayName } from '@takt/domain';

import {
  MESSAGE_DISPLAY_NAME,
  displaySkipReason,
  type AttachmentPayload,
  type MissingAttachment,
} from './model.ts';

export interface WireRejection {
  readonly displayName: string;
  readonly reason: string;
  readonly bytes: number | null;
}

export interface Reconciled {
  /** Nutzlasten, die der Dienst nicht abgewiesen hat. */
  readonly attached: readonly AttachmentPayload[];
  /** Abweisungen des Dienstes für die Anzeige (A-19.29). */
  readonly missing: readonly MissingAttachment[];
}

// Der Dienst verarbeitet Nachricht, Dateien und Verweise in dieser Reihenfolge.
const SERVICE_ORDER: Readonly<Record<AttachmentPayload['kind'], number>> = Object.freeze({
  message: 0,
  file: 1,
  link: 2,
});

// Die Nachricht heißt in der Anzeige „die E-Mail“, auch wenn ihr Dateiname feststeht.
const missingName = (item: AttachmentPayload): string =>
  item.kind === 'message' ? 'die E-Mail' : item.displayName;

/** Ohne Abweisungsliste ist keine Übernahme bestätigt; alle Einträge gelten als fehlend. */
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

  // Je gekürztem Namen die Nutzlastpositionen in Verarbeitungsreihenfolge.
  const indicesByName = new Map<string, number[]>();
  const orderedPayload = payload
    .map((item, index) => ({ item, index }))
    .sort((left, right) => SERVICE_ORDER[left.item.kind] - SERVICE_ORDER[right.item.kind]);

  for (const { item, index } of orderedPayload) {
    const key = shortenEmailDisplayName(
      item.kind === 'message' ? MESSAGE_DISPLAY_NAME : item.displayName,
    );
    const matchingIndices = indicesByName.get(key);
    if (matchingIndices === undefined) indicesByName.set(key, [index]);
    else matchingIndices.push(index);
  }

  const rejectedIndices = new Set<number>();
  const missing: MissingAttachment[] = [];

  for (const entry of rejected) {
    const matchingIndices = indicesByName.get(entry.displayName);
    const index = matchingIndices?.shift();
    const item = index === undefined ? null : (payload[index] ?? null);
    if (index !== undefined) rejectedIndices.add(index);

    missing.push({
      // Bei einem Treffer den vollständigen Namen zeigen; sonst die Abweisung sichtbar erhalten.
      displayName: item === null ? entry.displayName : missingName(item),
      reason: displaySkipReason(entry.reason),
      bytes: entry.bytes,
      isMessage: item === null ? entry.displayName === MESSAGE_DISPLAY_NAME : item.kind === 'message',
    });
  }

  return {
    attached: payload.filter((_, index) => !rejectedIndices.has(index)),
    missing,
  };
};
