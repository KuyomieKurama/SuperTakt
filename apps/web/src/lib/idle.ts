import type { IdleActivity } from '@takt/desktop/shell';
import type { Timestamp } from '../api/types';

export const idleTimestamp = (ms: number): Timestamp => new Date(Math.floor(ms / 1000) * 1000).toISOString().replace('.000Z', 'Z');

/** The native history bridges background throttling and a suspended webview. */
export function idleCandidate(activity: IdleActivity, runningSince: Timestamp, thresholdMinutes: number): { startedAt: Timestamp; returnedAt?: Timestamp } | null {
  if (!activity.supported) return null;
  const earliest = Date.parse(runningSince);
  const threshold = thresholdMinutes * 60_000;
  for (const period of activity.periods) {
    const start = Math.max(earliest, Math.floor(period.startedAtMs / 1000) * 1000);
    const end = Math.floor(period.endedAtMs / 1000) * 1000;
    if (end - start >= threshold) return { startedAt: idleTimestamp(start), returnedAt: idleTimestamp(end) };
  }
  const start = Math.max(earliest, Math.floor(activity.lastInputAtMs / 1000) * 1000);
  return activity.sampledAtMs - start >= threshold ? { startedAt: idleTimestamp(start) } : null;
}

export function idleReturnTime(activity: IdleActivity, startedAt: Timestamp): Timestamp | null {
  const start = Date.parse(startedAt);
  const ended = activity.periods.find(p => p.startedAtMs <= start + 2000 && p.endedAtMs > start + 2000);
  if (ended) return idleTimestamp(ended.endedAtMs);
  return activity.lastInputAtMs > start + 2000 ? idleTimestamp(activity.lastInputAtMs) : null;
}
