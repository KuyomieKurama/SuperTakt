/**
 * Takt — `app.onError` (T-394): a thrown error is never explained to the outside, and the log
 * line it writes carries only the class name and, when it looks like one of our own error codes,
 * that code — never `message`, `stack` or `cause`. `JSON.parse` quotes its input back, `fs`
 * errors name full paths, and this log line reaches the system journal — a marker string chosen
 * by the fault below must not survive into it.
 *
 * Driven through `compose()` + `app.request()` (no port mocked) so the assertion is against the
 * real `app.onError` registered in `app.ts`, not a reimplementation of it.
 */
import { describe, expect, it } from 'vitest';
import { call, startService } from '../support/service.ts';
import { recordLogs } from '../support/record-logs.ts';

const MARKER = 'MARKER-6f2e9c-do-not-leak-this-sentence';

describe('app.onError scrubs the thrown error before it reaches the log', () => {
  it('a fault carrying a distinctive message never appears in the resulting log line', async () => {
    const { logger, lines } = recordLogs();
    const service = await startService({ logger });
    try {
      if (service.context === null) throw new Error('fixture: no context');
      // A deliberate fault at a real boundary the route calls synchronously and unguarded
      // (`loadSettings` → `context.system.databaseFilesTooPermissive()`), not a reimplementation
      // of `app.onError` — the same technique the T-388 report used for its own gegenprobe.
      service.context.system.databaseFilesTooPermissive = () => {
        throw new Error(MARKER);
      };

      const response = await call(service, 'GET', '/settings');
      expect(response.status).toBe(500);
      expect(response.text).not.toContain(MARKER);

      const errorLines = lines.filter((line) => line.level === 'error');
      expect(errorLines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(JSON.stringify(line)).not.toContain(MARKER);
      }
      expect(errorLines.some((line) => (line.reason ?? '').includes('internal_error kind=error'))).toBe(true);
    } finally {
      service.database?.close();
    }
  });
});
