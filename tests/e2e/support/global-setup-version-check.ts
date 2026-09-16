/** Der Test startet und beendet Dienst und GitHub-Attrappe selbst, damit er echte Dienstneustarts auslösen kann. Hier startet nur Vite. */

import type { FullConfig } from '@playwright/test';

import { startVersionCheckWeb, stopVersionCheckWeb } from './version-check-services';

export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const web = await startVersionCheckWeb();

  return async () => {
    // T-345: `stopVersionCheckWeb` wartet jetzt auf den Prozeßgruppen-Kill
    // (derselbe Waisenfund wie in `services.ts`) — ohne `await` bräche der
    // Node-Prozeß ab, bevor die Signalisierung greift.
    await stopVersionCheckWeb(web);
  };
}
