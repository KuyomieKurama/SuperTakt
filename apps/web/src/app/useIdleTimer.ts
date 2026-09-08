import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { beginIdleSession, getIdleSession, returnFromIdle, type IdleSession } from '../api/idle';
import type { RunningTimerView } from '../api/types';
import { idleCandidate, idleReturnTime } from '../lib/idle';
import { readIdleActivity } from './connection';

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
  const checking = useRef<Promise<IdleSession | null> | null>(null);

  const check = useCallback((): Promise<IdleSession | null> => {
    if (checking.current !== null) return checking.current;
    const work = async () => {
      let pending = await getIdleSession();
      if (!alive.current) return pending;
      setSession(pending);
      setError(null);
      const current = latest.current;
      if (current.blocked || (!current.enabled && pending === null)) return pending;
      const activity = await readIdleActivity();
      if (!alive.current) return pending;
      setSupported(activity?.supported === true);
      if (!activity?.supported) return pending;
      // A suspended process may briefly expose its previous sample on waking.
      if (Math.abs(Date.now() - activity.sampledAtMs) > 10_000) return pending;
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
      if (alive.current) { setSession(pending); setError(null); }
      return pending;
    };
    checking.current = work().catch((cause: unknown) => {
      if (alive.current) setError(errorMessage(cause));
      throw cause;
    }).finally(() => { checking.current = null; });
    return checking.current;
  }, []);

  useEffect(() => {
    alive.current = true;
    const poll = () => { void check().catch(() => undefined); };
    poll();
    const timer = window.setInterval(poll, 2000);
    window.addEventListener('focus', poll);
    return () => { alive.current = false; window.clearInterval(timer); window.removeEventListener('focus', poll); };
  }, [check]);

  const refresh = useCallback(() => {
    latest.current.changed();
    void check().catch(() => undefined);
  }, [check]);
  return { session, supported, error, check, refresh, clear: () => setSession(null) };
}
