/**
 * Takt — globaler Aufbau für TP-ANH-10 Stufe 2 (T-150).
 *
 * Startet **nur** die Oberfläche (Vite-Entwicklungsserver). Der lokale Dienst
 * startet und startet neu innerhalb von `attachment-persistence-live.spec.ts`
 * selbst — siehe Begründung in `attachment-persistence-services.ts`.
 */

import type { FullConfig } from '@playwright/test';

import { startAttachmentPersistenceWeb, stopAttachmentPersistenceWeb } from './attachment-persistence-services';

export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const web = await startAttachmentPersistenceWeb();

  return async () => {
    // T-345: `stopAttachmentPersistenceWeb` wartet jetzt auf den
    // Prozeßgruppen-Kill (derselbe Waisenfund wie in `services.ts` und
    // `version-check-services.ts`) — ohne `await` bräche der Node-Prozeß ab,
    // bevor die Signalisierung greift.
    await stopAttachmentPersistenceWeb(web);
  };
}
