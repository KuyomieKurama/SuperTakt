/**
 * Takt — shared harness for use-case tests that drive the real Hono app
 * through `compose()` (T-401c), the same pattern `service-scenario.mjs`
 * already uses for its shape checks: `compose(...)` plus `app.request(...)`
 * gives the identical request pipeline (host, origin, token) without binding
 * a real port.
 *
 * Kept minimal on purpose — only what the use-case tests in this wave need.
 * Fixture values are invented (no real call numbers, names or credentials).
 */
import { compose, type Composition } from '../../src/composition.ts';
import { API_BASE_PATH } from '../../src/config.ts';
import type { Logger } from '../../src/logger.ts';
import type { TokenStorePort } from '../../src/access/token-store.ts';

export const SERVICE_PORT = 17843;
export const UI_ORIGIN = 'http://127.0.0.1:5173';
export const SERVICE_SECRET = `takt_${'0'.repeat(43)}`;

export function memoryTokenStore(): TokenStorePort {
  return {
    read: async () => ({ status: 'absent' }),
    write: async () => {},
    inspectPermissions: async () => ({ checked: false, dirTooPermissive: false, fileTooPermissive: false }),
  };
}

const silentLogger: Logger = { request: () => {}, lifecycle: () => {} };

export interface StartServiceOptions {
  readonly clock?: () => Date;
  readonly logger?: Logger;
  readonly appDataDir?: string;
  readonly timeZone?: string;
}

/** Builds the app via `compose()`, migrated in-memory database, ready for `call()`. */
export async function startService(options: StartServiceOptions = {}): Promise<Composition> {
  const service = compose({
    port: SERVICE_PORT,
    store: memoryTokenStore(),
    sessionSecret: SERVICE_SECRET,
    windowsUser: 'test.benutzer',
    databaseLocation: ':memory:',
    logger: options.logger ?? silentLogger,
    ...(options.clock === undefined ? {} : { clock: options.clock }),
    ...(options.appDataDir === undefined ? {} : { appDataDir: options.appDataDir }),
    ...(options.timeZone === undefined ? {} : { timeZone: options.timeZone }),
  });
  if (service.database === null) throw new Error('fixture: database did not open');
  await service.database.migrations.migrateToLatest();
  return service;
}

export interface CallOptions {
  readonly origin?: string | null;
  readonly token?: string | null;
}

export interface CallResult {
  readonly status: number;
  readonly json: unknown;
  readonly text: string;
}

/** One request through the full chain (host, origin, token) — same shape `service-scenario.mjs` uses. */
export async function call(
  service: Composition,
  method: string,
  path: string,
  body?: unknown,
  options: CallOptions = {},
): Promise<CallResult> {
  const headers: Record<string, string> = { Host: `127.0.0.1:${SERVICE_PORT}` };
  if (options.origin !== null) headers['Origin'] = options.origin ?? UI_ORIGIN;
  if (options.token !== null) headers['X-Takt-Token'] = options.token ?? SERVICE_SECRET;
  const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const response = await service.app.request(`http://127.0.0.1:${SERVICE_PORT}${API_BASE_PATH}${path}`, init);
  const text = await response.text();
  let json: unknown;
  try {
    json = text === '' ? undefined : JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: response.status, json, text };
}
