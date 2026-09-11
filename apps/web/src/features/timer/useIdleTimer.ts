import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api/client';
import { beginIdleSession, getIdleSession, returnFromIdle, type IdleSession, type RunningTimerView } from './api';
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
      setSession(pending);
      setError(null);
      const current = latest.current;
      if (current.blocked || (pending === null && (!current.enabled || current.running === null))) return pending;
      const activity = await readIdleActivity();
      if (!alive.current) return pending;
      setSupported(activity?.supported === true);
      if (!activity?.supported) return pending;
      // A suspended process may briefly expose its previous sample on waking.
      if (Math.abs(Date.now() - activity.sampledAtMs) > 10_000) return pending;
      // Native sampling is cheap and local. Contact the service before a transition,
      // rather than fetching unchanged idle state on every native sample.
      const returning = pending !== null && pending.returnedAt === null && idleReturnTime(activity, pending.startedAt) !== null;
      const beginning = pending === null && current.enabled && current.running !== null &&
        idleCandidate(activity, current.running.entry.startedAt, current.thresholdMinutes) !== null;
      if (!synced && (returning || beginning)) pending = await synchronize();
      if (!alive.current) return pending;
      if (pending !== null && pending.returnedAt === null) {
        const at = idleReturnTime(activity, pending.startedAt);
        if (at !== null) {
          pending = await returnFromIdle(pending.id, at);
          current.changed();
        }
      } else if (pending === null && current.enabled && current.running !== null) {
        const candidate = idleCandidate(activity, current.running.entry.startedAt, current.thresholdMinutes);
        if (candidate !== null) {
          pending = await beginIdleSession({ entryId: current.running.entry.id, ...candidate });
          current.changed();
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
