import { err, ok, taktError, type Timestamp, type TodoId } from './kernel.ts';

/** A-24: eine Pause erzeugt keine Buchung; alle Abschnitte sind disjunkt. */
export interface IdleAllocation {
  readonly todoId: TodoId | null;
  readonly seconds: number;
  readonly note: string;
}

export function planIdleAllocation(startedAt: Timestamp, returnedAt: Timestamp, allocations: readonly IdleAllocation[]) {
  const start = Date.parse(startedAt);
  const end = Date.parse(returnedAt);
  const seconds = Math.floor((end - start) / 1000);
  if (!Number.isFinite(start) || !Number.isFinite(end) || seconds < 1 ||
      allocations.length < 1 || allocations.length > 50 ||
      allocations.some(part => !Number.isSafeInteger(part.seconds) || part.seconds < 1) ||
      allocations.reduce((sum, part) => sum + part.seconds, 0) !== seconds) {
    return err(taktError('validation_error', 'Teilen Sie die gesamte inaktive Zeit genau einmal auf. Alle Abschnitte müssen mindestens eine Sekunde dauern.'));
  }
  let cursor = start;
  const segments = allocations.map((part, index) => {
    const from = cursor;
    cursor = index === allocations.length - 1 ? end : cursor + part.seconds * 1000;
    return { ...part, startedAt: new Date(from).toISOString().replace('.000Z', 'Z') as Timestamp, endedAt: new Date(cursor).toISOString().replace('.000Z', 'Z') as Timestamp };
  });
  return ok(segments);
}
