/**
 * Takt — globaler Aufbau für die Bauergebnis-Prüfung von `apps/web` (T-055).
 *
 * Baut `apps/web` einmal (`vite build`, über `pnpm --filter @takt/web build`),
 * startet danach den echten lokalen Dienst aus dem Quelltext — unverändert
 * gegenüber `support/global-setup.ts`, denn der Dienst selbst ist hier nicht
 * der Prüfgegenstand — und liefert das Bauergebnis über `vite preview` aus,
 * nicht über den Entwicklungsserver.
 */

import type { FullConfig } from '@playwright/test';

import { configureExportDirectory, startLocalApi, stopServices } from './services';
import { buildWeb, startWebPreview } from './web-build-services';

export default async function globalSetup(_config: FullConfig): Promise<() => Promise<void>> {
  await buildWeb();

  const localApi = await startLocalApi();
  await configureExportDirectory();
  const web = await startWebPreview();

  // `stopServices` erwartet `{ localApi, web }` (dieselbe Form wie beim
  // Entwicklungsserver) und beendet beide gleich — ob `web` `vite` oder
  // `vite preview` ist, spielt für das Beenden keine Rolle.
  return async () => {
    await stopServices({ localApi, web });
  };
}
