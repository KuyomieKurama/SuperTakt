import { afterEach, expect, it, vi } from 'vitest';
import { setConnection } from '../../../src/api/client';
import { collectOpenEntries } from '../../../src/features/export/exportGroupLayout';

afterEach(() => vi.unstubAllGlobals());
it('keeps date and previous-export filters on every page and only requests open entries', async () => {
  setConnection({ baseUrl: 'http://127.0.0.1:1/api/v1', headerName: 'X-Test', secret: 'fixture' });
  const urls: URL[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    urls.push(new URL(input));
    return new Response(JSON.stringify({ data: { items: [], total: 0, nextCursor: urls.length === 1 ? 'next-page' : null } }), { status: 200 });
  }));
  await collectOpenEntries({ fromDay: '2026-09-10', toDay: '2026-09-16', onlyPreviouslyExported: true });
  expect(urls).toHaveLength(2);
  for (const url of urls) {
    expect(url.searchParams.get('exportStatus')).toBe('open');
    expect(url.searchParams.get('fromDay')).toBe('2026-09-10');
    expect(url.searchParams.get('toDay')).toBe('2026-09-16');
    expect(url.searchParams.get('onlyPreviouslyExported')).toBe('true');
    expect(url.searchParams.has('includeNoExport')).toBe(false);
  }
  expect(urls[1]?.searchParams.get('cursor')).toBe('next-page');
});
