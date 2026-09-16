import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const entry = '/@fs/' + fileURLToPath(new URL('./support/outlook-certificate.html', import.meta.url)).replaceAll('\\', '/').replace(/^\//, '');

// The UI uses the actual shell parser/IPC adapter. Native operations are mocked here;
// Rust tests exercise real NSS imports and real local HTTPS in temporary stores.
for (const scope of ['linux_nss', 'macos_user', 'windows_user']) {
  test(`certificate button confirms the fingerprint before importing (${scope})`, async ({ page }) => {
    await page.addInitScript(scope => {
      const state = { imports: 0, fingerprint: '', facts: {
        supported: true, fingerprint: 'AB12'.repeat(16), subject: 'CN=localhost', issuer: 'CN=localhost',
        validFrom: '2026-01-01T00:00:00Z', validUntil: '2028-01-01T00:00:00Z', validNow: true, validProfile: true,
        installed: false, https: 'ready', trustScope: scope, toolsAvailable: true,
        trustStores: scope === 'linux_nss' ? [{ kind: 'chromium', installed: false }] : [],
      } };
      Object.assign(window, { certificateTest: state, __TAURI_INTERNALS__: {
        invoke: async (command: string, args?: { fingerprint: string }) => {
          if (command === 'takt_outlook_certificate') return state.facts;
          if (command === 'takt_trust_outlook_certificate') {
            state.imports += 1;
            state.fingerprint = args?.fingerprint ?? '';
            state.facts.installed = true;
            state.facts.trustStores.forEach(store => { store.installed = true; });
            return state.facts;
          }
          throw new Error('Unexpected command: ' + command);
        },
      } });
    }, scope);
    await page.goto(entry);
    await page.getByRole('button', { name: 'Zertifikat prüfen und vertrauen …' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Zertifikat vertrauen', exact: true })).toBeDisabled();
    if (scope === 'linux_nss') await expect(dialog).toContainText('Browser-Zertifikatsspeichern');
    if (scope === 'macos_user') await expect(dialog).toContainText('Benutzerschlüsselbund');
    expect(await page.evaluate(() => (window as unknown as { certificateTest: { imports: number } }).certificateTest.imports)).toBe(0);
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'Zertifikat vertrauen', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Zertifikat prüfen und vertrauen …' })).toHaveCount(0);
    expect(await page.evaluate(() => {
      const { imports, fingerprint } = (window as unknown as { certificateTest: { imports: number; fingerprint: string } }).certificateTest;
      return { imports, fingerprint };
    })).toEqual({ imports: 1, fingerprint: 'AB12'.repeat(16) });
    await page.getByRole('button', { name: 'Erneut prüfen' }).click();
    await expect(page.getByRole('button', { name: 'Zertifikat prüfen und vertrauen …' })).toHaveCount(0);
  });
}
