/**
 * Takt — A-28.2, `ui_language` through the real HTTP route (T-401b).
 *
 * `packages/storage/test/migration-0029-interface-preferences.test.ts` already measures the
 * column and its CHECK constraint directly in SQL. This file measures the door in front of it:
 * `GET /settings` and `PATCH /settings` through `compose()` + `app.request()` (no port mocked),
 * so it also exercises the zod schema in `features/settings/routes.ts` and the mapper in
 * `packages/storage/src/sqlite/mappers.ts` that turns the stored column back into `uiLanguage`.
 */
import { describe, expect, it } from 'vitest';
import { call, startService } from '../support/service.ts';

interface SettingsBody {
  readonly data: {
    readonly settings: { readonly uiLanguage: string; readonly roundingMode: string };
  };
}

interface UpdateSettingsBody {
  readonly data: { readonly uiLanguage: string; readonly roundingMode: string };
}

describe('A-28.2 — GET/PATCH /settings, uiLanguage', () => {
  it('starts at the German default', async () => {
    const service = await startService();
    try {
      const response = await call(service, 'GET', '/settings');
      expect(response.status, response.text).toBe(200);
      expect((response.json as SettingsBody).data.settings.uiLanguage).toBe('de');
    } finally {
      service.database?.close();
    }
  });

  it('PATCH with uiLanguage: "en" persists, and a later GET on the same service still answers "en"', async () => {
    const service = await startService();
    try {
      const patched = await call(service, 'PATCH', '/settings', { uiLanguage: 'en' });
      expect(patched.status, patched.text).toBe(200);
      expect((patched.json as UpdateSettingsBody).data.uiLanguage).toBe('en');

      const reread = await call(service, 'GET', '/settings');
      expect((reread.json as SettingsBody).data.settings.uiLanguage).toBe('en');
    } finally {
      service.database?.close();
    }
  });

  it('a value outside {de, en} is rejected with 422 and changes nothing', async () => {
    const service = await startService();
    try {
      const rejected = await call(service, 'PATCH', '/settings', { uiLanguage: 'fr' });
      expect(rejected.status, rejected.text).toBe(422);

      const stillDefault = await call(service, 'GET', '/settings');
      expect((stillDefault.json as SettingsBody).data.settings.uiLanguage).toBe('de');
    } finally {
      service.database?.close();
    }
  });

  it('an omitted uiLanguage field leaves the stored value untouched (unset means "unchanged", not "reset")', async () => {
    const service = await startService();
    try {
      expect((await call(service, 'PATCH', '/settings', { uiLanguage: 'en' })).status).toBe(200);

      // A PATCH touching an unrelated field carries no uiLanguage at all.
      const unrelated = await call(service, 'PATCH', '/settings', { roundingMode: 'up' });
      expect(unrelated.status, unrelated.text).toBe(200);
      expect((unrelated.json as UpdateSettingsBody).data.uiLanguage).toBe('en');
    } finally {
      service.database?.close();
    }
  });
});
