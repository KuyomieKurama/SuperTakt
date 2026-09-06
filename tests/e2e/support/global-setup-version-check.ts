/**
 * Takt — globaler Aufbau für die Versionsprüfung (T-142).
 *
 * Startet **nur** die Oberfläche (Vite-Entwicklungsserver). Der lokale Dienst
 * und die GitHub-Releases-Attrappe starten **nicht** hier, sondern in
 * `version-check-live.spec.ts` selbst (`test.beforeAll`/`test.afterAll`):
 * `TP-VER-11`/`-12` verlangen einen echten Neustart des Dienstes **innerhalb**
 * eines Testfalls, und `globalSetup` läuft als einmaliger Schritt vor jedem
 * Worker — ein Objekt von dort ist im Testprozess nicht mehr greifbar, ein
 * Neustart also nicht steuerbar. Die Oberfläche braucht dagegen keinen
 * Neustart: Sie liest bei jedem `page.reload()` neu vom Dienst, welcher Port
 * währenddessen dahinter läuft, ist ihr gleich.
 */

import type { FullConfig } from '@playwright/test';

import { startVersionCheckWeb, stopVersionCheckWeb } from './version-check-services';

export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const web = await startVersionCheckWeb();

  return async () => {
    stopVersionCheckWeb(web);
  };
}
