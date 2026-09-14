/**
 * Takt — globaler Aufbau für die Neustart-Vorrichtung von
 * `timer-stop-announcement.spec.ts` (T-352).
 *
 * Startet **nur** die Oberfläche (Vite-Entwicklungsserver). Der lokale Dienst
 * startet und startet neu innerhalb von `timer-stop-announcement.spec.ts`
 * selbst — siehe Begründung in `timer-stop-announcement-services.ts`.
 */

import type { FullConfig } from '@playwright/test';

import { startTimerStopAnnouncementWeb, stopTimerStopAnnouncementWeb } from './timer-stop-announcement-services';

export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const web = await startTimerStopAnnouncementWeb();

  return async () => {
    // Dieselbe Begründung wie `global-setup-attachment-persistence.ts`:
    // `stopTimerStopAnnouncementWeb` wartet auf den Prozeßgruppen-Kill — ohne
    // `await` bräche der Node-Prozeß ab, bevor die Signalisierung greift.
    await stopTimerStopAnnouncementWeb(web);
  };
}
