import { afterEach, describe, expect, it, vi } from 'vitest';

import { readHost } from '../../src/office/host.ts';

describe('Outlook host diagnostics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports a missing Office.js host separately', async () => {
    vi.stubGlobal('Office', undefined);

    await expect(readHost(1)).resolves.toEqual({ kind: 'office_js_unavailable' });
  });

  it('reports an Office host that does not invoke the onReady callback before the deadline', async () => {
    vi.stubGlobal('Office', {
      onReady: () => new Promise<void>(() => undefined),
      context: { mailbox: {} },
    });

    await expect(readHost(5)).resolves.toEqual({ kind: 'office_not_ready' });
  });

  it('uses the onReady callback and does not depend on the returned promise resolving', async () => {
    vi.stubGlobal('Office', {
      onReady: (callback: () => void) => {
        callback();
        return new Promise<void>(() => undefined);
      },
      context: { mailbox: {} },
    });

    await expect(readHost(20)).resolves.toEqual({ kind: 'no_item' });
  });
});
