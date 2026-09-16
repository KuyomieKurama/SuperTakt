import { useEffect, useState } from 'react';
import { normalizeVersion } from '@takt/domain';
import { readInstalledVersion } from '../../app/connection';
import { foreignTextFrom } from '../../lib/foreign';
import type { ForeignText } from '../../api/types';
import { getVersionCheck } from './api';

interface VersionFacts {
  readonly installed: string | null;
  readonly latest: ForeignText | null;
}

const STARTUP_WINDOW_MS = 60_000;
const STARTUP_POLL_MS = 5_000;
const UNKNOWN_POLL_MS = 60_000;
const KNOWN_POLL_MS = 5 * 60_000;

/** Liest ausschließlich den lokalen Cache; der Dienst taktet GitHub selbst. */
export function useVersionFacts(): VersionFacts | null {
  const [facts, setFacts] = useState<VersionFacts | null>(null);

  useEffect(() => {
    const startedAt = Date.now();
    let stopped = false;
    let inFlight = false;
    let lastReadAt = -Infinity;
    let known = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (stopped) return;
      clearTimeout(timer);
      const delay = known ? KNOWN_POLL_MS
        : Date.now() - startedAt < STARTUP_WINDOW_MS ? STARTUP_POLL_MS : UNKNOWN_POLL_MS;
      timer = setTimeout(() => { void read(); }, delay);
    };

    const read = async () => {
      if (stopped || inFlight) return;
      if (document.visibilityState === 'hidden') {
        schedule();
        return;
      }
      inFlight = true;
      lastReadAt = Date.now();
      try {
        const [installed, response] = await Promise.all([readInstalledVersion(), getVersionCheck()]);
        if (stopped) return;
        const latest = normalizeVersion(response.latestVersion);
        known = latest !== null;
        setFacts(previous => ({
          installed,
          // Ein kurzzeitig nicht erreichbarer oder neu gestarteter Dienst
          // macht eine bereits bekannte Veröffentlichung nicht ungeschehen.
          latest: latest === null ? previous?.latest ?? null : foreignTextFrom(latest),
        }));
      } catch {
        // Offline ist kein Bedienfehler. Bekannte Daten bleiben sichtbar.
        known = false;
      } finally {
        inFlight = false;
        schedule();
      }
    };

    const resume = () => {
      if (document.visibilityState === 'hidden' || Date.now() - lastReadAt < STARTUP_POLL_MS) return;
      void read();
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    void read();
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
    };
  }, []);

  return facts;
}
