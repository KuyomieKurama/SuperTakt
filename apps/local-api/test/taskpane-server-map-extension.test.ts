/**
 * Takt — A-28.11 / E-125 point 2: the task pane's static file server never ships a `.map` file,
 * even when one exists on disk (source maps of the add-in are never delivered). `CONTENT_TYPES`
 * in `taskpane/server.ts` has no `.map` entry, so the positive list itself falls through to 403 —
 * the same path an unlisted extension like `.pem` already takes, measured here for `.map`
 * specifically (T-401c).
 *
 * Driven against the REAL HTTPS server (`startTaskpaneServer`), not a reimplementation of its
 * routing.
 */
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { startTaskpaneServer, type TaskpaneServer } from '../src/taskpane/server.ts';

const PORT = 18973;
const quietLogger = { lifecycle: () => {}, request: () => {} };

function get(path: string): Promise<{ readonly status: number; readonly body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { hostname: '127.0.0.1', port: PORT, path, method: 'GET', rejectUnauthorized: false },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

describe('A-28.11 — the task pane server answers .map with 403, even when the file exists', () => {
  let workDir: string | null = null;
  let server: TaskpaneServer | null = null;

  afterEach(async () => {
    server?.close();
    server = null;
    if (workDir !== null) await rm(workDir, { recursive: true, force: true });
    workDir = null;
  });

  it('an existing app.js.map is refused with 403, while the neighbouring .js file is served normally', async () => {
    workDir = await mkdtemp(join(tmpdir(), 'takt-taskpane-map-'));
    const appDataDir = join(workDir, 'appdata');
    const root = join(workDir, 'dist');
    await mkdir(appDataDir, { recursive: true, mode: 0o700 });
    await mkdir(root, { recursive: true });
    await writeFile(join(root, 'index.html'), '<!doctype html><title>Aufgabenbereich</title>');
    await writeFile(join(root, 'app.js'), 'export const a = 1;\n');
    await writeFile(join(root, 'app.js.map'), '{"version":3,"sources":[],"mappings":""}');

    server = await startTaskpaneServer({ appDataDir, port: PORT, logger: quietLogger, root });
    expect(server).not.toBeNull();

    const mapResponse = await get('/app.js.map');
    expect(mapResponse.status).toBe(403);
    expect(mapResponse.body).not.toContain('sources');

    const jsResponse = await get('/app.js');
    expect(jsResponse.status).toBe(200);
    expect(jsResponse.body).toContain('export const a = 1;');
  });
});
