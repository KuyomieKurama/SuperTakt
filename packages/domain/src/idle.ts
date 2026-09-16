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


/** Allocate only the absent intervals; active gaps keep their original timer entries. */
export function planIdlePeriods(periods: readonly { startedAt: Timestamp; returnedAt: Timestamp | null }[], allocations: readonly IdleAllocation[]) {
  let total = 0;
  let previousEnd = -Infinity;
  for (const period of periods) {
    const start = Date.parse(period.startedAt);
    const end = period.returnedAt === null ? NaN : Date.parse(period.returnedAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < previousEnd || end <= start) {
      return err(taktError('validation_error', 'Die inaktiven Abschnitte sind unvollständig oder überschneiden sich.'));
    }
    total += (end - start) / 1000;
    previousEnd = end;
  }
  if (!Number.isSafeInteger(total) || total < 1 || total * 1000 > 8.64e15 || periods.length > 128) {
    return err(taktError('validation_error', 'Die inaktiven Abschnitte sind ungültig.'));
  }
  const validated = planIdleAllocation('1970-01-01T00:00:00Z' as Timestamp,
    new Date(total * 1000).toISOString().replace('.000Z', 'Z') as Timestamp, allocations);
  if (!validated.ok) return validated;
  const result: typeof validated.value = [];
  let index = 0;
  let left = allocations[0]!.seconds;
  for (const period of periods) {
    let cursor = Date.parse(period.startedAt);
    const end = Date.parse(period.returnedAt!);
    while (cursor < end) {
      const seconds = Math.min(left, (end - cursor) / 1000);
      result.push({ ...allocations[index]!, seconds,
        startedAt: new Date(cursor).toISOString().replace('.000Z', 'Z') as Timestamp,
        endedAt: new Date(cursor + seconds * 1000).toISOString().replace('.000Z', 'Z') as Timestamp });
      cursor += seconds * 1000;
      left -= seconds;
      if (left === 0 && index + 1 < allocations.length) left = allocations[++index]!.seconds;
    }
  }
  return ok(result);
}
