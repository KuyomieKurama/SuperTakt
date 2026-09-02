/**
 * Takt — globaler Aufbau für den gesamten End-zu-Ende-Lauf.
 *
 * Läuft genau einmal vor allen Testdateien. Startet den echten lokalen Dienst
 * und die echte Oberfläche (siehe `services.ts`) und gibt eine Abbaufunktion
 * zurück, die Playwright nach dem letzten Test aufruft.
 */

import type { FullConfig } from '@playwright/test';

import { startServices, stopServices, type RunningServices } from './services';

export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  const services: RunningServices = await startServices();

  return async () => {
    await stopServices(services);
  };
}
