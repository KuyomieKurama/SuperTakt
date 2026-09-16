import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api/client';
import { beginIdleSession, getIdleSession, getRunningTimer, returnFromIdle, type IdleSession, type RunningTimerView } from './api';
import { idleCandidate, idleReturnTime } from './idle';
import { readIdleActivity } from '../../app/connection';

const SERVER_SYNC_MS = 60_000;

export function useIdleTimer(options: {
  running: RunningTimerView | null; enabled: boolean; thresholdMinutes: number;
  blocked: boolean; changed: () => void;
}) {
  const latest = useRef(options);
  latest.current = options;
  const [session, setSession] = useState<IdleSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const alive = useRef(true);
  const cached = useRef<{ session: IdleSession | null; syncedAt: number } | null>(null);
  const retryAt = useRef(0);
  const checking = useRef<Promise<IdleSession | null> | null>(null);

  const check = useCallback(function checkNow(forceSync = true): Promise<IdleSession | null> {
    if (checking.current !== null) {
      // An explicit action must see fresh state, even if a local check is in flight.
      return forceSync ? checking.current.then(() => checkNow(true)) : checking.current;
    }
    if (!forceSync && Date.now() < retryAt.current) return Promise.resolve(cached.current?.session ?? null);
    const work = async () => {
      let synced = false;
      const synchronize = async () => {
        const pending = await getIdleSession();
        cached.current = { session: pending, syncedAt: Date.now() };
        retryAt.current = 0;
        synced = true;
        return pending;
      };
      let pending = forceSync || cached.current === null || Date.now() - cached.current.syncedAt >= SERVER_SYNC_MS
        ? await synchronize() : cached.current.session;
      if (!alive.current) return pending;
      setError(null);
      const current = latest.current;
      const activity = await readIdleActivity({ enabled: current.enabled && !current.blocked && (current.running !== null || pending !== null), thresholdMinutes: current.thresholdMinutes });
      if (!alive.current) return pending;
      setSupported(activity?.supported === true);
      if (!current.blocked && activity?.supported && Math.abs(Date.now() - activity.sampledAtMs) <= 10_000) {
        let running = current.running;
        const candidateFor = () => running === null ? null : idleCandidate(activity,
          pending?.returnedAt && pending.returnedAt > running.entry.startedAt ? pending.returnedAt : running.entry.startedAt,
          current.thresholdMinutes);
        const canReturn = pending !== null && pending.returnedAt === null && idleReturnTime(activity, pending.startedAt) !== null;
        const canBegin = (pending === null || pending.returnedAt !== null) && current.enabled && candidateFor() !== null;
        if (canReturn || canBegin) {
          if (!synced) pending = await synchronize();
          running = await getRunningTimer();
          // Drain native history before publishing one dialog state. Active gaps
          // remain regular timer entries; every absent period is stored separately.
          for (let count = 0; count < 33; count += 1) {
            if (pending !== null && pending.returnedAt === null) {
              const at = idleReturnTime(activity, pending.startedAt);
              if (at === null) break;
              pending = await returnFromIdle(pending.id, at);
            } else {
              const candidate = current.enabled ? candidateFor() : null;
              if (candidate === null || running === null) break;
              pending = await beginIdleSession({ entryId: running.entry.id, ...candidate });
            }
            current.changed();
            running = await getRunningTimer();
          }
        }
      }
      cached.current = { session: pending, syncedAt: cached.current?.syncedAt ?? Date.now() };
      if (alive.current) { setSession(pending); setError(null); }
      return pending;
    };
    checking.current = work().catch((cause: unknown) => {
      cached.current = null;
      retryAt.current = Date.now() + SERVER_SYNC_MS;
      if (alive.current) setError(errorMessage(cause));
      throw cause;
    }).finally(() => { checking.current = null; });
    return checking.current;
  }, []);

  useEffect(() => {
    alive.current = true;
    const poll = () => { void check(false).catch(() => undefined); };
    const focus = () => { void check().catch(() => undefined); };
    poll();
    const timer = window.setInterval(poll, 2000);
    window.addEventListener('focus', focus);
    return () => { alive.current = false; window.clearInterval(timer); window.removeEventListener('focus', focus); };
  }, [check]);

  const refresh = useCallback(() => {
    latest.current.changed();
    void check().catch(() => undefined);
  }, [check]);
  return { session, supported, error, check, refresh, clear: () => { cached.current = null; setSession(null); } };
}
